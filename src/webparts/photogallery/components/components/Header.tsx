import * as React from 'react';

const Header: React.FC = () => {
  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <i className="bi bi-image-alt me-2 fs-4"></i>
            <span className="fs-4 fw-bold">Image Editor Pro</span>
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Header;
