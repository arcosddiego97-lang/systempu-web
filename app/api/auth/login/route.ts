import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
        }

        const isValid = await verifyPassword(password, user.password)

        if (!isValid) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
        }

        await createSession({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}
