# What A Deal — Frontend

Frontend web (SPA) do sistema **What A Deal**, em **React + TypeScript (Vite)** — linguagem
diferente do backend (Elixir). Comunica-se com o sistema **exclusivamente via API REST** do
MS Gateway (`../what-a-deal`).

---

## Pré-requisitos

- **Node.js 18+** (testado com Node 22) e **npm**
- O **backend rodando** com o Gateway disponível em `http://localhost:4000`

---

## Passo a passo para rodar

### 1. Suba o backend (Gateway na porta 4000)

No diretório do backend (`../what-a-deal`):

```bash
docker compose up -d        # sobe o RabbitMQ
mix deps.get                # dependências Elixir
mix gen_keys                # gera as chaves de assinatura (rodar só uma vez)
./start_demo.sh             # sobe os 4 microsserviços
```

Confirme que o Gateway respondeu:

```bash
curl http://localhost:4000/health
# -> Health check passed!
```

> Se esse `curl` falhar, o frontend não vai conseguir buscar dados — o backend
> precisa estar no ar **antes** de testar a interface.

### 2. Rode o frontend

Neste diretório (`what-a-deal-front-end`):

```bash
npm install                 # instala as dependências (só na primeira vez)
npm run dev                 # inicia o servidor de desenvolvimento
```

Abra no navegador: **http://localhost:5173**

### 3. Use a aplicação

No topo da tela há um seletor de papel:

- **Loja** → cadastra promoções (`POST /deals`) e mostra o status de validação.
- **Consumidor** → lista promoções (`GET /deals`), vota 👍/👎 (`POST /vote`),
  segue e cancela categorias de interesse (`POST` / `DELETE /subscription`).

Não há login: você só informa um **nome** (usado para identificar a loja ou o cliente).
O nome e o papel ficam salvos no navegador (localStorage).

---

## Outros comandos

```bash
npm run build     # type-check + build de produção (gera ./dist)
npm run preview   # serve o build de produção localmente
```

---

## Por que existe um proxy? (o problema de CORS)

O Gateway **não envia headers de CORS**. Sem nenhum ajuste, o navegador **bloquearia**
as chamadas que o React faz ao backend. Veja por quê:

**CORS** (*Cross-Origin Resource Sharing*) é uma política de segurança **do navegador**.
Ela impede que JavaScript de uma **origem** faça requisições para uma origem diferente,
a menos que o servidor de destino autorize com o header `Access-Control-Allow-Origin`.

Uma **origem** = `protocolo + host + porta`. No nosso caso são duas origens diferentes:

| Quem | Origem |
|------|--------|
| Frontend (Vite dev) | `http://localhost:5173` |
| Gateway (Elixir) | `http://localhost:4000` |

A porta é diferente → origens diferentes. Se o React em `:5173` chamasse direto
`http://localhost:4000/deals`, o navegador trataria como *cross-origin*, não encontraria
o header de permissão na resposta e mostraria no console algo como:

```
Access to fetch at 'http://localhost:4000/deals' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

Pior: requisições `POST`/`DELETE` com `Content-Type: application/json` disparam um
**preflight** (o navegador manda um `OPTIONS` antes). O router do Gateway nem trata `OPTIONS`,
então o preflight também falharia.

### Como o proxy do Vite resolve (sem mexer no backend)

O frontend chama sempre `/api/...` — ou seja, a **mesma origem** (`:5173`). O servidor de dev
do Vite recebe essa chamada e a **repassa** para `http://localhost:4000`, removendo o prefixo
`/api`. Como quem repassa é o Vite (um servidor, não um navegador), **a política de CORS não
se aplica** nesse trecho. Configuração em `vite.config.ts`:

```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:4000",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
    },
  },
}
```

Resumo do caminho de uma requisição:

```
React (:5173)  →  GET /api/deals  →  Vite proxy  →  GET /deals em :4000  →  resposta
   (mesma origem, sem CORS)                          (servidor↔servidor, sem CORS)
```

> **E em produção?** Se o frontend buildado for servido em outro host/porta, o proxy de dev
> não existe mais. Aí sim seria necessário **adicionar CORS no Gateway** (um plug que envie
> `Access-Control-Allow-Origin` e responda ao `OPTIONS`).

---

## Estrutura do código

```
src/
├── api/client.ts                  # wrappers das rotas REST (base "/api")
├── types.ts                       # Deal, NewDeal, Vote, SubscriptionResponse
├── context/SessionContext.tsx     # papel (loja/consumidor) + nome (localStorage)
├── hooks/useDeals.ts              # carrega GET /deals
├── hooks/useSSE.ts                # stub do EventSource (SSE — fase futura)
└── components/
    ├── Navbar.tsx                  # alterna papel loja/consumidor
    ├── RoleGate.tsx                # define o nome da sessão
    ├── ConsumerView.tsx            # listar, filtrar, votar, interesses
    ├── StoreView.tsx               # cadastrar promoção
    ├── DealCard.tsx                # card com botões 👍 / 👎
    └── SubscriptionPanel.tsx       # seguir / cancelar categorias
```

> **SSE:** as notificações em tempo real estão preparadas em `src/hooks/useSSE.ts`, mas
> desativadas — o Gateway ainda não expõe um endpoint de eventos. Quando existir
> (`GET /events?client=<nome>`), basta habilitar o hook.
