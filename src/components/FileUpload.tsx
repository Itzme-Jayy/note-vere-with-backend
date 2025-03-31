
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteFile } from "@/types";
import { uploadFile } from "@/services/api";
import { Progress } from "@/components/ui/progress";
import { FileIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadProps {
  files: NoteFile[];
  setFiles: React.Dispatch<React.SetStateAction<NoteFile[]>>;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Check file type (allow only PDF for this example)
        if (file.type !== 'application/pdf') {
          toast({
            title: "Invalid file type",
            description: "Only PDF files are allowed",
            variant: "destructive",
          });
          continue;
        }
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Maximum file size is 10MB",
            variant: "destructive",
          });
          continue;
        }
        
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + Math.random() * 10;
            return newProgress >= 100 ? 100 : newProgress;
          });
        }, 200);
        
        // Upload file
        const uploadedFile = await uploadFile(file);
        
        clearInterval(interval);
        setUploadProgress(100);
        
        // Add to files list
        setFiles(prevFiles => [...prevFiles, uploadedFile]);
        
        toast({
          title: "File uploaded",
          description: `${file.name} was uploaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };

  return (
    <div className="space-y-4">
      <div className="file-drop-area flex flex-col items-center justify-center text-center">
        <FileIcon className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Upload PDF Files</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop your files here or click to browse
        </p>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          multiple
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Select Files
        </Button>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} max={100} />
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          <ul className="space-y-2">
            {files.map(file => (
              <li key={file.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
