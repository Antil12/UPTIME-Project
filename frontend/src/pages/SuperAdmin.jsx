import React, { useState } from "react";
import axios from "axios";

const SuperAdmin = ({ theme }) => {
  const isDark = theme === "dark";

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    role: "USER",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const passwordStrength =
    form.password.length > 10
      ? "Strong"
      : form.password.length > 5
      ? "Medium"
      : form.password.length > 0
      ? "Weak"
      : "";
      const handleSubmit = async () => {
  if (!form.username || !form.email || !form.password) {
    alert("All fields are required");
    return;
  }

  if (form.password !== form.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const token = localStorage.getItem("loginToken");

    await axios.post(
      "http://localhost:5000/api/user/create",
      {
        name: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("User created successfully ✅");

    // Reset form
    setForm({
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      role: "USER",
    });
  } catch (err) {
    alert(err.response?.data?.message || "Failed to create user");
  }
};

  return (
    <main className="min-h-screen p-6 flex justify-center items-start">
      <div
        className={`w-full max-w-3xl rounded-2xl backdrop-blur-xl border shadow-xl p-8 transition-all duration-300
        ${
          isDark
            ? "bg-white/5 border-white/10 text-white"
            : "bg-white/70 border-gray-200 text-gray-800"
        }`}
      >
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">👑 Create  Admin and User</h2>
          <p className="text-sm opacity-70 mt-1">
            Add a new high-level administrator to your monitoring system.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Username */}
          <FloatingInput
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            theme={theme}
          />

          {/* Email */}
          <FloatingInput
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            theme={theme}
          />

          {/* Password */}
          <div className="space-y-1">
            <FloatingInput
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              theme={theme}
            />
            {passwordStrength && (
              <span
                className={`text-xs ${
                  passwordStrength === "Strong"
                    ? "text-green-500"
                    : passwordStrength === "Medium"
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {passwordStrength} password
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <FloatingInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            theme={theme}
          />
        </div>

       {/* Role Selection */}
<div className="mt-8">
  <label className="block text-sm mb-2 opacity-80">
    Select Role
  </label>

  <select
    name="role"
    value={form.role}
    onChange={handleChange}
    className={`w-full md:w-80 px-3 py-2 rounded-lg border outline-none transition
      ${
        isDark
          ? "bg-gray-900 border-gray-700 text-white focus:border-indigo-500"
          : "bg-white border-gray-300 focus:border-indigo-500"
      }`}
  >
    <option value="USER">User</option>
    <option value="ADMIN">Admin</option>
    <option value="SUPERADMIN">Super Admin</option>
  </select>

  <p className="text-xs mt-2 opacity-60">
    Define access level for this account.
  </p>
</div>



        {/* Divider */}
        <div className="my-8 border-t border-white/10" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => window.history.back()}
            className={`px-5 py-2 rounded-lg transition ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>

          <button
  onClick={handleSubmit}
  className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:scale-105 transition-transform"
>
  Create
</button>
        </div>
      </div>
    </main>
  );
};

const FloatingInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  theme,
}) => {
  const isDark = theme === "dark";

  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`peer w-full px-3 pt-5 pb-2 rounded-lg border outline-none transition
        ${
          isDark
            ? "bg-gray-900 border-gray-700 text-white focus:border-indigo-500"
            : "bg-white border-gray-300 focus:border-indigo-500"
        }`}
      />

      <label
        className={`absolute left-3 top-2 text-xs transition-all
          peer-placeholder-shown:top-3
          peer-placeholder-shown:text-sm
          peer-placeholder-shown:opacity-60
          peer-focus:top-2
          peer-focus:text-xs
          ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
      >
        {label}
      </label>
    </div>
  );
};

export default SuperAdmin;