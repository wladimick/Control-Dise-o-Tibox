"use client";

import {
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  FileStack,
  FolderKanban,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Search,
  ServerCog,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SiteLibrary = {
  id: string;
  name: string;
  webUrl: string | null;
  driveType: string | null;
};

type ConnectedSite = {
  id: string;
  displayName: string;
  name: string;
  webUrl: string;
  createdDateTime: string | null;
  lastModifiedDateTime: string | null;
  hostname: string;
  libraries: SiteLibrary[];
  connectedAt: string;
};

type LookupResponse = {
  ok: boolean;
  configured: boolean;
  error?: string;
  site?: Omit<ConnectedSite, "libraries" | "connectedAt">;
  libraries?: SiteLibrary[];
};

const STORAGE_KEY = "tibox-sharepoint-audit-sites-v1";

function formatDate(value: string | null) {
  if (!value) return "Sin información";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SharePointAuditApp() {
  const [sites, setSites] = useState<ConnectedSite[]>([]);
  const [siteUrl, setSiteUrl] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSites(JSON.parse(raw) as ConnectedSite[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
  }, [sites]);

  const filteredSites = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return sites;
    return sites.filter((site) =>
      [site.displayName, site.webUrl, site.hostname].some((item) =>
        item.toLowerCase().includes(value),
      ),
    );
  }, [query, sites]);

  const libraryCount = useMemo(
    () => sites.reduce((total, site) => total + site.libraries.length, 0),
    [sites],
  );

  async function connectSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = siteUrl.trim();
    if (!value) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/sharepoint/site?url=${encodeURIComponent(value)}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as LookupResponse;
      setConfigured(payload.configured);

      if (!response.ok || !payload.ok || !payload.site) {
        setMessage(payload.error || "No fue posible leer el sitio.");
        return;
      }

      const connected: ConnectedSite = {
        ...payload.site,
        libraries: payload.libraries ?? [],
        connectedAt: new Date().toISOString(),
      };

      setSites((current) => {
        const withoutDuplicate = current.filter((site) => site.id !== connected.id);
        return [connected, ...withoutDuplicate];
      });
      setExpandedId(connected.id);
      setSiteUrl("");
      setMessage(`Sitio leído correctamente: ${connected.displayName}.`);
    } catch {
      setMessage("No fue posible comunicarse con el servicio de lectura.");
    } finally {
      setLoading(false);
    }
  }

  function removeSite(id: string) {
    setSites((current) => current.filter((site) => site.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div>
            <strong>TIBOX</strong>
            <span>SharePoint Audit</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Navegación principal">
          <button className="nav-item active" type="button">
            <FolderKanban size={18} /> Sitios
          </button>
          <button className="nav-item" type="button" disabled>
            <Users size={18} /> Grupos <span>Próximo</span>
          </button>
          <button className="nav-item" type="button" disabled>
            <ShieldCheck size={18} /> Permisos <span>Próximo</span>
          </button>
          <button className="nav-item" type="button" disabled>
            <Database size={18} /> Auditoría <span>Próximo</span>
          </button>
        </nav>

        <div className="readonly-note">
          <LockKeyhole size={18} />
          <div>
            <strong>Modo solo lectura</strong>
            <p>Esta versión no modifica SharePoint.</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Microsoft 365 · MVP 01</p>
            <h1>Inventario de sitios SharePoint</h1>
            <p className="subtitle">
              Conecta únicamente los sitios que quieras revisar y valida su acceso desde Microsoft Graph.
            </p>
          </div>
          <div className={`connection-chip ${configured === false ? "warning" : ""}`}>
            <span className="status-dot" />
            {configured === false ? "Microsoft 365 sin configurar" : "Solo lectura"}
          </div>
        </header>

        <section className="stats-grid" aria-label="Resumen">
          <article className="stat-card">
            <div className="stat-icon"><Building2 size={20} /></div>
            <div><span>Sitios conectados</span><strong>{sites.length}</strong></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon"><FileStack size={20} /></div>
            <div><span>Bibliotecas detectadas</span><strong>{libraryCount}</strong></div>
          </article>
          <article className="stat-card muted-stat">
            <div className="stat-icon"><Users size={20} /></div>
            <div><span>Grupos</span><strong>—</strong><small>Fase 2</small></div>
          </article>
          <article className="stat-card muted-stat">
            <div className="stat-icon"><ShieldCheck size={20} /></div>
            <div><span>Asignaciones</span><strong>—</strong><small>Fase 2</small></div>
          </article>
        </section>

        <section className="connect-panel">
          <div className="panel-heading">
            <div className="panel-icon"><Plus size={20} /></div>
            <div>
              <h2>Conectar un sitio</h2>
              <p>Pega la URL completa del sitio que quieres incluir en la auditoría.</p>
            </div>
          </div>

          <form className="connect-form" onSubmit={connectSite}>
            <input
              type="url"
              value={siteUrl}
              onChange={(event) => setSiteUrl(event.target.value)}
              placeholder="https://empresa.sharepoint.com/sites/cliente"
              aria-label="URL del sitio SharePoint"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <ServerCog size={18} />}
              {loading ? "Leyendo…" : "Leer sitio"}
            </button>
          </form>

          {message && (
            <div className={`feedback ${configured === false ? "feedback-warning" : ""}`}>
              {configured === false ? <ServerCog size={18} /> : <CheckCircle2 size={18} />}
              <span>{message}</span>
            </div>
          )}
        </section>

        <section className="sites-section">
          <div className="section-toolbar">
            <div>
              <h2>Sitios seleccionados</h2>
              <p>Estos registros se guardan solo en este navegador durante el MVP.</p>
            </div>
            <label className="search-box">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar sitio…"
              />
            </label>
          </div>

          {filteredSites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FolderKanban size={28} /></div>
              <h3>{sites.length === 0 ? "Aún no has conectado sitios" : "No encontramos coincidencias"}</h3>
              <p>
                {sites.length === 0
                  ? "Agrega el primer sitio SharePoint arriba. La aplicación solo realizará consultas de lectura."
                  : "Prueba con otro nombre, dominio o URL."}
              </p>
            </div>
          ) : (
            <div className="site-list">
              {filteredSites.map((site) => {
                const expanded = expandedId === site.id;
                return (
                  <article className="site-card" key={site.id}>
                    <button
                      className="site-summary"
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : site.id)}
                    >
                      <div className="site-avatar"><Building2 size={20} /></div>
                      <div className="site-main">
                        <div className="site-title-row">
                          <h3>{site.displayName}</h3>
                          <span className="readonly-badge">Lectura OK</span>
                        </div>
                        <p>{site.webUrl}</p>
                      </div>
                      <div className="site-meta">
                        <span>{site.libraries.length} bibliotecas</span>
                        <strong>{expanded ? "Ocultar" : "Ver detalle"}</strong>
                      </div>
                    </button>

                    {expanded && (
                      <div className="site-detail">
                        <div className="detail-grid">
                          <div><span>Host</span><strong>{site.hostname}</strong></div>
                          <div><span>Última modificación</span><strong>{formatDate(site.lastModifiedDateTime)}</strong></div>
                          <div className="wide"><span>Site ID</span><code>{site.id}</code></div>
                        </div>

                        <div className="libraries-block">
                          <div className="libraries-heading">
                            <div>
                              <h4>Bibliotecas de documentos</h4>
                              <p>Primer nivel de inventario detectado por Graph.</p>
                            </div>
                            <a href={site.webUrl} target="_blank" rel="noreferrer">
                              Abrir SharePoint <ExternalLink size={15} />
                            </a>
                          </div>

                          {site.libraries.length === 0 ? (
                            <p className="no-libraries">No se detectaron bibliotecas visibles para esta aplicación.</p>
                          ) : (
                            <div className="library-list">
                              {site.libraries.map((library) => (
                                <div className="library-row" key={library.id}>
                                  <div className="library-icon"><FileStack size={17} /></div>
                                  <div>
                                    <strong>{library.name}</strong>
                                    <span>{library.driveType || "documentLibrary"}</span>
                                  </div>
                                  {library.webUrl && (
                                    <a href={library.webUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${library.name}`}>
                                      <ExternalLink size={16} />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="detail-footer">
                          <span>Conectado localmente {formatDate(site.connectedAt)}</span>
                          <button type="button" onClick={() => removeSite(site.id)}>
                            <Trash2 size={16} /> Quitar de esta vista
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
