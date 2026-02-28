import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('planora_token');
    const savedUser = localStorage.getItem('planora_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      authService.getProfile()
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('planora_token');
          localStorage.removeItem('planora_user');
          setUser(null);
        });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('planora_token', token);
    localStorage.setItem('planora_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    const { token, user } = res.data;
    localStorage.setItem('planora_token', token);
    localStorage.setItem('planora_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('planora_token');
    localStorage.removeItem('planora_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('planora_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
