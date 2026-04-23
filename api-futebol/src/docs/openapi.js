const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API Futebol',
    version: '1.0.0',
    description:
      'API de futebol para gerenciamento de times, jogadores e rodadas. ' +
      'Suporta importacao massiva de jogadores, registro de partidas com estatisticas detalhadas por jogador ' +
      '(passes, dribles, finalizacoes, interceptacoes, cartoes, minutos jogados) e calculo automatico ' +
      'de precisoes e nota de desempenho por partida (escala 1.0 a 10.0).',
  },
  servers: [
    {
      url: '/',
      description: 'Servidor Atual',
    },
    {
      url: 'http://localhost:3000',
      description: 'Ambiente local',
    }
  ],
  tags: [
    { name: 'Jogadores', description: 'Gerenciamento de jogadores e importacao massiva' },
    { name: 'Times', description: 'Gerenciamento de times e seus elencos' },
    { name: 'Rodadas', description: 'Registro de rodadas, partidas e desempenho dos jogadores com calculo automatico de notas' },
  ],
  paths: {
    '/api/jogadores': {
      get: {
        tags: ['Jogadores'],
        summary: 'Lista todos os jogadores',
        responses: {
          200: {
            description: 'Lista de jogadores',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Jogador' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Jogadores'],
        summary: 'Cria um jogador',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JogadorInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Jogador criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Jogador' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/jogadores/importar': {
      post: {
        tags: ['Jogadores'],
        summary: 'Importacao massiva de jogadores',
        description: 'Cria ou atualiza multiplos jogadores de uma vez. Itens sem `id` sao criados; itens com `id` sao atualizados.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jogadores'],
                properties: {
                  jogadores: {
                    type: 'array',
                    items: {
                      allOf: [
                        { $ref: '#/components/schemas/JogadorInput' },
                        {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', description: 'Presente para atualizar; ausente para criar' },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          207: {
            description: 'Resultado da importacao',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    criados: { type: 'integer' },
                    atualizados: { type: 'integer' },
                    erros: { type: 'integer' },
                    jogadores_criados: { type: 'array', items: { $ref: '#/components/schemas/Jogador' } },
                    jogadores_atualizados: { type: 'array', items: { $ref: '#/components/schemas/Jogador' } },
                    jogadores_com_erro: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          jogador: { type: 'object' },
                          motivo: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                example: {
                  criados: 1,
                  atualizados: 1,
                  erros: 1,
                  jogadores_criados: [
                    { id: 11, nome: 'Rodrygo', idade: 23, time_id: 2, posicao: 'Atacante', valor_mercado: '80000000' },
                  ],
                  jogadores_atualizados: [
                    { id: 10, nome: 'Neymar Jr', idade: 33, time_id: 1, posicao: 'Atacante', valor_mercado: '25000000' },
                  ],
                  jogadores_com_erro: [
                    { jogador: { nome: 'Invalido' }, motivo: 'nome e idade (number) sao obrigatorios' },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/jogadores/{id}': {
      get: {
        tags: ['Jogadores'],
        summary: 'Busca jogador por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: {
            description: 'Jogador encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Jogador' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Jogadores'],
        summary: 'Atualiza jogador por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JogadorInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Jogador atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Jogador' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Jogadores'],
        summary: 'Remove jogador por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          204: { description: 'Jogador removido' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/times': {
      get: {
        tags: ['Times'],
        summary: 'Lista todos os times',
        responses: {
          200: {
            description: 'Lista de times',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Time' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Times'],
        summary: 'Cria um time',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TimeInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Time criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Time' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/times/{id}': {
      get: {
        tags: ['Times'],
        summary: 'Busca time por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: {
            description: 'Time encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Time' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Times'],
        summary: 'Atualiza time por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TimeInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Time atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Time' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Times'],
        summary: 'Remove time por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          204: { description: 'Time removido' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/rodadas': {
      get: {
        tags: ['Rodadas'],
        summary: 'Lista todas as rodadas',
        responses: {
          200: {
            description: 'Lista de rodadas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Rodada' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Rodadas'],
        summary: 'Cria uma rodada',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RodadaInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Rodada criada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Rodada' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/rodadas/{id}': {
      get: {
        tags: ['Rodadas'],
        summary: 'Busca rodada por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: {
            description: 'Rodada encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Rodada' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Rodadas'],
        summary: 'Atualiza rodada por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RodadaInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Rodada atualizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Rodada' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Rodadas'],
        summary: 'Remove rodada por ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          204: { description: 'Rodada removida' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
  components: {
    parameters: {
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
      },
    },
    responses: {
      BadRequest: {
        description: 'Requisicao invalida',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorMessage' },
          },
        },
      },
      NotFound: {
        description: 'Recurso nao encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorMessage' },
          },
        },
      },
    },
    schemas: {
      ErrorMessage: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      JogadorInput: {
        type: 'object',
        required: ['nome', 'idade'],
        properties: {
          nome: { type: 'string' },
          idade: { type: 'integer' },
          time_id: { type: 'integer', nullable: true },
          posicao: { type: 'string', nullable: true },
          valor_mercado: { type: 'string', nullable: true },
        },
        example: {
          nome: 'Neymar Jr',
          idade: 33,
          time_id: 1,
          posicao: 'Atacante',
          valor_mercado: '25000000',
        },
      },
      Jogador: {
        allOf: [
          { $ref: '#/components/schemas/JogadorInput' },
          {
            type: 'object',
            properties: {
              id: { type: 'integer' },
            },
          },
        ],
        example: {
          id: 10,
          nome: 'Neymar Jr',
          idade: 33,
          time_id: 1,
          posicao: 'Atacante',
          valor_mercado: '25000000',
        },
      },
      TimeInput: {
        type: 'object',
        required: ['name', 'city'],
        properties: {
          name: { type: 'string' },
          city: { type: 'string' },
          players: {
            type: 'array',
            items: { type: 'object' },
            default: [],
          },
        },
        example: {
          name: 'Santos FC',
          city: 'Santos',
        },
      },
      Time: {
        allOf: [
          { $ref: '#/components/schemas/TimeInput' },
          {
            type: 'object',
            properties: {
              id: { type: 'integer' },
            },
          },
        ],
        example: {
          id: 1,
          name: 'Santos FC',
          city: 'Santos',
          players: [],
        },
      },
      RodadaInput: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'string',
            format: 'date',
          },
          partidas: {
            type: 'array',
            default: [],
            items: {
              type: 'object',
              properties: {
                timeCasa: { type: 'integer', description: 'ID do time mandante' },
                timeFora: { type: 'integer', description: 'ID do time visitante' },
                golsTimeCasa: { type: 'integer' },
                golsTimeFora: { type: 'integer' },
                desempenhos: {
                  type: 'array',
                  description: 'Estatisticas por jogador nesta partida (nota calculada automaticamente)',
                  items: {
                    type: 'object',
                    required: ['jogador_id'],
                    properties: {
                      jogador_id: { type: 'integer' },
                      gols: { type: 'integer', default: 0 },
                      assistencias: { type: 'integer', default: 0 },
                      defesas: { type: 'integer', default: 0, description: 'Defesas do goleiro' },
                      passes_certos: { type: 'integer', default: 0 },
                      passes_errados: { type: 'integer', default: 0 },
                      passes_decisivos: { type: 'integer', default: 0, description: 'Passes que geraram chance de gol' },
                      dribles_certos: { type: 'integer', default: 0 },
                      dribles_errados: { type: 'integer', default: 0 },
                      interceptacoes: { type: 'integer', default: 0 },
                      finalizacoes_no_gol: { type: 'integer', default: 0 },
                      finalizacoes_fora: { type: 'integer', default: 0 },
                      cartao_amarelo: { type: 'boolean', default: false },
                      cartao_vermelho: { type: 'boolean', default: false },
                      minutos_jogados: { type: 'integer', default: 90 },
                      precisao_passes: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
                      precisao_dribles: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
                      precisao_finalizacoes: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
                      nota: { type: 'number', description: 'Nota da partida calculada automaticamente (1.0 a 10.0)' },
                    },
                  },
                },
              },
            },
          },
        },
        example: {
          data: '2025-09-14',
          partidas: [
            {
              timeCasa: 1,
              timeFora: 2,
              golsTimeCasa: 2,
              golsTimeFora: 1,
              desempenhos: [
                {
                  jogador_id: 10,
                  gols: 1,
                  assistencias: 1,
                  defesas: 0,
                  passes_certos: 47,
                  passes_errados: 9,
                  passes_decisivos: 3,
                  dribles_certos: 6,
                  dribles_errados: 2,
                  interceptacoes: 1,
                  finalizacoes_no_gol: 3,
                  finalizacoes_fora: 1,
                  cartao_amarelo: false,
                  cartao_vermelho: false,
                  minutos_jogados: 82,
                },
              ],
            },
          ],
        },
      },
      Rodada: {
        allOf: [
          { $ref: '#/components/schemas/RodadaInput' },
          {
            type: 'object',
            properties: {
              id: { type: 'integer' },
            },
          },
        ],
        example: {
          id: 1,
          data: '2025-09-14',
          partidas: [
            {
              timeCasa: 1,
              timeFora: 2,
              golsTimeCasa: 2,
              golsTimeFora: 1,
              desempenhos: [
                {
                  jogador_id: 10,
                  gols: 1,
                  assistencias: 1,
                  defesas: 0,
                  passes_certos: 47,
                  passes_errados: 9,
                  passes_decisivos: 3,
                  dribles_certos: 6,
                  dribles_errados: 2,
                  interceptacoes: 1,
                  finalizacoes_no_gol: 3,
                  finalizacoes_fora: 1,
                  cartao_amarelo: false,
                  cartao_vermelho: false,
                  minutos_jogados: 82,
                  precisao_passes: 0.84,
                  precisao_dribles: 0.75,
                  precisao_finalizacoes: 0.75,
                  nota: 8.8,
                },
              ],
            },
          ],
        },
      },

    },
  },
};

module.exports = openApiSpec;
