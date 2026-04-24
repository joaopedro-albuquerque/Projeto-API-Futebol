const { query } = require('../database/postgres');
const { processarPartidas, formatarRodada } = require('../utils/partidas');

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

    return res.status(201).json(formatarRodada(result.rows[0]));
  } catch (error) {
    return next(error);
  }
};

const getAllRodadas = async (req, res, next) => {
  try {
    const result = await query('SELECT id, data, partidas FROM rodadas ORDER BY id ASC');
    return res.json(result.rows.map(formatarRodada));
  } catch (error) {
    return next(error);
  }
};

const searchRodadas = async (req, res, next) => {
  try {
    const nome = String(req.query.nome || '').trim();

    if (!nome) {
      return res.status(400).json({ message: 'Informe o parametro nome para pesquisa.' });
    }

    const result = await query(
      `
        SELECT DISTINCT r.id, r.data, r.partidas
        FROM rodadas r
        JOIN LATERAL jsonb_array_elements(r.partidas) p ON TRUE
        JOIN times tc ON tc.id = (p->>'timeCasa')::int
        JOIN times tf ON tf.id = (p->>'timeFora')::int
        WHERE tc.name ILIKE $1 OR tf.name ILIKE $1
        ORDER BY r.id ASC
      `,
      [`%${nome}%`]
    );

    return res.json(result.rows.map(formatarRodada));
  } catch (error) {
    return next(error);
  }
};

const getRodadaById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT id, data, partidas FROM rodadas WHERE id = $1', [id]);

    if (!result.rows[0]) return res.status(404).send('Rodada nao encontrada.');
    return res.json(formatarRodada(result.rows[0]));
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
    return res.json(formatarRodada(result.rows[0]));
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