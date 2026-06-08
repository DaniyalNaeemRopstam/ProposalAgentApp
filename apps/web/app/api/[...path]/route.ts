import { NextRequest, NextResponse } from "next/server";
import { resolveApiBackendUrl } from "@/lib/apiBackend";

export const runtime = "nodejs";

const FORWARD_HEADERS = ["authorization", "content-type", "accept"] as const;

async function proxy(req: NextRequest, ctx: { params: { path: string[] } }) {
  const backend = resolveApiBackendUrl();
  const segments = ctx.params.path ?? [];
  const target = `${backend}/api/${segments.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  for (const name of FORWARD_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers[name] = value;
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: `Cannot reach the API at ${backend}. Confirm Railway is running.`,
      },
      { status: 502 }
    );
  }

  const resHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) resHeaders.set("content-type", contentType);

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
