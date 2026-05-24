import { useState } from "react";
import { signupUser } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [role, setRole] = useState("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await signupUser({ name, email, password, role });
      alert("Account created successfully!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      
      {/* LEFT */}
      <div className="w-1/2 bg-gradient-to-br from-teal-600 to-green-500 text-white flex flex-col justify-center px-20">
        <h1 className="text-6xl font-extrabold mb-6">Join HealthSync Today</h1>
        <p className="text-2xl mb-10">
          AI-powered insights, tracking & smart medical analysis.
        </p>

        <ul className="space-y-4 text-xl">
          <li>✔ AI health risk assessment</li>
          <li>✔ Medical report summarization</li>
          <li>✔ Prescription translation</li>
          <li>✔ 24/7 AI assistant</li>
        </ul>
      </div>

      {/* RIGHT */}
      <div className="w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-xl">
          <h2 className="text-5xl font-bold mb-2">Create your account</h2>
          <p className="text-xl text-gray-600 mb-8">
            Start your health journey
          </p>

          {/* ROLE */}
          <p className="text-xl font-semibold mb-3">I am a</p>
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setRole("patient")}
              className={`flex-1 py-6 text-2xl rounded-xl border transition
              ${role === "patient"
                ? "border-teal-600 bg-teal-50 scale-105"
                : "border-gray-300"}`}
            >
              👤 Patient
            </button>

            <button
              onClick={() => setRole("doctor")}
              className={`flex-1 py-6 text-2xl rounded-xl border transition
              ${role === "doctor"
                ? "border-teal-600 bg-teal-50 scale-105"
                : "border-gray-300"}`}
            >
              🩺 Doctor
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full mb-4 px-6 py-5 text-xl border rounded-lg"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full mb-4 px-6 py-5 text-xl border rounded-lg"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full mb-6 px-6 py-5 text-xl border rounded-lg"
          />

          <button
            onClick={handleSignup}
            className="w-full py-6 text-2xl rounded-full bg-gradient-to-r from-teal-600 to-blue-500 text-white font-semibold hover:scale-105 transition"
          >
            Create Account →
          </button>
        </div>
      </div>
    </div>
  );
}
