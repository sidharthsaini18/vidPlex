import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Ambient } from "../background/Ambient";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const target = document.getElementById(id);
      if (target) {
        const timer = window.setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        return () => window.clearTimeout(timer);
      }
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  return null;
}

export function Layout() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <div className="relative min-h-screen">
      <Ambient />
      <ScrollManager />
      <Navbar />
      <main className={isDashboard ? "relative z-10 pt-[84px]" : "relative z-10 pt-[92px]"}>
        <Outlet />
      </main>
      {!isDashboard && <Footer />}
      <Toaster
        position="bottom-right"
        gutter={10}
        containerStyle={{ zIndex: 200 }}
        toastOptions={{
          duration: 4200,
          style: {
            background: "rgba(9, 15, 32, 0.96)",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            padding: "12px 14px",
            fontSize: "13px",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,.9)",
            backdropFilter: "blur(16px)",
          },
          success: { iconTheme: { primary: "#34d399", secondary: "#020617" } },
          error: { iconTheme: { primary: "#fb7185", secondary: "#020617" } },
        }}
      />
    </div>
  );
}
