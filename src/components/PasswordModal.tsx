// ============================================================================
// PASSWORD MODAL - Simple password protection for app access
// ============================================================================

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { getButtonClasses, getInputClasses, getHeadingClasses, getBodyClasses } from '../utils/styleUtils';

interface PasswordModalProps {
  onAuthenticated: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password hash (SHA-256 of 'ccgtm2025')
  // To generate a new hash for a different password:
  // console.log(Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-password')))).map(b => b.toString(16).padStart(2, '0')).join(''))
  const CORRECT_PASSWORD_HASH = 'f4dfe7023ce10724dad67b80c70cef461dd9ba3b092ae2c69530d646182f088d';

  // Helper function to hash the entered password
  const hashPassword = async (inputPassword: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(inputPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Add a small delay to prevent brute force attempts
      await new Promise(resolve => setTimeout(resolve, 500));

      // Hash the entered password and compare with stored hash
      const inputPasswordHash = await hashPassword(password);
      
      if (inputPasswordHash === CORRECT_PASSWORD_HASH) {
        // Store authentication in session storage
        sessionStorage.setItem('app_authenticated', 'true');
        onAuthenticated();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      setError('Authentication error. Please try again.');
      setPassword('');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className={`${getHeadingClasses('h2')} mb-2`}>Access Required</h1>
          <p className={`${getBodyClasses('base')} text-gray-600`}>
            Please enter the password to access the application.
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${getInputClasses()} pr-12`}
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className={`w-full ${getButtonClasses('primary')} flex items-center justify-center ${
              isLoading || !password.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Checking...
              </>
            ) : (
              'Enter'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This application is for authorized users only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;