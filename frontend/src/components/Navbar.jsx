import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const token = localStorage.getItem("token");
  const isLogged = !!token;
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isDoctor = user?.role === "doctor";
  const homePath = isDoctor ? "/doctor" : "/dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md dark:bg-slate-900/95 border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to={isLogged ? homePath : "/"} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md">
              H
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-teal-700 dark:text-white">HealthSync</span>
              <span className="text-xs text-gray-500 dark:text-slate-300">Personal health insights</span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-gray-700 dark:text-slate-200 font-semibold text-lg">
          {isLogged ? (
            <>
              {isDoctor ? (
                <>
                  <Link to="/doctor" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Doctor Dashboard</Link>
                  <Link to="/doctor/appointments" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Doctor Appointments</Link>
                  <Link to="/doctor/analytics" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Analytics</Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Dashboard</Link>
                  <Link to="/appointments" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Appointments</Link>
                  <Link to="/prescription-translator" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Translator</Link>
                </>
              )}
            </>
          ) : (
            <>
              <a onClick={() => (window.location.href = "/#features")} className="cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition">Features</a>
              <a onClick={() => (window.location.href = "/#how-it-works")} className="cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition">How It Works</a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isLogged ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <ProfileMenu />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="font-semibold text-lg text-gray-700 dark:text-slate-200 hover:text-teal-600 transition">Sign In</Link>
              <Link to="/signup" className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-5 py-2 rounded-full font-semibold text-lg shadow-md hover:scale-105 transition">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
