import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Plus, Target, Edit, Trash2, Calendar, TrendingUp, Check, RotateCcw, Eye, EyeOff } from 'lucide-react'
import GoalModal from './modals/GoalModal'

const GoalsView = () => {
  const { 
    goals, 
    completedGoals, 
    goalProgress, 
    showCompletedGoals,
    deleteGoal, 
    markGoalCompleted, 
    markGoalIncomplete,
    toggleShowCompletedGoals
  } = useAppStore()
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

  const handleMarkCompleted = async (goalId) => {
    try {
      await markGoalCompleted(goalId)
    } catch (error) {
      console.error('Failed to mark goal as completed:', error)
      alert('Failed to mark goal as completed. Please try again.')
    }
  }

  const handleMarkIncomplete = async (goalId) => {
    try {
      await markGoalIncomplete(goalId)
    } catch (error) {
      console.error('Failed to mark goal as incomplete:', error)
      alert('Failed to mark goal as incomplete. Please try again.')
    }
  }

  // Group goal progress by goal
  const goalProgressMap = {}
  console.log('GoalsView: goalProgress data:', goalProgress)
  goalProgress.forEach(progress => {
    if (!goalProgressMap[progress.goal_id]) {
      goalProgressMap[progress.goal_id] = {
        title: progress.title,
        categories: []
      }
    }
    goalProgressMap[progress.goal_id].categories.push(progress)
  })
  console.log('GoalsView: goalProgressMap:', goalProgressMap)

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
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleShowCompletedGoals}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showCompletedGoals 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
            title={showCompletedGoals ? 'Hide completed goals' : 'Show completed goals'}
          >
            {showCompletedGoals ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showCompletedGoals ? 'Hide Completed' : 'Show Completed'}
            {completedGoals.length > 0 && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {completedGoals.length}
              </span>
            )}
          </button>
          
          <button
            onClick={handleAddGoal}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      </div>

      {/* Goals List */}
      {goals.length > 0 || (showCompletedGoals && completedGoals.length > 0) ? (
        <div className="space-y-6">
          {/* Active Goals */}
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
                        onClick={() => handleMarkCompleted(goal.id)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Mark as completed"
                      >
                        <Check className="w-4 h-4" />
                      </button>
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
          
          {/* Completed Goals Section */}
          {showCompletedGoals && completedGoals.length > 0 && (
            <>
              <div className="mt-8 mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Completed Goals
                  <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">
                    {completedGoals.length}
                  </span>
                </h2>
              </div>
              
              {completedGoals.map((goal) => {
                const progress = goalProgressMap[goal.id] || { categories: [] }
                const totalProgress = progress.categories.length > 0 ? 
                  progress.categories.reduce((sum, cat) => sum + cat.progress_percentage, 0) / progress.categories.length : 100

                return (
                  <div key={`completed-${goal.id}`} className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 overflow-hidden opacity-75">
                    {/* Completed Goal Header */}
                    <div className="p-6 border-b border-green-200 dark:border-green-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-through">
                              {goal.title}
                            </h3>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">
                              Completed
                            </span>
                          </div>
                          
                          {goal.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {goal.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            {goal.completed_at && (
                              <div className="flex items-center gap-1">
                                <Check className="w-4 h-4" />
                                <span>Completed: {new Date(goal.completed_at).toLocaleDateString()}</span>
                              </div>
                            )}
                            {goal.start_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Started: {new Date(goal.start_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {goal.end_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Target: {new Date(goal.end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="text-lg font-bold">100%</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
                          </div>
                          
                          <button
                            onClick={() => handleMarkIncomplete(goal.id)}
                            className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                            title="Mark as incomplete"
                          >
                            <RotateCcw className="w-4 h-4" />
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

                    {/* Completed Goal Progress */}
                    <div className="p-6">
                      {progress.categories.length > 0 ? (
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
                        <div className="text-center py-4">
                          <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">Goal completed successfully!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {completedGoals.length > 0 ? 'No active goals' : 'No goals yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {completedGoals.length > 0 
              ? 'All your goals are completed! Create new goals to continue tracking your productivity.'
              : 'Create your first goal to start tracking your progress towards specific productivity targets.'
            }
          </p>
          <button
            onClick={handleAddGoal}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            {completedGoals.length > 0 ? 'Create New Goal' : 'Create Your First Goal'}
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
