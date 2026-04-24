# ⚽ API Brasileirão

> A API completa para gerenciar dados do **Campeonato Brasileiro de Futebol (Série A)**

API REST robusta para gerenciamento de jogadores, times e rodadas com análise estatística detalhada, persistência em PostgreSQL e integração com 365Scores.

## ✨ Funcionalidades Principais

| Recurso | Descrição |
|---------|-----------|
| 👥 **CRUD Jogadores** | Criar, listar, atualizar e deletar jogadores com busca e paginação |
| 📋 **Importação Massiva** | Importa 100+ jogadores via CSV/XLSX e atualiza em lote |
| 🏆 **Gerenciamento Times** | Controle completo de times com elenco integrado |
| 📅 **Rodadas & Partidas** | Registro de rodadas com partidas e desempenho por jogador |
| 📊 **Estatísticas Automáticas** | Cálculo automático de: precisão de passes, dribles, finalizações e nota geral (1.0-10.0) |
| 🔄 **Sincronização 365Scores** | Scraper automático de estatísticas da API 365Scores |
| 📚 **Documentação Interativa** | Swagger/OpenAPI completo em `/api-docs` |
| 🗄️ **Schema Automático** | Criação automática de tabelas e índices no PostgreSQL

## ⚙️ Requisitos

| Requisito | Versão |
|-----------|--------|
| 📦 Node.js | 18+ |
| 🗄️ PostgreSQL | 12+ |

## 🚀 Instalação & Setup

### 1️⃣ Instale as dependências

```bash
npm install
```

### 2️⃣ Configure o arquivo `.env`

Crie `api-futebol/.env`:

```env
DATABASE_URL_LOCAL=postgresql://USER:PASSWORD@HOST:PORT/DB
PORT=3000
NODE_ENV=development
```

> **💡 Nota:** Em desenvolvimento usa `DATABASE_URL_LOCAL`. Em produção (Railway) usa `DATABASE_URL`.

## ▶️ Executando a API

```bash
npm run dev    # Com hot-reload
npm start      # Produção
```

✅ Servidor rodando em: **http://localhost:3000**

📚 Acesse a documentação:
- 📖 **Swagger UI:** http://localhost:3000/api-docs
- 📋 **OpenAPI JSON:** http://localhost:3000/api-docs.json

## 🗂️ Modelo de Dados

### 👤 Jogador

```json
{
  "id": 1,
  "nome": "Neymar Jr",
  "idade": 33,
  "time_id": 5,
  "posicao": "Atacante",
  "valor_mercado": "25000000"
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | PK |
| `nome` | string | Nome do jogador |
| `idade` | int | Idade em anos |
| `time_id` | int | FK para times |
| `posicao` | string | Posição em campo |
| `valor_mercado` | decimal | Estimativa de valor |

> 📌 **Importante:** Estatísticas de desempenho **NÃO** ficam no jogador. Elas ficam dentro de cada **partida** (campo `desempenhos`).

### 📅 Rodada & Partida

```json
{
  "id": 1,
  "numeroRodada": 5,
  "data": "2025-09-14",
  "partidas": [
    {
      "numeroPartida": 1,
      "timeCasa": 1,
      "timeCasaNome": "São Paulo",
      "timeFora": 2,
      "timeForaNome": "Flamengo",
      "golsTimeCasa": 2,
      "golsTimeFora": 1,
      "desempenhos": [...]
    }
  ]
}
```

#### 📊 Desempenho do Jogador

Cada `desempenho` em uma partida pode conter:

| Campo | Calculado? | Exemplo |
|-------|-----------|---------|
| `jogador_id` | ❌ | 10 |
| `jogador_nome` | ✅ | "Neymar Jr" |
| `gols` | ❌ | 1 |
| `assistencias` | ❌ | 2 |
| `passes_completos` | ❌ | 45 |
| `passes_tentados` | ❌ | 52 |
| `precisao_passes` | ✅ | 0.865 |
| `dribles_certos` | ❌ | 5 |
| `dribles_errados` | ❌ | 2 |
| `precisao_dribles` | ✅ | 0.714 |
| `finalizacoes_no_gol` | ❌ | 3 |
| `finalizacoes_fora` | ❌ | 2 |
| `precisao_finalizacoes` | ✅ | 0.600 |
| `cartao_amarelo` | ❌ | 0 |
| `cartao_vermelho` | ❌ | 0 |
| `minutos_jogados` | ❌ | 90 |
| `nota` | ✅ | 8.8 |

> ✅ Campos calculados automaticamente pela API

## 📡 API Endpoints

### 📑 Paginação

Todos os endpoints de **listagem** (GET sem `:id`) e **busca** (search) suportam paginação:

```bash
GET /api/jogadores?page=1&limit=20
GET /api/jogadores/search?nome=Neymar&page=1&limit=20
GET /api/times?page=1&limit=20
GET /api/times/search?nome=São&page=1&limit=20
GET /api/rodadas?page=1&limit=20
GET /api/rodadas/search?nome=Flamengo&page=1&limit=20
```

| Parâmetro | Default | Máximo | Descrição |
|-----------|---------|--------|-----------|
| `page` | 1 | - | Número da página |
| `limit` | 20 | 100 | Itens por página |

**Resposta Paginada:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 600,
    "totalPages": 30
  }
}
```

