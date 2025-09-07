import React from "react";
import { useNavigate } from "react-router-dom";
import FinalnaPotvrdaForm from "../pages/FinalnaPotvrdaForm";

// Funkcija za mapiranje osiguranika na nazivlja iz baze!
const mapOsiguranikToDb = (osiguranik) => ({
  ime_osiguranika: osiguranik.ime,
  prezime_osiguranika: osiguranik.prezime,
  adresa_osiguranika: osiguranik.adresa,
  postanskibroj_osiguranika: osiguranik.postanskiBroj,
  drzava_osiguranika: osiguranik.drzava,
  mail_osiguranika: osiguranik.mail,
  kontaktbroj_osiguranika: osiguranik.kontakt,
});

const FinalnaPotvrdaFormWrapper = () => {
  const navigate = useNavigate();

  // Dohvati SVE podatke iz storagea (kako ih je spremala FullForm)
  const allData = JSON.parse(sessionStorage.getItem("fullFormData") || "{}");
  const osiguranje = allData.osiguranje || {};
  const vozacPolica = allData.vozacPolica || {};
  const osiguranikFrontend = vozacPolica.osiguranik || {};
  const osiguranik = mapOsiguranikToDb(osiguranikFrontend);

  // Pripremi objekt za slanje s preimenovanim propertyjima
  const allDataMapped = {
    ...allData,
    vozacPolica: {
      ...vozacPolica,
      osiguranik, // => nazivi su sada kao u bazi
    },
  };

  // Pošalji podatke u bazu i generiraj PDF
  const handleSend = async (mail) => {
    try {
      await fetch("/api/prijava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allDataMapped), // Šalji mapirane podatke!
      });
    } catch (err) {
      alert("Neuspjelo spremanje u bazu: " + err.message);
      return;
    }
    try {
      await fetch("/api/generate-pdf-and-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail, data: allDataMapped }),
      });
      alert("Prijava uspješno poslana i PDF će stići na e-mail!");
      navigate("/");
    } catch (err) {
      alert("PDF nije kreiran: " + err.message);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <FinalnaPotvrdaForm
      osiguranje={osiguranje}
      osiguranik={osiguranik}
      onSend={handleSend}
      onBack={handleBack}
    />
  );
};

export default FinalnaPotvrdaFormWrapper;
