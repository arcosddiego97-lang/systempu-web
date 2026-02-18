"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Search, Eye, Loader2, Layers, Pencil, Trash, Copy } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { generateDetailedAPUReport } from "@/lib/reports/apu-report"
import { APUReportPreview } from "@/components/apu-report-preview"

interface APU {
    id: number
    codigo: string
    descripcion: string
    unidad: string
    precioUnitario: number | null
    fechaActualizacion: string
}

export default function APUPage() {
    const [records, setRecords] = useState<APU[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [exportingId, setExportingId] = useState<number | null>(null)
    const [previewApu, setPreviewApu] = useState<any | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<APU | null>(null)
    const [formData, setFormData] = useState({
        codigo: "",
        descripcion: "",
        unidad: "",
        porcentajeSobrecosto: "25"
    })
    const [defaultSurcharge, setDefaultSurcharge] = useState(0.25)

    const loadData = React.useCallback(() => {
        setLoading(true)
        fetch("/api/apu")
            .then((res) => res.json())
            .then((data) => {
                setRecords(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        loadData()
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data.surchargeDefault !== undefined) {
                    setDefaultSurcharge(data.surchargeDefault)
                }
            })
            .catch(err => console.error("Error fetching settings:", err))
    }, [loadData])

    const handleOpenCreate = () => {
        setEditingItem(null)
        setFormData({
            codigo: "",
            descripcion: "",
            unidad: "",
            porcentajeSobrecosto: (defaultSurcharge * 100).toString()
        })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (item: any) => {
        setEditingItem(item)
        setFormData({
            codigo: item.codigo,
            descripcion: item.descripcion,
            unidad: item.unidad,
            porcentajeSobrecosto: item.porcentajeSobrecosto !== undefined ? (item.porcentajeSobrecosto * 100).toString() : (defaultSurcharge * 100).toString()
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = editingItem ? `/api/apu/${editingItem.id}` : "/api/apu"
        const method = editingItem ? "PATCH" : "POST"

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setIsDialogOpen(false)
                setFormData({ codigo: "", descripcion: "", unidad: "", porcentajeSobrecosto: (defaultSurcharge * 100).toString() })
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handlePreview = async (id: number) => {
        setExportingId(id)
        try {
            const res = await fetch(`/api/apu/${id}`)
            if (res.ok) {
                const data = await res.json()
                setPreviewApu(data)
                setIsPreviewOpen(true)
            }
        } catch (err) {
            console.error("Error fetching APU for preview:", err)
            alert("Error al cargar la previsualización.")
        } finally {
            setExportingId(null)
        }
    }

    const handleDelete = async (id: number, codigo: string) => {
        if (!confirm(`¿Eliminar el análisis ${codigo}? Esta acción no se puede deshacer.`)) return
        try {
            const res = await fetch(`/api/apu/${id}`, { method: "DELETE" })
            if (res.ok) {
                loadData()
            } else {
                alert("Error al eliminar el análisis.")
            }
        } catch (err) {
            console.error(err)
            alert("Error al eliminar el análisis.")
        }
    }

    const handleDuplicate = async (id: number, codigo: string) => {
        try {
            const res = await fetch(`/api/apu/${id}/duplicate`, { method: "POST" })
            if (res.ok) {
                const data = await res.json()
                // Redirect to edit the new APU
                window.location.href = `/dashboard/apu/${data.newId}`
            } else {
                alert("Error al duplicar el análisis.")
            }
        } catch (err) {
            console.error(err)
            alert("Error al duplicar el análisis.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">Análisis de Precios Unitarios</h1>
                    <p className="text-muted-foreground text-sm">Biblioteca de matrices y análisis de costos directos.</p>
                </div>
                <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/20 bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Análisis
                </Button>
            </div>

            <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={editingItem ? "Editar Análisis" : "Nuevo Análisis (APU)"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Código</label>
                        <Input required value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="Ej. CIM-01" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción</label>
                        <Input required value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Ej. Cimbra en cimentación..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Unidad</label>
                        <Input required value={formData.unidad} onChange={(e) => setFormData({ ...formData, unidad: e.target.value })} placeholder="Ej. m2" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Factor de Sobrecosto (%)</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                step="0.01"
                                required
                                value={formData.porcentajeSobrecosto}
                                onChange={(e) => setFormData({ ...formData, porcentajeSobrecosto: e.target.value })}
                                placeholder="Ej. 25"
                            />
                            <span className="font-bold text-slate-400 font-mono">%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">El precio unitario se calculará como: Costo Directo * (1 + Sobrecosto)</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                            {editingItem ? "Actualizar" : "Crear"}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="flex-1">
                        <CardTitle className="text-lg">Matrices de Análisis</CardTitle>
                        <p className="text-sm text-muted-foreground">Integración detallada de recursos por concepto.</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar concepto..." className="pl-8 bg-white" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-10 flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Cargando matrices...</span>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto opacity-20 mb-4" />
                            <p className="font-medium">No hay análisis registrados.</p>
                            <p className="text-sm">Empieza creando un nuevo análisis para integrar tus costos.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-black tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Descripción</th>
                                        <th className="px-6 py-4">Unidad</th>
                                        <th className="px-6 py-4 text-right">P. Unitario</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {records.map((row) => (
                                        <tr key={row.id} className="group transition-colors hover:bg-blue-50/30">
                                            <td className="px-6 py-4 font-bold text-blue-600 font-mono">{row.codigo}</td>
                                            <td className="px-6 py-4 max-w-xs truncate text-slate-600 italic">{row.descripcion}</td>
                                            <td className="px-6 py-4 font-medium">{row.unidad}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">
                                                {row.precioUnitario ? `$${(Math.round(row.precioUnitario * 100) / 100).toFixed(2)}` : <span className="text-orange-500 font-medium">Borrador</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                                        onClick={() => handleOpenEdit(row)}
                                                        title="Editar Datos Generales"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                                        onClick={() => handlePreview(row.id)}
                                                        disabled={exportingId === row.id}
                                                        title="Visualizar Reporte"
                                                    >
                                                        {exportingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDuplicate(row.id, row.codigo)}
                                                        title="Duplicar Análisis"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDelete(row.id, row.codigo)}
                                                        title="Eliminar Análisis"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                    <Link href={`/dashboard/apu/${row.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold gap-2">
                                                            <Layers className="h-3.5 w-3.5" /> Integrar
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <APUReportPreview
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                apu={previewApu}
                config={{ nombreEmpresa: "H. AYUNTAMIENTO MUNICIPAL CONSTITUCIONAL", surchargeDefault: defaultSurcharge }}
            />
        </div>
    )
}
