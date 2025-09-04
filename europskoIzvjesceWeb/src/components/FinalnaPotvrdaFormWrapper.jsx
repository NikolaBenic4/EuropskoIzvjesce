import React from "react";
import { useNavigate } from "react-router-dom";
import FinalnaPotvrdaForm from "../pages/FinalnaPotvrdaForm";

// Wrapper komponenta koja povlači podatke i koristi FinalnaPotvrdaForm
const FinalnaPotvrdaFormWrapper = () => {
  const navigate = useNavigate();

  // Dohvati SVE podatke iz storagea (kako ih je spremala FullForm)
  const allData = JSON.parse(sessionStorage.getItem("fullFormData") || "{}");
  const osiguranje = allData.osiguranje || {};
  // Pretpostavimo da je mail korisnika u vozacPolica slice-u
  const korisnikMail = allData.vozacPolica?.mail || "";

  // Pošalji podatke u bazu i generiraj PDF
  const handleSend = async (mail) => {
    // 1. Pošalji podatke u bazu (API, Fetch, Axios...)
    try {
      await fetch("/api/prijava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allData),
      });
    } catch (err) {
      alert("Neuspjelo spremanje u bazu: " + err.message);
      return;
    }
    // 2. Pozovi backend koji generira PDF i šalje na mail
    try {
      await fetch("/api/generate-pdf-and-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail, data: allData }),
      });
      alert("Prijava uspješno poslana i PDF će stići na e-mail!");
      // Možeš redirect na prikladan završni ekran
      navigate("/");
    } catch (err) {
      alert("PDF nije kreiran: " + err.message);
    }
  };

  const handleBack = () => {
    navigate(-1); // Vrati nazad na PotpisFormu
  };

  return (
    <FinalnaPotvrdaForm
      osiguranje={osiguranje}
      korisnikMail={korisnikMail}
      onSend={handleSend}
      onBack={handleBack}
    />
  );
};

export default FinalnaPotvrdaFormWrapper;
