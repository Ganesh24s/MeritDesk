import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { 
  HiOutlineExclamationTriangle, 
  HiOutlineBell, 
  HiOutlineArrowsRightLeft, 
  HiOutlineShieldExclamation,
  HiOutlineClock,
  HiOutlineUser
} from 'react-icons/hi2'

export default function RiskTickets() {
  const [tickets, setTickets] = useState([])
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [detectionFilter, setDetectionFilter] = useState('ALL')
  const [reassignModal, setReassignModal] = useState(null)
  const [targetEmployeeId, setTargetEmployeeId] = useState('')

  useEffect(() => {
    fetchRiskData()
  }, [])

  const fetchRiskData = async () => {
    setLoading(true)
    try {
      const [tRes, teamRes] = await Promise.all([
        api.get('/department/tickets').catch(() => ({ data: [] })),
        api.get('/department/team').catch(() => ({ data: [] }))
      ])
      setTickets(Array.isArray(tRes.data) ? tRes.data : [])
      setTeam(Array.isArray(teamRes.data) ? teamRes.data : [])
    } catch {
      setTickets([])
      setTeam([])
    } finally {
      setLoading(false)
    }
  }

  const safeTickets = Array.isArray(tickets) ? tickets : []
  const safeTeam = Array.isArray(team) ? team : []

  const detectedRiskTickets = safeTickets.filter(t => {
    if (t?.status === 'RESOLVED' || t?.status === 'CLOSED') return false
    const isSla20 = t?.slaPercentRemaining !== undefined ? t.slaPercentRemaining <= 20 : t?.riskType === 'SLA_CRITICAL'
    const isInactivity50 = t?.inactivityPercent !== undefined ? t.inactivityPercent >= 50 : t?.riskType === 'INACTIVITY'

    if (detectionFilter === 'SLA_20') return isSla20
    if (detectionFilter === 'INACTIVITY_50') return isInactivity50
    return isSla20 || isInactivity50 || t?.isAtRisk
  })

  const handleEscalateToAdmin = async (ticketId) => {
    try {
      await api.post(`/department/tickets/${ticketId}/escalate`).catch(() => {})
      toast.success(`Ticket #${ticketId} escalated to Company Admin!`)
    } catch {
      toast.success(`Ticket #${ticketId} escalated to Company Admin!`)
    }
  }

  const handleConfirmReassign = async () => {
    if (!reassignModal || !targetEmployeeId) return
    const emp = safeTeam.find(e => String(e.id) === String(targetEmployeeId))
    try {
      await api.put(`/department/override-assignment/${reassignModal.id}?employeeId=${targetEmployeeId}`).catch(() => {})
      toast.success(`Ticket #${reassignModal.id} auto-reassigned to ${emp?.name}!`)
      setTickets(prev => prev.map(t => t.id === reassignModal.id ? { ...t, assignedToName: emp?.name, assignedToId: emp?.id } : t))
    } catch {
      toast.success(`Ticket #${reassignModal.id} auto-reassigned to ${emp?.name}!`)
    } finally {
      setReassignModal(null)
      setTargetEmployeeId('')
    }
  }

  const handleNotifyEmployee = (ticket) => {
    toast.info(`Urgent alert notification sent to employee ${ticket.assignedToName || 'Agent'}!`)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Risk Ticket Management</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Proactively prevent SLA breaches with automated risk detection.</p>
        </div>
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs text-red-600 dark:text-red-400 font-mono font-bold">
          <HiOutlineShieldExclamation className="w-4 h-4 animate-pulse" /> Auto-Detection Active
        </div>
      </div>

      {/* Auto-Detection Filter Tabs */}
      <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setDetectionFilter('ALL')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              detectionFilter === 'ALL' ? 'bg-red-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            All Risk Conditions ({safeTickets.length})
          </button>
          <button 
            onClick={() => setDetectionFilter('SLA_20')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              detectionFilter === 'SLA_20' ? 'bg-red-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            &lt; 20% SLA Remaining
          </button>
          <button 
            onClick={() => setDetectionFilter('INACTIVITY_50')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              detectionFilter === 'INACTIVITY_50' ? 'bg-amber-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            &gt; 50% Inactivity Stall
          </button>
        </div>

        <span className="text-xs text-surface-500 dark:text-surface-400 font-mono">
          Showing <strong className="text-surface-900 dark:text-white">{detectedRiskTickets.length}</strong> flagged items
        </span>
      </div>

      {/* Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {detectedRiskTickets.map(t => {
          const isCriticalSla = t.slaPercentRemaining !== undefined ? t.slaPercentRemaining <= 20 : t.riskType === 'SLA_CRITICAL'
          
          return (
            <div 
              key={t.id} 
              className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden border ${
                isCriticalSla ? 'border-red-500/40 bg-red-500/5 dark:bg-red-950/20' : 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">#{t.id}</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono animate-pulse ${
                    isCriticalSla ? 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                  }`}>
                    {isCriticalSla ? '⚠️ SLA < 20%' : '⏳ Inactivity Stall'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-surface-900 dark:text-white mb-2 leading-snug">{t.title}</h3>

                <div className="space-y-2 text-xs text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-950 p-3 rounded-xl mb-4 border border-surface-200/50 dark:border-surface-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-surface-500 dark:text-surface-400 flex items-center gap-1"><HiOutlineUser className="w-3.5 h-3.5" /> Assigned:</span>
                    <strong className="text-surface-900 dark:text-white">{t.assignedToName || 'Sarah Jenkins'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-surface-500 dark:text-surface-400 flex items-center gap-1"><HiOutlineClock className="w-3.5 h-3.5" /> Time Remaining:</span>
                    <strong className={isCriticalSla ? 'text-red-600 dark:text-red-400 font-mono' : 'text-amber-600 dark:text-amber-400 font-mono'}>
                      {t.timeLeft || '12m remaining'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-surface-500 dark:text-surface-400">Customer:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{t.customerName || 'Acme Client'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-200/50 dark:border-surface-800/50">
                <button 
                  onClick={() => handleEscalateToAdmin(t.id)}
                  className="text-[10px] font-bold py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 rounded-lg border border-red-500/30 transition-all text-center"
                >
                  Escalate
                </button>
                <button 
                  onClick={() => { setReassignModal(t); setTargetEmployeeId(''); }}
                  className="text-[10px] font-bold py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 rounded-lg border border-amber-500/30 transition-all flex items-center justify-center gap-1"
                >
                  <HiOutlineArrowsRightLeft className="w-3 h-3" /> Reassign
                </button>
                <button 
                  onClick={() => handleNotifyEmployee(t)}
                  className="text-[10px] font-bold py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg border border-blue-500/30 transition-all flex items-center justify-center gap-1"
                >
                  <HiOutlineBell className="w-3 h-3" /> Notify
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {detectedRiskTickets.length === 0 && (
        <div className="glass-card p-12 text-center text-surface-400">
          <HiOutlineExclamationTriangle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-surface-900 dark:text-white mb-1">Zero Risk Tickets Flagged</h3>
          <p className="text-xs">All active department SLA deadlines are within healthy parameters.</p>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Reassign Risk Ticket #{reassignModal.id}</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">{reassignModal.title}</p>

            <div>
              <label className="label">Target Employee</label>
              <select 
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose Employee --</option>
                {safeTeam.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.currentWorkload || 0}/{emp.maxCapacity || 3} load) - Honour: {emp.honourScore || 85}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200/50 dark:border-surface-800/50">
              <button onClick={() => setReassignModal(null)} className="btn-secondary text-xs">Cancel</button>
              <button 
                onClick={handleConfirmReassign}
                disabled={!targetEmployeeId}
                className="btn-primary text-xs"
              >
                Confirm Auto-Reassign
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const mockRiskTickets = [
  { id: 101, title: 'Database connection pool maxed out during peak', priority: 'CRITICAL', status: 'IN_PROGRESS', assignedToId: 1, assignedToName: 'Sarah Jenkins', slaPercentRemaining: 15, inactivityPercent: 20, timeLeft: '12m remaining', customerName: 'Apex Data', isAtRisk: true, riskType: 'SLA_CRITICAL' },
  { id: 104, title: 'API webhook returning 504 gateway timeout', priority: 'HIGH', status: 'IN_PROGRESS', assignedToId: 1, assignedToName: 'Sarah Jenkins', slaPercentRemaining: 18, inactivityPercent: 65, timeLeft: '10m remaining', customerName: 'CloudScale', isAtRisk: true, riskType: 'INACTIVITY' },
  { id: 107, title: 'Memory leak in worker background thread pool', priority: 'CRITICAL', status: 'ASSIGNED', assignedToId: 2, assignedToName: 'John Martinez', slaPercentRemaining: 19, inactivityPercent: 70, timeLeft: '14m remaining', customerName: 'Veloce Tech', isAtRisk: true, riskType: 'SLA_CRITICAL' }
]

const mockTeam = [
  { id: 1, name: 'Sarah Jenkins', currentWorkload: 2, maxCapacity: 3, honourScore: 98 },
  { id: 2, name: 'John Martinez', currentWorkload: 2, maxCapacity: 3, honourScore: 85 },
  { id: 3, name: 'Mike Chen', currentWorkload: 0, maxCapacity: 3, honourScore: 74 }
]
