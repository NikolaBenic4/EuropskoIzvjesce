import React from "react";
import '../css/FinalnaPotvrdaForm.css';

const FinalnaPotvrdaForm = ({
  osiguranik,
  osiguranje,
  osiguraniciEmails = [],
  onSend, // za single unos (ignoriši kod dvostrukog)
  onBack,
  onAddSecond,
  onConfirm, // NOVO: klik na "Potvrdi završetak"
  canAddSecond,
  bothConfirmed = false,
  peerWaiting = false,
  disabledSend,
  role, // 'A' ili 'B'
  status = {},
}) => {
  const allEmailsStr = osiguraniciEmails.length > 0
    ? osiguraniciEmails.join(", ")
    : osiguranik?.mail_osiguranika || "Nije uneseno";

  // Izvuci per-user confirmed/completed info:
  const userStatus = status?.[role] || {};
  const peerRole = role === 'A' ? 'B' : 'A';
  const peerStatus = status?.[peerRole] || {};

  // Tko je već potvrdio, prikaži info
  const hasConfirmed = !!userStatus.confirmed;

  return (
    <div className="nesreca-container">
      <div className="confirmation-box">
        <h2 className="confirmation-title">Potvrda slanja prijave</h2>
        {canAddSecond && (
          <div className="dual-info-box">
            <strong>NAPOMENA (dvostruki unos):</strong>
            <br />
            <span style={{ color: "#b06f1e" }}>
              Za slanje europskog izvješća u PDF obliku <b>oba sudionika moraju ispuniti sve podatke i potvrditi završetak unosa</b>.
            </span>
            {!bothConfirmed && (
              <>
                {/* STATUSI ZA SVAKOG */}
                <div className="dual-status-info" style={{ marginTop: 10, color: "#034f86" }}>
                  {!hasConfirmed && "Molimo da potvrdiš završetak svog unosa."}
                  {hasConfirmed && !peerStatus.confirmed && "Potvrdio si svoj unos. Čekamo drugog sudionika..."}
                  {hasConfirmed && peerStatus.confirmed && (
                    <span style={{ color: "#01861f", fontWeight: 700 }}>
                      Oba sudionika su potvrdila. PDF izvješće se šalje na mailove.
                    </span>
                  )}
                </div>
              </>
            )}
            {bothConfirmed && (
              <div className="dual-status-info" style={{ marginTop: 10, color: "#01861f", fontWeight: 700 }}>
                Izvješće je uspješno zaprimljeno i poslano na emailove oba sudionika!
              </div>
            )}
            <hr style={{ margin: "15px 0" }} />
          </div>
        )}
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
            <span>{allEmailsStr}</span>
          </p>
        </div>
        <hr />
        <p className="confirmation-info">
          Ispunjena prijava će se poslati osiguravajućem društvu i svaki osiguranik police će na e-mail dobiti PDF dokument digitalnog Europskog izvješća.
        </p>
      </div>
      <p className="thankyou-info">Hvala na ispunjenoj prijavi.</p>
      <div className="final-buttons">
        <button className="back-button" onClick={onBack}>NATRAG</button>
        {canAddSecond && !bothConfirmed && !hasConfirmed && (
          <button
            className="next-button"
            style={{ backgroundColor: "#20753b" }}
            onClick={onConfirm}
          >
            POTVRDI ZAVRŠETAK
          </button>
        )}
        {/* DODAJ DRUGOG SUDIONIKA ako workflow to podržava */}
        {canAddSecond && typeof onAddSecond === "function" && (
          <button
            className="next-button"
            style={{ backgroundColor: "#017A39", marginLeft: "16px" }}
            onClick={onAddSecond}
            disabled={bothConfirmed}
          >
            Dodaj podatke drugog sudionika
          </button>
        )}
        {/* Klasično “Pošalji” za SINGLE unos */}
        {!canAddSecond && (
          <button
            className="next-button"
            disabled={disabledSend}
            onClick={() => onSend(osiguraniciEmails)}
          >
            POŠALJI
          </button>
        )}
      </div>
    </div>
  );
};

export default FinalnaPotvrdaForm;
