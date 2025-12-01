import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import User from "./pages/User"; // Pastikan ini import User, bukan Users
import Produk from "./pages/Produk";
import Kupon from "./pages/Kupon";
import Karyawan from "./pages/Karyawan";
import Order from "./pages/Order";

export default function App() {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "user": return <User />; // Pastikan ini User, bukan Users
      case "produk": return <Produk />;
      case "kupon": return <Kupon />;
      case "karyawan": return <Karyawan />;
      case "order": return <Order />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setPage={setPage} page={page} />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="p-6 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}