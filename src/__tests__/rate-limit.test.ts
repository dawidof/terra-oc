import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    // Each test uses a unique key to avoid interference
  });

  it("allows request within limit", () => {
    const result = rateLimit("test-1", { windowMs: 60000, maxRequests: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks remaining requests", () => {
    rateLimit("test-2", { windowMs: 60000, maxRequests: 3 });
    rateLimit("test-2", { windowMs: 60000, maxRequests: 3 });
    const result = rateLimit("test-2", { windowMs: 60000, maxRequests: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks when limit exceeded", () => {
    rateLimit("test-3", { windowMs: 60000, maxRequests: 2 });
    rateLimit("test-3", { windowMs: 60000, maxRequests: 2 });
    const result = rateLimit("test-3", { windowMs: 60000, maxRequests: 2 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("isolates different keys", () => {
    rateLimit("test-a", { windowMs: 60000, maxRequests: 1 });
    rateLimit("test-a", { windowMs: 60000, maxRequests: 1 }); // exceeded

    const result = rateLimit("test-b", { windowMs: 60000, maxRequests: 1 });
    expect(result.allowed).toBe(true); // different key, not affected
  });

  it("returns resetAt timestamp", () => {
    const result = rateLimit("test-4", { windowMs: 60000, maxRequests: 10 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});
