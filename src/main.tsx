import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Layout from "./Layout";
import { NavigationProvider } from "./contexts/navigation-context";
import { ConfigProvider } from "./contexts/config-context";
import { GhostProvider } from "./contexts/ghost-context";
import { ThemeProvider } from "./components/theme-provider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NavigationProvider>
      <ConfigProvider>
        <GhostProvider>
          <ThemeProvider>
            <Layout>
              <App />
            </Layout>
          </ThemeProvider>
        </GhostProvider>
      </ConfigProvider>
    </NavigationProvider>
  </React.StrictMode>
);
