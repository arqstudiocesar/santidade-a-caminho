/**
 * Cache local por usuário
 * Garante que cada usuário tenha seus próprios dados no localStorage
 * e que os dados persistam mesmo quando o servidor reinicia (Vercel cold start).
 */

export function getUserId(): string {
  try {
    const s = localStorage.getItem('caminho_session');
    if (!s) return 'anon';
    const p = JSON.parse(s);
    return String(p?.user?.id ?? p?.id ?? 'anon');
  } catch {
    return 'anon';
  }
}

export function cacheKey(ns: string): string {
  return `cs_cache_${ns}_${getUserId()}`;
}

export function cacheGet<T>(ns: string, fallback: T): T {
  try {
    const v = localStorage.getItem(cacheKey(ns));
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function cacheSet<T>(ns: string, value: T): void {
  try {
    localStorage.setItem(cacheKey(ns), JSON.stringify(value));
  } catch {}
}

export function cacheDel(ns: string): void {
  try {
    localStorage.removeItem(cacheKey(ns));
  } catch {}
}