> 💡 **Dica:** Use paginação em todos os endpoints de listagem e busca para otimizar performance!

### 👥 Jogadores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| 🔍 GET | `/api/jogadores` | Lista com paginação |
| 🔍 GET | `/api/jogadores/:id` | Detalhe do jogador |
| ➕ POST | `/api/jogadores` | Criar jogador |
| ✏️ PUT | `/api/jogadores/:id` | Atualizar jogador |
| 🗑️ DELETE | `/api/jogadores/:id` | Deletar jogador |
| 🔎 GET | `/api/jogadores/search?nome=X` | Buscar por nome (paginado) |
| 📤 POST | `/api/jogadores/importar` | Importar em lote (JSON) |
| 📤 POST | `/api/jogadores/importar/csv` | Importar CSV/XLSX |

**📋 Importação em Lote (JSON):**
```json
{
  "jogadores": [
    {
      "nome": "Neymar Jr",
      "idade": 33,
      "time_id": 1,
      "posicao": "Atacante",
      "valor_mercado": "25000000"
    },
    {
      "id": 10,
      "nome": "Neymar Jr Atualizado",
      "idade": 34,
      "time_id": 1,
      "posicao": "Atacante",
      "valor_mercado": "22000000"
    }
  ]
}
```

> 💡 **Regra:** Sem `id` → cria | Com `id` → atualiza

### 🏆 Times

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| 🔍 GET | `/api/times` | Lista com paginação |
| 🔍 GET | `/api/times/:id` | Detalhe do time |
| ➕ POST | `/api/times` | Criar time |
| ✏️ PUT | `/api/times/:id` | Atualizar time |
| 🗑️ DELETE | `/api/times/:id` | Deletar time |
| 🔎 GET | `/api/times/search?nome=X` | Buscar por nome/cidade (paginado) |

### ⚽ Rodadas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| 🔍 GET | `/api/rodadas` | Lista com paginação |
| 🔍 GET | `/api/rodadas/:id` | Detalhe da rodada |
| ➕ POST | `/api/rodadas` | Criar rodada |
| ✏️ PUT | `/api/rodadas/:id` | Atualizar rodada |
| 🗑️ DELETE | `/api/rodadas/:id` | Deletar rodada |
| 🔎 GET | `/api/rodadas/search?nome=X` | Buscar por time (paginado) |

**📊 Criar Rodada com Desempenho:**
```json
{
  "data": "2025-09-14",
  "partidas": [
    {
      "numeroPartida": 1,
      "timeCasa": 1,
      "timeFora": 2,
      "golsTimeCasa": 2,
      "golsTimeFora": 1,
      "desempenhos": [
        {
          "jogador_id": 10,
          "minutos": 90,
          "gols": 1,
          "assistencias": 1,
          "passes_completos": 32,
          "passes_tentados": 39,
          "dribles_certos": 5,
          "dribles_errados": 2,
          "finalizacoes_no_gol": 3,
          "finalizacoes_fora": 2,
          "cartao_amarelo": 0,
          "cartao_vermelho": 0
        }
      ]
    }
  ]
}
```

### 🎯 Resposta Enriquecida (Rodadas)

As respostas incluem **nomes dos times e jogadores**:

```json
{
  "data": [
    {
      "id": 1,
      "numeroRodada": 5,
      "data": "2025-09-14",
      "partidas": [
        {
          "numeroPartida": 1,
          "timeCasa": 1,
          "timeCasaNome": "São Paulo",
          "timeFora": 2,
          "timeForaNome": "Flamengo",
          "golsTimeCasa": 2,
          "golsTimeFora": 1,
          "desempenhos": [
            {
              "jogador_id": 10,
              "jogador_nome": "Neymar Jr",
              "posicao": "atacante",
              "nota": 8.8,
              "minutos": 90,
              "gols": 1,
              "assistencias": 1,
              "passes_completos": 32,
              "passes_tentados": 39,
              "precisao_passes": 0.82,
              "dribles_certos": 5,
              "dribles_errados": 2,
              "precisao_dribles": 0.71,
              "finalizacoes_no_gol": 3,
              "finalizacoes_fora": 2,
              "precisao_finalizacoes": 0.60
            }
          ]
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 38,
    "totalPages": 2
  }
}
```

### 🏷️ Campos Enriquecidos em Rodadas

| Campo | Nível | Descrição |
|-------|-------|-----------|
| `timeCasaNome` | Partida | Nome do time da casa |
| `timeForaNome` | Partida | Nome do time visitante |
| `jogador_nome` | Desempenho | Nome do jogador |

## Endpoints

### Paginação
Os endpoints de listagem (GET sem :id) suportam paginação com os seguintes query params:
- `page` (padrão: 1) — número da página
- `limit` (padrão: 20, máximo: 100) — itens por página

