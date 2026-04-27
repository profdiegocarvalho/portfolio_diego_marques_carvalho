import { MainLayout } from "./components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { Card, CardContent } from "@/src/components/ui/card";
import { Search, Loader2, CheckCircle2, XCircle, ExternalLink, ShieldAlert, Globe, Mail, Phone, Shield } from "lucide-react";
import { useSearchStore } from "./store/useSearchStore";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Toaster, toast } from 'sonner';

export default function App() {
  const { query, setQuery, isSearching, setIsSearching, progress, setProgress, results, addResult, resetSearch } = useSearchStore();
  const [currentPlatform, setCurrentPlatform] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email" | "phone" | "url" | "breach">("username");
  const [platforms, setPlatforms] = useState<{ username: any[], email: any[], phone: any[] }>({ username: [], email: [], phone: [] });
  const [variations, setVariations] = useState<string[]>([]);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await fetch('/api/platforms');
        const data = await response.json();
        setPlatforms(data);
      } catch (error) {
        console.error("Erro ao carregar plataformas:", error);
      }
    };
    fetchPlatforms();
  }, []);

  useEffect(() => {
    if (searchType === "username" && query.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/variations/${query}`);
          const data = await res.json();
          setVariations(data.variations || []);
        } catch (e) {
          console.error("Erro ao buscar variações");
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setVariations([]);
    }
  }, [query, searchType]);

  const handleSearch = async (overrideQuery?: string) => {
    const searchQuery = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (!searchQuery) return;
    
    resetSearch();
    setIsSearching(true);
    setProgress(0);

    let activePlatforms: any[] = [];
    let endpoint = "";
    let payloadKey = "";

    if (searchType === "username" || searchType === "email") {
      if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
        toast.warning("Você parece estar pesquisando uma URL. Tente a aba 'URL' para uma investigação direta.");
      }
    }

    if (searchType === "username") {
      activePlatforms = platforms.username;
      endpoint = '/api/check-username';
      payloadKey = 'username';
    } else if (searchType === "email") {
      activePlatforms = platforms.email;
      endpoint = '/api/check-email';
      payloadKey = 'email';
    } else if (searchType === "url") {
      // Direct URL check
      try {
        const urlObj = new URL(searchQuery);
        const hostname = urlObj.hostname.toLowerCase();
        
        // Suggest username tab for known social platforms
        const socialPlatforms = ['github.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com'];
        if (socialPlatforms.some(p => hostname.includes(p))) {
          toast.info("Dica: Para perfis de redes sociais, a aba 'Usuário' pode fornecer mais detalhes cruzados.");
        }
        
        new URL(searchQuery);
      } catch (e) {
        toast.error("URL inválida. Use o formato https://exemplo.com");
        return;
      }
      
      setIsSearching(true);
      setCurrentPlatform("Verificando URL...");
      try {
        const response = await fetch('/api/check-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: searchQuery }),
        });
        const data = await response.json();
        if (response.ok) {
          addResult({ 
            id: 'direct-url', 
            name: 'URL Direta', 
            category: 'Web', 
            url: searchQuery, 
            status: data.exists ? 'found' : 'not_found', 
            details: data.details 
          });
        } else {
          toast.error(data.error || "Erro ao validar URL");
        }
      } catch (e) {
        toast.error("Erro de conexão");
      }
      setIsSearching(false);
      setProgress(100);
      return;
    } else if (searchType === "breach") {
      // Breach check
      setIsSearching(true);
      setCurrentPlatform("Consultando bancos de vazamentos...");
      try {
        const response = await fetch('/api/check-breach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        });
        const data = await response.json();
        if (response.ok) {
          // Add the investigation sources as "Found" links if they exist
          if (data.sources) {
            data.sources.forEach((source: any) => {
              addResult({
                id: `source-${source.id}`,
                name: source.name,
                category: 'Fonte de Inteligência',
                url: source.url,
                status: 'found',
                details: { info: `Link direto para consulta em ${source.name}` }
              });
            });
          }

          if (data.exists) {
            data.breaches.forEach((breach: any) => {
              addResult({ 
                id: `breach-${breach.name}`, 
                name: breach.name, 
                category: 'Vazamento Confirmado', 
                url: '#', 
                status: 'error', 
                details: {
                  ...data.details,
                  date: breach.date,
                  count: breach.count,
                  categories: breach.categories,
                  risk: breach.risk,
                  source: breach.source,
                  matchType: "Vazamento Identificado"
                } 
              });
            });
            toast.error(`${data.breaches.length} vazamentos confirmados!`);
          } else {
            addResult({ 
              id: 'breach-none', 
              name: 'Repositórios de Vazamentos', 
              category: 'Segurança', 
              url: '#', 
              status: 'not_found',
              details: { message: data.message }
            });
            toast.success("Nenhum vazamento encontrado.");
          }
        } else {
          toast.error(data.error || "Erro ao consultar vazamentos");
        }
      } catch (e) {
        toast.error("Erro de conexão");
      }
      setIsSearching(false);
      setProgress(100);
      return;
    } else {
      // Sanitize phone number: remove non-numeric characters
      const sanitizedPhone = searchQuery.replace(/\D/g, '');
      if (sanitizedPhone.length < 8) {
        toast.error("Número de telefone inválido. Digite pelo menos 8 dígitos.");
        setIsSearching(false);
        return;
      }
      activePlatforms = platforms.phone;
      endpoint = '/api/check-phone';
      payloadKey = 'phone';
      // Use sanitized phone for the search
      const finalQuery = sanitizedPhone;
      
      // Update loop to use finalQuery
      for (let i = 0; i < activePlatforms.length; i++) {
        const platform = activePlatforms[i];
        setCurrentPlatform(platform.name);
        
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [payloadKey]: finalQuery, platform: platform.id }),
          });
          
          if (response.status === 429) {
            const data = await response.json();
            toast.error(data.error || "Limite de requisições atingido.");
            setIsSearching(false);
            return;
          }

          const data = await response.json();
          if (data.exists) {
            addResult({ ...platform, url: data.url, status: 'found', details: data.details });
          } else {
            addResult({ ...platform, url: data.url, status: 'not_found' });
          }
        } catch (error) {
          addResult({ ...platform, status: 'error' });
        }

        setProgress(((i + 1) / activePlatforms.length) * 100);
      }
      setIsSearching(false);
      setCurrentPlatform("Investigação Concluída");
      return;
    }

    for (let i = 0; i < activePlatforms.length; i++) {
      const platform = activePlatforms[i];
      setCurrentPlatform(platform.name);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [payloadKey]: searchQuery, platform: platform.id }),
        });
        
        if (response.status === 429) {
          const data = await response.json();
          toast.error(data.error || "Limite de requisições atingido.");
          setIsSearching(false);
          return; // Stop the entire search sweep
        }

        const data = await response.json();
        if (data.exists) {
          addResult({ ...platform, url: data.url, status: 'found', details: data.details });
        } else {
          addResult({ ...platform, url: data.url, status: 'not_found' });
        }
      } catch (error) {
        addResult({ ...platform, status: 'error' });
      }

      setProgress(((i + 1) / activePlatforms.length) * 100);
    }

    setIsSearching(false);
    setCurrentPlatform("Investigação Concluída");
  };

  const SearchButton = () => (
    <Button 
      size="lg" 
      className="h-12 text-lg font-semibold relative overflow-hidden"
      onClick={() => handleSearch()}
      disabled={isSearching || !query}
    >
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="searching"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center"
          >
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Investigando...</span>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center"
          >
            <span>{searchType === 'url' ? 'Validar URL' : 'Iniciar Investigação'}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isSearching && (
        <motion.div
          className="absolute inset-0 bg-primary/10"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </Button>
  );

  return (
    <MainLayout>
      <Toaster position="top-center" richColors />
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Descubra Pegadas <span className="text-primary">Digitais</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              A ferramenta profissional de OSINT para encontrar nomes de usuário, e-mails e telefones em centenas de plataformas. 
              Rápida, precisa e feita para investigadores.
            </p>
          </motion.div>

          <div className="mt-12 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-xl backdrop-blur-sm">
              <Tabs 
                defaultValue="username" 
                className="w-full"
                onValueChange={(v) => {
                  setSearchType(v as "username" | "email" | "phone" | "url" | "breach");
                  resetSearch();
                  setQuery("");
                }}
              >
                <TabsList className="grid w-full grid-cols-5 mb-8">
                  <TabsTrigger value="username" disabled={isSearching} className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Usuário
                  </TabsTrigger>
                  <TabsTrigger value="email" disabled={isSearching} className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </TabsTrigger>
                  <TabsTrigger value="phone" disabled={isSearching} className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </TabsTrigger>
                  <TabsTrigger value="url" disabled={isSearching} className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="breach" disabled={isSearching} className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Vazamentos
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="username" className="mt-0">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Digite o nome de usuário (ex: jdoe)..." 
                        className="h-12 pl-10 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                        disabled={isSearching}
                      />
                    </div>
                    
                    {variations.length > 0 && !isSearching && (
                      <div className="flex flex-wrap gap-2 py-2">
                        <span className="w-full text-left text-[10px] uppercase text-muted-foreground font-semibold">Sugestões de Variação:</span>
                        {variations.map((v) => (
                          <button
                            key={v}
                            onClick={() => {
                              setQuery(v);
                              handleSearch(v);
                            }}
                            className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <SearchButton />
                  </div>
                </TabsContent>

                <TabsContent value="email" className="mt-0">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        type="email"
                        placeholder="Digite o endereço de e-mail (ex: usuario@exemplo.com)..." 
                        className="h-12 pl-10 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                        disabled={isSearching}
                      />
                    </div>
                    <SearchButton />
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="mt-0">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        type="tel"
                        placeholder="Digite o número de telefone (ex: 5511999999999)..." 
                        className="h-12 pl-10 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                        disabled={isSearching}
                      />
                    </div>
                    <div className="text-left text-[10px] text-muted-foreground italic px-1">
                      Dica: Use o formato internacional (ex: 55 para Brasil). O sistema removerá símbolos automaticamente.
                    </div>
                    <SearchButton />
                  </div>
                </TabsContent>

                <TabsContent value="url" className="mt-0">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Digite a URL completa (ex: https://exemplo.com)..." 
                        className="h-12 pl-10 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                        disabled={isSearching}
                      />
                    </div>
                    <div className="text-left text-[10px] text-muted-foreground italic px-1">
                      Dica: Inclua o protocolo (http:// ou https://) para uma validação correta.
                    </div>
                    <SearchButton />
                  </div>
                </TabsContent>

                <TabsContent value="breach" className="mt-0">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Digite e-mail ou nome de usuário para checar vazamentos..." 
                        className="h-12 pl-10 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                        disabled={isSearching}
                      />
                    </div>
                    <div className="text-left text-[10px] text-muted-foreground italic px-1">
                      Dica: Pesquisamos em repositórios como HaveIBeenPwned, DeHashed e outros.
                    </div>
                    <SearchButton />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Progress Area */}
            <AnimatePresence>
              {(isSearching || progress > 0) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 w-full max-w-2xl overflow-hidden"
                >
                  <div className="rounded-xl border bg-card p-6 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-medium">{currentPlatform}</span>
                      <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Grid */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {results.map((result, index) => (
                    <motion.div
                      key={`${result.id}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`overflow-hidden border-l-4 ${
                        result.status === 'found' ? 'border-l-green-500' : 
                        result.status === 'not_found' ? 'border-l-muted' : 'border-l-red-500'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {result.category}
                              </span>
                              <span className="font-bold">{result.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {result.status === 'found' ? (
                                <>
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  <a 
                                    href={result.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="rounded-full p-1 hover:bg-muted transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </>
                              ) : result.status === 'not_found' ? (
                                <XCircle className="h-5 w-5 text-muted-foreground opacity-50" />
                              ) : (
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          </div>

                          {(result.status === 'found' || result.status === 'error') && result.details && (
                            <div className="mt-3 space-y-2 border-t pt-3 text-left text-sm">
                              {/* Confidence Header (if available) */}
                              {result.details.confidence && (
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Análise OSINT</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    result.details.confidence === 'Alta' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    Confiança {result.details.confidence}
                                  </span>
                                </div>
                              )}

                              {/* Generic Details Display */}
                              <div className="grid grid-cols-1 gap-2">
                                {Object.entries(result.details).map(([key, value]) => {
                                  if (key === 'confidence' || key === 'source') return null;
                                  
                                  // Format keys for display
                                  const labelMap: Record<string, string> = {
                                    owner: 'Proprietário',
                                    bio: 'Biografia',
                                    followers: 'Seguidores',
                                    activity: 'Atividade',
                                    location: 'Localização',
                                    carrier: 'Operadora',
                                    type: 'Tipo',
                                    joined: 'Entrou em',
                                    verified: 'Verificado',
                                    privacy: 'Privacidade',
                                    posts: 'Postagens',
                                    matchType: 'Tipo de Correspondência',
                                    date: 'Data do Vazamento',
                                    count: 'Contas Afetadas',
                                    risk: 'Nível de Risco',
                                    source: 'Fonte da Informação'
                                  };
                                  
                                  const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);

                                  if (key === 'categories') {
                                    return (
                                      <div key={key} className="mt-2 space-y-2">
                                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Dados Expostos por Categoria</span>
                                        <div className="grid grid-cols-1 gap-2">
                                          {Object.entries(value as Record<string, string[]>).map(([cat, items]) => (
                                            <div key={cat} className="rounded border bg-muted/30 p-2">
                                              <span className="text-[9px] font-bold uppercase text-primary/70">{cat}</span>
                                              <div className="mt-1 flex flex-wrap gap-1">
                                                {items.map(item => (
                                                  <span key={item} className="rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                                                    {item}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }

                                  const displayValue = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value);

                                  return (
                                    <div key={key} className={`flex flex-col ${key === 'risk' ? 'bg-red-50 p-1.5 rounded border border-red-100' : ''}`}>
                                      <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
                                      <span className={`font-medium line-clamp-2 ${key === 'risk' ? (value === 'Crítico' ? 'text-red-700 font-bold' : 'text-orange-700 font-bold') : 'text-primary'}`}>{displayValue}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {result.details.source && (
                                <div className="pt-1 text-[9px] text-muted-foreground italic">
                                  Fonte: {result.details.source}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            <p className="mt-8 text-xs text-muted-foreground">
              Ao pesquisar, você concorda com nossos Termos de Serviço e Política de Privacidade.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
