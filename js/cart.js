/* ============================
   Lógica del carrito - carneconcuero
   ============================ */

   const Cart = (() => {
    const STORAGE_KEY = 'carneconcuero_carrito';
  
    // Estructura interna: { items: [{ id, nombre, precioKilo, pesoAproxKg, cantidad }] }
    let items = [];
  
    // Cargar carrito desde localStorage
    function cargar() {
      try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado) {
          items = JSON.parse(guardado);
        } else {
          items = [];
        }
      } catch (e) {
        items = [];
      }
    }
  
    // Guardar carrito en localStorage
    function guardar() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        // Silencioso
      }
    }
  
    // Agregar producto (o incrementar cantidad si ya existe)
    function agregar(producto) {
      const existente = items.find((i) => i.id === producto.id);
      if (existente) {
        existente.cantidad += 1;
      } else {
        items.push({
          id: producto.id,
          nombre: producto.nombre,
          precioKilo: producto.precioKilo,
          pesoAproxKg: producto.pesoAproxKg,
          cantidad: 1
        });
      }
      guardar();
    }
  
    // Quitar una unidad (o eliminar si llega a 0)
    function quitar(id) {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      item.cantidad -= 1;
      if (item.cantidad <= 0) {
        items = items.filter((i) => i.id !== id);
      }
      guardar();
    }
  
    // Eliminar producto completo
    function eliminar(id) {
      items = items.filter((i) => i.id !== id);
      guardar();
    }
  
    // Vaciar carrito
    function vaciar() {
      items = [];
      guardar();
    }
  
    // Obtener items
    function obtenerItems() {
      return items;
    }
  
    // Total de unidades
    function totalUnidades() {
      return items.reduce((acc, i) => acc + i.cantidad, 0);
    }
  
    // Precio estimado por unidad de un item
    function precioUnitarioEstimado(item) {
      return Math.round(item.precioKilo * item.pesoAproxKg);
    }
  
    // Subtotal estimado de un item
    function subtotalItem(item) {
      return precioUnitarioEstimado(item) * item.cantidad;
    }
  
    // Total estimado del carrito
    function totalEstimado() {
      return items.reduce((acc, i) => acc + subtotalItem(i), 0);
    }
  
    // Peso total estimado (kg)
    function pesoTotalEstimado() {
      return items.reduce((acc, i) => acc + (i.pesoAproxKg * i.cantidad), 0);
    }
  
    // Formatear precio en pesos argentinos
    function formatearPrecio(valor) {
      return '$' + valor.toLocaleString('es-AR');
    }
  
    // Generar mensaje de WhatsApp con el pedido
    function generarMensajeWhatsApp(cliente) {
      const lineas = [];
      lineas.push('*NUEVO PEDIDO - carneconcuero*');
      lineas.push('');
      lineas.push('*Cliente:*');
      lineas.push('Nombre: ' + cliente.nombre);
      lineas.push('Dirección: ' + cliente.direccion);
      lineas.push('Método de pago: Contra entrega');
      lineas.push('');
      lineas.push('*Detalle del pedido:*');
      items.forEach((item) => {
        const pesoTotal = (item.pesoAproxKg * item.cantidad).toFixed(2);
        const subtotal = formatearPrecio(subtotalItem(item));
        lineas.push(
          '• ' + item.cantidad + 'x ' + item.nombre +
          ' (~' + pesoTotal + ' kg) — ' + subtotal + ' (estimado)'
        );
      });
      lineas.push('');
      lineas.push('*Peso total estimado:* ~' + pesoTotalEstimado().toFixed(2) + ' kg');
      lineas.push('*Total aproximado:* ' + formatearPrecio(totalEstimado()));
      lineas.push('');
      lineas.push('⚠️ El monto final exacto se confirma con el pesaje real antes del envío.');
      return lineas.join('\n');
    }
  
    // Abrir WhatsApp con el mensaje
    function enviarPorWhatsApp(numeroTelefono, cliente) {
      const mensaje = generarMensajeWhatsApp(cliente);
      const url = 'https://wa.me/' + numeroTelefono + '?text=' + encodeURIComponent(mensaje);
      window.open(url, '_blank');
    }
  
    return {
      cargar,
      agregar,
      quitar,
      eliminar,
      vaciar,
      obtenerItems,
      totalUnidades,
      precioUnitarioEstimado,
      subtotalItem,
      totalEstimado,
      pesoTotalEstimado,
      formatearPrecio,
      generarMensajeWhatsApp,
      enviarPorWhatsApp
    };
  })();