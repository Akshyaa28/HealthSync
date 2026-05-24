import { useState } from "react";
import { loginUser } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleLogin = async () => {
  try {
    const res = await loginUser({ email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    alert("Login successful!");

    // ✅ THIS IS THE CORRECT PLACE
    const role = res?.data?.user?.role;
    navigate(role === "doctor" ? "/doctor" : "/dashboard");

  } catch (err) {
    alert(err.response?.data?.message || "Login failed");
  }
};


  return (
    <div className="min-h-screen flex">

      {/* LEFT */}
      <div className="w-1/2 bg-white flex justify-center items-center px-24">
        <div className="w-full max-w-2xl">

          {/* LOGO */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-teal-600 to-green-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">❤</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-wide">
              HealthSync
            </h1>
          </div>

          {/* TEXT */}
          <h2 className="text-5xl font-bold mb-3">
            Welcome back 👋
          </h2>

          <p className="text-gray-600 text-2xl mb-12 leading-snug">
            Login to continue your healthcare journey
          </p>

          {/* EMAIL */}
          <label className="text-xl font-semibold">Email</label>
          <div className="flex items-center border rounded-2xl px-5 py-5 mb-6 bg-gray-50 shadow-sm">
            <span className="text-gray-500 mr-3 text-2xl">
              <i className="fa-regular fa-envelope" />
            </span>
            <input
              className="w-full bg-transparent outline-none text-2xl"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="flex justify-between items-center">
            <label className="text-xl font-semibold">Password</label>
            <span className="text-teal-600 cursor-pointer text-lg">
              Forgot password?
            </span>
          </div>

          <div className="flex items-center border rounded-2xl px-5 py-5 bg-gray-50 shadow-sm mb-10">
            <span className="text-gray-500 mr-3 text-2xl">
              <i className="fa-solid fa-lock" />
            </span>
            <input
              type="password"
              className="w-full bg-transparent outline-none text-2xl"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            className="w-full py-5 text-2xl rounded-full bg-gradient-to-r from-teal-600 to-blue-500 text-white font-bold shadow-xl hover:scale-105 transition"
          >
            Sign In →
          </button>

          {/* DIVIDER */}
          <div className="flex items-center my-8">
            <hr className="flex-1 border-gray-300" />
            <span className="mx-4 text-gray-500 text-xl">Or continue with</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* SOCIAL */}
          <div className="flex gap-5">
            <button className="flex-1 border rounded-2xl py-4 text-xl flex items-center justify-center gap-3 shadow">
              🔵 Google
            </button>

            <button className="flex-1 border rounded-2xl py-4 text-xl flex items-center justify-center gap-3 shadow">
              🐱 GitHub
            </button>
          </div>

          {/* SIGNUP */}
          <p className="text-center text-gray-600 mt-8 text-xl">
            Don’t have an account?{" "}
            <span
              className="text-teal-600 font-bold cursor-pointer"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-1/2 bg-gradient-to-br from-teal-600 to-green-500 text-white flex flex-col justify-center items-center px-24">

        {/* HEART LOGO */}
        <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-2xl mb-6">
          <span className="text-red-500 text-5xl">❤</span>
        </div>

        <h2 className="text-6xl font-extrabold mb-6 text-center leading-tight">
          Your Health,  
          <br />Our Priority
        </h2>

        <p className="text-2xl text-center max-w-2xl leading-relaxed opacity-95">
          Access personalized care insights, track your progress,
          and stay connected with smart health solutions.
        </p>
      </div>

    </div>
  );
}
