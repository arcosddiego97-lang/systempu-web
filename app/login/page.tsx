"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, LogIn, ShieldCheck, HardHat } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Error al iniciar sesión")
            }

            router.push("/dashboard")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2531&auto=format&fit=crop')] opacity-10 bg-cover bg-center pointer-events-none" />

            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500" />
                <CardHeader className="space-y-1 text-center pb-6 pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                            <HardHat className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
                        SYSTEM PU
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Sistema de Precios Unitarios
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider ml-1" htmlFor="email">
                                Correo Electrónico
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider ml-1" htmlFor="password">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                required
                            />
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <ShieldCheck className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                        <Button
                            className="w-full h-11 font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Accediendo...
                                </>
                            ) : (
                                <>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Iniciar Sesión
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t bg-slate-50/50 p-6">
                    <div className="text-center text-xs text-slate-400">
                        &copy; 2026 Arquitectura e Ingeniería
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
