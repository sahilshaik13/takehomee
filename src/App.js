import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";
import LoginModal from "./components/LoginModal";
import CartSidebar from "./components/CartSidebar";
import HomePage from "./pages/HomePage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import "@/App.css";

// Main App Content that needs UserContext
const AppContent = () => {
  const { isLoggedIn, loading } = useUser();
  const location = useLocation();
  
  // Check if current route is admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-brand-blue rounded-full animate-spin" />
          <span className="font-mono text-xs tracking-widest uppercase text-zinc-400">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Only show login modal on non-admin routes */}
      {!isAdminRoute && <LoginModal isOpen={!isLoggedIn} />}
      {/* Only show cart sidebar on non-admin routes */}
      {!isAdminRoute && <CartSidebar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<OrderSuccessPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <CartProvider>
          <div className="App font-body">
            <AppContent />
          </div>
        </CartProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