Resposta paginada:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 600,
    "totalPages": 30
  }
}
```

### Jogadores
- GET /api/jogadores — lista com paginação
- GET /api/jogadores/:id — detalhe
- POST /api/jogadores — criar
- PUT /api/jogadores/:id — atualizar
- DELETE /api/jogadores/:id — deletar
- GET /api/jogadores/search?nome=X — buscar por nome com paginação
- POST /api/jogadores/importar — importar em lote

Exemplo de importacao massiva:
```json
{
   "jogadores": [
      {
         "nome": "Neymar Jr",
         "idade": 33,
         "time_id": 1,
         "posicao": "Atacante",
         "valor_mercado": "25000000"
      },
      {
         "id": 10,
         "nome": "Neymar Jr",
         "idade": 33,
         "time_id": 1,
         "posicao": "Atacante",
         "valor_mercado": "25000000"
      }
   ]
}
```

Regra:
- sem id: cria
- com id: atualiza

### Times
- GET /api/times — lista com paginação
- GET /api/times/:id — detalhe
- POST /api/times — criar
- PUT /api/times/:id — atualizar
- DELETE /api/times/:id — deletar
- GET /api/times/search?nome=X — buscar por nome/cidade com paginação

### Rodadas
- GET /api/rodadas — lista com paginação
- GET /api/rodadas/:id — detalhe
- POST /api/rodadas — criar
- PUT /api/rodadas/:id — atualizar
- DELETE /api/rodadas/:id — deletar
- GET /api/rodadas/search?nome=X — buscar por nome do time com paginação

Exemplo de criacao de rodada com desempenho:
```json
{
   "data": "2025-09-14",
   "partidas": [
      {
         "numeroPartida": 1,
         "timeCasa": 1,
         "timeFora": 2,
         "golsTimeCasa": 2,
         "golsTimeFora": 1,
         "desempenhos": [
            {
               "jogador_id": 10,
               "minutos": 90,
               "gols": 1,
               "assistencias": 1,
               "xg": 0.25,
               "total_chutes": 6,
               "chutes_no_gol": 1,
               "xgot": 0.07,
               "chutes_fora": 1,
               "trave": 1,
               "xa": 0.32,
               "passes_completos": 32,
               "passes_tentados": 39,
               "passes_decisivos": 3,
               "chances_perigosas_criadas": 1,
               "passes_ultimo_terco": 5,
               "passes_para_tras": 3,
               "cruzamentos_completos": 1,
               "cruzamentos_tentados": 7,
               "acoes_com_bola": 70,
               "faltas_sofridas": 7,
               "faltas_cometidas": 1,
               "posse_recuperada_terco_final": 4,
               "posse_perdida": 19,
               "driblado": 0,
               "chutes_bloqueados": 4,
               "perigo_afastado": 0,
               "interceptacoes": 0,
               "recuperacoes_posse": 6,
               "duelos_aereos_ganhos": 1,
               "duelos_aereos_totais": 2,
               "duelos_chao_ganhos": 7,
               "duelos_chao_totais": 12
            }
         ]
      }
   ]
}
```

Exemplo de retorno organizado por relacionamento (com nomes enriquecidos):
```json
{
   "id": 1,
   "numeroRodada": 1,
   "data": "2025-09-14",
   "partidas": [
      {
         "numeroPartida": 1,
         "timeCasa": 1,
         "timeCasaNome": "São Paulo",
         "timeFora": 2,
         "timeForaNome": "Flamengo",
         "golsTimeCasa": 2,
         "golsTimeFora": 1,
         "desempenhos": [
            {
               "jogador_id": 10,
               "jogador_nome": "Neymar Jr",
               "posicao": "atacante",
               "nota": 8.8,
               "minutos": 90,
               "gols": 1,
               "assistencias": 1,
               "xg": 0.25,
               "passes_completos": 32,
               "passes_tentados": 39,
               "precisao_passes": 0.82
            },
            {
               "jogador_id": 11,
               "jogador_nome": "Lucas Moura",
               "posicao": "meio",
               "nota": 7.4,
               "minutos": 85
            }
         ]
      },
      {
         "numeroPartida": 2,
         "timeCasa": 3,
         "timeCasaNome": "Palmeiras",
         "timeFora": 4,
         "timeForaNome": "Corinthians",
         "desempenhos": [
            {
               "jogador_id": 12,
               "jogador_nome": "Rony",
               "nota": 6.9,
               "minutos": 90
            },
            {
               "jogador_id": 13,
               "jogador_nome": "Willian",
               "nota": 7.1,
               "minutos": 75
            }
         ]
      }
   ]
}
```

### Campos de enriquecimento em Rodadas
Nas respostas de GET /api/rodadas (com ou sem paginação), os dados são enriquecidos com nomes:
- `timeCasaNome` — nome do time da casa
- `timeForaNome` — nome do time visitante  
- `jogador_nome` — nome do jogador em cada desempenho

## Notas
- Os modelos em src/models usam Mongoose e nao sao utilizados pela API atual em PostgreSQL.
- A fonte oficial de contrato da API e o Swagger em /api-docs.
