
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogInIcon } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess?: () => void; // Optional callback for successful login
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { logIn, loading: authLoading, currentUser, userType, resetPassword } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  useEffect(() => {
    // Redirect after login once currentUser and userType are available and auth is not loading
    if (currentUser && !authLoading && userType) {
      console.log(`[LoginForm] Attempting redirect. User: ${currentUser.email}, UserType: ${userType}`);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        if (userType === 'hco') {
          console.log('[LoginForm] Redirecting HCO user to /provider-portal');
          router.push('/provider-portal');
        } else if (userType === 'vendor') {
          console.log('[LoginForm] Redirecting Vendor user to /vendor-portal');
          router.push('/vendor-portal');
        } else if (userType === 'healthsystem') {
          console.log('[LoginForm] Redirecting Health System user to /health-system-portal');
          router.push('/health-system-portal');
        } else if (userType === 'pha') {
          console.log('[LoginForm] Redirecting PHA user to / (main page)');
          router.push('/'); // Main page handles PHA tabs
        } else {
          console.log(`[LoginForm] User logged in, unknown userType ('${userType}'), redirecting to /`);
          router.push('/');
        }
      }
    } else if (currentUser && !authLoading && !userType) {
        // This case can happen if user is authenticated but userType determination is still pending or failed
        console.warn(`[LoginForm] User ${currentUser.email} logged in, but userType is not yet resolved. Waiting or defaulting to /.`);
        // Potentially add a small delay or rely on onAuthStateChanged to eventually set userType
        // For now, if user is logged in but type isn't known, they might land on '/' and page.tsx will handle display
    }
  }, [currentUser, authLoading, userType, router, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log(`[LoginForm] Attempting login for identifier: ${identifier}`);
    const user = await logIn(identifier, password);
    // Redirection is now handled by the useEffect hook above
    if (!user) {
      console.log('[LoginForm] Login failed for identifier:', identifier);
    }
    setIsSubmitting(false);
  };

  const handlePasswordReset = async () => {
    if (!forgotPasswordEmail && identifier.includes('@')) {
        setForgotPasswordEmail(identifier);
    }
    if (!forgotPasswordEmail && !identifier.includes('@')) {
         alert("Please enter your email address in the 'Username or Email' field to reset password if using username to login, or directly use the forgot password email field.");
         return;
    }
    const emailToReset = forgotPasswordEmail || (identifier.includes('@') ? identifier : '');

    if (!emailToReset) {
      alert("Please enter a valid email address to reset the password.");
      return;
    }
    setIsSubmitting(true); // Use shared submitting state or a dedicated one
    await resetPassword(emailToReset);
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <LogInIcon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your username or email and password.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-identifier">Username or Email</Label>
            <Input
              id="login-identifier"
              type="text"
              placeholder="username or m@example.com"
              value={identifier}
              onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (e.target.value.includes('@')) {
                      setForgotPasswordEmail(e.target.value);
                  }
              }}
              required
              disabled={authLoading || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={authLoading || isSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={authLoading || isSubmitting}>
            {(authLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
          <div className="w-full text-sm">
              <Label htmlFor="login-forgotPasswordEmail" className="sr-only">Email for password reset</Label>
              <Input
                  id="login-forgotPasswordEmail"
                  type="email"
                  placeholder="Enter email for password reset"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="mb-2 text-xs h-8"
                  disabled={authLoading || isSubmitting}
              />
              <Button type="button" variant="link" onClick={handlePasswordReset} disabled={authLoading || isSubmitting || !forgotPasswordEmail} className="p-0 h-auto">
                Forgot password?
              </Button>
          </div>
          {/* Link to general signup is removed as registration options are on the same page */}
        </CardFooter>
      </form>
    </Card>
  );
}
