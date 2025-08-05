import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Timesheets from './pages/Timesheets';
import Communication from './pages/Communication';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import GeolocationManagement from './pages/GeolocationManagement';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          
          {user ? (
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/timesheets" element={<Timesheets />} />
                  <Route path="/communication" element={<Communication />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/geolocation-management" element={<GeolocationManagement />} />
                </Routes>
              </Layout>
            } />
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
