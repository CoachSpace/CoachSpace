import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const EMPTY_FORM = { title: '', description: '', progress: 0 };

function getStatusLabel(progress) {
  if (progress === 0) return { label: 'Not Started', class: 'badge-not-started' };
  if (progress < 50) return { label: 'Early Stage', class: 'badge-in-progress' };
  if (progress < 100) return { label: 'In Progress', class: 'badge-in-progress' };
  return { label: 'Completed', class: 'badge-completed' };
}

function ProgressCard({ item, onSave, onDelete }) {
  const [progress, setProgress] = useState(item.progress || 0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: item.title, description: item.description || '' });
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  const handleProgressChange = (val) => {
    const v = parseInt(val, 10);
    setProgress(v);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await supabase.from('updates').update({ progress: v }).eq('id', item.id);
      setSaving(false);
      onSave({ ...item, progress: v });
    }, 700);
  };

  const handleEditSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await supabase.from('updates').update({ title: form.title, description: form.description }).eq('id', item.id);
    setSaving(false);
    setEditing(false);
    onSave({ ...item, ...form });
  };

  const status = getStatusLabel(progress);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
              <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task description..." rows={3} style={{ resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary" onClick={handleEditSave} disabled={saving}>{saving ? 'Saving...' : '✓ Save'}</button>
                <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h4 style={{ color: 'var(--wine)', fontFamily: 'Lora, serif', fontSize: '1.02rem', marginBottom: '6px' }}>{item.title}</h4>
              {item.description && <p style={{ color: '#5a4a4e', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '8px' }}>{item.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className={`badge ${status.class}`}>{status.label}</span>
                {saving && <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>Saving...</span>}
                <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>
                  Updated {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                </span>
              </div>
            </>
          )}
        </div>
        {!editing && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-ghost" onClick={() => setEditing(true)} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>Edit</button>
            <button className="btn-danger" onClick={() => onDelete(item.id)}>✕</button>
          </div>
        )}
      </div>

      {/* Progress Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--rose)', fontWeight: 500 }}>Progress</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--wine)' }}>{progress}%</span>
        </div>
        <div style={{ position: 'relative', height: '32px', display: 'flex', alignItems: 'center' }}>
          <div style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px',
          }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: progress === 100
                ? 'linear-gradient(90deg, #7cad8f, #2d8a54)'
                : 'linear-gradient(90deg, var(--blush), var(--wine))',
              borderRadius: '4px', transition: 'width 0.1s',
            }} />
          </div>
          <input
            type="range" min={0} max={100} step={5}
            value={progress}
            onChange={e => handleProgressChange(e.target.value)}
            style={{
              width: '100%', height: '32px', opacity: 0, position: 'relative', zIndex: 2, cursor: 'pointer',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--rose)', marginTop: '2px' }}>
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>
    </div>
  );
}

export default function UpdatesTab({ project, setToast }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('updates').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    setUpdates(data || []);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.title.trim()) { setToast({ message: 'Task title is required.', type: 'error' }); return; }
    setSaving(true);
    const { data, error } = await supabase.from('updates').insert({ ...form, project_id: project.id }).select().single();
    setSaving(false);
    if (error) { setToast({ message: error.message, type: 'error' }); return; }
    setUpdates(prev => [data, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setToast({ message: 'Task added!', type: 'success' });
  };

  const handleSave = (updated) => {
    setUpdates(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await supabase.from('updates').delete().eq('id', id);
    setUpdates(prev => prev.filter(u => u.id !== id));
    setToast({ message: 'Task deleted.', type: 'success' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: 'var(--wine)', fontSize: '1.1rem' }}>Progress Updates</h3>
          <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginTop: '4px' }}>{updates.length} tasks</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Task</button>
      </div>

      {showForm && (
        <div className="card" style={{ borderColor: 'var(--blush)' }}>
          <h4 style={{ color: 'var(--wine)', marginBottom: '16px' }}>New Task</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label">Task Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Design Homepage Mockup" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this task involve?" rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="label">Initial Progress: {form.progress}%</label>
              <input type="range" min={0} max={100} step={5} value={form.progress} onChange={e => setForm({ ...form, progress: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--wine)' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : '+ Add Task'}</button>
              <button className="btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : updates.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
          <p>No tasks yet. Add your first task to start tracking progress!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {updates.map(u => (
            <ProgressCard key={u.id} item={u} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
