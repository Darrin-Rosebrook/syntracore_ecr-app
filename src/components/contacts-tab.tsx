'use client';

import React, { useState } from 'react';
import type { EnrollmentData, ContactEntry, ContactDetails } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Edit3, Trash2, UserCheck, UserPlus, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox'; // Standardized import path

interface ContactsTabProps {
  enrollment: EnrollmentData;
}

const emptyContactForm: Omit<ContactEntry, 'id'> = { name: '', email: '', phone: '', role: '', isAlternative: false };

export function ContactsTab({ enrollment }: ContactsTabProps) {
  const { 
    addContactToEnrollment, 
    updateContactInEnrollment, 
    deleteContactFromEnrollment, 
    setPrimaryContactForEnrollment,
    isLoading: isAppContextLoading 
  } = useAppContext();
  const { toast } = useToast();

  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactEntry | Omit<ContactEntry, 'id'>> (emptyContactForm);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  
  const primaryContact: ContactDetails = enrollment.contactDetails;
  const additionalContacts: ContactEntry[] = (enrollment.additionalContacts || []).sort((a, b) => {
    if (a.isAlternative && !b.isAlternative) return -1;
    if (!a.isAlternative && b.isAlternative) return 1;
    return a.name.localeCompare(b.name);
  });


  const handleOpenAddDialog = () => {
    setEditingContact(emptyContactForm);
    setIsContactDialogOpen(true);
  };

  const handleOpenEditDialog = (contact: ContactEntry | ContactDetails, isPrimary = false) => {
    if (isPrimary) {
        setEditingContact({ 
            id: 'primary', 
            name: contact.name, 
            email: contact.email, 
            phone: contact.phone, 
            role: 'Primary Contact', 
            isAlternative: false 
        });
    } else {
        setEditingContact(contact as ContactEntry);
    }
    setIsContactDialogOpen(true);
  };

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement & { type: string; checked?: boolean };
    setEditingContact(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveContact = async () => {
    if (!editingContact.name || !editingContact.email) {
      toast({ title: 'Missing Fields', description: 'Name and Email are required.', variant: 'destructive' });
      return;
    }
    setIsSubmittingContact(true);
    try {
      if ('id' in editingContact && editingContact.id && editingContact.id !== 'primary') { 
        await updateContactInEnrollment(enrollment.id, editingContact as ContactEntry);
      } else if ('id' in editingContact && editingContact.id === 'primary') { 
         toast({ title: 'Info', description: 'Primary contact details are managed on the HCO Profile tab.' });
      } else { 
        await addContactToEnrollment(enrollment.id, editingContact as Omit<ContactEntry, 'id'>);
      }
      setIsContactDialogOpen(false);
    } catch (error) {
      // Toast is handled in AppContext
    } finally {
      setIsSubmittingContact(false);
    }
  };
  
  const handleDeleteContact = async (contactId: string) => {
    setIsSubmittingContact(true); 
    await deleteContactFromEnrollment(enrollment.id, contactId);
    setIsSubmittingContact(false);
  };

  const handleSetPrimary = async (contactId: string) => {
    setIsSubmittingContact(true);
    await setPrimaryContactForEnrollment(enrollment.id, contactId);
    setIsSubmittingContact(false);
  };
  
  const handleSetAlternative = async (contact: ContactEntry) => {
    setIsSubmittingContact(true);
    await updateContactInEnrollment(enrollment.id, { ...contact, isAlternative: !contact.isAlternative });
    setIsSubmittingContact(false);
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Practice Contacts</h2>
        <Button variant="outline" size="sm" onClick={handleOpenAddDialog}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

      {/* Primary Contact Display */}
      <div className="p-4 border rounded-md bg-muted/30">
        <h3 className="font-semibold mb-1">Primary Contact</h3>
        <p><strong>Name:</strong> {primaryContact.name}</p>
        <p><strong>Email:</strong> {primaryContact.email}</p>
        <p><strong>Phone:</strong> {primaryContact.phone}</p>
      </div>

      {/* Additional Contacts Table */}
      {isAppContextLoading && additionalContacts.length === 0 && <p>Loading contacts...</p>}
      {!isAppContextLoading && additionalContacts.length === 0 && (
        <p className="text-muted-foreground">No additional contacts listed.</p>
      )}

      {additionalContacts.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Alternative</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {additionalContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.role || 'N/A'}</TableCell>
                <TableCell>
                    <Checkbox
                        checked={!!contact.isAlternative}
                        onCheckedChange={() => handleSetAlternative(contact)}
                        disabled={isSubmittingContact || isAppContextLoading}
                        aria-label={`Set ${contact.name} ${contact.isAlternative ? 'away from' : 'to'} alternative contact`}
                    />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(contact)} title="Edit Contact" disabled={isSubmittingContact || isAppContextLoading}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleSetPrimary(contact.id)} title="Set as Primary" disabled={isSubmittingContact || isAppContextLoading}>
                    <UserCheck className="h-4 w-4" />
                  </Button>
                   <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" title="Delete Contact" disabled={isSubmittingContact || isAppContextLoading}>
                             {isSubmittingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
                            <DialogDescription>
                            Are you sure you want to delete contact "{contact.name}"?
                            </DialogDescription>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline" disabled={isSubmittingContact}>Cancel</Button></DialogClose>
                                <Button variant="destructive" onClick={() => handleDeleteContact(contact.id)} disabled={isSubmittingContact}>
                                    {isSubmittingContact ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{('id' in editingContact && editingContact.id && editingContact.id !== 'primary') ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Name Input */}
            <div>
                <Label htmlFor="contactNameDialog">Name</Label>
                <Input id="contactNameDialog" name="name" value={editingContact.name} onChange={handleContactFormChange} disabled={isSubmittingContact || isAppContextLoading} />
            </div>
            {/* Email Input */}
            <div>
                <Label htmlFor="contactEmailDialog">Email</Label>
                <Input id="contactEmailDialog" name="email" type="email" value={editingContact.email} onChange={handleContactFormChange} disabled={isSubmittingContact || isAppContextLoading} />
            </div>
            {/* Phone Input */}
            <div>
                <Label htmlFor="contactPhoneDialog">Phone</Label>
                <Input id="contactPhoneDialog" name="phone" type="tel" value={editingContact.phone} onChange={handleContactFormChange} disabled={isSubmittingContact || isAppContextLoading} />
            </div>
            {/* Role Input */}
            <div>
                <Label htmlFor="contactRoleDialog">Role</Label>
                <Input id="contactRoleDialog" name="role" value={editingContact.role || ''} onChange={handleContactFormChange} disabled={isSubmittingContact || isAppContextLoading} />
            </div>
            {/* isAlternative Checkbox */}
             <div className="flex items-center space-x-2">
                <Checkbox
                    id="isAlternativeDialog"
                    checked={!!editingContact.isAlternative}
                    onCheckedChange={(checked) => setEditingContact(prev => ({...prev, isAlternative: !!checked})) }
                    disabled={isSubmittingContact || isAppContextLoading || ('id' in editingContact && editingContact.id === 'primary')}
                />
                <Label htmlFor="isAlternativeDialog">Mark as Alternative/Secondary Contact</Label>
              </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost" disabled={isSubmittingContact}>Cancel</Button></DialogClose>
            <Button onClick={handleSaveContact} disabled={isSubmittingContact}>
              {isSubmittingContact ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
