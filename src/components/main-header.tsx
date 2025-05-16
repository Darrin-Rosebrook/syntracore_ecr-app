
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, UserCircle, Settings, Building, LayoutDashboard, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { getVendorProfileAction } from '@/actions/vendor-actions';

export function MainHeader() {
  const { currentUser, logOut, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isVendorRole, setIsVendorRole] = useState(false);
  const [isCheckingVendorRole, setIsCheckingVendorRole] = useState(false);

  const isPhaAdmin = currentUser?.email?.includes('@pha.gov');

  useEffect(() => {
    const determineVendorRole = async () => {
      if (currentUser && currentUser.uid && !isPhaAdmin) {
        setIsCheckingVendorRole(true);
        try {
          const profileResult = await getVendorProfileAction(currentUser.uid);
          setIsVendorRole(profileResult.success && !!profileResult.data);
        } catch (error) {
          console.error("Error checking vendor role:", error);
          setIsVendorRole(false);
        } finally {
          setIsCheckingVendorRole(false);
        }
      } else {
        setIsVendorRole(false);
        setIsCheckingVendorRole(false);
      }
    };

    if (!authLoading && currentUser) { // Check role only if user is loaded and present
      determineVendorRole();
    } else if (!authLoading && !currentUser) { // Reset if user logs out
        setIsVendorRole(false);
        setIsCheckingVendorRole(false);
    }
  }, [currentUser, authLoading, isPhaAdmin]);

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };

  const isHcoUser = currentUser && !isPhaAdmin && !isVendorRole;
  const overallLoading = authLoading || (currentUser && !isPhaAdmin && isCheckingVendorRole);

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

              {isPhaAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}

              {!isPhaAdmin && isVendorRole && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/vendor-portal">
                    <Building className="mr-2 h-4 w-4" />
                    Vendor Portal
                  </Link>
                </Button>
              )}

              {!isPhaAdmin && isHcoUser && ( // Show Provider Portal if HCO User AND NOT PHA admin or Vendor
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/provider-portal">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Provider Portal
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
