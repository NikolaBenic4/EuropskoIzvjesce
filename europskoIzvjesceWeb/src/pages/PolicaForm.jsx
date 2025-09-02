import React, { useState } from "react";
import '../css/PolicaForm.css';

const PolicaForm = ({ onNext, onBack }) => {
  const [formData, setFormData] = useState({
    brojpolice: "",
    nazivdrustva: "",
    zelena_karta: false,
    brojzelenekarte: "",
    kaskopokrivastetu: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
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
          <label className="form-label">Broj police: *</label>
          <input
            type="text"
            name="brojpolice"
            minLength={8}
            maxLength={12}
            className="form-input"
            value={formData.brojpolice}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Naziv društva: *</label>
          <input
            type="text"
            name="nazivdrustva"
            maxLength={50}
            className="form-input"
            value={formData.nazivdrustva}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="zelena_karta"
            name="zelena_karta"
            checked={formData.zelena_karta}
            onChange={handleChange}
            style={{ width: 20, height: 20 }} // veći checkbox!
          />
          <label htmlFor="zelena_karta" className="form-label" style={{ margin: 0 }}>
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

        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="kaskopokrivastetu"
            name="kaskopokrivastetu"
            checked={formData.kaskopokrivastetu}
            onChange={handleChange}
            style={{ width: 20, height: 20 }} // veći checkbox!
          />
          <label htmlFor="kaskopokrivastetu" className="form-label" style={{ margin: 0 }}>
            Kasko pokriva štetu
          </label>
        </div>

        <div className="navigation-buttons">
          {onBack && (
            <button
              type="button"
              className="back-button"
              onClick={onBack}
              style={{ marginRight: 12 }}
            >
              NAZAD
            </button>
          )}
          <button
            type="submit"
            className="next-button"
            onClick={onNext}
          >
            DALJE
          </button>
        </div>
      </form>
    </div>
  );
};

export default PolicaForm;
