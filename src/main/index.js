import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Database from 'better-sqlite3'

let dbService = null

// Database Service Class
class DatabaseService {
  constructor() {
    try {
      const dbPath = app
        ? join(app.getPath('userData'), 'greentime.db')
        : join(process.cwd(), 'greentime.db');

      console.log('main::index.js::DataBaseService::Database path:', dbPath)
      this.db = new Database(dbPath);
      console.log('main::index.js::DataBaseService::Database connection established')
      this.initializeTables();
      console.log('main::index.js::DataBaseService::Database tables initialized')
    } catch (error) {
      console.error('main::index.js::DataBaseService::Database constructor error:', error)
      throw error
    }
  }

  initializeTables() {
    // Categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Goals table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Goal targets table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS goal_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER,
        category_id INTEGER,
        target_hours REAL NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
        UNIQUE(goal_id, category_id)
      )
    `);

    // Time entries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        category_id INTEGER,
        duration_hours REAL NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      )
    `);

    // Insert default categories
    this.insertDefaultCategories();
  }

  insertDefaultCategories() {
    const defaultCategories = [
      { name: 'Coding', description: 'Programming and software development', color: '#10B981' },
      { name: 'Study', description: 'Learning and educational activities', color: '#3B82F6' },
      { name: 'Work', description: 'Professional work activities', color: '#F59E0B' },
      { name: 'Exercise', description: 'Physical fitness and health', color: '#EF4444' },
      { name: 'Time Waste', description: 'Unproductive activities', color: '#6B7280' }
    ];

    const existingCategories = this.getCategories();
    if (existingCategories.length === 0) {
      defaultCategories.forEach(category => {
        this.createCategory(category.name, category.description, category.color);
      });
    }
  }

  getCategories() {
    return this.db.prepare('SELECT * FROM categories ORDER BY name').all();
  }

  createCategory(name, description = '', color = '#3B82F6') {
    return this.db.prepare('INSERT INTO categories (name, description, color) VALUES (?, ?, ?)')
      .run(name, description, color);
  }

  updateCategory(id, name, description, color) {
    return this.db.prepare('UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ?')
      .run(name, description, color, id);
  }

  deleteCategory(id) {
    return this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  getGoals() {
    // First get all goals
    const goals = this.db.prepare(`
      SELECT * FROM goals 
      WHERE is_active = 1
      ORDER BY created_at DESC
    `).all();

    // Then get targets for each goal separately
    const getTargetsStmt = this.db.prepare(`
      SELECT gt.*, c.name as category_name, c.color as category_color
      FROM goal_targets gt
      JOIN categories c ON gt.category_id = c.id
      WHERE gt.goal_id = ?
    `);
    return goals.map(goal => ({
      ...goal,
      targets: getTargetsStmt.all(goal.id).map(target => ({
        category_id: target.category_id,
        category_name: target.category_name,
        target_hours: target.target_hours,
        category_color: target.category_color
      }))
    }));
  }

  createGoal(title, description, startDate, endDate, targets) {
    const transaction = this.db.transaction(() => {
      const goalResult = this.db.prepare('INSERT INTO goals (title, description, start_date, end_date) VALUES (?, ?, ?, ?)')
        .run(title, description, startDate, endDate);

      const goalId = goalResult.lastInsertRowid;

      targets.forEach(target => {
        this.db.prepare('INSERT INTO goal_targets (goal_id, category_id, target_hours) VALUES (?, ?, ?)')
          .run(goalId, target.categoryId, target.targetHours);
      });

      return goalId;
    });

    return transaction();
  }

  updateGoal(id, title, description, startDate, endDate) {
    return this.db.prepare('UPDATE goals SET title = ?, description = ?, start_date = ?, end_date = ? WHERE id = ?')
      .run(title, description, startDate, endDate, id);
  }

  deleteGoal(id) {
    return this.db.prepare('UPDATE goals SET is_active = 0 WHERE id = ?').run(id);
  }

  getTimeEntries(startDate = null, endDate = null) {
    let query = `
      SELECT te.*, c.name as category_name, c.color as category_color
      FROM time_entries te
      JOIN categories c ON te.category_id = c.id
    `;
    let params = [];

    if (startDate && endDate) {
      query += ' WHERE te.date BETWEEN ? AND ?';
      params = [startDate, endDate];
    } else if (startDate) {
      query += ' WHERE te.date >= ?';
      params = [startDate];
    } else if (endDate) {
      query += ' WHERE te.date <= ?';
      params = [endDate];
    }

    query += ' ORDER BY te.date DESC, te.created_at DESC';

    return this.db.prepare(query).all(...params);
  }

  createTimeEntry(date, categoryId, durationHours, description = '') {
    return this.db.prepare('INSERT INTO time_entries (date, category_id, duration_hours, description) VALUES (?, ?, ?, ?)')
      .run(date, categoryId, durationHours, description);
  }

  updateTimeEntry(id, date, categoryId, durationHours, description) {
    return this.db.prepare(`
      UPDATE time_entries 
      SET date = ?, category_id = ?, duration_hours = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(date, categoryId, durationHours, description, id);
  }

  deleteTimeEntry(id) {
    return this.db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);
  }

  getCategoryStats(startDate, endDate) {
    return this.db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.color,
        COALESCE(SUM(te.duration_hours), 0) as total_hours,
        COUNT(DISTINCT te.date) as active_days
      FROM categories c
      LEFT JOIN time_entries te ON c.id = te.category_id 
        AND te.date BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.color
      ORDER BY total_hours DESC
    `).all(startDate, endDate);
  }

  getGoalProgress() {
    return this.db.prepare(`
      SELECT 
        g.id as goal_id,
        g.title,
        gt.category_id,
        c.name as category_name,
        c.color as category_color,
        gt.target_hours,
        COALESCE(SUM(te.duration_hours), 0) as completed_hours,
        CASE 
          WHEN gt.target_hours > 0 THEN (COALESCE(SUM(te.duration_hours), 0) / gt.target_hours) * 100
          ELSE 0
        END as progress_percentage
      FROM goals g
      JOIN goal_targets gt ON g.id = gt.goal_id
      JOIN categories c ON gt.category_id = c.id
      LEFT JOIN time_entries te ON c.id = te.category_id 
        AND (g.start_date IS NULL OR te.date >= g.start_date)
        AND (g.end_date IS NULL OR te.date <= g.end_date)
      WHERE g.is_active = 1
      GROUP BY g.id, gt.category_id, gt.target_hours
      ORDER BY g.id, c.name
    `).all();
  }

  getStreakData() {
    const allEntries = this.db.prepare(`
      SELECT DISTINCT date
      FROM time_entries
      ORDER BY date DESC
    `).all();

    if (allEntries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
    }

    const dates = allEntries.map(entry => new Date(entry.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (let i = 0; i < dates.length; i++) {
      const currentDate = dates[i];

      if (i === 0) {
        const daysDiff = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          currentStreak = 1;
          tempStreak = 1;
        }
      } else {
        const daysDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
          if (i === 0 || currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
          if (i === 0) {
            currentStreak = 0;
          }
        }
      }

      lastDate = currentDate;
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    return {
      currentStreak,
      longestStreak,
      totalActiveDays: allEntries.length
    };
  }

  close() {
    this.db.close();
  }
}


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Initialize database and IPC handlers
function initializeDatabase() {
  try {
    console.log('main::index.js::initializeDatabase::Initializing database...')
    dbService = new DatabaseService()
    console.log('main::index.js::initializeDatabase::Database initialized successfully')
  } catch (error) {
    console.error('main::index.js::initializeDatabase::Failed to initialize database:', error)
    // Continue with dummy handlers that return empty data
    dbService = {
      getCategories: () => [],
      getGoals: () => [],
      getTimeEntries: () => [],
      getCategoryStats: () => [],
      getGoalProgress: () => [],
      getStreakData: () => ({ currentStreak: 0, longestStreak: 0, totalActiveDays: 0 })
    }
  }

  // Category IPC handlers
  ipcMain.handle('get-categories', async () => {
    try {
      console.log('main::index.js::ipcHandler::get-categories::Getting categories...')
      const result = dbService.getCategories()
      console.log('main::index.js::ipcHandler::get-categories::Categories fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-categories::Error getting categories:', error)
      return []
    }
  })

  ipcMain.handle('create-category', async (event, name, description, color) => {
    try {
      console.log('main::index.js::ipcHandler::create-category::Creating category:', name)
      return dbService.createCategory(name, description, color)
    } catch (error) {
      console.error('main::index.js::ipcHandler::create-category::Error creating category:', error)
      throw error
    }
  })

  ipcMain.handle('update-category', async (event, id, name, description, color) => {
    try {
      console.log('main::index.js::ipcHandler::update-category::Updating category:', id)
      return dbService.updateCategory(id, name, description, color)
    } catch (error) {
      console.error('main::index.js::ipcHandler::update-category::Error updating category:', error)
      throw error
    }
  })

  ipcMain.handle('delete-category', async (event, id) => {
    try {
      console.log('main::index.js::ipcHandler::delete-category::Deleting category:', id)
      return dbService.deleteCategory(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::delete-category::Error deleting category:', error)
      throw error
    }
  })

  // Goal IPC handlers
  ipcMain.handle('get-goals', async () => {
    try {
      console.log('main::index.js::ipcHandler::get-goals::Getting goals...')
      const result = dbService.getGoals()
      console.log('main::index.js::ipcHandler::get-goals::Goals fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-goals::Error getting goals:', error)
      return []
    }
  })

  ipcMain.handle('create-goal', async (event, title, description, startDate, endDate, targets) => {
    try {
      console.log('main::index.js::ipcHandler::create-goal::Creating goal:', title)
      return dbService.createGoal(title, description, startDate, endDate, targets)
    } catch (error) {
      console.error('main::index.js::ipcHandler::create-goal::Error creating goal:', error)
      throw error
    }
  })

  ipcMain.handle('update-goal', async (event, id, title, description, startDate, endDate) => {
    try {
      console.log('main::index.js::ipcHandler::update-goal::Updating goal:', id)
      return dbService.updateGoal(id, title, description, startDate, endDate)
    } catch (error) {
      console.error('main::index.js::ipcHandler::update-goal::Error updating goal:', error)
      throw error
    }
  })

  ipcMain.handle('delete-goal', async (event, id) => {
    try {
      console.log('main::index.js::ipcHandler::delete-goal::Deleting goal:', id)
      return dbService.deleteGoal(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::delete-goal::Error deleting goal:', error)
      throw error
    }
  })

  // Time entry IPC handlers
  ipcMain.handle('get-time-entries', async (event, startDate, endDate) => {
    try {
      console.log('main::index.js::ipcHandler::get-time-entries::Getting time entries...')
      const result = dbService.getTimeEntries(startDate, endDate)
      console.log('main::index.js::ipcHandler::get-time-entries::Time entries fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-time-entries::Error getting time entries:', error)
      return []
    }
  })

  ipcMain.handle('create-time-entry', async (event, date, categoryId, durationHours, description) => {
    try {
      console.log('main::index.js::ipcHandler::create-time-entry::Creating time entry for date:', date)
      return dbService.createTimeEntry(date, categoryId, durationHours, description)
    } catch (error) {
      console.error('main::index.js::ipcHandler::create-time-entry::Error creating time entry:', error)
      throw error
    }
  })

  ipcMain.handle('update-time-entry', async (event, id, date, categoryId, durationHours, description) => {
    try {
      console.log('main::index.js::ipcHandler::update-time-entry::Updating time entry:', id)
      return dbService.updateTimeEntry(id, date, categoryId, durationHours, description)
    } catch (error) {
      console.error('main::index.js::ipcHandler::update-time-entry::Error updating time entry:', error)
      throw error
    }
  })

  ipcMain.handle('delete-time-entry', async (event, id) => {
    try {
      console.log('main::index.js::ipcHandler::delete-time-entry::Deleting time entry:', id)
      return dbService.deleteTimeEntry(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::delete-time-entry::Error deleting time entry:', error)
      throw error
    }
  })

  // Statistics IPC handlers
  ipcMain.handle('get-category-stats', async (event, startDate, endDate) => {
    try {
      console.log('main::index.js::ipcHandler::get-category-stats::Getting category stats...')
      const result = dbService.getCategoryStats(startDate, endDate)
      console.log('main::index.js::ipcHandler::get-category-stats::Category stats fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-category-stats::Error getting category stats:', error)
      return []
    }
  })

  ipcMain.handle('get-goal-progress', async () => {
    try {
      console.log('main::index.js::ipcHandler::get-goal-progress::Getting goal progress...')
      const result = dbService.getGoalProgress()
      console.log('main::index.js::ipcHandler::get-goal-progress::Goal progress fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-goal-progress::Error getting goal progress:', error)
      return []
    }
  })

  ipcMain.handle('get-streak-data', async () => {
    try {
      console.log('main::index.js::ipcHandler::get-streak-data::Getting streak data...')
      const result = dbService.getStreakData()
      console.log('main::index.js::ipcHandler::get-streak-data::Streak data fetched:', result)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-streak-data::Error getting streak data:', error)
      return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 }
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  // Initialize database
  initializeDatabase()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (dbService) {
      dbService.close()
    }
    app.quit()
  }
})

// Clean up database connection when app is quitting
app.on('before-quit', () => {
  if (dbService) {
    dbService.close()
  }
})

