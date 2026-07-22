import { useState, useEffect } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import api from '../../api/axios'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function PlatformAnalytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {})
  }, [])

  if (!stats) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  const cards = [
    { label: 'Total Companies', value: stats.totalCompanies, color: 'from-primary-500 to-primary-600' },
    { label: 'Active Companies', value: stats.activeCompanies, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Pending Approval', value: stats.pendingCompanies, color: 'from-amber-500 to-amber-600' },
    { label: 'Total Tickets', value: stats.totalTickets, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Employees', value: stats.totalEmployees, color: 'from-violet-500 to-violet-600' },
    { label: 'Total Customers', value: stats.totalCustomers, color: 'from-rose-500 to-rose-600' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-title">Platform Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(c => (
          <div key={c.label} className="glass-card p-5 text-center">
            <div className={`text-3xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</div>
            <p className="text-xs text-surface-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
