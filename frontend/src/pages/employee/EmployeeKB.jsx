import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'

export default function EmployeeKB() {
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => { fetchArticles() }, [])

  const fetchArticles = async () => {
    try { const r = await api.get('/employee/knowledge-base'); setArticles(r.data || []) } catch {}
  }

  const handleSearch = async () => {
    if (!search.trim()) { fetchArticles(); return }
    try { const r = await api.get(`/employee/knowledge-base/search?query=${search}`); setArticles(r.data || []) } catch {}
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Knowledge Base</h1>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search articles..." className="input-field !pl-10" />
        </div>
        <button onClick={handleSearch} className="btn-secondary text-sm">Search</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {articles.map(a => (
          <div key={a.id} className="glass-card p-6">
            <h3 className="font-semibold text-lg mb-2">{a.title}</h3>
            {a.description && <p className="text-sm text-surface-400 mb-3">{a.description}</p>}
            <div className="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl text-sm mb-4 whitespace-pre-wrap">
              {a.solution}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {a.tags?.split(',').filter(Boolean).map((tag, i) => (<span key={i} className="badge badge-primary">{tag.trim()}</span>))}
            </div>
            <div className="flex items-center justify-between text-xs text-surface-400">
              <span>By {a.createdByName}</span>
              <span>{new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {articles.length === 0 && <div className="col-span-2 text-center py-10 text-surface-400">No articles found.</div>}
      </div>
    </div>
  )
}
