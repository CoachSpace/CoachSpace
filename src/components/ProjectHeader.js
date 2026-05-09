import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'In Review', 'Completed', 'On Hold'];

const STATUS_COLORS = {
  'Not Started': { bg: '#f5e6e8', color: '#B76E79' },
  'In Progress': { bg: '#fef4e4', color: '#c87c2a' },
  'In Review': { bg: '#e8f0fe', color: '#3b5bdb' },
  'Completed': { bg: '#e8f5ed', color: '#2d8a54' },
  'On Hold': { bg: '#ebebeb', color: '#666' },
};

export default function ProjectHeader({ project, onUpdate, setToast }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...project });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({
        client_name: form.client_name,
        client_specialty: form.client_specialty,
        client_email: form.client_email,
        client_phone: form.client_phone,
        project_name: form.project_name,
        project_status: form.project_status,
        project_description: form.project_description,
        start_date: form.start_date,
        due_date: form.due_date,
      })
      .eq('id', project.id);
    setSaving(false);
    if (error) {
      setToast({ message: 'Error saving: ' + error.message, type: 'error' });
    } else {
      onUpdate(form);
      setEditing(false);
      setToast({ message: 'Client details saved!', type: 'success' });
    }
  };

  const statusStyle = STATUS_COLORS[project.project_status] || STATUS_COLORS['In Progress'];

  if (editing) {
    return (
      <div style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        padding: '28px 32px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--wine)', marginBottom: '20px', fontSize: '1.1rem' }}>Edit Client & Project Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Client Name', name: 'client_name', placeholder: 'Mary Johnson' },
              { label: 'Specialty / Niche', name: 'client_specialty', placeholder: 'Christian Life Coach' },
              { label: 'Email', name: 'client_email', placeholder: 'client@email.com', type: 'email' },
              { label: 'Phone (optional)', name: 'client_phone', placeholder: '+1 555 000 0000' },
              { label: 'Project Name', name: 'project_name', placeholder: 'Brand Website Launch' },
              { label: 'Start Date', name: 'start_date', type: 'date' },
              { label: 'Due Date', name: 'due_date', type: 'date' },
            ].map(({ label, name, placeholder, type = 'text' }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input className="input-field" name={name} type={type} value={form[name] || ''} onChange={handleChange} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="label">Project Status</label>
              <select className="input-field" name="project_status" value={form.project_status || ''} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Project Description</label>
            <textarea className="input-field" name="project_description" value={form.project_description || ''} onChange={handleChange} placeholder="Brief overview of the project..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '✓ Save Details'}
            </button>
            <button className="btn-ghost" onClick={() => { setEditing(false); setForm({ ...project }); }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--wine) 0%, #7a2236 100%)',
      padding: '32px',
      color: '#fff',
      position: 'relative',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            {/* Brand mark */}
            <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
              ✦ CoachSpace Client Portal
            </div>

            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: '4px', lineHeight: 1.2 }}>
              {project.client_name || 'Client Name'}
            </h1>
            {project.client_specialty && (
              <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '8px' }}>
                {project.client_specialty}
              </p>
            )}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.82rem', opacity: 0.75, marginBottom: '20px' }}>
              {project.client_email && <span>✉ {project.client_email}</span>}
              {project.client_phone && <span>📞 {project.client_phone}</span>}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'inline-block',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ fontSize: '0.72rem', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                Project
              </div>
              <div style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px' }}>
                {project.project_name || 'Project Name'}
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', opacity: 0.8 }}>
                {project.start_date && <span>Start: {new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                {project.due_date && <span>Due: {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <span style={{
              ...statusStyle,
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
              {project.project_status || 'In Progress'}
            </span>
            <button
              className="btn-ghost"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', fontSize: '0.8rem' }}
              onClick={() => setEditing(true)}
            >
              ✎ Edit Details
            </button>
          </div>
        </div>

        {project.project_description && (
          <p style={{ marginTop: '16px', opacity: 0.7, fontSize: '0.85rem', maxWidth: '600px', lineHeight: 1.6 }}>
            {project.project_description}
          </p>
        )}
      </div>
    </div>
  );
}
