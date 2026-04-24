const { query } = require('../database/postgres');
const { processarPartidas, formatarRodada } = require('../utils/partidas');

/**
 * Enriquece rodadas com nomes de jogadores e times.
 * Busca todos os jogadores e times necessários em uma única consulta e mapeia.
 */
const enriquecerRodadas = async (rodadas) => {
  if (!rodadas || rodadas.length === 0) return rodadas;

  // Coletar todos os IDs de jogadores e times das rodadas
  const jogadorIds = new Set();
  const timeIds = new Set();

  for (const rodada of rodadas) {
    for (const partida of rodada.partidas ?? []) {
      timeIds.add(Number(partida.timeCasa));
      timeIds.add(Number(partida.timeFora));
      for (const desemp of partida.desempenhos ?? []) {
        jogadorIds.add(Number(desemp.jogador_id));
      }
    }
  }

  if (jogadorIds.size === 0 && timeIds.size === 0) return rodadas;

  // Buscar nomes de jogadores e times
  const [jogRes, timRes] = await Promise.all([
    jogadorIds.size > 0
      ? query(
          'SELECT id, nome FROM jogadores WHERE id = ANY($1::int[])',
          [Array.from(jogadorIds)]
        )
      : Promise.resolve({ rows: [] }),
    timeIds.size > 0
      ? query(
          'SELECT id, name FROM times WHERE id = ANY($1::int[])',
          [Array.from(timeIds)]
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const jogadorMap = new Map(jogRes.rows.map((j) => [j.id, j.nome]));
  const timeMap = new Map(timRes.rows.map((t) => [t.id, t.name]));

  // Enriquecer rodadas com nomes
  return rodadas.map((rodada) => ({
    ...rodada,
    partidas: (rodada.partidas ?? []).map((partida) => {
      const timeCasaId = Number(partida.timeCasa);
      const timeForaId = Number(partida.timeFora);
      return {
        ...partida,
        timeCasaNome: timeMap.get(timeCasaId) ?? null,
        timeForaNome: timeMap.get(timeForaId) ?? null,
        desempenhos: (partida.desempenhos ?? []).map((desemp) => ({
          ...desemp,
          jogador_nome: jogadorMap.get(Number(desemp.jogador_id)) ?? null,
        })),
      };
    }),
  }));
};

const createRodada = async (req, res, next) => {
  try {
    const { data, partidas = [] } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Campo obrigatorio: data.' });
    }

    const result = await query(
      `
        INSERT INTO rodadas (data, partidas)
        VALUES ($1, $2::jsonb)
        RETURNING id, data, partidas
      `,
      [data, JSON.stringify(processarPartidas(partidas))]
    );

    let rodada = formatarRodada(result.rows[0]);
    const rodadas = await enriquecerRodadas([rodada]);
    return res.status(201).json(rodadas[0]);
  } catch (error) {
    return next(error);
  }
};

const getAllRodadas = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      query('SELECT id, data, partidas FROM rodadas ORDER BY id ASC LIMIT $1 OFFSET $2', [limit, offset]),
      query('SELECT COUNT(*) FROM rodadas'),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    let rodadas = dataResult.rows.map(formatarRodada);
    rodadas = await enriquecerRodadas(rodadas);

    return res.json({
      data: rodadas,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const searchRodadas = async (req, res, next) => {
  try {
    const nome   = String(req.query.nome || '').trim();
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    if (!nome) {
      return res.status(400).json({ message: 'Informe o parametro nome para pesquisa.' });
    }

    const [dataResult, countResult] = await Promise.all([
      query(
        `
          SELECT DISTINCT r.id, r.data, r.partidas
          FROM rodadas r
          JOIN LATERAL jsonb_array_elements(r.partidas) p ON TRUE
          JOIN times tc ON tc.id = (p->>'timeCasa')::int
          JOIN times tf ON tf.id = (p->>'timeFora')::int
          WHERE tc.name ILIKE $1 OR tf.name ILIKE $1
          ORDER BY r.id ASC
          LIMIT $2 OFFSET $3
        `,
        [`%${nome}%`, limit, offset]
      ),
      query(
        `
          SELECT COUNT(DISTINCT r.id)
          FROM rodadas r
          JOIN LATERAL jsonb_array_elements(r.partidas) p ON TRUE
          JOIN times tc ON tc.id = (p->>'timeCasa')::int
          JOIN times tf ON tf.id = (p->>'timeFora')::int
          WHERE tc.name ILIKE $1 OR tf.name ILIKE $1
        `,
        [`%${nome}%`]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    let rodadas = dataResult.rows.map(formatarRodada);
    rodadas = await enriquecerRodadas(rodadas);

    return res.json({
      data: rodadas,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const getRodadaById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT id, data, partidas FROM rodadas WHERE id = $1', [id]);

    if (!result.rows[0]) return res.status(404).send('Rodada nao encontrada.');

    let rodada = formatarRodada(result.rows[0]);
    const rodadas = await enriquecerRodadas([rodada]);
    return res.json(rodadas[0]);
  } catch (error) {
    return next(error);
  }
};

const updateRodada = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { data, partidas = [] } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Campo obrigatorio: data.' });
    }

    const result = await query(
      `
        UPDATE rodadas
        SET data = $1, partidas = $2::jsonb
        WHERE id = $3
        RETURNING id, data, partidas
      `,
      [data, JSON.stringify(processarPartidas(partidas)), id]
    );

    if (!result.rows[0]) return res.status(404).send('Rodada nao encontrada.');

    let rodada = formatarRodada(result.rows[0]);
    const rodadas = await enriquecerRodadas([rodada]);
    return res.json(rodadas[0]);
  } catch (error) {
    return next(error);
  }
};

const deleteRodada = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query('DELETE FROM rodadas WHERE id = $1', [id]);

    if (result.rowCount === 0) return res.status(404).send('Rodada nao encontrada.');
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRodada,
  getAllRodadas,
  searchRodadas,
  getRodadaById,
  updateRodada,
  deleteRodada,
};
