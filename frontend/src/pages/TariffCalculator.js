import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  Chip,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  AccountBalance as BankIcon,
  MonetizationOn as MoneyIcon,
  Scale as WeightIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { formatCurrency, formatWeight } from '../services/api';

const TariffCalculator = () => {
  const [formData, setFormData] = useState({
    productValue: '',
    weight: '',
    senaeCategory: '',
    productType: 'general',
    importationsCount: 1
  });
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Información del Producto', 'Cálculo de Tarifas', 'Resultado Final'];

  const senaeCategories = [
    { value: 'B', label: 'Categoría B', description: 'Paquetes hasta 4 Kg y US$ 400' },
    { value: 'C', label: 'Categoría C', description: 'Paquetes hasta 50 kg y US$ 2,000' },
    { value: 'D', label: 'Categoría D', description: 'Textiles y calzado hasta 20 kg y US$ 2,000' }
  ];

  const productTypes = [
    { value: 'general', label: 'General' },
    { value: 'textiles', label: 'Textiles' },
    { value: 'calzado', label: 'Calzado' },
    { value: 'electronics', label: 'Electrónicos' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar cálculo anterior cuando se cambien los datos
    if (calculation) {
      setCalculation(null);
      setActiveStep(0);
    }
  };

  const validateForm = () => {
    const { productValue, weight, senaeCategory } = formData;

    if (!productValue || parseFloat(productValue) <= 0) {
      setError('El valor del producto debe ser mayor a 0');
      return false;
    }

    if (!weight || parseFloat(weight) <= 0) {
      setError('El peso debe ser mayor a 0');
      return false;
    }

    if (!senaeCategory) {
      setError('Debes seleccionar una categoría SENAE');
      return false;
    }

    // Validaciones específicas por categoría
    const value = parseFloat(productValue);
    const weightKg = parseFloat(weight);

    if (senaeCategory === 'B' && (value > 400 || weightKg > 4)) {
      setError('Categoría B: máximo $400 y 4kg');
      return false;
    }

    if (senaeCategory === 'C' && (value > 2000 || weightKg > 50)) {
      setError('Categoría C: máximo $2,000 y 50kg');
      return false;
    }

    if (senaeCategory === 'D' && (value > 2000 || weightKg > 20)) {
      setError('Categoría D: máximo $2,000 y 20kg');
      return false;
    }

    return true;
  };

  const calculateTariff = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      setActiveStep(1);

      const { productValue, weight, senaeCategory, productType, importationsCount } = formData;

      // Simular cálculo de tarifas SENAE
      const result = await simulateSenaeCalculation({
        value: parseFloat(productValue),
        weight: parseFloat(weight),
        category: senaeCategory,
        productType,
        importationsCount: parseInt(importationsCount)
      });

      setCalculation(result);
      setActiveStep(2);

    } catch (err) {
      setError(err.message);
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const simulateSenaeCalculation = async (params) => {
    // Simular llamada a API de cálculo
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { value, weight, category, productType, importationsCount } = params;

    if (category === 'B') {
      return calculateCategoryB(value, weight, importationsCount);
    } else if (category === 'C') {
      return calculateCategoryC(value, weight);
    } else if (category === 'D') {
      return calculateCategoryD(value, weight, productType);
    }
  };

  const calculateCategoryB = (value, weight, importationsCount) => {
    const tariff = 42.0;
    const annualLimit = importationsCount <= 5 ? 1200 : 2400;

    return {
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
      details: {
        tariff_description: 'Arancel fijo de $42',
        iva_description: 'Libre de IVA',
        benefits: ['Libre de tributos adicionales', 'Proceso simplificado']
      }
    };
  };

  const calculateCategoryC = (value, weight) => {
    const tariffRate = 0.10;
    const tariff = value * tariffRate;
    const ivaRate = 0.12;
    const iva = (value + tariff) * ivaRate;
    const fodinfaRate = 0.005;
    const fodinfa = value * fodinfaRate;
    const totalTaxes = tariff + iva + fodinfa;

    return {
      category: 'C',
      base_value: value,
      weight: weight,
      tariff: tariff,
      tariff_rate: tariffRate,
      iva: iva,
      iva_rate: ivaRate,
      fodinfa: fodinfa,
      fodinfa_rate: fodinfaRate,
      adv: 0,
      total_taxes: totalTaxes,
      total_cost: value + totalTaxes,
      requires_control_document: true,
      details: {
        tariff_description: `Arancel ${(tariffRate * 100).toFixed(0)}% sobre valor`,
        iva_description: `IVA ${(ivaRate * 100).toFixed(0)}% sobre (valor + arancel)`,
        fodinfa_description: `FODINFA ${(fodinfaRate * 100).toFixed(1)}% sobre valor`
      }
    };
  };

  const calculateCategoryD = (value, weight, productType) => {
    const advRate = 0.10;
    const adv = value * advRate;
    const specificTariff = productType === 'calzado' ? 6.0 * Math.max(1, Math.floor(weight)) : 5.5 * weight;
    const totalTariff = adv + specificTariff;
    const ivaRate = 0.12;
    const iva = (value + totalTariff) * ivaRate;
    const fodinfaRate = 0.005;
    const fodinfa = value * fodinfaRate;
    const totalTaxes = totalTariff + iva + fodinfa;

    return {
      category: 'D',
      base_value: value,
      weight: weight,
      product_type: productType,
      adv: adv,
      adv_rate: advRate,
      specific_tariff: specificTariff,
      total_tariff: totalTariff,
      iva: iva,
      iva_rate: ivaRate,
      fodinfa: fodinfa,
      fodinfa_rate: fodinfaRate,
      total_taxes: totalTaxes,
      total_cost: value + totalTaxes,
      requires_inen: value > 500,
      inen_exemption_limit: 500,
      details: {
        adv_description: `ADV ${(advRate * 100).toFixed(0)}% sobre valor`,
        specific_description: productType === 'calzado' ?
          `$6 por par (${Math.max(1, Math.floor(weight))} pares estimados)` :
          `$5.5 por kg (${weight.toFixed(2)} kg)`,
        iva_description: `IVA ${(ivaRate * 100).toFixed(0)}% sobre (valor + arancel total)`,
        fodinfa_description: `FODINFA ${(fodinfaRate * 100).toFixed(1)}% sobre valor`
      }
    };
  };

  const resetCalculator = () => {
    setFormData({
      productValue: '',
      weight: '',
      senaeCategory: '',
      productType: 'general',
      importationsCount: 1
    });
    setCalculation(null);
    setError(null);
    setActiveStep(0);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'B': 'primary',
      'C': 'warning',
      'D': 'error'
    };
    return colors[category] || 'default';
  };

  const CategoryInfoCard = ({ category }) => {
    const categoryInfo = {
      'B': {
        title: 'Categoría B - Régimen Simplificado',
        limits: 'Hasta $400 y 4kg',
        benefits: ['Arancel fijo de $42', 'Libre de otros tributos', 'Proceso rápido'],
        restrictions: ['Máximo 5-12 importaciones/año', 'Límite anual $1,200-$2,400']
      },
      'C': {
        title: 'Categoría C - Régimen General',
        limits: 'Hasta $2,000 y 50kg',
        benefits: ['Mayor variedad de productos', 'Sin límite de importaciones'],
        restrictions: ['Requiere documento de control', 'Aranceles variables', 'IVA y FODINFA aplicables']
      },
      'D': {
        title: 'Categoría D - Textiles y Calzado',
        limits: 'Hasta $2,000 y 20kg',
        benefits: ['Especializado para textiles/calzado'],
        restrictions: ['Requiere INEN (>$500)', 'ADV 10%', 'Tarifa específica por kg/par']
      }
    };

    const info = categoryInfo[category];
    if (!info) return null;

    return (
      <Card sx={{ mb: 2, border: '2px solid', borderColor: `${getCategoryColor(category)}.main` }}>
        <CardContent>
          <Typography variant="h6" color={`${getCategoryColor(category)}.main`} gutterBottom>
            {info.title}
          </Typography>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            📏 Límites: {info.limits}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="success.main" gutterBottom>
              ✅ Beneficios:
            </Typography>
            {info.benefits.map((benefit, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                • {benefit}
              </Typography>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="warning.main" gutterBottom>
              ⚠️ Restricciones:
            </Typography>
            {info.restrictions.map((restriction, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                • {restriction}
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const CalculationDetails = ({ calculation }) => {
    if (!calculation) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.50', border: '2px solid', borderColor: 'success.main' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              💰 Costo Total Final
            </Typography>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {formatCurrency(calculation.total_cost)}
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Incluye producto + todos los impuestos SENAE
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  Información Base
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Categoría SENAE:</strong></TableCell>
                        <TableCell>
                          <Chip
                            label={`Categoría ${calculation.category}`}
                            color={getCategoryColor(calculation.category)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Valor del Producto:</strong></TableCell>
                        <TableCell>{formatCurrency(calculation.base_value)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Peso:</strong></TableCell>
                        <TableCell>{formatWeight(calculation.weight)}</TableCell>
                      </TableRow>
                      {calculation.product_type && (
                        <TableRow>
                          <TableCell><strong>Tipo de Producto:</strong></TableCell>
                          <TableCell>{calculation.product_type}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateIcon color="secondary" />
                  Desglose de Impuestos
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {calculation.tariff !== undefined && (
                        <TableRow>
                          <TableCell><strong>Arancel:</strong></TableCell>
                          <TableCell>{formatCurrency(calculation.tariff)}</TableCell>
                        </TableRow>
                      )}
                      {calculation.total_tariff !== undefined && calculation.tariff === undefined && (
                        <TableRow>
                          <TableCell><strong>Arancel Total:</strong></TableCell>
                          <TableCell>{formatCurrency(calculation.total_tariff)}</TableCell>
                        </TableRow>
                      )}
                      {calculation.adv !== undefined && (
                        <TableRow>
                          <TableCell><strong>ADV (10%):</strong></TableCell>
                          <TableCell>{formatCurrency(calculation.adv)}</TableCell>
                        </TableRow>
                      )}
                      {calculation.specific_tariff !== undefined && (
                        <TableRow>
                          <TableCell><strong>Tarifa Específica:</strong></TableCell>
                          <TableCell>{formatCurrency(calculation.specific_tariff)}</TableCell>
                        </TableRow>
                      )}
                      {calculation.iva !== undefined && (
                        <TableRow>
                          <TableCell><strong>IVA (12%):</strong></TableCell>
                          <TableCell>{formatCurrency(calculation.iva)}</TableCell>
                        </TableRow>
                      )}
                      {calculation.fodinfa !== undefined && (
                        <TableRow>
                          <TableCell><strong>FODINFA (0.5%):</strong></TableCell>
                          <TableCell>{formatCurrency(calculation.fodinfa)}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">📋 Explicación Detallada</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {calculation.details && Object.entries(calculation.details).map(([key, value]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>{key.replace('_', ' ').toUpperCase()}:</strong> {value}
                        </Typography>
                      </Alert>
                    </Grid>
                  ))}
                </Grid>

                {calculation.free_of_tributes && (
                  <Alert severity="success" sx={{ mt: 2 }} icon={<CheckIcon />}>
                    ✅ Este producto está libre de tributos adicionales
                  </Alert>
                )}

                {calculation.requires_inen && (
                  <Alert severity="warning" sx={{ mt: 1 }} icon={<WarningIcon />}>
                    ⚠️ Requiere certificación INEN (productos textiles/calzado >$500)
                  </Alert>
                )}

                {calculation.requires_control_document && (
                  <Alert severity="warning" sx={{ mt: 1 }} icon={<WarningIcon />}>
                    📋 Requiere Documento de Control Previo
                  </Alert>
                )}

                {calculation.annual_limit && (
                  <Alert severity="info" sx={{ mt: 1 }} icon={<InfoIcon />}>
                    📊 Límite anual categoría B: {formatCurrency(calculation.annual_limit)}
                    ({calculation.importations_count} importaciones usadas)
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🧮 Calculadora de Tarifas SENAE
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Calcula impuestos y tarifas oficiales para importaciones Ecuador
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip icon={<BankIcon />} label="Cálculos Oficiales SENAE" color="primary" />
          <Chip icon={<CategoryIcon />} label="Categorías B, C, D" color="secondary" />
        </Box>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon color="primary" />
                Datos del Producto
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Valor del Producto"
                    type="number"
                    value={formData.productValue}
                    onChange={(e) => handleInputChange('productValue', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="0.00"
                    helperText="Valor en dólares americanos"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Peso del Producto"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><WeightIcon /></InputAdornment>,
                      endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                    }}
                    placeholder="0.00"
                    helperText="Peso en kilogramos"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Categoría SENAE</InputLabel>
                    <Select
                      value={formData.senaeCategory}
                      label="Categoría SENAE"
                      onChange={(e) => handleInputChange('senaeCategory', e.target.value)}
                    >
                      {senaeCategories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {category.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {category.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Producto</InputLabel>
                    <Select
                      value={formData.productType}
                      label="Tipo de Producto"
                      onChange={(e) => handleInputChange('productType', e.target.value)}
                    >
                      {productTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {formData.senaeCategory === 'B' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Número de Importaciones"
                      type="number"
                      value={formData.importationsCount}
                      onChange={(e) => handleInputChange('importationsCount', e.target.value)}
                      inputProps={{ min: 1, max: 12 }}
                      helperText="Para determinar límite anual"
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={calculateTariff}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                        }
                      }}
                    >
                      {loading ? 'Calculando...' : 'Calcular Tarifas'}
                    </Button>

                    <Button
                      variant="outlined"
                      size="large"
                      onClick={resetCalculator}
                      disabled={loading}
                    >
                      Limpiar
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={6}>
          {formData.senaeCategory ? (
            <CategoryInfoCard category={formData.senaeCategory} />
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="text.secondary">
                  📋 Selecciona una categoría para ver información
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {senaeCategories.map((category) => (
                    <Button
                      key={category.value}
                      variant="outlined"
                      size="small"
                      onClick={() => handleInputChange('senaeCategory', category.value)}
                      sx={{ mr: 1, mb: 1 }}
                      color={getCategoryColor(category.value)}
                    >
                      {category.label}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Quick Examples */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 Ejemplos Rápidos
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setFormData({
                      productValue: '49.99',
                      weight: '0.34',
                      senaeCategory: 'B',
                      productType: 'electronics',
                      importationsCount: 1
                    });
                  }}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  📱 Echo Dot - $49.99, 0.34kg (Cat. B)
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setFormData({
                      productValue: '349.99',
                      weight: '0.25',
                      senaeCategory: 'C',
                      productType: 'electronics',
                      importationsCount: 1
                    });
                  }}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  🎧 Headphones - $349.99, 0.25kg (Cat. C)
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setFormData({
                      productValue: '89.99',
                      weight: '0.8',
                      senaeCategory: 'D',
                      productType: 'textiles',
                      importationsCount: 1
                    });
                  }}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  👕 Camiseta - $89.99, 0.8kg (Cat. D)
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        {calculation && (
          <Grid item xs={12}>
            <CalculationDetails calculation={calculation} />
          </Grid>
        )}
      </Grid>

      {/* Footer Info */}
      <Paper sx={{ mt: 4, p: 3, bgcolor: 'grey.50', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>iBizTrack</strong> - Calculadora oficial de tarifas SENAE Ecuador
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Los cálculos se basan en las regulaciones oficiales del SENAE Ecuador vigentes.
          Para casos específicos, consulte directamente con las autoridades aduaneras.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TariffCalculator;