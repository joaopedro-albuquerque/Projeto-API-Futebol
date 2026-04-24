const { query } = require('../database/postgres');
const { processarPartidas, formatarRodada } = require('../utils/partidas');
const { parseTabularFile, toBoolean, toNullableNumber, toNullableString } = require('../utils/csv');

const carregarRodada = async (rodadaId) => {
  const result = await query('SELECT id, data, partidas FROM rodadas WHERE id = $1', [rodadaId]);
  return result.rows[0] || null;
};

const validarTimes = async (timeCasa, timeFora) => {
  const result = await query('SELECT id FROM times WHERE id = ANY($1::int[])', [[timeCasa, timeFora]]);
  return result.rows.length === 2;
};

const formatarPartidasDaRodada = (rodada) => {
  const rodadaFormatada = formatarRodada(rodada);
  return rodadaFormatada.partidas.map((partida) => ({
    rodada_id: rodadaFormatada.id,
    numeroRodada: rodadaFormatada.numeroRodada,
    ...partida,
    dataRodada: rodadaFormatada.data,
    dataPartida: partida.dataPartida ?? rodadaFormatada.data,
  }));
};

const montarMapaTimes = async () => {
  const result = await query('SELECT id, name FROM times');
  return new Map(result.rows.map((t) => [Number(t.id), t.name]));
};

const anexarNomeTimes = (partidas, timeMap) =>
  partidas.map((partida) => ({
    ...partida,
    timeCasaNome: timeMap.get(Number(partida.timeCasa)) || null,
    timeForaNome: timeMap.get(Number(partida.timeFora)) || null,
  }));

const resolveTimeIdByRow = async (row, prefix) => {
  const id = toNullableNumber(row[`${prefix}_id`]);
  if (id != null) return id;

  const nome = toNullableString(row[`${prefix}_nome`] || row[prefix]);
  if (!nome) return null;

  const result = await query('SELECT id FROM times WHERE name ILIKE $1 ORDER BY id ASC LIMIT 1', [nome]);
  return result.rows[0]?.id ?? null;
};

const resolveJogador = async (row) => {
  const jogadorId = toNullableNumber(row.jogador_id);
  if (jogadorId != null) {
    const result = await query(
      'SELECT id, nome, posicao FROM jogadores WHERE id = $1',
      [jogadorId]
    );
    return result.rows[0] || null;
  }

  const nome = toNullableString(row.jogador_nome || row.nome_jogador || row.jogador);
  if (!nome) return null;

  const result = await query(
    'SELECT id, nome, posicao FROM jogadores WHERE nome ILIKE $1 ORDER BY id ASC LIMIT 1',
    [nome]
  );
  return result.rows[0] || null;
};

const findOrCreateRodadaByDate = async (dataRodada) => {
  const existing = await query(
    'SELECT id, data, partidas FROM rodadas WHERE data = $1 ORDER BY id ASC LIMIT 1',
    [dataRodada]
  );

  if (existing.rows[0]) return existing.rows[0];

  const created = await query(
    'INSERT INTO rodadas (data, partidas) VALUES ($1, $2::jsonb) RETURNING id, data, partidas',
    [dataRodada, JSON.stringify([])]
  );

  return created.rows[0];
};

const createPartida = async (req, res, next) => {
  try {
    const {
      rodada_id,
      timeCasa,
      timeFora,
      golsTimeCasa = 0,
      golsTimeFora = 0,
      dataPartida = null,
      desempenhos = [],
    } = req.body;

    if (!rodada_id || !timeCasa || !timeFora) {
      return res.status(400).json({ message: 'Campos obrigatorios: rodada_id, timeCasa e timeFora.' });
    }

    const rodadaId = Number(rodada_id);
    if (!Number.isInteger(rodadaId) || rodadaId <= 0) {
      return res.status(400).json({ message: 'rodada_id invalido.' });
    }

    const rodada = await carregarRodada(rodadaId);
    if (!rodada) return res.status(404).json({ message: 'Rodada nao encontrada.' });

    const timeCasaId = Number(timeCasa);
    const timeForaId = Number(timeFora);

    if (!Number.isInteger(timeCasaId) || !Number.isInteger(timeForaId)) {
      return res.status(400).json({ message: 'timeCasa e timeFora devem ser ids numericos.' });
    }

    const timesValidos = await validarTimes(timeCasaId, timeForaId);
    if (!timesValidos) {
      return res.status(400).json({ message: 'timeCasa ou timeFora nao encontrado.' });
    }

    const partidasProcessadas = processarPartidas([
      ...(rodada.partidas ?? []),
      { timeCasa: timeCasaId, timeFora: timeForaId, golsTimeCasa, golsTimeFora, dataPartida, desempenhos },
    ]);

    await query(
      'UPDATE rodadas SET partidas = $1::jsonb WHERE id = $2',
      [JSON.stringify(partidasProcessadas), rodadaId]
    );

    const partidaCriada = partidasProcessadas[partidasProcessadas.length - 1];
    return res.status(201).json({ rodada_id: rodadaId, ...partidaCriada });
  } catch (error) {
    return next(error);
  }
};

