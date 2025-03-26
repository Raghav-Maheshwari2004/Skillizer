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
      <div class="container">
        <h1>AI-Powered Skill Assessment & Career Insights Platform</h1>
        <p>Our AI-powered skill assessment platform evaluates users' technical and interpersonal skills, achievements, and academic performance. It provides personalized ratings, insightful reports, and AI-driven recommendations to enhance career growth. With gamification, profile customization, and real-time feedback, users can track progress and unlock new opportunities effortlessly.</p>
    </div>
    <div class="container">
        <h1>Steps</h1>
        <p>To generate the AI analysis click on [Generate AI Analysis button ] and then click on Submit </p>
        <p>Clicking on Submit will only give you Score [Not The Analysis] </p>
    </div>
      <div className="cta-section">
        <div className="test-box">
          <h2>Ready to begin?</h2>
          <button onClick={handleTestClick} className="test-btn">
            Take Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;