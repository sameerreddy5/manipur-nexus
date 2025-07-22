import { useState, useEffect } from 'react';

interface User {
  email: string;
  role: string;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User>({
    email: '',
    role: '',
    isAuthenticated: false
  });

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('iiitm_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser({
        email: userData.email,
        role: userData.role,
        isAuthenticated: true
      });
    }
  }, []);

  const login = (email: string, role: string) => {
    const userData = { email, role };
    localStorage.setItem('iiitm_user', JSON.stringify(userData));
    setUser({
      email,
      role,
      isAuthenticated: true
    });
  };

  const logout = () => {
    localStorage.removeItem('iiitm_user');
    setUser({
      email: '',
      role: '',
      isAuthenticated: false
    });
  };

  return {
    user,
    login,
    logout
  };
};