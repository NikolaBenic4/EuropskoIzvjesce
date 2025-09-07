import React from "react";
import '../css/FinalnaPotvrdaForm.css';

const FinalnaPotvrdaForm = ({
  osiguranik,
  osiguranje,
  onSend,
  onBack,
}) => {
  // Prvo provjeri mail_osiguranika, eventualno fallback na mail, inače prikaži 'Nije uneseno'
  const emailOsiguranika =
    osiguranik?.mail_osiguranika?.trim()
      ? osiguranik.mail_osiguranika
      : osiguranik?.mail?.trim()
        ? osiguranik.mail
        : "Nije uneseno";

  return (
    <div className="nesreca-container">
      <div className="confirmation-box">
        <h2 className="confirmation-title">Potvrda slanja prijave</h2>
        <div className="confirmation-details">
          <p>
            <strong>Osiguravajuće društvo:</strong>{" "}
            <span>{osiguranje?.naziv_osiguranja || "-"}</span>
          </p>
          <p>
            <strong>Email osiguravatelja:</strong>{" "}
            <span>{osiguranje?.mail_osiguranja || "-"}</span>
          </p>
          <p>
            <strong>Email osiguranika:</strong>{" "}
            <span>{emailOsiguranika}</span>
          </p>
        </div>
        <hr />
        <p className="confirmation-info">
          Ispunjena prijava će se poslati osiguravajućem društvu i osiguranik police će na e-mail dobiti PDF dokument digitalnog Europskog izvješća.
        </p>
      </div>
      <p className="thankyou-info">Hvala na ispunjenoj prijavi.</p>
      <div className="final-buttons">
        <button className="back-button" onClick={onBack}>NATRAG</button>
        <button className="next-button" onClick={() => onSend(emailOsiguranika)}>POŠALJI</button>
      </div>
    </div>
  );
};

export default FinalnaPotvrdaForm;
