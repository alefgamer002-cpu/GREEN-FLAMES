import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  createReport, getPublishedNews, getPublishedTips, getSession, sendPasswordReset,
  signInWithPassword, signOut, signUp, uploadReportAttachment, restoreSession,
  type AppSession, type NewsItem, type PreventionTip,
} from "./lib/supabase";

const makeSvg = (body: string, viewBox = "0 0 64 64") =>
  "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '">' + body + "</svg>"
  );
const greenFlamesLogo = makeSvg('<path d="M34 3C38 18 22 25 18 39c-4 13 4 23 16 23 14 0 22-11 19-24-2-8-7-13-13-19 0 9-4 14-9 17 4-12 4-22 3-33Z" fill="#ffe900"/><path d="M34 37c-7 6-8 11-5 16 3 4 9 4 12 0 4-5 1-11-7-16Z" fill="#246b46"/>');
const enterButton = makeSvg('<rect x="1" y="1" width="62" height="38" rx="9" fill="#ffe900"/><text x="32" y="25" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#123b2e">ENTRAR</text>', "0 0 64 40");
const sendIcon = makeSvg('<path d="M8 32h45M37 12l18 20-18 20" fill="none" stroke="#123b2e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>');
const icon = (path: string) => makeSvg('<path d="' + path + '" fill="none" stroke="#246b46" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>');
const icons = {
  form: icon("M12 5h40v48H12z M21 17h22 M21 27h22 M21 37h15"),
  clock: icon("M32 7a25 25 0 1 0 0 50 25 25 0 0 0 0-50 M32 18v15l11 7"),
  whatsapp: icon("M14 49l3-9a21 21 0 1 1 8 8l-11 3Z M24 23c3 9 8 14 17 17"),
  info: icon("M32 7a25 25 0 1 0 0 50 25 25 0 0 0 0-50 M32 29v15 M32 19h.1"),
  check: icon("M12 33l13 13 28-29"),
  lock: icon("M17 29V20a15 15 0 0 1 30 0v9 M12 29h40v27H12z M32 39v8"),
  phone: icon("M20 9h24v46H20z M28 48h8"),
  location: icon("M32 58s20-18 20-35a20 20 0 1 0-40 0c0 17 20 35 20 35Z M32 23a6 6 0 1 0 0 .1"),
  calendar: icon("M12 15h40v39H12z M21 8v14 M43 8v14 M12 26h40"),
  upload: icon("M32 43V8 M18 22 32 8l14 14 M12 42v12h40V42"),
  campaign: icon("M36 6c2 13-8 17-8 25 0 5 3 8 8 10-1-8 5-12 10-17 10 13 6 30-7 34-17 5-31-8-26-23 3-11 13-17 23-29Z"),
  secure: icon("M32 5 52 13v15c0 14-8 25-20 31C20 53 12 42 12 28V13z M22 30l7 7 14-16"),
  camera: icon("M8 19h12l5-7h14l5 7h12v35H8z M32 27a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"),
  call: icon("M18 8h11l5 13-7 6c4 8 9 13 17 17l6-7 12 5v10c0 4-4 6-8 5C33 52 14 33 10 16c-1-4 3-8 8-8Z"),
};
const headerBackground = makeSvg('<rect width="1400" height="120" fill="#123b2e"/><path d="M0 90Q300 20 600 90T1200 80T1400 60V120H0Z" fill="#fff" opacity=".06"/>', "0 0 1400 120");
const footerBackground = makeSvg('<rect width="1400" height="180" fill="#123b2e"/><path d="M0 140Q320 70 650 142T1400 110V180H0Z" fill="#fff" opacity=".06"/>', "0 0 1400 180");
const heroBase = makeSvg('<defs><linearGradient id="g" y2="1"><stop stop-color="#41503a"/><stop offset=".5" stop-color="#926136"/><stop offset="1" stop-color="#1b2719"/></linearGradient></defs><rect width="1600" height="800" fill="url(#g)"/><circle cx="1170" cy="180" r="170" fill="#e3a04b" opacity=".3"/><path d="M0 500Q300 370 620 515T1200 470T1600 530V800H0Z" fill="#243b25"/><path d="M0 610Q320 480 680 620T1300 570T1600 620V800H0Z" fill="#152c1c"/><g fill="#101f16"><path d="M130 620l90-260 90 260zM360 650l110-310 110 310zM1120 640l100-290 100 290zM1370 630l90-250 90 250z"/></g>', "0 0 1600 800");
const heroFire = makeSvg('<rect width="1600" height="800" fill="#171e17" opacity=".18"/><path d="M0 680Q250 520 520 660T1050 635T1600 660V800H0Z" fill="#122a1c"/><g fill="#243c24"><path d="M120 690l95-250 95 250zM400 700l110-300 110 300zM1020 700l95-280 95 280zM1330 700l110-320 110 320z"/></g><path d="M700 680c-80-100 25-150 10-250 95 78 128 142 90 206 47-30 70-67 63-115 100 100 40 190-60 190H700Z" fill="#c26b24" opacity=".6"/>', "0 0 1600 800");
const accent = makeSvg('<path d="M2 11Q45 0 93 9T198 9" fill="none" stroke="#ffe900" stroke-width="8" stroke-linecap="round"/>', "0 0 200 22");

