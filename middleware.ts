import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"

export async function middleware(request: NextRequest) {
    const session = await getSession()

    // Protected routes
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url))
        }
    }

    // Redirect to dashboard if already logged in and trying to access login
    if (request.nextUrl.pathname.startsWith("/login")) {
        if (session) {
            return NextResponse.redirect(new URL("/dashboard", request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/dashboard/:path*", "/login"],
}
