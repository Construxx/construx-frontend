export function validateEnv(config: Record<string, unknown>) {
  for (const key of ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!config[key]) throw new Error(`Missing required env var: ${key} (see .env.example)`);
  }
  if (String(config.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters (use a cryptographically random secret).');
  }
  if (String(config.JWT_REFRESH_SECRET).length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters (use a separate random secret).');
  }
  if (config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
  }
  const origins = String(config.FRONTEND_URL ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.includes('*')) throw new Error('FRONTEND_URL cannot contain the wildcard origin.');
  const sameSite = String(config.AUTH_COOKIE_SAME_SITE ?? 'lax');
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    throw new Error('AUTH_COOKIE_SAME_SITE must be one of: lax, strict, none.');
  }
  if (sameSite === 'none' && config.NODE_ENV !== 'production') {
    throw new Error('AUTH_COOKIE_SAME_SITE=none requires NODE_ENV=production and HTTPS.');
  }
  return config;
}
