
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, Globe, Activity, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { ActivityLogEntry } from '@/types'; // Assuming ActivityLogEntry is defined
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface EhrVendorProfileDetailsTabProps {
  vendorValue: string;
  vendorLabel: string | null;
}

export function EhrVendorProfileDetailsTab({ vendorValue, vendorLabel }: EhrVendorProfileDetailsTabProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [newActivityLog, setNewActivityLog] = useState('');
  const [displayedActivityLogs, setDisplayedActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);

  // Placeholder website - ideally this would come from a richer data source
  const vendorWebsite = vendorValue === 'epic' ? 'https://www.epic.com/' : 'Not Available';

  const handleAddActivityLog = () => {
    if (!newActivityLog.trim() || !currentUser) {
      toast({ title: 'Error', description: 'Log content is empty or user not logged in.', variant: 'destructive' });
      return;
    }
    setIsSimulatingAction(true);
    const newLog: ActivityLogEntry = {
      timestamp: new Date().toISOString(),
      entry: newActivityLog,
      type: 'UserAction',
      user: currentUser.displayName || currentUser.email || 'PHA Admin',
    };
    setDisplayedActivityLogs(prev => [newLog, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setNewActivityLog('');
    toast({
      title: 'Activity Log Added (Simulated)',
      description: `Your note for ${vendorLabel || 'this vendor'} has been added to the local history for this session.`,
    });
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
            value={newActivityLog}
            onChange={(e) => setNewActivityLog(e.target.value)}
            placeholder="Log internal notes or manual activity related to this vendor..."
            className="w-full p-2 border rounded-md min-h-[80px] bg-background"
            disabled={isSimulatingAction || !currentUser}
          />
          <Button onClick={handleAddActivityLog} disabled={isSimulatingAction || !newActivityLog.trim() || !currentUser} className="mt-2" size="sm">
            {isSimulatingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Add Log Entry
          </Button>
          <ScrollArea className="h-[200px] border rounded-md p-3 bg-background mt-3">
            {displayedActivityLogs.length > 0 ? (
              <ul className="space-y-3">
                {displayedActivityLogs.map((log, index) => (
                  <li key={log.timestamp + index} className="text-sm p-2 rounded-md bg-muted/50 shadow-sm">
                    <span className="font-medium text-primary">
                      {format(parseISO(log.timestamp), 'PPp')} ({log.type})
                      {log.user && ` - ${log.user}`}:
                    </span>{' '}
                    <p className="whitespace-pre-wrap mt-0.5">{log.entry}</p>
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
              Activity logs for vendor entities are simulated and not persistently stored in the database for this prototype.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
