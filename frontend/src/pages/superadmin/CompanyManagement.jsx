import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlinePauseCircle, HiOutlinePlayCircle, HiOutlineBuildingOffice2, HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlineTrash, HiOutlineSparkles } from 'react-icons/hi2'

const statusColors = {
  PENDING: 'badge-warning',
  ACTIVE: 'badge-success',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  SUSPENDED: 'badge-neutral'
}

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')

  // Detail Modal State
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => { fetchCompanies() }, [])

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/admin/companies')
      setCompanies(res.data || [])
    } catch {
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const approve = async (id) => {
    try {
      await api.put(`/admin/companies/${id}/approve`)
      toast.success('Company approved!')
      fetchCompanies()
    } catch {
      toast.error('Failed to approve')
    }
  }

  const reject = async (id) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      await api.put(`/admin/companies/${id}/reject?reason=${encodeURIComponent(reason)}`)
      toast.success('Company rejected')
      fetchCompanies()
    } catch {
      toast.error('Failed to reject')
    }
  }

  const suspend = async (id) => {
    try {
      await api.put(`/admin/companies/${id}/suspend`)
      toast.success('Company suspended')
      fetchCompanies()
    } catch {
      toast.error('Failed to suspend')
    }
  }

  const activate = async (id) => {
    try {
      await api.put(`/admin/companies/${id}/activate`)
      toast.success('Company activated')
      fetchCompanies()
    } catch {
      toast.error('Failed to activate')
    }
  }

  const handleSeedSampleCompanies = async () => {
    try {
      await api.post('/admin/companies/seed-sample-data')
      toast.success('3 Sample Companies with departments & members seeded!')
      fetchCompanies()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed sample data')
    }
  }

  const handleDeleteCompany = async (id, status) => {
    if (status !== 'SUSPENDED' && status !== 'REJECTED') {
      toast.error('Only suspended or rejected companies can be deleted.')
      return
    }
    if (!confirm('Are you sure you want to delete this company? All members, departments, tickets, and associated data will be permanently deleted.')) return
    try {
      await api.delete(`/admin/companies/${id}`)
      toast.success('Company and all members deleted!')
      fetchCompanies()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete company')
    }
  }

  const handleViewDetails = async (company) => {
    setSelectedCompany(company)
    setDetailsLoading(true)
    try {
      const res = await api.get(`/admin/companies/${company.id}/details`)
      setDetails(res.data)
    } catch {
      toast.error('Failed to load company details')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Filter logic
  const filteredCompanies = companies.filter(c => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = c.name?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term)
    const matchesStatus = !filterStatus || c.status === filterStatus
    const matchesIndustry = !filterIndustry || c.industry?.toLowerCase() === filterIndustry.toLowerCase()

    let matchesDate = true
    if (filterDateStart && filterDateEnd) {
      const created = new Date(c.createdAt || Date.now())
      matchesDate = created >= new Date(filterDateStart) && created <= new Date(filterDateEnd)
    }
    return matchesSearch && matchesStatus && matchesIndustry && matchesDate
  })

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)))

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Company Governance</h1>
          <p className="text-surface-500 text-sm mt-1">Approve registrations, manage compliance statuses, and drill down on metrics</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="badge badge-warning">{companies.filter(c => c.status === 'PENDING').length} Pending</span>
          <span className="badge badge-success">{companies.filter(c => c.status === 'ACTIVE').length} Active</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="label text-xs">Search Company</label>
          <input
            type="text"
            placeholder="Name or Email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field mt-1"
          />
        </div>
        <div>
          <label className="label text-xs">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field mt-1">
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        <div>
          <label className="label text-xs">Industry</label>
          <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} className="input-field mt-1">
            <option value="">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs">Start Date</label>
          <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="input-field mt-1" />
        </div>
        <div>
          <label className="label text-xs">End Date</label>
          <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="input-field mt-1" />
        </div>
      </div>

      {/* Companies Table */}
      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Status</th>
                <th>Employee Count</th>
                <th>Created Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-surface-400">No companies match filters</td></tr>
              ) : filteredCompanies.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold">
                        {c.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-surface-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{c.industry || '-'}</td>
                  <td><span className={`badge ${statusColors[c.status] || 'badge-neutral'}`}>{c.status}</span></td>
                  <td>👤 {c.totalEmployees} employees</td>
                  <td className="text-sm">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => handleViewDetails(c)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500" title="View Details">
                        <HiOutlineEye className="w-5 h-5" />
                      </button>
                      {c.status === 'PENDING' && (
                        <>
                          <button onClick={() => approve(c.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600" title="Approve">
                            <HiOutlineCheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => reject(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Reject">
                            <HiOutlineXCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {c.status === 'ACTIVE' && (
                        <button onClick={() => suspend(c.id)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500" title="Suspend">
                          <HiOutlinePauseCircle className="w-5 h-5" />
                        </button>
                      )}
                      {c.status === 'SUSPENDED' && (
                        <>
                          <button onClick={() => activate(c.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600" title="Reactivate">
                            <HiOutlinePlayCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDeleteCompany(c.id, c.status)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Delete Company">
                            <HiOutlineTrash className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {c.status === 'REJECTED' && (
                        <button onClick={() => handleDeleteCompany(c.id, c.status)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Delete Rejected Company">
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="glass-card max-w-5xl w-full max-h-[85vh] my-auto flex flex-col p-6 space-y-4 animate-scale-up shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-4 border-surface-200/50 dark:border-surface-700/50 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {selectedCompany.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white">{selectedCompany.name}</h2>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{selectedCompany.email} &bull; {selectedCompany.industry || 'No Industry'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="btn-secondary text-xs px-4 py-2 hover:bg-surface-200 dark:hover:bg-surface-700 transition">
                Close
              </button>
            </div>

            {/* Modal Body */}
            {detailsLoading ? (
              <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>
            ) : details && (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid md:grid-cols-2 gap-6">
                {/* Stats & Compliance */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm border-b pb-2 text-surface-900 dark:text-surface-100">Compliance & Ticket Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-100 dark:bg-surface-800/50 p-3 rounded-xl border border-surface-200/40 dark:border-surface-700/40">
                      <span className="text-xs text-surface-500 dark:text-surface-400 block font-medium">SLA Compliance</span>
                      <span className="text-lg font-extrabold text-emerald-500 mt-1 block">{(details.stats?.slaComplianceRate || 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-surface-100 dark:bg-surface-800/50 p-3 rounded-xl border border-surface-200/40 dark:border-surface-700/40">
                      <span className="text-xs text-surface-500 dark:text-surface-400 block font-medium">Total Tickets</span>
                      <span className="text-lg font-extrabold text-surface-900 dark:text-white mt-1 block">{details.stats?.totalTickets || 0}</span>
                    </div>
                    <div className="bg-surface-100 dark:bg-surface-800/50 p-3 rounded-xl border border-surface-200/40 dark:border-surface-700/40">
                      <span className="text-xs text-surface-500 dark:text-surface-400 block font-medium">Resolved Tickets</span>
                      <span className="text-lg font-extrabold text-primary-500 mt-1 block">{details.stats?.resolvedTickets || 0}</span>
                    </div>
                    <div className="bg-surface-100 dark:bg-surface-800/50 p-3 rounded-xl border border-surface-200/40 dark:border-surface-700/40">
                      <span className="text-xs text-surface-500 dark:text-surface-400 block font-medium">Active Status</span>
                      <span className={`badge ${statusColors[selectedCompany.status]} mt-1.5 inline-block text-xs px-2.5 py-0.5`}>{selectedCompany.status}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm border-b pb-2 pt-2 text-surface-900 dark:text-surface-100">Departments List</h3>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {details.departments?.length === 0 ? (
                      <p className="text-xs text-surface-400 py-2">No departments registered</p>
                    ) : details.departments?.map(dept => (
                      <div key={dept.id} className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800/50 border border-surface-200/40 dark:border-surface-700/40 text-sm">
                        <p className="font-semibold text-surface-900 dark:text-white">{dept.name}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{dept.description || 'No description'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employees list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100">Registered Team Members</h3>
                    <span className="text-xs text-surface-400 font-medium">{details.employees?.length || 0} Members</span>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {details.employees?.length === 0 ? (
                      <p className="text-xs text-surface-400 py-2">No employees registered</p>
                    ) : details.employees?.map(emp => (
                      <div key={emp.email} className="flex justify-between items-center p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800/50 border border-surface-200/40 dark:border-surface-700/40 text-sm hover:border-primary-500/30 transition">
                        <div>
                          <p className="font-semibold text-surface-900 dark:text-white">{emp.name}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">{emp.email}</p>
                          <span className="badge badge-neutral text-[9px] uppercase tracking-wider mt-1 inline-block">{emp.role}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-500 text-xs">🏆 {emp.honourScore?.toFixed(0)}</span>
                          <p className="text-[10px] mt-0.5 text-surface-400">{emp.available ? 'Available' : 'Inactive'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
