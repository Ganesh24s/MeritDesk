import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import api from '../../api/axios'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function EmployeePerformance() {
  const [honour, setHonour] = useState(null)
  const [performance, setPerformance] = useState(null)

  useEffect(() => {
    api.get('/employee/honour').then(r => setHonour(r.data))
    api.get('/employee/performance').then(r => setPerformance(r.data))
  }, [])

  if (!honour || !performance) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  const levelColor = { 'Legend': 'from-amber-400 to-amber-600', 'Trusted': 'from-emerald-400 to-emerald-600', 'Reliable': 'from-blue-400 to-blue-600', 'Needs Improvement': 'from-orange-400 to-orange-600', 'Under Review': 'from-red-400 to-red-600' }

  const chartData = {
    labels: honour.history?.slice().reverse().map((_, i) => `${i + 1}`) || [],
    datasets: [{
      label: 'Honour Score',
      data: honour.history?.slice().reverse().map(h => h.scoreAfterChange) || [],
      borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointRadius: 3
    }]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-title">My Performance</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-6 text-center col-span-1">
          <div className={`text-5xl font-bold bg-gradient-to-r ${levelColor[honour.level] || 'from-primary-400 to-primary-600'} bg-clip-text text-transparent`}>
            {honour.currentScore?.toFixed(0)}
          </div>
          <p className="text-lg font-semibold mt-2">{honour.level}</p>
          <p className="text-xs text-surface-400 mt-1">Honour Score</p>
        </div>

        <div className="glass-card p-6 col-span-2">
          <h3 className="font-semibold mb-3">Score Trend</h3>
          <Line data={chartData} options={{ scales: { y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } }, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card p-5 text-center"><div className="text-2xl font-bold text-primary-500">{performance.currentWorkload}</div><p className="text-xs text-surface-500">Active Load</p></div>
        <div className="glass-card p-5 text-center"><div className="text-2xl font-bold text-emerald-500">{performance.maxCapacity}</div><p className="text-xs text-surface-500">Max Capacity</p></div>
        <div className="glass-card p-5 text-center"><span className={`badge ${performance.available ? 'badge-success' : 'badge-danger'} text-sm`}>{performance.available ? 'Online' : 'Offline'}</span><p className="text-xs text-surface-500 mt-2">Status</p></div>
        <div className="glass-card p-5 text-center"><div className="text-2xl font-bold text-violet-500">{performance.skills?.length || 0}</div><p className="text-xs text-surface-500">Skills</p></div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-3">Recent Score Changes</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {honour.history?.map((h, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${h.changeAmount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {h.changeAmount > 0 ? '+' : ''}{h.changeAmount}
                </span>
                <span className="text-sm">{h.reason}</span>
              </div>
              <span className="text-xs text-surface-400">{new Date(h.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
