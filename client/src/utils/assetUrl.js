// Uploaded files (avatars) are served by the backend at /uploads/..., at the
// server's origin -- NOT under the /api/v1 prefix axios uses. Derive the
// origin from the same VITE_API_URL and resolve stored relative paths on it.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, '');

export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${ORIGIN}${path}`;
}
