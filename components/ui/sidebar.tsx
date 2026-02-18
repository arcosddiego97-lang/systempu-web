"use client"

import * as React from "react"
import { PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const SidebarContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(true)
    return (
        <SidebarContext.Provider value={{ open, setOpen }}>
            <div className="flex min-h-screen w-full">{children}</div>
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = React.useContext(SidebarContext)
    if (!context) throw new Error("useSidebar must be used within a SidebarProvider")
    return context
}

export function SidebarTrigger({ className }: { className?: string }) {
    const { open, setOpen } = useSidebar()
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", className)}
            onClick={() => setOpen(!open)}
        >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    )
}
