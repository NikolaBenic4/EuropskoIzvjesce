// components/FinalnaPotvrdaSingleForm.jsx - AŽURIRANI FRONTEND

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
  disabledAddParticipant = false,
}) => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendClick = async () => {
    setLoading(true);
    try {
      console.log('📤 === POČETAK SLANJA PRIJAVE ===');
      console.log('📤 prijavaData:', JSON.stringify(prijavaData, null, 2));

      // 1. PRVO - Pošalji podatke u bazu
      console.log('🏦 Šalje se zahtjev u bazu...');
      const responsePrijava = await fetch("/api/create-prijava", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify(prijavaData),
      });

      console.log('🏦 Response status:', responsePrijava.status);
      
      if (!responsePrijava.ok) {
        const err = await responsePrijava.json();
        console.error('❌ Greška pri spremanju:', err);
        throw new Error(err.error || "Greška pri spremanju prijave");
      }

      const prijavaResult = await responsePrijava.json();
      console.log('✅ Prijava uspješno spremljena:', prijavaResult);

      // KLJUČNO: Čekaj kratko da se baza ažurira
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. ZATIM - Generiraj i pošalji PDF (koji će sada koristiti bazu podataka)
      console.log('📧 Šalje se zahtjev za PDF...');
      const responsePdf = await fetch("/api/generate-pdf-and-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ 
          mail: osiguraniciEmails, 
          data: {
            ...prijavaData,
            // Osiguraj se da PDF generator zna nesrecaId
            nesreca: {
              ...prijavaData.nesreca,
              id_nesrece: prijavaResult.nesrecaId || prijavaData.nesreca?.id_nesrece
            }
          }
        }),
      });

      console.log('📧 PDF Response status:', responsePdf.status);

      if (!responsePdf.ok) {
        const err = await responsePdf.json();
        console.error('❌ Greška pri slanju PDF-a:', err);
        throw new Error(err.error || "Greška pri slanju PDF potvrde");
      }

      const pdfResult = await responsePdf.json();
      console.log('✅ PDF uspješno poslan:', pdfResult);
      console.log('📤 === ZAVRŠETAK SLANJA PRIJAVE ===');

      setSent(true);
    } catch (error) {
      console.error('❌ Ukupna greška:', error);
      alert("Greška: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="nesreca-container">
        <div className="confirmation-box" style={{ textAlign: "center" }}>
          <h2 className="confirmation-title">✅ Prijava uspješno poslana</h2>
          <p><strong>PDF je poslan na email.</strong></p>
          <p>Osiguravajuće društvo je zaprimilo prijavu.</p>
          <p>Sve daljnje informacije će biti proslijeđene putem mail-a.</p>
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
            <small>
              ℹ️ Podaci su spremljeni u bazu podataka i PDF dokument sadrži sve unesene informacije.
            </small>
          </div>
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
          Ispunjena prijava će se <strong>prvo spremiti u bazu podataka</strong>, zatim poslati osiguravajućem društvu, 
          i svaki osiguranik će na e-mail dobiti PDF s kompletnim podacima.
        </p>
        {loading && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
            <strong>⏳ Obrađujem zahtjev...</strong>
            <br />
            <small>Spremam podatke u bazu i generiram PDF dokument...</small>
          </div>
        )}
      </div>
      <p className="thankyou-info">Hvala na ispunjenoj prijavi.</p>
      <div className="navigation-buttons">
        <button className="back-button" onClick={onBack} type="button" disabled={loading}>
          Natrag
        </button>
        <button
          className="next-button"
          onClick={handleSendClick}
          type="button"
          disabled={disabledSend || loading}
        >
          {loading ? "⏳ Obrađujem..." : "Pošalji"}
        </button>
        {typeof onNewParticipant === "function" && (
          <button
            className="next-button"
            onClick={onNewParticipant}
            type="button"
            disabled={disabledAddParticipant || loading}
          >
            Prijava drugog sudionika
          </button>
        )}
      </div>
    </div>
  );
};

export default FinalnaPotvrdaSingleForm;