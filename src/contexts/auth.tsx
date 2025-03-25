import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Initial session check
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        checkUserRole(currentUser.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await checkUserRole(currentUser.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.role === 'admin') {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phoneNumber: string) => {
    try {
      // Check if email exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
      }

      // Create auth account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            phone_number: phoneNumber,
            role: 'client',
            status: 'pending'
          });

        if (profileError) throw profileError;

        // Wait for user creation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create welcome notification
        await supabase
          .from('notifications')
          .insert({
            user_id: data.user.id,
            title: 'Bienvenue sur WilkaDeals !',
            message: 'Nous sommes ravis de vous compter parmi nous. Profitez d\'une réduction de 5 000 FCFA pour toute location d\'une semaine, et de 10 000 FCFA pour 3 semaines ou plus !',
            type: 'welcome'
          });

        toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email ou mot de passe incorrect');
        }
        throw error;
      }

      if (data.user) {
        // Get user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (userError) throw userError;
        if (!userData) throw new Error('Utilisateur non trouvé');

        toast.success('Connexion réussie !');

        // Redirect admin to admin page
        if (userData.role === 'admin') {
          navigate('/admin');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-pjfxverlorajrehmsyyt-auth-token');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });
      
      if (error) throw error;
      
      // Clear user state
      setUser(null);
      
      toast.success('Déconnexion réussie');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}