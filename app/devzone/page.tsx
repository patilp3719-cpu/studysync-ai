import Link from 'next/link'

const tools = [
  {
    href: '/devzone/dsa',
    icon: '📊',
    title: 'DSA Tracker',
    desc: 'Log LeetCode/DSA problems. Track by topic & difficulty. AI suggests what to focus on next.',
    accent: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/5',
    tag: 'Algorithms',
  },
  {
    href: '/devzone/projects',
    icon: '🗂️',
    title: 'Project Board',
    desc: 'Kanban board for personal dev projects. To Do → In Progress → Done.',
    accent: 'from-purple-500 to-violet-600',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    tag: 'Projects',
  },
  {
    href: '/devzone/interview',
    icon: '🎤',
    title: 'Interview Prep',
    desc: 'Track interview preparation topics with progress. AI generates prioritized study order.',
    accent: 'from-green-500 to-emerald-600',
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    tag: 'Career',
  },
  {
    href: '/devzone/stack',
    icon: '🔧',
    title: 'Tech Stack',
    desc: 'Document your technology skills by category and level. AI recommends what to learn next.',
    accent: 'from-orange-500 to-amber-600',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
    tag: 'Skills',
  },
]

export default function DevZonePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-4">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Dev Zone</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Developer Workspace 💻</h1>
        <p className="text-gray-400 text-sm max-w-lg">Purpose-built tools for software engineering students. Track your DSA practice, manage projects, and prepare for interviews.</p>
      </div>

      {/* Terminal-style banner */}
      <div className="bg-black rounded-2xl border border-gray-700/50 p-5 font-mono">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 text-xs ml-2">studysync ~ dev-zone</span>
        </div>
        <p className="text-green-400 text-sm">$ welcome to dev zone</p>
        <p className="text-gray-500 text-sm mt-1">→ DSA Tracker: <span className="text-cyan-400">track daily practice</span></p>
        <p className="text-gray-500 text-sm">→ Project Board: <span className="text-purple-400">manage your builds</span></p>
        <p className="text-gray-500 text-sm">→ Interview Prep: <span className="text-green-400">land your dream job</span></p>
        <p className="text-gray-500 text-sm">→ Tech Stack: <span className="text-orange-400">document your skills</span></p>
        <p className="text-gray-300 text-sm mt-2">$ <span className="animate-pulse">_</span></p>
      </div>

      {/* Tool cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map(tool => (
          <Link key={tool.href} href={tool.href}
            className={`group block ${tool.bg} border ${tool.border} rounded-2xl p-5 hover:border-opacity-60 transition-all duration-200`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{tool.icon}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r ${tool.accent} text-white`}>{tool.tag}</span>
            </div>
            <h2 className="font-bold text-white text-base mb-1">{tool.title}</h2>
            <p className="text-sm text-gray-400">{tool.desc}</p>
            <div className="mt-3 flex items-center gap-1 text-gray-500 text-xs group-hover:text-gray-300 transition-colors">
              <span>Open</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
