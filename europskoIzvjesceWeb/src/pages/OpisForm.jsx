import React, { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import MjestoUdarcaVozilo, { VEHICLE_CONFIG } from "../components/MjestoUdarcaVozila";
import "../css/OpisForm.css";

const OKOLNOSTI_OPTIONS = [
  "Sudionik nije dao prednost prolaska",
  "Neprepoznavanje prednosti prolaska",
  "Prebrza vožnja",
  "Nepropisno prestrojavanje",
  "Nepropisno skretanje",
  "Nepropisno uključivanje u promet",
  "Neprilagođena brzina uvjetima na cesti",
  "Nepropisno zaustavljanje ili parkiranje",
  "Ometanje prometa",
  "Nedavanje znakova namjere",
  "Nepropisno korištenje svjetala",
  "Neispunjavanje obveza sudionika prometne nesreće",
  "Neodgovarajuća sigurnosna udaljenost",
  "Nepridržavanje prometnih znakova i svjetala",
  "Vožnja pod utjecajem alkohola ili droga",
  "Vožnja prije stjecanja prava",
  "Nepropisno pretjecanje",
  "Vozilo nije bilo tehnički ispravno",
  "Ostalo"
];

const initialState = {
  tip_okolnost: [],
  opis_okolnost: "",
  tip_vozila: "car",
  odabrani_udarci: [],
  polozaj_ostecenja: "",
  opis_ostecenja: "",
  slike: []
};

export default function OpisForm({ data, onNext, onBack }) {
  const [formData, setFormData] = useState({ ...initialState, ...(data || {}) });
  const [modalIndeks, setModalIndeks] = useState(null);
  const [errors, setErrors] = useState({});
  const cameraInput = useRef(null);
  const fileInput = useRef(null);

  useEffect(() => {
    setFormData(prev => ({ ...initialState, ...data }));
  }, [data]);

  const formirajPoziciju = () => {
    const { points } = VEHICLE_CONFIG[formData.tip_vozila];
    return formData.odabrani_udarci
      .map(id => points.find(p => p.id === id)?.label)
      .filter(Boolean)
      .join("; ");
  };

  useEffect(() => {
    setFormData(f => ({ ...f, polozaj_ostecenja: formirajPoziciju() }));
  }, [formData.tip_vozila, formData.odabrani_udarci]);

  const promjenaVrijednosti = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const dodajSlike = async e => {
    e.preventDefault();
    const files = Array.from(e.target.files);
    const kompr = [];
    for (let f of files) {
      try {
        const c = await imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
        kompr.push({
          naziv_slike: c.name,
          podatak_slike: c,
          vrijeme_slikanja: new Date().toISOString().slice(0, 16),
          pregled: URL.createObjectURL(c)
        });
      } catch {}
    }
    setFormData(f => ({ ...f, slike: [...f.slike, ...kompr] }));
    e.target.value = null;
    if (formData.slike.length + kompr.length < 6) {
      setTimeout(() => cameraInput.current.click(), 300);
    }
  };

  const ukloniSliku = idx => {
    URL.revokeObjectURL(formData.slike[idx].pregled);
    setFormData(f => ({ ...f, slike: f.slike.filter((_, i) => i !== idx) }));
    setModalIndeks(null);
  };

  const handleNext = e => {
    e.preventDefault();
    const errs = {};
    if (!formData.tip_okolnost.length) errs.tip_okolnost = "Odaberite okolnost.";
    if (!formData.opis_okolnost.trim()) errs.opis_okolnost = "Unesite opis okolnosti.";
    if (!formData.polozaj_ostecenja.trim()) errs.polozaj_ostecenja = "Pozicija prazna.";
    if (!formData.opis_ostecenja.trim()) errs.opis_ostecenja = "Unesite opis oštećenja.";
    if (formData.slike.length < 6) errs.slike = "Dodajte barem 6 slika.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onNext({ ...formData, polozaj_ostecenja: formirajPoziciju() });
  };

  return (
    <form className="nesreca-form" onSubmit={handleNext}>
      {/* okolnosti */}
      <div className="form-group">
        <label className="form-label">Tip okolnosti:*</label>
        <div className="okolnosti-checkbox-group">
          {OKOLNOSTI_OPTIONS.map((opt, i) => (
            <label key={i} className="okolnost-checkbox-row">
              <input
                type="checkbox"
                className="okolnost-checkbox"
                checked={formData.tip_okolnost.includes(opt)}
                onChange={() => setFormData(f => ({
                  ...f,
                  tip_okolnost: f.tip_okolnost.includes(opt)
                    ? f.tip_okolnost.filter(x => x !== opt)
                    : [...f.tip_okolnost, opt]
                }))}
              />
              <span className="okolnost-label">{opt}</span>
            </label>
          ))}
        </div>
        {errors.tip_okolnost && <div className="error-message">{errors.tip_okolnost}</div>}
      </div>

      {/* opis okolnosti */}
      <div className="form-group">
        <label className="form-label">Opis okolnosti:*</label>
        <textarea
          className={`form-textarea ${errors.opis_okolnost ? "input-error" : ""}`}
          name="opis_okolnost"
          value={formData.opis_okolnost}
          onChange={promjenaVrijednosti}
        />
        {errors.opis_okolnost && <div className="error-message">{errors.opis_okolnost}</div>}
      </div>

      {/* mjesto udara */}
      <MjestoUdarcaVozilo
        vehicleType={formData.tip_vozila}
        selectedPoints={formData.odabrani_udarci}
        onChange={pts => setFormData(f => ({ ...f, odabrani_udarci: pts }))}
        onVehicleTypeChange={v => setFormData(f => ({ ...f, tip_vozila: v, odabrani_udarci: [] }))}
      />

      {/* pozicija oštećenja */}
      <div className="form-group">
        <label className="form-label">Pozicija oštećenja:*</label>
        <input
          className={`form-input ${errors.polozaj_ostecenja ? "input-error" : ""}`}
          value={formData.polozaj_ostecenja}
          readOnly
        />
        {errors.polozaj_ostecenja && <div className="error-message">{errors.polozaj_ostecenja}</div>}
      </div>

      {/* opis oštećenja */}
      <div className="form-group">
        <label className="form-label">Opis oštećenja:*</label>
        <textarea
          className={`form-textarea ${errors.opis_ostecenja ? "input-error" : ""}`}
          name="opis_ostecenja"
          value={formData.opis_ostecenja}
          onChange={promjenaVrijednosti}
        />
        {errors.opis_ostecenja && <div className="error-message">{errors.opis_ostecenja}</div>}
      </div>

      {/* Slikaj / Učitaj */}
      <div className="centered-container">
        <label className="slikaj-ucitaj-button" onClick={() => cameraInput.current.click()}>
          Slikaj
        </label>
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          style={{ display: "none" }}
          onChange={dodajSlike}
        />
        <label className="slikaj-ucitaj-button" onClick={() => fileInput.current.click()}>
          Učitaj
        </label>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={dodajSlike}
        />
      </div>
      {errors.slike && <div className="error-message">{errors.slike}</div>}

      {/* gallery */}
      <div className="uploaded-images-list">
        {Array.from({ length: Math.ceil(formData.slike.length / 2) }).map((_, r) => (
          <div key={r} className="image-row">
            {formData.slike.slice(r * 2, r * 2 + 2).map((s, i) => (
              <div
                key={i}
                className="uploaded-image"
                onClick={() => setModalIndeks(r * 2 + i)}
              >
                <img src={s.pregled} alt="" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* inline popup on same page */}
      {modalIndeks !== null && (
  <div className="modal-overlay" onClick={() => setModalIndeks(null)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <img
        src={formData.slike[modalIndeks].pregled}
        alt=""
        className="modal-image"
      />
      <div className="modal-buttons">
        <button
          type="button"
          className="next-button"
          onClick={() => setModalIndeks(null)}
        >
          Izlaz
        </button>
        <button
          type="button"
          className="next-button"
          onClick={() => ukloniSliku(modalIndeks)}
        >
          Ukloni
        </button>
      </div>
    </div>
  </div>
)}


      {/* navigation */}
      <div className="navigation-buttons">
        {onBack && <button type="button" className="back-button" onClick={onBack}>NAZAD</button>}
        <button type="submit" className="next-button">DALJE</button>
      </div>
    </form>
  );
}
