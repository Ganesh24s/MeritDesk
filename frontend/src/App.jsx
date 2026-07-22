import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterCompany from './pages/public/RegisterCompany'
import RegisterCustomer from './pages/public/RegisterCustomer'
import SetPassword from './pages/public/SetPassword'
import ForgotPassword from './pages/public/ForgotPassword'
import PaymentSuccess from './pages/public/PaymentSuccess'

// Super Admin
import CompanyManagement from './pages/superadmin/CompanyManagement'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import PlatformSettings from './pages/superadmin/PlatformSettings'
import GrowthStatistics from './pages/superadmin/GrowthStatistics'

// Company Admin
import CompanyDashboard from './pages/companyadmin/CompanyDashboard'
import DepartmentManagement from './pages/companyadmin/DepartmentManagement'
import EmployeeManagement from './pages/companyadmin/EmployeeManagement'
import SLAPolicies from './pages/companyadmin/SLAPolicies'
import SkillsManagement from './pages/companyadmin/SkillsManagement'
import KnowledgeBase from './pages/companyadmin/KnowledgeBase'
import CompanyReports from './pages/companyadmin/CompanyReports'
import CompanyTickets from './pages/companyadmin/CompanyTickets'
import CompanyNotifications from './pages/companyadmin/CompanyNotifications'
import CompanySettings from './pages/companyadmin/CompanySettings'
import Billing from './pages/admin/Billing'

// Dept Admin
import DeptDashboard from './pages/deptadmin/DeptDashboard'
import LiveQueue from './pages/deptadmin/LiveQueue'
import RiskTickets from './pages/deptadmin/RiskTickets'
import OverflowQueue from './pages/deptadmin/OverflowQueue'
import ConflictResolver from './pages/deptadmin/ConflictResolver'
import SLAExtensions from './pages/deptadmin/SLAExtensions'
import DeptReports from './pages/deptadmin/DeptReports'
import DeptNotifications from './pages/deptadmin/DeptNotifications'
import TeamOverview from './pages/deptadmin/TeamOverview'

// Employee
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeTickets from './pages/employee/EmployeeTickets'
import EmployeeOverflow from './pages/employee/EmployeeOverflow'
import EmployeeHonour from './pages/employee/EmployeeHonour'
import EmployeeReports from './pages/employee/EmployeeReports'
import EmployeeNotifications from './pages/employee/EmployeeNotifications'
import EmployeeSettings from './pages/employee/EmployeeSettings'
import EmployeeKB from './pages/employee/EmployeeKB'
import EmployeePerformance from './pages/employee/EmployeePerformance'

// Customer
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerTickets from './pages/customer/CustomerTickets'
import CustomerTicketDetail from './pages/customer/CustomerTicketDetail'
import RaiseTicket from './pages/customer/RaiseTicket'
import CustomerFeedback from './pages/customer/CustomerFeedback'
import CustomerNotifications from './pages/customer/CustomerNotifications'
import CustomerSettings from './pages/customer/CustomerSettings'

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>
  if (!isAuthenticated) return <Navigate to="/login" />
  if (roles && !roles.includes(role)) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-company" element={<RegisterCompany />} />
      <Route path="/register-customer" element={<RegisterCustomer />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'DEPARTMENT_ADMIN', 'EMPLOYEE', 'CUSTOMER']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        {/* Super Admin */}
        <Route path="superadmin-dashboard" element={<SuperAdminDashboard />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="platform-settings" element={<PlatformSettings />} />
        <Route path="growth-statistics" element={<GrowthStatistics />} />

        {/* Company Admin */}
        <Route path="company-dashboard" element={<CompanyDashboard />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="sla-policies" element={<SLAPolicies />} />
        <Route path="skills" element={<SkillsManagement />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
        <Route path="reports" element={<CompanyReports />} />
        <Route path="tickets" element={<CompanyTickets />} />
        <Route path="notifications" element={<CompanyNotifications />} />
        <Route path="settings" element={<CompanySettings />} />
        <Route path="billing" element={<Billing />} />

        {/* Dept Admin */}
        <Route path="dept-dashboard" element={<DeptDashboard />} />
        <Route path="live-queue" element={<LiveQueue />} />
        <Route path="dept-risk-tickets" element={<RiskTickets />} />
        <Route path="dept-overflow" element={<OverflowQueue />} />
        <Route path="overflow" element={<OverflowQueue />} />
        <Route path="dept-conflicts" element={<ConflictResolver />} />
        <Route path="dept-sla-extensions" element={<SLAExtensions />} />
        <Route path="dept-reports" element={<DeptReports />} />
        <Route path="dept-notifications" element={<DeptNotifications />} />
        <Route path="team" element={<TeamOverview />} />

        {/* Employee */}
        <Route path="employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="my-tickets" element={<EmployeeTickets />} />
        <Route path="overflow-queue" element={<EmployeeOverflow />} />
        <Route path="my-honour" element={<EmployeeHonour />} />
        <Route path="employee-reports" element={<EmployeeReports />} />
        <Route path="employee-notifications" element={<EmployeeNotifications />} />
        <Route path="employee-settings" element={<EmployeeSettings />} />
        <Route path="employee-kb" element={<EmployeeKB />} />
        <Route path="performance" element={<EmployeePerformance />} />

        {/* Customer */}
        <Route path="customer-dashboard" element={<CustomerDashboard />} />
        <Route path="customer-tickets" element={<CustomerTickets />} />
        <Route path="customer-tickets/:id" element={<CustomerTicketDetail />} />
        <Route path="raise-ticket" element={<RaiseTicket />} />
        <Route path="customer-feedback" element={<CustomerFeedback />} />
        <Route path="customer-notifications" element={<CustomerNotifications />} />
        <Route path="customer-settings" element={<CustomerSettings />} />

        {/* Default redirect */}
        <Route index element={<DashboardIndex />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function DashboardIndex() {
  const { role } = useAuth()
  switch (role) {
    case 'SUPER_ADMIN': return <Navigate to="/dashboard/superadmin-dashboard" />
    case 'COMPANY_ADMIN': return <Navigate to="/dashboard/company-dashboard" />
    case 'DEPARTMENT_ADMIN': return <Navigate to="/dashboard/dept-dashboard" />
    case 'EMPLOYEE': return <Navigate to="/dashboard/employee-dashboard" />
    case 'CUSTOMER': return <Navigate to="/dashboard/customer-dashboard" />
    default: return <Navigate to="/" />
  }
}
