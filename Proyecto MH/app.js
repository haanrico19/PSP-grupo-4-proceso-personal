const STORAGE_KEY = 'stockingData';
const LOW_STOCK_THRESHOLD = 10;

// Estado de la aplicación
let appState = null;
let listaDestinoActual = null;

// 📊 Referencia a la gráfica de productos
let productsChart = null;

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeApp();
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showNotification('Error al cargar la aplicación', 'error');
    }
});

async function initializeApp() {
    initBoard();
    appState = loadState();
    applyStateToBoard(appState);

    // 📊 Inicializar gráfica con el estado actual
    initCharts();

    await initSearchSection();
    initEvents();
    refreshSearch();
    showInventoryView();
}

// ---------- Gestión del Estado ----------
function getDefaultState() {
    return {
        inventoryName: 'Mi Inventario',
        categories: ['Categoría 1', 'Categoría 2', 'Categoría 3', 'Categoría 4', 'Categoría 5'],
        columns: [[], [], [], [], []]
    };
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return getDefaultState();

        const raw = JSON.parse(saved);
        
        // Normalizar estructura de datos
        return {
            inventoryName: raw.inventoryName || getDefaultState().inventoryName,
            categories: raw.categories || raw.categorias || getDefaultState().categories,
            columns: normalizeColumns(raw.columns || raw.columnas || getDefaultState().columns)
        };
    } catch (error) {
        console.error('Error cargando datos guardados:', error);
        showNotification('Error cargando datos guardados', 'error');
        return getDefaultState();
    }
}

function normalizeColumns(columns) {
    // Asegurar que siempre hay 5 columnas
    const normalized = Array(5).fill().map((_, i) => columns[i] || []);
    
    // Normalizar items
    return normalized.map(col => {
        if (!Array.isArray(col)) return [];
        return col.map(item => {
            if (typeof item === 'string') {
                return {
                    nombre: item,
                    descripcion: '',
                    cantidad: 1,
                };
            }
            
            return {
                nombre: (item.nombre || item.name || '').toString(),
                descripcion: (item.descripcion || item.description || '').toString(),
                cantidad: Math.max(1, Number(item.cantidad ?? item.quantity ?? 1))
            };
        });
    });
}

function showInventoryView() {
    const inventorySection = document.getElementById('inventario-section');
    const searchSection = document.getElementById('busqueda-root');
    const chartsSection = document.getElementById('graficas-section');

    if (inventorySection) inventorySection.style.display = 'block';
    if (searchSection) searchSection.style.display = 'none';
    if (chartsSection) chartsSection.style.display = 'none';

    const btnInventario = document.getElementById('btn-ver-inventario');
    const btnBusqueda = document.getElementById('btn-ver-busqueda');
    const btnGraficas = document.getElementById('btn-ver-graficas');

    if (btnInventario) btnInventario.classList.add('active');
    if (btnBusqueda) btnBusqueda.classList.remove('active');
    if (btnGraficas) btnGraficas.classList.remove('active');
}

function showSearchView() {
    const inventorySection = document.getElementById('inventario-section');
    const searchSection = document.getElementById('busqueda-root');
    const chartsSection = document.getElementById('graficas-section');

    if (inventorySection) inventorySection.style.display = 'none';
    if (searchSection) searchSection.style.display = 'block';
    if (chartsSection) chartsSection.style.display = 'none';

    const btnInventario = document.getElementById('btn-ver-inventario');
    const btnBusqueda = document.getElementById('btn-ver-busqueda');
    const btnGraficas = document.getElementById('btn-ver-graficas');

    if (btnInventario) btnInventario.classList.remove('active');
    if (btnBusqueda) btnBusqueda.classList.add('active');
    if (btnGraficas) btnGraficas.classList.remove('active');
}

function showChartsView() {
    const inventorySection = document.getElementById('inventario-section');
    const searchSection = document.getElementById('busqueda-root');
    const chartsSection = document.getElementById('graficas-section');

    if (inventorySection) inventorySection.style.display = 'none';
    if (searchSection) searchSection.style.display = 'none';
    if (chartsSection) chartsSection.style.display = 'block';

    const btnInventario = document.getElementById('btn-ver-inventario');
    const btnBusqueda = document.getElementById('btn-ver-busqueda');
    const btnGraficas = document.getElementById('btn-ver-graficas');

    if (btnInventario) btnInventario.classList.remove('active');
    if (btnBusqueda) btnBusqueda.classList.remove('active');
    if (btnGraficas) btnGraficas.classList.add('active');
}

