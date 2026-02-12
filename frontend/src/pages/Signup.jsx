import { useState } from "react";
import axios from "axios";
import Galaxy from "../components/Galaxy";

const Signup = ({ onSignup, goToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup",
        { name, email, password }
      );

      localStorage.setItem("loginToken", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onSignup();
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">

      <Galaxy
        mouseInteraction
        mouseRepulsion
        density={1.3}
        glowIntensity={0.5}
        hueShift={280}
        twinkleIntensity={0.6}
        rotationSpeed={0.18}
      />

      <div className="relative z-10 w-full max-w-md p-10 rounded-3xl
        bg-white/10 backdrop-blur-2xl border border-white/20
        shadow-[0_0_40px_rgba(255,0,255,0.3)]
        text-white">

        <h2 className="text-3xl font-bold text-center mb-8 tracking-wide">
          Create Account ✨
        </h2>

        {error && (
          <div className="bg-red-500/30 text-red-100 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-3 rounded-xl bg-white/20 
            placeholder-white/70 focus:outline-none 
            focus:ring-2 focus:ring-pink-400 transition duration-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-white/20 
            placeholder-white/70 focus:outline-none 
            focus:ring-2 focus:ring-pink-400 transition duration-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white/20 
            placeholder-white/70 focus:outline-none 
            focus:ring-2 focus:ring-pink-400 transition duration-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold 
            bg-gradient-to-r from-pink-500 to-purple-600
            hover:scale-105 transition duration-300
            shadow-lg shadow-pink-500/40"
          >
            Signup
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Already have an account?{" "}
          <button
            onClick={goToLogin}
            className="text-pink-300 underline hover:text-pink-200"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
