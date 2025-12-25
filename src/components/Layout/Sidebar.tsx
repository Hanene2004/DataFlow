import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  BarChart2,
  FileText,
  Database,
  Sparkles,
  GitCompare,
  History,
  BookOpen,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SettingsMenu } from './SettingsMenu';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const { session } = useData();
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/upload', icon: UploadCloud, label: 'Upload Data' },
    { path: '/analysis', icon: BarChart2, label: 'Analysis' },
    { path: '/cleaning', icon: Sparkles, label: 'Data Cleaning' },
    { path: '/comparison', icon: GitCompare, label: 'Comparison' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/guide', icon: BookOpen, label: 'Data Guide' },
  ];

  const sidebarVariants = {
    open: { width: 260, x: 0, transition: { duration: 0.3 } },
    closed: { width: 80, x: 0, transition: { duration: 0.3 } },
    mobileOpen: { x: 0, width: 280, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    mobileClosed: { x: '-100%', width: 280, transition: { type: 'spring', stiffness: 300, damping: 30 } }
  } as any;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.div
        initial={false}
        animate={
          window.innerWidth < 768
            ? (isOpen ? "mobileOpen" : "mobileClosed")
            : (isOpen ? "open" : "closed")
        }
        variants={sidebarVariants}
        className={`fixed md:relative inset-y-0 left-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-gray-100 dark:border-slate-700 h-screen flex flex-col z-50 shadow-2xl md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-700">
          <motion.div
            animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.8 }}
            className="flex items-center gap-2 font-bold text-2xl text-blue-600 dark:text-blue-400 overflow-hidden whitespace-nowrap"
          >
            <Database className="w-8 h-8 flex-shrink-0" />
            {isOpen && <span>DataFlow</span>}
          </motion.div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 768 && toggleSidebar()} // Close on click for mobile
              className={({ isActive }: { isActive: boolean }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'
                }
              `}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0`} />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
                {item.label}
              </span>

              {/* Tooltip for desktop closed state */}
              {!isOpen && (
                <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Settings Section */}
        <SettingsMenu isOpen={isOpen} />

        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-slate-800 flex-shrink-0">
              {session?.user?.email?.[0].toUpperCase() || 'U'}
            </div>
            {isOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.id === 'guest-user' ? 'Guest Mode' : 'Pro Plan'}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
