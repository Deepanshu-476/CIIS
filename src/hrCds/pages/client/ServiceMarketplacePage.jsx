import React, { useState } from "react";
import {
  FiAward,
  FiBell,
  FiCheck,
  FiChevronDown,
  FiCode,
  FiCreditCard,
  FiEdit3,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiHeadphones,
  FiMail,
  FiMessageCircle,
  FiPackage,
  FiPhone,
  FiSearch,
  FiSend,
  FiShield,
  FiShoppingCart,
  FiSmartphone,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiVideo,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaAmazon, FaFacebookF, FaGoogle, FaWhatsapp } from "react-icons/fa";
import "./ServiceMarketplacePage.css";

const rupee = "\u20b9";

const categories = [
  "All Services",
  "Digital Marketing",
  "Website & App Development",
  "E-commerce Growth",
  "Creative & Branding",
  "Software",
  "Content",
];

const recommendedServices = [
  {
    title: "WhatsApp Marketing",
    tag: "Recommended",
    copy: "Automate offers, reminders and customer follow-ups.",
    icon: <FaWhatsapp />,
    tone: "green",
    action: "Discuss Now",
  },
  {
    title: "Google Ads",
    tag: "Popular",
    copy: "Generate high-intent leads from search ads.",
    icon: <FaGoogle />,
    tone: "blue",
    action: "Get Proposal",
  },
  {
    title: "Website Maintenance",
    tag: "Essential",
    copy: "Keep your website secure, fast and updated.",
    icon: <FiShield />,
    tone: "purple",
    action: "Discuss Now",
  },
  {
    title: "Social Media Marketing",
    tag: "Popular",
    copy: "Grow your brand on Instagram and Facebook.",
    icon: <FaFacebookF />,
    tone: "pink",
    action: "Get Proposal",
  },
  {
    title: "Lead Generation",
    tag: "Recommended",
    copy: "Get quality business leads every month.",
    icon: <FiTarget />,
    tone: "green",
    action: "Discuss Now",
  },
];

