/* ============================
   Lógica principal - carneconcuero
   ============================ */

   const App = (() => {
    // ⚠️ EDITAR ACÁ: número de WhatsApp del negocio (con código de país, sin +, sin espacios)
    const TELEFONO_WHATSAPP = '5491161075378';
  
    // Mensaje pre-armado del botón "Consultas" del header
    const MENSAJE_CONSULTA = 'Hola, quería hacer una consulta';
  
    let productos = [];
    let filtroActual = '';
  
    // Formatear precio en pesos argentinos
    function formatearPrecio(valor) {
      return '$' + Math.round(valor).toLocaleString('es-AR');
    }
  
    // Devuelve true si el producto se vende por kilo
    function esPorKilo(prod) {
      return prod.tipoVenta === 'kilo';
    }
  
    // Cargar productos desde el JSON
    async function cargarProductos() {
      try {
        const respuesta = await fetch('data/productos.json');
        if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo');
        productos = await respuesta.json();
        renderizarCatalogo();
      } catch (error) {
        console.error('Error cargando productos:', error);
        const contenedor = document.getElementById('catalogo');
        if (contenedor) {
          contenedor.innerHTML =
            '<p class="col-span-full text-center text-red-600 py-8">Error al cargar el catálogo. Intentá recargar la página.</p>';
        }
      }
    }
  
    // Normaliza texto para búsqueda (minúsculas, sin acentos)
    function normalizar(texto) {
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }
  
    // Devuelve los productos que coinciden con el filtro actual
    function productosFiltrados() {
      if (!filtroActual) return productos;
      const f = normalizar(filtroActual);
      return productos.filter((p) => normalizar(p.nombre).includes(f));
    }
  
    // Obtiene la cantidad en el carrito de un producto por id
    function cantidadEnCarrito(id) {
      const item = Cart.obtenerItems().find((i) => i.id === id);
      return item ? item.cantidad : 0;
    }
  
    // Genera el HTML del control de cantidad
    function htmlControlCantidad(prod) {
      const cantidad = cantidadEnCarrito(prod.id);
  
      if (cantidad === 0) {
        return `
          <button
            class="btn-primario w-full mt-auto"
            data-agregar="${prod.id}"
          >
            Agregar al carrito
          </button>
        `;
      }
  
      return `
        <div
          class="w-full mt-auto rounded-lg flex items-center justify-between px-2"
          style="background-color: var(--color-petroleo); height: 46px;"
          data-control="${prod.id}"
        >
          <button
            class="flex items-center justify-center w-9 h-9 rounded-md text-white font-bold text-xl"
            style="background-color: rgba(255,255,255,0.15);"
            data-restar-tarjeta="${prod.id}"
            aria-label="Restar unidad"
          >−</button>
          <span class="text-white font-bold text-lg" data-cantidad-tarjeta="${prod.id}">${cantidad}</span>
          <button
            class="flex items-center justify-center w-9 h-9 rounded-md text-white font-bold text-xl"
            style="background-color: rgba(255,255,255,0.15);"
            data-sumar-tarjeta="${prod.id}"
            aria-label="Sumar unidad"
          >+</button>
        </div>
      `;
    }
  
    // Genera el bloque de precio según tipo de venta
    function htmlBloquePrecio(prod) {
      if (esPorKilo(prod)) {
        const precioUnitario = Math.round(prod.precioKilo * prod.pesoAproxKg);
        return `
          <div class="precio-kg-destacado">
            <span class="precio-kg-valor">${formatearPrecio(prod.precioKilo)}</span>
            <span class="precio-kg-unidad">/ kg</span>
          </div>
          <p class="precio-estimado-pieza">
            Precio estimado por pieza (~${prod.pesoAproxKg.toFixed(1)} kg): ${formatearPrecio(precioUnitario)}
          </p>
        `;
      }
      return `
        <div class="precio-kg-destacado">
          <span class="precio-kg-valor">${formatearPrecio(prod.precioUnidad)}</span>
          <span class="precio-kg-unidad">/ unidad</span>
        </div>
        <p class="precio-estimado-pieza">
          Precio fijo por unidad
        </p>
      `;
    }
  
    // Genera el badge (peso si es por kilo, nada si es por unidad)
    function htmlBadge(prod) {
      if (esPorKilo(prod)) {
        return `<span class="badge-peso">~${prod.pesoAproxKg.toFixed(1)} kg</span>`;
      }
      return '';
    }
  
    // Renderizar las tarjetas de producto
    function renderizarCatalogo() {
      const contenedor = document.getElementById('catalogo');
      if (!contenedor) return;
  
      contenedor.innerHTML = '';
  
      const lista = productosFiltrados();
  
      if (lista.length === 0) {
        contenedor.innerHTML =
          '<div class="sin-resultados">No encontramos cortes con ese nombre. Probá con otra palabra.</div>';
        return;
      }
  
      lista.forEach((prod) => {
        const card = document.createElement('div');
        card.className =
          'card-producto rounded-lg overflow-hidden shadow-md flex flex-col';
  
        card.innerHTML = `
          <div class="relative">
            <img
              src="${prod.imagen}"
              alt="${prod.nombre}"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div class="img-placeholder" style="display:none;">Sin foto</div>
          </div>
          <div class="p-4 flex flex-col flex-grow">
            <div class="flex items-start justify-between gap-2 mb-1">
              <h3 class="nombre-corte">${prod.nombre}</h3>
              ${htmlBadge(prod)}
            </div>
            <p class="descripcion mb-4 flex-grow">${prod.descripcion}</p>
  
            <div class="mb-4">
              ${htmlBloquePrecio(prod)}
            </div>
  
            <div data-zona-control="${prod.id}">
              ${htmlControlCantidad(prod)}
            </div>
          </div>
        `;
  
        contenedor.appendChild(card);
      });
  
      // Delegación de eventos inicial
      contenedor.querySelectorAll('[data-agregar]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-agregar');
          const producto = productos.find((p) => p.id === id);
          if (producto) {
            Cart.agregar(producto);
            actualizarContador();
            renderizarCarrito();
            actualizarControlTarjeta(id);
          }
        });
      });
  
      contenedor.querySelectorAll('[data-sumar-tarjeta]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-sumar-tarjeta');
          const producto = productos.find((p) => p.id === id);
          if (producto) {
            Cart.agregar(producto);
            actualizarContador();
            renderizarCarrito();
            actualizarControlTarjeta(id);
          }
        });
      });
  
      contenedor.querySelectorAll('[data-restar-tarjeta]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-restar-tarjeta');
          Cart.quitar(id);
          actualizarContador();
          renderizarCarrito();
          actualizarControlTarjeta(id);
        });
      });
    }
  
    // Actualiza solo el bloque de control de una tarjeta
    function actualizarControlTarjeta(id) {
      const zona = document.querySelector(`[data-zona-control="${id}"]`);
      if (!zona) return;
      const producto = productos.find((p) => p.id === id);
      if (!producto) return;
  
      zona.innerHTML = htmlControlCantidad(producto);
  
      const btnAgregar = zona.querySelector('[data-agregar]');
      if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
          const prodId = btnAgregar.getAttribute('data-agregar');
          const prod = productos.find((p) => p.id === prodId);
          if (prod) {
            Cart.agregar(prod);
            actualizarContador();
            renderizarCarrito();
            actualizarControlTarjeta(prodId);
          }
        });
      }
  
      const btnSumar = zona.querySelector('[data-sumar-tarjeta]');
      if (btnSumar) {
        btnSumar.addEventListener('click', () => {
          const prodId = btnSumar.getAttribute('data-sumar-tarjeta');
          const prod = productos.find((p) => p.id === prodId);
          if (prod) {
            Cart.agregar(prod);
            actualizarContador();
            renderizarCarrito();
            actualizarControlTarjeta(prodId);
          }
        });
      }
  
      const btnRestar = zona.querySelector('[data-restar-tarjeta]');
      if (btnRestar) {
        btnRestar.addEventListener('click', () => {
          const prodId = btnRestar.getAttribute('data-restar-tarjeta');
          Cart.quitar(prodId);
          actualizarContador();
          renderizarCarrito();
          actualizarControlTarjeta(prodId);
        });
      }
    }
  
    // Refresca todos los controles de tarjeta
    function actualizarTodosLosControles() {
      productos.forEach((p) => {
        const zona = document.querySelector(`[data-zona-control="${p.id}"]`);
        if (zona) {
          actualizarControlTarjeta(p.id);
        }
      });
    }
  
    // Actualizar contador del header
    function actualizarContador() {
      const contador = document.getElementById('contador-carrito');
      if (!contador) return;
      const total = Cart.totalUnidades();
      if (total > 0) {
        contador.textContent = total;
        contador.classList.remove('oculto');
      } else {
        contador.classList.add('oculto');
      }
    }
  
    // Renderizar contenido del carrito en el modal
    function renderizarCarrito() {
      const contenedor = document.getElementById('carrito-items');
      const totalEl = document.getElementById('carrito-total');
      const pesoEl = document.getElementById('carrito-peso');
      const btnCheckout = document.getElementById('btn-checkout');
  
      if (!contenedor) return;
  
      const items = Cart.obtenerItems();
  
      if (items.length === 0) {
        contenedor.innerHTML = `
          <div class="carrito-vacio">
            <p class="text-lg font-semibold mb-1">Tu carrito está vacío</p>
            <p class="texto-secundario">Agregá cortes desde el catálogo.</p>
          </div>
        `;
        if (totalEl) totalEl.textContent = '$0';
        if (pesoEl) pesoEl.textContent = '~0.00 kg';
        if (btnCheckout) btnCheckout.disabled = true;
        return;
      }
  
      contenedor.innerHTML = '';
  
      items.forEach((item) => {
        const esKilo = item.tipoVenta === 'kilo';
        const lineaSubtotal = esKilo
          ? `<p class="text-sm font-semibold mt-1" style="color: var(--color-rojo);">
              ${Cart.formatearPrecio(Cart.subtotalItem(item))} <span style="color:#9ca3af; font-weight:400;">(estimado)</span>
            </p>`
          : `<p class="text-sm font-semibold mt-1" style="color: var(--color-rojo);">
              ${Cart.formatearPrecio(Cart.subtotalItem(item))}
            </p>`;
  
        const lineaDetalle = esKilo
          ? `${Cart.formatearPrecio(item.precioKilo)}/kg · ~${item.pesoAproxKg.toFixed(1)} kg por pieza`
          : `${Cart.formatearPrecio(item.precioUnidad)} por unidad`;
  
        const fila = document.createElement('div');
        fila.className = 'fila-carrito';
        fila.innerHTML = `
          <div class="flex-grow">
            <p class="font-semibold" style="color: var(--color-petroleo);">${item.nombre}</p>
            <p class="texto-secundario">
              ${lineaDetalle}
            </p>
            ${lineaSubtotal}
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-cantidad" data-quitar="${item.id}">−</button>
            <span class="w-6 text-center font-bold">${item.cantidad}</span>
            <button class="btn-cantidad" data-sumar="${item.id}">+</button>
          </div>
          <button class="btn-eliminar-item ml-2" data-eliminar="${item.id}">✕</button>
        `;
        contenedor.appendChild(fila);
      });
  
      contenedor.querySelectorAll('[data-sumar]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-sumar');
          const item = Cart.obtenerItems().find((i) => i.id === id);
          if (item) {
            Cart.agregar(item);
            actualizarContador();
            renderizarCarrito();
            actualizarControlTarjeta(id);
          }
        });
      });
  
      contenedor.querySelectorAll('[data-quitar]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-quitar');
          Cart.quitar(id);
          actualizarContador();
          renderizarCarrito();
          actualizarControlTarjeta(id);
        });
      });
  
      contenedor.querySelectorAll('[data-eliminar]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-eliminar');
          Cart.eliminar(id);
          actualizarContador();
          renderizarCarrito();
          actualizarControlTarjeta(id);
        });
      });
  
      if (totalEl) totalEl.textContent = Cart.formatearPrecio(Cart.totalEstimado());
      if (pesoEl) pesoEl.textContent = '~' + Cart.pesoTotalEstimado().toFixed(2) + ' kg';
      if (btnCheckout) btnCheckout.disabled = false;
    }
  
    // Abrir / cerrar modal
    function abrirModal() {
      const overlay = document.getElementById('modal-carrito');
      if (overlay) {
        overlay.classList.add('activo');
        document.body.style.overflow = 'hidden';
        renderizarCarrito();
      }
    }
  
    function cerrarModal() {
      const overlay = document.getElementById('modal-carrito');
      if (overlay) {
        overlay.classList.remove('activo');
        document.body.style.overflow = '';
      }
    }
  
    // Confirmar pedido y enviar a WhatsApp
    function confirmarPedido() {
      const nombre = document.getElementById('input-nombre').value.trim();
      const direccion = document.getElementById('input-direccion').value.trim();
  
      if (!nombre || !direccion) {
        alert('Por favor completá nombre y dirección antes de confirmar.');
        return;
      }
  
      if (Cart.totalUnidades() === 0) {
        alert('Tu carrito está vacío.');
        return;
      }
  
      Cart.enviarPorWhatsApp(TELEFONO_WHATSAPP, { nombre, direccion });
    }
  
    // Configurar el enlace del botón "Consultas" del header
    function configurarBotonConsulta() {
      const btn = document.getElementById('btn-whatsapp-consulta');
      if (!btn) return;
      const url = 'https://wa.me/' + TELEFONO_WHATSAPP + '?text=' + encodeURIComponent(MENSAJE_CONSULTA);
      btn.setAttribute('href', url);
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    }
  
    // Inicializar eventos generales
    function inicializarEventos() {
      configurarBotonConsulta();
  
      const btnAbrir = document.getElementById('btn-abrir-carrito');
      if (btnAbrir) btnAbrir.addEventListener('click', abrirModal);
  
      const btnCerrar = document.getElementById('btn-cerrar-carrito');
      if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
  
      const overlay = document.getElementById('modal-carrito');
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) cerrarModal();
        });
      }
  
      const btnCheckout = document.getElementById('btn-checkout');
      if (btnCheckout) btnCheckout.addEventListener('click', confirmarPedido);
  
      const btnVaciar = document.getElementById('btn-vaciar');
      if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
          if (confirm('¿Vaciar el carrito?')) {
            Cart.vaciar();
            actualizarContador();
            renderizarCarrito();
            actualizarTodosLosControles();
          }
        });
      }
  
      const inputBuscador = document.getElementById('input-buscador');
      if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
          filtroActual = e.target.value.trim();
          renderizarCatalogo();
        });
      }
  
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
      });
    }
  
    // Arranque
    async function init() {
      Cart.cargar();
      inicializarEventos();
      actualizarContador();
      await cargarProductos();
    }
  
    return { init };
  })();
  
  document.addEventListener('DOMContentLoaded', App.init);