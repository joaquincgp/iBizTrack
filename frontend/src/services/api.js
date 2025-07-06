const API_BASE_URL = 'http://localhost:8000/api'; // Cambia este valor si tu backend está en otro host o puerto

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Error en la solicitud');
  }
  return await response.json();
};

// PRODUCTOS
export const productService = {
  // Buscar productos por palabra clave y categoría
  searchProducts: async (query, category = null, limit = 20) => {
    const url = new URL(`${API_BASE_URL}/products/search`);
    url.searchParams.append('query', query);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('limit', limit);
    const response = await fetch(url);
    return await handleResponse(response);
  },

  // Obtener productos destacados o más buscados
  getTrendingProducts: async (limit = 8) => {
    const url = `${API_BASE_URL}/products/trending?limit=${limit}`;
    const response = await fetch(url);
    return await handleResponse(response);
  }
};

// ÓRDENES
export const orderService = {
  // Obtener lista de órdenes con filtros
  getOrders: async (status = null, customerEmail = null, limit = 50, offset = 0) => {
    const url = new URL(`${API_BASE_URL}/orders`);
    if (status) url.searchParams.append('status', status);
    if (customerEmail) url.searchParams.append('customer_email', customerEmail);
    url.searchParams.append('limit', limit);
    url.searchParams.append('offset', offset);
    const response = await fetch(url);
    return await handleResponse(response);
  },

  // Eliminar una orden
  deleteOrder: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE'
    });
    return await handleResponse(response);
  }
};

// FORMATOS
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value || 0);
};

export const formatWeight = (kg) => {
  return `${kg?.toFixed(2) || '0.00'} kg`;
};

// CATEGORÍAS SENAE
export const getSenaeCategoryName = (code) => {
  switch (code) {
    case 'B':
      return 'Categoría B - hasta $400 y 4kg';
    case 'C':
      return 'Categoría C - hasta $2.000 y 50kg';
    case 'D':
      return 'Categoría D - textiles hasta $2.000 y 20kg';
    default:
      return 'Sin categoría';
  }
};

// ESTADOS DE ÓRDENES
export const getOrderStatusName = (status) => {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'pending':
      return 'Pendiente';
    case 'processing':
      return 'Procesando';
    case 'shipped':
      return 'Enviado';
    case 'delivered':
      return 'Entregado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return 'Desconocido';
  }
};

export const getOrderStatusColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'shipped':
      return 'secondary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};
