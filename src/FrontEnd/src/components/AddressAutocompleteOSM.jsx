// src/components/AddressAutocompleteOSM.jsx
import React, { useState, useEffect, useRef } from 'react';

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function AddressAutocompleteOSM({ label, placeholder, onSelect }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = useRef(
    debounce(async (q) => {
      if (!q) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&addressdetails=1&countrycodes=br&limit=5&q=${encodeURIComponent(q)}`,
          {
            headers: {
              'User-Agent': 'TriapTeste/1.0 (contato@seuemail.com)'
            }
          }
        );
        if (!res.ok) throw new Error('API error');
        const data = await res.json();

        const formatted = data.map(item => {
          const addr = item.address;
          const road = addr.road || addr.pedestrian || addr.footway || '';
          const number = addr.house_number || '';
          const suburb = addr.suburb || addr.neighbourhood || '';
          const city = addr.city || addr.town || addr.village || '';
          
          // Monta "Rua, Nº – Bairro, Cidade"
          let streetPart = road;
          if (number) streetPart += `, ${number}`;

          const rest = [suburb, city].filter(Boolean).join(', ');
          const label = rest ? `${streetPart} – ${rest}` : streetPart;

          return {
            label,
            lat: item.lat,
            lon: item.lon
          };
        });

        setSuggestions(formatted);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      }
    }, 500)
  ).current;

  useEffect(() => {
    fetchSuggestions(input);
  }, [input]);

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type="text"
        value={input}
        placeholder={placeholder}
        onChange={e => setInput(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '1rem',
          boxSizing: 'border-box',
        }}
      />

      {suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxHeight: 200,
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => {
                setInput(s.label);
                setSuggestions([]);
                onSelect && onSelect(s);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
              }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
