import { compressImage } from '../offline/db';
import { getIsOnline, queueAiAnalysis } from '../offline/sync';
import {
  PhotoAnalysisRequest,
  PhotoAnalysisResponse,
  PhotoAnalysisResult,
  BoQImportRequest,
  BoQImportResponse,
  BoQImportResult,
} from './schemas';
import { getScriptedPhotoAnalysis, getScriptedBoQImport } from './fallbacks';

export interface PhotoAnalysisCallParams {
  imageFileOrBase64: File | Blob | string;
  mimeType?: string;
  context?: {
    projectId?: string;
    projectName?: string;
    taskName?: string;
    lastRecordedProgress?: number;
    projectPhase?: string;
    floorLevel?: string;
  };
}

export interface BoQImportCallParams {
  format: 'rows' | 'csv_text' | 'pdf_base64';
  rows?: Array<Record<string, any>>;
  csvText?: string;
  pdfBase64?: string;
  fileName?: string;
}

/**
 * Converts a Blob or File into a pure base64 string (without the data:image/... prefix).
 */
export async function fileOrBlobToBase64(blob: Blob): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve({ base64, dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Feature A: Site Photo Analysis client helper
 * Handles client-side compression (<=1280px JPEG), network status checks, offline outbox queuing,
 * and calling the /api/ai/photo-analysis route with graceful fallback.
 */
export async function analyzeSitePhoto(
  params: PhotoAnalysisCallParams
): Promise<PhotoAnalysisResponse> {
  const startTime = Date.now();
  const isOnline = getIsOnline();

  // 1. Process and compress image if a File or Blob is provided
  let pureBase64 = '';
  let mimeType = params.mimeType || 'image/jpeg';
  let compressedBytes = 0;

  if (typeof params.imageFileOrBase64 === 'string') {
    if (params.imageFileOrBase64.startsWith('data:')) {
      const parts = params.imageFileOrBase64.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      pureBase64 = parts[1] || '';
    } else {
      pureBase64 = params.imageFileOrBase64;
    }
    compressedBytes = Math.round((pureBase64.length * 3) / 4);
  } else {
    // Compress to max 1280px JPEG ~0.7
    const compressed = await compressImage(params.imageFileOrBase64, 1280, 1280, 0.7);
    const { base64 } = await fileOrBlobToBase64(compressed.blob);
    pureBase64 = base64;
    mimeType = 'image/jpeg';
    compressedBytes = compressed.blob.size;
  }

  // Reject inputs over size limits (image <= 5MB)
  if (compressedBytes > 5 * 1024 * 1024) {
    throw new Error('Image exceeds 5MB size limit after compression. Please upload a smaller photo.');
  }

  const inputsUsed = [
    `Image payload: ${(compressedBytes / 1024).toFixed(1)} KB (compressed JPEG <= 1280px)`,
    params.context?.taskName ? `Task context: "${params.context.taskName}"` : 'Task context: General Site Inspection',
    params.context?.lastRecordedProgress !== undefined
      ? `Reported progress benchmark: ${params.context.lastRecordedProgress}%`
      : 'Reported progress benchmark: Baseline',
    params.context?.projectPhase ? `Phase: ${params.context.projectPhase}` : 'Phase: Construction',
  ];

  // 2. Offline handling: queue in outbox and immediately return preliminary scripted result
  if (!isOnline) {
    if (params.context?.projectId) {
      await queueAiAnalysis(
        params.context.projectId,
        `Site photo analysis for ${params.context.taskName || 'field observation'}`,
        'site_photo_analysis'
      );
    }

    const scripted = getScriptedPhotoAnalysis(params.context);
    return {
      source: 'fallback',
      model: 'Preliminary (offline)',
      latencyMs: Date.now() - startTime,
      result: scripted,
      why: {
        inputsUsed: [...inputsUsed, 'Device offline: Enqueued in outbox for live rescan on reconnect.'],
      },
    };
  }

  // 3. Online: Call /api/ai/photo-analysis
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s client timeout (server has 10s)

    const payload: PhotoAnalysisRequest = {
      imageBase64: pureBase64,
      mimeType,
      context: params.context,
    };

    const res = await fetch('/api/ai/photo-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      if (errJson?.result) {
        return errJson as PhotoAnalysisResponse;
      }
      throw new Error(`Server returned ${res.status}`);
    }

    const data: PhotoAnalysisResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('Live photo analysis failed, falling back to local supervisory heuristics:', err);
    const scripted = getScriptedPhotoAnalysis(params.context);
    return {
      source: 'fallback',
      model: 'claude-sonnet-5 (fallback)',
      latencyMs: Date.now() - startTime,
      result: scripted,
      why: {
        inputsUsed: [...inputsUsed, 'Live Claude call timed out or failed; deterministic site fallback applied.'],
      },
    };
  }
}

/**
 * Feature B: BoQ Import client helper
 * Handles tabular parsing / CSV / PDF sending, offline outbox queuing,
 * and calling the /api/ai/boq-import route with graceful fallback.
 */
export async function importBoQ(
  params: BoQImportCallParams
): Promise<BoQImportResponse> {
  const startTime = Date.now();
  const isOnline = getIsOnline();

  const inputsUsed = [
    `Format: ${params.format.toUpperCase()}`,
    params.fileName ? `Source file: "${params.fileName}"` : 'Source file: Direct entry / Sample',
    params.rows ? `Parsed rows: ${params.rows.length} tabular entries` : 'Raw text stream',
    'Nigerian pricing benchmark: Q3 2026 Lagos Building Materials Index',
  ];

  // 1. Offline handling
  if (!isOnline) {
    await queueAiAnalysis(
      'proj-import-pending',
      `BoQ Import conversion for ${params.fileName || 'sample BoQ'}`,
      'boq_import'
    );

    const scripted = getScriptedBoQImport(params.rows, params.fileName);
    return {
      source: 'fallback',
      model: 'Preliminary (offline)',
      latencyMs: Date.now() - startTime,
      result: scripted,
      why: {
        inputsUsed: [...inputsUsed, 'Device offline: Generated preliminary draft from offline Nigerian schedule.'],
      },
    };
  }

  // 2. Call /api/ai/boq-import
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s client timeout (server has 25s)

    const payload: BoQImportRequest = {
      format: params.format,
      rows: params.rows,
      csvText: params.csvText,
      pdfBase64: params.pdfBase64,
      fileName: params.fileName,
    };

    const res = await fetch('/api/ai/boq-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      if (errJson?.result) {
        return errJson as BoQImportResponse;
      }
      throw new Error(`Server returned ${res.status}`);
    }

    const data: BoQImportResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('Live BoQ import failed, falling back to local Nigerian building schedule:', err);
    const scripted = getScriptedBoQImport(params.rows, params.fileName);
    return {
      source: 'fallback',
      model: 'claude-sonnet-5 (fallback)',
      latencyMs: Date.now() - startTime,
      result: scripted,
      why: {
        inputsUsed: [...inputsUsed, 'Live Claude call timed out or failed; validated Nigerian BoQ fallback applied.'],
      },
    };
  }
}
