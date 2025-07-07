// frontend/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const apiService = new ApiService(API_BASE_URL);

// Product Services
export const productService = {
  searchProducts: async (query, category = null, limit = 10) => {
    const params = { q: query, limit };
    if (category) params.category = category;
    return apiService.get('/products/search', params);
  },

  getTrendingProducts: async (limit = 5) => {
    return apiService.get('/products/trending', { limit });
  },

  getSavedProducts: async (limit = 20, skip = 0, category = null) => {
    const params = { limit, skip };
    if (category) params.category = category;
    return apiService.get('/products/saved', params);
  },

  getProductByAsin: async (asin) => {
    return apiService.get(`/products/${asin}`);
  },

  calculateCustomTariff: async (asin, senaeCategory, customWeight = null, productType = null) => {
    const data = {
      asin,
      senae_category: senaeCategory,
      custom_weight: customWeight,
      product_type: productType
    };
    return apiService.post('/products/calculate-tariff', data);
  },

  bulkSaveProducts: async () => {
    return apiService.post('/products/bulk-save', {});
  }
};

// Order Services
export const orderService = {
  createOrder: async (orderData) => {
    return apiService.post('/orders/', orderData);
  },

  getOrders: async (status = null, customerEmail = null, limit = 10, skip = 0) => {
    const params = { limit, skip };
    if (status) params.status = status;
    if (customerEmail) params.customer_email = customerEmail;
    return apiService.get('/orders/', params);
  },

  getOrderById: async (orderId) => {
    return apiService.get(`/orders/${orderId}`);
  },

  getOrderByNumber: async (orderNumber) => {
    return apiService.get(`/orders/number/${orderNumber}`);
  },

  updateOrderStatus: async (orderId, status) => {
    return apiService.put(`/orders/${orderId}/status`, { status });
  },

  deleteOrder: async (orderId) => {
    return apiService.delete(`/orders/${orderId}`);
  },

  calculateBulkTariff: async (items) => {
    return apiService.post('/orders/calculate-bulk-tariff', items);
  }
};

// Utility Functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatWeight = (weight) => {
  if (!weight) return '0.00 kg';
  return `${weight.toFixed(2)} kg`;
};

export const getOrderStatusName = (status) => {
  const statusNames = {
    draft: 'Borrador',
    pending: 'Pendiente',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };
  return statusNames[status] || status;
};

export const getOrderStatusColor = (status) => {
  const statusColors = {
    draft: 'default',
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'error'
  };
  return statusColors[status] || 'default';
};

export const getSenaeCategoryName = (category) => {
  const categoryNames = {
    B: 'Categoría B - Hasta $400 y 4kg',
    C: 'Categoría C - Hasta $2,000 y 50kg',
    D: 'Categoría D - Textiles hasta $2,000 y 20kg'
  };
  return categoryNames[category] || `Categoría ${category}`;
};

export const calculateEstimatedDelivery = (orderDate) => {
  const date = new Date(orderDate);
  date.setDate(date.getDate() + 15); // Estimado 15 días
  return date.toLocaleDateString('es-EC');
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateCedula = (cedula) => {
  // Validación básica de cédula ecuatoriana
  if (!cedula || cedula.length !== 10) return false;
  
  const digits = cedula.split('').map(d => parseInt(d));
  const province = parseInt(cedula.substring(0, 2));
  
  if (province < 1 || province > 24) return false;
  
  // Algoritmo de validación de cédula ecuatoriana
  let total = 0;
  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    total += digit;
  }
  
  const checkDigit = total % 10 === 0 ? 0 : 10 - (total % 10);
  return checkDigit === digits[9];
};

// Error Handling
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('Failed to fetch')) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }
  
  if (error.message.includes('404')) {
    return 'Recurso no encontrado.';
  }
  
  if (error.message.includes('400')) {
    return 'Datos inválidos. Verifica la información ingresada.';
  }
  
  if (error.message.includes('500')) {
    return 'Error interno del servidor. Intenta de nuevo más tarde.';
  }
  
  return error.message || 'Error desconocido. Intenta de nuevo.';
};

// Cache for products
const productCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getCachedProduct = (asin) => {
  const cached = productCache.get(asin);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

export const setCachedProduct = (asin, data) => {
  productCache.set(asin, {
    data,
    timestamp: Date.now()
  });
};

export default apiService;