const services = [
  { title: "SEO", tag: "Popular", copy: "Improve rankings and organic traffic.", icon: <FiTrendingUp />, tone: "green", category: "Digital Marketing", action: "Get Proposal" },
  { title: "Google Ads Management", tag: "Popular", copy: "Drive qualified leads with search ads.", icon: <FaGoogle />, tone: "blue", category: "Digital Marketing", action: "Get Proposal" },
  { title: "Meta Ads", tag: "Popular", copy: "Reach more customers on Facebook & Instagram.", icon: <FiTarget />, tone: "blue", category: "Digital Marketing", action: "Get Proposal" },
  { title: "Social Media Marketing", tag: "Popular", copy: "Grow your brand on social platforms.", icon: <FaFacebookF />, tone: "pink", category: "Digital Marketing", action: "Get Proposal" },
  { title: "Content Marketing", tag: "New", copy: "Create content that attracts and converts.", icon: <FiEdit3 />, tone: "orange", category: "Content", action: "Get Proposal" },
  { title: "Lead Generation", tag: "Recommended", copy: "Get quality business leads every month.", icon: <FiTarget />, tone: "green", category: "Digital Marketing", action: "Discuss Now" },
  { title: "Website Development", tag: "Popular", copy: "Build fast, responsive business websites.", icon: <FiCode />, tone: "blue", category: "Website & App Development", action: "Get Proposal" },
  { title: "E-commerce Website Development", tag: "Popular", copy: "Sell more with powerful e-commerce stores.", icon: <FiShoppingCart />, tone: "blue", category: "E-commerce Growth", action: "Get Proposal" },
  { title: "Mobile App Development", tag: "New", copy: "iOS & Android apps for your business.", icon: <FiSmartphone />, tone: "slate", category: "Website & App Development", action: "Get Proposal" },
  { title: "Website Maintenance", tag: "Essential", copy: "Keep your website secure and up to date.", icon: <FiShield />, tone: "purple", category: "Website & App Development", action: "Discuss Now" },
  { title: "UI/UX Design", tag: "New", copy: "Beautiful, user-friendly designs that engage.", icon: <FiGrid />, tone: "slate", category: "Creative & Branding", action: "Discuss Now" },
  { title: "Amazon Account Management", tag: "Popular", copy: "Manage and grow your Amazon business.", icon: <FaAmazon />, tone: "orange", category: "E-commerce Growth", action: "Get Proposal" },
  { title: "Flipkart Account Management", tag: "Popular", copy: "Boost sales on Flipkart marketplace.", icon: <FiZap />, tone: "yellow", category: "E-commerce Growth", action: "Get Proposal" },
  { title: "Product Listing & Optimization", tag: "Optimization", copy: "Optimized listings that increase conversions.", icon: <FiPackage />, tone: "orange", category: "E-commerce Growth", action: "Discuss Now" },
  { title: "Store Optimization", tag: "Optimization", copy: "Improve store performance and customer experience.", icon: <FiShoppingCart />, tone: "pink", category: "E-commerce Growth", action: "Discuss Now" },
  { title: "Inventory Support", tag: "New", copy: "Manage inventory and avoid stockouts.", icon: <FiPackage />, tone: "orange", category: "Software", action: "Discuss Now" },
  { title: "Graphic Design", tag: "Design", copy: "Creative designs that represent your brand.", icon: <FiEdit3 />, tone: "purple", category: "Creative & Branding", action: "Discuss Now" },
  { title: "Logo Design", tag: "Design", copy: "Unique logos that make your brand stand out.", icon: <FiAward />, tone: "blue", category: "Creative & Branding", action: "Discuss Now" },
  { title: "Video Editing", tag: "Popular", copy: "Professional videos that tell your story.", icon: <FiVideo />, tone: "purple", category: "Content", action: "Discuss Now" },
  { title: "Reels / Shorts", tag: "New", copy: "Short videos that grab attention and engage.", icon: <FiVideo />, tone: "blue", category: "Content", action: "Discuss Now" },
  { title: "Brand Identity", tag: "Popular", copy: "Build a strong identity for your brand.", icon: <FiAward />, tone: "purple", category: "Creative & Branding", action: "Discuss Now" },
  { title: "Brand Identity", tag: "New", copy: "Build a strong identity for your brand.", icon: <FiAward />, tone: "green", category: "Creative & Branding", action: "Discuss Now" },
  { title: "Company Profile Design", tag: "New", copy: "Professional profiles that build trust.", icon: <FiFileText />, tone: "blue", category: "Creative & Branding", action: "Discuss Now" },
  { title: "CRM Software", tag: "Popular", copy: "Manage customers and improve relationships.", icon: <FiUsers />, tone: "blue", category: "Software", action: "Get Proposal" },
  { title: "ERP Software", tag: "Popular", copy: "Streamline operations with ERP solutions.", icon: <FiGrid />, tone: "blue", category: "Software", action: "Get Proposal" },
  { title: "Custom Dashboard", tag: "New", copy: "Real-time dashboards for better decision-making.", icon: <FiGlobe />, tone: "blue", category: "Software", action: "Get Proposal" },
  { title: "WhatsApp Automation", tag: "Popular", copy: "Automate chats, replies and notifications.", icon: <FaWhatsapp />, tone: "green", category: "Software", action: "Get Proposal" },
  { title: "Email Automation", tag: "New", copy: "Automate emails and nurture leads.", icon: <FiMail />, tone: "blue", category: "Software", action: "Get Proposal" },
  { title: "Lead Management System", tag: "Recommended", copy: "Track and manage leads from one place.", icon: <FiTarget />, tone: "blue", category: "Software", action: "Get Proposal" },
];

const enquiries = [
  { service: "WhatsApp Marketing", id: "ENQ-2026-018", status: "Open" },
  { service: "Google Ads", id: "ENQ-2026-017", status: "Proposal Sent" },
  { service: "Website Development", id: "ENQ-2026-015", status: "Contacted" },
  { service: "SEO", id: "ENQ-2026-014", status: "Converted" },
];

