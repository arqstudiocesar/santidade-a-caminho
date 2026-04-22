/**
 * Cache local por usuário
 * Garante que cada usuário tenha seus próprios dados no localStorage
 * e que os dados persistam mesmo quando o servidor reinicia (Vercel cold start).
 *
 * REGRA PRINCIPAL: dados só são apagados se o usuário apagar EXPLICITAMENTE.
 * Um retorno vazio do servidor NUNCA sobrescreve dados existentes no cache
 * (proteção contra cold start do Vercel que apaga o /tmp).
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

/**
 * cacheHas: verifica se há dados salvos no cache para este namespace/usuário.
 */
export function cacheHas(ns: string): boolean {
  try {
    return localStorage.getItem(cacheKey(ns)) !== null;
  } catch {
    return false;
  }
}

/**
 * mergeServerData:
 * Estratégia segura de sincronização servidor → cache.
 *
 * - Se o servidor retornou dados → atualiza cache (o servidor é a fonte de verdade)
 * - Se o servidor retornou vazio E o cache tem dados → mantém o cache (cold start)
 * - Se o servidor retornou vazio E o cache está vazio → retorna []
 *
 * O parâmetro `userExplicitlyDeleted` deve ser `true` SOMENTE quando o usuário
 * clicar em "Apagar Tudo" ou "Excluir" — nesse caso, o vazio é intencional.
 */
export function mergeServerData<T extends { id: number | string }[]>(
  ns: string,
  serverData: T,
  userExplicitlyDeleted = false
): T {
  if (serverData.length > 0) {
    // Servidor tem dados → atualiza cache e usa os dados do servidor
    cacheSet<T>(ns, serverData);
    return serverData;
  }

  if (userExplicitlyDeleted) {
    // Usuário apagou tudo propositalmente → limpa cache e retorna vazio
    cacheSet<T>(ns, [] as unknown as T);
    return [] as unknown as T;
  }

  // Servidor vazio, mas não foi o usuário que apagou → possível cold start
  // Restaura do cache local
  return cacheGet<T>(ns, [] as unknown as T);
}
