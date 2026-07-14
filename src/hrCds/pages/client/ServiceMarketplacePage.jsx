import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CIISLoader from "../../../Loader/CIISLoader";
import {
  FiAward,
  FiBriefcase,
  FiCode,
  FiEdit3,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiMail,
  FiPackage,
  FiPhone,
  FiShield,
  FiShoppingCart,
  FiSmartphone,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiVideo,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaAmazon, FaFacebookF, FaGoogle, FaWhatsapp } from "react-icons/fa";
import {
  getClientDisplayName,
  getAuthToken,
  formatPublicId,
  useClientPortalData,
} from "../../utils/clientPortalData";
import API_URL from "../../../config";
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

const defaultMarketplaceServices = [
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

const ServiceMarketplacePage = () => {
  const { client, services: clientServices, user, loading } = useClientPortalData();
  const [companyServices, setCompanyServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Services");
  const [showAllServices, setShowAllServices] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(clientServices[0] || "WhatsApp Marketing");
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });
  const [formValues, setFormValues] = useState({
    requirement:
      `We want to improve ${getClientDisplayName(client)} with a service plan. Please share the process and pricing.`,
    budget: `${rupee}20,000 - ${rupee}30,000`,
    contact: "WhatsApp",
  });

  const companyCode = localStorage.getItem("companyCode") || localStorage.getItem("company") || client?.companyCode || "";
  const companyIdentifier = localStorage.getItem("companyIdentifier") || client?.companyIdentifier || "";

  useEffect(() => {
    const fetchCompanyServices = async () => {
      try {
        setServicesLoading(true);
        setServicesError("");

        const response = await axios.get(`${API_URL}/clientsservice/services`, {
          params: {
            companyCode: companyCode || undefined,
            companyIdentifier: companyIdentifier || undefined,
          },
          headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : undefined,
        });

        if (response.data?.success) {
          setCompanyServices(response.data.data || []);
        } else {
          setCompanyServices([]);
          setServicesError(response.data?.message || "No company services found");
        }
      } catch (error) {
        console.error("Error fetching company services for marketplace:", error);
        setCompanyServices([]);
        setServicesError(error.response?.data?.message || "Failed to load company services");
      } finally {
        setServicesLoading(false);
      }
    };

    fetchCompanyServices();
  }, [client?.companyCode, client?.companyIdentifier, companyCode, companyIdentifier]);

  const fetchEnquiries = async () => {
    try {
      setEnquiriesLoading(true);
      const response = await axios.get(`${API_URL}/clientsservice/service-enquiries`, {
        params: {
          companyCode: companyCode || undefined,
          companyIdentifier: companyIdentifier || undefined,
        },
        headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : undefined,
      });
      if (response.data?.success) {
        const allEnquiries = response.data.data || [];
        const currentClientId = String(client?._id || "");
        setEnquiries(currentClientId ? allEnquiries.filter(item => String(item.clientId || "") === currentClientId) : allEnquiries);
      } else {
        setEnquiries([]);
      }
    } catch (error) {
      console.error("Error fetching service enquiries:", error);
      setEnquiries([]);
    } finally {
      setEnquiriesLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [client?._id, companyCode, companyIdentifier]);

  const companyMarketplaceServices = useMemo(() => (
    companyServices.map((service, index) => {
      const title = service.servicename || service.name || service.title || "Company Service";
      return {
        title,
        tag: clientServices.includes(title) ? "Active" : "Available",
        copy: service.description || service.details || `${title} is available from your company service catalog.`,
        icon: [<FiBriefcase />, <FiCode />, <FiTarget />, <FiShield />, <FiGrid />, <FiPackage />][index % 6],
        tone: ["blue", "green", "purple", "orange", "slate", "pink"][index % 6],
        category: service.category || service.serviceCategory || "Company Services",
        action: clientServices.includes(title) ? "View Service" : "Get Proposal",
      };
    })
  ), [companyServices, clientServices]);

  const marketplaceServices = companyMarketplaceServices;
  const dynamicCategories = ["All Services", ...new Set(marketplaceServices.map(service => service.category).filter(Boolean))];
  const activeServiceNames = clientServices.map(service => String(service).toLowerCase());
  const recommendedDynamicServices = marketplaceServices.filter(service => (
    !activeServiceNames.some(active => service.title.toLowerCase().includes(active) || active.includes(service.title.toLowerCase()))
  )).slice(0, 5);
  const visibleServices = marketplaceServices.filter((service) => activeCategory === "All Services" || service.category === activeCategory);
  const displayedServices = showAllServices ? visibleServices : visibleServices.slice(0, 10);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setShowAllServices(false);
  };

  const openEnquiry = (serviceTitle) => {
    setSelectedService(serviceTitle);
    setSubmitMessage({ type: "", text: "" });
    setOpenModal(true);
  };

  const submitEnquiry = async () => {
    try {
      setSubmitLoading(true);
      setSubmitMessage({ type: "", text: "" });

      const response = await axios.post(`${API_URL}/clientsservice/service-enquiries`, {
        serviceName: selectedService,
        requirement: formValues.requirement,
        budget: formValues.budget,
        contactMethod: formValues.contact,
        clientId: client?._id || null,
        clientName: getClientDisplayName(client),
        companyName: client?.company || "",
        companyCode,
        companyIdentifier,
        requestedBy: user?._id || user?.id || null,
      }, {
        headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : undefined,
      });

      if (response.data?.success) {
        setSubmitMessage({ type: "success", text: "Enquiry submitted successfully." });
        await fetchEnquiries();
        setOpenModal(false);
      } else {
        setSubmitMessage({ type: "error", text: response.data?.message || "Unable to submit enquiry." });
      }
    } catch (error) {
      console.error("Error submitting service enquiry:", error);
      setSubmitMessage({ type: "error", text: error.response?.data?.message || "Unable to submit enquiry." });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <CIISLoader />;
  }

  return (
    <section className="ServiceMarketplacePage-root">
      <header className="ServiceMarketplacePage-header">
        <div className="ServiceMarketplacePage-title">
          <h1>Explore Services</h1>
          <p>Discover more services to grow your business with CIIS Network.</p>
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
              {!servicesLoading && recommendedDynamicServices.length === 0 && <p>No recommendations available yet.</p>}
              {recommendedDynamicServices.map((service) => (
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
              {dynamicCategories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="ServiceMarketplacePage-servicesGrid">
              {servicesLoading && <p>Loading company services...</p>}
              {!servicesLoading && servicesError && <p>{servicesError}</p>}
              {!servicesLoading && !servicesError && visibleServices.length === 0 && <p>No company services found for this company code.</p>}
              {!servicesLoading && displayedServices.map((service) => (
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
            {!servicesLoading && visibleServices.length > 10 && (
              <button
                type="button"
                className="ServiceMarketplacePage-moreButton"
                onClick={() => setShowAllServices((isShowingAll) => !isShowingAll)}
              >
                {showAllServices ? "Show Less Services" : "View All Services"}
              </button>
            )}
          </section>
          <section className="ServiceMarketplacePage-panel ServiceMarketplacePage-enquiriesPanel">
            <h2>My Service Enquiries</h2>
            <div className="ServiceMarketplacePage-enquiryHeader">
              <span>Service</span>
              <span>Enquiry ID</span>
              <span>Status</span>
            </div>
            {enquiriesLoading && <p>Loading enquiries...</p>}
            {!enquiriesLoading && enquiries.length === 0 && <p>No active enquiries.</p>}
            {!enquiriesLoading && enquiries.slice(0, 4).map((enquiry, index) => (
              <div className="ServiceMarketplacePage-enquiryRow" key={enquiry._id}>
                <strong>{enquiry.serviceName}</strong>
                <span>{formatPublicId("ENQ", enquiry, index)}</span>
                <em className={`ServiceMarketplacePage-status ServiceMarketplacePage-status-${String(enquiry.status || 'Pending').toLowerCase().replace(" ", "-")}`}>
                  {enquiry.status || 'Pending'}
                </em>
              </div>
            ))}
            <a href="/client/marketplace">View All Enquiries</a>
          </section>
        </main>
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
            {submitMessage.text && (
              <p className={`ServiceMarketplacePage-formMessage ServiceMarketplacePage-formMessage-${submitMessage.type}`}>
                {submitMessage.text}
              </p>
            )}
            <button type="button" className="ServiceMarketplacePage-submitButton" onClick={submitEnquiry} disabled={submitLoading}>
              {submitLoading ? "Submitting..." : "Submit Enquiry"}
            </button>
          </section>
        </div>
      )}
    </section>
  );
};

export default ServiceMarketplacePage;
