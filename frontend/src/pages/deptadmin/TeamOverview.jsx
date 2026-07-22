import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function TeamOverview() {
  const [team, setTeam] = useState([])
  const [deptInfo, setDeptInfo] = useState(null)

  useEffect(() => {
    api.get('/department/team').then(r => setTeam(r.data || []))
    api.get('/department/department-info').then(r => setDeptInfo(r.data))
  }, [])

  const honourColor = (s) => s >= 90 ? 'text-emerald-500' : s >= 80 ? 'text-blue-500' : s >= 70 ? 'text-amber-500' : s >= 60 ? 'text-orange-500' : 'text-red-500'

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-title">Team Overview</h1>

      {deptInfo && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">{deptInfo.name}</h3>
            <span className="text-sm text-surface-500">{deptInfo.employeeCount} members</span>
          </div>
          <div className="flex justify-between text-xs text-surface-500 mb-1"><span>Department Load</span><span>{deptInfo.currentLoad}/{deptInfo.capacity}</span></div>
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${deptInfo.currentLoad / deptInfo.capacity > 0.9 ? 'bg-red-500' : deptInfo.currentLoad / deptInfo.capacity > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{width: `${Math.min((deptInfo.currentLoad / deptInfo.capacity) * 100, 100)}%`}}></div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map(emp => (
          <div key={emp.id} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold">{emp.name?.charAt(0)}</div>
              <div>
                <p className="font-semibold">{emp.name}</p>
                <span className={`badge ${emp.available ? 'badge-success' : 'badge-neutral'} text-[10px]`}>{emp.available ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-surface-400 text-xs">Honour</span><p className={`font-bold ${honourColor(emp.honourScore)}`}>{emp.honourScore?.toFixed(0)}</p></div>
              <div><span className="text-surface-400 text-xs">Workload</span><p className="font-semibold">{emp.currentWorkload}/{emp.maxCapacity}</p></div>
            </div>
            {emp.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">{emp.skills.map(s => <span key={s.id} className="badge badge-info text-[10px]">{s.name}</span>)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
