import React from "react";
import '../css/FinalnaPotvrdaForm.css';

const FinalnaPotvrdaSingleForm = ({
  osiguranik,
  osiguranje,
  osiguraniciEmails = [],
  onSend,
  onBack,
  onNewParticipant,
  disabledSend,
  disabledAddParticipant
}) => (
  <div className="nesreca-container">
    <div className="confirmation-box">
      <h2 className="confirmation-title">Završetak pojedinačne prijave</h2>
      <div className="confirmation-details">
        <p>
          <strong>Osiguravajuće društvo:</strong> {osiguranje?.naziv_osiguranja || "-"}
        </p>
        <p>
          <strong>Email osiguravatelja:</strong> {osiguranje?.mail_osiguranja || "-"}
        </p>
        <p>
          <strong>Email osiguranika:</strong>{" "}
          {osiguraniciEmails.length > 0
            ? osiguraniciEmails.join(", ")
            : osiguranik?.mail_osiguranika || "Nije uneseno"}
        </p>
      </div>
      <hr />
      <p className="confirmation-info">
        Ispunjena prijava će se poslati osiguravajućem društvu i svaki osiguranik će na e-mail dobiti PDF.
      </p>
    </div>
    <p className="thankyou-info">Hvala na ispunjenoj prijavi.</p>
    <div className="navigation-buttons">
      <button
        className="back-button"
        onClick={onBack}
        type="button"
      >
        Natrag
      </button>
      <button
        className="next-button"
        onClick={() => onSend(osiguraniciEmails)}
        type="button"
      >
        Pošalji
      </button>
      {typeof onNewParticipant === "function" && (
        <button
          className="next-button"
          onClick={onNewParticipant}
          type="button"
          disabled={disabledAddParticipant}
        >
          Prijava drugog sudionika
        </button>
      )}
    </div>
  </div>
);

export default FinalnaPotvrdaSingleForm;
