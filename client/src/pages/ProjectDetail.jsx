import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in-progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
const PRIORITIES = ['low', 'medium', 'high'];

const isOverdue = (task) =>
  task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const initTaskForm = {
  title: '',
  description: '',
  assignedTo: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

/* ── Task Modal ─────────────────────────────────────────────── */
function TaskModal({ task, projectId, members, onClose, onSave }) {
  const [form, setForm] = useState(
    task
      ? {
          title: task.title,
          description: task.description || '',
          assignedTo: task.assignedTo?._id || task.assignedTo || '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        }
      : { ...initTaskForm }
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        project: projectId,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || null,
      };
      if (task) {
        const { data } = await api.put(`/tasks/${task._id}`, payload);
        onSave(data, 'edit');
      } else {
        const { data } = await api.post('/tasks', payload);
        onSave(data, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Task Title *</label>
              <input
                className="form-control"
                type="text"
                placeholder="e.g. Design landing page"
                value={form.title}
                onChange={set('title')}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                placeholder="Task details…"
                value={form.description}
                onChange={set('description')}
                rows={3}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={set('status')}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={form.priority} onChange={set('priority')}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Assign To</label>
                <select className="form-control" value={form.assignedTo} onChange={set('assignedTo')}>
                  <option value="">— Unassigned —</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.dueDate}
                  onChange={set('dueDate')}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Status-only update for members ────────────────────────── */
function StatusModal({ task, onClose, onSave }) {
  const [status, setStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status });
      onSave(data, 'edit');
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Status</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, marginBottom: 14, color: '#6c7a89' }}>
            {task.title}
          </p>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Member Modal ───────────────────────────────────────── */
function AddMemberModal({ project, allUsers, onClose, onSave }) {
  const memberIds = project.members.map((m) => m._id);
  const available = allUsers.filter((u) => !memberIds.includes(u._id));
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!userId) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/projects/${project._id}/members`, { userId });
      onSave(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Member</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {available.length === 0 ? (
            <p className="text-muted">All users are already members.</p>
          ) : (
            <div className="form-group">
              <label>Select User</label>
              <select
                className="form-control"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">— Choose user —</option>
                {available.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={loading || !userId}
          >
            {loading ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Kanban Task Card ───────────────────────────────────────── */
function TaskCard({ task, isAdmin, isAssigned, onEdit, onDelete, onStatusUpdate, onMarkDone }) {
  return (
    <div className="task-card">
      <div className="task-card-title">{task.title}</div>
      {task.description && (
        <p style={{ fontSize: 12, color: '#6c7a89', marginBottom: 8 }}>
          {task.description.length > 80
            ? task.description.slice(0, 80) + '…'
            : task.description}
        </p>
      )}
      <div className="task-card-meta">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {task.dueDate && (
          <span className={isOverdue(task) ? 'due-date overdue' : 'due-date'}>
            📅 {formatDate(task.dueDate)}
          </span>
        )}
      </div>
      <div className="task-card-footer">
        <div className="task-card-assignee">
          {task.assignedTo ? (
            <>
              <div className="avatar" style={{ width: 22, height: 22, fontSize: 9 }}>
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              {task.assignedTo.name}
            </>
          ) : (
            <span style={{ fontStyle: 'italic', fontSize: 11 }}>Unassigned</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {task.status !== 'done' && (isAdmin || isAssigned) && (
            <button
              className="btn btn-sm"
              onClick={() => onMarkDone(task)}
              title="Mark as Done"
              style={{ background: '#27ae60', color: '#fff', fontSize: 11 }}
            >
              ✓ Done
            </button>
          )}
          {(isAdmin || isAssigned) && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => (isAdmin ? onEdit(task) : onStatusUpdate(task))}
              title={isAdmin ? 'Edit task' : 'Update status'}
            >
              {isAdmin ? '✏️' : '🔄'}
            </button>
          )}
          {isAdmin && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(task._id)}
              title="Delete task"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [statusTask, setStatusTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isOwner = project?.owner?._id === user?.id || project?.owner?._id === user?._id || project?.owner?.id === user?.id;

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?projectId=${id}`),
      api.get('/users'),
    ])
      .then(([projRes, tasksRes, usersRes]) => {
        setProject(projRes.data);
        setTasks(tasksRes.data);
        setAllUsers(usersRes.data);
      })
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTaskSave = (task, mode) => {
    if (mode === 'create') {
      setTasks((prev) => [task, ...prev]);
    } else {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    }
    // Refresh project to get updated status
    api.get(`/projects/${id}`).then((res) => setProject(res.data)).catch(() => {});
  };

  const handleMarkDone = async (task) => {
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status: 'done' });
      setTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const { data } = await api.delete(`/projects/${id}/members/${memberId}`);
      setProject(data);
      setRemovingMember(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) return <div className="spinner">Loading project…</div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const colColors = {
    todo: '#7aaace',
    'in-progress': '#f39c12',
    done: '#27ae60',
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/projects')}
            style={{ marginBottom: 8 }}
          >
            ← Back to Projects
          </button>
          <h1 className="page-title">{project.name}</h1>
          {project.description && (
            <p className="text-muted mt-4">{project.description}</p>
          )}
          <div style={{ marginTop: 8, fontSize: 12, color: '#6c7a89' }}>
            Owner: <strong>{project.owner.name}</strong> ·{' '}
            Created {formatDate(project.createdAt)} ·{' '}
            <span style={{
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 20,
              background: { todo: '#7aaace', 'in-progress': '#f39c12', done: '#27ae60' }[project.status || 'todo'] + '22',
              color: { todo: '#7aaace', 'in-progress': '#f39c12', done: '#27ae60' }[project.status || 'todo'],
            }}>
              {{ todo: 'To Do', 'in-progress': 'In Progress', done: 'Completed' }[project.status || 'todo']}
            </span>
          </div>
        </div>
        {isAdmin && isOwner && (
          <button
            className="btn btn-primary"
            onClick={() => { setEditTask(null); setShowTaskModal(true); }}
          >
            + Add Task
          </button>
        )}
      </div>

      {/* Members */}
      <div className="card mb-24">
        <div className="flex-between mb-8">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#355872' }}>
            Team Members ({project.members.length})
          </h2>
          {isAdmin && isOwner && (
            <button className="btn btn-sm btn-outline" onClick={() => setShowMemberModal(true)}>
              + Add Member
            </button>
          )}
        </div>
        <div className="members-list">
          {project.members.map((m) => (
            <div key={m._id} className="member-chip">
              <div className="avatar" style={{ background: m.role === 'admin' ? '#355872' : '#7aaace' }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: '#6c7a89' }}>{m.role}</div>
              </div>
              {isAdmin && isOwner && project.owner._id !== m._id && project.owner._id !== m.id && (
                <button
                  className="btn-icon danger"
                  style={{ fontSize: 13, padding: '2px 5px' }}
                  title="Remove member"
                  onClick={() => setRemovingMember(m)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#355872' }}>
          Tasks ({tasks.length})
        </h2>
      </div>
      <div className="kanban">
        {STATUSES.map((status) => (
          <div key={status} className={`kanban-col ${status}`}>
            <div className="kanban-col-header">
              <span className="kanban-col-title" style={{ color: colColors[status] }}>
                {STATUS_LABELS[status]}
              </span>
              <span className="kanban-col-count">{tasksByStatus[status].length}</span>
            </div>

            {tasksByStatus[status].length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 10px',
                  color: '#aaa',
                  fontSize: 12,
                  fontStyle: 'italic',
                }}
              >
                No tasks here
              </div>
            ) : (
              tasksByStatus[status].map((task) => {
                const isAssigned =
                  task.assignedTo &&
                  (task.assignedTo._id === user.id || task.assignedTo.id === user.id);
                return (
                  <TaskCard
                    key={task._id}
                    task={task}
                    isAdmin={isAdmin}
                    isAssigned={isAssigned}
                    onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                    onDelete={handleTaskDelete}
                    onStatusUpdate={(t) => setStatusTask(t)}
                    onMarkDone={handleMarkDone}
                  />
                );
              })
            )}

            {isAdmin && isOwner && (
              <button
                className="btn btn-sm btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                onClick={() => {
                  setEditTask(null);
                  setShowTaskModal(true);
                }}
              >
                + Task
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Task Create/Edit Modal */}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          members={project.members}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={handleTaskSave}
        />
      )}

      {/* Status-only modal for members */}
      {statusTask && (
        <StatusModal
          task={statusTask}
          onClose={() => setStatusTask(null)}
          onSave={handleTaskSave}
        />
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <AddMemberModal
          project={project}
          allUsers={allUsers}
          onClose={() => setShowMemberModal(false)}
          onSave={(updatedProject) => setProject(updatedProject)}
        />
      )}

      {/* Remove Member Confirm */}
      {removingMember && (
        <div className="modal-overlay" onClick={() => setRemovingMember(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Remove Member</h2>
              <button className="modal-close" onClick={() => setRemovingMember(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Remove <strong>{removingMember.name}</strong> from this project?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRemovingMember(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRemoveMember(removingMember._id)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
