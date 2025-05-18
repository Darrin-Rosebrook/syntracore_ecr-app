
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, LogOut, UserCircle, Settings, Building, LayoutDashboard, Loader2, Search as SearchIcon, BookOpen } from "lucide-react"; // Added BookOpen
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getVendorProfileAction } from '@/actions/vendor-actions';
import { ResourcesDrawer } from '@/components/resources-drawer'; // Added import

export function MainHeader() {
  const { currentUser, logOut, loading: authLoading, isPhaUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isVendorRole, setIsVendorRole] = useState(false);
  const [isCheckingVendorRole, setIsCheckingVendorRole] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isResourcesDrawerOpen, setIsResourcesDrawerOpen] = useState(false); // State for drawer

  const showSearch = !(
    pathname === '/hco-registration' ||
    (pathname === '/' && !currentUser) || // Hide on splash page for guests
    pathname === '/login'
  );

  useEffect(() => {
    const determineVendorRole = async () => {
      if (currentUser && currentUser.uid && !isPhaUser) {
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

    if (!authLoading && currentUser) {
      determineVendorRole();
    } else if (!authLoading && !currentUser) {
        setIsVendorRole(false);
        setIsCheckingVendorRole(false);
    }
  }, [currentUser, authLoading, isPhaUser]);

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/search');
    }
  };
  
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);


  const isHcoUser = currentUser && !isPhaUser && !isVendorRole;
  const overallLoading = authLoading || (currentUser && !isPhaUser && isCheckingVendorRole);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <Image
            src="/images/OnboardeCR.png" 
            alt="Onboard eCR Logo"
            width={150}
            height={50} 
            priority
            data-ai-hint="company logo"
          />
        </Link>

        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="flex-grow max-w-md mx-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search HCOs, users, vendors..."
                className="w-full rounded-lg bg-muted pl-10 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
        )}

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {overallLoading ? (
            <Button variant="ghost" size="sm" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : currentUser ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline-block mr-2">
                <UserCircle className="inline mr-1 h-4 w-4" />
                {currentUser.email}
              </span>

              {isPhaUser && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Settings className="mr-1 md:mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Link>
                </Button>
              )}

              {!isPhaUser && isVendorRole && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/vendor-portal">
                    <Building className="mr-1 md:mr-2 h-4 w-4" />
                     <span className="hidden md:inline">Vendor Portal</span>
                  </Link>
                </Button>
              )}

              {isHcoUser && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/provider-portal">
                    <LayoutDashboard className="mr-1 md:mr-2 h-4 w-4" />
                     <span className="hidden md:inline">Provider Portal</span>
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
              {/* Vendor Registration button removed as per previous request, relying on tab */}
            </>
          )}
          {/* Resources Drawer Trigger - visible to all users */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsResourcesDrawerOpen(true)}
            className="flex items-center"
            aria-label="Open resources"
          >
            <BookOpen className="mr-1 h-4 w-4" /> {/* Icon always visible */}
            <span>Resources</span> {/* Text always visible */}
          </Button>
        </div>
      </div>
      <ResourcesDrawer isOpen={isResourcesDrawerOpen} onClose={() => setIsResourcesDrawerOpen(false)} />
    </header>
  );
}
