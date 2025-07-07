import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Avatar,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Check as CheckIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { productService, orderService, formatCurrency, formatWeight } from '../services/api';

const CreateOrderDialog = ({ open, onClose, onOrderCreated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos del cliente
  const [customerData, setCustomerData] = useState({
    customer_name: '',
    customer_email: '',
    customer_cedula: '',
    shipping_address: '',
    notes: ''
  });

  // Productos y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Cálculos totales
  const [orderTotals, setOrderTotals] = useState({
    totalValue: 0,
    totalWeight: 0,
    totalTariffs: 0,
    totalFinal: 0
  });

  const steps = ['Información del Cliente', 'Seleccionar Productos', 'Revisar y Confirmar'];

  const senaeCategories = [
    { value: 'B', label: 'Categoría B' },
    { value: 'C', label: 'Categoría C' },
    { value: 'D', label: 'Categoría D' }
  ];

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    calculateTotals();
  }, [orderItems]);

  const resetForm = () => {
    setActiveStep(0);
    setCustomerData({
      customer_name: '',
      customer_email: '',
      customer_cedula: '',
      shipping_address: '',
      notes: ''
    });
    setOrderItems([]);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const handleCustomerDataChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCustomerData = () => {
    const { customer_name, customer_email, customer_cedula, shipping_address } = customerData;

    if (!customer_name.trim()) {
      setError('El nombre del cliente es obligatorio');
      return false;
    }

    if (!customer_email.trim() || !customer_email.includes('@')) {
      setError('El email del cliente es obligatorio y debe ser válido');
      return false;
    }

    if (!customer_cedula.trim()) {
      setError('La cédula del cliente es obligatoria');
      return false;
    }

    if (!shipping_address.trim()) {
      setError('La dirección de envío es obligatoria');
      return false;
    }

    return true;
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const results = await productService.searchProducts(searchQuery, null, 10);
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const addProductToOrder = (product) => {
    const existingItem = orderItems.find(item => item.product_asin === product.asin);

    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.product_asin === product.asin
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem = {
        product_asin: product.asin,
        product_title: product.title,
        quantity: 1,
        unit_price: product.price,
        weight: product.weight || 1.0,
        senae_category: product.senae_category || 'C'
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateOrderItem = (index, field, value) => {
    const updatedItems = orderItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setOrderItems(updatedItems);
  };

  const removeOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalValue = orderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const totalWeight = orderItems.reduce((sum, item) => sum + ((item.weight || 1) * item.quantity), 0);

    // Simulación básica de cálculo de tarifas
    let totalTariffs = 0;

    orderItems.forEach(item => {
      const itemValue = item.unit_price * item.quantity;
      const itemWeight = (item.weight || 1) * item.quantity;

      if (item.senae_category === 'B') {
        totalTariffs += 42; // Arancel fijo
      } else if (item.senae_category === 'C') {
        const tariff = itemValue * 0.10;
        const iva = (itemValue + tariff) * 0.12;
        const fodinfa = itemValue * 0.005;
        totalTariffs += tariff + iva + fodinfa;
      } else if (item.senae_category === 'D') {
        const adv = itemValue * 0.10;
        const specificTariff = itemWeight * 5.5; // Asumiendo textiles
        const totalTariff = adv + specificTariff;
        const iva = (itemValue + totalTariff) * 0.12;
        const fodinfa = itemValue * 0.005;
        totalTariffs += totalTariff + iva + fodinfa;
      }
    });

    setOrderTotals({
      totalValue,
      totalWeight,
      totalTariffs,
      totalFinal: totalValue + totalTariffs
    });
  };

  const createOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      if (orderItems.length === 0) {
        setError('Debes agregar al menos un producto a la orden');
        return;
      }

      const orderData = {
        ...customerData,
        items: orderItems
      };

      const newOrder = await orderService.createOrder(orderData);

      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateCustomerData()) {
      return;
    }

    if (activeStep === 1 && orderItems.length === 0) {
      setError('Debes agregar al menos un producto antes de continuar');
      return;
    }

    setError(null);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <Typography variant="h5" fontWeight="bold">
          🛒 Crear Nueva Orden de Importación
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Sistema iBizTrack - iBusiness Ecuador
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Stepper */}
        <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => (
                    <Avatar
                      sx={{
                        bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                        color: 'white',
                        width: 32,
                        height: 32
                      }}
                    >
                      {completed ? <CheckIcon /> : index + 1}
                    </Avatar>
                  )}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Box sx={{ p: 3, pb: 0 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        <Box sx={{ p: 3 }}>
          {/* Paso 1: Información del Cliente */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="primary" />
                  Información del Cliente
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombre Completo"
                  value={customerData.customer_name}
                  onChange={(e) => handleCustomerDataChange('customer_name', e.target.value)}
                  placeholder="Juan Pérez García"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Email"
                  type="email"
                  value={customerData.customer_email}
                  onChange={(e) => handleCustomerDataChange('customer_email', e.target.value)}
                  placeholder="juan@email.com"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Cédula/RUC"
                  value={customerData.customer_cedula}
                  onChange={(e) => handleCustomerDataChange('customer_cedula', e.target.value)}
                  placeholder="1234567890"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Dirección de Envío"
                  multiline
                  rows={3}
                  value={customerData.shipping_address}
                  onChange={(e) => handleCustomerDataChange('shipping_address', e.target.value)}
                  placeholder="Av. Amazonas 123, Quito, Ecuador"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas Adicionales (Opcional)"
                  multiline
                  rows={2}
                  value={customerData.notes}
                  onChange={(e) => handleCustomerDataChange('notes', e.target.value)}
                  placeholder="Instrucciones especiales de entrega..."
                />
              </Grid>
            </Grid>
          )}

          {/* Paso 2: Seleccionar Productos */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon color="primary" />
                  Buscar y Agregar Productos
                </Typography>
              </Grid>

              {/* Búsqueda de productos */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Buscar productos"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ej: iPhone, laptop, zapatos..."
                        onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                      />
                      <Button
                        variant="contained"
                        onClick={searchProducts}
                        disabled={searchLoading}
                        startIcon={<SearchIcon />}
                      >
                        Buscar
                      </Button>
                    </Box>

                    {/* Resultados de búsqueda */}
                    {searchResults.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Resultados de búsqueda:
                        </Typography>
                        <Grid container spacing={2}>
                          {searchResults.slice(0, 6).map((product) => (
                            <Grid item xs={12} sm={6} md={4} key={product.asin}>
                              <Card variant="outlined" sx={{ height: '100%' }}>
                                <CardContent sx={{ p: 2 }}>
                                  <Typography variant="body2" noWrap fontWeight="medium">
                                    {product.title}
                                  </Typography>
                                  <Typography variant="h6" color="primary.main" gutterBottom>
                                    {formatCurrency(product.price)}
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip
                                      label={product.senae_category || 'C'}
                                      size="small"
                                      color="primary"
                                    />
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => addProductToOrder(product)}
                                      startIcon={<AddIcon />}
                                    >
                                      Agregar
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Lista de productos agregados */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Productos en la Orden ({orderItems.length})
                </Typography>

                {orderItems.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell>Producto</TableCell>
                          <TableCell align="center">Cantidad</TableCell>
                          <TableCell align="right">Precio Unit.</TableCell>
                          <TableCell align="center">Categoría</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orderItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.product_title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatWeight(item.weight)} por unidad
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1, style: { textAlign: 'center', width: '60px' } }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell align="center">
                              <FormControl size="small">
                                <Select
                                  value={item.senae_category}
                                  onChange={(e) => updateOrderItem(index, 'senae_category', e.target.value)}
                                >
                                  {senaeCategories.map((cat) => (
                                    <MenuItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(item.unit_price * item.quantity)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="error"
                                onClick={() => removeOrderItem(index)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <CartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No hay productos en la orden
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Busca y agrega productos para continuar
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}

          {/* Paso 3: Revisar y Confirmar */}
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="primary" />
                  Revisar Orden
                </Typography>
              </Grid>

              {/* Resumen del cliente */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      👤 Información del Cliente
                    </Typography>
                    <Typography variant="body2"><strong>Nombre:</strong> {customerData.customer_name}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {customerData.customer_email}</Typography>
                    <Typography variant="body2"><strong>Cédula:</strong> {customerData.customer_cedula}</Typography>
                    <Typography variant="body2"><strong>Dirección:</strong> {customerData.shipping_address}</Typography>
                    {customerData.notes && (
                      <Typography variant="body2"><strong>Notas:</strong> {customerData.notes}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Totales */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalculateIcon color="success" />
                      Resumen de Costos
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Valor de Productos:</Typography>
                        <Typography fontWeight="bold">{formatCurrency(orderTotals.totalValue)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Peso Total:</Typography>
                        <Typography>{formatWeight(orderTotals.totalWeight)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Tarifas SENAE:</Typography>
                        <Typography color="warning.main" fontWeight="bold">
                          {formatCurrency(orderTotals.totalTariffs)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight="bold">Total Final:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(orderTotals.totalFinal)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Lista final de productos */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  📦 Productos a Importar ({orderItems.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell>Producto</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="center">Categoría</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_title}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell align="center">
                            <Chip label={item.senae_category} size="small" color="primary" />
                          </TableCell>
                          <TableCell align="right" fontWeight="bold">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} size="large">
          Cancelar
        </Button>

        {activeStep > 0 && (
          <Button onClick={handleBack} size="large">
            Anterior
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            size="large"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={createOrder}
            disabled={loading}
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
              }
            }}
          >
            {loading ? 'Creando Orden...' : 'Crear Orden'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrderDialog;