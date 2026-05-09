import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateSlug } from '../lib/slugify';
import Toast from '../components/Toast';

export default function HomePage() {
  const [form, setForm] = useState({
    client_name: '',
    project_name: '',
    client_specialty: '',
    client_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);

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
      setToast({ message: 'Error creating project: ' + error.message, type: 'error' });
    } else {
      const link = `${window.location.origin}/project/${slug}`;
      setCreatedLink(link);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--wine)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ fontSize: '22px' }}>✦</span>
          </div>
          <h1 style={{ fontSize: '2rem', color: 'var(--wine)', marginBottom: '8px' }}>CoachSpace</h1>
          <p style={{ color: 'var(--rose)', fontSize: '0.9rem' }}>
            Beautiful client portals for coaches
          </p>
        </div>

        {createdLink ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: 'var(--wine)', marginBottom: '12px', fontSize: '1.3rem' }}>
              Project Created!
            </h2>
            <p style={{ color: 'var(--rose)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Share this unique link with your client. Anyone with this link can view and edit the project.
            </p>
            <div style={{
              background: 'var(--cream)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              wordBreak: 'break-all',
              fontSize: '0.82rem',
              color: 'var(--text)',
              marginBottom: '20px',
              fontFamily: 'monospace',
            }}>
              {createdLink}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigator.clipboard.writeText(createdLink).then(() => setToast({ message: 'Link copied!', type: 'success' }))}>
                📋 Copy Link
              </button>
              <button className="btn-ghost" onClick={() => window.location.href = createdLink}>
                Open Project →
              </button>
            </div>
            <button
              style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--rose)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => { setCreatedLink(null); setForm({ client_name: '', project_name: '', client_specialty: '', client_email: '' }); }}
            >
              Create another project
            </button>
          </div>
        ) : (
          <div className="card">
            <h2 style={{ color: 'var(--wine)', marginBottom: '6px', fontSize: '1.25rem' }}>
              Create a New Client Project
            </h2>
            <p style={{ color: 'var(--rose)', fontSize: '0.84rem', marginBottom: '28px' }}>
              A unique, shareable link will be generated automatically.
            </p>

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
                  {loading ? 'Creating...' : '✦ Create Project & Generate Link'}
                </button>
              </div>
            </form>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--rose)', marginTop: '28px', opacity: 0.7 }}>
          Powered by CoachSpace · No login required for clients
        </p>
      </div>
    </div>
  );
}
