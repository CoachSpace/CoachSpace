import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

// Single master password - change this to whatever you want
const ADMIN_PASSWORD = 'acesystem2024';

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Persist admin session in sessionStorage (clears when browser tab closes)
    const stored = sessionStorage.getItem('ace_admin');
    if (stored === 'true') setIsAdmin(true);
  }, []);

  const login = (password) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem('ace_admin', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('ace_admin');
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
