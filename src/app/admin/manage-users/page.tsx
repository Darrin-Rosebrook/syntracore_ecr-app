
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ArrowLeft, PlusCircle, Loader2, List, Eye, EyeOff, Copy, KeyRound, Edit3, Search, UserCheck, UserX, ShieldAlert, ChevronDown, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PhaUser, PhaUserStatus, PhaRole, PhaProgram } from '@/types';
import { addPhaUserAction, getPhaUsersAction, requestPasswordResetAction, updatePhaUserAction } from '@/actions/user-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const phaUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  program: z.enum(['Case Reporting'] as [PhaProgram, ...PhaProgram[]], { message: "Program is required." }),
  role: z.enum(['Admin', 'User'] as [PhaRole, ...PhaRole[]], { message: "Role is required." }),
});
type PhaUserFormData = z.infer<typeof phaUserSchema>;

const editPhaUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }).optional(),
  email: z.string().email({ message: "Invalid email address." }).optional(),
  phone: z.string().optional().nullable(),
  program: z.enum(['Case Reporting'] as [PhaProgram, ...PhaProgram[]]).optional(),
  role: z.enum(['Admin', 'User'] as [PhaRole, ...PhaRole[]]).optional(),
  status: z.enum(['Active', 'Inactive'] as [PhaUserStatus, ...PhaUserStatus[]]).optional(),
});
type EditPhaUserFormData = z.infer<typeof editPhaUserSchema>;


