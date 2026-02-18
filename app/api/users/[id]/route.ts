import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const {
        id
    } = params;

    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const userId = parseInt(id)

        // Prevent deleting self
        if (userId === session.user.id) {
            return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
        }

        await prisma.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting user:", error)
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}
