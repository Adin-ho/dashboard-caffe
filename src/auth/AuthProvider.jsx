import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(false);

  // Get token from localStorage or env
  const getStoredToken = () => {
    return localStorage.getItem('token') || import.meta.env.VITE_API_TOKEN || '';
  };

  // API base URL
  const API_BASE = import.meta.env.VITE_API_URL || 'https://api-kedai-genz.vercel.app';
  
  // API endpoints
  const API_ENDPOINTS = {
    getKaryawan: `${API_BASE}/auth2/get-karyawan`,
    login: `${API_BASE}/login-karyawan`
  };

  // Headers with token
  const getHeaders = (includeToken = true) => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (includeToken) {
      const token = getStoredToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  };

  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentToken = getStoredToken();
        
        if (!currentToken) {
          // No token found, set loading to false
          setApiAvailable(false);
          setLoading(false);
          return;
        }

        // Try to fetch karyawan with token
        const response = await fetch(API_ENDPOINTS.getKaryawan, {
          method: 'GET',
          headers: getHeaders(true)
        });

        if (response.ok) {
          // API is available with this token
          setApiAvailable(true);
          setToken(currentToken);
          
          // Check if we have user data in localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (error) {
              console.error('Error parsing stored user:', error);
            }
          }
        } else if (response.status === 401) {
          // Token invalid or expired
          console.log('Token invalid or expired');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setApiAvailable(false);
        } else {
          // Other error
          console.log('API error:', response.status);
          setApiAvailable(false);
        }
      } catch (error) {
        console.error('API check error:', error);
        setApiAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    
    // Basic validation
    if (!username.trim() || !password.trim()) {
      setLoading(false);
      return {
        success: false,
        error: 'Username dan password harus diisi'
      };
    }

    try {
      // First, try to login with login endpoint
      const loginResponse = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      let loginData = null;
      try {
        if (loginResponse.ok) {
          loginData = await loginResponse.json();
        }
      } catch (e) {
        console.error('Error parsing login response:', e);
      }

      if (loginResponse.ok && loginData?.token) {
        // Login successful with API
        const userData = {
          id: loginData.id || `user-${Date.now()}`,
          username: username,
          nama: loginData.nama || username,
          role: loginData.role || 'karyawan',
          email: `${username}@kedaigenz.com`,
          token: loginData.token
        };

        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(loginData.token);
        setUser(userData);
        setApiAvailable(true);

        setLoading(false);
        return {
          success: true,
          data: userData,
          message: 'Login berhasil'
        };
      }

      // If login endpoint fails, try to get karyawan data with token
      const token = getStoredToken();
      if (token) {
        const karyawanResponse = await fetch(API_ENDPOINTS.getKaryawan, {
          method: 'GET',
          headers: getHeaders(true)
        });

        if (karyawanResponse.ok) {
          const karyawanData = await karyawanResponse.json();
          
          if (karyawanData?.data && Array.isArray(karyawanData.data)) {
            // Find user in karyawan data
            const foundUser = karyawanData.data.find(k => 
              k.username.toLowerCase() === username.toLowerCase()
            );

            if (foundUser) {
              // User found in karyawan data
              const userData = {
                id: foundUser.id,
                username: foundUser.username,
                nama: foundUser.nama,
                role: foundUser.role,
                email: `${foundUser.username}@kedaigenz.com`,
                token: token
              };

              localStorage.setItem('user', JSON.stringify(userData));
              setUser(userData);
              setApiAvailable(true);

              setLoading(false);
              return {
                success: true,
                data: userData,
                message: `Login berhasil sebagai ${foundUser.nama} (${foundUser.role})`
              };
            }
          }
        }
      }

      // If nothing works, return error
      setLoading(false);
      return {
        success: false,
        error: 'Login gagal. Periksa username dan password.'
      };

    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return {
        success: false,
        error: 'Terjadi kesalahan saat login'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setApiAvailable(false);
  };

  const value = {
    user,
    token,
    loading,
    apiAvailable,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};