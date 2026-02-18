"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Truck, Pencil, Trash } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Maquinaria {
    id: number
    clave: string
    descripcion: string
    unidad: string
    costoHorario: number
    fechaActualizacion: string
}

export default function EquipmentPage() {
    const [equipment, setEquipment] = useState<Maquinaria[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Maquinaria | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        clave: "",
        descripcion: "",
        unidad: "",
        costoHorario: ""
    })

    const loadEquipment = useCallback(() => {
        setLoading(true)
        fetch("/api/maquinaria")
            .then((res) => res.json())
            .then((data) => {
                setEquipment(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        loadEquipment()
    }, [loadEquipment])

    const handleOpenCreate = () => {
        setEditingItem(null)
        setFormData({
            clave: "",
            descripcion: "",
            unidad: "",
            costoHorario: ""
        })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (item: Maquinaria) => {
        setEditingItem(item)
        setFormData({
            clave: item.clave,
            descripcion: item.descripcion,
            unidad: item.unidad,
            costoHorario: item.costoHorario.toString()
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar este equipo?")) return
        try {
            const res = await fetch(`/api/maquinaria/${id}`, { method: "DELETE" })
            if (res.ok) loadEquipment()
        } catch (err) {
            console.error(err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = editingItem ? `/api/maquinaria/${editingItem.id}` : "/api/maquinaria"
        const method = editingItem ? "PATCH" : "POST"

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setIsDialogOpen(false)
                loadEquipment()
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Catálogo de Maquinaria y Equipo</h1>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Equipo
                </Button>
            </div>

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={editingItem ? "Editar Equipo / Herramienta" : "Agregar Nuevo Equipo / Herramienta"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Clave</label>
                        <Input
                            required
                            value={formData.clave}
                            onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                            placeholder="Ej. EQP-01"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción</label>
                        <Input
                            required
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Ej. Retroexcavadora"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Unidad</label>
                            <Input
                                required
                                value={formData.unidad}
                                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                placeholder="Ej. HORA"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Costo Horario</label>
                            <Input
                                required
                                type="number"
                                step="0.01"
                                value={formData.costoHorario}
                                onChange={(e) => setFormData({ ...formData, costoHorario: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingItem ? "Guardar Cambios" : "Guardar Equipo"}</Button>
                    </div>
                </form>
            </Dialog>

            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Truck className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Maquinaria y Herramienta</CardTitle>
                        <p className="text-sm text-muted-foreground">Gestión de costos horarios y equipos.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Cargando datos...</div>
                    ) : equipment.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No hay equipos registrados.
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3">Clave</th>
                                        <th className="px-4 py-3">Descripción</th>
                                        <th className="px-4 py-3">Unidad</th>
                                        <th className="px-4 py-3 text-right">Costo Horario</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equipment.map((row) => (
                                        <tr key={row.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">{row.clave}</td>
                                            <td className="px-4 py-3">{row.descripcion}</td>
                                            <td className="px-4 py-3">{row.unidad}</td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                ${row.costoHorario.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(row.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
