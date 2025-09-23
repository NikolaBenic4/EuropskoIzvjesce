// VozacOsiguranikForm.jsx - ISPRAVKA ZA ADRESU I DATUM

import React, { useState, useEffect } from "react";
import "../css/VozacOsiguranikForm.css";
import AddressAutocomplete from "../components/AddressAutocomplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchAddressesDGU } from "../services/addressService";

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
  adresa_osiguranika: "Primjer: Ilica 15, Zagreb",
  postanskibroj_osiguranika: "Unesite poštanski broj",
  drzava_osiguranika: "Unesite državu",
  kontaktbroj_osiguranika: "npr. +385 91 123 4567",
  mail_osiguranika: "Unesite email",
  ime_vozaca: "Unesite ime",
  prezime_vozaca: "Unesite prezime",
  adresa_vozaca: "Primjer: Ilica 15, Zagreb",
  postanskibroj_vozaca: "Unesite poštanski broj",
  drzava_vozaca: "Unesite državu",
  kontaktbroj_vozaca: "npr. +385 91 123 4567",
  mail_vozaca: "Unesite email",
  brojvozackedozvole: "Unesite broj vozačke dozvole",
  kategorijavozackedozvole: "Odaberite kategoriju vozačke dozvole",
  valjanostvozackedozvole: "Odaberite datum valjanosti"
};

const INTERNATIONAL_PHONE_PATTERN = "^\\+\\d{7,15}$";

