import { z } from 'zod';

// ==========================================
// FEATURE A: PHOTO ANALYSIS SCHEMAS
// ==========================================

export const SafetyFlagSchema = z.object({
  type: z.enum(['no_helmet', 'no_vest', 'unsafe_scaffold', 'open_edge', 'debris', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  note: z.string(),
});

export const PhotoAnalysisResultSchema = z.object({
  workVisible: z.string(),
  estimatedProgressPercent: z.number().min(0).max(100),
  progressRationale: z.string(),
  safetyFlags: z.array(SafetyFlagSchema),
  qualityObservations: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
  limitations: z.string(),
});

export const PhotoAnalysisRequestSchema = z.object({
  imageBase64: z.string(),
  mimeType: z.string().default('image/jpeg'),
  context: z.object({
    projectId: z.string().optional(),
    projectName: z.string().optional(),
    taskName: z.string().optional(),
    lastRecordedProgress: z.number().optional(),
    projectPhase: z.string().optional(),
    floorLevel: z.string().optional(),
  }).optional(),
});

export const PhotoAnalysisResponseSchema = z.object({
  source: z.enum(['live', 'fallback']),
  model: z.string(),
  latencyMs: z.number(),
  result: PhotoAnalysisResultSchema,
  why: z.object({
    inputsUsed: z.array(z.string()),
    promptTokensEstimated: z.number().optional(),
  }).optional(),
});

export type SafetyFlag = z.infer<typeof SafetyFlagSchema>;
export type PhotoAnalysisResult = z.infer<typeof PhotoAnalysisResultSchema>;
export type PhotoAnalysisRequest = z.infer<typeof PhotoAnalysisRequestSchema>;
export type PhotoAnalysisResponse = z.infer<typeof PhotoAnalysisResponseSchema>;

// ==========================================
// FEATURE B: BoQ IMPORT SCHEMAS
// ==========================================

export const BoQMaterialItemSchema = z.object({
  name: z.string(),
  unit: z.string(),
  quantity: z.number().nonnegative(),
  unitRateNGN: z.number().nonnegative(),
  category: z.string(),
  suggestedSupplierType: z.string(),
});

export const BoQTaskItemSchema = z.object({
  title: z.string(),
  phase: z.string(),
  dependsOn: z.array(z.string()),
  estimatedDurationDays: z.number().positive(),
  linkedMaterials: z.array(z.string()),
});

export const BoQMilestoneItemSchema = z.object({
  title: z.string(),
  order: z.number().int().positive(),
});

export const BoQImportResultSchema = z.object({
  project: z.object({
    suggestedName: z.string(),
    type: z.string(),
    estimatedBudgetNGN: z.number().nonnegative(),
  }),
  materials: z.array(BoQMaterialItemSchema),
  tasks: z.array(BoQTaskItemSchema),
  milestones: z.array(BoQMilestoneItemSchema),
  assumptions: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const BoQImportRequestSchema = z.object({
  format: z.enum(['rows', 'pdf_base64', 'csv_text']),
  rows: z.array(z.record(z.string(), z.any())).optional(),
  csvText: z.string().optional(),
  pdfBase64: z.string().optional(),
  fileName: z.string().optional(),
});

export const BoQImportResponseSchema = z.object({
  source: z.enum(['live', 'fallback']),
  model: z.string(),
  latencyMs: z.number(),
  result: BoQImportResultSchema,
  why: z.object({
    inputsUsed: z.array(z.string()),
  }).optional(),
});

export type BoQMaterialItem = z.infer<typeof BoQMaterialItemSchema>;
export type BoQTaskItem = z.infer<typeof BoQTaskItemSchema>;
export type BoQMilestoneItem = z.infer<typeof BoQMilestoneItemSchema>;
export type BoQImportResult = z.infer<typeof BoQImportResultSchema>;
export type BoQImportRequest = z.infer<typeof BoQImportRequestSchema>;
export type BoQImportResponse = z.infer<typeof BoQImportResponseSchema>;
