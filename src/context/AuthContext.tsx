
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { auth } from '@/firebase-config'; 
import type { User, AuthError } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getPhaUserByUsernameAction } from '@/actions/user-actions'; // Import the new action

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User | null>;
  logIn: (identifier: string, password: string) => Promise<User | null>; // Changed email to identifier
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
  const [showGlobalLoader, setShowGlobalLoader] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      setShowGlobalLoader(false); 
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: 'Sign Up Successful', description: 'Welcome!' });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign up error:', authError);
      toast({
        title: 'Sign Up Failed',
        description: authError.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (identifier: string, password: string): Promise<User | null> => {
    setLoading(true);
    let emailToUse = identifier;

    // Check if identifier is likely an email
    if (!identifier.includes('@')) {
      // Assume it's a username, try to fetch email
      console.log(`Identifier "${identifier}" doesn't look like an email. Attempting username lookup.`);
      const usernameLookupResult = await getPhaUserByUsernameAction(identifier);
      if (usernameLookupResult.success && usernameLookupResult.user?.email) {
        emailToUse = usernameLookupResult.user.email;
        console.log(`Username "${identifier}" maps to email "${emailToUse}".`);
      } else {
        console.log(`Failed to find email for username "${identifier}". Error: ${usernameLookupResult.error}`);
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password.',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.', // Generic message for security
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      const authError = error as AuthError;
      console.error('Logout error:', authError);
      toast({
        title: 'Logout Failed',
        description: authError.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox for instructions.',
      });
    } catch (error) {
      const authError = error as AuthError;
      console.error('Password reset error:', authError);
      toast({
        title: 'Password Reset Failed',
        description: authError.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    logIn,
    logOut,
    resetPassword,
  };

  if (showGlobalLoader && loading) { 
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Initializing Auth...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
