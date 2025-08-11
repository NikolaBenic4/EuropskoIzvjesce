// src/App.jsx
import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './css/App.css';
import './css/NesrecaForm.css';
import NesrecaForm from './pages/NesrecaForm';  // import component

function App() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <header className="header">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </header>

      <main className="main">
        <h1>Vite + React</h1>

        {/* Button to toggle the form */}
        <button
          className="toggle-button"
          onClick={() => setShowForm(prev => !prev)}
        >
          {showForm ? 'Zatvori formu' : 'Otvori formu za nesreću'}
        </button>

        {/* Conditionally render NesrecaForm */}
        {showForm && <NesrecaForm onNext={data => console.log(data)} />}
      </main>
    </>
  );
}

export default App;
