import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",   // backend base
});

// ---------- SIGNUP ----------
export const signupUser = async (userData) => {
  return API.post("/auth/signup", userData);
};

// ---------- LOGIN ----------
export const loginUser = async (userData) => {
  return API.post("/auth/login", userData);
};

export const fetchReportHistory = async (token) => {
  const res = await fetch("http://localhost:5000/api/reports/history", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.json();
};

// Fetch list of patients for doctors (supports ?sort=risk)
export const getPatients = async (token, sort = 'risk') => {
  const res = await API.get('/doctor/patients', {
    params: { sort },
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Fetch single patient details (profile + reports)
export const getPatientDetails = async (token, id) => {
  const res = await API.get(`/doctor/patients/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Generate AI explanation via backend AI endpoint
export const generateAI = async (userQuery, reportData = {}, patientId = null) => {
  const res = await API.post('/ai', { userQuery, reportData, patientId });
  return res.data;
};

// Doctor Assistant endpoints
export const postDoctorAssistant = async (token, patientId, question, language) => {
  const res = await API.post('/doctor/ai-assistant', { patientId, question, language }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getDoctorAssistant = async (token, patientId) => {
  const res = await API.get('/doctor/ai-assistant', { params: { patientId }, headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

// ---------- APPOINTMENTS (Patient) ----------
export const requestAppointment = async (token, doctorId, date, time, reason = '') => {
  const res = await API.post('/appointments', { doctorId, date, time, reason }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getMyAppointments = async (token) => {
  const res = await API.get('/appointments', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const cancelAppointment = async (token, id) => {
  const res = await API.patch(`/appointments/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

// ---------- DOCTOR (appointments + availability) ----------
export const getDoctorAppointments = async (token) => {
  const res = await API.get('/doctor/appointments', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getDoctorAnalytics = async (token) => {
  const res = await API.get('/doctor/analytics', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const approveOrRescheduleAppointment = async (token, id, date, time) => {
  const res = await API.patch(`/doctor/appointments/${id}`, { date, time }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getAvailability = async (token, doctorId, date) => {
  const res = await API.get('/appointments/availability', { params: { doctorId, date }, headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const setAvailability = async (token, date, slots) => {
  const res = await API.post('/doctor/availability', { date, slots }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getNotifications = async (token) => {
  const res = await API.get('/notifications', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const markNotificationRead = async (token, id) => {
  const res = await API.patch(`/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const markAllNotificationsRead = async (token) => {
  const res = await API.patch('/notifications/mark-all-read', {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getProfile = async (token) => {
  const res = await API.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const translatePrescription = async (token, text, language = 'en', file = null) => {
  const form = new FormData();
  if (text) form.append('text', text);
  form.append('language', language);
  if (file) form.append('prescriptionFile', file);

  const res = await API.post('/prescription/translate', form, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export default API;
