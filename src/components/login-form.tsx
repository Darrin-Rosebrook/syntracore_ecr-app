
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
  const { logIn, loading: authLoading, currentUser, resetPassword } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  useEffect(() => {
    if (currentUser && onLoginSuccess) {
      onLoginSuccess();
    } else if (currentUser) {
      router.push('/'); // Default redirect if no callback
    }
  }, [currentUser, router, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const user = await logIn(identifier, password);
    if (user) {
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.push('/'); // Default redirect
      }
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
