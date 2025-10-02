// server.js - Código Consolidado y Limpio

// 1. Cargar las variables de entorno (dotenv) y módulos
import 'dotenv/config'; // Forma moderna de cargar dotenv
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
// Se usa process.env.PORT si está en .env, si no, usa 3000
const PORT = process.env.PORT || 3000; 

// 2. Middleware
app.use(cors()); // Permite la comunicación (Frontend/Backend)
app.use(express.json()); // Permite leer datos JSON

// 3. Conexión a MongoDB
// Obtiene la cadena de conexión del archivo .env
const dbURI = process.env.MONGO_URI; 

mongoose.connect(dbURI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

// 4. Definición de los Modelos
// -----------------------------------------------------------------------------

// ⚠️ CÓDIGO FALTANTE: Definición del modelo Proyecto
const ProyectoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: String,
});

const Proyecto = mongoose.model('Proyecto', ProyectoSchema);

// Definición del modelo Tarea (con campos de verificación)
const TareaSchema = new mongoose.Schema({
    proyectoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto',
        required: true
    },
    nombre: String,
    responsable: String,
    estado: String, // 'No Atendido', 'En Proceso', 'Concluido'
    prioridad: { type: String, default: 'Media' },
    
    // CAMPOS DE VERIFICACIÓN:
    solicitudVerificacion: { type: Boolean, default: false },
    verificado: { type: Boolean, default: false }
});

const Tarea = mongoose.model('Tarea', TareaSchema);

// 5. Rutas (API REST) (¡Rutas actualizadas para manejar proyectos y tareas!)
// --------------------------------------------------------------------------

// Rutas para PROYECTOS
// Ruta 4: Crear un nuevo proyecto
app.post('/api/proyectos', async (req, res) => {
    const nuevoProyecto = new Proyecto(req.body); 
    try {
        await nuevoProyecto.save();
        res.status(201).json(nuevoProyecto);
    } catch (err) {
        res.status(400).json({ message: "Error al crear el proyecto" });
    }
});

// Ruta 5: Obtener todos los proyectos
app.get('/api/proyectos', async (req, res) => {
    try {
        const proyectos = await Proyecto.find();
        res.json(proyectos);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener proyectos" });
    }
});


// Rutas para TAREAS
// Ruta 1 (ACTUALIZADA): Obtener todas las tareas de UN PROYECTO específico
app.get('/api/tareas/:proyectoId', async (req, res) => {
    const { proyectoId } = req.params;
    try {
        // Buscamos solo las tareas que pertenecen a ese proyectoId
        const tareas = await Tarea.find({ proyectoId: proyectoId });
        res.json(tareas);
    } catch (err) {
        // El error puede ser por un formato de ID incorrecto
        res.status(500).json({ message: "Error al obtener tareas por proyecto. El ID podría ser inválido." });
    }
});

// Ruta 2 (ACTUALIZADA): Guardar una nueva tarea (CREATE)
// El body de la petición debe incluir ahora el `proyectoId`
app.post('/api/tareas', async (req, res) => {
    const nuevaTarea = new Tarea(req.body); 
    try {
        await nuevaTarea.save();
        res.status(201).json(nuevaTarea);
    } catch (err) {
        // Mostrar error si faltan campos requeridos como proyectoId
        res.status(400).json({ message: "Error al crear tarea. Asegúrese de incluir proyectoId y nombre." });
    }
});

// Ruta 3 (SE MANTIENE): Modificar el estado de una tarea (UPDATE)
app.patch('/api/tareas/:id', async (req, res) => {
    const { id } = req.params; 
    // La petición puede incluir tanto el estado como la prioridad ahora
    const { estado, prioridad } = req.body; 
    
    try {
        const tareaActualizada = await Tarea.findByIdAndUpdate(
            id, 
            { estado, prioridad },  // Puede actualizar estado y/o prioridad
            { new: true }
        );
        
        if (!tareaActualizada) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }
        
        res.json(tareaActualizada);

    } catch (err) {
        res.status(500).json({ message: "Error al actualizar tarea" });
    }
});

// Ruta 7 (NUEVA): Marcar una tarea como VERIFICADA
app.patch('/api/tareas/verificar/:id', async (req, res) => {
    const { id } = req.params; 
    
    try {
        const tareaActualizada = await Tarea.findByIdAndUpdate(
            id, 
            { verificado: true, solicitudVerificacion: false }, // Verificado: true, y se quita la solicitud pendiente
            { new: true }
        );
        
        if (!tareaActualizada) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }
        
        res.json(tareaActualizada);

    } catch (err) {
        res.status(500).json({ message: "Error al verificar tarea" });
    }
});

// Ruta 6 (NUEVA): Eliminar una tarea por ID (DELETE)
app.delete('/api/tareas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await Tarea.findByIdAndDelete(id);
        if (!resultado) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }
        res.status(200).json({ message: "Tarea eliminada con éxito" });
    } catch (err) {
        res.status(500).json({ message: "Error al eliminar tarea" });
    }
});



// 6. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${PORT}`);
});