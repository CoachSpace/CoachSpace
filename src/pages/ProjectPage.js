import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ProjectHeader from '../components/ProjectHeader';
import WelcomeTab from '../components/WelcomeTab';
import RoadmapTab from '../components/RoadmapTab';
import UpdatesTab from '../components/UpdatesTab';
import CommentsTab from '../components/CommentsTab';
import ResourceTab from '../components/ResourceTab';
import Toast from '../components/Toast';

const TABS = [
  { id: 'welcome', label: '✨ Welcome', icon: '✨' },
  { id: 'roadmap', label: '🗺️ Roadmap', icon: '🗺️' },
  { id: 'updates', label: '📋 Updates', icon: '📋' },
  { id: 'comments', label: '💬 Comments', icon: '💬' },
  { id: 'resources', label: '📦 Resources', icon: '📦' },
];

export default function ProjectPage({ slug }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function fetchProject() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_slug', slug)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProject(data);
        document.title = `${data.client_name} – CoachSpace`;
      }
      setLoading(false);
    }
    fetchProject();
  }, [slug]);

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
          <p style={{ color: 'var(--rose)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
            This project link doesn't exist or may have been removed. Please check the link and try again.
          </p>
          <a href="/" style={{ color: 'var(--wine)', fontSize: '0.9rem' }}>← Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <ProjectHeader project={project} onUpdate={setProject} setToast={setToast} />

      {/* Share Bar */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        padding: '10px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--rose)', opacity: 0.8 }}>
          🔗 Shareable project link
        </span>
        <button
          className="btn-ghost"
          style={{ fontSize: '0.75rem', padding: '5px 12px' }}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setToast({ message: 'Link copied to clipboard!', type: 'success' });
          }}
        >
          Copy Link
        </button>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(75,15,30,0.05)',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex',
          overflowX: 'auto',
          padding: '0 16px',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 20px',
                fontSize: '0.83rem',
                fontWeight: 500,
                color: activeTab === tab.id ? 'var(--wine)' : 'var(--rose)',
                borderBottom: activeTab === tab.id ? '2.5px solid var(--wine)' : '2.5px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
                letterSpacing: '0.01em',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px 60px' }}>
        {activeTab === 'welcome' && <WelcomeTab project={project} setToast={setToast} />}
        {activeTab === 'roadmap' && <RoadmapTab project={project} setToast={setToast} />}
        {activeTab === 'updates' && <UpdatesTab project={project} setToast={setToast} />}
        {activeTab === 'comments' && <CommentsTab project={project} setToast={setToast} />}
        {activeTab === 'resources' && <ResourceTab project={project} setToast={setToast} />}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid var(--border)',
        fontSize: '0.75rem',
        color: 'var(--rose)',
        opacity: 0.6,
      }}>
        Powered by CoachSpace ✦
      </div>
    </div>
  );
}
