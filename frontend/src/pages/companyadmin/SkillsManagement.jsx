import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlinePlusCircle, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineUserGroup } from 'react-icons/hi2'

export default function SkillsManagement() {
  const [skills, setSkills] = useState([])
  const [employees, setEmployees] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', category: '' })
  const [showBulk, setShowBulk] = useState(false)
  const [bulkForm, setBulkForm] = useState({ employeeIds: [], skillIds: [] })
  const [tab, setTab] = useState('catalog')

  useEffect(() => {
    fetchSkills()
    api.get('/company/employees').then(r => setEmployees(r.data || []))
  }, [])

  const fetchSkills = async () => {
    try { const res = await api.get('/company/skills'); setSkills(res.data || []) }
    catch { toast.error('Failed to load skills') }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        await api.put(`/company/skills/${editId}`, form)
        toast.success('Skill updated!')
      } else {
        await api.post('/company/skills', form)
        toast.success('Skill created!')
      }
      setShowForm(false); setEditId(null); setForm({ name: '', category: '' }); fetchSkills()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
  }

  const handleEdit = (skill) => {
    setEditId(skill.id)
    setForm({ name: skill.name, category: skill.category || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this skill?')) return
    try { await api.delete(`/company/skills/${id}`); toast.success('Skill deleted'); fetchSkills() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete skill') }
  }

  const handleBulkAssign = async (e) => {
    e.preventDefault()
    try {
      await api.post('/company/skills/bulk-assign', bulkForm)
      toast.success('Skills assigned!')
      setShowBulk(false)
      setBulkForm({ employeeIds: [], skillIds: [] })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign') }
  }

  const toggleBulkSkill = (id) => {
    setBulkForm(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(id)
        ? prev.skillIds.filter(s => s !== id)
        : [...prev.skillIds, id]
    }))
  }

  const toggleBulkEmployee = (id) => {
    setBulkForm(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id)
        ? prev.employeeIds.filter(s => s !== id)
        : [...prev.employeeIds, id]
    }))
  }

  // Group skills by category for heatmap
  const categories = [...new Set(skills.map(s => s.category || 'Uncategorized'))]
  const categorySkills = categories.map(cat => ({
    name: cat,
    skills: skills.filter(s => (s.category || 'Uncategorized') === cat)
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="section-title">Skills Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(!showBulk)} className="btn-secondary flex items-center gap-2 text-sm">
            <HiOutlineUserGroup className="w-5 h-5" /> Bulk Assign
          </button>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', category: '' }) }} className="btn-primary flex items-center gap-2 text-sm">
            <HiOutlinePlusCircle className="w-5 h-5" /> Add Skill
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
        {['catalog', 'heatmap'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}`}>
            {t === 'catalog' ? '📋 Catalog' : '🗺️ Heatmap'}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSave} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">{editId ? 'Edit Skill' : 'Create Skill'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Skill Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-field" placeholder="e.g. Java, React, SQL" />
            </div>
            <div>
              <label className="label">Category</label>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" placeholder="e.g. Backend, Frontend, Database" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">{editId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Bulk Assignment Form */}
      {showBulk && (
        <form onSubmit={handleBulkAssign} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Bulk Skill Assignment</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Select Skills</label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-surface-200 dark:border-surface-700 rounded-xl p-3">
                {skills.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800">
                    <input type="checkbox" checked={bulkForm.skillIds.includes(s.id)} onChange={() => toggleBulkSkill(s.id)} className="rounded" />
                    <span className="text-sm">{s.name}</span>
                    {s.category && <span className="badge badge-info text-[10px]">{s.category}</span>}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Select Employees</label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-surface-200 dark:border-surface-700 rounded-xl p-3">
                {employees.map(e => (
                  <label key={e.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800">
                    <input type="checkbox" checked={bulkForm.employeeIds.includes(e.id)} onChange={() => toggleBulkEmployee(e.id)} className="rounded" />
                    <span className="text-sm">{e.name}</span>
                    <span className="text-xs text-surface-400">{e.departmentName}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm" disabled={!bulkForm.skillIds.length || !bulkForm.employeeIds.length}>Assign Skills</button>
            <button type="button" onClick={() => setShowBulk(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Catalog Tab */}
      {tab === 'catalog' && (
        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Skill Name</th>
                  <th>Category</th>
                  <th>Employees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-8 text-surface-400">No skills created yet</td></tr>
                ) : skills.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.category ? <span className="badge badge-info">{s.category}</span> : <span className="text-surface-400">—</span>}</td>
                    <td><span className="badge badge-primary">{s.employeeCount || 0}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(s)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-blue-500"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><HiOutlineTrash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heatmap Tab */}
      {tab === 'heatmap' && (
        <div className="space-y-4">
          {categorySkills.map(cat => (
            <div key={cat.name} className="glass-card p-5">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-surface-500">{cat.name}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.skills.map(s => {
                  const count = s.employeeCount || 0
                  const intensity = count === 0 ? 'bg-surface-100 dark:bg-surface-800 text-surface-400' :
                    count <= 2 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    count <= 5 ? 'bg-blue-200 dark:bg-blue-800/40 text-blue-800 dark:text-blue-300' :
                    count <= 10 ? 'bg-blue-400 dark:bg-blue-700/50 text-white dark:text-blue-200' :
                    'bg-blue-600 dark:bg-blue-600 text-white'
                  return (
                    <div key={s.id} className={`px-3 py-2 rounded-xl text-sm font-medium ${intensity} transition-all hover:scale-105`}>
                      {s.name} <span className="opacity-70">({count})</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {categorySkills.length === 0 && (
            <div className="glass-card p-8 text-center text-surface-400">No skills to display</div>
          )}
        </div>
      )}
    </div>
  )
}
