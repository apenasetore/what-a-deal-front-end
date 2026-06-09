# What A Deal — Frontend

Frontend web (SPA) do sistema **What A Deal**, em **React + TypeScript (Vite)** — linguagem
diferente do backend (Elixir). Comunica-se com o sistema **exclusivamente através do
MS Gateway** (`../what-a-deal`): API REST para as operações e **SSE** para as
notificações em tempo real. As promoções cadastradas pela loja são **assinadas
digitalmente no navegador** (RSA 2048, WebCrypto) antes de serem enviadas.

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

A primeira tela é um **login simples** (sem senha): escolha um perfil e informe um nome.

- **Loja** → informa também um **e-mail**. Ao entrar, o frontend gera um **par de chaves
  RSA 2048** no navegador, registra a loja no backend (`POST /store`, enviando a chave
  pública em PEM) e guarda a chave privada no `localStorage`. Depois disso a loja
  cadastra promoções (`POST /deals`): cada promoção é **assinada digitalmente** no
  navegador antes do envio, e a tela mostra o status retornado pela validação.
- **Consumidor** → lista promoções (`GET /deals`), filtra por categoria, vota 👍/👎
  (`POST /vote` — **um voto por promoção**, controlado localmente), segue e cancela
  categorias de interesse (`POST` / `DELETE` / `GET /subscription`) e recebe
  **notificações em tempo real** (SSE) das categorias seguidas — elas aparecem como
  toasts no canto da tela (🆕 nova promoção / 🔥 hot deal) e atualizam a lista
  automaticamente.

A sessão (perfil + nome + e-mail) fica salva no navegador (sessionStorage). Cada nome
pertence a um único perfil: se "maria" entrou como cliente, não dá para entrar como
loja "maria" na mesma sessão do navegador (registro em `src/identity.ts`).

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

**Exceção — o stream SSE não passa pelo proxy.** O `EventSource` conecta **direto**
no Gateway, em `http://<host>:4000/stream/<nome>` (ver `src/hooks/useSSE.ts`), para
manter a conexão de longa duração fora do proxy de dev. Como é uma chamada
*cross-origin* feita pelo navegador, o endpoint de stream do Gateway precisa aceitar
essa origem (requisições `GET` simples como essa não disparam preflight).

> **E em produção?** Se o frontend buildado for servido em outro host/porta, o proxy de dev
> não existe mais. Aí sim seria necessário **adicionar CORS no Gateway** (um plug que envie
> `Access-Control-Allow-Origin` e responda ao `OPTIONS`).

---

## Estrutura do código

```
src/
├── api/
│   ├── client.ts                  # wrappers das rotas REST (base "/api")
│   └── crypto.ts                  # chaves RSA + assinatura das promoções (WebCrypto)
├── types.ts                       # Deal, NewDeal, Store, Vote, SSENotification, ...
├── identity.ts                    # registro nome -> perfil (um nome, um papel)
├── votes.ts                       # controle local de 1 voto por cliente/promoção
├── context/SessionContext.tsx     # sessão: perfil + nome + e-mail (sessionStorage)
├── hooks/useDeals.ts              # carrega GET /deals (com refresh)
├── hooks/useSSE.ts                # EventSource em http://<host>:4000/stream/:client_name
└── components/
    ├── Login.tsx                   # tela de entrada (perfil, nome, e-mail da loja)
    ├── Navbar.tsx                  # mostra quem está logado + botão Sair
    ├── ConsumerView.tsx            # listar, filtrar, votar, interesses, SSE
    ├── StoreView.tsx               # cadastrar promoção (assinada)
    ├── DealCard.tsx                # card com botões 👍 / 👎 (1 voto por cliente)
    ├── NotificationToasts.tsx      # toasts das notificações SSE
    └── SubscriptionPanel.tsx       # seguir / cancelar categorias
```

> **SSE:** as notificações em tempo real chegam pelo endpoint
> `GET /stream/:client_name` do Gateway (Server-Sent Events), acessado direto em
> `:4000` (sem proxy). O hook `src/hooks/useSSE.ts` abre um `EventSource` para o
> cliente logado; cada evento traz a promoção (`{ tipo, categoria, promo, ... }`)
> das categorias seguidas. O `ConsumerView` mostra um toast e recarrega a lista a
> cada notificação.

---

## Assinatura digital das promoções

O backend só publica promoções cuja assinatura confere com a chave pública
registrada pela loja. O fluxo, todo em `src/api/crypto.ts` (WebCrypto):

1. **No login da loja** é gerado um par **RSA 2048** (`RSASSA-PKCS1-v1_5` + SHA-256,
   o mesmo algoritmo do `Shared.Crypto` do backend). A chave **pública** vai em PEM
   no `POST /store`; a **privada** fica no `localStorage` do navegador
   (`store_priv_key:<nome>`).
2. **Ao cadastrar uma promoção**, o frontend monta a *mensagem canônica* — os campos
   `loja|nome|descricao|categoria|email|preco_original|preco_promocional` unidos por
   `|`, com preços em 2 casas decimais — assina com a chave privada e envia a
   assinatura em Base64 junto do payload no `POST /deals`.
3. O backend reconstrói exatamente a mesma string e verifica com
   `:public_key.verify/4`, sem conversão de formato.

> Como a chave privada vive no `localStorage`, ela só existe **naquele navegador**.
> Se limpar o storage (ou trocar de máquina), entre de novo como loja para gerar e
> registrar um novo par de chaves.