function saveState() {
    try {
        appState = getStateFromDOM();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

        // 📊 Actualizar gráfica cuando cambia el inventario
        updateCharts();

        showNotification('Cambios guardados', 'success');
    } catch (error) {
        console.error('Error guardando estado:', error);
        showNotification('Error guardando cambios', 'error');
    }
}

function getStateFromDOM() {
    const inventoryName = 'Mi Inventario';
    
    const categories = Array.from(document.querySelectorAll('.categoria'))
        .map(c => c.textContent.trim());
    
    const columns = Array.from(document.querySelectorAll('.columna')).map(col => {
        const items = Array.from(col.querySelectorAll('.item')).map(item => ({
            nombre: (item.dataset.nombre || item.textContent || '').trim(),
            descripcion: (item.dataset.descripcion || '').trim(),
            cantidad: Math.max(1, Number(item.dataset.cantidad || '1'))
        }));
        return items;
    });

    return { inventoryName, categories, columns };
}

// ---------- Inicialización de UI ----------
function initBoard() {
    const columnasContainer = document.getElementById('columnas');
    if (!columnasContainer) return;

    columnasContainer.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const col = document.createElement('div');
        col.className = 'columna';
        col.innerHTML = `
            <div class="columna-header">
                <h3 class="categoria cursor-pointer hover:text-blue-600 transition-colors">Categoría ${i + 1}</h3>
            </div>
            <div class="items-container"></div>
            <button class="btn-agregar">
                <span>+</span> Agregar Producto
            </button>
        `;
        
        columnasContainer.appendChild(col);
    }
}

async function initSearchSection() {
    const contenedorBusqueda = document.getElementById('busqueda-root');
    if (!contenedorBusqueda) return;

    try {
        const resp = await fetch('busqueda.html');
        if (resp.ok) {
            contenedorBusqueda.innerHTML = await resp.text();
        } else {
            // Fallback si no existe busqueda.html
            contenedorBusqueda.innerHTML = createSearchFallbackHTML();
        }
    } catch (error) {
        console.error('Error cargando sección de búsqueda:', error);
        contenedorBusqueda.innerHTML = createSearchFallbackHTML();
    }
}

function createSearchFallbackHTML() {
    return `
        <section class="max-w-6xl mx-auto mt-12 px-4">
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Buscar en Inventario</h2>
                <div class="flex flex-col sm:flex-row gap-2">
                    <input type="text" id="searchInput" placeholder="Buscar productos..." 
                           class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <div class="flex gap-2">
                        <button id="searchButton" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            🔍 Buscar
                        </button>
                    </div>
                </div>
            </div>
            <div id="resultsContainer"></div>
        </section>
    `;
}

// ---------- Gestión de Eventos ----------
function initEvents() {
    // Eventos del sidebar
    const sidebar = document.getElementById('sidebar-inventory-name');
    if (sidebar) {
        sidebar.addEventListener('click', editarInventarioNombre);
    }

    // 🔀 Eventos de cambio de vista
   const btnVerInventario = document.getElementById('btn-ver-inventario');
    const btnVerBusqueda = document.getElementById('btn-ver-busqueda');
    const btnVerGraficas = document.getElementById('btn-ver-graficas');

    if (btnVerInventario) {
        btnVerInventario.addEventListener('click', showInventoryView);
    }
    if (btnVerBusqueda) {
        btnVerBusqueda.addEventListener('click', showSearchView);
    }
    if (btnVerGraficas) {
        btnVerGraficas.addEventListener('click', showChartsView);
    }

    // Eventos de categorías
    document.querySelectorAll('.categoria').forEach(cat => {
        cat.addEventListener('click', () => editarTitulo(cat));
    });

    // Eventos de botones agregar en columnas
    document.querySelectorAll('.btn-agregar').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const columna = btn.closest('.columna');
            const lista = columna.querySelector('.items-container');
            agregarItem(lista);
        });
    });

    // Eventos de items (delegación)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('item')) {
            manejarClickItem(e.target);
        }
    });

    // Eventos del modal
    initModalEvents();
    
    // Eventos de búsqueda
    initSearchEvents();
}

