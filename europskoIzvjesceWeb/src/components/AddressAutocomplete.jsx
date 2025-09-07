import React, { useState, useEffect, useRef } from "react";
import "../css/AddressAutocomplete.css";

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Google Places Autocomplete (preko proxyja ili direktno, zamijeni po potrebi)
async function googlePlacesAutocomplete(query, setSug, setLoad, setShow, setStatusMsg) {
  setLoad(true);
  try {
    const url = `https://corsproxy.io/?https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&language=hr&components=country:hr`;
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Google API odgovor:", data); // DODANO ZA DEBUG

    if (data.status !== "OK") {
      setStatusMsg(
        data.status === "REQUEST_DENIED" ? "API ključ nije ispravan ili je blokiran." :
        data.status === "OVER_QUERY_LIMIT" ? "Dnevni limit za Google API je potrošen." :
        data.status === "ZERO_RESULTS" ? "Nema rezultata za taj upit." :
        data.error_message || `Greška: ${data.status}`
      );
      setSug([]);
      setShow(false);
      setLoad(false);
      return;
    }
    setStatusMsg("");
    setSug((data.predictions || []).map(p => ({
      ...p,
      formatted: p.description,
      id: p.place_id,
      place_id: p.place_id
    })));
    setShow(true);
    setLoad(false);
  } catch (e) {
    setStatusMsg("Greška pri spajanju na Google API.");
    console.error("Autocomplete fetch failed:", e);
    setSug([]);
    setShow(false);
    setLoad(false);
  }
}

async function getPlaceDetails(placeId) {
  try {
    const url = `https://corsproxy.io/?https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&language=hr`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      return {
        ...result,
        formatted: result.formatted_address,
        id: placeId,
      };
    } else {
      console.warn("Geocode API error:", data.status, data.error_message || "");
      return { formatted: "", id: "" };
    }
  } catch(e) {
    console.error("Geocode fetch failed:", e);
    return { formatted: "", id: "" };
  }
}

export default function AddressAutocomplete({
  value = "",
  onChange,
  placeholder = "Unesite adresu",
  className = "form-input"
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locked, setLocked] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    const safeValue = value || "";
    if (safeValue.length > 2 && !locked) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        googlePlacesAutocomplete(
          safeValue, setSuggestions, setIsLoading, setShowSuggestions, setStatusMsg
        );
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setStatusMsg("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, locked]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (item) => {
    if (item.place_id) {
      const details = await getPlaceDetails(item.place_id);
      onChange(details);
      setLocked(true);
    } else {
      onChange(item.formatted || item.description || item);
      setLocked(true);
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setLocked(false);
  };

  return (
    <div className="address-autocomplete-container" ref={inputRef}>
      <input
        type="text"
        className={className}
        value={value || ""}
        onChange={handleInputChange}
        onKeyDown={e => e.key === "Escape" && setShowSuggestions(false)}
        onFocus={() => {
          if (suggestions.length > 0 && !locked) setShowSuggestions(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        tabIndex={0}
      />
      {isLoading && (
        <div className="autocomplete-loading">Učitavanje...</div>
      )}
      {statusMsg && (
        <div className="autocomplete-error">{statusMsg}</div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s) => (
            <li
              key={s.id || s.place_id || s.formatted}
              className="suggestion-item"
              onMouseDown={() => handleSelect(s)}
            >
              {s.formatted || s.description || ""}
            </li>
          ))}
        </ul>
      )}
      {showSuggestions && !isLoading && !statusMsg && suggestions.length === 0 && (
        <div className="no-results">Nema rezultata za "{value}"</div>
      )}
    </div>
  );
}
