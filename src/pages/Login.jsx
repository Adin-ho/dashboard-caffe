import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { FiUser, FiLock, FiLogIn, FiAlertCircle, FiEye, FiEyeOff, FiCheck, FiDatabase } from "react-icons/fi";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
  const { login, isAuthenticated, apiAvailable } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Get available accounts from API (using token from env)
  useEffect(() => {
    const fetchAccounts = async () => {
      setAccountsLoading(true);
      try {
        const token = import.meta.env.VITE_API_TOKEN || localStorage.getItem('token') || '';
        
        if (!token) {
          setAccountsLoading(false);
          return;
        }

        const response = await fetch('https://api-kedai-genz.vercel.app/auth2/get-karyawan', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.data && Array.isArray(data.data)) {
            setAvailableAccounts(data.data);
            
            // Set first account as default
            if (data.data.length > 0) {
              setFormData(prev => ({
                ...prev,
                username: data.data[0].username
              }));
            }
          }
        } else if (response.status === 401) {
          console.log('Token invalid for fetching accounts');
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setAccountsLoading(false);
      }
    };

    // Only fetch if we have a token
    const token = import.meta.env.VITE_API_TOKEN || localStorage.getItem('token');
    if (token) {
      fetchAccounts();
    } else {
      setAccountsLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Username dan password harus diisi");
      return;
    }

    setLoginLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        setSuccess(`✅ ${result.message}`);
        
        // Redirect after delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } else {
        setError(`❌ ${result.error}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("❌ Terjadi kesalahan saat login");
    } finally {
      setLoginLoading(false);
    }
  };

  const selectAccount = (account) => {
    setFormData({
      username: account.username,
      password: "" // Empty password for security
    });
    setError("");
    setSuccess(`Akun ${account.nama} dipilih. Silakan masukkan password.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Login Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <FiUser size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                  <p className="text-blue-100">Kedai GenZ Management System</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Masukkan username"
                      disabled={loginLoading}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Masukkan password"
                      disabled={loginLoading}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                      disabled={loginLoading}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <FiCheck className="h-5 w-5 text-green-500 mr-3" />
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <FiAlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  {loginLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <FiLogIn className="mr-2" size={18} />
                      Login
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Informasi Login</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Gunakan username yang terdaftar di sistem</p>
                  <p>• Pastikan password sesuai dengan yang didaftarkan</p>
                  <p>• Hubungi administrator jika mengalami masalah</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Account List & Info */}
          <div className="space-y-8">
            {/* Available Accounts */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-4">
                <FiDatabase className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Akun Tersedia</h2>
              </div>
              
              {accountsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-sm">Memuat data akun...</p>
                </div>
              ) : availableAccounts.length > 0 ? (
                <div className="space-y-3">
                  {availableAccounts.map((account) => (
                    <div 
                      key={account.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.username === account.username 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      onClick={() => selectAccount(account)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{account.nama}</h3>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="text-sm text-gray-600">@{account.username}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              account.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {account.role}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {account.id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FiAlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {apiAvailable ? 'Tidak ada akun tersedia' : 'Token tidak tersedia'}
                  </p>
                </div>
              )}
            </div>

            {/* Server Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Informasi Sistem</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Server API</p>
                  <p className="font-medium text-gray-800 truncate">api-kedai-genz.vercel.app</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status API</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    apiAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {apiAvailable ? '✅ Online' : '⚠️ Offline'}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Mode Autentikasi</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Token Bearer
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">Statistik Akun:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-blue-600">{availableAccounts.length}</p>
                      <p className="text-xs text-gray-500">Total Akun</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-purple-600">
                        {availableAccounts.filter(a => a.role === 'admin').length}
                      </p>
                      <p className="text-xs text-gray-500">Admin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Panduan Login</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                  <span>Gunakan username: <strong>jay</strong> (admin) atau <strong>jay3</strong> (karyawan)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                  <span>Password diambil dari database API</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                  <span>Token dari .env digunakan untuk autentikasi</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">© 2024 Kedai GenZ • Admin Panel v1.0</p>
          <p className="text-xs text-gray-500 mt-1">
            Sistem Management Terintegrasi • API Token Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;