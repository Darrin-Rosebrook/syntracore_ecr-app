
'use client';

import React from 'react';
import Link from "next/link";
// import Image from "next/image"; // Removed Image import
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

const OnboardEcRLogo = () => (
  <svg
    width="200" // Adjusted width for better visibility
    height="50" // Adjusted height for better visibility
    viewBox="0 0 250 65" // Adjusted viewBox to fit the design
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Onboard eCR Logo"
  >
    {/* Icon part */}
    <rect x="5" y="5" width="55" height="55" rx="10" fill="#FFA500" opacity="0.2" /> {/* Outer rounded square (orange-ish background) */}
    <path
      d="M42.5 16.25C42.5 12.9375 39.8125 10.25 36.5 10.25C33.1875 10.25 30.5 12.9375 30.5 16.25C30.5 16.9375 30.625 17.5625 30.8125 18.125C28.5625 18.5 26.875 20.375 26.875 22.6875C26.875 25.1875 28.875 27.125 31.375 27.125H42.5C44.5625 27.125 46.25 25.4375 46.25 23.375C46.25 21.3125 44.5625 19.625 42.5 19.625C42.5 19.5625 42.5 19.5 42.5 19.4375C42.5625 17.6875 42.5 16.25 42.5 16.25Z"
      fill="#FFA500" // Orange cloud
    />
     <path d="M15 32.5 H 25 L 20 27.5 Z" fill="#3498db" /> {/* Blue left arrow base */}
    <rect x="20" y="31.5" width="10" height="2" fill="#3498db" /> {/* Blue left arrow shaft */}

    <path d="M45 32.5 H 35 L 40 37.5 Z" fill="#8e44ad" /> {/* Purple right arrow base */}
    <rect x="30" y="31.5" width="10" height="2" fill="#8e44ad" /> {/* Purple right arrow shaft */}

    <rect x="12" y="42" width="40" height="3" rx="1.5" fill="#8e44ad" /> {/* Purple underline inside icon */}

    {/* Text part */}
    <text x="70" y="30" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="#003366"> {/* Dark Blue */}
      Onboard
    </text>
    <text x="173" y="30" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="#3498db"> {/* Lighter Blue */}
      eCR
    </text>
    <text x="70" y="50" fontFamily="Arial, sans-serif" fontSize="10" fill="#3498db" opacity="0.9"> {/* Lighter Blue, smaller */}
      interoperability in healthcare
    </text>
  </svg>
);


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
          <OnboardEcRLogo />
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

