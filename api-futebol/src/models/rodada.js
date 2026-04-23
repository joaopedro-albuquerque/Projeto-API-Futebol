const mongoose = require('mongoose');

const rodadaSchema = new mongoose.Schema({
  data: {
    type: Date,
    required: true
  },
  partidas: [{
    timeCasa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Time',
      required: true
    },
    timeFora: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Time',
      required: true
    },
    golsTimeCasa: {
      type: Number,
      required: true
    },
    golsTimeFora: {
      type: Number,
      required: true
    }
  }]
});

const Rodada = mongoose.model('Rodada', rodadaSchema);

module.exports = Rodada;