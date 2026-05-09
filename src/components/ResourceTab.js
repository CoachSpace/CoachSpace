import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const TYPES = ['Link', 'File', 'Brand Asset', 'Login Info', 'Document', 'Other'];
const TYPE_ICONS = {
  'Link': '🔗',
  'File': '📄',
  'Brand Asset': '🎨',
  'Login Info': '🔑',
  'Document': '📋',
  'Other': '📦',
};
const TYPE_COLORS = {
  'Link': '#e8f0fe',
  'File': '#fef4e4',
  'Brand Asset': '#fce4ec',
  'Login Info': '#f3e5f5',
  'Document': '#e8f5e9',
  'Other': '#f5f5f5',
};

const EMPTY_FORM = { title: '', type: 'Link', url: '', description: '' };

export default function ResourceTab({ project, setToast }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('resources').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    setResources(data || []);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.title.trim()) { setToast({ message: 'Resource title is required.', type: 'error' }); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from('resources').update(form).eq('id', editingId);
      if (!error) {
        setResources(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r));
        setToast({ message: 'Resource updated!', type: 'success' });
      }
    } else {
      const { data, error } = await supabase.from('resources').insert({ ...form, project_id: project.id }).select().single();
      if (!error && data) {
        setResources(prev => [data, ...prev]);
        setToast({ message: 'Resource added!', type: 'success' });
      } else if (error) {
        setToast({ message: error.message, type: 'error' });
      }
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (r) => {
    setForm({ title: r.title, type: r.type, url: r.url || '', description: r.description || '' });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    await supabase.from('resources').delete().eq('id', id);
    setResources(prev => prev.filter(r => r.id !== id));
    setToast({ message: 'Resource deleted.', type: 'success' });
  };

  const grouped = TYPES.reduce((acc, type) => {
    const items = resources.filter(r => r.type === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: 'var(--wine)', fontSize: '1.1rem' }}>Resources & Links</h3>
          <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginTop: '4px' }}>{resources.length} resources</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}>+ Add Resource</button>
      </div>

      {showForm && (
        <div className="card" style={{ borderColor: 'var(--blush)' }}>
          <h4 style={{ color: 'var(--wine)', marginBottom: '16px' }}>{editingId ? 'Edit Resource' : 'Add Resource'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Brand Guidelines Doc" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">URL / Link</label>
              <input className="input-field" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Description</label>
              <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief note about this resource..." rows={2} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingId ? '✓ Update' : '+ Add'}</button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : resources.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
          <p>No resources yet. Add links, documents, and brand assets!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1rem' }}>{TYPE_ICONS[type]}</span>
                <h4 style={{ color: 'var(--wine)', fontSize: '0.9rem', fontWeight: 600 }}>{type}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>({items.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {items.map(r => (
                  <div key={r.id} className="card" style={{ padding: '16px', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', top: 0, right: 0,
                      width: 40, height: 40,
                      background: TYPE_COLORS[r.type] || '#f5f5f5',
                      borderRadius: '0 var(--radius) 0 var(--radius)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem',
                    }}>
                      {TYPE_ICONS[r.type]}
                    </div>
                    <div style={{ paddingRight: '36px' }}>
                      <h5 style={{ color: 'var(--wine)', fontSize: '0.9rem', marginBottom: '6px' }}>{r.title}</h5>
                      {r.description && (
                        <p style={{ color: '#5a4a4e', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '10px' }}>{r.description}</p>
                      )}
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.78rem', color: 'var(--wine)', textDecoration: 'none',
                            borderBottom: '1px solid var(--blush)', paddingBottom: '1px',
                          }}
                        >
                          Open Link →
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" onClick={() => handleEdit(r)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(r.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
