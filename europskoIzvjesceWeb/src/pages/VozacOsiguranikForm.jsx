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

// Mapiranje naziva polja na hrvatski književni jezik
const fieldLabels = {
  ime_osiguranika: "Ime osiguranika",
  prezime_osiguranika: "Prezime osiguranika", 
  adresa_osiguranika: "Adresa osiguranika",
  postanskibroj_osiguranika: "Poštanski broj osiguranika",
  drzava_osiguranika: "Država osiguranika",
  kontaktbroj_osiguranika: "Kontakt broj osiguranika",
  mail_osiguranika: "Email osiguranika",
  ime_vozaca: "Ime vozača",
  prezime_vozaca: "Prezime vozača",
  adresa_vozaca: "Adresa vozača", 
  postanskibroj_vozaca: "Poštanski broj vozača",
  drzava_vozaca: "Država vozača",
  kontaktbroj_vozaca: "Kontakt broj vozača",
  mail_vozaca: "Email vozača",
  brojvozackedozvole: "Broj vozačke dozvole",
  kategorijavozackedozvole: "Kategorija vozačke dozvole",
  valjanostvozackedozvole: "Valjanost vozačke dozvole"
};

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
  ime_vozaca: "Unesite ime",
  prezime_vozaca: "Unesite prezime",
  adresa_vozaca: "Unesite adresu i mjesto",
  postanskibroj_vozaca: "Unesite poštanski broj",
  drzava_vozaca: "Unesite državu",
  kontaktbroj_vozaca: "npr. +385 91 123 4567",
  mail_vozaca: "Unesite email",
  brojvozackedozvole: "Unesite broj vozačke dozvole",
  kategorijavozackedozvole: "Odaberite kategoriju vozačke dozvole",
  valjanostvozackedozvole: "Odaberite valjanost vozačke dozvole"
};

const HR_PHONE_PATTERN = "^\\+385 ?9[1-9][0-9] ?\\d{3,4} ?\\d{3,4}$";

