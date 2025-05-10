
import React from 'react';
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext'; // Added AuthProvider
import { MainHeader } from '@/components/main-header'; 

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Onboard eCR', // Changed from SyntraHub as it's not part of the logo anymore
  description: 'SyntraHub - Project Management and Enrollment Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider>
          <AuthProvider> {/* Added AuthProvider wrapper */}
            <MainHeader /> 
            {children}
            <Toaster />
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}
