import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isPrivate    = request.nextUrl.pathname.startsWith("/dashboard");
  const isLogin      = request.nextUrl.pathname === "/login";
  const isOnboarding = request.nextUrl.pathname === "/onboarding";

  // Não autenticado tentando acessar área privada
  if (!user && (isPrivate || isOnboarding)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Autenticado tentando acessar login
  if (user && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Autenticado acessando dashboard — verifica se já fez onboarding
  if (user && isPrivate) {
    const { count } = await supabase
      .from("stations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id);

    // Sem estações = nunca fez onboarding
    if (count === 0) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};