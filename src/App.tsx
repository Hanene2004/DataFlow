import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider, useData } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import { Layout } from './components/Layout/Layout';
import { Auth } from './components/Auth';
import { Toaster } from 'react-hot-toast';
import { DataConcierge } from './components/DataConcierge';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { CleaningPage } from './pages/CleaningPage';
import { ReportsPage } from './pages/ReportsPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { HistoryPage } from './pages/HistoryPage';
import { SharedReportPage } from './pages/SharedReportPage';
import { SharedDashboardPage } from './pages/SharedDashboardPage';
import { DataGuidePage } from './pages/DataGuidePage';
// import { SettingsPage } from './pages/SettingsPage';

function AppRoutes() {
  const { session, loadingSession } = useData();

  if (loadingSession) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/share/:id" element={<SharedReportPage />} />
      <Route path="/view/:id" element={<SharedDashboardPage />} />
      <Route
        path="*"
        element={
          !session ? (
            <Auth />
          ) : (
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/cleaning" element={<CleaningPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/guide" element={<DataGuidePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <SettingsProvider>
          <DataProvider>
            <NotificationProvider>
              <AppRoutes />
              <DataConcierge />

              <Toaster position="top-right" toastOptions={{
                className: 'dark:bg-slate-800 dark:text-white',
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }} />
            </NotificationProvider>
          </DataProvider>
        </SettingsProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