const getAllPartidas = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    // Obter contagem total de partidas em todas as rodadas
    const countResult = await query(
      'SELECT COUNT(*) as total FROM rodadas, LATERAL jsonb_array_elements(rodadas.partidas) as p'
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Obter partidas com LIMIT/OFFSET no banco (muito mais eficiente)
    const result = await query(`
      SELECT 
        r.id as rodada_id,
        r.data as data_rodada,
        p->>'id' as id,
        p->>'numeroPartida' as numeroPartida,
        (p->>'timeCasa')::int as timeCasa,
        (p->>'timeFora')::int as timeFora,
        p->>'placar' as placar,
        p->>'data' as data_partida,
        p->'desempenhos' as desempenhos
      FROM rodadas r,
      LATERAL jsonb_array_elements(r.partidas) as p
      ORDER BY r.id ASC, (p->>'numeroPartida')::int ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Pré-carregar IDs de times e jogadores
    const timeIds = new Set();
    const jogadorIds = new Set();
    
    for (const p of result.rows) {
      if (p.timecasa) timeIds.add(parseInt(p.timecasa, 10));
      if (p.timefora) timeIds.add(parseInt(p.timefora, 10));
      
      // Coletar IDs de jogadores dos desempenhos
      if (Array.isArray(p.desempenhos)) {
        for (const desempenho of p.desempenhos) {
          if (desempenho.jogador_id) {
            jogadorIds.add(parseInt(desempenho.jogador_id, 10));
          }
        }
      }
    }

    // Bulk query: nomes dos times
    const timeMap = new Map();
    if (timeIds.size > 0) {
      const timesResult = await query(
        'SELECT id, name FROM times WHERE id = ANY($1::int[])',
        [Array.from(timeIds)]
      );
      for (const t of timesResult.rows) {
        timeMap.set(t.id, t.name);
      }
    }

    // Bulk query: nomes dos jogadores
    const jogadorMap = new Map();
    if (jogadorIds.size > 0) {
      const jogadoresResult = await query(
        'SELECT id, nome FROM jogadores WHERE id = ANY($1::int[])',
        [Array.from(jogadorIds)]
      );
      for (const j of jogadoresResult.rows) {
        jogadorMap.set(j.id, j.nome);
      }
    }

    // Montar resposta com nomes dos times e jogadores
    const partidas = result.rows.map(p => ({
      rodada_id: parseInt(p.rodada_id, 10),
      numeroRodada: parseInt(p.rodada_id, 10),
      id: p.id,
      numeroPartida: parseInt(p.numeropartida, 10),
      timeCasa: parseInt(p.timecasa, 10),
      timeCasaNome: timeMap.get(parseInt(p.timecasa, 10)) || 'Desconhecido',
      timeFora: parseInt(p.timefora, 10),
      timeForaNome: timeMap.get(parseInt(p.timefora, 10)) || 'Desconhecido',
      placar: p.placar,
      data: p.data_partida || p.data_rodada,
      desempenhos: Array.isArray(p.desempenhos) 
        ? p.desempenhos.map(d => ({
            ...d,
            jogador_id: parseInt(d.jogador_id, 10),
            jogador_nome: jogadorMap.get(parseInt(d.jogador_id, 10)) || 'Desconhecido',
          }))
        : [],
    }));

    return res.json({
      data: partidas,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const getPartidaById = async (req, res, next) => {
  try {
    const rodadaId = Number(req.params.rodadaId);
    const numeroPartida = Number(req.params.numeroPartida);

    if (!Number.isInteger(rodadaId) || !Number.isInteger(numeroPartida)) {
      return res.status(400).json({ message: 'rodadaId ou numeroPartida invalido.' });
    }

    const rodada = await carregarRodada(rodadaId);
    if (!rodada) return res.status(404).json({ message: 'Rodada nao encontrada.' });

    const partidas = formatarPartidasDaRodada(rodada);
    const partida = partidas.find((p) => p.numeroPartida === numeroPartida);

    if (!partida) return res.status(404).json({ message: 'Partida nao encontrada.' });
    const timeMap = await montarMapaTimes();
    return res.json(anexarNomeTimes([partida], timeMap)[0]);
  } catch (error) {
    return next(error);
  }
};

const updatePartida = async (req, res, next) => {
  try {
    const rodadaId = Number(req.params.rodadaId);
    const numeroPartida = Number(req.params.numeroPartida);
    const { timeCasa, timeFora, golsTimeCasa = 0, golsTimeFora = 0, dataPartida = null, desempenhos = [] } = req.body;

    if (!Number.isInteger(rodadaId) || !Number.isInteger(numeroPartida)) {
      return res.status(400).json({ message: 'rodadaId ou numeroPartida invalido.' });
    }

    if (!timeCasa || !timeFora) {
      return res.status(400).json({ message: 'Campos obrigatorios: timeCasa e timeFora.' });
    }

    const rodada = await carregarRodada(rodadaId);
    if (!rodada) return res.status(404).json({ message: 'Rodada nao encontrada.' });

    const timeCasaId = Number(timeCasa);
    const timeForaId = Number(timeFora);

    if (!Number.isInteger(timeCasaId) || !Number.isInteger(timeForaId)) {
      return res.status(400).json({ message: 'timeCasa e timeFora devem ser ids numericos.' });
    }

    const timesValidos = await validarTimes(timeCasaId, timeForaId);
    if (!timesValidos) {
      return res.status(400).json({ message: 'timeCasa ou timeFora nao encontrado.' });
    }

    const partidas = processarPartidas(rodada.partidas ?? []);
    const index = partidas.findIndex((p) => p.numeroPartida === numeroPartida);

    if (index === -1) return res.status(404).json({ message: 'Partida nao encontrada.' });

    partidas[index] = processarPartidas([
      {
        numeroPartida,
        timeCasa: timeCasaId,
        timeFora: timeForaId,
        golsTimeCasa,
        golsTimeFora,
        dataPartida,
        desempenhos,
      },
    ])[0];

    const partidasReordenadas = processarPartidas(partidas);

    await query('UPDATE rodadas SET partidas = $1::jsonb WHERE id = $2', [
      JSON.stringify(partidasReordenadas),
      rodadaId,
    ]);

    const partidaAtualizada = partidasReordenadas.find((p) => p.numeroPartida === numeroPartida);
    return res.json({ rodada_id: rodadaId, ...partidaAtualizada });
  } catch (error) {
    return next(error);
  }
};

const deletePartida = async (req, res, next) => {
  try {
    const rodadaId = Number(req.params.rodadaId);
    const numeroPartida = Number(req.params.numeroPartida);

    if (!Number.isInteger(rodadaId) || !Number.isInteger(numeroPartida)) {
      return res.status(400).json({ message: 'rodadaId ou numeroPartida invalido.' });
    }

    const rodada = await carregarRodada(rodadaId);
    if (!rodada) return res.status(404).json({ message: 'Rodada nao encontrada.' });

    const partidas = processarPartidas(rodada.partidas ?? []);
    const index = partidas.findIndex((p) => p.numeroPartida === numeroPartida);

    if (index === -1) return res.status(404).json({ message: 'Partida nao encontrada.' });

    partidas.splice(index, 1);
    const partidasReordenadas = processarPartidas(partidas);

    await query('UPDATE rodadas SET partidas = $1::jsonb WHERE id = $2', [
      JSON.stringify(partidasReordenadas),
      rodadaId,
    ]);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const searchPartidas = async (req, res, next) => {
  try {
    const nome = String(req.query.nome || '').trim();
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    if (!nome) {
      return res.status(400).json({ message: 'Informe o parametro nome para pesquisa.' });
    }

    // Buscar rodadas e partidas com nomes de times
    const result = await query(`
      SELECT DISTINCT r.id, r.data, r.partidas
      FROM rodadas r
      JOIN LATERAL jsonb_array_elements(r.partidas) p ON TRUE
      JOIN times tc ON tc.id = (p->>'timeCasa')::int
      JOIN times tf ON tf.id = (p->>'timeFora')::int
      WHERE tc.name ILIKE $1 OR tf.name ILIKE $1
      ORDER BY r.id ASC
    `, [`%${nome}%`]);

    // Extrair todas as partidas que correspondem à busca
    const allPartidas = result.rows.flatMap(formatarPartidasDaRodada);
    
    // Coletar IDs de times e jogadores
    const timeIds = new Set();
    const jogadorIds = new Set();
    
    for (const p of allPartidas) {
      if (p.timeCasa) timeIds.add(p.timeCasa);
      if (p.timeFora) timeIds.add(p.timeFora);
      
      if (Array.isArray(p.desempenhos)) {
        for (const desempenho of p.desempenhos) {
          if (desempenho.jogador_id) {
            jogadorIds.add(desempenho.jogador_id);
          }
        }
      }
    }

    // Bulk query: nomes dos times
    const timeMap = new Map();
    if (timeIds.size > 0) {
      const timesResult = await query(
        'SELECT id, name FROM times WHERE id = ANY($1::int[])',
        [Array.from(timeIds)]
      );
      for (const t of timesResult.rows) {
        timeMap.set(t.id, t.name);
      }
    }

    // Bulk query: nomes dos jogadores
    const jogadorMap = new Map();
    if (jogadorIds.size > 0) {
      const jogadoresResult = await query(
        'SELECT id, nome FROM jogadores WHERE id = ANY($1::int[])',
        [Array.from(jogadorIds)]
      );
      for (const j of jogadoresResult.rows) {
        jogadorMap.set(j.id, j.nome);
      }
    }

    // Enriquecer partidas com nomes e paginar
    const partidasEnriquecidas = allPartidas.map(p => ({
      ...p,
      timeCasaNome: timeMap.get(p.timeCasa) || 'Desconhecido',
      timeForaNome: timeMap.get(p.timeFora) || 'Desconhecido',
      desempenhos: Array.isArray(p.desempenhos)
        ? p.desempenhos.map(d => ({
            ...d,
            jogador_id: parseInt(d.jogador_id, 10),
            jogador_nome: jogadorMap.get(parseInt(d.jogador_id, 10)) || 'Desconhecido',
          }))
        : [],
    }));

    const total = partidasEnriquecidas.length;
    const paginadas = partidasEnriquecidas.slice(offset, offset + limit);

    return res.json({
      data: paginadas,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const importPartidasCsv = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Envie um arquivo no campo file (CSV ou XLSX).' });
    }

    const rows = parseTabularFile(req.file.buffer, req.file.mimetype);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Envie um CSV com pelo menos uma linha de dados.' });
    }

    const groups = new Map();
    const erros = [];

    for (const row of rows) {
      const dataRodada = toNullableString(row.data_rodada || row.data_rodada_inicio || row.data_rodada_inicial || row.data);
      const dataPartida = toNullableString(row.data_partida || row.data_jogo || row.data_match || row.data) || dataRodada;
      const numeroPartida = toNullableNumber(row.numero_partida) ?? 1;
      const timeCasa = await resolveTimeIdByRow(row, 'time_casa');
      const timeFora = await resolveTimeIdByRow(row, 'time_fora');
      const jogador = await resolveJogador(row);

      if (!dataRodada || timeCasa == null || timeFora == null || !jogador) {
        erros.push({
          linha: row,
          motivo: 'data_rodada, time_casa, time_fora e jogador precisam existir para importar a linha.',
        });
        continue;
      }

      const key = `${dataRodada}::${dataPartida || ''}::${numeroPartida}`;
      if (!groups.has(key)) {
        groups.set(key, {
          dataRodada,
          dataPartida,
          numeroPartida,
          timeCasa,
          timeFora,
          golsTimeCasa: toNullableNumber(row.gols_time_casa) ?? 0,
          golsTimeFora: toNullableNumber(row.gols_time_fora) ?? 0,
          desempenhos: [],
        });
      }

      groups.get(key).desempenhos.push({
        jogador_id: jogador.id,
        posicao: jogador.posicao,
        is_goleiro: String(jogador.posicao || '').toLowerCase() === 'goleiro',
        minutos: toNullableNumber(row.minutos ?? row.minutos_jogados) ?? 90,
        gols: toNullableNumber(row.gols) ?? 0,
        assistencias: toNullableNumber(row.assistencias) ?? 0,
        xg: toNullableNumber(row.xg) ?? 0,
        xa: toNullableNumber(row.xa) ?? 0,
        total_chutes: toNullableNumber(row.total_chutes) ?? 0,
        chutes_no_gol: toNullableNumber(row.chutes_no_gol) ?? 0,
        xgot: toNullableNumber(row.xgot) ?? 0,
        chutes_fora: toNullableNumber(row.chutes_fora) ?? 0,
        trave: toNullableNumber(row.trave) ?? 0,
        impedimentos: toNullableNumber(row.impedimentos) ?? 0,
        defesas: toNullableNumber(row.defesas) ?? 0,
        defesas_importantes: toNullableNumber(row.defesas_importantes) ?? 0,
        gols_sofridos: toNullableNumber(row.gols_sofridos) ?? 0,
        penaltis_defendidos: toNullableNumber(row.penaltis_defendidos) ?? 0,
        saidas_certas: toNullableNumber(row.saidas_certas) ?? 0,
        jogo_sem_sofrer_gol: toBoolean(row.jogo_sem_sofrer_gol, false),
        passes_certos: toNullableNumber(row.passes_certos) ?? 0,
        passes_errados: toNullableNumber(row.passes_errados) ?? 0,
        passes_completos: toNullableNumber(row.passes_completos) ?? 0,
        passes_tentados: toNullableNumber(row.passes_tentados) ?? 0,
        passes_decisivos: toNullableNumber(row.passes_decisivos) ?? 0,
        chances_perigosas_criadas: toNullableNumber(row.chances_perigosas_criadas) ?? 0,
        passes_ultimo_terco: toNullableNumber(row.passes_ultimo_terco) ?? 0,
        passes_para_tras: toNullableNumber(row.passes_para_tras) ?? 0,
        cruzamentos_completos: toNullableNumber(row.cruzamentos_completos) ?? 0,
        cruzamentos_tentados: toNullableNumber(row.cruzamentos_tentados) ?? 0,
        acoes_com_bola: toNullableNumber(row.acoes_com_bola) ?? 0,
        faltas_sofridas: toNullableNumber(row.faltas_sofridas) ?? 0,
        faltas_cometidas: toNullableNumber(row.faltas_cometidas) ?? 0,
        posse_recuperada_terco_final: toNullableNumber(row.posse_recuperada_terco_final) ?? 0,
        posse_perdida: toNullableNumber(row.posse_perdida) ?? 0,
        driblado: toNullableNumber(row.driblado) ?? 0,
        chutes_bloqueados: toNullableNumber(row.chutes_bloqueados) ?? 0,
        perigo_afastado: toNullableNumber(row.perigo_afastado) ?? 0,
        dribles_certos: toNullableNumber(row.dribles_certos) ?? 0,
        dribles_errados: toNullableNumber(row.dribles_errados) ?? 0,
        interceptacoes: toNullableNumber(row.interceptacoes) ?? 0,
        recuperacoes_posse: toNullableNumber(row.recuperacoes_posse) ?? 0,
        duelos_aereos_ganhos: toNullableNumber(row.duelos_aereos_ganhos) ?? 0,
        duelos_aereos_totais: toNullableNumber(row.duelos_aereos_totais) ?? 0,
        duelos_chao_ganhos: toNullableNumber(row.duelos_chao_ganhos) ?? 0,
        duelos_chao_totais: toNullableNumber(row.duelos_chao_totais) ?? 0,
        finalizacoes_no_gol: toNullableNumber(row.finalizacoes_no_gol) ?? 0,
        finalizacoes_fora: toNullableNumber(row.finalizacoes_fora) ?? 0,
        cartao_amarelo: toBoolean(row.cartao_amarelo, false),
        cartao_vermelho: toBoolean(row.cartao_vermelho, false),
      });
    }

    const importadas = [];

    for (const group of groups.values()) {
      const rodada = await findOrCreateRodadaByDate(group.dataRodada);
      const partidasExistentes = rodada.partidas ?? [];
      const partidasAtualizadas = processarPartidas([
        ...partidasExistentes,
        {
          numeroPartida: group.numeroPartida,
          dataPartida: group.dataPartida,
          timeCasa: group.timeCasa,
          timeFora: group.timeFora,
          golsTimeCasa: group.golsTimeCasa,
          golsTimeFora: group.golsTimeFora,
          desempenhos: group.desempenhos,
        },
      ]);

      await query('UPDATE rodadas SET partidas = $1::jsonb WHERE id = $2', [
        JSON.stringify(partidasAtualizadas),
        rodada.id,
      ]);

      importadas.push({
        rodada_id: rodada.id,
        dataRodada: group.dataRodada,
        dataPartida: group.dataPartida,
        numeroPartida: group.numeroPartida,
        jogadores_importados: group.desempenhos.length,
      });
    }

    return res.status(207).json({
      partidas_importadas: importadas.length,
      linhas_com_erro: erros.length,
      detalhes_partidas: importadas,
      erros,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPartida,
  getAllPartidas,
  getPartidaById,
  updatePartida,
  deletePartida,
  searchPartidas,
  importPartidasCsv,
};
