import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TestForm from './components/TestForm';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Graph from './components/Graph';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/test" element={
            <ProtectedRoute>
              <TestForm />
            </ProtectedRoute>
          } />
          <Route path="/graph" element={
            <ProtectedRoute>
              <Graph />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;