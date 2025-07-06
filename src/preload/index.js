import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Categories
  getCategories: () => ipcRenderer.invoke('get-categories'),
  createCategory: (name, description, color) => ipcRenderer.invoke('create-category', name, description, color),
  updateCategory: (id, name, description, color) => ipcRenderer.invoke('update-category', id, name, description, color),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

  // Goals
  getGoals: () => ipcRenderer.invoke('get-goals'),
  createGoal: (title, description, startDate, endDate, targets) => ipcRenderer.invoke('create-goal', title, description, startDate, endDate, targets),
  updateGoal: (id, title, description, startDate, endDate) => ipcRenderer.invoke('update-goal', id, title, description, startDate, endDate),
  deleteGoal: (id) => ipcRenderer.invoke('delete-goal', id),
  markGoalCompleted: (id) => ipcRenderer.invoke('mark-goal-completed', id),
  markGoalIncomplete: (id) => ipcRenderer.invoke('mark-goal-incomplete', id),
  getCompletedGoals: () => ipcRenderer.invoke('get-completed-goals'),

  // Time Entries
  getTimeEntries: (startDate, endDate) => ipcRenderer.invoke('get-time-entries', startDate, endDate),
  createTimeEntry: (date, categoryId, durationHours, description) => ipcRenderer.invoke('create-time-entry', date, categoryId, durationHours, description),
  updateTimeEntry: (id, date, categoryId, durationHours, description) => ipcRenderer.invoke('update-time-entry', id, date, categoryId, durationHours, description),
  deleteTimeEntry: (id) => ipcRenderer.invoke('delete-time-entry', id),

  // Statistics
  getCategoryStats: (startDate, endDate) => ipcRenderer.invoke('get-category-stats', startDate, endDate),
  getProductiveCategoryStats: (startDate, endDate) => ipcRenderer.invoke('get-productive-category-stats', startDate, endDate),
  getWasteTimeStats: (startDate, endDate) => ipcRenderer.invoke('get-waste-time-stats', startDate, endDate),
  getGoalProgress: () => ipcRenderer.invoke('get-goal-progress'),
  getStreakData: () => ipcRenderer.invoke('get-streak-data')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
