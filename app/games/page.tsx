import Link from 'next/link'

const games = [
  {
    href: '/games/memory',
    icon: '🧠',
    title: 'Memory Match',
    desc: 'Flip cards and find matching pairs. Trains short-term memory.',
    gradient: 'from-blue-600 to-indigo-700',
    glow: 'shadow-blue-500/20',
    badge: 'Memory',
  },
  {
    href: '/games/typing',
    icon: '⌨️',
    title: 'Typing Speed',
    desc: 'Type real code snippets as fast as possible. Track your WPM.',
    gradient: 'from-green-600 to-emerald-700',
    glow: 'shadow-green-500/20',
    badge: 'Speed',
  },
  {
    href: '/games/quiz',
    icon: '❓',
    title: 'CS Quiz',
    desc: 'Test your CS & programming knowledge across 10 questions.',
    gradient: 'from-purple-600 to-violet-700',
    glow: 'shadow-purple-500/20',
    badge: 'Knowledge',
  },
  {
    href: '/games/flashcards',
    icon: '🃏',
    title: 'Flashcard Challenge',
    desc: 'Choose a deck (JS, DSA, React, OS) and flip through shuffled Q&A cards.',
    gradient: 'from-pink-600 to-rose-700',
    glow: 'shadow-pink-500/20',
    badge: 'Study',
  },
]

export default function GamesPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-4">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Games Zone</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Level Up Your Brain 🎮</h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">Take productive breaks between study sessions. These games are designed to sharpen your developer skills.</p>
      </div>

      {/* Game cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {games.map(game => (
          <Link key={game.href} href={game.href}
            className={`group block bg-gradient-to-br ${game.gradient} rounded-2xl p-6 shadow-xl ${game.glow} hover:scale-105 transition-all duration-200`}>
            <div className="text-5xl mb-4">{game.icon}</div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-white">{game.title}</h2>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{game.badge}</span>
            </div>
            <p className="text-sm text-white/70">{game.desc}</p>
            <div className="mt-4 flex items-center gap-1 text-white/60 text-xs group-hover:text-white/90 transition-colors">
              <span>Play now</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Why play */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-300 mb-4">💡 Why Play Study Games?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '🧠', title: 'Cognitive Warmup', desc: 'Memory games prime your brain before deep study sessions.' },
            { icon: '⚡', title: 'Active Recovery', desc: 'Short games between Pomodoro rounds refresh focus.' },
            { icon: '📈', title: 'Skill Building', desc: 'CS quizzes reinforce concepts outside formal learning.' },
            { icon: '🃏', title: 'Spaced Recall', desc: 'Flashcard decks use active recall to boost long-term retention.' },
          ].map(item => (
            <div key={item.title} className="flex gap-3">
              <span className="text-xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-200">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
