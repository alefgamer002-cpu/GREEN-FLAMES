import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  createReport, getPublishedNews, getPublishedTips, getSession, sendPasswordReset,
  signInWithPassword, signOut, signUp, uploadReportAttachment, restoreSession,
  type AppSession, type NewsItem, type PreventionTip,
} from "./lib/supabase";
import enterButton from "./imports/image.png";
import greenFlamesLogo from "./imports/image-1.png";
import sendIcon from "./imports/image-3.png";

const assets = "/assets";

const icons = {
  form: `${assets}/de41a.webp`,
  clock: `${assets}/d7082.webp`,
  whatsapp: `${assets}/81c28.webp`,
  info: `${assets}/f491d.webp`,
  check: `${assets}/b3781.webp`,
  lock: `${assets}/d479f.webp`,
  phone: `${assets}/83ec7.webp`,
  location: `${assets}/8371f.webp`,
  calendar: `${assets}/d7806.webp`,
  upload: `${assets}/d1bb9.webp`,
  campaign: `${assets}/4eb4e.webp`,
  secure: `${assets}/12373.webp`,
  camera: `${assets}/2089f.webp`,
  call: `${assets}/d47cb.webp`,
};

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
        <img className="section-background header-background" src={`${assets}/1afb3.svg`} alt="" />
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
          <img className="hero-image hero-image-base" src={`${assets}/69e82.webp`} alt="" />
          <img
            className="hero-image"
            src={`${assets}/bcca0.webp`}
            alt="Bombeiros combatendo uma queimada"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <p>FAÇA SUA</p>
            <h1>DENÚNCIA</h1>
            <img src={`${assets}/c04df.webp`} alt="" className="hero-accent" />
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
        <img className="section-background footer-background" src={`${assets}/cbb86.svg`} alt="" />
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
