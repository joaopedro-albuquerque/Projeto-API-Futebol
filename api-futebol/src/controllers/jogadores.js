const { query } = require('../database/postgres');

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

const importPlayers = async (req, res, next) => {
  try {
    const { jogadores } = req.body;

    if (!Array.isArray(jogadores) || jogadores.length === 0) {
      return res.status(400).json({ message: 'Campo obrigatorio: jogadores (array nao vazio).' });
    }

    const criados = [];
    const atualizados = [];
    const erros = [];

    for (const jogador of jogadores) {
      const {
        id,
        nome,
        idade,
        time_id = null,
        posicao = null,
        valor_mercado = null,
      } = jogador;

      if (!nome || typeof idade !== 'number') {
        erros.push({ jogador, motivo: 'nome e idade (number) sao obrigatorios' });
        continue;
      }

      if (time_id !== null) {
        const timeExiste = await query('SELECT id FROM times WHERE id = $1', [time_id]);
        if (!timeExiste.rows[0]) {
          erros.push({ jogador, motivo: `time_id ${time_id} nao encontrado` });
          continue;
        }
      }

      if (id !== undefined) {
        const result = await query(
          `UPDATE jogadores
           SET nome = $1, idade = $2, time_id = $3, posicao = $4, valor_mercado = $5
           WHERE id = $6
           RETURNING id, nome, idade, time_id, posicao, valor_mercado`,
          [nome, idade, time_id, posicao, valor_mercado, id]
        );
        if (result.rows[0]) {
          atualizados.push(result.rows[0]);
        } else {
          erros.push({ jogador, motivo: `id ${id} nao encontrado` });
        }
      } else {
        const result = await query(
          `INSERT INTO jogadores (nome, idade, time_id, posicao, valor_mercado)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, nome, idade, time_id, posicao, valor_mercado`,
          [nome, idade, time_id, posicao, valor_mercado]
        );
        criados.push(result.rows[0]);
      }
    }

    return res.status(207).json({
      criados: criados.length,
      atualizados: atualizados.length,
      erros: erros.length,
      jogadores_criados: criados,
      jogadores_atualizados: atualizados,
      jogadores_com_erro: erros,
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
  importPlayers,
};