export default function VozacOsiguranikForm({ data, onNext, onBack, onChange }) {
  const osiguranik = { ...OsiguranikInitial, ...(data?.osiguranik || {}) };
  const vozac = { ...VozacInitial, ...(data?.vozac || {}) };
  const isti = data?.isti ?? false;
  const error = data?.error || "";

  // Handleri promjena za osiguranika
  const handleOsiguranikChange = e => {
    const { name, value } = e.target;
    const updated = { ...osiguranik, [name]: value };
    
    let vozacUpdate = vozac;
    if (isti) {
      // Ako je vozač isti kao osiguranik, ažuriraj i podatke vozača
      const vozacField = name.replace("osiguranika", "vozaca");
      vozacUpdate = { ...vozac, [vozacField]: value };
    }
    
    onChange({
      osiguranik: updated,
      vozac: vozacUpdate,
      // DODANO - također ažuriraj root level podatke
      [name]: value,
      isti
    });
  };

  // Handleri promjena za vozača
  const handleVozacChange = e => {
    const { name, value } = e.target;
    const updatedVozac = { ...vozac, [name]: value };
    
    onChange({
      vozac: updatedVozac,
      // DODANO - također ažuriraj root level podatke
      [name]: value,
      isti
    });
  };

  // Checkbox isti vozač i osiguranik
  const handleIstiChange = e => {
    const jeIsti = e.target.checked;
    
    let vozacNew;
    if (jeIsti) {
      // Ako je označen checkbox, kopiraj podatke osiguranika u vozača
      vozacNew = {
        ...vozac,
        ime_vozaca: osiguranik.ime_osiguranika,
        prezime_vozaca: osiguranik.prezime_osiguranika,
        adresa_vozaca: osiguranik.adresa_osiguranika,
        postanskibroj_vozaca: osiguranik.postanskibroj_osiguranika,
        drzava_vozaca: osiguranik.drzava_osiguranika,
        kontaktbroj_vozaca: osiguranik.kontaktbroj_osiguranika,
        mail_vozaca: osiguranik.mail_osiguranika
      };
    } else {
      // Ako nije označen, počisti osnovne podatke vozača ali zadrži vozačku dozvolu
      vozacNew = {
        brojvozackedozvole: vozac.brojvozackedozvole || "",
        kategorijavozackedozvole: vozac.kategorijavozackedozvole || "",
        valjanostvozackedozvole: vozac.valjanostvozackedozvole || "",
        ime_vozaca: "",
        prezime_vozaca: "",
        adresa_vozaca: "",
        postanskibroj_vozaca: "",
        drzava_vozaca: "",
        kontaktbroj_vozaca: "",
        mail_vozaca: ""
      };
    }
    
    onChange({ 
      isti: jeIsti, 
      vozac: vozacNew,
      // DODANO - također ažuriraj root level podatke
      ime_vozaca: vozacNew.ime_vozaca,
      prezime_vozaca: vozacNew.prezime_vozaca,
      adresa_vozaca: vozacNew.adresa_vozaca,
      postanskibroj_vozaca: vozacNew.postanskibroj_vozaca,
      drzava_vozaca: vozacNew.drzava_vozaca,
      kontaktbroj_vozaca: vozacNew.kontaktbroj_vozaca,
      mail_vozaca: vozacNew.mail_vozaca,
      brojvozackedozvole: vozacNew.brojvozackedozvole,
      kategorijavozackedozvole: vozacNew.kategorijavozackedozvole,
      valjanostvozackedozvole: vozacNew.valjanostvozackedozvole
    });
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
    
    // ISPRAVA - pošaljemo podatke u strukturi koju backend očekuje
    const submitData = {
      osiguranik,
      vozac,
      isti,
      // DODANO - dodajemo vozačku dozvolu direktno na root level za sve slučajeve
      brojvozackedozvole: vozac.brojvozackedozvole,
      kategorijavozackedozvole: vozac.kategorijavozackedozvole,
      valjanostvozackedozvole: vozac.valjanostvozackedozvole,
      // DODANO - dodajemo osiguranika kao root level podatke također
      ime_osiguranika: osiguranik.ime_osiguranika,
      prezime_osiguranika: osiguranik.prezime_osiguranika,
      adresa_osiguranika: osiguranik.adresa_osiguranika,
      postanskibroj_osiguranika: osiguranik.postanskibroj_osiguranika,
      drzava_osiguranika: osiguranik.drzava_osiguranika,
      kontaktbroj_osiguranika: osiguranik.kontaktbroj_osiguranika,
      mail_osiguranika: osiguranik.mail_osiguranika,
      // DODANO - dodajemo vozača kao root level podatke također
      ime_vozaca: vozac.ime_vozaca,
      prezime_vozaca: vozac.prezime_vozaca,
      adresa_vozaca: vozac.adresa_vozaca,
      postanskibroj_vozaca: vozac.postanskibroj_vozaca,
      drzava_vozaca: vozac.drzava_vozaca,
      kontaktbroj_vozaca: vozac.kontaktbroj_vozaca,
      mail_vozaca: vozac.mail_vozaca
    };
    
    console.log('📤 Sending vozacOsiguranik data:', submitData);
    onNext(submitData);
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
      {inputFields.map(field => (
        <div className="form-group" key={"osiguranik-" + field}>
          <label className="form-label">
            {fieldLabels[field]}:*
          </label>
          {field === 'adresa_osiguranika' ? (
            <AddressAutocomplete
              value={osiguranik.adresa_osiguranika + (osiguranik.grad ? ', ' + osiguranik.grad : '')}
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
                  vozac: vozacUpdate,
                  // DODANO - također ažuriraj root level podatke
                  adresa_osiguranika: addr,
                  postanskibroj_osiguranika: postBroj,
                  drzava_osiguranika: drzava,
                  ...(isti && {
                    adresa_vozaca: addr,
                    postanskibroj_vozaca: postBroj,
                    drzava_vozaca: drzava
                  }),
                  isti
                });
              }}
              placeholder={placeholders[field]}
              className="form-input"
            />
          ) : field === 'kontaktbroj_osiguranika' ? (
            <input
              name={field}
              type="tel"
              className="form-input"
              placeholder={placeholders[field]}
              value={osiguranik[field]}
              onChange={handleOsiguranikChange}
              required
              pattern={HR_PHONE_PATTERN}
              title="Upišite hrvatski broj mobitela u formatu +385 91 123 4567"
              maxLength={17}
            />
          ) : field === 'mail_osiguranika' ? (
            <input
              name={field}
              type="email"
              className="form-input"
              placeholder={placeholders[field]}
              value={osiguranik[field]}
              onChange={handleOsiguranikChange}
              required
            />
          ) : (
            <input
              name={field}
              type="text"
              className="form-input"
              placeholder={placeholders[field]}
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
            {fieldLabels[field]}:*
          </label>
          {field === 'adresa_vozaca' ? (
            <AddressAutocomplete
              value={vozac.adresa_vozaca + (vozac.grad ? ', ' + vozac.grad : '')}
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
                  },
                  // DODANO - također ažuriraj root level podatke
                  adresa_vozaca: addr,
                  postanskibroj_vozaca: postBroj,
                  drzava_vozaca: drzava,
                  isti
                });
              }}
              placeholder={placeholders[field]}
              className="form-input"
            />
          ) : field === 'kontaktbroj_vozaca' ? (
            <input
              name={field}
              type="tel"
              className="form-input"
              placeholder={placeholders[field]}
              value={vozac[field]}
              onChange={handleVozacChange}
              required
              pattern={HR_PHONE_PATTERN}
              title="Upišite hrvatski broj mobitela u formatu +385 91 123 4567"
              maxLength={17}
            />
          ) : field === 'mail_vozaca' ? (
            <input
              name={field}
              type="email"
              className="form-input"
              placeholder={placeholders[field]}
              value={vozac[field]}
              onChange={handleVozacChange}
              required
            />
          ) : (
            <input
              name={field}
              type="text"
              className="form-input"
              placeholder={placeholders[field]}
              value={vozac[field]}
              onChange={handleVozacChange}
              required
            />
          )}
        </div>
      ))}

      <div className="form-group">
        <label className="form-label">{fieldLabels.brojvozackedozvole}:*</label>
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
        <label className="form-label">{fieldLabels.kategorijavozackedozvole}:*</label>
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
        <label className="form-label">{fieldLabels.valjanostvozackedozvole}:*</label>
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
