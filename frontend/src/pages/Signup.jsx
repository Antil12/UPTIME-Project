import { useState } from "react";
import axios from "axios";
import Galaxy from "../components/Galaxy";
import { useNavigate } from "react-router-dom";


const Signup = ({ onSignup, goToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup",
        { name, email, password },
        { withCredentials: true }
      );
      localStorage.setItem("loginToken", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onSignup();
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      <Galaxy
        mouseInteraction
        mouseRepulsion
        density={1.3}
        glowIntensity={0.5}
        hueShift={280}
        twinkleIntensity={0.6}
        rotationSpeed={0.18}
      />

      <div className="relative z-10 w-full max-w-md p-10 rounded-3xl backdrop-blur-2xl border text-white" style={{ background: 'hsl(var(--card) / 0.08)', borderColor: 'hsl(var(--border) / 0.6)', boxShadow: '0 0 40px hsl(var(--chart-4) / 0.3)', color: 'hsl(var(--card-foreground))' }}>

        <h2 className="text-3xl font-bold text-center mb-8 tracking-wide">
          Create Account ✨
        </h2>

        {error && (
            <div className="p-3 rounded-lg mb-4 text-sm text-center" style={{ background: 'hsl(var(--chart-3) / 0.12)', color: 'hsl(var(--chart-3) / 0.95)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

            <input
            type="text"
            placeholder="Full Name"
              className="w-full px-4 py-3 rounded-xl transition duration-300"
              style={{ background: 'hsl(var(--card) / 0.06)', color: 'hsl(var(--card-foreground))', outline: 'none', border: '1px solid hsl(var(--border) / 0.6)' }}
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
            className="w-full py-3 rounded-xl font-semibold hover:scale-105 transition duration-300"
            style={{ background: 'linear-gradient(90deg, hsl(var(--chart-4)), hsl(var(--chart-5)))', color: 'hsl(0 0% 100%)', boxShadow: '0 12px 30px hsl(var(--chart-4) / 0.35)' }}
          >
            Signup
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Already have an account?{" "}
         <button
  type="button"
  onClick={() => navigate("/login")}
  className="underline"
  style={{ color: 'hsl(var(--chart-4))' }}
>
  Login
</button>

        </p>
      </div>
    </div>
  );
};

export default Signup;
