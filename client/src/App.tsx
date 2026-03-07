
import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [shortened, setShortened] = useState('');

  // Placeholder for shortening logic
  const handleShorten = () => {
    setShortened('https://short.url/xyz');
  };

  return (
    <div className="lux-bg">
      <div className="lux-container">
        <header className="lux-header">
          <h1 className="lux-title">URLshortener</h1>
          <span className="lux-credit">by dhp</span>
        </header>
        <main className="lux-main">
          <form
            className="lux-form"
            onSubmit={e => {
              e.preventDefault();
              handleShorten();
            }}
          >
            <input
              className="lux-input"
              type="url"
              placeholder="Paste your URL here..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
            <button className="lux-btn" type="submit">
              Shorten
            </button>
          </form>
          {shortened && (
            <div className="lux-result">
              <span>Shortened URL:</span>
              <a href={shortened} target="_blank" rel="noopener" className="lux-short-url">
                {shortened}
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
