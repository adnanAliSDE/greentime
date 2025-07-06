import { useState, useEffect } from 'react'
import { useAppStore, useDateStore } from '../../store/appStore'
import { X, Clock, Calendar, FileText } from 'lucide-react'

const TimeEntryModal = ({ isOpen, onClose, entryToEdit = null }) => {
  const { categories, createTimeEntry, updateTimeEntry } = useAppStore()
  const { formatDateForInput } = useDateStore()
  
  const [formData, setFormData] = useState({
    date: formatDateForInput(new Date()),
    categoryId: '',
    hours: '',
    minutes: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (entryToEdit) {
      setFormData({
        date: formatDateForInput(new Date(entryToEdit.date)),
        categoryId: entryToEdit.category_id.toString(),
        hours: Math.floor(entryToEdit.duration_hours).toString(),
        minutes: Math.round((entryToEdit.duration_hours % 1) * 60).toString(),
        description: entryToEdit.description || ''
      })
    } else {
      setFormData({
        date: formatDateForInput(new Date()),
        categoryId: categories.length > 0 ? categories[0].id.toString() : '',
        hours: '',
        minutes: '',
        description: ''
      })
    }
  }, [entryToEdit, categories, formatDateForInput])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const totalHours = parseFloat(formData.hours || 0) + parseFloat(formData.minutes || 0) / 60
      
      if (totalHours <= 0) {
        alert('Please enter a valid time duration')
        return
      }

      if (entryToEdit) {
        await updateTimeEntry(
          entryToEdit.id,
          formData.date,
          parseInt(formData.categoryId),
          totalHours,
          formData.description
        )
      } else {
        await createTimeEntry(
          formData.date,
          parseInt(formData.categoryId),
          totalHours,
          formData.description
        )
      }

      onClose()
    } catch (error) {
      console.error('Failed to save time entry:', error)
      alert('Failed to save time entry. Please try again.')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {entryToEdit ? 'Edit Time Entry' : 'Log Time Entry'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Duration
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Hours"
                  min="0"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => handleChange('hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <label className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Hours</label>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Minutes"
                  min="0"
                  max="59"
                  value={formData.minutes}
                  onChange={(e) => handleChange('minutes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <label className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Minutes</label>
              </div>
            </div>
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
              placeholder="What did you work on?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
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
              {isSubmitting ? 'Saving...' : (entryToEdit ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TimeEntryModal
