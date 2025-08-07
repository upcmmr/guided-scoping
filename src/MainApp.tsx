// ============================================================================
// MAIN APP - Router between Admin and User interfaces
// ============================================================================

import React, { useState, useEffect } from 'react';
import AdminApp from './components/AdminApp';
import UserApp from './components/UserApp';
import PasswordModal from './components/PasswordModal';

type AppMode = 'user' | 'admin';

const MainApp: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('user');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const authStatus = sessionStorage.getItem('app_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const switchToAdmin = () => setCurrentMode('admin');
  const switchToUser = () => setCurrentMode('user');

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return <PasswordModal onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mode Toggle - Fixed in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={switchToUser}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              currentMode === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            User Panel
          </button>
          <button
            onClick={switchToAdmin}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              currentMode === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Admin Panel
          </button>
        </div>
      </div>

      {/* Content */}
      {currentMode === 'admin' ? (
        <AdminApp />
      ) : (
        <UserApp onSwitchToAdmin={switchToAdmin} />
      )}
    </div>
  );
};

export default MainApp; 