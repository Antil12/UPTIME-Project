import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import RegionPageUI from "../components/RegionPageUI";

const Region = ({ theme }) => {
  const { region } = useParams();
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const decodedRegion = decodeURIComponent(region || "");

  const fetchSites = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("loginToken");
      
      // Check if user is authenticated
      if (!token) {
        setError("Please log in to view regions");
        navigate("/login");
        return;
      }

      const res = await axios.get(
        `/monitoredsite/regions/${encodeURIComponent(decodedRegion)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSites(res.data?.data || []);
      console.log("✅ Sites refreshed with updated status");
    } catch (err) {
      console.error("Failed to fetch region sites:", err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("loginToken");
        localStorage.removeItem("user");
        setTimeout(() => navigate("/login"), 1500);
      } else if (err.response?.status === 404) {
        setError("Region not found");
      } else {
        setError(err.response?.data?.message || "Failed to fetch sites");
      }
      
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (decodedRegion) {
      fetchSites();
    }
  }, [decodedRegion]);

  return (
    <RegionPageUI
      decodedRegion={decodedRegion}
      sites={sites}
      loading={loading}
      error={error}
      onBack={() => navigate("/regions")}
      onRefreshSites={fetchSites}
      theme={theme}
    />
  );
};

export default Region;