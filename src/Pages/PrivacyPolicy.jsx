import React from "react";
import {
  CheckCircle,
  Database,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import Header from "../components/CiisNavbar";
import Footer from "../components/CiisFooter";
import "./PrivacyPolicy.css";

const policySections = [
  {
    title: "Information We Collect",
    icon: Database,
    points: [
      "Company, employee, client, and account information shared during registration or platform use.",
      "Contact details such as name, phone number, email address, and office address.",
      "Operational data including attendance, tasks, leaves, assets, meetings, support requests, and system activity.",
      "Technical information such as browser type, device details, IP address, and usage logs for security and analytics.",
    ],
  },
  {
    title: "How We Use Information",
    icon: UserCheck,
    points: [
      "To provide, maintain, and improve CIIS Network products and services.",
      "To create accounts, manage access, process requests, and support business workflows.",
      "To send important service updates, support responses, reminders, and administrative messages.",
      "To protect the platform from misuse, fraud, unauthorized access, and technical issues.",
    ],
  },
  {
    title: "Data Sharing",
    icon: FileText,
    points: [
      "We do not sell personal information.",
      "Information may be shared with trusted service providers only when needed to operate our services.",
      "Information may be disclosed when required by law, regulation, legal process, or enforceable government request.",
      "Company administrators may access user information according to their assigned permissions.",
    ],
  },
  {
    title: "Security Measures",
    icon: Lock,
    points: [
      "We use role-based access controls to limit access to sensitive information.",
      "We apply reasonable technical and organizational safeguards to protect stored data.",
      "We monitor platform activity to identify suspicious behavior and improve reliability.",
      "No online system is completely risk-free, so users should keep login details confidential.",
    ],
  },
];

const quickPoints = [
  "Transparent data handling",
  "Role-based access",
  "No sale of personal data",
  "Support for data requests",
];

const PrivacyPolicy = () => {
  return (
    <>
      <Header />

      <main className="privacy-page">
        <section className="privacy-hero">
          <div className="privacy-shell privacy-hero-grid">
            <div className="privacy-hero-copy">
              <span className="privacy-eyebrow">
                <ShieldCheck size={16} />
                Privacy Policy
              </span>
              <h1>How CIIS Network protects and uses your information</h1>
              <p>
                This Privacy Policy explains what information we collect, how we use it, and the choices available to users and companies using CIIS Network services.
              </p>
              <div className="privacy-updated">
                <strong>Last updated:</strong> June 6, 2026
              </div>
            </div>

            <div className="privacy-summary-card">
              <ShieldCheck className="privacy-summary-icon" />
              <h2>Privacy at a glance</h2>
              <ul>
                {quickPoints.map((point) => (
                  <li key={point}>
                    <CheckCircle />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="privacy-content privacy-shell">
          <div className="privacy-intro">
            <h2>Our commitment</h2>
            <p>
              CIIS Network is committed to handling business and personal information responsibly. We collect only the information needed to deliver workforce, HR, client, and company management services, and we use it in line with this policy.
            </p>
          </div>

          <div className="privacy-section-grid">
            {policySections.map(({ title, icon: Icon, points }) => (
              <article className="privacy-policy-card" key={title}>
                <div className="privacy-card-heading">
                  <span>
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                </div>
                <ul>
                  {points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <section className="privacy-detail-panel">
            <h2>Your choices and rights</h2>
            <p>
              You may request access, correction, update, or deletion of your personal information, subject to applicable laws, contractual obligations, and legitimate business requirements. Company-managed accounts may need to route certain requests through the relevant company administrator.
            </p>
            <p>
              We retain information only for as long as necessary to provide services, comply with legal requirements, resolve disputes, enforce agreements, and maintain platform security.
            </p>
          </section>

          <section className="privacy-contact-panel">
            <div>
              <h2>Contact us</h2>
              <p>
                For privacy questions, data requests, or policy concerns, contact the CIIS Network team.
              </p>
            </div>
            <div className="privacy-contact-list">
              <span>
                <Mail />
                info@ciisnetwork.com
              </span>
              <span>
                <Phone />
                +91 99922 29755
              </span>
              <span>
                <MapPin />
                5th Floor, C210 8B, Sector-74, Mohali, Punjab, India
              </span>
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default PrivacyPolicy;
