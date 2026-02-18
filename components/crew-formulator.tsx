"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash, Plus, Search } from "lucide-react"

interface LaborItem {
    id: number
    clave: string
    descripcion: string
    unidad: string
    salarioReal: number
}

interface Componente {
    id: number
    integranteId: number
    cantidad: number
    integrante: LaborItem
}

interface Props {
    crewId: number
    allLabor: LaborItem[]
    onUpdate: () => void
}

export function CrewFormulator({ crewId, allLabor, onUpdate }: Props) {
    const [components, setComponents] = useState<Componente[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selection, setSelection] = useState({ id: "", cantidad: "1" })

    const loadComposition = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/mano-de-obra/${crewId}/composicion`)
            const data = await res.json()
            setComponents(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadComposition()
    }, [crewId])

    const handleAddComponent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selection.id) return

        try {
            const res = await fetch(`/api/mano-de-obra/${crewId}/composicion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    integranteId: parseInt(selection.id),
                    cantidad: parseFloat(selection.cantidad)
                })
            })
            if (res.ok) {
                setSelection({ id: "", cantidad: "1" })
                loadComposition()
                onUpdate()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleDeleteComponent = async (memberId: number) => {
        try {
            const res = await fetch(`/api/mano-de-obra/${crewId}/composicion?memberId=${memberId}`, {
                method: "DELETE"
            })
            if (res.ok) {
                loadComposition()
                onUpdate()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const filteredOptions = allLabor.filter(l =>
        l.id !== crewId &&
        (l.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const totalCalculado = components.reduce((acc, curr) => {
        const subtotal = curr.integrante.salarioReal * curr.cantidad
        return acc + (Math.round(subtotal * 100) / 100)
    }, 0)

    return (
        <div className="space-y-4">
            <form onSubmit={handleAddComponent} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-muted/30 p-3 rounded-lg border border-dashed border-muted-foreground/30">
                <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Colaborador / Categoría</label>
                    <select
                        className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={selection.id}
                        onChange={(e) => setSelection({ ...selection, id: e.target.value })}
                        required
                    >
                        <option value="">Seleccionar...</option>
                        {filteredOptions.map(l => (
                            <option key={l.id} value={l.id}>{l.clave} - {l.descripcion} (${l.salarioReal.toFixed(2)})</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Cantidad (Frac.)</label>
                    <Input
                        type="number"
                        step="0.0001"
                        value={selection.cantidad}
                        onChange={(e) => setSelection({ ...selection, cantidad: e.target.value })}
                        className="h-9"
                        required
                    />
                </div>
                <div className="flex items-end">
                    <Button type="submit" className="w-full h-9 bg-orange-600 hover:bg-orange-700">
                        <Plus className="h-4 w-4 mr-2" /> Agregar
                    </Button>
                </div>
            </form>

            <div className="rounded-md border max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-muted sticky top-0">
                        <tr>
                            <th className="px-3 py-2">Clave</th>
                            <th className="px-3 py-2">Integrante</th>
                            <th className="px-3 py-2 text-right">Cantidad</th>
                            <th className="px-3 py-2 text-right">S. Real</th>
                            <th className="px-3 py-2 text-right">Importe</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Cargando composición...</td></tr>
                        ) : components.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">Sin integrantes aún.</td></tr>
                        ) : (
                            components.map((item) => (
                                <tr key={item.id} className="border-b">
                                    <td className="px-3 py-2 font-mono">{item.integrante.clave}</td>
                                    <td className="px-3 py-2">{item.integrante.descripcion}</td>
                                    <td className="px-3 py-2 text-right">{item.cantidad.toFixed(4)}</td>
                                    <td className="px-3 py-2 text-right">${item.integrante.salarioReal.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right font-bold text-primary">
                                        ${(Math.round((item.integrante.salarioReal * item.cantidad) * 100) / 100).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteComponent(item.integranteId)}>
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {!loading && components.length > 0 && (
                        <tfoot className="bg-muted/30 font-bold border-t-2">
                            <tr>
                                <td colSpan={4} className="px-3 py-2 text-right uppercase text-[10px]">Total Salario Real de Cuadrilla:</td>
                                <td className="px-3 py-2 text-right text-orange-600">${totalCalculado.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}
