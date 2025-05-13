
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ArrowLeft, PlusCircle, Loader2, List, Eye, EyeOff, Copy, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PhaUser } from '@/types';
import { addPhaUserAction, getPhaUsersAction, requestPasswordResetAction } from '@/actions/user-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const phaUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  program: z.enum(['Case Reporting'], { message: "Program is required." }),
  role: z.enum(['Admin', 'User'], { message: "Role is required." }),
});

type PhaUserFormData = z.infer<typeof phaUserSchema>;

export default function ManageUsersPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [phaUsers, setPhaUsers] = useState<PhaUser[]>([]);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [showTempPassword, setShowTempPassword] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PhaUserFormData>({
    resolver: zodResolver(phaUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      program: 'Case Reporting',
      role: 'User',
    },
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      const result = await getPhaUsersAction();
      if (result.success && result.users) {
        setPhaUsers(result.users);
      } else {
        toast({ title: 'Error', description: 'Could not load PHA users.', variant: 'destructive' });
      }
      setIsLoadingUsers(false);
    };
    fetchUsers();
  }, [toast]);

  const onSubmit = async (data: PhaUserFormData) => {
    setIsSubmitting(true);
    setTempPassword(null); // Clear previous temp password
    const result = await addPhaUserAction(data);
    setIsSubmitting(false);

    if (result.success && result.userId && result.temporaryPassword) {
      toast({
        title: 'User Added',
        description: `User ${data.name} has been successfully added.`,
      });
      setTempPassword(result.temporaryPassword);
      // Refetch users or add to local state
      setPhaUsers(prev => [...prev, { ...data, id: result.userId! }]); // Add to local state for immediate UI update
      reset();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to add user.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordResetRequest = async (email: string, userName: string) => {
    setIsSubmitting(true); // Use general submitting state or a specific one for this action
    const result = await requestPasswordResetAction(email);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Password Reset Requested',
        description: `A password reset (simulated) has been initiated for ${userName} (${email}).`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || `Failed to request password reset for ${userName}.`,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied!', description: 'Temporary password copied to clipboard.' });
    }).catch(err => {
      toast({ title: 'Copy Failed', description: 'Could not copy password.', variant: 'destructive' });
    });
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Manage SyntraCore PHA Users
          </h1>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center">
              <PlusCircle className="mr-2 h-6 w-6 text-primary" />
              Add New PHA User
            </CardTitle>
            <CardDescription>Create accounts for Public Health Agency personnel. A temporary password will be generated.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} placeholder="e.g., Jane Doe" disabled={isSubmitting} />}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <Input id="email" type="email" {...field} placeholder="e.g., jane.doe@pha.gov" disabled={isSubmitting} />}
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => <Input id="phone" type="tel" {...field} placeholder="e.g., (555) 123-4567" disabled={isSubmitting} />}
                />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program">Program</Label>
                  <Controller
                    name="program"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={true}>
                        <SelectTrigger id="program">
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Case Reporting">Case Reporting</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.program && <p className="text-sm text-destructive mt-1">{errors.program.message}</p>}
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="User">User</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Adding User...' : 'Add User'}
              </Button>
            </CardFooter>
          </form>
          {tempPassword && (
            <CardContent className="mt-4">
              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertTitle>Temporary Password Generated!</AlertTitle>
                <AlertDescription>
                  Please provide this password to the new user. They will be prompted to change it upon first login (feature to be implemented).
                  <div className="mt-2 flex items-center space-x-2 bg-muted p-2 rounded-md">
                    <Input 
                      type={showTempPassword ? "text" : "password"} 
                      value={tempPassword} 
                      readOnly 
                      className="flex-grow"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setShowTempPassword(!showTempPassword)}>
                          {showTempPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Toggle visibility</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(tempPassword)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Copy password</p></TooltipContent>
                    </Tooltip>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center">
              <List className="mr-2 h-6 w-6 text-primary" />
              Current PHA Users
            </CardTitle>
            <CardDescription>List of active Public Health Agency user accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center items-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : phaUsers.length === 0 ? (
              <p className="text-muted-foreground">No PHA users found. Add users using the form above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Program</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {phaUsers.map((user) => (
                      <tr key={user.id || user.email}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.program}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePasswordResetRequest(user.email, user.name)}
                            disabled={isSubmitting}
                          >
                            <KeyRound className="mr-1 h-4 w-4" />
                            Reset Password
                          </Button>
                          {/* Placeholder for Edit/Delete buttons */}
                          <Button variant="ghost" size="sm" disabled>Edit</Button>
                          <Button variant="ghost" size="sm" disabled className="text-destructive hover:text-destructive">Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-6 p-6 border-2 border-dashed border-muted rounded-lg text-center bg-muted/30">
              <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-md font-semibold text-muted-foreground">
                Advanced User Management Coming Soon
              </p>
              <p className="text-xs text-muted-foreground">
                Full editing, deleting, detailed role management, and first-time password change enforcement are under development.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
