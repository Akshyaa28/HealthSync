import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import UploadReport from "../components/UploadReport"; 
import RiskCards from "../components/RiskCards"; 
import TrendChart from "../components/TrendChart"; 
import ReportHistory from "../components/ReportHistory"; 

export default function Dashboard() { 
  const navigate = useNavigate();
  const [result, setResult] = useState(null); 
  const [riskScore, setRiskScore] = useState(0); 
  const [trend, setTrend] = useState("-"); 
  const [status, setStatus] = useState("-"); 

  useEffect(() => { 
    const me = JSON.parse(localStorage.getItem("user") || "null");
    if (me?.role === "doctor") {
      navigate("/doctor");
      return;
    }
    if (result) { 
      setRiskScore(result.riskScore); 
      setTrend(result.trend); 
      setStatus(result.status); 
    } 
  }, [result, navigate]);

  // fetch recent doctor feedback notifications (reportReviewed) and refresh profile
  const [feedback, setFeedback] = useState([]);
  useEffect(() => {
    const fetchFeedbackAndProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const filtered = (data.notifications || []).filter(n => n.type === 'reportReviewed');
        setFeedback(filtered.slice(0,3));

        // refresh profile so preferredDoctor shows up after login/changes
        const profileRes = await fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const profile = await profileRes.json();
        if (profileRes.ok) {
          localStorage.setItem('user', JSON.stringify({ id: profile._id, name: profile.name, email: profile.email, role: profile.role, avatar: profile.avatar, preferredDoctor: profile.preferredDoctor }));
          window.dispatchEvent(new Event('profileUpdated'));
        }
      } catch (err) {
        // ignore
      }
    };
    fetchFeedbackAndProfile();
  }, []); 

  return ( 
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-sky-100 dark:bg-slate-900 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

      {/* space for fixed navbar */}
      <div className="h-13" />

      {/* ===== Main Content ===== */}
      <div className="px-16 py-24">
        <div className="flex items-center gap-4">
          <h1 className="text-6xl font-extrabold text-teal-700 dark:text-teal-300">Health Dashboard</h1>
          {/* risk status pill */}
          {status && status !== '-' && (
            <div className="ml-4 px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-semibold">
              {status}
            </div>
          )}
        </div>

        <p className="text-2xl text-gray-600 dark:text-slate-300 mt-4">
          Track your health risks and improvements over time
        </p> 

        <div className="mt-4 flex items-center gap-4">
          <a href="/appointments" className="px-4 py-2 rounded bg-teal-600 text-white">Request Appointment</a>
          <div className="text-sm text-gray-600">Preferred doctor: <strong>{JSON.parse(localStorage.getItem('user')||'null')?.preferredDoctor?.name || 'None'}</strong></div>
        </div>

        <div className="mt-16"> 
          <RiskCards 
            riskScore={riskScore} 
            trend={trend} 
            status={status} 
            reasons={result?.reasons || []}
          />
        </div> 

        <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-16"> 
          <TrendChart result={result} /> 
          <UploadReport setResult={setResult} /> 
        </div> 

        {/* Doctor Feedback */}
        {feedback.length > 0 && (
          <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-lg border">
            <h3 className="font-semibold mb-2">Recent Doctor Feedback</h3>
            <ul className="text-sm text-gray-700 dark:text-slate-300">
              {feedback.map(f => (
                <li key={f._id} className="mb-1">{f.message} <span className="text-xs text-gray-400">({new Date(f.createdAt).toLocaleDateString()})</span></li>
              ))}
            </ul>
            <div className="mt-2">
              <a href="/notifications" className="text-sm text-teal-600">View all notifications</a>
            </div>
          </div>
        )}

        <div className="mt-24"> 
          <ReportHistory result={result} /> 
        </div> 
      </div>

    </div> 
  ); 
}
