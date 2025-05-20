
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Info, Send, Activity, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext'; // To get current PHA user for sender info
import type { MessageEntry, ActivityLogEntry } from '@/types'; // Assuming types are defined
import { format, parseISO } from 'date-fns';

interface EhrVendorCommunicationTabProps {
  vendorValue: string; // e.g., "epic"
  vendorLabel: string | null;
}

export function EhrVendorCommunicationTab({ vendorValue, vendorLabel }: EhrVendorCommunicationTabProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [newMessageContent, setNewMessageContent] = useState('');
  const [newActivityLog, setNewActivityLog] = useState('');
  const [displayedMessages, setDisplayedMessages] = useState<MessageEntry[]>([]);
  const [displayedActivityLogs, setDisplayedActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);

  const handleSendMessage = () => {
    if (!newMessageContent.trim() || !currentUser) {
      toast({ title: 'Error', description: 'Message content is empty or user not logged in.', variant: 'destructive' });
      return;
    }
    setIsSimulatingAction(true);
    const newMessage: MessageEntry = {
      id: `sim_msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || 'PHA User',
      senderRole: 'PHA',
      content: newMessageContent,
    };
    setDisplayedMessages(prev => [newMessage, ...prev]); // Add to top for most recent
    setNewMessageContent('');
    toast({
      title: 'Message "Sent" (Simulated)',
      description: `Your message to ${vendorLabel || 'this vendor'} has been added to the local history. This is a prototype feature; messages are not persistently stored for vendor entities.`,
    });
    setIsSimulatingAction(false);
  };

  const handleAddActivityLog = () => {
    if (!newActivityLog.trim() || !currentUser) {
      toast({ title: 'Error', description: 'Log content is empty or user not logged in.', variant: 'destructive' });
      return;
    }
    setIsSimulatingAction(true);
    const newLog: ActivityLogEntry = {
      timestamp: new Date().toISOString(),
      entry: newActivityLog,
      type: 'UserAction', // Or a new type like 'VendorNote'
      user: currentUser.displayName || currentUser.email || 'PHA Admin',
    };
    setDisplayedActivityLogs(prev => [newLog, ...prev]); // Add to top
    setNewActivityLog('');
    toast({
      title: 'Activity Log Added (Simulated)',
      description: `Your note for ${vendorLabel || 'this vendor'} has been added to the local history. This is a prototype feature; logs are not persistently stored for vendor entities.`,
    });
    setIsSimulatingAction(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <MessageSquare className="mr-2 h-5 w-5 text-primary" />
          Communication with {vendorLabel || vendorValue}
        </CardTitle>
        <CardDescription>
          Send messages and log internal notes related to this vendor. (Simulated for prototype)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Send Message Section */}
        <div>
          <h3 className="font-semibold mb-2">Send Message to Vendor</h3>
          <Textarea
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            placeholder={`Type message to ${vendorLabel || 'this vendor'}...`}
            className="w-full p-2 border rounded-md min-h-[100px]"
            disabled={isSimulatingAction || !currentUser}
          />
          <Button onClick={handleSendMessage} disabled={isSimulatingAction || !newMessageContent.trim() || !currentUser} className="mt-2" size="sm">
            {isSimulatingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Send Message
          </Button>
        </div>
        <hr/>
        {/* Message History Section */}
        <div>
          <h3 className="font-semibold mb-2">Message History (Simulated)</h3>
          <ScrollArea className="h-[200px] border rounded-md p-3 bg-muted/30">
            {displayedMessages.length > 0 ? (
              <ul className="space-y-3">
                {displayedMessages.map((msg) => (
                  <li key={msg.id} className={`text-sm p-3 rounded-lg shadow-sm ${msg.senderRole === 'PHA' ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-green-100 mr-auto max-w-[80%]'}`}>
                    <div className="font-semibold text-xs text-gray-600 mb-0.5">
                      {msg.senderName} ({msg.senderRole}) - {format(parseISO(msg.timestamp), 'PPp')}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No messages in local history for this session.</p>
            )}
          </ScrollArea>
        </div>
        <hr/>
        {/* Activity Log Section */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center"><Activity className="mr-2 h-4 w-4 text-muted-foreground"/>Internal Activity Log/Notes for Vendor</h3>
          <Textarea
            value={newActivityLog}
            onChange={(e) => setNewActivityLog(e.target.value)}
            placeholder="Log internal notes or manual activity related to this vendor..."
            className="w-full p-2 border rounded-md min-h-[80px]"
            disabled={isSimulatingAction || !currentUser}
          />
          <Button onClick={handleAddActivityLog} disabled={isSimulatingAction || !newActivityLog.trim() || !currentUser} className="mt-2" size="sm">
            {isSimulatingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Add Log Entry
          </Button>
          <ScrollArea className="h-[150px] border rounded-md p-3 bg-muted/30 mt-3">
            {displayedActivityLogs.length > 0 ? (
              <ul className="space-y-3">
                {displayedActivityLogs.map((log, index) => (
                  <li key={log.timestamp + index} className="text-sm p-2 rounded-md bg-background shadow-sm">
                    <span className="font-medium text-primary">
                      {format(parseISO(log.timestamp), 'PPp')} ({log.type})
                      {log.user && ` - ${log.user}`}:
                    </span>{' '}
                    {log.entry}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No internal logs in local history for this session.</p>
            )}
          </ScrollArea>
        </div>

         <div className="mt-4 p-3 border-l-4 border-accent bg-accent/10 rounded-r-md">
            <div className="flex items-center">
                <Info className="h-5 w-5 text-accent mr-2" />
                <h4 className="font-semibold text-accent">Prototype Note</h4>
            </div>
            <p className="text-sm text-accent/80 mt-1">
              The communication features on this tab (sending messages, adding logs) are simulated for the prototype. Data entered here is not persistently stored for the vendor entity in the database.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}

