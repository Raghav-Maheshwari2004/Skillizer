import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { BsMoonFill, BsSunFill } from 'react-icons/bs';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  

  const handleTestClick = (e) => {
    e.preventDefault();
    if (auth.currentUser) {
      navigate('/test');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-container">
      
      <div className="test-box">
        <h2>Ready to begin?</h2>
        <button onClick={handleTestClick} className="test-btn">
          Take Test
        </button>
      </div>
    </div>
  );
}

export default Home;