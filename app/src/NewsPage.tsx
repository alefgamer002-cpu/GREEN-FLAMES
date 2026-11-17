import { useEffect, useMemo, useState } from "react"
import { getPublishedNews, type NewsItem } from "./lib/supabase"

type IconProps = {
  className?: string
}

const Icon = {
  Arrow: ({ className = "size-4" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Chevron: ({ className = "size-4" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: ({ className = "size-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Flame: ({ className = "size-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.4 2.8c.5 3-1.8 4.3-2.2 6.7-.2 1.3.5 2.2 1.7 2.8-.1-1.8.8-3.2 2.6-4.4 2.3 2.2 3.6 4.5 3.3 7.2-.3 3.4-3.1 5.9-6.7 5.9-3.8 0-6.8-2.6-6.8-6.2 0-3 1.8-5.2 4.8-7.2.1 2 .6 2.8 1.3 3.2-.4-3.4 2.9-4.5 2-8Z" fill="currentColor" />
    </svg>
  ),
  Leaf: ({ className = "size-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19.7 4.3C12.2 4 7.2 6.8 5.5 11.2c-1.2 3.2.2 6.2 2.9 7.2 2.5.9 5.2-.4 6.4-3.1 1.6-3.6 1.7-7.7 4.9-11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 20c2.7-4.3 5.8-7.5 10.1-10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Menu: ({ className = "size-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Search: ({ className = "size-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  User: ({ className = "size-4" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
}

type NewsCardItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  content: string;
};

const categories = [
  ["Meio ambiente", ""],
  ["Bombeiros", ""],
  ["Comunicados", ""],
  ["Ações e projetos", ""],
]

function Logo() {
  return (
    <a href="/" className="group flex items-center" aria-label="Projeto Green Flames - início">
      <img src="/assets/green-flames-logo.webp" alt="Projeto Green Flames" className="size-16 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105" />
    </a>
  )
}

function NewsCard({ item, onSelect }: { item: NewsCardItem; onSelect: (item: NewsCardItem) => void }) {
  return (
    <article className="news-card group flex h-full flex-col overflow-hidden rounded-[14px] bg-white">
      {item.image ? (
        <div className="relative h-44 overflow-hidden">
          <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b301a]/20 to-transparent" />
        </div>
      ) : (
        <div className="grid h-44 place-items-center bg-[#e6eee2] text-[#195433]"><Icon.Leaf className="size-12" /></div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-[#e3efe4] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#195433]">{item.category}</span>
          <time className="text-[10px] font-bold tracking-[0.1em] text-[#7d867e]">{item.date}</time>
        </div>
        <h3 className="mb-3 text-[17px] font-extrabold leading-[1.35] tracking-[-0.025em] text-[#102b1b]">{item.title}</h3>
        <p className="mb-5 line-clamp-4 text-sm leading-6 text-[#6b756d]">{item.content}</p>
        <button type="button" onClick={() => onSelect(item)} className="mt-auto inline-flex w-fit items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#195433]">
          Ver notícia
          <Icon.Arrow className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  )
}

function NewsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [news, setNews] = useState<NewsCardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [selectedNews, setSelectedNews] = useState<NewsCardItem | null>(null)

  useEffect(() => {
    let active = true
    getPublishedNews()
      .then((items: NewsItem[]) => {
        if (!active) return
        setNews(items.map((item) => ({
          id: item.id_noticia,
          title: item.titulo_noticia,
          category: item.categoria_noticia || "Comunicados",
          date: new Date(item.data_publicacao_noticia || item.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
          image: item.imagem_url || "",
          content: item.conteudo_noticia,
        })))
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar as notícias.")
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredNews = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR")
    if (!term) return news
    return news.filter((item) => `${item.title} ${item.category}`.toLocaleLowerCase("pt-BR").includes(term))
  }, [search, news])

  const featured = filteredNews[0]
  const remaining = filteredNews.slice(1)
  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(remaining.length / pageSize))
  const visibleRemaining = remaining.slice((page - 1) * pageSize, page * pageSize)
  const navigation = [
    { label: "Início", href: "/#inicio" },
    { label: "Riscos de queimadas", href: "/#riscos" },
    { label: "Prevenção", href: "/#prevencao" },
    { label: "Ajuda", href: "/#ajuda" },
    { label: "Notícias", href: "/noticias" },
  ]

  return (
    <div className="min-h-screen bg-[#f3f3e8] text-[#173020]">
      <header className="sticky top-0 z-50 bg-[#0b301a] shadow-[0_8px_24px_rgba(6,29,15,0.14)]">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 lg:px-8">
          <Logo />
          <nav className="hidden h-full items-center gap-7 lg:flex" aria-label="Navegação principal">
            {navigation.map((item) => (
              <a key={item.label} href={item.href} className={`relative flex h-full items-center text-[11px] font-bold uppercase tracking-[0.09em] transition-colors ${item.label === "Notícias" ? "text-white" : "text-white/70 hover:text-white"}`}>
                {item.label}
                {item.label === "Notícias" && <span className="absolute bottom-0 left-0 h-[3px] w-full bg-[#f2d022]" />}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="/#login" className="hidden items-center gap-2 rounded-lg bg-[#f2d022] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#0b301a] transition hover:bg-[#ffe044] sm:flex">
              <Icon.User /> Entrar
            </a>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="grid size-11 place-items-center rounded-lg text-white transition hover:bg-white/10 lg:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}>
              {menuOpen ? <Icon.Close /> : <Icon.Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-white/10 bg-[#0b301a] px-5 py-4 lg:hidden" aria-label="Navegação móvel">
            {navigation.map((item) => (
              <a key={item.label} href={item.href} className={`block border-b border-white/10 py-3 text-xs font-bold uppercase tracking-[0.1em] ${item.label === "Notícias" ? "text-[#f2d022]" : "text-white/75"}`}>{item.label}</a>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-12 lg:px-8 lg:py-16">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#738276]">Informação que protege</p>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black tracking-[-0.045em] text-[#0b301a] sm:text-4xl">ÚLTIMAS NOTÍCIAS</h1>
              <span className="hidden h-1 w-14 rounded-full bg-[#f2d022] sm:block" />
            </div>
          </div>
          <p className="max-w-[360px] text-sm leading-6 text-[#66736a]">Acompanhe ações, alertas e iniciativas de preservação que ajudam a manter nossas florestas seguras.</p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2.15fr)_minmax(270px,0.85fr)]">
          <section aria-label="Lista de notícias">
            {loading ? (
              <div className="rounded-[14px] border border-[#d9ddce] bg-white px-6 py-16 text-center text-sm text-[#66736a]">Carregando notícias...</div>
            ) : loadError ? (
              <div className="rounded-[14px] border border-red-200 bg-white px-6 py-8 text-sm text-red-700">{loadError}</div>
            ) : featured && (
              <article id={`noticia-${featured.id}`} className="news-card group mb-5 grid overflow-hidden rounded-[14px] bg-white sm:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[280px] overflow-hidden bg-[#e6eee2] sm:min-h-[360px]">
                  {featured.image ? <img src={featured.image} alt={featured.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" /> : <div className="grid min-h-[280px] place-items-center text-[#195433]"><Icon.Leaf className="size-16" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0b301a]/10" />
                  <span className="absolute left-5 top-5 rounded-full bg-[#f2d022] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#0b301a]">Destaque</span>
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-9">
                  <div className="mb-6 flex items-center gap-4">
                    <span className="rounded-full bg-[#e3efe4] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#195433]">{featured.category}</span>
                    <time className="text-[10px] font-bold tracking-[0.1em] text-[#7d867e]">{featured.date}</time>
                  </div>
                  <h2 className="text-2xl font-black leading-[1.2] tracking-[-0.04em] text-[#102b1b] sm:text-[28px]">{featured.title}</h2>
                  <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[#6b756d]">{featured.content}</p>
                  <button type="button" onClick={() => setSelectedNews(featured)} className="mt-8 inline-flex w-fit items-center gap-3 border-b-2 border-[#f2d022] pb-1 text-xs font-extrabold uppercase tracking-[0.08em] text-[#195433]">
                    Leia a notícia <Icon.Arrow className="size-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </article>
            )}

            {visibleRemaining.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleRemaining.map((item) => <div id={`noticia-${item.id}`} key={item.id}><NewsCard item={item} onSelect={setSelectedNews} /></div>)}
              </div>
            ) : (
              !featured && !loading && !loadError && (
                <div className="rounded-[14px] border border-[#d9ddce] bg-white px-6 py-16 text-center">
                  <Icon.Search className="mx-auto mb-4 size-8 text-[#7b887e]" />
                  <h2 className="font-extrabold text-[#0b301a]">Nenhuma notícia encontrada</h2>
                  <p className="mt-2 text-sm text-[#6b756d]">Tente buscar por outro termo ou categoria.</p>
                </div>
              )
            )}

            <nav className="mt-10 flex items-center gap-2" aria-label="Paginação">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button key={number} type="button" onClick={() => setPage(number)} className={`grid size-10 place-items-center rounded-lg text-xs font-extrabold transition ${page === number ? "bg-[#195433] text-white shadow-[0_6px_14px_rgba(25,84,51,0.2)]" : "border border-[#d6d9cc] bg-white text-[#69736b] hover:border-[#195433] hover:text-[#195433]"}`} aria-current={page === number ? "page" : undefined}>{number}</button>
              ))}
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="ml-1 grid size-10 place-items-center rounded-lg border border-[#d6d9cc] bg-white text-[#195433] transition hover:border-[#195433]" aria-label="Próxima página"><Icon.Chevron /></button>
            </nav>
          </section>

          <aside className="space-y-5">
            <label className="relative block">
              <span className="sr-only">Buscar notícias</span>
              <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar notícias..." className="h-14 w-full rounded-xl border border-[#d7dbcf] bg-white pl-5 pr-12 text-sm text-[#173020] shadow-[0_8px_25px_rgba(27,55,35,0.04)] outline-none transition placeholder:text-[#98a098] focus:border-[#195433] focus:ring-2 focus:ring-[#195433]/10" />
              <Icon.Search className="absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#195433]" />
            </label>

            <section className="news-card rounded-[14px] bg-white p-6">
              <div className="mb-4 flex items-center justify-between border-b border-[#e7e9df] pb-4">
                <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[#0b301a]">Categorias</h2>
                <span className="h-1 w-8 rounded-full bg-[#f2d022]" />
              </div>
              <ul>
                {categories.map(([name, count]) => (
                  <li key={name}>
                    <button type="button" onClick={() => { setSearch(name); setPage(1); }} className="group flex w-full items-center gap-3 border-b border-[#edf0e8] py-4 text-left last:border-0">
                      <span className="grid size-9 place-items-center rounded-full bg-[#edf4ed] text-[#195433] transition group-hover:bg-[#195433] group-hover:text-white"><Icon.Leaf className="size-4" /></span>
                      <span className="flex-1 text-sm font-bold text-[#354b3c]">{name}</span>
                      {count && <span className="text-[10px] font-bold text-[#9aa199]">{count}</span>}
                      <Icon.Chevron className="size-4 text-[#195433]" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative overflow-hidden rounded-[14px] bg-[#195433] p-7 text-white shadow-[0_14px_35px_rgba(11,48,26,0.15)]">
              <div className="absolute -right-8 -top-8 size-28 rounded-full border border-white/10" />
              <div className="absolute -right-2 -top-2 size-16 rounded-full border border-white/10" />
              <span className="mb-5 grid size-11 place-items-center rounded-full bg-[#f2d022] text-[#0b301a]"><Icon.Leaf /></span>
              <h2 className="text-xl font-black tracking-[-0.03em]">Fique por dentro!</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">Siga a Green Flames e compartilhe informação que protege.</p>
              <div className="mt-6 flex gap-2.5">
                {["ig", "f", "in", "yt"].map((network) => (
                  <span key={network} className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-[11px] font-black uppercase text-white/75" aria-label={`Rede social ${network}`} title="Adicione o endereço oficial da rede social">{network}</span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      {selectedNews && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#061b10]/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedNews(null); }}>
          <section className="relative max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-9" role="dialog" aria-modal="true" aria-labelledby="news-dialog-title">
            <button type="button" onClick={() => setSelectedNews(null)} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-[#edf4ed] text-xl font-bold text-[#195433]" aria-label="Fechar notícia">×</button>
            {selectedNews.image && <img src={selectedNews.image} alt={selectedNews.title} className="mb-6 max-h-[340px] w-full rounded-xl object-cover" />}
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#195433]">{selectedNews.category} · {selectedNews.date}</p>
            <h2 id="news-dialog-title" className="pr-8 text-2xl font-black leading-tight text-[#0b301a] sm:text-3xl">{selectedNews.title}</h2>
            <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#59675d]">{selectedNews.content}</p>
          </section>
        </div>
      )}

      <footer className="mt-10 bg-[#082716] text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-5 px-5 py-8 text-center sm:flex-row sm:text-left lg:px-8">
          <Logo />
          <p className="max-w-[520px] text-xs leading-5 text-white/55">Informação, prevenção e cuidado com o meio ambiente. Juntos, protegemos a vida e mantemos nossas florestas verdes.</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">© 2026 Green Flames</p>
        </div>
      </footer>
    </div>
  )
}

export default NewsPage
