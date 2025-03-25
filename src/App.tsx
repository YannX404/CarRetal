import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/auth';
import { Navbar } from './components/navbar';
import { BottomNav } from './components/bottom-nav';
import { Footer } from './components/footer';
import { HomePage } from './pages/home';
import { VehiclesPage } from './pages/vehicles';
import { AboutPage } from './pages/about';
import { ContactPage } from './pages/contact';
import { AccountPage } from './pages/account';
import AdminPage from './pages/admin';
import { AdminCreatePage } from './pages/admin-create';
import { AuthModal } from './components/auth-modal';
import { SearchModal } from './components/search-modal';
import { NotificationModal } from './components/notification-modal';
import { SplashScreen } from './components/splash-screen';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function App() {
  const location = useLocation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Open login modal if ?login=true in URL
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('login') === 'true') {
      setIsAuthOpen(true);
    }
  }, [location]);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show splash screen on page change
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const showNavigation = !location.pathname.includes('/admin/create');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AnimatePresence mode="wait">
          {isLoading && <SplashScreen />}
        </AnimatePresence>

        {showNavigation && (
          <Navbar 
            onAuthClick={() => setIsAuthOpen(true)}
            onSearchClick={() => setIsSearchOpen(true)}
            onNotificationClick={() => setIsNotificationOpen(true)}
          />
        )}
        
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/create" element={<AdminCreatePage />} />
          </Routes>
        </AnimatePresence>

        {showNavigation && <Footer />}

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <NotificationModal isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

        {showNavigation && <BottomNav currentPath={location.pathname} />}
        <Toaster position="top-center" />
      </div>
    </AuthProvider>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}