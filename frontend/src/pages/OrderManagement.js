import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Fab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  LocalShipping as ShippingIcon,
  AccountBalance as AccountBalanceIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import {
  orderService,
  formatCurrency,
  getOrderStatusName,
  getOrderStatusColor
} from '../services/api';
import CreateOrderDialog from '../components/CreateOrderDialog';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    status: '',
    customerEmail: '',
    search: ''
  });

  const orderStatuses = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: '📝 Borrador' },
    { value: 'pending', label: '⏳ Pendiente' },
    { value: 'processing', label: '⚙️ Procesando' },
    { value: 'shipped', label: '🚚 Enviado' },
    { value: 'delivered', label: '✅ Entregado' },
    { value: 'cancelled', label: '❌ Cancelado' }
  ];

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await orderService.getOrders(
        filters.status || null,
        filters.customerEmail || null,
        50,
        0
      );

      // Filtrar por búsqueda local si existe
      let filteredOrders = ordersData;
      if (filters.search) {
        filteredOrders = ordersData.filter(order =>
          order.order_number.toLowerCase().includes(filters.search.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          order.customer_email.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setOrders(filteredOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
      try {
        await orderService.deleteOrder(orderId);
        await loadOrders();
        showSnackbar('Orden eliminada exitosamente', 'success');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      customerEmail: '',
      search: ''
    });
  };

  const handleOrderCreated = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    showSnackbar(`Orden ${newOrder.order_number} creada exitosamente`, 'success');
    loadOrders(); // Recargar para obtener datos actualizados
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  const getStatusIcon = (status) => {
    const icons = {
      'draft': '📝',
      'pending': '⏳',
      'processing': '⚙️',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '📦';
  };

  const OrderSummaryCard = ({ order }) => (
    <Card sx={{ mb: 2, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                {getStatusIcon(order.status)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {order.order_number}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(order.created_at).toLocaleDateString('es-EC')}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight="medium">
              {order.customer_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {order.customer_email}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Typography variant="body2">
              {order.items?.length || 0} productos
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {order.total_weight?.toFixed(2)} kg
            </Typography>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              {formatCurrency(order.total_value)}
            </Typography>
            {order.total_tariffs?.total_taxes && (
              <Typography variant="caption" color="warning.main">
                +{formatCurrency(order.total_tariffs.total_taxes)} impuestos
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
              <Chip
                label={getOrderStatusName(order.status)}
                color={getOrderStatusColor(order.status)}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Ver detalles">
                  <IconButton
                    size="small"
                    onClick={() => handleViewOrder(order)}
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando órdenes de importación...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              📦 Gestión de Órdenes
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Administra todas las órdenes de compra e importación con cálculos SENAE
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={() => setCreateOrderOpen(true)}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            Nueva Orden
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon />
              Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Buscar orden o cliente"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Número de orden, nombre, email..."
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    label="Estado"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {orderStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Email del cliente"
                  value={filters.customerEmail}
                  onChange={(e) => handleFilterChange('customerEmail', e.target.value)}
                  placeholder="cliente@email.com"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ height: '56px' }}
                >
                  Limpiar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Orders List */}
      {orders.length > 0 ? (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" fontWeight="medium">
              Órdenes Encontradas
              <Chip label={`${orders.length} órdenes`} sx={{ ml: 2 }} />
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Exportar a Excel">
                <IconButton color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Imprimir lista">
                <IconButton color="primary">
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {orders.map((order) => (
            <OrderSummaryCard key={order.id} order={order} />
          ))}
        </>
      ) : (
        <Paper sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50' }}>
          <ShoppingCartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {filters.search || filters.status || filters.customerEmail
              ? 'No se encontraron órdenes'
              : 'No hay órdenes registradas'
            }
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {filters.search || filters.status || filters.customerEmail
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea tu primera orden para comenzar a gestionar importaciones'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={() => setCreateOrderOpen(true)}
          >
            {orders.length === 0 ? 'Crear Primera Orden' : 'Nueva Orden'}
          </Button>
        </Paper>
      )}

      {/* Order Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
              <Typography variant="h5" component="div" fontWeight="bold">
                📋 Detalles de la Orden
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {selectedOrder.order_number} • {getOrderStatusName(selectedOrder.status)}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Información del Cliente */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="primary" />
                          Información del Cliente
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Nombre:</strong> {selectedOrder.customer_name}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Email:</strong> {selectedOrder.customer_email}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Cédula:</strong> {selectedOrder.customer_cedula}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2 }}>
                            <LocationIcon color="action" sx={{ mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Dirección de envío:
                              </Typography>
                              <Typography variant="body1">
                                {selectedOrder.shipping_address}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Resumen de la Orden */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ReceiptIcon color="secondary" />
                          Resumen de la Orden
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">Estado:</Typography>
                            <Chip
                              label={getOrderStatusName(selectedOrder.status)}
                              color={getOrderStatusColor(selectedOrder.status)}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">Valor Total:</Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {formatCurrency(selectedOrder.total_value)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">Peso Total:</Typography>
                            <Typography variant="body1">
                              {selectedOrder.total_weight?.toFixed(2)} kg
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">Impuestos SENAE:</Typography>
                            <Typography variant="body1" color="warning.main" fontWeight="medium">
                              {formatCurrency(selectedOrder.total_tariffs?.total_taxes || 0)}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6" fontWeight="bold">Total Final:</Typography>
                            <Typography variant="h6" fontWeight="bold" color="success.main">
                              {formatCurrency(selectedOrder.total_value + (selectedOrder.total_tariffs?.total_taxes || 0))}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Productos */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingCartIcon color="info" />
                      Productos ({selectedOrder.items?.length || 0})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align="center">Cantidad</TableCell>
                            <TableCell align="right">Precio Unit.</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="center">Categoría SENAE</TableCell>
                            <TableCell align="center">Peso</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedOrder.items?.map((item, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium" noWrap>
                                    {item.product_title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ASIN: {item.product_asin}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={item.quantity} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(item.unit_price)}
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="medium">
                                  {formatCurrency(item.unit_price * item.quantity)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={item.senae_category}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="caption">
                                  {item.weight?.toFixed(2) || '0.00'} kg
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {/* Detalles de Tarifas */}
                  {selectedOrder.total_tariffs && (
                    <Grid item xs={12}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountBalanceIcon color="warning" />
                            Desglose de Tarifas SENAE
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                💰 Aranceles
                              </Typography>
                              <Typography variant="body2">
                                <strong>Total Aranceles:</strong> {formatCurrency(selectedOrder.total_tariffs.total_tariff || 0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="secondary" gutterBottom>
                                📊 Impuestos
                              </Typography>
                              <Typography variant="body2">
                                <strong>IVA Total:</strong> {formatCurrency(selectedOrder.total_tariffs.total_iva || 0)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>FODINFA Total:</strong> {formatCurrency(selectedOrder.total_tariffs.total_fodinfa || 0)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>ADV Total:</strong> {formatCurrency(selectedOrder.total_tariffs.total_adv || 0)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* Notas */}
                  {selectedOrder.notes && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        📝 Notas Adicionales
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body1">
                          {selectedOrder.notes}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Timeline de la orden */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineIcon color="info" />
                      Cronología
                    </Typography>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Creada:</strong> {new Date(selectedOrder.created_at).toLocaleString('es-EC')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Última actualización:</strong> {new Date(selectedOrder.updated_at).toLocaleString('es-EC')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Button onClick={handleCloseDetails} size="large">
                Cerrar
              </Button>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                size="large"
              >
                Enviar por Email
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                size="large"
              >
                Imprimir
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                size="large"
              >
                Editar Orden
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
          }
        }}
        onClick={() => setCreateOrderOpen(true)}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default OrderManagement;