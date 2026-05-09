import React from 'react';
import './index.css';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';

function App() {
  // Simple client-side routing without react-router
  const path = window.location.pathname;
  const match = path.match(/^\/project\/(.+)$/);

  if (match) {
    return <ProjectPage slug={match[1]} />;
  }

  return <HomePage />;
}

export default App;
