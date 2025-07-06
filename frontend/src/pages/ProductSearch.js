import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Fab,
  Badge,
  Skeleton,
  InputAdornment,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  ShoppingCart as AddToCartIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Star as StarIcon,
  LocalShipping as ShippingIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';
import {
  productService,
  formatCurrency,
  formatWeight,
  getSenaeCategoryName
} from '../services/api';

const ProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const categories = [
    { value: '', label: 'Todas las categorías' },
    { value: 'Electronics', label: '📱 Electrónicos' },
    { value: 'Clothing', label: '👕 Ropa' },
    { value: 'Footwear', label: '👟 Calzado' },
    { value: 'Kitchen', label: '🍳 Cocina' },
    { value: 'Books', label: '📚 Libros' },
    { value: 'Sports', label: '⚽ Deportes' },
    { value: 'Beauty', label: '💄 Belleza' },
    { value: 'Home', label: '🏠 Hogar' }
  ];

  const popularSearches = [
    'iPhone', 'laptop', 'headphones', 'sneakers', 'jeans', 'watch', 'camera', 'tablet'
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await productService.searchProducts(searchQuery, category || null, 20);

      // Aplicar filtros de precio si están establecidos
      let filteredResults = results;
      if (priceRange.min || priceRange.max) {
        filteredResults = results.filter(product => {
          const price = product.price;
          const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
          const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
          return price >= minPrice && price <= maxPrice;
        });
      }

      setProducts(filteredResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductDetails = (product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.asin === product.asin);
    if (existingItem) {
      setCart(cart.map(item =>
        item.asin === product.asin
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setPriceRange({ min: '', max: '' });
    setProducts([]);
    setError(null);
  };

  const loadTrendingProducts = async () => {
    try {
      setLoading(true);
      setSearchQuery('');
      const trending = await productService.getTrendingProducts(12);
      setProducts(trending);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrendingProducts();
  }, []);

  const TariffDetailsAccordion = ({ calculation }) => {
    if (!calculation || calculation.error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {calculation?.error || 'Error en el cálculo de tarifas'}
        </Alert>
      );
    }

    return (
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateIcon />
            Detalles de Tarifas SENAE
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                📋 Información Base
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Categoría SENAE:</strong> {calculation.category}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Valor del Producto:</strong> {formatCurrency(calculation.base_value)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Peso:</strong> {formatWeight(calculation.weight)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                💰 Cálculo de Impuestos
              </Typography>
              {calculation.tariff !== undefined && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Arancel:</strong> {formatCurrency(calculation.tariff)}
                </Typography>
              )}
              {calculation.total_tariff !== undefined && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Arancel Total:</strong> {formatCurrency(calculation.total_tariff)}
                </Typography>
              )}
              {calculation.iva !== undefined && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>IVA (12%):</strong> {formatCurrency(calculation.iva)}
                </Typography>
              )}
              {calculation.fodinfa !== undefined && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>FODINFA (0.5%):</strong> {formatCurrency(calculation.fodinfa)}
                </Typography>
              )}
              {calculation.adv !== undefined && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>ADV (10%):</strong> {formatCurrency(calculation.adv)}
                </Typography>
              )}
              {calculation.specific_tariff !== undefined && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Tarifa Específica:</strong> {formatCurrency(calculation.specific_tariff)}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    💵 Costo Total Final:
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {formatCurrency(calculation.total_cost)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Incluye producto + todos los impuestos SENAE
                </Typography>
              </Paper>

              {calculation.free_of_tributes && (
                <Alert severity="info" sx={{ mt: 2 }} icon={<BankIcon />}>
                  ✅ Este producto está libre de tributos adicionales
                </Alert>
              )}

              {calculation.requires_inen && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  ⚠️ Requiere certificación INEN
                </Alert>
              )}

              {calculation.requires_control_document && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  📋 Requiere Documento de Control Previo
                </Alert>
              )}

              {calculation.annual_limit && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  📊 Límite anual categoría B: {formatCurrency(calculation.annual_limit)}
                  ({calculation.importations_count} importaciones)
                </Alert>
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const ProductCard = ({ product }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="220"
          image={product.image_url || 'https://via.placeholder.com/220x220?text=No+Image'}
          alt={product.title}
          sx={{ objectFit: 'contain', bgcolor: 'grey.50' }}
        />
        <Chip
          label={getSenaeCategoryName(product.senae_category).split(' - ')[0]}
          size="small"
          color="primary"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontWeight: 'bold'
          }}
        />
        {product.calculated_tariff && !product.calculated_tariff.error && (
          <Chip
            icon={<StarIcon />}
            label="Cálculo Incluido"
            size="small"
            color="success"
            variant="outlined"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'rgba(255,255,255,0.9)'
            }}
          />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{
            fontWeight: 'medium',
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3
          }}
        >
          {product.title}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            {formatCurrency(product.price)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            {product.weight && (
              <Typography variant="body2" color="text.secondary">
                ⚖️ {formatWeight(product.weight)}
              </Typography>
            )}
            {product.category && (
              <Chip
                label={product.category}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Box>

        {product.calculated_tariff && !product.calculated_tariff.error && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
            <Typography variant="body2" color="success.main" fontWeight="bold" gutterBottom>
              💵 Total con impuestos:
            </Typography>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {formatCurrency(product.calculated_tariff.total_cost)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Incluye tarifas SENAE
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={() => handleProductDetails(product)}
              size="small"
            >
              Detalles
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddToCartIcon />}
              onClick={() => handleAddToCart(product)}
              size="small"
            >
              Agregar
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🔍 Búsqueda de Productos Amazon
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Encuentra productos y calcula automáticamente las tarifas SENAE
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip icon={<BankIcon />} label="Cálculos SENAE Oficiales" color="primary" />
          <Chip icon={<ShippingIcon />} label="Categorías B, C, D" color="secondary" />
        </Box>
      </Box>

      {/* Search Form */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f5f5f5 0%, #e3f2fd 100%)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Buscar productos"
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: iPhone 15, laptop gaming, zapatos deportivos..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <Tooltip title="Limpiar búsqueda">
                          <Button
                            size="small"
                            onClick={() => setSearchQuery('')}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            <ClearIcon />
                          </Button>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={category}
                    label="Categoría"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? 'primary' : 'inherit'}
                >
                  Filtros
                </Button>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                    }
                  }}
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </Grid>
            </Grid>

            {/* Filtros avanzados */}
            {showFilters && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  Filtros Avanzados
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Precio mínimo"
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({...prev, min: e.target.value}))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Precio máximo"
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({...prev, max: e.target.value}))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={clearFilters} startIcon={<ClearIcon />}>
                    Limpiar Filtros
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* Búsquedas populares */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Búsquedas populares:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {popularSearches.map((search) => (
                <Chip
                  key={search}
                  label={search}
                  variant="outlined"
                  size="small"
                  clickable
                  onClick={() => setSearchQuery(search)}
                  sx={{ '&:hover': { bgcolor: 'primary.50' } }}
                />
              ))}
              <Chip
                label="🔥 Trending"
                variant="filled"
                size="small"
                color="secondary"
                clickable
                onClick={loadTrendingProducts}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results Header */}
      {products.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" fontWeight="medium">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos destacados'}
            <Chip label={`${products.length} productos`} sx={{ ml: 2 }} />
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={loadTrendingProducts}>
              Ver Trending
            </Button>
            <Button variant="outlined" size="small" onClick={clearFilters}>
              Limpiar Todo
            </Button>
          </Box>
        </Box>
      )}

      {/* Products Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={220} />
                <CardContent>
                  <Skeleton variant="text" width="100%" height={24} />
                  <Skeleton variant="text" width="70%" height={20} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Skeleton variant="text" width="40%" height={28} />
                    <Skeleton variant="rectangular" width={60} height={24} />
                  </Box>
                  <Skeleton variant="rectangular" width="100%" height={36} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.asin}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <Paper sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50' }}>
          <SearchIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {searchQuery ? 'No se encontraron productos' : 'Comienza tu búsqueda'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? 'Intenta con otros términos de búsqueda o explora nuestros productos trending'
              : 'Ingresa un término de búsqueda o explora nuestros productos destacados'
            }
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              size="large"
              onClick={loadTrendingProducts}
              startIcon={<StarIcon />}
            >
              Ver Productos Destacados
            </Button>
          )}
        </Paper>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Fab
          color="secondary"
          aria-label="cart"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={() => console.log('Ir al carrito')}
        >
          <Badge badgeContent={cart.reduce((total, item) => total + item.quantity, 0)} color="error">
            <AddToCartIcon />
          </Badge>
        </Fab>
      )}

      {/* Product Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
      >
        {selectedProduct && (
          <>
            <DialogTitle sx={{ pb: 1, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
              <Typography variant="h5" component="div" fontWeight="bold">
                📱 Detalles del Producto
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                ASIN: {selectedProduct.asin} • Categoría: {selectedProduct.category}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Grid container>
                <Grid item xs={12} md={5}>
                  <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <img
                      src={selectedProduct.image_url || 'https://via.placeholder.com/400x400'}
                      alt={selectedProduct.title}
                      style={{
                        width: '100%',
                        maxWidth: 300,
                        height: 'auto',
                        borderRadius: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom fontWeight="medium">
                      {selectedProduct.title}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold" gutterBottom>
                        {formatCurrency(selectedProduct.price)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        {selectedProduct.weight && (
                          <Chip
                            label={`⚖️ ${formatWeight(selectedProduct.weight)}`}
                            variant="outlined"
                          />
                        )}
                        <Chip
                          label={getSenaeCategoryName(selectedProduct.senae_category)}
                          color="primary"
                        />
                        {selectedProduct.availability && (
                          <Chip
                            label="✅ Disponible"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    {selectedProduct.description && (
                      <Typography variant="body1" paragraph color="text.secondary">
                        {selectedProduct.description}
                      </Typography>
                    )}

                    {selectedProduct.calculated_tariff && (
                      <TariffDetailsAccordion calculation={selectedProduct.calculated_tariff} />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Button onClick={handleCloseDetails} size="large">
                Cerrar
              </Button>
              <Button
                variant="contained"
                startIcon={<AddToCartIcon />}
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  handleCloseDetails();
                }}
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #dc004e 0%, #ff5983 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9a0036 0%, #dc004e 100%)',
                  }
                }}
              >
                Agregar al Carrito
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default ProductSearch;