'use client';

/**
 * Tiny fetch wrapper. The browser stores:
 *   - the active tenant slug   in localStorage["tenant"]
 *   - the JWT for that tenant  in localStorage["token"]
 *
 * We pass the slug as `X-Tenant` header (in production this would be a
 * subdomain like tatvantv.app.local; on localhost the header is the practical
 * substitute for browser-driven tenant switching during demos).
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001/api';

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = getTenant();
    const tok = localStorage.getItem('token');
    if (t) h['X-Tenant'] = t;
    if (tok) h['Authorization'] = `Bearer ${tok}`;
  }
  return h;
}

async function handle(r: Response) {
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error(data?.message || `HTTP ${r.status}`);
  return data;
}

export const api = {
  get:    (p: string) => fetch(`${BASE}${p}`, { headers: headers(), cache: 'no-store' }).then(handle),
  post:   (p: string, body: any) => fetch(`${BASE}${p}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
  put:    (p: string, body: any) => fetch(`${BASE}${p}`, { method: 'PUT',  headers: headers(), body: JSON.stringify(body) }).then(handle),
  delete: (p: string) => fetch(`${BASE}${p}`, { method: 'DELETE', headers: headers() }).then(handle),
};

export function setTenant(slug: string) {
  localStorage.setItem('tenant', slug);
  localStorage.removeItem('token'); // any token is bound to a tenant
}
export function getTenant() {
  if (typeof window === 'undefined') return null;
  // Subdomain check: tatvantv.localhost or tatvantv.app.local
  const host = window.location.hostname;
  const parts = host.split('.');
  if (parts.length > 1 && host !== 'localhost' && host !== '127.0.0.1') {
    const sub = parts[0].toLowerCase();
    // Ignore common non-tenant subdomains
    if (!['www', 'app', 'api'].includes(sub)) return sub;
  }
  return localStorage.getItem('tenant');
}
export function setToken(t: string) { localStorage.setItem('token', t); }
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('tenant');
}
