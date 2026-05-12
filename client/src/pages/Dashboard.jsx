import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const isOverdue = (task) =>
  task.dueDate &&
  new Date(task.dueDate) < new Date() &&
  task.status !== 'done';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/tasks'), api.get('/projects')])
      .then(([tasksRes, projRes]) => {
        setTasks(tasksRes.data);
        setProjects(projRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">Loading dashboard…</div>;

  const todo = tasks.filter((t) => t.status === 'todo');
  const inProgress = tasks.filter((t) => t.status === 'in-progress');
  const done = tasks.filter((t) => t.status === 'done');
  const overdue = tasks.filter(isOverdue);
  const myTasks = tasks.filter(
    (t) => t.assignedTo && (t.assignedTo._id === user.id || t.assignedTo.id === user.id)
  );

  const stats = [
    { label: 'Projects', value: projects.length, cls: '' },
    { label: 'Total Tasks', value: tasks.length, cls: 'secondary' },
    { label: 'To Do', value: todo.length, cls: '' },
    { label: 'In Progress', value: inProgress.length, cls: 'warning' },
    { label: 'Completed', value: done.length, cls: 'success' },
    { label: 'Overdue', value: overdue.length, cls: 'danger' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted mt-4">Welcome back, {user.name}</p>
        </div>
        {user.role === 'admin' && (
          <Link to="/projects" className="btn btn-primary">
            + New Project
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid-6 mb-24">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* My Tasks */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#355872', marginBottom: 16 }}>
            My Assigned Tasks
          </h2>
          {myTasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks assigned to you yet.</p>
            </div>
          ) : (
            myTasks.slice(0, 8).map((task) => (
              <div
                key={task._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: '1px solid #dde2e8',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2c3e50' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#6c7a89', marginTop: 3 }}>
                    {task.project?.name}
                    {task.dueDate && (
                      <span className={isOverdue(task) ? 'due-date overdue' : 'due-date'} style={{ marginLeft: 8 }}>
                        Due {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <span className={`badge badge-${task.status}`}>
                    {task.status === 'in-progress' ? 'In Progress' : task.status === 'done' ? 'Done' : 'Todo'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Overdue + Recent Projects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Overdue */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e74c3c', marginBottom: 16 }}>
              ⚠ Overdue Tasks
            </h2>
            {overdue.length === 0 ? (
              <p className="text-muted text-sm">No overdue tasks. Great job!</p>
            ) : (
              overdue.slice(0, 5).map((task) => (
                <div
                  key={task._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 0',
                    borderBottom: '1px solid #dde2e8',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 2 }}>
                      {task.project?.name} · Due {formatDate(task.dueDate)}
                    </div>
                  </div>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                </div>
              ))
            )}
          </div>

          {/* Recent Projects */}
          <div className="card">
            <div className="flex-between mb-16">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#355872' }}>Projects</h2>
              <Link to="/projects" style={{ fontSize: 13, color: '#7aaace', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {projects.length === 0 ? (
              <p className="text-muted text-sm">No projects yet.</p>
            ) : (
              projects.slice(0, 4).map((proj) => (
                <Link
                  key={proj._id}
                  to={`/projects/${proj._id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 0',
                    borderBottom: '1px solid #dde2e8',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#355872' }}>
                      {proj.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6c7a89', marginTop: 2 }}>
                      {proj.members.length} member{proj.members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span style={{ color: '#7aaace', fontSize: 16 }}>›</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