export default function ManageUsersPage() {
  const { toast } = useToast();
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [phaUsers, setPhaUsers] = useState<PhaUser[]>([]);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [generatedUsername, setGeneratedUsername] = useState<string | null>(null);
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PhaUser | null>(null);


  const { control: addControl, handleSubmit: handleAddSubmit, reset: resetAddForm, formState: { errors: addErrors } } = useForm<PhaUserFormData>({
    resolver: zodResolver(phaUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      program: 'Case Reporting',
      role: 'User',
    },
  });

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEditForm, setValue: setEditValue, formState: { errors: editErrors } } = useForm<EditPhaUserFormData>({
    resolver: zodResolver(editPhaUserSchema),
  });

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    const result = await getPhaUsersAction();
    if (result.success && result.users) {
      setPhaUsers(result.users);
    } else {
      toast({ title: 'Error Loading Users', description: result.error || 'Could not load PHA users.', variant: 'destructive' });
    }
    setIsLoadingUsers(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onAddSubmit: SubmitHandler<PhaUserFormData> = async (data) => {
    setIsSubmittingAdd(true);
    setTempPassword(null);
    setGeneratedUsername(null);
    const result = await addPhaUserAction(data);
    setIsSubmittingAdd(false);

    if (result.success && result.userId && result.temporaryPassword && result.username) {
      toast({
        title: 'User Added',
        description: `User ${data.name} has been successfully added.`,
      });
      setTempPassword(result.temporaryPassword);
      setGeneratedUsername(result.username);
      await fetchUsers(); 
      resetAddForm();
    } else {
      toast({
        title: 'Error Adding User',
        description: result.error || 'Failed to add user.',
        variant: 'destructive',
      });
    }
  };
  
  const onEditSubmit: SubmitHandler<EditPhaUserFormData> = async (data) => {
    if (!editingUser) return;
    setIsSubmittingUpdate(true);
    const result = await updatePhaUserAction(editingUser.id, data);
    setIsSubmittingUpdate(false);

    if (result.success) {
      toast({ title: 'User Updated', description: `User ${editingUser.name} has been updated.` });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } else {
      toast({ title: 'Error Updating User', description: result.error || 'Failed to update user.', variant: 'destructive' });
    }
  };

  const handleOpenEditDialog = (user: PhaUser) => {
    setEditingUser(user);
    resetEditForm({ // Use reset with values to ensure form state is clean
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      program: user.program,
      role: user.role,
      status: user.status,
    });
    setIsEditDialogOpen(true);
  };


  const handlePasswordResetRequest = async (email: string, userName: string) => {
    // It's better to have a separate loading state for this if it can be triggered independently
    // For now, using isSubmittingAdd to prevent concurrent form submissions, but this could be refined
    setIsSubmittingAdd(true); 
    const result = await requestPasswordResetAction(email);
    setIsSubmittingAdd(false);

    if (result.success) {
      toast({
        title: 'Password Reset Initiated',
        description: `A password reset (simulated) has been initiated for ${userName} (${email}).`,
      });
    } else {
      toast({
        title: 'Error Resetting Password',
        description: result.error || `Failed to request password reset for ${userName}.`,
        variant: 'destructive',
      });
    }
  };
  
  const handleChangeUserStatus = async (userId: string, newStatus: PhaUserStatus) => {
    setIsSubmittingUpdate(true); 
    const result = await updatePhaUserAction(userId, { status: newStatus });
    setIsSubmittingUpdate(false);

    if (result.success) {
      toast({ title: 'Status Updated', description: `User status changed to ${newStatus}.` });
      await fetchUsers();
    } else {
      toast({ title: 'Error Updating Status', description: result.error || 'Failed to update status.', variant: 'destructive' });
    }
  };


  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        toast({ title: 'Copied!', description: 'Value copied to clipboard.' });
      }).catch(err => {
        console.error("Failed to copy: ", err);
        toast({ title: 'Copy Failed', description: 'Could not copy value. Check console for details.', variant: 'destructive' });
      });
    } else {
       toast({ title: 'Copy Failed', description: 'Clipboard API not available. Try manual copy.', variant: 'destructive' });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return phaUsers;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return phaUsers.filter(user =>
      user.name.toLowerCase().includes(lowerSearchTerm) ||
      user.email.toLowerCase().includes(lowerSearchTerm) ||
      (user.username && user.username.toLowerCase().includes(lowerSearchTerm))
    );
  }, [phaUsers, searchTerm]);
  
  const getStatusBadgeVariant = (status: PhaUserStatus): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'Active') return 'default';
    if (status === 'Inactive') return 'secondary'; 
    return 'outline';
  };
  const getStatusBadgeColorClass = (status: PhaUserStatus): string => {
    if (status === 'Active') return 'bg-green-500 hover:bg-green-600';
    if (status === 'Inactive') return 'bg-gray-500 hover:bg-gray-600';
    return '';
  };

  const closeCredentialsAlert = () => {
    setTempPassword(null);
    setGeneratedUsername(null);
  }

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
            <CardDescription>Create accounts for Public Health Agency personnel. A username and temporary password will be generated.</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddSubmit(onAddSubmit)}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Controller
                  name="name"
                  control={addControl}
                  render={({ field }) => <Input id="name" {...field} placeholder="e.g., Jane Doe" disabled={isSubmittingAdd} />}
                />
                {addErrors.name && <p className="text-sm text-destructive mt-1">{addErrors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Controller
                  name="email"
                  control={addControl}
                  render={({ field }) => <Input id="email" type="email" {...field} placeholder="e.g., jane.doe@pha.gov" disabled={isSubmittingAdd} />}
                />
                {addErrors.email && <p className="text-sm text-destructive mt-1">{addErrors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Controller
                  name="phone"
                  control={addControl}
                  render={({ field }) => <Input id="phone" type="tel" {...field} placeholder="e.g., (555) 123-4567" disabled={isSubmittingAdd} />}
                />
                {addErrors.phone && <p className="text-sm text-destructive mt-1">{addErrors.phone.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program">Program</Label>
                  <Controller
                    name="program"
                    control={addControl}
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
                  {addErrors.program && <p className="text-sm text-destructive mt-1">{addErrors.program.message}</p>}
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Controller
                    name="role"
                    control={addControl}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingAdd}>
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
                  {addErrors.role && <p className="text-sm text-destructive mt-1">{addErrors.role.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmittingAdd}>
                {isSubmittingAdd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isSubmittingAdd ? 'Adding User...' : 'Add User'}
              </Button>
            </CardFooter>
          </form>
          {tempPassword && generatedUsername && (
            <CardContent className="mt-4">
              <Alert>
                <div className="flex justify-between items-start">
                    <div>
                        <KeyRound className="h-4 w-4 inline-block mr-1" />
                        <AlertTitle className="inline-block">User Credentials Generated!</AlertTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={closeCredentialsAlert} className="h-6 w-6 p-0 -mt-1 -mr-1">
                        <XCircle className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>
                <AlertDescription className="mt-2">
                  Please provide these credentials to the new user. They will be prompted to change their password upon first login (feature to be implemented).
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                      <Label htmlFor="generatedUsername" className="w-20 shrink-0">Username:</Label>
                      <Input id="generatedUsername" type="text" value={generatedUsername} readOnly className="flex-grow" />
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedUsername)}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Copy username</p></TooltipContent></Tooltip>
                    </div>
                    <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                       <Label htmlFor="tempPasswordDisplay" className="w-20 shrink-0">Password:</Label>
                      <Input id="tempPasswordDisplay" type={showTempPassword ? "text" : "password"} value={tempPassword} readOnly className="flex-grow" />
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setShowTempPassword(!showTempPassword)}>{showTempPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      </TooltipTrigger><TooltipContent><p>Toggle visibility</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => copyToClipboard(tempPassword)}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Copy password</p></TooltipContent></Tooltip>
                    </div>
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
            <CardDescription>List of active and inactive Public Health Agency user accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center">
              <Search className="absolute ml-3 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search by name, email, or username..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-1/2 lg:w-1/3"
                disabled={isLoadingUsers && phaUsers.length === 0}
              />
            </div>

            {isLoadingUsers ? (
              <div className="flex justify-center items-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-muted-foreground">{searchTerm ? "No users match your search." : "No PHA users found. Add users using the form above."}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.username || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'} className={user.role === 'Admin' ? 'bg-primary' : ''}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                           <Badge variant={getStatusBadgeVariant(user.status)} className={`${getStatusBadgeColorClass(user.status)} text-white`}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={isSubmittingAdd || isSubmittingUpdate}>
                                Actions <ChevronDown className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(user)} disabled={isSubmittingUpdate}>
                                <Edit3 className="mr-2 h-4 w-4" /> Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePasswordResetRequest(user.email, user.name)} disabled={isSubmittingAdd}>
                                <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'Active' ? (
                                <DropdownMenuItem onClick={() => handleChangeUserStatus(user.id, 'Inactive')} disabled={isSubmittingUpdate} className="text-orange-600 focus:text-orange-600">
                                  <UserX className="mr-2 h-4 w-4" /> Set Inactive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleChangeUserStatus(user.id, 'Active')} disabled={isSubmittingUpdate} className="text-green-600 focus:text-green-600">
                                  <UserCheck className="mr-2 h-4 w-4" /> Set Active
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
             <div className="mt-6 p-6 border-2 border-dashed border-muted rounded-lg text-center bg-muted/30">
              <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-md font-semibold text-muted-foreground">
                Important Note on User Management
              </p>
              <p className="text-xs text-muted-foreground">
                Currently, user management operations (add, edit, status change, password reset) are simulated.
                Full integration with Firebase Authentication and Firestore is required for these actions to persist and have real effect on user accounts and access.
                First-time password change enforcement requires client-side logic post-login.
              </p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit PHA User: {editingUser?.name}</DialogTitle>
              <DialogDescription>Modify the details for this user.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit(onEditSubmit)}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="editName">Full Name</Label>
                  <Controller name="name" control={editControl} render={({ field }) => <Input id="editName" {...field} disabled={isSubmittingUpdate}/>} />
                  {editErrors.name && <p className="text-sm text-destructive mt-1">{editErrors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="editEmail">Email Address</Label>
                  <Controller name="email" control={editControl} render={({ field }) => <Input id="editEmail" type="email" {...field} disabled={isSubmittingUpdate}/>} />
                  {editErrors.email && <p className="text-sm text-destructive mt-1">{editErrors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="editPhone">Phone Number (Optional)</Label>
                  <Controller name="phone" control={editControl} render={({ field }) => <Input id="editPhone" type="tel" {...field} value={field.value ?? ""} disabled={isSubmittingUpdate}/>} />
                  {editErrors.phone && <p className="text-sm text-destructive mt-1">{editErrors.phone.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editProgram">Program</Label>
                    <Controller name="program" control={editControl} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={true}>
                        <SelectTrigger id="editProgram"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Case Reporting">Case Reporting</SelectItem></SelectContent>
                      </Select>
                    )} />
                    {editErrors.program && <p className="text-sm text-destructive mt-1">{editErrors.program.message}</p>}
                  </div>
                   <div>
                    <Label htmlFor="editRole">Role</Label>
                    <Controller name="role" control={editControl} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingUpdate}>
                        <SelectTrigger id="editRole"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="User">User</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                    {editErrors.role && <p className="text-sm text-destructive mt-1">{editErrors.role.message}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="editStatus">Status</Label>
                  <Controller name="status" control={editControl} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingUpdate}>
                      <SelectTrigger id="editStatus"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                  {editErrors.status && <p className="text-sm text-destructive mt-1">{editErrors.status.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingUpdate}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmittingUpdate}>
                  {isSubmittingUpdate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}

