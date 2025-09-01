import React, { useState } from "react";
import "../css/SvjedociForm.css";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { fetchAddressesDGU } from "../services/addressService";

export default function SvjedociForm({ onNext }) {
  const [formData, setFormData] = useState({
    ozlijedeni: false,
    stetanastvarima: false,
    stetanavozilu: false,
    hasSvjedoci: false,
    svjedokImePrezime: "",
    svjedokUlica: "",
    svjedokBroj: "",
    svjedokKontakt: ""
  });

  const handleCheckbox = (field) => {
    setFormData((p) => ({ ...p, [field]: !p[field] }));
  };

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Spoji ulica i broj u jedno polje adrese kad šalješ podatke
    const formToSend = {
      ...formData,
      svjedokAdresa: formData.svjedokUlica + (formData.svjedokBroj ? " " + formData.svjedokBroj : "")
    };
    onNext?.(formToSend);
  };

  // Autocomplete za ulicu, prijedlozi za dio ulice
  const searchAddresses = async (query, setSug, setLoad, setShow) => {
  setLoad(true);
  try {
    const list = await fetchAddressesDGU(query);
    // Ako rezultat nije array, uvijek stavi prazni array
    setSug(Array.isArray(list) ? list.slice(0, 2) : []);
    setShow(true);
  } catch (e) {
    console.error(e);
    setSug([]);
    setShow(true);
  } finally {
    setLoad(false);
  }
};


  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o šteti i svjedocima</h2>

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

      {formData.hasSvjedoci && (
        <div className="svjedoci-section">
          <h3>Podaci o svjedoku</h3>

          <div className="form-group">
            <label className="form-label">Ime i prezime</label>
            <input
              type="text"
              className="form-input"
              value={formData.svjedokImePrezime}
              onChange={(e) => handleChange("svjedokImePrezime", e.target.value)}
              placeholder="Unesite ime i prezime"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ulica</label>
            <AddressAutocomplete
              value={formData.svjedokUlica}
              onChange={(val) => handleChange("svjedokUlica", val)}
              placeholder="Počnite tipkati ulicu..."
              className="form-input"
              searchFunction={searchAddresses}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Broj</label>
            <input
              type="text"
              className="form-input"
              value={formData.svjedokBroj}
              onChange={(e) => handleChange("svjedokBroj", e.target.value)}
              placeholder="Kućni broj"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kontakt</label>
            <input
              type="text"
              className="form-input"
              value={formData.svjedokKontakt}
              onChange={(e) => handleChange("svjedokKontakt", e.target.value)}
              placeholder="Broj mobitela ili telefona"
            />
          </div>
        </div>
      )}

      <button type="submit" className="submit-button">
        Spremi i nastavi
      </button>
    </form>
  );
}
