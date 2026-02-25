import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"

export async function middleware(request: NextRequest) {
    const session = await getSession()

    const path = request.nextUrl.pathname

    // Define public paths that don't need authentication
    const isPublicPath = path === "/login" || path.startsWith("/api/auth/login") || path.startsWith("/api/auth/logout") || path.startsWith("/api/admin/fix-basicos")

    // Protected routes pattern
    const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/api")

    if (isProtectedRoute && !isPublicPath) {
        if (!session) {
            // For API routes, return 401 JSON
            if (path.startsWith("/api")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
            }
            // For pages, redirect to login
            return NextResponse.redirect(new URL("/login", request.url))
        }
    }

    // Redirect to dashboard if already logged in and trying to access login
    if (path === "/login" && session) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
}
