import { useEffect, useState } from 'react';
import API, { getMyAppointments } from '../services/api';

export default function PreferredDoctorSelector({ token }) {
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/users/doctors', { headers: { Authorization: `Bearer ${token}` } });
        setDoctors(res.data);
        const me = JSON.parse(localStorage.getItem('user') || 'null');
        setSelected(me?.preferredDoctor?._id || me?.preferredDoctor || '');
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [token]);

  const savePreferred = async () => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('preferredDoctor', selected);
      const res = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save preferred doctor');
      // update local user
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user')||'{}'), preferredDoctor: data.preferredDoctor }));
      window.dispatchEvent(new Event('profileUpdated'));
      alert('Preferred doctor updated');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm text-gray-600 dark:text-slate-300 mb-2">Preferred Doctor</label>
      <div className="flex gap-2">
        <select className="border rounded px-3 py-2" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">No preference</option>
          {doctors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.email})</option>)}
        </select>
        <button className="bg-teal-600 text-white px-3 py-2 rounded" onClick={savePreferred} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
}