import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Create authentication context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // State for authentication status and loading indicator
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user); // Set authentication status
      setLoading(false); // Set loading to false after state change
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading }}>
      {children} {/* Render children within the provider */}
    </AuthContext.Provider>
  );
};

// Hook to use the authentication context
export const useAuth = () => useContext(AuthContext);

