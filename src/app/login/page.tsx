
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
  const [identifier, setIdentifier] = useState(''); // Changed from email to identifier
  const [password, setPassword] = useState('');
  const { logIn, loading, currentUser, resetPassword } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(''); // For the reset password flow

  useEffect(() => {
    if (currentUser) {
      router.push('/'); 
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const user = await logIn(identifier, password); // Pass identifier
    if (user) {
      router.push('/');
    }
    setIsSubmitting(false);
  };

  const handlePasswordReset = async () => {
    if (!forgotPasswordEmail && identifier.includes('@')) { // Use identifier if it's an email
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
          <CardDescription>Enter your username or email and password to login.</CardDescription> {/* Updated description */}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or Email</Label> {/* Updated label */}
              <Input
                id="identifier"
                type="text" 
                placeholder="username or m@example.com" 
                value={identifier}
                onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (e.target.value.includes('@')) { // Auto-fill forgot password email if identifier is an email
                        setForgotPasswordEmail(e.target.value);
                    }
                }}
                required
                disabled={loading || isSubmitting}
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
                disabled={loading || isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading || isSubmitting}>
              {(loading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    disabled={loading || isSubmitting}
                />
                <Button type="button" variant="link" onClick={handlePasswordReset} disabled={loading || isSubmitting || !forgotPasswordEmail} className="p-0 h-auto">
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
