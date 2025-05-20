
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, Globe, Activity, Loader2, Info, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { VendorActivityLogEntry } from '@/types';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // DialogClose is not directly used but often part of Dialog imports
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import {
  addVendorActivityLogAction,
  getVendorActivityLogsAction,
  updateVendorActivityLogAction,
  deleteVendorActivityLogAction
} from '@/actions/vendor-activity-log-actions';


interface EhrVendorProfileDetailsTabProps {
  vendorValue: string; // e.g., "epic"
  vendorLabel: string | null;
}

export function EhrVendorProfileDetailsTab({ vendorValue, vendorLabel }: EhrVendorProfileDetailsTabProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [newActivityLogText, setNewActivityLogText] = useState('');
  const [activityLogs, setActivityLogs] = useState<VendorActivityLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const [isEditLogDialogOpen, setIsEditLogDialogOpen] = useState(false);
  const [editingLogEntry, setEditingLogEntry] = useState<VendorActivityLogEntry | null>(null);
  const [editedLogText, setEditedLogText] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);

  const vendorWebsite = vendorValue === 'epic' ? 'https://www.epic.com/' : 
                        vendorValue === 'cerner' ? 'https://www.oracle.com/health/' :
                        vendorValue === 'meditech' ? 'https://ehr.meditech.com/' :
                        'Not Available';

  const fetchLogs = useCallback(async () => {
    if (!vendorValue || !currentUser) return;
    setIsLoadingLogs(true);
    const result = await getVendorActivityLogsAction(vendorValue);
    if (result.success && result.logs) {
      setActivityLogs(result.logs);
    } else {
      toast({ title: "Error Loading Logs", description: result.error || "Could not fetch activity logs.", variant: "destructive" });
      setActivityLogs([]);
    }
    setIsLoadingLogs(false);
  }, [vendorValue, currentUser, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleAddActivityLog = async () => {
    if (!newActivityLogText.trim() || !currentUser) {
      toast({ title: 'Error', description: 'Log content is empty or user not logged in.', variant: 'destructive' });
      return;
    }
    setIsSubmittingLog(true);
    const logData = {
      vendorValue: vendorValue,
      entry: newActivityLogText,
      type: 'UserAction' as VendorActivityLogEntry['type'], // Ensure type matches
      creatorId: currentUser.uid,
      creatorName: currentUser.displayName || currentUser.email || 'PHA Admin',
    };

    const result = await addVendorActivityLogAction(logData);
    if (result.success) {
      setNewActivityLogText('');
      await fetchLogs(); // Re-fetch logs to include the new one
      toast({ title: 'Activity Log Added', description: 'Your note has been saved.' });
    } else {
      toast({ title: "Error Adding Log", description: result.error || "Could not save log entry.", variant: "destructive" });
    }
    setIsSubmittingLog(false);
  };

  const handleOpenEditDialog = (logEntry: VendorActivityLogEntry) => {
    if (logEntry.creatorId !== currentUser?.uid) {
      toast({ title: "Permission Denied", description: "You can only edit your own log entries.", variant: "destructive" });
      return;
    }
    setEditingLogEntry(logEntry);
    setEditedLogText(logEntry.entry);
    setIsEditLogDialogOpen(true);
  };

  const handleSaveEditedLog = async () => {
    if (!editingLogEntry || !editedLogText.trim() || !currentUser) {
      toast({ title: "Error", description: "Log content cannot be empty or user invalid.", variant: "destructive" });
      return;
    }
    setIsSubmittingLog(true);
    const result = await updateVendorActivityLogAction(editingLogEntry.id, editedLogText, currentUser.uid);
    if (result.success) {
      setIsEditLogDialogOpen(false);
      setEditingLogEntry(null);
      await fetchLogs();
      toast({ title: "Log Entry Updated" });
    } else {
      toast({ title: "Error Updating Log", description: result.error || "Could not update log entry.", variant: "destructive" });
    }
    setIsSubmittingLog(false);
  };

  const handleOpenDeleteConfirmDialog = (log: VendorActivityLogEntry) => {
    if (log.creatorId !== currentUser?.uid) {
      toast({ title: "Permission Denied", description: "You can only delete your own log entries.", variant: "destructive" });
      return;
    }
    setLogToDeleteId(log.id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteLog = async () => {
    if (!logToDeleteId || !currentUser) return;
    setIsSubmittingLog(true);
    const result = await deleteVendorActivityLogAction(logToDeleteId, currentUser.uid);
    if (result.success) {
      setIsDeleteConfirmOpen(false);
      setLogToDeleteId(null);
      await fetchLogs();
      toast({ title: "Log Entry Deleted" });
    } else {
      toast({ title: "Error Deleting Log", description: result.error || "Could not delete log entry.", variant: "destructive" });
    }
    setIsSubmittingLog(false);
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <ListTree className="mr-2 h-5 w-5 text-primary" />
          Vendor Profile: {vendorLabel || 'N/A'}
        </CardTitle>
        <CardDescription>
          General information and activity log for this EHR/LIMS Vendor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upper Section: General Information */}
        <div className="p-4 border rounded-md bg-muted/30 shadow-sm space-y-3">
          <h3 className="text-md font-medium text-muted-foreground mb-2">General Information</h3>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Vendor Name</p>
            <p className="text-md">{vendorLabel || 'Not Available'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Vendor ID (Value)</p>
            <p className="text-md">{vendorValue}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center">
              <Globe className="mr-1.5 h-4 w-4" /> Website
            </p>
            {vendorWebsite !== 'Not Available' ? (
              <a href={vendorWebsite} target="_blank" rel="noopener noreferrer" className="text-md text-primary hover:underline">
                {vendorWebsite}
              </a>
            ) : (
              <p className="text-md italic text-muted-foreground">{vendorWebsite}</p>
            )}
          </div>
        </div>

        {/* Lower Section: Activity Log */}
        <div className="p-4 border rounded-md bg-muted/30 shadow-sm space-y-3">
          <h3 className="text-md font-medium text-muted-foreground mb-2 flex items-center">
            <Activity className="mr-1.5 h-4 w-4" /> Activity Log/Notes
          </h3>
          <Textarea
            value={newActivityLogText}
            onChange={(e) => setNewActivityLogText(e.target.value)}
            placeholder="Log internal notes or manual activity related to this vendor..."
            className="w-full p-2 border rounded-md min-h-[80px] bg-background"
            disabled={isSubmittingLog || !currentUser}
          />
          <Button onClick={handleAddActivityLog} disabled={isSubmittingLog || !newActivityLogText.trim() || !currentUser} className="mt-2" size="sm">
            {isSubmittingLog ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Add Log Entry
          </Button>
          <ScrollArea className="h-[200px] border rounded-md p-3 bg-background mt-3">
            {isLoadingLogs ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading logs...</span>
              </div>
            ) : activityLogs.length > 0 ? (
              <ul className="space-y-3">
                {activityLogs.map((log) => (
                  <li key={log.id} className="text-sm p-3 rounded-md bg-muted/50 shadow-sm flex justify-between items-start">
                    <div>
                      <span className="font-medium text-primary block">
                        {format(parseISO(log.timestamp), 'PPp')} ({log.type})
                        {log.creatorName && <span className="text-xs text-muted-foreground"> - by {log.creatorName}</span>}
                      </span>
                      <p className="whitespace-pre-wrap mt-0.5">{log.entry}</p>
                    </div>
                    {currentUser && log.creatorId === currentUser.uid && (
                      <div className="flex space-x-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(log)} title="Edit Log" disabled={isSubmittingLog}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteConfirmDialog(log)} title="Delete Log" disabled={isSubmittingLog}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No activity logged for this vendor.</p>
            )}
          </ScrollArea>
        </div>
      </CardContent>

      <Dialog open={isEditLogDialogOpen} onOpenChange={setIsEditLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Log Entry</DialogTitle>
            <DialogDescription>Modify your log entry. Press save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="editLogTextArea">Log Content</Label>
            <Textarea
              id="editLogTextArea"
              value={editedLogText}
              onChange={(e) => setEditedLogText(e.target.value)}
              rows={5}
              className="w-full"
              disabled={isSubmittingLog}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {setIsEditLogDialogOpen(false); setEditingLogEntry(null);}} disabled={isSubmittingLog}>Cancel</Button>
            <Button onClick={handleSaveEditedLog} disabled={isSubmittingLog || !editedLogText.trim()}>
              {isSubmittingLog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this log entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLogToDeleteId(null)} disabled={isSubmittingLog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteLog} disabled={isSubmittingLog} className="bg-destructive hover:bg-destructive/90">
              {isSubmittingLog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Card>
  );
}
    
