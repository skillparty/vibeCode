import React from 'react';
import ASCIICanvas from './components/ASCIICanvas';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <div className="app" role="application" aria-label="ASCII Screensaver Application">
      <header className="app-header" role="banner">
        <h1 className="visually-hidden">The Way of Code - ASCII Screensaver</h1>
      </header>
      
      <main className="screensaver-main" role="main" aria-label="Screensaver Display Area">
        <section className="ascii-canvas-section" aria-label="ASCII Pattern Animation">
          <ASCIICanvas 
            width={800}
            height={600}
            isActive={true}
            className="ascii-canvas"
          />
        </section>
        
        <section className="quote-overlay-section" aria-label="Programming Philosophy Quotes">
          <article className="quote-display" role="article" aria-live="polite">
            <blockquote className="quote-text" aria-label="Current quote">
              {/* Quote content will be rendered here */}
            </blockquote>
            <cite className="quote-author" aria-label="Quote author">
              {/* Author will be rendered here */}
            </cite>
          </article>
        </section>
      </main>
      
      <aside className="controls-panel" role="complementary" aria-label="Screensaver Controls">
        <nav className="navigation-controls" role="navigation" aria-label="Quote Navigation">
          <button 
            className="nav-button prev-button" 
            aria-label="Previous quote"
            type="button"
          >
            Previous
          </button>
          <button 
            className="nav-button next-button" 
            aria-label="Next quote"
            type="button"
          >
            Next
          </button>
        </nav>
        
        <section className="configuration-panel" aria-label="Settings and Configuration">
          <h2 className="visually-hidden">Screensaver Settings</h2>
          <div className="config-controls" role="group" aria-label="Display Settings">
            {/* Configuration controls will be rendered here */}
          </div>
        </section>
      </aside>
      
      <footer className="app-footer" role="contentinfo">
        <div className="status-bar" aria-live="polite" aria-label="Application Status">
          {/* Status information will be rendered here */}
        </div>
      </footer>
    </div>
  );
};

export default App;