import React, { useState } from 'react';
import QrReader from '../components/QrScanner';
import '../css/NesrecaForm.css';

const OsiguranikInitial = {
  ime: "",
  prezime: "",
  adresa: "",
  postanskiBroj: "",
  drzava: "",
  kontakt: "",
  mail: ""
};

const VozacInitial = {
  ime: "",
  prezime: "",
  adresa: "",
  postanskiBroj: "",
  drzava: "",
  kontakt: "",
  mail: "",
  brojVozacke: "",
  kategorijaVozacke: "",
  valjanostVozacke: ""
};

export default function VozacPolicaForm({ onNext }) {
  const [osiguranik, setOsiguranik] = useState(OsiguranikInitial);
  const [vozac, setVozac] = useState(VozacInitial);
  const [isti, setIsti] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  // Sinkronizacija osiguranik -> vozac kod 'isti'
  React.useEffect(() => {
    if (isti) {
      setVozac(v => ({
        ...v,
        ime: osiguranik.ime,
        prezime: osiguranik.prezime,
        adresa: osiguranik.adresa,
        postanskiBroj: osiguranik.postanskiBroj,
        drzava: osiguranik.drzava,
        kontakt: osiguranik.kontakt,
        mail: osiguranik.mail
      }));
    }
  }, [isti, osiguranik]);

  const handleQrScan = data => {
    try {
      const parsed = JSON.parse(data);
      setOsiguranik(o => ({
        ...o,
        ime: parsed.ime || o.ime,
        prezime: parsed.prezime || o.prezime,
        adresa: parsed.adresa || o.adresa,
        postanskiBroj: parsed.postanskiBroj || o.postanskiBroj,
        drzava: parsed.drzava || o.drzava,
        kontakt: parsed.kontakt || o.kontakt,
        mail: parsed.mail || o.mail
      }));
      setShowScanner(false);
    } catch {
      alert("Nije ispravan format QR koda.");
    }
  };

  const handleError = err => {
    setScanError("Greška s kamerom ili pristupom: " + err?.message);
  };

  const handleOsiguranikChange = e => {
    const { name, value } = e.target;
    setOsiguranik(o => ({ ...o, [name]: value }));
    if (isti) {
      setVozac(v => ({ ...v, [name]: value }));
    }
  };

  const handleVozacChange = e => {
    const { name, value } = e.target;
    setVozac(v => ({ ...v, [name]: value }));
  };

  const handleIstiChange = e => {
    setIsti(e.target.checked);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (onNext) onNext({ osiguranik, vozac });
  };

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o osiguraniku</h2>
      {/* Brzi unos podataka - QR skener */}
      <button
        type="button"
        className="auto-load-button"
        onClick={() => setShowScanner(!showScanner)}
        style={{ marginBottom: "1.2rem" }}
      >
        Brzi unos podataka
      </button>
      {showScanner && (
        <div style={{ marginBottom: 20 }}>
          <QrReader
            delay={500}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
            facingMode="environment"
          />
          {scanError && <p style={{ color: "red", marginTop: "1rem" }}>{scanError}</p>}
          <button type="button" className="submit-button" onClick={() => setShowScanner(false)}>Zatvori skener</button>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Ime: *</label>
        <input name="ime" value={osiguranik.ime} onChange={handleOsiguranikChange} className="form-input" required />
      </div>
      <div className="form-group">
        <label className="form-label">Prezime: *</label>
        <input name="prezime" value={osiguranik.prezime} onChange={handleOsiguranikChange} className="form-input" required />
      </div>
      <div className="form-group">
        <label className="form-label">Adresa: *</label>
        <input name="adresa" value={osiguranik.adresa} onChange={handleOsiguranikChange} className="form-input" required />
      </div>
      <div className="form-group">
        <label className="form-label">Poštanski broj: *</label>
        <input name="postanskiBroj" value={osiguranik.postanskiBroj} onChange={handleOsiguranikChange} className="form-input" required />
      </div>
      <div className="form-group">
        <label className="form-label">Država: *</label>
        <input name="drzava" value={osiguranik.drzava} onChange={handleOsiguranikChange} className="form-input" required />
      </div>
      <div className="form-group">
        <label className="form-label">Kontakt broj: *</label>
        <input name="kontakt" value={osiguranik.kontakt} onChange={handleOsiguranikChange} className="form-input" required />
      </div>
      <div className="form-group">
        <label className="form-label">Email: *</label>
        <input name="mail" type="email" value={osiguranik.mail} onChange={handleOsiguranikChange} className="form-input" />
      </div>

      <div className="form-group">
        <h3>
          <input
            type="checkbox"
            checked={isti}
            onChange={handleIstiChange}
            style={{ marginRight: "8px" }}
          />
          Vozač je isti kao osiguranik
        </h3>
      </div>

      <h2 className="nesreca-title">Podaci o vozaču</h2>

      {!isti && (
        <>
          <div className="form-group">
            <label className="form-label">Ime: *</label>
            <input name="ime" value={vozac.ime} onChange={handleVozacChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Prezime: *</label>
            <input name="prezime" value={vozac.prezime} onChange={handleVozacChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Adresa: *</label>
            <input name="adresa" value={vozac.adresa} onChange={handleVozacChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Poštanski broj: *</label>
            <input name="postanskiBroj" value={vozac.postanskiBroj} onChange={handleVozacChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Država: *</label>
            <input name="drzava" value={vozac.drzava} onChange={handleVozacChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Kontakt broj: *</label>
            <input name="kontakt" value={vozac.kontakt} onChange={handleVozacChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email: *</label>
            <input name="mail" type="email" value={vozac.mail} onChange={handleVozacChange} className="form-input" />
          </div>
        </>
      )}

      <div className="form-group">
        <label className="form-label">Broj vozačke dozvole: *</label>
        <input name="brojVozacke" value={vozac.brojVozacke} onChange={handleVozacChange} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Kategorija vozačke dozvole: *</label>
        <select
          name="kategorijaVozacke"
          value={vozac.kategorijaVozacke}
          onChange={handleVozacChange}
          className="form-input"
          required
        >
          <option value="">Odaberi...</option>
          <option value="AM">AM</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="BE">BE</option>
          <option value="C">C</option>
          <option value="CE">CE</option>
          <option value="D">D</option>
          <option value="DE">DE</option>
          <option value="F">F</option>
          <option value="G">G</option>
          <option value="M">M</option>
          <option value="H">H</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Valjanost vozačke dozvole: *</label>
        <input name="valjanostVozacke" type="date" value={vozac.valjanostVozacke} onChange={handleVozacChange} className="form-input" />
      </div>
      <button type="submit" className="submit-button">Spremi i nastavi</button>
    </form>
  );
}
