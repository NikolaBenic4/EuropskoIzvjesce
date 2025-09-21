import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/PrijavaOsiguranje.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [jwtToken, setJwtToken] = useState(null);
  const navigate = useNavigate();

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Unesite korisničko ime i lozinku.');
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Neispravno korisničko ime ili lozinka');
      }
      const data = await res.json();
      const { token, requiresTwoFactor, companyName } = data;
      setJwtToken(token);
      localStorage.setItem('apiKey', token);
      localStorage.setItem('companyName', companyName);
      if (requiresTwoFactor) {
        setStep(2);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTwoFactorSubmit(e) {
    e.preventDefault();
    setError('');
    if (!twoFactorCode) {
      setError('Unesite dvofaktorski kod.');
      return;
    }
    try {
      const res = await fetch('/api/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ code: twoFactorCode })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Neispravan dvofaktorski kod');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-container">
      <h2>Prijava u sustav osiguranja</h2>
      {error && <p className="error-msg">{error}</p>}

      {step === 1 && (
        <form onSubmit={handleLoginSubmit}>
          <label>
            Korisničko ime
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            Lozinka
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit">Prijava</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleTwoFactorSubmit}>
          <label>
            Unesite dvofaktorski kod
            <input
              type="text"
              value={twoFactorCode}
              onChange={e => setTwoFactorCode(e.target.value)}
              required
              autoFocus
            />
          </label>
          <button type="submit">Potvrdi</button>
        </form>
      )}
    </div>
  );
}
