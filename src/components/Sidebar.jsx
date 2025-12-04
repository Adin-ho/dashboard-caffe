import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiPackage, 
  FiTag, 
  FiUser, 
  FiShoppingBag,
  FiLogOut
} from 'react-icons/fi';

const Sidebar = ({ user, onLogout }) => {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/users', label: 'User', icon: <FiUsers /> },
    { path: '/produk', label: 'Produk', icon: <FiPackage /> },
    { path: '/kupon', label: 'Kupon', icon: <FiTag /> },
    { path: '/karyawan', label: 'Karyawan', icon: <FiUser /> },
    { path: '/order', label: 'Order', icon: <FiShoppingBag /> },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Kedai GenZ</p>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center px-4 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
            <span className="font-bold text-lg">
              {user?.name?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium">{user?.name || user?.username || 'Admin'}</p>
            <p className="text-sm text-gray-400">{user?.role || 'Administrator'}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <FiLogOut className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;