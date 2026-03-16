"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.hostname !== "localhost") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("AetherRise SW Registered:", reg.scope))
          .catch((err) => console.log("SW Registration Failed:", err));
      });
    }
  }, []);

  return null; // This component doesn't render anything UI-wise
}