import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../css/MailCenter.css';

export default function MailCenter() {
  const [searchParams] = useSearchParams();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Provjeri da li je došao template parametar
  useEffect(() => {
    const template = searchParams.get('template');
    const iznos = searchParams.get('iznos');
    const zahtjev = searchParams.get('zahtjev');

    if (template === 'steta' && iznos && zahtjev) {
      setIsComposing(true);
      setNewEmail({
        to: '',
        subject: `Rješavanje zahtjeva za štetu #${zahtjev}`,
        body: `Poštovani,

Nakon detaljne analize vašeg zahtjeva za štetu (broj: ${zahtjev}), možemo vam potvrditi sljedeće:

PROCJENA ŠTETE: ${iznos}€

Detalji procjene:
- Ukupna procjena štete: ${iznos}€
- Status zahtjeva: U obradi
- Očekivano vrijeme isplate: 5-7 radnih dana

Ukoliko se slažete s procijenjenim iznosom, molimo vas da potvrdite pristanak odgovorom na ovaj email.

U slučaju pitanja, slobodno nas kontaktirajte.

S poštovanjem,
Tim za obradu šteta`
      });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const apiKey = localStorage.getItem('apiKey');
      const response = await fetch('/api/emails', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      setEmails(data);
    } catch (error) {
      console.error('Greška pri dohvaćanju emailova:', error);
    }
  };

  const sendEmail = async () => {
    if (!newEmail.to || !newEmail.subject || !newEmail.body) {
      alert('Molimo unesite sve podatke!');
      return;
    }

    try {
      const apiKey = localStorage.getItem('apiKey');
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEmail)
      });

      if (response.ok) {
        alert('Email uspješno poslan!');
        setIsComposing(false);
        setNewEmail({ to: '', subject: '', body: '' });
        fetchEmails(); // Refresh liste
      } else {
        throw new Error('Greška pri slanju emaila');
      }
    } catch (error) {
      alert('Greška pri slanju emaila!');
      console.error(error);
    }
  };

  return (
    <div className="mail-center">
      <div className="mail-header">
        <h1>📧 Mail centar</h1>
        <button 
          onClick={() => setIsComposing(true)}
          className="compose-btn"
        >
          ✏️ Novi email
        </button>
      </div>

      <div className="mail-content">
        {!isComposing ? (
          <div className="mail-layout">
            {/* Lista emailova */}
            <div className="mail-list">
              <h3>Primljeni emailovi</h3>
              {emails.map((email, index) => (
                <div 
                  key={index} 
                  className={`email-item ${selectedEmail === index ? 'active' : ''}`}
                  onClick={() => setSelectedEmail(index)}
                >
                  <div className="email-sender">{email.from}</div>
                  <div className="email-subject">{email.subject}</div>
                  <div className="email-date">{new Date(email.date).toLocaleDateString()}</div>
                </div>
              ))}
              
              {emails.length === 0 && (
                <div className="no-emails">Nema novih emailova</div>
              )}
            </div>

            {/* Prikaz odabranog emaila */}
            <div className="mail-viewer">
              {selectedEmail !== null && emails[selectedEmail] ? (
                <div className="email-details">
                  <div className="email-header-details">
                    <h3>{emails[selectedEmail].subject}</h3>
                    <p><strong>Od:</strong> {emails[selectedEmail].from}</p>
                    <p><strong>Datum:</strong> {new Date(emails[selectedEmail].date).toLocaleString()}</p>
                  </div>
                  <div className="email-body">
                    {emails[selectedEmail].body}
                  </div>
                  <div className="email-actions">
                    <button 
                      onClick={() => {
                        setNewEmail({
                          to: emails[selectedEmail].from,
                          subject: `Re: ${emails[selectedEmail].subject}`,
                          body: `\n\n---\nOdgovor na email od ${emails[selectedEmail].from}:\n${emails[selectedEmail].body}`
                        });
                        setIsComposing(true);
                      }}
                      className="reply-btn"
                    >
                      Odgovori
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  Odaberite email za pregled
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Forma za novi email */
          <div className="compose-email">
            <div className="compose-header">
              <h3>✏️ Novi email</h3>
              <button 
                onClick={() => {
                  setIsComposing(false);
                  setNewEmail({ to: '', subject: '', body: '' });
                }}
                className="close-compose-btn"
              >
                ✕
              </button>
            </div>

            <div className="compose-form">
              <div className="form-field">
                <label>Prima:</label>
                <input
                  type="email"
                  value={newEmail.to}
                  onChange={(e) => setNewEmail({...newEmail, to: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>

              <div className="form-field">
                <label>Naslov:</label>
                <input
                  type="text"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({...newEmail, subject: e.target.value})}
                  placeholder="Naslov emaila"
                />
              </div>

              <div className="form-field">
                <label>Poruka:</label>
                <textarea
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({...newEmail, body: e.target.value})}
                  placeholder="Upišite poruku..."
                  rows={12}
                />
              </div>

              <div className="compose-actions">
                <button onClick={sendEmail} className="send-btn">
                  📤 Pošalji
                </button>
                <button 
                  onClick={() => {
                    setIsComposing(false);
                    setNewEmail({ to: '', subject: '', body: '' });
                  }}
                  className="cancel-btn"
                >
                  Odustani
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}