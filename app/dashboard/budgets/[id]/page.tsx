"use client"

import React, { useEffect, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ChevronLeft, Trash, LayoutGrid } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Budget {
    id: number
    nombre: string
    descripcion: string
    porcentajeIndirectos: number
    porcentajeFinanciamiento: number
    porcentajeUtilidad: number
    porcentajeCargosAdicionales: number
    proyecto: { nombre: string }
    conceptos: Concepto[]
}

interface Concepto {
    id: number
    apu: {
        codigo: string
        descripcion: string
        unidad: string
        precioUnitario: number | null
    }
    cantidad: number
    importe: number | null
}

export default function BudgetEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [budget, setBudget] = useState<Budget | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [apuCatalog, setApuCatalog] = useState<{ id: number; codigo: string; descripcion: string }[]>([])
    const [activeTab, setActiveTab] = useState("matriz")

    const [indirects, setIndirects] = useState({
        indirectos: 0.15,
        financiamiento: 0.02,
        utilidad: 0.10,
        cargosAdicionales: 0.005
    })

    const [selection, setSelection] = useState({
        apuId: "",
        cantidad: "1"
    })

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const bRes = await fetch(`/api/budgets/${id}`)
            const data = await bRes.json()
            setBudget(data)
            setIndirects({
                indirectos: data.porcentajeIndirectos,
                financiamiento: data.porcentajeFinanciamiento,
                utilidad: data.porcentajeUtilidad,
                cargosAdicionales: data.porcentajeCargosAdicionales
            })

            const aRes = await fetch("/api/apu")
            setApuCatalog(await aRes.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        loadData()
    }, [loadData])

    const directCost = budget?.conceptos?.reduce((acc: number, c: Concepto) => acc + (c.importe || 0), 0) || 0
    const indirectAmount = directCost * indirects.indirectos
    const subtotal1 = directCost + indirectAmount
    const financingAmount = subtotal1 * indirects.financiamiento
    const subtotal2 = subtotal1 + financingAmount
    const profitAmount = subtotal2 * indirects.utilidad
    const subtotal3 = subtotal2 + profitAmount
    const total = subtotal3 + (subtotal3 * indirects.cargosAdicionales)

    const handleAddConcepto = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selection.apuId) return
        try {
            const res = await fetch(`/api/budgets/${id}/conceptos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apuId: parseInt(selection.apuId),
                    cantidad: parseFloat(selection.cantidad)
                })
            })
            if (res.ok) {
                setIsAddDialogOpen(false)
                setSelection({ apuId: "", cantidad: "1" })
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/budgets/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(indirects)
            })
            if (res.ok) {
                const updated = await res.json()
                setBudget({ ...budget!, ...updated })
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div>Cargando presupuesto...</div>
    if (!budget) return <div>Presupuesto no encontrado.</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/budgets">
                    <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Estructura del Presupuesto</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Información General</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <h2 className="text-2xl font-bold">{budget.nombre}</h2>
                        <p className="text-muted-foreground">{budget.proyecto?.nombre || "Cargando proyecto..."}</p>
                    </CardContent>
                </Card>

                <Card className="border-primary border-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monto Total Integrado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Suma de conceptos + indirectos + utilidad</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="matriz">Matriz de Conceptos</TabsTrigger>
                    <TabsTrigger value="indirectos">Cargos Indirectos</TabsTrigger>
                </TabsList>

                <TabsContent value="matriz">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="h-5 w-5 text-primary" />
                                <CardTitle>Catálogo de Conceptos (WBS)</CardTitle>
                            </div>
                            <Button onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Agregar Concepto
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Código</th>
                                            <th className="px-4 py-3 font-medium">Descripción</th>
                                            <th className="px-4 py-3 font-medium">Unidad</th>
                                            <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                                            <th className="px-4 py-3 font-medium text-right">P. Unitario</th>
                                            <th className="px-4 py-3 font-medium text-right">Importe</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(budget?.conceptos || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground italic">
                                                    No hay conceptos en este presupuesto. Agregue uno desde el catálogo de APUs.
                                                </td>
                                            </tr>
                                        ) : (budget?.conceptos || []).map((c: Concepto) => (
                                            <tr key={c.id} className="border-b transition-colors hover:bg-muted/30">
                                                <td className="px-4 py-3 font-mono font-bold text-xs">{c.apu.codigo}</td>
                                                <td className="px-4 py-3 max-w-md truncate">{c.apu.descripcion}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{c.apu.unidad}</td>
                                                <td className="px-4 py-3 text-right">{c.cantidad.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">${(c.apu.precioUnitario || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-primary">${(c.importe || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"><Trash className="h-4 w-4" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="indirectos">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuración de Porcentajes</CardTitle>
                                <CardDescription>Ajuste los valores de sobrecosto para la licitación.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateSettings} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Indirectos (%)</label>
                                        <Input
                                            type="number" step="0.01"
                                            value={(indirects.indirectos * 100).toFixed(2)}
                                            onChange={e => setIndirects({ ...indirects, indirectos: parseFloat(e.target.value) / 100 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Costo por Financiamiento (%)</label>
                                        <Input
                                            type="number" step="0.01"
                                            value={(indirects.financiamiento * 100).toFixed(2)}
                                            onChange={e => setIndirects({ ...indirects, financiamiento: parseFloat(e.target.value) / 100 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cargo por Utilidad (%)</label>
                                        <Input
                                            type="number" step="0.01"
                                            value={(indirects.utilidad * 100).toFixed(2)}
                                            onChange={e => setIndirects({ ...indirects, utilidad: parseFloat(e.target.value) / 100 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cargos Adicionales (Licitación) (%)</label>
                                        <Input
                                            type="number" step="0.001"
                                            value={(indirects.cargosAdicionales * 100).toFixed(3)}
                                            onChange={e => setIndirects({ ...indirects, cargosAdicionales: parseFloat(e.target.value) / 100 })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                                        Guardar Parámetros de Sobrecosto
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/20">
                            <CardHeader>
                                <CardTitle>Resumen de Factor de Sobrecosto</CardTitle>
                                <CardDescription>Cálculo en cascada según normativa.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-dashed py-2">
                                    <span className="text-muted-foreground">Costo Directo Base</span>
                                    <span className="font-bold">${directCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2">
                                    <span className="text-muted-foreground">Indirectos ({(indirects.indirectos * 100).toFixed(2)}%)</span>
                                    <span>${indirectAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2">
                                    <span className="text-muted-foreground">Financiamiento ({(indirects.financiamiento * 100).toFixed(2)}%)</span>
                                    <span>${financingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2">
                                    <span className="text-muted-foreground">Utilidad ({(indirects.utilidad * 100).toFixed(2)}%)</span>
                                    <span>${profitAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2">
                                    <span className="text-muted-foreground">Cargos Adicionales ({(indirects.cargosAdicionales * 100).toFixed(3)}%)</span>
                                    <span>${(subtotal3 * indirects.cargosAdicionales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between pt-6 border-t border-primary/20">
                                    <span className="font-bold text-xl">Monto Total</span>
                                    <div className="text-right">
                                        <div className="font-bold text-2xl text-primary">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Moneda Nacional MXN</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} title="Agregar Concepto de Catálogo">
                <form onSubmit={handleAddConcepto} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Análisis (APU)</label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={selection.apuId}
                            onChange={e => setSelection({ ...selection, apuId: e.target.value })}
                            required
                        >
                            <option value="">Seleccione APU...</option>
                            {(apuCatalog || []).map((a: any) => <option key={a.id} value={a.id}>{a.codigo} - {a.descripcion}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cantidad (Volumen de Obra)</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={selection.cantidad}
                            onChange={e => setSelection({ ...selection, cantidad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">Agregar al Presupuesto</Button>
                    </div>
                </form>
            </Dialog>
        </div>
    )
}
