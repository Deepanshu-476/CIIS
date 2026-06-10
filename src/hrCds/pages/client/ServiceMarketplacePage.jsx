import React, { useState } from 'react';
import {
  FiSearch,
  FiArrowRight,
  FiCheckCircle,
  FiMessageSquare,
  FiUser,
  FiShield,
  FiStar,
  FiPlus,
  FiPhone,
  FiMail,
  FiArrowDown
} from 'react-icons/fi';
import './ServiceMarketplacePage.css';

const categories = ['All Services', 'Digital Marketing', 'Website & App Development', 'E-commerce Growth', 'Creative & Branding', 'Software'];
const recommended = [
  { title: 'WhatsApp Marketing', tag: 'Recommended' },
  { title: 'Google Ads', tag: 'Popular' },
  { title: 'Website Maintenance', tag: 'Essential' },
  { title: 'Social Media Marketing', tag: 'Popular' },
  { title: 'Lead Generation', tag: 'Recommended' }
];
const services = [
  { title: 'SEO', label: 'Improve rankings and organic traffic', badge: 'Popular' },
  { title: 'Google Ads Management', label: 'Drive qualified leads with search ads', badge: 'Popular' },
  { title: 'Meta Ads', label: 'Reach more customers on Facebook & Instagram', badge: 'Popular' },
  { title: 'Social Media Marketing', label: 'Grow your brand on social platforms', badge: 'Popular' },
  { title: 'Lead Generation', label: 'Get quality business leads every month.', badge: 'Recommended' },
  { title: 'Website Development', label: 'Build fast, responsive business websites.', badge: 'Popular' },
  { title: 'E-commerce Website Development', label: 'Sell more with powerful e-commerce stores.', badge: 'Popular' },
  { title: 'Mobile App Development', label: 'iOS & Android apps for your business.', badge: 'New' }
];

const ServiceMarketplacePage = () => {
  const [activeCategory, setActiveCategory] = useState('All Services');
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState('WhatsApp Marketing');
  const [formValues, setFormValues] = useState({ requirement: '', budget: '', contact: 'Phone' });

  const filteredServices = services.filter((service) => activeCategory === 'All Services' || service.badge === activeCategory || service.title.includes(activeCategory));

  const handleInquiry = (title) => {
    setSelectedService(title);
    setOpenModal(true);
  };

  return (
    <section className="ServiceMarketplacePage-root">
      <div className="ServiceMarketplacePage-header">
        <div>
          <p>Explore Services</p>
          <h1>Discover the right service for your growth</h1>
        </div>
        <div className="ServiceMarketplacePage-search">
          <FiSearch />
          <input placeholder="Search services, categories, or keywords" />
        </div>
      </div>

      <div className="ServiceMarketplacePage-recommended">
        {recommended.map((item) => (
          <article key={item.title} className="ServiceMarketplacePage-reco-card">
            <div>
              <strong>{item.title}</strong>
              <span>{item.tag}</span>
            </div>
            <button onClick={() => handleInquiry(item.title)}>Discuss Now</button>
          </article>
        ))}
      </div>

      <div className="ServiceMarketplacePage-grid">
        <div className="ServiceMarketplacePage-main">
          <div className="ServiceMarketplacePage-tabs">
            {categories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="ServiceMarketplacePage-services">
            {filteredServices.map((service) => (
              <article key={service.title} className="ServiceMarketplacePage-service-card">
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.label}</p>
                </div>
                <div>
                  <span>{service.badge}</span>
                  <button onClick={() => handleInquiry(service.title)}>Get Proposal</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="ServiceMarketplacePage-sidebar">
          <article className="ServiceMarketplacePage-info-card">
            <div className="ServiceMarketplacePage-info-avatar">R</div>
            <div>
              <span>Account Manager</span>
              <strong>Rahul Sharma</strong>
            </div>
          </article>

          <article className="ServiceMarketplacePage-info-panel">
            <h2>Why Choose CIIS Network?</h2>
            <ul>
              <li><FiCheckCircle />10+ Years Experience</li>
              <li><FiCheckCircle />Result Driven Approach</li>
              <li><FiCheckCircle />Dedicated Support</li>
              <li><FiCheckCircle />Transparent Process</li>
              <li><FiCheckCircle />Affordable Pricing</li>
            </ul>
          </article>

          <article className="ServiceMarketplacePage-info-panel ServiceMarketplacePage-custom-card">
            <h2>Have a custom requirement?</h2>
            <p>Share what you need and we will create a tailored plan for your business.</p>
            <button>Share Requirement</button>
          </article>

          <article className="ServiceMarketplacePage-info-panel">
            <div className="ServiceMarketplacePage-info-panel-heading">
              <span>Recent Enquiries</span>
              <FiArrowRight />
            </div>
            <div className="ServiceMarketplacePage-enquiry-item">
              <div>
                <strong>WhatsApp Marketing</strong>
                <span>ENQ-2026-018</span>
              </div>
              <span className="status status-open">Open</span>
            </div>
            <div className="ServiceMarketplacePage-enquiry-item">
              <div>
                <strong>Google Ads</strong>
                <span>ENQ-2026-017</span>
              </div>
              <span className="status status-sent">Proposal Sent</span>
            </div>
            <div className="ServiceMarketplacePage-enquiry-item">
              <div>
                <strong>Website Development</strong>
                <span>ENQ-2026-015</span>
              </div>
              <span className="status status-contacted">Contacted</span>
            </div>
          </article>
        </aside>
      </div>

      {openModal && (
        <div className="ServiceMarketplacePage-modal-backdrop">
          <div className="ServiceMarketplacePage-modal">
            <div className="ServiceMarketplacePage-modal-header">
              <div>
                <span>Service Enquiry</span>
                <h2>{selectedService}</h2>
              </div>
              <button onClick={() => setOpenModal(false)}>×</button>
            </div>
            <div className="ServiceMarketplacePage-modal-body">
              <label>Requirement</label>
              <textarea
                value={formValues.requirement}
                onChange={(e) => setFormValues({ ...formValues, requirement: e.target.value })}
                placeholder="Describe your business need"
              />
              <label>Budget (optional)</label>
              <input
                value={formValues.budget}
                onChange={(e) => setFormValues({ ...formValues, budget: e.target.value })}
                placeholder="e.g., ₹20,000 - ₹30,000"
              />
              <div className="ServiceMarketplacePage-contact-options">
                {['Phone', 'Email', 'WhatsApp'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={formValues.contact === option ? 'active' : ''}
                    onClick={() => setFormValues({ ...formValues, contact: option })}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button className="ServiceMarketplacePage-submit">Submit Enquiry</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServiceMarketplacePage;
