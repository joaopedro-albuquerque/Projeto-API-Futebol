const { query } = require('../database/postgres');

const createTeam = async (req, res, next) => {
  try {
    const { name, city, players = [] } = req.body;

    if (!name || !city) {
      return res.status(400).json({ message: 'Campos obrigatorios: name e city.' });
    }

    const result = await query(
      `
        INSERT INTO times (name, city, players)
        VALUES ($1, $2, $3::jsonb)
        RETURNING id, name, city, players
      `,
      [name, city, JSON.stringify(players)]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const TEAM_WITH_PLAYERS_SQL = `
  SELECT
    t.id,
    t.name,
    t.city,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', j.id,
            'nome', j.nome,
            'idade', j.idade,
            'posicao', j.posicao,
            'valor_mercado', j.valor_mercado
          ) ORDER BY j.id
        )
        FROM jogadores j
        WHERE j.time_id = t.id
      ),
      '[]'::json
    ) AS players
  FROM times t
`;

const getAllTeams = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      query(`${TEAM_WITH_PLAYERS_SQL} ORDER BY t.id ASC LIMIT $1 OFFSET $2`, [limit, offset]),
      query('SELECT COUNT(*) FROM times'),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    return res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const searchTeams = async (req, res, next) => {
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
        `${TEAM_WITH_PLAYERS_SQL} WHERE t.name ILIKE $1 OR t.city ILIKE $1 ORDER BY t.id ASC LIMIT $2 OFFSET $3`,
        [`%${nome}%`, limit, offset]
      ),
      query(
        'SELECT COUNT(*) FROM times t WHERE t.name ILIKE $1 OR t.city ILIKE $1',
        [`%${nome}%`]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    return res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const getTeamById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query(
      `${TEAM_WITH_PLAYERS_SQL} WHERE t.id = $1`,
      [id]
    );

    if (!result.rows[0]) return res.status(404).send('Team not found');
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, city, players = [] } = req.body;

    if (!name || !city) {
      return res.status(400).json({ message: 'Campos obrigatorios: name e city.' });
    }

    const result = await query(
      `
        UPDATE times
        SET name = $1, city = $2, players = $3::jsonb
        WHERE id = $4
        RETURNING id, name, city, players
      `,
      [name, city, JSON.stringify(players), id]
    );

    if (!result.rows[0]) return res.status(404).send('Team not found');
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query('DELETE FROM times WHERE id = $1', [id]);

    if (result.rowCount === 0) return res.status(404).send('Team not found');
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTeam,
  getAllTeams,
  searchTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
};