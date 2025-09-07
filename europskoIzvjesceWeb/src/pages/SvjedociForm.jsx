import React, { useState, useEffect } from "react";
import "../css/SvjedociForm.css";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { fetchAddressesDGU } from "../services/addressService";

export default function SvjedociForm({ data, onNext, onBack }) {
  // Lokalni state podudaranje s bazom!
  const [formData, setFormData] = useState(() => ({
    ozlijedeneososbe: data?.ozlijedeneososbe || false,
    stetanastvarima: data?.stetanastvarima || false,
    stetanavozilima: data?.stetanavozilima || false,
    hasSvjedoci: data?.hasSvjedoci || false,
    ime_prezime_svjedok: data?.ime_prezime_svjedok || [""],
    adresa_svjedok: data?.adresa_svjedok || [""],
    kontakt_svjedok: data?.kontakt_svjedok || [""]
  }));
  const [error, setError] = useState("");

  // Sync na promjenu props
  useEffect(() => {
    setFormData({
      ozlijedeneososbe: data?.ozlijedeneososbe || false,
      stetanastvarima: data?.stetanastvarima || false,
      stetanavozilima: data?.stetanavozilima || false,
      hasSvjedoci: data?.hasSvjedoci || false,
      ime_prezime_svjedok: data?.ime_prezime_svjedok || [""],
      adresa_svjedok: data?.adresa_svjedok || [""],
      kontakt_svjedok: data?.kontakt_svjedok || [""]
    });
  }, [data]);

  const handleCheckbox = (field) => {
    setFormData((p) => ({ ...p, [field]: !p[field] }));
    if (field === "hasSvjedoci") setError("");
  };

  // Unos za svjedoka (samo 1, možeš lako proširiti za više kasnije)
  const handleChange = (field, value) => {
    // field: ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok
    setFormData((p) => ({
      ...p,
      [field]: [value] // uvijek array (baza očekuje array/string[])
    }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.hasSvjedoci) {
      const imePrezime = (formData.ime_prezime_svjedok?.[0] || "").trim();
      const ulica = (formData.adresa_svjedok?.[0] || "").trim();
      const kontakt = (formData.kontakt_svjedok?.[0] || "").trim();

      if (!imePrezime || !ulica || !kontakt) {
        setError("Molim te ispuni sva polja za svjedoka");
        return;
      }
      if (!/\d/.test(ulica)) {
        setError("Molim te još upiši kućni broj u adresu");
        return;
      }
    }

    // Obavezna snake_case polja za backend!
    const formToSend = {
      ozlijedeneososbe: !!formData.ozlijedeneososbe,
      stetanastvarima: !!formData.stetanastvarima,
      stetanavozilima: !!formData.stetanavozilima,
      ime_prezime_svjedok: formData.hasSvjedoci ? formData.ime_prezime_svjedok : [],
      adresa_svjedok: formData.hasSvjedoci ? formData.adresa_svjedok : [],
      kontakt_svjedok: formData.hasSvjedoci ? formData.kontakt_svjedok : [],
    };
    onNext?.(formToSend);
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

  return (
    <form className="nesreca-form" onSubmit={handleSubmit}>
      <h2 className="nesreca-title">Podaci o šteti i svjedocima</h2>
      <div className="checkbox-group">
        <label className="checkbox-item">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={formData.ozlijedeneososbe}
            onChange={() => handleCheckbox("ozlijedeneososbe")}
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
            checked={formData.stetanavozilima}
            onChange={() => handleCheckbox("stetanavozilima")}
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
              value={formData.ime_prezime_svjedok[0]}
              onChange={(e) => handleChange("ime_prezime_svjedok", e.target.value)}
              placeholder="Unesite ime i prezime"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ulica i kućni broj</label>
            <AddressAutocomplete
              value={formData.adresa_svjedok[0]}
              onChange={(val) => handleChange("adresa_svjedok", val)}
              placeholder="Primjer: Ilica 15"
              className="form-input"
              searchFunction={searchAddresses}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kontakt</label>
            <input
              type="text"
              className="form-input"
              value={formData.kontakt_svjedok[0]}
              onChange={(e) => handleChange("kontakt_svjedok", e.target.value)}
              placeholder="Broj mobitela ili telefona"
              required
            />
          </div>
        </div>
      )}
      {error && (
        <div style={{ color: "#cc0000", marginTop: 10, fontWeight: "bold" }}>
          {error}
        </div>
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
