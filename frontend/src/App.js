// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ProductSearch from './pages/ProductSearch';
import OrderManagement from './pages/OrderManagement';
import TariffCalculator from './pages/TariffCalculator';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductSearch />} />
        <Route path="/orders" element={<OrderManagement />} />
        <Route path="/calculator" element={<TariffCalculator />} />
      </Routes>
    </Router>
  );
}

export default App;
