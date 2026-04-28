# 🔍 Investiga Tool - OSINT Framework
 
## 📝 Descrição do Projeto
Este projeto consiste em uma ferramenta avançada de **Inteligência de Fontes Abertas (OSINT)** de nível sênior. O objetivo principal é localizar, correlacionar e reportar a presença digital de indivíduos em redes sociais, plataformas de desenvolvimento e verificar exposição em vazamentos de dados públicos.

Desenvolvido para profissionais de segurança e inteligência, o sistema processa consultas de usernames, e-mails, telefones e URLs para identificar padrões e conexões. A ferramenta utiliza uma matriz de busca que automatiza o "Google Dorking" e consulta repositórios globais de vazamentos (como HIBP e IntelX), categorizando o risco e os dados expostos para facilitar a tomada de decisão.
 
![Dashboard da Ferramenta OSINT](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000)
*Figura 1: Interface principal do sistema exibindo resultados de investigação e análise de risco.*
 
## 🚀 Tecnologias Utilizadas
* **Linguagem:** TypeScript
* **Frontend:** React 19, Tailwind CSS 4, Framer Motion
* **Backend:** Node.js, Express, Axios
* **Arquitetura:** Full-stack (Vite + Express Middleware)
 
## 📊 Resultados e Aprendizados
O projeto implementa uma lógica robusta de verificação cruzada e segurança de dados.
* **Mecanismo de Risco:** Implementado algoritmo que categoriza vazamentos em níveis: Médio, Alto e Crítico.
* **Categorização de Dados:** O sistema agrupa informações expostas (Senhas, Credenciais, Pessoais) automaticamente.
* **Validação de URL:** Integração de checagem em tempo real de metadados e status de servidores.
* **OSINT Profiling:** Automação de variações de handle para busca em mais de 20+ padrões de redes sociais.
 
![Métricas e Análise de Risco](https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=1000)
*Figura 2: Detalhamento de vazamentos confirmados e dashboard de visualização de riscos.*
 
## 🔧 Como Executar
1. Clone o repositório.
2. Instale as dependências: `npm install`.
3. Execute o servidor de desenvolvimento: `npm run dev`.
4. Acesse em seu navegador: `http://localhost:3000`.
 
![Pipeline de Dados OSINT](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1000)
*Figura 3: Representação visual do fluxo de consultas e integração com APIs de inteligência.*
 
---
[Voltar ao início](https://github.com/seu-usuario)
