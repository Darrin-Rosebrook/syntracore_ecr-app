
'use server';

import type { PhaUser } from '@/types';
// For actual Firebase integration, you would use Firebase Admin SDK here
// import { getAuth } from 'firebase-admin/auth';
// import { adminApp } from '@/lib/firebase-admin'; // Assuming admin app is initialized
// import { db } from '@/lib/firebase'; // For Firestore
// import { serverTimestamp } from 'firebase/firestore';

// Helper function to generate a random password
function generateTemporaryPassword(length = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  // Ensure password meets some basic complexity (e.g., at least one number, one uppercase, one lowercase)
  // This is a simple check; more robust checks might be needed for production.
  if (!/\d/.test(password)) password += Math.floor(Math.random() * 10);
  if (!/[a-z]/.test(password)) password += "a";
  if (!/[A-Z]/.test(password)) password += "Z";
  if (password.length > length) password = password.slice(0, length);
  return password;
}


export async function addPhaUserAction(userData: Omit<PhaUser, 'id'>): Promise<{ success: boolean; userId?: string; error?: string; temporaryPassword?: string }> {
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
    // --- Simulated Firebase Auth user creation ---
    // const authAdmin = getAuth(adminApp);
    // const userRecord = await authAdmin.createUser({
    //   email: userData.email,
    //   displayName: userData.name,
    //   password: temporaryPassword, // Use the generated temporary password
    //   emailVerified: false, // User should verify and change password
    // });
    // const userId = userRecord.uid;

    // --- Simulated Firestore document creation for additional user info ---
    // const userDocRef = db.collection('phaUsers').doc(userId);
    // await userDocRef.set({
    //   name: userData.name,
    //   email: userData.email,
    //   phone: userData.phone || null,
    //   program: userData.program,
    //   role: userData.role,
    //   requiresPasswordChange: true, // Flag for first-time login
    //   createdAt: serverTimestamp(),
    // });

    // --- Set Custom Claims (Example for RBAC) ---
    // await authAdmin.setCustomUserClaims(userId, { phaRole: userData.role, phaProgram: userData.program });
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
    const simulatedUserId = `simulated-pha-user-${Date.now()}`;
    
    console.log(`Simulated PHA user creation successful for ${userData.email} with ID ${simulatedUserId}. Temporary Password: ${temporaryPassword}`);
    
    // Note: In a real app, after user creation with a temporary password,
    // you might also trigger an action to send the user an email with instructions or a welcome message.
    // For example, using `admin.auth().generateEmailVerificationLink(email)` or `admin.auth().generatePasswordResetLink(email)`.
    // The `requiresPasswordChange` flag would be checked on the client-side upon login to force a password update.

    return { success: true, userId: simulatedUserId, temporaryPassword };

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
    // (Actual sending logic would use an email service with this link, or Firebase handles it if configured)
    // Or, directly use client-side Firebase SDK's `sendPasswordResetEmail` if this action is called from an admin context
    // where `auth` object is available. For admin-initiated resets, `generatePasswordResetLink` is more common.
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
    console.log(`Simulated password reset email sent to ${email}.`);
    return { success: true };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while requesting password reset.";
    console.error("Error in requestPasswordResetAction:", message, error);
    return { success: false, error: message };
  }
}


// Placeholder for fetching users - to be implemented later
export async function getPhaUsersAction(): Promise<{ success: boolean; users?: PhaUser[]; error?: string }> {
  console.log("Attempting to fetch PHA users (server action - placeholder)");
  await new Promise(resolve => setTimeout(resolve, 500));
  // Simulate some users for UI development
  const simulatedUsers: PhaUser[] = [
    { id: 'sim-admin-1', name: 'Alice Admin', email: 'alice@pha.gov', program: 'Case Reporting', role: 'Admin' },
    { id: 'sim-user-1', name: 'Bob User', email: 'bob@pha.gov', program: 'Case Reporting', role: 'User', phone: '111-222-3333' },
  ];
  return { success: true, users: simulatedUsers }; 
}

// Placeholder for updating users - to be implemented later
export async function updatePhaUserAction(userId: string, userData: Partial<PhaUser>): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to update PHA user ${userId} (server action - placeholder) with data:`, userData);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
}

// Placeholder for deleting users - to be implemented later
export async function deletePhaUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting to delete PHA user ${userId} (server action - placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
}

// Note on "First-Time Login Password Change":
// This typically involves:
// 1. Setting a flag (e.g., `requiresPasswordChange: true`) in the user's profile in Firestore when created by an admin.
// 2. On the client-side, after a user logs in successfully:
//    a. Check their custom claims or Firestore profile for this flag.
//    b. If true, redirect them to a dedicated "Change Password" page/modal.
//    c. After they successfully change their password, update the flag to `false`.
// This logic would primarily reside in your AuthContext and login page components.
