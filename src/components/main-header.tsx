
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, LogOut, UserCircle, Settings, Building, LayoutDashboard, Loader2, Search as SearchIcon, BookOpen, UserPlus, ChevronDown, FilePenLine, Share2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ResourcesDrawer } from '@/components/resources-drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavLinkItem {
  href: string;
  label: string;
  icon?: React.ElementType;
  className?: string;
}

export function MainHeader() {
  const { currentUser, userType, logOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isResourcesDrawerOpen, setIsResourcesDrawerOpen] = useState(false);

  const showSearch = ![
    '/hco-registration',
    '/vendor-registration',
    '/health-system-detailed-registration',
    '/login',
    '/provider-portal',
    '/vendor-portal',
    '/health-system-portal',
    '/admin'
  ].includes(pathname) && !(pathname === '/' && !currentUser);


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

  let portalLink: NavLinkItem | null = null;
  if (currentUser && userType) {
    switch (userType) {
      case 'PHA':
        // PHA admins will see their email and Admin/Logout in the main section
        break;
      case 'HCO':
        portalLink = { href: '/provider-portal', label: 'Provider Portal', icon: LayoutDashboard };
        break;
      case 'EHR_VENDOR':
        portalLink = { href: '/vendor-portal', label: 'Vendor Portal', icon: Building };
        break;
      case 'HEALTH_SYSTEM':
        portalLink = { href: '/health-system-portal', label: 'Health System Portal', icon: Share2 };
        break;
      default:
        portalLink = { href: '/', label: 'Dashboard', icon: LayoutDashboard };
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
          <Image
            src="/images/SyntraCore_Logo.png"
            alt="SyntraCore Logo"
            width={150}
            height={50}
            priority
            data-ai-hint="company logo"
          />
        </Link>

        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="flex-grow max-w-md mx-4 hidden md:flex">
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-muted pl-10 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
        )}

        <nav className="flex items-center gap-1 sm:gap-2 ml-auto">
          {authLoading ? (
            <Button variant="ghost" size="sm" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : currentUser ? (
            <>
              <span className="text-sm text-muted-foreground hidden lg:inline-block mr-2 ml-2 border-l pl-2">
                <UserCircle className="inline mr-1 h-4 w-4" />
                {currentUser.email}
              </span>
              {userType === 'PHA' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Settings className="mr-1 md:mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Admin Console</span>
                  </Link>
                </Button>
              )}
              {portalLink && userType !== 'PHA' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={portalLink.href}>
                    {portalLink.icon && <portalLink.icon className="mr-1 md:mr-2 h-4 w-4" />}
                    <span className="hidden md:inline">{portalLink.label}</span>
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
                <Link href="/"> 
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/signup?type=hco">
                      <FilePenLine className="mr-2 h-4 w-4" /> Register HCO/Lab
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup?type=vendor">
                      <Building className="mr-2 h-4 w-4" /> Register EHR Vendor
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup?type=healthsystem">
                      <Share2 className="mr-2 h-4 w-4" /> Register Health System
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
               {/* Temporary Admin Console Access Button for Guests */}
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">
                  <Settings className="mr-1 h-4 w-4 text-destructive" /> Admin Console (Temp)
                </Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsResourcesDrawerOpen(true)}
            className="ml-2"
            aria-label="Open resources"
          >
            <BookOpen className="h-5 w-5" />
          </Button>
        </nav>
      </div>
      <ResourcesDrawer isOpen={isResourcesDrawerOpen} onClose={() => setIsResourcesDrawerOpen(false)} />
    </header>
  );
}
