import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STORAGE_KEY_UUID = 'swag_user_key';
const STORAGE_KEY_NAME = 'swag_user_name';

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Generate UUID (with fallback for older browsers)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check localStorage on mount for auto-login
  useEffect(() => {
    const checkExistingSession = async () => {
      const storedKey = localStorage.getItem(STORAGE_KEY_UUID);
      const storedName = localStorage.getItem(STORAGE_KEY_NAME);

      if (storedKey && storedName) {
        try {
          // Verify with backend
          const response = await axios.post(`${API}/auth/guest`, {
            key: storedKey,
            name: storedName,
          });

          if (response.data.success) {
            setUser(response.data.user);
          }
        } catch (err) {
          console.error('Auto-login failed:', err);
          // Clear invalid session
          localStorage.removeItem(STORAGE_KEY_UUID);
          localStorage.removeItem(STORAGE_KEY_NAME);
        }
      }
      setLoading(false);
    };

    checkExistingSession();
  }, []);

  // Login function - generates new UUID and calls backend
  const login = useCallback(async (name) => {
    setError(null);
    setLoading(true);

    try {
      const newKey = generateUUID();
      
      const response = await axios.post(`${API}/auth/guest`, {
        key: newKey,
        name: name.trim(),
      });

      if (response.data.success) {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY_UUID, response.data.user.key);
        localStorage.setItem(STORAGE_KEY_NAME, response.data.user.name);
        
        setUser(response.data.user);
        return { success: true, isNewUser: response.data.is_new_user };
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to login. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_UUID);
    localStorage.removeItem(STORAGE_KEY_NAME);
    setUser(null);
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isLoggedIn: !!user,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
