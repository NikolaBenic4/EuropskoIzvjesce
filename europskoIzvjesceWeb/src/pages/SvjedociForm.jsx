// SvjedociForm.jsx - ČISTI I ELEGANTAN UI

import React, { useState, useEffect } from "react";
import "../css/SvjedociForm.css";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { fetchAddressesDGU } from "../services/addressService";

export default function SvjedociForm({ data, onNext, onBack }) {
  const [formData, setFormData] = useState(() => ({
    ozlijedeneosobe: data?.ozlijedeneosobe || false,
    stetanastvarima: data?.stetanastvarima || false,
    stetanavozilima: data?.stetanavozilima || false,
    hasSvjedoci: data?.hasSvjedoci || false,
    svjedoci: data?.svjedoci || []
  }));
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData({
      ozlijedeneosobe: data?.ozlijedeneosobe || false,
      stetanastvarima: data?.stetanastvarima || false,
      stetanavozilima: data?.stetanavozilima || false,
      hasSvjedoci: data?.hasSvjedoci || false,
      svjedoci: data?.svjedoci || []
    });
  }, [data]);

  // Funkcije za različite checkbox-ove
  const handleGeneralCheckbox = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSvjedociCheckbox = () => {
    setError("");
    
    setFormData(prev => {
      const newHasSvjedoci = !prev.hasSvjedoci;
      
      if (newHasSvjedoci) {
        // Uključuje se - dodaj jedan prazan svjedok
        return {
          ...prev,
          hasSvjedoci: true,
          svjedoci: [{ ime: "", adresa: "", kontakt: "" }]
        };
      } else {
        // Isključuje se - očisti sve svjedoke
        return {
          ...prev,
          hasSvjedoci: false,
          svjedoci: []
        };
      }
    });
  };

  const handleSvjedokChange = (index, field, value) => {
    let textValue = value;
    
    // Za adresu - izvuci tekst iz objekta ako je potrebno
    if (field === 'adresa' && typeof value === "object" && value !== null) {
      textValue = value.formatted_address || value.formatted || value.address || 
                  value.description || value.label || value.value || "";
    }

    setFormData(prev => {
      const newSvjedoci = [...prev.svjedoci];
      newSvjedoci[index] = {
        ...newSvjedoci[index],
        [field]: textValue
      };
      return { ...prev, svjedoci: newSvjedoci };
    });
    setError("");
  };

  const addSvjedok = () => {
    setFormData(prev => ({
      ...prev,
      svjedoci: [...prev.svjedoci, { ime: "", adresa: "", kontakt: "" }]
    }));
  };

  const removeSvjedok = (index) => {
    setFormData(prev => ({
      ...prev,
      svjedoci: prev.svjedoci.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.hasSvjedoci) {
      // Provjeri da li su svi svjedoci validno ispunjeni
      for (let i = 0; i < formData.svjedoci.length; i++) {
        const svjedok = formData.svjedoci[i];
        const imePrezime = (svjedok.ime || "").trim();
        const ulica = (svjedok.adresa || "").trim();
        const kontakt = (svjedok.kontakt || "").trim();
        
        const internationalNumRegex = /^\+\d{7,15}$/;
        
        if (!imePrezime || !ulica || !kontakt) {
          setError(`Molim te ispuni sva polja za svjedoka ${i + 1}`);
          return;
        }
        if (!/\d/.test(ulica)) {
          setError(`Molim te još upiši kućni broj u adresu svjedoka ${i + 1}`);
          return;
        }
        if (!internationalNumRegex.test(kontakt)) {
          setError(`Kontakt broj svjedoka ${i + 1} mora počinjati s + i imati 7-15 brojeva`);
          return;
        }
      }
    }

    // Format podataka za backend
    const formToSend = {
      // Boolean vrijednosti za checkbox-ove
      ozlijedeneosobe: !!formData.ozlijedeneosobe,
      stetanastvarima: !!formData.stetanastvarima,
      stetanavozilima: !!formData.stetanavozilima,
      
      // Svjedoci kao lista objekata
      svjedoci: formData.hasSvjedoci ? {
        lista: formData.svjedoci.map(s => ({
          ime: s.ime,
          adresa: s.adresa, 
          kontakt: s.kontakt
        }))
      } : { lista: [] },
      
      // Legacy format za kompatibilnost
      hasSvjedoci: formData.hasSvjedoci,
      ime_prezime_svjedok: formData.hasSvjedoci ? formData.svjedoci.map(s => s.ime) : [],
      adresa_svjedok: formData.hasSvjedoci ? formData.svjedoci.map(s => s.adresa) : [],
      kontakt_svjedok: formData.hasSvjedoci ? formData.svjedoci.map(s => s.kontakt) : []
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
      <div className="checkbox-group">
        <label className="checkbox-item">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={formData.ozlijedeneosobe}
            onChange={() => handleGeneralCheckbox("ozlijedeneosobe")}
          />
          Ozlijeđene osobe
        </label>
        <label className="checkbox-item">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={formData.stetanastvarima}
            onChange={() => handleGeneralCheckbox("stetanastvarima")}
          />
          Šteta na drugim stvarima
        </label>
        <label className="checkbox-item">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={formData.stetanavozilima}
            onChange={() => handleGeneralCheckbox("stetanavozilima")}
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
            onChange={handleSvjedociCheckbox}
          />
          Postoje svjedoci
        </label>
      </div>

      {formData.hasSvjedoci && (
        <div className="svjedoci-section">
          <h3>Podaci o svjedocima</h3>

          {formData.svjedoci.map((svjedok, index) => (
            <div key={index} className="svjedok-card" style={{
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>Svjedok {index + 1}</h4>
                {formData.svjedoci.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSvjedok(index)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Ukloni
                  </button>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Ime i prezime</label>
                <input
                  type="text"
                  className="form-input"
                  value={svjedok.ime}
                  onChange={(e) => handleSvjedokChange(index, 'ime', e.target.value)}
                  placeholder="Unesite ime i prezime"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ulica i kućni broj</label>
                <AddressAutocomplete
                  value={svjedok.adresa}
                  onChange={(val) => handleSvjedokChange(index, 'adresa', val)}
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
                  value={svjedok.kontakt}
                  onChange={(e) => handleSvjedokChange(index, 'kontakt', e.target.value)}
                  placeholder="Primjer: +385991234567, +49123456789"
                  required
                  pattern="^\+\d{7,15}$"
                  title="Broj mora počinjati s + i imati 7-15 brojeva"
                />
              </div>
            </div>
          ))}

          {/* Gumb za dodavanje svjedoka - NA DNU NAKON SVIH SVJEDOKA */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px',
            marginBottom: '15px'
          }}>
            <button
              type="button"
              onClick={addSvjedok}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              + Dodaj još jednog svjedoka
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          color: "#cc0000", 
          marginTop: 10, 
          fontWeight: "bold",
          backgroundColor: '#ffeeee',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #cc0000'
        }}>
          {error}
        </div>
      )}

      <div className="navigation-buttons" style={{ marginTop: 20 }}>
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