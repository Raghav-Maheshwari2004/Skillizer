import React, { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { BsChevronDown, BsChevronUp, BsGraphUp } from 'react-icons/bs';

// Add this import
import Graph from './Graph';

const Dashboard = () => {
  const navigate = useNavigate();
  const [testHistory, setTestHistory] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        setIsLoading(true);
        const userDoc = await getDocs(
          query(
            collection(db, 'users'),
            where('uid', '==', auth.currentUser.uid)
          )
        );
        
        if (!userDoc.empty) {
          setUserData(userDoc.docs[0].data());
        }

        // Fetch test history
        const testQuery = query(
          collection(db, 'tests'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(testQuery);
        const history = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTestHistory(history);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="user-info">
        <h2>Welcome, {userData?.name || 'User'}</h2>
        <p>{userData?.email || auth.currentUser?.email}</p>
      </div>

      <div className="dashboard-content">
        <div className="history-section">
          <div className="history-header">
            <h2>Test History</h2>
            <button 
              className="view-graph-btn"
              onClick={() => navigate('/graph')}
            >
              <BsGraphUp /> View Progress Graph
            </button>
          </div>
          <div className="history-cards">
            {testHistory.map((test) => (
              <div key={test.id} className="history-card">
                <div className="history-card-preview" onClick={() => toggleCard(test.id)}>
                  <div className="history-card-header">
                    <h3>Test Date: {test.timestamp?.toDate().toLocaleDateString()}</h3>
                  </div>
                  <div className="score-section">
                    <div className="score-ring">
                      <svg width="120" height="120">
                        <circle
                          className="score-ring-bg"
                          cx="60"
                          cy="60"
                          r="54"
                        />
                        <circle
                          className="score-ring-progress"
                          cx="60"
                          cy="60"
                          r="54"
                          style={{
                            strokeDashoffset: `${339.292 * (1 - test.finalScore / 100)}`
                          }}
                        />
                      </svg>
                      <div className="score-value">{test.finalScore}%</div>
                    </div>
                    <button className="expand-btn">
                      {expandedCard === test.id ? <BsChevronUp /> : <BsChevronDown />}
                    </button>
                  </div>
                </div>
                
                {expandedCard === test.id && (
                  <div className="history-card-details">
                    <div className="ai-report-section">
                      <h4>AI Analysis</h4>
                      <div dangerouslySetInnerHTML={{ __html: test.aiReport }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;