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

      // console.log('main::index.js::DataBaseService::Database path:', dbPath)
      this.db = new Database(dbPath);
      // console.log('main::index.js::DataBaseService::Database connection established')
      this.initializeTables();
      // console.log('main::index.js::DataBaseService::Database tables initialized')
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
        is_system_category BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if is_system_category column exists, add it if not (migration)
    try {
      const columns = this.db.prepare("PRAGMA table_info(categories)").all();
      const hasSystemColumn = columns.some(col => col.name === 'is_system_category');
      
      if (!hasSystemColumn) {
        // console.log('main::index.js::DataBaseService::Adding is_system_category column...');
        this.db.exec("ALTER TABLE categories ADD COLUMN is_system_category BOOLEAN DEFAULT 0");
        // console.log('main::index.js::DataBaseService::is_system_category column added successfully');
      }
    } catch (error) {
      console.error('main::index.js::DataBaseService::Migration error:', error);
    }

    // Goals table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT 1,
        is_completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if is_completed column exists, add it if not (migration)
    try {
      const columns = this.db.prepare("PRAGMA table_info(goals)").all();
      const hasCompletedColumn = columns.some(col => col.name === 'is_completed');
      const hasCompletedAtColumn = columns.some(col => col.name === 'completed_at');
      
      if (!hasCompletedColumn) {
        // console.log('main::index.js::DataBaseService::Adding is_completed column to goals...');
        this.db.exec("ALTER TABLE goals ADD COLUMN is_completed BOOLEAN DEFAULT 0");
        // console.log('main::index.js::DataBaseService::is_completed column added successfully');
      }
      
      if (!hasCompletedAtColumn) {
        // console.log('main::index.js::DataBaseService::Adding completed_at column to goals...');
        this.db.exec("ALTER TABLE goals ADD COLUMN completed_at DATETIME");
        // console.log('main::index.js::DataBaseService::completed_at column added successfully');
      }
    } catch (error) {
      console.error('main::index.js::DataBaseService::Goals migration error:', error);
    }

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

    // Todos table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        deadline_time TIME NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        completed_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.createIndexes();

    // Insert default categories
    this.insertDefaultCategories();
  }

  createIndexes() {
    // Index for time_entries date column (most frequently queried)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date)`);
    
    // Index for time_entries category_id (for JOIN operations)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_time_entries_category_id ON time_entries(category_id)`);
    
    // Index for date and category_id together (for complex queries)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_time_entries_date_category ON time_entries(date, category_id)`);
    
    // Index for categories is_system_category (for filtering)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_categories_system ON categories(is_system_category)`);
    
    // Index for goals is_active (for filtering active goals)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(is_active)`);
    
    // Index for goals is_completed (for filtering completed goals)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(is_completed)`);
    
    // Index for todos start_date (for filtering by date)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_start_date ON todos(start_date)`);
    
    // Index for todos is_completed (for filtering completed todos)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(is_completed)`);
    
    // console.log('main::index.js::DataBaseService::Database indexes created');
  }

  insertDefaultCategories() {
    const defaultCategories = [
      { name: 'Coding', description: 'Programming and software development', color: '#10B981', isSystem: false },
      { name: 'Study', description: 'Learning and educational activities', color: '#3B82F6', isSystem: false },
      { name: 'Work', description: 'Professional work activities', color: '#F59E0B', isSystem: false },
      { name: 'Exercise', description: 'Physical fitness and health', color: '#EF4444', isSystem: false },
      { name: 'Time Waste', description: 'Unproductive activities', color: '#EF4444', isSystem: true }
    ];

    const existingCategories = this.getCategories();
    if (existingCategories.length === 0) {
      defaultCategories.forEach(category => {
        this.createCategory(category.name, category.description, category.color, category.isSystem);
      });
    } else {
      // Check if Time Waste category exists and update it to be a system category
      const timeWasteCategory = existingCategories.find(cat => cat.name === 'Time Waste');
      if (timeWasteCategory && !timeWasteCategory.is_system_category) {
        this.db.prepare('UPDATE categories SET is_system_category = 1, color = ? WHERE name = ?')
          .run('#EF4444', 'Time Waste');
      } else if (!timeWasteCategory) {
        // If Time Waste doesn't exist, create it as a system category
        this.createCategory('Time Waste', 'Unproductive activities', '#EF4444', true);
      }
    }
  }

  getCategories() {
    return this.db.prepare('SELECT * FROM categories ORDER BY name').all();
  }

  createCategory(name, description = '', color = '#3B82F6', isSystemCategory = false) {
    return this.db.prepare('INSERT INTO categories (name, description, color, is_system_category) VALUES (?, ?, ?, ?)')
      .run(name, description, color, isSystemCategory ? 1 : 0);
  }

  updateCategory(id, name, description, color) {
    // Prevent updating system categories
    const category = this.db.prepare('SELECT is_system_category FROM categories WHERE id = ?').get(id);
    if (category && category.is_system_category) {
      throw new Error('Cannot modify system categories');
    }
    return this.db.prepare('UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ?')
      .run(name, description, color, id);
  }

  deleteCategory(id) {
    // Prevent deleting system categories
    const category = this.db.prepare('SELECT is_system_category FROM categories WHERE id = ?').get(id);
    if (category && category.is_system_category) {
      throw new Error('Cannot delete system categories');
    }
    return this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  getGoals(includeCompleted = false) {
    // First get all goals (active and optionally completed)
    let query = `SELECT * FROM goals WHERE is_active = 1`;
    if (!includeCompleted) {
      query += ` AND is_completed = 0`;
    }
    query += ` ORDER BY is_completed ASC, created_at DESC`;
    
    const goals = this.db.prepare(query).all();

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

  markGoalAsCompleted(id) {
    return this.db.prepare('UPDATE goals SET is_completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }

  markGoalAsIncomplete(id) {
    return this.db.prepare('UPDATE goals SET is_completed = 0, completed_at = NULL WHERE id = ?').run(id);
  }

  getCompletedGoals() {
    // Get completed goals with their targets
    const goals = this.db.prepare(`
      SELECT * FROM goals 
      WHERE is_active = 1 AND is_completed = 1
      ORDER BY completed_at DESC
    `).all();

    // Get targets for each goal
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
        c.is_system_category,
        COALESCE(SUM(te.duration_hours), 0) as total_hours,
        COUNT(DISTINCT te.date) as active_days
      FROM categories c
      LEFT JOIN time_entries te ON c.id = te.category_id 
        AND te.date BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.color, c.is_system_category
      ORDER BY c.is_system_category ASC, total_hours DESC
    `).all(startDate, endDate);
  }

  getProductiveCategoryStats(startDate, endDate) {
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
      WHERE c.is_system_category = 0
      GROUP BY c.id, c.name, c.color
      ORDER BY total_hours DESC
    `).all(startDate, endDate);
  }

  getWasteTimeStats(startDate, endDate) {
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
      WHERE c.is_system_category = 1
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
      WHERE g.is_active = 1 AND c.is_system_category = 0
      GROUP BY g.id, gt.category_id, gt.target_hours
      ORDER BY g.id, c.name
    `).all();
  }

  getStreakData() {
    // Only count dates with productive activities (non-system categories)
    const allEntries = this.db.prepare(`
      SELECT DISTINCT te.date
      FROM time_entries te
      JOIN categories c ON te.category_id = c.id
      WHERE c.is_system_category = 0
      ORDER BY te.date DESC
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

  // Todo methods
  getTodos(startDate = null, endDate = null) {
    let query = `
      SELECT * FROM todos 
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND start_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND start_date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY start_date DESC, deadline_time ASC`;

    return this.db.prepare(query).all(...params);
  }

  getTodosByDate(date) {
    return this.db.prepare(`
      SELECT * FROM todos 
      WHERE start_date = ?
      ORDER BY deadline_time ASC
    `).all(date);
  }

  createTodo(title, description, startDate, deadlineTime) {
    return this.db.prepare(`
      INSERT INTO todos (title, description, start_date, deadline_time) 
      VALUES (?, ?, ?, ?)
    `).run(title, description, startDate, deadlineTime);
  }

  updateTodo(id, title, description, startDate, deadlineTime) {
    return this.db.prepare(`
      UPDATE todos 
      SET title = ?, description = ?, start_date = ?, deadline_time = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, startDate, deadlineTime, id);
  }

  deleteTodo(id) {
    return this.db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  }

  markTodoCompleted(id) {
    return this.db.prepare(`
      UPDATE todos 
      SET is_completed = 1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
  }

  markTodoIncomplete(id) {
    return this.db.prepare(`
      UPDATE todos 
      SET is_completed = 0, completed_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
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
    // console.log('main::index.js::initializeDatabase::Initializing database...')
    dbService = new DatabaseService()
    // console.log('main::index.js::initializeDatabase::Database initialized successfully')
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
      // // console.log('main::index.js::ipcHandler::get-categories::Getting categories...')
      const result = dbService.getCategories()
      // // console.log('main::index.js::ipcHandler::get-categories::Categories fetched:', result.length)
      return result
    } catch (error) {
      // console.error('main::index.js::ipcHandler::get-categories::Error getting categories:', error)
      return []
    }
  })

  ipcMain.handle('create-category', async (event, name, description, color) => {
    try {
      // // console.log('main::index.js::ipcHandler::create-category::Creating category:', name)
      return dbService.createCategory(name, description, color)
    } catch (error) {
      // console.error('main::index.js::ipcHandler::create-category::Error creating category:', error)
      throw error
    }
  })

  ipcMain.handle('update-category', async (event, id, name, description, color) => {
    try {
      // // console.log('main::index.js::ipcHandler::update-category::Updating category:', id)
      return dbService.updateCategory(id, name, description, color)
    } catch (error) {
      // console.error('main::index.js::ipcHandler::update-category::Error updating category:', error)
      throw error
    }
  })

  ipcMain.handle('delete-category', async (event, id) => {
    try {
      // console.log('main::index.js::ipcHandler::delete-category::Deleting category:', id)
      return dbService.deleteCategory(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::delete-category::Error deleting category:', error)
      throw error
    }
  })

  // Goal IPC handlers
  ipcMain.handle('get-goals', async () => {
    try {
      // console.log('main::index.js::ipcHandler::get-goals::Getting goals...')
      const result = dbService.getGoals()
      // console.log('main::index.js::ipcHandler::get-goals::Goals fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-goals::Error getting goals:', error)
      return []
    }
  })

  ipcMain.handle('create-goal', async (event, title, description, startDate, endDate, targets) => {
    try {
      // console.log('main::index.js::ipcHandler::create-goal::Creating goal:', title)
      return dbService.createGoal(title, description, startDate, endDate, targets)
    } catch (error) {
      console.error('main::index.js::ipcHandler::create-goal::Error creating goal:', error)
      throw error
    }
  })

  ipcMain.handle('update-goal', async (event, id, title, description, startDate, endDate) => {
    try {
      // console.log('main::index.js::ipcHandler::update-goal::Updating goal:', id)
      return dbService.updateGoal(id, title, description, startDate, endDate)
    } catch (error) {
      console.error('main::index.js::ipcHandler::update-goal::Error updating goal:', error)
      throw error
    }
  })

  ipcMain.handle('delete-goal', async (event, id) => {
    try {
      // console.log('main::index.js::ipcHandler::delete-goal::Deleting goal:', id)
      return dbService.deleteGoal(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::delete-goal::Error deleting goal:', error)
      throw error
    }
  })

  ipcMain.handle('mark-goal-completed', async (event, id) => {
    try {
      // console.log('main::index.js::ipcHandler::mark-goal-completed::Marking goal as completed:', id)
      return dbService.markGoalAsCompleted(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::mark-goal-completed::Error marking goal as completed:', error)
      throw error
    }
  })

  ipcMain.handle('mark-goal-incomplete', async (event, id) => {
    try {
      // console.log('main::index.js::ipcHandler::mark-goal-incomplete::Marking goal as incomplete:', id)
      return dbService.markGoalAsIncomplete(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::mark-goal-incomplete::Error marking goal as incomplete:', error)
      throw error
    }
  })

  ipcMain.handle('get-completed-goals', async () => {
    try {
      // console.log('main::index.js::ipcHandler::get-completed-goals::Getting completed goals...')
      const result = dbService.getCompletedGoals()
      // console.log('main::index.js::ipcHandler::get-completed-goals::Completed goals fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-completed-goals::Error getting completed goals:', error)
      return []
    }
  })

  // Time entry IPC handlers
  ipcMain.handle('get-time-entries', async (event, startDate, endDate) => {
    try {
      // console.log('main::index.js::ipcHandler::get-time-entries::Getting time entries...')
      const result = dbService.getTimeEntries(startDate, endDate)
      // console.log('main::index.js::ipcHandler::get-time-entries::Time entries fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-time-entries::Error getting time entries:', error)
      return []
    }
  })

  ipcMain.handle('create-time-entry', async (event, date, categoryId, durationHours, description) => {
    try {
      // console.log('main::index.js::ipcHandler::create-time-entry::Creating time entry for date:', date)
      return dbService.createTimeEntry(date, categoryId, durationHours, description)
    } catch (error) {
      console.error('main::index.js::ipcHandler::create-time-entry::Error creating time entry:', error)
      throw error
    }
  })

  ipcMain.handle('update-time-entry', async (event, id, date, categoryId, durationHours, description) => {
    try {
      // console.log('main::index.js::ipcHandler::update-time-entry::Updating time entry:', id)
      return dbService.updateTimeEntry(id, date, categoryId, durationHours, description)
    } catch (error) {
      console.error('main::index.js::ipcHandler::update-time-entry::Error updating time entry:', error)
      throw error
    }
  })

  ipcMain.handle('delete-time-entry', async (event, id) => {
    try {
      // console.log('main::index.js::ipcHandler::delete-time-entry::Deleting time entry:', id)
      return dbService.deleteTimeEntry(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::delete-time-entry::Error deleting time entry:', error)
      throw error
    }
  })

  // Statistics IPC handlers
  ipcMain.handle('get-category-stats', async (event, startDate, endDate) => {
    try {
      // console.log('main::index.js::ipcHandler::get-category-stats::Getting category stats...')
      const result = dbService.getCategoryStats(startDate, endDate)
      // console.log('main::index.js::ipcHandler::get-category-stats::Category stats fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-category-stats::Error getting category stats:', error)
      return []
    }
  })

  ipcMain.handle('get-productive-category-stats', async (event, startDate, endDate) => {
    try {
      // console.log('main::index.js::ipcHandler::get-productive-category-stats::Getting productive category stats...')
      const result = dbService.getProductiveCategoryStats(startDate, endDate)
      // console.log('main::index.js::ipcHandler::get-productive-category-stats::Productive stats fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-productive-category-stats::Error getting productive stats:', error)
      return []
    }
  })

  ipcMain.handle('get-waste-time-stats', async (event, startDate, endDate) => {
    try {
      // console.log('main::index.js::ipcHandler::get-waste-time-stats::Getting waste time stats...')
      const result = dbService.getWasteTimeStats(startDate, endDate)
      // console.log('main::index.js::ipcHandler::get-waste-time-stats::Waste time stats fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-waste-time-stats::Error getting waste time stats:', error)
      return []
    }
  })

  ipcMain.handle('get-goal-progress', async () => {
    try {
      // console.log('main::index.js::ipcHandler::get-goal-progress::Getting goal progress...')
      const result = dbService.getGoalProgress()
      // console.log('main::index.js::ipcHandler::get-goal-progress::Goal progress fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-goal-progress::Error getting goal progress:', error)
      return []
    }
  })

  ipcMain.handle('get-streak-data', async () => {
    try {
      // console.log('main::index.js::ipcHandler::get-streak-data::Getting streak data...')
      const result = dbService.getStreakData()
      // console.log('main::index.js::ipcHandler::get-streak-data::Streak data fetched:', result)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-streak-data::Error getting streak data:', error)
      return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 }
    }
  })

  // Todo IPC handlers
  ipcMain.handle('get-todos', async (event, startDate, endDate) => {
    try {
      // console.log('main::index.js::ipcHandler::get-todos::Getting todos...')
      const result = dbService.getTodos(startDate, endDate)
      // console.log('main::index.js::ipcHandler::get-todos::Todos fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-todos::Error getting todos:', error)
      return []
    }
  })

  ipcMain.handle('get-todos-by-date', async (event, date) => {
    try {
      // console.log('main::index.js::ipcHandler::get-todos-by-date::Getting todos for date:', date)
      const result = dbService.getTodosByDate(date)
      // console.log('main::index.js::ipcHandler::get-todos-by-date::Todos fetched:', result.length)
      return result
    } catch (error) {
      console.error('main::index.js::ipcHandler::get-todos-by-date::Error getting todos by date:', error)
      return []
    }
  })

  ipcMain.handle('create-todo', async (event, title, description, startDate, deadlineTime) => {
    try {
      // console.log('main::index.js::ipcHandler::create-todo::Creating todo:', title)
      return dbService.createTodo(title, description, startDate, deadlineTime)
    } catch (error) {
      console.error('main::index.js::ipcHandler::create-todo::Error creating todo:', error)
      throw error
    }
  })

  ipcMain.handle('update-todo', async (event, id, title, description, startDate, deadlineTime) => {
    try {
      // console.log('main::index.js::ipcHandler::update-todo::Updating todo:', id)
      return dbService.updateTodo(id, title, description, startDate, deadlineTime)
    } catch (error) {
      console.error('main::index.js::ipcHandler::update-todo::Error updating todo:', error)
      throw error
    }
  })

  ipcMain.handle('delete-todo', async (event, id) => {
    try {
      // console.log('main::index.js::ipcHandler::delete-todo::Deleting todo:', id)
      return dbService.deleteTodo(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::delete-todo::Error deleting todo:', error)
      throw error
    }
  })

  ipcMain.handle('mark-todo-completed', async (event, id) => {
    try {
      // console.log('main::index.js::ipcHandler::mark-todo-completed::Marking todo as completed:', id)
      return dbService.markTodoCompleted(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::mark-todo-completed::Error marking todo as completed:', error)
      throw error
    }
  })

  ipcMain.handle('mark-todo-incomplete', async (event, id) => {
    try {
      // console.log('main::index.js::ipcHandler::mark-todo-incomplete::Marking todo as incomplete:', id)
      return dbService.markTodoIncomplete(id)
    } catch (error) {
      console.error('main::index.js::ipcHandler::mark-todo-incomplete::Error marking todo as incomplete:', error)
      throw error
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