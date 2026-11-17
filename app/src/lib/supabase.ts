/* Green Flames - minimal browser client using Supabase's public HTTP APIs.
 * Only the publishable key is used here. Never place a service_role/secret key
 * in a Vite frontend. Database access is protected by PostgreSQL RLS.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  || "https://msnqpbynzkklpntgdkys.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
  || "sb_publishable_pRRSS3mFigrV_ired1UoQg_ahQQDYqU";

export type AppUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type AppSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user: AppUser;
};

export type NewsItem = {
  id_noticia: string;
  titulo_noticia: string;
  categoria_noticia: string;
  conteudo_noticia: string;
  imagem_url: string | null;
  data_publicacao_noticia: string | null;
  criado_em: string;
};

export type PreventionTip = {
  id_dica_prevencao: string;
  titulo: string;
  conteudo_prev: string;
  criado_em: string;
};

const SESSION_KEY = "green-flames-auth-session";
let cachedSession: AppSession | null = readSession();

function readSession(): AppSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as AppSession : null;
  } catch {
    return null;
  }
}

function storeSession(session: AppSession | null) {
  cachedSession = session;
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage may be disabled by the browser; the current tab can still work.
  }
}

function apiError(payload: unknown, fallback: string): Error {
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const message = value.msg || value.message || value.error_description || value.error;
    if (typeof message === "string" && message.trim()) return new Error(message);
  }
  return new Error(fallback);
}

async function requestJson<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  const session = authenticated
    ? await getValidSession()
    : (cachedSession && (!cachedSession.expires_at || cachedSession.expires_at > Math.floor(Date.now() / 1000) + 30) ? cachedSession : null);
  const headers = new Headers(options.headers);
  headers.set("apikey", SUPABASE_PUBLISHABLE_KEY);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${session?.access_token || SUPABASE_PUBLISHABLE_KEY}`);

  const response = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
  const raw = await response.text();
  let payload: unknown = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch { payload = raw; }
  if (!response.ok) throw apiError(payload, `Falha na comunicação com o Supabase (${response.status}).`);
  return payload as T;
}

function normalizeSession(data: AppSession): AppSession {
  return {
    ...data,
    expires_at: data.expires_at || (data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined),
  };
}

async function getValidSession(): Promise<AppSession | null> {
  const current = cachedSession;
  if (!current) return null;
  if (!current.expires_at || current.expires_at > Math.floor(Date.now() / 1000) + 60) return current;
  try {
    const refreshed = await requestJson<AppSession>("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    }, false);
    const next = normalizeSession(refreshed);
    storeSession(next);
    return next;
  } catch {
    storeSession(null);
    return null;
  }
}

export function getSession(): AppSession | null {
  return cachedSession;
}

/** Refresh an expired local session before showing the authenticated UI. */
export async function restoreSession(): Promise<AppSession | null> {
  return getValidSession();
}

export async function signInWithPassword(email: string, password: string): Promise<AppSession> {
  const data = await requestJson<AppSession>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const session = normalizeSession(data);
  storeSession(session);
  return session;
}

export async function signUp(email: string, password: string, nome: string): Promise<{ session: AppSession | null; needsEmailConfirmation: boolean }> {
  const data = await requestJson<AppSession & { id?: string }>("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: { nome, full_name: nome } }),
  });
  const session = data.access_token ? normalizeSession(data) : null;
  if (session) storeSession(session);
  return { session, needsEmailConfirmation: !session };
}

export async function signOut(): Promise<void> {
  const session = await getValidSession();
  if (session) {
    await requestJson<unknown>("/auth/v1/logout", { method: "POST" }, true);
  }
  storeSession(null);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const redirectTo = encodeURIComponent(`${window.location.origin}/`);
  await requestJson<unknown>(`/auth/v1/recover?redirect_to=${redirectTo}`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function createReport(payload: Record<string, unknown>): Promise<{ id_denuncia: string }> {
  // No public SELECT permission is required: the client supplies a UUID protocol
  // and PostgREST returns the minimal response after INSERT.
  const activeSession = await getValidSession();
  if (payload.id_usuario && !activeSession) {
    throw new Error("Sua sessão expirou. Entre novamente antes de enviar a denúncia.");
  }

  const id_denuncia = crypto.randomUUID();
  await requestJson<unknown>("/rest/v1/tb_denuncia", {
    method: "POST",
    body: JSON.stringify({ id_denuncia, ...payload }),
  }, Boolean(activeSession));
  return { id_denuncia };
}

export async function uploadReportAttachment(file: File, path: string): Promise<string> {
  const session = await getValidSession();
  const folder = path.split("/")[0];
  if (folder !== "anonymous" && (!session || folder !== session.user.id)) {
    throw new Error("Sua sessão expirou. Entre novamente para anexar arquivos à denúncia.");
  }
  const headers = new Headers({
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": file.type,
    "x-upsert": "false",
  });
  const safePath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/denuncias/${safePath}`, {
    method: "POST",
    headers,
    body: file,
  });
  const raw = await response.text();
  let payload: unknown = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch { payload = raw; }
  if (!response.ok) throw apiError(payload, `Não foi possível enviar o anexo ${file.name}.`);
  return path;
}

export async function getPublishedNews(): Promise<NewsItem[]> {
  return requestJson<NewsItem[]>(
    "/rest/v1/tb_noticia?select=id_noticia,titulo_noticia,categoria_noticia,conteudo_noticia,imagem_url,data_publicacao_noticia,criado_em&status_publicacao=eq.true&order=data_publicacao_noticia.desc.nullslast,criado_em.desc&limit=12",
  );
}

export async function getPublishedTips(): Promise<PreventionTip[]> {
  return requestJson<PreventionTip[]>(
    "/rest/v1/tb_dica_prevencao?select=id_dica_prevencao,titulo,conteudo_prev,criado_em&status_publicacao=eq.true&order=criado_em.desc&limit=8",
  );
}
