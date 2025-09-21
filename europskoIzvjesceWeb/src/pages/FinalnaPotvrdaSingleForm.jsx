import React, { useState } from "react";
import '../css/FinalnaPotvrdaForm.css';

const FinalnaPotvrdaSingleForm = ({
  osiguranik,
  osiguranje,
  osiguraniciEmails = [],
  prijavaData,
  onBack,
  onNewParticipant,
  disabledSend,
  disabledAddParticipant = false, // dodano kao default prop
}) => {
  const [sent, setSent] = useState(false);

  const handleSendClick = async () => {
    try {
      // 1. Pošalji podatke na backend
      const responsePrijava = await fetch("/api/create-prijava", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify(prijavaData),
      });
      if (!responsePrijava.ok) {
        const err = await responsePrijava.json();
        throw new Error(err.error || "Greška pri spremanju prijave");
      }

      // 2. Pošalji zahtjev za generiranje i slanje PDF-a po mailu
      const responsePdf = await fetch("/api/generate-pdf-and-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ mail: osiguraniciEmails, data: prijavaData }),
      });
      if (!responsePdf.ok) {
        const err = await responsePdf.json();
        throw new Error(err.error || "Greška pri slanju PDF potvrde");
      }
      setSent(true);
    } catch (error) {
      alert("Greška: " + error.message);
    }
  };

  if (sent) {
    return (
      <div className="nesreca-container">
        <div className="confirmation-box" style={{ textAlign: "center" }}>
          <h2 className="confirmation-title">Prijava poslana</h2>
          <p>PDF je poslan na email.</p>
          <p>Osiguravajuće društvo je zaprimilo prijavu.</p>
          <p>Sve daljnje informacije će biti proslijeđene putem mail-a.</p>
        </div>
        <div className="navigation-buttons">
          <button className="next-button" onClick={() => setSent(false)}>
            Zatvori
          </button>
        </div>
      </div>
    );
  }

  return (
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
        <button className="back-button" onClick={onBack} type="button">
          Natrag
        </button>
        <button
          className="next-button"
          onClick={handleSendClick}
          type="button"
          disabled={disabledSend}
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
};

export default FinalnaPotvrdaSingleForm;
