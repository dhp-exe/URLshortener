import { useState } from 'react';
import api from './api';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [shortened, setShortened] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // Shortening logic
  async function handleShorten(url: string){
    try{
      const response = await api.post('/shorten', { url });
      setShortened(response.data.shortUrl || response.data.shortURL || response.data.url || '');
      setShowPopup(true);
      setCopySuccess('');
    }
    catch(err){
      console.error('Error shortening URL:', err);
      alert('Failed to shorten URL. Please try again.');
    }
  };

  function handleCopy() {
    if (shortened) {
      navigator.clipboard.writeText(shortened);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 1200);
    }
  }

  return (
    <div className="bg">
      <div className="container">
        <header className="header">
          <h1 className="title">URLshortener</h1>
          <span className="credit">by dhp</span>
        </header>
        <main className="main">
          <form
            className="form"
            onSubmit={e => {
              e.preventDefault();
              handleShorten(url);
            }}
          >
            <input
              className="input"
              type="url"
              placeholder="Paste your URL here..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
            <button className="btn" type="submit">
              Shorten
            </button>
          </form>
        </main>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-modal">
            <button className="popup-close" onClick={() => setShowPopup(false)} aria-label="Close popup">×</button>
            <div className="popup-title">Your shortened url:</div>
            <div className="popup-url-row">
              <a href={shortened} target="_blank" rel="noopener" className="popup-short-url">{shortened}</a>
              <button className="popup-copy-btn" onClick={handleCopy} type="button">Copy</button>
              {copySuccess && <span className="popup-copied">{copySuccess}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
