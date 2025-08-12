// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import './css/App.css';
import './css/Naslovna.css';
import NesrecaForm from './pages/NesrecaForm';

function Home() {
  return (
    <div className="hero-section">
      <div className="overlay" />
      <div className="hero-content">
        <h1 className="hero-title">Digitalno Europsko izvješće</h1>
        <p className="hero-subtitle">
          Prijavite i dokumentirajte prometne nesreće na jednostavan i siguran način.
        </p>
        <Link to="/prijava" className="hero-button">
          Započni prijavu
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/prijava" element={<NesrecaForm onNext={data => console.log(data)} />} />
    </Routes>
  );
}

export default App;
