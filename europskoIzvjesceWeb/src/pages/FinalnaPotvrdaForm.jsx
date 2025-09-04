import React from "react";
import '../css/FinalnaPotvrdaForm.css'

const FinalnaPotvrdaForm = ({ osiguranje, korisnikMail, onSend, onBack }) => (
  <div className="nesreca-container">
    <div className="confirmation-box">
      <h2>Potvrda slanja prijave</h2>
      <p>
        <strong>Osiguravajuće društvo:</strong> <span>{osiguranje.naziv_osiguranja}</span><br />
        <strong>Email osiguravatelja:</strong> <span>{osiguranje.mail_osiguranja}</span><br />
        <strong>Email osiguranika:</strong> <span>{korisnikMail}</span>
      </p>
      <hr />
      <p>
        Ispunjena prijava će se poslati osiguravajućem društvu i osiguranik police će na e-mail dobiti PDF dokument digitalnog Europskog izvješća.
      </p>
    </div>
    <p className="thankyou-info">
      Hvala na ispunjenoj prijavi.
    </p>
    <div className="final-buttons">
      <button className="back-button" onClick={onBack}>NATRAG</button>
      <button className="next-button" onClick={() => onSend(korisnikMail)}>POŠALJI</button>
    </div>
  </div>
);

export default FinalnaPotvrdaForm;

