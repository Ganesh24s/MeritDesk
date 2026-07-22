import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineArrowUpOnSquareStack, HiOutlineQuestionMarkCircle } from 'react-icons/hi2'

export default function RaiseTicket() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    title: '', 
    description: '', 
    priority: 'LOW', 
    category: 'Software', 
    departmentId: '', 
    selectedSkills: []
  })

  // Attachment states
  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    fetchFormDependencies()
  }, [])

  const fetchFormDependencies = async () => {
    try {
      const [deptRes, skillsRes] = await Promise.all([
        api.get('/customer/departments'),
        api.get('/customer/skills')
      ])
      
      const depts = deptRes.data || []
      setDepartments(depts)
      setSkills(skillsRes.data || [])

      // Auto-select department if only one exists
      if (depts.length === 1) {
        setForm(prev => ({ ...prev, departmentId: depts[0].id }))
      } else if (depts.length > 1) {
        // Find if there's a default Support department
        const supportDept = depts.find(d => d.name.toLowerCase().includes('support'))
        if (supportDept) {
          setForm(prev => ({ ...prev, departmentId: supportDept.id }))
        } else {
          setForm(prev => ({ ...prev, departmentId: depts[0].id }))
        }
      }
    } catch {
      toast.error('Failed to load form details')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.departmentId) {
      toast.error('Please select a department')
      return
    }

    setLoading(true)
    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      category: form.category,
      departmentId: Number(form.departmentId),
      requiredSkills: form.selectedSkills.join(',')
    }

    try {
      const res = await api.post('/customer/tickets', payload)
      toast.success('Ticket created successfully!')
      // Redirect directly to ticket details page
      navigate(`/dashboard/customer-tickets/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  const toggleSkill = (skillName) => {
    setForm(prev => {
      const selected = prev.selectedSkills.includes(skillName)
        ? prev.selectedSkills.filter(s => s !== skillName)
        : [...prev.selectedSkills, skillName]
      return { ...prev, selectedSkills: selected }
    })
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setAttachments(prev => [...prev, ...files])
    toast.success(`Attached ${files.length} file(s)`)
  }

  // Priority description helper mappings
  const priorityDescriptions = {
    LOW: 'General inquiries, questions, or cosmetic bugs with no immediate operational impact.',
    MEDIUM: 'Minor issues with a workaround available, or general functionality requests.',
    HIGH: 'Significant operational impact causing disruption to standard productivity.',
    CRITICAL: 'System completely down or blocking critical operations. Response within 15 mins.'
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Raise Ticket</h1>
        <p className="text-sm text-surface-500">Submit a support request to our engineering and support departments.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="label font-bold">Ticket Title *</label>
          <input 
            type="text"
            value={form.title} 
            onChange={e => setForm({...form, title: e.target.value})} 
            required 
            className="input-field" 
            placeholder="Brief summary of the issue (e.g. Printer offline, Cannot log in)" 
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="label font-bold">Description & Steps *</label>
          <textarea 
            value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})} 
            required 
            className="input-field min-h-[140px]" 
            placeholder="Please provide details about the issue, any steps to reproduce, or error messages..." 
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Selector */}
          <div>
            <label className="label font-bold">Category *</label>
            <select 
              value={form.category} 
              onChange={e => setForm({...form, category: e.target.value})} 
              className="input-field cursor-pointer"
            >
              <option value="Network">Network / Internet Connection</option>
              <option value="Hardware">Hardware / Device Failure</option>
              <option value="Software">Software / App Bug</option>
              <option value="Account">Account / Access Credentials</option>
              <option value="Facilities">Facilities / Infrastructure</option>
              <option value="Other">Other Issues</option>
            </select>
          </div>
          
          {/* Conditional Department Selection */}
          {departments.length > 1 && (
            <div>
              <label className="label font-bold">Department Assignment *</label>
              <select 
                value={form.departmentId} 
                onChange={e => setForm({...form, departmentId: e.target.value})} 
                required 
                className="input-field cursor-pointer"
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Priority and Description Help text */}
        <div className="grid md:grid-cols-2 gap-6 bg-surface-50 dark:bg-surface-800/40 p-4 rounded-2xl border border-surface-200/50 dark:border-surface-700/50">
          <div>
            <label className="label font-bold">Service Priority *</label>
            <select 
              value={form.priority} 
              onChange={e => setForm({...form, priority: e.target.value})} 
              className="input-field cursor-pointer bg-white dark:bg-surface-800"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="flex flex-col justify-center space-y-1">
            <span className="text-[10px] font-bold text-surface-450 uppercase flex items-center gap-1.5">
              <HiOutlineQuestionMarkCircle className="w-4 h-4 text-primary-500" />
              Priority Impact Description
            </span>
            <p className="text-xs text-surface-500 italic leading-relaxed">
              {priorityDescriptions[form.priority]}
            </p>
          </div>
        </div>

        {/* Optional Skills tag buttons */}
        {skills.length > 0 && (
          <div>
            <label className="label mb-3 font-bold">Suggested Expertise Required (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <button 
                  type="button" 
                  key={s.id} 
                  onClick={() => toggleSkill(s.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.selectedSkills.includes(s.name) 
                      ? 'bg-primary-500 text-white border-primary-500 shadow-sm' 
                      : 'bg-transparent text-surface-500 border-surface-300 dark:border-surface-700 hover:border-primary-500'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File attachment upload zone */}
        <div>
          <label className="label font-bold mb-2">Attachments</label>
          <div className="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors">
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              className="hidden" 
              id="file-attachments" 
            />
            <label htmlFor="file-attachments" className="cursor-pointer space-y-2 block">
              <HiOutlineArrowUpOnSquareStack className="w-8 h-8 text-surface-400 mx-auto" />
              <p className="text-xs font-bold text-primary-500 hover:underline">Upload logs, screenshots, or documents</p>
              <p className="text-[10px] text-surface-400">Multiple files supported</p>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="mt-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-450">Attached Files:</span>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200/50">
                    {file.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button Row */}
        <div className="pt-4 border-t border-surface-200/50 dark:border-surface-700/50 flex justify-end">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard/customer-tickets')} 
            className="btn-secondary mr-3"
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary min-w-[140px]"
          >
            {loading ? 'Creating...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}
