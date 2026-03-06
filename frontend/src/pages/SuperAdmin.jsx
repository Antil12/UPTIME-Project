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
  const [availableSites, setAvailableSites] = useState([]);
  const [assignedSites, setAssignedSites] = useState([]);

  const [editUser, setEditUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  /* ================= FORM CHANGE ================= */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= PASSWORD STRENGTH ================= */

  const passwordStrength =
    form.password.length > 10
      ? "Strong"
      : form.password.length > 5
      ? "Medium"
      : form.password.length > 0
      ? "Weak"
      : "";

  /* ================= FETCH USERS ================= */

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

  /* ================= FETCH SITES ================= */

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem("loginToken");

      const res = await axios.get(
  "http://localhost:5000/api/monitoredsite",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Sites API:", res.data);

     console.log("Sites API response:", res.data);

let sites = [];

if (Array.isArray(res.data)) {
  sites = res.data;
} else if (Array.isArray(res.data.data)) {
  sites = res.data.data;
} else if (Array.isArray(res.data.sites)) {
  sites = res.data.sites;
} else if (Array.isArray(res.data.data?.sites)) {
  sites = res.data.data.sites;
}

setAvailableSites(sites);

    } catch (err) {
      console.error("Failed to fetch sites", err);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    fetchUsers();
    fetchSites();
  }, []);

  /* ================= CREATE USER ================= */

  const handleSubmit = async () => {

    if (!form.username || !form.email || !form.password) {
      alert("All fields are required");
      return;
    }

    if (form.role === "VIEWER" && assignedSites.length === 0) {
      alert("Assign at least one site for the viewer");
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
          assignedSites: form.role === "VIEWER" ? assignedSites : [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const createdUser = res.data.user;

/* ⭐ ASSIGN SITES TO VIEWER */

if (form.role === "VIEWER" && assignedSites.length > 0) {

  const token = localStorage.getItem("loginToken");

  for (const siteId of assignedSites) {
    try {

      await axios.patch(
        `http://localhost:5000/api/monitoredsite/${siteId}/assign`,
        {
          userId: createdUser._id,
          action: "assign",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

    } catch (err) {
      console.error("Site assignment failed:", err);
    }
  }
}
/* ================= ASSIGN SITES TO VIEWER ================= */

if (form.role === "VIEWER" && assignedSites.length > 0) {

  for (const siteId of assignedSites) {

    try {

      await axios.patch(
        `http://localhost:5000/api/monitoredsite/${siteId}/assign`,
        {
          userId: createdUser._id,
          action: "assign"
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

    } catch (err) {
      console.error("Site assignment failed:", err);
    }

  }

}
setUsers((prev) => [createdUser, ...prev]);

alert("User created successfully");

      setForm({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        role: "USER",
      });

      setAssignedSites([]);

    } catch (err) {

      alert(err.response?.data?.message || "Failed to create user");

    }
  };

  /* ================= DELETE USER ================= */

  const handleDelete = async (id) => {

    try {

      const token = localStorage.getItem("loginToken");

      await axios.delete(
        `http://localhost:5000/api/user/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers((prev) => prev.filter((user) => user._id !== id));

    } catch (err) {

      alert("Failed to delete user");

    }
  };

  /* ================= UPDATE PASSWORD ================= */

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

      alert("Password updated successfully");

      setEditUser(null);
      setNewPassword("");

    } catch (err) {

      alert("Failed to update password");

    }
  };

  return (
    <main className="min-h-screen px-4 py-10 flex justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">

      <div className={`w-full max-w-6xl rounded-3xl shadow-2xl border p-8 backdrop-blur-xl ${
        isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-gray-200 text-gray-800"
      }`}>

        {/* HEADER */}

        <div className="flex justify-between mb-10">

          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-sm opacity-60">Manage system users</p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs">
            Access: SUPERADMIN
          </div>

        </div>

        {/* CREATE USER */}

        <div className="mb-10">

          <h2 className="text-xl font-semibold mb-6">Create New User</h2>

          <div className="grid md:grid-cols-2 gap-6">

            <FloatingInput
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              theme={theme}
            />

            <FloatingInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              theme={theme}
            />

            <div>

              <FloatingInput
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                theme={theme}
              />

              {passwordStrength && (
                <span className={`text-xs ${
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

          </div>

          {/* ROLE */}

          <div className="mt-6">

            <label className="block text-sm mb-2">Select Role</label>

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={`px-4 py-3 rounded-xl border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            >

              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN">Super Admin</option>
              <option value="VIEWER">Viewer</option>

            </select>

          </div>

          {/* ASSIGN SITES */}

          {form.role === "VIEWER" && (

            <div className="mt-6">

              <label className="block text-sm mb-2">
                Assign Websites
              </label>

              <div className="border rounded-xl p-3 max-h-40 overflow-y-auto">

                {availableSites.length === 0 && (
                  <p className="text-xs opacity-60">
                    No sites available
                  </p>
                )}

                {availableSites.map((site) => (

                  <label
                    key={site._id}
                    className="flex items-center gap-2 text-sm mb-1"
                  >

                    <input
                      type="checkbox"
                      checked={assignedSites.includes(site._id)}
                      onChange={(e) => {

                        if (e.target.checked) {

                          setAssignedSites([
                            ...assignedSites,
                            site._id,
                          ]);

                        } else {

                          setAssignedSites(
                            assignedSites.filter(
                              (id) => id !== site._id
                            )
                          );

                        }
                      }}
                    />

                    {site.domain || site.url || site.name}

                  </label>

                ))}

              </div>

            </div>

          )}

          <div className="flex justify-end mt-8">

            <button
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl text-white bg-indigo-600"
            >
              Create User
            </button>

          </div>

        </div>

        {/* USERS TABLE */}

        <div>

          <h2 className="text-xl font-semibold mb-6">Manage Users</h2>

          <div className="overflow-x-auto border rounded-2xl">

            <table className="w-full text-sm">

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
                    <td colSpan="4" className="text-center p-6">
                      No users found
                    </td>
                  </tr>

                ) : (

                  users.map((user) => (

                    <tr key={user._id} className="border-b">

                      <td className="p-4 font-medium">
                        {user.name}
                      </td>

                      <td className="p-4">
                        {user.email}
                      </td>

                      <td className="p-4">
                        {user.role}
                      </td>

                      <td className="p-4 text-right space-x-2">

                        <button
                          onClick={() => {
                            setEditUser(user);
                            setNewPassword("");
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(user._id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs"
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

        </div>

        {/* PASSWORD MODAL */}

        {editUser && (

          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

            <div className={`p-6 rounded-xl ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}>

              <h3 className="mb-4">
                Update Password for {editUser.name}
              </h3>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                className="border px-3 py-2 rounded-lg w-full mb-4"
              />

              <div className="flex gap-3 justify-end">

                <button
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpdatePassword}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
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

/* ================= FLOATING INPUT ================= */

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

  const inputType =
    type === "password"
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
        className={`peer w-full px-3 pt-5 pb-2 rounded-lg border ${
          isDark
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-300"
        }`}
      />

      <label className="absolute left-3 top-2 text-xs opacity-60">
        {label}
      </label>

      {type === "password" && (

        <button
          type="button"
          onClick={() =>
            setShowPassword(!showPassword)
          }
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >

          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}

        </button>

      )}

    </div>
  );
};

export default SuperAdmin;