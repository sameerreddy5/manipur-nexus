import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser {
  email: string;
  role: string;
  fullName: string;
  isAuthenticated: boolean;
}

interface Profile {
  full_name: string;
  role: string;
  department?: string;
  batch?: string;
  phone?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser>({
    email: '',
    role: '',
    fullName: '',
    isAuthenticated: false
  });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile data
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (profile && !error) {
                setUser({
                  email: session.user.email || '',
                  role: profile.role,
                  fullName: profile.full_name,
                  isAuthenticated: true
                });
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
            }
            setLoading(false);
          }, 0);
        } else {
          setUser({
            email: '',
            role: '',
            fullName: '',
            isAuthenticated: false
          });
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: string, phone?: string, department?: string, batch?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      // Create profile after successful signup
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            role,
            phone,
            department,
            batch
          });

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const createUser = async (email: string, password: string, fullName: string, role: string, phone?: string, department?: string, batch?: string) => {
    // This function is for admin use to create users
    return signUp(email, password, fullName, role, phone, department, batch);
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    createUser,
    // Legacy compatibility
    login: signIn,
    logout: signOut
  };
};