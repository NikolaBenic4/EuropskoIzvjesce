import React, { useState } from "react";
import '../css/NesrecaForm.css';

const OsiguravajuceDrustvoForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    id_osiguranje: "",
    naziv_osiguranja: "",
    adresa_osiguranja: "",
    drzava_osiguranja: "",
    mail_osiguranja: "",
    kontaktbroj_osiguranja: "",
    kaskopokrivastetu: false,
    id_osiguranika: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <div className="nesreca-container">
      <form className="nesreca-form" onSubmit={handleSubmit}>
        <h2 className="nesreca-title">Osiguravajuće društvo</h2>

        <div className="form-group">
          <label className="form-label">Naziv osiguravajućeg društva: *</label>
          <input
            type="text"
            name="naziv_osiguranja"
            maxLength={50}
            className="form-input"
            value={formData.naziv_osiguranja}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">ID osiguranja: *</label>
          <input
            type="number"
            name="id_osiguranje"
            required
            className="form-input"
            value={formData.id_osiguranje}
            onChange={handleChange}
          />
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
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              name="kaskopokrivastetu"
              checked={formData.kaskopokrivastetu}
              onChange={handleChange}
              style={{ marginRight: "8px" }}
            />
            Kasko pokriva štetu
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">ID osiguranika: *</label>
          <input
            type="number"
            name="id_osiguranika"
            className="form-input"
            value={formData.id_osiguranika}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="submit-button">Spremi društvo</button>
      </form>
    </div>
  );
};

export default OsiguravajuceDrustvoForm;
