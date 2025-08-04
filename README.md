# 🕒 GreenTime - Time Tracker Application

GreenTime is a modern, Windows-optimized desktop time tracking application built with Electron, React, and Tailwind CSS. It helps users categorize their daily activities, set productivity goals, and track progress with insightful statistics.

## ✨ Features

### 📂 Category Management
- Create, edit, and delete custom categories
- Color-coded organization for easy identification
- Default categories: Coding, Study, Work, Exercise, Time Waste

### 🎯 Goal Setting & Tracking
- Set specific time targets for each category
- Track progress with visual progress bars
- Support for goal deadlines and date ranges
- Multi-category goals with individual targets

### 📅 Calendar Integration
- Interactive monthly calendar view
- Visual indicators for days with time entries
- Easy time logging for any date
- Quick entry editing and deletion

### ⏱️ Time Logging
- Manual time entry with hours and minutes
- Category selection and descriptions
- Edit and delete existing entries
- Bulk time tracking support

### 📊 Statistics & Analytics
- Weekly/Monthly/All-time statistics
- Category breakdown with percentages
- Goal progress tracking
- Streak tracking (consecutive active days)
- Weekly trends and patterns

### 🎨 Modern UI/UX
- Clean, modern interface with Tailwind CSS
- Dark mode support
- Responsive design optimized for desktop
- Smooth animations and transitions

## 🛠️ Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Desktop Framework**: Electron.js
- **Build Tool**: Vite (electron-vite)
- **Database**: SQLite (better-sqlite3)
- **State Management**: Zustand
- **Calendar**: react-calendar
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone [<repository-url>](https://github.com/adnanAliSDE/greentime/)
   cd greentime
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
# Build the application
npm run build

# Create distributable packages
npm run dist
```

## 📁 Project Structure

```
greentime/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.js       # Main application entry
│   │   └── database.js    # SQLite database service
│   ├── preload/           # Electron preload scripts
│   │   └── index.js       # IPC API exposure
│   └── renderer/          # React frontend
│       └── src/
│           ├── components/    # React components
│           ├── store/         # Zustand stores
│           ├── assets/        # CSS and assets
│           └── App.jsx        # Main app component
├── resources/             # Application resources
└── build/                # Build configuration
```

## 🗃️ Database Schema

The application uses SQLite with the following tables:

- **categories**: Store category information (name, description, color)
- **goals**: Store goal definitions with date ranges
- **goal_targets**: Link goals to categories with target hours
- **time_entries**: Store individual time logs

## 🎯 Usage Guide

### Creating Categories
1. Navigate to the Categories view
2. Click "Add Category"
3. Enter name, description, and select a color
4. Save to create the category

### Setting Goals
1. Go to the Goals view
2. Click "Create Goal"
3. Enter goal title and description
4. Set start and end dates (optional)
5. Add category targets with hour amounts
6. Save to activate the goal

### Logging Time
1. Use the "Log Time" button in Dashboard or Calendar
2. Select date, category, and duration
3. Add optional description
4. Save the entry

### Viewing Statistics
1. Navigate to Statistics view
2. Use period filters (Week/Month/All Time)
3. View category breakdowns and goal progress
4. Monitor streak information

## 🔧 Configuration

The application stores data locally in SQLite database:
- **Windows**: `%APPDATA%/greentime/greentime.db`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Common Issues

**Application won't start:**
- Ensure all dependencies are installed: `npm install`
- Check Node.js version compatibility (v16+)

**Database errors:**
- Delete the database file to reset: `%APPDATA%/greentime/greentime.db`
- Restart the application

**Build issues:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for platform-specific build requirements

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

---

Built with ❤️ using Electron, React, and modern web technologies.
