
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { handleApiError } from '@/utils/errorHandling';

type UserRole = 'admin' | 'user' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user role from the database
  const fetchUserRole = async (userId: string) => {
    try {
      // For now, we'll set a default role of 'user'
      // In a real app, you would fetch this from your profiles or user_roles table
      setRole('user');
      
      // Example of how to fetch from a user_roles table (if implemented)
      // const { data, error } = await supabase
      //   .from('user_roles')
      //   .select('role')
      //   .eq('user_id', userId)
      //   .single();
      
      // if (error) {
      //   handleApiError(error);
      //   setRole('user'); // Default role
      // } else if (data) {
      //   setRole(data.role as UserRole);
      // }
    } catch (error) {
      handleApiError(error);
      setRole('user'); // Default to user role
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        
        if (event === 'SIGNED_IN' && currentUser) {
          // Fetch user role after sign in
          await fetchUserRole(currentUser.id);
          toast.success('Successfully signed in');
        } else if (event === 'SIGNED_OUT') {
          setRole(null);
          toast.info('Signed out');
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(currentSession);
        
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserRole(currentUser.id);
        }
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const toastId = toast.loading('Signing in...');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.dismiss(toastId);
      navigate('/');
    } catch (error: any) {
      toast.dismiss(toastId);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const toastId = toast.loading('Creating your account...');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name,
            role: 'user', // Default role for new users
          },
        },
      });
      
      if (error) throw error;
      
      toast.dismiss(toastId);
      toast.success('Sign up successful. Please check your email to confirm your account.', {
        duration: 6000,
      });
      navigate('/auth');
    } catch (error: any) {
      toast.dismiss(toastId);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const toastId = toast.loading('Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.dismiss(toastId);
      // Navigation will be handled by the auth state change listener
    } catch (error: any) {
      toast.dismiss(toastId);
      handleApiError(error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, role, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
