"use client";

import * as React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, XCircle } from "lucide-react";
import { Button } from './ui/button';

interface FileUploaderProps {
  onFileSelect: (file: File | null, fileContent: string | null) => void;
  acceptedFileTypes?: string; // e.g., ".xml,.json,.txt"
  label?: string;
}

export function FileUploader({ 
  onFileSelect, 
  acceptedFileTypes = ".xml,.json,.txt,application/json,text/xml,text/plain",
  label = "Upload CCD/FHIR Document" 
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!acceptedFileTypes.split(',').some(type => file.type.includes(type.trim()) || file.name.endsWith(type.trim()))) {
        setError(`Invalid file type. Please upload one of: ${acceptedFileTypes}`);
        setSelectedFile(null);
        onFileSelect(null, null);
        return;
      }
      setError(null);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileSelect(file, text);
      };
      reader.onerror = () => {
        setError("Failed to read file content.");
        onFileSelect(file, null); // Pass file but null content on error
      }
      reader.readAsText(file);
    } else {
      setSelectedFile(null);
      onFileSelect(null, null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload" className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          className="hidden"
        />
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full justify-start text-left">
          <UploadCloud className="mr-2 h-4 w-4" />
          {selectedFile ? selectedFile.name : "Choose file..."}
        </Button>
        {selectedFile && (
            <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} aria-label="Remove file">
                <XCircle className="h-5 w-5 text-destructive" />
            </Button>
        )}
      </div>
      {selectedFile && (
        <div className="text-xs text-muted-foreground p-2 border border-dashed rounded-md flex items-center">
          <FileText className="h-4 w-4 mr-2 shrink-0" />
          <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive flex items-center">
            <XCircle className="h-4 w-4 mr-1 shrink-0" />
            {error}
        </p>
      )}
    </div>
  );
}
