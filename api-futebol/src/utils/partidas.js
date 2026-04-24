const toNumberOrDefault = (value, defaultValue = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

const calcularDesempenho = (d) => {
  const gols = toNumberOrDefault(d.gols);
  const assistencias = toNumberOrDefault(d.assistencias);
  const defesas = toNumberOrDefault(d.defesas);
  const xg = toNumberOrDefault(d.xg, 0);
  const xa = toNumberOrDefault(d.xa, 0);
  const total_chutes = toNumberOrDefault(d.total_chutes, 0);
  const chutes_no_gol = toNumberOrDefault(d.chutes_no_gol, 0);
  const xgot = toNumberOrDefault(d.xgot, 0);
  const chutes_fora = toNumberOrDefault(d.chutes_fora, 0);
  const trave = toNumberOrDefault(d.trave, 0);
  const impedimentos = toNumberOrDefault(d.impedimentos, 0);
  const passes_certos = toNumberOrDefault(d.passes_certos, 0);
  const passes_errados = toNumberOrDefault(d.passes_errados, 0);
  const passes_completos = toNumberOrDefault(d.passes_completos, passes_certos);
  const passes_tentados = toNumberOrDefault(d.passes_tentados, passes_certos + passes_errados);
  const passes_decisivos = toNumberOrDefault(d.passes_decisivos, 0);
  const chances_perigosas_criadas = toNumberOrDefault(d.chances_perigosas_criadas, 0);
  const passes_ultimo_terco = toNumberOrDefault(d.passes_ultimo_terco, 0);
  const passes_para_tras = toNumberOrDefault(d.passes_para_tras, 0);
  const cruzamentos_completos = toNumberOrDefault(d.cruzamentos_completos, 0);
  const cruzamentos_tentados = toNumberOrDefault(d.cruzamentos_tentados, 0);
  const acoes_com_bola = toNumberOrDefault(d.acoes_com_bola, 0);
  const faltas_sofridas = toNumberOrDefault(d.faltas_sofridas, 0);
  const faltas_cometidas = toNumberOrDefault(d.faltas_cometidas, 0);
  const posse_recuperada_terco_final = toNumberOrDefault(d.posse_recuperada_terco_final, 0);
  const posse_perdida = toNumberOrDefault(d.posse_perdida, 0);
  const driblado = toNumberOrDefault(d.driblado, 0);
  const chutes_bloqueados = toNumberOrDefault(d.chutes_bloqueados, 0);
  const perigo_afastado = toNumberOrDefault(d.perigo_afastado, 0);
  const interceptacoes = toNumberOrDefault(d.interceptacoes, 0);
  const recuperacoes_posse = toNumberOrDefault(d.recuperacoes_posse, 0);
  const duelos_aereos_ganhos = toNumberOrDefault(d.duelos_aereos_ganhos, 0);
  const duelos_aereos_totais = toNumberOrDefault(d.duelos_aereos_totais, 0);
  const duelos_chao_ganhos = toNumberOrDefault(d.duelos_chao_ganhos, 0);
  const duelos_chao_totais = toNumberOrDefault(d.duelos_chao_totais, 0);
  const dribles_certos = toNumberOrDefault(d.dribles_certos, 0);
  const dribles_errados = toNumberOrDefault(d.dribles_errados, 0);
  const finalizacoes_no_gol = toNumberOrDefault(d.finalizacoes_no_gol, chutes_no_gol);
  const finalizacoes_fora = toNumberOrDefault(d.finalizacoes_fora, chutes_fora);
  const cartao_amarelo = d.cartao_amarelo ?? false;
  const cartao_vermelho = d.cartao_vermelho ?? false;
  const minutos_jogados = toNumberOrDefault(d.minutos_jogados ?? d.minutos, 90);

  const total_passes = passes_tentados;
  const precisao_passes = total_passes > 0
    ? Math.round((passes_completos / total_passes) * 100) / 100
    : null;

  const total_dribles = dribles_certos + dribles_errados;
  const precisao_dribles = total_dribles > 0
    ? Math.round((dribles_certos / total_dribles) * 100) / 100
    : null;

  const total_finalizacoes = finalizacoes_no_gol + finalizacoes_fora;
  const precisao_finalizacoes = total_finalizacoes > 0
    ? Math.round((finalizacoes_no_gol / total_finalizacoes) * 100) / 100
    : null;

  const precisao_cruzamentos = cruzamentos_tentados > 0
    ? Math.round((cruzamentos_completos / cruzamentos_tentados) * 100) / 100
    : null;

  const precisao_duelos_aereos = duelos_aereos_totais > 0
    ? Math.round((duelos_aereos_ganhos / duelos_aereos_totais) * 100) / 100
    : null;

  const precisao_duelos_chao = duelos_chao_totais > 0
    ? Math.round((duelos_chao_ganhos / duelos_chao_totais) * 100) / 100
    : null;

  let nota = 6.0;
  nota += gols * 0.8;
  nota += assistencias * 0.5;
  nota += xg * 0.2;
  nota += xa * 0.3;
  nota += passes_decisivos * 0.3;
  nota += chances_perigosas_criadas * 0.25;
  nota += interceptacoes * 0.2;
  nota += recuperacoes_posse * 0.05;
  nota += posse_recuperada_terco_final * 0.1;
  nota += defesas * 0.2;
  nota += chutes_no_gol * 0.1;
  nota += chutes_bloqueados * 0.05;
  nota += perigo_afastado * 0.05;
  nota += faltas_sofridas * 0.03;
  nota += dribles_certos * 0.1;
  nota -= dribles_errados * 0.05;
  nota -= posse_perdida * 0.03;
  nota -= faltas_cometidas * 0.05;
  nota -= impedimentos * 0.03;
  nota -= driblado * 0.03;
  if (precisao_passes !== null) nota += (precisao_passes - 0.75) * 1.5;
  if (precisao_dribles !== null) nota += (precisao_dribles - 0.5) * 0.5;
  if (precisao_duelos_chao !== null) nota += (precisao_duelos_chao - 0.5) * 0.3;
  if (precisao_duelos_aereos !== null) nota += (precisao_duelos_aereos - 0.5) * 0.2;
  if (cartao_amarelo) nota -= 0.5;
  if (cartao_vermelho) nota -= 2.0;
  if (minutos_jogados < 45) nota -= 0.5;

  nota = Math.min(10.0, Math.max(1.0, Math.round(nota * 10) / 10));

  return {
    jogador_id: d.jogador_id,
    minutos: minutos_jogados,
    gols,
    assistencias,
    defesas,
    xg,
    xa,
    total_chutes,
    chutes_no_gol,
    xgot,
    chutes_fora,
    trave,
    impedimentos,
    passes_certos,
    passes_errados,
    passes_completos,
    passes_tentados,
    passes_decisivos,
    chances_perigosas_criadas,
    passes_ultimo_terco,
    passes_para_tras,
    cruzamentos_completos,
    cruzamentos_tentados,
    acoes_com_bola,
    faltas_sofridas,
    faltas_cometidas,
    posse_recuperada_terco_final,
    posse_perdida,
    driblado,
    chutes_bloqueados,
    perigo_afastado,
    dribles_certos,
    dribles_errados,
    interceptacoes,
    recuperacoes_posse,
    duelos_aereos_ganhos,
    duelos_aereos_totais,
    duelos_chao_ganhos,
    duelos_chao_totais,
    finalizacoes_no_gol,
    finalizacoes_fora,
    cartao_amarelo,
    cartao_vermelho,
    minutos_jogados,
    precisao_passes,
    precisao_cruzamentos,
    precisao_dribles,
    precisao_finalizacoes,
    precisao_duelos_aereos,
    precisao_duelos_chao,
    nota,
  };
};

const processarPartidas = (partidas) =>
  (partidas ?? []).map((p, indexPartida) => ({
    ...p,
    numeroPartida: toNumberOrDefault(p.numeroPartida, indexPartida + 1),
    desempenhos: (p.desempenhos ?? []).map(calcularDesempenho),
  }));

const formatarRodada = (rodada) => {
  if (!rodada) return rodada;

  return {
    ...rodada,
    numeroRodada: rodada.numeroRodada ?? rodada.id,
    partidas: processarPartidas(rodada.partidas ?? []),
  };
};

module.exports = {
  toNumberOrDefault,
  calcularDesempenho,
  processarPartidas,
  formatarRodada,
};
