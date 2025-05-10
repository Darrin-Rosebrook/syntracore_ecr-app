import React from 'react';
import Link from "next/link";
import Image from "next/image"; // Added import for Image component

export function MainHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center"> {/* Removed space-x-2 as Image is a single child */}
          <Image
            src="/onboard-ecr-logo.png" // Path to the logo in the public folder
            alt="Onboard eCR Logo"
            width={190} // Adjusted width based on common logo aspect ratios
            height={40} // Adjusted height for header
            priority // Good for LCP
            data-ai-hint="logo health"
          />
        </Link>
        {/* Add navigation items here if needed in the future */}
      </div>
    </header>
  );
}
