import { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { BarChart3, Calendar, Clock, TrendingUp, Target, Award } from 'lucide-react'

const StatsView = () => {
  const categoryStats = useAppStore((state) => state.categoryStats)
  const goalProgress = useAppStore((state) => state.goalProgress)
  const streakData = useAppStore((state) => state.streakData)
  const timeEntries = useAppStore((state) => state.timeEntries)
  const loadingStats = useAppStore((state) => state.loadingStats)
  const loadingTimeEntries = useAppStore((state) => state.loadingTimeEntries)

  const [selectedPeriod, setSelectedPeriod] = useState('month') // week, month, all

  // Helper function for date formatting
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Filter data based on selected period using useMemo for performance
  const { filteredTimeEntries, filteredCategoryStats, totalHours, activeDays, averageHoursPerDay } = useMemo(() => {
    console.log(`StatsView::useMemo::Filtering data for period: ${selectedPeriod}`)

    let filteredEntries = []
    if (selectedPeriod === 'all') {
      filteredEntries = timeEntries.filter(entry => true) // No date filtering for 'all'
    }
    else {
      let startDate = null
      let endDate = null

      if (selectedPeriod === 'week') {
        const today = new Date()
        const firstDay = new Date(today)
        const lastDay = new Date(today)

        firstDay.setDate(today.getDate() - today.getDay())
        lastDay.setDate(today.getDate() + (6 - today.getDay()))

        startDate = firstDay.toISOString().split('T')[0]
        endDate = lastDay.toISOString().split('T')[0]
      } else if (selectedPeriod === 'month') {
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

        startDate = firstDay.toISOString().split('T')[0]
        endDate = lastDay.toISOString().split('T')[0]
      }

      // Filter time entries for the selected period
      filteredEntries = timeEntries.filter(entry =>
        entry.date >= startDate && entry.date <= endDate
      )
    }

    // Calculate category stats from filtered time entries
    const categoryTotals = {}
    filteredEntries.forEach(entry => {
      if (!categoryTotals[entry.category_id]) {
        const category = categoryStats.find(cat => cat.category_id === entry.category_id)
        categoryTotals[entry.category_id] = {
          category_id: entry.category_id,
          category_name: entry.category_name || (category ? category.category_name : 'Unknown'),
          name: entry.category_name || (category ? category.category_name : 'Unknown'),
          color: entry.color || (category ? category.color : '#6B7280'),
          total_hours: 0,
          active_days: new Set()
        }
      }
      categoryTotals[entry.category_id].total_hours += entry.duration_hours
      categoryTotals[entry.category_id].active_days.add(entry.date)
    })

    const filteredStats = Object.values(categoryTotals).map(stat => ({
      ...stat,
      active_days: stat.active_days.size
    }))

    const total = filteredStats.reduce((sum, stat) => sum + stat.total_hours, 0)
    const active = Math.max(...filteredStats.map(stat => stat.active_days), 0)

    return {
      filteredTimeEntries: filteredEntries,
      filteredCategoryStats: filteredStats,
      totalHours: total,
      activeDays: active,
      averageHoursPerDay: active > 0 ? total / active : 0
    }
  }, [selectedPeriod, timeEntries, categoryStats])

  // Calculate weekly breakdown using useMemo
  const weeklyData = useMemo(() => {
    const weeklyBreakdown = {}
    filteredTimeEntries.forEach(entry => {
      const date = new Date(entry.date)
      const week = getWeekKey(date)
      if (!weeklyBreakdown[week]) {
        weeklyBreakdown[week] = { week, total: 0, entries: [] }
      }
      weeklyBreakdown[week].total += entry.duration_hours
      weeklyBreakdown[week].entries.push(entry)
    })

    return Object.values(weeklyBreakdown).sort((a, b) => new Date(a.week) - new Date(b.week))
  }, [filteredTimeEntries])

  function getWeekKey(date) {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    return startOfWeek.toISOString().split('T')[0]
  }

  // Calculate goal completion percentages using useMemo
  const goalCompletionStats = useMemo(() => {
    const stats = {}
    goalProgress.forEach(progress => {
      if (!stats[progress.goal_id]) {
        stats[progress.goal_id] = {
          title: progress.title,
          categories: [],
          averageProgress: 0
        }
      }
      stats[progress.goal_id].categories.push(progress)
    })

    Object.values(stats).forEach(goal => {
      goal.averageProgress = goal.categories.reduce((sum, cat) => sum + cat.progress_percentage, 0) / goal.categories.length
    })

    return stats
  }, [goalProgress])

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze your productivity patterns and progress
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {['week', 'month', 'all'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${selectedPeriod === period
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {period === 'all' ? 'All Time' : `This ${period}`}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalHours.toFixed(1)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Days</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeDays}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg/Day</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {averageHoursPerDay.toFixed(1)}h
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streakData.currentStreak}
              </p>
            </div>
            <Award className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h2>
          </div>
          <div className="p-6">
            {filteredCategoryStats.filter(stat => stat.total_hours > 0).length > 0 ? (
              <div className="space-y-4">
                {filteredCategoryStats
                  .filter(stat => stat.total_hours > 0)
                  .sort((a, b) => b.total_hours - a.total_hours)
                  .map((stat) => {
                    const percentage = totalHours > 0 ? (stat.total_hours / totalHours) * 100 : 0
                    return (
                      <div key={stat.category_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stat.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {stat.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {stat.total_hours.toFixed(1)}h
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: stat.color,
                              width: `${percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No data for selected period</p>
              </div>
            )}
          </div>
        </div>

        {/* Goal Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Goal Progress</h2>
          </div>
          <div className="p-6">
            {Object.values(goalCompletionStats).length > 0 ? (
              <div className="space-y-6">
                {Object.values(goalCompletionStats).map((goal) => (
                  <div key={goal.title} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">{goal.title}</h3>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {goal.averageProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {goal.categories.map((category) => (
                        <div key={category.category_id} className="flex items-center gap-3">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.category_color }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                            {category.category_name}
                          </span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {category.completed_hours.toFixed(1)}h / {category.target_hours}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No active goals</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Trends */}
      {selectedPeriod !== 'week' && weeklyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Trends</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {weeklyData.slice(-8).map((week) => {
                const maxHours = Math.max(...weeklyData.map(w => w.total))
                const percentage = maxHours > 0 ? (week.total / maxHours) * 100 : 0

                return (
                  <div key={week.week} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Week of {formatDate(new Date(week.week))}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {week.total.toFixed(1)}h
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Streak Information */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Streak Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {streakData.currentStreak}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {streakData.longestStreak}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {streakData.totalActiveDays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Active Days</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsView
