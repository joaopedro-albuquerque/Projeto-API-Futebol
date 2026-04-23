const mongoose = require('mongoose');

const timeSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  cidade: {
    type: String,
    required: true
  },
  jogadores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jogador'
  }]
});

const Time = mongoose.model('Time', timeSchema);

module.exports = Time;