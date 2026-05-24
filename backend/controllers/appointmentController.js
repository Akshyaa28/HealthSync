import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import User from '../models/User.js';
import AppointmentHistory from '../models/AppointmentHistory.js';
import ActionHistory from '../models/ActionHistory.js';

// Patient: request appointment
export const requestAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    if (!doctorId || !date || !time) return res.status(400).json({ message: 'doctorId, date and time required' });

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') return res.status(400).json({ message: 'Invalid doctor' });

    // prevent double booking (same doctor/date/time with pending/approved)
    const conflict = await Appointment.findOne({ doctor: doctorId, date, time, status: { $in: ['pending', 'approved'] } });
    if (conflict) return res.status(409).json({ message: 'Slot not available' });

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      date,
      time,
      reason,
      status: 'pending'
    });

    // Record appointment history
    try {
      await AppointmentHistory.create({
        appointment: appointment._id,
        patient: req.user.id,
        doctor: doctorId,
        fromStatus: null,
        toStatus: 'pending',
        note: 'Appointment requested by patient'
      });
    } catch (hErr) {
      console.warn('Failed to create appointment history', hErr?.message || hErr);
    }

    // Notify doctor of new appointment request
    try {
      const Notification = (await import('../models/Notification.js')).default;
      const patient = await User.findById(req.user.id).select('name');
      await Notification.create({
        user: doctorId,
        actor: req.user.id,
        type: 'appointmentRequest',
        message: `New appointment request from ${patient?.name || 'a patient'} on ${date} at ${time}`,
        data: { appointmentId: appointment._id }
      });

      // Log action for doctor side
      await ActionHistory.create({ actor: req.user.id, patient: doctorId, type: 'appointment_status_changed', data: { appointmentId: appointment._id, status: 'pending' } });
    } catch (e) {
      console.warn('Failed to create appointment notification', e?.message || e);
    }

    res.status(201).json(appointment);
  } catch (err) {
    console.error('Request appointment error:', err);
    res.status(500).json({ message: 'Failed to request appointment' });
  }
};

// Patient: list their appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const appts = await Appointment.find({ patient: req.user.id }).sort({ date: 1, time: 1 }).populate('doctor', 'name email');
    res.json(appts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

// Cancel appointment (patient or doctor)
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    // allow patient or doctor to cancel
    if (String(appt.patient) !== req.user.id && String(appt.doctor) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    const fromStatus = appt.status;
    appt.status = 'cancelled';
    await appt.save();

    // record history
    try {
      await AppointmentHistory.create({ appointment: appt._id, patient: appt.patient, doctor: appt.doctor, fromStatus, toStatus: 'cancelled', note: 'Cancelled' });
    } catch (hErr) {
      console.warn('Failed to create appointment history', hErr?.message || hErr);
    }

    // log action
    try {
      await ActionHistory.create({ actor: req.user.id, patient: appt.patient, type: 'appointment_status_changed', data: { appointmentId: appt._id, fromStatus, toStatus: 'cancelled' } });
    } catch (e) {
      console.warn('Failed to create action history for cancel', e?.message || e);
    }

    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to cancel appointment' });
  }
};

// Doctor: view their upcoming appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const appts = await Appointment.find({ doctor: req.user.id }).sort({ date: 1, time: 1 }).populate('patient', 'name email');
    res.json(appts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch doctor appointments' });
  }
};

// Doctor: approve or reschedule
export const approveOrRescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body; // optional reschedule
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (String(appt.doctor) !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    if (date) appt.date = date;
    if (time) appt.time = time;

    // when rescheduling/approving, check conflict
    const checkDate = appt.date;
    const checkTime = appt.time;
    const conflict = await Appointment.findOne({ doctor: req.user.id, date: checkDate, time: checkTime, status: { $in: ['approved'] }, _id: { $ne: appt._id } });
    if (conflict) return res.status(409).json({ message: 'Slot already taken' });

    // approve if currently pending
    const wasPending = appt.status === 'pending';
    const fromStatus = appt.status;
    if (wasPending) appt.status = 'approved';

    // when rescheduling/approving, record appointment history
    try {
      await AppointmentHistory.create({ appointment: appt._id, patient: appt.patient, doctor: req.user.id, fromStatus, toStatus: appt.status, note: wasPending ? 'Approved by doctor' : 'Rescheduled by doctor' });
    } catch (hErr) {
      console.warn('Failed to create appointment history', hErr?.message || hErr);
    }

    // Notify patient if appointment approved or rescheduled
    try {
      const Notification = (await import('../models/Notification.js')).default;
      const doc = await User.findById(req.user.id).select('name');
      const patientId = appt.patient;
      const msg = wasPending
        ? `Your appointment on ${appt.date} at ${appt.time} has been approved by Dr ${doc?.name || 'doctor'}`
        : `Your appointment has been rescheduled to ${appt.date} at ${appt.time} by Dr ${doc?.name || 'doctor'}`;

      await Notification.create({ user: patientId, actor: req.user.id, type: 'appointmentApproved', message: msg, data: { appointmentId: appt._id } });

      // Log action for doctor side
      await ActionHistory.create({ actor: req.user.id, patient: patientId, type: 'appointment_status_changed', data: { appointmentId: appt._id, fromStatus, toStatus: appt.status } });
    } catch (e) {
      console.warn('Failed to create appointment-approved notification', e?.message || e);
    }

    await appt.save();
    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
};

// Doctor: set availability slots for a date (replace existing)
export const setAvailability = async (req, res) => {
  try {
    const { date, slots } = req.body;
    if (!date || !Array.isArray(slots)) return res.status(400).json({ message: 'date and slots[] required' });

    const docId = req.user.id;
    let avail = await Availability.findOne({ doctor: docId, date });
    if (!avail) {
      avail = await Availability.create({ doctor: docId, date, slots });
    } else {
      avail.slots = slots;
      await avail.save();
    }

    res.json(avail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to set availability' });
  }
};

// Get availability for a doctor (doctor or patient)
export const getAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId) return res.status(400).json({ message: 'doctorId required' });

    const q = { doctor: doctorId };
    if (date) q.date = date;

    const avail = await Availability.find(q).sort({ date: 1 });
    res.json(avail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
};
