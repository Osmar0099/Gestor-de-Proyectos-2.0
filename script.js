// script.js (Versión para Múltiples Proyectos y CRUD Completo)

const API_BASE_URL = 'http://localhost:3000/api';
let proyectoActivoId = null; // Almacenará el ID del proyecto actualmente seleccionado

// ===============================================
// LÓGICA DE PROYECTOS (LECTURA Y CREACIÓN)
// ===============================================

// 1. Carga la lista de proyectos disponibles y los muestra como botones
async function cargarProyectos() {
    try {
        const response = await fetch(`${API_BASE_URL}/proyectos`);
        const proyectos = await response.json();
        
        const listaDiv = document.getElementById('proyectos-lista');
        listaDiv.innerHTML = '';
        
        if (proyectos.length === 0) {
            listaDiv.innerHTML = '<p>No hay proyectos. Crea uno nuevo.</p>';
            return;
        }

        proyectos.forEach(p => {
            const boton = document.createElement('button');
            boton.textContent = p.nombre;
            boton.className = 'btn-proyecto';
            boton.onclick = () => seleccionarProyecto(p._id, p.nombre);
            listaDiv.appendChild(boton);
        });

        // Opcional: Seleccionar el primer proyecto por defecto al cargar
        if (proyectoActivoId === null) {
            seleccionarProyecto(proyectos[0]._id, proyectos[0].nombre);
        }

    } catch (error) {
        console.error('Error al cargar proyectos:', error);
    }
}

// 2. Establece el proyecto activo y carga sus tareas
function seleccionarProyecto(id, nombre) {
    proyectoActivoId = id;
    document.getElementById('titulo-proyecto').textContent = `Proyecto: ${nombre}`;
    // Resalta el botón activo (opcional: requiere CSS)
    document.querySelectorAll('.btn-proyecto').forEach(btn => {
        btn.classList.remove('activo');
        if (btn.textContent === nombre) {
            btn.classList.add('activo');
        }
    });
    cargarTareas(); // Carga las tareas de este proyecto
}

// 3. Crea un nuevo proyecto en la BD
async function crearNuevoProyecto() {
    const nombre = document.getElementById('input-nombre-proyecto').value.trim();
    if (!nombre) {
        alert('Ingresa un nombre para el proyecto.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/proyectos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombre })
        });

        if (response.ok) {
            document.getElementById('input-nombre-proyecto').value = '';
            await cargarProyectos(); // Recarga la lista para mostrar el nuevo
        } else {
            alert('Error al crear el proyecto.');
        }
    } catch (error) {
        console.error('Error de conexión al crear proyecto:', error);
    }
}


// ===============================================
// LÓGICA DE TAREAS (CRUD)
// ===============================================

// 4. Carga las tareas del proyecto activo (READ)
async function cargarTareas() {
    if (proyectoActivoId === null) {
        document.getElementById('cuerpo-tabla').innerHTML = '<tr><td colspan="5">Selecciona un proyecto para ver las tareas.</td></tr>';
        return;
    }

    try {
        // Usa la nueva ruta que filtra por proyecto ID
        const response = await fetch(`${API_BASE_URL}/tareas/${proyectoActivoId}`);
        const tareas = await response.json();
        renderizarTabla(tareas);
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
        document.getElementById('cuerpo-tabla').innerHTML = '<tr><td colspan="5">Error al cargar las tareas.</td></tr>';
    }
}

