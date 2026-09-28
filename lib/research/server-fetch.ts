import { headers } from 'next/headers';
import { BASE_PATH } from './base-path';

// Server Components cannot fetch relative URLs (native fetch requires an
// absolute URL). Resolve them against the current request host instead.
// Also prepend the app's basePath, since this app's own API routes are only
// reachable under it once `basePath` is set in next.config.js.
export function absoluteUrl(path: string): string {
  const h = headers();
  const host = h.get('host') ?? 'localhost:3000';
  const protocol = h.get('x-forwarded-proto') ?? 'http';
  return `${protocol}://${host}${BASE_PATH}${path}`;
}
