// import { Routes, Route, Navigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import Login from "./page/Login";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import CIISLoader from "../src/Loader/CIISLoader.jsx";

// // Layouts
// import Layout from "./admin/components/Layout";
// import Layout2 from "./hrCds/UserLayout";
// import SuperLayout from "./admin/components/SuperAdminLayout";
// import ProtectedRoute from "./admin/components/ProtectedRoute";
// import ThemeContextProvider from "./Theme/ThemeContext";

// // Admin Pages
// import CreateUser from "./admin/page/CreateUser";
// import Department from "./admin/page/DepartmentManagement";
// import ChangePassword from "./admin/page/ChangePassword";

// // HR Pages
// import EmppTask from "./hrCds/pages/hr/EmmpTask";
// import AdminTaskCreate from "./hrCds/pages/hr/AdminTaskCreate";
// import ManageGroups from "./hrCds/pages/hr/ManageGroups";
// import AdminMeetingPage from "./hrCds/pages/hr/AdminMeetingPage";
// import EmppDetail from "./hrCds/pages/hr/EmppDetail";
// import EmppLeave from "./hrCds/pages/hr/EmppLeaves";
// import EmppAsset from "./hrCds/pages/hr/EmppAssets";
// import EmppAttendence from "./hrCds/pages/hr/EmppAttendence";
// import TaskDeatils from "./hrCds/pages/hr/TaskDetails";
// import EmpAllTask from "./hrCds/pages/hr/EmpAllTask";
// import CompanyAllTaskTasks from "./hrCds/pages/hr/CompanyAllTaskTasks";
// import EmpDepartmentAllTask from "./hrCds/pages/hr/EmpDepartmentAllTask.jsx";
// import AdminProject from "./hrCds/pages/AdminProject";
// import Client from "./hrCds/pages/hr/Client";

// // ========== CLIENT PAGES (NEW) ==========
// import ClientDashboard from "./hrCds/pages/Dashboard.jsx";
// import ClientPaymentSection from "./hrCds/pages/ClientPaymentSection.jsx";
// import ClientServicesTasks from "./hrCds/pages/ClientServicesTasks.jsx";
// import ClientLayout from "./hrCds/layouts/ClientLayout.jsx";

// // User Pages
// import Alerts from "./hrCds/pages/Alerts";
// import Attendance from "./hrCds/pages/Attendance";
// import MyAssets from "./hrCds/pages/MyAssets";
// import MyLeaves from "./hrCds/pages/MyLeaves";
// import Profile from "./hrCds/pages/Profile";
// import UserDashboard from "./hrCds/pages/UserDashboard";
// import TaskManagement from "./hrCds/pages/TaskManagement";
// import EmployeeMeetingPage from "./hrCds/pages/EmployeeMeetingPage";
// import EmployeeProject from "./hrCds/pages/EmployeeProject";
// import ClientMeeting from "./hrCds/pages/ClientMeeting";

// import CreateAlerts from "./hrCds/pages/CreateAlerts.jsx";
// import UserProfile from './page/UserProfile.jsx';

// // Website Pages
// import Home from "./Pages/Home";
// import AboutUs from "./Pages/AboutUs";
// import ContactUs from "./Pages/ContactUs";
// import RegisterCompany from "./admin/components/CompanyRegister.jsx";

// // Super Admin
// import SuperAdminLogin from "./page/SuperAdminLogin";

// import CompanyManagement from "./page/CompanyManagement.jsx";
// import JobRoleManagement from "./admin/page/JobRoleManagement.jsx";
// import SidebarManagement from "./admin/components/SidebarManagement.jsx";
// import CompanyDetails from "./admin/components/CompanyDetails.jsx";
// import AllCompany from "./page/AllCompany.jsx";
// import CompanyAssetManagement from "./page/CompanyAssetManagement.jsx"
// import Holiday from "./page/Holidays.jsx";

// import ChatPage from "./Pages/Chat/ChatPage";


// function App() {

//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setLoading(false);
//     }, 500);

//     return () => clearTimeout(timer);
//   }, []);

//   if (loading) {
//     return <CIISLoader />;
//   }

//   return (
//     <>
//       <Routes>

