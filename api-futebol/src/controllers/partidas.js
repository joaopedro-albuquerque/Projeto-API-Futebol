const { query } = require('../database/postgres');
const { processarPartidas, formatarRodada } = require('../utils/partidas');

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
    data: rodadaFormatada.data,
    ...partida,
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

const createPartida = async (req, res, next) => {
  try {
    const { rodada_id, timeCasa, timeFora, golsTimeCasa = 0, golsTimeFora = 0, desempenhos = [] } = req.body;

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
      { timeCasa: timeCasaId, timeFora: timeForaId, golsTimeCasa, golsTimeFora, desempenhos },
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
    const result = await query('SELECT id, data, partidas FROM rodadas ORDER BY id ASC');
    const partidas = result.rows.flatMap(formatarPartidasDaRodada);
    const timeMap = await montarMapaTimes();
    const partidasComNomes = anexarNomeTimes(partidas, timeMap);
    return res.json(partidasComNomes);
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
    const { timeCasa, timeFora, golsTimeCasa = 0, golsTimeFora = 0, desempenhos = [] } = req.body;

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

    if (!nome) {
      return res.status(400).json({ message: 'Informe o parametro nome para pesquisa.' });
    }

    const result = await query('SELECT id, data, partidas FROM rodadas ORDER BY id ASC');
    const allPartidas = result.rows.flatMap(formatarPartidasDaRodada);
    const timeMap = await montarMapaTimes();
    const partidasComNomes = anexarNomeTimes(allPartidas, timeMap);

    const termo = nome.toLowerCase();
    const filtradas = partidasComNomes.filter((partida) => {
      const casa = String(partida.timeCasaNome || '').toLowerCase();
      const fora = String(partida.timeForaNome || '').toLowerCase();
      return casa.includes(termo) || fora.includes(termo);
    });

    return res.json(filtradas);
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
};
