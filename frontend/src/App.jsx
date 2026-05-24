import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Navbar from "./components/Navbar";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorAppointments from "./pages/DoctorAppointments";
import DoctorAnalytics from "./pages/DoctorAnalytics";
import PatientAppointments from "./pages/PatientAppointments";
import Notifications from "./pages/Notifications";
import PatientDetail from "./pages/PatientDetail";
import PrescriptionTranslator from "./pages/PrescriptionTranslator";

function AppRoutes() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <div className="h-24" />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/patient/:id" element={<PatientDetail />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/analytics" element={<DoctorAnalytics />} />
        <Route path="/appointments" element={<PatientAppointments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/prescription-translator" element={<PrescriptionTranslator />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
