import { env as privateEnv } from '$env/dynamic/private';

export function resolveRuntimeEnv(platformEnv = {}) {
  const processEnv = typeof process !== 'undefined' && process?.env ? process.env : {};

  return {
    ...privateEnv,
    ...processEnv,
    ...(platformEnv || {})
  };
}
