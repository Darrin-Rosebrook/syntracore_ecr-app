
'use server';

import type { PhaUser, PhaUserStatus } from '@/types';
import { db, auth as firebaseAuth } from '@/lib/firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { serverTimestamp, collection, doc, setDoc, getDoc, updateDoc, getDocs, addDoc, query, orderBy, deleteDoc, where, limit, Timestamp } from 'firebase/firestore';

// Helper function to generate a random string (for username)
function generateRandomString(length = 4): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export async function addPhaUserAction(
  userData: Omit<PhaUser, 'id' | 'status' | 'username'>,
  temporaryPasswordProvided: string // Added parameter for admin-set password
): Promise<{ success: boolean; userId?: string; username?: string; error?: string; temporaryPassword?: string }> {
  console.log("Attempting to add PHA user (server action):", userData);

  if (!userData.name || !userData.email || !userData.program || !userData.role) {
    return { success: false, error: "Missing required fields (name, email, program, role)." };
  }
  if (temporaryPasswordProvided.length < 8) {
      return { success: false, error: "Password must be at least 8 characters."};
  }
  if (!['Case Reporting'].includes(userData.program)) {
    return { success: false, error: "Invalid program specified." };
  }
  if (!['Admin', 'User'].includes(userData.role)) {
    return { success: false, error: "Invalid role specified." };
  }

  try {
    const username = `${userData.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/gi, '')}${generateRandomString(4)}`; 
    
    let authUserUid: string;
    try {
      // Use the password provided by the admin
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, userData.email, temporaryPasswordProvided);
      authUserUid = userCredential.user.uid;
      console.log(`Firebase Auth user created successfully for ${userData.email} with UID ${authUserUid}.`);
    } catch (authError: any) {
      console.error("Error creating user in Firebase Authentication:", authError);
      let errorMessage = "Failed to create user account in authentication system.";
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already registered. Please use a different email.";
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = "The provided password is too weak. Please choose a stronger password.";
      }
      return { success: false, error: errorMessage };
    }
    
    const newUserForFirestore: Omit<PhaUser, 'id'> = {
      username: username,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || undefined, 
      program: userData.program,
      role: userData.role,
      status: 'Active', 
      // @ts-ignore 
      createdAt: serverTimestamp(), 
      authUid: authUserUid, // Store Firebase Auth UID
    };
    
    const usersColRef = collection(db, 'phaUsers');
    const docRef = await addDoc(usersColRef, newUserForFirestore); 
    
    console.log(`PHA user Firestore record created for ${userData.email} with Firestore ID ${docRef.id}, Username: ${username}. Temporary Password: ${temporaryPasswordProvided}`);
    
    // Return the password that was set by the admin
    return { success: true, userId: docRef.id, username, temporaryPassword: temporaryPasswordProvided };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while adding the PHA user.";
    console.error("Error in addPhaUserAction:", message, error);
    return { success: false, error: message };
  }
}

export async function requestPasswordResetAction(email: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to send password reset email to ${email} (server action - placeholder)`);

  if (!email) {
    return { success: false, error: "Email is required to send a password reset link." };
  }

  try {
    // In a real scenario, this would use Firebase Auth's sendPasswordResetEmail
    // await sendPasswordResetEmail(firebaseAuth, email);
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    console.log(`Simulated password reset email sent to ${email}. Full Firebase Auth password reset needs to be implemented.`);
    return { success: true };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while requesting password reset.";
    console.error("Error in requestPasswordResetAction:", message, error);
    // if (error.code === 'auth/user-not-found') {
    //   return { success: false, error: "No user found with this email address." };
    // }
    return { success: false, error: message };
  }
}

export async function getPhaUsersAction(): Promise<{ success: boolean; users?: PhaUser[]; error?: string }> {
  console.log("Attempting to fetch PHA users from Firestore (server action)");
  try {
    const usersCol = collection(db, 'phaUsers');
    const q = query(usersCol, orderBy('name')); 
    const userSnapshot = await getDocs(q);
    
    const usersList = userSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        name: data.name,
        email: data.email,
        username: data.username,
        phone: data.phone,
        program: data.program,
        role: data.role,
        status: data.status,
        // authUid: data.authUid, 
      } as PhaUser;
    });
    
    console.log("Successfully fetched PHA users from Firestore:", usersList.length, "users found.");
    return { success: true, users: usersList };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch users from Firestore.";
    console.error("Error fetching PHA users from Firestore:", message, error);
    return { success: false, error: message, users: [] }; 
  }
}

export async function updatePhaUserAction(userId: string, userData: Partial<Omit<PhaUser, 'id' | 'username'>>): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to update PHA user ${userId} in Firestore with data:`, userData);
  
  if (!userId) {
    return { success: false, error: "User ID is required for update." };
  }
  
  try {
    const userDocRef = doc(db, 'phaUsers', userId);
    
    const updatePayload: Partial<PhaUser> & { updatedAt?: any } = {}; // Ensure updatedAt can be assigned serverTimestamp
    for (const key in userData) {
      if (userData[key as keyof typeof userData] !== undefined) {
        // @ts-ignore
        updatePayload[key as keyof PhaUser] = userData[key as keyof typeof userData];
      }
    }
    
    updatePayload.updatedAt = serverTimestamp(); 


    if (Object.keys(updatePayload).length === 1 && 'updatedAt' in updatePayload) { 
        console.warn("No actual data fields provided for update, only timestamp. Skipping Firestore write.");
        return { success: true }; 
    }

    await updateDoc(userDocRef, updatePayload);
    
    console.log(`Update successful for user ${userId} in Firestore.`);
    return { success: true };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while updating the PHA user in Firestore.";
    console.error("Error in updatePhaUserAction (Firestore):", message, error);
    return { success: false, error: message };
  }
}

export async function deletePhaUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to (hard) delete PHA user ${userId} from Firestore (server action)`);
  
  if (!userId) {
    return { success: false, error: "User ID is required for deletion." };
  }

  try {
    const userDocRef = doc(db, 'phaUsers', userId);
    await deleteDoc(userDocRef); 
    
    console.log(`User ${userId} successfully deleted from Firestore. Auth record may still exist.`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while deleting the user from Firestore.";
    console.error("Error in deletePhaUserAction (Firestore):", message, error);
    return { success: false, error: message };
  }
}

export async function getPhaUserByUsernameAction(username: string): Promise<{ success: boolean; user?: PhaUser; error?: string }> {
  console.log(`Attempting to fetch PHA user by username: ${username}`);
  if (!username) {
    return { success: false, error: "Username is required." };
  }

  try {
    const usersColRef = collection(db, 'phaUsers');
    const q = query(usersColRef, where("username", "==", username), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No user found with username: ${username}`);
      return { success: false, error: "User not found." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const user: PhaUser = {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      username: userData.username,
      phone: userData.phone,
      program: userData.program,
      role: userData.role,
      status: userData.status,
      // authUid: userData.authUid, 
    };
    console.log(`User found for username ${username}:`, user);
    return { success: true, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while fetching user by username.";
    console.error("Error in getPhaUserByUsernameAction:", message, error);
    return { success: false, error: message };
  }
}

