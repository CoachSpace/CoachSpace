import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function CommentsTab({ project, setToast }) {
  const [updates, setUpdates] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdateId, setSelectedUpdateId] = useState('');
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: u }, { data: c }] = await Promise.all([
      supabase.from('updates').select('id, title').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabase.from('comments').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    ]);
    setUpdates(u || []);
    setComments(c || []);
    if (u && u.length > 0) setSelectedUpdateId(u[0].id);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!comment.trim()) { setToast({ message: 'Comment cannot be empty.', type: 'error' }); return; }
    if (!selectedUpdateId) { setToast({ message: 'Please select a task.', type: 'error' }); return; }
    setSaving(true);
    const { data, error } = await supabase.from('comments').insert({
      project_id: project.id,
      update_id: selectedUpdateId,
      name: name.trim() || 'Anonymous',
      comment: comment.trim(),
    }).select().single();
    setSaving(false);
    if (error) { setToast({ message: error.message, type: 'error' }); return; }
    setComments(prev => [data, ...prev]);
    setComment('');
    setToast({ message: 'Comment added!', type: 'success' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    await supabase.from('comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
    setToast({ message: 'Comment deleted.', type: 'success' });
  };

  // Group comments by update
  const grouped = updates.map(u => ({
    ...u,
    comments: comments.filter(c => c.update_id === u.id),
  })).filter(u => u.comments.length > 0);

  const AVATAR_COLORS = ['#F6C7CF', '#EAD7D9', '#fef4e4', '#e8f5ed', '#e8f0fe'];
  const getColor = (name) => AVATAR_COLORS[name?.charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Add Comment Form */}
      <div className="card">
        <h3 style={{ color: 'var(--wine)', fontSize: '1.05rem', marginBottom: '18px' }}>💬 Leave a Comment</h3>

        {updates.length === 0 ? (
          <p style={{ color: 'var(--rose)', fontSize: '0.88rem' }}>Add tasks in the Updates tab first to start commenting.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label">Task / Update *</label>
              <select className="input-field" value={selectedUpdateId} onChange={e => setSelectedUpdateId(e.target.value)}>
                {updates.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Your Name (optional)</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mary" />
            </div>
            <div>
              <label className="label">Comment *</label>
              <textarea
                className="input-field"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write your comment here..."
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Posting...' : '✦ Post Comment'}
            </button>
          </div>
        )}
      </div>

      {/* Comments display */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : grouped.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
          <p>No comments yet. Be the first to leave feedback!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {grouped.map(update => (
            <div key={update.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{
                  fontSize: '0.78rem', fontWeight: 600, color: 'var(--rose)',
                  background: 'var(--cream)', padding: '4px 14px',
                  border: '1px solid var(--border)', borderRadius: '20px', whiteSpace: 'nowrap',
                }}>
                  {update.title}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {update.comments.map(c => (
                  <div key={c.id} className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                        <div style={{
                          width: 36, height: 36, flexShrink: 0,
                          borderRadius: '50%', background: getColor(c.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 700, color: 'var(--wine)',
                        }}>
                          {(c.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--wine)' }}>{c.name || 'Anonymous'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>
                              {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{c.comment}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--border)', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}
                        title="Delete comment"
                      >×</button>
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
