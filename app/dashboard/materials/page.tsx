"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Hammer, ClipboardPaste, Pencil, Trash } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BulkMaterialCapture } from "@/components/bulk-material-capture"

interface Material {
    id: number
    clave: string
    descripcion: string
    unidad: string
    costo: number
    fechaActualizacion: string
}

export default function MaterialsPage() {
    const [materiales, setMateriales] = useState<Material[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Material | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        clave: "",
        descripcion: "",
        unidad: "",
        costo: ""
    })

    const loadMateriales = React.useCallback(() => {
        setLoading(true)
        fetch("/api/materiales")
            .then((res) => res.json())
            .then((data) => {
                setMateriales(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        loadMateriales()
    }, [loadMateriales])

    const handleOpenCreate = () => {
        setEditingItem(null)
        setFormData({ clave: "", descripcion: "", unidad: "", costo: "" })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (item: Material) => {
        setEditingItem(item)
        setFormData({
            clave: item.clave,
            descripcion: item.descripcion,
            unidad: item.unidad,
            costo: item.costo.toString()
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar este material?")) return
        try {
            const res = await fetch(`/api/materiales/${id}`, { method: "DELETE" })
            if (res.ok) {
                loadMateriales()
            } else {
                const data = await res.json()
                alert(data.error || "Error al eliminar")
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = editingItem ? `/api/materiales/${editingItem.id}` : "/api/materiales"
        const method = editingItem ? "PATCH" : "POST"

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setIsDialogOpen(false)
                setFormData({ clave: "", descripcion: "", unidad: "", costo: "" })
                loadMateriales()
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-gradient">Catálogo de Materiales</h1>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} className="gap-2 border-green-200 text-green-700 hover:bg-green-50 font-bold rounded-xl shadow-sm">
                        <ClipboardPaste className="h-4 w-4" /> Captura Masiva
                    </Button>
                    <Button onClick={handleOpenCreate} className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20">
                        <Plus className="h-4 w-4" /> Nuevo Material
                    </Button>
                </div>
            </div>

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={editingItem ? "Editar Material" : "Agregar Nuevo Material"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Clave</label>
                        <Input
                            required
                            value={formData.clave}
                            onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                            placeholder="Ej. MAT-01"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción</label>
                        <Input
                            required
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Ej. Arena de río"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Unidad</label>
                            <Input
                                required
                                value={formData.unidad}
                                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                placeholder="Ej. m3"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Costo</label>
                            <Input
                                required
                                type="number"
                                step="0.01"
                                value={formData.costo}
                                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
                            {editingItem ? "Actualizar Material" : "Guardar Material"}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Hammer className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Listado de Insumos</CardTitle>
                        <p className="text-sm text-muted-foreground">Materiales de construcción y consumibles.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Cargando materiales...</div>
                    ) : materiales.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No hay materiales registrados.
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3">Clave</th>
                                        <th className="px-4 py-3">Descripción</th>
                                        <th className="px-4 py-3">Unidad</th>
                                        <th className="px-4 py-3 text-right">Costo</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materiales.map((mat) => (
                                        <tr key={mat.id} className="border-b hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{mat.clave}</td>
                                            <td className="px-4 py-3">{mat.descripcion}</td>
                                            <td className="px-4 py-3">{mat.unidad}</td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                ${(mat.costo ?? 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(mat)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(mat.id)}>
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
            <BulkMaterialCapture
                isOpen={isBulkDialogOpen}
                onClose={() => setIsBulkDialogOpen(false)}
                onSuccess={loadMateriales}
            />
        </div>
    )
}
