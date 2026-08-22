const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

type GraphTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GraphSite = {
  id: string;
  displayName?: string;
  name?: string;
  webUrl: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
};

type GraphDrive = {
  id: string;
  name: string;
  webUrl?: string;
  driveType?: string;
};

type GraphCollection<T> = {
  value?: T[];
};

let tokenCache: TokenCache | null = null;

export class SharePointConfigurationError extends Error {}

export class SharePointGraphError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getRequiredEnvironment() {
  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new SharePointConfigurationError(
      "Faltan MS_TENANT_ID, MS_CLIENT_ID o MS_CLIENT_SECRET en las variables de entorno.",
    );
  }

  return { tenantId, clientId, clientSecret };
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const { tenantId, clientId, clientSecret } = getRequiredEnvironment();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: GRAPH_SCOPE,
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as GraphTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new SharePointConfigurationError(
      payload.error_description ||
        "No fue posible obtener un token de Microsoft Graph. Revisa la App Registration y el consentimiento de administrador.",
    );
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };

  return tokenCache.accessToken;
}

function parseSharePointUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new SharePointGraphError("La URL ingresada no es válida.", 400);
  }

  if (url.protocol !== "https:" || !url.hostname.toLowerCase().endsWith(".sharepoint.com")) {
    throw new SharePointGraphError(
      "Ingresa una URL HTTPS válida de SharePoint Online (*.sharepoint.com).",
      400,
    );
  }

  const path = url.pathname.replace(/\/$/, "") || "/";
  return { hostname: url.hostname.toLowerCase(), path };
}

function encodeGraphPath(path: string) {
  if (path === "/") return "/";
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function graphGet<T>(endpoint: string) {
  const token = await getAccessToken();
  const response = await fetch(`${GRAPH_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Microsoft Graph respondió con HTTP ${response.status}.`;

    try {
      const payload = (await response.json()) as {
        error?: { message?: string };
      };
      if (payload.error?.message) message = payload.error.message;
    } catch {
      // Mantener el mensaje HTTP si Graph no devolvió JSON.
    }

    throw new SharePointGraphError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function readSharePointSite(siteUrl: string) {
  const { hostname, path } = parseSharePointUrl(siteUrl);
  const siteEndpoint =
    path === "/"
      ? `/sites/${encodeURIComponent(hostname)}`
      : `/sites/${encodeURIComponent(hostname)}:${encodeGraphPath(path)}`;

  const site = await graphGet<GraphSite>(siteEndpoint);
  const drives = await graphGet<GraphCollection<GraphDrive>>(
    `/sites/${encodeURIComponent(site.id)}/drives?$select=id,name,webUrl,driveType`,
  );

  return {
    site: {
      id: site.id,
      displayName: site.displayName || site.name || "Sitio SharePoint",
      name: site.name || "",
      webUrl: site.webUrl,
      createdDateTime: site.createdDateTime || null,
      lastModifiedDateTime: site.lastModifiedDateTime || null,
      hostname,
    },
    libraries: (drives.value ?? []).map((drive) => ({
      id: drive.id,
      name: drive.name,
      webUrl: drive.webUrl || null,
      driveType: drive.driveType || null,
    })),
  };
}
