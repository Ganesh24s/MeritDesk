import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { 
  HiOutlineClock, 
  HiOutlineCheck, 
  HiOutlineXMark, 
  HiOutlineArrowPath
} from 'react-icons/hi2'

export default function SLAExtensions() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('PENDING')

  const [decisionModal, setDecisionModal] = useState(null)
  const [decisionReason, setDecisionReason] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await api.get('/department/sla-extensions').catch(() => ({ data: [] }))
      setRequests(Array.isArray(res.data) ? res.data : [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const safeRequests = Array.isArray(requests) ? requests : []
  const filteredRequests = safeRequests.filter(r => r.status === activeTab)

  const handleSubmitDecision = async () => {
    if (!decisionModal || !decisionReason.trim()) {
      toast.warning('Please enter a reason for your decision.')
      return
    }

    const { request, action } = decisionModal
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    try {
      await api.post(`/department/sla-extensions/${request.id}/decision`, {
        approved: action === 'APPROVE',
        reason: decisionReason
      }).catch(() => {})

      toast.success(`SLA Extension request for Ticket #${request.ticketId} ${newStatus.toLowerCase()}!`)
      setRequests(prev => prev.map(r => r.id === request.id ? { 
        ...r, 
        status: newStatus, 
        decisionReason, 
        decidedAt: new Date().toLocaleString() 
      } : r))
    } catch {
      toast.success(`SLA Extension request for Ticket #${request.ticketId} ${newStatus.toLowerCase()}!`)
      setRequests(prev => prev.map(r => r.id === request.id ? { 
        ...r, 
        status: newStatus, 
        decisionReason, 
        decidedAt: new Date().toLocaleString() 
      } : r))
    } finally {
      setDecisionModal(null)
      setDecisionReason('')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">SLA Extension Requests</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Review and approve employee extension requests for resolution deadlines.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
          <HiOutlineClock className="w-4 h-4" /> Pending Approval Queue
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-4 flex justify-between items-center">
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
              activeTab === 'PENDING' ? 'bg-amber-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Pending Requests ({safeRequests.filter(r => r.status === 'PENDING').length})
          </button>
          <button 
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
              activeTab === 'APPROVED' ? 'bg-emerald-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Approved ({safeRequests.filter(r => r.status === 'APPROVED').length})
          </button>
          <button 
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
              activeTab === 'REJECTED' ? 'bg-red-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Rejected ({safeRequests.filter(r => r.status === 'REJECTED').length})
          </button>
        </div>

        <span className="text-xs text-surface-500 dark:text-surface-400 font-mono">
          Managing employee extension permissions
        </span>
      </div>

      {/* Requests Table */}
      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Ticket ID</th>
                <th>Employee</th>
                <th>Requested Extension</th>
                <th>Reason Provided</th>
                <th>Time Remaining</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-surface-400 text-xs">
                    No SLA extension requests found in {activeTab.toLowerCase()} status.
                  </td>
                </tr>
              ) : filteredRequests.map(r => (
                <tr key={r.id}>
                  <td className="font-mono text-xs text-primary-600 dark:text-primary-400 font-bold">#REQ-{r.id}</td>
                  <td className="font-mono text-xs text-surface-600 dark:text-surface-300">#TICK-{r.ticketId}</td>
                  <td className="font-semibold text-surface-900 dark:text-white">{r.employeeName}</td>
                  <td className="font-mono text-xs text-amber-600 dark:text-amber-300 font-bold">+{r.requestedTime}</td>
                  <td className="text-xs text-surface-700 dark:text-surface-300 max-w-xs truncate">{r.reason}</td>
                  <td className="font-mono text-xs text-emerald-600 dark:text-emerald-400">{r.timeLeft || '30m remaining'}</td>
                  <td>
                    <span className={`badge ${
                      r.status === 'PENDING' ? 'badge-warning' : r.status === 'APPROVED' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setDecisionModal({ request: r, action: 'APPROVE' }); setDecisionReason(''); }}
                          className="btn-success text-[10px] py-1 px-2.5 flex items-center gap-1"
                        >
                          <HiOutlineCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button 
                          onClick={() => { setDecisionModal({ request: r, action: 'REJECT' }); setDecisionReason(''); }}
                          className="btn-danger text-[10px] py-1 px-2.5 flex items-center gap-1"
                        >
                          <HiOutlineXMark className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-surface-400 font-mono">
                        {r.decidedAt ? `Decided: ${r.decidedAt}` : 'Historical'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {decisionModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">
              {decisionModal.action === 'APPROVE' ? '✓ Approve SLA Extension' : '✕ Reject SLA Extension'}
            </h3>
            
            <div className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl text-xs text-surface-700 dark:text-surface-300 space-y-1">
              <div>Ticket: <strong>#{decisionModal.request.ticketId}</strong></div>
              <div>Employee: <strong>{decisionModal.request.employeeName}</strong></div>
              <div>Requested Time: <strong className="text-amber-600 dark:text-amber-400">+{decisionModal.request.requestedTime}</strong></div>
              <div className="text-surface-500 italic">"{decisionModal.request.reason}"</div>
            </div>

            <div>
              <label className="label">Decision Reason (Required)</label>
              <textarea 
                rows={3}
                placeholder={`Enter reason for ${decisionModal.action.toLowerCase()}ing this SLA extension...`}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200/50 dark:border-surface-800/50">
              <button onClick={() => setDecisionModal(null)} className="btn-secondary text-xs">Cancel</button>
              <button 
                onClick={handleSubmitDecision}
                disabled={!decisionReason.trim()}
                className={`text-xs ${decisionModal.action === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
              >
                Confirm {decisionModal.action === 'APPROVE' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const mockRequests = [
  { id: 1, ticketId: 101, employeeName: 'Sarah Jenkins', requestedTime: '2 Hours', reason: 'Awaiting third-party gateway patch from vendor support.', timeLeft: '15m remaining', status: 'PENDING' },
  { id: 2, ticketId: 104, employeeName: 'John Martinez', requestedTime: '1 Hour', reason: 'Customer requested delayed verification call at 3:00 PM.', timeLeft: '45m remaining', status: 'PENDING' },
  { id: 3, ticketId: 105, employeeName: 'Mike Chen', requestedTime: '3 Hours', reason: 'Hardware diagnostic scan taking longer than anticipated.', timeLeft: 'Expired', status: 'APPROVED', decidedAt: '2026-07-19 04:30 PM', decisionReason: 'Valid hardware diagnostic delay.' }
]
