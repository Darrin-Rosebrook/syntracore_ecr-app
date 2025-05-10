import React from 'react';
import Link from "next/link";
import Image from "next/image";

export function MainHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-red-500 text-white"> {/* Changed background, added text color for contrast */}
      <div className="container flex h-16 items-center justify-between"> {/* Ensured justify-between */}
        <Link href="/" className="flex items-center">
          <Image
            src="/onboard-ecr-logo.png" // Path to the logo in the public folder
            alt="Onboard eCR Logo"
            width={190} 
            height={40} 
            priority 
            data-ai-hint="logo health"
          />
           <span className="ml-4 font-bold">HEADER TEST</span> {/* Added test text, increased margin */}
        </Link>
        {/* This div helps justify-between work correctly if there are no other right-aligned items yet */}
        <div></div> 
      </div>
    </header>
  );
}
