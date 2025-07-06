import { useAppStore } from '../store/appStore'
import { 
  LayoutDashboard, 
  Calendar, 
  Target, 
  Bookmark, 
  BarChart3, 
  Moon, 
  Sun,
  Clock
} from 'lucide-react'

const Sidebar = () => {
  const { activeView, setActiveView, darkMode, toggleDarkMode, streakData } = useAppStore()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'categories', label: 'Categories', icon: Bookmark },
    { id: 'stats', label: 'Statistics', icon: BarChart3 }
  ]

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">GreenTime</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Time Tracker</p>
          </div>
        </div>
      </div>

      {/* Streak Info */}
      <div className="p-4 mx-4 mt-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {streakData.currentStreak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Best: {streakData.longestStreak} days
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span className="font-medium">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        
        <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
          Total Active Days: {streakData.totalActiveDays}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
