import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import PrijavaOsiguranje from './pages/PrijavaOsiguranje';
import Home from './pages/Home';
import OdabirForm from './pages/OdabirForm';
import FullForm from './pages/FullForm';
import FinalnaPotvrdaWrapper from './components/FinalnaPotvrdaFormWrapper';
import Sidebar from './components/Sidebar';
import ZahtjeviLista from './components/ZahtjeviLista';
import ZahtjevDetalji from './components/ZahtjevDetalji';
import MailCenter from './components/MailCenter';
import './css/Dashboard.css';

export default function App() {
  const [auth, setAuth] = useState({ apiKey: null, companyName: null });

  useEffect(() => {
    const apiKey = localStorage.getItem('apiKey');
    const companyName = localStorage.getItem('companyName');
    setAuth({ apiKey, companyName });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('companyName');
    setAuth({ apiKey: null, companyName: null });
  };

  function DashboardLayout() {
    if (!auth.apiKey) {
      return <Navigate to="/login" replace />;
    }
    return (
      <div className="dashboard-container">
        <Sidebar onLogout={handleLogout} companyName={auth.companyName} />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/odabir" element={<OdabirForm />} />
      <Route path="/izvjesce" element={<FullForm />} />
      <Route path="/slanjePotvrde/single" element={<FinalnaPotvrdaWrapper />} />
      <Route path="/slanjePotvrde/double" element={<FinalnaPotvrdaWrapper />} />
      <Route path="/login" element={<PrijavaOsiguranje />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<ZahtjeviLista status="open" />} />
        <Route path="otvoreni" element={<ZahtjeviLista status="open" />} />
        <Route path="zatvoreni" element={<ZahtjeviLista status="closed" />} />
        <Route path="zahtjev/:id" element={<ZahtjevDetalji />} />
        <Route path="mail" element={<MailCenter />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
