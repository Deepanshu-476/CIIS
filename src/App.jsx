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
const AboutUs = lazy(() => import("./Pages/AboutUs"));
const ContactUs = lazy(() => import("./Pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("./Pages/PrivacyPolicy"));
const LegalPage = lazy(() => import("./Pages/LegalPage"));
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

function App() {
  return (
    <>
      <Suspense fallback={<RouteBoundaryLoader fullscreen label="Loading app..." />}>
        <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/cookies" element={<LegalPage type="cookies" />} />
        <Route path="/SuperAdminLogin" element={<SuperAdminLogin />} />
        <Route path="company/:companyCode/login" element={<Login />} />
        <Route path="/self-register" element={<SelfRegister />} />
        <Route path="/:companyCode/register" element={<SelfRegister />} />
        <Route path="/company/:companyCode/register" element={<SelfRegister />} />
        <Route path="/RegisterCompany" element={<RegisterCompany />} />
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
          <Route path="emp-attendance" element={<EmppAttendence />} />
          <Route path="emp-task-details" element={<TaskDeatils />} />
          <Route path="admin-task-create" element={<AdminTaskCreate />} />
          <Route path="manage-groups" element={<ManageGroups />} />
          <Route path="admin-meeting" element={<AdminMeetingPage />} />
          <Route path="adminproject" element={<AdminProject />} />
          <Route path="company-all-task" element={<EmpAllTask />} />
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
          <Route path="contact-support" element={<Navigate to="/ciisUser/dashboard" replace />} />
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
          <Route path="my-services" element={<MyServicesPage />} />
          <Route path="marketplace" element={<ServiceMarketplacePage />} />
          <Route path="support-tickets" element={<SupportTicketsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="payments" element={<PaymentsInvoicesPage />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SpeechToTextControl />
      <ToastContainer position="top-right" autoClose={3000} />
    </Suspense>

    <SpeechToTextControl />
    <ToastContainer position="top-right" autoClose={3000} />
  </>
);
}

export default App;
