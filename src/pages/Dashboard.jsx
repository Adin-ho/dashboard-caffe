import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { 
  FiUsers, 
  FiPackage, 
  FiTag, 
  FiUser, 
  FiShoppingBag,
  FiTrendingUp,
  FiDollarSign,
  FiDatabase
} from "react-icons/fi";

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    coupons: 0,
    employees: 0,
    orders: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const cards = [
    { 
      title: "Total User", 
      value: stats.users, 
      icon: <FiUsers />,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      change: "+12%"
    },
    { 
      title: "Total Produk", 
      value: stats.products, 
      icon: <FiPackage />,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      change: "+8%"
    },
    { 
      title: "Total Kupon", 
      value: stats.coupons, 
      icon: <FiTag />,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      change: "+5%"
    },
    { 
      title: "Total Karyawan", 
      value: stats.employees, 
      icon: <FiUser />,
      color: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      change: "+3%"
    },
    { 
      title: "Total Order", 
      value: stats.orders, 
      icon: <FiShoppingBag />,
      color: "bg-gradient-to-r from-red-500 to-red-600",
      change: "+24%"
    },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setStats({
        users: 42,
        products: 156,
        coupons: 23,
        employees: 12,
        orders: 892,
        revenue: 12543000
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Selamat Datang, {user?.nama || user?.username}!</h1>
            <p className="text-gray-600 mt-2">Dashboard Coffe - Sistem Management Kedai GenZ</p>
          </div>
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center">
            <FiDatabase className="mr-2" />
            API Authentication
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-xl text-white`}>
                {card.icon}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-800">{card.value.toLocaleString()}</p>
                <p className="text-gray-600 text-sm mt-1">{card.title}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <span className="text-green-600 text-sm font-medium flex items-center">
                <FiTrendingUp className="mr-1" />
                {card.change} dari bulan lalu
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Total Pendapatan Bulan Ini</h3>
            <p className="text-3xl font-bold">Rp {stats.revenue.toLocaleString('id-ID')}</p>
            <div className="flex items-center mt-2">
              <FiTrendingUp className="mr-2" />
              <span>+18.2% dari bulan lalu</span>
            </div>
          </div>
          <div className="text-4xl">
            <FiDollarSign />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h3>
        <div className="space-y-4">
          {[
            { id: 1, message: 'Order baru #ORD-001234 diterima', time: '5 menit lalu', amount: 'Rp 125.000' },
            { id: 2, message: 'Pengguna baru mendaftar', time: '1 jam lalu', user: 'John Doe' },
            { id: 3, message: 'Produk baru ditambahkan', time: '2 jam lalu', product: 'Kopi Arabica' },
            { id: 4, message: 'Kupon promo dibuat', time: '3 jam lalu', code: 'DISKON20' },
          ].map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center p-4 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{activity.message}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
              {activity.amount && (
                <span className="font-bold text-green-600">{activity.amount}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}