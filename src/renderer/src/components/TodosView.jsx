import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { Plus, Edit, Trash2, Check, X, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, Circle } from 'lucide-react'
import TodoModal from './modals/TodoModal'

const TodosView = () => {
  const { 
    todos, 
    loadingTodos, 
    currentTodoDate, 
    setCurrentTodoDate, 
    fetchTodosByDate, 
    deleteTodo, 
    markTodoCompleted, 
    markTodoIncomplete 
  } = useAppStore()

  const [showTodoModal, setShowTodoModal] = useState(false)
  const [todoToEdit, setTodoToEdit] = useState(null)

  // Load todos for current date on mount and date change
  useEffect(() => {
    fetchTodosByDate(currentTodoDate)
  }, [currentTodoDate, fetchTodosByDate])

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const goToPreviousDay = () => {
    const previousDay = new Date(currentTodoDate)
    previousDay.setDate(previousDay.getDate() - 1)
    setCurrentTodoDate(previousDay)
  }

  const goToNextDay = () => {
    const nextDay = new Date(currentTodoDate)
    nextDay.setDate(nextDay.getDate() + 1)
    setCurrentTodoDate(nextDay)
  }

  const goToToday = () => {
    setCurrentTodoDate(new Date())
  }

  const handleAddTodo = () => {
    setTodoToEdit(null)
    setShowTodoModal(true)
  }

  const handleEditTodo = (todo) => {
    setTodoToEdit(todo)
    setShowTodoModal(true)
  }

  const handleDeleteTodo = async (todoId) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await deleteTodo(todoId)
      } catch (error) {
        console.error('Failed to delete todo:', error)
        alert('Failed to delete todo. Please try again.')
      }
    }
  }

  const handleToggleTodo = async (todo) => {
    try {
      if (todo.is_completed) {
        await markTodoIncomplete(todo.id)
      } else {
        await markTodoCompleted(todo.id)
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error)
      alert('Failed to update todo. Please try again.')
    }
  }

  const completedTodos = todos.filter(todo => todo.is_completed)
  const incompleteTodos = todos.filter(todo => !todo.is_completed)

  const isToday = currentTodoDate.toDateString() === new Date().toDateString()
  const isPast = currentTodoDate < new Date().setHours(0, 0, 0, 0)

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Todos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your daily tasks and deadlines
          </p>
        </div>
        
        <button
          onClick={handleAddTodo}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Todo
        </button>
      </div>

      {/* Date Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatDate(currentTodoDate)}
              </h2>
              {isToday && (
                <span className="text-sm text-blue-500 font-medium">Today</span>
              )}
              {isPast && !isToday && (
                <span className="text-sm text-gray-500">Past</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-3 py-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                Today
              </button>
            )}
            <button
              onClick={goToNextDay}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Todos List */}
      <div className="space-y-6">
        {loadingTodos ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading todos...</p>
          </div>
        ) : (
          <>
            {/* Incomplete Todos */}
            {incompleteTodos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pending Tasks ({incompleteTodos.length})
                </h3>
                <div className="space-y-3">
                  {incompleteTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleTodo(todo)}
                        className="flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {todo.title}
                        </h4>
                        {todo.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {todo.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatTime(todo.deadline_time)}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditTodo(todo)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Completed Tasks ({completedTodos.length})
                </h3>
                <div className="space-y-3">
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-75"
                    >
                      <button
                        onClick={() => handleToggleTodo(todo)}
                        className="flex-shrink-0 text-green-500 hover:text-green-600 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate line-through">
                          {todo.title}
                        </h4>
                        {todo.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate line-through">
                            {todo.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatTime(todo.deadline_time)}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditTodo(todo)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {todos.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No todos for {isToday ? 'today' : 'this day'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {isToday 
                    ? 'Start organizing your day by adding your first todo!'
                    : 'No tasks were planned for this day.'
                  }
                </p>
                <button
                  onClick={handleAddTodo}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Todo
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Todo Modal */}
      {showTodoModal && (
        <TodoModal
          todo={todoToEdit}
          onClose={() => setShowTodoModal(false)}
          defaultDate={currentTodoDate}
        />
      )}
    </div>
  )
}

export default TodosView
