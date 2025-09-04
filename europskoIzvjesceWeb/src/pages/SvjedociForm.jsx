import React, { useState, useEffect } from "react";
import "../css/SvjedociForm.css";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { fetchAddressesDGU } from "../services/addressService";

export default function SvjedociForm({ data, onNext, onBack }) {
  // 1. Lokalni state: uvijek iz parenta!
  const [formData, setFormData] = useState(() => ({
    ozlijedeni: data?.ozlijedeni || false,
    stetanastvarima: data?.stetanastvarima || false,
    stetanavozilu: data?.stetanavozilu || false,
    hasSvjedoci: data?.hasSvjedoci || false,
    svjedokImePrezime: data?.svjedokImePrezime || "",
    svjedokUlica: data?.svjedokUlica || "",
    svjedokKontakt: data?.svjedokKontakt || ""
  }));
  const [error, setError] = useState("");

  // 2. Svaki put kad se `data` promijeni (povratak na korak ili session refresh), popuni local state
  useEffect(() => {
    setFormData({
      ozlijedeni: data?.ozlijedeni || false,
      stetanastvarima: data?.stetanastvarima || false,
      stetanavozilu: data?.stetanavozilu || false,
      hasSvjedoci: data?.hasSvjedoci || false,
      svjedokImePrezime: data?.svjedokImePrezime || "",
      svjedokUlica: data?.svjedokUlica || "",
      svjedokKontakt: data?.svjedokKontakt || ""
    });
  }, [data]);

  const handleCheckbox = (field) => {
    setFormData((p) => ({ ...p, [field]: !p[field] }));
    if (field === "hasSvjedoci") setError("");
  };

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.hasSvjedoci) {
      const ulica = formData.svjedokUlica.trim();
      const imaBroj = /\d/.test(ulica);

      if (
        formData.svjedokImePrezime.trim() === "" ||
        ulica === "" ||
        formData.svjedokKontakt.trim() === ""
      ) {
        setError("Molim te ispuni sva polja za svjedoka");
        return;
      }

      if (!imaBroj) {
        setError("Molim te još upiši kućni broj u adresu");
        return;
      }
    }

    const formToSend = {
      ...formData,
      svjedokAdresa: formData.svjedokUlica
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
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ulica i kućni broj</label>
            <AddressAutocomplete
              value={formData.svjedokUlica}
              onChange={(val) => handleChange("svjedokUlica", val)}
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
              value={formData.svjedokKontakt}
              onChange={(e) => handleChange("svjedokKontakt", e.target.value)}
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
