import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineTrophy, HiOutlineCheckCircle, HiOutlineLockClosed, HiOutlineSparkles } from 'react-icons/hi2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function EmployeeHonour() {
  const [honour, setHonour] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHonourData()
  }, [])

  const fetchHonourData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/employee/honour')
      setHonour(res.data)
    } catch {
      toast.error('Failed to load honour analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const currentScore = honour?.currentScore || 0
  const history = honour?.history || []
  const badges = honour?.badges || []
  const leaderboard = honour?.leaderboard || []
  const departmentRank = honour?.departmentRank || 1

  // Calculate progress
  const getProgressInfo = (score) => {
    if (score < 60) return { percent: (score / 60) * 100, next: 'Needs Improvement', nextScore: 60, current: 'Under Review' }
    if (score < 70) return { percent: ((score - 60) / 10) * 100, next: 'Reliable', nextScore: 70, current: 'Needs Improvement' }
    if (score < 80) return { percent: ((score - 70) / 10) * 100, next: 'Trusted', nextScore: 80, current: 'Reliable' }
    if (score < 90) return { percent: ((score - 80) / 10) * 100, next: 'Legend', nextScore: 90, current: 'Trusted' }
    return { percent: 100, next: 'Max Standing Achieved!', nextScore: 100, current: 'Legend' }
  }

  const progress = getProgressInfo(currentScore)

  const levelColor = {
    'Legend': 'from-amber-400 to-amber-600 text-amber-500 bg-amber-500/10 border-amber-500/20',
    'Trusted': 'from-emerald-400 to-emerald-600 text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    'Reliable': 'from-blue-400 to-blue-600 text-blue-500 bg-blue-500/10 border-blue-500/20',
    'Needs Improvement': 'from-orange-400 to-orange-600 text-orange-500 bg-orange-500/10 border-orange-500/20',
    'Under Review': 'from-red-400 to-red-600 text-red-500 bg-red-500/10 border-red-500/20'
  }

  const chartData = {
    labels: history.slice().reverse().map((_, i) => `Change ${i + 1}`),
    datasets: [{
      label: 'Honour Score',
      data: history.slice().reverse().map(h => h.scoreAfterChange),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4
    }]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">My Honour standing</h1>
          <p className="text-sm text-surface-500">View your Honour achievements, change log history, and department leaderboard rank.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Progress, Score Trend, History Log */}
        <div className="md:col-span-2 space-y-6">
          {/* Progress Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-surface-400 tracking-wider">Standing & Standing level</span>
                <h3 className="text-2xl font-bold text-surface-800 dark:text-surface-100 mt-0.5">{progress.current}</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-primary-500">{currentScore.toFixed(1)}</span>
                <span className="text-xs text-surface-400 block mt-0.5">/ 100</span>
              </div>
            </div>

            {/* Progress bar to next level */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-surface-400">Current Standing</span>
                <span className="text-primary-500">Next: {progress.next} ({progress.nextScore})</span>
              </div>
              <div className="w-full bg-surface-200 dark:bg-surface-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">Standing Trend Line</h3>
            <div className="h-64">
              {history.length > 0 ? (
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.05)' } },
                      x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-surface-400 text-sm">No trend history available.</div>
              )}
            </div>
          </div>

          {/* Score History log */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-base text-surface-900 dark:text-white mb-3">Honour History Log</h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-center py-6 text-surface-400 text-sm">No score changes recorded.</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/20 dark:border-surface-700/10">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-extrabold ${h.changeAmount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {h.changeAmount > 0 ? `+${h.changeAmount.toFixed(1)}` : h.changeAmount.toFixed(1)}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-surface-750 dark:text-surface-200">{h.reason}</p>
                        <p className="text-[10px] text-surface-400">Score after: {h.scoreAfterChange.toFixed(1)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-surface-450 dark:text-surface-400">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Badges, Leaderboard, Benefits */}
        <div className="space-y-6">
          {/* Badge Panel */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white">Standing Badges</h3>
            <div className="space-y-3.5">
              {badges.map((b, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    b.earned
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/25'
                      : 'bg-surface-50/50 dark:bg-surface-850/20 border-surface-200/50 dark:border-surface-700/20 opacity-70'
                  }`}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    b.earned ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-200 dark:bg-surface-800 text-surface-400'
                  }`}>
                    {b.earned ? <HiOutlineSparkles className="w-5 h-5 animate-pulse" /> : <HiOutlineLockClosed className="w-5 h-5" />}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold flex items-center gap-1.5 text-surface-800 dark:text-surface-250">
                      {b.name}
                      {b.earned && <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-full">Earned</span>}
                    </h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 leading-relaxed">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Leaderboard */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200/50 dark:border-surface-700/50 pb-2.5">
              <div>
                <h3 className="font-bold text-base text-surface-900 dark:text-white">Department Standings</h3>
                <p className="text-[10px] text-surface-400 mt-0.5">Your rank: #{departmentRank}</p>
              </div>
              <HiOutlineTrophy className="w-5 h-5 text-amber-500" />
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {leaderboard.map((user, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    user.isCurrentUser
                      ? 'bg-primary-500/10 border-primary-500/30'
                      : 'bg-surface-50/20 dark:bg-surface-800/10 border-surface-200/10 dark:border-surface-750/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-bold text-xs text-surface-400 w-5 text-center">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${user.isCurrentUser ? 'text-primary-600 dark:text-primary-400' : 'text-surface-750 dark:text-surface-200'}`}>
                        {user.name} {user.isCurrentUser && '(You)'}
                      </p>
                      <span className="text-[9px] text-surface-400 uppercase tracking-wider font-bold">{user.level}</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-surface-700 dark:text-surface-300">{user.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Locked/Unlocked Reference */}
          <div className="glass-card p-6 space-y-3">
            <h3 className="font-bold text-base text-surface-900 dark:text-white border-b border-surface-200/50 dark:border-surface-700/50 pb-2">
              Standing Levels & Perks
            </h3>
            <div className="space-y-3 text-xs">
              <div className={`flex items-start gap-2.5 ${currentScore >= 70 ? 'text-surface-800 dark:text-surface-200' : 'opacity-40'}`}>
                <HiOutlineCheckCircle className={`w-4 h-4 mt-0.5 ${currentScore >= 70 ? 'text-emerald-500' : 'text-surface-400'}`} />
                <div>
                  <h4 className="font-semibold">Focus Mode (Reliable - 70+)</h4>
                  <p className="text-[10px] text-surface-450 dark:text-surface-400 mt-0.5">Toggle notification silencing and dedicated priority work layout.</p>
                </div>
              </div>
              <div className={`flex items-start gap-2.5 ${currentScore >= 80 ? 'text-surface-800 dark:text-surface-200' : 'opacity-40'}`}>
                <HiOutlineCheckCircle className={`w-4 h-4 mt-0.5 ${currentScore >= 80 ? 'text-emerald-500' : 'text-surface-400'}`} />
                <div>
                  <h4 className="font-semibold">Overflow Access (Trusted - 80+)</h4>
                  <p className="text-[10px] text-surface-450 dark:text-surface-400 mt-0.5">Claim tickets from heavily overloaded sister departments to earn extra points.</p>
                </div>
              </div>
              <div className={`flex items-start gap-2.5 ${currentScore >= 90 ? 'text-surface-800 dark:text-surface-200' : 'opacity-40'}`}>
                <HiOutlineCheckCircle className={`w-4 h-4 mt-0.5 ${currentScore >= 90 ? 'text-emerald-500' : 'text-surface-400'}`} />
                <div>
                  <h4 className="font-semibold">Priority Assignment (Legend - 90+)</h4>
                  <p className="text-[10px] text-surface-450 dark:text-surface-400 mt-0.5">Unlock auto-assignment precedence for high-tier enterprise tickets.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
