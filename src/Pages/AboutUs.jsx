import React from "react";
import "./AboutUs.css";
import Header from "../components/CiisNavbar";
import Footer from "../components/CiisFooter";
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  Database,
  Eye,
  FileCheck,
  LineChart,
  Lock,
  MessageCircle,
  Network,
  Rocket,
  Search,
  Shield,
  Smartphone,
  TrendingUp,
  Umbrella,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

const heroStats = [
  { value: "3-Tier", label: "Management System", icon: FileCheck, color: "blue" },
  { value: "24/7", label: "Real-time Access", icon: MessageCircle, color: "green" },
  { value: "100%", label: "Data Centralization", icon: Shield, color: "purple" },
];

const overviewStats = [
  { value: "40%", label: "Productivity Increase", icon: TrendingUp, color: "green" },
  { value: "70%", label: "Time Saved", icon: Clock, color: "orange" },
  { value: "100%", label: "Real-time Tracking", icon: Wifi, color: "blue" },
  { value: "99.9%", label: "Data Accuracy", icon: Shield, color: "purple" },
];

const highlights = [
  "Automated workflows for attendance, tasks, and approvals",
  "Centralized data management across departments",
  "Role-based access control with multi-level security",
  "Seamless communication and transparent workflows",
];

const roleCards = [
  {
    title: "Managers",
    image: "/about-manager.png",
    icon: Users,
    color: "blue",
    description:
      "Supervise Team Leads, approve/reject leave requests, manage asset allocations, analyze team performance metrics, oversee IT operations, and make strategic resource decisions.",
    points: ["Leave Approvals", "Asset Management", "Performance Analysis", "Team Supervision"],
  },
  {
    title: "HR & Administration",
    image: "/about-hr.png",
    icon: Building2,
    color: "green",
    description:
      "Manage employee records, attendance history, leave policies, onboarding/offboarding processes, compliance tracking, user management, and system configurations.",
    points: ["Employee Data", "Compliance", "User Management", "System Control"],
  },
  {
    title: "Team Leads",
    image: "/about-team-lead.png",
    icon: Network,
    color: "purple",
    description:
      "Assign and monitor tasks, track team progress, manage workload distribution, approve routine requests, and generate performance reports.",
    points: ["Task Assignment", "Team Monitoring", "Work Distribution", "Reports"],
  },
];

const coreFeatures = [
  { title: "Attendance Tracking", description: "Real-time marking, geolocation verification, shift management, and reporting.", icon: Clock, color: "blue" },
  { title: "Task Management", description: "Assignment, tracking, priority levels, deadlines, and performance metrics.", icon: FileCheck, color: "green" },
  { title: "Leave Management", description: "Automated leave workflow with multi-level approvals and policy enforcement.", icon: Umbrella, color: "orange" },
  { title: "Asset Management", description: "End-to-end lifecycle tracking from request to allocation and retirement.", icon: Briefcase, color: "purple" },
  { title: "Performance Tracking", description: "Analytics for individual, team, and department-level KPIs.", icon: LineChart, color: "red" },
  { title: "Reports & Analytics", description: "Real-time dashboards for data-driven decisions.", icon: BarChart3, color: "blue" },
];

const workflowFeatures = [
  { title: "Multi-Level Approvals", description: "Configurable hierarchies for leaves, assets, and requests.", icon: Network, color: "blue" },
  { title: "Real-Time Monitoring", description: "Live dashboards for attendance, task status, and performance.", icon: Wifi, color: "green" },
  { title: "Role-Based Dashboards", description: "Custom dashboards for each role in the organization.", icon: Database, color: "orange" },
  { title: "Mobile Accessibility", description: "Full functionality on mobile devices.", icon: Smartphone, color: "purple" },
  { title: "Security & Compliance", description: "Enterprise-grade security with audit trails.", icon: Shield, color: "red" },
  { title: "Integration Capabilities", description: "Integrates with HR, payroll, and enterprise platforms.", icon: Network, color: "blue" },
];

