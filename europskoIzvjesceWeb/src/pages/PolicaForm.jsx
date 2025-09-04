import React, { useState, useEffect, useRef } from "react";
import '../css/PolicaForm.css';

const initialState = {
  brojpolice: "",
  nazivdrustva: "",
  zelena_karta: false,
  brojzelenekarte: "",
  kaskopokrivastetu: false,
};

const PolicaForm = ({ data, onNext, onBack }) => {
  const [formData, setFormData] = useState(() => ({ ...initialState, ...(data || {}) }));

  useEffect(() => {
    setFormData({ ...initialState, ...(data || {}) });
  }, [data]);

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const infoBtnRef = useRef(null);
  const tooltipRef = useRef(null);

  // Toggles info
  const toggleTooltip = (e) => {
    e.preventDefault();
    setTooltipOpen((open) => !open);
  };

  useEffect(() => {
    if (!tooltipOpen) return;
    const handleClickOutside = (e) => {
      if (infoBtnRef.current && infoBtnRef.current.contains(e.target)) {
        setTooltipOpen((open) => !open);
        return;
      }
      if (tooltipRef.current && tooltipRef.current.contains(e.target)) {
        setTooltipOpen(false);
        return;
      }
      setTooltipOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [tooltipOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "zelena_karta" && !checked ? { brojzelenekarte: "" } : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) onNext(formData);
  };

  return (
    <div className="nesreca-container" style={{ position: "relative" }}>
      <form className="nesreca-form" onSubmit={handleSubmit}>
        <h2 className="nesreca-title">Polica osiguranja</h2>

        <div className="form-group">
          <label htmlFor="brojpolice" className="form-label">
            Broj police:*
          </label>
          <input
            type="text"
            name="brojpolice"
            id="brojpolice"
            minLength={8}
            maxLength={12}
            className="form-input"
            value={formData.brojpolice}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="nazivdrustva" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Poslovnica(ured/posrednik):*
            <button
              type="button"
              className="infobutton"
              onClick={toggleTooltip}
              tabIndex={0}
              aria-label="Informacije o poslovnici"
              ref={infoBtnRef}
            >
              i
            </button>
          </label>
          <input
            type="text"
            id="nazivdrustva"
            name="nazivdrustva"
            maxLength={50}
            className="form-input"
            value={formData.nazivdrustva}
            onChange={handleChange}
            required
          />
        </div>

        <span
          className={`tooltip${tooltipOpen ? " tooltip-active" : ""}`}
          role="tooltip"
          ref={tooltipRef}
        >
          Osoba ili poslovnica koja je napravila policu osiguranja.<br /><b>Pogledaj na polici osiguranja!</b>
        </span>

        {/* Checkbox: Zelena karta */}
        <div className="form-group polica-checkbox-row">
          <input
            type="checkbox"
            id="zelena_karta"
            name="zelena_karta"
            checked={formData.zelena_karta}
            onChange={handleChange}
            className="custom-checkbox"
          />
          <label htmlFor="zelena_karta" className="form-label polica-checkbox-label">
            Zelena karta
          </label>
        </div>

        {formData.zelena_karta && (
          <div className="form-group">
            <label className="form-label">Broj zelene karte:</label>
            <input
              type="text"
              name="brojzelenekarte"
              maxLength={20}
              className="form-input"
              value={formData.brojzelenekarte}
              onChange={handleChange}
            />
          </div>
        )}

        {/* Checkbox: Kasko pokriva štetu */}
        <div className="form-group polica-checkbox-row">
          <input
            type="checkbox"
            id="kaskopokrivastetu"
            name="kaskopokrivastetu"
            checked={formData.kaskopokrivastetu}
            onChange={handleChange}
            className="custom-checkbox"
          />
          <label htmlFor="kaskopokrivastetu" className="form-label polica-checkbox-label">
            Kasko pokriva štetu
          </label>
        </div>

        <div className="navigation-buttons">
          {typeof onBack === "function" && (
            <button
              type="button"
              className="back-button"
              aria-label="Nazad na prethodni korak"
              onClick={onBack}
              style={{ marginRight: 12 }}
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
    </div>
  );
};

export default PolicaForm;
