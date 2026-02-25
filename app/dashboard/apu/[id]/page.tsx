"use client"

import React, { useEffect, useState, use, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { ChevronLeft, Plus, Trash, Eye, Pencil, Check, X, Copy, Search, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { generateDetailedAPUReport } from "@/lib/reports/apu-report"
import { APUReportPreview } from "@/components/apu-report-preview"

interface Insumo {
    id: number
    materialId?: number
    manoObraId?: number
    maquinariaId?: number
    insumoApuId?: number
    cantidad: number
    costoParcial: number
    material?: { clave: string; descripcion: string; costo: number; unidad: string }
    manoObra?: { clave: string; descripcion: string; salarioReal: number; unidad: string }
    maquinaria?: { clave: string; descripcion: string; costoHorario: number; unidad: string }
    insumoApu?: { codigo: string; descripcion: string; precioUnitario: number; unidad: string }
}

interface APU {
    id: number
    codigo: string
    descripcion: string
    unidad: string
    tipo: string
    costoDirecto: number
    porcentajeSobrecosto?: number
    factorEquipoSeguridad?: number
    precioUnitario: number
    insumos: Insumo[]
}

export default function APUEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [apu, setApu] = useState<APU | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [isEditingGeneral, setIsEditingGeneral] = useState(false)
    const [editGeneralData, setEditGeneralData] = useState({
        descripcion: "",
        unidad: "",
        porcentajeSobrecosto: 0
    })
    const [editingInsumoId, setEditingInsumoId] = useState<number | null>(null)
    const [isEditingSobrecosto, setIsEditingSobrecosto] = useState(false)
    const [isEditingEquipoSeguridad, setIsEditingEquipoSeguridad] = useState(false)
    const [tempSobrecosto, setTempSobrecosto] = useState("")
    const [tempEquipoSeguridad, setTempEquipoSeguridad] = useState("")
    const [tempCantidad, setTempCantidad] = useState("")

    // Catalogs for selection
    const [catalogs, setCatalogs] = useState<{
        materials: { id: number; clave: string; descripcion: string }[];
        labor: { id: number; clave: string; descripcion: string }[];
        equipment: { id: number; clave: string; descripcion: string }[];
        basicos: { id: number; clave: string; descripcion: string }[]
    }>({
        materials: [], labor: [], equipment: [], basicos: []
    })

    const [selection, setSelection] = useState({
        type: "material", // material, labor, equipment, basico
        id: "",
        cantidad: "1"
    })
    const [config, setConfig] = useState<any>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/apu/${id}`)
            const data = await res.json()
            setApu(data)

            // Set initial edit data
            setEditGeneralData({
                descripcion: data.descripcion,
                unidad: data.unidad,
                porcentajeSobrecosto: data.porcentajeSobrecosto !== undefined ? data.porcentajeSobrecosto * 100 : 25
            })

            // Load catalogs for the "Add" dialog
            const [mRes, lRes, eRes, bRes, cRes] = await Promise.all([
                fetch("/api/materiales"),
                fetch("/api/mano-de-obra"),
                fetch("/api/maquinaria"),
                fetch("/api/apu?tipo=BASICO"),
                fetch("/api/settings")
            ])
            const materials = await mRes.json()
            const labor = await lRes.json()
            const equipment = await eRes.json()
            const basicos = await bRes.json()
            const settings = await cRes.json()

            setCatalogs({
                materials,
                labor,
                equipment,
                basicos
            })
            setConfig(settings)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleSaveGeneral = async () => {
        try {
            const res = await fetch(`/api/apu/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    descripcion: editGeneralData.descripcion,
                    unidad: editGeneralData.unidad,
                    porcentajeSobrecosto: editGeneralData.porcentajeSobrecosto
                })
            })
            if (res.ok) {
                setIsEditingGeneral(false)
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleUpdateSobrecosto = async () => {
        try {
            const res = await fetch(`/api/apu/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    porcentajeSobrecosto: parseFloat(tempSobrecosto)
                })
            })
            if (res.ok) {
                setIsEditingSobrecosto(false)
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleUpdateEquipoSeguridad = async () => {
        try {
            const res = await fetch(`/api/apu/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    factorEquipoSeguridad: parseFloat(tempEquipoSeguridad)
                })
            })
            if (res.ok) {
                setIsEditingEquipoSeguridad(false)
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleAddInsumo = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selection.id) return

        const body: { cantidad: string; materialId?: number; manoObraId?: number; maquinariaId?: number; insumoApuId?: number } = { cantidad: selection.cantidad }
        if (selection.type === "material") body.materialId = parseInt(selection.id)
        if (selection.type === "labor") body.manoObraId = parseInt(selection.id)
        if (selection.type === "equipment") body.maquinariaId = parseInt(selection.id)
        if (selection.type === "basico") body.insumoApuId = parseInt(selection.id)

        try {
            const res = await fetch(`/api/apu/${id}/insumos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                setIsAddDialogOpen(false)
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleDeleteInsumo = async (insumoId: number) => {
        if (!confirm("¿Eliminar este insumo del análisis?")) return
        try {
            const res = await fetch(`/api/apu/${id}/insumos/${insumoId}`, {
                method: "DELETE"
            })
            if (res.ok) loadData()
        } catch (err) {
            console.error(err)
        }
    }

    const handleUpdateCantidad = async (insumoId: number) => {
        try {
            const res = await fetch(`/api/apu/${id}/insumos/${insumoId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cantidad: parseFloat(tempCantidad) })
            })
            if (res.ok) {
                setEditingInsumoId(null)
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleDuplicateInsumo = async (insumo: Insumo) => {
        const body: any = { cantidad: insumo.cantidad }
        if (insumo.materialId) body.materialId = insumo.materialId
        if (insumo.manoObraId) body.manoObraId = insumo.manoObraId
        if (insumo.maquinariaId) body.maquinariaId = insumo.maquinariaId
        if (insumo.insumoApuId) body.insumoApuId = insumo.insumoApuId

        try {
            const res = await fetch(`/api/apu/${id}/insumos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    if (loading || !apu) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Cargando editor...</span>
        </div>
    )

    // Grouping by type
    const grouped = {
        MAT: (apu.insumos || []).filter(i => i.materialId),
        MO: (apu.insumos || []).filter(i => i.manoObraId),
        EQP: (apu.insumos || []).filter(i => i.maquinariaId),
        BAS: (apu.insumos || []).filter(i => i.insumoApuId)
    }

    const subtotal = (items: Insumo[]) => items.reduce((acc, i) => acc + (i.costoParcial || 0), 0)

    const subtotalMO = subtotal(grouped.MO)
    const herramientaMenorFactor = 0.03
    const herramientaMenorImporte = Math.round((subtotalMO * herramientaMenorFactor) * 100) / 100

    const factorEquipoSeguridadValue = apu.factorEquipoSeguridad !== undefined ? apu.factorEquipoSeguridad : 0
    const equipoSeguridadImporte = Math.round((subtotalMO * factorEquipoSeguridadValue) * 100) / 100

    const costoDirectoTotal = (apu.costoDirecto || 0) + herramientaMenorImporte + equipoSeguridadImporte
    const factorSobrecosto = apu.porcentajeSobrecosto !== undefined ? apu.porcentajeSobrecosto : (config?.surchargeDefault !== undefined ? config.surchargeDefault : 0.25)
    const precioUnitario = Math.round((costoDirectoTotal * (1 + factorSobrecosto)) * 100) / 100

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/apu">
                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-xl transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-gradient">Detalle de Análisis</h1>
                <div className="flex-1" />
                <Button
                    variant="outline"
                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm font-bold rounded-xl"
                    onClick={() => setIsPreviewOpen(true)}
                >
                    <Eye className="h-4 w-4" /> Ver Reporte
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Datos Generales</CardTitle>
                        {!isEditingGeneral ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                    setEditGeneralData({
                                        descripcion: apu.descripcion,
                                        unidad: apu.unidad,
                                        porcentajeSobrecosto: (apu.porcentajeSobrecosto !== undefined ? apu.porcentajeSobrecosto : 0.25) * 100
                                    })
                                    setIsEditingGeneral(true)
                                }}
                            >
                                <Pencil className="h-3.5 w-3.5" /> Editar
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setIsEditingGeneral(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={handleSaveGeneral}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="col-span-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Código</label>
                                <div className="font-mono text-lg text-blue-600 font-bold">{apu.codigo}</div>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Descripción</label>
                                {isEditingGeneral ? (
                                    <Input
                                        value={editGeneralData.descripcion}
                                        onChange={(e) => setEditGeneralData({ ...editGeneralData, descripcion: e.target.value })}
                                        className="h-8 text-sm mt-1"
                                    />
                                ) : (
                                    <div className="text-sm font-medium text-slate-700">{apu.descripcion}</div>
                                )}
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Unidad</label>
                                {isEditingGeneral ? (
                                    <Input
                                        value={editGeneralData.unidad}
                                        onChange={(e) => setEditGeneralData({ ...editGeneralData, unidad: e.target.value })}
                                        className="h-8 text-sm mt-1"
                                    />
                                ) : (
                                    <div className="font-semibold text-slate-700">{apu.unidad}</div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Surcharge panel: hidden for BASICO-type APUs */}
                {apu.tipo !== "BASICO" && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Estructura de Precio (Sobrecosto)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-medium text-slate-500 uppercase">
                                <span>Concepto</span>
                                <span>Importe</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-600">Costo Directo</span>
                                    <span className="font-bold">${costoDirectoTotal.toFixed(2)}</span>
                                </div>
                                <p className="text-[10px] text-blue-500 font-medium italic mt-1">Incluye 3% de herramienta menor s/MO.</p>

                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-slate-600 text-xs text-blue-600 font-bold uppercase">Factor de Sobrecosto</span>
                                    {isEditingSobrecosto ? (
                                        <div className="flex items-center gap-1">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={tempSobrecosto}
                                                onChange={(e) => setTempSobrecosto(e.target.value)}
                                                className="h-7 w-20 text-right text-xs font-bold"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleUpdateSobrecosto()
                                                    if (e.key === "Escape") setIsEditingSobrecosto(false)
                                                }}
                                                onBlur={() => setIsEditingSobrecosto(false)}
                                            />
                                            <span className="text-xs font-bold text-slate-400">%</span>
                                        </div>
                                    ) : (
                                        <div
                                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border border-transparent hover:border-blue-200 transition-all font-black text-slate-900"
                                            onClick={() => {
                                                setTempSobrecosto(((apu.porcentajeSobrecosto !== undefined ? apu.porcentajeSobrecosto : 0.25) * 100).toString())
                                                setIsEditingSobrecosto(true)
                                            }}
                                        >
                                            {(factorSobrecosto * 100).toFixed(2)}%
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="font-black text-blue-600 uppercase text-xs">Precio Unitario</span>
                                    <span className="text-xl font-black text-blue-600 tracking-tighter">
                                        ${precioUnitario.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[9px] text-muted-foreground italic">* Los factores de sobrecosto se configuran a nivel presupuesto.</p>
                        </CardContent>
                    </Card>
                )}
                {/* For BASICO: show only costo directo card */}
                {apu.tipo === "BASICO" && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Costo del Básico</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-600">Subtotal Insumos</span>
                                    <span className="font-bold">${(apu.costoDirecto || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-100">
                                    <span className="font-black text-blue-600 uppercase text-xs">Costo Directo</span>
                                    <span className="text-xl font-black text-blue-600 tracking-tighter">
                                        ${(apu.costoDirecto || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[9px] text-muted-foreground italic">* Los básicos no llevan factor de sobrecosto.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 4 Secciones de Insumos */}
            <div className="space-y-8">
                {[
                    { id: "MAT", title: "1. Materiales", items: grouped.MAT, bg: "bg-amber-50", text: "text-amber-700" },
                    { id: "MO", title: "2. Mano de Obra", items: grouped.MO, bg: "bg-blue-50", text: "text-blue-700" },
                    { id: "EQP", title: "3. Equipo y Herramienta", items: grouped.EQP, bg: "bg-purple-50", text: "text-purple-700" },
                    { id: "BAS", title: "4. Básicos / Auxiliares", items: grouped.BAS, bg: "bg-emerald-50", text: "text-emerald-700" }
                ].map((section) => (
                    <Card key={section.id} className="overflow-hidden border-none shadow-sm">
                        <CardHeader className={cn("flex flex-row items-center justify-between py-3 px-6", section.bg)}>
                            <div className="flex items-center gap-3">
                                <div className={cn("h-2 w-2 rounded-full", section.text.replace("text", "bg"))} />
                                <CardTitle className={cn("text-sm font-black uppercase tracking-widest", section.text)}>
                                    {section.title}
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Subtotal</span>
                                    <span className={cn("text-sm font-black", section.text)}>
                                        ${(subtotal(section.items) + (section.id === "EQP" ? herramientaMenorImporte + equipoSeguridadImporte : 0)).toFixed(2)}
                                    </span>
                                </div>
                                {section.id === "MAT" && (
                                    <Button size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => {
                                        setSelection({ ...selection, type: "material" })
                                        setIsAddDialogOpen(true)
                                    }}>
                                        <Plus className="h-3 w-3 mr-1" /> Añadir
                                    </Button>
                                )}
                                {section.id === "MO" && (
                                    <Button size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => {
                                        setSelection({ ...selection, type: "labor" })
                                        setIsAddDialogOpen(true)
                                    }}>
                                        <Plus className="h-3 w-3 mr-1" /> Añadir
                                    </Button>
                                )}
                                {section.id === "EQP" && (
                                    <Button size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => {
                                        setSelection({ ...selection, type: "equipment" })
                                        setIsAddDialogOpen(true)
                                    }}>
                                        <Plus className="h-3 w-3 mr-1" /> Añadir
                                    </Button>
                                )}
                                {section.id === "BAS" && (
                                    <Button size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => {
                                        setSelection({ ...selection, type: "basico" })
                                        setIsAddDialogOpen(true)
                                    }}>
                                        <Plus className="h-3 w-3 mr-1" /> Añadir
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {section.items.length === 0 && section.id !== "EQP" ? (
                                <div className="p-8 text-center text-slate-400 group">
                                    <p className="text-xs font-medium italic">No hay insumos de esta categoría asignados.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3">Clave</th>
                                                <th className="px-6 py-3">Descripción / Unidad</th>
                                                <th className="px-6 py-3 text-right">Costo U.</th>
                                                <th className="px-6 py-3 text-right">Cantidad</th>
                                                <th className="px-6 py-3 text-right">Importe</th>
                                                <th className="px-6 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {section.id === "EQP" && (
                                                <>
                                                    <tr className="bg-purple-50/30">
                                                        <td className="px-6 py-4 font-mono text-purple-600 font-bold italic">HME-01</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-700 font-medium font-black italic">HERRAMIENTA MENOR (3% DE MO)</span>
                                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">(%)</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-slate-600">${subtotalMO.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">0.0300</td>
                                                        <td className="px-6 py-4 text-right font-black text-purple-700">${herramientaMenorImporte.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right"></td>
                                                    </tr>
                                                    <tr className="bg-blue-50/30">
                                                        <td className="px-6 py-4 font-mono text-blue-600 font-bold italic">EQS-01</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-700 font-medium font-black italic">EQUIPO DE SEGURIDAD ({(factorEquipoSeguridadValue * 100).toFixed(1)}% DE MO)</span>
                                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">(%)</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-slate-600">${subtotalMO.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            {isEditingEquipoSeguridad ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.1"
                                                                    className="w-20 px-2 py-1 text-right border rounded focus:ring-2 focus:ring-blue-500"
                                                                    value={tempEquipoSeguridad}
                                                                    onChange={(e) => setTempEquipoSeguridad(e.target.value)}
                                                                    onBlur={handleUpdateEquipoSeguridad}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleUpdateEquipoSeguridad()
                                                                        if (e.key === 'Escape') setIsEditingEquipoSeguridad(false)
                                                                    }}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded font-mono font-bold text-slate-700"
                                                                    onClick={() => {
                                                                        setTempEquipoSeguridad((factorEquipoSeguridadValue * 100).toFixed(2))
                                                                        setIsEditingEquipoSeguridad(true)
                                                                    }}
                                                                >
                                                                    {(factorEquipoSeguridadValue * 100).toFixed(4)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-blue-700">${equipoSeguridadImporte.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right"></td>
                                                    </tr>
                                                </>
                                            )}
                                            {section.items.map((item) => {
                                                const data = item.material || item.manoObra || item.maquinaria || (item as any).insumoApu
                                                if (!data) return null

                                                const clave = data.clave || (data as any).codigo
                                                const unidad = data.unidad || "UND"

                                                let costoU = 0
                                                if (item.material) costoU = item.material.costo
                                                else if (item.manoObra) costoU = item.manoObra.salarioReal
                                                else if (item.maquinaria) costoU = item.maquinaria.costoHorario
                                                // Use costoDirecto for básicos (not precioUnitario) to avoid showing the surcharge
                                                else if ((item as any).insumoApu) costoU = (item as any).insumoApu.costoDirecto || 0

                                                const importe = item.costoParcial || 0

                                                return (
                                                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-blue-600 font-bold">{clave}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-700 font-medium line-clamp-1">{data.descripcion}</span>
                                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{unidad}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-slate-600">${costoU.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            {editingInsumoId === item.id ? (
                                                                <Input
                                                                    type="number"
                                                                    step="0.00001"
                                                                    value={tempCantidad}
                                                                    onChange={(e) => setTempCantidad(e.target.value)}
                                                                    className="h-8 w-24 text-right ml-auto"
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") handleUpdateCantidad(item.id)
                                                                        if (e.key === "Escape") setEditingInsumoId(null)
                                                                    }}
                                                                    onBlur={() => setEditingInsumoId(null)}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-colors font-mono font-bold text-slate-700 inline-block min-w-[60px]"
                                                                    onClick={() => {
                                                                        setEditingInsumoId(item.id)
                                                                        setTempCantidad(item.cantidad.toString())
                                                                    }}
                                                                >
                                                                    {item.cantidad.toFixed(5)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-slate-900">${importe.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Duplicar insumo"
                                                                    onClick={() => handleDuplicateInsumo(item)}
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                </Button>
                                                                {editingInsumoId === item.id ? (
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600" onClick={() => handleUpdateCantidad(item.id)}>
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteInsumo(item.id)}>
                                                                        <Trash className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                title={`Añadir ${selection.type === "material" ? "Material" : selection.type === "labor" ? "Mano de Obra" : selection.type === "equipment" ? "Maquinaria" : "Básico"}`}
            >
                <div className="p-1">
                    <form onSubmit={handleAddInsumo} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Search className="h-4 w-4 text-blue-500" />
                                Buscar en Catálogo
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full flex h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none"
                                    value={selection.id}
                                    onChange={(e) => setSelection({ ...selection, id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione un insumo...</option>
                                    {selection.type === "material" && catalogs.materials.map(m => <option key={m.id} value={m.id}>{m.clave} - {m.descripcion}</option>)}
                                    {selection.type === "labor" && catalogs.labor.map(l => <option key={l.id} value={l.id}>{l.clave} - {l.descripcion}</option>)}
                                    {selection.type === "equipment" && catalogs.equipment.map(e => <option key={e.id} value={e.id}>{e.clave} - {e.descripcion}</option>)}
                                    {selection.type === "basico" && catalogs.basicos.map((b: any) => <option key={b.id} value={b.id}>{b.codigo} - {b.descripcion}</option>)}
                                </select>
                                <div className="absolute right-3 top-3 pointer-events-none">
                                    <ChevronLeft className="h-4 w-4 rotate-270 text-slate-400" />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic pl-1">
                                Seleccione el recurso que desea integrar al análisis de precio unitario.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-blue-500" />
                                Cantidad / Rendimiento
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.00001"
                                    value={selection.cantidad}
                                    onChange={(e) => setSelection({ ...selection, cantidad: e.target.value })}
                                    required
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono font-medium"
                                    placeholder="0.00000"
                                />
                                <div className="absolute right-3 top-3 pointer-events-none text-xs text-slate-400 font-bold">
                                    UND
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsAddDialogOpen(false)}
                                className="rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 px-6 transition-all hover:scale-[1.02]"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Agregar a la Matriz
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>
            <APUReportPreview
                apu={apu as any}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                config={config}
            />
        </div>
    )
}
