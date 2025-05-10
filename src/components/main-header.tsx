
'use client';

import React from 'react';
import Link from "next/link";
import Image from "next/image"; // Added Image import
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

// Removed the OnboardEcRLogo SVG component

export function MainHeader() {
  const { currentUser, logOut, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* 
            Replace with actual logo path. 
            User should place their logo image (e.g., onboard-ecr-logo.svg or .png) 
            in the `public/images/` directory.
            The width and height should be adjusted to match the actual logo aspect ratio.
          */}
          <Image
            src="https://picsum.photos/150/38" // Placeholder image
            alt="Onboard eCR Logo"
            width={150} // Adjust width as needed
            height={38} // Adjust height as needed
            priority // Load logo quickly
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
              <Button variant="default" size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
