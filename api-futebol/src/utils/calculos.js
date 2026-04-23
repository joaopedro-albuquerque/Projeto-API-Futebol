const calcularNota = (jogador) => {
  const { gols, assistencias, defesas } = jogador;
  const nota = (gols * 4) + (assistencias * 3) + (defesas * 2);
  return nota;
}

module.exports = { calcularNota };