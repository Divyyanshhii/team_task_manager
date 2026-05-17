import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Project State
  const [newProjectName, setNewProjectName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  
  // Task State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const token = localStorage.getItem('token');
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
  }, []);

  useEffect(() => {
    if (!user || !token) navigate('/');
  }, [user, token, navigate]);

  useEffect(() => {
    if (user && token) {
      fetchProjects();
      fetchAllUsers();
    }
  }, [user, token]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject._id);
      setShowTaskForm(false); 
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

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(res.data);
    } catch (error) {
      console.error('Error fetching users', error);
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

  const addMemberToProject = async (e) => {
    e.preventDefault();
    if (!selectedUserToAdd) return;
    try {
      await axios.post(`${API_URL}/api/projects/${selectedProject._id}/members`, 
        { userId: selectedUserToAdd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Member added successfully!');
      setSelectedUserToAdd('');
      fetchProjects(); // Refresh to show new members
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/tasks`, 
        { 
          title: newTaskTitle, 
          description: newTaskDescription,
          dueDate: newTaskDueDate,
          priority: newTaskPriority,
          assignedTo: newTaskAssignee || null,
          projectId: selectedProject._id, 
          status: 'To Do'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTasks([...tasks, res.data]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setNewTaskAssignee('');
      setNewTaskPriority('Medium');
      setShowTaskForm(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create task');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // --- ANALYTICS CALCULATIONS ---
  const totalTasks = tasks.length;
  const myTasksCount = tasks.filter(t => t.assignedTo?._id === user?.id).length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const overdueCount = tasks.filter(t => {
    if (!t.dueDate || t.status === 'Done') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  if (loading || !user) return <div className="text-center mt-10">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Top Navbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded shadow mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium hidden md:block">Welcome, {user.name}</span>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">Logout</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar: Projects */}
        <div className="w-full md:w-1/4 bg-white p-4 rounded shadow h-fit">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">My Projects</h2>
          <ul className="mb-4 max-h-[40vh] overflow-y-auto">
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

          <form onSubmit={createProject} className="mt-4 pt-4 border-t border-gray-200">
            <input 
              type="text" placeholder="New Project Name" 
              className="w-full p-2 border rounded mb-2 text-sm"
              value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required
            />
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700">+ Create Project</button>
          </form>
        </div>

        {/* Main Content: Tasks Board */}
        <div className="w-full md:w-3/4">
          {selectedProject ? (
            <>
              {/* Project Header & Add Member UI */}
              <div className="bg-white p-4 rounded shadow mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                    <p className="text-sm text-gray-500">Role: {selectedProject.admin._id === user.id ? 'Admin' : 'Member'} | Total Members: {selectedProject.members.length}</p>
                  </div>
                  {selectedProject.admin._id === user.id && (
                     <button onClick={() => setShowTaskForm(!showTaskForm)} className={`${showTaskForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded transition`}>
                       {showTaskForm ? 'Cancel' : '+ New Task'}
                     </button>
                  )}
                </div>

                {/* ADD MEMBER FORM (Admins Only) */}
                {selectedProject.admin._id === user.id && (
                  <form onSubmit={addMemberToProject} className="flex gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                    <select className="flex-1 p-1 border rounded text-sm bg-white" value={selectedUserToAdd} onChange={(e) => setSelectedUserToAdd(e.target.value)}>
                      <option value="">Select user to add to project...</option>
                      {allUsers.filter(u => !selectedProject.members.some(m => m._id === u._id)).map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    <button type="submit" className="bg-indigo-500 text-white px-4 py-1 rounded text-sm hover:bg-indigo-600">Add Member</button>
                  </form>
                )}
              </div>

              {/* ANALYTICS WIDGETS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded shadow border border-blue-100 text-center">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">Total Tasks</p>
                  <p className="text-3xl font-black text-blue-900">{totalTasks}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded shadow border border-indigo-100 text-center">
                  <p className="text-xs text-indigo-600 font-bold uppercase mb-1">My Tasks</p>
                  <p className="text-3xl font-black text-indigo-900">{myTasksCount}</p>
                </div>
                <div className="bg-green-50 p-4 rounded shadow border border-green-100 text-center">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">Completed</p>
                  <p className="text-3xl font-black text-green-900">{doneCount}</p>
                </div>
                <div className="bg-red-50 p-4 rounded shadow border border-red-100 text-center">
                  <p className="text-xs text-red-600 font-bold uppercase mb-1">Overdue</p>
                  <p className="text-3xl font-black text-red-900">{overdueCount}</p>
                </div>
              </div>

              {/* Add Task Form */}
              {showTaskForm && (
                <form onSubmit={createTask} className="bg-white p-4 rounded shadow mb-6 flex flex-col gap-3 border-l-4 border-green-500">
                  <div className="flex gap-3">
                    <input type="text" placeholder="Task Title" className="flex-1 p-2 border rounded" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                    <input type="date" className="p-2 border rounded" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                  </div>
                  <textarea placeholder="Task Description" className="w-full p-2 border rounded text-sm" rows="2" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)}></textarea>
                  <div className="flex gap-3">
                    <select className="flex-1 p-2 border rounded bg-white text-sm" value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)}>
                      <option value="">Assign to member...</option>
                      {/* Only show users who are members of this specific project */}
                      {selectedProject.members.map(member => (
                        <option key={member._id} value={member._id}>{member.name}</option>
                      ))}
                    </select>
                    <select className="w-1/3 p-2 border rounded bg-white text-sm" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700">Submit</button>
                  </div>
                </form>
              )}

              {/* Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['To Do', 'In Progress', 'Done'].map(status => (
                  <div key={status} className="bg-gray-100 p-4 rounded min-h-[300px] border border-gray-200">
                    <h3 className="font-bold mb-4 text-gray-700 border-b border-gray-300 pb-2">{status}</h3>
                    {tasks.filter(t => t.status === status).map(task => {
                      
                      const isProjectAdmin = selectedProject.admin._id === user.id;
                      const isAssignedUser = task.assignedTo && task.assignedTo._id === user.id;
                      const canEdit = isProjectAdmin || isAssignedUser;

                      // Check if overdue for styling
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

                      return (
                        <div key={task._id} className={`bg-white p-3 rounded shadow-sm mb-3 border-l-4 ${isOverdue ? 'border-red-500' : 'border-blue-500'}`}>
                          <h4 className="font-semibold text-gray-800">{task.title}</h4>
                          {task.description && <p className="text-xs text-gray-600 my-1 line-clamp-2">{task.description}</p>}
                          
                          <div className="flex justify-between items-center my-2 text-[10px] text-gray-500 uppercase font-bold">
                            <span>{task.priority} Priority</span>
                            {task.dueDate && <span className={isOverdue ? "text-red-500" : ""}>{new Date(task.dueDate).toLocaleDateString()}</span>}
                          </div>

                          <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded mb-2 w-fit">
                            Assigned: {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                          </div>
                          
                          <select 
                            className={`text-xs border rounded p-1 w-full ${!canEdit ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-white cursor-pointer'}`}
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                            disabled={!canEdit}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                          </select>
                          
                          {!canEdit && <p className="text-[10px] text-red-400 mt-1 italic">View Only</p>}
                        </div>
                      );
                    })}
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