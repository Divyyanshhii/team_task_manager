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
      fetchProjects(); 
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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 font-medium tracking-wide">Loading workspace credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Premium Dynamic Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/70 border-b border-slate-800/80 shadow-2xl shadow-slate-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            {/* Reverted Name Back to Team Task Manager */}
            <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
              Team Task Manager
            </h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/40">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-slate-300">
                {user.name}
              </span>
            </div>
            <button 
              onClick={handleLogout} 
              className="text-sm font-semibold bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-2 rounded-xl border border-red-500/20 hover:border-red-500 transition-all duration-200 shadow-md hover:shadow-red-500/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <nav className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Workspaces Sidebar */}
          <section className="w-full lg:w-1/4 flex flex-col gap-6">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Workspaces
              </h2>
              <ul className="space-y-1.5 max-h-[35vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {projects.map(p => (
                  <li 
                    key={p._id} 
                    className={`group px-3.5 py-2.5 cursor-pointer rounded-xl transition-all duration-150 flex items-center justify-between ${selectedProject?._id === p._id ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border border-blue-500/30 text-blue-400 font-semibold shadow-inner' : 'border border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'}`}
                    onClick={() => setSelectedProject(p)}
                  >
                    <span className="truncate">{p.name}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${selectedProject?._id === p._id ? 'text-blue-400 translate-x-0' : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </li>
                ))}
                {projects.length === 0 && <p className="text-sm text-slate-500 italic p-2">No workspaces active.</p>}
              </ul>

              <form onSubmit={createProject} className="mt-5 pt-4 border-t border-slate-800/60">
                <input 
                  type="text" placeholder="New project handle..." 
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl mb-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required
                />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 transition-all duration-150">
                  + Create Workspace
                </button>
              </form>
            </div>
          </section>

          {/* Kanban Display */}
          <section className="w-full lg:w-3/4 flex flex-col gap-6">
            {selectedProject ? (
              <>
                <div className="bg-gradient-to-b from-slate-900/60 to-slate-900/30 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
                    <div>
                      <h2 className="text-2xl font-black text-slate-100 tracking-tight mb-1">{selectedProject.name}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${selectedProject.admin._id === user.id ? 'bg-blue-400' : 'bg-purple-400'}`} />
                          Role: <strong className="text-slate-300">{selectedProject.admin._id === user.id ? 'Administrator' : 'Collaborator'}</strong>
                        </span>
                        <span className="text-slate-700">•</span>
                        <span>Active Team: <strong className="text-slate-300">{selectedProject.members.length} Users</strong></span>
                      </div>
                    </div>
                    {selectedProject.admin._id === user.id && (
                       <button 
                         onClick={() => setShowTaskForm(!showTaskForm)} 
                         className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${showTaskForm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20'}`}
                       >
                         {showTaskForm ? 'Minimize Panel' : 'Deploy Task Form'}
                       </button>
                    )}
                  </div>

                  {selectedProject.admin._id === user.id && (
                    <form onSubmit={addMemberToProject} className="flex gap-2.5 bg-slate-950/40 p-2 border border-slate-800/80 rounded-xl">
                      <select 
                        className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-slate-700" 
                        value={selectedUserToAdd} onChange={(e) => setSelectedUserToAdd(e.target.value)}
                      >
                        <option value="" className="bg-slate-950">Select user accounts to request...</option>
                        {allUsers.filter(u => !selectedProject.members.some(m => m._id === u._id)).map(u => (
                          <option key={u._id} value={u._id} className="bg-slate-950">{u.name} ({u.email})</option>
                        ))}
                      </select>
                      <button type="submit" className="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">
                        Onboard
                      </button>
                    </form>
                  )}
                </div>

                {/* Modular Analytics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 shadow-lg text-center relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500/40 group-hover:bg-blue-500 transition-colors" />
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-1">Total Pipeline</p>
                    <p className="text-3xl font-black text-slate-200 tracking-tight">{totalTasks}</p>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 shadow-lg text-center relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500/40 group-hover:bg-indigo-500 transition-colors" />
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-1">My Assignment</p>
                    <p className="text-3xl font-black text-slate-200 tracking-tight">{myTasksCount}</p>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 shadow-lg text-center relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-1">Production Closed</p>
                    <p className="text-3xl font-black text-slate-200 tracking-tight">{doneCount}</p>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 shadow-lg text-center relative overflow-hidden group">
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-rose-500/40 group-hover:bg-rose-500 transition-colors" />
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-1">Overdue Breaches</p>
                    <p className={`text-3xl font-black tracking-tight ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{overdueCount}</p>
                  </div>
                </div>

                {/* Task Form */}
                {showTaskForm && (
                  <form onSubmit={createTask} className="bg-slate-900/50 border-l-4 border-l-blue-500 border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <input type="text" placeholder="Task title..." className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500/50" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                      </div>
                      <div>
                        <input type="date" className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 text-slate-400" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                      </div>
                    </div>
                    <textarea placeholder="Describe task metrics and expectations..." className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500/50" rows="2" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <select className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)}>
                        <option value="" className="bg-slate-950">Allocate assignment...</option>
                        {selectedProject.members.map(member => (
                          <option key={member._id} value={member._id} className="bg-slate-950">{member.name}</option>
                        ))}
                      </select>
                      <select className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                        <option value="Low" className="bg-slate-950">Low Priority</option>
                        <option value="Medium" className="bg-slate-950">Medium Priority</option>
                        <option value="High" className="bg-slate-950">High Priority</option>
                      </select>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-blue-600/15 transition-all">
                        Commit Task
                      </button>
                    </div>
                  </form>
                )}

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {['To Do', 'In Progress', 'Done'].map(status => {
                    const statusConfig = {
                      'To Do': { bg: 'bg-slate-900/20', accent: 'border-t-blue-500/40', text: 'text-blue-400', label: 'Backlog Pipeline' },
                      'In Progress': { bg: 'bg-slate-900/20', accent: 'border-t-amber-500/40', text: 'text-amber-400', label: 'Active Execution' },
                      'Done': { bg: 'bg-slate-900/20', accent: 'border-t-emerald-500/40', text: 'text-emerald-400', label: 'Production Clear' }
                    }[status];

                    return (
                      <div key={status} className={`${statusConfig.bg} border-t-2 ${statusConfig.accent} border-x border-b border-slate-900 rounded-2xl p-4 min-h-[50vh] flex flex-col shadow-2xl`}>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                          <h3 className={`font-extrabold text-sm uppercase tracking-wider ${statusConfig.text}`}>{statusConfig.label}</h3>
                          <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 rounded-md text-slate-500">
                            {tasks.filter(t => t.status === status).length}
                          </span>
                        </div>
                        
                        <div className="flex-1 space-y-3.5 overflow-y-auto pr-0.5 scrollbar-none">
                          {tasks.filter(t => t.status === status).map(task => {
                            const isProjectAdmin = selectedProject.admin._id === user.id;
                            const isAssignedUser = task.assignedTo && task.assignedTo._id === user.id;
                            const canEdit = isProjectAdmin || isAssignedUser;
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

                            const priorityBadge = {
                              'High': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                              'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                              'Low': 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }[task.priority] || 'bg-slate-500/10 text-slate-400';

                            return (
                              <div key={task._id} className={`bg-slate-900/80 border ${isOverdue ? 'border-rose-500/40 shadow-lg shadow-rose-950/10' : 'border-slate-800/70'} rounded-xl p-4 hover:border-slate-700/60 transition-all duration-150 relative group`}>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <h4 className="font-bold text-sm text-slate-200 tracking-tight group-hover:text-white transition-colors">{task.title}</h4>
                                  <span className={`text-[9px] px-2 py-0.5 font-extrabold uppercase rounded-md border ${priorityBadge}`}>
                                    {task.priority}
                                  </span>
                                </div>
                                
                                {task.description && (
                                  <p className="text-xs text-slate-400 mb-3 leading-relaxed line-clamp-2">{task.description}</p>
                                )}
                                
                                <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-850 text-[11px] text-slate-400 mb-3">
                                  <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Owner: {task.assignedTo ? task.assignedTo.name : 'Unassigned Pool'}</span>
                                  </div>
                                  {task.dueDate && (
                                    <div className={`flex items-center gap-1.5 font-medium ${isOverdue ? "text-rose-400" : "text-slate-500"}`}>
                                      <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span>Target: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <select 
                                  className={`text-xs border rounded-lg p-2 w-full transition-all ${!canEdit ? 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed' : 'bg-slate-950 border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700 focus:outline-none focus:border-blue-500/50'}`}
                                  value={task.status}
                                  onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                                  disabled={!canEdit}
                                >
                                  <option value="To Do" className="bg-slate-950">Backlog Pipeline</option>
                                  <option value="In Progress" className="bg-slate-950">Active Execution</option>
                                  <option value="Done" className="bg-slate-950">Production Clear</option>
                                </select>
                                
                                {!canEdit && (
                                  <div className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1 italic">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Read-only clearance
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-slate-900/20 border border-slate-800/60 p-16 rounded-2xl text-center backdrop-blur-sm shadow-xl flex flex-col items-center justify-center min-h-[60vh]">
                <div className="h-14 w-14 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2H3m16 0a2 2 0 012 2v1a2 2 0 01-2 2H9m12 0a2 2 0 012 2v1a2 2 0 01-2 2H3m16 0V5a2 2 0 00-2-2h-3M5 3v14M5 7h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-300 tracking-tight mb-1">No Workspace Selected</h3>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                  Select a running terminal project framework from the left sidebar or execute a brand new structural layout strategy.
                </p>
              </div>
            )}
          </section>

        </div>
      </nav>
    </div>
  );
}

export default Dashboard;