
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { auth, db } from '@/lib/firebase';
import type { User, AuthError } from 'firebase/auth';
import { UserProfile, UserType } from '@/types';
import { doc, setDoc, Timestamp, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'; // Keep this one
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
// Removed redundant import: import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isPhaUser: boolean;
  userProfile: UserProfile | null;
  userType: UserType | null;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [showGlobalLoader, setShowGlobalLoader] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User:", user ? user.email : null);
      setCurrentUser(user);

      if (user && user.uid) {
        try {
          // 1. Check userProfiles first for explicit userType
          const userProfileRef = doc(db, 'userProfiles', user.uid);
          const userProfileSnap = await getDoc(userProfileRef);

          if (userProfileSnap.exists()) {
            const profileData = userProfileSnap.data() as UserProfile;
            setUserProfile(profileData);
            setUserType(profileData.userType);
            setIsPhaUser(profileData.userType === 'PHA');
            console.log(`AuthContext: UserProfile found for ${user.email}. Type: ${profileData.userType}`);
          } else {
            // 2. If no userProfile, check if they are a PHA user by email in phaUsers
            console.log(`AuthContext: UserProfile not found for ${user.email}. Checking PHA status via phaUsers collection.`);
            const phaUsersRef = collection(db, 'phaUsers');
            const qPha = query(phaUsersRef, where("email", "==", user.email), limit(1));
            const phaQuerySnapshot = await getDocs(qPha);

            if (!phaQuerySnapshot.empty) {
              const phaData = phaQuerySnapshot.docs[0].data();
              setIsPhaUser(true);
              setUserType('PHA');
              setUserProfile({ 
                  uid: user.uid, 
                  email: user.email!, 
                  displayName: user.displayName || phaData.name, 
                  userType: 'PHA', 
                  createdAt: phaData.createdAt || Timestamp.now(),
                  updatedAt: phaData.updatedAt
              });
              console.log(`AuthContext: User ${user.email} identified as PHA user from phaUsers email match.`);
            } else {
              // 3. If not found by email in phaUsers, check by authUid (for admin-created PHA users)
              const qPhaAuthUid = query(phaUsersRef, where("authUid", "==", user.uid), limit(1));
              const phaAuthUidQuerySnapshot = await getDocs(qPhaAuthUid);
              if(!phaAuthUidQuerySnapshot.empty) {
                const phaData = phaAuthUidQuerySnapshot.docs[0].data();
                setIsPhaUser(true);
                setUserType('PHA');
                setUserProfile({ 
                    uid: user.uid, 
                    email: user.email!, 
                    displayName: user.displayName || phaData.name, 
                    userType: 'PHA', 
                    createdAt: phaData.createdAt || Timestamp.now(),
                    updatedAt: phaData.updatedAt
                });
                console.log(`AuthContext: User ${user.email} identified as PHA user from phaUsers authUid match.`);
              } else {
                // 4. Not PHA, check if Vendor
                console.log(`AuthContext: User ${user.email} not PHA. Checking Vendor status.`);
                const vendorsRef = collection(db, 'vendors');
                const qVendor = query(vendorsRef, where("userId", "==", user.uid), limit(1));
                const vendorQuerySnapshot = await getDocs(qVendor);
                if(!vendorQuerySnapshot.empty) {
                    const vendorData = vendorQuerySnapshot.docs[0].data() as VendorProfileData;
                    setUserType('EHR_VENDOR');
                    setUserProfile({
                        uid: user.uid,
                        email: user.email!,
                        displayName: vendorData.contactName,
                        userType: 'EHR_VENDOR',
                        createdAt: vendorData.createdAt ? Timestamp.fromDate(new Date(vendorData.createdAt)) : Timestamp.now(),
                    });
                    console.log(`AuthContext: User ${user.email} identified as Vendor.`);
                } else {
                    // 5. Not Vendor, check if Health System
                    console.log(`AuthContext: User ${user.email} not Vendor. Checking Health System status.`);
                    const healthSystemsRef = collection(db, 'healthSystems');
                    const qHealthSystem = query(healthSystemsRef, where("registeredByUserId", "==", user.uid), limit(1));
                    const healthSystemQuerySnapshot = await getDocs(qHealthSystem);
                    if(!healthSystemQuerySnapshot.empty) {
                        const hsData = healthSystemQuerySnapshot.docs[0].data() as HealthSystemEntry;
                        setUserType('HEALTH_SYSTEM');
                         setUserProfile({
                            uid: user.uid,
                            email: user.email!,
                            displayName: hsData.name, // Or contact name if preferred
                            userType: 'HEALTH_SYSTEM',
                            createdAt: hsData.createdAt ? Timestamp.fromDate(new Date(hsData.createdAt)) : Timestamp.now(),
                        });
                        console.log(`AuthContext: User ${user.email} identified as Health System user.`);
                    } else {
                        // 6. Default to HCO if logged in and no other type identified
                        console.warn(`AuthContext: User ${user.email} is logged in but not explicitly PHA, Vendor, or Health System. Defaulting userType to HCO for now.`);
                        setUserType('HCO'); 
                        setUserProfile({
                            uid: user.uid,
                            email: user.email!,
                            displayName: user.displayName || 'HCO User',
                            userType: 'HCO',
                            createdAt: Timestamp.now(),
                        });
                    }
                }
              }
            }
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user profile or role status:", error);
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
    setIsPhaUser(false); // Reset PHA status on new signup attempt
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        // Note: currentUser might not update immediately here due to onAuthStateChanged listener.
      }

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
          console.error('AuthContext: Unknown registration type during signup:', registrationType);
          toast({ title: 'Error', description: `Invalid registration type: ${registrationType}`, variant: 'destructive' });
          setLoading(false);
          // Optionally, delete the created Firebase auth user if profile creation fails critically
          // await userCredential.user.delete(); 
          return null;
      }

      // Create a UserProfile document in Firestore
      // This is crucial for explicit role tracking post-signup
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
      
      // Update context state immediately after profile creation
      setUserProfile(userProfileData);
      setUserType(mappedUserType);
      setIsPhaUser(mappedUserType === 'PHA'); // Though PHA users are typically admin-created

      toast({ title: 'Sign Up Successful', description: 'Welcome!' });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('AuthContext: Sign up error:', authError);
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
      // onAuthStateChanged will handle setting currentUser, userProfile, userType, isPhaUser
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('AuthContext: Login error:', authError);
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
      // onAuthStateChanged will handle resetting user states
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      const authError = error as AuthError;
      console.error('AuthContext: Logout error:', authError);
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
      console.error('AuthContext: Password reset error:', authError);
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
    userProfile,
    userType,
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