// 5. Agrega una nueva tarea (CREATE)
async function agregarTarea() {
    if (proyectoActivoId === null) {
        alert('Debes seleccionar un proyecto primero.');
        return;
    }
    
    const nombreTarea = document.getElementById('input-tarea').value.trim();
    const responsable = document.getElementById('input-responsable').value.trim();
    const prioridad = document.getElementById('input-prioridad').value;

    if (!nombreTarea) return;

    const nuevaTarea = {
        proyectoId: proyectoActivoId, // ¡CLAVE! Enviamos el ID del proyecto
        nombre: nombreTarea,
        responsable: responsable,
        prioridad: prioridad,
        estado: 'No Atendido' // Estado inicial
    };

    try {
        const response = await fetch(`${API_BASE_URL}/tareas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaTarea)
        });
        
        if (response.ok) {
            document.getElementById('input-tarea').value = '';
            document.getElementById('input-responsable').value = '';
            await cargarTareas(); 
        }

    } catch (error) {
        console.error('Error al guardar la tarea en el servidor:', error);
    }
}

// script.js (Paso 6: Lógica de Avance y Solicitud de Verificación)

async function cambiarEstado(idTarea, estadoActual) {
    const estados = ['No Atendido', 'En Proceso', 'Concluido'];
    const indiceActual = estados.indexOf(estadoActual);
    const nuevoIndice = (indiceActual + 1) % estados.length;
    const nuevoEstado = estados[nuevoIndice];
    
    let datosActualizacion = { estado: nuevoEstado };
    
    // Si el nuevo estado es "Concluido", activamos la solicitud de verificación
    if (nuevoEstado === 'Concluido') {
        datosActualizacion = { 
            estado: 'Concluido', // Se marca como concluido
            solicitudVerificacion: true, // Se activa la verificación
            verificado: false // Aseguramos que no esté verificado aún
        };
        alert('Tarea marcada como "Concluida". Se requiere verificación final.');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tareas/${idTarea}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizacion)
        });
        
        if (response.ok) {
            await cargarTareas();
        }

    } catch (error) {
        console.error('Error al modificar el estado:', error);
    }
}

// 7. Elimina una tarea (DELETE)
async function eliminarTarea(idTarea) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tareas/${idTarea}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Tarea eliminada con éxito.');
            await cargarTareas();
        } else {
            alert('Error al eliminar la tarea.');
        }

    } catch (error) {
        console.error('Error al eliminar la tarea:', error);
    }
}

// script.js (Nueva Función para Verificar)

// 9. Marca la tarea como verificada (PATCH a la Ruta 7)
async function verificarTarea(idTarea) {
    if (!confirm('¿CONFIRMAS la verificación de esta tarea? Se marcará como COMPLETADA y bloqueada.')) {
        return;
    }
    
    try {
        // Llama a la nueva Ruta 7 del servidor
        const response = await fetch(`${API_BASE_URL}/tareas/verificar/${idTarea}`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            alert('Tarea verificada con éxito. Ya no se puede modificar su avance.');
            await cargarTareas(); // Recarga la tabla para ver el cambio
        } else {
            alert('Error al verificar la tarea.');
        }

    } catch (error) {
        console.error('Error al verificar la tarea:', error);
    }
}

// script.js (Paso 8: Renderiza la tabla con lógica de Verificación)

function renderizarTabla(tareas) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla');
    cuerpoTabla.innerHTML = ''; 

    tareas.forEach(tarea => {
        const nuevaFila = cuerpoTabla.insertRow();
        nuevaFila.insertCell().textContent = tarea.nombre;
        nuevaFila.insertCell().textContent = tarea.responsable;
        nuevaFila.insertCell().textContent = tarea.prioridad;
        
        // 1. Mostrar estado de verificación
        let estadoDisplay = tarea.estado;
        if (tarea.solicitudVerificacion && !tarea.verificado) {
            estadoDisplay += ' (PENDIENTE VERIF.)';
            nuevaFila.classList.add('alerta-verificacion'); // Opcional: para darle un estilo CSS de alerta
        } else if (tarea.verificado) {
            estadoDisplay += ' (VERIFICADA)';
        }

        const celdaEstado = nuevaFila.insertCell();
        const claseEstado = tarea.estado.toLowerCase().replace(/\s/g, '-');
        celdaEstado.innerHTML = `<span class="etiqueta estado-${claseEstado}">${estadoDisplay}</span>`;
        
        
        // 2. Lógica de Botones de Acción
        const celdaAccion = nuevaFila.insertCell();
        let botonAvanceHTML = '';
        let botonVerificarHTML = '';

        // Si la tarea ya está FINALMENTE verificada, desactivamos el botón
        if (tarea.verificado) {
            botonAvanceHTML = '<button disabled>Terminado</button>';
        } else {
            // Si no está verificada, el botón está activo
            botonAvanceHTML = `<button onclick="cambiarEstado('${tarea._id}', '${tarea.estado}')">Avance</button>`;
            
            // Si está concluida Y pendiente de verificación, mostramos el botón de Verificar
            if (tarea.estado === 'Concluido' && tarea.solicitudVerificacion) {
                botonVerificarHTML = `<button onclick="verificarTarea('${tarea._id}')" class="btn-verificar">VERIFICAR</button>`;
            }
        }
        
        celdaAccion.innerHTML = `
            ${botonAvanceHTML}
            ${botonVerificarHTML}
            <button onclick="eliminarTarea('${tarea._id}')" class="btn-eliminar">Eliminar</button>
        `;
    });
}

// INICIO: Carga los proyectos al iniciar la página
document.addEventListener('DOMContentLoaded', cargarProyectos);