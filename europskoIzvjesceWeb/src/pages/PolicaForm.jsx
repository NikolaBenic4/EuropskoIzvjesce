import React, { useState } from "react";
import '../css/PolicaForm.css';

const PolicaForm = ({ onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    brojpolice: "",
    nazivdrustva: "",
    brojzelenekarte: "",
    kaskopokrivastetu: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
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
            maxLength={20}
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

        <div className="form-group">
          <label className="form-label" htmlFor="kaskopokrivastetu">
            Kasko pokriva štetu:
          </label>
          <input
            type="checkbox"
            id="kaskopokrivastetu"
            name="kaskopokrivastetu"
            checked={formData.kaskopokrivastetu}
            onChange={handleChange}
          />
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
          >
            DALJE
          </button>
        </div>
      </form>
    </div>
  );
};

export default PolicaForm;
