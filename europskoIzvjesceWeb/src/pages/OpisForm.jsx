import React, { useState, useEffect } from "react";
import MjestoUdarcaVozilo, { VEHICLE_CONFIG } from "../components/MjestoUdarcaVozila";
import '../css/NesrecaForm.css';

const OKOLNOSTI_OPTIONS = [
  "Sudar s vozilom koje je uključilo skretanje",
  "Sudar sa stražnjim dijelom vozila",
  "Sudar u bočni dio (bočni udar)",
  "Izlijetanje s kolnika",
  "Sudar s pješakom ili biciklistom",
  "Sudar s pokretnim objektom (tramvaj, vlak)",
  "Sudar s nepokretnim objektom (stablo, stup, zid)",
  "Prevrtanje vozila",
  "Sukob na parkiralištu",
  "Sudar tijekom pretjecanja",
  "Sudar uslijed kvara na vozilu",
  "Ostale okolnosti"
];

const OpisForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    tip_okolnost: [],
    opis_okolnost: "",
    vehicleType: "car",
    selectedUdaracPoints: [],
    polozaj_ostecenja: "",
    opis_ostecenja: "",
    slike: []
  });

  const [modalImageIndex, setModalImageIndex] = useState(null);

  const getPolozajOstecenjaString = () => {
    const { points } = VEHICLE_CONFIG[formData.vehicleType];
    return formData.selectedUdaracPoints
      .map(id => {
        const found = points.find(p => p.id === id);
        return found ? found.label : "";
      })
      .filter(Boolean)
      .join("; ");
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      polozaj_ostecenja: getPolozajOstecenjaString()
    }));
  }, [formData.vehicleType, formData.selectedUdaracPoints]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type !== "file") {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Multi-select handler za dropdown
  const handleOkolnostChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    setFormData(prev => ({ ...prev, tip_okolnost: selected }));
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);

    const newSlike = files.map(file => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const lokalnoVrijeme = `${year}-${month}-${day}T${hours}:${minutes}`;

      const previewUrl = URL.createObjectURL(file);

      return {
        naziv_slike: file.name,
        podatak_slike: file,
        vrijeme_slikanja: lokalnoVrijeme,
        previewUrl
      };
    });

    setFormData(prev => ({
      ...prev,
      slike: [...prev.slike, ...newSlike]
    }));
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(formData.slike[index].previewUrl);
    setModalImageIndex(null);

    const updatedSlike = formData.slike.filter((_, idx) => idx !== index);
    setFormData(prev => ({
      ...prev,
      slike: updatedSlike
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      polozaj_ostecenja: getPolozajOstecenjaString()
    };
    if (onSubmit) onSubmit(submitData);
  };

  return (
    <div className="nesreca-container">
      <form className="nesreca-form" onSubmit={handleSubmit}>
        <h2 className="nesreca-title">Opis Nesreće</h2>

        {/* Multi-select dropdown za tip okolnosti */}
        <div className="form-group">
          <label className="form-label" htmlFor="tip_okolnost">Tip okolnosti</label>
          <select
            id="tip_okolnost"
            name="tip_okolnost"
            multiple
            className="form-input"
            value={formData.tip_okolnost}
            onChange={handleOkolnostChange}
            size={Math.min(OKOLNOSTI_OPTIONS.length, 6)}
          >
            {OKOLNOSTI_OPTIONS.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
          {/* Ispis odabranih okolnosti */}
          {formData.tip_okolnost.length > 0 && (
            <div style={{ margin: '8px 0', fontSize: '1.08rem', color: '#002060' }}>
              <strong>Odabrane okolnosti:</strong>
              <ul style={{ paddingLeft: '18px', marginTop: '4px' }}>
                {formData.tip_okolnost.map((ok, i) => (
                  <li key={i}>{ok}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="form-group">
        <div className="label-with-info">
          <label className="form-label" htmlFor="opis_okolnost" style={{ margin: 0 }}>
            Opis okolnosti
          </label>
          <button
            type="button"
            className="info-button"
            onClick={() => alert("Ovdje opiši što detaljnije okolnosti nezgode!\nNa primjer: Vozilo A izletjelo je s kolnika i pogodilo je vozilo B.")}
            aria-label="Informacije"
          >
            i
          </button>
        </div>
        <br></br>
        <textarea
          name="opis_okolnost"
          className="form-textarea"
          value={formData.opis_okolnost}
          onChange={handleChange}
          id="opis_okolnost"
        />
      </div>



        <MjestoUdarcaVozilo
          vehicleType={formData.vehicleType}
          selectedPoints={formData.selectedUdaracPoints}
          onChange={next => setFormData(prev => ({ ...prev, selectedUdaracPoints: next }))}
          onVehicleTypeChange={vehicleType => setFormData(prev => ({ ...prev, vehicleType, selectedUdaracPoints: [] }))}
        />

        <div className="form-group">
          <label className="form-label">Položaj oštećenja</label>
          <input
            type="text"
            name="polozaj_ostecenja"
            maxLength={100}
            className="form-input"
            value={formData.polozaj_ostecenja}
            readOnly
          />
        </div>

        <div className="form-group">
          <label className="form-label">Opis oštećenja</label>
          <textarea
            name="opis_ostecenja"
            className="form-textarea"
            value={formData.opis_ostecenja}
            onChange={handleChange}
          />
        </div>

        <div className="centered-container" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          <label htmlFor="file-upload" className="custom-file-upload" style={{ margin: 0 }}>
            Slikaj i učitaj
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFilesChange}
          />
          <button
            type="button"
            className="info-button"
            onClick={() => alert("Za pregled slike i uklanjenje klikni na sliku!")}
            aria-label="Informacije"
          >
            i
          </button>
        </div>

        <div className="uploaded-images-list" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {formData.slike.map((img, index) => (
            <div
              key={index}
              className="uploaded-image-item"
              style={{
                position: 'relative',
                width: 120,
                height: 120,
                cursor: 'pointer',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              title={`Naziv: ${img.naziv_slike}\nVrijeme: ${img.vrijeme_slikanja}`}
              onClick={() => setModalImageIndex(index)}
            >
              <img
                src={img.previewUrl}
                alt={img.naziv_slike}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  fontSize: 10,
                  padding: '4px 6px',
                  backdropFilter: 'blur(4px)',
                  userSelect: 'none'
                }}
              >
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {img.naziv_slike}
                </div>
                <div>{img.vrijeme_slikanja.replace('T', ' ')}</div>
              </div>
            </div>
          ))}
        </div>

        {modalImageIndex !== null && (
          <div
            onClick={() => setModalImageIndex(null)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              cursor: 'pointer'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                backgroundColor: '#fff',
                padding: 20,
                borderRadius: 8,
                maxWidth: '90%',
                maxHeight: '90%',
                boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <img
                src={formData.slike[modalImageIndex].previewUrl}
                alt={formData.slike[modalImageIndex].naziv_slike}
                style={{ maxWidth: '100%', maxHeight: '70vh', marginBottom: 16, borderRadius: 8 }}
              />
              <button
                onClick={() => {
                  handleRemoveImage(modalImageIndex);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#c00',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Ukloni sliku
              </button>
              <button
                onClick={() => setModalImageIndex(null)}
                style={{
                  marginTop: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#555',
                  fontSize: 16,
                  textDecoration: 'underline'
                }}
              >
                Zatvori
              </button>
            </div>
          </div>
        )}

        <button type="submit" className="submit-button" style={{ marginTop: 20 }}>
          Spremi Opis
        </button>
      </form>
    </div>
  );
};

export default OpisForm;
