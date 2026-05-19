import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../lib/AdminContext';

const DEFAULT_CHECKLIST = [
  'Watch your welcome Loom',
  'Review your roadmap stages',
  'Upload brand assets to Resource Tab',
  'Confirm platform login credentials shared',
];

export default function WelcomeTab({ project, setToast }) {
  const { isAdmin } = useAdmin();
  const [editingWelcome, setEditingWelcome] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState(project.welcome_message || '');
  const [videoLink, setVideoLink] = useState(project.video_link || '');
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [newItem, setNewItem] = useState('');

  const loadChecklist = useCallback(async () => {
    setLoadingChecklist(true);
    const { data } = await supabase.from('checklist_items').select('*').eq('project_id', project.id).order('order_index');
    if (data && data.length > 0) {
      setChecklist(data);
    } else {
      const items = DEFAULT_CHECKLIST.map((label, i) => ({ project_id: project.id, label, is_completed: false, order_index: i }));
      const { data: inserted } = await supabase.from('checklist_items').insert(items).select();
      setChecklist(inserted || []);
    }
    setLoadingChecklist(false);
  }, [project.id]);

  useEffect(() => { loadChecklist(); }, [loadChecklist]);

  const toggleItem = async (item) => {
    const updated = !item.is_completed;
    setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, is_completed: updated } : c));
    await supabase.from('checklist_items').update({ is_completed: updated }).eq('id', item.id);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const { data } = await supabase.from('checklist_items').insert({
      project_id: project.id, label: newItem.trim(), is_completed: false, order_index: checklist.length,
    }).select().single();
    if (data) setChecklist(prev => [...prev, data]);
    setNewItem('');
  };

  const deleteItem = async (id) => {
    setChecklist(prev => prev.filter(c => c.id !== id));
    await supabase.from('checklist_items').delete().eq('id', id);
  };

  const saveWelcome = async () => {
    setSaving(true);
    const { error } = await supabase.from('projects').update({ welcome_message: welcomeMsg, video_link: videoLink }).eq('id', project.id);
    setSaving(false);
    if (error) {
      setToast({ message: 'Error saving: ' + error.message, type: 'error' });
    } else {
      setEditingWelcome(false);
      setToast({ message: 'Welcome section saved!', type: 'success' });
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('loom.com/share/')) {
      const id = url.split('/share/')[1]?.split('?')[0];
      return `https://www.loom.com/embed/${id}`;
    }
    if (url.includes('youtube.com/watch')) {
      const id = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(project.video_link || videoLink);
  const completedCount = checklist.filter(c => c.is_completed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Welcome Message */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--wine)', fontSize: '1.05rem' }}>✨ Welcome Message</h3>
          {/* Only admin can edit welcome message */}
          {isAdmin && !editingWelcome && (
            <button className="btn-ghost" onClick={() => setEditingWelcome(true)}>✎ Edit</button>
          )}
        </div>

        {editingWelcome && isAdmin ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Welcome Message</label>
              <textarea className="input-field" value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)} rows={5} placeholder="Write a warm welcome message for your client..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Loom / Video Link</label>
              <input className="input-field" value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="https://www.loom.com/share/... or YouTube URL" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={saveWelcome} disabled={saving}>{saving ? 'Saving...' : '✓ Save'}</button>
              <button className="btn-ghost" onClick={() => { setEditingWelcome(false); setWelcomeMsg(project.welcome_message || ''); setVideoLink(project.video_link || ''); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>
            {project.welcome_message || <span style={{ color: 'var(--rose)', fontStyle: 'italic' }}>No welcome message yet.</span>}
          </p>
        )}
      </div>

      {/* Video */}
      {(project.video_link) && (
        <div className="card">
          <h3 style={{ color: 'var(--wine)', fontSize: '1.05rem', marginBottom: '16px' }}>🎬 Welcome Video</h3>
          {embedUrl ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
              <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen title="Welcome Video" />
            </div>
          ) : (
            <a href={project.video_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--cream)', borderRadius: '10px', border: '1.5px solid var(--border)', color: 'var(--wine)', textDecoration: 'none', fontSize: '0.9rem' }}>
              <span style={{ fontSize: '24px' }}>▶</span><span>Open Video Link</span>
            </a>
          )}
        </div>
      )}

      {/* Checklist */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ color: 'var(--wine)', fontSize: '1.05rem' }}>✅ Getting Started Checklist</h3>
            <p style={{ color: 'var(--rose)', fontSize: '0.8rem', marginTop: '4px' }}>{completedCount} of {checklist.length} completed</p>
          </div>
        </div>

        {checklist.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${checklist.length ? (completedCount / checklist.length) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--blush), var(--wine))', borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {loadingChecklist ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {checklist.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: item.is_completed ? '#f0faf4' : 'var(--cream)', borderRadius: '8px', border: `1.5px solid ${item.is_completed ? '#b7dfca' : 'var(--border)'}`, transition: 'all 0.2s' }}>
                <button onClick={() => toggleItem(item)} style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', border: `2px solid ${item.is_completed ? '#2d8a54' : 'var(--border)'}`, background: item.is_completed ? '#2d8a54' : '#fff', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {item.is_completed ? '✓' : ''}
                </button>
                <span style={{ flex: 1, fontSize: '0.88rem', textDecoration: item.is_completed ? 'line-through' : 'none', color: item.is_completed ? '#6b8f7a' : 'var(--text)' }}>
                  {item.label}
                </span>
                {/* Only admin can delete checklist items */}
                {isAdmin && (
                  <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--border)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
                )}
              </div>
            ))}

            {/* Only admin can add checklist items */}
            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input className="input-field" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add checklist item..." onKeyDown={e => e.key === 'Enter' && addItem()} style={{ flex: 1 }} />
                <button className="btn-primary" onClick={addItem}>+ Add</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
