import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Layout from "./Layout";
import { NavigationProvider } from "./contexts/navigation-context";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NavigationProvider>
      <Layout>
        <App />
      </Layout>
    </NavigationProvider>
  </React.StrictMode>
);
