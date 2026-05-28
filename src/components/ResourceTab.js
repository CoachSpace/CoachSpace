import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { notifyUpload, notifyNewResource } from '../lib/email';

const TYPES = ['Link', 'Document', 'Image', 'Video', 'Brand Asset', 'Login Info', 'Other'];
const TYPE_ICONS = { 'Link': '🔗', 'Document': '📄', 'Image': '🖼️', 'Video': '🎬', 'Brand Asset': '🎨', 'Login Info': '🔑', 'Other': '📦' };
const TYPE_COLORS = { 'Link': '#e8f0fe', 'Document': '#fef4e4', 'Image': '#fce4ec', 'Video': '#f3e5f5', 'Brand Asset': '#fce4ec', 'Login Info': '#f3e5f5', 'Other': '#f5f5f5' };
const ACCEPT = { 'Document': '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx', 'Image': 'image/*', 'Video': 'video/*', 'Brand Asset': 'image/*,.pdf,.ai,.eps,.svg', 'Other': '*' };

const EMPTY_FORM = { title: '', type: 'Link', url: '', description: '' };

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FilePreview({ resource }) {
  const isImage = resource.type === 'Image' || resource.type === 'Brand Asset' || (resource.file_url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(resource.file_url));
  const isVideo = resource.type === 'Video' || (resource.file_url && /\.(mp4|mov|webm|avi)$/i.test(resource.file_url));
  if (isImage && resource.file_url) {
    return (
      <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <img src={resource.file_url} alt={resource.title} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  if (isVideo && resource.file_url) {
    return (
      <div style={{ marginBottom: '10px' }}>
        <video controls style={{ width: '100%', borderRadius: '8px', maxHeight: '180px' }}>
          <source src={resource.file_url} />
        </video>
      </div>
    );
  }
  return null;
}

export default function ResourceTab({ project, setToast }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaderName, setUploaderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('resources').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    setResources(data || []);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    if (!form.title) {
      setForm(f => ({ ...f, title: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;
    setUploading(true);
    setUploadProgress(10);
    const ext = file.name.split('.').pop();
    const fileName = `${project.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    setUploadProgress(40);
    const { data, error } = await supabase.storage.from('resources').upload(fileName, file, { cacheControl: '3600', upsert: false });
    setUploadProgress(80);
    if (error) {
      setToast({ message: 'Upload error: ' + error.message, type: 'error' });
      setUploading(false);
      return null;
    }
    const { data: urlData } = supabase.storage.from('resources').getPublicUrl(data.path);
    setUploadProgress(100);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setToast({ message: 'Title is required.', type: 'error' }); return; }
    setSaving(true);
    let fileUrl = null;
    let fileName = null;

    if (selectedFile && form.type !== 'Link' && form.type !== 'Login Info') {
      fileUrl = await handleFileUpload(selectedFile);
      if (!fileUrl) { setSaving(false); return; }
      fileName = selectedFile.name;
    }

    const payload = {
      title: form.title,
      type: form.type,
      url: form.url,
      description: form.description,
      ...(fileUrl ? { file_url: fileUrl, file_name: fileName } : {}),
    };

    if (editingId) {
      const { error } = await supabase.from('resources').update(payload).eq('id', editingId);
      if (!error) {
        setResources(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } : r));
        setToast({ message: 'Resource updated!', type: 'success' });
      } else {
        setToast({ message: 'Error: ' + error.message, type: 'error' });
      }
    } else {
      const { data, error } = await supabase.from('resources').insert({ ...payload, project_id: project.id }).select().single();
      if (!error && data) {
        setResources(prev => [data, ...prev]);
        setToast({ message: 'Resource added!', type: 'success' });
        notifyNewResource({ projectName: project.project_name, resourceTitle: form.title, resourceType: form.type, coachEmail: process.env.REACT_APP_COACH_EMAIL, clientEmail: project.client_email });
        if (fileUrl) notifyUpload({ projectName: project.project_name, uploaderName: uploaderName || 'A user', fileName, fileType: form.type, coachEmail: process.env.REACT_APP_COACH_EMAIL, clientEmail: project.client_email });
      } else if (error) {
        setToast({ message: 'Error: ' + error.message, type: 'error' });
      }
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setUploaderName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleEdit = (r) => {
    setForm({ title: r.title, type: r.type, url: r.url || '', description: r.description || '' });
    setEditingId(r.id);
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleDelete = async (r) => {
    if (!window.confirm('Delete this resource?')) return;
    if (r.file_url) {
      const parts = r.file_url.split('/resources/');
      if (parts[1]) await supabase.storage.from('resources').remove([decodeURIComponent(parts[1])]);
    }
    await supabase.from('resources').delete().eq('id', r.id);
    setResources(prev => prev.filter(x => x.id !== r.id));
    setToast({ message: 'Resource deleted.', type: 'success' });
  };

  const showFileInput = form.type !== 'Link' && form.type !== 'Login Info';
  const grouped = TYPES.reduce((acc, type) => {
    const items = resources.filter(r => r.type === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: 'var(--wine)', fontSize: '1.1rem' }}>Resources & Files</h3>
          <p style={{ color: 'var(--rose)', fontSize: '0.82rem', marginTop: '4px' }}>{resources.length} resources</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setSelectedFile(null); }}>+ Add Resource</button>
      </div>

      {showForm && (
        <div className="card" style={{ borderColor: 'var(--blush)' }}>
          <h4 style={{ color: 'var(--wine)', marginBottom: '16px' }}>{editingId ? 'Edit Resource' : 'Add Resource'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Brand Guidelines" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={e => { setForm({ ...form, type: e.target.value }); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{showFileInput ? 'URL (optional if uploading)' : 'URL / Link'}</label>
              <input className="input-field" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Description</label>
              <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief note about this resource..." rows={2} style={{ resize: 'vertical' }} />
            </div>

            {showFileInput && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Upload File ({form.type})</label>

                {selectedFile ? (
                  /* ── File selected — show confirmation card ── */
                  <div style={{ border: '2px solid var(--rose)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', background: '#fff8f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>{TYPE_ICONS[form.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--wine)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ✓ {selectedFile.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button onClick={clearFile} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--rose)', flexShrink: 0 }}>
                      Change file
                    </button>
                  </div>
                ) : (
                  /* ── Drop zone ── */
                  <div
                    style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '28px 20px', textAlign: 'center', background: 'var(--cream)', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
                    onClick={() => fileRef.current?.click()}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.background = '#fff8f9'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--cream)'; }}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--rose)'; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--border)';
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileSelect(file);
                    }}
                  >
                    <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{TYPE_ICONS[form.type]}</div>
                    <p style={{ color: 'var(--wine)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px' }}>Click to browse or drag & drop</p>
                    <p style={{ color: 'var(--rose)', fontSize: '0.75rem', opacity: 0.8 }}>
                      {form.type === 'Image' ? 'PNG, JPG, GIF, WebP, SVG' :
                       form.type === 'Video' ? 'MP4, MOV, WebM' :
                       form.type === 'Brand Asset' ? 'Images, PDF, SVG, AI, EPS' :
                       'PDF, DOC, DOCX, PPT, XLS and more'}
                    </p>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT[form.type] || '*'}
                  style={{ display: 'none' }}
                  onChange={e => handleFileSelect(e.target.files[0])}
                />

                {uploading && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--rose)', marginBottom: '6px' }}>
                      <span>Uploading...</span><span>{uploadProgress}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--blush), var(--wine))', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Your Name (for notification)</label>
              <input className="input-field" value={uploaderName} onChange={e => setUploaderName(e.target.value)} placeholder="e.g. Mary (optional)" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving || uploading}>
              {uploading ? `Uploading ${uploadProgress}%...` : saving ? 'Saving...' : editingId ? '✓ Update' : '+ Add Resource'}
            </button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }}>
              Cancel
            </button>
            {selectedFile && !uploading && (
              <span style={{ fontSize: '0.78rem', color: '#2d8a54', fontWeight: 500 }}>
                ✓ Ready: {selectedFile.name}
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : resources.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
          <p>No resources yet. Add links, upload documents, images, and videos!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>{TYPE_ICONS[type]}</span>
                <h4 style={{ color: 'var(--wine)', fontSize: '0.9rem', fontWeight: 600 }}>{type}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>({items.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {items.map(r => (
                  <div key={r.id} className="card" style={{ padding: '16px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: TYPE_COLORS[r.type] || '#f5f5f5', borderRadius: '0 var(--radius) 0 var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                      {TYPE_ICONS[r.type]}
                    </div>
                    <div style={{ paddingRight: '36px' }}>
                      <h5 style={{ color: 'var(--wine)', fontSize: '0.9rem', marginBottom: '6px' }}>{r.title}</h5>
                      {r.description && <p style={{ color: '#5a4a4e', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '10px' }}>{r.description}</p>}
                      <FilePreview resource={r} />
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {r.file_url && (
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--wine)', textDecoration: 'none', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', background: 'var(--cream)' }}>
                            {r.type === 'Image' || r.type === 'Brand Asset' ? '🖼 View' : r.type === 'Video' ? '▶ Play' : '⬇ Download'}
                          </a>
                        )}
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--wine)', textDecoration: 'none', borderBottom: '1px solid var(--blush)', paddingBottom: '1px' }}>
                            Open Link →
                          </a>
                        )}
                      </div>
                      {r.file_name && <p style={{ fontSize: '0.72rem', color: 'var(--rose)', marginTop: '6px', opacity: 0.7 }}>📎 {r.file_name}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" onClick={() => handleEdit(r)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(r)}>✕</button>
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
