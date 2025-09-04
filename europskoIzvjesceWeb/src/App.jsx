import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FullForm from './pages/FullForm';  // ← obavezno import!
import OdabirForm from './pages/OdabirForm';
import FinalnaPotvrdaFormWrapper from './components/FinalnaPotvrdaFormWrapper';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/odabir" element={<OdabirForm />} />
      <Route path="/izvjesce" element={<FullForm />} />
      <Route path="/slanjePotvrde" element={<FinalnaPotvrdaFormWrapper/>} />
    </Routes>
  );
}
