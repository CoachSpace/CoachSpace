import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const STATUSES = ['Not Started', 'In Progress', 'In Review', 'Completed'];
const STATUS_CLASS = {
  'Not Started': 'badge-not-started',
  'In Progress': 'badge-in-progress',
  'In Review': 'badge-in-review',
  'Completed': 'badge-completed',
};

const EMPTY_FORM = { title: '', description: '', status: 'Not Started', due_date: '' };

export default function RoadmapTab({ project, setToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('roadmap_items').select('*').eq('project_id', project.id).order('order_index');
    setItems(data || []);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.title.trim()) { setToast({ message: 'Stage title is required.', type: 'error' }); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from('roadmap_items').update({ ...form }).eq('id', editingId);
      if (!error) {
        setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...form } : i));
        setToast({ message: 'Roadmap stage updated!', type: 'success' });
      }
    } else {
      const { data, error } = await supabase.from('roadmap_items').insert({
        ...form, project_id: project.id, order_index: items.length,
      }).select().single();
      if (!error && data) {
        setItems(prev => [...prev, data]);
        setToast({ message: 'Stage added!', type: 'success' });
      } else if (error) {
        setToast({ message: error.message, type: 'error' });
      }
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (item) => {
    setForm({ title: item.title, description: item.description || '', status: item.status, due_date: item.due_date || '' });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this roadmap stage?')) return;
    await supabase.from('roadmap_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    setToast({ message: 'Stage deleted.', type: 'success' });
  };

  const moveItem = async (index, direction) => {
    const newItems = [...items];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems);
    // Update order indexes
    await Promise.all(newItems.map((item, i) =>
      supabase.from('roadmap_items').update({ order_index: i }).eq('id', item.id)
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: 'var(--wine)', fontSize: '1.1rem' }}>Project Roadmap</h3>
          <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginTop: '4px' }}>{items.length} stages</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}>
          + Add Stage
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ borderColor: 'var(--blush)' }}>
          <h4 style={{ color: 'var(--wine)', marginBottom: '16px' }}>
            {editingId ? 'Edit Stage' : 'New Roadmap Stage'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Stage Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Discovery & Strategy" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input-field" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Description</label>
              <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What happens in this stage?" rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingId ? '✓ Update Stage' : '+ Add Stage'}</button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗺️</div>
          <p>No roadmap stages yet. Add your first stage above!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item, index) => (
            <div key={item.id} className="card" style={{
              borderLeft: `4px solid ${item.status === 'Completed' ? '#2d8a54' : item.status === 'In Progress' ? '#c87c2a' : item.status === 'In Review' ? '#3b5bdb' : 'var(--border)'}`,
              padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      width: 28, height: 28, background: 'var(--cream)',
                      border: '1.5px solid var(--border)', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 600, color: 'var(--rose)', flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>
                    <h4 style={{ color: 'var(--wine)', fontSize: '1rem', fontFamily: 'Lora, serif' }}>{item.title}</h4>
                    <span className={`badge ${STATUS_CLASS[item.status] || 'badge-not-started'}`}>{item.status}</span>
                  </div>
                  {item.description && (
                    <p style={{ color: '#5a4a4e', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '8px' }}>
                      {item.description}
                    </p>
                  )}
                  {item.due_date && (
                    <p style={{ color: 'var(--rose)', fontSize: '0.78rem' }}>
                      📅 Due: {new Date(item.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', width: 28, height: 28, cursor: 'pointer', opacity: index === 0 ? 0.3 : 1 }}>↑</button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    title="Move down"
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', width: 28, height: 28, cursor: 'pointer', opacity: index === items.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button className="btn-ghost" onClick={() => handleEdit(item)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(item.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
