const routeLoaders = {
  "/ciisUser/user-dashboard": () => import("../hrCds/pages/UserDashboard"),
  "/ciisUser/attendance": () => import("../hrCds/pages/Attendance"),
  "/ciisUser/my-leaves": () => import("../hrCds/pages/MyLeaves"),
  "/ciisUser/my-assets": () => import("../hrCds/pages/MyAssets"),
  "/ciisUser/chat": () => import("../Pages/Chat/ChatPage"),
  "/ciisUser/support-desk": () => import("../hrCds/pages/DepartmentSupportDesk"),
  "/ciisUser/support-operations": () => import("../admin/page/SupportOperations.jsx"),
  "/ciisUser/create-user": () => import("../admin/page/CreateUser"),
  "/ciisUser/register-request": () => import("../hrCds/pages/hr/RegisterRequest.jsx"),
  "/ciisUser/department": () => import("../admin/page/DepartmentManagement"),
  "/ciisUser/jobrolemanagement": () => import("../admin/page/JobRoleManagement.jsx"),
  "/ciisUser/job-role-management": () => import("../admin/page/JobRoleManagement.jsx"),
  "/ciisUser/admin-task-create": () => import("../hrCds/pages/hr/AdminTaskCreate"),
  "/ciisUser/manage-groups": () => import("../hrCds/pages/hr/ManageGroups"),
  "/ciisUser/admin-meeting": () => import("../hrCds/pages/hr/AdminMeetingPage"),
  "/ciisUser/adminproject": () => import("../hrCds/pages/AdminProject"),
  "/ciisUser/company-all-task": () => import("../hrCds/pages/hr/CompanyAllTaskTasks"),
  "/ciisUser/emp-client": () => import("../hrCds/pages/hr/Client"),
  "/ciisUser/active-clients": () => import("../hrCds/pages/ActiveClientsOverview.jsx"),
  "/ciisUser/emp-details": () => import("../hrCds/pages/hr/EmppDetail"),
  "/ciisUser/emp-leaves": () => import("../hrCds/pages/hr/EmppLeaves"),
  "/ciisUser/emp-assets": () => import("../hrCds/pages/hr/EmppAssets"),
  "/ciisUser/emp-attendance": () => import("../hrCds/pages/hr/EmppAttendence"),
  "/ciisUser/task-management": () => import("../hrCds/pages/TaskManagement"),
  "/ciisUser/project": () => import("../hrCds/pages/EmployeeProject"),
  "/ciisUser/employee-meeting": () => import("../hrCds/pages/EmployeeMeetingPage"),
  "/ciisUser/client-meeting": () => import("../hrCds/pages/ClientMeeting"),
  "/ciisUser/create-alert": () => import("../hrCds/pages/CreateAlerts.jsx"),
  "/ciisUser/alert": () => import("../hrCds/pages/Alerts"),
  "/ciisUser/profile": () => import("../hrCds/pages/Profile"),
  "/ciisUser/change-password": () => import("../admin/page/ChangePassword"),
  "/ciisUser/leave-policy": () => import("../admin/page/LeavePolicy.jsx"),
  "/ciisUser/leave-policy-master": () => import("../admin/page/LeavePolicy.jsx"),
  "/client/dashboard": () => import("../hrCds/pages/client/ClientDashboardPage.jsx"),
  "/client/my-services": () => import("../hrCds/pages/client/MyServicesPage.jsx"),
  "/client/tasks-updates": () => import("../hrCds/pages/client/ClientTasksUpdatesPage.jsx"),
  "/client/marketplace": () => import("../hrCds/pages/client/ServiceMarketplacePage.jsx"),
  "/client/support-tickets": () => import("../hrCds/pages/client/SupportTicketsPage.jsx"),
  "/client/documents": () => import("../hrCds/pages/client/DocumentsPage.jsx"),
  "/client/payments": () => import("../hrCds/pages/client/PaymentsInvoicesPage.jsx"),
  "/Ciis-network/company-details": () => import("../admin/components/CompanyDetails.jsx"),
  "/Ciis-network/department": () => import("../admin/page/DepartmentManagement"),
  "/Ciis-network/branch": () => import("../admin/page/BranchManagement.jsx"),
  "/Ciis-network/jobrolemanagement": () => import("../admin/page/JobRoleManagement.jsx"),
  "/Ciis-network/job-roles": () => import("../admin/page/JobRoleManagement.jsx"),
  "/Ciis-network/create-user": () => import("../admin/page/CreateUser"),
  "/Ciis-network/register-request": () => import("../hrCds/pages/hr/RegisterRequest.jsx"),
  "/Ciis-network/company-assets": () => import("../page/CompanyAssetManagement.jsx"),
  "/Ciis-network/sidebarmanagement": () => import("../admin/components/SidebarManagement.jsx"),
  "/Ciis-network/support-operations": () => import("../admin/page/SupportOperations.jsx"),
  "/Ciis-network/settings": () => import("../admin/page/Settings.jsx"),
  "/Ciis-network/email-settings": () => import("../admin/page/EmailSettings.jsx"),
  "/Ciis-network/page-management": () => import("../admin/page/PageManagement.jsx"),
  "/Ciis-network/leave-policy": () => import("../admin/page/LeavePolicy.jsx"),
  "/Ciis-network/leave-policy-master": () => import("../admin/page/LeavePolicy.jsx"),
  "/Ciis-network/companyaccessmanagement": () => import("../admin/page/CompanyAccessManagement.jsx"),
  "/Ciis-network/all-company": () => import("../page/AllCompany.jsx"),
  "/Ciis-network/companymanagement": () => import("../page/CompanyManagement.jsx"),
  "/Ciis-network/plans": () => import("../admin/page/PlanManagement.jsx"),
  "/Ciis-network/holiday": () => import("../page/Holidays.jsx"),
  "/Ciis-network/app-version-control": () => import("../admin/page/AppVersionControl.jsx"),
  "/Ciis-network/demo-requests": () => import("../admin/page/DemoRequests.jsx"),
};

const normalizePath = (path = "") => String(path || "").trim().replace(/\/+$/, "").toLowerCase();

export const preloadRouteChunk = (path) => {
  const loader = routeLoaders[normalizePath(path)];
  return loader ? loader() : Promise.resolve();
};

export const preloadRouteByPath = preloadRouteChunk;

export const preloadRouteChunks = (paths = []) => {
  const uniquePaths = [...new Set(paths.map(normalizePath).filter(Boolean))];
  return Promise.all(uniquePaths.map(path => preloadRouteChunk(path)));
};

export const routeChunkPaths = Object.keys(routeLoaders);
