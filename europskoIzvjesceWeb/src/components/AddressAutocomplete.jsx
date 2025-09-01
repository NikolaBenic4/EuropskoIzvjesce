import React, { useState, useEffect, useRef } from "react";
import "../css/AddressAutocomplete.css";

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Unesite adresu",
  className = "form-input",
  searchFunction,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (value.length > 2 && typeof searchFunction === "function") {
      setIsLoading(true);
      const timer = setTimeout(() => {
        searchFunction(
          value,
          (list) => {
            setSuggestions(list);
            setShowSuggestions(true);
            setIsLoading(false);
          },
          setIsLoading,
          setShowSuggestions
        );
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, searchFunction]);

  // Sakrij prijedloge na klik izvan komponente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onChange(item.formatted);
    setShowSuggestions(false);
  };

  return (
    <div className="address-autocomplete-container" ref={inputRef}>
      <input
        type="text"
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setShowSuggestions(false)}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s) => (
            <li
              key={s.id || s.formatted}
              className="suggestion-item"
              onMouseDown={() => handleSelect(s)}
            >
              {s.formatted}
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && !isLoading && suggestions.length === 0 && (
        <div className="no-results">Nema rezultata za "{value}"</div>
      )}
    </div>
  );
}
