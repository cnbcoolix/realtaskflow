import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://realtaskflow.onrender.com";

// Reusable API helper — adds the login token to every request
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Color badges for priority and status
const PRIORITY_COLOR = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700" };
const STATUS_COLOR   = { todo: "bg-gray-100 text-gray-600", in_progress: "bg-blue-100 text-blue-700", done: "bg-green-100 text-green-700" };

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [page, setPage] = useState("login"); // login | register | app

  const logout = () => { localStorage.removeItem("token"); setToken(null); setPage("login"); };

  if (!token) return page === "login"
    ? <AuthForm mode="login" onAuth={t => { localStorage.setItem("token", t); setToken(t); }} switchTo={() => setPage("register")} />
    : <AuthForm mode="register" onAuth={t => { localStorage.setItem("token", t); setToken(t); }} switchTo={() => setPage("login")} />;

  return <TaskApp onLogout={logout} />;
}

// --- Login / Register form ---
function AuthForm({ mode, onAuth, switchTo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      let res;
      if (mode === "register") {
        res = await axios.post(`${API}/register`, { email, password });
        onAuth(res.data.token);
      } else {
        // Login uses form-encoded data (OAuth2 standard)
        const form = new URLSearchParams();
        form.append("username", email);
        form.append("password", password);
        res = await axios.post(`${API}/login`, form);
        onAuth(res.data.access_token);
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-1">TaskFlow</h1>
        <p className="text-gray-500 mb-6 text-sm">{mode === "login" ? "Sign in to your account" : "Create your account"}</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700" onClick={submit}>
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
        <p className="text-center text-sm text-gray-500 mt-4 cursor-pointer hover:underline" onClick={switchTo}>
          {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
        </p>
      </div>
    </div>
  );
}

// --- Main app after login ---
function TaskApp({ onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Load tasks and stats when page opens
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [t, s] = await Promise.all([api.get("/tasks"), api.get("/stats")]);
    setTasks(t.data);
    setStats(s.data);
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    await api.post("/tasks", { title: newTitle, description: newDesc });
    setNewTitle(""); setNewDesc("");
    await fetchAll();
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await api.put(`/tasks/${id}`, { status });
    await fetchAll();
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    await fetchAll();
  };

  // Filter tasks by status tab
  const visible = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">TaskFlow</h1>
        <button className="text-sm text-gray-500 hover:text-gray-800" onClick={onLogout}>Sign out</button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Stats dashboard */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[["Total", stats.total], ["To Do", stats.todo], ["In Progress", stats.in_progress], ["Done", stats.done]].map(([label, val]) => (
            <div key={label} className="bg-white border rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold">{val ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Add task form */}
        <div className="bg-white border rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-3">Add a task — AI will suggest priority &amp; time</p>
          <input className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Task title (e.g. Fix urgent login bug)" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} />
          <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50" onClick={addTask} disabled={loading}>
            {loading ? "Adding..." : "+ Add Task"}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {["all", "todo", "in_progress", "done"].map(f => (
            <button key={f} className={`px-3 py-1 rounded-full text-sm capitalize ${filter === f ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`} onClick={() => setFilter(f)}>
              {f.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {visible.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No tasks here yet.</p>}
          {visible.map(task => (
            <div key={task.id} className="bg-white border rounded-xl p-4 flex items-start gap-3">
              {/* Checkbox to mark done */}
              <input type="checkbox" checked={task.status === "done"} className="mt-1 cursor-pointer" onChange={e => updateStatus(task.id, e.target.checked ? "done" : "todo")} />
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${task.status === "done" ? "line-through text-gray-400" : ""}`}>{task.title}</p>
                {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority} priority</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[task.status]}`}>{task.status.replace("_", " ")}</span>
                  <span className="text-xs text-gray-400">~{task.estimated_minutes} min</span>
                </div>
              </div>
              {/* Status change dropdown */}
              <select className="text-xs border rounded px-1 py-1 text-gray-600" value={task.status} onChange={e => updateStatus(task.id, e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <button className="text-gray-300 hover:text-red-400 text-lg leading-none" onClick={() => deleteTask(task.id)}>×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}