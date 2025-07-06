import { useState, useEffect } from 'react'
import { useAppStore, useDateStore } from '../../store/appStore'
import { X, Target, Calendar, FileText, Plus, Trash2 } from 'lucide-react'

const GoalModal = ({ isOpen, onClose, goalToEdit = null }) => {
  const { categories, createGoal, updateGoal } = useAppStore()
  const { formatDateForInput } = useDateStore()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: formatDateForInput(new Date()),
    endDate: '',
    targets: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (goalToEdit) {
      setFormData({
        title: goalToEdit.title || '',
        description: goalToEdit.description || '',
        startDate: goalToEdit.start_date ? formatDateForInput(new Date(goalToEdit.start_date)) : formatDateForInput(new Date()),
        endDate: goalToEdit.end_date ? formatDateForInput(new Date(goalToEdit.end_date)) : '',
        targets: goalToEdit.targets || []
      })
    } else {
      setFormData({
        title: '',
        description: '',
        startDate: formatDateForInput(new Date()),
        endDate: '',
        targets: []
      })
    }
  }, [goalToEdit, formatDateForInput])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.title.trim()) {
        alert('Please enter a goal title')
        return
      }

      if (formData.targets.length === 0) {
        alert('Please add at least one category target')
        return
      }

      const targets = formData.targets.map(target => ({
        categoryId: target.category_id,
        targetHours: parseFloat(target.target_hours)
      }))

      if (goalToEdit) {
        await updateGoal(
          goalToEdit.id,
          formData.title,
          formData.description,
          formData.startDate || null,
          formData.endDate || null
        )
      } else {
        await createGoal(
          formData.title,
          formData.description,
          formData.startDate || null,
          formData.endDate || null,
          targets
        )
      }

      onClose()
    } catch (error) {
      console.error('Failed to save goal:', error)
      alert('Failed to save goal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTarget = () => {
    if (categories.length === 0) return
    
    const availableCategories = categories.filter(cat => 
      !formData.targets.some(target => target.category_id === cat.id)
    )
    
    if (availableCategories.length === 0) {
      alert('All categories already have targets')
      return
    }

    const newTarget = {
      category_id: availableCategories[0].id,
      category_name: availableCategories[0].name,
      category_color: availableCategories[0].color,
      target_hours: ''
    }

    setFormData(prev => ({
      ...prev,
      targets: [...prev.targets, newTarget]
    }))
  }

  const updateTarget = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.map((target, i) => {
        if (i === index) {
          if (field === 'category_id') {
            const category = categories.find(cat => cat.id === parseInt(value))
            return {
              ...target,
              category_id: parseInt(value),
              category_name: category?.name || '',
              category_color: category?.color || '#3B82F6'
            }
          }
          return { ...target, [field]: value }
        }
        return target
      })
    }))
  }

  const removeTarget = (index) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {goalToEdit ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Goal Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Q1 Learning Goals"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your goal and what you want to achieve..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Category Targets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Category Targets
              </label>
              <button
                type="button"
                onClick={addTarget}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                disabled={formData.targets.length >= categories.length}
              >
                <Plus className="w-4 h-4" />
                Add Target
              </button>
            </div>

            {formData.targets.length > 0 ? (
              <div className="space-y-3">
                {formData.targets.map((target, index) => {
                  const availableCategories = categories.filter(cat => 
                    cat.id === target.category_id || 
                    !formData.targets.some(t => t.category_id === cat.id)
                  )

                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: target.category_color }}
                      />
                      
                      <select
                        value={target.category_id}
                        onChange={(e) => updateTarget(index, 'category_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {availableCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={target.target_hours}
                          onChange={(e) => updateTarget(index, 'target_hours', e.target.value)}
                          placeholder="Hours"
                          min="0"
                          step="0.5"
                          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">hrs</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeTarget(index)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No category targets added</p>
                <button
                  type="button"
                  onClick={addTarget}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Add your first target
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving...' : (goalToEdit ? 'Update Goal' : 'Create Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GoalModal
