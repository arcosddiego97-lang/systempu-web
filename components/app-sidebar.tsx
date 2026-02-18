"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    FolderOpen,
    Hammer,
    Users,
    Truck,
    Settings,
    FileText,
    Calculator,
    Zap,
    Box,
    LogOut,
    UserCog
} from "lucide-react"

const sidebarItems = [
    {
        title: "Resumen",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Proyectos",
        href: "/dashboard/projects",
        icon: FolderOpen,
    },
    {
        title: "Análisis de Precios",
        href: "/dashboard/apu",
        icon: Zap,
    },
    {
        title: "Análisis de Básicos",
        href: "/dashboard/basicos",
        icon: Box,
    },
    {
        title: "Materiales",
        href: "/dashboard/materials",
        icon: Hammer,
    },
    {
        title: "Mano de Obra",
        href: "/dashboard/labor",
        icon: Users,
    },
    {
        title: "Maquinaria",
        href: "/dashboard/equipment",
        icon: Truck,
    },
    {
        title: "Reportes",
        href: "/dashboard/reports",
        icon: FileText,
    },
    {
        title: "Configuración",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user)
            })
            .catch(err => console.error(err))
    }, [])

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" })
        router.push("/login")
        router.refresh()
    }

    return (
        <div className="flex h-full w-72 flex-col glass border-r shadow-sidebar z-40"
            style={{ borderColor: 'var(--border-slate-200-30)' }}>
            <div className="flex h-20 items-center px-8 border-b" style={{ borderColor: 'var(--border-slate-200-40)' }}>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center"
                        style={{ boxShadow: 'var(--shadow-blue)' }}>
                        <Calculator className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <span className="font-black text-xl tracking-tighter block leading-none">APU MÉXICO</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-blue-500 opacity-80">Software de Costos</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-8">
                <div className="px-4 mb-4">
                    <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Menú Principal</p>
                    <ul className="space-y-1.5">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:translate-x-1"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-500")} />
                                        {item.title}
                                    </Link>
                                </li>
                            )
                        })}

                        {/* Admin Only Link */}
                        {user?.role === "ADMIN" && (
                            <li>
                                <Link
                                    href="/dashboard/users"
                                    className={cn(
                                        "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300",
                                        pathname === "/dashboard/users"
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20 translate-x-1"
                                            : "text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1"
                                    )}
                                >
                                    <UserCog className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", pathname === "/dashboard/users" ? "text-white" : "text-slate-400 group-hover:text-purple-500")} />
                                    Usuarios
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </nav>

            <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
                {user ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold border border-blue-100">
                                {user.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
                                <div className="flex items-center gap-1">
                                    <div className={cn("h-1.5 w-1.5 rounded-full", user.role === "ADMIN" ? "bg-purple-500" : "bg-blue-500")} />
                                    <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tight">
                                        {user.role === "ADMIN" ? "Administrador" : "Capturista"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full justify-center gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border-slate-200 rounded-xl h-9 transition-all text-xs font-bold shadow-sm"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Cerrar Sesión
                        </Button>
                    </div>
                ) : (
                    <div className="mb-4">
                        <Link href="/login">
                            <Button className="w-full bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800">
                                Iniciar Sesión
                            </Button>
                        </Link>
                    </div>
                )}
                {/* <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 APU MÉXICO</p> */}
            </div>
        </div>
    )
}
