import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./aquarium.css";
import Aquarium from "./Aquarium.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Aquarium />
  </StrictMode>
);
