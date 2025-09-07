import React from "react";
import { useNavigate } from "react-router-dom";
import FinalnaPotvrdaForm from "../pages/FinalnaPotvrdaForm";

// Funkcija za mapiranje iz frontenda u atribute baze
const mapOsiguranikToDb = (osiguranik) => ({
  ime_osiguranika: osiguranik?.ime_osiguranika || "",
  prezime_osiguranika: osiguranik?.prezime_osiguranika || "",
  adresa_osiguranika: osiguranik?.adresa_osiguranika || "",
  postanskibroj_osiguranika: osiguranik?.postanskibroj_osiguranika || "",
  drzava_osiguranika: osiguranik?.drzava_osiguranika || "",
  mail_osiguranika: osiguranik?.mail_osiguranika || "",
  kontaktbroj_osiguranika: osiguranik?.kontaktbroj_osiguranika || "",
  iban_osiguranika: osiguranik?.iban_osiguranika || "",
});

const FinalnaPotvrdaWrapper = () => {
  const navigate = useNavigate();

  // Dohvati podatke iz sessionStorage
  const allData = JSON.parse(sessionStorage.getItem("fullData") || "{}");
  const osiguranje = allData.osiguranje || {};
  const vozacPolica = allData.vozacPolica || {};
  const osiguranikFrontend = vozacPolica.osiguranik || {};
  const osiguranik = mapOsiguranikToDb(osiguranikFrontend);

  const allDataMapped = {
    ...allData,
    vozacPolica: {
      ...vozacPolica,
      osiguranik,
    },
  };

  const API_KEY = import.meta.env.VITE_API_KEY || "tajni-api-kljuc";

  const handleSend = async (mail) => {
    try {
      const response = await fetch("/api/prijava", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        credentials: "include",
        body: JSON.stringify(allDataMapped),
      });
      if (!response.ok) {
        let msg = response.statusText;
        try {
          const data = await response.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }
    } catch (err) {
      alert("Neuspjelo spremanje u bazu: " + err.message);
      console.error("Greška pri slanju podataka:", err);
      return;
    }

    try {
      const responsePdf = await fetch("/api/generate-pdf-and-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        credentials: "include",
        body: JSON.stringify({ mail, data: allDataMapped }),
      });
      if (!responsePdf.ok) throw new Error(responsePdf.statusText);
      alert("Prijava uspješno poslana i PDF će stići na email!");
      sessionStorage.removeItem("fullData");
      navigate("/");
    } catch (err) {
      alert("PDF nije kreiran: " + err.message);
      console.error("Greška pri generiranju/slanju PDF-a:", err);
    }
  };

  const handleBack = () => navigate(-1);

  return (
    <FinalnaPotvrdaForm
      osiguranje={osiguranje}
      osiguranik={osiguranik}
      mailOsiguranika={osiguranik.mail_osiguranika}
      onSend={handleSend}
      onBack={handleBack}
    />
  );
};

export default FinalnaPotvrdaWrapper;
