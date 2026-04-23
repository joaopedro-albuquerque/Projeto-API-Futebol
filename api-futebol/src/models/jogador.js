const mongoose = require('mongoose');

const jogadorSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  idade: {
    type: Number,
    required: true
  },
  gols: {
    type: Number,
    default: 0
  },
  assistencias: {
    type: Number,
    default: 0
  },
  defesas: {
    type: Number,
    default: 0
  }
});

const Jogador = mongoose.model('Jogador', jogadorSchema);

module.exports = Jogador;