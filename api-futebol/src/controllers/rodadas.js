const { query } = require('../database/postgres');

const calcularDesempenho = (d) => {
  const gols = d.gols ?? 0;
  const assistencias = d.assistencias ?? 0;
  const defesas = d.defesas ?? 0;
  const passes_certos = d.passes_certos ?? 0;
  const passes_errados = d.passes_errados ?? 0;
  const passes_decisivos = d.passes_decisivos ?? 0;
  const dribles_certos = d.dribles_certos ?? 0;
  const dribles_errados = d.dribles_errados ?? 0;
  const interceptacoes = d.interceptacoes ?? 0;
  const finalizacoes_no_gol = d.finalizacoes_no_gol ?? 0;
  const finalizacoes_fora = d.finalizacoes_fora ?? 0;
  const cartao_amarelo = d.cartao_amarelo ?? false;
  const cartao_vermelho = d.cartao_vermelho ?? false;
  const minutos_jogados = d.minutos_jogados ?? 90;

  const total_passes = passes_certos + passes_errados;
  const precisao_passes = total_passes > 0
    ? Math.round((passes_certos / total_passes) * 100) / 100
    : null;

  const total_dribles = dribles_certos + dribles_errados;
  const precisao_dribles = total_dribles > 0
    ? Math.round((dribles_certos / total_dribles) * 100) / 100
    : null;

  const total_finalizacoes = finalizacoes_no_gol + finalizacoes_fora;
  const precisao_finalizacoes = total_finalizacoes > 0
    ? Math.round((finalizacoes_no_gol / total_finalizacoes) * 100) / 100
    : null;

  let nota = 6.0;
  nota += gols * 0.8;
  nota += assistencias * 0.5;
  nota += passes_decisivos * 0.3;
  nota += interceptacoes * 0.2;
  nota += defesas * 0.2;
  nota += dribles_certos * 0.1;
  nota -= dribles_errados * 0.05;
  if (precisao_passes !== null) nota += (precisao_passes - 0.75) * 1.5;
  if (precisao_dribles !== null) nota += (precisao_dribles - 0.5) * 0.5;
  if (cartao_amarelo) nota -= 0.5;
  if (cartao_vermelho) nota -= 2.0;
  if (minutos_jogados < 45) nota -= 0.5;

  nota = Math.min(10.0, Math.max(1.0, Math.round(nota * 10) / 10));

  return {
    jogador_id: d.jogador_id,
    gols,
    assistencias,
    defesas,
    passes_certos,
    passes_errados,
    passes_decisivos,
    dribles_certos,
    dribles_errados,
    interceptacoes,
    finalizacoes_no_gol,
    finalizacoes_fora,
    cartao_amarelo,
    cartao_vermelho,
    minutos_jogados,
    precisao_passes,
    precisao_dribles,
    precisao_finalizacoes,
    nota,
  };
};

const processarPartidas = (partidas) =>
  partidas.map((p) => ({
    ...p,
    desempenhos: (p.desempenhos ?? []).map(calcularDesempenho),
  }));

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

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

const getAllRodadas = async (req, res, next) => {
  try {
    const result = await query('SELECT id, data, partidas FROM rodadas ORDER BY id ASC');
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

const getRodadaById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT id, data, partidas FROM rodadas WHERE id = $1', [id]);

    if (!result.rows[0]) return res.status(404).send('Rodada nao encontrada.');
    return res.json(result.rows[0]);
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
    return res.json(result.rows[0]);
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
  getRodadaById,
  updateRodada,
  deleteRodada,
};