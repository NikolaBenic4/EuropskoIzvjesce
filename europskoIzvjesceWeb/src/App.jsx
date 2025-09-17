import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FullForm from './pages/FullForm';
import OdabirForm from './pages/OdabirForm';
import FinalnaPotvrdaWrapper from './components/FinalnaPotvrdaFormWrapper';
// Nemoj importati FinalnaPotvrdaSingleForm, FinalnaPotvrdaDoubleForm ovdje

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/odabir" element={<OdabirForm />} />
      <Route path="/izvjesce" element={<FullForm />} />
      <Route path="/slanjePotvrde/single" element={<FinalnaPotvrdaWrapper />} />
      <Route path="/slanjePotvrde/double" element={<FinalnaPotvrdaWrapper />} />
    </Routes>
  );
}
