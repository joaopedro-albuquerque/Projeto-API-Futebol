const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: '⚽ API Brasileirão',
    version: '1.0.0',
    description:
      '🏆 API completa para gerenciamento do **Campeonato Brasileiro de Futebol (Série A)**. ' +
      '📊 Suporta importação massiva de jogadores, registro de partidas com estatísticas detalhadas por jogador ' +
      '(passes, dribles, finalizações, interceptações, cartões, minutos jogados) e cálculo automático ' +
      'de precisões e nota de desempenho por partida (escala 1.0 a 10.0). ' +
      '🔄 Integração com 365Scores para sincronização automática de estatísticas. ' +
      '📑 Com suporte a paginação em todos os endpoints de listagem.',
  },
  servers: [
    {
      url: '/',
      description: '🚀 Servidor Atual',
    },
    {
      url: 'http://localhost:3000',
      description: '💻 Ambiente Local',
    }
  ],
  tags: [
    { name: 'Jogadores', description: '👥 Gerenciamento de jogadores com importação massiva via CSV/XLSX' },
    { name: 'Times', description: '🏆 Gerenciamento de times do Brasileirão e seus elencos' },
    { name: 'Rodadas', description: '⚽ Registro de rodadas, partidas e desempenho dos jogadores com cálculo automático de notas' },
    { name: 'Partidas', description: '📊 Gerenciamento de partidas e importação massiva via CSV/XLSX' },
  ],
  paths: {
    '/api/jogadores': {
      get: {
        tags: ['Jogadores'],
        summary: 'Lista todos os jogadores com paginação',
        description: 'Retorna lista paginada de jogadores do Brasileirão. Use ?page=1&limit=20 para controlar paginação.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Itens por página (máximo 100)'
          }
        ],
        responses: {
          200: {
            description: 'Lista paginada de jogadores',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Jogador' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Jogadores'],
        summary: 'Cria um novo jogador',
        description: 'Cria um jogador individual no Brasileirão. Para importação em massa, use /importar.',
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
            description: '✅ Jogador criado com sucesso',
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
    '/api/jogadores/importar/csv': {
      post: {
        tags: ['Jogadores'],
        summary: '📤 Importação massiva de jogadores por arquivo',
        description:
          '📋 Upload via multipart/form-data no campo file. Formatos aceitos: .csv e .xlsx.\n\n' +
          '✅ Formato esperado das colunas:\n' +
          '- nome (obrigatório)\n' +
          '- idade (obrigatório)\n' +
          '- time_id (opcional) ou time_nome (opcional)\n' +
          '- posicao (opcional)\n' +
          '- valor_mercado (opcional)\n\n' +
          '📝 Exemplo CSV:\n' +
          'nome,idade,time_nome,posicao,valor_mercado\n' +
          'Neymar Jr,33,Santos FC,Atacante,25000000\n' +
          'Alisson,31,Liverpool,Goleiro,28000000',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: '📄 Arquivo .csv ou .xlsx com os jogadores.',
                  },
                },
              },
            },
          },
        },
        responses: {
          207: {
            description: 'Resultado da importacao do arquivo',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    criados: { type: 'integer' },
                    erros: { type: 'integer' },
                    jogadores_criados: { type: 'array', items: { $ref: '#/components/schemas/Jogador' } },
                    linhas_com_erro: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          linha: { type: 'object' },
                          motivo: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                example: {
                  criados: 2,
                  erros: 1,
                  jogadores_criados: [
                    { id: 10, nome: 'Neymar Jr', idade: 33, time_id: 1, posicao: 'Atacante', valor_mercado: '25000000' },
                    { id: 11, nome: 'Alisson', idade: 31, time_id: 2, posicao: 'Goleiro', valor_mercado: '28000000' },
                  ],
                  linhas_com_erro: [
                    { linha: { nome: 'Invalido' }, motivo: 'nome e idade sao obrigatorios.' },
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
        summary: 'Lista todos os times do Brasileirão com paginação',
        description: 'Retorna lista paginada de times. Use ?page=1&limit=20 para controlar paginação.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Itens por página (máximo 100)'
          }
        ],
        responses: {
          200: {
            description: 'Lista paginada de times',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Time' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Times'],
        summary: 'Cria um novo time',
        description: 'Cria um time que participará do Brasileirão.',
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
            description: '✅ Time criado com sucesso',
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
        summary: 'Lista todas as rodadas do Brasileirão com paginação',
        description: 'Retorna lista paginada de rodadas com dados enriquecidos (nomes de times e jogadores). Use ?page=1&limit=20 para controlar paginação.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Itens por página (máximo 100)'
          }
        ],
        responses: {
          200: {
            description: '⚽ Lista paginada de rodadas com estatísticas enriquecidas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Rodada' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Rodadas'],
        summary: 'Cria uma nova rodada com partidas',
        description: '📅 Cria uma rodada do Brasileirão com partidas e desempenho dos jogadores. Os campos de precisão e nota são calculados automaticamente.',
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
            description: '✅ Rodada criada com sucesso',
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
    '/api/partidas/importar/csv': {
      post: {
        tags: ['Partidas'],
        summary: 'Importacao massiva de partidas e desempenhos por arquivo',
        description:
          'Upload via multipart/form-data no campo file. Formatos aceitos: .csv e .xlsx.\n\n' +
          'Cada linha representa um jogador em uma partida. O agrupamento eh por data_rodada + data_partida + numero_partida.\n\n' +
          'Colunas base obrigatorias:\n' +
          '- data_rodada\n' +
          '- numero_partida\n' +
          '- time_casa_id ou time_casa_nome\n' +
          '- time_fora_id ou time_fora_nome\n' +
          '- jogador_id ou jogador_nome\n\n' +
          'Colunas recomendadas de desempenho:\n' +
          '- minutos, gols, assistencias, xg, xa, passes_completos, passes_tentados\n' +
          '- para goleiros: defesas, defesas_importantes, gols_sofridos, penaltis_defendidos, saidas_certas, jogo_sem_sofrer_gol\n\n' +
          'Exemplo CSV:\n' +
          'data_rodada,data_partida,numero_partida,time_casa_nome,time_fora_nome,gols_time_casa,gols_time_fora,jogador_nome,minutos,gols,assistencias,defesas,defesas_importantes,gols_sofridos\n' +
          '2026-04-20,2026-04-21,1,Santos FC,Palmeiras,2,1,Neymar Jr,90,1,1,0,0,0\n' +
          '2026-04-20,2026-04-21,1,Santos FC,Palmeiras,2,1,Alisson,90,0,0,6,3,1',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Arquivo .csv ou .xlsx com partidas e desempenhos.',
                  },
                },
              },
            },
          },
        },
        responses: {
          207: {
            description: 'Resultado da importacao do arquivo de partidas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    partidas_importadas: { type: 'integer' },
                    linhas_com_erro: { type: 'integer' },
                    detalhes_partidas: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          rodada_id: { type: 'integer' },
                          dataRodada: { type: 'string' },
                          dataPartida: { type: 'string', nullable: true },
                          numeroPartida: { type: 'integer' },
                          jogadores_importados: { type: 'integer' },
                        },
                      },
                    },
                    erros: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          linha: { type: 'object' },
                          motivo: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/jogadores/search': {
      get: {
        tags: ['Jogadores'],
        summary: '🔎 Busca jogadores por nome com paginação',
        description: 'Busca jogadores por trecho do nome. Suporta paginação com ?page=1&limit=20',
        parameters: [
          {
            name: 'nome',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Trecho do nome do jogador.',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Itens por página (máximo 100)'
          }
        ],
        responses: {
          200: {
            description: '✅ Jogadores encontrados (paginados)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Jogador' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/times/search': {
      get: {
        tags: ['Times'],
        summary: '🔎 Busca times por nome ou cidade com paginação',
        description: 'Busca times por trecho do nome ou cidade. Suporta paginação com ?page=1&limit=20',
        parameters: [
          {
            name: 'nome',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Trecho do nome ou cidade do time.',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Itens por página (máximo 100)'
          }
        ],
        responses: {
          200: {
            description: '✅ Times encontrados (paginados)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Time' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/rodadas/search': {
      get: {
        tags: ['Rodadas'],
        summary: '🔎 Busca rodadas por time com paginação',
        description: 'Busca rodadas que contenham um time pelo nome. Retorna dados enriquecidos com nomes. Suporta paginação com ?page=1&limit=20',
        parameters: [
          {
            name: 'nome',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Nome do time participante.',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Itens por página (máximo 100)'
          }
        ],
        responses: {
          200: {
            description: '✅ Rodadas encontradas (paginadas) com dados enriquecidos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Rodada' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/partidas': {
      get: {
        tags: ['Partidas'],
        summary: 'Lista todas as partidas com paginação',
        description: 'Retorna lista paginada de todas as partidas de todas as rodadas. Use ?page=1&limit=20 para controlar paginação.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Itens por página (máximo 100)'
          }
        ],
        responses: {
          200: {
            description: 'Lista paginada de partidas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Partida' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Partidas'],
        summary: 'Adiciona uma partida a uma rodada existente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PartidaInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Partida criada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Partida' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/partidas/search': {
      get: {
        tags: ['Partidas'],
        summary: 'Busca partidas com paginação',
        description: 'Busca partidas por nome de time e retorna resultados paginados. Use ?page=1&limit=20 para controlar paginação.',
        parameters: [
          {
            name: 'nome',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Nome do time participante (casa ou fora).',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Itens por página (máximo 100)'
          }
        ],
        responses: {
          200: {
            description: 'Partidas encontradas (paginadas)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Partida' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/partidas/{rodadaId}/{numeroPartida}': {
      get: {
        tags: ['Partidas'],
        summary: 'Busca partida por rodada e numero',
        parameters: [
          { $ref: '#/components/parameters/RodadaIdParam' },
          { $ref: '#/components/parameters/NumeroPartidaParam' },
        ],
        responses: {
          200: {
            description: 'Partida encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Partida' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Partidas'],
        summary: 'Atualiza uma partida existente',
        parameters: [
          { $ref: '#/components/parameters/RodadaIdParam' },
          { $ref: '#/components/parameters/NumeroPartidaParam' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PartidaUpdateInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Partida atualizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Partida' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Partidas'],
        summary: 'Remove uma partida de uma rodada',
        parameters: [
          { $ref: '#/components/parameters/RodadaIdParam' },
          { $ref: '#/components/parameters/NumeroPartidaParam' },
        ],
        responses: {
          204: { description: 'Partida removida' },
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
      RodadaIdParam: {
        name: 'rodadaId',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'ID da rodada',
      },
      NumeroPartidaParam: {
        name: 'numeroPartida',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
        description: 'Numero da partida dentro da rodada',
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
          numeroRodada: {
            type: 'integer',
            nullable: true,
            description: 'Opcional na entrada. A API usa o id da rodada como numeroRodada no retorno.',
          },
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
                numeroPartida: {
                  type: 'integer',
                  description: 'Sequencia da partida dentro da rodada. Se omitido, a API define automaticamente.',
                },
                dataPartida: {
                  type: 'string',
                  format: 'date',
                  nullable: true,
                  description: 'Data especifica da partida. Pode ser diferente da data de inicio da rodada.',
                },
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
                      minutos: { type: 'integer', default: 90, description: 'Alias para minutos_jogados' },
                      minutos_jogados: { type: 'integer', default: 90 },
                      gols: { type: 'integer', default: 0 },
                      assistencias: { type: 'integer', default: 0 },
                      xg: { type: 'number', default: 0 },
                      xa: { type: 'number', default: 0 },
                      total_chutes: { type: 'integer', default: 0 },
                      chutes_no_gol: { type: 'integer', default: 0 },
                      xgot: { type: 'number', default: 0 },
                      chutes_fora: { type: 'integer', default: 0 },
                      trave: { type: 'integer', default: 0 },
                      impedimentos: { type: 'integer', default: 0 },
                      posicao: { type: 'string', nullable: true, description: 'Posicao do jogador (Goleiro, Atacante, etc.)' },
                      is_goleiro: { type: 'boolean', default: false, description: 'Indica se o jogador e goleiro. Ativa calculos especificos de nota.' },
                      defesas: { type: 'integer', default: 0, description: 'Defesas do goleiro' },
                      defesas_importantes: { type: 'integer', default: 0 },
                      gols_sofridos: { type: 'integer', default: 0 },
                      penaltis_defendidos: { type: 'integer', default: 0 },
                      saidas_certas: { type: 'integer', default: 0 },
                      jogo_sem_sofrer_gol: { type: 'boolean', default: false },
                      passes_certos: { type: 'integer', default: 0 },
                      passes_errados: { type: 'integer', default: 0 },
                      passes_completos: { type: 'integer', default: 0 },
                      passes_tentados: { type: 'integer', default: 0 },
                      passes_decisivos: { type: 'integer', default: 0, description: 'Passes que geraram chance de gol' },
                      chances_perigosas_criadas: { type: 'integer', default: 0 },
                      passes_ultimo_terco: { type: 'integer', default: 0 },
                      passes_para_tras: { type: 'integer', default: 0 },
                      cruzamentos_completos: { type: 'integer', default: 0 },
                      cruzamentos_tentados: { type: 'integer', default: 0 },
                      acoes_com_bola: { type: 'integer', default: 0 },
                      faltas_sofridas: { type: 'integer', default: 0 },
                      faltas_cometidas: { type: 'integer', default: 0 },
                      posse_recuperada_terco_final: { type: 'integer', default: 0 },
                      posse_perdida: { type: 'integer', default: 0 },
                      driblado: { type: 'integer', default: 0 },
                      chutes_bloqueados: { type: 'integer', default: 0 },
                      perigo_afastado: { type: 'integer', default: 0 },
                      dribles_certos: { type: 'integer', default: 0 },
                      dribles_errados: { type: 'integer', default: 0 },
                      interceptacoes: { type: 'integer', default: 0 },
                      recuperacoes_posse: { type: 'integer', default: 0 },
                      duelos_aereos_ganhos: { type: 'integer', default: 0 },
                      duelos_aereos_totais: { type: 'integer', default: 0 },
                      duelos_chao_ganhos: { type: 'integer', default: 0 },
                      duelos_chao_totais: { type: 'integer', default: 0 },
                      finalizacoes_no_gol: { type: 'integer', default: 0 },
                      finalizacoes_fora: { type: 'integer', default: 0 },
                      cartao_amarelo: { type: 'boolean', default: false },
                      cartao_vermelho: { type: 'boolean', default: false },
                      precisao_passes: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
                      precisao_cruzamentos: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
                      precisao_dribles: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
                      precisao_finalizacoes: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
                      precisao_duelos_aereos: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
                      precisao_duelos_chao: { type: 'number', nullable: true, description: 'Calculado automaticamente (0 a 1)' },
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
              numeroPartida: 1,
              dataPartida: '2025-09-15',
              timeCasa: 1,
              timeFora: 2,
              golsTimeCasa: 2,
              golsTimeFora: 1,
              desempenhos: [
                {
                  jogador_id: 10,
                  minutos: 90,
                  gols: 1,
                  assistencias: 1,
                  xg: 0.25,
                  total_chutes: 6,
                  chutes_no_gol: 1,
                  xgot: 0.07,
                  chutes_fora: 1,
                  trave: 1,
                  xa: 0.32,
                  passes_completos: 32,
                  passes_tentados: 39,
                  passes_decisivos: 3,
                  chances_perigosas_criadas: 1,
                  passes_ultimo_terco: 5,
                  passes_para_tras: 3,
                  cruzamentos_completos: 1,
                  cruzamentos_tentados: 7,
                  acoes_com_bola: 70,
                  faltas_sofridas: 7,
                  faltas_cometidas: 1,
                  posse_recuperada_terco_final: 4,
                  posse_perdida: 19,
                  driblado: 0,
                  chutes_bloqueados: 4,
                  perigo_afastado: 0,
                  interceptacoes: 0,
                  recuperacoes_posse: 6,
                  duelos_aereos_ganhos: 1,
                  duelos_aereos_totais: 2,
                  duelos_chao_ganhos: 7,
                  duelos_chao_totais: 12,
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
              numeroRodada: { type: 'integer' },
            },
          },
        ],
        example: {
          id: 1,
          numeroRodada: 1,
          data: '2025-09-14',
          partidas: [
            {
              numeroPartida: 1,
              dataPartida: '2025-09-15',
              timeCasa: 1,
              timeFora: 2,
              golsTimeCasa: 2,
              golsTimeFora: 1,
              desempenhos: [
                {
                  jogador_id: 10,
                  minutos: 90,
                  gols: 1,
                  assistencias: 1,
                  xg: 0.25,
                  total_chutes: 6,
                  chutes_no_gol: 1,
                  xgot: 0.07,
                  chutes_fora: 1,
                  trave: 1,
                  xa: 0.32,
                  passes_completos: 32,
                  passes_tentados: 39,
                  passes_decisivos: 3,
                  chances_perigosas_criadas: 1,
                  passes_ultimo_terco: 5,
                  passes_para_tras: 3,
                  cruzamentos_completos: 1,
                  cruzamentos_tentados: 7,
                  acoes_com_bola: 70,
                  faltas_sofridas: 7,
                  faltas_cometidas: 1,
                  posse_recuperada_terco_final: 4,
                  posse_perdida: 19,
                  driblado: 0,
                  chutes_bloqueados: 4,
                  perigo_afastado: 0,
                  interceptacoes: 0,
                  recuperacoes_posse: 6,
                  duelos_aereos_ganhos: 1,
                  duelos_aereos_totais: 2,
                  duelos_chao_ganhos: 7,
                  duelos_chao_totais: 12,
                  precisao_passes: 0.84,
                  precisao_cruzamentos: 0.14,
                  precisao_finalizacoes: 0.5,
                  precisao_duelos_aereos: 0.5,
                  precisao_duelos_chao: 0.58,
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
