import { NextResponse, type NextRequest } from "next/server";

const SITE_HOSTS = new Set(["contrakt.dev", "www.contrakt.dev"]);
const REGISTRY_HOST = "registry.contrakt.dev";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  const { pathname, search } = request.nextUrl;

  if (SITE_HOSTS.has(host ?? "") && pathname !== "/") {
    return NextResponse.redirect(
      new URL(`${pathname}${search}`, `https://${REGISTRY_HOST}`),
      308,
    );
  }

  if (host === REGISTRY_HOST && pathname === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/registry";
    return NextResponse.redirect(destination, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|brand/).*)"],
};
