import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import JournalPage from './pages/JournalPage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import HabitsPage from './pages/HabitsPage';
import MoodPage from './pages/MoodPage';
import AIAssistantPage from './pages/AIAssistantPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse">
          <span className="text-white text-xl font-bold">P</span>
        </div>
        <p className="text-muted-foreground text-sm">Loading Planora...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(224, 20%, 9%)',
                color: 'hsl(210, 40%, 95%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="mood" element={<MoodPage />} />
              <Route path="ai" element={<AIAssistantPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
