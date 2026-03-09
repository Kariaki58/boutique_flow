
"use client";

import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string[];
  onUpload: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  className?: string;
}

export function ImageUploader({
  value = [],
  onUpload,
  maxImages = 5,
  folder = 'boutique_flow',
  className,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, folder }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? 'Upload failed');
          resolve(json.url);
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const remaining = maxImages - value.length;
      if (remaining <= 0) return;

      const toUpload = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .slice(0, remaining);

      if (toUpload.length === 0) return;

      setIsUploading(true);
      try {
        const urls = await Promise.all(toUpload.map(uploadFile));
        onUpload([...value, ...urls]);
      } catch (err) {
        console.error('[ImageUploader]', err);
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [value, maxImages, folder, onUpload]
  );

  const removeImage = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onUpload(next);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(i)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone (only shown if not maxed out) */}
      {value.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-8 cursor-pointer transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5',
            isUploading && 'pointer-events-none opacity-60'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={maxImages > 1}
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm font-medium">Uploading...</p>
            </>
          ) : (
            <>
              {value.length === 0 ? (
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-3" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              )}
              <p className="text-sm font-medium">
                {value.length === 0 ? 'Drop images here or click to upload' : 'Add more images'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {maxImages - value.length} slot{maxImages - value.length === 1 ? '' : 's'} remaining
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
