/* ============================
   Lógica del carrito - carneconcuero
   ============================ */

   const Cart = (() => {
    const STORAGE_KEY = 'carneconcuero_carrito';
  
    // Estructura interna: { items: [{ id, nombre, tipoVenta, precioKilo, pesoAproxKg, precioUnidad, cantidad }] }
    let items = [];
  
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
  
    function guardar() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        // Silencioso
      }
    }
  
    function esPorKilo(item) {
      return item.tipoVenta === 'kilo';
    }
  
    function agregar(producto) {
      const existente = items.find((i) => i.id === producto.id);
      if (existente) {
        existente.cantidad += 1;
      } else {
        const item = {
          id: producto.id,
          nombre: producto.nombre,
          tipoVenta: producto.tipoVenta,
          cantidad: 1
        };
        if (producto.tipoVenta === 'kilo') {
          item.precioKilo = producto.precioKilo;
          item.pesoAproxKg = producto.pesoAproxKg;
        } else {
          item.precioUnidad = producto.precioUnidad;
        }
        items.push(item);
      }
      guardar();
    }
  
    function quitar(id) {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      item.cantidad -= 1;
      if (item.cantidad <= 0) {
        items = items.filter((i) => i.id !== id);
      }
      guardar();
    }
  
    function eliminar(id) {
      items = items.filter((i) => i.id !== id);
      guardar();
    }
  
    function vaciar() {
      items = [];
      guardar();
    }
  
    function obtenerItems() {
      return items;
    }
  
    function totalUnidades() {
      return items.reduce((acc, i) => acc + i.cantidad, 0);
    }
  
    function precioUnitarioEstimado(item) {
      if (esPorKilo(item)) {
        return Math.round(item.precioKilo * item.pesoAproxKg);
      }
      return item.precioUnidad;
    }
  
    function subtotalItem(item) {
      return precioUnitarioEstimado(item) * item.cantidad;
    }
  
    function totalEstimado() {
      return items.reduce((acc, i) => acc + subtotalItem(i), 0);
    }
  
    function pesoTotalEstimado() {
      return items.reduce((acc, i) => {
        if (esPorKilo(i)) {
          return acc + (i.pesoAproxKg * i.cantidad);
        }
        return acc;
      }, 0);
    }
  
    function hayProductosPorKilo() {
      return items.some((i) => esPorKilo(i));
    }
  
    function formatearPrecio(valor) {
      return '$' + valor.toLocaleString('es-AR');
    }
  
    function generarMensajeWhatsApp(cliente) {
      const lineas = [];
      lineas.push('*NUEVO PEDIDO - carneconcuero*');
      lineas.push('');
      lineas.push('*Cliente:*');
      lineas.push('Nombre: ' + cliente.nombre);
      lineas.push('Dirección: ' + cliente.direccion);
  
      if (cliente.comentario && cliente.comentario.trim() !== '') {
        lineas.push('Comentario: ' + cliente.comentario.trim());
      }
  
      lineas.push('Método de pago: Contra entrega');
      lineas.push('');
      lineas.push('*Detalle del pedido:*');
  
      items.forEach((item) => {
        if (esPorKilo(item)) {
          const pesoTotal = (item.pesoAproxKg * item.cantidad).toFixed(2);
          const subtotal = formatearPrecio(subtotalItem(item));
          lineas.push(
            '• ' + item.cantidad + 'x ' + item.nombre +
            ' (~' + pesoTotal + ' kg) — ' + subtotal + ' (estimado)'
          );
        } else {
          const subtotal = formatearPrecio(subtotalItem(item));
          lineas.push(
            '• ' + item.cantidad + 'x ' + item.nombre +
            ' — ' + subtotal
          );
        }
      });
  
      lineas.push('');
      lineas.push('*Peso total estimado:* ~' + pesoTotalEstimado().toFixed(2) + ' kg');
      lineas.push('*Total aproximado:* ' + formatearPrecio(totalEstimado()));
  
      if (hayProductosPorKilo()) {
        lineas.push('');
        lineas.push('⚠️ El monto final exacto se confirma con el pesaje real antes del envío.');
        lineas.push('Confirmá tu pedido y en menos de una hora te enviamos el importe exacto por WhatsApp!');
      }
  
      return lineas.join('\n');
    }
  
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