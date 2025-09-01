import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaQrcode,
  FaBolt,
  FaMapMarkerAlt,
  FaLock,
  FaRegThumbsUp,
  FaCarCrash
} from 'react-icons/fa';
import '../css/Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <header className="site-header">
        <h1>Europsko Izvješće</h1>
      </header>

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
        <Link to="/izvjesce" className="cta-button">
          Započni prijavu
        </Link>
      </section>

      <section className="how-it-works">
        <h2>Kako funkcionira?</h2>
        <p className="how-desc">
          Jednostavno i sigurno dokumentirajte prometnu nesreću online.<br />
          Cijeli proces obavljate u nekoliko brzih koraka bez potrebe za papirologijom.
        </p>
        <ol className="how-steps">
          <li>Unesite osnovne podatke o nesreći.</li>
          <li>Dodajte informacije o sudionicima i vozilima.</li>
          <li>Ako postoje, unesite podatke o svjedocima.</li>
          <li>Opišite okolnosti nesreće.</li>
          <li>Unesite podatke o polici.</li>
          <li>Pregledajte i potvrdite izvješće digitalnim potpisom.</li>
          <li>Pošaljite izvješće izravno osiguravajućem društvu.</li>
        </ol>
      </section>

      <section className="benefits-section">
        <div className="benefits-container">
          <div className="benefit-item">
            <FaQrcode className="benefit-icon" />
            <span>Pristup QR kodom</span>
          </div>
          <div className="benefit-item">
            <FaBolt className="benefit-icon" />
            <span>Automatsko ispunjavanje</span>
          </div>
          <div className="benefit-item">
            <FaMapMarkerAlt className="benefit-icon" />
            <span>Precizna lokacija</span>
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
            <span>3D sken vozila</span>
          </div>
        </div>
      </section>
    </div>
  );
}
