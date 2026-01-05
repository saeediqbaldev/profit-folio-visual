import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import ShareRouter from "./pages/ShareRouter.tsx";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider defaultTheme="light" storageKey="trading-journal-theme">
      <Routes>
        <Route path="/share/:userId" element={<ShareRouter />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </ThemeProvider>
  </BrowserRouter>
);
