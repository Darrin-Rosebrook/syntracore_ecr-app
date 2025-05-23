
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogInIcon } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { logIn, loading: authLoading, currentUser, userType, resetPassword } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  useEffect(() => {
    // Redirect after login once currentUser and userType are available and auth is not loading
    if (currentUser && !authLoading && userType) {
      console.log(`[LoginPage] Attempting redirect. User: ${currentUser.email}, UserType: ${userType}`);
      if (userType === 'hco') {
        console.log('[LoginPage] Redirecting HCO user to /provider-portal');
        router.push('/provider-portal');
      } else if (userType === 'vendor') {
        console.log('[LoginPage] Redirecting Vendor user to /vendor-portal');
        router.push('/vendor-portal');
      } else if (userType === 'healthsystem') {
        console.log('[LoginPage] Redirecting Health System user to /health-system-portal');
        router.push('/health-system-portal');
      } else if (userType === 'pha') {
        console.log('[LoginPage] Redirecting PHA user to / (main page)');
        router.push('/'); // Main page handles PHA tabs
      } else {
        console.log(`[LoginPage] User logged in, unknown userType ('${userType}'), redirecting to /`);
        router.push('/');
      }
    } else if (currentUser && !authLoading && !userType) {
      console.warn(`[LoginPage] User ${currentUser.email} logged in, but userType is not yet resolved. Waiting or defaulting to /.`);
    }
  }, [currentUser, authLoading, userType, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log(`[LoginPage] Attempting login for identifier: ${identifier}`);
    const user = await logIn(identifier, password);
    if (!user) {
      console.log('[LoginPage] Login failed for identifier:', identifier);
    }
    // Redirection is handled by the useEffect hook
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
    setIsSubmitting(true);
    await resetPassword(emailToReset);
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <LogInIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your username or email and password to login.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or Email</Label>
              <Input
                id="identifier"
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
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
                <Label htmlFor="forgotPasswordEmail" className="sr-only">Email for password reset</Label>
                <Input 
                    id="forgotPasswordEmail"
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
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
