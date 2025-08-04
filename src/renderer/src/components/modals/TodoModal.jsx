import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { X, Calendar, Clock, Save } from 'lucide-react'

const TodoModal = ({ todo, onClose, defaultDate }) => {
  const { createTodo, updateTodo } = useAppStore()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    deadlineTime: '09:00'
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (todo) {
      // Edit mode
      setFormData({
        title: todo.title || '',
        description: todo.description || '',
        startDate: todo.start_date || '',
        deadlineTime: todo.deadline_time || '09:00'
      })
    } else {
      // Create mode - use default date
      const dateStr = defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      setFormData({
        title: '',
        description: '',
        startDate: dateStr,
        deadlineTime: '09:00'
      })
    }
  }, [todo, defaultDate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }
    
    if (!formData.deadlineTime) {
      newErrors.deadlineTime = 'Deadline time is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (todo) {
        // Update existing todo
        await updateTodo(
          todo.id,
          formData.title.trim(),
          formData.description.trim(),
          formData.startDate,
          formData.deadlineTime
        )
      } else {
        // Create new todo
        await createTodo(
          formData.title.trim(),
          formData.description.trim(),
          formData.startDate,
          formData.deadlineTime
        )
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to save todo:', error)
      alert('Failed to save todo. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateForDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {todo ? 'Edit Todo' : 'Add New Todo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter todo title"
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter todo description (optional)"
              maxLength={500}
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
            )}
            {formData.startDate && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {formatDateForDisplay(formData.startDate)}
              </p>
            )}
          </div>

          {/* Deadline Time */}
          <div>
            <label htmlFor="deadlineTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deadline Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="time"
                id="deadlineTime"
                name="deadlineTime"
                value={formData.deadlineTime}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.deadlineTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.deadlineTime && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deadlineTime}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {todo ? 'Update' : 'Create'} Todo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TodoModal