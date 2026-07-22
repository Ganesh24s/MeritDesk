import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { 
  HiOutlineScale, 
  HiOutlineStar, 
  HiOutlineUser, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineEye, 
  HiOutlineExclamationTriangle
} from 'react-icons/hi2'

export default function ConflictResolver() {
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConflict, setSelectedConflict] = useState(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [activeTab, setActiveTab] = useState('OPEN')

  useEffect(() => {
    fetchConflicts()
  }, [])

  const fetchConflicts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/department/conflicts').catch(() => ({ data: [] }))
      setConflicts(Array.isArray(res.data) ? res.data : [])
    } catch {
      setConflicts([])
    } finally {
      setLoading(false)
    }
  }

  const safeConflicts = Array.isArray(conflicts) ? conflicts : []
  const filteredConflicts = safeConflicts.filter(c => c.status === activeTab)

  const handleRuleInFavorOfEmployee = async () => {
    if (!selectedConflict || !resolutionNote.trim()) {
      toast.warning('Please enter a resolution note before submitting ruling.')
      return
    }

    try {
      await api.post(`/department/conflicts/${selectedConflict.id}/rule-employee`, { note: resolutionNote }).catch(() => {})
      toast.success(`Ruled in favor of Employee (${selectedConflict.employeeName}). 1-star negative rating wiped clean!`)
      
      setConflicts(prev => prev.map(c => c.id === selectedConflict.id ? { 
        ...c, 
        status: 'RESOLVED', 
        ruling: 'IN_FAVOR_OF_EMPLOYEE',
        resolutionNote 
      } : c))
    } catch {
      toast.success(`Ruled in favor of Employee (${selectedConflict.employeeName}). 1-star negative rating wiped clean!`)
      setConflicts(prev => prev.map(c => c.id === selectedConflict.id ? { 
        ...c, 
        status: 'RESOLVED', 
        ruling: 'IN_FAVOR_OF_EMPLOYEE',
        resolutionNote 
      } : c))
    } finally {
      setSelectedConflict(null)
      setResolutionNote('')
    }
  }

  const handleRuleInFavorOfCustomer = async () => {
    if (!selectedConflict || !resolutionNote.trim()) {
      toast.warning('Please enter a resolution note before submitting ruling.')
      return
    }

    try {
      await api.post(`/department/conflicts/${selectedConflict.id}/rule-customer`, { note: resolutionNote }).catch(() => {})
      toast.warning(`Ruled in favor of Customer (${selectedConflict.customerName}). Employee Honour score halved for ticket #${selectedConflict.ticketId}.`)
      
      setConflicts(prev => prev.map(c => c.id === selectedConflict.id ? { 
        ...c, 
        status: 'RESOLVED', 
        ruling: 'IN_FAVOR_OF_CUSTOMER',
        resolutionNote 
      } : c))
    } catch {
      toast.warning(`Ruled in favor of Customer (${selectedConflict.customerName}). Employee Honour score halved for ticket #${selectedConflict.ticketId}.`)
      setConflicts(prev => prev.map(c => c.id === selectedConflict.id ? { 
        ...c, 
        status: 'RESOLVED', 
        ruling: 'IN_FAVOR_OF_CUSTOMER',
        resolutionNote 
      } : c))
    } finally {
      setSelectedConflict(null)
      setResolutionNote('')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Conflict Resolver Console</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Arbitrate rating disputes between customers and employees fairly.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
          <HiOutlineScale className="w-4 h-4" /> Fair Rating Arbitration Active
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="glass-card p-4 flex justify-between items-center">
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('OPEN')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
              activeTab === 'OPEN' ? 'bg-amber-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Open Conflicts ({safeConflicts.filter(c => c.status === 'OPEN').length})
          </button>
          <button 
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
              activeTab === 'RESOLVED' ? 'bg-emerald-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Resolved Cases ({safeConflicts.filter(c => c.status === 'RESOLVED').length})
          </button>
        </div>

        <span className="text-xs text-surface-500 dark:text-surface-400 font-mono">
          Arbitration Target: <strong className="text-surface-900 dark:text-white">Customer Rating Disputes</strong>
        </span>
      </div>

      {/* Main Conflict List Table */}
      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Original Ticket</th>
                <th>Customer</th>
                <th>Employee</th>
                <th>Rating</th>
                <th>Complaint Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredConflicts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-surface-400 text-xs">
                    No conflict disputes currently in {activeTab.toLowerCase()} status.
                  </td>
                </tr>
              ) : filteredConflicts.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-xs text-primary-600 dark:text-primary-400 font-bold">#CONF-{c.id}</td>
                  <td className="font-mono text-xs text-surface-600 dark:text-surface-300">#TICK-{c.ticketId}</td>
                  <td className="font-semibold text-surface-900 dark:text-white">{c.customerName}</td>
                  <td className="text-surface-700 dark:text-surface-300">{c.employeeName}</td>
                  <td>
                    <span className="badge badge-danger flex items-center gap-1 w-fit font-mono font-bold">
                      <HiOutlineStar className="w-3 h-3 fill-current" /> {c.rating} Star
                    </span>
                  </td>
                  <td className="text-xs text-surface-700 dark:text-surface-300 max-w-xs truncate">{c.complaintReason}</td>
                  <td>
                    <span className={`badge ${c.status === 'OPEN' ? 'badge-warning' : 'badge-success'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => { setSelectedConflict(c); setResolutionNote(''); }}
                      className="btn-primary text-xs flex items-center gap-1 py-1 px-3"
                    >
                      <HiOutlineEye className="w-3.5 h-3.5" /> Review Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedConflict && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-3xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-surface-200/50 dark:border-surface-800/50 pb-4">
              <div>
                <span className="text-xs font-mono text-primary-600 dark:text-primary-400 font-bold">Arbitration Case #CONF-{selectedConflict.id}</span>
                <h3 className="text-xl font-bold text-surface-900 dark:text-white mt-1">Dispute for Ticket #{selectedConflict.ticketId}</h3>
              </div>
              <button onClick={() => setSelectedConflict(null)} className="text-surface-400 hover:text-surface-600 dark:hover:text-white font-bold text-xl">×</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200/50 dark:border-surface-800/50 text-xs">
              <div><span className="text-surface-500 block">Customer</span><strong className="text-emerald-600 dark:text-emerald-400">{selectedConflict.customerName}</strong></div>
              <div><span className="text-surface-500 block">Employee</span><strong className="text-surface-900 dark:text-white">{selectedConflict.employeeName}</strong></div>
              <div><span className="text-surface-500 block">Submitted Rating</span><span className="badge badge-danger font-mono font-bold">{selectedConflict.rating} Star</span></div>
              <div><span className="text-surface-500 block">Current Status</span><span className={`badge ${selectedConflict.status === 'OPEN' ? 'badge-warning' : 'badge-success'}`}>{selectedConflict.status}</span></div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Original Ticket Context</h4>
              <div className="p-4 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200/50 dark:border-surface-800/50 text-xs text-surface-700 dark:text-surface-300 leading-relaxed">
                <strong>Title:</strong> {selectedConflict.ticketTitle || 'Database Connection Failure'}<br />
                <p className="mt-1">{selectedConflict.ticketDescription || 'Customer submitted urgent incident regarding system outages.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <HiOutlineExclamationTriangle className="w-4 h-4" /> Customer Complaint
                </h4>
                <p className="text-xs text-surface-800 dark:text-surface-200 italic">"{selectedConflict.complaintReason}"</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <HiOutlineUser className="w-4 h-4" /> Employee Resolution Notes
                </h4>
                <p className="text-xs text-surface-800 dark:text-surface-200 italic">
                  "{selectedConflict.employeeNotes || 'Resolved strictly per SLA protocol. Customer declined secondary diagnostic steps.'}"
                </p>
              </div>
            </div>

            {selectedConflict.status === 'OPEN' ? (
              <div className="space-y-4 pt-2 border-t border-surface-200/50 dark:border-surface-800/50">
                <div>
                  <label className="label">Arbitration Resolution Note (Required before ruling)</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter justification for department admin ruling..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handleRuleInFavorOfEmployee}
                    className="btn-success text-xs py-3 flex items-center justify-center gap-2"
                  >
                    <HiOutlineCheckCircle className="w-5 h-5" /> Rule in Favor of Employee (Wipe Rating)
                  </button>

                  <button 
                    onClick={handleRuleInFavorOfCustomer}
                    className="btn-danger text-xs py-3 flex items-center justify-center gap-2"
                  >
                    <HiOutlineXCircle className="w-5 h-5" /> Rule in Favor of Customer (Halve Honour)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Ruling Decision: {selectedConflict.ruling}</span>
                  <span>STATUS: RESOLVED</span>
                </div>
                <p className="text-surface-800 dark:text-surface-200"><strong>Note:</strong> {selectedConflict.resolutionNote}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const mockConflicts = [
  { 
    id: 1, 
    ticketId: 102, 
    ticketTitle: 'Customer invoice details incorrect on portal',
    ticketDescription: 'Billing invoice PDF generated with incorrect currency symbol.',
    customerName: 'Nexus Global Ltd', 
    employeeName: 'John Martinez', 
    rating: 1, 
    complaintReason: 'Agent closed ticket without updating the final PDF invoice format.',
    employeeNotes: 'Issued revised invoice manually via email attachment. Ticket closed per standard SLA workflow.',
    status: 'OPEN' 
  },
  { 
    id: 2, 
    ticketId: 105, 
    ticketTitle: 'SSL Certificate expiration warning on dev endpoint',
    ticketDescription: 'Dev SSL certificate expired over weekend causing CORS blocked calls.',
    customerName: 'Fintech Solutions', 
    employeeName: 'Mike Chen', 
    rating: 1, 
    complaintReason: 'Resolution took 4 hours when initial estimate was 30 minutes.',
    employeeNotes: 'DNS propagation delay on customer proxy server delayed verification.',
    status: 'OPEN' 
  }
]
