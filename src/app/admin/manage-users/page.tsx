"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ManageUsersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Manage SyntraCore PHA Users
        </h1>
        <Button variant="outline" asChild>
          <Link href="/"> {/* Or link back to /admin if that's preferred */}
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User Management & RBAC</CardTitle>
          <CardDescription>
            This section will allow administrators to add, edit, and delete PHA user accounts,
            as well as manage their roles and permissions within SyntraCore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-6 p-8 border-2 border-dashed border-muted rounded-lg text-center bg-muted/30">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              User Management Interface Coming Soon
            </p>
            <p className="text-sm text-muted-foreground">
              You will be able to manage users and their roles here. This feature is under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
