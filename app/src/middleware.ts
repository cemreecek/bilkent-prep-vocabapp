import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Allow Admin to access anything. They are the top level.
    // If they are admin, they can preview student exercises or teacher analytics.

    // Admin routes protection
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Teacher routes protection
    if (path.startsWith("/teacher") && token?.role !== "TEACHER" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Student routes: Any authenticated user (STUDENT, TEACHER, ADMIN) can access them.
    // This allows teachers/admins to "preview" exercises.
    return NextResponse.next()
  },
  {
    callbacks: {
      // Return true if the user is authenticated.
      // If false, NextAuth automatically redirects to pages.signIn.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    }
  }
)

export const config = {
  // Specify which routes this middleware should protect.
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/practice/:path*",
    "/flashcards/:path*",
    "/journal/:path*",
    "/review/:path*",
  ],
}
