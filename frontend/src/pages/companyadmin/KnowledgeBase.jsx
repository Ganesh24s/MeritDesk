import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlinePlusCircle, HiOutlineMagnifyingGlass, HiOutlineCheck, HiOutlineXMark, HiOutlineArchiveBox, HiOutlineEye, HiOutlineHandThumbUp, HiOutlineHandThumbDown, HiOutlinePencilSquare } from 'react-icons/hi2'

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', solution: '', tags: '' })
  const [tab, setTab] = useState('ALL') // ALL, PENDING, APPROVED, ARCHIVED

  useEffect(() => { fetchArticles() }, [])

  const fetchArticles = async () => {
    try {
      const r = await api.get('/company/knowledge-base')
      setArticles(r.data || [])
    } catch {
      toast.error('Failed to load KB articles')
    }
  }

  const handleSearch = async () => {
    if (!search.trim()) { fetchArticles(); return }
    try {
      const r = await api.get(`/company/knowledge-base/search?query=${search}`)
      setArticles(r.data || [])
    } catch {
      toast.error('Search failed')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        await api.put(`/company/knowledge-base/${editId}`, form)
        toast.success('Article updated!')
      } else {
        await api.post('/company/knowledge-base', form)
        toast.success('Article published successfully!')
      }
      setShowForm(false)
      setEditId(null)
      setForm({ title: '', description: '', solution: '', tags: '' })
      fetchArticles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    }
  }

  const handleEdit = (article) => {
    setEditId(article.id)
    setForm({
      title: article.title,
      description: article.description || '',
      solution: article.solution,
      tags: article.tags || ''
    })
    setShowForm(true)
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/company/knowledge-base/${id}/approve`)
      toast.success('Article approved!')
      fetchArticles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.put(`/company/knowledge-base/${id}/reject`)
      toast.success('Article rejected!')
      fetchArticles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    }
  }

  const handleArchive = async (id) => {
    try {
      await api.put(`/company/knowledge-base/${id}/archive`)
      toast.success('Article archived!')
      fetchArticles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive')
    }
  }

  const filteredArticles = articles.filter(a => {
    if (tab === 'ALL') return true
    return a.status === tab
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge-success'
      case 'PENDING': return 'badge-warning'
      case 'REJECTED': return 'badge-danger'
      case 'ARCHIVED': return 'badge-neutral'
      default: return 'badge-neutral'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Knowledge Base</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: '', description: '', solution: '', tags: '' }) }} className="btn-primary flex items-center gap-2 text-sm">
          <HiOutlinePlusCircle className="w-5 h-5" /> {editId ? 'Edit Article' : 'New Article'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
        {['ALL', 'PENDING', 'APPROVED', 'ARCHIVED'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search articles..." className="input-field !pl-10" />
        </div>
        <button onClick={handleSearch} className="btn-secondary text-sm">Search</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">{editId ? 'Edit Article' : 'Publish New Article'}</h3>
          <div><label className="label">Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input-field" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} /></div>
          <div><label className="label">Solution *</label><textarea value={form.solution} onChange={e => setForm({...form, solution: e.target.value})} required className="input-field" rows={4} /></div>
          <div><label className="label">Tags (comma-separated)</label><input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="input-field" placeholder="java, react, networking" /></div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">{editId ? 'Update' : 'Publish'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredArticles.length === 0 ? (
          <div className="col-span-2 glass-card p-10 text-center text-surface-400">No articles found in this category</div>
        ) : filteredArticles.map(a => (
          <div key={a.id} className="glass-card p-6 hover:scale-[1.01] transition-transform flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${getStatusBadge(a.status)}`}>{a.status}</span>
                <div className="flex items-center gap-4 text-xs text-surface-400">
                  <span className="flex items-center gap-1"><HiOutlineEye className="w-4.5 h-4.5" /> {a.viewCount || 0}</span>
                  <span className="flex items-center gap-1"><HiOutlineHandThumbUp className="w-4 h-4 text-emerald-500" /> {a.helpfulCount || 0}</span>
                  <span className="flex items-center gap-1"><HiOutlineHandThumbDown className="w-4 h-4 text-red-500" /> {a.unhelpfulCount || 0}</span>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">{a.title}</h3>
              <p className="text-sm text-surface-500 mb-3 whitespace-pre-line line-clamp-3">{a.description || a.solution}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {a.tags?.split(',').filter(Boolean).map((tag, i) => (
                  <span key={i} className="badge badge-primary text-[10px]">{tag.trim()}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-surface-100 dark:border-surface-800/80 pt-4 mt-2 flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs text-surface-400">
                <p>By {a.createdByName}</p>
                <p>{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="flex items-center gap-1.5">
                {a.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleApprove(a.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600" title="Approve">
                      <HiOutlineCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReject(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" title="Reject">
                      <HiOutlineXMark className="w-4 h-4" />
                    </button>
                  </>
                )}
                {a.status !== 'ARCHIVED' && (
                  <>
                    <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-500" title="Edit">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleArchive(a.id)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-500" title="Archive">
                      <HiOutlineArchiveBox className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
