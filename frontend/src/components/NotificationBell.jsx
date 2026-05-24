import { useState, useEffect } from 'react';
import { getNotifications } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const data = await getNotifications(token);
        if (!mounted) return;
        setCount(data.unreadCount || 0);
      } catch (err) {
        // ignore
      }
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, [token]);

  return (
    <button onClick={() => navigate('/notifications')} className="relative w-10 h-10 rounded flex items-center justify-center">
      <span className="text-xl">🔔</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2">{count}</span>
      )}
    </button>
  );
}
