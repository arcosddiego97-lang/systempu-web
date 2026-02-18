"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, FileText, Hammer, TrendingUp, ArrowUpRight, CheckCircle2 } from "lucide-react"

export default function DashboardSummary() {
    const [stats, setStats] = useState({
        projects: 0,
        apus: 0,
        materials: 0,
        totalInvestment: 0
    })

    useEffect(() => {
        Promise.all([
            fetch("/api/projects").then(res => res.json()).catch(() => []),
            fetch("/api/apu").then(res => res.json()).catch(() => []),
            fetch("/api/materiales").then(res => res.json()).catch(() => []),
            fetch("/api/budgets").then(res => res.json()).catch(() => []),
        ]).then(([p, a, m, b]) => {
            setStats({
                projects: (p || []).length,
                apus: (a || []).length,
                materials: (m || []).length,
                totalInvestment: (b || []).reduce((acc: number, curr: { montoTotal?: number }) => acc + (curr.montoTotal || 0), 0)
            })
        })
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Panel de Control</h1>
                <p className="text-muted-foreground">Bienvenido al centro operativo de APU México. Gestión integral de costos y proyectos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="card-hover border-none overflow-hidden gradient-blue" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Proyectos Activos</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Briefcase className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.projects}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" /> +2 este mes
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-none overflow-hidden gradient-indigo" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Matrices APU</CardTitle>
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <FileText className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.apus}</div>
                        <p className="text-xs text-muted-foreground mt-1">Análisis de precios unitarios</p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-none overflow-hidden gradient-slate" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Insumos en Catálogo</CardTitle>
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <Hammer className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.materials}</div>
                        <p className="text-xs text-muted-foreground mt-1">Materiales, mano de obra y equipo</p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-none overflow-hidden bg-blue-600 text-white" style={{ boxShadow: 'var(--shadow-blue-lg)' }}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider opacity-80">Inversión Total</CardTitle>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-blue-500-30)' }}>
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">${stats.totalInvestment.toLocaleString()}</div>
                        <p className="text-xs opacity-70 mt-1">Suma total de presupuestos</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-md backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
                    <CardHeader className="border-b border-slate-100" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
                        <CardTitle className="text-lg font-bold">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="py-10 text-center">
                        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <FileText className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">No hay actividad reciente para mostrar.</p>
                        <p className="text-xs text-slate-400">Las actualizaciones de tus proyectos aparecerán aquí.</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="border-b border-slate-100" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
                        <CardTitle className="text-lg font-bold">Cumplimiento Normativo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            <div className="p-4 flex items-center justify-between transition-colors hover:bg-slate-50">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">LOPSRM Art. 191 (FASAR)</p>
                                    <p className="text-xs text-muted-foreground">Cálculo de factor de salario real</p>
                                </div>
                                <div className="flex items-center text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Activo
                                </div>
                            </div>
                            <div className="p-4 flex items-center justify-between transition-colors hover:bg-slate-50">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">Costos Indirectos (Cascada)</p>
                                    <p className="text-xs text-muted-foreground">Utilidad, Financiamiento y Cargos</p>
                                </div>
                                <div className="flex items-center text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Activo
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
