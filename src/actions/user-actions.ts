
'use server';

import type { PhaUser, PhaUserStatus } from '@/types';
import { db, auth as firebaseAuth } from '@/lib/firebase'; // Import firebaseAuth
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Import createUserWithEmailAndPassword
import { serverTimestamp, collection, doc, setDoc, getDoc, updateDoc, getDocs, addDoc, query, orderBy, deleteDoc, where, limit, Timestamp } from 'firebase/firestore';

// Helper function to generate a random string (for username or password)
function generateRandomString(length = 10): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// Helper function to generate a random password
function generateTemporaryPassword(length = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  if (!/\d/.test(password)) password += Math.floor(Math.random() * 10);
  if (!/[a-z]/.test(password)) password += "a";
  if (!/[A-Z]/.test(password)) password += "Z";
  if (password.length > length) password = password.slice(0, length);
  return password;
}


export async function addPhaUserAction(userData: Omit<PhaUser, 'id' | 'status' | 'username'>): Promise<{ success: boolean; userId?: string; username?: string; error?: string; temporaryPassword?: string }> {
  console.log("Attempting to add PHA user (server action):", userData);

  if (!userData.name || !userData.email || !userData.program || !userData.role) {
    return { success: false, error: "Missing required fields (name, email, program, role)." };
  }
  if (!['Case Reporting'].includes(userData.program)) {
    return { success: false, error: "Invalid program specified." };
  }
  if (!['Admin', 'User'].includes(userData.role)) {
    return { success: false, error: "Invalid role specified." };
  }

  try {
    const temporaryPassword = generateTemporaryPassword();
    const username = `${userData.name.split(' ')[0].toLowerCase()}${generateRandomString(4)}`; 
    
    // 1. Create user in Firebase Authentication
    let authUserUid: string;
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, userData.email, temporaryPassword);
      authUserUid = userCredential.user.uid;
      console.log(`Firebase Auth user created successfully for ${userData.email} with UID ${authUserUid}.`);
    } catch (authError: any) {
      console.error("Error creating user in Firebase Authentication:", authError);
      let errorMessage = "Failed to create user account in authentication system.";
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already registered. Please use a different email.";
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = "The generated password is too weak. Please try again (this is unlikely with auto-generation but possible).";
      }
      return { success: false, error: errorMessage };
    }

    // 2. Create user record in Firestore
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
    };

    // Using authUserUid as the document ID in Firestore for better linking,
    // or you can let Firestore auto-generate an ID and store authUserUid as a field.
    // For consistency with potential existing logic that doesn't expect UID as ID,
    // I'll add it as a field and let Firestore generate the doc ID for 'phaUsers'.
    // If you want to use UID as doc ID, change to: const userDocRef = doc(db, 'phaUsers', authUserUid); await setDoc(userDocRef, newUserForFirestore);
    
    const usersColRef = collection(db, 'phaUsers');
    // Add authUserUid to the Firestore document
    const docRef = await addDoc(usersColRef, { ...newUserForFirestore, authUid: authUserUid });
    
    console.log(`PHA user Firestore record created for ${userData.email} with Firestore ID ${docRef.id}, Username: ${username}. Temporary Password: ${temporaryPassword}`);
    
    return { success: true, userId: docRef.id, username, temporaryPassword };

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
        // authUid: data.authUid, // If you store it
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
    
    const updatePayload: Partial<PhaUser> = {};
    for (const key in userData) {
      if (userData[key as keyof typeof userData] !== undefined) {
        // @ts-ignore
        updatePayload[key as keyof PhaUser] = userData[key as keyof typeof userData];
      }
    }
    // @ts-ignore 
    updatePayload.updatedAt = serverTimestamp(); 


    if (Object.keys(updatePayload).length === 1 && 'updatedAt' in updatePayload) { // Only updatedAt means no actual data changes
        console.warn("No actual data fields provided for update, only timestamp. Skipping Firestore write.");
        return { success: true }; // Or return an error/warning if this is not desired
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
  // IMPORTANT: This action currently only deletes the Firestore record.
  // Deleting the Firebase Auth user record needs to be handled separately,
  // typically via Firebase Admin SDK in a backend environment or by re-authenticating the user.
  // For now, it will only delete the Firestore part.

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
      // authUid: userData.authUid, // If you store it
    };
    console.log(`User found for username ${username}:`, user);
    return { success: true, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while fetching user by username.";
    console.error("Error in getPhaUserByUsernameAction:", message, error);
    return { success: false, error: message };
  }
}
