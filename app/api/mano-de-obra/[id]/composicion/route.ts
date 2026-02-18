import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { recalculateCrewSalary } from "@/lib/labor-utils"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const components = await prisma.componenteCuadrilla.findMany({
            where: { cuadrillaId: parseInt(id) },
            include: { integrante: true }
        })
        return NextResponse.json(components)
    } catch (error) {
        console.error("Error fetching crew composition:", error)
        return NextResponse.json({ error: "Failed to fetch composition" }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { integranteId, cantidad } = body

        if (!integranteId || cantidad === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const component = await prisma.componenteCuadrilla.upsert({
            where: {
                cuadrillaId_integranteId: {
                    cuadrillaId: parseInt(id),
                    integranteId: parseInt(integranteId)
                }
            },
            update: { cantidad: parseFloat(cantidad) },
            create: {
                cuadrillaId: parseInt(id),
                integranteId: parseInt(integranteId),
                cantidad: parseFloat(cantidad)
            }
        })

        await recalculateCrewSalary(parseInt(id))
        return NextResponse.json(component)
    } catch (error) {
        console.error("Error updating crew component:", error)
        return NextResponse.json({ error: "Failed to update component" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
        return NextResponse.json({ error: "Member ID required" }, { status: 400 })
    }

    try {
        await prisma.componenteCuadrilla.delete({
            where: {
                cuadrillaId_integranteId: {
                    cuadrillaId: parseInt(id),
                    integranteId: parseInt(memberId)
                }
            }
        })
        await recalculateCrewSalary(parseInt(id))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting crew component:", error)
        return NextResponse.json({ error: "Failed to delete component" }, { status: 500 })
    }
}
