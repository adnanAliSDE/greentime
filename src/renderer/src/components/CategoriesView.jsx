import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Plus, Bookmark, Edit, Trash2, Palette } from 'lucide-react'
import CategoryModal from './modals/CategoryModal'

const CategoriesView = () => {
  const { categories, deleteCategory } = useAppStore()
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState(null)

  const handleEditCategory = (category) => {
    setCategoryToEdit(category)
    setShowCategoryModal(true)
  }

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? All associated time entries will also be deleted.')) {
      try {
        await deleteCategory(categoryId)
      } catch (error) {
        console.error('Failed to delete category:', error)
        alert('Failed to delete category. Please try again.')
      }
    }
  }

  const handleAddCategory = () => {
    setCategoryToEdit(null)
    setShowCategoryModal(true)
  }

  const colorPresets = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ]

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize your time tracking with custom categories
          </p>
        </div>
        
        <button
          onClick={handleAddCategory}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              {/* Category Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {category.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Description */}
                {category.description ? (
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {category.description}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                    No description provided
                  </p>
                )}
              </div>

              {/* Category Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    <span className="font-mono">{category.color}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No categories yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Categories help you organize and track different types of activities. Create your first category to get started.
          </p>
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create Your First Category
          </button>
        </div>
      )}

      {/* Color Presets Info */}
      {categories.length > 0 && (
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Reference</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Use these predefined colors for consistent visual organization:
          </p>
          <div className="flex flex-wrap gap-3">
            {colorPresets.map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false)
            setCategoryToEdit(null)
          }}
          categoryToEdit={categoryToEdit}
        />
      )}
    </div>
  )
}

export default CategoriesView
