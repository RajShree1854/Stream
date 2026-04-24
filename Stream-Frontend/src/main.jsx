import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NextUIProvider } from "@nextui-org/system";
import { HelmetProvider } from "react-helmet-async";

import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <NextUIProvider>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </NextUIProvider>
  </StrictMode>
);
