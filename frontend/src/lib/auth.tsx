import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import { api, clearToken, getToken, setToken } from "@/src/lib/api";

type User = { id: string; email: string; name: string; created_at: string };

type AuthValue = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          const me = await api<User>("/auth/me");
          setUser(me);
        } catch {
          // Token invalido o expirado: limpiar y continuar.
          try {
            await clearToken();
          } catch {
            // Si ni siquiera se puede limpiar, igual seguimos: el usuario
            // queda en null y vera la pantalla de login.
          }
        }
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ access_token: string; user: User }>("/auth/login", {
      method: "POST", auth: false, body: { email, password },
    });
    await setToken(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await api<{ access_token: string; user: User }>("/auth/register", {
      method: "POST", auth: false, body: { email, name, password },
    });
    await setToken(res.access_token);
    setUser(res.user);
  }, []);

  // FIX Bug 2: signOut ahora:
  //   1. Espera (await) a que clearToken termine y confirme el borrado real
  //      (clearToken ya verifica + reintenta internamente, ver api.ts).
  //   2. Si clearToken falla de todas formas, igual seguimos: lo importante
  //      para el usuario es salir de la cuenta actual en la UI.
  //   3. setUser(null) dispara el efecto de index.tsx -> redirige a login.
  //   4. router.replace es un refuerzo inmediato por si el efecto tarda un tick,
  //      y limpia el historial de navegacion para que "atras" no vuelva a la app.
  const signOut = useCallback(async () => {
    try {
      await clearToken();
    } catch (e) {
      console.warn("No se pudo limpiar el token de forma segura:", e);
    }
    setUser(null);
    router.replace("/(auth)/login");
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
