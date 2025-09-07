import React, { useState, useEffect } from 'react';
import '../css/VozacOsiguranikForm.css';
import AddressAutocomplete from '../components/AddressAutocomplete';

// Helperi za parsiranje
function extractPostalCode(components) {
  if (!components) return "";
  const postal = components.find(comp => comp.types.includes("postal_code"));
  return postal ? postal.long_name : "";
}
function extractCity(components) {
  if (!components) return "";
  const city =
    components.find(c => c.types.includes("locality")) ||
    components.find(c => c.types.includes("postal_town")) ||
    components.find(c => c.types.includes("administrative_area_level_3")) ||
    components.find(c => c.types.includes("administrative_area_level_2"));
  return city ? city.long_name : "";
}
function extractCountry(components) {
  if (!components) return "";
  const country = components.find(comp => comp.types.includes("country"));
  return country ? country.long_name : "";
}
function extractStreetAddress(components) {
  if (!components) return "";
  const street = components.find(c => c.types.includes("route"));
  const number = components.find(c => c.types.includes("street_number"));
  if (street && number) return `${street.long_name} ${number.long_name}`;
  if (street) return street.long_name;
  return "";
}

// Mapiraj prema tvojoj bazi
const mapOsiguranikToDb = (o) => ({
  ime_osiguranika: o.ime,
  prezime_osiguranika: o.prezime,
  adresa_osiguranika: o.adresa,
  postanskibroj_osiguranika: o.postanskiBroj,
  grad_osiguranika: o.grad,
  drzava_osiguranika: o.drzava,
  kontaktbroj_osiguranika: o.kontakt,
  mail_osiguranika: o.mail,
});
const mapVozacToDb = (v) => ({
  ime_vozaca: v.ime,
  prezime_vozaca: v.prezime,
  adresa_vozaca: v.adresa,
  postanskibroj_vozaca: v.postanskiBroj,
  grad_vozaca: v.grad,
  drzava_vozaca: v.drzava,
  kontaktbroj_vozaca: v.kontakt,
  mail_vozaca: v.mail,
  brojvozackedozvole: v.brojVozacke,
  kategorijavozackedozvole: v.kategorijaVozacke,
  valjanostvozackedozvole: v.valjanostVozacke,
});

const OsiguranikInitial = {
  ime: "",
  prezime: "",
  adresa: "",
  postanskiBroj: "",
  grad: "",
  drzava: "",
  kontakt: "",
  mail: ""
};
const VozacInitial = {
  ime: "",
  prezime: "",
  adresa: "",
  postanskiBroj: "",
  grad: "",
  drzava: "",
  kontakt: "",
  mail: "",
  brojVozacke: "",
  kategorijaVozacke: "",
  valjanostVozacke: ""
};

const placeholders = {
  ime: "Unesite ime",
  prezime: "Unesite prezime",
  adresa: "Unesite adresu",
  "poštanski broj": "Unesite poštanski broj",
  postanskiBroj: "Unesite poštanski broj",
  grad: "Unesite grad",
  država: "Unesite državu",
  drzava: "Unesite državu",
  kontakt: "npr. +385 91 123 4567",
  mail: "Unesite email",
  brojVozacke: "Unesite broj vozačke dozvole",
  kategorijaVozacke: "Odaberite kategoriju vozačke dozvole",
  valjanostVozacke: "Odaberite valjanost vozačke dozvole"
};

// Regex: +385 (razmak opcionalan) 9xx (mobilni) (razmak opcionalan) znamenke (6-7 ukupno)
const HR_PHONE_PATTERN = "^\\+385 ?9[1-9][0-9] ?\\d{3,4} ?\\d{3,4}$";

