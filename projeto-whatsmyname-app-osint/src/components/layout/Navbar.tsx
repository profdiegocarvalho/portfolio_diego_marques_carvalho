import { Search, Shield, Info, Moon, Sun, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";

export function Navbar() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            WhatsMy<span className="text-primary">Name</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium transition-colors hover:text-primary">Início</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">OSINT de E-mail</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Sobre</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">FAQ</a>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="rounded-full"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="outline" className="hidden md:flex">
            Entrar
          </Button>
          <Button className="md:hidden" variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
