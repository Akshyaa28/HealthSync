import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function ProfileMenu() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setUser(JSON.parse(localStorage.getItem("user") || "null"));
    window.addEventListener("profileUpdated", handler);
    return () => window.removeEventListener("profileUpdated", handler);
  }, []);

  const isDoctor = user?.role === "doctor";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        className="w-12 h-12 rounded-full bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 overflow-hidden"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-lg p-4 text-sm z-50 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold">{user?.name || "User"}</div>
              <div className="text-gray-500 text-xs dark:text-slate-300">{user?.email || ""}</div>
            </div>
          </div>

          {!isDoctor && (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="w-full block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">Patient Dashboard</Link>
              <Link to="/appointments" onClick={() => setOpen(false)} className="w-full block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">Appointments</Link>
              <Link to="/prescription-translator" onClick={() => setOpen(false)} className="w-full block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">Prescription Translator</Link>
              <Link to="/notifications" onClick={() => setOpen(false)} className="w-full block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">Notifications</Link>
            </>
          )}

          {isDoctor && (
            <>
              <Link to="/doctor" onClick={() => setOpen(false)} className="w-full block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">Doctor Dashboard</Link>
              <Link to="/doctor/appointments" onClick={() => setOpen(false)} className="w-full block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">Doctor Appointments</Link>
              <Link to="/doctor/analytics" onClick={() => setOpen(false)} className="w-full block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">Doctor Analytics</Link>
              <Link to="/notifications" onClick={() => setOpen(false)} className="w-full block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">Notifications</Link>
            </>
          )}

          <button
            onClick={() => {
              navigate("/settings");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 mt-1"
          >
            Settings
          </button>

          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded mt-3 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
