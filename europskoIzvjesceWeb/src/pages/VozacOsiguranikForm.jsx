import React from 'react';
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

// Funkcija za formatiranje labela kao "Ime osiguranika", "Kontakt broj vozača" itd.
function getLabelName(field) {
  let baseName = field.replace(/_/g, ' ');
  if (field.includes('osiguranika')) {
    baseName = baseName.replace('osiguranika', '').trim();
    return baseName.charAt(0).toUpperCase() + baseName.slice(1) + ' osiguranika';
  }
  if (field.includes('vozaca')) {
    baseName = baseName.replace('vozaca', '').trim();
    return baseName.charAt(0).toUpperCase() + baseName.slice(1) + ' vozača';
  }
  return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

const OsiguranikInitial = {
  ime_osiguranika: "",
  prezime_osiguranika: "",
  adresa_osiguranika: "",
  postanskibroj_osiguranika: "",
  drzava_osiguranika: "",
  kontaktbroj_osiguranika: "",
  mail_osiguranika: ""
};

const VozacInitial = {
  ime_vozaca: "",
  prezime_vozaca: "",
  adresa_vozaca: "",
  postanskibroj_vozaca: "",
  drzava_vozaca: "",
  kontaktbroj_vozaca: "",
  mail_vozaca: "",
  brojvozackedozvole: "",
  kategorijavozackedozvole: "",
  valjanostvozackedozvole: ""
};

const placeholders = {
  ime_osiguranika: "Unesite ime",
  prezime_osiguranika: "Unesite prezime",
  adresa_osiguranika: "Unesite adresu i mjesto",
  postanskibroj_osiguranika: "Unesite poštanski broj",
  drzava_osiguranika: "Unesite državu",
  kontaktbroj_osiguranika: "npr. +385 91 123 4567",
  mail_osiguranika: "Unesite email",
  brojvozackedozvole: "Unesite broj vozačke dozvole",
  kategorijavozackedozvole: "Odaberite kategoriju vozačke dozvole",
  valjanostvozackedozvole: "Odaberite valjanost vozačke dozvole"
};

const HR_PHONE_PATTERN = "^\\+385 ?9[1-9][0-9] ?\\d{3,4} ?\\d{3,4}$";

export default function vozacOsiguranikForm({ data, onNext, onBack, onChange }) {
  // Controlled pristup: nema lokalnog statea, sve u props.data
  const osiguranik = { ...OsiguranikInitial, ...(data?.osiguranik || {}) };
  const vozac = { ...VozacInitial, ...(data?.vozac || {}) };
  const isti = data?.isti ?? (
    vozac.ime_vozaca === osiguranik.ime_osiguranika && vozac.prezime_vozaca === osiguranik.prezime_osiguranika
  );
  const error = data?.error || "";

  // Handleri promjena za osiguranika
  const handleOsiguranikChange = e => {
    const { name, value } = e.target;
    const updated = { ...osiguranik, [name]: value };
    let vozacUpdate = isti
      ? { ...vozac, [name.replace("osiguranika", "vozaca")]: value }
      : vozac;
    onChange({
      osiguranik: updated,
      vozac: vozacUpdate
    });
  };

  // Handleri promjena za vozača
  const handleVozacChange = e => {
    const { name, value } = e.target;
    onChange({
      vozac: { ...vozac, [name]: value }
    });
  };

  // Checkbox isti vozač i osiguranik
  const handleIstiChange = e => {
    const jeIsti = e.target.checked;
    let vozacNew = jeIsti
      ? { ...vozac, ...osiguranik }
      : VozacInitial;
    onChange({ isti: jeIsti, vozac: vozacNew });
  };

  // Validacija
  const validateForm = () => {
    const imaBrojOsiguranik = /\d/.test(osiguranik.adresa_osiguranika.trim());
    if (!imaBrojOsiguranik) {
      onChange({ error: "Unesite kućni broj u adresu osiguranika." });
      return false;
    }
    if (!isti) {
      const imaBrojVozac = /\d/.test(vozac.adresa_vozaca.trim());
      if (!imaBrojVozac) {
        onChange({ error: "Unesite kućni broj u adresu vozača." });
        return false;
      }
    }
    onChange({ error: "" });
    return true;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validateForm()) return;
    onNext({
      osiguranik,
      vozac,
      isti
    });
  };

  const inputFields = [
    'ime_osiguranika', 'prezime_osiguranika',
    'adresa_osiguranika', 'postanskibroj_osiguranika',
    'drzava_osiguranika', 'kontaktbroj_osiguranika', 'mail_osiguranika'
  ];

  const vozacInputFields = [
    'ime_vozaca', 'prezime_vozaca',
    'adresa_vozaca', 'postanskibroj_vozaca',
    'drzava_vozaca', 'kontaktbroj_vozaca', 'mail_vozaca'
  ];

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o osiguraniku</h2>
      {inputFields.map(field => (
        <div className="form-group" key={"osiguranik-" + field}>
          <label className="form-label">
            {field === 'mail_osiguranika'
              ? 'Email:*'
              : getLabelName(field) + ':*'}
          </label>
          {field === 'adresa_osiguranika' ? (
            <AddressAutocomplete
              value={osiguranik.adresa_osiguranika + "," + (osiguranik.grad ? ' ' + osiguranik.grad : '')}
              onChange={res => {
                const components = res.address_components || [];
                const addr = extractStreetAddress(components) || res.formatted_address || res.formatted || res.description || res;
                const postBroj = extractPostalCode(components);
                const grad = extractCity(components);
                const drzava = extractCountry(components);
                let updated = {
                  ...osiguranik,
                  adresa_osiguranika: addr,
                  postanskibroj_osiguranika: postBroj,
                  drzava_osiguranika: drzava,
                  grad,
                };
                let vozacUpdate = isti
                  ? { ...vozac, adresa_vozaca: addr, postanskibroj_vozaca: postBroj, drzava_vozaca: drzava, grad }
                  : vozac;
                onChange({
                  osiguranik: updated,
                  vozac: vozacUpdate
                });
              }}
              placeholder={placeholders.adresa_osiguranika}
              className="form-input"
            />
          ) : field === 'kontaktbroj_osiguranika' ? (
            <input
              name="kontaktbroj_osiguranika"
              type="tel"
              className="form-input"
              placeholder={placeholders.kontaktbroj_osiguranika}
              value={osiguranik.kontaktbroj_osiguranika}
              onChange={handleOsiguranikChange}
              required
              pattern={HR_PHONE_PATTERN}
              title="Upišite hrvatski broj mobitela u formatu +385 91 123 4567"
              maxLength={17}
            />
          ) : field === 'postanskibroj_osiguranika' ? (
            <input
              name="postanskibroj_osiguranika"
              type="text"
              className="form-input"
              placeholder={placeholders.postanskibroj_osiguranika}
              value={osiguranik.postanskibroj_osiguranika}
              onChange={handleOsiguranikChange}
              required
            />
          ) : field === 'drzava_osiguranika' ? (
            <input
              name="drzava_osiguranika"
              type="text"
              className="form-input"
              placeholder={placeholders.drzava_osiguranika}
              value={osiguranik.drzava_osiguranika}
              onChange={handleOsiguranikChange}
              required
            />
          ) : field === 'mail_osiguranika' ? (
            <input
              name="mail_osiguranika"
              type="email"
              className="form-input"
              placeholder={placeholders.mail_osiguranika}
              value={osiguranik.mail_osiguranika}
              onChange={handleOsiguranikChange}
              required
            />
          ) : (
            <input
              name={field}
              type="text"
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
      {!isti && vozacInputFields.map(field => (
        <div className="form-group" key={"vozac-" + field}>
          <label className="form-label">
            {field === 'mail_vozaca'
              ? 'Email:*'
              : getLabelName(field) + ':*'}
          </label>
          {field === 'adresa_vozaca' ? (
            <AddressAutocomplete
              value={vozac.adresa_vozaca + "," +(vozac.grad ? ' ' + vozac.grad : '')}
              onChange={res => {
                const components = res.address_components || [];
                const addr = extractStreetAddress(components) || res.formatted_address || res.formatted || res.description || res;
                const postBroj = extractPostalCode(components);
                const grad = extractCity(components);
                const drzava = extractCountry(components);
                onChange({
                  vozac: {
                    ...vozac,
                    adresa_vozaca: addr,
                    postanskibroj_vozaca: postBroj,
                    drzava_vozaca: drzava,
                    grad,
                  }
                });
              }}
              placeholder={placeholders.adresa_vozaca}
              className="form-input"
            />
          ) : field === 'kontaktbroj_vozaca' ? (
            <input
              name="kontaktbroj_vozaca"
              type="tel"
              className="form-input"
              placeholder={placeholders.kontaktbroj_vozaca}
              value={vozac.kontaktbroj_vozaca}
              onChange={handleVozacChange}
              required
              pattern={HR_PHONE_PATTERN}
              title="Upišite hrvatski broj mobitela u formatu +385 91 123 4567"
              maxLength={17}
            />
          ) : field === 'postanskibroj_vozaca' ? (
            <input
              name="postanskibroj_vozaca"
              type="text"
              className="form-input"
              placeholder={placeholders.postanskibroj_vozaca}
              value={vozac.postanskibroj_vozaca}
              onChange={handleVozacChange}
              required
            />
          ) : field === 'drzava_vozaca' ? (
            <input
              name="drzava_vozaca"
              type="text"
              className="form-input"
              placeholder={placeholders.drzava_vozaca}
              value={vozac.drzava_vozaca}
              onChange={handleVozacChange}
              required
            />
          ) : field === 'mail_vozaca' ? (
            <input
              name="mail_vozaca"
              type="email"
              className="form-input"
              placeholder={placeholders.mail_vozaca}
              value={vozac.mail_vozaca}
              onChange={handleVozacChange}
              required
            />
          ) : (
            <input
              name={field}
              type="text"
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
          name="brojvozackedozvole"
          className="form-input"
          placeholder={placeholders.brojvozackedozvole}
          value={vozac.brojvozackedozvole || ""}
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
          name="kategorijavozackedozvole"
          value={vozac.kategorijavozackedozvole || ""}
          onChange={handleVozacChange}
          className="form-input"
          required
        >
          <option value="">{placeholders.kategorijavozackedozvole}</option>
          {['AM', 'A1', 'A2', 'A', 'B', 'BE', 'C', 'CE', 'D', 'DE', 'F', 'G', 'M', 'H'].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Valjanost vozačke dozvole:*</label>
        <input
          name="valjanostvozackedozvole"
          type="date"
          className="form-input"
          placeholder={placeholders.valjanostvozackedozvole}
          value={vozac.valjanostvozackedozvole || ""}
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
            style={{ marginRight: 6 }}
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
