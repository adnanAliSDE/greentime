import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Sidebar from './components/Sidebar'

import Dashboard from './components/Dashboard'
import CalendarView from './components/CalendarView'

import GoalsView from './components/GoalsView'
import CategoriesView from './components/CategoriesView'

import StatsView from './components/StatsView'
import { Loader2 } from 'lucide-react'

function App() {
  const { 
    activeView, 
    darkMode, 
    loadingCategories,
    loadingGoals,
    loadingTimeEntries
  } = useAppStore()

  const isLoading = loadingCategories || loadingGoals || loadingTimeEntries

  useEffect(() => {
    // Only initialize once when the component mounts
    const { initialized, initializeApp } = useAppStore.getState()
    if (!initialized) {
      initializeApp()
    }
  }, []) // Empty dependency array - only run once on mount

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />
      case 'calendar':
        return <CalendarView />
      case 'goals':
        return <GoalsView />
      case 'categories':
        return <CategoriesView />
      case 'stats':
        return <StatsView />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex w-full bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600 dark:text-gray-400">Loading GreenTime...</p>
              </div>
            </div>
          ) : (
            renderView()
          )}
        </main>
      </div>
    </div>
  )
}

export default App
