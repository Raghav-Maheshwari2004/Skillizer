import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { BsMoonFill, BsSunFill } from 'react-icons/bs';
import { AiOutlineHome } from 'react-icons/ai';
import { auth } from '../config/firebase';
import './Navbar.css';

function Navbar() {
  const { toggleTheme, isDark } = useTheme();
  
  return (
    <nav className="navbar">
      <div className="nav-section nav-left">
        <Link to="/" className="nav-icon">
          <AiOutlineHome size={24} />
        </Link>
        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {isDark ? <BsSunFill size={20} /> : <BsMoonFill size={20} />}
        </button>
      </div>

      <div className="nav-section nav-center">
        <h1>Skill Analysis</h1>
      </div>

      <div className="nav-section nav-right">
        {auth.currentUser ? (
          <>
            <Link to="/dashboard" className="nav-button">Dashboard</Link>
            <Link to="/test" className="nav-button">Take Test</Link>
          </>
        ) : (
          <Link to="/login" className="nav-button">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;