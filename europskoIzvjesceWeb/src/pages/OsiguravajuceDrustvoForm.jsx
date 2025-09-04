import React, { useState, useEffect } from "react";
import '../css/NesrecaForm.css';

const initialState = {
  naziv_osiguranja: "",
  adresa_osiguranja: "",
  drzava_osiguranja: "",
  mail_osiguranja: "",
  kontaktbroj_osiguranja: "",
};

const OsiguravajuceDrustvoForm = ({ data, onNext, onBack }) => {
  // Session-friendly state!
  const [formData, setFormData] = useState(() => ({
    ...initialState,
    ...(data || {})
  }));
  const [suggestions, setSuggestions] = useState([]);
  const [autoFilled, setAutoFilled] = useState(false);

  // sinkronizacija iz parenta ako promijene korak
  useEffect(() => {
    setFormData({ ...initialState, ...(data || {}) });
  }, [data]);

  const handleNazivChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      naziv_osiguranja: value,
      adresa_osiguranja: "",
      drzava_osiguranja: "",
      mail_osiguranja: "",
      kontaktbroj_osiguranja: "",
    }));
    setAutoFilled(false);
    if (value.length > 1) {
      try {
        const res = await fetch(`/api/osiguranje/suggestions?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          setSuggestions(await res.json());
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = async (naziv) => {
    setFormData(prev => ({
      ...prev,
      naziv_osiguranja: naziv
    }));
    setSuggestions([]);
    try {
      const res = await fetch(`/api/osiguranje?naziv=${encodeURIComponent(naziv)}`);
      if (res.ok) {
        const podaci = await res.json();
        setFormData(prev => ({
          ...prev,
          adresa_osiguranja: podaci.adresa_osiguranja || "",
          drzava_osiguranja: podaci.drzava_osiguranja || "",
          mail_osiguranja: podaci.mail_osiguranja || "",
          kontaktbroj_osiguranja: podaci.kontaktbroj_osiguranja || "",
        }));
        setAutoFilled(true);
      }
    } catch {}
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "naziv_osiguranja") setAutoFilled(false);
  };

  // Form submit šalje sve parentu!
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) onNext(formData);
  };

  return (
    <div className="nesreca-container" style={{ position: "relative" }}>
      <form className="nesreca-form" onSubmit={handleSubmit}>
        <h2 className="nesreca-title">Osiguravajuće društvo</h2>

        <div className="form-group" style={{ position: "relative" }}>
          <label className="form-label">Naziv osiguravajućeg društva: *</label>
          <input
            type="text"
            name="naziv_osiguranja"
            maxLength={50}
            className="form-input"
            value={formData.naziv_osiguranja}
            onChange={handleNazivChange}
            required
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map(s => (
                <li key={s} onClick={() => handleSuggestionClick(s)}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Adresa: *</label>
          <input
            type="text"
            name="adresa_osiguranja"
            maxLength={50}
            className="form-input"
            value={formData.adresa_osiguranja}
            onChange={handleChange}
            readOnly={autoFilled}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Država: *</label>
          <input
            type="text"
            name="drzava_osiguranja"
            maxLength={100}
            className="form-input"
            value={formData.drzava_osiguranja}
            onChange={handleChange}
            readOnly={autoFilled}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email: *</label>
          <input
            type="email"
            name="mail_osiguranja"
            maxLength={50}
            className="form-input"
            value={formData.mail_osiguranja}
            onChange={handleChange}
            readOnly={autoFilled}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kontakt broj: *</label>
          <input
            type="text"
            name="kontaktbroj_osiguranja"
            maxLength={20}
            className="form-input"
            value={formData.kontaktbroj_osiguranja}
            onChange={handleChange}
            readOnly={autoFilled}
            required
          />
        </div>

        <div className="navigation-buttons">
          {onBack && (
            <button
              type="button"
              className="back-button"
              onClick={onBack}
            >
              POVRATAK
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
    </div>
  );
};

export default OsiguravajuceDrustvoForm;
