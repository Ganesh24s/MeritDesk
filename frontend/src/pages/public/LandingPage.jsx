import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  HiOutlineSparkles, 
  HiOutlineTrophy, 
  HiOutlineScale, 
  HiOutlineShieldCheck, 
  HiOutlinePlus, 
  HiOutlineArrowPath, 
  HiOutlineFire
} from 'react-icons/hi2'

const TicketSolvingVisual = ({ hoveredNode, setHoveredNode }) => {
  const isDbActive = hoveredNode === 'db' || hoveredNode === 'engine';
  const isOnboardingActive = hoveredNode === 'onboarding' || hoveredNode === 'engine';
  const isAgentActive = hoveredNode === 'agent' || hoveredNode === 'engine';
  const isEngineActive = hoveredNode === 'engine';

  return (
    <svg className="w-full h-full" viewBox="110 100 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Glow Filters */}
        <filter id="svgGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="svgGlowIntense" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Gradients */}
        <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Grid Pattern Background for a high-tech Blueprint look */}
      <pattern id="techGrid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#042c21" strokeWidth="0.5" strokeOpacity="0.4" />
      </pattern>
      <rect x="110" y="100" width="600" height="300" fill="url(#techGrid)" rx="16" />

      {/* Ambient background glows */}
      <circle cx="400" cy="250" r="180" fill="#fbbf24" opacity="0.03" filter="url(#svgGlowIntense)" />
      <circle cx="520" cy="250" r="120" fill="#34d399" opacity="0.03" filter="url(#svgGlowIntense)" />

      {/* Background connector paths (Dotted structure) */}
      <path 
        d="M160 160 Q280 120 400 250" 
        stroke="#042c21" 
        strokeWidth="1.5" 
        fill="none" 
      />
      <path 
        d="M160 340 Q280 380 400 250" 
        stroke="#042c21" 
        strokeWidth="1.5" 
        fill="none" 
      />
      <path 
        d="M400 250 L520 250" 
        stroke="#042c21" 
        strokeWidth="1.5" 
        fill="none" 
      />
      <path 
        d="M520 250 Q600 180 680 180" 
        stroke="#042c21" 
        strokeWidth="1.5" 
        fill="none" 
      />
      <path 
        d="M520 250 Q600 320 680 320" 
        stroke="#042c21" 
        strokeWidth="1.5" 
        fill="none" 
      />

      {/* Interactive glowing connector overlays */}
      <path 
        d="M160 160 Q280 120 400 250" 
        stroke={isDbActive ? '#fbbf24' : '#fbbf24'} 
        strokeWidth={isDbActive ? '2.5' : '1'} 
        strokeOpacity={isDbActive ? '0.85' : '0.2'} 
        fill="none" 
        className={isDbActive ? 'animate-laser' : ''}
        style={{ transition: 'all 0.3s ease' }}
        filter={isDbActive ? 'url(#svgGlow)' : ''}
      />
      <path 
        d="M160 340 Q280 380 400 250" 
        stroke={isOnboardingActive ? '#34d399' : '#34d399'} 
        strokeWidth={isOnboardingActive ? '2.5' : '1'} 
        strokeOpacity={isOnboardingActive ? '0.85' : '0.2'} 
        fill="none" 
        className={isOnboardingActive ? 'animate-laser' : ''}
        style={{ transition: 'all 0.3s ease' }}
        filter={isOnboardingActive ? 'url(#svgGlow)' : ''}
      />
      <path 
        d="M400 250 L520 250" 
        stroke={isAgentActive ? '#34d399' : '#34d399'} 
        strokeWidth={isAgentActive ? '3' : '1.5'} 
        strokeOpacity={isAgentActive ? '0.9' : '0.35'} 
        fill="none" 
        className={isAgentActive ? 'animate-laser' : ''}
        style={{ transition: 'all 0.3s ease' }}
        filter={isAgentActive ? 'url(#svgGlow)' : ''}
      />

      {/* Glowing moving particles along paths */}
      <circle r="4" fill="#fbbf24" filter="url(#svgGlow)">
        <animateMotion dur={isDbActive ? '1.5s' : '3.5s'} repeatCount="indefinite" path="M160 160 Q280 120 400 250" />
      </circle>
      <circle r="4" fill="#34d399" filter="url(#svgGlow)">
        <animateMotion dur={isOnboardingActive ? '1.5s' : '3.5s'} repeatCount="indefinite" path="M160 340 Q280 380 400 250" />
      </circle>
      <circle r="4" fill="#34d399" filter="url(#svgGlow)">
        <animateMotion dur={isAgentActive ? '1s' : '2.5s'} repeatCount="indefinite" path="M400 250 L520 250" />
      </circle>

      {/* Nodes */}
      {/* Node 1: Critical DB Issue (Top Left) */}
      <g 
        transform="translate(160, 160)" 
        className="cursor-pointer"
        onMouseEnter={() => setHoveredNode('db')}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <circle r="32" fill="#02140f" opacity="0.9" />
        <circle r="24" fill="#042018" stroke={isDbActive ? '#fbbf24' : '#d97706'} strokeWidth="1.5" style={{ transition: 'all 0.3s' }} filter={isDbActive ? 'url(#svgGlow)' : ''} />
        {/* Glowing concentric ring */}
        <circle r="28" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" opacity={isDbActive ? '0.8' : '0.2'} style={{ transformOrigin: 'center', animation: 'spin 12s linear infinite', transition: 'opacity 0.3s' }} />
        {/* Mail Icon */}
        <path d="M-8 -6 H8 V6 H-8 Z M-8 -6 L0 0 L8 -6" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
        {/* Urgency Ping */}
        <circle cx="12" cy="-12" r="5" fill="#ef4444" className="animate-ping" />
        <circle cx="12" cy="-12" r="5" fill="#ef4444" />
      </g>

      {/* Node 2: General / Onboarding (Bottom Left) */}
      <g 
        transform="translate(160, 340)" 
        className="cursor-pointer"
        onMouseEnter={() => setHoveredNode('onboarding')}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <circle r="32" fill="#02140f" opacity="0.9" />
        <circle r="24" fill="#042018" stroke={isOnboardingActive ? '#34d399' : '#059669'} strokeWidth="1.5" style={{ transition: 'all 0.3s' }} filter={isOnboardingActive ? 'url(#svgGlow)' : ''} />
        <circle r="28" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="4 4" opacity={isOnboardingActive ? '0.8' : '0.2'} style={{ transformOrigin: 'center', animation: 'spin 12s linear infinite', transition: 'opacity 0.3s' }} />
        <path d="M-8 -6 H8 V6 H-8 Z M-8 -6 L0 0 L8 -6" stroke="#34d399" strokeWidth="1.5" fill="none" />
      </g>

      {/* Central Routing Engine Node ("M") */}
      <g 
        transform="translate(400, 250)"
        className="cursor-pointer"
        onMouseEnter={() => setHoveredNode('engine')}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <circle r="44" fill="#02140f" opacity="0.95" />
        {/* Outer glowing gear dashes */}
        <circle 
          r="36" 
          fill="none" 
          stroke={isEngineActive ? '#fbbf24' : '#f59e0b'} 
          strokeWidth="3" 
          style={{ 
            transformOrigin: '400px 250px', 
            animation: isEngineActive ? 'spin 3s linear infinite' : 'spin 16s linear infinite',
            transition: 'stroke 0.3s' 
          }} 
          strokeDasharray="12 6" 
          filter="url(#svgGlow)"
        />
        <circle r="28" fill="#042018" stroke={isEngineActive ? '#34d399' : '#10b981'} strokeWidth="2" style={{ transition: 'all 0.3s' }} />
        <text x="0" y="4" fill={isEngineActive ? '#34d399' : '#10b981'} fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="monospace" style={{ transition: 'all 0.3s' }}>M</text>
      </g>

      {/* Agent Specialist Node ("SJ") */}
      <g 
        transform="translate(520, 250)"
        className="cursor-pointer"
        onMouseEnter={() => setHoveredNode('agent')}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <circle r="36" fill="#02140f" opacity="0.9" />
        <circle r="28" fill="#042018" stroke={isAgentActive ? '#34d399' : '#10b981'} strokeWidth="2" style={{ transition: 'all 0.3s' }} filter={isAgentActive ? 'url(#svgGlow)' : ''} />
        <circle r="32" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" opacity={isAgentActive ? '0.8' : '0.3'} style={{ transformOrigin: 'center', animation: 'spin 10s linear infinite' }} />
        
        {/* Stylized Avatar in circle */}
        <circle cx="0" cy="-3" r="7" fill="#fff" opacity={isAgentActive ? '1' : '0.85'} style={{ transition: 'all 0.3s' }} />
        <path d="M-12 11 C-12 5 -6 5 0 5 C6 5 12 5 12 11" fill="#fff" opacity={isAgentActive ? '1' : '0.85'} style={{ transition: 'all 0.3s' }} />

        {/* Load indicators below */}
        <circle cx="-8" cy="18" r="2.5" fill="#34d399" className={isAgentActive ? 'animate-ping' : ''} />
        <circle cx="-8" cy="18" r="2.5" fill="#34d399" />
        <circle cx="0" cy="19.5" r="2.5" fill="#042018" stroke="#34d399" strokeWidth="1" />
        <circle cx="8" cy="18" r="2.5" fill="#042018" stroke="#34d399" strokeWidth="1" />
      </g>

      {/* Node 3: Solved Ticket (Top Right) */}
      <g transform="translate(680, 180)">
        <circle r="28" fill="#02140f" opacity="0.9" />
        <circle r="22" fill="#042018" stroke="#10b981" strokeWidth="2" filter="url(#svgGlow)" />
        <path d="M-6 0 L-2 4 L6 -4" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Node 4: Transferred / Overflow (Bottom Right) */}
      <g transform="translate(680, 320)">
        <circle r="28" fill="#02140f" opacity="0.9" />
        <circle r="22" fill="#042018" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle r="18" fill="#02140f" stroke="#d97706" strokeWidth="1.5" />
        {/* Centered cross icon */}
        <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Detailed Tooltips (Slide-in overlays on state hover) */}
      {hoveredNode === 'db' && (
        <g transform="translate(200, 130)" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <rect width="210" height="75" rx="8" fill="#042018" stroke="#fbbf24" strokeWidth="1" opacity="0.95" />
          <text x="15" y="25" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Database Incident Triggered</text>
          <text x="15" y="45" fill="#a1a1aa" fontSize="10" fontFamily="sans-serif">Requires Skill: "Database"</text>
          <text x="15" y="60" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Urgent SLA: 15m countdown</text>
        </g>
      )}

      {hoveredNode === 'onboarding' && (
        <g transform="translate(200, 270)" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <rect width="210" height="75" rx="8" fill="#042018" stroke="#34d399" strokeWidth="1" opacity="0.95" />
          <text x="15" y="25" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="sans-serif">General Support Request</text>
          <text x="15" y="45" fill="#a1a1aa" fontSize="10" fontFamily="sans-serif">Requires Skill: "General"</text>
          <text x="15" y="60" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Normal SLA: 24h limit</text>
        </g>
      )}

      {hoveredNode === 'engine' && (
        <g transform="translate(295, 120)" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <rect width="210" height="75" rx="8" fill="#042018" stroke="#fbbf24" strokeWidth="1" opacity="0.95" />
          <text x="15" y="25" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="sans-serif">MeritDesk Routing Core</text>
          <text x="15" y="45" fill="#a1a1aa" fontSize="10" fontFamily="sans-serif">Sorting tickets by workload limits</text>
          <text x="15" y="60" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Matching tags & compliance check</text>
        </g>
      )}

      {hoveredNode === 'agent' && (
        <g transform="translate(430, 120)" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <rect width="210" height="75" rx="8" fill="#042018" stroke="#34d399" strokeWidth="1" opacity="0.95" />
          <text x="15" y="25" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Sarah Jenkins (Agent)</text>
          <text x="15" y="45" fill="#a1a1aa" fontSize="10" fontFamily="sans-serif">Specialist: Database & API</text>
          <text x="15" y="60" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Load: 1/3 slots | 98 Honour Rating</text>
        </g>
      )}
    </svg>
  )
}

