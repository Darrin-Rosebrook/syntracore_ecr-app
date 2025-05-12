'use client';

import React, { useState, useEffect } from 'react';
import type { EnrollmentData, ContactEntry, ContactDetails } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit3, Trash2, UserCheck, UserPlus, Loader2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

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
        // For primary contact, we don't have an 'id' or 'role' in ContactDetails, so we adapt
        setEditingContact({ 
            id: 'primary', // Special ID for primary, won't be saved as 'primary' if updated
            name: contact.name, 
            email: contact.email, 
            phone: contact.phone, 
            role: 'Primary Contact', // Fixed role
            isAlternative: false // Primary cannot be alternative
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
      if ('id' in editingContact && editingContact.id !== 'primary') { // Editing existing additional contact
        await updateContactInEnrollment(enrollment.id, editingContact as ContactEntry);
      } else if ('id' in editingContact && editingContact.id === 'primary') { // Editing the primary contact
        // This scenario needs special handling: update the main contactDetails on EnrollmentData
        // This is better handled by updateEnrollmentData in HcoProfileTab for now.
        // Or, make primary contact editable here, which means we need an updatePrimaryContact action.
        // For simplicity, let's assume primary edit happens on HcoProfileTab.
        // If we want to edit it here:
        // await updatePrimaryContactDetails(enrollment.id, {name: editingContact.name, email: editingContact.email, phone: editingContact.phone});
         toast({ title: 'Info', description: 'Primary contact details are managed on the HCO Profile tab.' });

      } else { // Adding new contact
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
    setIsSubmittingContact(true); // Use same flag for busy state
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
        {/* Primary contact editing is on HCO Profile tab */}
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
            TableRow>
          </TableHeader>
          <TableBody>
            {additionalContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.role || 'N/A'}</TableCell>
                <TableCell>
                    
                TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(contact)} title="Edit Contact" disabled={isSubmittingContact || isAppContextLoading}>
                    
                  Button>
                  <Button variant="ghost" size="icon" onClick={() => handleSetPrimary(contact.id)} title="Set as Primary" disabled={isSubmittingContact || isAppContextLoading}>
                    
                  Button>
                   <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" title="Delete Contact" disabled={isSubmittingContact || isAppContextLoading}>
                             {isSubmittingContact ?  null}
                           Button>
                        DialogTrigger>
                        <DialogContent>
                            Confirm Deletion
                            
                            Are you sure you want to delete contact "{contact.name}"?
                            
                                Cancel
                                 Delete
                                    {isSubmittingContact ?  null}
                                
                            
                        DialogContent>
                    Dialog>
                TableCell>
              TableRow>
            ))}
          TableBody>
        Table>
      )}

      {/* Add/Edit Contact Dialog */}
       Save Contact
            
            
        
        
      
  );
}