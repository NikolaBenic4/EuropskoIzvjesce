import React, { useState, useEffect } from "react";
import "../css/SvjedociForm.css";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { fetchAddressesDGU } from "../services/addressService";

export default function SvjedociForm({ data, onNext, onBack }) {
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

  const handleChange = (field, value) => {
    let textValue = value;
    // Adresa: u inputu prikazujemo uvijek tekst, povuci iz objekta...
    if (typeof value === "object" && value !== null) {
      textValue =
        value.formatted_address ||
        value.formatted ||
        value.address ||
        value.description ||
        value.label ||
        value.value ||
        "";
    }
    setFormData((p) => ({
      ...p,
      [field]: [textValue]
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
      const croNumRegex = /^\+385\d{8,9}$/;
      if (!imePrezime || !ulica || !kontakt) {
        setError("Molim te ispuni sva polja za svjedoka");
        return;
      }
      if (!/\d/.test(ulica)) {
        setError("Molim te još upiši kućni broj u adresu");
        return;
      }
      if (!croNumRegex.test(kontakt)) {
        setError("Kontakt broj mora biti u formatu +385XXXXXXXXX (bez razmaka, 11-12 znamenki)");
        return;
      }
    }
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
              placeholder="Primjer: +385991234567"
              required
              pattern="^\+385\d{8,9}$"
              title="Broj mora biti u formatu +385XXXXXXXXX, bez razmaka"
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
