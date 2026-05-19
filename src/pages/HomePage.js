import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateSlug } from '../lib/slugify';
import { useAdmin } from '../lib/AdminContext';
import Toast from '../components/Toast';

export default function HomePage() {
  const { isAdmin, login, logout } = useAdmin();
  const [tab, setTab] = useState('dashboard');
  const [form, setForm] = useState({ client_name: '', project_name: '', client_specialty: '', client_email: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    const { data } = await supabase.from('projects').select('id, client_name, project_name, project_slug, project_status, created_at, client_email').order('created_at', { ascending: false });
    setProjects(data || []);
    setLoadingProjects(false);
  }, []);

  useEffect(() => { if (isAdmin) loadProjects(); }, [isAdmin, loadProjects]);

  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(passwordInput);
    if (!success) { setPasswordError(true); setTimeout(() => setPasswordError(false), 2000); }
    setPasswordInput('');
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.client_name || !form.project_name) {
      setToast({ message: 'Client name and project name are required.', type: 'error' });
      return;
    }
    setLoading(true);
    const slug = generateSlug(form.client_name, form.project_name);
    const { error } = await supabase.from('projects').insert({
      project_slug: slug,
      client_name: form.client_name,
      project_name: form.project_name,
      client_specialty: form.client_specialty,
      client_email: form.client_email,
      project_status: 'In Progress',
      welcome_message: `Welcome, ${form.client_name}! 🌸 We're so excited to work with you. Please take a moment to review your roadmap and reach out with any questions.`,
    });
    setLoading(false);
    if (error) {
      setToast({ message: 'Error: ' + error.message, type: 'error' });
    } else {
      const link = `${window.location.origin}/project/${slug}`;
      setCreatedLink(link);
      loadProjects();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this portal permanently? This cannot be undone.')) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setToast({ message: 'Portal deleted.', type: 'success' });
  };

  const STATUS_COLORS = {
    'In Progress': { bg: '#fef4e4', color: '#c87c2a' },
    'Completed': { bg: '#e8f5ed', color: '#2d8a54' },
    'Not Started': { bg: '#f5e6e8', color: '#B76E79' },
    'On Hold': { bg: '#ebebeb', color: '#666' },
    'In Review': { bg: '#e8f0fe', color: '#3b5bdb' },
  };

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ width: 56, height: 56, background: 'var(--wine)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: '22px', color: '#fff' }}>✦</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--wine)', marginBottom: '6px', fontFamily: 'Lora, serif', letterSpacing: '0.02em' }}>ACE SYSTEM PORTAL</h1>
            <p style={{ color: 'var(--rose)', fontSize: '0.85rem' }}>Admin Access Required</p>
          </div>
          <div className="card">
            <h2 style={{ color: 'var(--wine)', fontSize: '1.05rem', marginBottom: '6px' }}>Welcome back</h2>
            <p style={{ color: 'var(--rose)', fontSize: '0.83rem', marginBottom: '24px' }}>Enter your admin password to manage client portals.</p>
            <form onSubmit={handleLogin}>
              <label className="label">Admin Password</label>
              <input
                className="input-field"
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                style={{ marginBottom: '8px', borderColor: passwordError ? '#c0392b' : undefined }}
                autoFocus
              />
              {passwordError && <p style={{ color: '#c0392b', fontSize: '0.8rem', marginBottom: '12px' }}>Incorrect password. Try again.</p>}
              {!passwordError && <div style={{ marginBottom: '16px' }} />}
              <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                Unlock Dashboard →
              </button>
            </form>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--rose)', marginTop: '20px', opacity: 0.6 }}>
            Client portals are accessed via their unique shared links
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--wine), #7a2236)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#fff', fontFamily: 'Lora, serif', fontSize: '1.4rem', margin: 0, letterSpacing: '0.03em' }}>✦ ACE SYSTEM PORTAL</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', margin: '4px 0 0' }}>Admin Dashboard</p>
        </div>
        <button className="btn-ghost" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', fontSize: '0.8rem' }} onClick={logout}>
          Log Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 32px', display: 'flex' }}>
        {[{ id: 'dashboard', label: '📊 My Portals' }, { id: 'create', label: '+ Create New Portal' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setCreatedLink(null); }} style={{
            background: 'none', border: 'none', padding: '16px 22px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            color: tab === t.id ? 'var(--wine)' : 'var(--rose)',
            borderBottom: tab === t.id ? '2.5px solid var(--wine)' : '2.5px solid transparent',
            transition: 'color 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: 'var(--wine)', fontSize: '1.2rem' }}>Client Portals</h2>
                <p style={{ color: 'var(--rose)', fontSize: '0.83rem', marginTop: '4px' }}>{projects.length} portal{projects.length !== 1 ? 's' : ''} created</p>
              </div>
              <button className="btn-primary" onClick={() => setTab('create')}>+ New Portal</button>
            </div>

            {loadingProjects ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : projects.length === 0 ? (
              <div className="card empty-state">
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌸</div>
                <p>No portals yet. Create your first client portal!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {projects.map(p => {
                  const statusStyle = STATUS_COLORS[p.project_status] || STATUS_COLORS['In Progress'];
                  const portalUrl = `${window.location.origin}/project/${p.project_slug}`;
                  return (
                    <div key={p.id} className="card" style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <h3 style={{ color: 'var(--wine)', fontFamily: 'Lora, serif', fontSize: '1.05rem' }}>{p.client_name}</h3>
                            <span style={{ ...statusStyle, padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                              {p.project_status}
                            </span>
                          </div>
                          <p style={{ color: '#5a4a4e', fontSize: '0.85rem', marginBottom: '4px' }}>{p.project_name}</p>
                          {p.client_email && <p style={{ color: 'var(--rose)', fontSize: '0.78rem', marginBottom: '8px' }}>✉ {p.client_email}</p>}
                          <p style={{ color: 'var(--rose)', fontSize: '0.75rem', opacity: 0.7, marginBottom: '10px' }}>
                            📅 Created {new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.73rem', color: 'var(--rose)', fontFamily: 'monospace', background: 'var(--cream)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', wordBreak: 'break-all' }}>
                              {portalUrl}
                            </span>
                            <button className="btn-ghost" style={{ fontSize: '0.72rem', padding: '4px 10px', flexShrink: 0 }}
                              onClick={() => { navigator.clipboard.writeText(portalUrl); setToast({ message: 'Link copied!', type: 'success' }); }}>
                              Copy
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                          <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '9px 18px', textAlign: 'center' }}>
                            Open Portal →
                          </a>
                          <button className="btn-danger" onClick={() => handleDelete(p.id)} style={{ textAlign: 'center' }}>Delete Portal</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CREATE */}
        {tab === 'create' && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            {createdLink ? (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ color: 'var(--wine)', marginBottom: '10px', fontSize: '1.3rem' }}>Portal Created!</h2>
                <p style={{ color: 'var(--rose)', fontSize: '0.88rem', marginBottom: '20px' }}>Share this unique link with your client. They don't need a password.</p>
                <div style={{ background: 'var(--cream)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', wordBreak: 'break-all', fontSize: '0.82rem', color: 'var(--text)', marginBottom: '20px', fontFamily: 'monospace' }}>
                  {createdLink}
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => navigator.clipboard.writeText(createdLink).then(() => setToast({ message: 'Copied!', type: 'success' }))}>
                    📋 Copy Link
                  </button>
                  <button className="btn-ghost" onClick={() => window.open(createdLink, '_blank')}>Open Portal →</button>
                </div>
                <button style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--rose)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { setCreatedLink(null); setForm({ client_name: '', project_name: '', client_specialty: '', client_email: '' }); setTab('dashboard'); }}>
                  ← Back to Dashboard
                </button>
              </div>
            ) : (
              <div className="card">
                <h2 style={{ color: 'var(--wine)', marginBottom: '6px', fontSize: '1.2rem' }}>Create New Client Portal</h2>
                <p style={{ color: 'var(--rose)', fontSize: '0.84rem', marginBottom: '28px' }}>A unique shareable link is generated automatically.</p>
                <form onSubmit={handleCreate}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label className="label">Client Name *</label>
                      <input className="input-field" name="client_name" value={form.client_name} onChange={handleChange} placeholder="e.g. Mary Johnson" required />
                    </div>
                    <div>
                      <label className="label">Project Name *</label>
                      <input className="input-field" name="project_name" value={form.project_name} onChange={handleChange} placeholder="e.g. Brand Website Launch" required />
                    </div>
                    <div>
                      <label className="label">Client Specialty / Niche</label>
                      <input className="input-field" name="client_specialty" value={form.client_specialty} onChange={handleChange} placeholder="e.g. Christian Life Coach for Mothers" />
                    </div>
                    <div>
                      <label className="label">Client Email</label>
                      <input className="input-field" type="email" name="client_email" value={form.client_email} onChange={handleChange} placeholder="client@email.com" />
                    </div>
                    <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                      {loading ? 'Creating...' : '✦ Create Portal & Generate Link'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--rose)', opacity: 0.6 }}>
        ACE System Portal ✦ Admin Dashboard
      </div>
    </div>
  );
}
