import React, { useState } from "react";
import '../css/SvjedociForm.css';

export default function SvjedociForm({ onNext }) {
  const [formData, setFormData] = useState({
    ozlijedeni: false,
    stetanastvarima: false,
    stetanavozilu: false,
    hasSvjedoci: false,
    svjedokImePrezime: "",
    svjedokAdresa: "",
    svjedokKontakt: ""
  });

  const handleCheckbox = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) onNext(formData);
  };

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o šteti i svjedocima</h2>

      {/* Main checkboxes */}
      <div className="checkbox-group">
        <label className="checkbox-item">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={formData.ozlijedeni}
            onChange={() => handleCheckbox("ozlijedeni")}
          />
          Ozlijeđene osobe
        </label>
        <label className="checkbox-item">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={formData.stetanastvarima}
            onChange={() => handleCheckbox("stetanastvarima")}
          />
          Šteta na drugim stvarima
        </label>
        <label className="checkbox-item">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={formData.stetanavozilu}
            onChange={() => handleCheckbox("stetanavozilu")}
          />
          Šteta na drugim vozilima
        </label>
      </div>

      {/* Toggle for witnesses */}
      <div className="checkbox-group">
        <label className="checkbox-item">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={formData.hasSvjedoci}
            onChange={() => handleCheckbox("hasSvjedoci")}
          />
          Postoje svjedoci
        </label>
      </div>

      {/* Witnesses section (only if checked) */}
      {formData.hasSvjedoci && (
        <div className="svjedoci-section">
          <h3>Podaci o svjedoku</h3>
          <div className="form-group">
            <label className="form-label">Ime i prezime</label>
            <input
              type="text"
              className="form-input"
              value={formData.svjedokImePrezime}
              onChange={(e) =>
                handleChange("svjedokImePrezime", e.target.value)
              }
              placeholder="Unesite ime i prezime"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Adresa</label>
            <input
              type="text"
              className="form-input"
              value={formData.svjedokAdresa}
              onChange={(e) =>
                handleChange("svjedokAdresa", e.target.value)
              }
              placeholder="Unesite adresu"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kontakt</label>
            <input
              type="text"
              className="form-input"
              value={formData.svjedokKontakt}
              onChange={(e) =>
                handleChange("svjedokKontakt", e.target.value)
              }
              placeholder="Broj mobitela ili telefona"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button type="submit" className="submit-button">
        Spremi i nastavi
      </button>
    </form>
  );
}
