const { query } = require('../database/postgres');
const { parseTabularFile, toNullableNumber, toNullableString } = require('../utils/csv');

const resolveTimeId = async (row) => {
  const directId = toNullableNumber(row.time_id);
  if (directId != null) return directId;

  const nomeTime = toNullableString(row.time_nome || row.time || row.nome_time);
  if (!nomeTime) return null;

  const result = await query(
    'SELECT id FROM times WHERE name ILIKE $1 ORDER BY id ASC LIMIT 1',
    [nomeTime]
  );

  return result.rows[0]?.id ?? null;
};

const createPlayer = async (req, res, next) => {
  try {
    const {
      nome,
      idade,
      time_id = null,
      posicao = null,
      valor_mercado = null,
    } = req.body;

    if (!nome || typeof idade !== 'number') {
      return res.status(400).json({ message: 'Campos obrigatorios: nome e idade (number).' });
    }

    const result = await query(
      `
        INSERT INTO jogadores (nome, idade, time_id, posicao, valor_mercado)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nome, idade, time_id, posicao, valor_mercado
      `,
      [nome, idade, time_id, posicao, valor_mercado]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const getAllPlayers = async (req, res, next) => {
  try {
    const result = await query(
      `
        SELECT id, nome, idade, time_id, posicao, valor_mercado
        FROM jogadores
        ORDER BY id ASC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

const searchPlayers = async (req, res, next) => {
  try {
    const nome = String(req.query.nome || '').trim();

    if (!nome) {
      return res.status(400).json({ message: 'Informe o parametro nome para pesquisa.' });
    }

    const result = await query(
      `
        SELECT id, nome, idade, time_id, posicao, valor_mercado
        FROM jogadores
        WHERE nome ILIKE $1
        ORDER BY id ASC
      `,
      [`%${nome}%`]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

const getPlayerById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query(
      `
        SELECT id, nome, idade, time_id, posicao, valor_mercado
        FROM jogadores
        WHERE id = $1
      `,
      [id]
    );

    if (!result.rows[0]) return res.status(404).send('Jogador nao encontrado');
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const updatePlayer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const {
      nome,
      idade,
      time_id = null,
      posicao = null,
      valor_mercado = null,
    } = req.body;

    if (!nome || typeof idade !== 'number') {
      return res.status(400).json({ message: 'Campos obrigatorios: nome e idade (number).' });
    }

    const previous = await query('SELECT id FROM jogadores WHERE id = $1', [id]);
    if (!previous.rows[0]) return res.status(404).send('Jogador nao encontrado');

    const result = await query(
      `
        UPDATE jogadores
        SET nome = $1,
            idade = $2,
            time_id = $3,
            posicao = $4,
            valor_mercado = $5
        WHERE id = $6
        RETURNING id, nome, idade, time_id, posicao, valor_mercado
      `,
      [nome, idade, time_id, posicao, valor_mercado, id]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const deletePlayer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query('DELETE FROM jogadores WHERE id = $1', [id]);

    if (result.rowCount === 0) return res.status(404).send('Jogador nao encontrado');
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const importPlayersCsv = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Envie um arquivo no campo file (CSV ou XLSX).' });
    }

    const rows = parseTabularFile(req.file.buffer, req.file.mimetype);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Envie um CSV com pelo menos uma linha de dados.' });
    }

    const criados = [];
    const erros = [];

    for (const row of rows) {
      const nome = toNullableString(row.nome);
      const idade = toNullableNumber(row.idade);
      const posicao = toNullableString(row.posicao);
      const valor_mercado = toNullableString(row.valor_mercado);
      const time_id = await resolveTimeId(row);

      if (!nome || idade == null) {
        erros.push({ linha: row, motivo: 'nome e idade sao obrigatorios.' });
        continue;
      }

      if ((row.time_id || row.time_nome || row.time || row.nome_time) && time_id == null) {
        erros.push({ linha: row, motivo: 'time nao encontrado para a linha informada.' });
        continue;
      }

      const result = await query(
        `
          INSERT INTO jogadores (nome, idade, time_id, posicao, valor_mercado)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, nome, idade, time_id, posicao, valor_mercado
        `,
        [nome, idade, time_id, posicao, valor_mercado]
      );

      criados.push(result.rows[0]);
    }

    return res.status(207).json({
      criados: criados.length,
      erros: erros.length,
      jogadores_criados: criados,
      linhas_com_erro: erros,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPlayer,
  getAllPlayers,
  searchPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
  importPlayersCsv,
};