import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { useAppStore } from '../store/appStore'
import { Plus, Edit, Trash2, Clock } from 'lucide-react'
import TimeEntryModal from './modals/TimeEntryModal'

const CalendarView = () => {
  const timeEntries = useAppStore((state) => state.timeEntries)
  const selectedDate = useAppStore((state) => state.selectedDate)
  const setSelectedDate = useAppStore((state) => state.setSelectedDate)
  
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState(null)

  // Helper functions for date formatting
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateForInput = (date) => {
    const d = new Date(date);
    // Use local timezone to avoid UTC conversion issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // No need to fetch data here - App.jsx handles initialization
  // If we need month-specific data, we can filter from existing timeEntries

  const selectedDateStr = formatDateForInput(selectedDate)
  const entriesForSelectedDate = timeEntries.filter(entry => entry.date === selectedDateStr)
  const totalHoursForDate = entriesForSelectedDate.reduce((total, entry) => total + entry.duration_hours, 0)

  // Get dates that have time entries for calendar highlighting
  const datesWithEntries = [...new Set(timeEntries.map(entry => entry.date))]

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatDateForInput(date)
      const hasEntries = datesWithEntries.includes(dateStr)
      
      if (hasEntries) {
        const dayEntries = timeEntries.filter(entry => entry.date === dateStr)
        const dayTotal = dayEntries.reduce((total, entry) => total + entry.duration_hours, 0)
        
        return (
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" title={`${dayTotal.toFixed(1)}h logged`} />
          </div>
        )
      }
    }
    return null
  }

  const handleEditEntry = (entry) => {
    setEntryToEdit(entry)
    setShowTimeEntryModal(true)
  }

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await useAppStore.getState().deleteTimeEntry(entryId)
      } catch (error) {
        console.error('Failed to delete time entry:', error)
        alert('Failed to delete time entry. Please try again.')
      }
    }
  }

  const handleAddEntry = () => {
    setEntryToEdit(null)
    setShowTimeEntryModal(true)
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your time entries by date
          </p>
        </div>
        
        <button
          onClick={handleAddEntry}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              className="w-full"
              formatShortWeekday={(locale, date) => {
                const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                return days[date.getDay()]
              }}
            />
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="space-y-6">
          {/* Date Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(selectedDate)}
              </h2>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{totalHoursForDate.toFixed(1)}h</span>
              </div>
            </div>
            
            {entriesForSelectedDate.length > 0 && (
              <div className="space-y-2">
                {entriesForSelectedDate.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.category_color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.category_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.duration_hours.toFixed(1)}h
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {entriesForSelectedDate.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No entries for this date</p>
                <button
                  onClick={handleAddEntry}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Add your first entry
                </button>
              </div>
            )}
          </div>

          {/* Quick Add */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleAddEntry}
                className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Add Time Entry</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Log time for {formatDate(selectedDate)}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entry Modal */}
      {showTimeEntryModal && (
        <TimeEntryModal
          isOpen={showTimeEntryModal}
          onClose={() => {
            setShowTimeEntryModal(false)
            setEntryToEdit(null)
          }}
          entryToEdit={entryToEdit}
        />
      )}
    </div>
  )
}

export default CalendarView
