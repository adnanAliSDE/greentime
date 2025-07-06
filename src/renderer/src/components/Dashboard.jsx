import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { Calendar, Clock, Target, TrendingUp, Plus, BarChart3 } from 'lucide-react'
import TimeEntryModal from './modals/TimeEntryModal'
import { useState } from 'react'

const Dashboard = () => {
  const timeEntries = useAppStore((state) => state.timeEntries)
  const categories = useAppStore((state) => state.categories)
  const goalProgress = useAppStore((state) => state.goalProgress)
  const streakData = useAppStore((state) => state.streakData)
  const categoryStats = useAppStore((state) => state.categoryStats)

  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false)

  // Get current week's date range for filtering data
  const getCurrentWeekRange = () => {
    const today = new Date()
    const firstDay = new Date(today)
    const lastDay = new Date(today)

    firstDay.setDate(today.getDate() - today.getDay())
    lastDay.setDate(today.getDate() + (6 - today.getDay()))

    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    }
  }

  const weekRange = getCurrentWeekRange()

  // Filter existing data for current week instead of refetching
  const timeEntriesThisWeek = timeEntries.filter(entry =>
    entry.date >= weekRange.start && entry.date <= weekRange.end
  )

  const categoryStatsThisWeek = categoryStats.map(stat => ({
    ...stat,
    // Since categoryStats might be from a different period, we'll calculate week stats from timeEntries
    total_hours: timeEntriesThisWeek
      .filter(entry => entry.category_id === stat.id)
      .reduce((total, entry) => total + entry.duration_hours, 0),
    active_days: [...new Set(timeEntriesThisWeek
      .filter(entry => entry.category_id === stat.id)
      .map(entry => entry.date))].length
  }))

  // Helper function for date formatting
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalHoursThisWeek = categoryStatsThisWeek.reduce((total, stat) => total + stat.total_hours, 0)
  const activeDaysThisWeek = Math.max(...categoryStatsThisWeek.map(stat => stat.active_days), 0)

  const recentTimeEntries = timeEntriesThisWeek.slice(0, 5)

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back beta Yasir! Your productivity overview.
          </p>
        </div>

        <button
          onClick={() => setShowTimeEntryModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Time
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Current Streak */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {streakData.currentStreak}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">days</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Hours This Week */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalHoursThisWeek.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">hours</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Days */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Days</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {activeDaysThisWeek}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">this week</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Active Goals */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Goals</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {goalProgress.length > 0 ? [...new Set(goalProgress.map(g => g.goal_id))].length : 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">goals</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Time Entries */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Time Entries</h2>
          </div>
          <div className="p-6">
            {recentTimeEntries.length > 0 ? (
              <div className="space-y-4">
                {recentTimeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.category_color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {entry.category_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(entry.date)} • {entry.duration_hours}h
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.description && entry.description.length > 30
                        ? `${entry.description.substring(0, 30)}...`
                        : entry.description || 'No description'
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No time entries yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Start logging your time to see entries here</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">This Week by Category</h2>
          </div>
          <div className="p-6">
            {categoryStatsThisWeek.length > 0 ? (
              <div className="space-y-4">
                {categoryStatsThisWeek
                  .filter(stat => stat.total_hours > 0)
                  .sort((a, b) => b.total_hours - a.total_hours)
                  .map((stat) => (
                    <div key={stat.id} className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stat.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {stat.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stat.total_hours.toFixed(1)}h
                          </p>
                        </div>
                        <div className="mt-1">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: stat.color,
                                width: `${Math.min((stat.total_hours / Math.max(totalHoursThisWeek, 1)) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No category data</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Log some time to see category breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Entry Modal */}
      {showTimeEntryModal && (
        <TimeEntryModal
          isOpen={showTimeEntryModal}
          onClose={() => setShowTimeEntryModal(false)}
        />
      )}
    </div>
  )
}

export default Dashboard
