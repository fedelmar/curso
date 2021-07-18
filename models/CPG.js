const mongoose = require('mongoose');

const CPGSchema = mongoose.Schema({
    creado: {
        type: Date,
    },
    modificado: {
        type: Date,
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
    cliente: {
        type: String,
        trim: true
    },
    producto: {
        type: String,
    },
    productoID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto'
    },
    loteBolsa: {
        type: String,
    },
    loteBolsaID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockInsumo'
    },
    loteGel: {
        type: String,
    },
    dobleBolsa: {
        type: Boolean
    },
    manta: {
        type: Boolean
    },
    cantProducida: {
        type: Number
    },
    cantDescarte: {
        type: Number
    },
    cantDescarteBolsaCristal: {
        type: Number
    },
    puesto1: {
        type: String
    },
    puesto2: {
        type: String
    },
    observaciones: {
        type: String
    },
    loteBolsaCristal: {
        type: String
    },
    estado: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('CPG', CPGSchema);