export default function VozacOsiguranikForm({ data, onNext, onBack, onChange }) {
  const [osiguranik, setOsiguranik] = useState({ ...OsiguranikInitial, ...(data?.osiguranik || {}) });
  const [vozac, setVozac] = useState({ ...VozacInitial, ...(data?.vozac || {}) });
  const [isti, setIsti] = useState(data?.isti ?? false);
  const [error, setError] = useState(data?.error || "");
  const [validnostDate, setValidnostDate] = useState(
    data?.vozac?.valjanostvozackedozvole ? new Date(data.vozac.valjanostvozackedozvole) : null
  );

  useEffect(() => {
    setOsiguranik({ ...OsiguranikInitial, ...(data?.osiguranik || {}) });
    setVozac({ ...VozacInitial, ...(data?.vozac || {}) });
    setIsti(data?.isti ?? false);
    setValidnostDate(data?.vozac?.valjanostvozackedozvole ? new Date(data.vozac.valjanostvozackedozvole) : null);
    setError(data?.error || "");
  }, [data]);

  const handleOsiguranikChange = e => {
    const { name, value } = e.target;
    const updated = { ...osiguranik, [name]: value };
    setOsiguranik(updated);
    let vozacUpdate = vozac;
    if (isti) {
      const vozacField = name.replace("osiguranika", "vozaca");
      vozacUpdate = { ...vozac, [vozacField]: value };
      setVozac(vozacUpdate);
    }
    onChange && onChange({ osiguranik: updated, vozac: vozacUpdate, [name]: value, isti });
  };

  const handleVozacChange = e => {
    const { name, value } = e.target;
    const updated = { ...vozac, [name]: value };
    setVozac(updated);
    onChange && onChange({ vozac: updated, [name]: value, isti });
  };

  const handleIstiChange = e => {
    const jeIsti = e.target.checked;
    setIsti(jeIsti);
    let vozacNew = jeIsti
      ? {
          ...vozac,
          ime_vozaca: osiguranik.ime_osiguranika,
          prezime_vozaca: osiguranik.prezime_osiguranika,
          adresa_vozaca: osiguranik.adresa_osiguranika,
          postanskibroj_vozaca: osiguranik.postanskibroj_osiguranika,
          drzava_vozaca: osiguranik.drzava_osiguranika,
          kontaktbroj_vozaca: osiguranik.kontaktbroj_osiguranika,
          mail_vozaca: osiguranik.mail_osiguranika
        }
      : { ...vozac };
    setVozac(vozacNew);
    onChange && onChange({ isti: jeIsti, vozac: vozacNew });
  };

  const handleDateChange = date => {
    setValidnostDate(date);
    const updated = { ...vozac, valjanostvozackedozvole: date ? date.toISOString().slice(0,10) : "" };
    setVozac(updated);
    onChange && onChange({ vozac: updated, valjanostvozackedozvole: date ? date.toISOString().slice(0,10) : "" });
  };

  // ISPRAVKA - funkcija za adresu pretraživanje
  const searchAddresses = async (query, setSuggestions, setLoading, setShowSuggestions) => {
    setLoading(true);
    try {
      const results = await fetchAddressesDGU(query);
      setSuggestions(Array.isArray(results) ? results.slice(0, 5) : []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Greška pri dohvaćanju adresa:', error);
      setSuggestions([]);
      setShowSuggestions(true);
    } finally {
      setLoading(false);
    }
  };

  // ISPRAVKA - funkcija za adresu osiguranika
  const handleOsiguranikAddressChange = (value) => {
  let addressText = value;
  let city = "";

  if (typeof value === "object" && value !== null) {
    const comps = value.address_components || [];
    const street = extractStreetAddress(comps);
    city = extractCity(comps);
    addressText = city ? `${street}, ${city}` : street;

    const post = extractPostalCode(comps);
    const drz = extractCountry(comps);

    const updated = {
      ...osiguranik,
      adresa_osiguranika: addressText,
      postanskibroj_osiguranika: post || "",
      drzava_osiguranika: drz || ""
    };
    setOsiguranik(updated);

    if (isti) {
      // kad je isti, očisti vozačeva polja
      const vozacUpdated = { ...VozacInitial };
      setVozac(vozacUpdated);
      onChange && onChange({ osiguranik: updated, vozac: vozacUpdated, isti });
    } else {
      // kad je različit, očisti vozačeva polja
      setVozac({ ...VozacInitial });
      onChange && onChange({ osiguranik: updated, isti });
    }
  } else {
    const updated = { ...osiguranik, adresa_osiguranika: addressText };
    setOsiguranik(updated);

    if (isti) {
      const vozacUpdated = { ...VozacInitial };
      setVozac(vozacUpdated);
      onChange && onChange({ osiguranik: updated, vozac: vozacUpdated, isti });
    } else {
      setVozac({ ...VozacInitial });
      onChange && onChange({ osiguranik: updated, isti });
    }
  }
};


  // ISPRAVKA - funkcija za adresu vozača
 const handleVozacAddressChange = (value) => {
    let addressText = value;
    let city = "";

    if (typeof value === "object" && value !== null) {
      const comps = value.address_components || [];
      const street = extractStreetAddress(comps);
      city = extractCity(comps);
      addressText = city ? `${street}, ${city}` : street;
      
      const post = extractPostalCode(comps);
      const drz = extractCountry(comps);
      
      const updated = {
        ...vozac,
        adresa_vozaca: addressText,
        postanskibroj_vozaca: post || vozac.postanskibroj_vozaca,
        drzava_vozaca: drz || vozac.drzava_vozaca
      };
      setVozac(updated);
      onChange && onChange({ vozac: updated, isti });
    } else {
      const updated = { ...vozac, adresa_vozaca: addressText };
      setVozac(updated);
      onChange && onChange({ vozac: updated, isti });
    }
  };


  const validateForm = () => {
    // Osnovne provjere
    const requiredOsiguranikFields = ['ime_osiguranika', 'prezime_osiguranika', 'adresa_osiguranika', 'kontaktbroj_osiguranika', 'mail_osiguranika'];
    
    for (const field of requiredOsiguranikFields) {
      if (!osiguranik[field] || osiguranik[field].trim() === '') {
        setError(`Molim unesite ${fieldLabels[field].toLowerCase()}.`);
        return false;
      }
    }

    // Provjera adrese - mora sadržavati broj
    if (!/\d/.test(osiguranik.adresa_osiguranika.trim())) {
      setError("Adresa osiguranika mora sadržavati kućni broj.");
      return false;
    }

    // Provjera vozačkih podataka
    if (!isti) {
      const requiredVozacFields = ['ime_vozaca', 'prezime_vozaca', 'adresa_vozaca', 'kontaktbroj_vozaca', 'mail_vozaca'];
      for (const field of requiredVozacFields) {
        if (!vozac[field] || vozac[field].trim() === '') {
          setError(`Molim unesite ${fieldLabels[field].toLowerCase()}.`);
          return false;
        }
      }
      
      if (!/\d/.test(vozac.adresa_vozaca.trim())) {
        setError("Adresa vozača mora sadržavati kućni broj.");
        return false;
      }
    }

    // Provjera vozačkih podataka
    if (!vozac.brojvozackedozvole.trim()) {
      setError("Molim unesite broj vozačke dozvole.");
      return false;
    }

    if (!vozac.kategorijavozackedozvole) {
      setError("Molim odaberite kategoriju vozačke dozvole.");
      return false;
    }

    if (!validnostDate) {
      setError("Molim odaberite datum valjanosti vozačke dozvole.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validateForm()) return;
    
    onNext({
      osiguranik,
      vozac: {
        ...vozac,
        valjanostvozackedozvole: validnostDate ? validnostDate.toISOString().slice(0,10) : ""
      },
      isti,
      brojvozackedozvole: vozac.brojvozackedozvole,
      kategorijavozackedozvole: vozac.kategorijavozackedozvole,
      valjanostvozackedozvole: validnostDate ? validnostDate.toISOString().slice(0,10) : ""
    });
  };

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o osiguraniku</h2>
      
      {/* Osiguranik polja */}
      {Object.keys(OsiguranikInitial).map(field => {
        if (field === "adresa_osiguranika") {
          return (
            <div className="form-group" key={field}>
              <label className="form-label">{fieldLabels[field]}:*</label>
              <AddressAutocomplete
                value={osiguranik.adresa_osiguranika}
                onChange={handleOsiguranikAddressChange}
                searchFunction={searchAddresses}
                placeholder={placeholders[field]}
                className="form-input"
              />
            </div>
          );
        }
        
        if (field === "kontaktbroj_osiguranika") {
          return (
            <div className="form-group" key={field}>
              <label className="form-label">{fieldLabels[field]}:*</label>
              <input
                name={field}
                type="tel"
                className="form-input"
                placeholder={placeholders[field]}
                value={osiguranik[field]}
                onChange={handleOsiguranikChange}
                required
                pattern={INTERNATIONAL_PHONE_PATTERN}
                title="Broj mora počinjati s + i sadržavati 7–15 znamenki"
              />
            </div>
          );
        }
        
        return (
          <div className="form-group" key={field}>
            <label className="form-label">{fieldLabels[field]}:*</label>
            <input
              name={field}
              type={field === "mail_osiguranika" ? "email" : "text"}
              className="form-input"
              placeholder={placeholders[field]}
              value={osiguranik[field]}
              onChange={handleOsiguranikChange}
              required
            />
          </div>
        );
      })}

      {/* Checkbox za isti vozač */}
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={isti}
            onChange={handleIstiChange}
            className="custom-checkbox"
            style={{ marginRight: 8 }}
          />
          Vozač je isti kao osiguranik
        </label>
      </div>

      {/* Vozač podaci */}
      <h2 className="nesreca-title">Podaci o vozaču</h2>
      
      {!isti && Object.keys(VozacInitial).slice(0, 7).map(field => {
        if (field === "adresa_vozaca") {
          return (
            <div className="form-group" key={field}>
              <label className="form-label">{fieldLabels[field]}:*</label>
              <AddressAutocomplete
                value={vozac.adresa_vozaca}
                onChange={handleVozacAddressChange}
                searchFunction={searchAddresses}
                placeholder={placeholders[field]}
                className="form-input"
              />
            </div>
          );
        }
        
        if (field === "kontaktbroj_vozaca") {
          return (
            <div className="form-group" key={field}>
              <label className="form-label">{fieldLabels[field]}:*</label>
              <input
                name={field}
                type="tel"
                className="form-input"
                placeholder={placeholders[field]}
                value={vozac[field]}
                onChange={handleVozacChange}
                required
                pattern={INTERNATIONAL_PHONE_PATTERN}
                title="Broj mora počinjati s + i sadržavati 7–15 znamenki"
              />
            </div>
          );
        }
        
        return (
          <div className="form-group" key={field}>
            <label className="form-label">{fieldLabels[field]}:*</label>
            <input
              name={field}
              type={field === "mail_vozaca" ? "email" : "text"}
              className="form-input"
              placeholder={placeholders[field]}
              value={vozac[field]}
              onChange={handleVozacChange}
              required
            />
          </div>
        );
      })}

      {/* Vozačka dozvola podaci */}
      <div className="form-group">
        <label className="form-label">{fieldLabels.brojvozackedozvole}:*</label>
        <input
          name="brojvozackedozvole"
          className="form-input"
          placeholder={placeholders.brojvozackedozvole}
          value={vozac.brojvozackedozvole}
          onChange={handleVozacChange}
          required
          pattern="^[A-Za-z0-9]{7,12}$"
          title="7–12 znamenki ili slova"
        />
      </div>

      <div className="form-group">
        <label className="form-label">{fieldLabels.kategorijavozackedozvole}:*</label>
        <select
          name="kategorijavozackedozvole"
          value={vozac.kategorijavozackedozvole}
          onChange={handleVozacChange}
          className="form-input"
          required
        >
          <option value="">{placeholders.kategorijavozackedozvole}</option>
          {['AM','A1','A2','A','B','BE','C','CE','D','DE','F','G','M','H'].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">{fieldLabels.valjanostvozackedozvole}:*</label>
        <DatePicker
          selected={validnostDate}
          onChange={handleDateChange}
          dateFormat="dd.MM.yyyy"
          className="form-input"
          placeholderText={placeholders.valjanostvozackedozvole}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          minDate={new Date()}
          maxDate={new Date(2040, 11, 31)}
          required
          autoComplete="off"
        />
      </div>

      {error && (
        <div className="form-error" style={{ 
          marginTop: 10, 
          padding: '10px',
          backgroundColor: '#ffeeee',
          border: '1px solid #cc0000',
          borderRadius: '5px',
          color: '#cc0000'
        }}>
          {error}
        </div>
      )}

      <div className="navigation-buttons">
        {onBack && (
          <button type="button" className="back-button" onClick={onBack} style={{ marginRight: 6 }}>
            NAZAD
          </button>
        )}
        <button type="submit" className="next-button">
          DALJE
        </button>
      </div>
    </form>
  );
}