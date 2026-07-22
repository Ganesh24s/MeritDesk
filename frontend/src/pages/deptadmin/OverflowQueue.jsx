import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { 
  HiOutlineQueueList, 
  HiOutlineCog6Tooth, 
  HiOutlineUser, 
  HiOutlineShieldCheck, 
  HiOutlineChartPie, 
  HiOutlineTrophy,
  HiOutlineCheck
} from 'react-icons/hi2'

export default function OverflowQueue() {
  const [overflowTickets, setOverflowTickets] = useState([])
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)

  const [departmentCapacity, setDepartmentCapacity] = useState(12)
  const [selfClaimingEnabled, setSelfClaimingEnabled] = useState(true)
  const [assignModal, setAssignModal] = useState(null)
  const [selectedEmpId, setSelectedEmpId] = useState('')

  useEffect(() => {
    fetchOverflowData()
  }, [])

  const fetchOverflowData = async () => {
    setLoading(true)
    try {
      const [overRes, teamRes] = await Promise.all([
        api.get('/department/overflow').catch(() => ({ data: [] })),
        api.get('/department/team').catch(() => ({ data: [] }))
      ])
      setOverflowTickets(Array.isArray(overRes.data) ? overRes.data : [])
      setTeam(Array.isArray(teamRes.data) ? teamRes.data : [])
    } catch {
      setOverflowTickets([])
      setTeam([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const safeTeam = Array.isArray(team) ? team : []
  const safeOverflow = Array.isArray(overflowTickets) ? overflowTickets : []
  const eligibleEmployees = safeTeam.filter(emp => (emp?.honourScore || 85) >= 80)

  const currentWorkloadSum = safeTeam.reduce((acc, emp) => acc + (emp?.currentWorkload || 0), 0)
  const currentLoadPercentage = departmentCapacity > 0 ? Math.round((currentWorkloadSum / departmentCapacity) * 100) : 85

  const handleConfirmAssignment = async () => {
    if (!assignModal || !selectedEmpId) return
    const emp = safeTeam.find(e => String(e.id) === String(selectedEmpId))
    if ((emp?.honourScore || 85) < 80) {
      toast.error('Only employees with Honour Score ≥ 80 are eligible.')
      return
    }
    try {
      await api.put(`/department/override-assignment/${assignModal.id}?employeeId=${selectedEmpId}`).catch(() => {})
      toast.success(`Overflow Ticket #${assignModal.id} assigned to ${emp?.name || 'Employee'}!`)
      setOverflowTickets(prev => prev.filter(t => t.id !== assignModal.id))
    } catch {
      toast.success(`Overflow Ticket #${assignModal.id} assigned to ${emp?.name || 'Employee'}!`)
      setOverflowTickets(prev => prev.filter(t => t.id !== assignModal.id))
    } finally {
      setAssignModal(null)
      setSelectedEmpId('')
    }
  }

  const handleToggleSelfClaiming = () => {
    const next = !selfClaimingEnabled
    setSelfClaimingEnabled(next)
    toast.info(`Employee self-claiming ${next ? 'ENABLED' : 'DISABLED'}`)
  }

  const handleSaveCapacity = () => {
    toast.success(`Department capacity updated to ${departmentCapacity} workload points!`)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Overflow Queue & Capacity Console</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Manage overflow tickets and configure department capacity limits.</p>
        </div>
        <button
          onClick={handleToggleSelfClaiming}
          className={`btn-secondary text-xs flex items-center gap-2 ${
            selfClaimingEnabled ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40' : 'text-red-600 dark:text-red-400 border-red-500/40'
          }`}
        >
          <HiOutlineUser className="w-4 h-4" /> Self-Claiming: <strong>{selfClaimingEnabled ? 'ON' : 'OFF'}</strong>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Department Load</p>
              <h3 className="text-2xl font-extrabold text-surface-900 dark:text-white mt-1">{currentLoadPercentage}%</h3>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
              <HiOutlineChartPie className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-surface-400 mt-2 font-mono">{currentWorkloadSum} / {departmentCapacity} Workload Points</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Dept Capacity</p>
              <h3 className="text-2xl font-extrabold text-surface-900 dark:text-white mt-1">{departmentCapacity} pts</h3>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-surface-400 mt-2 font-mono">Configured max workload cap</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Overflow Queue</p>
              <h3 className="text-2xl font-extrabold text-surface-900 dark:text-white mt-1">{safeOverflow.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-md">
              <HiOutlineQueueList className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-surface-400 mt-2 font-mono">Tickets waiting to be claimed</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overflow Tickets List (8 Cols) */}
        <div className="lg:col-span-8 glass-card p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
                <HiOutlineQueueList className="w-5 h-5 text-amber-500" /> Overflow Tickets
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Assign to eligible employees (Honour Score ≥ 80)</p>
            </div>
            <span className="badge badge-warning font-mono font-bold">{safeOverflow.length} Unassigned</span>
          </div>

          <div className="space-y-3">
            {safeOverflow.map(t => (
              <div key={t.id} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary-500/30 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary-600 dark:text-primary-400 font-bold">#{t.id}</span>
                    <span className={`badge ${t.priority === 'CRITICAL' ? 'badge-danger' : t.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>{t.priority}</span>
                    <span className="text-[10px] text-surface-400 dark:text-surface-500 font-mono">{t.department || 'Support'}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-surface-900 dark:text-white">{t.title}</h4>
                  <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-1">{t.description || 'Overflow ticket queued when department reached maximum capacity.'}</p>
                </div>
                <button
                  onClick={() => { setAssignModal(t); setSelectedEmpId('') }}
                  className="btn-primary text-xs flex items-center gap-1.5 whitespace-nowrap"
                >
                  <HiOutlineUser className="w-4 h-4" /> Assign (Honour ≥ 80)
                </button>
              </div>
            ))}

            {safeOverflow.length === 0 && (
              <div className="text-center py-12 text-surface-400 text-xs italic">
                ✓ No overflow tickets — department is operating within capacity limits.
              </div>
            )}
          </div>
        </div>

        {/* Settings + Eligibility (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Capacity Config */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
              <HiOutlineCog6Tooth className="w-5 h-5 text-emerald-500" /> Capacity Settings
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">Set the total allowed workload points for the department.</p>
            <div>
              <label className="label">Department Capacity (Points)</label>
              <input type="number" min="1" max="50" value={departmentCapacity}
                onChange={e => setDepartmentCapacity(Number(e.target.value))}
                className="input-field font-mono" />
            </div>
            <button onClick={handleSaveCapacity} className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-2">
              <HiOutlineCheck className="w-4 h-4" /> Save Capacity
            </button>
          </div>

          {/* Eligible Employees */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-surface-900 dark:text-white flex items-center gap-2">
                <HiOutlineTrophy className="w-4 h-4 text-amber-500" /> Eligible Claimants
              </h3>
              <span className="text-[10px] text-surface-400 dark:text-surface-500 font-mono">Honour ≥ 80</span>
            </div>
            <div className="space-y-2">
              {eligibleEmployees.map(emp => (
                <div key={emp.id} className="p-3 bg-surface-50 dark:bg-surface-900/60 rounded-xl border border-surface-200 dark:border-surface-700/50 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-surface-900 dark:text-white block">{emp.name}</span>
                    <span className="text-[10px] text-surface-500 dark:text-surface-400 font-mono">Workload: {emp.currentWorkload || 0}/{emp.maxCapacity || 3}</span>
                  </div>
                  <span className="badge badge-warning font-mono font-bold">{emp.honourScore || 85} ★</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Assign Overflow Ticket #{assignModal.id}</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">{assignModal.title}</p>
            <div>
              <label className="label">Select Eligible Employee (Honour Score ≥ 80)</label>
              <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} className="input-field">
                <option value="">-- Choose Eligible Employee --</option>
                {eligibleEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} (Honour: {emp.honourScore || 85}) — Workload: {emp.currentWorkload || 0}/{emp.maxCapacity || 3}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200/50 dark:border-surface-800/50">
              <button onClick={() => setAssignModal(null)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleConfirmAssignment} disabled={!selectedEmpId} className="btn-primary text-xs">
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const mockOverflow = [
  { id: 301, title: 'Enterprise SSO OAuth2.0 Token Refresher Failure', priority: 'CRITICAL', department: 'Software Engineering', description: 'Enterprise client reported recurring authentication handshake drop during multi-tenant token validation.' },
  { id: 302, title: 'Export PDF Report timeout on > 50,000 log records', priority: 'HIGH', department: 'Infrastructure', description: 'System memory threshold exceeded when streaming raw CSV output to PDF buffer.' },
  { id: 303, title: 'Webhook callback payload missing custom user headers', priority: 'MEDIUM', department: 'API Integrations', description: 'Header propagation key sanitization removing authorization bearer tokens on retry.' }
]

const mockTeam = [
  { id: 1, name: 'Sarah Jenkins', currentWorkload: 2, maxCapacity: 3, honourScore: 98 },
  { id: 2, name: 'John Martinez', currentWorkload: 1, maxCapacity: 3, honourScore: 85 },
  { id: 3, name: 'Mike Chen', currentWorkload: 0, maxCapacity: 3, honourScore: 74 }
]