export default function VozacPolicaForm({ data, onNext, onBack }) {
  const [osiguranik, setOsiguranik] = useState({ ...OsiguranikInitial, ...(data?.osiguranik || {}) });
  const [vozac, setVozac] = useState({ ...VozacInitial, ...(data?.vozac || {}) });
  const [isti, setIsti] = useState(!(data && data.vozac && data.vozac.ime !== data.osiguranik?.ime));
  const [error, setError] = useState("");

  useEffect(() => {
    setOsiguranik({ ...OsiguranikInitial, ...(data?.osiguranik || {}) });
    setVozac({ ...VozacInitial, ...(data?.vozac || {}) });
    setIsti(!(data && data.vozac && data.vozac.ime !== data.osiguranik?.ime));
  }, [data]);

  useEffect(() => {
    if (isti) {
      setVozac(v => ({
        ...v,
        ime: osiguranik.ime,
        prezime: osiguranik.prezime,
        adresa: osiguranik.adresa,
        postanskiBroj: osiguranik.postanskiBroj,
        grad: osiguranik.grad,
        drzava: osiguranik.drzava,
        kontakt: osiguranik.kontakt,
        mail: osiguranik.mail
      }));
    }
  }, [isti, osiguranik]);

  useEffect(() => {
    if (!isti) setVozac(VozacInitial);
  }, [isti]);

  const handleOsiguranikChange = e => {
    const { name, value } = e.target;
    setOsiguranik(o => ({ ...o, [name]: value }));
    if (isti) setVozac(v => ({ ...v, [name]: value }));
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
    const zaSlanje = {
      osiguranik: mapOsiguranikToDb(osiguranik),
      vozac: mapVozacToDb(vozac)
    };
    onNext?.(zaSlanje);
  };

  const inputFields = ['ime', 'prezime', 'adresa', 'poštanski broj', 'grad', 'država', 'kontakt', 'mail'];

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o osiguraniku</h2>
      {inputFields.map(field => (
        <div className="form-group" key={"osiguranik-" + field}>
          <label className="form-label">
            {field === 'mail'
              ? 'Email:*'
              : `${field.charAt(0).toUpperCase() + field.slice(1)}:*`}
          </label>
          {field === 'adresa' ? (
            <AddressAutocomplete
              value={osiguranik.adresa}
              onChange={res => {
                const components = res.address_components || [];
                const addr = extractStreetAddress(components) || res.formatted_address || res.formatted || res.description || res;
                const postBroj = extractPostalCode(components);
                const grad = extractCity(components);
                const drzava = extractCountry(components);
                setOsiguranik(o => ({
                  ...o,
                  adresa: addr,
                  postanskiBroj: postBroj,
                  grad: grad,
                  drzava: drzava
                }));
                if (isti)
                  setVozac(v => ({
                    ...v,
                    adresa: addr,
                    postanskiBroj: postBroj,
                    grad: grad,
                    drzava: drzava
                  }));
              }}
              placeholder={placeholders.adresa}
              className="form-input"
            />
          ) : field === 'kontakt' ? (
            <input
              name="kontakt"
              type="tel"
              className="form-input"
              placeholder={placeholders.kontakt}
              value={osiguranik.kontakt}
              onChange={handleOsiguranikChange}
              required
              pattern={HR_PHONE_PATTERN}
              title="Upišite hrvatski broj mobitela u formatu +385 91 123 4567"
              maxLength={17}
            />
          ) : field === 'poštanski broj' ? (
            <input
              name="postanskiBroj"
              type="text"
              className="form-input"
              placeholder={placeholders.postanskiBroj}
              value={osiguranik.postanskiBroj}
              onChange={handleOsiguranikChange}
              required
            />
          ) : field === 'grad' ? (
            <input
              name="grad"
              type="text"
              className="form-input"
              placeholder={placeholders.grad}
              value={osiguranik.grad}
              onChange={handleOsiguranikChange}
              required
            />
          ) : field === 'država' ? (
            <input
              name="drzava"
              type="text"
              className="form-input"
              placeholder={placeholders.drzava}
              value={osiguranik.drzava}
              onChange={handleOsiguranikChange}
              required
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
          <input
            type="checkbox"
            checked={isti}
            onChange={handleIstiChange}
            className="custom-checkbox"
            style={{ marginRight: '8px' }}
          />
          Vozač je isti kao osiguranik
        </label>
      </div>

      <h2 className="nesreca-title">Podaci o vozaču</h2>
      {!isti && inputFields.map(field => (
        <div className="form-group" key={"vozac-" + field}>
          <label className="form-label">
            {field === 'mail'
              ? 'Email:*'
              : `${field.charAt(0).toUpperCase() + field.slice(1)}:*`}
          </label>
          {field === 'adresa' ? (
            <AddressAutocomplete
              value={vozac.adresa}
              onChange={res => {
                const components = res.address_components || [];
                const addr = extractStreetAddress(components) || res.formatted_address || res.formatted || res.description || res;
                const postBroj = extractPostalCode(components);
                const grad = extractCity(components);
                const drzava = extractCountry(components);
                setVozac(v => ({
                  ...v,
                  adresa: addr,
                  postanskiBroj: postBroj,
                  grad: grad,
                  drzava: drzava
                }));
              }}
              placeholder={placeholders.adresa}
              className="form-input"
            />
          ) : field === 'kontakt' ? (
            <input
              name="kontakt"
              type="tel"
              className="form-input"
              placeholder={placeholders.kontakt}
              value={vozac.kontakt}
              onChange={handleVozacChange}
              required
              pattern={HR_PHONE_PATTERN}
              title="Upišite hrvatski broj mobitela u formatu +385 91 123 4567"
              maxLength={17}
            />
          ) : field === 'poštanski broj' ? (
            <input
              name="postanskiBroj"
              type="text"
              className="form-input"
              placeholder={placeholders.postanskiBroj}
              value={vozac.postanskiBroj}
              onChange={handleVozacChange}
              required
            />
          ) : field === 'grad' ? (
            <input
              name="grad"
              type="text"
              className="form-input"
              placeholder={placeholders.grad}
              value={vozac.grad}
              onChange={handleVozacChange}
              required
            />
          ) : field === 'država' ? (
            <input
              name="drzava"
              type="text"
              className="form-input"
              placeholder={placeholders.drzava}
              value={vozac.drzava}
              onChange={handleVozacChange}
              required
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
      <label className="form-label">Broj vozačke dozvole:*</label>
      <input
        name="brojVozacke"
        className="form-input"
        placeholder={placeholders.brojVozacke}
        value={vozac.brojVozacke}
        onChange={handleVozacChange}
        required
        pattern="^[A-Za-z0-9]{7,12}$"
        minLength={7}
        maxLength={12}
        title="Upišite 7-12 znamenki ili slova (bez razmaka i specijalnih znakova)"
      />
    </div>
      <div className="form-group">
        <label className="form-label">Kategorija vozačke dozvole:*</label>
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
        <label className="form-label">Valjanost vozačke dozvole:*</label>
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