//         <Route path="/" element={<Home />} />
//         <Route path="/about" element={<AboutUs />} />
//         <Route path="/contact" element={<ContactUs />} />
//         <Route path="/SuperAdminLogin" element={<SuperAdminLogin />} />
//         <Route path="company/:companyCode/login" element={<Login />} />
//         <Route path="/RegisterCompany" element={<RegisterCompany />} />

//         {/* Super Admin Routes */}
//         <Route
//           path="/Ciis-network/*"
//           element={
//             <ThemeContextProvider>
//               <ProtectedRoute>
//                 <SuperLayout />
//               </ProtectedRoute>
//             </ThemeContextProvider>
//           }
//         >
//           <Route path="company-details" element={<CompanyDetails />} />
//           <Route path="department" element={<Department />} />
//           <Route path="JobRoleManagement" element={<JobRoleManagement />} />
//           <Route path="create-user" element={<CreateUser />} />
//           <Route path="all-company" element={<AllCompany />} />
//           <Route path="company-assets" element={<CompanyAssetManagement/>}/>
//           <Route path="CompanyManagement" element={<CompanyManagement />} />
//           <Route path="SidebarManagement" element={<SidebarManagement />} />
//           <Route path="holiday" element={<Holiday />} />
//         </Route>

//         {/* ========== CDS USER ROUTES (HR, Employee, etc.) ========== */}
//         <Route
//           path="/ciisUser/*"
//           element={
//             <ThemeContextProvider>
//               <ProtectedRoute>
//                 <Layout2 />
//               </ProtectedRoute>
//             </ThemeContextProvider>
//           }
//         >
          
          
//           {/* HR/Employee Routes */}
//           <Route path="change-password" element={<ChangePassword />} />
//           <Route path="emp-details" element={<EmppDetail />} />
//           <Route path="emp-leaves" element={<EmppLeave />} />
//           <Route path="emp-assets" element={<EmppAsset />} />
//           <Route path="emp-attendance" element={<EmppAttendence />} />
//           <Route path="emp-task-details" element={<TaskDeatils />} />
//           <Route path="admin-task-create" element={<AdminTaskCreate />} />
//           <Route path="manage-groups" element={<ManageGroups />} />
//           <Route path="admin-meeting" element={<AdminMeetingPage />} />
//           <Route path="adminproject" element={<AdminProject />} />
//           <Route path="company-all-task" element={<EmpAllTask />} />
//           <Route path="company-all-task/tasks" element={<CompanyAllTaskTasks />} />
//           <Route path="company-all-task/tasks/:userId" element={<CompanyAllTaskTasks />} />
//           <Route path="company-all-task/:userId/tasks" element={<CompanyAllTaskTasks />} />
//           <Route path="emp-client" element={<Client />} />
//           <Route path="alert" element={<Alerts />} />
//           <Route path="attendance" element={<Attendance />} />
//           <Route path="my-assets" element={<MyAssets />} />
//           <Route path="my-leaves" element={<MyLeaves />} />
//           <Route path="profile" element={<Profile />} />
//           <Route path="user-dashboard" element={<UserDashboard />} />
//           <Route path="project" element={<EmployeeProject />} />
//           <Route path="task-management" element={<TaskManagement />} />
//           <Route path="employee-meeting" element={<EmployeeMeetingPage />} />
//           <Route path="client-meeting" element={<ClientMeeting />} />
//           <Route path="create-user" element={<CreateUser />} />
//           <Route path="create-alert" element={<CreateAlerts />} />
//           <Route path="user-profile" element={<UserProfile/>} />
//           <Route
//             path="chat" 
//             element={<ChatPage />}
//           />
//         </Route>

//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>

//       <ToastContainer position="top-right" autoClose={3000} />
//     </>
//   );
// }

// export default App;
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./page/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CIISLoader from "../src/Loader/CIISLoader.jsx";

// Layouts
import Layout from "./admin/components/Layout";
import Layout2 from "./hrCds/UserLayout";
import SuperLayout from "./admin/components/SuperAdminLayout";
import ProtectedRoute from "./admin/components/ProtectedRoute";
import ThemeContextProvider from "./Theme/ThemeContext";

