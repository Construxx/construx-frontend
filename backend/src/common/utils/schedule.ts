export function scheduleStatus(start: Date | null, end: Date | null, progress: number) {
  if (!start || !end || end <= start) return { status: 'UNKNOWN' as const, expectedProgress: null as number | null, variance: null as number | null };
  const elapsed = (Date.now() - start.getTime()) / (end.getTime() - start.getTime());
  const expected = Math.round(Math.min(Math.max(elapsed, 0), 1) * 100);
  const variance = progress - expected;
  return { status: variance < -10 ? ('BEHIND' as const) : ('ON_TRACK' as const), expectedProgress: expected, variance };
}
