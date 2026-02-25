import React, { useState, useEffect } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

const SuperAdmin = ({ theme }) => {
  const isDark = theme === "dark";

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    role: "USER",
  });

  const [users, setUsers] = useState([]);
  
  const [editUser, setEditUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  
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


      const handleUpdatePassword = async () => {
  if (!newPassword) {
    alert("Password cannot be empty");
    return;
  }

  try {
    const token = localStorage.getItem("loginToken");

    await axios.put(
      `http://localhost:5000/api/user/${editUser._id}/password`,
      { password: newPassword },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    alert("Password updated successfully ✅");

    setEditUser(null);
    setNewPassword("");
  } catch (err) {
    alert("Failed to update password");
  }
};

  // Fetch all users on load
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("loginToken");

      const res = await axios.get(
        "http://localhost:5000/api/user/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user (Instant Table Update)
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

      const res = await axios.post(
        "http://localhost:5000/api/user/create",
        {
          name: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const createdUser = res.data.user;

      // ✅ Instantly add new user to table
      setUsers((prev) => [createdUser, ...prev]);

      alert("User created successfully ✅");

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

  // Delete user (Instant Remove)
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("loginToken");

      await axios.delete(
        `http://localhost:5000/api/user/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Remove from table instantly
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      alert("Failed to delete user");
    }
  };
return (
  <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 flex justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 transition-all">

    <div
      className={`w-full max-w-6xl rounded-3xl shadow-2xl border p-4 sm:p-6 md:p-10 backdrop-blur-xl transition-all duration-300
      ${isDark
        ? "bg-white/5 border-white/10 text-white"
        : "bg-white border-gray-200 text-gray-800"
      }`}
    >

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Manage administrators and users in your monitoring system.
          </p>
        </div>

        <div className="self-start md:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-medium shadow-lg">
          Access: SUPERADMIN
        </div>
      </div>

      {/* ================= FORM CARD ================= */}
      <div
        className={`rounded-2xl p-4 sm:p-6 md:p-8 mb-8 md:mb-10 shadow-lg border
        ${isDark
          ? "bg-gray-900/60 border-gray-800"
          : "bg-gray-50 border-gray-200"
        }`}
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-6">
          Create New User
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <FloatingInput
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            theme={theme}
          />

          <FloatingInput
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            theme={theme}
          />

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
              <span className={`text-xs font-medium ${
                passwordStrength === "Strong"
                  ? "text-green-500"
                  : passwordStrength === "Medium"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}>
                {passwordStrength} password
              </span>
            )}
          </div>

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
        <div className="mt-6">
          <label className="block text-sm mb-2 font-medium opacity-80">
            Select Role
          </label>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={`w-full md:w-80 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition
            ${isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-300"
            }`}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Super Admin</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-8">
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border font-medium transition hover:scale-105
            dark:border-gray-700 border-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto px-8 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl hover:scale-105 transition-transform"
          >
            Create User
          </button>
        </div>
      </div>
{/* ================= USERS TABLE ================= */}
<div>
  <h2 className="text-lg sm:text-xl font-semibold mb-6">
    Manage Users
  </h2>

  {/* ================= DESKTOP TABLE (lg and up) ================= */}
  <div className="hidden lg:block overflow-x-auto rounded-2xl border shadow-lg">
    <table className="w-full text-sm text-left">
      <thead className={`${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
        <tr>
          <th className="p-4">Name</th>
          <th className="p-4">Email</th>
          <th className="p-4">Role</th>
          <th className="p-4 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {users.length === 0 ? (
          <tr>
            <td colSpan="4" className="text-center p-6 opacity-60">
              No users found
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <tr
              key={user._id}
              className={`transition hover:bg-indigo-50 dark:hover:bg-gray-800 ${
                isDark
                  ? "border-b border-gray-700"
                  : "border-b border-gray-200"
              }`}
            >
              <td className="p-4 font-medium">{user.name}</td>
              <td className="p-4 opacity-70">{user.email}</td>
              <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === "SUPERADMIN"
                    ? "bg-purple-600 text-white"
                    : user.role === "ADMIN"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-400 text-white"
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button
                  onClick={() => {
                    setEditUser(user);
                    setNewPassword("");
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(user._id)}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  {/* ================= MOBILE & TABLET CARDS (below lg) ================= */}
  <div className="lg:hidden space-y-4">
    {users.length === 0 ? (
      <div className="text-center py-6 opacity-60">
        No users found
      </div>
    ) : (
      users.map((user) => (
        <div
          key={user._id}
          className={`rounded-2xl p-5 shadow-md border transition ${
            isDark
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Name */}
          <div className="mb-3">
            <p className="text-xs opacity-60">Name</p>
            <p className="font-semibold">{user.name}</p>
          </div>

          {/* Email */}
          <div className="mb-3">
            <p className="text-xs opacity-60">Email</p>
            <p className="text-sm break-all">{user.email}</p>
          </div>

          {/* Role */}
          <div className="mb-4">
            <p className="text-xs opacity-60">Role</p>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
              user.role === "SUPERADMIN"
                ? "bg-purple-600 text-white"
                : user.role === "ADMIN"
                ? "bg-blue-500 text-white"
                : "bg-gray-400 text-white"
            }`}>
              {user.role}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditUser(user);
                setNewPassword("");
              }}
              className="flex-1 py-2 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(user._id)}
              className="flex-1 py-2 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))
    )}
  </div>
</div>


      {/* ================= PASSWORD MODAL ================= */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${
              isDark ? "bg-gray-900 text-white" : "bg-white text-gray-800"
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">
              Update Password for {editUser.name}
            </h3>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={`w-full px-3 py-2 rounded-lg border mb-4 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-gray-100 border-gray-300"
              }`}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setEditUser(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdatePassword}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="relative">
      <input
        type={inputType}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`peer w-full px-3 pt-5 pb-2 ${
          isPassword ? "pr-10" : ""
        } rounded-lg border outline-none transition
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
          ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        {label}
      </label>

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${
            isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

export default SuperAdmin;