// Admin Pages
import CreateUser from "./admin/page/CreateUser";
import Department from "./admin/page/DepartmentManagement";
import ChangePassword from "./admin/page/ChangePassword";

// HR Pages
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

// ========== CLIENT PAGES (NEW) ==========
import ClientDashboard from "./hrCds/pages/Dashboard.jsx";
import ClientPaymentSection from "./hrCds/pages/ClientPaymentSection.jsx";
import ClientServicesTasks from "./hrCds/pages/ClientServicesTasks.jsx";
import ClientLayout from "./hrCds/layouts/ClientLayout.jsx";

// User Pages
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
import ContactSupport from "./hrCds/pages/ContactSupport";

import CreateAlerts from "./hrCds/pages/CreateAlerts.jsx";
import UserProfile from './page/UserProfile.jsx';

// Website Pages
import Home from "./Pages/Home";
import AboutUs from "./Pages/AboutUs";
import ContactUs from "./Pages/ContactUs";
import RegisterCompany from "./admin/components/CompanyRegister.jsx";


// Super Admin
import SuperAdminLogin from "./page/SuperAdminLogin";

import CompanyManagement from "./page/CompanyManagement.jsx";
import CompanyAccessManagement from "./admin/page/CompanyAccessManagement.jsx";
import JobRoleManagement from "./admin/page/JobRoleManagement.jsx";
import SidebarManagement from "./admin/components/SidebarManagement.jsx";
import CompanyDetails from "./admin/components/CompanyDetails.jsx";
import AllCompany from "./page/AllCompany.jsx";
import CompanyAssetManagement from "./page/CompanyAssetManagement.jsx"
import Holiday from "./page/Holidays.jsx";
import BranchManagement from "./admin/page/BranchManagement.jsx";

import ChatPage from "./pages/Chat/ChatPage";
// import ContactSupport from "./hrCds/pages/ContactSupport.jsx";


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
        <Route path="/SuperAdminLogin" element={<SuperAdminLogin />} />
        <Route path="company/:companyCode/login" element={<Login />} />
        <Route path="/RegisterCompany" element={<RegisterCompany />} />

        {/* Super Admin Routes */}
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
          <Route path="JobRoleManagement" element={<JobRoleManagement />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="all-company" element={<AllCompany />} />
          <Route path="company-assets" element={<CompanyAssetManagement/>}/>
          <Route path="CompanyManagement" element={<CompanyManagement />} />
          <Route path="SidebarManagement" element={<SidebarManagement />} />
          <Route path="company-access" element={<CompanyAccessManagement />} />
          <Route path="holiday" element={<Holiday />} />
          <Route path="branch" element={<BranchManagement />} />
        </Route>

        {/* ========== CDS USER ROUTES (HR, Employee, etc.) ========== */}
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
          
          
          {/* HR/Employee Routes */}
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
          <Route path="alert" element={<Alerts />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="my-assets" element={<MyAssets />} />
          <Route path="my-leaves" element={<MyLeaves />} />
          <Route path="profile" element={<Profile />} />
          <Route path="user-dashboard" element={<UserDashboard />} />
          <Route path="project" element={<EmployeeProject />} />
          <Route path="task-management" element={<TaskManagement />} />
          <Route path="employee-meeting" element={<EmployeeMeetingPage />} />
          <Route path="client-meeting" element={<ClientMeeting />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="create-alert" element={<CreateAlerts />} />
          <Route path="user-profile" element={<UserProfile/>} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="contact-support" element={<ContactSupport />} />
        </Route>

        {/* ========== CLIENT SPECIFIC ROUTES (NEW) ========== */}
        <Route
          path="/client/*"
          element={
            <ThemeContextProvider>
              <ProtectedRoute>
                <ClientLayout />
              </ProtectedRoute>
            </ThemeContextProvider>
          }
        >
          {/* Client Dashboard - Main landing page for clients */}
          <Route index element={<ClientDashboard />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          
          {/* Client Payment Section */}
          <Route path="payment" element={<ClientPaymentSection />} />
          
          {/* Client Services & Tasks */}
          <Route path="services-tasks" element={<ClientServicesTasks />} />
          
          {/* Redirect any unknown client routes to dashboard */}
          <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
