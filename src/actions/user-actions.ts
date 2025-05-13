
'use server';

import type { PhaUser, PhaUserStatus } from '@/types';
// For actual Firebase integration, you would use Firebase Admin SDK here
// import { getAuth } from 'firebase-admin/auth';
// import { adminApp } from '@/lib/firebase-admin'; // Assuming admin app is initialized
// import { db } from '@/lib/firebase'; // For Firestore
// import { serverTimestamp, collection, doc, setDoc, getDoc, updateDoc, getDocs } from 'firebase/firestore';

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
    const username = `${userData.name.split(' ')[0].toLowerCase()}${generateRandomString(4)}`; // Simple username generation
    
    // --- Simulated Firebase Auth user creation ---
    // const authAdmin = getAuth(adminApp);
    // const userRecord = await authAdmin.createUser({
    //   email: userData.email,
    //   displayName: userData.name,
    //   password: temporaryPassword, 
    //   emailVerified: false, 
    // });
    // const userId = userRecord.uid;

    // --- Simulated Firestore document creation for additional user info ---
    // const userDocRef = doc(db, 'phaUsers', userId);
    // await setDoc(userDocRef, {
    //   username: username,
    //   name: userData.name,
    //   email: userData.email,
    //   phone: userData.phone || null,
    //   program: userData.program,
    //   role: userData.role,
    //   status: 'Active', // Default to Active
    //   requiresPasswordChange: true, 
    //   createdAt: serverTimestamp(),
    // });

    // --- Set Custom Claims (Example for RBAC) ---
    // await authAdmin.setCustomUserClaims(userId, { phaRole: userData.role, phaProgram: userData.program, status: 'Active' });
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
    const simulatedUserId = `simulated-pha-user-${Date.now()}`;
    
    console.log(`Simulated PHA user creation successful for ${userData.email} with ID ${simulatedUserId}, Username: ${username}. Temporary Password: ${temporaryPassword}`);
    
    return { success: true, userId: simulatedUserId, username, temporaryPassword };

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
    // --- Simulated Firebase Auth password reset email ---
    // const authAdmin = getAuth(adminApp);
    // await authAdmin.generatePasswordResetLink(email); 
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
    console.log(`Simulated password reset email sent to ${email}.`);
    return { success: true };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while requesting password reset.";
    console.error("Error in requestPasswordResetAction:", message, error);
    return { success: false, error: message };
  }
}

// Updated to include status
export async function getPhaUsersAction(): Promise<{ success: boolean; users?: PhaUser[]; error?: string }> {
  console.log("Attempting to fetch PHA users (server action - placeholder)");
  await new Promise(resolve => setTimeout(resolve, 500));
  // Simulate some users for UI development
  const simulatedUsers: PhaUser[] = [
    { id: 'sim-admin-1', username: 'alice_admin', name: 'Alice Admin', email: 'alice@pha.gov', program: 'Case Reporting', role: 'Admin', status: 'Active' },
    { id: 'sim-user-1', username: 'bob_user', name: 'Bob User', email: 'bob@pha.gov', program: 'Case Reporting', role: 'User', phone: '111-222-3333', status: 'Active' },
    { id: 'sim-user-2', username: 'carol_inactive', name: 'Carol Inactive', email: 'carol@pha.gov', program: 'Case Reporting', role: 'User', status: 'Inactive' },
  ];
  // try {
  //   const usersCol = collection(db, 'phaUsers');
  //   const userSnapshot = await getDocs(usersCol);
  //   const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhaUser));
  //   return { success: true, users: usersList };
  // } catch (error) {
  //   const message = error instanceof Error ? error.message : "Failed to fetch users.";
  //   console.error("Error fetching PHA users:", message, error);
  //   return { success: false, error: message, users: simulatedUsers }; // Fallback to simulated on error for now
  // }
  return { success: true, users: simulatedUsers }; 
}

// Updated to handle partial updates including status
export async function updatePhaUserAction(userId: string, userData: Partial<Omit<PhaUser, 'id'>>): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to update PHA user ${userId} (server action - placeholder) with data:`, userData);
  
  if (!userId) {
    return { success: false, error: "User ID is required for update." };
  }
  // Add more specific validation if needed based on userData fields

  try {
    // --- Simulated Firestore document update ---
    // const userDocRef = doc(db, 'phaUsers', userId);
    // const updatePayload: Partial<PhaUser> = { ...userData };
    // // Ensure serverTimestamp is used if updating specific date fields
    // // if (userData.someFieldThatNeedsTimestamp) {
    // //   updatePayload.updatedAt = serverTimestamp(); 
    // // }
    // await updateDoc(userDocRef, updatePayload);

    // // If role or status changes, custom claims might need an update too
    // if (userData.role || userData.status) {
    //   const authAdmin = getAuth(adminApp);
    //   const userAuthRecord = await authAdmin.getUser(userId);
    //   const currentClaims = userAuthRecord.customClaims || {};
    //   const newClaims = { ...currentClaims };
    //   if (userData.role) newClaims.phaRole = userData.role;
    //   if (userData.status) newClaims.status = userData.status;
    //   // Add other claims if necessary
    //   // await authAdmin.setCustomUserClaims(userId, newClaims);
    // }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation
    console.log(`Simulated update successful for user ${userId}.`);
    return { success: true };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while updating the PHA user.";
    console.error("Error in updatePhaUserAction:", message, error);
    return { success: false, error: message };
  }
}

// This action is effectively replaced by updating status to 'Inactive'
// but can be kept if hard delete is ever needed and differentiated from deactivation.
// For now, it's a placeholder.
export async function deletePhaUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to (hard) delete PHA user ${userId} (server action - placeholder - prefer deactivation)`);
  // In a real app, prefer deactivating (setting status to 'Inactive') over hard deleting user records.
  // If hard delete is required:
  // try {
  //   // const authAdmin = getAuth(adminApp);
  //   // await authAdmin.deleteUser(userId); // Delete from Firebase Auth
  //   // const userDocRef = doc(db, 'phaUsers', userId);
  //   // await deleteDoc(userDocRef); // Delete from Firestore
  //   await new Promise(resolve => setTimeout(resolve, 500));
  //   return { success: true };
  // } catch (error) {
  //   const message = error instanceof Error ? error.message : "An unknown error occurred.";
  //   return { success: false, error: message };
  // }
  return { success: false, error: "Hard delete not implemented. Please use 'Set Inactive' status." };
}
