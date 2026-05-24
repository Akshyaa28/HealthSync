import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ================= SIGNUP ==================
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};


// ================= LOGIN ==================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if(!email || !password){
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });
    if (!user){
      return res.status(400).json({ message: "User not found" });
    }

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass){
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || ""
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ---------------- Profile Endpoints -----------------
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

import fs from 'fs';
import path from 'path';

export const updateProfile = async (req, res) => {
  try {
    const updates = {};

    if (req.body.name) updates.name = req.body.name;

    if (req.body.preferredDoctor) {
      try {
        const pd = req.body.preferredDoctor;
        const doc = await User.findById(pd);
        if (!doc || doc.role !== 'doctor') return res.status(400).json({ message: 'Invalid preferred doctor' });
        updates.preferredDoctor = pd;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid preferred doctor' });
      }
    }

    if (req.files && req.files.avatar) {
      const avatarFile = req.files.avatar;
      const folder = path.join(process.cwd(), 'uploads', 'avatars');
      // ensure folder exists
      fs.mkdirSync(folder, { recursive: true });

      const ext = path.extname(avatarFile.name) || '.png';
      const filename = `avatar_${req.user.id}_${Date.now()}${ext}`;
      const filepath = path.join(folder, filename);

      await fs.promises.writeFile(filepath, avatarFile.data);

      // Build URL accessible from frontend
      const url = `${req.protocol}://${req.get('host')}/uploads/avatars/${filename}`;
      updates.avatar = url;
    }

    let user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    // populate preferred doctor info where present
    user = await User.findById(user._id).select('-password').populate('preferredDoctor', 'name email avatar');

    res.status(200).json(user);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
