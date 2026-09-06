import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="aagman-header">
      <div className="header-container">
        {/* Brand Logo */}
        <a href="/" className="header-logo-link">
          <img src="/logo.jpg" alt="Aagman Logo" className="header-logo" />
        </a>

        {/* Center Nav Links */}
        <nav className="header-nav">
          <a href="/" className="header-nav-link">Home</a>
          <a href="/livestatus.html" className="header-nav-link active">Live Status</a>
          <a href="/help.html" className="header-nav-link">Help</a>
        </nav>

        {/* Right spacer for balanced center alignment */}
        <div className="header-right-spacer"></div>
      </div>
    </header>
  );
};

export default Header;
