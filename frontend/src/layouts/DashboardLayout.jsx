import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { HiOutlineMenuAlt2, HiX, HiBell, HiSun, HiMoon, HiLogout, HiChevronDown, HiOutlineCreditCard } from 'react-icons/hi'
import { HiOutlineBuildingOffice2, HiOutlineChartBarSquare, HiOutlineUserGroup, HiOutlineTicket, HiOutlineCog6Tooth, HiOutlineBookOpen, HiOutlineTrophy, HiOutlineQueueList, HiOutlinePlusCircle, HiOutlineShieldCheck, HiOutlineUsers } from 'react-icons/hi2'

const navConfig = {
  SUPER_ADMIN: [
    { to: '/dashboard/superadmin-dashboard', label: 'Dashboard', icon: HiOutlineChartBarSquare },
    { to: '/dashboard/companies', label: 'Companies', icon: HiOutlineBuildingOffice2 },
    { to: '/dashboard/platform-settings', label: 'Platform Settings', icon: HiOutlineCog6Tooth },
    { to: '/dashboard/growth-statistics', label: 'Growth & Statistics', icon: HiOutlineChartBarSquare },
  ],
  COMPANY_ADMIN: [
    { to: '/dashboard/company-dashboard', label: 'Dashboard', icon: HiOutlineChartBarSquare },
    { to: '/dashboard/departments', label: 'Departments', icon: HiOutlineBuildingOffice2 },
    { to: '/dashboard/employees', label: 'Employees', icon: HiOutlineUserGroup },
    { to: '/dashboard/sla-policies', label: 'SLA Policies', icon: HiOutlineShieldCheck },
    { to: '/dashboard/skills', label: 'Skills Catalog', icon: HiOutlineTrophy },
    { to: '/dashboard/knowledge-base', label: 'Knowledge Base', icon: HiOutlineBookOpen },
    { to: '/dashboard/reports', label: 'Reports', icon: HiOutlineChartBarSquare },
    { to: '/dashboard/tickets', label: 'Tickets (All Company)', icon: HiOutlineTicket },
    { to: '/dashboard/billing', label: 'Billing', icon: HiOutlineCreditCard },
    { to: '/dashboard/notifications', label: 'Notifications', icon: HiBell },
    { to: '/dashboard/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
  ],
  DEPARTMENT_ADMIN: [
    { to: '/dashboard/dept-dashboard', label: 'Dashboard', icon: HiOutlineChartBarSquare },
    { to: '/dashboard/live-queue', label: 'Live Queue', icon: HiOutlineQueueList },
    { to: '/dashboard/my-tickets', label: 'My Assigned Tickets', icon: HiOutlineTicket },
    { to: '/dashboard/dept-risk-tickets', label: 'Risk Tickets', icon: HiOutlineShieldCheck },
    { to: '/dashboard/dept-overflow', label: 'Overflow Queue', icon: HiOutlineQueueList },
    { to: '/dashboard/dept-conflicts', label: 'Conflict Resolver', icon: HiOutlineTrophy },
    { to: '/dashboard/dept-sla-extensions', label: 'SLA Extensions', icon: HiOutlineBookOpen },
    { to: '/dashboard/dept-reports', label: 'Reports', icon: HiOutlineChartBarSquare },
    { to: '/dashboard/dept-notifications', label: 'Notifications', icon: HiBell },
  ],
  EMPLOYEE: [
    { to: '/dashboard/employee-dashboard', label: 'Dashboard', icon: HiOutlineChartBarSquare },
    { to: '/dashboard/my-tickets', label: 'My Tickets', icon: HiOutlineTicket },
    { to: '/dashboard/overflow-queue', label: 'Overflow Queue', icon: HiOutlineQueueList },
    { to: '/dashboard/my-honour', label: 'My Honour', icon: HiOutlineTrophy },
    { to: '/dashboard/employee-reports', label: 'Reports', icon: HiOutlineChartBarSquare },
    { to: '/dashboard/employee-notifications', label: 'Notifications', icon: HiBell },
    { to: '/dashboard/employee-settings', label: 'Settings', icon: HiOutlineCog6Tooth },
  ],
  CUSTOMER: [
    { to: '/dashboard/customer-dashboard', label: 'Dashboard', icon: HiOutlineChartBarSquare },
    { to: '/dashboard/raise-ticket', label: 'Raise Ticket', icon: HiOutlinePlusCircle },
    { to: '/dashboard/customer-tickets', label: 'My Tickets', icon: HiOutlineTicket },
    { to: '/dashboard/customer-feedback', label: 'My Feedback', icon: HiOutlineTrophy },
    { to: '/dashboard/customer-notifications', label: 'Notifications', icon: HiBell },
    { to: '/dashboard/customer-settings', label: 'Settings', icon: HiOutlineCog6Tooth },
  ],
}

const getRoleColor = (role) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'from-red-500 to-purple-600'
    case 'COMPANY_ADMIN': return 'from-blue-600 to-cyan-500'
    case 'DEPARTMENT_ADMIN': return 'from-amber-500 to-orange-600'
    case 'EMPLOYEE': return 'from-emerald-500 to-teal-500'
    case 'CUSTOMER': return 'from-pink-500 to-rose-500'
    default: return 'from-primary-500 to-accent-500'
  }
}

