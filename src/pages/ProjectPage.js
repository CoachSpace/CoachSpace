import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../lib/AdminContext';
import ProjectHeader from '../components/ProjectHeader';
import WelcomeTab from '../components/WelcomeTab';
import RoadmapTab from '../components/RoadmapTab';
import UpdatesTab from '../components/UpdatesTab';
import CommentsTab from '../components/CommentsTab';
import ResourceTab from '../components/ResourceTab';
import Toast from '../components/Toast';

const TABS = [
  { id: 'welcome', label: '✨ Welcome' },
  { id: 'roadmap', label: '🗺️ Roadmap' },
  { id: 'updates', label: '📋 Updates' },
  { id: 'comments', label: '💬 Comments' },
  { id: 'resources', label: '📦 Resources' },
];

export default function ProjectPage({ slug }) {
  const { isAdmin, login, logout } = useAdmin();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  const [toast, setToast] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      const { data, error } = await supabase.from('projects').select('*').eq('project_slug', slug).single();
      if (error || !data) { setNotFound(true); }
      else { setProject(data); document.title = `${data.client_name} – ACE System Portal`; }
      setLoading(false);
    }
    fetchProject();
  }, [slug]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const success = login(passwordInput);
    if (success) { setShowAdminModal(false); setPasswordInput(''); setToast({ message: 'Admin mode enabled!', type: 'success' }); }
    else { setPasswordError(true); setTimeout(() => setPasswordError(false), 2000); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--wine)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--rose)', fontSize: '0.9rem' }}>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌸</div>
          <h1 style={{ color: 'var(--wine)', marginBottom: '12px' }}>Project Not Found</h1>
          <p style={{ color: 'var(--rose)', fontSize: '0.9rem', lineHeight: 1.6 }}>This project link doesn't exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43,27,31,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px' }}>
            <h3 style={{ color: 'var(--wine)', marginBottom: '6px' }}>Admin Access</h3>
            <p style={{ color: 'var(--rose)', fontSize: '0.83rem', marginBottom: '20px' }}>Enter your admin password to unlock editing.</p>
            <form onSubmit={handleAdminLogin}>
              <label className="label">Password</label>
              <input className="input-field" type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Enter admin password" style={{ marginBottom: '8px', borderColor: passwordError ? '#c0392b' : undefined }} autoFocus />
              {passwordError && <p style={{ color: '#c0392b', fontSize: '0.8rem', marginBottom: '10px' }}>Incorrect password.</p>}
              {!passwordError && <div style={{ marginBottom: '14px' }} />}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" type="submit" style={{ flex: 1, justifyContent: 'center' }}>Unlock</button>
                <button type="button" className="btn-ghost" onClick={() => { setShowAdminModal(false); setPasswordInput(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ProjectHeader project={project} onUpdate={setProject} setToast={setToast} />

      {/* Top utility bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '8px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--rose)', opacity: 0.7 }}>
          {isAdmin ? '🔓 Admin mode — editing enabled' : '🔒 View mode'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 12px' }} onClick={() => { navigator.clipboard.writeText(window.location.href); setToast({ message: 'Link copied!', type: 'success' }); }}>
            🔗 Copy Link
          </button>
          {isAdmin ? (
            <button className="btn-ghost" style={{ fontSize: '0.75px', padding: '5px 12px', color: 'var(--rose)' }} onClick={logout}>
              Log Out
            </button>
          ) : (
            <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 12px' }} onClick={() => setShowAdminModal(true)}>
              Admin Login
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(75,15,30,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', overflowX: 'auto', padding: '0 16px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: 'none', border: 'none', padding: '16px 20px', fontSize: '0.83rem', fontWeight: 500,
              color: activeTab === tab.id ? 'var(--wine)' : 'var(--rose)',
              borderBottom: activeTab === tab.id ? '2.5px solid var(--wine)' : '2.5px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px 60px' }}>
        {activeTab === 'welcome' && <WelcomeTab project={project} setToast={setToast} />}
        {activeTab === 'roadmap' && <RoadmapTab project={project} setToast={setToast} />}
        {activeTab === 'updates' && <UpdatesTab project={project} setToast={setToast} />}
        {activeTab === 'comments' && <CommentsTab project={project} setToast={setToast} />}
        {activeTab === 'resources' && <ResourceTab project={project} setToast={setToast} />}
      </div>

      <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--rose)', opacity: 0.6 }}>
        ACE System Portal ✦
      </div>
    </div>
  );
}
