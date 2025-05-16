
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { LogIn, LogOut, UserCircle, Settings, Building, LayoutDashboard, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { getVendorProfileAction } from '@/actions/vendor-actions';

export function MainHeader() {
  const { currentUser, logOut, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isVendorRole, setIsVendorRole] = useState(false);
  const [isCheckingVendorRole, setIsCheckingVendorRole] = useState(false);

  useEffect(() => {
    const determineVendorRole = async () => {
      if (currentUser && currentUser.uid) {
        setIsCheckingVendorRole(true);
        try {
          const profileResult = await getVendorProfileAction(currentUser.uid);
          if (profileResult.success && profileResult.data) {
            setIsVendorRole(true);
          } else {
            setIsVendorRole(false);
          }
        } catch (error) {
          console.error("Error checking vendor role:", error);
          setIsVendorRole(false); // Default to not vendor on error
        } finally {
          setIsCheckingVendorRole(false);
        }
      } else {
        // Clear vendor role if no user or uid
        setIsVendorRole(false);
        setIsCheckingVendorRole(false);
      }
    };

    if (!authLoading) { // Only check role once auth state is resolved
      determineVendorRole();
    }
  }, [currentUser, authLoading]);

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };

  // Role determination logic
  const isPhaAdmin = currentUser?.email?.includes('@pha.gov'); // Heuristic, consider more robust role management
  // isVendorRole is determined by useEffect after checking Firestore

  // Determine if HCO user: logged in, not PHA admin, not a vendor, and auth/role checks are complete
  const isHcoUser = currentUser && !isPhaAdmin && !isVendorRole && !authLoading && !isCheckingVendorRole;

  const overallLoading = authLoading || (!!currentUser && isCheckingVendorRole);

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

        <div className="flex items-center gap-2 sm:gap-3">
          {overallLoading ? (
            <Button variant="ghost" size="sm" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : currentUser ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                <UserCircle className="inline mr-1 h-4 w-4" />
                {currentUser.email}
              </span>

              {/* Desktop Links: Prioritize PHA Admin, then Vendor, then HCO */}
              <div className="hidden md:inline-flex items-center gap-2">
                {isPhaAdmin ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                ) : isVendorRole ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/vendor-portal">
                      <Building className="mr-2 h-4 w-4" />
                      Vendor Portal
                    </Link>
                  </Button>
                ) : isHcoUser ? ( // This condition ensures it only shows if not admin or vendor
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/provider-portal">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Provider Portal
                    </Link>
                  </Button>
                ) : null /* No specific portal link if roles are mixed or none of the above */}
              </div>

              {/* Mobile Links (Simplified): Shows the first applicable portal */}
              <div className="md:hidden">
                {isPhaAdmin ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin">Admin</Link>
                  </Button>
                ) : isVendorRole ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/vendor-portal">Vendor</Link>
                  </Button>
                ) : isHcoUser ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/provider-portal">Portal</Link>
                  </Button>
                ) : null}
              </div>

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
              {/* PHA Sign Up link removed */}
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
