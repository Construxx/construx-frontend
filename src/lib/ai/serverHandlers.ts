import Anthropic from '@anthropic-ai/sdk';
import {
  PhotoAnalysisRequestSchema,
  PhotoAnalysisResultSchema,
  PhotoAnalysisResponse,
  BoQImportRequestSchema,
  BoQImportResultSchema,
  BoQImportResponse,
} from './schemas';
import { getScriptedPhotoAnalysis, getScriptedBoQImport } from './fallbacks';

// In-memory rate limiting (per IP, max 30 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return { allowed: true, remaining: 29 };
  }

  if (entry.count >= 30) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: 30 - entry.count };
}

// -------------------------------------------------------------
// Handler: Photo Analysis
// -------------------------------------------------------------
export async function handlePhotoAnalysis(
  body: unknown,
  clientIp = '127.0.0.1'
): Promise<{ status: number; body: PhotoAnalysisResponse | { error: string } }> {
  const startTime = Date.now();

  // 1. Rate Limit Check
  const rl = checkRateLimit(clientIp);
  if (!rl.allowed) {
    return {
      status: 429,
      body: { error: 'Rate limit exceeded (30 requests/min). Please try again shortly.' },
    };
  }

  // 2. Validate Request with Zod
  const parseResult = PhotoAnalysisRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return {
      status: 400,
      body: { error: `Invalid request payload: ${parseResult.error.message}` },
    };
  }

  const { imageBase64, mimeType, context } = parseResult.data;

  // 3. Reject oversized payload (> 5MB)
  const approxSizeBytes = Math.round((imageBase64.length * 3) / 4);
  if (approxSizeBytes > 5 * 1024 * 1024) {
    return {
      status: 413,
      body: { error: 'Payload exceeds 5MB size limit.' },
    };
  }

  const inputsUsed = [
    `Image resolution: Compressed JPEG (${(approxSizeBytes / 1024).toFixed(1)} KB)`,
    context?.taskName ? `Task context: "${context.taskName}"` : 'Task context: Field Observation',
    context?.lastRecordedProgress !== undefined ? `Reported progress: ${context.lastRecordedProgress}%` : 'Reported progress: Not specified',
    context?.projectPhase ? `Phase: ${context.projectPhase}` : 'Phase: Construction',
  ];

  // 4. Check for Anthropic API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'MY_ANTHROPIC_API_KEY') {
    const scripted = getScriptedPhotoAnalysis(context);
    return {
      status: 200,
      body: {
        source: 'fallback',
        model: 'claude-sonnet-5 (fallback)',
        latencyMs: Date.now() - startTime,
        result: scripted,
        why: {
          inputsUsed: [...inputsUsed, 'ANTHROPIC_API_KEY not configured; verified deterministic site fallback applied.'],
        },
      },
    };
  }

  // 5. Call Anthropic Messages API with 10s Timeout
  try {
    const anthropic = new Anthropic({ apiKey });
    const prompt = `You are a senior construction site supervisor inspecting ONE jobsite photo for CONSTRUX OS.
Context:
- Project: ${context?.projectName || 'Victoria Heights'}
- Phase: ${context?.projectPhase || 'Superstructure & MEP'}
- Active Task: ${context?.taskName || 'Site Progress Inspection'}
- Last Recorded Progress: ${context?.lastRecordedProgress ?? 40}%

INSTRUCTIONS:
1. Act as a rigorous, professional construction site supervisor reviewing ONE photo.
2. Return ONLY a single valid JSON object matching this exact schema:
{
  "workVisible": "Precise description of structural, MEP, or civil works visible",
  "estimatedProgressPercent": number (integer 0 to 100 representing rough visual physical completion),
  "progressRationale": "Concise reasoning for the estimate and comparison with scheduled task",
  "safetyFlags": [
    {
      "type": "no_helmet" | "no_vest" | "unsafe_scaffold" | "open_edge" | "debris" | "other",
      "severity": "low" | "medium" | "high",
      "note": "Description of safety concern or compliance check"
    }
  ],
  "qualityObservations": [
    "String observations about workmanship, containment, alignments, or tolerances"
  ],
  "confidence": "low" | "medium" | "high",
  "limitations": "Specific limitations of this photo angle or occlusion"
}

3. CRITICAL RULES:
- If the photo is unclear, say so in 'limitations'.
- Do NOT invent or hallucinate details you cannot see.
- Treat estimatedProgressPercent as a rough visual estimate.
- Return ONLY the JSON object. Do not wrap in markdown or introductory text.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s strict timeout

    // Model: "claude-sonnet-5" as specified, with graceful model fallback if needed
    const model = 'claude-sonnet-5';

    let rawText = '';
    try {
      const response = await anthropic.messages.create(
        {
          model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: (mimeType as any) || 'image/jpeg',
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        rawText = contentBlock.text;
      }
    } catch (apiErr: any) {
      clearTimeout(timeoutId);
      console.warn('Anthropic API call failed, falling back:', apiErr?.message || apiErr);
      const scripted = getScriptedPhotoAnalysis(context);
      return {
        status: 200,
        body: {
          source: 'fallback',
          model: 'claude-sonnet-5 (fallback)',
          latencyMs: Date.now() - startTime,
          result: scripted,
          why: {
            inputsUsed: [...inputsUsed, `Live API error: ${apiErr?.message || 'Timeout / Network'}; fallback applied.`],
          },
        },
      };
    }

    // Clean JSON response (strip markdown fences if present)
    const cleanedJson = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    // Validate with Zod
    const validated = PhotoAnalysisResultSchema.safeParse(parsedData);
    if (!validated.success) {
      console.warn('Zod validation of Claude photo analysis failed:', validated.error.message);
      const scripted = getScriptedPhotoAnalysis(context);
      return {
        status: 200,
        body: {
          source: 'fallback',
          model: 'claude-sonnet-5 (fallback)',
          latencyMs: Date.now() - startTime,
          result: scripted,
          why: {
            inputsUsed: [...inputsUsed, 'Claude response failed schema validation; scripted fallback applied.'],
          },
        },
      };
    }

    return {
      status: 200,
      body: {
        source: 'live',
        model: 'claude-sonnet-5',
        latencyMs: Date.now() - startTime,
        result: validated.data,
        why: {
          inputsUsed: [...inputsUsed, 'Vision inference processed by Claude Sonnet.'],
        },
      },
    };
  } catch (err: any) {
    console.error('Photo analysis error:', err);
    const scripted = getScriptedPhotoAnalysis(context);
    return {
      status: 200,
      body: {
        source: 'fallback',
        model: 'claude-sonnet-5 (fallback)',
        latencyMs: Date.now() - startTime,
        result: scripted,
        why: {
          inputsUsed: [...inputsUsed, `Exception handled: ${err?.message || 'Unknown'}; fallback applied.`],
        },
      },
    };
  }
}

// -------------------------------------------------------------
// Handler: BoQ Import
// -------------------------------------------------------------
export async function handleBoQImport(
  body: unknown,
  clientIp = '127.0.0.1'
): Promise<{ status: number; body: BoQImportResponse | { error: string } }> {
  const startTime = Date.now();

  // 1. Rate Limit Check
  const rl = checkRateLimit(clientIp);
  if (!rl.allowed) {
    return {
      status: 429,
      body: { error: 'Rate limit exceeded (30 requests/min). Please try again shortly.' },
    };
  }

  // 2. Validate Request with Zod
  const parseResult = BoQImportRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return {
      status: 400,
      body: { error: `Invalid BoQ request payload: ${parseResult.error.message}` },
    };
  }

  const { format, rows, csvText, pdfBase64, fileName } = parseResult.data;

  // 3. Reject oversized payload (> 5MB)
  let payloadBytes = 0;
  if (pdfBase64) {
    payloadBytes = Math.round((pdfBase64.length * 3) / 4);
  } else if (csvText) {
    payloadBytes = Buffer.byteLength(csvText, 'utf8');
  } else if (rows) {
    payloadBytes = Buffer.byteLength(JSON.stringify(rows), 'utf8');
  }

  if (payloadBytes > 5 * 1024 * 1024) {
    return {
      status: 413,
      body: { error: 'BoQ file exceeds 5MB size limit.' },
    };
  }

  const inputsUsed = [
    `Format: ${format.toUpperCase()}`,
    fileName ? `Filename: "${fileName}"` : 'Filename: Sample / In-Memory',
    rows ? `Rows parsed: ${rows.length}` : `Data size: ${(payloadBytes / 1024).toFixed(1)} KB`,
    'Rate index: Nigerian Naira (NGN ₦) standard Lagos construction schedule',
  ];

  // 4. Check for Anthropic API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'MY_ANTHROPIC_API_KEY') {
    const scripted = getScriptedBoQImport(rows, fileName);
    return {
      status: 200,
      body: {
        source: 'fallback',
        model: 'claude-sonnet-5 (fallback)',
        latencyMs: Date.now() - startTime,
        result: scripted,
        why: {
          inputsUsed: [...inputsUsed, 'ANTHROPIC_API_KEY not configured; validated Nigerian BoQ fallback applied.'],
        },
      },
    };
  }

  // 5. Call Anthropic Messages API with 25s Timeout
  try {
    const anthropic = new Anthropic({ apiKey });
    const prompt = `You are a Chief Quantity Surveyor & Construction Operations Planner specializing in Nigerian high-rise and commercial construction.
Convert this Bill of Quantities (BoQ) data into a structured project plan for CONSTRUX OS.

Data provided:
${csvText ? `CSV Content:\n${csvText.slice(0, 15000)}` : rows ? `Tabular Rows:\n${JSON.stringify(rows.slice(0, 30))}` : 'PDF Document Attached.'}

INSTRUCTIONS:
1. Extract materials, unit rates in Nigerian Naira (₦), quantities, categories, and recommended supplier types.
2. Formulate realistic sequential construction tasks with dependencies and estimated durations.
3. Formulate key milestones.
4. Flag missing quantities, unit inconsistencies, and suspicious rates in 'warnings' rather than guessing silently.
5. Return ONLY a single valid JSON object matching this exact schema:
{
  "project": {
    "suggestedName": string,
    "type": string,
    "estimatedBudgetNGN": number
  },
  "materials": [
    {
      "name": string,
      "unit": string,
      "quantity": number,
      "unitRateNGN": number,
      "category": string,
      "suggestedSupplierType": string
    }
  ],
  "tasks": [
    {
      "title": string,
      "phase": string,
      "dependsOn": string[],
      "estimatedDurationDays": number,
      "linkedMaterials": string[]
    }
  ],
  "milestones": [
    {
      "title": string,
      "order": number
    }
  ],
  "assumptions": string[],
  "warnings": string[]
}

CRITICAL RULES:
- Return ONLY the JSON object. Do not wrap in markdown or include conversational text.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s strict timeout

    const model = 'claude-sonnet-5';

    let rawText = '';
    try {
      const contentParts: any[] = [];
      if (format === 'pdf_base64' && pdfBase64) {
        contentParts.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64,
          },
        });
      }
      contentParts.push({
        type: 'text',
        text: prompt,
      });

      const response = await anthropic.messages.create(
        {
          model,
          max_tokens: 3000,
          messages: [
            {
              role: 'user',
              content: contentParts,
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        rawText = contentBlock.text;
      }
    } catch (apiErr: any) {
      clearTimeout(timeoutId);
      console.warn('Anthropic BoQ API call failed, falling back:', apiErr?.message || apiErr);
      const scripted = getScriptedBoQImport(rows, fileName);
      return {
        status: 200,
        body: {
          source: 'fallback',
          model: 'claude-sonnet-5 (fallback)',
          latencyMs: Date.now() - startTime,
          result: scripted,
          why: {
            inputsUsed: [...inputsUsed, `Live API error: ${apiErr?.message || 'Timeout / Network'}; fallback applied.`],
          },
        },
      };
    }

    const cleanedJson = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    // Validate with Zod
    const validated = BoQImportResultSchema.safeParse(parsedData);
    if (!validated.success) {
      console.warn('Zod validation of Claude BoQ import failed:', validated.error.message);
      const scripted = getScriptedBoQImport(rows, fileName);
      return {
        status: 200,
        body: {
          source: 'fallback',
          model: 'claude-sonnet-5 (fallback)',
          latencyMs: Date.now() - startTime,
          result: scripted,
          why: {
            inputsUsed: [...inputsUsed, 'Claude response failed schema validation; validated fallback applied.'],
          },
        },
      };
    }

    return {
      status: 200,
      body: {
        source: 'live',
        model: 'claude-sonnet-5',
        latencyMs: Date.now() - startTime,
        result: validated.data,
        why: {
          inputsUsed: [...inputsUsed, 'Bill of Quantities parsed and synthesized by Claude Sonnet.'],
        },
      },
    };
  } catch (err: any) {
    console.error('BoQ import error:', err);
    const scripted = getScriptedBoQImport(rows, fileName);
    return {
      status: 200,
      body: {
        source: 'fallback',
        model: 'claude-sonnet-5 (fallback)',
        latencyMs: Date.now() - startTime,
        result: scripted,
        why: {
          inputsUsed: [...inputsUsed, `Exception handled: ${err?.message || 'Unknown'}; fallback applied.`],
        },
      },
    };
  }
}
