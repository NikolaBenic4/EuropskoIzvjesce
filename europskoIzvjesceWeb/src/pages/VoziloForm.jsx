import React, { useState } from "react";
import '../css/NesrecaForm.css';

const initialState = {
  registarskaoznaka_vozila: "",
  marka_vozila: "",
  tip_vozila: "",
  drzavaregistracije_vozila: "",
  brojsasije_vozila: "",
  kilometraza_vozila: "",
  imaPrikolicu: false,
  registracijskaoznaka_prikolica: "",
  drzavaregistracije_prikolica: "",
  godinaProizvodnje_vozilo: "",
};

const VoziloForm = ({ onNext, onBack, initialData }) => {
  const [formData, setFormData] = useState(initialData || initialState);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) onNext(formData);
  };

  return (
    <div className="nesreca-container">
      <form className="nesreca-form" onSubmit={handleSubmit}>
        <h2 className="nesreca-title">Podaci o vozilu</h2>

        {/* Ostala polja vozila */}
        <div className="form-group">
          <label className="form-label">Registarska oznaka vozila</label>
          <input
            type="text"
            name="registarskaoznaka_vozila"
            className="form-input"
            value={formData.registarskaoznaka_vozila}
            onChange={handleChange}
            maxLength={20}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Marka vozila</label>
          <input
            type="text"
            name="marka_vozila"
            className="form-input"
            value={formData.marka_vozila}
            onChange={handleChange}
            maxLength={50}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tip vozila</label>
          <input
            type="text"
            name="tip_vozila"
            className="form-input"
            value={formData.tip_vozila}
            onChange={handleChange}
            maxLength={50}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Država registracije vozila</label>
          <input
            type="text"
            name="drzavaregistracije_vozila"
            className="form-input"
            value={formData.drzavaregistracije_vozila}
            onChange={handleChange}
            maxLength={50}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Broj šasije vozila</label>
          <input
            type="text"
            name="brojsasije_vozila"
            className="form-input"
            value={formData.brojsasije_vozila}
            onChange={handleChange}
            maxLength={17}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Kilometraža vozila</label>
          <input
            type="number"
            name="kilometraza_vozila"
            className="form-input"
            value={formData.kilometraza_vozila}
            onChange={handleChange}
            min={0}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Godina proizvodnje vozila</label>
          <input
            type="number"
            name="godinaProizvodnje_vozilo"
            className="form-input"
            value={formData.godinaProizvodnje_vozilo}
            onChange={handleChange}
            min={1900}
            max={new Date().getFullYear()}
            required
          />
        </div>

        {/* Checkbox za prikolicu */}
        <div className="form-group">
          <label className="checkbox-item">
            <input
              type="checkbox"
              name="imaPrikolicu"
              checked={formData.imaPrikolicu}
              onChange={handleChange}
              className="checkbox-input"
            />
            Ima prikolicu
          </label>
        </div>

        {/* Polja prikolice (uvjetno prikazana) */}
        {formData.imaPrikolicu && (
          <>
            <div className="form-group">
              <label className="form-label">Registarska oznaka prikolice</label>
              <input
                type="text"
                name="registracijskaoznaka_prikolica"
                className="form-input"
                value={formData.registracijskaoznaka_prikolica}
                onChange={handleChange}
                maxLength={20}
                required={formData.imaPrikolicu}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Država registracije prikolice</label>
              <input
                type="text"
                name="drzavaregistracije_prikolica"
                className="form-input"
                value={formData.drzavaregistracije_prikolica}
                onChange={handleChange}
                maxLength={50}
                required={formData.imaPrikolicu}
              />
            </div>
          </>
        )}

        <div className="navigation-buttons" style={{ marginTop: 20 }}>
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
          <button type="submit" className="next-button">
            DALJE
          </button>
        </div>
      </form>
    </div>
  );
};

export default VoziloForm;
