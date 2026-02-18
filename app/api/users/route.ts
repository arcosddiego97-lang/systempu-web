import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession, hashPassword } from "@/lib/auth"

export async function GET() {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    return NextResponse.json(users)
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { email, password, name, role } = body

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 })
        }

        const hashedPassword = await hashPassword(password)

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || "USER"
            }
        })

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}