const benefits = [
  { title: "Increased Productivity", description: "Automation reduces admin workload by up to 60%.", icon: Rocket, color: "green" },
  { title: "Improved Communication", description: "Seamless information flow with automated notifications.", icon: MessageCircle, color: "blue" },
  { title: "Centralized Records", description: "Single source of truth for all employee data.", icon: Database, color: "purple" },
  { title: "Transparent Workflows", description: "Complete visibility into approvals and performance.", icon: Eye, color: "orange" },
  { title: "Data-Driven Decisions", description: "Comprehensive analytics for strategic planning.", icon: BarChart3, color: "blue" },
  { title: "Enhanced Compliance", description: "Automated tracking of policies and regulatory requirements.", icon: Shield, color: "green" },
];

const IconBox = ({ icon: Icon, color = "blue" }) => (
  <span className={`about-icon ${color}`}>
    <Icon />
  </span>
);

const dashboardStats = [
  { label: "Employees", value: "1,248", trend: "+ 12.5%", icon: Users, color: "blue" },
  { label: "Attendance Records", value: "8,856", trend: "+ 8.2%", icon: Clock, color: "green" },
  { label: "Leaves", value: "342", trend: "- 3.1%", icon: Umbrella, color: "orange", down: true },
  { label: "Tasks in Progress", value: "128", trend: "+ 15.5%", icon: Database, color: "purple" },
];

