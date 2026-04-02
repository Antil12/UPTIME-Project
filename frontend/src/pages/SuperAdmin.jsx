import React, { useState, useEffect } from "react";
import axios from "axios";
import SuperAdminUI from "../components/SuperAdminUI";

const SuperAdmin = ({ theme }) => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "USER",
  });

  const [users, setUsers] = useState([]);
  const [availableSites, setAvailableSites] = useState([]);
  const [assignedSites, setAssignedSites] = useState([]);

  const [editUser, setEditUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
  });
  const [editAssignedSites, setEditAssignedSites] = useState([]);

  /* ================= FORM CHANGE ================= */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

      const res = await axios.get(`${API_URL}/user/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  /* ================= FETCH SITES ================= */
  const fetchSites = async () => {
    try {
      const token = localStorage.getItem("loginToken");

      const res = await axios.get(`${API_URL}/monitoredsite`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let sites = [];
      if (Array.isArray(res.data)) sites = res.data;
      else if (Array.isArray(res.data.data)) sites = res.data.data;
      else if (Array.isArray(res.data.sites)) sites = res.data.sites;
      else if (Array.isArray(res.data.data?.sites)) sites = res.data.data.sites;

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
        `${API_URL}/user/create`,
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

      if (form.role !== "SUPERADMIN" && assignedSites.length > 0) {
        for (const siteId of assignedSites) {
          try {
            await axios.patch(
              `${API_URL}/monitoredsite/${siteId}/assign`,
              { userId: createdUser._id, action: "assign" },
              { headers: { Authorization: `Bearer ${token}` } }
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

      await axios.delete(`${API_URL}/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  /* ================= UPDATE USER ================= */
  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem("loginToken");

      const oldSites = (editUser.assignedSites || []).map((site) =>
        site._id.toString()
      );

      const newSites = (editAssignedSites || []).map((id) => id.toString());

      const removedSites = oldSites.filter((id) => !newSites.includes(id));
      const addedSites = newSites.filter((id) => !oldSites.includes(id));

      await axios.put(
        `${API_URL}/user/${editUser._id}`,
        {
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          assignedSites: editForm.role === "VIEWER" ? newSites : [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (newPassword && newPassword.trim() !== "") {
        await axios.put(
          `${API_URL}/user/${editUser._id}/password`,
          { password: newPassword },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      for (const siteId of removedSites) {
        await axios.patch(
          `${API_URL}/monitoredsite/${siteId}/assign`,
          {
            userId: editUser._id,
            action: "unassign",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      for (const siteId of addedSites) {
        await axios.patch(
          `${API_URL}/monitoredsite/${siteId}/assign`,
          {
            userId: editUser._id,
            action: "assign",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      alert("User updated successfully");

      fetchUsers();
      setEditUser(null);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("Failed to update user");
    }
  };

  return (
    <SuperAdminUI
      theme={theme}
      form={form}
      handleChange={handleChange}
      passwordStrength={passwordStrength}
      assignedSites={assignedSites}
      setAssignedSites={setAssignedSites}
      availableSites={availableSites}
      handleSubmit={handleSubmit}
      users={users}
      handleDelete={handleDelete}
      editUser={editUser}
      setEditUser={setEditUser}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      editForm={editForm}
      setEditForm={setEditForm}
      editAssignedSites={editAssignedSites}
      setEditAssignedSites={setEditAssignedSites}
      handleUpdateUser={handleUpdateUser}
    />
  );
};

export default SuperAdmin;