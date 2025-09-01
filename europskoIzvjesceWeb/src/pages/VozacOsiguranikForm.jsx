import React, { useState, useEffect } from 'react';
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

  // Sinkronizacija osiguranik → vozac
  useEffect(() => {
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

  const handleIstiChange = e => setIsti(e.target.checked);

  const handleSubmit = e => {
    e.preventDefault();
    onNext?.({ osiguranik, vozac });
  };

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o osiguraniku</h2>

      {['ime','prezime','adresa','Poštanski broj','država','kontakt','mail'].map(field => (
        <div className="form-group" key={field}>
          <label className="form-label">
            {field === 'mail'
              ? 'Email: *'
              : `${field.charAt(0).toUpperCase() + field.slice(1)}: *`}
          </label>
          <input
            name={field}
            type={field === 'mail' ? 'email' : 'text'}
            className="form-input"
            value={osiguranik[field]}
            onChange={handleOsiguranikChange}
            required
          />
        </div>
      ))}

      <div className="form-group">
        <label>
          <input type="checkbox" checked={isti} onChange={handleIstiChange} />
          Vozač je isti kao osiguranik
        </label>
      </div>

      <h2 className="nesreca-title">Podaci o vozaču</h2>

      {!isti && ['ime','prezime','adresa','postanskiBroj','drzava','kontakt','mail'].map(field => (
        <div className="form-group" key={field}>
          <label className="form-label">
            {field === 'mail'
              ? 'Email: *'
              : `${field.charAt(0).toUpperCase() + field.slice(1)}: *`}
          </label>
          <input
            name={field}
            type={field === 'mail' ? 'email' : 'text'}
            className="form-input"
            value={vozac[field]}
            onChange={handleVozacChange}
            required
          />
        </div>
      ))}

      <div className="form-group">
        <label className="form-label">Broj vozačke dozvole: *</label>
        <input
          name="brojVozacke"
          className="form-input"
          value={vozac.brojVozacke}
          onChange={handleVozacChange}
          required
        />
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
          {['AM','A1','A2','A','B','BE','C','CE','D','DE','F','G','M','H'].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Valjanost vozačke dozvole: *</label>
        <input
          name="valjanostVozacke"
          type="date"
          className="form-input"
          value={vozac.valjanostVozacke}
          onChange={handleVozacChange}
          required
        />
      </div>

      <button type="submit" className="submit-button">
        Spremi i nastavi
      </button>
    </form>
  );
}
