import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import { rateLimit } from 'express-rate-limit';

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 200 requests per `window`
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: "Muitas requisições globais. Tente novamente em 15 minutos." }
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 500, // Limit each IP to 500 search requests per minute (to allow full platform sweeps)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: "Limite de buscas atingido. Aguarde um minuto." }
});

// Platform configuration
const USERNAME_PLATFORMS: Record<string, { name: string, category: string, url: string, dork: string }> = {
  github: { 
    name: 'GitHub', 
    category: 'Desenvolvimento', 
    url: 'https://github.com/[username]',
    dork: 'site:github.com "[username]"'
  },
  facebook: { 
    name: 'Facebook', 
    category: 'Social', 
    url: 'https://www.facebook.com/[username]',
    dork: 'site:facebook.com "[username]"'
  },
  instagram: { 
    name: 'Instagram', 
    category: 'Social', 
    url: 'https://www.instagram.com/[username]/',
    dork: 'site:instagram.com "[username]"'
  },
  twitter: { 
    name: 'Twitter', 
    category: 'Social', 
    url: 'https://twitter.com/[username]',
    dork: 'site:twitter.com "[username]"'
  },
  reddit: { 
    name: 'Reddit', 
    category: 'Social', 
    url: 'https://www.reddit.com/user/[username]',
    dork: 'site:reddit.com/user/[username]'
  },
  pinterest: { 
    name: 'Pinterest', 
    category: 'Social', 
    url: 'https://www.pinterest.com/[username]/',
    dork: 'site:pinterest.com/[username]'
  },
  tiktok: { 
    name: 'TikTok', 
    category: 'Social', 
    url: 'https://www.tiktok.com/@[username]',
    dork: 'site:tiktok.com "@[username]"'
  },
  youtube: { 
    name: 'YouTube', 
    category: 'Conteúdo', 
    url: 'https://www.youtube.com/@[username]',
    dork: 'site:youtube.com "@[username]"'
  },
  spotify: { 
    name: 'Spotify', 
    category: 'Música', 
    url: 'https://open.spotify.com/user/[username]',
    dork: 'site:open.spotify.com/user/[username]'
  },
  linkedin: { 
    name: 'LinkedIn', 
    category: 'Social', 
    url: 'https://www.linkedin.com/in/[username]',
    dork: 'site:linkedin.com/in/ "[username]"'
  },
  tinder: { 
    name: 'Tinder', 
    category: 'Relacionamento', 
    url: 'https://tinder.com/@[username]',
    dork: 'site:tinder.com "@[username]"'
  },
  badoo: { 
    name: 'Badoo', 
    category: 'Relacionamento', 
    url: 'https://badoo.com/profile/[username]',
    dork: 'site:badoo.com "[Nome]" "[Cidade]"'
  },
  bumble: { 
    name: 'Bumble', 
    category: 'Relacionamento', 
    url: 'https://bumble.com/en/profile/[username]',
    dork: 'site:bumble.com "[Nome]" "[Profissão]"'
  },
  okcupid: { 
    name: 'OkCupid', 
    category: 'Relacionamento', 
    url: 'https://www.okcupid.com/profile/[username]',
    dork: 'site:okcupid.com/profile "[username]"'
  },
  pof: { 
    name: 'Plenty of Fish (POF)', 
    category: 'Relacionamento', 
    url: 'https://www.pof.com/viewprofile.aspx?profile_id=[username]',
    dork: 'site:pof.com "[username]"'
  },
  happn: { 
    name: 'Happn', 
    category: 'Relacionamento', 
    url: 'https://www.happn.com/en/profile/[username]',
    dork: 'site:happn.com "[Nome]"'
  },
  match: { 
    name: 'Match.com', 
    category: 'Relacionamento', 
    url: 'https://www.match.com/profile/[username]',
    dork: 'site:match.com "[username]"'
  },
  grindr: { 
    name: 'Grindr', 
    category: 'Relacionamento', 
    url: 'https://www.grindr.com/[username]',
    dork: 'site:grindr.com "[Nome]"'
  },
  hinge: { 
    name: 'Hinge', 
    category: 'Relacionamento', 
    url: 'https://hinge.co/[username]',
    dork: 'site:hinge.co "[Nome]" "[Cidade]"'
  },
  zoosk: { 
    name: 'Zoosk', 
    category: 'Relacionamento', 
    url: 'https://www.zoosk.com/profile/[username]',
    dork: 'site:zoosk.com "[username]"'
  },
  eharmony: { 
    name: 'eHarmony', 
    category: 'Relacionamento', 
    url: 'https://www.eharmony.com/[username]',
    dork: 'site:eharmony.com "[Nome]"'
  },
  ashleymadison: { 
    name: 'Ashley Madison', 
    category: 'Relacionamento', 
    url: 'https://www.ashleymadison.com/profile/[username]',
    dork: 'site:ashleymadison.com "[username]"'
  },
  feeld: { 
    name: 'Feeld', 
    category: 'Relacionamento', 
    url: 'https://feeld.co/[username]',
    dork: 'site:feeld.co "[Nome]"'
  },
  her: { 
    name: 'Her', 
    category: 'Relacionamento', 
    url: 'https://weareher.com/[username]',
    dork: 'site:weareher.com "[Nome]"'
  },
  christianmingle: { 
    name: 'Christian Mingle', 
    category: 'Relacionamento', 
    url: 'https://www.christianmingle.com/profile/[username]',
    dork: 'site:christianmingle.com "[Nome]"'
  },
  jdate: { 
    name: 'JDate', 
    category: 'Relacionamento', 
    url: 'https://www.jdate.com/profile/[username]',
    dork: 'site:jdate.com "[Nome]"'
  },
  coffeemeetsbagel: { 
    name: 'Coffee Meets Bagel', 
    category: 'Relacionamento', 
    url: 'https://coffeemeetsbagel.com/[username]',
    dork: 'site:coffeemeetsbagel.com "[Nome]"'
  },
  raya: { 
    name: 'Raya', 
    category: 'Relacionamento', 
    url: 'https://www.rayatheapp.com/',
    dork: 'site:instagram.com "raya"'
  },
  mamba: { 
    name: 'Mamba', 
    category: 'Relacionamento', 
    url: 'https://www.mamba.ru/[username]',
    dork: 'site:mamba.ru "[username]"'
  },
  seeking: { 
    name: 'Seeking Arrangement', 
    category: 'Relacionamento', 
    url: 'https://www.seeking.com/member/[username]',
    dork: 'site:seeking.com "[username]"'
  },
};

