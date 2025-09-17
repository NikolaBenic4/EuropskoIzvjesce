import React, { useState, useEffect } from "react";
import "../css/NesrecaForm.css";

const initialState = {
  naziv_osiguranja: "",
  adresa_osiguranja: "",
  drzava_osiguranja: "",
  mail_osiguranja: "",
  kontaktbroj_osiguranja: "",
  id_osiguranje: "",
};

const OsiguravajuceDrustvoForm = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState(() => ({
    ...initialState,
    ...(data || {})
  }));
  const [suggestions, setSuggestions] = useState([]);
  const [autoFilled, setAutoFilled] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({ ...initialState, ...(data || {}) });
  }, [data]);

  const API_KEY = import.meta.env.VITE_API_KEY || "your_api_key";

const handleNazivChange = async (e) => {
  const value = e.target.value;
  setFormData(prev => ({
    ...prev,
    naziv_osiguranja: value,
    adresa_osiguranja: "",
    drzava_osiguranja: "",
    mail_osiguranja: "",
    kontaktbroj_osiguranja: "",
    id_osiguranje: "",
  }));
  setAutoFilled(false);
  if (value.length > 1) {
    try {
      const res = await fetch(`/api/osiguranje/suggestions?q=${encodeURIComponent(value)}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        }
      });
      if (res.status === 401) {
        setSuggestions([]);
        setErrors(prev => ({
          ...prev,
          naziv_osiguranja: "Nemate pravo pristupa bazi (API ključ neispravan)."
        }));
        return;
      }
      const arr = res.ok ? await res.json() : [];
      setSuggestions(Array.isArray(arr) ? arr : []);
    } catch {
      setSuggestions([]);
    }
  } else {
    setSuggestions([]);
  }
};

  // Klikom na suggestion puniš formData sa svim poljima (i id-osiguranja)!
  const handleSuggestionClick = (s) => {
    setFormData(prev => ({
      ...prev,
      id_osiguranje: s.id_osiguranje,
      naziv_osiguranja: s.naziv_osiguranja,
      adresa_osiguranja: s.adresa_osiguranja || "",
      drzava_osiguranja: s.drzava_osiguranja || "",
      mail_osiguranja: s.mail_osiguranja || "",
      kontaktbroj_osiguranja: s.kontaktbroj_osiguranja || ""
    }));
    setSuggestions([]);
    setAutoFilled(true);
  };

  // Promjene u inputima
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "naziv_osiguranja") {
      setAutoFilled(false);
      setFormData(prev => ({ ...prev, id_osiguranje: "" })); // Resetiraj id!
    }
  };

  // Validacija: bez id_osiguranja nema submit!
  const validate = () => {
    const errs = {};
    if (!formData.naziv_osiguranja.trim()) errs.naziv_osiguranja = "Obavezno polje.";
    if (!formData.adresa_osiguranja.trim()) errs.adresa_osiguranja = "Obavezno polje.";
    if (!formData.drzava_osiguranja.trim()) errs.drzava_osiguranja = "Obavezno polje.";
    if (!formData.mail_osiguranja.trim()) errs.mail_osiguranja = "Obavezno polje.";
    if (!formData.kontaktbroj_osiguranja.trim()) errs.kontaktbroj_osiguranja = "Obavezno polje.";
    if (!formData.id_osiguranje || !formData.id_osiguranje.trim())
      errs.naziv_osiguranja = "Odaberite društvo iz liste prijedloga!";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (onNext) onNext(formData);
  };

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Osiguravajuće društvo</h2>
      <div className="form-group" style={{ position: "relative" }}>
        <label className="form-label">Naziv osiguravajućeg društva: *</label>
        <input
          type="text"
          name="naziv_osiguranja"
          maxLength={50}
          className={`form-input ${errors.naziv_osiguranja ? "input-error" : ""}`}
          value={formData.naziv_osiguranja}
          onChange={handleNazivChange}
          required
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map(s => (
              <li key={s.id_osiguranje} onClick={() => handleSuggestionClick(s)}>
                {s.naziv_osiguranja}
              </li>
            ))}
          </ul>
        )}
        {errors.naziv_osiguranja && <div className="error-message">{errors.naziv_osiguranja}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Adresa: *</label>
        <input
          type="text"
          name="adresa_osiguranja"
          maxLength={50}
          className={`form-input ${errors.adresa_osiguranja ? "input-error" : ""}`}
          value={formData.adresa_osiguranja}
          onChange={handleChange}
          readOnly={autoFilled}
          required
        />
        {errors.adresa_osiguranja && <div className="error-message">{errors.adresa_osiguranja}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Država: *</label>
        <input
          type="text"
          name="drzava_osiguranja"
          maxLength={100}
          className={`form-input ${errors.drzava_osiguranja ? "input-error" : ""}`}
          value={formData.drzava_osiguranja}
          onChange={handleChange}
          readOnly={autoFilled}
          required
        />
        {errors.drzava_osiguranja && <div className="error-message">{errors.drzava_osiguranja}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Email: *</label>
        <input
          type="email"
          name="mail_osiguranja"
          maxLength={50}
          className={`form-input ${errors.mail_osiguranja ? "input-error" : ""}`}
          value={formData.mail_osiguranja}
          onChange={handleChange}
          readOnly={autoFilled}
          required
        />
        {errors.mail_osiguranja && <div className="error-message">{errors.mail_osiguranja}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Kontakt broj: *</label>
        <input
          type="text"
          name="kontaktbroj_osiguranja"
          maxLength={20}
          className={`form-input ${errors.kontaktbroj_osiguranja ? "input-error" : ""}`}
          value={formData.kontaktbroj_osiguranja}
          onChange={handleChange}
          readOnly={autoFilled}
          required
        />
        {errors.kontaktbroj_osiguranja && <div className="error-message">{errors.kontaktbroj_osiguranja}</div>}
      </div>

      <div className="navigation-buttons">
        {onBack && (
          <button
            type="button"
            className="back-button"
            onClick={onBack}
          >
            NAZAD
          </button>
        )}
        <button
          type="submit"
          className="next-button"
        >
          DALJE
        </button>
      </div>
    </form>
  );
};

export default OsiguravajuceDrustvoForm;
