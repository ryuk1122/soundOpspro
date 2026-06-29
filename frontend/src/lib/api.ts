import { storage } from "@/src/utils/storage";

const DEFAULT_BACKEND_URL = "https://api-production-45a2.up.railway.app";
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL;
const BASE = `${BACKEND_URL.replace(/\/$/, "")}/api`;
const TOKEN_KEY = "soundops_token";

export async function getToken(): Promise<string | null> {
  return storage.secureGet(TOKEN_KEY, null);
}
export async function setToken(token: string): Promise<void> {
  await storage.secureSet(TOKEN_KEY, token);
}

// FIX Bug 2: clearToken ahora verifica que el borrado fue efectivo.
// SecureStore en Android puede demorar o fallar silenciosamente; si después
// de borrar el valor todavia esta presente, reintentamos una vez mas antes
// de continuar, y lanzamos si sigue sin poder borrarse.
export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
  const stillThere = await storage.secureGet(TOKEN_KEY, null);
  if (stillThere) {
    // Reintento unico: a veces el primer remove no se propaga de inmediato.
    await storage.secureRemove(TOKEN_KEY);
    const checkAgain = await storage.secureGet(TOKEN_KEY, null);
    if (checkAgain) {
      throw new Error("No se pudo borrar el token de sesion");
    }
  }
  inFlight.clear();
  cache.clear();
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  /** Tiempo en ms que la respuesta de un GET se mantiene en cache. 0 = sin cache. */
  cacheMs?: number;
  /** Ignora la cache y fuerza ir a la red (pero sigue guardando el resultado nuevo). */
  forceRefresh?: boolean;
  /** Timeout en ms para la request. Default 15000 (cubre cold start de Railway free tier). */
  timeoutMs?: number;
};

type CacheEntry = { data: any; expiresAt: number };

// FIX Bug 3: cache simple en memoria para GETs + dedupe de requests en vuelo.
// Antes cada pantalla volvia a pedir todo a Firestore en cada render/foco,
// aunque los datos no hubieran cambiado.
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<any>>();

const DEFAULT_TIMEOUT = 15000; // cubre el cold start de Railway free tier (~5-10s)

function cacheKey(path: string) {
  return path;
}

/** Permite invalidar manualmente la cache de un path (ej. tras un POST/PUT/DELETE). */
export function invalidateCache(pathPrefix?: string) {
  if (!pathPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) cache.delete(key);
  }
}

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    cacheMs = 0,
    forceRefresh = false,
    timeoutMs = DEFAULT_TIMEOUT,
  } = opts;

  const key = cacheKey(path);
  const isGet = method === "GET";

  // 1. Cache hit (solo GET)
  if (isGet && cacheMs > 0 && !forceRefresh) {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data as T;
    }
  }

  // 2. Dedupe: si ya hay una request igual en vuelo, reusarla en vez de duplicar.
  if (isGet && inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }

  const request = (async () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) {
      const token = await getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name === "AbortError") {
        throw new Error("El servidor esta tardando en responder (cold start). Intenta de nuevo en unos segundos.");
      }
      throw new Error("No se pudo conectar al servidor. Revisa tu conexion.");
    } finally {
      clearTimeout(timeout);
    }

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text ? { detail: text } : null;
    }

    if (!res.ok) {
      const detail = data?.detail || `Request failed (${res.status})`;
      throw new Error(typeof detail === "string" ? detail : "Request failed");
    }

    if (isGet && cacheMs > 0) {
      cache.set(key, { data, expiresAt: Date.now() + cacheMs });
    }

    // Cualquier mutacion invalida la cache para no servir listas o dashboard viejos.
    if (!isGet) {
      invalidateCache();
    }

    return data as T;
  })();

  if (isGet) {
    inFlight.set(key, request);
    request.then(
      () => inFlight.delete(key),
      () => inFlight.delete(key),
    );
  }

  return request as Promise<T>;
}
