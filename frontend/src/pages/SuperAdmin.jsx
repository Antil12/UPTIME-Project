import React, { useState, useEffect } from "react";
import axios from "axios";
import SuperAdminUI from "../components/SuperAdminUI";

const SuperAdmin = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "USER",
    alertRole: null,
    alertCategories: [],
  });

  const [users, setUsers] = useState([]);
  const [availableSites, setAvailableSites] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [assignedSites, setAssignedSites] = useState([]);
  const [assignedCategories, setAssignedCategories] = useState([]);

  const [editUser, setEditUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    alertRole: null,
    alertCategories: [],
  });
  const [editAssignedSites, setEditAssignedSites] = useState([]);
  const [editAssignedCategories, setEditAssignedCategories] = useState([]);

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

      // Normalise every user so assignedCategories is always a plain string[]
      const normalised = (res.data.users || []).map((u) => ({
        ...u,
        assignedCategories: Array.isArray(u.assignedCategories)
          ? u.assignedCategories.filter(Boolean)
          : [],
      }));

      setUsers(normalised);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  /* ================= FETCH SITES ================= */
  const fetchSites = async () => {
    try {
      const token = localStorage.getItem("loginToken");

      const res = await axios.get(`${API_URL}/monitoredsite?noPagination=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let sites = [];
      if (Array.isArray(res.data)) sites = res.data;
      else if (Array.isArray(res.data.data)) sites = res.data.data;
      else if (Array.isArray(res.data.sites)) sites = res.data.sites;
      else if (Array.isArray(res.data.data?.sites)) sites = res.data.data.sites;

      setAvailableSites(sites);

      // Derive unique categories from sites (exclude null/undefined/ALL/UNCATEGORIZED)
      const cats = [
        ...new Set(
          sites
            .map((s) => s.category)
            .filter((c) => c && c !== "ALL" && c !== "UNCATEGORIZED")
        ),
      ].sort();
      setAvailableCategories(cats);
    } catch (err) {
      console.error("Failed to fetch sites", err);
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchUsers();
    fetchSites();
  }, []);

  /* ================= OPEN EDIT MODAL ================= */
  const openEditModal = (user) => {
    // ── Assigned categories ──────────────────────────────────────────────────
    // Pull from the normalised user object (always a string[]).
    // Fall back to deriving them from assigned sites so that users created
    // before the category field existed still show the correct chips.
    let cats = Array.isArray(user.assignedCategories)
      ? user.assignedCategories.filter(Boolean)
      : [];

    if (cats.length === 0 && Array.isArray(user.assignedSites) && user.assignedSites.length > 0) {
      // Derive from the sites that are currently assigned to this user
      const siteIds = user.assignedSites.map((s) =>
        typeof s === "object" ? s._id.toString() : s.toString()
      );
      const derived = [
        ...new Set(
          availableSites
            .filter((s) => siteIds.includes(s._id.toString()) && s.category)
            .map((s) => s.category)
            .filter((c) => c && c !== "ALL" && c !== "UNCATEGORIZED")
        ),
      ];
      cats = derived;
    }

    // ── Assigned site IDs ────────────────────────────────────────────────────
    const siteIds = (user.assignedSites || []).map((site) =>
      typeof site === "object" ? site._id.toString() : site.toString()
    );

    setEditUser(user);
    setNewPassword("");
    setEditForm({
      name:  user.name  || "",
      email: user.email || "",
      role:  user.role  || "USER",
      alertRole:        user.alertRole || null,
      alertCategories:  user.alertCategories || [],
    });
    setEditAssignedSites(siteIds);
    setEditAssignedCategories(cats);
  };

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
          name:               form.username,
          email:              form.email,
          password:           form.password,
          role:               form.role,
          assignedSites:      form.role !== "SUPERADMIN" ? assignedSites      : [],
          assignedCategories: form.role !== "SUPERADMIN" ? assignedCategories : [],
          alertRole:          form.alertRole || null,
          alertCategories:    form.alertCategories || [],
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

      // Re-fetch so the new user has fully-populated assignedSites + assignedCategories
      await fetchUsers();

      alert("User created successfully");

      setForm({ username: "", password: "", email: "", role: "USER", alertRole: null, alertCategories: [] });
      setAssignedSites([]);
      setAssignedCategories([]);
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
        typeof site === "object" ? site._id.toString() : site.toString()
      );

      const newSites     = (editAssignedSites  || []).map((id) => id.toString());
      const removedSites = oldSites.filter((id) => !newSites.includes(id));
      const addedSites   = newSites.filter((id) => !oldSites.includes(id));

      await axios.put(
        `${API_URL}/user/${editUser._id}`,
        {
          name:               editForm.name,
          email:              editForm.email,
          role:               editForm.role,
          assignedSites:      editForm.role !== "SUPERADMIN" ? newSites               : [],
          assignedCategories: editForm.role !== "SUPERADMIN" ? editAssignedCategories : [],
          alertRole:          editForm.alertRole || null,
          alertCategories:    editForm.alertCategories || [],
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
          { userId: editUser._id, action: "unassign" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      for (const siteId of addedSites) {
        await axios.patch(
          `${API_URL}/monitoredsite/${siteId}/assign`,
          { userId: editUser._id, action: "assign" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert("User updated successfully");

      // Re-fetch fresh data, then close modal
      await fetchUsers();
      setEditUser(null);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("Failed to update user");
    }
  };

  return (
    <SuperAdminUI
      form={form}
      handleChange={handleChange}
      passwordStrength={passwordStrength}
      assignedSites={assignedSites}
      setAssignedSites={setAssignedSites}
      assignedCategories={assignedCategories}
      setAssignedCategories={setAssignedCategories}
      availableSites={availableSites}
      availableCategories={availableCategories}
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
      editAssignedCategories={editAssignedCategories}
      setEditAssignedCategories={setEditAssignedCategories}
      handleUpdateUser={handleUpdateUser}
      openEditModal={openEditModal}
    />
  );
};

export default SuperAdmin;