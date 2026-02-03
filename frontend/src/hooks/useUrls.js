import { useState } from "react";
import { isValidUrl } from "../utils/validators";

export const useUrls = () => {
  const [urls, setUrls] = useState([]);
  const [urlError, setUrlError] = useState("");

  const addUrl = ({ domain, url }) => {
    if (!domain.trim() || !url.trim()) {
      setUrlError("Domain and URL are required");
      return false;
    }

    if (!isValidUrl(url)) {
      setUrlError("Invalid URL (https://example.com)");
      return false;
    }

    setUrls((prev) => [
      ...prev,
      {
        id: Date.now(),
        domain: domain.trim(),
        url: url.trim(),
        status: Math.random() > 0.5 ? "UP" : "DOWN",
        pinned: false,
        upTime: Math.floor(Math.random() * 1000),
        downTime: Math.floor(Math.random() * 500),
      },
    ]);

    setUrlError("");
    return true;
  };

  const deleteUrl = (id) =>
    setUrls((prev) => prev.filter((u) => u.id !== id));

  const togglePin = (id) =>
    setUrls((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, pinned: !u.pinned } : u
      )
    );

  const editUrl = (id, domain, url) => {
    if (!isValidUrl(url)) {
      setUrlError("Invalid URL");
      return false;
    }

    setUrls((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, domain, url } : u
      )
    );

    setUrlError("");
    return true;
  };

  return {
    urls,
    urlError,
    addUrl,
    deleteUrl,
    togglePin,
    editUrl,
  };
};
