
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
        console.log("Auth state change:", event);
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        
        if (event === 'SIGNED_IN' && currentUser) {
          // Fetch user role after sign in
          await fetchUserRole(currentUser.id);
          toast.success('Successfully signed in');
          navigate('/');
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
        console.error("Error initializing auth:", error);
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Sign in error:", error.message);
        toast.error(error.message || "Failed to sign in");
        throw error;
      }
      // Success will be handled by auth state change
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
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
      
      if (error) {
        console.error("Sign up error:", error.message);
        toast.error(error.message || "Failed to sign up");
        throw error;
      }
      
      toast.success('Sign up successful. Please check your email to confirm your account.', {
        duration: 6000,
      });
      navigate('/auth');
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error.message);
        toast.error(error.message || "Failed to sign out");
        throw error;
      }
      // Navigation will be handled by the auth state change listener
    } catch (error: any) {
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
