import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const n = await Notification.findById(id);
    if (!n || String(n.user) !== req.user.id) return res.status(404).json({ message: 'Notification not found' });

    n.read = true;
    await n.save();
    res.json(n);
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ message: 'Failed to mark notification read' });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Failed to mark all read' });
  }
};
