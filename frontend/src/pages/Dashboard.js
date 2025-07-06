import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Calculate as CalculateIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
  LocalShipping as LocalShippingIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
  FavoriteOutlined as FavoriteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productService, orderService, formatCurrency, getSenaeCategoryName } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalValue: 0,
    averageTariff: 0
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsData, ordersData] = await Promise.all([
        productService.getTrendingProducts(8),
        orderService.getOrders(null, null, 10, 0)
      ]);

      setTrendingProducts(productsData);
      setRecentOrders(ordersData);

      // Calcular estadísticas
      const totalValue = ordersData.reduce((sum, order) => sum + (order.total_value || 0), 0);
      const totalTariffs = ordersData.reduce((sum, order) => sum + (order.total_tariffs?.total_taxes || 0), 0);
      const avgTariff = ordersData.length > 0 ? totalTariffs / ordersData.length : 0;

      setStats({
        totalProducts: productsData.length,
        totalOrders: ordersData.length,
        totalValue: totalValue,
        averageTariff: avgTariff
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Buscar Productos Amazon',
      description: 'Encuentra productos y calcula tarifas SENAE automáticamente',
      icon: <SearchIcon fontSize="large" />,
      color: 'primary',
      gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      action: () => navigate('/products')
    },
    {
      title: 'Nueva Orden de Compra',
      description: 'Crea una nueva orden con cálculos automáticos',
      icon: <ShoppingCartIcon fontSize="large" />,
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #dc004e 0%, #ff5983 100%)',
      action: () => navigate('/orders')
    },
    {
      title: 'Calculadora SENAE',
      description: 'Calcula tarifas e impuestos para categorías B, C, D',
      icon: <CalculateIcon fontSize="large" />,
      color: 'success',
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
      action: () => navigate('/calculator')
    }
  ];

  const statsCards = [
    {
      title: 'Productos Analizados',
      value: stats.totalProducts,
      icon: <SearchIcon />,
      color: 'primary',
      trend: '+12%',
      subtitle: 'Este mes'
    },
    {
      title: 'Órdenes Totales',
      value: stats.totalOrders,
      icon: <ShoppingCartIcon />,
      color: 'secondary',
      trend: '+8%',
      subtitle: 'Órdenes activas'
    },
    {
      title: 'Valor Total',
      value: formatCurrency(stats.totalValue),
      icon: <MoneyIcon />,
      color: 'success',
      trend: '+15%',
      subtitle: 'En importaciones'
    },
    {
      title: 'Promedio Tarifas',
      value: formatCurrency(stats.averageTariff),
      icon: <AssessmentIcon />,
      color: 'warning',
      trend: '-3%',
      subtitle: 'Por orden'
    }
  ];

  const senaeLimits = [
    { category: 'B', limit: 'Hasta $400 y 4kg', percentage: 75, color: 'primary' },
    { category: 'C', limit: 'Hasta $2,000 y 50kg', percentage: 60, color: 'warning' },
    { category: 'D', limit: 'Hasta $2,000 y 20kg', percentage: 45, color: 'error' }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando dashboard de iBizTrack...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Dashboard iBizTrack
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Sistema de Gestión de Importaciones - iBusiness Ecuador
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<AccountBalanceIcon />}
            label="Tarifas SENAE Oficiales"
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<LocalShippingIcon />}
            label="Categorías B, C, D"
            color="secondary"
            variant="outlined"
          />
          <IconButton onClick={loadDashboardData} color="primary" size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color === 'primary' ? '#1976d2' : 
                  stat.color === 'secondary' ? '#dc004e' : 
                  stat.color === 'success' ? '#2e7d32' : '#ed6c02'} 0%, transparent 100%)`,
                backgroundSize: '100% 4px',
                backgroundRepeat: 'no-repeat',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold" color={`${stat.color}.main`}>
                      {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" color="text.primary">
                      {stat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: `${stat.color}.main`, width: 48, height: 48 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={stat.trend}
                    size="small"
                    color={stat.trend.includes('+') ? 'success' : 'error'}
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    vs mes anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4, overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            p: 3
          }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon />
              Acciones Rápidas
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Accede rápidamente a las funciones principales del sistema
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: action.gradient,
                      color: 'white',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      }
                    }}
                    onClick={action.action}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 4 }}>
                      <Box sx={{ mb: 2 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        {action.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* SENAE Categories Status */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon color="primary" />
                Estado Categorías SENAE
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {senaeLimits.map((category, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Categoría {category.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.percentage}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {category.limit}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={category.percentage}
                    color={category.color}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}

              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/calculator')}
                startIcon={<CalculateIcon />}
                sx={{ mt: 2 }}
              >
                Ir a Calculadora
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Productos Destacados */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FavoriteIcon color="secondary" />
                Productos Destacados
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {trendingProducts.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {trendingProducts.slice(0, 4).map((product, index) => (
                    <ListItem key={product.asin} sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          src={product.image_url}
                          alt={product.title}
                          sx={{ width: 48, height: 48 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap fontWeight="medium">
                            {product.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="h6" color="primary.main" fontWeight="bold">
                              {formatCurrency(product.price)}
                            </Typography>
                            <Chip
                              label={getSenaeCategoryName(product.senae_category).split(' - ')[0]}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No hay productos disponibles
                </Typography>
              )}

              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/products')}
                sx={{ mt: 2 }}
              >
                Ver Todos los Productos
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Órdenes Recientes */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon color="info" />
                Órdenes Recientes
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {recentOrders.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {recentOrders.slice(0, 4).map((order, index) => (
                    <ListItem key={order.id} sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <ShoppingCartIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {order.order_number}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {order.customer_name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(order.total_value)}
                              </Typography>
                              <Chip
                                label={order.status}
                                size="small"
                                color={order.status === 'delivered' ? 'success' : 'primary'}
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No hay órdenes recientes
                </Typography>
              )}

              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/orders')}
                sx={{ mt: 2 }}
              >
                Ver Todas las Órdenes
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Footer */}
      <Paper sx={{ mt: 4, p: 3, bgcolor: 'grey.50', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>iBizTrack</strong> - Sistema oficial para cálculo de tarifas SENAE Ecuador
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Categorías B (hasta $400), C (hasta $2,000), D (textiles hasta $2,000) •
          Cálculos automáticos de IVA, FODINFA, ADV y aranceles específicos
        </Typography>
      </Paper>
    </Container>
  );
};

export default Dashboard;