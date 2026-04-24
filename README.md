# API Futebol

API REST para gerenciamento de jogadores, times e rodadas, com persistencia em PostgreSQL.

## Funcionalidades
- CRUD de jogadores
- Importacao massiva de jogadores (cria e atualiza em lote)
- CRUD de times
- CRUD de rodadas
- Estatisticas por jogador em cada partida da rodada
- Calculo automatico de:
   - precisao de passes
   - precisao de dribles
   - precisao de finalizacoes
   - nota da partida do jogador (escala de 1.0 a 10.0)
- Swagger/OpenAPI em /api-docs
- Criacao automatica de schema/tabelas ao subir a API

## Estrutura
```text
api-futebol/
   src/
      app.js
      controllers/
         jogadores.js
         times.js
         rodadas.js
      routes/
         jogadores.js
         times.js
         rodadas.js
      database/
         postgres.js
      docs/
         openapi.js
      middleware/
         errorHandler.js
```

## Requisitos
- Node.js 18+
- PostgreSQL

## Instalacao
1. Instale dependencias na raiz do projeto:
```bash
npm install
```

2. Configure o arquivo api-futebol/.env:
```env
DATABASE_URL_LOCAL=postgresql://USER:PASSWORD@HOST:PORT/DB
PORT=3000
NODE_ENV=development
```

Observacao:
- Em desenvolvimento, a API prioriza DATABASE_URL_LOCAL.
- Em producao (ex.: Railway), a API prioriza DATABASE_URL.

## Execucao
```bash
npm run dev
```

ou

```bash
npm start
```

Servidor local:
- http://localhost:3000

Documentacao:
- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/api-docs.json

## Modelo de dados

### Jogador
Campos principais:
- id
- nome
- idade
- time_id
- posicao
- valor_mercado

Importante:
- Estatisticas de desempenho nao ficam no registro principal do jogador.
- Elas ficam dentro de cada partida da rodada (campo desempenhos).

### Rodada
Cada rodada possui:
- numeroRodada (retornado pela API com base no id)
- data
- partidas

Cada partida pode conter:
- numeroPartida
- timeCasa
- timeFora
- golsTimeCasa
- golsTimeFora
- desempenhos[] por jogador

Cada item de desempenhos aceita, entre outros:
- jogador_id
- gols
- assistencias
- defesas
- passes_certos
- passes_errados
- passes_decisivos
- dribles_certos
- dribles_errados
- interceptacoes
- finalizacoes_no_gol
- finalizacoes_fora
- cartao_amarelo
- cartao_vermelho
- minutos_jogados

Campos calculados automaticamente pela API:
- precisao_passes
- precisao_dribles
- precisao_finalizacoes
- nota

## Endpoints

### Jogadores
- GET /api/jogadores
- GET /api/jogadores/:id
- POST /api/jogadores
- PUT /api/jogadores/:id
- DELETE /api/jogadores/:id
- POST /api/jogadores/importar

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
- GET /api/times
- GET /api/times/:id
- POST /api/times
- PUT /api/times/:id
- DELETE /api/times/:id

### Rodadas
- GET /api/rodadas
- GET /api/rodadas/:id
- POST /api/rodadas
- PUT /api/rodadas/:id
- DELETE /api/rodadas/:id

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

Exemplo de retorno organizado por relacionamento:
```json
{
   "id": 1,
   "numeroRodada": 1,
   "data": "2025-09-14",
   "partidas": [
      {
         "numeroPartida": 1,
         "desempenhos": [
            { "jogador_id": 10, "nota": 8.8 },
            { "jogador_id": 11, "nota": 7.4 }
         ]
      },
      {
         "numeroPartida": 2,
         "desempenhos": [
            { "jogador_id": 12, "nota": 6.9 },
            { "jogador_id": 13, "nota": 7.1 }
         ]
      }
   ]
}
```

## Notas
- Os modelos em src/models usam Mongoose e nao sao utilizados pela API atual em PostgreSQL.
- A fonte oficial de contrato da API e o Swagger em /api-docs.