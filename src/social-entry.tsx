import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import { SocialKit } from "./social/SocialKit";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root mount element.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <SocialKit />
  </React.StrictMode>
);
