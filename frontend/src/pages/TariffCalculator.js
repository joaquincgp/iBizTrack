import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Tooltip,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  MonetizationOn as MoneyIcon,
  Scale as WeightIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Clear as ClearIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { formatCurrency, formatWeight } from '../services/api';

const TariffCalculator = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    category: '',
    value: '',
    weight: '',
    productType: 'general',
    importationsCount: 1,
    description: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const steps = ['Información del Producto', 'Categoría SENAE', 'Resultado'];

  const categories = [
    {
      value: 'B',
      label: 'Categoría B - Hasta 4kg y $400',
      description: 'Productos pequeños y económicos',
      limits: { weight: 4, value: 400 },
      icon: '📦',
      color: 'primary'
    },
    {
      value: 'C',
      label: 'Categoría C - Hasta 50kg y $2,000',
      description: 'Productos medianos y de valor medio',
      limits: { weight: 50, value: 2000 },
      icon: '📋',
      color: 'warning'
    },
    {
      value: 'D',
      label: 'Categoría D - Textiles hasta 20kg y $2,000',
      description: 'Solo para textiles y calzado',
      limits: { weight: 20, value: 2000 },
      icon: '👕',
      color: 'secondary'
    }
  ];

  const productTypes = [
    { value: 'general', label: '🔧 General', category: ['B', 'C'] },
    { value: 'textiles', label: '👕 Textiles', category: ['D'] },
    { value: 'calzado', label: '👟 Calzado', category: ['D'] },
    { value: 'electronics', label: '📱 Electrónicos', category: ['B', 'C'] },
    { value: 'clothing', label: '👔 Ropa', category: ['D'] },
    { value: 'home', label: '🏠 Hogar', category: ['C'] }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar errores al cambiar valores
    if (error) setError(null);

    // Auto-sugerir categoría basada en valores
    if (name === 'value' || name === 'weight') {
      suggestCategory(
        name === 'value' ? parseFloat(value) || 0 : parseFloat(formData.value) || 0,
        name === 'weight' ? parseFloat(value) || 0 : parseFloat(formData.weight) || 0
      );
    }
  };

  const suggestCategory = (value, weight) => {
    if (!value || !weight) return;

    // Auto-sugerir categoría basada en límites
    if (weight <= 4 && value <= 400) {
      if (!formData.category) {
        setFormData(prev => ({ ...prev, category: 'B' }));
      }
    } else if (weight <= 50 && value <= 2000) {
      if (formData.category !== 'C' && formData.category !== 'D') {
        setFormData(prev => ({ ...prev, category: 'C' }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.category || !formData.value || !formData.weight) {
      setError('Por favor completa todos los campos obligatorios');
      return false;
    }

    const value = parseFloat(formData.value);
    const weight = parseFloat(formData.weight);
    const importationsCount = parseInt(formData.importationsCount);

    if (value <= 0 || weight <= 0) {
      setError('El valor y peso deben ser mayores a 0');
      return false;
    }

    const selectedCategory = categories.find(cat => cat.value === formData.category);
    if (selectedCategory) {
      if (weight > selectedCategory.limits.weight || value > selectedCategory.limits.value) {
        setError(`${selectedCategory.label}: Máximo ${selectedCategory.limits.weight}kg y $${selectedCategory.limits.value}`);
        return false;
      }
    }

    if (formData.category === 'B' && importationsCount > 12) {
      setError('Categoría B: Máximo 12 importaciones anuales');
      return false;
    }

    return true;
  };

  const calculateTariff = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const value = parseFloat(formData.value);
      const weight = parseFloat(formData.weight);
      const importationsCount = parseInt(formData.importationsCount);

      // Simular cálculo de tarifas según categoría
      let calculation = {};

      if (formData.category === 'B') {
        const tariff = 42.0;
        let annualLimit = importationsCount <= 5 ? 1200 : 2400;

        calculation = {
          category: 'B',
          base_value: value,
          weight: weight,
          tariff: tariff,
          iva: 0,
          fodinfa: 0,
          adv: 0,
          total_taxes: tariff,
          total_cost: value + tariff,
          importations_count: importationsCount,
          annual_limit: annualLimit,
          free_of_tributes: true,
          savings: (value * 0.12) + (value * 0.005) // Ahorro vs otras categorías
        };
      } else if (formData.category === 'C') {
        const tariffRate = 0.10;
        const tariff = value * tariffRate;
        const ivaRate = 0.12;
        const iva = (value + tariff) * ivaRate;
        const fodinfarate = 0.005;
        const fodinfa = value * fodinfarate;
        const totalTaxes = tariff + iva + fodinfa;

        calculation = {
          category: 'C',
          base_value: value,
          weight: weight,
          tariff: tariff,
          tariff_rate: tariffRate,
          iva: iva,
          iva_rate: ivaRate,
          fodinfa: fodinfa,
          fodinfa_rate: fodinfarate,
          adv: 0,
          total_taxes: totalTaxes,
          total_cost: value + totalTaxes,
          requires_control_document: true,
          tax_breakdown: {
            tariff_percentage: (tariff / totalTaxes) * 100,
            iva_percentage: (iva / totalTaxes) * 100,
            fodinfa_percentage: (fodinfa / totalTaxes) * 100
          }
        };
      } else if (formData.category === 'D') {
        const advRate = 0.10;
        const adv = value * advRate;

        let specificTariff = 0;
        if (formData.productType === 'textiles' || formData.productType === 'clothing') {
          specificTariff = 5.5 * weight;
        } else if (formData.productType === 'calzado') {
          const pairs = Math.max(1, Math.floor(weight));
          specificTariff = 6.0 * pairs;
        } else {
          specificTariff = 5.5 * weight;
        }

        const totalTariff = adv + specificTariff;
        const ivaRate = 0.12;
        const iva = (value + totalTariff) * ivaRate;
        const fodinfarate = 0.005;
        const fodinfa = value * fodinfarate;
        const totalTaxes = totalTariff + iva + fodinfa;

        calculation = {
          category: 'D',
          base_value: value,
          weight: weight,
          product_type: formData.productType,
          adv: adv,
          adv_rate: advRate,
          specific_tariff: specificTariff,
          total_tariff: totalTariff,
          iva: iva,
          iva_rate: ivaRate,
          fodinfa: fodinfa,
          fodinfa_rate: fodinfarate,
          total_taxes: totalTaxes,
          total_cost: value + totalTaxes,
          requires_inen: value > 500,
          inen_exemption_limit: 500,
          tax_breakdown: {
            adv_percentage: (adv / totalTaxes) * 100,
            specific_percentage: (specificTariff / totalTaxes) * 100,
            iva_percentage: (iva / totalTaxes) * 100,
            fodinfa_percentage: (fodinfa / totalTaxes) * 100
          }
        };
      }

      setResult(calculation);
      setActiveStep(2);
    } catch (err) {
      setError('Error en el cálculo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetCalculator = () => {
    setFormData({
      category: '',
      value: '',
      weight: '',
      productType: 'general',
      importationsCount: 1,
      description: ''
    });
    setResult(null);
    setError(null);
    setActiveStep(0);
  };

  const getCategoryProgress = () => {
    if (!formData.category || !formData.value || !formData.weight) return 0;

    const selectedCategory = categories.find(cat => cat.value === formData.category);
    if (!selectedCategory) return 0;

    const valueProgress = (parseFloat(formData.value) / selectedCategory.limits.value) * 100;
    const weightProgress = (parseFloat(formData.weight) / selectedCategory.limits.weight) * 100;

    return Math.max(valueProgress, weightProgress);
  };

  const CategoryCard = ({ category }) => (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: formData.category === category.value ? 2 : 1,
        borderColor: formData.category === category.value ? `${category.color}.main` : 'divider',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          borderColor: `${category.color}.main`
        }
      }}
      onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Avatar sx={{
          bgcolor: `${category.color}.main`,
          width: 56,
          height: 56,
          fontSize: '2rem',
          mx: 'auto',
          mb: 2
        }}>
          {category.icon}
        </Avatar>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Categoría {category.value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {category.description}
        </Typography>
        <Chip
          label={`Hasta ${category.limits.weight}kg y $${category.limits.value}`}
          color={category.color}
          variant="outlined"
          size="small"
        />
      </CardContent>
    </Card>
  );

  const TaxBreakdownChart = ({ breakdown, totalTaxes }) => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        📊 Desglose de Impuestos
      </Typography>
      {Object.entries(breakdown || {}).map(([key, percentage]) => (
        <Box key={key} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {key.replace('_percentage', '').toUpperCase()}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {percentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{ height: 8, borderRadius: 4 }}
            color={key.includes('iva') ? 'warning' : key.includes('tariff') ? 'primary' : 'secondary'}
          />
        </Box>
      ))}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🧮 Calculadora de Tarifas SENAE
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Calcula impuestos y tarifas de importación según las categorías SENAE del Ecuador
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip icon={<BankIcon />} label="Cálculos Oficiales SENAE" color="primary" />
          <Chip icon={<ReceiptIcon />} label="IVA, FODINFA, ADV" color="secondary" />
          <Chip icon={<CheckIcon />} label="Categorías B, C, D" color="success" />
        </Box>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)} icon={<WarningIcon />}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Calculator Form */}
        <Grid item xs={12} md={8}>
          {activeStep === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon color="primary" />
                  Información del Producto
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="description"
                      label="Descripción del producto (opcional)"
                      multiline
                      rows={2}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Ej: iPhone 15 Pro Max, Zapatos Nike Air Max, Camiseta de algodón..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            📝
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      name="value"
                      label="Valor del Producto"
                      type="number"
                      value={formData.value}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: <InputAdornment position="end">USD</InputAdornment>
                      }}
                      placeholder="0.00"
                      helperText="Precio en dólares americanos"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      name="weight"
                      label="Peso del Producto"
                      type="number"
                      value={formData.weight}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WeightIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: <InputAdornment position="end">kg</InputAdornment>
                      }}
                      placeholder="0.00"
                      helperText="Peso en kilogramos"
                    />
                  </Grid>

                  {/* Progress indicator */}
                  {formData.value && formData.weight && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="info.main" gutterBottom>
                          📊 Progreso hacia límites de categoría:
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(getCategoryProgress(), 100)}
                          color={getCategoryProgress() > 80 ? 'warning' : 'primary'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {getCategoryProgress().toFixed(1)}% del límite de la categoría seleccionada
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button variant="outlined" onClick={resetCalculator} startIcon={<ClearIcon />}>
                        Limpiar Todo
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(1)}
                        disabled={!formData.value || !formData.weight}
                        size="large"
                      >
                        Siguiente: Seleccionar Categoría
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeStep === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BankIcon color="primary" />
                  Seleccionar Categoría SENAE
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {categories.map((category) => (
                    <Grid item xs={12} sm={4} key={category.value}>
                      <CategoryCard category={category} />
                    </Grid>
                  ))}
                </Grid>

                {formData.category && (
                  <Box sx={{ mt: 3 }}>
                    {formData.category === 'D' && (
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Tipo de Producto</InputLabel>
                        <Select
                          name="productType"
                          value={formData.productType}
                          label="Tipo de Producto"
                          onChange={handleInputChange}
                        >
                          {productTypes
                            .filter(type => type.category.includes('D'))
                            .map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    )}

                    {formData.category === 'B' && (
                      <TextField
                        fullWidth
                        name="importationsCount"
                        label="Número de Importaciones en el Año"
                        type="number"
                        value={formData.importationsCount}
                        onChange={handleInputChange}
                        inputProps={{ min: 1, max: 12 }}
                        helperText="Máximo 12 importaciones por año para Categoría B"
                        sx={{ mb: 3 }}
                      />
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button variant="outlined" onClick={() => setActiveStep(0)}>
                        Anterior
                      </Button>
                      <Button
                        variant="contained"
                        onClick={calculateTariff}
                        disabled={!formData.category || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
                        size="large"
                        sx={{
                          background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                          }
                        }}
                      >
                        {loading ? 'Calculando...' : 'Calcular Tarifas'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {activeStep === 2 && result && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="success" />
                  Resultado del Cálculo
                </Typography>

                {/* Resultado principal */}
                <Paper sx={{
                  p: 3,
                  mb: 3,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                  border: '2px solid',
                  borderColor: 'success.main'
                }}>
                  <Typography variant="h3" color="success.main" fontWeight="bold" gutterBottom>
                    {formatCurrency(result.total_cost)}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    💰 Costo Total (Producto + Impuestos SENAE)
                  </Typography>
                  {result.savings && (
                    <Chip
                      label={`Ahorras ${formatCurrency(result.savings)} vs otras categorías`}
                      color="success"
                      sx={{ mt: 2, fontWeight: 'bold' }}
                    />
                  )}
                </Paper>

                {/* Desglose detallado */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      📋 Información Base
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        <strong>Categoría SENAE:</strong> {result.category}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Valor del Producto:</strong> {formatCurrency(result.base_value)}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Peso:</strong> {formatWeight(result.weight)}
                      </Typography>
                      {result.product_type && result.product_type !== 'general' && (
                        <Typography variant="body1">
                          <strong>Tipo:</strong> {result.product_type}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      💸 Desglose de Impuestos
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {result.tariff !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Arancel:</Typography>
                          <Typography fontWeight="bold">{formatCurrency(result.tariff)}</Typography>
                        </Box>
                      )}

                      {result.total_tariff !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Arancel Total:</Typography>
                          <Typography fontWeight="bold">{formatCurrency(result.total_tariff)}</Typography>
                        </Box>
                      )}

                      {result.adv !== undefined && result.adv > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>ADV (10%):</Typography>
                          <Typography fontWeight="bold">{formatCurrency(result.adv)}</Typography>
                        </Box>
                      )}

                      {result.specific_tariff !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Tarifa Específica:</Typography>
                          <Typography fontWeight="bold">{formatCurrency(result.specific_tariff)}</Typography>
                        </Box>
                      )}

                      {result.iva !== undefined && result.iva > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>IVA (12%):</Typography>
                          <Typography fontWeight="bold">{formatCurrency(result.iva)}</Typography>
                        </Box>
                      )}

                      {result.fodinfa !== undefined && result.fodinfa > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>FODINFA (0.5%):</Typography>
                          <Typography fontWeight="bold">{formatCurrency(result.fodinfa)}</Typography>
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight="bold">Total Impuestos:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(result.total_taxes)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Gráfico de desglose */}
                  {result.tax_breakdown && (
                    <Grid item xs={12}>
                      <TaxBreakdownChart breakdown={result.tax_breakdown} totalTaxes={result.total_taxes} />
                    </Grid>
                  )}

                  {/* Alertas y requisitos */}
                  <Grid item xs={12}>
                    <Box sx={{ mt: 3 }}>
                      {result.free_of_tributes && (
                        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />}>
                          ✅ Este producto está libre de tributos adicionales (Categoría B)
                        </Alert>
                      )}

                      {result.requires_inen && (
                        <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
                          ⚠️ Requiere certificación INEN (productos sobre $500 en Categoría D)
                        </Alert>
                      )}

                      {result.requires_control_document && (
                        <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
                          📋 Requiere Documento de Control Previo (Categoría C)
                        </Alert>
                      )}

                      {result.annual_limit && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          📊 Límite anual Categoría B: {formatCurrency(result.annual_limit)}
                          para {result.importations_count} importaciones
                        </Alert>
                      )}
                    </Box>
                  </Grid>

                  {/* Acciones */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setActiveStep(1)}
                        startIcon={<CalculateIcon />}
                      >
                        Recalcular
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={resetCalculator}
                        startIcon={<ClearIcon />}
                      >
                        Nuevo Cálculo
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => window.print()}
                        startIcon={<ReceiptIcon />}
                      >
                        Imprimir Resultado
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Empty state cuando no hay resultado */}
          {!result && activeStep === 2 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <CalculateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Completa el formulario para ver el resultado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ingresa los datos del producto y selecciona una categoría SENAE
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar with Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HelpIcon color="primary" />
                Información sobre Categorías SENAE
              </Typography>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    📦 Categoría B
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    <strong>Límites:</strong> Hasta 4 kg y $400 USD
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Importaciones:</strong><br/>
                    • Hasta 5: $1,200 por destinatario/año<br/>
                    • Hasta 12: $2,400 por remitente migrante/año
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Costo:</strong> Arancel fijo de $42 por importación
                  </Typography>
                  <Typography variant="body2">
                    <strong>Beneficio:</strong> Libre de IVA, FODINFA y otros tributos
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                    📋 Categoría C
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    <strong>Límites:</strong> Hasta 50 kg y $2,000 USD
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Impuestos:</strong><br/>
                    • Arancel: Variable según producto<br/>
                    • IVA: 12%<br/>
                    • FODINFA: 0.5%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Requisito:</strong> Documento de Control Previo (excepto INEN)
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">
                    👕 Categoría D
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    <strong>Límites:</strong> Hasta 20 kg y $2,000 USD
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Solo para:</strong> Textiles, prendas de vestir y calzado
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Impuestos:</strong><br/>
                    • ADV: 10%<br/>
                    • Textiles: $5.5 por kg<br/>
                    • Calzado: $6 por par<br/>
                    • IVA: 12%<br/>
                    • FODINFA: 0.5%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Requisito:</strong> INEN (excepto primera vez hasta $500)
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                <Typography variant="body2" color="info.main" align="center">
                  💡 <strong>Consejo:</strong> La categoría B es la más económica para productos pequeños y de bajo valor.
                </Typography>
              </Box>

              {/* Quick calculation examples */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  📊 Ejemplos Rápidos
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="primary" fontWeight="bold">
                    iPhone ($300, 0.2kg) → Categoría B
                  </Typography>
                  <Typography variant="body2">
                    Total: $342 (solo $42 de arancel)
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="warning.main" fontWeight="bold">
                    Laptop ($800, 2kg) → Categoría C
                  </Typography>
                  <Typography variant="body2">
                    Total: ~$970 (con IVA y FODINFA)
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="secondary.main" fontWeight="bold">
                    Zapatillas ($120, 0.8kg) → Categoría D
                  </Typography>
                  <Typography variant="body2">
                    Total: ~$155 (con ADV y tarifa específica)
                  </Typography>
                </Box>
              </Box>

              {/* Contact info */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                  📞 ¿Necesitas ayuda?
                </Typography>
                <Typography variant="body2">
                  Contacta a iBusiness Ecuador para asesoría personalizada en importaciones.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => window.open('mailto:info@ibusiness.com.ec')}
                >
                  Contactar Soporte
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Information Section */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            Información Importante sobre SENAE
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  📋 Documentos Requeridos
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • Factura comercial<br/>
                  • Lista de empaque<br/>
                  • Documento de transporte<br/>
                  • Certificaciones (según categoría)
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  ⏱️ Tiempos de Procesamiento
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • Categoría B: 2-3 días hábiles<br/>
                  • Categoría C: 5-7 días hábiles<br/>
                  • Categoría D: 7-10 días hábiles<br/>
                  • Con INEN: +3-5 días adicionales
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  💡 Consejos para Ahorrar
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  • Mantente en los límites de categoría B<br/>
                  • Agrupa compras para optimizar envíos<br/>
                  • Verifica exenciones disponibles<br/>
                  • Planifica las 12 importaciones anuales
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Footer disclaimer */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Disclaimer:</strong> Los cálculos son estimaciones basadas en las tarifas oficiales de SENAE Ecuador.
          Las tarifas finales pueden variar según el producto específico y regulaciones vigentes.
          Consulta siempre con un especialista en comercio exterior para casos específicos.
        </Typography>
      </Box>
    </Container>
  );
};

export default TariffCalculator;