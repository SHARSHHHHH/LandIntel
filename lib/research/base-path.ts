// Unified single-process app: this portal's pages live under /research and
// its API routes under /api/research (physical folder placement handles the
// prefixing now, not a Next.js `basePath`), so no extra prefix is needed
// here any more. Kept as a no-op export so existing `withBasePath()` /
// `${BASE_PATH}...` call sites throughout this portal's code don't need to
// change.
export const BASE_PATH = "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