const ServiceMarketplacePage = () => {
  const [activeCategory, setActiveCategory] = useState("All Services");
  const [openModal, setOpenModal] = useState(true);
  const [selectedService, setSelectedService] = useState("WhatsApp Marketing");
  const [formValues, setFormValues] = useState({
    requirement:
      "We want to automate customer follow-ups on WhatsApp including offers, order updates and payment reminders. Please share the process and pricing.",
    budget: `${rupee}20,000 - ${rupee}30,000`,
    contact: "WhatsApp",
  });

  const visibleServices = services.filter((service) => activeCategory === "All Services" || service.category === activeCategory);

  const openEnquiry = (serviceTitle) => {
    setSelectedService(serviceTitle);
    setOpenModal(true);
  };

  return (
    <section className="ServiceMarketplacePage-root">
      <header className="ServiceMarketplacePage-header">
        <div className="ServiceMarketplacePage-title">
          <h1>Explore Services</h1>
          <p>Discover more services to grow your business with CIIS Network.</p>
        </div>
        <div className="ServiceMarketplacePage-headerActions">
          <label className="ServiceMarketplacePage-search">
            <FiSearch />
            <input type="search" placeholder="Search services..." />
            <FiTarget />
          </label>
          <button type="button" className="ServiceMarketplacePage-selectButton">
            All Categories
            <FiChevronDown />
          </button>
          <button type="button" className="ServiceMarketplacePage-primaryButton">Discuss with Manager</button>
          <button type="button" className="ServiceMarketplacePage-notificationButton" aria-label="Notifications">
            <FiBell />
            <span>4</span>
          </button>
          <button type="button" className="ServiceMarketplacePage-userButton">
            <span><FiUser /></span>
            <strong>Test123</strong>
            <FiChevronDown />
          </button>
        </div>
      </header>

      <div className="ServiceMarketplacePage-layout">
        <main className="ServiceMarketplacePage-main">
          <section className="ServiceMarketplacePage-panel ServiceMarketplacePage-recommendedPanel">
            <div className="ServiceMarketplacePage-panelTitle">
              <h2>Recommended For You</h2>
              <span>Based on your current services</span>
            </div>
            <p>These services can help you get more leads, sales and growth.</p>
            <div className="ServiceMarketplacePage-recommendedGrid">
              {recommendedServices.map((service) => (
                <article className="ServiceMarketplacePage-serviceCard ServiceMarketplacePage-featureCard" key={service.title}>
                  <div className={`ServiceMarketplacePage-cardIcon ServiceMarketplacePage-${service.tone}`}>{service.icon}</div>
                  <div className="ServiceMarketplacePage-cardContent">
                    <h3>{service.title}</h3>
                    <span>{service.tag}</span>
                    <p>{service.copy}</p>
                  </div>
                  <button type="button" onClick={() => openEnquiry(service.title)}>{service.action}</button>
                </article>
              ))}
            </div>
          </section>

          <section className="ServiceMarketplacePage-panel ServiceMarketplacePage-servicesPanel">
            <div className="ServiceMarketplacePage-sectionHeader">
              <div>
                <h2>All Services</h2>
                <p>Browse our complete range of services across different categories.</p>
              </div>
            </div>
            <div className="ServiceMarketplacePage-tabs">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="ServiceMarketplacePage-servicesGrid">
              {visibleServices.map((service) => (
                <article className="ServiceMarketplacePage-serviceCard" key={`${service.title}-${service.category}-${service.tone}`}>
                  <div className={`ServiceMarketplacePage-cardIcon ServiceMarketplacePage-${service.tone}`}>{service.icon}</div>
                  <div className="ServiceMarketplacePage-cardContent">
                    <h3>{service.title}</h3>
                    <span>{service.tag}</span>
                    <p>{service.copy}</p>
                  </div>
                  <button type="button" onClick={() => openEnquiry(service.title)}>{service.action}</button>
                </article>
              ))}
            </div>
            <button type="button" className="ServiceMarketplacePage-moreButton">View More Services</button>
          </section>
        </main>

        <aside className="ServiceMarketplacePage-sidebar">
          <section className="ServiceMarketplacePage-sidePanel ServiceMarketplacePage-managerPanel">
            <h2>Need help choosing the right service?</h2>
            <p>Our experts are here to help you find the best solutions for your business.</p>
            <div className="ServiceMarketplacePage-manager">
              <div className="ServiceMarketplacePage-managerPhoto">RS</div>
              <div>
                <strong>Rahul Sharma</strong>
                <span>Account Manager</span>
              </div>
            </div>
            <a href="mailto:rahul.sharma@ciisnetwork.com"><FiMail /> rahul.sharma@ciisnetwork.com</a>
            <a href="tel:+9191876543210"><FiPhone /> +91 98765 43210</a>
            <button type="button" className="ServiceMarketplacePage-primaryButton">Discuss with Rahul</button>
          </section>

          <section className="ServiceMarketplacePage-sidePanel">
            <h2>Why Choose CIIS Network?</h2>
            <ul className="ServiceMarketplacePage-checkList">
              <li><FiCheck />10+ Years Experience</li>
              <li><FiCheck />Result Driven Approach</li>
              <li><FiCheck />Dedicated Support</li>
              <li><FiCheck />Transparent Process</li>
              <li><FiCheck />Affordable Pricing</li>
            </ul>
          </section>

          <section className="ServiceMarketplacePage-sidePanel ServiceMarketplacePage-customPanel">
            <h2>Have a custom requirement?</h2>
            <p>Tell us what you need. We'll create a solution tailored for your business.</p>
            <button type="button"><FiSend /> Share Requirement</button>
          </section>

          <section className="ServiceMarketplacePage-sidePanel ServiceMarketplacePage-enquiriesPanel">
            <h2>My Service Enquiries</h2>
            <div className="ServiceMarketplacePage-enquiryHeader">
              <span>Service</span>
              <span>Enquiry ID</span>
              <span>Status</span>
            </div>
            {enquiries.map((enquiry) => (
              <div className="ServiceMarketplacePage-enquiryRow" key={enquiry.id}>
                <strong>{enquiry.service}</strong>
                <span>{enquiry.id}</span>
                <em className={`ServiceMarketplacePage-status ServiceMarketplacePage-status-${enquiry.status.toLowerCase().replace(" ", "-")}`}>
                  {enquiry.status}
                </em>
              </div>
            ))}
            <a href="/client/marketplace">View All Enquiries</a>
          </section>
        </aside>
      </div>

      {openModal && (
        <div className="ServiceMarketplacePage-modalLayer">
          <section className="ServiceMarketplacePage-modal" role="dialog" aria-modal="true" aria-labelledby="service-enquiry-title">
            <header>
              <h2 id="service-enquiry-title">Service Enquiry</h2>
              <button type="button" aria-label="Close" onClick={() => setOpenModal(false)}>
                <FiX />
              </button>
            </header>
            <label>
              <span>Selected Service</span>
              <input type="text" value={selectedService} readOnly />
            </label>
            <label>
              <span>Requirement</span>
              <textarea
                value={formValues.requirement}
                onChange={(event) => setFormValues({ ...formValues, requirement: event.target.value })}
              />
            </label>
            <label>
              <span>Budget (optional)</span>
              <input
                type="text"
                value={formValues.budget}
                onChange={(event) => setFormValues({ ...formValues, budget: event.target.value })}
                placeholder={`e.g., ${rupee}20,000 - ${rupee}30,000`}
              />
            </label>
            <div className="ServiceMarketplacePage-contactGroup">
              <span>Preferred Contact Method</span>
              <div>
                {[
                  ["Phone", <FiPhone />],
                  ["Email", <FiMail />],
                  ["WhatsApp", <FaWhatsapp />],
                ].map(([label, icon]) => (
                  <button
                    type="button"
                    key={label}
                    className={formValues.contact === label ? "active" : ""}
                    onClick={() => setFormValues({ ...formValues, contact: label })}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="ServiceMarketplacePage-submitButton">Submit Enquiry</button>
          </section>
        </div>
      )}
    </section>
  );
};

export default ServiceMarketplacePage;