function initModalEvents() {
    const btnCancelar = document.getElementById('modal-cancelar');
    const btnGuardar = document.getElementById('modal-guardar');

    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarModalAgregarItem);
    }
    if (btnGuardar) {
        btnGuardar.addEventListener('click', handleGuardarProducto);
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalAgregarItem();
        }
    });
}

function initSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const btnAbrirModal = document.getElementById('btn-agregar-item');

    if (searchInput) {
        // Búsqueda en tiempo real con debounce
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(handleSearch, 300);
        });
        
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', abrirModal);
    }
}

// ---------- Funciones del Tablero ----------
function editarInventarioNombre() {
    const span = document.getElementById('inventarioNombre');
    const nuevo = prompt('Nuevo nombre del inventario:', span.textContent);
    
    if (nuevo && nuevo.trim()) {
        span.textContent = nuevo.trim();
        saveState();
    }
}

function editarTitulo(elemento) {
    const nuevo = prompt('Nuevo nombre de categoría:', elemento.textContent);
    if (nuevo && nuevo.trim()) {
        elemento.textContent = nuevo.trim();
        saveState();
    }
}

function manejarClickItem(item) {
    const acciones = `
¿Qué quieres hacer con "${item.dataset.nombre}"?
1. Editar
2. Eliminar
3. Mover a otra columna
    `.trim();

    const opcion = prompt(acciones + "\n\nEscribe el número de la opción:");
    
    switch (opcion) {
        case '1':
            editarItem(item);
            break;
        case '2':
            eliminarItem(item);
            break;
        case '3':
            moverItem(item);
            break;
        default:
            // No hacer nada si se cancela
            break;
    }
}

function editarItem(item) {
    const nombreActual = item.dataset.nombre;
    const descripcionActual = item.dataset.descripcion;
    const cantidadActual = item.dataset.cantidad;

    const nuevoNombre = prompt('Nuevo nombre:', nombreActual) || nombreActual;
    const nuevaDescripcion = prompt('Nueva descripción:', descripcionActual) || descripcionActual;
    const nuevaCantidad = parseInt(prompt('Nueva cantidad:', cantidadActual)) || 1;

    if (nuevaCantidad <= 0) {
        showNotification('La cantidad debe ser mayor a 0', 'error');
        return;
    }

    // Actualizar datos
    item.dataset.nombre = nuevoNombre.trim();
    item.dataset.descripcion = nuevaDescripcion.trim();
    item.dataset.cantidad = String(nuevaCantidad);
    
    // Actualizar visual
    item.textContent = `${nuevoNombre.trim()} (x${nuevaCantidad})`;
    
    saveState();
    refreshSearch();
    showNotification('Producto actualizado', 'success');
}

function eliminarItem(item) {
    const confirmacion = confirm(`¿Estás seguro de que quieres eliminar "${item.dataset.nombre}"?`);
    if (confirmacion) {
        item.remove();
        saveState();
        refreshSearch();
        showNotification('Producto eliminado', 'success');
    }
}

function moverItem(item) {
    const columnaDestino = prompt(
        '¿A qué columna quieres moverlo? (1-5):'
    );
    
    const destinoIndex = parseInt(columnaDestino) - 1;
    
    if (destinoIndex >= 0 && destinoIndex < 5) {
        const columnas = document.querySelectorAll('.columna');
        const listaDestino = columnas[destinoIndex].querySelector('.items-container');
        
        if (listaDestino) {
            listaDestino.appendChild(item);
            saveState();
            refreshSearch();
            showNotification('Producto movido', 'success');
        }
    } else {
        showNotification('Número de columna inválido', 'error');
    }
}

// ---------- Gestión del Modal ----------
function abrirModal(lista = null) {
    listaDestinoActual = lista;
    
    // Limpiar campos
    document.getElementById('modal-nombre').value = '';
    document.getElementById('modal-descripcion').value = '';
    document.getElementById('modal-cantidad').value = '1';

    // Mostrar modal
    document.getElementById('modal-agregar-item').classList.remove('oculto');
    document.getElementById('modal-nombre').focus();
}

function cerrarModalAgregarItem() {
    document.getElementById('modal-agregar-item').classList.add('oculto');
    listaDestinoActual = null;
}

function agregarItem(lista) {
    abrirModal(lista);
}

