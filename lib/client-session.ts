"use client";

const STORAGE_KEY = "pavagada_session_token";
const NATIVE_FETCH_KEY = "__pavagadaNativeFetch";

export function readSessionToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      window.sessionStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(STORAGE_KEY) ||
      ""
    );
  } catch {
    return "";
  }
}

export function writeSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.sessionStorage.setItem(STORAGE_KEY, token);
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage may be restricted in strict environments
  }
}

export function resolveApiPath(input: RequestInfo | URL): string | null {
  try {
    const raw =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    if (raw.startsWith("/api/")) return raw;
    if (typeof window !== "undefined") {
      const parsed = new URL(raw, window.location.origin);
      if (
        parsed.origin === window.location.origin &&
        parsed.pathname.startsWith("/api/")
      ) {
        return `${parsed.pathname}${parsed.search}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function getNativeFetch(): typeof globalThis.fetch {
  if (typeof window === "undefined") {
    return globalThis.fetch;
  }
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g[NATIVE_FETCH_KEY] === "function") {
    return g[NATIVE_FETCH_KEY] as typeof globalThis.fetch;
  }
  const bound = window.fetch.bind(window);
  try {
    Object.defineProperty(g, NATIVE_FETCH_KEY, {
      value: bound,
      configurable: true,
      writable: true,
    });
  } catch {
    // Ignore if globalThis cannot define metadata property
  }
  return bound;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const nativeFetch = getNativeFetch();
  const apiPath = resolveApiPath(input);
  if (!apiPath) {
    return nativeFetch(input, init);
  }

  const token = readSessionToken();
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined)
  );
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }
  const nextInit: RequestInit = {
    cache: "no-store",
    ...init,
    headers,
  };

  const response = await nativeFetch(input, nextInit);

  if (
    (apiPath.startsWith("/api/auth/login") ||
      apiPath.startsWith("/api/auth/register")) &&
    response.ok
  ) {
    try {
      const body = (await response.clone().json()) as {
        sessionToken?: string;
      };
      if (body?.sessionToken) {
        writeSessionToken(body.sessionToken);
      }
    } catch {
      // Ignore parse failures
    }
  } else if (apiPath.startsWith("/api/auth/logout")) {
    writeSessionToken("");
  } else if (apiPath.startsWith("/api/auth/session") && response.ok) {
    try {
      const body = (await response.clone().json()) as { user?: unknown };
      if (body && body.user === null) {
        writeSessionToken("");
      }
    } catch {
      // Ignore parse failures
    }
  }

  return response;
}
