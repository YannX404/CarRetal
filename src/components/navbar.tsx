import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search, Bell, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';

interface NavbarProps {
  onAuthClick: () => void;
  onSearchClick: () => void;
  onNotificationClick: () => void;
}

export function Navbar({ onAuthClick, onSearchClick, onNotificationClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      loadUnreadNotifications();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id)
        .eq('read', false);
      
      setUnreadCount(count || 0);

      // Subscribe to notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        }, () => {
          loadUnreadNotifications();
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-lg fixed w-full z-40 rounded-b-[2rem]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                src="/images/logo.png"
                alt="WilkaDeals"
                className="h-12 w-auto"
              />
              <motion.span
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="ml-3 text-2xl font-bold text-gray-900"
              >
                WilkaDeals
              </motion.span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSearchClick}
                className="group flex items-center px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors rounded-xl hover:bg-gray-100"
              >
                <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Rechercher
              </motion.button>
              
              <Link to="/" className="relative group">
                <span className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-xl font-medium transition-colors">
                  Accueil
                </span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
              <Link to="/vehicles" className="relative group">
                <span className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-xl font-medium transition-colors">
                  Véhicules
                </span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
              <Link to="/about" className="relative group">
                <span className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-xl font-medium transition-colors">
                  À propos
                </span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
              <Link to="/contact" className="relative group">
                <span className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-xl font-medium transition-colors">
                  Contact
                </span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
            </div>

            <div className="flex items-center space-x-4 ml-4">
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNotificationClick}
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Bell className="h-6 w-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0 right-0 h-5 w-5 bg-primary-600 rounded-full text-xs text-white flex items-center justify-center"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </motion.button>
              )}

              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to={isAdmin ? '/admin' : '/account'}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                      {isAdmin ? 'Admin' : 'Mon Compte'}
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors rounded-xl hover:bg-gray-100"
                  >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAuthClick}
                  className="bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Se connecter
                </motion.button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSearchClick}
              className="p-2 rounded-xl hover:bg-gray-100"
            >
              <Search className="h-6 w-6 text-gray-600" />
            </motion.button>
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNotificationClick}
                className="relative p-2 rounded-xl hover:bg-gray-100"
              >
                <Bell className="h-6 w-6 text-gray-600" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 h-5 w-5 bg-primary-600 rounded-full text-xs text-white flex items-center justify-center"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <div className="space-y-1">
                    <Link
                      to="/"
                      className="block px-4 py-3 text-base font-medium text-gray-900 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Accueil
                    </Link>
                    <Link
                      to="/vehicles"
                      className="block px-4 py-3 text-base font-medium text-gray-900 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Véhicules
                    </Link>
                    <Link
                      to="/about"
                      className="block px-4 py-3 text-base font-medium text-gray-900 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      À propos
                    </Link>
                    <Link
                      to="/contact"
                      className="block px-4 py-3 text-base font-medium text-gray-900 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Contact
                    </Link>
                  </div>
                </div>

                <div className="p-4 border-t space-y-4">
                  {user ? (
                    <>
                      <Link to={isAdmin ? '/admin' : '/account'} onClick={() => setIsMenuOpen(false)}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 transition-colors shadow-lg text-base font-medium"
                        >
                          {isAdmin ? 'Admin' : 'Mon Compte'}
                        </motion.button>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-700 hover:text-primary-600 transition-colors rounded-xl hover:bg-gray-100 text-base font-medium"
                      >
                        <LogOut className="h-5 w-5" />
                        Déconnexion
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsMenuOpen(false);
                        onAuthClick();
                      }}
                      className="w-full bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 transition-colors shadow-lg text-base font-medium"
                    >
                      Se connecter
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}