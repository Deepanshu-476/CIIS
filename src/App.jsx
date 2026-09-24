import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RouteBoundaryLoader from "./components/RouteBoundaryLoader.jsx";
import SpeechToTextControl from "./components/SpeechToTextControl.jsx";

import ProtectedRoute from "./admin/components/ProtectedRoute";
import ProtectedSuperAdminRoute from "./utils/ProtectedSuperAdminRoute.jsx";
import ThemeContextProvider from "./Theme/ThemeContext";

const Login = lazy(() => import("./page/Login"));
const SelfRegister = lazy(() => import("./page/SelfRegister.jsx"));
const Layout2 = lazy(() => import("./hrCds/UserLayout"));
const SuperLayout = lazy(() => import("./admin/components/SuperAdminLayout"));
const CreateUser = lazy(() => import("./admin/page/CreateUser"));
const Department = lazy(() => import("./admin/page/DepartmentManagement"));
const ChangePassword = lazy(() => import("./admin/page/ChangePassword"));
const EmppTask = lazy(() => import("./hrCds/pages/hr/EmmpTask"));
const AdminTaskCreate = lazy(() => import("./hrCds/pages/hr/AdminTaskCreate"));
const ManageGroups = lazy(() => import("./hrCds/pages/hr/ManageGroups"));
const AdminMeetingPage = lazy(() => import("./hrCds/pages/hr/AdminMeetingPage"));
const EmppDetail = lazy(() => import("./hrCds/pages/hr/EmppDetail"));
const EmppLeave = lazy(() => import("./hrCds/pages/hr/EmppLeaves"));
const EmppAsset = lazy(() => import("./hrCds/pages/hr/EmppAssets"));
const EmppAttendence = lazy(() => import("./hrCds/pages/hr/EmppAttendence"));
const TaskDeatils = lazy(() => import("./hrCds/pages/hr/TaskDetails"));
const EmpAllTask = lazy(() => import("./hrCds/pages/hr/EmpAllTask"));
const CompanyAllTaskTasks = lazy(() => import("./hrCds/pages/hr/CompanyAllTaskTasks"));
const EmpDepartmentAllTask = lazy(() => import("./hrCds/pages/hr/EmpDepartmentAllTask.jsx"));
const RegisterRequest = lazy(() => import("./hrCds/pages/hr/RegisterRequest.jsx"));
const AdminProject = lazy(() => import("./hrCds/pages/AdminProject"));
const Client = lazy(() => import("./hrCds/pages/hr/Client"));
const ClientPlansPage = lazy(() => import("./hrCds/pages/hr/ClientPlansPage.jsx"));
const ClientDetailsPage = lazy(() => import("./hrCds/pages/hr/ClientDetailsPage.jsx"));
const AddClientPage = lazy(() => import("./hrCds/pages/hr/AddClientPage.jsx"));
const ClientDashboardPage = lazy(() => import("./hrCds/pages/client/ClientDashboardPage.jsx"));
const ClientTasksUpdatesPage = lazy(() => import("./hrCds/pages/client/ClientTasksUpdatesPage.jsx"));
const MyServicesPage = lazy(() => import("./hrCds/pages/client/MyServicesPage.jsx"));
const ServiceMarketplacePage = lazy(() => import("./hrCds/pages/client/ServiceMarketplacePage.jsx"));
const SupportTicketsPage = lazy(() => import("./hrCds/pages/client/SupportTicketsPage.jsx"));
const DocumentsPage = lazy(() => import("./hrCds/pages/client/DocumentsPage.jsx"));
const PaymentsInvoicesPage = lazy(() => import("./hrCds/pages/client/PaymentsInvoicesPage.jsx"));
const Alerts = lazy(() => import("./hrCds/pages/Alerts"));
const Attendance = lazy(() => import("./hrCds/pages/Attendance"));
const MyAssets = lazy(() => import("./hrCds/pages/MyAssets"));
const MyLeaves = lazy(() => import("./hrCds/pages/MyLeaves"));
const Profile = lazy(() => import("./hrCds/pages/Profile"));
const UserDashboard = lazy(() => import("./hrCds/pages/UserDashboard"));
const DashboardOverview = lazy(() => import("./hrCds/pages/DashboardOverview"));
const TaskManagement = lazy(() => import("./hrCds/pages/TaskManagement"));
const EmployeeMeetingPage = lazy(() => import("./hrCds/pages/EmployeeMeetingPage"));
const EmployeeProject = lazy(() => import("./hrCds/pages/EmployeeProject"));
const ClientMeeting = lazy(() => import("./hrCds/pages/ClientMeeting"));
const DepartmentSupportDesk = lazy(() => import("./hrCds/pages/DepartmentSupportDesk"));
const SupportOperations = lazy(() => import("./admin/page/SupportOperations.jsx"));
const ActiveClientsOverview = lazy(() => import("./hrCds/pages/ActiveClientsOverview.jsx"));
const CreateAlerts = lazy(() => import("./hrCds/pages/CreateAlerts.jsx"));
const UserProfile = lazy(() => import("./page/UserProfile.jsx"));
const Home = lazy(() => import("./Pages/Home"));
const Features = lazy(() => import("./Pages/Features"));
const Solutions = lazy(() => import("./Pages/Solutions"));
const HowItWorks = lazy(() => import("./Pages/HowItWorks"));
const AboutUs = lazy(() => import("./Pages/AboutUs"));
const ContactUs = lazy(() => import("./Pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("./Pages/PrivacyPolicy"));
const LegalPage = lazy(() => import("./Pages/LegalPage"));
const SecurityPage = lazy(() => import("./Pages/SecurityPage"));
const EmployeeManagement = lazy(() => import("./Pages/EmployeeManagement"));
const CrmTelecaller = lazy(() => import("./Pages/CrmTelecaller"));
const TeamCommunication = lazy(() => import("./Pages/TeamCommunication"));
const BusinessAutomation = lazy(() => import("./Pages/BusinessAutomation"));
const SmartAttendancePage = lazy(() => import("./Pages/SmartAttendancePage"));
const LeaveManagementPage = lazy(() => import("./Pages/LeaveManagementPage"));
const PayrollManagementPage = lazy(() => import("./Pages/PayrollManagementPage"));
const AssetManagementPage = lazy(() => import("./Pages/AssetManagementPage"));
const MobileAppPage = lazy(() => import("./Pages/MobileAppPage"));
const RegisterCompany = lazy(() => import("./admin/components/CompanyRegister.jsx"));
const SuperAdminLogin = lazy(() => import("./page/SuperAdminLogin"));
const CompanyManagement = lazy(() => import("./page/CompanyManagement.jsx"));
const PlanManagement = lazy(() => import("./admin/page/PlanManagement.jsx"));
const PageManagement = lazy(() => import("./admin/page/PageManagement.jsx"));
const JobRoleManagement = lazy(() => import("./admin/page/JobRoleManagement.jsx"));
const SidebarManagement = lazy(() => import("./admin/components/SidebarManagement.jsx"));
const CompanyDetails = lazy(() => import("./admin/components/CompanyDetails.jsx"));
const CompanyAccessManagement = lazy(() => import("./admin/page/CompanyAccessManagement.jsx"));
const AllCompany = lazy(() => import("./page/AllCompany.jsx"));
const CompanyUsersPage = lazy(() => import("./page/CompanyUsersPage.jsx"));
const CompanyAssetManagement = lazy(() => import("./page/CompanyAssetManagement.jsx"));
const Holiday = lazy(() => import("./page/Holidays.jsx"));
const BranchManagement = lazy(() => import("./admin/page/BranchManagement.jsx"));
const ChatPage = lazy(() => import("./Pages/Chat/ChatPage"));
const ClientServicesTasks = lazy(() => import("./hrCds/pages/ClientServicesTasks.jsx"));
const ClientAccountSettingsPage = lazy(() => import("./hrCds/pages/client/AccountSettingsPage.jsx"));
const Settings = lazy(() => import("./admin/page/Settings.jsx"));
const EmailSettings = lazy(() => import("./admin/page/EmailSettings.jsx"));
const DemoRequests = lazy(() => import("./admin/page/DemoRequests.jsx"));
const LeavePolicy = lazy(() => import("./admin/page/LeavePolicy.jsx"));
const AppVersionControl = lazy(() => import("./admin/page/AppVersionControl.jsx"));
const FeedbackQuestionnaireManagement = lazy(() => import("./admin/page/FeedbackQuestionnaireManagement.jsx"));
const SalaryComponent = lazy(() => import("./payroll/pages/SalaryComponent.jsx"));
const SalaryStructure = lazy(() => import("./payroll/pages/SalaryStructure.jsx"));
const EmployeeSalaryAssignment = lazy(() => import("./payroll/pages/EmployeeSalaryAssignment.jsx"));
const AssignSalary = lazy(() => import("./payroll/pages/AssignSalary.jsx"));
const PayrollProcess = lazy(() => import("./payroll/pages/PayrollProcess.jsx"));
const Payslip = lazy(() => import("./payroll/pages/Payslip.jsx"));
const PayrollReports = lazy(() => import("./payroll/pages/PayrollReports.jsx"));
const TelecallerLayout = lazy(() => import("./crm/telecaller/TelecallerLayout.jsx"));
const TelecallerDashboard = lazy(() => import("./crm/telecaller/Dashboard.jsx"));
const TelecallerCallDashboard = lazy(() => import("./crm/telecaller/CallDashboard.jsx"));
const TelecallerAssignedCalls = lazy(() => import("./crm/telecaller/AssignedCalls.jsx"));
const TelecallerTodaysCalls = lazy(() => import("./crm/telecaller/TodaysCalls.jsx"));
const TelecallerPendingCalls = lazy(() => import("./crm/telecaller/PendingCalls.jsx"));
const TelecallerScheduledCalls = lazy(() => import("./crm/telecaller/ScheduledCalls.jsx"));
const TelecallerCompletedCalls = lazy(() => import("./crm/telecaller/CompletedCalls.jsx"));
const TelecallerCallHistory = lazy(() => import("./crm/telecaller/CallHistory.jsx"));
const TelecallerMyFollowUps = lazy(() => import("./crm/telecaller/MyFollowUps.jsx"));
const TelecallerConvertedLeads = lazy(() => import("./crm/telecaller/ConvertedLeads.jsx"));
const TelecallerCallWorkspace = lazy(() => import("./crm/telecaller/CallWorkspace.jsx"));
const TelecallerLeadDetail = lazy(() => import("./crm/telecaller/LeadDetail.jsx"));
const CallLogs = lazy(() => import("./admin/page/CallLogs.jsx"));
const AdminCrmDashboard = lazy(() => import("./crm/admin/AdminCrmDashboard.jsx"));
const AddLead = lazy(() => import("./crm/admin/AddLead.jsx"));
const LeadSources = lazy(() => import("./crm/admin/LeadSources.jsx"));
const LeadTypes = lazy(() => import("./crm/admin/LeadTypes.jsx"));
const ImportExportLeads = lazy(() => import("./crm/admin/ImportExportLeads.jsx"));
const LeadOverview = lazy(() => import("./crm/admin/LeadOverview.jsx"));
const AllLeads = lazy(() => import("./crm/admin/AllLeads.jsx"));
const CallOverview = lazy(() => import("./crm/admin/CallOverview.jsx"));
const AdminAssignedCalls = lazy(() => import("./crm/admin/AssignedCalls.jsx"));
const TodaysCalls = lazy(() => import("./crm/admin/TodaysCalls.jsx"));
const PendingCalls = lazy(() => import("./crm/admin/PendingCalls.jsx"));
const CompletedCalls = lazy(() => import("./crm/admin/CompletedCalls.jsx"));
const ConvertedCalls = lazy(() => import("./crm/admin/ConvertedCalls.jsx"));
const TransferredCalls = lazy(() => import("./crm/admin/TransferredCalls.jsx"));
const FollowUpCenter = lazy(() => import("./crm/admin/FollowUpCenter.jsx"));
const AssignmentsOverview = lazy(() => import("./crm/admin/AssignmentsOverview.jsx"));
const BulkAssignment = lazy(() => import("./crm/admin/BulkAssignment.jsx"));
const AssignmentHistory = lazy(() => import("./crm/admin/AssignmentHistory.jsx"));
const WorkloadDistribution = lazy(() => import("./crm/admin/WorkloadDistribution.jsx"));
const CallHistory = lazy(() => import("./crm/admin/CallHistory.jsx"));
const ScheduledCalls = lazy(() => import("./crm/admin/ScheduledCalls.jsx"));
const LiveCrmReport = lazy(() => import("./crm/admin/LiveCrmReport.jsx"));

function App() {
  return (
    <>
      <Suspense fallback={null}>
        <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/feature" element={<Navigate to="/features" replace />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/solution" element={<Navigate to="/solutions" replace />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/howitworks" element={<Navigate to="/how-it-works" replace />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/employee-management" element={<EmployeeManagement />} />
        <Route path="/employee" element={<Navigate to="/employee-management" replace />} />
        <Route path="/crm-telecaller" element={<CrmTelecaller />} />
        <Route path="/crm" element={<Navigate to="/crm-telecaller" replace />} />
        <Route path="/telecaller" element={<Navigate to="/crm-telecaller" replace />} />
        <Route path="/payroll-management" element={<PayrollManagementPage />} />
        <Route path="/payroll" element={<Navigate to="/payroll-management" replace />} />
        <Route path="/smart-attendance" element={<SmartAttendancePage />} />
        <Route path="/attendance" element={<Navigate to="/smart-attendance" replace />} />
        <Route path="/leave-management" element={<LeaveManagementPage />} />
        <Route path="/leave-policy" element={<Navigate to="/leave-management" replace />} />
        <Route path="/asset-management" element={<AssetManagementPage />} />
        <Route path="/assets-management" element={<Navigate to="/asset-management" replace />} />
        <Route path="/mobile-app" element={<MobileAppPage />} />
        <Route path="/mobile" element={<Navigate to="/mobile-app" replace />} />
        <Route path="/team-communication" element={<TeamCommunication />} />
        <Route path="/communication" element={<Navigate to="/team-communication" replace />} />
        <Route path="/business-automation" element={<BusinessAutomation />} />
        <Route path="/automation" element={<Navigate to="/business-automation" replace />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/cookies" element={<LegalPage type="cookies" />} />
        <Route path="/usage" element={<LegalPage type="terms" />} />
        <Route path="/SuperAdminLogin" element={<SuperAdminLogin />} />
        <Route path="/superadminlogin" element={<Navigate to="/SuperAdminLogin" replace />} />
        <Route path="/superadmin-login" element={<Navigate to="/SuperAdminLogin" replace />} />
        <Route path="/super-admin-login" element={<Navigate to="/SuperAdminLogin" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Login" element={<Navigate to="/login" replace />} />
        <Route path="/company/:companyCode/login" element={<Login />} />
        <Route path="company/:companyCode/login" element={<Login />} />
        <Route path="/self-register" element={<SelfRegister />} />
        <Route path="/:companyCode/register" element={<SelfRegister />} />
        <Route path="/company/:companyCode/register" element={<SelfRegister />} />
        <Route path="/RegisterCompany" element={<RegisterCompany />} />
        <Route path="/call-management" element={<Navigate to="/ciisUser/telecaller/call-dashboard" replace />} />
        <Route path="/lead-management" element={<Navigate to="/ciisUser/telecaller/assigned-calls" replace />} />
        <Route path="/talicaliler" element={<Navigate to="/ciisUser/telecaller/dashboard" replace />} />

        <Route
          path="/Ciis-network/*"
          element={
            <ThemeContextProvider>
              <ProtectedRoute>
                <SuperLayout />
              </ProtectedRoute>
            </ThemeContextProvider>
          }
        >
          <Route path="company-details" element={<CompanyDetails />} />
          <Route path="RegisterCompany" element={<RegisterCompany />} />
          <Route path="CompanyAccessManagement" element={<CompanyAccessManagement />} />
          <Route path="CompanyAccessManagement/:companyId" element={<CompanyAccessManagement />} />
          <Route path="department" element={<Department />} />
          <Route path="department/branch/:branchId" element={<Department />} />
          <Route path="JobRoleManagement" element={<JobRoleManagement />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="register-request" element={<RegisterRequest />} />
          <Route path="all-company" element={<AllCompany />} />
          <Route path="all-company/:companyId/users" element={<CompanyUsersPage />} />
          <Route path="company-assets" element={<CompanyAssetManagement/>}/>
          <Route path="company-assets/branch/:branchId" element={<CompanyAssetManagement/>}/>
          <Route path="CompanyManagement" element={<CompanyManagement />} />
          <Route path="SidebarManagement" element={<SidebarManagement />} />
          <Route path="page-management" element={<PageManagement />} />
          <Route path="plans" element={<PlanManagement />} />
          <Route path="holiday" element={<Holiday />} />
          <Route path="branch" element={<BranchManagement />} />
          <Route path="support-operations" element={<SupportOperations />} />
          <Route path="feedback-questionnaire" element={<FeedbackQuestionnaireManagement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="email-settings" element={<EmailSettings />} />
          <Route
            path="app-version-control"
            element={
              <ProtectedSuperAdminRoute>
                <AppVersionControl />
              </ProtectedSuperAdminRoute>
            }
          />
          <Route path="leave-policy-master" element={<LeavePolicy />} />
          <Route path="leave-policy" element={<LeavePolicy />} />
          <Route
            path="demo-requests"
            element={
              <ProtectedSuperAdminRoute>
                <DemoRequests />
              </ProtectedSuperAdminRoute>
            }
          />
        </Route>

        
        <Route
          path="/ciisUser/*"
          element={
            <ThemeContextProvider>
              <ProtectedRoute>
                <Layout2 />
              </ProtectedRoute>
            </ThemeContextProvider>
          }
        >
          
          
          
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="emp-details" element={<EmppDetail />} />
          <Route path="emp-leaves" element={<EmppLeave />} />
          <Route path="emp-assets" element={<EmppAsset />} />
          <Route path="company-assets" element={<CompanyAssetManagement />} />
          <Route path="company-assets/branch/:branchId" element={<CompanyAssetManagement />} />
          <Route path="asset-management" element={<CompanyAssetManagement />} />
          <Route path="asset-management/branch/:branchId" element={<CompanyAssetManagement />} />
          <Route path="emp-attendance" element={<EmppAttendence />} />
          <Route path="emp-task-details" element={<TaskDeatils />} />
          <Route path="admin-task-create" element={<AdminTaskCreate />} />
          <Route path="manage-groups" element={<ManageGroups />} />
          <Route path="admin-meeting" element={<AdminMeetingPage />} />
          <Route path="adminproject" element={<AdminProject />} />
          <Route path="company-all-task" element={<EmpAllTask />} />
          <Route path="department-all-task" element={<EmpDepartmentAllTask />} />
          <Route path="company-all-task/tasks" element={<CompanyAllTaskTasks />} />
          <Route path="company-all-task/tasks/:userId" element={<CompanyAllTaskTasks />} />
          <Route path="company-all-task/:userId/tasks" element={<CompanyAllTaskTasks />} />
          <Route path="emp-client" element={<Client />} />
          <Route path="emp-client/add-new" element={<AddClientPage />} />
          <Route path="emp-client/:clientId" element={<ClientDetailsPage />} />
          <Route path="client-plans" element={<ClientPlansPage />} />
          <Route path="active-clients" element={<ActiveClientsOverview />} />
          <Route path="alert" element={<Alerts />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="my-assets" element={<MyAssets />} />
          <Route path="my-leaves" element={<MyLeaves />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="user-dashboard"
            element={(
              <Suspense fallback={<RouteBoundaryLoader label="Loading dashboard..." />}>
                <UserDashboard />
              </Suspense>
            )}
          />
          <Route path="dashboard-1" element={<DashboardOverview />} />
          <Route path="ClientDashboard" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="project" element={<EmployeeProject />} />
          <Route
            path="task-management"
            element={(
              <Suspense fallback={<RouteBoundaryLoader label="Loading tasks..." />}>
                <TaskManagement />
              </Suspense>
            )}
          />
          <Route path="employee-meeting" element={<EmployeeMeetingPage />} />
          <Route path="client-meeting" element={<ClientMeeting />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="register-request" element={<RegisterRequest />} />
          <Route path="department" element={<Department />} />
          <Route path="department/branch/:branchId" element={<Department />} />
          <Route path="JobRoleManagement" element={<JobRoleManagement />} />
          <Route path="SidebarManagement" element={<SidebarManagement />} />
          <Route path="create-alert" element={<CreateAlerts />} />
          <Route path="user-profile" element={<UserProfile/>} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="dashboard" element={<Navigate to="/ciisUser/user-dashboard" replace />} />
          <Route path="contact-support" element={<Navigate to="/ciisUser/user-dashboard" replace />} />
          <Route path="support-desk" element={<DepartmentSupportDesk />} />
          <Route path="support-operations" element={<SupportOperations />} />
          <Route path="feedback-questionnaire" element={<FeedbackQuestionnaireManagement />} />
          <Route path="leave-policy-master" element={<LeavePolicy />} />
          <Route path="leave-policy" element={<LeavePolicy />} />
          <Route path="salary-component" element={<SalaryComponent />} />
          <Route path="salary-structure" element={<SalaryStructure />} />
          <Route path="salary-assignment" element={<EmployeeSalaryAssignment />} />
          <Route path="assign-salary" element={<AssignSalary />} />
          <Route path="payroll-process" element={<PayrollProcess />} />
          <Route path="payslip" element={<Payslip />} />
          <Route path="payroll-reports" element={<PayrollReports />} />
          <Route path="crm/admin/dashboard" element={<AdminCrmDashboard />} />
        <Route path="telecaller" element={<TelecallerLayout/>}>
            <Route index element={<Navigate to="dashboard" replace/>}/>
            <Route path="dashboard" element={<TelecallerDashboard/>}/>
            <Route path="call-dashboard" element={<TelecallerCallDashboard/>}/>
            <Route path="assigned-calls" element={<TelecallerAssignedCalls/>}/>
            <Route path="todays-calls" element={<TelecallerTodaysCalls/>}/>
            <Route path="pending-calls" element={<TelecallerPendingCalls/>}/>
            <Route path="scheduled-calls" element={<TelecallerScheduledCalls/>}/>
            <Route path="completed-calls" element={<TelecallerCompletedCalls/>}/>
            <Route path="call-history" element={<TelecallerCallHistory/>}/>
            <Route path="follow-ups" element={<TelecallerMyFollowUps/>}/>
            <Route path="converted-leads" element={<TelecallerConvertedLeads/>}/>
            <Route path="call-workspace/:leadId?" element={<TelecallerCallWorkspace/>}/>
            <Route path="lead-detail/:leadId?" element={<TelecallerLeadDetail/>}/>
            <Route path="call-logs" element={<CallLogs/>}/>
          </Route>
          <Route path="call-logs" element={<CallLogs/>}/>
          <Route path="crm" element={<Navigate to="/ciisUser/crm/admin/dashboard" replace />} />
          <Route path="crm/admin" element={<Navigate to="/ciisUser/crm/admin/dashboard" replace />} />
          <Route path="crm/leads" element={<Navigate to="/ciisUser/crm/admin/all-leads" replace />} />
          <Route path="crm/marketing" element={<Navigate to="/ciisUser/crm/marketing/overview" replace />} />
          <Route path="crm/followups" element={<Navigate to="/ciisUser/crm/admin/follow-ups" replace />} />
          <Route path="crm/admin/lead-overview" element={<LeadOverview />} />
          <Route path="crm/admin/all-leads" element={<AllLeads />} />
          <Route path="crm/leads/all" element={<Navigate to="/ciisUser/crm/admin/all-leads" replace />} />
          <Route path="crm/all-leads" element={<Navigate to="/ciisUser/crm/admin/all-leads" replace />} />
          <Route path="crm/lead-overview" element={<Navigate to="/ciisUser/crm/admin/lead-overview" replace />} />
          <Route path="crm/leads/overview" element={<Navigate to="/ciisUser/crm/admin/lead-overview" replace />} />
          <Route path="crm/admin/add-lead" element={<AddLead />} />
          <Route path="crm/admin/lead-sources" element={<LeadSources />} />
          <Route path="crm/admin/lead-types" element={<LeadTypes />} />
          <Route path="crm/admin/import-export-leads" element={<ImportExportLeads />} />
          <Route path="crm/leads/import" element={<ImportExportLeads />} />
          <Route path="crm/import-leads" element={<ImportExportLeads />} />
          <Route path="crm/leads/export" element={<ImportExportLeads />} />
          <Route path="crm/leads/sources" element={<LeadSources />} />
          <Route path="crm/lead-sources" element={<LeadSources />} />
          <Route path="crm/leads/add" element={<AddLead />} />
          <Route path="crm/add-lead" element={<AddLead />} />
          <Route path="crm/admin/call-overview" element={<CallOverview />} />
          <Route path="crm/call-overview" element={<CallOverview />} />
          <Route path="crm/calls/overview" element={<Navigate to="/ciisUser/crm/admin/call-overview" replace />} />
          <Route path="crm/admin/assigned-calls" element={<AdminAssignedCalls />} />
          <Route path="crm/calls/assigned" element={<Navigate to="/ciisUser/crm/admin/assigned-calls" replace />} />
          <Route path="crm/admin/todays-calls" element={<TodaysCalls />} />
          <Route path="crm/todays-calls" element={<TodaysCalls />} />
          <Route path="crm/calls/today" element={<Navigate to="/ciisUser/crm/admin/todays-calls" replace />} />
          <Route path="todays-calls" element={<Navigate to="/ciisUser/crm/admin/todays-calls" replace />} />
          <Route path="crm/admin/pending-calls" element={<PendingCalls />} />
          <Route path="crm/pending-calls" element={<PendingCalls />} />
          <Route path="crm/calls/pending" element={<Navigate to="/ciisUser/crm/admin/pending-calls" replace />} />
          <Route path="crm/admin/scheduled-calls" element={<ScheduledCalls />} />
          <Route path="crm/scheduled-calls" element={<ScheduledCalls />} />
          <Route path="crm/calls/scheduled" element={<Navigate to="/ciisUser/crm/admin/scheduled-calls" replace />} />
          <Route path="scheduled-calls" element={<Navigate to="/ciisUser/crm/admin/scheduled-calls" replace />} />
          <Route path="crm/admin/completed-calls" element={<CompletedCalls />} />
          <Route path="crm/completed-calls" element={<CompletedCalls />} />
          <Route path="crm/calls/completed" element={<Navigate to="/ciisUser/crm/admin/completed-calls" replace />} />
          <Route path="crm/admin/converted-calls" element={<ConvertedCalls />} />
          <Route path="crm/converted-calls" element={<ConvertedCalls />} />
          <Route path="crm/calls/converted" element={<Navigate to="/ciisUser/crm/admin/converted-calls" replace />} />
          <Route path="crm/admin/transferred-calls" element={<TransferredCalls />} />
          <Route path="crm/transferred-calls" element={<TransferredCalls />} />
          <Route path="crm/calls/transferred" element={<Navigate to="/ciisUser/crm/admin/transferred-calls" replace />} />
          <Route path="crm/admin/call-history" element={<CallHistory />} />
          <Route path="crm/call-history" element={<CallHistory />} />
          <Route path="crm/calls/history" element={<Navigate to="/ciisUser/crm/admin/call-history" replace />} />
          <Route path="crm/admin/follow-ups" element={<FollowUpCenter />} />
          <Route path="crm/follow-ups" element={<Navigate to="/ciisUser/crm/admin/follow-ups" replace />} />
          <Route path="crm/admin/assignments" element={<AssignmentsOverview />} />
          <Route path="crm/assignments" element={<Navigate to="/ciisUser/crm/admin/assignments" replace />} />
          <Route path="crm/admin/assignment-bulk" element={<BulkAssignment />} />
          <Route path="crm/assignment-bulk" element={<Navigate to="/ciisUser/crm/admin/assignment-bulk" replace />} />
          <Route path="crm/admin/assignment-history" element={<AssignmentHistory />} />
          <Route path="crm/assignment-history" element={<Navigate to="/ciisUser/crm/admin/assignment-history" replace />} />
          <Route path="crm/admin/workload" element={<WorkloadDistribution />} />
          <Route path="crm/workload" element={<Navigate to="/ciisUser/crm/admin/workload" replace />} />
          <Route path="crm/calls" element={<Navigate to="/ciisUser/crm/admin/call-overview" replace />} />

          <Route path="crm/reports/overview" element={<LiveCrmReport type="overview" title="Reports Overview" />} />
          <Route path="crm/reports/leads" element={<LiveCrmReport type="leads" title="Lead Reports" />} />
          <Route path="crm/reports/calls" element={<LiveCrmReport type="calls" title="Call Reports" />} />
          <Route path="crm/reports/visits" element={<Navigate to="/ciisUser/crm/reports/overview" replace />} />
          <Route path="crm/reports/follow-ups" element={<LiveCrmReport type="follow-ups" title="Follow-Up Reports" />} />
          <Route path="crm/reports/team-performance" element={<LiveCrmReport type="team-performance" title="Team Performance" />} />
          <Route path="crm/reports/team" element={<Navigate to="/ciisUser/crm/reports/team-performance" replace />} />
          <Route path="crm/reports/conversion-funnel" element={<LiveCrmReport type="conversion-funnel" title="Conversion Funnel" />} />
          <Route path="crm/reports/funnel" element={<Navigate to="/ciisUser/crm/reports/conversion-funnel" replace />} />
          <Route path="crm/reports/user-activity" element={<LiveCrmReport type="user-activity" title="User Activity" />} />
          <Route path="crm/reports" element={<Navigate to="/ciisUser/crm/reports/overview" replace />} />
        </Route>
        <Route
          path="/client/*"
          element={
            <ThemeContextProvider>
              <ProtectedRoute>
                <Layout2 />
              </ProtectedRoute>
            </ThemeContextProvider>
          }
        >
          <Route index element={<ClientDashboardPage />} />
          <Route path="dashboard" element={<ClientDashboardPage />} />
          <Route path="tasks-updates" element={<ClientTasksUpdatesPage />} />
          <Route
            path="task-management"
            element={(
              <Suspense fallback={<RouteBoundaryLoader label="Loading tasks..." />}>
                <TaskManagement />
              </Suspense>
            )}
          />
          <Route path="admin-task-create" element={<AdminTaskCreate />} />
          <Route path="my-services" element={<MyServicesPage />} />
          <Route path="services-tasks" element={<ClientServicesTasks />} />
          <Route path="account-settings" element={<ClientAccountSettingsPage />} />
          <Route path="marketplace" element={<ServiceMarketplacePage />} />
          <Route path="payment" element={<Navigate to="/client/payments" replace />} />
          <Route path="support-tickets" element={<SupportTicketsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="payments" element={<PaymentsInvoicesPage />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </Suspense>

    <SpeechToTextControl />
    <ToastContainer position="top-right" autoClose={3000} />
  </>
);
}

export default App;