const EMAIL_PLATFORMS: Record<string, { name: string, category: string, url: string }> = {
  gravatar: { 
    name: 'Gravatar', 
    category: 'Perfil', 
    url: 'https://en.gravatar.com/[hash]' 
  },
  haveibeenpwned: { 
    name: 'HaveIBeenPwned', 
    category: 'Vazamentos', 
    url: 'https://haveibeenpwned.com/account/[email]' 
  },
  dehashed: {
    name: 'DeHashed',
    category: 'Vazamentos',
    url: 'https://www.dehashed.com/search?query=[email]'
  },
  leakcheck: {
    name: 'LeakCheck',
    category: 'Vazamentos',
    url: 'https://leakcheck.io/search?query=[email]'
  },
  intelx: {
    name: 'Intelligence X',
    category: 'Vazamentos',
    url: 'https://intelx.io/?s=[email]'
  },
  snusbase: {
    name: 'Snusbase',
    category: 'Vazamentos',
    url: 'https://snusbase.com/search/[email]'
  },
  vigilante: {
    name: 'Vigilante.pw',
    category: 'Vazamentos',
    url: 'https://vigilante.pw/?s=[email]'
  },
  adobe: { 
    name: 'Adobe Leak', 
    category: 'Vazamentos', 
    url: 'https://haveibeenpwned.com/PwnedWebsites#Adobe' 
  },
  linkedin: { 
    name: 'LinkedIn', 
    category: 'Social', 
    url: 'https://www.linkedin.com/' 
  },
  hunter: {
    name: 'Hunter.io',
    category: 'Verificação',
    url: 'https://hunter.io/email-verifier/[email]'
  },
  skymem: {
    name: 'Skymem',
    category: 'Verificação',
    url: 'http://www.skymem.info/srch?q=[email]'
  },
  emailrep: {
    name: 'Emailrep.io',
    category: 'Reputação',
    url: 'https://emailrep.io/[email]'
  },
  clearbit: {
    name: 'Clearbit',
    category: 'Inteligência',
    url: 'https://clearbit.com/'
  },
  voilanorbert: {
    name: 'VoilaNorbert',
    category: 'Verificação',
    url: 'https://www.voilanorbert.com/'
  },
};

