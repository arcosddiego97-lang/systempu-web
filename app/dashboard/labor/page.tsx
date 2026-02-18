"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, Pencil, Trash, ClipboardPaste, ChevronLeft } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BulkLaborCapture } from "@/components/bulk-labor-capture"
import { CrewFormulator } from "@/components/crew-formulator"
import { cn } from "@/lib/utils"

interface ManoObra {
    id: number
    clave: string
    descripcion: string
    unidad: string
    tipo: "INDIVIDUAL" | "CUADRILLA"
    salarioBase: number
    factorSalarioReal: number
    salarioReal: number
    fechaActualizacion: string
}

export default function LaborPage() {
    const [labor, setLabor] = useState<ManoObra[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<ManoObra | null>(null)
    const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        clave: "",
        descripcion: "",
        unidad: "JOR",
        tipo: "INDIVIDUAL" as "INDIVIDUAL" | "CUADRILLA",
        salarioBase: "",
        factorSalarioReal: "1.0"
    })

    const loadLabor = useCallback(() => {
        setLoading(true)
        fetch("/api/mano-de-obra")
            .then((res) => res.json())
            .then((data) => {
                setLabor(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        loadLabor()
    }, [loadLabor])

    const handleOpenCreate = (defaultType: "INDIVIDUAL" | "CUADRILLA" = "INDIVIDUAL") => {
        let suggestedClave = ""
        if (defaultType === "CUADRILLA") {
            const crewPrefix = "CUAD-"
            const existingCrews = labor.filter(l => l.tipo === "CUADRILLA" && l.clave.startsWith(crewPrefix))
            let maxNum = 0
            existingCrews.forEach(c => {
                const numPart = c.clave.replace(crewPrefix, "")
                const num = parseInt(numPart)
                if (!isNaN(num) && num > maxNum) maxNum = num
            })
            suggestedClave = `${crewPrefix}${(maxNum + 1).toString().padStart(2, "0")}`
        }

        setEditingItem(null)
        setFormData({
            clave: suggestedClave,
            descripcion: "",
            unidad: "JOR",
            tipo: defaultType,
            salarioBase: "",
            factorSalarioReal: "1.0"
        })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (item: ManoObra) => {
        setEditingItem(item)
        setFormData({
            clave: item.clave,
            descripcion: item.descripcion,
            unidad: item.unidad,
            tipo: item.tipo,
            salarioBase: item.salarioBase?.toString() || "0",
            factorSalarioReal: item.factorSalarioReal?.toString() || "1.0"
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar este registro?")) return
        try {
            const res = await fetch(`/api/mano-de-obra/${id}`, { method: "DELETE" })
            if (res.ok) loadLabor()
        } catch (err) {
            console.error(err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = editingItem ? `/api/mano-de-obra/${editingItem.id}` : "/api/mano-de-obra"
        const method = editingItem ? "PATCH" : "POST"

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setIsDialogOpen(false)
                loadLabor()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const selectedCrew = labor.find(l => l.id === selectedCrewId)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-gradient">Catálogo de Mano de Obra</h1>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-sm">
                        <ClipboardPaste className="h-4 w-4" /> Captura Masiva
                    </Button>
                    {/* Botón general opcional, o podemos dejar solo los específicos abajo */}
                    <Button onClick={() => handleOpenCreate()} className="gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg">
                        <Plus className="h-4 w-4" /> Nuevo Registro
                    </Button>
                </div>
            </div>

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={editingItem ? "Editar Personal / Cuadrilla" : "Agregar Nuevo Registro"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Clave</label>
                        <Input
                            required
                            value={formData.clave}
                            onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                            placeholder="Ej. MO-01"
                            className="rounded-lg border-slate-200 focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Descripción</label>
                        <Input
                            required
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Ej. Oficial Albañil"
                            className="rounded-lg border-slate-200 focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Tipo</label>
                        <select
                            className="w-full flex h-10 rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                        >
                            <option value="INDIVIDUAL">Personal Individual</option>
                            <option value="CUADRILLA">Cuadrilla / Crew (Compuesto)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Unidad</label>
                            <Input
                                required
                                value={formData.unidad}
                                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                placeholder="Ej. JOR"
                                className="rounded-lg border-slate-200"
                            />
                        </div>
                        {formData.tipo === "INDIVIDUAL" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Salario Base</label>
                                <Input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.salarioBase}
                                    onChange={(e) => setFormData({ ...formData, salarioBase: e.target.value })}
                                    placeholder="0.00"
                                    className="rounded-lg border-slate-200"
                                />
                            </div>
                        )}
                    </div>

                    {formData.tipo === "INDIVIDUAL" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Factor Salario Real (FASAR)</label>
                            <Input
                                required
                                type="number"
                                step="0.0001"
                                value={formData.factorSalarioReal}
                                onChange={(e) => setFormData({ ...formData, factorSalarioReal: e.target.value })}
                                placeholder="1.0000"
                                className="rounded-lg border-slate-200"
                            />
                        </div>
                    )}

                    {formData.tipo === "CUADRILLA" && (
                        <div className="p-4 bg-orange-50 text-orange-800 text-sm rounded-xl border border-orange-100 flex gap-3 shadow-inner">
                            <div className="bg-orange-200 p-2 rounded-full h-fit mt-1">
                                <Users className="h-4 w-4 text-orange-700" />
                            </div>
                            <p className="italic">
                                <strong>Nota:</strong> Los salarios de las cuadrillas se calculan automáticamente sumando los salarios reales de sus integrantes.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 px-8">
                            {editingItem ? "Actualizar" : "Crear Registro"}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <div className="grid grid-cols-1 gap-8">
                {/* Tabla de Cuadrillas / Crews */}
                <Card className="border-orange-100 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-orange-50/30 py-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-500 p-2 rounded-xl shadow-sh">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-orange-900">Cuadrillas de Trabajo</CardTitle>
                                <p className="text-sm text-orange-700/60 font-medium">Grupos compuestos por personal base.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleOpenCreate("CUADRILLA")}
                            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md border-0"
                        >
                            <Plus className="h-4 w-4" /> Nueva Cuadrilla
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="text-center py-10 text-muted-foreground animate-pulse">Cargando cuadrillas...</div>
                        ) : labor.filter(l => l.tipo === "CUADRILLA").length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground italic">No hay cuadrillas registradas.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4">Clave</th>
                                            <th className="px-6 py-4">Descripción</th>
                                            <th className="px-6 py-4">Unidad</th>
                                            <th className="px-6 py-4 text-right">Costo Cuadrilla (S. Real)</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {labor.filter(l => l.tipo === "CUADRILLA").map((row) => (
                                            <tr key={row.id} className="transition-colors hover:bg-orange-50/20">
                                                <td className="px-6 py-4 font-bold text-orange-700">{row.clave}</td>
                                                <td className="px-6 py-4 font-medium">{row.descripcion}</td>
                                                <td className="px-6 py-4 text-slate-500">{row.unidad}</td>
                                                <td className="px-6 py-4 text-right font-bold text-orange-600">
                                                    ${(row.salarioReal ?? 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 gap-2 text-xs border-orange-200 text-orange-700 hover:bg-orange-100 font-bold px-4 rounded-lg"
                                                        onClick={() => setSelectedCrewId(row.id)}
                                                    >
                                                        <Users className="h-4 w-4" /> Formular
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" onClick={() => handleOpenEdit(row)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 hover:text-red-600" onClick={() => handleDelete(row.id)}>
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

                {/* Tabla de Personal Individual */}
                <Card className="border-blue-100 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50/30 py-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-blue-900">Personal Individual</CardTitle>
                                <p className="text-sm text-blue-700/60 font-medium">Listado de trabajadores base y especialistas.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleOpenCreate("INDIVIDUAL")}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md border-0"
                        >
                            <Plus className="h-4 w-4" /> Nuevo Trabajador
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="text-center py-10 text-muted-foreground animate-pulse">Cargando personal...</div>
                        ) : labor.filter(l => l.tipo !== "CUADRILLA").length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground italic">No hay registros de personal.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4">Clave</th>
                                            <th className="px-6 py-4">Descripción</th>
                                            <th className="px-6 py-4">Unidad</th>
                                            <th className="px-6 py-4 text-right">S. Base</th>
                                            <th className="px-6 py-4 text-right">FASAR</th>
                                            <th className="px-6 py-4 text-right">S. Real</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {labor.filter(l => l.tipo !== "CUADRILLA").map((row) => (
                                            <tr key={row.id} className="transition-colors hover:bg-blue-50/20">
                                                <td className="px-6 py-4 font-bold text-blue-700">{row.clave}</td>
                                                <td className="px-6 py-4 font-medium">{row.descripcion}</td>
                                                <td className="px-6 py-4 text-slate-500">{row.unidad}</td>
                                                <td className="px-6 py-4 text-right">${(row.salarioBase ?? 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-slate-500">{(row.factorSalarioReal ?? 1).toFixed(4)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-blue-600">${(row.salarioReal ?? 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" onClick={() => handleOpenEdit(row)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 hover:text-red-600" onClick={() => handleDelete(row.id)}>
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

            {selectedCrewId && selectedCrew && (
                <Dialog
                    isOpen={!!selectedCrewId}
                    onClose={() => {
                        setSelectedCrewId(null)
                        loadLabor()
                    }}
                    title={`Formulación de Cuadrilla: ${selectedCrew.clave}`}
                >
                    <CrewFormulator
                        crewId={selectedCrewId}
                        allLabor={labor}
                        onUpdate={() => {
                            // The formulator handles its own updates, but we might want to refresh main list
                        }}
                    />
                </Dialog>
            )}

            <BulkLaborCapture
                isOpen={isBulkDialogOpen}
                onClose={() => setIsBulkDialogOpen(false)}
                onSuccess={loadLabor}
            />
        </div>
    )
}
