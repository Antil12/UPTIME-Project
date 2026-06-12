import axios from "axios";

// Get all notification groups for current user
export const getUserNotificationGroups = async () => {
  try {
    const response = await axios.get("/notification-groups/my-groups");
    return response.data;
  } catch (error) {
    console.error("Error fetching notification groups:", error);
    throw error;
  }
};

// Create a new notification group
export const createNotificationGroup = async (groupData) => {
  try {
    const response = await axios.post("/notification-groups", groupData);
    return response.data;
  } catch (error) {
    console.error("Error creating notification group:", error);
    throw error;
  }
};

// Update a notification group
export const updateNotificationGroup = async (id, groupData) => {
  try {
    const response = await axios.put(`/notification-groups/${id}`, groupData);
    return response.data;
  } catch (error) {
    console.error("Error updating notification group:", error);
    throw error;
  }
};

// Delete a notification group
export const deleteNotificationGroup = async (id) => {
  try {
    const response = await axios.delete(`/notification-groups/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting notification group:", error);
    throw error;
  }
};

// Get a single notification group
export const getNotificationGroup = async (id) => {
  try {
    const response = await axios.get(`/notification-groups/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching notification group:", error);
    throw error;
  }
};
