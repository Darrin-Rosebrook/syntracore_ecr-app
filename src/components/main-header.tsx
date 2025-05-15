
'use client';

import React from 'react';
import Link from "next/link";
import Image from "next/image"; 
import { useAuth } from "@/context/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { LogIn, LogOut, UserCircle, Settings, Building, LayoutDashboard } from "lucide-react"; 
import { useRouter } from 'next/navigation';

export function MainHeader() {
  const { currentUser, logOut, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };

  // This is a placeholder for role detection. In a real app, this would come from
  // custom claims or a Firestore document associated with the user.
  const isPhaAdmin = currentUser?.email?.includes('@pha.gov'); // Example heuristic
  const isVendor = currentUser?.email?.includes('@vendor.com'); // Example heuristic
  const isHcoUser = !isPhaAdmin && !isVendor && currentUser; // Example: if not PHA or Vendor, could be HCO

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
        
        <div className="flex items-center gap-2 sm:gap-3"> {/* Adjusted gap for responsiveness */}
          {loading ? (
            <Button variant="ghost" size="sm" disabled>Loading...</Button>
          ) : currentUser ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                <UserCircle className="inline mr-1 h-4 w-4" />
                {currentUser.email}
              </span>
              
              {/* Admin Console Link (Example: for PHA Admins) */}
              {isPhaAdmin && (
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                  <Link href="/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}

              {/* Provider Portal Link (Example: for HCO Users) */}
              {isHcoUser && (
                 <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                   <Link href="/provider-portal">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Provider Portal
                  </Link>
                </Button>
              )}
              
              {/* Vendor Portal Link (Example: for Vendor Users) */}
              {isVendor && (
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                   <Link href="/vendor-portal">
                      <Building className="mr-2 h-4 w-4" />
                      Vendor Portal
                  </Link>
                </Button>
              )}

              {/* Fallback "My Portal" or more generic links for small screens / less specific roles */}
              {/* This logic might need refinement based on actual roles and desired UX */}
              {!isPhaAdmin && !isVendor && !isHcoUser && ( // If role isn't clear, show a generic or common portal
                <Button variant="ghost" size="sm" asChild className="md:hidden">
                  <Link href="/provider-portal"> {/* Default to provider portal if role unknown */}
                      Portal
                  </Link>
                </Button>
              )}


              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
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
              <Link href="/signup" className={buttonVariants({ variant: "default", size: "sm", className: "bg-primary text-primary-foreground hover:bg-primary/90 hidden sm:inline-flex" })}>
                PHA Sign Up
              </Link>
              <Link href="/vendor-registration" className={buttonVariants({ variant: "outline", size: "sm", className: "hidden sm:inline-flex" })}>
                Vendor Registration
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
