// Importar funciones de Firestore
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  query
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- CONSTANTES Y ESTADO GLOBAL ---
const TASA_IGV = 1.18;
const FACTOR_DEPRECIACION_KM = 0.03;

// Estado temporal para el viaje que se está registrando
let serviciosTemporales = [];
let gastosTemporales = [];
let facturasTemporales = [];

// Estado global de la aplicación
let viajesDesdeDB = [];
let db;
let userId;

// --- INICIALIZACIÓN (Función principal exportada) ---
export async function initializeAndRunApp(firebaseInstances) {
    const loadingOverlay = document.getElementById('loading');

    // Desestructurar las instancias y funciones de Firebase
    const { auth, db: dbInstance, signInAnonymously, onAuthStateChanged, signInWithCustomToken } = firebaseInstances;
    db = dbInstance; // Asignar la instancia de la DB a la variable global

    try {
        // onAuthStateChanged escucha los cambios en el estado de la sesión.
        // Es la forma canónica de saber cuándo el usuario está autenticado.
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Si hay un usuario, la autenticación fue exitosa.
                console.log("Usuario autenticado con UID:", user.uid);
                userId = user.uid;
                document.getElementById('userId').textContent = userId;

                // Ahora que estamos autenticados, configuramos el resto de la app
                // Usamos un 'flag' para asegurarnos de que esto solo se ejecute una vez.
                if (!document.body.dataset.appInitialized) {
                    escucharCambiosEnViajes();
                    configurarEventListeners();
                    document.body.dataset.appInitialized = "true";
                }
                
                // Ocultar el overlay de carga y mostrar la app
                loadingOverlay.classList.add('hidden');
                document.getElementById('app-container').classList.remove('hidden');
                mostrarVista('registro');
            }
            // Si 'user' es null, el código de abajo intentará autenticarlo.
            // onAuthStateChanged se disparará de nuevo una vez que el login sea exitoso.
        });

        // Este bloque intenta realizar el login.
        // El listener onAuthStateChanged de arriba reaccionará al resultado de este bloque.
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (initialAuthToken) {
            console.log("Intentando iniciar sesión con token personalizado...");
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            console.log("Intentando iniciar sesión anónimamente...");
            await signInAnonymously(auth);
        }

    } catch (error) {
        console.error("Error crítico durante la autenticación:", error);
        loadingOverlay.innerHTML = `<p>No se pudo autenticar con la base de datos. Error: ${error.message}. Por favor, recargue.</p>`;
    }
}


// --- LÓGICA DE LA BASE DE DATOS (FIRESTORE) ---

function escucharCambiosEnViajes() {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const q = query(collection(db, `/artifacts/${appId}/public/data/viajes`));

    onSnapshot(q, (querySnapshot) => {
        viajesDesdeDB = [];
        querySnapshot.forEach((doc) => {
            viajesDesdeDB.push({ id: doc.id, ...doc.data() });
        });
        viajesDesdeDB.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        actualizarTablaReportes();
    }, (error) => {
        console.error("Error al obtener los viajes desde Firestore: ", error);
        alert(`No se pudo cargar los reportes. Error: ${error.message}.`);
    });
}

async function guardarViajeEnDB(viaje) {
    try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        await addDoc(collection(db, `/artifacts/${appId}/public/data/viajes`), viaje);
        console.log("Viaje guardado en Firestore.");
        return true;
    } catch (error) {
        console.error("Error al guardar el viaje: ", error);
        alert(`No se pudo guardar el viaje. Error: ${error.message}.`);
        return false;
    }
}

async function eliminarViajeDeDB(id) {
    if (confirm("¿Estás seguro de que quieres eliminar este viaje de la base de datos?")) {
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            await deleteDoc(doc(db, `/artifacts/${appId}/public/data/viajes`, id));
            console.log("Viaje eliminado correctamente.");
        } catch (error) {
            console.error("Error al eliminar el viaje: ", error);
            alert(`No se pudo eliminar el viaje. Error: ${error.message}.`);
        }
    }
}


