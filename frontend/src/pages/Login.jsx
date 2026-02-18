import { useState } from "react";
import axios from "axios";
import Galaxy from "../components/Galaxy";
import { useNavigate } from "react-router-dom";


const Login = ({ onLogin, goToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      localStorage.setItem("loginToken", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">

      {/* 🌌 Galaxy Background */}
      <Galaxy
        mouseInteraction
        mouseRepulsion
        density={1.2}
        glowIntensity={0.4}
        hueShift={220}
        twinkleIntensity={0.5}
        rotationSpeed={0.15}
      />

      {/* 🔮 Glass Card */}
      <div className="relative z-10 w-full max-w-md p-10 rounded-3xl
        bg-white/10 backdrop-blur-2xl border border-white/20
        shadow-[0_0_40px_rgba(0,0,255,0.3)]
        text-white">

        <h2 className="text-3xl font-bold text-center mb-8 tracking-wide">
          Welcome Back 🚀
        </h2>

        {error && (
          <div className="bg-red-500/30 text-red-100 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-white/20 
            placeholder-white/70 focus:outline-none 
            focus:ring-2 focus:ring-blue-400 
            transition duration-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white/20 
            placeholder-white/70 focus:outline-none 
            focus:ring-2 focus:ring-blue-400 
            transition duration-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold 
            bg-gradient-to-r from-blue-500 to-indigo-600
            hover:scale-105 transition duration-300
            shadow-lg shadow-blue-500/40"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Don’t have an account?{" "}
         <button
  type="button"
  onClick={() => navigate("/signup")}
  className="text-blue-300 underline hover:text-blue-200"
>
  Signup
</button>

        </p>
      </div>
    </div>
  );
};

export default Login;