const AboutDashboard = () => (
  <div className="about-dashboard">
    <aside className="about-dashboard-side">
      <div className="about-dashboard-brand">
        <span>W</span>
        <strong>WorkSmart</strong>
      </div>
      {["Dashboard", "Employees", "Attendance", "Leaves", "Tasks", "Assets", "Reports", "Settings"].map((item, index) => (
        <div className={`about-side-item ${index === 0 ? "active" : ""}`} key={item}>
          <Database />
          <span>{item}</span>
        </div>
      ))}
    </aside>

    <div className="about-dashboard-main">
      <div className="about-dashboard-topbar">
        <div className="about-search">
          <Search />
          <span>Search anything...</span>
        </div>
        <div className="about-user-mini">
          <Zap />
          <span className="about-mini-avatar" />
          <div>
            <strong>John Doe</strong>
            <small>Admin</small>
          </div>
        </div>
      </div>

      <h3>Dashboard</h3>
      <div className="about-metric-grid">
        {dashboardStats.map((stat) => (
          <article className="about-metric-card" key={stat.label}>
            <IconBox icon={stat.icon} color={stat.color} />
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small className={stat.down ? "down" : "up"}>{stat.trend}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="about-dashboard-panels">
        <section className="about-chart-card">
          <div className="about-card-head">
            <strong>Attendance Overview</strong>
            <small>This Month</small>
          </div>
          <div className="about-bar-chart">
            {[16, 28, 48, 35, 70, 55, 66, 52, 76].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </section>

        <section className="about-donut-card">
          <strong>Leave Overview</strong>
          <div className="about-donut-row">
            <div className="about-donut" />
            <div className="about-legend">
              <span><i className="blue" />Approved 296</span>
              <span><i className="orange" />Pending 36</span>
              <span><i className="red" />Rejected 50</span>
            </div>
          </div>
        </section>
      </div>

      <div className="about-dashboard-panels lower">
        <section className="about-activity-card">
          <strong>Recent Activities</strong>
          {["Leave request by Sarah Johnson", "Asset request by Mike Davis", "Task completed by James Anderson", "New employee John Smith joined"].map((item) => (
            <span key={item}><i />{item}<small>3h ago</small></span>
          ))}
        </section>

        <section className="about-task-card">
          <div className="about-card-head">
            <strong>Upcoming Tasks</strong>
            <small>View All</small>
          </div>
          {[["UI/UX Design Review", "75%"], ["Monthly Report Generation", "60%"], ["Performance Review", "30%"]].map(([task, progress]) => (
            <div className="about-progress-task" key={task}>
              <span>{task}<small>{progress}</small></span>
              <i style={{ width: progress }} />
            </div>
          ))}
        </section>
      </div>
    </div>
  </div>
);

const PersonFallback = ({ color }) => (
  <div className={`about-person ${color}`}>
    <span className="about-person-head" />
    <span className="about-person-hair" />
    <span className="about-person-body" />
  </div>
);

const AboutUs = () => {
  return (
    <>
      <Header />

      <div className="about-page">
        <main className="about-main">
          <section className="about-hero">
            <div className="about-shell about-hero-grid">
              <div className="about-hero-copy">
                <div className="about-pill">
                  <Zap />
                  About Our Platform
                </div>
                <h1>
                  Streamlining Organizational <span>Excellence</span>
                </h1>
                <p className="about-lead">
                  A comprehensive platform unifying workforce management across all levels.
                </p>
                <p>
                  Our Employee Management Portal revolutionizes internal operations through automated workflows, real-time tracking, and role-based dashboards. From daily attendance to complex approval processes, we provide a seamless ecosystem for modern organizations to thrive.
                </p>

                <div className="about-hero-stats">
                  {heroStats.map((stat) => (
                    <article className="about-hero-stat" key={stat.label}>
                      <IconBox icon={stat.icon} color={stat.color} />
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="about-dashboard-wrap">
                <AboutDashboard />
              </div>
            </div>
          </section>

          <section className="about-shell about-overview-card">
            <div className="about-overview-copy">
              <h2>Complete Workforce Management</h2>
              <p>An integrated platform connecting employees, team leads, managers, HR, and administrators.</p>
              <div className="about-check-list">
                {highlights.map((item) => (
                  <span key={item}>
                    <CheckCircle />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="about-overview-stats">
              {overviewStats.map((stat) => (
                <article className="about-stat-card" key={stat.label}>
                  <IconBox icon={stat.icon} color={stat.color} />
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="about-section">
            <div className="about-shell">
              <div className="about-section-title">
                <span>Role-Specific Capabilities</span>
                <h2>Tailored interfaces and tools for every organizational role</h2>
              </div>

              <div className="about-role-grid">
                {roleCards.map((role) => (
                  <article className={`about-role-card ${role.color}`} key={role.title}>
                    <div className="about-role-visual">
                      <img
                        src={role.image}
                        alt={role.title}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                      <PersonFallback color={role.color} />
                    </div>
                    <div className="about-role-content">
                      <IconBox icon={role.icon} color={role.color} />
                      <h3>{role.title}</h3>
                      <p>{role.description}</p>
                      <div className="about-role-points">
                        {role.points.map((point) => (
                          <span key={point}>
                            <CheckCircle />
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="about-section compact">
            <div className="about-shell">
              <div className="about-section-title">
                <span>Core Platform Features</span>
                <h2>Comprehensive tools for efficient organizational management</h2>
              </div>
              <div className="about-feature-grid">
                {coreFeatures.map((feature) => (
                  <article className="about-feature-card" key={feature.title}>
                    <IconBox icon={feature.icon} color={feature.color} />
                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="about-section compact">
            <div className="about-shell">
              <div className="about-section-title">
                <span>Automated Workflows & Approvals</span>
                <h2>Streamlined processes that eliminate manual work and increase efficiency</h2>
              </div>
              <div className="about-workflow-grid">
                {workflowFeatures.map((feature) => (
                  <article className="about-workflow-card" key={feature.title}>
                    <IconBox icon={feature.icon} color={feature.color} />
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="about-section compact">
            <div className="about-shell">
              <div className="about-section-title">
                <span>Transform Your Organization</span>
                <h2>Key benefits of implementing our Employee Management Portal</h2>
              </div>
              <div className="about-benefit-grid">
                {benefits.map((benefit) => (
                  <article className="about-benefit-card" key={benefit.title}>
                    <IconBox icon={benefit.icon} color={benefit.color} />
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </article>
                ))}
              </div>

              <div className="about-cta">
                <div className="about-rocket">
                  <Rocket />
                </div>
                <div>
                  <h2>Ready to Transform Your Organization?</h2>
                  <p>Empower your workforce with intelligent automation, centralized management, and real-time insights.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
};

export default AboutUs;
