
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
import { UserProfile, UserType, PhaUser, VendorProfileData, HealthSystemEntry } from '@/types';
import { doc, setDoc, Timestamp, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
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

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isPhaUser: boolean;
  userProfile: UserProfile | null;
  userType: UserType | null;
  signUp: (email: string, password: string, displayName: string, registrationTypeParam: string, phone?: string) => Promise<User | null>;
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
      console.log("[AuthContext] Auth state changed. User:", user ? user.email : "null");
      setCurrentUser(user);
      setShowGlobalLoader(true); // Show loader immediately
      setLoading(true);

      try {
        if (user && user.uid && user.email) { // Ensure user, uid, and email are present
          let determinedUserType: UserType | null = null;
          let determinedUserProfile: UserProfile | null = null;
          let determinedIsPhaUser = false;

          // 1. Check phaUsers collection first (by email)
          console.log(`[AuthContext] Checking PHA status for ${user.email}`);
          const phaUsersColRef = collection(db, 'phaUsers');
          const qPhaEmail = query(phaUsersColRef, where("email", "==", user.email), limit(1));
          const phaEmailSnap = await getDocs(qPhaEmail);

          if (!phaEmailSnap.empty) {
            const phaData = phaEmailSnap.docs[0].data() as PhaUser;
            determinedUserType = 'PHA';
            determinedIsPhaUser = true;
            determinedUserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: phaData.name || user.displayName || 'PHA User',
              userType: 'PHA',
              createdAt: phaData.createdAt ? (typeof (phaData.createdAt as any)?.toDate === 'function' ? phaData.createdAt as Timestamp : Timestamp.fromDate(new Date(phaData.createdAt as string))) : Timestamp.now(),
              phone: phaData.phone || undefined,
            };
            console.log(`[AuthContext] User ${user.email} identified as PHA by email match in phaUsers.`);
          } else {
            // 2. If not PHA, check vendors collection (by UID)
            console.log(`[AuthContext] User ${user.email} not PHA. Checking vendor status for UID: ${user.uid}`);
            const vendorDocRef = doc(db, 'vendors', user.uid); // Assumes vendor doc ID is user.uid
            const vendorSnap = await getDoc(vendorDocRef);

            if (vendorSnap.exists()) {
              const vendorData = vendorSnap.data() as VendorProfileData;
              determinedUserType = 'EHR_VENDOR';
              determinedUserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: vendorData.contactName || user.displayName || 'Vendor User',
                userType: 'EHR_VENDOR',
                createdAt: vendorData.createdAt ? (typeof (vendorData.createdAt as any)?.toDate === 'function' ? vendorData.createdAt as Timestamp : Timestamp.fromDate(new Date(vendorData.createdAt as string))) : Timestamp.now(),
                phone: (vendorData as any).phone || undefined,
              };
              console.log(`[AuthContext] User ${user.email} identified as EHR_VENDOR by UID match in vendors.`);
            } else {
              // 3. If not Vendor, check healthSystems collection (by registeredByUserId)
              console.log(`[AuthContext] User ${user.email} not Vendor. Checking health system status for UID: ${user.uid}`);
              const healthSystemsColRef = collection(db, 'healthSystems');
              const qHealthSystem = query(healthSystemsColRef, where("registeredByUserId", "==", user.uid), limit(1));
              const healthSystemSnap = await getDocs(qHealthSystem);

              if (!healthSystemSnap.empty) {
                const hsData = healthSystemSnap.docs[0].data() as HealthSystemEntry;
                determinedUserType = 'HEALTH_SYSTEM';
                determinedUserProfile = {
                  uid: user.uid,
                  email: user.email,
                  displayName: hsData.name || user.displayName || 'Health System User',
                  userType: 'HEALTH_SYSTEM',
                  createdAt: hsData.createdAt ? (typeof (hsData.createdAt as any)?.toDate === 'function' ? hsData.createdAt as Timestamp : Timestamp.fromDate(new Date(hsData.createdAt as string))) : Timestamp.now(),
                  phone: hsData.contactPhone || undefined,
                };
                console.log(`[AuthContext] User ${user.email} identified as HEALTH_SYSTEM by registeredByUserId match in healthSystems.`);
              } else {
                // 4. If not PHA, Vendor, or Health System, and logged in, default to HCO
                determinedUserType = 'HCO';
                determinedUserProfile = {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName || 'HCO User',
                  userType: 'HCO',
                  createdAt: Timestamp.now(),
                  phone: undefined, // Or fetch from enrollment if available
                };
                console.log(`[AuthContext] User ${user.email} not PHA, Vendor, or Health System. Defaulting to HCO.`);
              }
            }
          }
          setUserProfile(determinedUserProfile);
          setUserType(determinedUserType);
          setIsPhaUser(determinedIsPhaUser);

        } else { // No user or user.uid/user.email is null
          setUserProfile(null);
          setUserType(null);
          setIsPhaUser(false);
          console.log("[AuthContext] No user authenticated or user data incomplete. States reset.");
        }
      } catch (error) {
        console.error("[AuthContext] Error processing user auth state:", error);
        setUserProfile(null);
        setUserType(null);
        setIsPhaUser(false);
        toast({
          title: "Authentication Error",
          description: "Could not determine user role due to an internal error. Please try logging in again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setShowGlobalLoader(false);
        console.log("[AuthContext] onAuthStateChanged processing complete. Loaders hidden.");
      }
    });
    return unsubscribe;
  }, [toast]);

  const signUp = async (email: string, password: string, displayName: string, registrationTypeParam: string, phone?: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (displayName && user) {
        await updateProfile(user, { displayName });
      }

      let mappedUserType: UserType;
      switch (registrationTypeParam.toLowerCase()) {
        case 'hco': mappedUserType = 'HCO'; break;
        case 'vendor': mappedUserType = 'EHR_VENDOR'; break;
        case 'healthsystem': mappedUserType = 'HEALTH_SYSTEM'; break;
        default:
          console.error('[AuthContext] Unknown registration type during signup:', registrationTypeParam);
          toast({ title: 'Error', description: `Invalid registration type: ${registrationTypeParam}`, variant: 'destructive' });
          setLoading(false);
          return null;
      }

      const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName || user.displayName || '',
        userType: mappedUserType,
        createdAt: Timestamp.now(),
        phone: phone || undefined,
      };
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      await setDoc(userProfileRef, userProfileData);
      console.log(`[AuthContext] UserProfile created for ${user.email} with type ${mappedUserType}`);

      setCurrentUser(user);
      setUserProfile(userProfileData);
      setUserType(mappedUserType);
      setIsPhaUser(mappedUserType === 'PHA'); // This would only be true if 'PHA' was a registrationTypeParam option

      toast({ title: 'Sign Up Successful', description: 'Welcome!' });
      return user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('[AuthContext] Sign up error:', authError.code, authError.message);
      let descriptionText = authError.message;
      if (authError.code === 'auth/email-already-in-use') {
        descriptionText = 'This email address is already registered. Please try logging in or use a different email.';
      } else if (authError.code === 'auth/weak-password') {
        descriptionText = 'The password is too weak. Please choose a stronger password.';
      }
      toast({ title: 'Sign Up Failed', description: descriptionText, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (identifier: string, password: string): Promise<User | null> => {
    setLoading(true);
    let emailToUse = identifier;

    if (!identifier.includes('@')) {
      console.log(`[AuthContext] Identifier "${identifier}" is not an email. Attempting username lookup.`);
      const usernameLookupResult = await getPhaUserByUsernameAction(identifier);
      if (usernameLookupResult.success && usernameLookupResult.user?.email) {
        emailToUse = usernameLookupResult.user.email;
        console.log(`[AuthContext] Username "${identifier}" resolved to email "${emailToUse}".`);
      } else {
        console.log(`[AuthContext] Username lookup failed for "${identifier}". Error: ${usernameLookupResult.error}`);
        toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
        setLoading(false);
        return null;
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      // onAuthStateChanged will handle setting context states
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error('[AuthContext] Login error:', authError.code, authError.message);
      toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setShowGlobalLoader(true);
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    } catch (error) {
      const authError = error as AuthError;
      console.error('[AuthContext] Logout error:', authError.message);
      toast({ title: 'Logout Failed', description: authError.message, variant: 'destructive' });
      // Explicitly set loading to false here in case signOut errors early
      setLoading(false);
      setShowGlobalLoader(false);
    }
    // onAuthStateChanged will reset other states (currentUser, userProfile, userType, isPhaUser)
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for instructions.' });
    } catch (error) {
      const authError = error as AuthError;
      console.error('[AuthContext] Password reset error:', authError.message);
      toast({ title: 'Password Reset Failed', description: authError.message, variant: 'destructive' });
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

