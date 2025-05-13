"use client";

import React, { useState } from 'react';
import type { DocumentEntry, EnrollmentData } from '@/types';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/file-uploader';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Trash2, UploadCloud, Eye, Download, Printer, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DocumentsTabProps {
  enrollment: EnrollmentData;
}

export function DocumentsTab({ enrollment }: DocumentsTabProps) {
  const { addDocumentToEnrollment, deleteDocumentFromEnrollment, isLoading: isAppContextLoading } = useAppContext();
  const { toast } = useToast();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [viewDocumentUrl, setViewDocumentUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File | null, _fileContent: string | null) => {
    setFileToUpload(file);
  };

  const handleUploadDocument = async () => {
    if (!fileToUpload) {
      toast({ title: 'No file selected', description: 'Please select a file to upload.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      await addDocumentToEnrollment(enrollment.id, fileToUpload, 'PHA Admin');
      setFileToUpload(null);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    setIsDeleting(documentId);
    try {
      await deleteDocumentFromEnrollment(enrollment.id, documentId);
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewDocument = (doc: DocumentEntry) => {
    if (doc.url) {
      setViewDocumentUrl(doc.url);
    } else {
      toast({ title: "Cannot View Document", description: "No viewable URL for this document.", variant: "destructive" });
    }
  };

  const handleDownloadDocument = (doc: DocumentEntry) => {
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.target = '_blank';
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download Started", description: `${doc.name} should begin downloading.` });
    } else {
      toast({ title: "Cannot Download", description: "No downloadable URL for this document.", variant: "destructive" });
    }
  };

  const handlePrintDocument = (doc: DocumentEntry) => {
    if (doc.url) {
      const printWindow = window.open(doc.url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        toast({ title: "Print Error", description: "Could not open document for printing.", variant: "destructive" });
      }
    } else {
      toast({ title: "Cannot Print", description: "No printable URL for this document.", variant: "destructive" });
    }
  };

  const documents = enrollment.documents || [];

  return (
    <div className="space-y-4 mt-2">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Associated Documents</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <FileUploader onFileSelect={handleFileSelect} label="Select document to upload" />
              {fileToUpload && <p className="text-sm mt-2">Selected: {fileToUpload.name}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost" disabled={isUploading}>Cancel</Button></DialogClose>
              <Button onClick={handleUploadDocument} disabled={isUploading || !fileToUpload}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isAppContextLoading && documents.length === 0 && <p>Loading documents...</p>}
      {!isAppContextLoading && documents.length === 0 && <p className="text-muted-foreground">No documents associated with this enrollment.</p>}

      {documents.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size (KB)</TableHead>
              <TableHead>Uploaded On</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium hover:underline cursor-pointer" onClick={() => handleViewDocument(doc)}>{doc.name}</TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell>{(doc.size / 1024).toFixed(2)}</TableCell>
                <TableCell>{doc.uploadDate ? format(parseISO(doc.uploadDate), 'PPp') : 'N/A'}</TableCell>
                <TableCell>{doc.uploadedBy}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleViewDocument(doc)} title="View Document" disabled={!doc.url}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDownloadDocument(doc)} title="Download Document" disabled={!doc.url}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handlePrintDocument(doc)} title="Print Document" disabled={!doc.url}>
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Delete Document" disabled={isDeleting === doc.id}>
                        {isDeleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                      </DialogHeader>
                      <p>Are you sure you want to delete the document "{doc.name}"?</p>
                      <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={() => handleDeleteDocument(doc.id)} disabled={isDeleting === doc.id}>
                          {isDeleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Delete
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

      {viewDocumentUrl && (
        <Dialog open={!!viewDocumentUrl} onOpenChange={() => setViewDocumentUrl(null)}>
          <DialogContent className="max-w-3xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>View Document</DialogTitle>
            </DialogHeader>
            <iframe src={viewDocumentUrl} title="Document Viewer" className="w-full h-full border-0" />
            <DialogFooter>
              <Button onClick={() => setViewDocumentUrl(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
