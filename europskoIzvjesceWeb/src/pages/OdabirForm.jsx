import React from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
//import QRCode from 'qrcode.react';
import '../css/OdabirForm.css'

export default function OdabirForm() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = React.useState("");
  const [showQR, setShowQR] = React.useState(false);

  function handleOnePerson() {
    const id = uuidv4();
    sessionStorage.setItem("session_id", id);
    sessionStorage.setItem("mode", "single");
    navigate("/izvjesce"); // Otvori FullForm odmah
  }

  function handleTwoPersons() {
    const id = uuidv4();
    sessionStorage.setItem("session_id", id);
    sessionStorage.setItem("mode", "double");
    setSessionId(id);
    setShowQR(true);
    // Ovdje ostani na ekranu, prikaži QR kod
  }

  // Poveznica koja vodi na istu formu s istim ID-jem, npr. za drugu osobu
  const joinUrl = `${window.location.origin}/izvjesce?session=${sessionId}`;

  return (
    <div className="odabir-container">
      <h2>Odaberite način ispunjavanja prijave štete</h2>
    <br></br>
      <div className="entry-explanation">
        <p>
          <strong>Unos kao pojedinac:</strong> možeš prijaviti štetu za sebe ili za sebe i drugog sudionika nesreće.<br />
          <br></br>
          <strong>Dvostruki unos (dvoje sudionika):</strong> svaki sudionik podnosi vlastitu prijavu štete. Za početak ispunjavanja prijave, potrebno je da jedan sudionik pritisne na gumb. Zatim će se pojaviti QR kod koji drugi sudionik treba skenirati i potom se otvaraju prijave za oba korisnika.
        </p>
      </div>

      <div className="vertical-buttons">
        <button className="submit-button" onClick={handleOnePerson}>
          Unos kao pojedinac
        </button>
        <button className="submit-button" onClick={handleTwoPersons}>
          Dvostruki unos
        </button>
      </div>

      {showQR && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <p>Druga osoba neka skenira ovaj QR kod:</p>
          <QRCode value={joinUrl} size={180} />
          <p style={{ wordBreak: "break-all", fontSize: "0.9em", marginTop: 16 }}>Link: {joinUrl}</p>
          <button className="submit-button" style={{ marginTop: 24 }} onClick={() => navigate("/izvjesce?session="+sessionId)}>
            Nastavi na unos
          </button>
        </div>
      )}
    </div>
  );
}
