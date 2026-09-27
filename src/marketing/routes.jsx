import React, { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import MarketingLayout, { MarketingPage } from "./components/MarketingLayout.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const ProductOverviewPage = lazy(() => import("./pages/ProductOverviewPage.jsx"));
const PeoplePage = lazy(() => import("./pages/PeoplePage.jsx"));
const WorkPage = lazy(() => import("./pages/WorkPage.jsx"));
const ClientsPage = lazy(() => import("./pages/ClientsPage.jsx"));
const InsightsPage = lazy(() => import("./pages/InsightsPage.jsx"));
const EmployeeManagementPage = lazy(() => import("./pages/EmployeeManagementPage.jsx"));
const AttendancePage = lazy(() => import("./pages/AttendancePage.jsx"));
const ShiftManagementPage = lazy(() => import("./pages/ShiftManagementPage.jsx"));
const LeaveManagementPage = lazy(() => import("./pages/LeaveManagementPage.jsx"));
const PayrollPage = lazy(() => import("./pages/PayrollPage.jsx"));
const AssetManagementPage = lazy(() => import("./pages/AssetManagementPage.jsx"));
const TaskManagementPage = lazy(() => import("./pages/TaskManagementPage.jsx"));
const ProjectManagementPage = lazy(() => import("./pages/ProjectManagementPage.jsx"));
const MeetingsPage = lazy(() => import("./pages/MeetingsPage.jsx"));
const ChatCallingPage = lazy(() => import("./pages/ChatCallingPage.jsx"));
const AlertsPage = lazy(() => import("./pages/AlertsPage.jsx"));
const ClientManagementPage = lazy(() => import("./pages/ClientManagementPage.jsx"));
const SupportPage = lazy(() => import("./pages/SupportPage.jsx"));
const PricingPage = lazy(() => import("./pages/PricingPage.jsx"));
const ComparePage = lazy(() => import("./pages/ComparePage.jsx"));
const BookDemoPage = lazy(() => import("./pages/BookDemoPage.jsx"));
const StartTrialPage = lazy(() => import("./pages/StartTrialPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage.jsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.jsx"));

export const MARKETING_PAGES = [
  { path: "/", title: "", Component: HomePage },
  { path: "/product", title: "Product Overview", Component: ProductOverviewPage },
  { path: "/people", title: "People", Component: PeoplePage },
  { path: "/work", title: "Work", Component: WorkPage },
  { path: "/clients", title: "Clients", Component: ClientsPage },
  { path: "/insights", title: "Insights", Component: InsightsPage },
  { path: "/people/employees", title: "Employee Management", Component: EmployeeManagementPage },
  { path: "/people/attendance", title: "Attendance", Component: AttendancePage },
  { path: "/people/shifts", title: "Shift Management", Component: ShiftManagementPage },
  { path: "/people/leave", title: "Leave Management", Component: LeaveManagementPage },
  { path: "/people/payroll", title: "Payroll", Component: PayrollPage },
  { path: "/people/assets", title: "Asset Management", Component: AssetManagementPage },
  { path: "/work/tasks", title: "Task Management", Component: TaskManagementPage },
  { path: "/work/projects", title: "Project Management", Component: ProjectManagementPage },
  { path: "/work/meetings", title: "Meetings", Component: MeetingsPage },
  { path: "/work/chat", title: "Chat & Calling", Component: ChatCallingPage },
  { path: "/work/alerts", title: "Alerts", Component: AlertsPage },
  { path: "/clients/client-management", title: "Client Management", Component: ClientManagementPage },
  { path: "/clients/support", title: "Support", Component: SupportPage },
  { path: "/pricing", title: "Pricing", Component: PricingPage },
  { path: "/compare", title: "Compare", Component: ComparePage },
  { path: "/book-demo", title: "Book a Demo", Component: BookDemoPage },
  { path: "/start-trial", title: "Start 90-Day Trial", Component: StartTrialPage },
  { path: "/contact", title: "Contact", Component: ContactPage },
  { path: "/privacy-policy", title: "Privacy Policy", Component: PrivacyPolicyPage },
  { path: "/terms", title: "Terms of Service", Component: TermsPage },
];

// Old public URLs that now point at the new pages. Authenticated routes are never touched.
export const MARKETING_REDIRECTS = [
  ["/employee-management", "/people/employees"],
  ["/contact-us", "/contact"],
  ["/privacy", "/privacy-policy"],
  ["/usage", "/terms"],
  ["/demo", "/book-demo"],
  ["/trial", "/start-trial"],
];

// Usage inside <Routes> in App.jsx:  {renderMarketingRoutes()}
export function renderMarketingRoutes() {
  return (
    <Route key="ciis-marketing" element={<MarketingLayout />}>
      {MARKETING_PAGES.map(({ path, title, Component }) => (
        <Route
          key={path}
          path={path}
          element={
            <MarketingPage title={title}>
              <Component />
            </MarketingPage>
          }
        />
      ))}
      {MARKETING_REDIRECTS.map(([from, to]) => (
        <Route key={from} path={from} element={<Navigate to={to} replace />} />
      ))}
    </Route>
  );
}
