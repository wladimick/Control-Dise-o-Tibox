import { NextRequest, NextResponse } from "next/server";
import {
  readSharePointSite,
  SharePointConfigurationError,
  SharePointGraphError,
} from "@/lib/sharepoint/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const siteUrl = request.nextUrl.searchParams.get("url")?.trim();

  if (!siteUrl) {
    return NextResponse.json(
      { ok: false, configured: true, error: "Debes indicar la URL de un sitio SharePoint." },
      { status: 400 },
    );
  }

  try {
    const result = await readSharePointSite(siteUrl);
    return NextResponse.json({ ok: true, configured: true, ...result });
  } catch (error) {
    if (error instanceof SharePointConfigurationError) {
      return NextResponse.json(
        { ok: false, configured: false, error: error.message },
        { status: 503 },
      );
    }

    if (error instanceof SharePointGraphError) {
      return NextResponse.json(
        { ok: false, configured: true, error: error.message },
        { status: error.status },
      );
    }

    console.error("Error leyendo sitio SharePoint", error);
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: "Ocurrió un error inesperado al consultar Microsoft Graph.",
      },
      { status: 500 },
    );
  }
}
