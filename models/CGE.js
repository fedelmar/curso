const mongoose = require('mongoose');

const CFESchema = mongoose.Schema({
    creado: {
        type: Date,
    },
    modificado: {
        type: Date,
    },
    operario: {
        type: String,
        trim: true
    },
    lote: {
        type: String,
        trim: true
    },
    producto: {
        type: String,
        trim: true
    },
    loteID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockProducto'
    },
    caja: {
        type: String,
        trim: true
    },
    descCajas: {
        type: Number
    },
    guardado: {
        type: Number
    },
    descarte: {
        type: Number
    },
    auxiliar: {
        type: String
    },
    observaciones: {
        type: String
    },
    estado: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('CGE', CFESchema);