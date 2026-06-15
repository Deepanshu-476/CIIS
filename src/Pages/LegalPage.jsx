import React from "react";
import { CheckCircle, Cookie, FileText, ShieldCheck } from "lucide-react";
import Header from "../components/CiisNavbar";
import Footer from "../components/CiisFooter";
import "./PrivacyPolicy.css";

const pageContent = {
  terms: {
    eyebrow: "Terms of Service",
    title: "Terms for using CIIS Network services",
    description:
      "These terms explain the basic responsibilities for accessing CIIS Network products, websites, and desktop applications.",
    updated: "June 12, 2026",
    icon: FileText,
    points: [
      "Use the platform only for lawful company, HR, client, and workforce management activities.",
      "Keep account credentials secure and do not share access with unauthorized users.",
      "Company administrators are responsible for managing users, roles, permissions, and uploaded business data.",
      "CIIS Network may update services to improve reliability, security, performance, and user experience.",
    ],
  },
  cookies: {
    eyebrow: "Cookie Policy",
    title: "How CIIS Network uses cookies and local storage",
    description:
      "This policy explains how cookies, browser storage, and similar technologies support login, preferences, security, and service performance.",
    updated: "June 12, 2026",
    icon: Cookie,
    points: [
      "Essential storage is used to keep users signed in and maintain secure sessions.",
      "Preferences may be stored to remember interface settings and improve usability.",
      "Technical data may help us understand performance, errors, and reliability issues.",
      "Users can clear browser or app storage, but some features may require signing in again.",
    ],
  },
};

const LegalPage = ({ type = "terms" }) => {
  const content = pageContent[type] || pageContent.terms;
  const Icon = content.icon;

  return (
    <>
      <Header />
      <main className="privacy-page">
        <section className="privacy-hero">
          <div className="privacy-shell privacy-hero-grid">
            <div className="privacy-hero-copy">
              <span className="privacy-eyebrow">
                <Icon size={16} />
                {content.eyebrow}
              </span>
              <h1>{content.title}</h1>
              <p>{content.description}</p>
              <div className="privacy-updated">
                <strong>Last updated:</strong> {content.updated}
              </div>
            </div>

            <div className="privacy-summary-card">
              <ShieldCheck className="privacy-summary-icon" />
              <h2>At a glance</h2>
              <ul>
                {content.points.map((point) => (
                  <li key={point}>
                    <CheckCircle />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default LegalPage;
