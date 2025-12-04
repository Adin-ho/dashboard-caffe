import { FiBell, FiSearch, FiMenu } from 'react-icons/fi';
import { useState } from 'react';

const Navbar = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Search and Menu Toggle */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <FiMenu size={20} />
          </button>
          
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Right: Notifications & User */}
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <FiBell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <p className="font-medium">{user?.name || user?.username || 'Admin'}</p>
              <p className="text-sm text-gray-500">{user?.role || 'Administrator'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <button className="w-full px-4 py-2 text-left hover:bg-gray-200 rounded">Dashboard</button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-200 rounded">Users</button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-200 rounded">Products</button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-200 rounded">Coupons</button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-200 rounded">Employees</button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-200 rounded">Orders</button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;