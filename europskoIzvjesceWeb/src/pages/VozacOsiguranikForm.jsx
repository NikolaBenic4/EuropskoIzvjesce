import React, { useState, useEffect } from 'react';
import '../css/NesrecaForm.css';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { fetchAddressesDGU } from '../services/addressService';

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

const searchAddresses = async (query, setSug, setLoad, setShow) => {
  setLoad(true);
  try {
    const list = await fetchAddressesDGU(query);
    setSug(Array.isArray(list) ? list.slice(0, 2) : []);
    setShow(true);
  } catch (e) {
    setSug([]);
    setShow(true);
  } finally {
    setLoad(false);
  }
};

const placeholders = {
  ime: "Unesite ime",
  prezime: "Unesite prezime",
  adresa: "Unesite adresu",
  "poštanski broj": "Unesite poštanski broj",
  postanskiBroj: "Unesite poštanski broj",
  država: "Unesite državu",
  kontakt: "Unesite kontakt telefon",
  mail: "Unesite email",
  brojVozacke: "Unesite broj vozačke dozvole",
  kategorijaVozacke: "Odaberite kategoriju vozačke dozvole",
  valjanostVozacke: "Odaberite valjanost vozačke dozvole"
};

export default function VozacPolicaForm({ onNext, onBack }) {
  const [osiguranik, setOsiguranik] = useState(OsiguranikInitial);
  const [vozac, setVozac] = useState(VozacInitial);
  const [isti, setIsti] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!isti) {
      setVozac(VozacInitial);
    }
  }, [isti]);

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

  const validateForm = () => {
    const imaBrojOsiguranik = /\d/.test(osiguranik.adresa.trim());
    if (!imaBrojOsiguranik) {
      setError("Unesite kućni broj u adresu osiguranika.");
      return false;
    }
    if (!isti) {
      const imaBrojVozac = /\d/.test(vozac.adresa.trim());
      if (!imaBrojVozac) {
        setError("Unesite kućni broj u adresu vozača.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validateForm()) return;
    onNext?.({ osiguranik, vozac });
  };

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o osiguraniku</h2>
      {['ime', 'prezime', 'adresa', 'poštanski broj', 'država', 'kontakt', 'mail'].map(field => (
        <div className="form-group" key={"osiguranik-" + field}>
          <label className="form-label">
            {field === 'mail'
              ? 'Email: *'
              : `${field.charAt(0).toUpperCase() + field.slice(1)}: *`}
          </label>
          {field === 'adresa' ? (
            <AddressAutocomplete
              value={osiguranik.adresa}
              onChange={val => setOsiguranik(o => ({ ...o, adresa: val }))}
              onPostalChange={val => setOsiguranik(o => ({ ...o, postanskiBroj: val }))}
              placeholder={placeholders.adresa}
              className="form-input"
              searchFunction={searchAddresses}
            />
          ) : (
            <input
              name={field}
              type={field === 'mail' ? 'email' : 'text'}
              className="form-input"
              placeholder={placeholders[field] || ""}
              value={osiguranik[field]}
              onChange={handleOsiguranikChange}
              required
            />
          )}
        </div>
      ))}

      <div className="form-group">
        <label>
          <input type="checkbox" checked={isti} onChange={handleIstiChange} style={{ marginRight: '8px' }} />
          Vozač je isti kao osiguranik
        </label>
      </div>

      <h2 className="nesreca-title">Podaci o vozaču</h2>
      {!isti && ['ime', 'prezime', 'adresa', 'poštanski broj', 'država', 'kontakt', 'mail'].map(field => (
        <div className="form-group" key={"vozac-" + field}>
          <label className="form-label">
            {field === 'mail'
              ? 'Email: *'
              : `${field.charAt(0).toUpperCase() + field.slice(1)}: *`}
          </label>
          {field === 'adresa' ? (
            <AddressAutocomplete
              value={vozac.adresa}
              onChange={val => setVozac(v => ({ ...v, adresa: val }))}
              onPostalChange={val => setVozac(v => ({ ...v, postanskiBroj: val }))}
              placeholder={placeholders.adresa}
              className="form-input"
              searchFunction={searchAddresses}
            />
          ) : (
            <input
              name={field}
              type={field === 'mail' ? 'email' : 'text'}
              className="form-input"
              placeholder={placeholders[field] || ""}
              value={vozac[field]}
              onChange={handleVozacChange}
              required
            />
          )}
        </div>
      ))}

      <div className="form-group">
        <label className="form-label">Broj vozačke dozvole: *</label>
        <input
          name="brojVozacke"
          className="form-input"
          placeholder={placeholders.brojVozacke}
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
          <option value="">{placeholders.kategorijaVozacke}</option>
          {['AM', 'A1', 'A2', 'A', 'B', 'BE', 'C', 'CE', 'D', 'DE', 'F', 'G', 'M', 'H'].map(opt => (
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
          placeholder={placeholders.valjanostVozacke}
          value={vozac.valjanostVozacke}
          onChange={handleVozacChange}
          required
        />
      </div>

      {error && (
        <div style={{ color: "#cc0000", marginTop: 10, fontWeight: "bold" }}>
          {error}
        </div>
      )}

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
  );
}
