import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./page/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CIISLoader from "../src/Loader/CIISLoader.jsx";


import Layout from "./admin/components/Layout";
import Layout2 from "./hrCds/UserLayout";
import SuperLayout from "./admin/components/SuperAdminLayout";
import ProtectedRoute from "./admin/components/ProtectedRoute";
import ThemeContextProvider from "./Theme/ThemeContext";


import CreateUser from "./admin/page/CreateUser";
import Department from "./admin/page/DepartmentManagement";
import ChangePassword from "./admin/page/ChangePassword";


import EmppTask from "./hrCds/pages/hr/EmmpTask";
import AdminTaskCreate from "./hrCds/pages/hr/AdminTaskCreate";
import ManageGroups from "./hrCds/pages/hr/ManageGroups";
import AdminMeetingPage from "./hrCds/pages/hr/AdminMeetingPage";
import EmppDetail from "./hrCds/pages/hr/EmppDetail";
import EmppLeave from "./hrCds/pages/hr/EmppLeaves";
import EmppAsset from "./hrCds/pages/hr/EmppAssets";
import EmppAttendence from "./hrCds/pages/hr/EmppAttendence";
import TaskDeatils from "./hrCds/pages/hr/TaskDetails";
import EmpAllTask from "./hrCds/pages/hr/EmpAllTask";
import CompanyAllTaskTasks from "./hrCds/pages/hr/CompanyAllTaskTasks";
import EmpDepartmentAllTask from "./hrCds/pages/hr/EmpDepartmentAllTask.jsx";
import AdminProject from "./hrCds/pages/AdminProject";
import Client from "./hrCds/pages/hr/Client";
import ClientPlansPage from "./hrCds/pages/hr/ClientPlansPage.jsx";


import ClientDashboardPage from "./hrCds/pages/client/ClientDashboardPage.jsx";
import ClientTasksUpdatesPage from "./hrCds/pages/client/ClientTasksUpdatesPage.jsx";
import MyServicesPage from "./hrCds/pages/client/MyServicesPage.jsx";
import ServiceMarketplacePage from "./hrCds/pages/client/ServiceMarketplacePage.jsx";
import SupportTicketsPage from "./hrCds/pages/client/SupportTicketsPage.jsx";
import DocumentsPage from "./hrCds/pages/client/DocumentsPage.jsx";
import PaymentsInvoicesPage from "./hrCds/pages/client/PaymentsInvoicesPage.jsx";


import Alerts from "./hrCds/pages/Alerts";
import Attendance from "./hrCds/pages/Attendance";
import MyAssets from "./hrCds/pages/MyAssets";
import MyLeaves from "./hrCds/pages/MyLeaves";
import Profile from "./hrCds/pages/Profile";
import UserDashboard from "./hrCds/pages/UserDashboard";
import TaskManagement from "./hrCds/pages/TaskManagement";
import EmployeeMeetingPage from "./hrCds/pages/EmployeeMeetingPage";
import EmployeeProject from "./hrCds/pages/EmployeeProject";
import ClientMeeting from "./hrCds/pages/ClientMeeting";
import DepartmentSupportDesk from "./hrCds/pages/DepartmentSupportDesk";
import SupportOperations from "./admin/page/SupportOperations.jsx";
import ActiveClientsOverview from "./hrCds/pages/ActiveClientsOverview.jsx";

import CreateAlerts from "./hrCds/pages/CreateAlerts.jsx";
import UserProfile from './page/UserProfile.jsx';


import Home from "./Pages/Home";
import AboutUs from "./Pages/AboutUs";
import ContactUs from "./Pages/ContactUs";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import LegalPage from "./Pages/LegalPage";
import RegisterCompany from "./admin/components/CompanyRegister.jsx";



import SuperAdminLogin from "./page/SuperAdminLogin";

import CompanyManagement from "./page/CompanyManagement.jsx";
import PlanManagement from "./admin/page/PlanManagement.jsx";
import PageManagement from "./admin/page/PageManagement.jsx";
import JobRoleManagement from "./admin/page/JobRoleManagement.jsx";
import SidebarManagement from "./admin/components/SidebarManagement.jsx";
import CompanyDetails from "./admin/components/CompanyDetails.jsx";
import AllCompany from "./page/AllCompany.jsx";
import CompanyAssetManagement from "./page/CompanyAssetManagement.jsx"
import Holiday from "./page/Holidays.jsx";
import BranchManagement from "./admin/page/BranchManagement.jsx"; 
import ChatPage from "./Pages/Chat/ChatPage";
import Settings from "./admin/page/Settings.jsx";

function App() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <CIISLoader />;
  }

  return (
    <>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/cookies" element={<LegalPage type="cookies" />} />
        <Route path="/SuperAdminLogin" element={<SuperAdminLogin />} />
        <Route path="company/:companyCode/login" element={<Login />} />
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
          <Route path="department" element={<Department />} />
          <Route path="department/branch/:branchId" element={<Department />} />
          <Route path="JobRoleManagement" element={<JobRoleManagement />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="all-company" element={<AllCompany />} />
          <Route path="company-assets" element={<CompanyAssetManagement/>}/>
          <Route path="company-assets/branch/:branchId" element={<CompanyAssetManagement/>}/>
          <Route path="CompanyManagement" element={<CompanyManagement />} />
          <Route path="SidebarManagement" element={<SidebarManagement />} />
          <Route path="page-management" element={<PageManagement />} />
          <Route path="plans" element={<PlanManagement />} />
          <Route path="holiday" element={<Holiday />} />
          <Route path="branch" element={<BranchManagement />} />
          <Route path="support-operations" element={<SupportOperations />} />
          <Route path="settings" element={<Settings />} />
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
          <Route path="client-plans" element={<ClientPlansPage />} />
          <Route path="active-clients" element={<ActiveClientsOverview />} />
          <Route path="alert" element={<Alerts />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="my-assets" element={<MyAssets />} />
          <Route path="my-leaves" element={<MyLeaves />} />
          <Route path="profile" element={<Profile />} />
          <Route path="user-dashboard" element={<UserDashboard />} />
          <Route path="ClientDashboard" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="project" element={<EmployeeProject />} />
          <Route path="task-management" element={<TaskManagement />} />
          <Route path="employee-meeting" element={<EmployeeMeetingPage />} />
          <Route path="client-meeting" element={<ClientMeeting />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="SidebarManagement" element={<SidebarManagement />} />
          <Route path="create-alert" element={<CreateAlerts />} />
          <Route path="user-profile" element={<UserProfile/>} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="contact-support" element={<Navigate to="/ciisUser/dashboard" replace />} />
          <Route path="support-desk" element={<DepartmentSupportDesk />} />
          <Route path="support-operations" element={<SupportOperations />} />
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

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
