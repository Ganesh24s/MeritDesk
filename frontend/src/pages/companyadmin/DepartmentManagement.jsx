import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlinePlusCircle, HiOutlinePencilSquare, HiOutlineEye, HiXMark, HiOutlineTrash, HiOutlineSparkles } from 'react-icons/hi2'

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', capacity: 100 })
  const [detail, setDetail] = useState(null) // department for detail drawer

  useEffect(() => { fetchDepts(); fetchEmps() }, [])

  const fetchDepts = async () => {
    try { const res = await api.get('/company/departments'); setDepartments(res.data || []) }
    catch { toast.error('Failed to load departments') }
  }

  const fetchEmps = async () => {
    try { const res = await api.get('/company/employees'); setEmployees(res.data || []) }
    catch {}
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        await api.put(`/company/departments/${editId}`, form)
        toast.success('Department updated!')
      } else {
        await api.post('/company/departments', form)
        toast.success('Department created!')
      }
      setShowForm(false); setEditId(null); setForm({ name: '', description: '', capacity: 100 }); fetchDepts()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
  }

  const handleEdit = (d) => {
    setEditId(d.id)
    setForm({ name: d.name, description: d.description || '', capacity: d.capacity || 100 })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this department? This cannot be undone.')) return
    try { await api.delete(`/company/departments/${id}`); toast.success('Department deleted'); fetchDepts() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete department') }
  }

  const handleSeedSampleData = async () => {
    try {
      await api.post('/company/departments/seed-sample-data')
      toast.success('Sample departments and members created!')
      fetchDepts()
      fetchEmps()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed sample data')
    }
  }

  const openDetail = (dept) => {
    setDetail(dept)
  }

  const deptEmployees = detail ? employees.filter(e => e.departmentId === detail.id) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Departments</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', description: '', capacity: 100 }) }} className="btn-primary flex items-center gap-2 text-sm">
          <HiOutlinePlusCircle className="w-5 h-5" /> {editId ? 'Edit' : 'Add'} Department
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">{editId ? 'Edit Department' : 'Create Department'}</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-field" />
            </div>
            <div>
              <label className="label">Description</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">{editId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Department Table */}
      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Employees</th>
                <th>Active Tickets</th>
                <th>SLA Compliance</th>
                <th>Load</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-surface-400">No departments created yet</td></tr>
              ) : departments.map(d => {
                const loadPercent = d.capacity > 0 ? Math.min((d.currentLoad / d.capacity) * 100, 100) : 0
                const loadColor = loadPercent > 90 ? 'bg-red-500' : loadPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                const slaComp = d.slaComplianceRate ?? 100
                const slaColor = slaComp >= 90 ? 'text-emerald-500' : slaComp >= 70 ? 'text-amber-500' : 'text-red-500'
                return (
                  <tr key={d.id}>
                    <td>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-surface-400">{d.description || '—'}</p>
                    </td>
                    <td><span className="badge badge-primary">{d.employeeCount || 0}</span></td>
                    <td><span className="badge badge-warning">{d.activeTickets || 0}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${slaComp >= 90 ? 'bg-emerald-500' : slaComp >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{width: `${Math.min(slaComp, 100)}%`}}></div>
                        </div>
                        <span className={`text-sm font-semibold ${slaColor}`}>{slaComp.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div className={`h-full ${loadColor} rounded-full transition-all`} style={{width: `${loadPercent}%`}}></div>
                        </div>
                        <span className="text-xs text-surface-500">{d.currentLoad}/{d.capacity}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openDetail(d)} title="View Details"
                          className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-primary-500">
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(d)} title="Edit"
                          className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-blue-500">
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(d.id)} title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-xl bg-white dark:bg-surface-900 max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{detail.name}</h2>
              <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-surface-500 mb-6">{detail.description || 'No description'}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-2xl font-bold text-primary-500">{detail.employeeCount || 0}</p>
                <p className="text-xs text-surface-500">Employees</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-2xl font-bold text-amber-500">{detail.activeTickets || 0}</p>
                <p className="text-xs text-surface-500">Active Tickets</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-2xl font-bold text-emerald-500">{(detail.slaComplianceRate ?? 100).toFixed(1)}%</p>
                <p className="text-xs text-surface-500">SLA Compliance</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-2xl font-bold text-blue-500">{detail.currentLoad}/{detail.capacity}</p>
                <p className="text-xs text-surface-500">Load / Capacity</p>
              </div>
            </div>

            <h3 className="font-semibold mb-3">Team Members</h3>
            <div className="space-y-2">
              {deptEmployees.length === 0 ? (
                <p className="text-sm text-surface-400 text-center py-4">No employees in this department</p>
              ) : deptEmployees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {emp.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-surface-400">{emp.role?.replace('_',' ')} · Load: {emp.currentWorkload}/{emp.maxCapacity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-500">{emp.honourScore?.toFixed(0)}</p>
                    <span className={`badge text-[10px] ${emp.available ? 'badge-success' : 'badge-danger'}`}>{emp.available ? 'Available' : 'Away'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
