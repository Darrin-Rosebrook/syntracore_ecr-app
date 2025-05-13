
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ArrowLeft, PlusCircle, Loader2, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PhaUser, PhaProgram, PhaRole } from '@/types';
import { addPhaUserAction } from '@/actions/user-actions'; // New action

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
  const [phaUsers, setPhaUsers] = useState<PhaUser[]>([]); // Placeholder for user list

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PhaUserFormData>({
    resolver: zodResolver(phaUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      program: 'Case Reporting', // Default program
      role: 'User', // Default role
    },
  });

  const onSubmit = async (data: PhaUserFormData) => {
    setIsSubmitting(true);
    const result = await addPhaUserAction(data);
    setIsSubmitting(false);

    if (result.success && result.userId) {
      toast({
        title: 'User Added',
        description: `User ${data.name} has been successfully added.`,
      });
      // In a real app, you would fetch the updated user list or add to local state
      // For now, we'll just log and reset form
      setPhaUsers(prev => [...prev, { ...data, id: result.userId! }]);
      reset();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to add user.',
        variant: 'destructive',
      });
    }
  };

  return (
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
          <CardDescription>Create accounts for Public Health Agency personnel.</CardDescription>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={true}> {/* Disabled as only one option for now */}
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
          {phaUsers.length === 0 ? (
            <p className="text-muted-foreground">No PHA users added yet. Add users using the form above.</p>
          ) : (
            <ul className="space-y-2">
              {phaUsers.map((user) => (
                <li key={user.id || user.email} className="p-3 bg-muted/50 rounded-md shadow-sm">
                  <p className="font-medium">{user.name} <span className="text-sm text-muted-foreground">({user.email})</span></p>
                  <p className="text-xs text-muted-foreground">Program: {user.program} | Role: {user.role} {user.phone ? `| Phone: ${user.phone}` : ''}</p>
                  {/* Placeholder for edit/delete actions */}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 p-6 border-2 border-dashed border-muted rounded-lg text-center bg-muted/30">
            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-md font-semibold text-muted-foreground">
              Full User List & Management Coming Soon
            </p>
            <p className="text-xs text-muted-foreground">
              Editing, deleting, and advanced role management features are under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
