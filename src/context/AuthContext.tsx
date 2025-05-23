
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { auth, db } from '@/lib/firebase'; // db is already here
import type { User, AuthError } from 'firebase/auth';
import { UserProfile, UserType } from '@/types'; // UserProfile, UserType should be here
import { doc, setDoc, Timestamp, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'; // Added getDoc, collection, query, where, getDocs, limit
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getPhaUserByUsernameAction } from '@/actions/user-actions';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isPhaUser: boolean; 
  userProfile: UserProfile | null; // Added userProfile
  userType: UserType | null; // Added userType
  signUp: (email: string, password: string, displayName: string, registrationType: string, phone?: string) => Promise<User | null>; 
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
  const [isPhaUser, setIsPhaUser] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Added userProfile state
  const [userType, setUserType] = useState<UserType | null>(null); // Added userType state
  const [showGlobalLoader, setShowGlobalLoader] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User:", user ? user.email : null);
      setCurrentUser(user); // Set currentUser immediately

      if (user && user.uid) { // Ensure user.uid is available
        try {
          // 1. Check userProfiles first
          const userProfileRef = doc(db, 'userProfiles', user.uid);
          const userProfileSnap = await getDoc(userProfileRef);

          if (userProfileSnap.exists()) {
            const profileData = userProfileSnap.data() as UserProfile;
            setUserProfile(profileData);
            setUserType(profileData.userType);
            setIsPhaUser(profileData.userType === 'PHA'); // Sync isPhaUser with userType
            console.log(`AuthContext: UserProfile found for ${user.email}. Type: ${profileData.userType}`);
          } else {
            // 2. If not in userProfiles, check if they are a PHA user (legacy or admin-created)
            console.log(`AuthContext: UserProfile not found for ${user.email}. Checking PHA status via phaUsers collection.`);
            const phaUsersRef = collection(db, 'phaUsers');
            // Using authUid for lookup as it's more reliable if available
            const q = query(phaUsersRef, where("authUid", "==", user.uid), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const phaData = querySnapshot.docs[0].data(); // Actual PhaUser data
              setIsPhaUser(true);
              setUserType('PHA');
              // Construct a UserProfile-like object for context consistency
              setUserProfile({ 
                  uid: user.uid, 
                  email: user.email!, 
                  displayName: user.displayName || phaData.name, 
                  userType: 'PHA', 
                  // Ensure createdAt is a Firestore Timestamp, or convert if necessary
                  createdAt: phaData.createdAt && typeof phaData.createdAt.toDate === 'function' 
                             ? phaData.createdAt 
                             : (phaData.createdAt && typeof phaData.createdAt === 'string' 
                                ? Timestamp.fromDate(new Date(phaData.createdAt)) 
                                : Timestamp.now()),
                  updatedAt: phaData.updatedAt && typeof phaData.updatedAt.toDate === 'function'
                             ? phaData.updatedAt
                             : (phaData.updatedAt && typeof phaData.updatedAt === 'string'
                                ? Timestamp.fromDate(new Date(phaData.updatedAt))
                                : undefined)
              });
              console.log(`AuthContext: User ${user.email} identified as PHA user from phaUsers collection.`);
            } else {
              // 3. Not in userProfiles and not in phaUsers
              console.warn(`AuthContext: User ${user.email} has no UserProfile and is not found in phaUsers by authUid. UserType unknown.`);
              setIsPhaUser(false);
              setUserType(null);
              setUserProfile(null);
            }
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user profile or PHA status:", error);
          setUserProfile(null);
          setUserType(null);
          setIsPhaUser(false);
        }
      } else {
        // No user / logout
        setUserProfile(null);
        setUserType(null);
        setIsPhaUser(false);
        console.log("AuthContext: No user or user UID, states reset.");
      }
      setLoading(false);
      setShowGlobalLoader(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string, registrationType: string, phone?: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        setCurrentUser(auth.currentUser); // Re-trigger user object update

        let mappedUserType: UserType;
        switch (registrationType.toLowerCase()) {
          case 'hco':
            mappedUserType = 'HCO';
            break;
          case 'vendor':
            mappedUserType = 'EHR_VENDOR';
            break;
          case 'healthsystem':
            mappedUserType = 'HEALTH_SYSTEM';
            break;
          default:
            console.error('Unknown registration type:', registrationType);
            toast({ title: 'Error', description: `Invalid registration type: ${registrationType}`, variant: 'destructive' });
            setLoading(false);
            // Optionally, delete the created Firebase auth user if profile creation fails critically
            // await userCredential.user.delete(); 
            return null;
        }

        const userProfileData: UserProfile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: displayName || userCredential.user.displayName || '',
          userType: mappedUserType,
          createdAt: Timestamp.now(),
          phone: phone || undefined,
        };

        const userProfileRef = doc(db, 'userProfiles', userCredential.user.uid);
        await setDoc(userProfileRef, userProfileData);
        console.log(`AuthContext: UserProfile created for ${userCredential.user.email} with type ${mappedUserType}`);
      }
      
      toast({ title: 'Sign Up Successful', description: 'Welcome!' });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign up error:', authError);
      let description = authError.message;
      if (authError.code === 'auth/email-already-in-use') {
        description = 'This email address is already registered. Please try logging in or use a different email.';
      }
      toast({
        title: 'Sign Up Failed',
        description: description,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (identifier: string, password: string): Promise<User | null> => {
    setLoading(true);
    // isPhaUser will be determined by onAuthStateChanged logic
    let emailToUse = identifier;

    if (!identifier.includes('@')) {
      console.log(`AuthContext: Identifier "${identifier}" is not an email. Attempting username lookup.`);
      const usernameLookupResult = await getPhaUserByUsernameAction(identifier);
      if (usernameLookupResult.success && usernameLookupResult.user?.email) {
        emailToUse = usernameLookupResult.user.email;
        console.log(`AuthContext: Username "${identifier}" resolved to email "${emailToUse}".`);
      } else {
        console.log(`AuthContext: Username lookup failed for "${identifier}". Error: ${usernameLookupResult.error}`);
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
      // Reset all user-specific states on logout
      setCurrentUser(null); // Explicitly set currentUser to null
      setIsPhaUser(false);
      setUserProfile(null);
      setUserType(null);
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
    isPhaUser,
    userProfile, // Added userProfile
    userType, // Added userType
    signUp,
    logIn,
    logOut,
    resetPassword,
  };

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
