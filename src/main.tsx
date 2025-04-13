import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Layout from "./Layout";
import { ThemeProvider } from "./components/theme-provider";
// Os providers de Navigation, Config e Ghost não são mais necessários, pois foram substituídos por Zustand

// Inicializa as lojas Zustand (isso fará com que o estado seja carregado antes da renderização)
import "@/stores/config-store";
import "@/stores/navigation-store";
import "@/stores/ghost-store";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <Layout>
        <App />
      </Layout>
    </ThemeProvider>
  </React.StrictMode>
);
