import { Routes, Route, Link } from 'react-router-dom';
import './css/App.css';
// import FullForm from './pages/FullForm';   // privremeno zakomentirano

function Home() {
  return (
    <>
      <header className="site-header"><h1>Europsko Izvješće</h1></header>
      <div className="hero-containter">
        <img
        src="/public/assets/NesrecaSlika.png"
        className="hero-image"
        ></img>
      </div>
      <section className="content-section">
        <h1 className="content-title">Digitalno Europsko izvješće</h1>
        <p className="content-subtitle">
          Prijavite i dokumentirajte prometnu nesreću na jednostavan i siguran način.
        </p>
        {/* dok ne popravite forme, vodimo samo na Home */}
        <Link to="/" className="cta-button">Započni prijavu</Link>
      </section>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* <Route path="/fullform" element={<FullForm />} /> */}
    </Routes>
  );
}
