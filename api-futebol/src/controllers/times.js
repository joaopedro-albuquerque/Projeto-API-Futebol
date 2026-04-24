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

const getAllTeams = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, city, players FROM times ORDER BY id ASC'
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

const searchTeams = async (req, res, next) => {
  try {
    const nome = String(req.query.nome || '').trim();

    if (!nome) {
      return res.status(400).json({ message: 'Informe o parametro nome para pesquisa.' });
    }

    const result = await query(
      `
        SELECT id, name, city, players
        FROM times
        WHERE name ILIKE $1 OR city ILIKE $1
        ORDER BY id ASC
      `,
      [`%${nome}%`]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

const getTeamById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query(
      'SELECT id, name, city, players FROM times WHERE id = $1',
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