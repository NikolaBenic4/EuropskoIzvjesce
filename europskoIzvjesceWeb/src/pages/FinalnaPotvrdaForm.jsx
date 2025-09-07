import React from "react";
import '../css/FinalnaPotvrdaForm.css';

const FinalnaPotvrdaForm = ({
  osiguranik,
  osiguranje,
  onSend,
  onBack
}) => {
  // Mail je uvijek .mail u tvojoj aplikaciji!
  const emailOsiguranika = osiguranik?.mail_osiguranika || osiguranik?.mail || "-";

  // Debug - za razvoj makni u produkciji!
  // console.log("osiguranik za potvrdu", osiguranik);

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
