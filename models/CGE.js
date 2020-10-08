const mongoose = require('mongoose');

const CFESchema = mongoose.Schema({
    fecha: {
        type: Date,
        default: new Date(Date.now())
    },
    operario: {
        type: String,
        required: true,
        trim: true
    },
    lote: {
        type: String,
        required: true,
        trim: true
    },
    producto: {
        type: String,
        required: true,
        trim: true
    },
    loteID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'StockProducto'
    },
    horaInicio: {
        type: String,
        required: true
    },
    horaCierre: {
        type: String,
        required: true
    },
    caja: {
        type: String,
        required: true,
        trim: true
    },
    descCajas: {
        type: Number
    },
    guardado: {
        type: Number,
        required: true,
    },
    descarte: {
        type: Number,
        required: true,
    },
    auxiliar: {
        type: String
    },
    observaciones: {
        type: String
    },
});

module.exports = mongoose.model('CGE', CFESchema);