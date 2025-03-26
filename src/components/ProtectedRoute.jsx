import { Navigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  if (!auth.currentUser) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;