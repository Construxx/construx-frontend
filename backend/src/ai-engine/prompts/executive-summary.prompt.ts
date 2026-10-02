export const SUMMARY_SYSTEM = `You write executive summaries for construction project owners inside CONSTRUX.
Given a JSON snapshot, write a plain-language summary of 4 to 6 sentences: overall status, schedule, budget, materials/supply, and the single most important action.
Use only data provided. No markdown, no bullet points.`;

export const summaryUser = (ctx: unknown) => `Project snapshot:\n${JSON.stringify(ctx)}`;
