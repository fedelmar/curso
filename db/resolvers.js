require('dotenv').config({ path:'variables.env' });
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PG = require('../models/PG');
const CPE = require('../models/CPE');
const CGE = require('../models/CGE');
const CPP = require('../models/CPP');
const CGP = require('../models/CGP');
const CSP = require('../models/CSP');
const CPG = require('../models/CPG');
const Insumo = require('../models/Insumos');
const Pedido = require('../models/Pedidos');
const Salida = require('../models/Salidas');
const Usuario = require('../models/Usuarios');
const Cliente = require('../models/Clientes');
const Ingreso = require('../models/Ingresos');
const Producto = require('../models/Productos');
const StockInsumo = require('../models/StockInsumos');
const StockInsumos = require('../models/StockInsumos');
const StockProducto = require('../models/StockProductos');

const crearToken = (usuario, secreta, expiresIn) => {
    //console.log(usuario);
    const { id, email, nombre, apellido, rol } = usuario;
    return jwt.sign( {id, email, nombre, apellido, rol }, secreta)
}

//RESOLVERS
const resolvers = {

    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
          return new Date(value); // value from the client
        },
        serialize(value) {
          return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            return parseInt(ast.value, 10); // ast value is always in string format
          }
          return null;
        },
    }),

    Query: {
        
        obtenerUsuario: async (_, { }, ctx) => {
            return ctx.usuario;
        },

        obtenerUsuarios: async () => {
            try {
                const usuarios = await Usuario.find({});
                return usuarios
            } catch (error) {
                console.log(error);
            }
        },

        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({}).sort({$natural:-1});
                return productos;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerProducto: async (_, { id }) => {
            //Comprobar existencia del producto
            const producto = await Producto.findById(id);

            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            return producto;
        },

        obtenerProductosPorCategoria: async (_, { input }) => {
            try {
                const productos = await Producto.find({categoria: input});

                return productos;
            } catch (error) {
                console.log(error)
            }
        },

        obtenerProductosStock: async () => {
            try {
                const lote = await StockProducto.find({}).sort({$natural:-1});
                return lote;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerProductoStock: async (_, { id }) => {
            // Comprobar existencia del lote
            const lote = await StockProducto.findById(id);

            if (!lote) {
                throw new Error('Lote no encontrado');
            }

            return lote;
        },

        obtenerStockEsponjas: async () => {
            let listaProductos = await Producto.find({});
            let stockProductos = await StockProducto.find({});            
    
            let lotesEsponjas = [];

            stockProductos.forEach(function(loteProducto) {
                listaProductos.forEach(function(producto) {
                    if (producto.id == loteProducto.producto && producto.categoria == 'Esponjas' && loteProducto.estado != 'Terminado') {
                        lotesEsponjas.push({
                            lote: loteProducto.lote,
                            loteID: loteProducto.id,
                            estado: loteProducto.estado,
                            cantidad: loteProducto.cantidad,
                            producto: producto.nombre,
                            caja: producto.caja,
                            cantCaja: producto.cantCaja
                        })
                    }
                })
            })

            return lotesEsponjas;
        },

        obtenerStockPlacas: async () => {
            let listaProductos = await Producto.find({});
            let stockProductos = await StockProducto.find({});            
    
            let lotesPlacas = [];

            stockProductos.forEach(function(loteProducto) {
                listaProductos.forEach(function(producto) {
                    if (producto.id == loteProducto.producto && producto.categoria == 'Placas' && loteProducto.estado != 'Terminado') {
                        lotesPlacas.push({
                            lote: loteProducto.lote,
                            loteID: loteProducto.id,
                            estado: loteProducto.estado,
                            cantidad: loteProducto.cantidad,
                            producto: producto.nombre,
                            caja: producto.caja,
                            cantCaja: producto.cantCaja
                        })
                    }
                })
            })

            return lotesPlacas;
        },

        obtenerStockPlacasEnProceso: async () => {
            let listaProductos = await Producto.find({});
            let stockProductos = await StockProducto.find({});            
    
            let lotesPlacas = [];

            stockProductos.forEach(function(loteProducto) {
                listaProductos.forEach(function(producto) {
                    if (producto.id == loteProducto.producto && producto.categoria == 'Placas' && loteProducto.estado == 'Proceso') {
                        lotesPlacas.push({
                            lote: loteProducto.lote,
                            loteID: loteProducto.id,
                            estado: loteProducto.estado,
                            cantidad: loteProducto.cantidad,
                            producto: producto.nombre,
                            caja: producto.caja,
                            cantCaja: producto.cantCaja
                        })
                    }
                })
            })

            return lotesPlacas;
        },

        obtenerProductosTerminados: async () => {
            let listaProductos = await Producto.find({});
            let stockProductos = await StockProducto.find({});

            let productos = [];

            stockProductos.forEach(function(loteProducto) {
                listaProductos.forEach(function(producto) {
                    if (producto.id == loteProducto.producto && loteProducto.estado == 'Terminado') {
                        productos.push({
                            lote: loteProducto.lote,
                            loteID: loteProducto.id,
                            estado: loteProducto.estado,
                            cantidad: loteProducto.cantidad,
                            producto: producto.nombre,
                            caja: producto.caja,
                            cantCaja: producto.cantCaja
                        })
                    }
                })
            })

            return productos;
        },

        existeProductoStock: async (_, { id }) => {
            // Comprobar su existencia
            const lote = await StockProducto.findOne({producto: id})
            if (lote) {
                return true
            } else {
                return false
            }
        },

        obtenerProductosTotal: async () => {
            const stockProducto = await StockProducto.find({});
            const productos = await Producto.find({});
            let respuesta = [];

            productos.forEach(function(producto){
                if (stockProducto.find(i => i.producto == producto.id && i.estado === 'Terminado')) {
                    respuesta.push({
                        id: producto.id,
                        producto: producto.nombre,
                        cantidad: 0,
                        lotes: 0,
                        estado: 'Terminado'
                    })
                }
                if (stockProducto.find(i => i.producto == producto.id && i.estado === 'Proceso')) {
                    respuesta.push({
                        id: producto.id,
                        producto: producto.nombre,
                        cantidad: 0,
                        lotes: 0,
                        estado: 'Proceso'
                    })
                }
                if (stockProducto.find(i => i.producto == producto.id && i.estado === 'Reproceso')) {
                    respuesta.push({
                        id: producto.id,
                        producto: producto.nombre,
                        cantidad: 0,
                        lotes: 0,
                        estado: 'Reproceso'
                    })
                }
            });

            respuesta.forEach(function(producto) {
                stockProducto.forEach(function(lote) {
                    if(producto.id == lote.producto && producto.estado === lote.estado) {
                        producto.cantidad += lote.cantidad;
                        producto.lotes += 1;
                    }
                })
            });

            return respuesta;
        },

        obtenerUltimosModificados: async () => {
            const lote = await StockProducto.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000)}})
                .sort({$natural:-1})
                .limit(10);
            return lote;
        },

        obtenerInsumos: async () => {
            try {
                const insumos = await Insumo.find({}).sort({$natural:-1});
                return insumos;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerInsumo: async (_, { id }) => {
            
            const insumo = await Insumo.findById(id);

            if(!insumo) {
                throw new Error('Insumo no encontrado');
            }

            return insumo;
        },

        obtenerStockInsumos: async () => {
            try {
                const insumos = await StockInsumo.find({}).sort({$natural:-1});
                return insumos;
            } catch (error) {
                console.log(error)
            }
        },

        obtenerInsumoEnStock: async (_, { id }) => {
            const insumo = await StockInsumo.findById(id);
            
            if(!insumo) {
                throw new Error('El insumos no existe en el Stock');
            }

            return insumo;
        },

        existeInsumoStock: async (_, { id }) => {
            // Comprobar su existencia
            const lote = await StockInsumo.findOne({insumo: id})
            
            if (lote) {
                return true
            } else {
                return false
            }
        },

        obtneterStockInsumosPorCategoria: async (_, { input }) => {
            try {
                const stock = await StockInsumo.find({});
                const listaInsumos = await Insumo.find({});

                let insumos = [];
                stock.forEach(function(lote) {
                    listaInsumos.forEach(function(insumo) {
                        if (insumo.id == lote.insumo && insumo.categoria == input) {
                            insumos.push({
                                id: lote.id,
                                lote: lote.lote,
                                insumo: insumo.nombre,
                                insumoID: insumo.id,
                                cantidad: lote.cantidad
                            })
                        }
                    })
                })

               return insumos;                
            } catch (error) {
                console.log(error)
            }
        },

        obtenerInsumoPorLote: async (_, { input }) => {
            const lote = await StockInsumo.findOne({lote: input});
            return lote;
        },

        obtenerInsumosPorInsumo: async () => {
            const stockInsumos = await StockInsumo.find({});
            const insumos = await Insumo.find({});
            let respuesta = [];

            insumos.forEach(function(insumo){
                if (stockInsumos.find(i => i.insumo == insumo.id)) {
                    respuesta.push({
                        id: insumo.id,
                        insumo: insumo.nombre,
                        categoria: insumo.categoria,
                        cantidad: 0,
                        lotes: 0
                    })
                }
            });

            respuesta.forEach(function(insumo) {
                stockInsumos.forEach(function(lote) {
                    if(insumo.id == lote.insumo) {
                        insumo.cantidad += lote.cantidad;
                        insumo.lotes += 1;
                    }
                })
            });

            return respuesta;
        },

        obtenerStockInsumosPorProducto: async (_ , { id }) => {

            const producto = await Producto.findById(id);

            let insumosPorProducto = [];

            for (const insumo of producto.insumos ) {
                const stockInsumo = await StockInsumos.find({insumo: insumo});
                const infoInsumo = await Insumo.findById(insumo);
                stockInsumo.forEach(function(index){
                    insumosPorProducto.push({
                        id: index.id,
                        insumoID: index.insumo,
                        cantidad: index.cantidad,
                        lote: index.lote,
                        insumo: infoInsumo.nombre,
                        categoria: infoInsumo.categoria
                    })
                })          
            };

            return insumosPorProducto;
        },

        obtenerCliente: async (_, {id}) => {
            //Verificar existencia
            const cliente = await Cliente.findById(id);

            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            return cliente;
        },

        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerClientesVendedor: async (_, {}, ctx ) => {
            try {
                if (ctx.usuario) {
                const clientes = await Cliente.find({ vendedor: ctx.usuario.id.toString() });
                return clientes;
                }
            } catch (error) {
                console.log(error);
            }
        },

        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedidos.find({});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerPedidosVendedor: async (_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerPedido: async (_, {id}, ctx) => {
                //Verificar su existencia
                const pedido = await Pedido.findById(id);
                if(!pedido) {
                    throw new Error('Pedido no encontrado');
                }

                //Solo lo ve su vendedor
                if(pedido.vendedor.toString() !== ctx.usuario.id){
                    throw new Error('Acción no permitida');
                }
                
                //Retornar resultado
                return pedido;
        },

        obtenerPedidosEstado: async (_, { estado }, ctx) => {
            const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado});

            return pedidos;
        },

        mejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                { $match: { estado: "COMPLETADO" }},
                { $group: {
                    _id: "$cliente",
                    total: { $sum: "$total"}
                }},
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: "_id",
                        as: "cliente"
                    }   
                },
                {
                    $sort: { total:  -1}
                }
            ])
        },

        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                { $match: { estado: "COMPLETADO" }},
                { $group: {
                    _id: "vendedor",
                    total: { $sum: "$total"}
                }},
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: "vendedor"
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort: { total: -1}
                }
            ]);

            return vendedores;
        },

        buscarProducto: async (_, { texto }) => {
            const productos = await Producto.find({$text: { $search: texto }})

            return productos;
        },

        obtenerRegistrosSalidas: async () => {

            let registros = await Salida.find({}).sort({$natural:-1});

            return registros;
        },

        obtenerRegistroSalida: async (_, { id }) => {
            let registro = await Salida.findById(id);

            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },

        obtenerLotesPorSalida: async (_, { id }) => {
            let lote = await Salida.findById(id);
            let stockProductos = await StockProducto.find({});
            let productos = await Producto.find({});

            const { lotes } = lote;

            let lotesSalidas = [];
            
            lotes.forEach(function(index){
                let loteSalida = stockProductos.find(i => i.id == index.lote)
                let nombreProducto = productos.find(i => i.id == loteSalida.producto).nombre
                lotesSalidas.push({
                    lote: loteSalida.lote,
                    producto: nombreProducto,
                    cantidad: index.cantidad
                })
            })
            
            return lotesSalidas;
        },

        obtenerRegistrosIngresos: async () => {

            let registros = await Ingreso.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000 * 35)}}).sort({$natural:-1});

            return registros;
        },

        obtenerRegistroIngreso: async (_, { id }) => {
            let registro = await Ingreso.findById(id);

            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },

        obtenerRegistrosCE: async () => {

            let registros = await CPE.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000 * 35)}}).sort({$natural:-1});
            
            return registros;
        },

        obtenerRegistroCE: async (_, {id}) => {
            let registro = await CPE.findById(id);
            
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },

        obtenerRegistrosGE: async () => {

            let registros = await CGE.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000 * 35)}}).sort({$natural:-1});
            
            return registros;
        },

        obtenerRegistroGE: async (_, {id}) => {
            let registro = await CGE.findById(id);
            
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },

        obtenerRegistrosPP: async () => {

            let registros = await CPP.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000 * 35)}}).sort({$natural:-1});
            
            return registros;
        },

        obtenerRegistroPP: async (_, {id}) => {
            let registro = await CPP.findById(id);
            
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },

        obtenerRegistrosGP: async () => {

            let registros = await CGP.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000 * 35)}}).sort({$natural:-1});
            
            return registros;
        },

        obtenerRegistroGP: async (_, {id}) => {
            let registro = await CGP.findById(id);
            
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },

        obtenerRegistrosSP: async () => {

            let registros = await CSP.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000 * 35)}}).sort({$natural:-1});
            
            return registros;
        },

        obtenerRegistroSP: async (_, {id}) => {
            let registro = await CSP.findById(id);
            
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },

        obtenerRegistrosPG: async () => {

            let registros = await PG.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000 * 35)}}).sort({$natural:-1});
            
            return registros;
        },

        obtenerRegistroPG: async (_, {id}) => {
            let registro = await PG.findById(id);
            
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },

        obtenerRegistrosCPG: async () => {

            let registros = await CPG.find({"creado":{$gt:new Date(Date.now() - 24*60*60 * 1000 * 35)}}).sort({$natural:-1});
            
            return registros;
        },

        obtenerRegistroCPG: async (_, {id}) => {
            let registro = await CPG.findById(id);
            
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            return registro;
        },
    },
    
    Mutation: {

        nuevoUsuario: async (_, { input }) => {

            const { email, password } = input;

            //Verificar si ya existe el usuario
            const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario) {
                throw new Error('El usuario ya esta registrado');
            }

            //Codificar password
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            //Guardar en la base de datos
            try {
                const usuario = new Usuario(input);
                usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
            }
        },

        modificarPassword: async (_, {id, input}) => {
            const {password, newPassword } = input;

            const usuario = await Usuario.findById(id);

            //Comprobar validez de password
            const passwordCorrecto = await bcryptjs.compare( password, usuario.password );
            if (!passwordCorrecto) {
                throw new Error('Contraseña incorrecta');
            }

            //Codificar nuevo password
            const salt = await bcryptjs.genSalt(10);
            nuevoPassword = await bcryptjs.hash(newPassword, salt);

            const resultado = await Usuario.findByIdAndUpdate({_id: id}, {password: nuevoPassword}, {new: true});

            if (resultado) {
                return 'Contraseña actualizada con exito.'
            } else {
                return 'Hubo un error al actualizar la contraseña.'
            }

        },

        autenticarUsuario: async (_, {input}) => {

            const { password, nombre } = input;
            const existeUsuario = await Usuario.findOne({nombre});    

            //Verificar si ya existe el usuario
            if (!existeUsuario) {
                throw new Error('Usuario incorrecto');
            }            
            //Comprobar validez de password
            const passwordCorrecto = await bcryptjs.compare( password, existeUsuario.password );
            if (!passwordCorrecto) {
                throw new Error('Contraseña incorrecta');
            }

            //Generar Token
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h' ),
            }
        },

        actualizarUsuario: async (_, {id, input}) => {
            const { password, nombre, apellido, email } = input;
            let usuario = await Usuario.findById(id);

            //Comprobar validez de password
            const passwordCorrecto = await bcryptjs.compare( password, usuario.password );
            if (!passwordCorrecto) {
                throw new Error('Contraseña incorrecta');
            }

            // Actualizar Usuario
            const usuarioActualizado = await Usuario.findOneAndUpdate(
                {_id: usuario.id}, 
                {nombre: nombre, apellido: apellido, email: email}, 
                {new: true}
            )

            return usuarioActualizado;
        },

        nuevoProducto: async (_, {input}) => {

            //Verificar existencia del producto
            const { nombre } = input;
            const existeProducto = await Producto.findOne({nombre});
            if (existeProducto) {
                throw new Error('Ya existe ese producto');
            }

            try {
                const producto = new Producto(input);

                //Guardar en db
                const resultado = await producto.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },

        actualizarProducto: async (_, { id, input }) => {
            //Comprobar existencia del producto
            let producto = await Producto.findById(id);

            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            producto = await Producto.findByIdAndUpdate( { _id: id }, input, { new: true } );

            return producto;
        },

        eliminarProducto: async (_, { id } ) => {
            let producto = await Producto.findById(id);
            
            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            producto = await Producto.findByIdAndDelete({ _id: id });

            return "Producto eliminado.";

        },


        nuevoProductoStock: async (_, {input}) => {

            // Verificar la existencia del producto en stock
            const { lote, producto, cantidad, responsable, estado } = input;
            const existeLote = await StockProducto.findOne({lote: lote, estado: estado, producto: producto});
            if (existeLote) {

                    // Si ya hay un lote en existencia, sumar la cantidad producida
                    let nuevoInput = input;
                    nuevoInput.modificado = Date.now();
                    nuevoInput.responsable = responsable;
                    nuevoInput.cantidad += existeLote.cantidad;
                    nuevoLote = await StockProducto.findByIdAndUpdate( {_id: existeLote.id },  nuevoInput, { new: true });  
                    
                    return nuevoLote;
              
            } else {
                try {
                    if (cantidad > 0) {
                        const producto = new StockProducto(input);
                        input.responsable = responsable;
                        input.modificado = Date.now();
                        //Guardar en db
                        const resultado = await producto.save();
    
                        return resultado;
                    } else {
                        throw new Error('La cantidad debe ser mayor a 0');
                    } 
                } catch (error) {
                    console.log(error)
                }
            }
            
        },

        actualizarProductoStock: async (_,{ id, input }) => {
            //Comprobar existencia en stock del producto
            let lote = await StockProducto.findById(id);
            if (!lote) {
                throw new Error('Lote no encontrado');
            }

            lote = await StockProducto.findByIdAndUpdate( {_id: id }, input, { new: true });

            return lote;
        },

        eliminarProductoStock: async (_, { id }) => {
            let lote = await StockProducto.findById(id);
            
            if (!lote) {
                throw new Error('Lote no encontrado');
            }

            lote = await StockProducto.findByIdAndDelete({ _id: id });

            return "Lote eliminado.";
        },

        nuevoInsumo: async (_, {input}) => {
            
            //Verificar existencia del insumo
            const { nombre } = input;
            const existeInsumo = await Insumo.findOne({nombre});
            if (existeInsumo) {
                throw new Error('Ya existe ese insumo');
            }
            
            try {
                const nuevoInsumo = new Insumo(input);

                //Guardar en db
                const insumo = await nuevoInsumo.save();

                return insumo;
            } catch (error) {
                console.log(error);
            }
        },

        actualizarInsumo: async (_, { id, input }) => {
            //Comprobar existencia del insumo
            let insumo = await Insumo.findById(id);

            if (!insumo) {
                throw new Error('Insumo no encontrado');
            }

            insumo = await Insumo.findByIdAndUpdate( { _id: id }, input, { new: true } );

            return insumo;
        },

        eliminarInsumo: async (_, { id } ) => {
            let insumo = await Insumo.findById(id);
            
            if (!insumo) {
                throw new Error('Insumo no encontrado');
            }

            insumo = await Insumo.findByIdAndDelete({ _id: id });

            return "Insumo eliminado.";

        },

        nuevoInsumoStock: async (_, {input}) => {

            // Verificar del la existencia del insumo en Stock
            const { lote } = input;
            const existeInsumo = await StockInsumo.findOne({lote});
            if (existeInsumo) {
                throw new Error('Ya existe ese lote');
            }

            try {
                const nuevoLote = new StockInsumo(input);

                const lote = await nuevoLote.save();

                return lote;
            } catch (error) {
                console.lot(error);
            }
        },

        actualizarInsumoStock: async (_, { id, input }) => {
            //Comprobar existencia del insumo en stock
            let insumo = await StockInsumo.findById(id);

            if (!insumo) {
                throw new Error('No existe el insumo en stock')
            }

            insumo = await StockInsumo.findByIdAndUpdate( {_id: id}, input, { new: true });
       
            
            return insumo;            
        },

        eliminarInsumoStock: async (_, { id }) => {

            //Comprobar existencia del insumo en stock
            let lote = await StockInsumo.findById(id);

            if (!lote) {
                throw new Error('No existe el insumo en stock')
            }

            lote = await StockInsumo.findByIdAndDelete({ _id: id });

            return "Lote eliminado del stock.";

        },

        nuevoCliente: async (_, { input }, ctx) => {

            //Verificar si ya existe el cliente
            const { email } = input
            const cliente = await Cliente.findOne({ email });
            if(cliente) {
                throw new Error('Ya existe el cliente');
            }

            const nuevoCliente = new Cliente(input);

            //Asignar el vendedor
            nuevoCliente.vendedor = ctx.usuario.id;

            //Guardar en DB
            try {
                const resultado = await nuevoCliente.save();
                return resultado; 
            } catch (error) {
                console.log(error);
            }            
        },

        actualizarCliente: async (_, {id, input}, ctx) => {
            //Verificar existencia
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('El cliente no existe');
            }

            //Verificar si edita el vendedor
            if(cliente.vendedor.toString() !== ctx.usuario.id ) {
                throw new Error('No tienes las credenciales.');
            } 

            //Guardar en db
            cliente = await Cliente.findOneAndUpdate({_id: id}, input, {new: true});
            return cliente;
        },

        eliminarCliente: async (_, { id }, ctx) => {
            //Verificar existencia
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('El cliente no existe');
            }
            
            //Verificar si edita el vendedor
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales.');
            } 
            
           //Eliminar el cliente
           await Cliente.findOneAndDelete({_id: id});
           return 'Cliente eliminado'; 
        },

        nuevoPedido: async (_, {input}, ctx) => {
            
            const { cliente } = input
            
            //Verificar existencia de cliente
            let existeCliente = await Cliente.findById(cliente);
            if (!existeCliente) {
                throw new Error('El cliente no existe');
            }

            //Verificar si pertenece al vendedor
            if(existeCliente.vendedor.toString() !== ctx.usuario.id ) {
                throw new Error('No tienes las credenciales.');
            }

            //Verificar stock
            for await ( const articulo of input.pedido ) {
                const { id } = articulo;
                  
                const producto = await Producto.findById(id);

                if(articulo.cantidad > producto.cantidad) {
                    throw new Error(`El articulo: ${producto.nombre} exede la cantidad disponible`);
                } else {
                    //Descontar articulos del stock
                    producto.cantidad = producto.cantidad - articulo.cantidad;

                    await producto.save();
                } 
            }

            //Crear nuevo pedido
            const nuevoPedido = new Pedido(input);

            //Asignar vendedor
            nuevoPedido.vendedor = ctx.usuario.id;

            //Guardar en DB
            const resultado = await nuevoPedido.save();
            return resultado;
        },

        actualizarPedido: async (_,{id, input}, ctx) => {
            
            const { cliente } = input;

            //Verificar si existe
            const existePedido = await Pedido.findById(id);
            if(!existePedido) {
                throw new Error('Pedido no encontrado');
            }

            //Verificar cliente
            const existeCliente = await Cliente.findById(cliente);
            if(!existeCliente) {
                throw new Error('Cliente no encontrado');
            }

            //Verificar vendedor
            if(existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales.');
            }

            //Revisar el stock
            if (input.pedido) {
                for await ( const articulo of input.pedido ) {
                    const { id } = articulo;
                    
                    const producto = await Producto.findById(id);

                    if(articulo.cantidad > producto.cantidad) {
                        throw new Error(`El articulo: ${producto.nombre} exede la cantidad disponible`);
                    } else {
                        //Descontar articulos del stock
                        producto.cantidad = producto.cantidad - articulo.cantidad;

                        await producto.save();
                    } 
                }    
            }
            
            //Guardar en DB
            resultado = await Pedido.findOneAndUpdate({_id: id}, input, {new: true});
            return resultado;
        },

        eliminarPedido: async (_, {id}, ctx) => {
            //Verificar si existe
            let pedido = await Pedido.findById(id);
            if(!pedido) {
                throw new Error('Pedido no encontrado');
            }

            if(pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales.');
            } 

            await Pedido.findByIdAndDelete(id);
            return 'Pedido eliminado'
        },

        nuevoRegistroSalida: async (_, {input}) => {

            const { lotes, operario } = input;
            for (let index = 0; index < lotes.length; index++) {
                let lote = await StockProducto.findById({_id: lotes[index].loteID});
                try {
                    if (lote && lote.cantidad < lotes[index].cantidad) {
                        if (lote) {
                            throw new Error(`No hay disponibilidad de producto en el Lote: ${lote.lote}.`);
                        } else {
                            throw new Error(`Uno de los lotes no existe.`);
                        }
                    }
                } catch (error) {
                    return error;
                }                      
            }

            for (let index = 0; index < lotes.length; index++) {
                let lote = await StockProducto.findById({_id: lotes[index].loteID});
                try {
                    if (lote && lote.cantidad >= lotes[index].cantidad) {
                        // Actualizar info en el lote del producto         
                        if(lote.cantidad > lotes[index].cantidad) {
                            lote.cantidad -= lotes[index].cantidad;
                            lote.modificado = Date.now();
                            lote.responsable = operario;
                            await StockProducto.findByIdAndUpdate({_id: lotes[index].loteID}, lote, {new: true})
                        } else {
                            await StockProducto.findByIdAndDelete({_id: lotes[index].loteID})
                        }
                    } else {
                        if (lote) {
                            throw new Error(`No hay disponibilidad de producto en el Lote: ${lote.lote}.`);
                        } else {
                            throw new Error(`Uno de los lotes no existe.`);
                        }                        
                    } 
                } catch (error) {
                    return error;
                }                      
            }

            // Guardar registro en DB
            const registro = new Salida(input);
            const resultado = await registro.save();

            return resultado;
        },

        actualizarRegistroSalida: async (_, {id, input}) => {
            // Buscar existencia de planilla por ID
            let registro = await Salida.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            //Actualizar DB
            registro = await Salida.findByIdAndUpdate( {_id: id}, input, { new: true });
            
            return registro; 
        },

        eliminarRegistroSalida: async (_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await Salida.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await Salida.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },

        nuevoRegistroIngreso: async (_, { input }) => {

            // Verificar del la existencia del insumo en Stock
            const { lote, cantidad, insumoID } = input;

            if (lote) {
                const NuevoLote = {
                    insumo: insumoID,
                    lote: lote,
                    cantidad: cantidad
                }
                const existeInsumo = await StockInsumo.findOne({lote});
                try {
                    if (existeInsumo) {
                        existeInsumo.cantidad += cantidad;
                        await StockInsumo.findByIdAndUpdate({_id: existeInsumo.id}, existeInsumo, {new: true})
                    } else {
                        const respuesta = new StockInsumo(NuevoLote);
        
                        await respuesta.save();
                    }           
                } catch (error) {
                    console.log(error);
                }   
            }
            
            // Guardar registro en DB
            const registro = new Ingreso(input);
            const resultado = await registro.save();

            return resultado;
        },

        actualizarRegistroIngreso: async (_, {id, input}) => {
            // Buscar existencia de planilla por ID
            let registro = await Ingreso.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            //Actualizar DB
            registro = await Ingreso.findByIdAndUpdate( {_id: id}, input, { new: true });
            
            return registro; 
        },

        eliminarRegistroIngreso: async (_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await Ingreso.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await Ingreso.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },

        nuevoRegistroPP: async (_, {id, input}) => {
            const {lote, cantDescarte, cantProducida, productoID, lPlacaID, lTaponID, lPcmID, pcmFinalizado, operario } = input;
            let infoLote = await StockProducto.findOne({ lote: lote, estado: "Proceso", producto: productoID});
            try {
                if (id) {
                    // Actualizar Stock de Insumos
                    if (lPlacaID && lTaponID) {
                        let lotePlacas = await StockInsumo.findById(lPlacaID);
                        let loteTapon = await StockInsumo.findById(lTaponID); 
                        if (pcmFinalizado) {
                            const prueba = await StockInsumo.findByIdAndDelete(lPcmID);
                        }
                        if (lotePlacas.cantidad > cantProducida) {
                            lotePlacas.cantidad -= cantProducida;
                            await StockInsumo.findByIdAndUpdate({_id: lPlacaID}, lotePlacas, {new: true});    
                        } else {
                            await StockInsumo.findByIdAndDelete(lPlacaID)
                        }
                        if (loteTapon.cantidad > cantProducida) {
                            loteTapon.cantidad -= cantProducida;
                            await StockInsumo.findByIdAndUpdate({_id: lTaponID}, loteTapon, {new: true});
                        } else {
                            await StockInsumo.findByIdAndDelete(lTaponID)
                        }                        
                    }
        
                    if (infoLote) {
                        //Actualizar lote con datos de input
                        infoLote.cantidad += cantProducida - cantDescarte;
                        infoLote.modificado = Date.now();
                        infoLote.responsable = operario;
                        await StockProducto.findByIdAndUpdate({_id: infoLote.id}, infoLote, {new: true})
                    } else {
                        //Crear nuevo lote
                        const nuevoLote = {
                            lote,
                            estado: "Proceso",
                            cantidad: cantProducida - cantDescarte,
                            producto: productoID,
                            responsable: operario,
                            modificado: Date.now()                        
                        }
                        const loteTermiado = new StockProducto(nuevoLote);
                        await loteTermiado.save();
                    }

                    input.modificado = Date.now();;
                    input.estado = false;
                    resultado = await CPP.findByIdAndUpdate({_id: id}, input, {new: true});

                } else {
                    input.creado = Date.now();                                  
                    const registro = new CPP(input);
                    resultado = await registro.save();
                }

                return resultado;
            } catch (error) {
                console.log(error)
            }
        },

        actualizarRegistroPP: async (_, {id, input}) => {
            const { lote, cantDescarte, cantProducida, lPlaca, lTapon } = input;

            // Buscar existencia de planilla por ID
            let registro = await CPP.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            let regLotes = await StockProducto.find({ lote: registro.lote });
            let regPlaca = await StockInsumo.findOne({ lote: lPlaca });
            let regTapon = await StockInsumo.findOne({ lote: lTapon });
            
            const difPlacas = cantProducida - registro.cantProducida;
            const difDescarte = cantDescarte - registro.cantDescarte;

            regPlaca.cantidad -= difPlacas + difDescarte;
            regTapon.cantidad -= difPlacas + difDescarte;

            await StockInsumo.findByIdAndUpdate({_id: regPlaca.id}, regPlaca, {new: true});
            await StockInsumo.findByIdAndUpdate({_id: regTapon.id}, regTapon, {new: true});
            
            regLotes.forEach(async function(reg){
                reg.lote = lote;
                await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                switch (reg.estado) {
                    case 'Proceso':
                        reg.cantidad += difPlacas;
                        reg.modificado= Date.now();
                        await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                        break
                    case 'Reproceso':
                        reg.cantidad += difPlacas;
                        reg.modificado= Date.now();
                        await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                        break
                    default:
                        break
                }
            })

            //Actualizar DB
            registro = await CPP.findByIdAndUpdate( {_id: id}, input, { new: true });

            return registro; 
        },

        eliminarRegistroPP: async (_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await CPP.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await CPP.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },

        nuevoRegistroGP: async (_, { id, input}) => {
            const { guardado, descarte, lote, operario } = input;
            
            let infoLote = await StockProducto.findOne({ lote: lote, estado: {$ne: "Terminado"} });
            let loteTerminado = await StockProducto.findOne({lote: lote, estado: "Terminado"});
     
            try {
                if(!infoLote) {
                    throw new Error('Lote no encontrado');
                }
                
                if (id) { 
                    infoLote.responsable = operario;
                    infoLote.modificado = Date.now();
                    // Actualizar info en el lote del producto
                    if(infoLote.cantidad > guardado + descarte) {
                        infoLote.cantidad -= guardado + descarte;
                        await StockProducto.findByIdAndUpdate({_id: infoLote.id}, infoLote, {new: true})
                        if (loteTerminado) {
                            loteTerminado.cantidad += guardado;
                            loteTerminado.modificado = Date.now();
                            loteTerminado.responsable = operario;
                            await StockProducto.findByIdAndUpdate({_id: loteTerminado.id}, loteTerminado, {new: true});
                        } else {
                            // Crear nuevo lote terminado
                            const nuevoLote = {
                                lote: infoLote.lote,
                                estado: "Terminado",
                                cantidad: guardado,
                                producto: infoLote.producto,
                                responsable: operario,
                                modificado: Date.now()                        
                            }
                            const loteTermiado = new StockProducto(nuevoLote);
                            await loteTermiado.save();
                        }
                    } else {
                        if (loteTerminado) {
                            loteTerminado.cantidad += guardado;
                            loteTerminado.modificado = Date.now();
                            loteTerminado.responsable = operario;
                            await StockProducto.findByIdAndUpdate({_id: loteTerminado.id}, loteTerminado, {new: true});
                            await StockProducto.findByIdAndDelete({_id: infoLote.id});
                        } else {
                            infoLote.estado = "Terminado";
                            await StockProducto.findByIdAndUpdate({_id: infoLote.id}, infoLote, {new: true});
                        }
                    }
                    // Crear y guardar nuevo registro
                    const finalizar = Date.now();
                    input.modificado = finalizar;
                    input.estado = false;
                    resultado = await CGP.findByIdAndUpdate({_id: id}, input, {new: true});

                } else {
                    const iniciar = Date.now();
                    input.creado = iniciar;
                    const registro = new CGP(input);
                    resultado = await registro.save();
                } 

                return resultado;
         
            } catch (error) {
                console.log(error);
            }
        },

        actualizarRegistroGP: async (_, { id, input }) => {
            const { lote, guardado, descarte } = input;

            // Buscar existencia de planilla por ID
            let registro = await CGP.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }
            const regLotes = await StockProducto.find({ lote: registro.lote });

            const difPlacas = guardado - registro.guardado;
            const difDescarte = descarte - registro.descarte;

            regLotes.forEach(async function(reg){
                reg.lote = lote;
                await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                switch (reg.estado) {
                    case 'Proceso':
                        reg.cantidad -= difPlacas + difDescarte;
                        reg.modificado= Date.now();
                        await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                        break
                    case 'Reproceso':
                        reg.cantidad -= difPlacas  + difDescarte;
                        reg.modificado= Date.now();
                        await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                        break
                    case 'Terminado':
                        reg.cantidad += difPlacas;
                        reg.modificado= Date.now();
                        await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                        break
                    default:
                        break
                }
            })

            //Actualizar DB
            registro = await CGP.findByIdAndUpdate( {_id: id}, input, { new: true });
            return registro; 
        },

        eliminarRegistroGP: async(_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await CGP.findById(id);

            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await CGP.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },

        nuevoRegistroPE: async (_, {id, input}) => {
            
            const { descarte, lBolsa, lEsponja, cantProducida } = input;

            let resultado;
            const finalizar = Date.now();
            try {   

                //Guardar registro en DB
                if (id) {                    
                    // Actualizar el lotes de insumos
                    const loteBolsa = await StockInsumo.findOne({ lote: lBolsa});
                    const loteEsponja = await StockInsumo.findOne({ lote: lEsponja});

                    loteBolsa.cantidad -= cantProducida;
                    await StockInsumo.findByIdAndUpdate({_id: loteBolsa.id}, loteBolsa, {new: true})


                    loteEsponja.cantidad -= cantProducida;
                    loteEsponja.cantidad += descarte;
                    await StockInsumo.findByIdAndUpdate({_id: loteEsponja.id}, loteEsponja, {new: true})


                    input.estado = false;
                    input.modificado = finalizar;
                    resultado = await CPE.findByIdAndUpdate({_id: id}, input, {new: true});

                } else {
                    const iniciar = Date.now();
                    input.creado = iniciar;                                  
                    const registro = new CPE(input);
                    resultado = await registro.save();
                }

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },

        actualizarRegistroPE: async (_, { id, input }) => {
            // Buscar existencia de planilla por ID
            let registro = await CPE.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            //Actualizar DB
            registro = await CPE.findByIdAndUpdate( {_id: id}, input, { new: true });
            
            return registro; 
        },

        actualizarRegistroStockPE: async (_, { id, input }) => {
            const {
              lote, cantProducida, descarte
            } = input;
            
            // Buscar existencia de planilla por ID
            let registro = await CPE.findById(id);
            if (!registro) {
                throw new Error('Registro no encontrado');
            }   
            
            // Obtener informacion de Registros
            const regLotes = await StockProducto.find({ lote: registro.lote });
            const regLote = await StockProducto.findOne({ lote: registro.lote, estado: 'Proceso' });
            const regBolsa = await StockInsumo.findOne({ lote: registro.lBolsa });
            const regEsponja = await StockInsumo.findOne({ lote: registro.lEsponja }); 

            // Calcular Diferencias
            let difCantidadProducida = cantProducida - registro.cantProducida;
            let difdescarte = registro.descarte - descarte - difCantidadProducida;  

            // Actualizar Stock de Insumos
            regBolsa.cantidad += difdescarte;
            regEsponja.cantidad += difdescarte;
            await StockInsumo.findByIdAndUpdate({ _id: regBolsa.id }, regBolsa, { new: true });
            await StockInsumo.findByIdAndUpdate({ _id: regEsponja.id }, regEsponja, { new: true });
            

            // Si el Lote de producto continua en Proceso modificarlo
            regLote.cantidad += difCantidadProducida;
            await StockProducto.findByIdAndUpdate({ _id: regLote.id }, regLote, { new: true });
        
            // Si cambia el nombre del lote actualizarlo en el stock
            if (registro.lote !== lote) {
                if (regLotes.length > 1) {
                    regLotes.forEach(async function(l){
                        l.lote = lote;
                        l.modificado = Date.now();
                        await StockProducto.findByIdAndUpdate({ _id: l.id }, l, { new: true });
                    });
                } else {
                    regLote.lote = lote;
                    regLote.modificado = Date.now();
                    await StockProducto.findByIdAndUpdate({ _id: regLote.id }, regLote, { new: true });
                };
            };
            // Actualizar DB
            registro = await CPE.findByIdAndUpdate({ _id: id }, input, { new: true });

            return registro;
        },

        eliminarRegistroCE: async (_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await CPE.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await CPE.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },

        nuevoRegistroGE: async (_, { id, input}) => {
            const { guardado, descarte, lote, operario } = input;
            
            let infoLote = await StockProducto.findOne({ lote: lote, estado: {$ne: "Terminado"} });
            let loteTerminado = await StockProducto.findOne({lote: lote, estado: "Terminado"});
            let registro = await CPE.findOne({lote: lote});
            let loteEsponja = await StockInsumo.findOne({lote: registro.lEsponja});

            try {
                if(!infoLote) {
                    throw new Error('Lote no encontrado');
                }
                
                if (id) {
                    infoLote.modificado = Date.now();
                    infoLote.responsable = operario;

                    // Se suma las esponjas recuperadas en el descarte al lote de Esponjas
                    loteEsponja.cantidad += descarte;
                    await StockInsumo.findByIdAndUpdate({_id: loteEsponja.id}, loteEsponja, {new: true})
             
                    // Actualizar info en el lote del producto
                    if(infoLote.cantidad > guardado + descarte) {
                        infoLote.cantidad -= guardado + descarte;
                        await StockProducto.findByIdAndUpdate({_id: infoLote.id}, infoLote, {new: true})
                        if (loteTerminado) {
                            loteTerminado.modificado = Date.now();
                            loteTerminado.responsable = operario;                        
                            loteTerminado.cantidad += guardado;
                            await StockProducto.findByIdAndUpdate({_id: loteTerminado.id}, loteTerminado, {new: true});
                        } else {
                            // Crear nuevo lote terminado
                            const nuevoLote = {
                                lote: infoLote.lote,
                                estado: "Terminado",
                                cantidad: guardado,
                                producto: infoLote.producto,
                                modificado: Date.now(),
                                responsable: operario                        
                            }
                            const loteTermiado = new StockProducto(nuevoLote);
                            await loteTermiado.save();
                        }
                    } else {
                        if (loteTerminado) {
                            loteTerminado.cantidad += guardado;
                            loteTerminado.modificado = Date.now();
                            loteTerminado.responsable = operario;
                            await StockProducto.findByIdAndUpdate({_id: loteTerminado.id}, loteTerminado, {new: true});
                            await StockProducto.findByIdAndDelete({_id: infoLote.id});
                        } else {
                            if (guardado !== 0) {
                                infoLote.estado = "Terminado";
                                infoLote.cantidad = guardado;
                                await StockProducto.findByIdAndUpdate({_id: infoLote.id}, infoLote, {new: true});
                            }
                        }
                    }
                    // Crear y guardar nuevo registro
                    const finalizar = Date.now();
                    input.modificado = finalizar;
                    input.estado = false;
                    resultado = await CGE.findByIdAndUpdate({_id: id}, input, {new: true});

                } else {
                    const iniciar = Date.now();
                    input.creado = iniciar;
                    const registro = new CGE(input);
                    resultado = await registro.save();
                } 

                return resultado;
         
            } catch (error) {
                console.log(error);
            }
        },

        actualizarRegistroGE: async (_, { id, input }) => {
            const { lote, guardado } = input;
            
            // Buscar existencia de planilla por ID
            let registro = await CGE.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }
            let regLotes = await StockProducto.find({ lote: registro.lote });

            let difPlacas = guardado - registro.guardado;

            if (regLotes.length > 1) {
                let enProceso = regLotes.find(l => l.estado === 'Proceso')
                let terminado = regLotes.find(l => l.estado === 'Terminado')    
                
                // Actualizar cada registro y guardar cambios en la base de datos
                enProceso.cantidad -= difGuardado;
                terminado.cantidad += difGuardado;
                enProceso.lote = lote
                terminado.lote = lote
                await StockProducto.findByIdAndUpdate({ _id: terminado.id }, terminado, { new: true });
                if (enProceso.cantidad === 0) {
                    await StockProducto.findByIdAndDelete({ _id: enProceso.id });
                } else {
                    await StockProducto.findByIdAndUpdate({ _id: enProceso.id }, enProceso, { new: true });
                }
     

            } else {
                if (regLotes[0].estado === 'Terminado') {
                    regLotes[0].lote = lote;
                    regLotes[0].cantidad += difGuardado;
                    regLotes[0].modificado = Date.now();
                    await StockProducto.findByIdAndUpdate({ _id: regLotes[0].id }, regLotes[0], { new: true });

                    if (difGuardado < 0) {
                        // Crear nuevo lote en proceso
                        const nuevoLote = {
                            lote: regLotes[0].lote,
                            producto: regLotes[0].producto,
                            responsable: regLotes[0].responsable,                        
                            estado: "Proceso",
                            cantidad: -difGuardado,
                            modificado: Date.now(),
                        }
                        const loteEnProceso = new StockProducto(nuevoLote);
                        await loteEnProceso.save();
                    }
                }                
            }
            //Actualizar DB
            registro = await CGE.findByIdAndUpdate( {_id: id}, input, { new: true });            
            return registro; 
        },

        eliminarRegistroGE: async (_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await CGE.findById(id);

            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await CGE.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },

        nuevoRegistroSP: async (_, { id, input}) => {

            const { sellado, descarte, lote, operario } = input;
            let infoLote = await StockProducto.findOne({ lote: lote, estado: "Proceso" });
            let loteReproceso = await StockProducto.findOne({lote: lote, estado: "Reproceso"});
            try {
                if(!infoLote) {
                    throw new Error('Lote no encontrado');
                }
                if (id) {
                    infoLote.modificado = Date.now();
                    infoLote.responsable = operario;
                    if (infoLote.cantidad > sellado + descarte) {
                        infoLote.cantidad -= sellado + descarte;
                        await StockProducto.findByIdAndUpdate({_id: infoLote.id}, infoLote, {new: true})
                        if (loteReproceso) {
                            loteReproceso.modificado = Date.now();
                            loteReproceso.responsable = operario;                        
                            loteReproceso.cantidad += sellado;
                            await StockProducto.findByIdAndUpdate({_id: loteReproceso.id}, loteReproceso, {new: true});
                        } else {
                            // Crear nuevo lote terminado
                            const nuevoLote = {
                                lote: infoLote.lote,
                                estado: "Reproceso",
                                cantidad: sellado,
                                producto: infoLote.producto,
                                modificado: Date.now(),
                                responsable: operario                        
                            }
                            const loteReproceso = new StockProducto(nuevoLote);
                            await loteReproceso.save();
                        }
                    } else {
                        if (loteReproceso) {
                            loteReproceso.cantidad += sellado;
                            loteReproceso.modificado = Date.now();
                            loteReproceso.responsable = operario;
                            await StockProducto.findByIdAndUpdate({_id: loteReproceso.id}, loteReproceso, {new: true});
                            await StockProducto.findByIdAndDelete({_id: infoLote.id});
                        } else {
                            if (sellado !== 0) {
                                infoLote.estado = "Reproceso";
                                infoLote.cantidad = sellado;
                                await StockProducto.findByIdAndUpdate({_id: infoLote.id}, infoLote, {new: true});
                            }
                        }
                    }
                    // Crear y guardar nuevo registro
                    input.modificado = Date.now();
                    input.estado = false;
                    resultado = await CSP.findByIdAndUpdate({_id: id}, input, {new: true});

                } else {
                    input.creado = Date.now();
                    const registro = new CSP(input);
                    resultado = await registro.save();
                }

                return resultado;               
                
            } catch (error) {
                console.log(error)
            }
        },

        actualizarRegistroSP: async (_, { id, input }) => {
            const { lote, sellado, descarte } = input;
            // Buscar existencia de planilla por ID
            let registro = await CSP.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            let regLotes = await StockProducto.find({ lote: registro.lote });
            console.log(regLotes)

            const difPlacas = sellado - registro.sellado;
            const difDescarte = descarte - registro.descarte;
            console.log(difPlacas)
            regLotes.forEach(async function(reg){
                reg.lote = lote;
                await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                switch (reg.estado) {
                    case 'Proceso':
                        reg.cantidad -= difPlacas + difDescarte;
                        reg.modificado = Date.now();
                        if (reg.cantidad === 0) {
                            await StockProducto.findByIdAndDelete({_id: reg.id});
                        } else {
                            await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                        }
                        break
                    case 'Reproceso':
                        reg.cantidad += difPlacas  + difDescarte;
                        reg.modificado = Date.now();
                        await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                        if (regLotes.length === 1 && difPlacas < 0) {
                            const nuevoLote = {
                                lote: regLotes[0].lote,
                                producto: regLotes[0].producto,
                                responsable: regLotes[0].responsable,                        
                                estado: "Proceso",
                                cantidad: -difPlacas,
                                modificado: Date.now(),
                            }
                            const loteEnProceso = new StockProducto(nuevoLote);
                            await loteEnProceso.save();
                        }
                        break
                    case 'Terminado':
                        reg.modificado = Date.now();
                        await StockProducto.findByIdAndUpdate({_id: reg.id}, reg, {new: true});
                    default:
                        break
                }
            });

            //Actualizar DB
            registro = await CSP.findByIdAndUpdate( {_id: id}, input, { new: true });
            
            return registro; 
        },

        eliminarRegistroSP: async (_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await CSP.findById(id);

            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await CSP.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },

        nuevoRegistroPG: async (_, { input }) => {
            const { loteInsumoID, cantidad } = input;
            try {                
                // Actualizar Lote de Gel
                let loteGel = await StockInsumo.findById(loteInsumoID);
                loteGel.cantidad -= cantidad  
                await StockInsumo.findByIdAndUpdate({_id: loteInsumoID}, loteGel, {new: true});

                input.creado = Date.now();
                const registro = new PG(input);
                resultado = await registro.save();
                
            } catch (error) {
                console.log(error)
            }

            return resultado;
        },

        actualizarRegistroPG: async (_, { id, input }) => {
            // Buscar existencia de planilla por ID
            let registro = await PG.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            //Actualizar DB
            registro = await PG.findByIdAndUpdate( {_id: id}, input, { new: true });
            
            return registro; 
        },

        eliminarRegistroPG: async (_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await PG.findById(id);

            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await PG.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },

        nuevoRegistroCPG: async (_, { id, input }) => {
            const { lote, loteBolsaID, cantProducida, cantDescarte, operario, productoID } = input;
            
            // Obtener informacion en Insumos y Productos en Stock
            let bolsaStock = await StockInsumo.findById(loteBolsaID);
            let loteStock = await StockProducto.findOne({lote: lote, producto: productoID});
            try {
                if (id) {
                    // Actualizar la cantidad de Insumo
                    bolsaStock.cantidad -= cantProducida + cantDescarte;
                    await StockInsumo.findByIdAndUpdate( {_id: loteBolsaID}, bolsaStock, { new: true });

                    // Actualizar o crear nuevo lote de producto en el Stock
                    if (loteStock){
                        loteStock.modificado = Date.now();
                        loteStock.responsable = operario;
                        loteStock.cantidad += cantProducida;
                        await StockProducto.findByIdAndUpdate( {_id: loteStock.id}, loteStock, { new: true });
                    } else {
                        const nuevoLote = {
                            lote: lote,
                            estado: "Terminado",
                            cantidad: cantProducida,
                            producto: productoID,
                            responsable: operario,
                            modificado: Date.now()                        
                        }
                        const loteTermiado = new StockProducto(nuevoLote);
                        await loteTermiado.save();
                    }

                    // Actualizar los datos del registro y finalizarlo
                    input.modificado = Date.now();
                    input.estado = false;
                    resultado = await CPG.findByIdAndUpdate( {_id: id}, input, { new: true })


                } else {

                    // Abrir un nuevo rejistro activo
                    input.creado = Date.now();
                    const registro = new CPG(input);
                    resultado = await registro.save();
                }

            } catch (error) {
                console.log(error)
            }

            return resultado;
        },

        nuevoDobleRegistroCPG: async (_ , { id, input}) => {
            const { 
                lote,
                loteBolsaID,
                cantProducida,
                cantDescarte,
                operario,
                productoID,
                loteBolsaCristal,
                cantDescarteBolsaCristal, 
            } = input;
            
            console.log('Input: ', input);

            // Obtener informacion en Insumos y Productos en Stock
            let bolsaStock = await StockInsumo.findById(loteBolsaID);
            console.log('Stock bolsas: ', bolsaStock);
            let bolsaCristalStock = await StockInsumo.findOne({ lote: loteBolsaCristal});
            console.log('Stock cristal bolsas: ', bolsaCristalStock);
            let loteStock = await StockProducto.findOne({lote: lote, producto: productoID});
            console.log('Lote en Stock: ', loteStock);
            try {
                if (id) {
                    console.log('Entra con id');
                    if (!loteBolsaCristal) {
                        console.log('No existe bolsa cristal');
                        // Actualizar o crear nuevo lote de producto en el Stock
                        if (loteStock){
                           throw new Error('Ya existe ese lote en el stock');
                        } else {
                            // Actualizar la cantidad de Insumo de Bolsa simple
                            bolsaStock.cantidad -= cantDescarte;
                            await StockInsumo.findByIdAndUpdate({_id: loteBolsaID}, bolsaStock, { new: true });

                            const nuevoLote = {
                                lote: lote,
                                estado: "Proceso",
                                cantidad: 0,
                                producto: productoID,
                                responsable: operario,
                                modificado: Date.now()                        
                            }
                            const loteTermiado = new StockProducto(nuevoLote);
                            console.log('Se creo el lote: ', loteTermiado);
                            await loteTermiado.save();
                        }
                    } else {
                        // Actualizar la cantidad de Insumo de Bolsa simple
                        bolsaStock.cantidad -= cantProducida;
                        await StockInsumo.findByIdAndUpdate({_id: loteBolsaID}, bolsaStock, { new: true });

                        // Actualizar la cantidad de Insumo de Bolsa cristal
                        bolsaCristalStock.cantidad -= cantProducida + cantDescarteBolsaCristal;
                        await StockInsumos.findByIdAndUpdate({_id: bolsaCristalStock.id }, bolsaCristalStock, { new: true });

                        // Actualizar el stock de producto a estado terminado
                        loteStock.estado = 'Terminado';
                        loteStock.cantidad += cantProducida - cantDescarte;
                        await StockProducto.findByIdAndUpdate({_id: loteStock.id}, loteStock, { new: true });                        
                    }

                    // Actualizar los datos del registro y finalizarlo
                    input.modificado = Date.now();
                    input.estado = false;
                    resultado = await CPG.findByIdAndUpdate( {_id: id}, input, { new: true })


                } else {
                    // Abrir un nuevo rejistro activo
                    console.log('Crea un nuevo registro: ');
                    input.creado = Date.now();
                    const registro = new CPG(input);
                    console.log(registro);
                    resultado = await registro.save();
                }
            } catch (error) {
                console.log(error)
            }
            return resultado;
        },

        actualizarRegistroCPG: async (_, { id, input }) => {
            // Buscar existencia de planilla por ID
            let registro = await CPG.findById(id);
            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            //Actualizar DB
            registro = await CPG.findByIdAndUpdate( {_id: id}, input, { new: true });
            
            return registro; 
        },

        eliminarRegistroCPG: async (_, { id }) => {
            // Buscar existencia de planilla por ID
            let registro = await CPG.findById(id);

            if(!registro) {
                throw new Error('Registro no encontrado');
            }

            registro = await CPG.findByIdAndDelete({ _id: id });

            return "Registro eliminado.";
        },


    }
}

module.exports = resolvers;
