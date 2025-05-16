
'use server';

import type { PhaUser, PhaUserStatus } from '@/types';
import { db } from '@/lib/firebase';
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
    
    const newUser: Omit<PhaUser, 'id'> = {
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

    const usersColRef = collection(db, 'phaUsers');
    const docRef = await addDoc(usersColRef, newUser);
    
    console.log(`PHA user created successfully for ${userData.email} with ID ${docRef.id}, Username: ${username}. Temporary Password: ${temporaryPassword}`);
    
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
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    console.log(`Simulated password reset email sent to ${email}.`);
    return { success: true };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while requesting password reset.";
    console.error("Error in requestPasswordResetAction:", message, error);
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
        return { success: false, error: "No valid fields provided for update." };
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
    
    console.log(`User ${userId} successfully deleted from Firestore.`);
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
    };
    console.log(`User found for username ${username}:`, user);
    return { success: true, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while fetching user by username.";
    console.error("Error in getPhaUserByUsernameAction:", message, error);
    return { success: false, error: message };
  }
}
