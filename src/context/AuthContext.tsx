
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { auth, db } from '@/lib/firebase'; // Ensure db is imported
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
import { getPhaUserByUsernameAction } from '@/actions/user-actions';
import { collection, query, where, getDocs, limit } from 'firebase/firestore'; // Firestore imports

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isPhaUser: boolean; // New state for PHA user status
  signUp: (email: string, password: string) => Promise<User | null>;
  logIn: (identifier: string, password: string) => Promise<User | null>;
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
  const [isPhaUser, setIsPhaUser] = useState(false); // Initialize PHA user state
  const [showGlobalLoader, setShowGlobalLoader] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        try {
          const phaUsersRef = collection(db, 'phaUsers');
          const q = query(phaUsersRef, where("email", "==", user.email), limit(1));
          const querySnapshot = await getDocs(q);
          setIsPhaUser(!querySnapshot.empty);
        } catch (error) {
          console.error("Error checking PHA user status:", error);
          setIsPhaUser(false);
        }
      } else {
        setIsPhaUser(false);
      }
      setLoading(false);
      setShowGlobalLoader(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    setIsPhaUser(false); // Reset PHA status on new signup, determined on next auth state change
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: 'Sign Up Successful', description: 'Welcome!' });
      // isPhaUser will be determined by onAuthStateChanged
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
    setIsPhaUser(false); // Reset before attempting login
    let emailToUse = identifier;

    if (!identifier.includes('@')) {
      const usernameLookupResult = await getPhaUserByUsernameAction(identifier);
      if (usernameLookupResult.success && usernameLookupResult.user?.email) {
        emailToUse = usernameLookupResult.user.email;
      } else {
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
      // isPhaUser will be determined by onAuthStateChanged hook after login triggers it
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
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
      setIsPhaUser(false); // Reset PHA status on logout
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
    isPhaUser, // Expose isPhaUser
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