function handleGuardarProducto() {
    const nombreInput = document.getElementById('modal-nombre');
    const descripcionInput = document.getElementById('modal-descripcion');
    const cantidadInput = document.getElementById('modal-cantidad');

    if (!nombreInput || !descripcionInput || !cantidadInput) return;

    const nombre = nombreInput.value.trim();
    const descripcion = descripcionInput.value.trim();
    const cantidad = parseInt(cantidadInput.value, 10) || 1;

    // Validaciones
    if (!nombre) {
        showNotification('El nombre del producto es obligatorio', 'error');
        nombreInput.focus();
        return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
        showNotification('La cantidad debe ser un número mayor a 0', 'error');
        cantidadInput.focus();
        return;
    }

    if (listaDestinoActual) {
        // Agregar a columna específica
        crearItemEnLista(nombre, descripcion, cantidad, listaDestinoActual);
    } else {
        // Agregar desde el buscador - preguntar a qué columna
        const columnaIndex = prompt('¿A qué columna quieres agregarlo? (1-5):');
        const index = parseInt(columnaIndex) - 1;
        
        if (index >= 0 && index < 5) {
            const columnas = document.querySelectorAll('.columna');
            const listaDestino = columnas[index].querySelector('.items-container');
            
            if (listaDestino) {
                crearItemEnLista(nombre, descripcion, cantidad, listaDestino);
            } else {
                showNotification('Columna no encontrada', 'error');
            }
        } else {
            showNotification('Número de columna inválido', 'error');
            return;
        }
    }

    cerrarModalAgregarItem();
}

function crearItemEnLista(nombre, descripcion, cantidad, lista) {
    const item = document.createElement('div');
    item.className = 'item cursor-pointer hover:bg-gray-50 transition-colors';
    
    item.dataset.nombre = nombre;
    item.dataset.descripcion = descripcion;
    item.dataset.cantidad = String(cantidad);

    item.textContent = `${nombre} (x${cantidad})`;
    
    // Tooltip con descripción si existe
    if (descripcion) {
        item.title = descripcion;
    }

    lista.appendChild(item);
    saveState();
    refreshSearch();
    showNotification('Producto agregado', 'success');
}

// ---------- Búsqueda y Resultados ----------
function getInventoryFromState(state) {
    const items = [];

    state.columns.forEach((colItems, colIndex) => {
        if (!Array.isArray(colItems)) return;

        colItems.forEach(data => {
            if (!data || !data.nombre || !data.nombre.trim()) return;

            const nombre = data.nombre.trim();
            const descripcion = (data.descripcion || '').trim();
            const cantidad = Math.max(1, Number(data.cantidad || 1));

            items.push({
                id: items.length + 1,
                nombre,
                sku: '',
                cantidad,
                ubicacion: `Columna ${colIndex + 1}`,
                categoria: state.categories[colIndex] || `Categoría ${colIndex + 1}`,
                descripcion,
            });
        });
    });

    return items;
}

// 📊 Agrupa cantidades por nombre de producto
function getAggregatedProducts(state) {
    const result = {
        labels: [],
        data: []
    };

    if (!state || !Array.isArray(state.columns)) return result;

    const totals = new Map();

    state.columns.forEach(colItems => {
        if (!Array.isArray(colItems)) return;

        colItems.forEach(item => {
            if (!item || !item.nombre) return;

            const name = item.nombre.trim();
            if (!name) return;

            const qty = Math.max(1, Number(item.cantidad || 1));
            totals.set(name, (totals.get(name) || 0) + qty);
        });
    });

    totals.forEach((value, key) => {
        result.labels.push(key);
        result.data.push(value);
    });

    return result;
}

// 📊 Inicializa la gráfica
function initCharts() {
    const canvas = document.getElementById('productosChart');
    if (!canvas) return;

    // Si Chart.js no está definido, no hacemos nada
    if (typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    const { labels, data } = getAggregatedProducts(appState);

    productsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Cantidad por producto',
                    data
                    // Dejo que Chart.js use sus colores por defecto
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                },
            },
        },
    });
}

// 📊 Actualiza la gráfica cuando cambia el inventario
function updateCharts() {
    const canvas = document.getElementById('productosChart');
    if (!canvas) return;
    if (typeof Chart === 'undefined') return;

    // Si aún no existe la gráfica, la creamos
    if (!productsChart) {
        initCharts();
        return;
    }

    const { labels, data } = getAggregatedProducts(appState);

    productsChart.data.labels = labels;
    productsChart.data.datasets[0].data = data;
    productsChart.update();
}