const getRoleBranding = (role) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'MD Platform'
    case 'COMPANY_ADMIN': return 'MD Enterprise'
    case 'DEPARTMENT_ADMIN': return 'MD Manager'
    case 'EMPLOYEE': return 'MD Agent'
    case 'CUSTOMER': return 'MD Support'
    default: return 'MeritDesk'
  }
}

export default function DashboardLayout() {
  const { user, logout, role } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [profileOpen, setProfileOpen] = useState(false)

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.count || 0)
    } catch {}
  }

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data || [])
      setShowNotifs(!showNotifs)
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(n => n.map(x => ({ ...x, read: true })))
    } catch {}
  }

  const handleLogout = () => { logout(); navigate('/') }
  const links = navConfig[role] || []

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex-shrink-0 glass border-r border-surface-200/50 dark:border-surface-800/50 flex flex-col`}>
        <div className="p-4 flex flex-col gap-1 border-b border-surface-200/50 dark:border-surface-800/50">
          <div className="flex items-center gap-1">
            <img src="/logo.png" alt="MeritDesk" className="w-10 h-10 object-contain flex-shrink-0" />
            {sidebarOpen && <span className="font-bold text-lg bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">{getRoleBranding(role)}</span>}
          </div>
          {sidebarOpen && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 mt-1">
              {role?.replace('_', ' ')}
            </span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/50'
              }`}>
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-surface-200/50 dark:border-surface-800/50">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800/50 text-surface-500 transition-colors">
            <HiOutlineMenuAlt2 className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 glass border-b border-surface-200/50 dark:border-surface-800/50 flex items-center justify-between px-6 relative z-30">
          <div>
            <h2 className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {user?.companyName || 'MeritDesk Platform'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button onClick={() => setDark(!dark)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
              {dark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={loadNotifications} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors relative">
                <HiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">{unreadCount}</span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto glass-card z-50 p-0">
                  <div className="flex items-center justify-between p-3 border-b border-surface-200/50 dark:border-surface-700/50">
                    <span className="font-semibold text-sm">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-primary-500 hover:underline">Mark all read</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-surface-400 text-sm">No notifications</p>
                  ) : notifications.slice(0, 15).map(n => (
                    <div key={n.id} className={`p-3 border-b border-surface-100 dark:border-surface-800 text-sm ${!n.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                      <p className="text-surface-700 dark:text-surface-300">{n.message}</p>
                      <p className="text-xs text-surface-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                {<HiChevronDown className="w-4 h-4 text-surface-400" />}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 glass-card z-50 p-2">
                  <div className="px-3 py-2 border-b border-surface-200/50 dark:border-surface-700/50 mb-1">
                    <p className="font-semibold text-sm">{user?.name}</p>
                    <p className="text-xs text-surface-400">{user?.email}</p>
                    <span className="badge badge-primary mt-1">{user?.role?.replace('_', ' ')}</span>
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm transition-colors">
                    <HiLogout className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {/* Ambient background glow elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-[120px] animate-pulse-soft"></div>
            <div className="absolute top-[65%] -right-[10%] w-[35%] h-[35%] bg-accent-500/5 dark:bg-accent-500/10 rounded-full blur-[100px] animate-pulse-soft"></div>
          </div>
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
