
'use client';

import React from 'react';
import Link from "next/link";
import Image from "next/image"; 
import { useAuth } from "@/context/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { LogIn, LogOut, UserCircle, Settings, Building } from "lucide-react"; 
import { useRouter } from 'next/navigation';

export function MainHeader() {
  const { currentUser, logOut, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };

  // Basic role check placeholder - this would be replaced by a robust role system
  // For now, we assume any logged-in user might want to see the Vendor Portal link.
  // A more robust check would involve looking up user roles from Firestore or custom claims.
  // const isPhaAdmin = currentUser && currentUser.email?.endsWith('@pha.gov'); // Example
  // const isVendor = currentUser && !isPhaAdmin; // Example

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/OnboardeCR.png" 
            alt="Onboard eCR Logo"
            width={150} 
            height={50} 
            priority 
            data-ai-hint="company logo"
          />
        </Link>
        
        <div className="flex items-center gap-3">
          {loading ? (
            <Button variant="ghost" size="sm" disabled>Loading...</Button>
          ) : currentUser ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                <UserCircle className="inline mr-1 h-4 w-4" />
                {currentUser.email}
              </span>
              {/* Conditional rendering for Admin Console (e.g., based on role) */}
              {/* For now, showing to all logged-in users for simplicity */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </Link>
              </Button>
              {/* Conditional rendering for Vendor Portal */}
              {/* For now, showing to all logged-in users */}
              <Button variant="ghost" size="sm" asChild>
                 <Link href="/vendor-portal">
                    <Building className="mr-2 h-4 w-4" />
                    Vendor Portal
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Link href="/signup" className={buttonVariants({ variant: "default", size: "sm", className: "bg-primary text-primary-foreground hover:bg-primary/90" })}>
                PHA Sign Up
              </Link>
              <Link href="/vendor-registration" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Vendor Registration
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