const SkillRoutingVisual = () => {
  const [activeRoute, setActiveRoute] = useState('billing')
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveRoute(prev => prev === 'billing' ? 'db' : prev === 'db' ? 'general' : 'billing')
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <svg className="w-full h-28 bg-[#02140f]/60 rounded-xl border border-emerald-500/10 p-2" viewBox="0 0 200 100">
      <defs>
        <filter id="miniGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path d="M20 50 Q60 50 100 50" stroke="#042c21" strokeWidth="1.5" fill="none" />
      <path d="M100 50 Q130 20 160 20" stroke="#042c21" strokeWidth="1.5" fill="none" />
      <path d="M100 50 Q130 50 160 50" stroke="#042c21" strokeWidth="1.5" fill="none" />
      <path d="M100 50 Q130 80 160 80" stroke="#042c21" strokeWidth="1.5" fill="none" />

      {activeRoute === 'billing' && <path d="M100 50 Q130 20 160 20" stroke="#fbbf24" strokeWidth="2.5" className="animate-laser" fill="none" filter="url(#miniGlow)" />}
      {activeRoute === 'db' && <path d="M100 50 Q130 50 160 50" stroke="#ef4444" strokeWidth="2.5" className="animate-laser" fill="none" filter="url(#miniGlow)" />}
      {activeRoute === 'general' && <path d="M100 50 Q130 80 160 80" stroke="#34d399" strokeWidth="2.5" className="animate-laser" fill="none" filter="url(#miniGlow)" />}
      
      <circle r="3.5" fill={activeRoute === 'billing' ? '#fbbf24' : activeRoute === 'db' ? '#ef4444' : '#34d399'} filter="url(#miniGlow)">
        <animateMotion 
          dur="1.5s" 
          repeatCount="indefinite" 
          path={
            activeRoute === 'billing' ? 'M20 50 Q60 50 100 50 Q130 20 160 20' :
            activeRoute === 'db' ? 'M20 50 Q60 50 100 50 Q130 50 160 50' :
            'M20 50 Q60 50 100 50 Q130 80 160 80'
          } 
        />
      </circle>

      <circle cx="20" cy="50" r="8" fill="#042018" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="100" cy="50" r="10" fill="#042018" stroke="#10b981" strokeWidth="1.5" />
      <text x="100" y="53.5" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">R</text>

      <circle cx="160" cy="20" r="8" fill="#042018" stroke="#fbbf24" strokeWidth="1.5" />
      <text x="175" y="23" fill="#fbbf24" fontSize="8" fontWeight="bold">Bill</text>

      <circle cx="160" cy="50" r="8" fill="#042018" stroke="#ef4444" strokeWidth="1.5" />
      <text x="175" y="53" fill="#ef4444" fontSize="8" fontWeight="bold">DB</text>

      <circle cx="160" cy="80" r="8" fill="#042018" stroke="#34d399" strokeWidth="1.5" />
      <text x="175" y="83" fill="#34d399" fontSize="8" fontWeight="bold">Gen</text>
    </svg>
  )
}

