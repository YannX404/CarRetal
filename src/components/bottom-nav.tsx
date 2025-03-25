import { Home, Car, Phone, User, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/auth';
import { useState, useEffect } from 'react';

interface BottomNavProps {
  currentPath: string;
}

export function BottomNav({ currentPath }: BottomNavProps) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/vehicles', icon: Car, label: 'Véhicules' },
    { path: '/about', icon: Info, label: 'À propos' },
    { path: '/contact', icon: Phone, label: 'Contact' },
    { path: isAdmin ? '/admin' : '/account', icon: User, label: isAdmin ? 'Admin' : 'Compte' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-30">
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="mx-auto max-w-screen-sm bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg px-6 py-4 border border-gray-200/50"
      >
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative"
              >
                <div className={cn(
                  "flex flex-col items-center transition-all duration-300 px-4",
                  isActive ? "text-primary-600" : "text-gray-500 hover:text-primary-500"
                )}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNav"
                      className="absolute -bottom-2 left-2 right-2 h-1 bg-primary-600 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}