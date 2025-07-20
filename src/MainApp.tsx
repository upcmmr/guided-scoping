// ============================================================================
// MAIN APP - Router between Admin and User interfaces
// ============================================================================

import React, { useState } from 'react';
import ScopingEstimationTool from './App';
import UserApp from './components/UserApp';

type AppMode = 'user' | 'admin';

const MainApp: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('user');

  const switchToAdmin = () => setCurrentMode('admin');
  const switchToUser = () => setCurrentMode('user');

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
            User View
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
        <ScopingEstimationTool />
      ) : (
        <UserApp onSwitchToAdmin={switchToAdmin} />
      )}
    </div>
  );
};

export default MainApp; 