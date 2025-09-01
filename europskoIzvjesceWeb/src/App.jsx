import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FullForm from './pages/FullForm';  // ← obavezno import!

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/izvjesce" element={<FullForm />} />
    </Routes>
  );
}
