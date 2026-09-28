import React from "react";
import { Link } from "react-router-dom";

// Internal paths ("/pricing", "/#faq", "/login") use React Router; in-page (#demo) and external links stay plain anchors.
export default function MkLink({ href = "", children, ...rest }) {
  const h = String(href || "");
  if (h.startsWith("/") && !h.startsWith("//")) {
    return (
      <Link to={h} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={h || undefined} {...rest}>
      {children}
    </a>
  );
}
