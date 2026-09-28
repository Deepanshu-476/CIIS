import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "../styles/marketing.css";
import "../styles/marketing-interactions.css";

function scrollToHash(hash) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const el = id && document.getElementById(id);
  if (!el) return false;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
  return true;
}

// Restores scroll position on route change and scrolls to "#section" after cross-page links like "/#faq".
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    let tries = 0;
    const t = setInterval(() => {
      if (scrollToHash(hash) || ++tries > 20) clearInterval(t);
    }, 50);
    return () => clearInterval(t);
  }, [pathname, hash]);
  return null;
}

export function MarketingPage({ title, children }) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · CIIS Network` : "CIIS Network";
    return () => {
      document.title = prev;
    };
  }, [title]);
  return children;
}

export default function MarketingLayout() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = prev;
    };
  }, []);
  return (
    <div className="ciis-mk">
      <ScrollManager />
      <Outlet />
    </div>
  );
}
