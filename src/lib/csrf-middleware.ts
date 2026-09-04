import { validateCsrfToken } from "@/lib/csrf-actions";

const CSRF_HEADER = "x-csrf-token";

export async function requireCsrf(request: Request): Promise<{ ok: boolean; error?: string }> {
  const token = request.headers.get(CSRF_HEADER);
  const valid = await validateCsrfToken(token);
  if (!valid) {
    return { ok: false, error: "Invalid or missing CSRF token" };
  }
  return { ok: true };
}
