
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, ListChecks, Globe } from 'lucide-react'; // Added Globe icon

const AdminConsolePage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6 p-4 md:p-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center">
              <Settings className="mr-2 h-6 w-6 text-primary" />
              Admin Console
            </CardTitle>
            <CardDescription>Select an administrative task to perform.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/configure-enrollment" passHref legacyBehavior>
              <a className="block">
                <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
                  <CardHeader className="flex flex-row items-center space-x-3 pb-2 pt-4">
                    <ListChecks className="h-8 w-8 text-accent" />
                    <div>
                      <CardTitle className="text-lg">Configure Enrollment Form</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Add, remove, or reorder custom fields on the provider enrollment form.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent></CardContent> {/* Empty content for consistent card height styling */}
                </Card>
              </a>
            </Link>
            <Link href="/admin/manage-users" passHref legacyBehavior>
              <a className="block">
                <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
                  <CardHeader className="flex flex-row items-center space-x-3 pb-2 pt-4">
                    <Users className="h-8 w-8 text-accent" />
                    <div>
                      <CardTitle className="text-lg">Manage PHA Users</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Add, edit, or delete Public Health Agency user accounts and manage roles.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent></CardContent> {/* Empty content for consistent card height styling */}
                </Card>
              </a>
            </Link>
            <Link href="/admin/configure-jurisdiction" passHref legacyBehavior>
              <a className="block">
                <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
                  <CardHeader className="flex flex-row items-center space-x-3 pb-2 pt-4">
                    <Globe className="h-8 w-8 text-accent" />
                    <div>
                      <CardTitle className="text-lg">Configure PHA Jurisdiction</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Set the state for your PHA and manage jurisdiction-specific settings.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent></CardContent> {/* Empty content for consistent card height styling */}
                </Card>
              </a>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminConsolePage;

