import React from "react";
import { useNavigate } from "react-router-dom";
import RegionsComponent from "../components/RegionsComponent";

const Regions = ({ theme }) => {
  const navigate = useNavigate();

  const handleRegionClick = (regionName) => {
    navigate(`/region/${encodeURIComponent(regionName)}`);
  };

  return <RegionsComponent onRegionClick={handleRegionClick} theme={theme} />;
};

export default Regions;