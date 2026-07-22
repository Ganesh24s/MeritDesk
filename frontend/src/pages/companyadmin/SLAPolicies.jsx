import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlineDocumentDuplicate } from 'react-icons/hi2'

export default function SLAPolicies() {
  const [policies, setPolicies] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ priority: 'MEDIUM', responseTimeMinutes: 60, resolutionTimeMinutes: 480, category: '' })

  useEffect(() => { fetchPolicies() }, [])

  const fetchPolicies = async () => {
    try { const res = await api.get('/company/sla-policies'); setPolicies(res.data || []) }
    catch { toast.error('Failed to load SLA policies') }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/company/sla-policies', form)
      toast.success('SLA Policy saved!')
      setShowForm(false)
      setForm({ priority: 'MEDIUM', responseTimeMinutes: 60, resolutionTimeMinutes: 480, category: '' })
      fetchPolicies()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this SLA policy?')) return
    try { await api.delete(`/company/sla-policies/${id}`); toast.success('SLA policy deleted'); fetchPolicies() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete SLA policy') }
  }

  const handleInheritDefaults = async () => {
    if (!confirm('This will clone the platform default SLA policies into your company. Existing policies will not be affected. Continue?')) return
    try {
      await api.post('/company/sla-policies/inherit-defaults')
      toast.success('Default SLA policies inherited!')
      fetchPolicies()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to inherit') }
  }

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const priorityColor = (p) => {
    switch (p) {
      case 'CRITICAL': return 'badge-danger'
      case 'HIGH': return 'badge-warning'
      case 'MEDIUM': return 'badge-info'
      case 'LOW': return 'badge-neutral'
      default: return 'badge-neutral'
    }
  }

  // Group by category
  const categories = [...new Set(policies.map(p => p.category || 'Default (No Category)'))]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="section-title">SLA Policies</h1>
        <div className="flex gap-2">
          <button onClick={handleInheritDefaults} className="btn-secondary flex items-center gap-2 text-sm">
            <HiOutlineDocumentDuplicate className="w-5 h-5" /> Inherit Defaults
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
            <HiOutlinePlusCircle className="w-5 h-5" /> Add Policy
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-4 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div className="text-sm text-surface-500">
          <p>SLA policies define response and resolution deadlines per ticket priority. You can also set <strong>category-specific</strong> policies. If no category match is found for a ticket, the default (no category) policy is used as fallback.</p>
          <p className="mt-1">Use <strong>"Inherit Defaults"</strong> to clone platform-wide default policies into your company.</p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Create / Update SLA Policy</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Priority *</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input-field">
                {['LOW','MEDIUM','HIGH','CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Response Time (mins) *</label>
              <input type="number" min="1" value={form.responseTimeMinutes} onChange={e => setForm({...form, responseTimeMinutes: Number(e.target.value)})} required className="input-field" />
            </div>
            <div>
              <label className="label">Resolution Time (mins) *</label>
              <input type="number" min="1" value={form.resolutionTimeMinutes} onChange={e => setForm({...form, resolutionTimeMinutes: Number(e.target.value)})} required className="input-field" />
            </div>
            <div>
              <label className="label">Category <span className="text-surface-400">(optional)</span></label>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" placeholder="e.g. Billing, Technical" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Save Policy</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Policies grouped by category */}
      {categories.map(cat => (
        <div key={cat} className="glass-card overflow-hidden">
          <div className="p-4 border-b border-surface-200/50 dark:border-surface-700/50 bg-surface-50/50 dark:bg-surface-800/30">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-surface-500">
              {cat === 'Default (No Category)' ? '📋 Default (All Categories)' : `🏷️ ${cat}`}
            </h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Response Time</th>
                  <th>Resolution Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies
                  .filter(p => (p.category || 'Default (No Category)') === cat)
                  .map(p => (
                    <tr key={p.id}>
                      <td><span className={`badge ${priorityColor(p.priority)}`}>{p.priority}</span></td>
                      <td>
                        <span className="font-mono text-sm font-medium">{formatTime(p.responseTimeMinutes)}</span>
                        <span className="text-xs text-surface-400 ml-1">({p.responseTimeMinutes} min)</span>
                      </td>
                      <td>
                        <span className="font-mono text-sm font-medium">{formatTime(p.resolutionTimeMinutes)}</span>
                        <span className="text-xs text-surface-400 ml-1">({p.resolutionTimeMinutes} min)</span>
                      </td>
                      <td>
                        <span className={`badge ${p.active !== false ? 'badge-success' : 'badge-danger'}`}>
                          {p.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {policies.length === 0 && (
        <div className="glass-card p-8 text-center text-surface-400">
          No SLA policies configured. Create one or inherit platform defaults.
        </div>
      )}
    </div>
  )
}