const highlights = [
  "Sua denúncia é fundamental para combater crimes ambientais.",
  "Forneça o máximo de detalhes para agilizar a nossa ação.",
  "Você pode enviar fotos ou vídeos para complementar a denúncia.",
  "Denúncias falsas são crime e podem gerar penalidades.",
];

export default function App() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<AppSession | null>(getSession());
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "recover">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tips, setTips] = useState<PreventionTip[]>([]);
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    let active = true;
    if (window.location.hash === "#login") setAuthOpen(true);
    restoreSession().then((restored) => {
      if (active) setSession(restored);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getPublishedNews().then((data) => { if (active) setNews(data); })
      .catch((error: unknown) => { if (active) setContentError(error instanceof Error ? error.message : "Não foi possível carregar as notícias."); });
    getPublishedTips().then((data) => { if (active) setTips(data); })
      .catch((error: unknown) => { if (active) setContentError(error instanceof Error ? error.message : "Não foi possível carregar as dicas."); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitted(null);
    setSubmitError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const anonymous = formData.get("anonymous") === "on";

    try {
      const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
      for (const file of files) {
        if (!allowedTypes.includes(file.type)) throw new Error(`Formato não permitido: ${file.name}. Use JPG, PNG ou MP4.`);
        if (file.size > 20 * 1024 * 1024) throw new Error(`O arquivo ${file.name} ultrapassa o limite de 20 MB.`);
      }

      const folder = !anonymous && session?.user.id ? session.user.id : "anonymous";
      const paths: string[] = [];
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "file";
        const path = `${folder}/${crypto.randomUUID()}.${extension}`;
        paths.push(await uploadReportAttachment(file, path));
      }

      const payload = {
        id_usuario: anonymous ? null : (session?.user.id || null),
        localizacao: String(formData.get("location") || "").trim(),
        data_ocorrencia: String(formData.get("date") || "") || new Date().toISOString().slice(0, 10),
        hora_ocorrencia: String(formData.get("time") || "") || null,
        gravidade: String(formData.get("severity") || "media"),
        tipo_incendio: String(formData.get("fireType") || "queimada"),
        descricao: description.trim(),
        nome_denunciante: anonymous ? null : (String(formData.get("name") || "").trim() || null),
        email_denunciante: anonymous ? null : (String(formData.get("email") || "").trim() || null),
        telefone_denunciante: anonymous ? null : (String(formData.get("phone") || "").trim() || null),
        anonima: anonymous,
        anexos: paths,
      };

      const report = await createReport(payload);
      setSubmitted(report.id_denuncia);
      setDescription("");
      setFiles([]);
      form.reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível enviar a denúncia. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");
    try {
      if (authMode === "login") {
        const next = await signInWithPassword(authEmail.trim(), authPassword);
        setSession(next);
        setAuthOpen(false);
      } else if (authMode === "signup") {
        const result = await signUp(authEmail.trim(), authPassword, authName.trim());
        if (result.session) {
          setSession(result.session);
          setAuthOpen(false);
        } else {
          setAuthMessage("Cadastro recebido. Confira seu e-mail para confirmar a conta antes de entrar.");
        }
      } else {
        await sendPasswordReset(authEmail.trim());
        setAuthMessage("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Não foi possível concluir a operação.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setSession(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Não foi possível sair da conta.");
      setAuthOpen(true);
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <img className="section-background header-background" src={headerBackground} alt="" />
        <a className="brand" href="#inicio" aria-label="Green Flames - início">
          <img src={greenFlamesLogo} alt="Projeto Green Flames" />
          <span>GREEN FLAMES</span>
        </a>

        <nav aria-label="Navegação principal">
          <a href="#denuncia">DENÚNCIA</a>
          <a href="#riscos">RISCOS DE QUEIMADAS</a>
          <a href="#prevencao">PREVENÇÃO</a>
          <a href="/noticias">NOTÍCIAS</a>
          <a href="#ajuda">AJUDA</a>
        </nav>

        {session ? (
          <button className="login-link auth-user-button" type="button" onClick={handleSignOut} aria-label="Sair da conta">
            <span>{session.user.email || "Conta conectada"}</span><b>Sair</b>
          </button>
        ) : (
          <button className="login-link auth-login-button" type="button" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); setAuthOpen(true); }} aria-label="Entrar">
            <img src={enterButton} alt="Entrar" />
          </button>
        )}
      </header>

      <main>
        <section className="hero" id="inicio">
          <img className="hero-image hero-image-base" src={heroBase} alt="" />
          <img
            className="hero-image"
            src={heroFire}
            alt="Bombeiros combatendo uma queimada"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <p>FAÇA SUA</p>
            <h1>DENÚNCIA</h1>
            <img src={accent} alt="" className="hero-accent" />
            <strong>
              Ajude a proteger o meio ambiente
              <br />
              de Paraíso do Tocantins.
            </strong>
            <a href="#denuncia" className="hero-cta">
              ENVIAR DENÚNCIA
              <img src={sendIcon} alt="" />
            </a>
          </div>
        </section>

        <section className="report-section" id="denuncia">
          <div className="report-layout">
            <form className="report-form" onSubmit={handleSubmit}>
              <div className="form-heading">
                <img src={icons.form} alt="" />
                <div>
                  <h2>FORMULÁRIO DE DENÚNCIA</h2>
                  <p>Preencha os campos abaixo para nos ajudar.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>Nome ( Opcional )</span>
                  <input name="name" placeholder="Seu nome completo" />
                </label>
                <label>
                  <span>E-mail ( Opcional )</span>
                  <input name="email" type="email" placeholder="seuemail@exemplo.com" />
                </label>
                <label>
                  <span>Telefone ( Opcional )</span>
                  <span className="input-with-icon">
                    <input name="phone" type="tel" placeholder="(63) 99999-9999" />
                    <img src={icons.whatsapp} alt="" />
                  </span>
                </label>
              </div>

              <label className="full-field">
                <span>Local da ocorrência*</span>
                <span className="input-with-icon icon-left">
                  <img src={icons.location} alt="" />
                  <input
                    name="location"
                    required
                    placeholder="Informe o local exato da ocorrência"
                  />
                </span>
              </label>

              <div className="form-grid occurrence-grid">
                <label>
                  <span>Tipo de ocorrência*</span>
                  <select name="fireType" required defaultValue="queimada">
                    <option value="queimada">Queimada / incêndio em vegetação</option>
                    <option value="mata">Incêndio em mata ou floresta</option>
                    <option value="terreno">Fogo em terreno / lote</option>
                    <option value="lixo">Queima de lixo ou resíduos</option>
                    <option value="rural">Incêndio em área rural</option>
                    <option value="outro">Outro tipo de ocorrência</option>
                  </select>
                </label>
                <label>
                  <span>Gravidade percebida*</span>
                  <select name="severity" required defaultValue="media">
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica / risco imediato</option>
                  </select>
                </label>
              </div>

              <div className="form-grid occurrence-grid">
                <label>
                  <span>Data da ocorrência*</span>
                  <span className="input-with-icon icon-left">
                    <img src={icons.calendar} alt="" />
                    <input name="date" type="date" required />
                  </span>
                </label>
                <label>
                  <span>Hora da ocorrência</span>
                  <span className="input-with-icon icon-left">
                    <img src={icons.clock} alt="" />
                    <input name="time" type="time" />
                  </span>
                </label>
              </div>

              <label className="full-field description-field">
                <span>Descrição detalhada*</span>
                <small>Forneça o máximo de detalhes possível sobre o que está acontecendo.</small>
                <textarea
                  name="description"
                  required
                  minLength={15}
                  maxLength={5000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Descreva a situação, o que você viu, quantas pessoas estão envolvidas etc."
                />
                <em>{description.length}/5000</em>
              </label>

              <div className="upload-label">
                <span>Fotos ou vídeos (Opcional)</span>
                <small>
                  Anexe fotos ou vídeos que possam ajudar na identificação da ocorrência.
                </small>
              </div>
              <div className="upload-row">
                <button
                  type="button"
                  className="upload-box"
                  onClick={() => fileInput.current?.click()}
                >
                  <img src={icons.upload} alt="" />
                  <span>
                    <b>Clique para enviar</b> ou arraste os arquivos até aqui
                    <small>Formatos aceitos: JPG, PNG, MP4 | Tamanho máximo: 20MB</small>
                  </span>
                </button>
                <img className="camera-icon" src={icons.camera} alt="" />
                <input
                  ref={fileInput}
                  className="sr-only"
                  type="file"
                  accept=".jpg,.jpeg,.png,.mp4"
                  multiple
                  onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                />
              </div>
              {files.length > 0 && (
                <p className="file-list" role="status">
                  {files.map((file) => file.name).join(", ")}
                </p>
              )}

              <label className="anonymous">
                <input name="anonymous" type="checkbox" />
                <span>Desejo permanecer anônimo</span>
              </label>

              <button className="submit-button" type="submit" disabled={submitting}>
                {submitting ? "ENVIANDO..." : "ENVIAR DENÚNCIA"}
                <img src={sendIcon} alt="" />
              </button>

              {submitError && <p className="error-message" role="alert">{submitError}</p>}
              {submitted && (
                <p className="success-message" role="status">
                  Denúncia registrada. Protocolo: {submitted}. Guarde esse código para consulta.
                </p>
              )}

              <p className="secure-note">
                <img src={icons.secure} alt="" />
                Todas as informações são seguras e confidenciais
              </p>
              <a className="call-shortcut" href="tel:193" aria-label="Ligar para a emergência 193">
                <img src={icons.call} alt="" />
              </a>
            </form>

            <aside className="info-column" id="ajuda">
              <section className="info-card">
                <div className="card-title">
                  <img src={icons.info} alt="" />
                  <h2>INFORMAÇÕES IMPORTANTES</h2>
                </div>
                <ul>
                  {highlights.map((item) => (
                    <li key={item}>
                      <img src={icons.check} alt="" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="info-card privacy-card">
                <div className="card-title">
                  <img src={icons.lock} alt="" />
                  <h2>SIGILO GARANTIDO</h2>
                </div>
                <p>
                  Sua identidade será mantida em sigilo absoluto. Suas informações serão
                  utilizadas apenas para fins de investigação e combate a crimes ambientais.
                </p>
              </section>

              <section className="info-card emergency-card">
                <div className="card-title">
                  <img src={icons.phone} alt="" />
                  <h2>TELEFONES DE EMERGÊNCIA</h2>
                </div>
                <dl>
                  <div>
                    <dt>Corpo de Bombeiros</dt>
                    <dd className="emergency-number">193</dd>
                  </div>
                  <div>
                    <dt>Polícia Militar Ambiental</dt>
                    <dd>(63) 3218-4732</dd>
                  </div>
                  <div>
                    <dt>Disque Denúncia (Anônimo)</dt>
                    <dd>0800 061 0800</dd>
                  </div>
                </dl>
                <div className="campaign">
                  <img src={icons.campaign} alt="" />
                  <span>
                    Proteja nossas florestas.
                    <b>Denuncie!</b>
                  </span>
                </div>
              </section>
            </aside>
          </div>
        </section>

        <section className="awareness" id="riscos">
          <div>
            <p>RISCOS DE QUEIMADAS</p>
            <h2>Uma pequena chama pode causar um grande desastre.</h2>
          </div>
          <div id="prevencao">
            <p>PREVENÇÃO</p>
            <h2>Não use fogo para limpar terrenos e nunca descarte bitucas acesas.</h2>
          </div>
        </section>

        <section className="green-content" id="noticias">
          <div className="content-heading">
            <div><p>INFORMAÇÃO QUE PROTEGE</p><h2>ÚLTIMAS NOTÍCIAS</h2></div>
            <span>Comunicados e ações publicados pela equipe Green Flames. <a className="all-news-link" href="/noticias">Ver todas as notícias →</a></span>
          </div>
          {contentError && <p className="error-message" role="status">Não foi possível atualizar o conteúdo: {contentError}</p>}
          {news.length ? (
            <div className="content-grid">
              {news.map((item) => (
                <article className="content-card" key={item.id_noticia}>
                  {item.imagem_url && <img src={item.imagem_url} alt="" loading="lazy" />}
                  <div><small>{new Date(item.data_publicacao_noticia || item.criado_em).toLocaleDateString("pt-BR")}</small>
                    <h3>{item.titulo_noticia}</h3><p>{item.conteudo_noticia}</p></div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-content">Ainda não há notícias publicadas. Os comunicados oficiais aparecerão aqui.</p>
          )}
        </section>

        <section className="green-content tips-section" id="dicas">
          <div className="content-heading">
            <div><p>PREVENÇÃO</p><h2>DICAS PARA EVITAR QUEIMADAS</h2></div>
            <span>Orientações cadastradas pela equipe responsável.</span>
          </div>
          {tips.length ? (
            <div className="content-grid">
              {tips.map((tip) => (
                <article className="content-card tip-card" key={tip.id_dica_prevencao}>
                  <div><small>{new Date(tip.criado_em).toLocaleDateString("pt-BR")}</small>
                    <h3>{tip.titulo}</h3><p>{tip.conteudo_prev}</p></div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-content">As dicas oficiais serão exibidas aqui quando forem publicadas.</p>
          )}
        </section>
      </main>

      {authOpen && (
        <div className="auth-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
          <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="auth-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Fechar">×</button>
            <p className="auth-eyebrow">GREEN FLAMES</p>
            <h2 id="auth-title">{authMode === "login" ? "Entrar na plataforma" : authMode === "signup" ? "Criar conta" : "Recuperar senha"}</h2>
            <p className="auth-intro">Acesse sua conta para acompanhar suas denúncias e colaborar com a prevenção.</p>
            <form onSubmit={handleAuthSubmit}>
              {authMode === "signup" && <label>Nome completo<input required value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="name" /></label>}
              <label>E-mail<input required type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" /></label>
              {authMode !== "recover" && <label>Senha<input required type="password" minLength={6} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>}
              <button className="auth-submit" type="submit" disabled={authLoading}>{authLoading ? "AGUARDE..." : authMode === "login" ? "ENTRAR" : authMode === "signup" ? "CRIAR CONTA" : "ENVIAR LINK"}</button>
            </form>
            {authError && <p className="error-message" role="alert">{authError}</p>}
            {authMessage && <p className="success-message" role="status">{authMessage}</p>}
            <div className="auth-switches">
              {authMode !== "login" && <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); }}>Já tenho conta</button>}
              {authMode !== "signup" && <button type="button" onClick={() => { setAuthMode("signup"); setAuthError(""); setAuthMessage(""); }}>Criar conta</button>}
              {authMode !== "recover" && <button type="button" onClick={() => { setAuthMode("recover"); setAuthError(""); setAuthMessage(""); }}>Esqueci minha senha</button>}
            </div>
          </section>
        </div>
      )}

      <footer>
        <img className="section-background footer-background" src={footerBackground} alt="" />
        <div className="footer-brand">
          <img src={greenFlamesLogo} alt="" />
          <div>
            <strong>GREEN FLAMES</strong>
            <span>Paraíso do Tocantins - TO</span>
          </div>
        </div>
        <div className="footer-emergency">
          <span>Emergência:</span>
          <strong>193</strong>
        </div>
        <p>© 2026 5º Corpo de Bombeiros Militar — Tocantins. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
