let cached: { token: string; fetchedAt: number } | null = null;
let pending: Promise<string | null> | null = null;
const TTL_MS = 50 * 60 * 1000;

export async function getCsrfToken(): Promise<string | null> {
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.token;
  }
  if (pending) return pending;

  pending = (async () => {
    try {
      const res = await fetch("/api/csrf");
      if (!res.ok) return null;
      const data = await res.json();
      if (typeof data.token === "string" && data.token.length > 0) {
        cached = { token: data.token, fetchedAt: Date.now() };
        return cached.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      pending = null;
    }
  })();

  return pending;
}
