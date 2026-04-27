import { Shield, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">
                WhatsMy<span className="text-primary">Name</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ferramentas profissionais de OSINT para investigação digital e análise de dados. 
              Localize pegadas digitais em centenas de plataformas.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Ferramentas</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Verificador de Usuário</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">OSINT de E-mail</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Acesso à API</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Extensão de Navegador</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Recursos</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Documentação</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Guia OSINT</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Empresa</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Serviço</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} WhatsMyName App. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
