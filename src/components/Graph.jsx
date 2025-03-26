import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Graph = () => {
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestScores = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'tests'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => {
          const score = parseInt(doc.data().finalScore) || 0;
          console.log('Score:', score);
          return {
            score: score,
            date: doc.data().timestamp?.toDate() || new Date(),
            id: doc.id
          };
        });
        
        console.log('All test data:', data);
        setTestData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching test scores:', error);
        if (error.message.includes('building')) {
          setError('Database index is being built. Please wait a few minutes and refresh the page...');
        } else if (error.message.includes('index')) {
          setError('Setting up database index. This may take a few minutes...');
        } else {
          setError('Error loading test scores. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    // Retry fetching data every 30 seconds if index is building
    const intervalId = setInterval(fetchTestScores, 30000);
    fetchTestScores();

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div className="loading-message">Loading your test scores...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (testData.length === 0) {
    return (
      <div className="graph-container">
        <div className="graph-card">
          <div className="no-data-message">
            No test data available yet. Complete a test to see your progress!
          </div>
        </div>
      </div>
    );
  }

  // Update the chartData to use shorter date format
  const chartData = {
    labels: testData.map(test => test.date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    })),
    datasets: [{
      label: 'Test Scores',
      data: testData.map(test => test.score),
      fill: true,
      borderColor: '#00bfa5', // Teal color
      backgroundColor: 'rgba(0, 191, 165, 0.1)',
      tension: 0.3,
      pointRadius: 8,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#00bfa5',
      pointBorderWidth: 2,
      pointHoverRadius: 12,
      pointHoverBackgroundColor: '#00bfa5',
      pointHoverBorderColor: '#fff',
      borderWidth: 3
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
    layout: {
      padding: {
        left: 25,
        right: 25,
        top: 35,
        bottom: 25
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 10,
          font: {
            size: 12,
            weight: 'bold'
          },
          callback: value => `${value}%`,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true,
          lineWidth: 1
        },
        border: {
          display: true
        },
        display: true,
        suggestedMin: 0,
        suggestedMax: 100
      },
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true,
          lineWidth: 1
        },
        border: {
          display: true
        },
        ticks: {
          font: {
            size: 14,  // Increased from 11 to 14
            weight: 'bold'
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 5,
          autoSkip: false,
          maxTicksLimit: 8,
          align: 'start'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        padding: 20
      },
      title: {
        display: true,
        text: 'Your Progress Over Time',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    }
  };

  return (
    <div className="graph-container">
      <div className="graph-card">
        <div className="graph-wrapper">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default Graph;