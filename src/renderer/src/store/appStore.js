import { create } from 'zustand'

// Main application store
export const useAppStore = create((set, get) => ({
  // Categories state
  categories: [],
  loadingCategories: false,

  // Goals state
  goals: [],
  completedGoals: [],
  showCompletedGoals: false,
  loadingGoals: false,

  // Time entries state
  timeEntries: [],
  loadingTimeEntries: false,

  // Todos state
  todos: [],
  loadingTodos: false,
  currentTodoDate: new Date(),

  // Statistics state
  categoryStats: [],
  productiveCategoryStats: [],
  wasteTimeStats: [],
  goalProgress: [],
  streakData: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
  loadingStats: false,

  // UI state
  selectedDate: new Date(),
  activeView: 'dashboard', // dashboard, calendar, goals, categories, stats
  darkMode: false,
  initialized: false, // Track if app has been initialized

  // Actions
  setActiveView: (view) => set({ activeView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleShowCompletedGoals: () => set((state) => ({ showCompletedGoals: !state.showCompletedGoals })),

  // Category actions
  fetchCategories: async () => {
    const state = get()
    if (state.loadingCategories) return // Prevent multiple simultaneous calls

    set({ loadingCategories: true })
    try {
      console.log('store::appStore::fetchCategories::Getting categories...')
      const categories = await window.api.getCategories()
      console.log('store::appStore::fetchCategories::Categories fetched:', categories.length)
      set({ categories, loadingCategories: false })
    } catch (error) {
      console.error('store::appStore::fetchCategories::Failed to fetch categories:', error)
      set({ loadingCategories: false })
    }
  },

  createCategory: async (name, description, color) => {
    try {
      await window.api.createCategory(name, description, color)
      await get().fetchCategories()
    } catch (error) {
      console.error('store::appStore::createCategory::Failed to create category:', error)
      throw error
    }
  },

  updateCategory: async (id, name, description, color) => {
    try {
      await window.api.updateCategory(id, name, description, color)
      await get().fetchCategories()
    } catch (error) {
      console.error('store::appStore::updateCategory::Failed to update category:', error)
      throw error
    }
  },

  deleteCategory: async (id) => {
    try {
      await window.api.deleteCategory(id)
      await get().fetchCategories()
    } catch (error) {
      console.error('store::appStore::deleteCategory::Failed to delete category:', error)
      throw error
    }
  },

  // Goal actions
  fetchGoals: async () => {
    const state = get()
    if (state.loadingGoals) return // Prevent multiple simultaneous calls

    set({ loadingGoals: true })
    try {
      console.log('store::appStore::fetchGoals::Getting goals...')
      const goals = await window.api.getGoals()
      console.log('store::appStore::fetchGoals::Goals fetched:', goals.length)
      set({ goals, loadingGoals: false })
    } catch (error) {
      console.error('store::appStore::fetchGoals::Failed to fetch goals:', error)
      set({ loadingGoals: false })
    }
  },

  createGoal: async (title, description, startDate, endDate, targets) => {
    try {
      await window.api.createGoal(title, description, startDate, endDate, targets)
      await get().fetchGoals()
    } catch (error) {
      console.error('store::appStore::createGoal::Failed to create goal:', error)
      throw error
    }
  },

  updateGoal: async (id, title, description, startDate, endDate) => {
    try {
      await window.api.updateGoal(id, title, description, startDate, endDate)
      await get().fetchGoals()
    } catch (error) {
      console.error('store::appStore::updateGoal::Failed to update goal:', error)
      throw error
    }
  },

  deleteGoal: async (id) => {
    try {
      await window.api.deleteGoal(id)
      await get().fetchGoals()
    } catch (error) {
      console.error('store::appStore::deleteGoal::Failed to delete goal:', error)
      throw error
    }
  },

  markGoalCompleted: async (id) => {
    try {
      await window.api.markGoalCompleted(id)
      await Promise.all([
        get().fetchGoals(),
        get().fetchCompletedGoals(),
        get().fetchStatistics()
      ])
    } catch (error) {
      console.error('store::appStore::markGoalCompleted::Failed to mark goal as completed:', error)
      throw error
    }
  },

  markGoalIncomplete: async (id) => {
    try {
      await window.api.markGoalIncomplete(id)
      await Promise.all([
        get().fetchGoals(),
        get().fetchCompletedGoals(),
        get().fetchStatistics()
      ])
    } catch (error) {
      console.error('store::appStore::markGoalIncomplete::Failed to mark goal as incomplete:', error)
      throw error
    }
  },

  fetchCompletedGoals: async () => {
    try {
      console.log('store::appStore::fetchCompletedGoals::Getting completed goals...')
      const completedGoals = await window.api.getCompletedGoals()
      console.log('store::appStore::fetchCompletedGoals::Completed goals fetched:', completedGoals.length)
      set({ completedGoals })
    } catch (error) {
      console.error('store::appStore::fetchCompletedGoals::Failed to fetch completed goals:', error)
    }
  },

  // Time entry actions
  fetchTimeEntries: async (startDate = null, endDate = null) => {
    const state = get()
    if (state.loadingTimeEntries) {
      console.log('store::appStore::fetchTimeEntries::Already loading, skipping...')
      return // Prevent multiple simultaneous calls
    }

    set({ loadingTimeEntries: true })
    try {
      console.log('store::appStore::fetchTimeEntries::Getting time entries...', { startDate, endDate })
      const timeEntries = await window.api.getTimeEntries(startDate, endDate)
      console.log('store::appStore::fetchTimeEntries::Time entries fetched:', timeEntries.length)
      set({ timeEntries, loadingTimeEntries: false })
    } catch (error) {
      console.error('store::appStore::fetchTimeEntries::Failed to fetch time entries:', error)
      set({ loadingTimeEntries: false })
    }
  },

  createTimeEntry: async (date, categoryId, durationHours, description) => {
    try {
      await window.api.createTimeEntry(date, categoryId, durationHours, description)
      // Only refetch if we're not currently in a loading state
      const state = get()
      if (!state.loadingTimeEntries && !state.loadingStats) {
        await Promise.all([
          get().fetchTimeEntries(),
          get().fetchStatistics()
        ])
      }
    } catch (error) {
      console.error('store::appStore::createTimeEntry::Failed to create time entry:', error)
      throw error
    }
  },

  updateTimeEntry: async (id, date, categoryId, durationHours, description) => {
    try {
      await window.api.updateTimeEntry(id, date, categoryId, durationHours, description)
      // Only refetch if we're not currently in a loading state
      const state = get()
      if (!state.loadingTimeEntries && !state.loadingStats) {
        await Promise.all([
          get().fetchTimeEntries(),
          get().fetchStatistics()
        ])
      }
    } catch (error) {
      console.error('store::appStore::updateTimeEntry::Failed to update time entry:', error)
      throw error
    }
  },

  deleteTimeEntry: async (id) => {
    try {
      await window.api.deleteTimeEntry(id)
      // Only refetch if we're not currently in a loading state
      const state = get()
      if (!state.loadingTimeEntries && !state.loadingStats) {
        await Promise.all([
          get().fetchTimeEntries(),
          get().fetchStatistics()
        ])
      }
    } catch (error) {
      console.error('store::appStore::deleteTimeEntry::Failed to delete time entry:', error)
      throw error
    }
  },

  // Statistics actions
  fetchStatistics: async (startDate = null, endDate = null) => {
    const state = get()
    if (state.loadingStats) {
      console.log('store::appStore::fetchStatistics::Already loading, skipping...')
      return // Prevent multiple simultaneous calls
    }

    set({ loadingStats: true })
    try {
      console.log('store::appStore::fetchStatistics::Getting category stats...', { startDate, endDate })
      const categoryStats = await window.api.getCategoryStats(startDate, endDate)
      console.log('store::appStore::fetchStatistics::Category stats fetched:', categoryStats.length)

      console.log('store::appStore::fetchStatistics::Getting productive category stats...')
      const productiveCategoryStats = await window.api.getProductiveCategoryStats(startDate, endDate)
      console.log('store::appStore::fetchStatistics::Productive stats fetched:', productiveCategoryStats.length)

      console.log('store::appStore::fetchStatistics::Getting waste time stats...')
      const wasteTimeStats = await window.api.getWasteTimeStats(startDate, endDate)
      console.log('store::appStore::fetchStatistics::Waste time stats fetched:', wasteTimeStats.length)

      console.log('store::appStore::fetchStatistics::Getting goal progress...')
      const goalProgress = await window.api.getGoalProgress()
      console.log('store::appStore::fetchStatistics::Goal progress fetched:', goalProgress.length)

      console.log('store::appStore::fetchStatistics::Getting streak data...')
      const streakData = await window.api.getStreakData()
      console.log('store::appStore::fetchStatistics::Streak data fetched:', streakData)

      set({
        categoryStats,
        productiveCategoryStats,
        wasteTimeStats,
        goalProgress,
        streakData,
        loadingStats: false
      })
    } catch (error) {
      console.error('store::appStore::fetchStatistics::Failed to fetch statistics:', error)
      set({ loadingStats: false })
    }
  },

  // Initialize all data
  initializeApp: async () => {
    const state = get()
    if (state.initialized || state.loadingCategories || state.loadingGoals || state.loadingTimeEntries || state.loadingStats) {
      console.log('store::appStore::initializeApp::Already initialized or loading, skipping...')
      return
    }

    console.log('store::appStore::initializeApp::Starting initialization...')
    try {
      await Promise.all([
        get().fetchCategories(),
        get().fetchGoals(),
        get().fetchCompletedGoals(),
        get().fetchTimeEntries(),
        get().fetchStatistics()
      ])
      set({ initialized: true })
      console.log('store::appStore::initializeApp::Initialization complete')
    } catch (error) {
      console.error('store::appStore::initializeApp::Initialization failed:', error)
    }
  },

  // Todo actions
  setCurrentTodoDate: (date) => set({ currentTodoDate: date }),

  fetchTodos: async (startDate = null, endDate = null) => {
    const state = get()
    if (state.loadingTodos) {
      console.log('store::appStore::fetchTodos::Already loading, skipping...')
      return
    }

    set({ loadingTodos: true })
    try {
      console.log('store::appStore::fetchTodos::Getting todos...', { startDate, endDate })
      const todos = await window.api.getTodos(startDate, endDate)
      console.log('store::appStore::fetchTodos::Todos fetched:', todos.length)
      set({ todos, loadingTodos: false })
    } catch (error) {
      console.error('store::appStore::fetchTodos::Failed to fetch todos:', error)
      set({ loadingTodos: false })
    }
  },

  fetchTodosByDate: async (date) => {
    const state = get()
    if (state.loadingTodos) return

    set({ loadingTodos: true })
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
      console.log('store::appStore::fetchTodosByDate::Getting todos for date:', dateStr)
      const todos = await window.api.getTodosByDate(dateStr)
      console.log('store::appStore::fetchTodosByDate::Todos fetched:', todos.length)
      set({ todos, loadingTodos: false })
    } catch (error) {
      console.error('store::appStore::fetchTodosByDate::Failed to fetch todos:', error)
      set({ loadingTodos: false })
    }
  },

  createTodo: async (title, description, startDate, deadlineTime) => {
    try {
      await window.api.createTodo(title, description, startDate, deadlineTime)
      // Refresh todos for current date
      const state = get()
      const currentDateStr = state.currentTodoDate.toISOString().split('T')[0]
      await get().fetchTodosByDate(currentDateStr)
    } catch (error) {
      console.error('store::appStore::createTodo::Failed to create todo:', error)
      throw error
    }
  },

  updateTodo: async (id, title, description, startDate, deadlineTime) => {
    try {
      await window.api.updateTodo(id, title, description, startDate, deadlineTime)
      // Refresh todos for current date
      const state = get()
      const currentDateStr = state.currentTodoDate.toISOString().split('T')[0]
      await get().fetchTodosByDate(currentDateStr)
    } catch (error) {
      console.error('store::appStore::updateTodo::Failed to update todo:', error)
      throw error
    }
  },

  deleteTodo: async (id) => {
    try {
      await window.api.deleteTodo(id)
      // Refresh todos for current date
      const state = get()
      const currentDateStr = state.currentTodoDate.toISOString().split('T')[0]
      await get().fetchTodosByDate(currentDateStr)
    } catch (error) {
      console.error('store::appStore::deleteTodo::Failed to delete todo:', error)
      throw error
    }
  },

  markTodoCompleted: async (id) => {
    try {
      await window.api.markTodoCompleted(id)
      // Refresh todos for current date
      const state = get()
      const currentDateStr = state.currentTodoDate.toISOString().split('T')[0]
      await get().fetchTodosByDate(currentDateStr)
    } catch (error) {
      console.error('store::appStore::markTodoCompleted::Failed to mark todo as completed:', error)
      throw error
    }
  },

  markTodoIncomplete: async (id) => {
    try {
      await window.api.markTodoIncomplete(id)
      // Refresh todos for current date
      const state = get()
      const currentDateStr = state.currentTodoDate.toISOString().split('T')[0]
      await get().fetchTodosByDate(currentDateStr)
    } catch (error) {
      console.error('store::appStore::markTodoIncomplete::Failed to mark todo as incomplete:', error)
      throw error
    }
  },
}))

// Date utilities store
export const useDateStore = create((set, get) => ({
  today: new Date(),

  // Get date range for current month
  getCurrentMonthRange: () => {
    const today = get().today
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    }
  },

  // Get date range for current week
  getCurrentWeekRange: () => {
    const today = get().today
    const firstDay = new Date(today)
    const lastDay = new Date(today)

    firstDay.setDate(today.getDate() - today.getDay())
    lastDay.setDate(today.getDate() + (6 - today.getDay()))

    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    }
  },

  // Format date for display
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  // Format date for input (avoiding timezone issues)
  formatDateForInput: (date) => {
    const d = new Date(date);
    // Use local timezone to avoid UTC conversion issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}))
