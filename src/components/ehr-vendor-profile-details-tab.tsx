
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, Globe, Activity, Loader2, Info, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { ActivityLogEntry as BaseActivityLogEntry } from '@/types';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input'; // For edit dialog
import { Label } from '@/components/ui/label'; // For edit dialog

interface EhrVendorProfileDetailsTabProps {
  vendorValue: string;
  vendorLabel: string | null;
}

// Extend ActivityLogEntry for client-side simulation to include creator info
interface ClientActivityLogEntry extends BaseActivityLogEntry {
  id: string; // Add a unique ID for client-side manipulation
  creatorId?: string;
  creatorName?: string;
}

export function EhrVendorProfileDetailsTab({ vendorValue, vendorLabel }: EhrVendorProfileDetailsTabProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [newActivityLogText, setNewActivityLogText] = useState('');
  const [displayedActivityLogs, setDisplayedActivityLogs] = useState<ClientActivityLogEntry[]>([]);
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);

  const [isEditLogDialogOpen, setIsEditLogDialogOpen] = useState(false);
  const [editingLogEntry, setEditingLogEntry] = useState<ClientActivityLogEntry | null>(null);
  const [editedLogText, setEditedLogText] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);

  const vendorWebsite = vendorValue === 'epic' ? 'https://www.epic.com/' : 'Not Available';

  const handleAddActivityLog = () => {
    if (!newActivityLogText.trim() || !currentUser) {
      toast({ title: 'Error', description: 'Log content is empty or user not logged in.', variant: 'destructive' });
      return;
    }
    setIsSimulatingAction(true);
    const newLog: ClientActivityLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      entry: newActivityLogText,
      type: 'UserAction',
      user: currentUser.displayName || currentUser.email || 'PHA Admin', // This is the 'user' field from BaseActivityLogEntry
      creatorId: currentUser.uid,
      creatorName: currentUser.displayName || currentUser.email || 'PHA Admin',
    };
    setDisplayedActivityLogs(prev => [newLog, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setNewActivityLogText('');
    toast({
      title: 'Activity Log Added (Simulated)',
      description: `Your note for ${vendorLabel || 'this vendor'} has been added to the local history for this session.`,
    });
    setIsSimulatingAction(false);
  };

  const handleOpenEditDialog = (logEntry: ClientActivityLogEntry) => {
    if (logEntry.creatorId !== currentUser?.uid) {
      toast({ title: "Permission Denied", description: "You can only edit your own log entries.", variant: "destructive" });
      return;
    }
    setEditingLogEntry(logEntry);
    setEditedLogText(logEntry.entry);
    setIsEditLogDialogOpen(true);
  };

  const handleSaveEditedLog = () => {
    if (!editingLogEntry || !editedLogText.trim()) {
      toast({ title: "Error", description: "Log content cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSimulatingAction(true);
    setDisplayedActivityLogs(prevLogs =>
      prevLogs.map(log =>
        log.id === editingLogEntry.id ? { ...log, entry: editedLogText, timestamp: new Date().toISOString() } : log
      )
    );
    setIsEditLogDialogOpen(false);
    setEditingLogEntry(null);
    toast({ title: "Log Entry Updated (Simulated)" });
    setIsSimulatingAction(false);
  };

  const handleOpenDeleteConfirmDialog = (logId: string, creatorId?: string) => {
    if (creatorId !== currentUser?.uid) {
      toast({ title: "Permission Denied", description: "You can only delete your own log entries.", variant: "destructive" });
      return;
    }
    setLogToDeleteId(logId);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteLog = () => {
    if (!logToDeleteId) return;
    setIsSimulatingAction(true);
    setDisplayedActivityLogs(prevLogs => prevLogs.filter(log => log.id !== logToDeleteId));
    setIsDeleteConfirmOpen(false);
    setLogToDeleteId(null);
    toast({ title: "Log Entry Deleted (Simulated)" });
    setIsSimulatingAction(false);
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
            <Activity className="mr-1.5 h-4 w-4" /> Activity Log/Notes (Simulated)
          </h3>
          <Textarea
            value={newActivityLogText}
            onChange={(e) => setNewActivityLogText(e.target.value)}
            placeholder="Log internal notes or manual activity related to this vendor..."
            className="w-full p-2 border rounded-md min-h-[80px] bg-background"
            disabled={isSimulatingAction || !currentUser}
          />
          <Button onClick={handleAddActivityLog} disabled={isSimulatingAction || !newActivityLogText.trim() || !currentUser} className="mt-2" size="sm">
            {isSimulatingAction && !editingLogEntry && !logToDeleteId ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Add Log Entry
          </Button>
          <ScrollArea className="h-[200px] border rounded-md p-3 bg-background mt-3">
            {displayedActivityLogs.length > 0 ? (
              <ul className="space-y-3">
                {displayedActivityLogs.map((log) => (
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
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(log)} title="Edit Log" disabled={isSimulatingAction}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteConfirmDialog(log.id, log.creatorId)} title="Delete Log" disabled={isSimulatingAction}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No activity logged for this vendor in this session.</p>
            )}
          </ScrollArea>
           <div className="mt-3 p-2 border-l-4 border-accent bg-accent/10 rounded-r-md text-xs">
            <div className="flex items-center">
                <Info className="h-4 w-4 text-accent mr-1.5 shrink-0" />
                <h4 className="font-semibold text-accent">Prototype Note</h4>
            </div>
            <p className="text-accent/80 mt-0.5">
              Activity logs for vendor entities are simulated and not persistently stored in the database for this prototype. Edits and deletes are also client-side for this session.
            </p>
          </div>
        </div>
      </CardContent>

      {/* Edit Log Dialog */}
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
              disabled={isSimulatingAction}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditLogDialogOpen(false)} disabled={isSimulatingAction}>Cancel</Button>
            <Button onClick={handleSaveEditedLog} disabled={isSimulatingAction || !editedLogText.trim()}>
              {isSimulatingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Log Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this log entry? This action cannot be undone for this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLogToDeleteId(null)} disabled={isSimulatingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteLog} disabled={isSimulatingAction} className="bg-destructive hover:bg-destructive/90">
              {isSimulatingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Card>
  );
}
    