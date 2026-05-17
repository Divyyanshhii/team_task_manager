import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
    }
  }, [user, token, navigate]);

  useEffect(() => {
    if (user && token) {
      fetchProjects();
    }
  }, [user, token]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject._id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
      if (res.data.length > 0) setSelectedProject(res.data[0]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects', error);
      setLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks', error);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/projects`, 
        { name: newProjectName, description: 'New Project' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects([...projects, res.data]);
      setSelectedProject(res.data);
      setNewProjectName('');
    } catch (error) {
      console.error('Error creating project', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/tasks/${taskId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update task');
    }
  };

  // --- THE LOGOUT FUNCTION ---
  const handleLogout = () => {
    // 1. Destroy the saved credentials
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 2. Kick them back to the login page
    navigate('/');
  };

  if (loading || !user) return <div className="text-center mt-10">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      
      {/* --- TOP NAVBAR WITH LOGOUT --- */}
      <div className="flex justify-between items-center bg-white p-4 rounded shadow mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium hidden md:block">
            Welcome, {user.name}
          </span>
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar: Projects */}
        <div className="w-full md:w-1/4 bg-white p-4 rounded shadow h-fit">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">My Projects</h2>
          <ul className="mb-4">
            {projects.map(p => (
              <li 
                key={p._id} 
                className={`p-2 cursor-pointer rounded mb-1 ${selectedProject?._id === p._id ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}`}
                onClick={() => setSelectedProject(p)}
              >
                {p.name}
              </li>
            ))}
            {projects.length === 0 && <p className="text-sm text-gray-500">No projects yet.</p>}
          </ul>

          <form onSubmit={createProject} className="mt-4">
            <input 
              type="text" 
              placeholder="New Project Name" 
              className="w-full p-2 border rounded mb-2 text-sm"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700">
              + Create Project
            </button>
          </form>
        </div>

        {/* Main Content: Tasks Board */}
        <div className="w-full md:w-3/4">
          {selectedProject ? (
            <>
              <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                  <p className="text-sm text-gray-500">
                    Role: {selectedProject.admin._id === user.id ? 'Admin' : 'Member'}
                  </p>
                </div>
                {selectedProject.admin._id === user.id && (
                   <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                     + New Task
                   </button>
                )}
              </div>

              {/* Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['To Do', 'In Progress', 'Done'].map(status => (
                  <div key={status} className="bg-gray-200 p-4 rounded min-h-[300px]">
                    <h3 className="font-bold mb-4 text-gray-700 border-b border-gray-300 pb-2">{status}</h3>
                    {tasks.filter(t => t.status === status).map(task => (
                      <div key={task._id} className="bg-white p-3 rounded shadow mb-3 border-l-4 border-blue-500">
                        <h4 className="font-semibold">{task.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">Priority: {task.priority}</p>
                        <select 
                          className="text-xs border rounded p-1 w-full"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white p-10 rounded shadow text-center text-gray-500">
              Select or create a project to view tasks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;