import React from "react";

const regions = ["India", "USA", "Germany", "UK", "Singapore"];

const RegionSelector = ({ selectedRegions, setSelectedRegions }) => {
  const toggleRegion = (region) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-medium text-sm">Monitor From Regions</label>
      <div className="grid grid-cols-2 gap-2">
        {regions.map((region) => (
          <button
            key={region}
            type="button"
            onClick={() => toggleRegion(region)}
            className={`p-2 rounded-lg border text-sm 
              ${selectedRegions.includes(region)
                ? "bg-green-600 text-white"
                : "bg-white/10 border-gray-300"}`}
          >
            {region}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RegionSelector;
