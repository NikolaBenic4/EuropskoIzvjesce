import { Routes, Route, Link } from 'react-router-dom';
import './css/App.css';
import { FaQrcode, FaBolt, FaMapMarkerAlt, FaLock, FaRegThumbsUp, FaCarCrash } from "react-icons/fa";
// import FullForm from './pages/FullForm';
import SvjedociForm from './pages/SvjedociForm';
import NesrecaForm from './pages/NesrecaForm';



function Home() {
  return (
    <>
      <header className="site-header"><h1>Europsko Izvješće</h1></header>
      <div className="hero-container">
        <img
          src="/assets/NesrecaSlika.png"
          className="hero-image"
          alt="Prometna nesreća"
        />
      </div>
      <section className="content-section">
        <h1 className="content-title">Digitalno Europsko izvješće</h1>
        <p className="content-subtitle">
          Prijavite i dokumentirajte prometnu nesreću na jednostavan i siguran način.
        </p>
        <Link to="/NesrecaForm" className="cta-button">Započni prijavu</Link>
      </section>
      <br/>
      <section className="how-it-works">
        <h2>Kako funkcionira?</h2>
        <p className="how-desc">
          Jednostavno i sigurno dokumentirajte prometnu nesreću online.<br />
          Cijeli proces obavljate u nekoliko brzih koraka bez potrebe za papirologijom.
        </p>
        <ol className="how-steps">
          <li>Unesite osnovne podatke o nesreći.</li>
          <li>Dodajte informacije o sudionicima i vozilima.</li>
          <li>Ako postoje, unesite podatke o svjedocima</li>
          <li>Opišite okolnosti nesreće.</li>
          <li>Pregledajte i potvrdite izvješće digitalnim potpisom</li>
          <li>Pošaljite izvješće izravno osiguravajućem društvu.</li>
        </ol>
      </section>
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="benefit-item">
            <FaQrcode className="benefit-icon" />
            <span>Pristup stranici kroz QR kod</span>
          </div>
          <div className="benefit-item">
            <FaBolt className="benefit-icon" />
            <span>Automatsko ispunjavanje polja</span>
          </div>
          <div className="benefit-item">
            <FaMapMarkerAlt className="benefit-icon" />
            <span>Precizno pronalaženje lokacije nesreće</span>
          </div>
          <div className="benefit-item">
            <FaLock className="benefit-icon" />
            <span>Sigurnost podataka</span>
          </div>
          <div className="benefit-item">
            <FaRegThumbsUp className="benefit-icon" />
            <span>Jednostavnost unosa</span>
          </div>
          <div className="benefit-item">
            <FaCarCrash className="benefit-icon" />
            <span>3D sken automobilske nesreće</span>
          </div>
        </div>
      </section>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/NesrecaForm" element={<NesrecaForm />} />
    </Routes>
  );
}