const WorkloadGaugeVisual = () => {
  const [load, setLoad] = useState(1)
  useEffect(() => {
    const timer = setInterval(() => {
      setLoad(prev => prev === 3 ? 1 : prev + 1)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <svg className="w-full h-28 bg-[#02140f]/60 rounded-xl border border-emerald-500/10 p-2" viewBox="0 0 200 100">
      <defs>
        <filter id="miniGlow2">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <path d="M 60 70 A 40 40 0 0 1 140 70" fill="none" stroke="#042c21" strokeWidth="8" strokeLinecap="round" />
      
      <path 
        d="M 60 70 A 40 40 0 0 1 140 70" 
        fill="none" 
        stroke={load === 3 ? '#ef4444' : '#10b981'} 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeDasharray={load === 1 ? '40 200' : load === 2 ? '100 200' : '200 200'} 
        style={{ transition: 'all 0.5s ease' }}
        filter="url(#miniGlow2)"
      />

      <text x="100" y="55" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
        {load}/3 TICKETS
      </text>
      <text x="100" y="68" fill={load === 3 ? '#ef4444' : '#10b981'} fontSize="8" fontWeight="bold" textAnchor="middle" className="animate-pulse">
        {load === 3 ? 'OVERFLOW ACTIVE' : 'OPTIMAL LOAD'}
      </text>

      <g transform="translate(10, 80)">
        <rect x="25" y="0" width="20" height="6" rx="3" fill={load >= 1 ? '#10b981' : '#042c21'} style={{ transition: 'fill 0.3s' }} />
        <rect x="55" y="0" width="20" height="6" rx="3" fill={load >= 2 ? '#10b981' : '#042c21'} style={{ transition: 'fill 0.3s' }} />
        <rect x="85" y="0" width="20" height="6" rx="3" fill={load >= 3 ? '#ef4444' : '#042c21'} style={{ transition: 'fill 0.3s' }} />
      </g>
    </svg>
  )
}

const HonourTrophyVisual = () => {
  return (
    <svg className="w-full h-28 bg-[#02140f]/60 rounded-xl border border-emerald-500/10 p-2" viewBox="0 0 200 100">
      <defs>
        <filter id="goldGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g transform="translate(100, 45)">
        <circle cx="-35" cy="-20" r="3" fill="#fbbf24" className="animate-ping" style={{ animationDuration: '1.5s' }} />
        <circle cx="35" cy="-15" r="2.5" fill="#fbbf24" className="animate-ping" style={{ animationDuration: '2.5s' }} />
        <circle cx="-15" cy="-30" r="2" fill="#fbbf24" className="animate-ping" style={{ animationDuration: '1.8s' }} />
        <circle cx="20" cy="-30" r="3.5" fill="#fbbf24" className="animate-ping" style={{ animationDuration: '2s' }} />
      </g>

      <g transform="translate(100, 45)" filter="url(#goldGlow)">
        <path d="M-15 25 H15 V28 H-15 Z" fill="#d97706" />
        <path d="M-8 15 H8 V25 H-8 Z" fill="#fbbf24" />
        <path d="M-20 -15 H20 V5 Q20 18 0 18 Q-20 18 -20 5 Z" fill="#fbbf24" />
        <path d="M-20 -10 C-30 -10 -30 5 -20 5" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 -10 C30 -10 30 5 20 5" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      <g transform="translate(40, 85)">
        <rect x="0" y="0" width="120" height="6" rx="3" fill="#042c21" />
        <rect x="0" y="0" width="120" height="6" rx="3" fill="#fbbf24" strokeLinecap="round" strokeDasharray="95 120" style={{ animation: 'pulse 2s infinite' }} filter="url(#goldGlow)" />
        <text x="60" y="-4" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          HONOUR SCORE: 98/100
        </text>
      </g>
    </svg>
  )
}

export default function LandingPage() {
  // --- Simulator State ---
  const [agents, setAgents] = useState([
    { id: 'a1', name: 'Sarah Jenkins', role: 'DB & API Lead', skills: ['Database', 'API'], honour: 98, load: 0, maxLoad: 3, resolved: 142 },
    { id: 'a2', name: 'John Martinez', role: 'Billing Specialist', skills: ['Billing'], honour: 85, load: 1, maxLoad: 3, resolved: 98 },
    { id: 'a3', name: 'Mike Chen', role: 'Support Agent', skills: ['General'], honour: 74, load: 1, maxLoad: 3, resolved: 64 },
  ])

  const [activeTickets, setActiveTickets] = useState([
    { id: 'init-1', title: 'Update invoice billing details', skill: 'Billing', urgency: 'Medium', agentId: 'a2', sla: '2h', timeLeft: 94 },
    { id: 'init-2', title: 'Reset password link not received', skill: 'General', urgency: 'Low', agentId: 'a3', sla: '24h', timeLeft: 1220 },
  ])

  const [logs, setLogs] = useState([
    'MeritDesk engine ready.',
    'Click a ticket on the left to test the routing algorithm...'
  ])

  const [isRouting, setIsRouting] = useState(false)
  const [routingTitle, setRoutingTitle] = useState('')
  const [activeFaq, setActiveFaq] = useState(null)
  const [honourPopups, setHonourPopups] = useState({}) // { agentId: { text, id } }
  const [hoveredNode, setHoveredNode] = useState(null)

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 5)])
  }

  // --- SLA Countdown Tick ---
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTickets(prev => prev.map(t => {
        if (t.timeLeft > 1) {
          return { ...t, timeLeft: t.timeLeft - 1 }
        }
        return { ...t, timeLeft: 0, breached: true }
      }))
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // --- Clear Popups ---
  useEffect(() => {
    const keys = Object.keys(honourPopups)
    if (keys.length > 0) {
      const timer = setTimeout(() => {
        setHonourPopups({})
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [honourPopups])

  // --- Routing Logic ---
  const handleRouteTicket = (template) => {
    if (isRouting) return
    setIsRouting(true)
    setRoutingTitle(template.title)
    addLog(`Incident triggered: "${template.title}"`)

    setTimeout(() => {
      // Find agents with skill
      let candidates = agents.filter(a => a.skills.includes(template.skill))
      if (candidates.length === 0) {
        candidates = agents.filter(a => a.skills.includes('General'))
      }

      // Check load limits
      let available = candidates.filter(a => a.load < a.maxLoad)
      let isOverflow = false

      if (available.length === 0) {
        isOverflow = true
        available = agents.filter(a => a.load < a.maxLoad)
      }

      if (available.length === 0) {
        addLog(`⚠️ Queue full. All agents at maximum workload capacity.`)
        setIsRouting(false)
        setRoutingTitle('')
        return
      }

      // Sort by load, then honour
      available.sort((x, y) => {
        if (x.load !== y.load) return x.load - y.load
        return y.honour - x.honour
      })

      const target = available[0]

      // Update state
      const ticketId = Math.random().toString()
      setActiveTickets(prev => [...prev, {
        id: ticketId,
        title: template.title,
        skill: template.skill,
        urgency: template.urgency,
        agentId: target.id,
        sla: template.sla,
        timeLeft: template.timeLeft
      }])

      setAgents(prev => prev.map(a => {
        if (a.id === target.id) {
          return { ...a, load: a.load + 1 }
        }
        return a
      }))

      addLog(`${isOverflow ? '⚠️ Overflow routed' : '✓ Assigned'} to ${target.name} (Load: ${target.load + 1}/3, Skill: ${template.skill})`)
      setIsRouting(false)
      setRoutingTitle('')
    }, 800)
  }

  // --- Resolution ---
  const handleResolveTicket = (ticketId, agentId, title) => {
    setActiveTickets(prev => prev.filter(t => t.id !== ticketId))
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        setHonourPopups({ [agentId]: { text: '+5 Honour', id: Math.random() } })
        return {
          ...a,
          load: Math.max(0, a.load - 1),
          honour: Math.min(100, a.honour + 5),
          resolved: a.resolved + 1
        }
      }
      return a
    }))
    addLog(`✓ Resolved: "${title}" by agent. SLA met. +5 Honour Score.`)
  }

  const templates = [
    { id: 'db', title: 'Database connection pool locked', skill: 'Database', urgency: 'High', sla: '15m', timeLeft: 15 },
    { id: 'billing', title: 'Customer requesting custom billing invoice', skill: 'Billing', urgency: 'Medium', sla: '2h', timeLeft: 120 },
    { id: 'api', title: 'API Webhook returning 504 gateway timeout', skill: 'API', urgency: 'High', sla: '30m', timeLeft: 30 },
    { id: 'gen', title: 'General onboarding support request', skill: 'General', urgency: 'Low', sla: '24h', timeLeft: 1440 },
  ]

  const faqs = [
    { q: 'How does the Honour system prevent cheating?', a: 'Honour scores are adjusted by customer satisfaction reviews, manager feedback, and verified SLA resolution speeds. Rapid closes without customer interactions are auto-flagged.' },
    { q: 'Can we define custom workload limits per agent?', a: 'Yes. Concurrency limits can be scaled dynamically. Senior engineers can handle more concurrent tickets, while junior agents are capped to prevent errors.' },
    { q: 'What happens when all agents reach maximum capacity?', a: 'Incoming tickets automatically enter the department overflow queue, which can be monitored by managers or routed to backup partners.' }
  ]

  return (
    <div className="min-h-screen bg-[#02140f] text-zinc-100 font-sans antialiased selection:bg-amber-500/30 selection:text-amber-300 relative overflow-x-hidden">
      {/* Background glow effects - Emerald and Gold gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-tr from-emerald-600/10 to-amber-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[25%] right-[-15%] w-[55%] h-[55%] bg-gradient-to-bl from-amber-600/10 to-emerald-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-gradient-to-r from-emerald-600/5 to-amber-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#02140f]/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="MeritDesk Logo" className="w-7 h-7 object-contain group-hover:scale-105 group-hover:rotate-6 transition-all duration-300" />
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">MeritDesk</span>
          </Link>
          <div className="hidden sm:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#simulator" className="relative py-1 hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-amber-400 after:transition-all after:duration-300 hover:after:w-full">Playground</a>
            <a href="#features" className="relative py-1 hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-emerald-400 after:transition-all after:duration-300 hover:after:w-full">Features</a>
            <a href="#pricing" className="relative py-1 hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-amber-400 after:transition-all after:duration-300 hover:after:w-full">Pricing</a>
            <a href="#faq" className="relative py-1 hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-emerald-400 after:transition-all after:duration-300 hover:after:w-full">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-zinc-400 hover:text-white hover:scale-105 transition-all">Sign In</Link>
            <Link to="/register-company" className="text-xs bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 hover:from-amber-400 hover:via-yellow-400 hover:to-emerald-400 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300">Register Company</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-6xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 text-left">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-emerald-300 hover:border-amber-500/30 transition-colors duration-300">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Designed to protect support team health
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              The ticketing system that <span className="bg-gradient-to-r from-amber-100 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">respects your team's time.</span>
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg mb-10 leading-relaxed">
              Help desks treat support teams like ticket-crunching machines. We do it differently. MeritDesk auto-routes work by skill, prevents burnout with workload limits, and rewards quality via an Honour score.
            </p>
            <div className="flex justify-start gap-4">
              <Link to="/register-company" className="bg-white text-zinc-950 hover:bg-zinc-100 hover:shadow-xl hover:shadow-white/5 hover:scale-[1.04] px-6 py-3 rounded-lg font-medium active:scale-[0.98] transition-all duration-300 text-sm">
                Get Started Free
              </Link>
              <Link to="/register-customer" className="bg-zinc-900/80 border border-white/10 hover:bg-zinc-800 hover:border-white/20 hover:scale-[1.04] px-6 py-3 rounded-lg font-medium active:scale-[0.98] transition-all duration-300 text-sm text-zinc-200">
                Sign Up as Customer
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6 flex justify-center items-center bg-[#042018]/20 border border-emerald-500/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden h-[440px]">
            <TicketSolvingVisual hoveredNode={hoveredNode} setHoveredNode={setHoveredNode} />
          </div>
        </div>
      </header>

      {/* Clean Interactive Simulator Dashboard Section */}
      <section id="simulator" className="max-w-6xl mx-auto px-6 pb-28 relative z-10">
        <div className="bg-[#042018]/75 border border-emerald-500/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl hover:border-emerald-500/20 transition-all duration-500">
          {/* Mockup Header */}
          <div className="px-6 py-4 border-b border-emerald-500/10 flex items-center justify-between bg-[#052c21]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></span>
              <span className="text-[10px] text-zinc-500 font-mono ml-4">MERITDESK ROUTING LOGIC DEMO</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-mono">
              <HiOutlineShieldCheck className="w-3.5 h-3.5" /> SLA Auto-Healing Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
            {/* Left Column: Input Panel */}
            <div className="md:col-span-4 border-r border-emerald-500/10 p-5 flex flex-col gap-3 bg-[#031b14]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">1. Trigger Support Incidents</span>
              {templates.map((t) => (
                <button
                  key={t.id}
                  disabled={isRouting}
                  onClick={() => handleRouteTicket(t)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 relative overflow-hidden group ${
                    isRouting && routingTitle === t.title
                      ? 'bg-amber-500/15 border-amber-500 scale-[0.98]'
                      : 'bg-white/[0.01] border-emerald-500/10 hover:border-amber-500/30 hover:bg-emerald-500/5 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                      t.urgency === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20 group-hover:border-red-400/40' : 
                      t.urgency === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:border-amber-400/40' : 
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-400/40'
                    }`}>
                      {t.urgency} SLA ({t.sla})
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono group-hover:text-zinc-400 transition-colors">Skill: {t.skill}</span>
                  </div>
                  <p className="font-semibold text-xs text-white truncate w-full group-hover:text-amber-300 transition-colors">{t.title}</p>
                </button>
              ))}
            </div>

            {/* Middle/Right Column: Live Routing Engine Display */}
            <div className="md:col-span-8 p-6 flex flex-col justify-between bg-[#042018]/40">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">2. Active Agent Queues & Concurrency Check</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {agents.map((a) => (
                    <div key={a.id} className="bg-white/[0.01] border border-emerald-500/10 p-4 rounded-xl relative flex flex-col justify-between min-h-[140px] hover:border-amber-500/30 hover:bg-white/[0.02] hover:scale-[1.03] transition-all duration-300 group">
                      {honourPopups[a.id] && (
                        <span className="absolute top-2 right-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded animate-float-fade">
                          {honourPopups[a.id].text}
                        </span>
                      )}
                      
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white leading-tight group-hover:text-amber-300 transition-colors">{a.name}</h4>
                          <span className="text-[9px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1 rounded transition-colors group-hover:bg-amber-500/20">{a.honour} Honour</span>
                        </div>
                        <div className="flex gap-1.5 mt-1.5">
                          {a.skills.map(s => (
                            <span key={s} className="bg-white/5 text-zinc-400 text-[8px] px-1 py-0.5 rounded border border-white/5">{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Workload Slot tracker */}
                      <div className="mt-4 pt-2 border-t border-emerald-500/10">
                        <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-1.5 font-mono">
                          <span>LOAD LIMIT</span>
                          <span className={a.load === a.maxLoad ? 'text-red-400 font-bold' : ''}>{a.load}/{a.maxLoad}</span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(slot => (
                            <span 
                              key={slot} 
                              className={`h-1.5 flex-1 rounded-sm transition-all duration-300 ${
                                slot <= a.load 
                                  ? (a.load === a.maxLoad ? 'bg-red-500 shadow-sm shadow-red-500/20' : 'bg-emerald-400 shadow-sm shadow-emerald-400/10') 
                                  : 'bg-white/5'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Routing Trace / Ticket Queue Section */}
                <div className="bg-[#02140f] border border-emerald-500/10 rounded-xl p-4 mt-2">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-3">Live Assignment Feed</div>
                  <div className="flex flex-col gap-2.5 max-h-[140px] overflow-y-auto">
                    {activeTickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-white/[0.02] border border-emerald-500/10 p-3 rounded-lg text-xs hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all duration-300 group">
                        <div className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <div>
                            <span className="font-semibold text-white block group-hover:text-amber-300 transition-colors">{t.title}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">Assigned to: {agents.find(a => a.id === t.agentId)?.name || 'Agent'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-zinc-400 font-mono">Timer: {t.timeLeft}m</span>
                          <button 
                            onClick={() => handleResolveTicket(t.id, t.agentId, t.title)}
                            className="bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500 hover:border-emerald-400 text-emerald-400 hover:text-zinc-950 font-bold text-[9px] px-2.5 py-1 rounded-md transition-all duration-300 hover:scale-105"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                    {activeTickets.length === 0 && (
                      <div className="text-center italic text-zinc-500 py-4 text-xs">No active tickets. Click an incident on the left.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Console log footer */}
              <div className="border-t border-emerald-500/10 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                <div className="flex items-center gap-2">
                  <HiOutlineArrowPath className={`w-3.5 h-3.5 ${isRouting ? 'animate-spin text-amber-400' : ''}`} />
                  <span>LOG: {logs[0]}</span>
                </div>
                <span>SLA breaches auto-flagged</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Graded Features Showcase (Bento Glass Cards) */}
      <section id="features" className="py-24 px-6 border-t border-emerald-500/10 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Features Grid</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Bending software to fit support agents.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Skill Routing */}
            <div className="bg-[#042018]/60 border border-emerald-500/10 rounded-2xl p-7 relative overflow-hidden group hover:border-amber-500/30 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="mb-5">
                  <SkillRoutingVisual />
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">Skill-Matched Routing</h3>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                  Tickets route automatically to specialists with matching tags (e.g., Billing, API, Database). Prevents uncoordinated grab-queues and speeds resolution.
                </p>
              </div>
            </div>

            {/* Card 2: Workload Balancing */}
            <div className="bg-[#042018]/60 border border-emerald-500/10 rounded-2xl p-7 relative overflow-hidden group hover:border-emerald-500/30 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="mb-5">
                  <WorkloadGaugeVisual />
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">Workload Balancing Caps</h3>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                  Set strict concurrency caps (e.g. maximum 3 active tickets). Excess tasks wait in queue or auto-overflow to departments, preventing agent fatigue.
                </p>
              </div>
            </div>

            {/* Card 3: Honour Gamification */}
            <div className="bg-[#042018]/60 border border-emerald-500/10 rounded-2xl p-7 relative overflow-hidden group hover:border-amber-500/30 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="mb-5">
                  <HonourTrophyVisual />
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">Honour Score Gamification</h3>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                  Motivate teams via reputation scores instead of hours. Agents earn points for meeting tight SLAs and satisfying client reviews, driving collaboration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophical Quote Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent border-t border-b border-emerald-500/10 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg md:text-2xl text-zinc-200 font-light italic leading-relaxed mb-6">
            "Before MeritDesk, our support Slack channel was a constant scramble of who should pick up a critical ticket. Now, routing handles it in seconds, cherry-picking is down to zero, and workload is perfectly balanced."
          </p>
          <span className="text-xs font-semibold bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent block uppercase tracking-wider">— Elena Vance, VP of Customer Success at Veloce Tech</span>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Simple Tiers</span>
          <h2 className="text-3xl font-extrabold text-white mt-2 mb-3">Pricing built to scale.</h2>
          <p className="text-zinc-400 text-sm mb-12">Free to start, pay only as you scale team capacity.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
            {/* Starter */}
            <div className="border border-emerald-500/10 p-8 rounded-2xl bg-[#042018]/50 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300">
              <h3 className="text-base font-bold text-white mb-1">Starter Team</h3>
              <div className="text-3xl font-extrabold text-white mb-4">$0 <span className="text-xs text-zinc-500 font-normal">/mo</span></div>
              <p className="text-xs md:text-sm text-zinc-400 mb-8">Up to 3 agents, basic skill tags, standard SLA tracking.</p>
              <Link to="/register-company" className="block text-center border border-emerald-500/10 hover:border-emerald-500/30 hover:bg-white/5 text-white text-xs font-semibold py-3 rounded-lg transition-all duration-300">Start Free</Link>
            </div>

            {/* Enterprise (Glow border) */}
            <div className="border border-amber-500/40 p-8 rounded-2xl bg-[#052c21] relative overflow-hidden group hover:border-amber-400 hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/10">Recommended</div>
              <h3 className="text-base font-bold text-white mb-1">Scale Growth</h3>
              <div className="text-3xl font-extrabold text-white mb-4">$24 <span className="text-xs text-zinc-500 font-normal">/agent/mo</span></div>
              <p className="text-xs md:text-sm text-zinc-400 mb-8">Unlimited agents, predictive SLA healing, overflow queues, API access.</p>
              <Link to="/register-company" className="block text-center bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 hover:from-amber-400 hover:via-yellow-400 hover:to-emerald-400 text-white text-xs font-bold py-3 rounded-lg shadow-md shadow-amber-500/15 transition-all duration-300">Start 14-day Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 border-t border-emerald-500/10 relative z-10 bg-white/[0.005]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Questions</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Frequently Asked Questions</h2>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#042018]/60 border border-emerald-500/10 rounded-xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between text-white font-bold text-sm focus:outline-none hover:bg-white/[0.01] group"
                >
                  <span className="hover:text-amber-300 group-hover:translate-x-1.5 transition-all duration-300">{faq.q}</span>
                  <span className={`text-xl transform transition-transform duration-300 ${activeFaq === index ? 'rotate-45 text-amber-400' : 'text-zinc-500'}`}>
                    <HiOutlinePlus className="w-5 h-5" />
                  </span>
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out border-emerald-500/10 ${
                    activeFaq === index 
                      ? 'max-h-[300px] border-t p-5 opacity-100' 
                      : 'max-h-0 border-t-0 p-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-500/10 py-12 px-6 bg-[#02140f] relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="MeritDesk Logo" className="w-6 h-6 object-contain" />
            <span className="font-semibold text-xs tracking-tight text-zinc-300">MeritDesk</span>
          </div>
          <p className="text-zinc-500 text-xs font-mono">© 2026 MeritDesk. Simple, fair support ticketing.</p>
        </div>
      </footer>
    </div>
  )
}