function renderResults(items) {
    const container = document.getElementById('resultsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center p-10 bg-gray-100 rounded-lg border border-gray-200">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 class="mt-2 text-lg font-semibold text-gray-900">Artículo no encontrado</h3>
                <p class="mt-1 text-sm text-gray-500">No hay elementos que coincidan con tu criterio de búsqueda.</p>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const stockClass = item.cantidad < LOW_STOCK_THRESHOLD ? 'low-stock' : 'normal-stock';
        const stockText = item.cantidad < LOW_STOCK_THRESHOLD ? '¡Stock Bajo!' : 'En Stock';
        const stockIcon = item.cantidad < LOW_STOCK_THRESHOLD ? '⚠️' : '✅';

        const resultCard = document.createElement('div');
        resultCard.className = 'p-5 border border-gray-200 rounded-xl bg-white shadow-md hover:shadow-lg transition duration-200 flex flex-col sm:flex-row justify-between';

        resultCard.innerHTML = `
            <div class="sm:w-3/4 mb-4 sm:mb-0">
                <h2 class="text-xl font-bold text-gray-800">${item.nombre}</h2>
                <p class="text-sm text-gray-500 mt-1">
                    SKU: <span class="font-mono text-xs text-indigo-600">${item.sku || 'N/A'}</span>
                </p>
                <p class="mt-2 text-gray-700">${item.descripcion || 'Sin descripción.'}</p>
                <div class="mt-3 flex flex-wrap gap-2 text-sm">
                    <span class="bg-indigo-100 text-indigo-700 font-medium px-3 py-1 rounded-full">
                        ${item.categoria}
                    </span>
                    <span class="bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full">
                        ${item.ubicacion}
                    </span>
                </div>
            </div>
            <div class="sm:w-1/4 sm:text-right flex flex-col items-start sm:items-end justify-center">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${stockIcon}</span>
                    <p class="text-4xl font-extrabold ${stockClass}">
                        ${item.cantidad}
                    </p>
                </div>
                <p class="text-xs font-semibold ${stockClass} mt-1">
                    ${stockText}
                </p>
                <p class="text-sm text-gray-600 mt-2">
                    ${item.ubicacion}
                </p>
            </div>
        `;

        container.appendChild(resultCard);
    });
}

function handleSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    const query = input.value.trim().toLowerCase();
    const inventoryItems = getInventoryFromState(appState);

    if (query === '') {
        renderResults(inventoryItems);
        return;
    }

    const filteredItems = inventoryItems.filter(item => {
        const searchableText = `
            ${item.nombre}
            ${item.sku}
            ${item.ubicacion}
            ${item.categoria}
            ${item.descripcion}
        `.toLowerCase();

        return searchableText.includes(query);
    });

    renderResults(filteredItems);
}

function refreshSearch() {
    const inventoryItems = getInventoryFromState(appState);
    renderResults(inventoryItems);
}

// ---------- Utilidades ----------
function showNotification(message, type = 'info') {
    // Eliminar notificación anterior si existe
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'success' ? 'bg-green-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remover después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Aplicar estado al DOM
function applyStateToBoard(state) {
    // Inventario
    const inventarioNombre = document.getElementById('inventarioNombre');
    if (inventarioNombre) {
        inventarioNombre.textContent = state.inventoryName;
    }

    // Categorías
    const categoriaElements = document.querySelectorAll('.categoria');
    state.categories.forEach((texto, i) => {
        if (categoriaElements[i]) {
            categoriaElements[i].textContent = texto;
        }
    });

    // Columnas
    const columnaElements = document.querySelectorAll('.columna');
    state.columns.forEach((items, i) => {
        const col = columnaElements[i];
        if (!col) return;

        const lista = col.querySelector('.items-container');
        if (!lista) return;

        lista.innerHTML = '';

        items.forEach(data => {
            const item = document.createElement('div');
            item.className = 'item cursor-pointer hover:bg-gray-50 transition-colors';

            const nombre = (data.nombre || '').trim();
            const descripcion = (data.descripcion || '').trim();
            const cantidad = Math.max(1, Number(data.cantidad || 1));

            item.dataset.nombre = nombre;
            item.dataset.descripcion = descripcion;
            item.dataset.cantidad = String(cantidad);

            item.textContent = `${nombre} (x${cantidad})`;
            
            // Tooltip con descripción si existe
            if (descripcion) {
                item.title = descripcion;
            }

            lista.appendChild(item);
        });
    });
}