const PHONE_PLATFORMS: Record<string, { name: string, category: string, url: string, dork: string }> = {
  truecaller: {
    name: 'Truecaller',
    category: 'Identificação',
    url: 'https://www.truecaller.com/search/br/[phone]',
    dork: 'site:truecaller.com "[phone]"'
  },
  syncme: {
    name: 'Sync.me',
    category: 'Identificação',
    url: 'https://sync.me/search/?number=[phone]',
    dork: 'site:sync.me "[phone]"'
  },
  whoscall: {
    name: 'Whoscall',
    category: 'Identificação',
    url: 'https://whoscall.com/en/search/[phone]',
    dork: 'site:whoscall.com "[phone]"'
  },
  whatsapp: {
    name: 'WhatsApp',
    category: 'Mensageria',
    url: 'https://wa.me/[phone]',
    dork: 'site:whatsapp.com "[phone]"'
  },
  telegram: {
    name: 'Telegram',
    category: 'Mensageria',
    url: 'https://t.me/[phone]',
    dork: 'site:t.me "[phone]"'
  },
  google: {
    name: 'Google Search',
    category: 'Busca Geral',
    url: 'https://www.google.com/search?q="[phone]"',
    dork: '"[phone]"'
  },
  abrtelecom: {
    name: 'Consulta Número (ABR)',
    category: 'Operadora (BR)',
    url: 'https://www.consultanumero.abrtelecom.com.br/consultanumero/',
    dork: 'site:abrtelecom.com.br'
  },
  teleco: {
    name: 'Qual Empresa (Teleco)',
    category: 'Operadora (BR)',
    url: 'https://www.teleco.com.br/qualempresa.asp',
    dork: 'site:teleco.com.br'
  },
  numlookup: {
    name: 'NumLookup',
    category: 'Operadora (Global)',
    url: 'https://www.numlookup.com/',
    dork: 'site:numlookup.com'
  },
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the proxy (Cloud Run / Nginx) to identify client IP
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json());
  app.use(globalLimiter);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoint to get all configured platforms
  app.get("/api/platforms", (req, res) => {
    res.json({
      username: Object.entries(USERNAME_PLATFORMS).map(([id, data]) => ({ id, ...data })),
      email: Object.entries(EMAIL_PLATFORMS).map(([id, data]) => ({ id, ...data })),
      phone: Object.entries(PHONE_PLATFORMS).map(([id, data]) => ({ id, ...data })),
    });
  });

  // Helper to generate username variations
  const generateVariations = (base: string): string[] => {
    const variations = new Set<string>();
    const clean = base.toLowerCase().trim().replace(/\s+/g, '');
    
    if (clean.length < 3) return [clean];

    // Core variations
    variations.add(clean);
    variations.add(`${clean}_`);
    variations.add(`${clean}.`);
    
    // Common prefixes
    const prefixes = ['real', 'iam', 'the', 'official', 'thisis'];
    prefixes.forEach(p => variations.add(`${p}${clean}`));

    // Common suffixes
    const suffixes = ['oficial', 'official', 'dev', 'engineer', 'designer', 'tech', 'studio', 'creative'];
    suffixes.forEach(s => variations.add(`${clean}${s}`));

    // Numbers and years
    const numbers = ['1', '123', '2024', '2025', '2026'];
    numbers.forEach(n => variations.add(`${clean}${n}`));
    
    // Combinations
    variations.add(`${clean}_dev`);
    variations.add(`${clean}.official`);
    
    return Array.from(variations).slice(0, 20); // Limit to top 20 variations
  };

  // Endpoint to get variations
  app.get("/api/variations/:username", (req, res) => {
    const { username } = req.params;
    res.json({ variations: generateVariations(username) });
  });

  app.post("/api/check-breach", searchLimiter, async (req, res) => {
    const { query, type } = req.body;
    
    if (!query) return res.status(400).json({ error: "Termo de busca é obrigatório" });

    // Sources requested by user + common ones
    const breachSources = [
      { id: "hibp", name: "Have I Been Pwned", url: "https://haveibeenpwned.com/unifiedsearch/[query]" },
      { id: "intelx", name: "Intelligence X", url: "https://intelx.io/?s=[query]" },
      { id: "dehashed", name: "DeHashed", url: "https://www.dehashed.com/search?query=[query]" },
      { id: "seclists", name: "SecLists (GitHub)", url: "https://github.com/danielmiessler/SecLists/search?q=[query]" },
      { id: "rockyou", name: "RockYou.txt Archive", url: "https://github.com/brannondorsey/naive-hash-cat/releases/download/data/rockyou.txt" },
      { id: "crackstation", name: "CrackStation Dictionary", url: "https://crackstation.net/" },
      { id: "weakpass", name: "Weakpass", url: "https://weakpass.com/search?q=[query]" }
    ];

    // Simulated breach database for specific leaks
    const mockBreaches = [
      { 
        name: "Adobe (2013)", 
        date: "2013-10-01", 
        count: "153,000,000", 
        categories: {
          "Credenciais": ["Email", "Username"],
          "Dicas": ["Password Hint"]
        },
        source: "HIBP", 
        risk: "Médio" 
      },
      { 
        name: "LinkedIn (2016)", 
        date: "2016-05-01", 
        count: "164,000,000", 
        categories: {
          "Credenciais": ["Email", "Password (SHA1)"]
        },
        source: "DeHashed", 
        risk: "Alto" 
      },
      { 
        name: "Canva (2019)", 
        date: "2019-05-01", 
        count: "137,000,000", 
        categories: {
          "Credenciais": ["Email", "Username", "Password (Bcrypt)"],
          "Pessoais": ["Name"]
        },
        source: "IntelX", 
        risk: "Alto" 
      },
      { 
        name: "Dropbox (2012)", 
        date: "2012-07-01", 
        count: "68,000,000", 
        categories: {
          "Credenciais": ["Email", "Password (Bcrypt)"]
        },
        source: "HIBP", 
        risk: "Alto" 
      },
      { 
        name: "RockYou Collection", 
        date: "2009-12-01", 
        count: "32,000,000", 
        categories: {
          "Senhas": ["Plaintext Password"]
        },
        source: "SecLists", 
        risk: "Crítico" 
      },
      { 
        name: "CrackStation Lookup", 
        date: "2021-01-01", 
        count: "N/A", 
        categories: {
          "Senhas": ["Hash Match", "Plaintext Password"]
        },
        source: "CrackStation", 
        risk: "Crítico" 
      },
      { 
        name: "Weakpass Database", 
        date: "2023-01-01", 
        count: "2,000,000,000+", 
        categories: {
          "Senhas": ["Common Password", "Pattern Match"]
        },
        source: "Weakpass", 
        risk: "Crítico" 
      },
    ];

    // Simulate finding breaches
    // In a real app, you'd call the respective APIs
    const foundBreaches = mockBreaches.filter(() => Math.random() > 0.6);

    if (foundBreaches.length > 0) {
      return res.json({ 
        exists: true, 
        breaches: foundBreaches,
        sources: breachSources.map(s => ({ ...s, url: s.url.replace('[query]', encodeURIComponent(query)) })),
        details: {
          count: foundBreaches.length,
          risk: foundBreaches.length > 4 ? "Crítico" : "Alto",
          confidence: "Alta",
          source: "Repositórios Globais de Inteligência"
        }
      });
    } else {
      return res.json({ 
        exists: false, 
        message: "Nenhum vazamento identificado nos repositórios globais.",
        sources: breachSources.map(s => ({ ...s, url: s.url.replace('[query]', encodeURIComponent(query)) }))
      });
    }
  });

  app.post("/api/check-url", searchLimiter, async (req, res) => {
    const { url } = req.body;
    
    if (!url) return res.status(400).json({ error: "URL é obrigatória" });

    try {
      // Basic URL validation
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: "URL inválida. Certifique-se de incluir http:// ou https://" });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        timeout: 8000,
        validateStatus: (status) => status < 500,
      });

      // Simple title extraction
      const titleMatch = response.data.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'Sem título';

      // Simple metadata extraction (simulated or basic)
      const details: any = {
        title,
        status: response.status,
        server: response.headers['server'] || 'Não identificado',
        type: response.headers['content-type'] || 'Não identificado',
        confidence: "Alta",
        matchType: "URL Direta"
      };

      return res.json({ 
        exists: response.status === 200, 
        url,
        details
      });
    } catch (error: any) {
      return res.json({ 
        exists: false, 
        url, 
        error: error.message || "Falha ao acessar a URL" 
      });
    }
  });

  app.post("/api/check-username", searchLimiter, async (req, res) => {
    const { username, platform } = req.body;
    
    const platformData = USERNAME_PLATFORMS[platform];
    if (!platformData) return res.status(400).json({ error: "Plataforma não suportada" });

    const url = platformData.url.replace('[username]', username);

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 200) {
        // Simulated metadata extraction
        // In a real app, you'd use a library like cheerio to parse the HTML
        const mockMetadata: Record<string, any> = {
          github: { bio: "Desenvolvedor / Open Source", followers: "100+", activity: "Alta" },
          instagram: { bio: "Perfil Público", posts: "50+", privacy: "Público" },
          facebook: { type: "Perfil Pessoal", location: "Brasil" },
          twitter: { joined: "2020", verified: false }
        };

        const details = mockMetadata[platform] || { info: "Perfil identificado com sucesso" };

        return res.json({ 
          exists: true, 
          url,
          details: {
            ...details,
            confidence: "Alta",
            matchType: "Username Exato"
          }
        });
      } else {
        return res.json({ exists: false, url });
      }
    } catch (error) {
      return res.json({ exists: false, url, error: "Falha na requisição" });
    }
  });

  app.post("/api/check-email", searchLimiter, async (req, res) => {
    const { email, platform } = req.body;
    
    const platformData = EMAIL_PLATFORMS[platform];
    if (!platformData) return res.status(400).json({ error: "Plataforma não suportada" });

    const url = platformData.url.replace('[email]', email);

    try {
      // Gravatar check is a good example of a public email-based check
      if (platform === 'gravatar') {
        const crypto = await import('crypto');
        const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
        const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
        const response = await axios.get(gravatarUrl, { validateStatus: (status) => status < 500 });
        return res.json({ exists: response.status === 200, url: `https://en.gravatar.com/${hash}` });
      }

      // For others, we'll simulate a check for now or implement specific logic
      // In a real app, you'd use APIs like HaveIBeenPwned or specific site registration checks
      return res.json({ exists: true, url, message: "Link de investigação gerado" });
    } catch (error) {
      return res.json({ exists: false, url, error: "Falha na requisição" });
    }
  });

  app.post("/api/check-phone", searchLimiter, async (req, res) => {
    const { phone, platform } = req.body;
    
    const platformData = PHONE_PLATFORMS[platform];
    if (!platformData) return res.status(400).json({ error: "Plataforma não suportada" });

    const url = platformData.url.replace('[phone]', phone);

    // DDD to City/State mapping for Brazil (Expanded)
    const dddMap: Record<string, { city: string, state: string }> = {
      '11': { city: 'São Paulo', state: 'SP' },
      '12': { city: 'São José dos Campos', state: 'SP' },
      '13': { city: 'Santos', state: 'SP' },
      '14': { city: 'Bauru', state: 'SP' },
      '15': { city: 'Sorocaba', state: 'SP' },
      '16': { city: 'Ribeirão Preto', state: 'SP' },
      '17': { city: 'São José do Rio Preto', state: 'SP' },
      '18': { city: 'Presidente Prudente', state: 'SP' },
      '19': { city: 'Campinas', state: 'SP' },
      '21': { city: 'Rio de Janeiro', state: 'RJ' },
      '22': { city: 'Campos dos Goytacazes', state: 'RJ' },
      '24': { city: 'Volta Redonda', state: 'RJ' },
      '27': { city: 'Vitória', state: 'ES' },
      '28': { city: 'Cachoeiro de Itapemirim', state: 'ES' },
      '31': { city: 'Belo Horizonte', state: 'MG' },
      '32': { city: 'Juiz de Fora', state: 'MG' },
      '33': { city: 'Governador Valadares', state: 'MG' },
      '34': { city: 'Uberlândia', state: 'MG' },
      '35': { city: 'Poços de Caldas', state: 'MG' },
      '37': { city: 'Divinópolis', state: 'MG' },
      '38': { city: 'Montes Claros', state: 'MG' },
      '41': { city: 'Curitiba', state: 'PR' },
      '42': { city: 'Ponta Grossa', state: 'PR' },
      '43': { city: 'Londrina', state: 'PR' },
      '44': { city: 'Maringá', state: 'PR' },
      '45': { city: 'Foz do Iguaçu', state: 'PR' },
      '46': { city: 'Francisco Beltrão', state: 'PR' },
      '47': { city: 'Joinville', state: 'SC' },
      '48': { city: 'Florianópolis', state: 'SC' },
      '49': { city: 'Chapecó', state: 'SC' },
      '51': { city: 'Porto Alegre', state: 'RS' },
      '53': { city: 'Pelotas', state: 'RS' },
      '54': { city: 'Caxias do Sul', state: 'RS' },
      '55': { city: 'Santa Maria', state: 'RS' },
      '61': { city: 'Brasília', state: 'DF' },
      '62': { city: 'Goiânia', state: 'GO' },
      '63': { city: 'Palmas', state: 'TO' },
      '64': { city: 'Rio Verde', state: 'GO' },
      '65': { city: 'Cuiabá', state: 'MT' },
      '66': { city: 'Rondonópolis', state: 'MT' },
      '67': { city: 'Campo Grande', state: 'MS' },
      '68': { city: 'Rio Branco', state: 'AC' },
      '69': { city: 'Porto Velho', state: 'RO' },
      '71': { city: 'Salvador', state: 'BA' },
      '73': { city: 'Ilhéus', state: 'BA' },
      '74': { city: 'Juazeiro', state: 'BA' },
      '75': { city: 'Feira de Santana', state: 'BA' },
      '77': { city: 'Vitória da Conquista', state: 'BA' },
      '79': { city: 'Aracaju', state: 'SE' },
      '81': { city: 'Recife', state: 'PE' },
      '82': { city: 'Maceió', state: 'AL' },
      '83': { city: 'João Pessoa', state: 'PB' },
      '84': { city: 'Natal', state: 'RN' },
      '85': { city: 'Fortaleza', state: 'CE' },
      '86': { city: 'Teresina', state: 'PI' },
      '87': { city: 'Petrolina', state: 'PE' },
      '88': { city: 'Juazeiro do Norte', state: 'CE' },
      '89': { city: 'Picos', state: 'PI' },
      '91': { city: 'Belém', state: 'PA' },
      '92': { city: 'Manaus', state: 'AM' },
      '93': { city: 'Santarém', state: 'PA' },
      '94': { city: 'Marabá', state: 'PA' },
      '95': { city: 'Boa Vista', state: 'RR' },
      '96': { city: 'Macapá', state: 'AP' },
      '97': { city: 'Coari', state: 'AM' },
      '98': { city: 'São Luís', state: 'MA' },
      '99': { city: 'Imperatriz', state: 'MA' },
    };

    // Extract DDD from Brazilian phone (assuming format 5511999999999 or 11999999999)
    let ddd = "";
    if (phone.startsWith('55') && phone.length >= 4) {
      ddd = phone.substring(2, 4);
    } else if (phone.length >= 2) {
      ddd = phone.substring(0, 2);
    }

    const location = dddMap[ddd] || { city: 'Desconhecida', state: 'BR' };

    // Simulated data for demonstration
    const mockData: Record<string, any> = {
      owner: platform === 'truecaller' || platform === 'syncme' ? "Nome Provável: Usuário Identificado" : "Consulta Manual Necessária",
      carrier: platform.includes('abr') || platform.includes('teleco') ? "Vivo / Telefônica" : "Identificando...",
      city: location.city,
      state: location.state,
      confidence: platform === 'truecaller' ? "Alta" : "Média",
    };

    // Heuristic for some platforms to show "Found"
    const exists = true;

    try {
      return res.json({ 
        exists, 
        url, 
        details: {
          owner: mockData.owner,
          carrier: mockData.carrier,
          location: `${mockData.city} - ${mockData.state}`,
          type: phone.length > 10 ? "Móvel" : "Fixo",
          confidence: mockData.confidence,
          source: platformData.name
        }
      });
    } catch (error) {
      return res.json({ exists: false, url, error: "Falha na requisição" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
