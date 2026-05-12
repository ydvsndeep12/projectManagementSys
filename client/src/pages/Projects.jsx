import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Completed' };
const STATUS_COLORS = { todo: '#7aaace', 'in-progress': '#f39c12', done: '#27ae60' };

function ProjectModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(
    initial ? { name: initial.name, description: initial.description, status: initial.status || 'todo' } : { name: '', description: '', status: 'todo' }
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (initial) {
        const { data } = await api.put(`/projects/${initial._id}`, form);
        onSave(data, 'edit');
      } else {
        const { data } = await api.post('/projects', form);
        onSave(data, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initial ? 'Edit Project' : 'New Project'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project Name *</label>
              <input
                className="form-control"
                type="text"
                placeholder="e.g. Website Redesign"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                placeholder="Brief project description…"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            {initial && (
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Completed</option>
                </select>
              </div>
            )}
            <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : initial ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    api
      .get('/projects')
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (project, mode) => {
    if (mode === 'create') {
      setProjects((prev) => [project, ...prev]);
    } else {
      setProjects((prev) => prev.map((p) => (p._id === project._id ? project : p)));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      setDeleteId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <div className="spinner">Loading projects…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-muted mt-4">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 48 }}>📁</div>
          <p>No projects yet.{isAdmin ? ' Create one to get started.' : ' Ask an admin to add you to a project.'}</p>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map((proj) => (
            <div
              key={proj._id}
              className="card card-hover"
              onClick={() => navigate(`/projects/${proj._id}`)}
            >
              <div className="flex-between mb-8">
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #355872, #7aaace)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {proj.name.charAt(0).toUpperCase()}
                </div>
                {isAdmin && (
                  <div
                    style={{ display: 'flex', gap: 4 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn-icon"
                      title="Edit"
                      onClick={() => { setEditProject(proj); setShowModal(true); }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon danger"
                      title="Delete"
                      onClick={() => setDeleteId(proj._id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#355872', margin: '10px 0 4px' }}>
                {proj.name}
              </h3>
              <p style={{ fontSize: 13, color: '#6c7a89', marginBottom: 14, minHeight: 36 }}>
                {proj.description || 'No description'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: -6 }}>
                  {proj.members.slice(0, 4).map((m, i) => (
                    <div
                      key={m._id}
                      className="avatar"
                      title={m.name}
                      style={{
                        width: 28,
                        height: 28,
                        fontSize: 10,
                        border: '2px solid #fff',
                        marginLeft: i > 0 ? -6 : 0,
                        background: i % 2 === 0 ? '#355872' : '#7aaace',
                      }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {proj.members.length > 4 && (
                    <div
                      className="avatar"
                      style={{ width: 28, height: 28, fontSize: 9, marginLeft: -6, background: '#aaa', border: '2px solid #fff' }}
                    >
                      +{proj.members.length - 4}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 12, color: '#6c7a89' }}>
                  {proj.members.length} member{proj.members.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#aaa' }}>Owner: {proj.owner.name}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 20,
                  background: STATUS_COLORS[proj.status || 'todo'] + '22',
                  color: STATUS_COLORS[proj.status || 'todo'],
                  border: `1px solid ${STATUS_COLORS[proj.status || 'todo']}44`,
                }}>
                  {STATUS_LABELS[proj.status || 'todo']}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <ProjectModal
          initial={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Project</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>This will permanently delete the project and <strong>all its tasks</strong>. Are you sure?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
