import React from 'react';
import './index.css';
import { AdminProvider } from './lib/AdminContext';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';

function Router() {
  const path = window.location.pathname;
  const match = path.match(/^\/project\/(.+)$/);
  if (match) return <ProjectPage slug={match[1]} />;
  return <HomePage />;
}

function App() {
  return (
    <AdminProvider>
      <Router />
    </AdminProvider>
  );
}

export default App;