// --- MANEJO DE VISTAS Y EVENTOS ---

function configurarEventListeners() {
    document.getElementById('btn-registro').addEventListener('click', () => mostrarVista('registro'));
    document.getElementById('btn-reportes').addEventListener('click', () => mostrarVista('reportes'));
    
    document.getElementById('btn-agregar-servicio').addEventListener('click', agregarServicio);
    document.getElementById('btn-agregar-gasto').addEventListener('click', agregarGasto);
    document.getElementById('btn-agregar-factura').addEventListener('click', agregarFactura);

    document.getElementById('btn-guardar-viaje').addEventListener('click', manejarGuardarViaje);
}

function mostrarVista(id) {
    ['registro', 'reportes'].forEach(vistaId => {
        document.getElementById(vistaId).classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}


// --- LÓGICA DE NEGOCIO (REGISTRO DE VIAJE) ---

function agregarServicio() {
    const s = {};
    const campos = ['cliente', 'orden', 'guia', 'fechaServicio', 'partida', 'llegada'];
    const nuevoNombre = { fechaServicio: 'fecha' };

    campos.forEach(k => {
        s[nuevoNombre[k] || k] = document.getElementById(k).value;
    });

    if(!s.cliente || !s.partida || !s.llegada) {
        alert("Por favor, complete al menos Cliente, Partida y Llegada del servicio.");
        return;
    }

    serviciosTemporales.push(s);
    actualizarTabla('tablaServicios', serviciosTemporales, ['cliente', 'orden', 'guia', 'fecha', 'partida', 'llegada'], (i) => eliminarItemTemporal(i, serviciosTemporales, 'tablaServicios', ['cliente', 'orden', 'guia', 'fecha', 'partida', 'llegada']));
    document.getElementById('formServicio').reset();
}

function agregarGasto() {
    const g = {
        tipo: document.getElementById('tipoGasto').value,
        comprobante: document.getElementById('comprobante').value,
        descripcion: document.getElementById('descGasto').value,
        cantidad: +document.getElementById('cantGasto').value,
        precioUnit: +document.getElementById('precioGasto').value
    };

    if(!g.tipo || g.cantidad <= 0 || g.precioUnit <= 0) {
        alert("Verifique los datos del gasto. La cantidad y el precio deben ser mayores a cero.");
        return;
    }

    g.total = +((g.comprobante === 'Factura' ? g.precioUnit / TASA_IGV : g.precioUnit) * g.cantidad).toFixed(2);
    gastosTemporales.push(g);
    actualizarTabla('tablaGastos', gastosTemporales, ['tipo', 'comprobante', 'descripcion', 'cantidad', 'precioUnit', 'total'], (i) => eliminarItemTemporal(i, gastosTemporales, 'tablaGastos', ['tipo', 'comprobante', 'descripcion', 'cantidad', 'precioUnit', 'total']));
    document.getElementById('formGasto').reset();
}

function agregarFactura() {
    const f = {
        factura: document.getElementById('factura').value,
        cantidad: +document.getElementById('facturaCantidad').value,
        um: document.getElementById('facturaUM').value,
        fleteSinIGV: +document.getElementById('facturaFlete').value
    };
    
    if(!f.factura || f.cantidad <= 0 || f.fleteSinIGV <= 0) {
        alert("Verifique los datos de la factura.");
        return;
    }

    f.fleteTotal = +(f.fleteSinIGV * f.cantidad).toFixed(2);
    facturasTemporales.push(f);
    actualizarTabla('tablaFacturas', facturasTemporales, ['factura', 'cantidad', 'um', 'fleteTotal'], (i) => eliminarItemTemporal(i, facturasTemporales, 'tablaFacturas', ['factura', 'cantidad', 'um', 'fleteTotal']));
    document.getElementById('formFactura').reset();
}

function eliminarItemTemporal(index, array, tablaId, campos) {
    array.splice(index, 1);
    actualizarTabla(tablaId, array, campos, (i) => eliminarItemTemporal(i, array, tablaId, campos));
}


async function manejarGuardarViaje() {
    const fecha = document.getElementById('fecha').value;
    const placa1 = document.getElementById('placa1').value;
    const kmInicio = +document.getElementById('kmInicio').value;
    const kmFin = +document.getElementById('kmFin').value;

    if (!fecha || !placa1 || !kmInicio || !kmFin) {
        alert("Por favor, complete todos los campos principales del viaje.");
        return;
    }
    if (kmFin < kmInicio) {
        alert("El 'KM Fin' no puede ser menor que el 'KM Inicio'.");
        return;
    }
    if (facturasTemporales.length === 0) {
        alert("Debe agregar al menos una factura.");
        return;
    }

    const kmRecorridos = kmFin - kmInicio;
    const depreciacion = +(kmRecorridos * FACTOR_DEPRECIACION_KM).toFixed(2);
    const ingresoTotal = facturasTemporales.reduce((acc, f) => acc + f.fleteTotal, 0);
    const gastoTotal = gastosTemporales.reduce((acc, g) => acc + g.total, 0) + depreciacion;
    const utilidad = ingresoTotal - gastoTotal;
    const rentabilidad = ingresoTotal ? +(utilidad / ingresoTotal * 100).toFixed(2) : 0;

    const nuevoViaje = {
        creadoPor: userId,
        fecha,
        placa1,
        placa2: document.getElementById('placa2').value,
        kmRecorridos,
        ingreso: ingresoTotal,
        gasto: gastoTotal,
        utilidad,
        rentabilidad,
        detalles: {
            servicios: serviciosTemporales,
            gastos: gastosTemporales,
            facturas: facturasTemporales,
            depreciacion
        }
    };
    
    const guardadoExitoso = await guardarViajeEnDB(nuevoViaje);

    if (guardadoExitoso) {
        serviciosTemporales = [];
        gastosTemporales = [];
        facturasTemporales = [];
        
        ['formViaje', 'formServicio', 'formGasto', 'formFactura'].forEach(formId => document.getElementById(formId).reset());
        ['tablaServicios', 'tablaGastos', 'tablaFacturas'].forEach(tablaId => document.getElementById(tablaId).querySelector('tbody').innerHTML = '');
        
        alert("¡Viaje guardado exitosamente en la base de datos!");
        mostrarVista('reportes');
    }
}


// --- ACTUALIZACIÓN DE LA INTERFAZ (UI) ---

function actualizarTabla(tablaId, array, campos, eliminarFn) {
    const tbody = document.getElementById(tablaId).querySelector('tbody');
    tbody.innerHTML = '';
    array.forEach((item, index) => {
        const tr = document.createElement('tr');
        campos.forEach(campo => {
            const td = document.createElement('td');
            td.textContent = typeof item[campo] === 'number' && campo !== 'cantidad' ? item[campo].toFixed(2) : item[campo];
            tr.appendChild(td);
        });
        const tdAcciones = document.createElement('td');
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.className = 'btn-eliminar';
        btnEliminar.onclick = () => eliminarFn(index);
        tdAcciones.appendChild(btnEliminar);
        tr.appendChild(tdAcciones);
        tbody.appendChild(tr);
    });
}

function actualizarTablaReportes() {
    const tbody = document.getElementById('tablaReportes').querySelector('tbody');
    tbody.innerHTML = '';
    viajesDesdeDB.forEach((viaje, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${viaje.fecha}</td>
            <td>${viaje.placa1}</td>
            <td>S/ ${viaje.ingreso.toFixed(2)}</td>
            <td>S/ ${viaje.gasto.toFixed(2)}</td>
            <td>S/ ${viaje.utilidad.toFixed(2)}</td>
            <td>${viaje.rentabilidad.toFixed(2)} %</td>
        `;
        const tdAcciones = document.createElement('td');
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.className = 'btn-eliminar';
        btnEliminar.onclick = () => eliminarViajeDeDB(viaje.id);
        tdAcciones.appendChild(btnEliminar);
        tr.appendChild(tdAcciones);
        tbody.appendChild(tr);
    });
}
