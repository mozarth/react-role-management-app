import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeTheme } from "./lib/theme";

// Inicializar el tema antes de renderizar la aplicación
initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
