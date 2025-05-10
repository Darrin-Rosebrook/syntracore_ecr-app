'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import type { User, AuthError } from 'firebase/auth';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User | null>;
  logIn: (email: string, password: string) => Promise<User | null>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGlobalLoader, setShowGlobalLoader] = useState(true); // Start with loader potentially visible
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  useEffect(() => {
    // This effect runs only on the client after initial hydration
    if (loading) {
      if (typeof window !== 'undefined' && 
          (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
        setShowGlobalLoader(false); // Don't show global loader on login/signup pages
      } else {
        setShowGlobalLoader(true); // Show global loader on other pages if auth is loading
      }
    } else {
      setShowGlobalLoader(false); // Hide loader once auth state is resolved
    }
  }, [loading]);


  const signUp = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: 'Sign Up Successful', description: 'Welcome!' });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign up error:', authError);
      toast({ title: 'Sign Up Failed', description: authError.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      toast({ title: 'Login Failed', description: authError.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    } catch (error) {
      const authError = error as AuthError;
      console.error('Logout error:', authError);
      toast({ title: 'Logout Failed', description: authError.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for instructions.' });
    } catch (error) {
      const authError = error as AuthError;
      console.error('Password reset error:', authError);
      toast({ title: 'Password Reset Failed', description: authError.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const value = {
    currentUser,
    loading,
    signUp,
    logIn,
    logOut,
    resetPassword,
  };
  
  // Conditionally render loader based on client-side state `showGlobalLoader`
  if (showGlobalLoader) { 
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Initializing Auth...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
