import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Plus, Target, Edit, Trash2, Calendar, TrendingUp } from 'lucide-react'
import GoalModal from './modals/GoalModal'

const GoalsView = () => {
  const { goals, goalProgress, deleteGoal } = useAppStore()
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState(null)

  const handleEditGoal = (goal) => {
    setGoalToEdit(goal)
    setShowGoalModal(true)
  }

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goalId)
      } catch (error) {
        console.error('Failed to delete goal:', error)
        alert('Failed to delete goal. Please try again.')
      }
    }
  }

  const handleAddGoal = () => {
    setGoalToEdit(null)
    setShowGoalModal(true)
  }

  // Group goal progress by goal
  const goalProgressMap = {}
  goalProgress.forEach(progress => {
    if (!goalProgressMap[progress.goal_id]) {
      goalProgressMap[progress.goal_id] = {
        title: progress.title,
        categories: []
      }
    }
    goalProgressMap[progress.goal_id].categories.push(progress)
  })

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Set and track your productivity goals
          </p>
        </div>
        
        <button
          onClick={handleAddGoal}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Goal
        </button>
      </div>

      {/* Goals List */}
      {goals.length > 0 ? (
        <div className="space-y-6">
          {goals.map((goal) => {
            const progress = goalProgressMap[goal.id]
            const totalProgress = progress ? 
              progress.categories.reduce((sum, cat) => sum + cat.progress_percentage, 0) / progress.categories.length : 0

            return (
              <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Goal Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {goal.title}
                        </h3>
                      </div>
                      
                      {goal.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {goal.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {goal.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Started: {new Date(goal.start_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {goal.end_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Ends: {new Date(goal.end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-lg font-bold">{totalProgress.toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Overall</p>
                      </div>
                      
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit goal"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Goal Progress */}
                <div className="p-6">
                  {progress && progress.categories.length > 0 ? (
                    <div className="space-y-4">
                      {progress.categories.map((categoryProgress) => (
                        <div key={categoryProgress.category_id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: categoryProgress.category_color }}
                              />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {categoryProgress.category_name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {categoryProgress.completed_hours.toFixed(1)}h / {categoryProgress.target_hours}h
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                ({categoryProgress.progress_percentage.toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full transition-all duration-300"
                              style={{ 
                                backgroundColor: categoryProgress.category_color,
                                width: `${Math.min(categoryProgress.progress_percentage, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No progress data available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Start logging time to see progress</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No goals yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create your first goal to start tracking your progress towards specific productivity targets.
          </p>
          <button
            onClick={handleAddGoal}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <GoalModal
          isOpen={showGoalModal}
          onClose={() => {
            setShowGoalModal(false)
            setGoalToEdit(null)
          }}
          goalToEdit={goalToEdit}
        />
      )}
    </div>
  )
}

export default GoalsView
