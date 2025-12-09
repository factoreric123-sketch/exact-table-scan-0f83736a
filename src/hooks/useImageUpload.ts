import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface UploadImageParams {
  file: File;
  bucket: "dish-images" | "hero-images";
  path: string;
}

interface UseImageUploadReturn {
  mutate: (params: UploadImageParams) => void;
  mutateAsync: (params: UploadImageParams) => Promise<string>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  progress: number;
  isUploading: boolean;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ file, bucket, path }: UploadImageParams): Promise<string> => {
      setIsUploading(true);
      setProgress(0);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = path || fileName;

      // Simulate progress for UX (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      try {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        clearInterval(progressInterval);

        if (uploadError) {
          setProgress(0);
          throw uploadError;
        }

        setProgress(100);

        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        return data.publicUrl;
      } catch (error) {
        clearInterval(progressInterval);
        setProgress(0);
        throw error;
      } finally {
        // Reset after a short delay to allow UI to show completion
        setTimeout(() => {
          setIsUploading(false);
          setProgress(0);
        }, 500);
      }
    },
    onError: (error) => {
      logger.error("Error uploading image:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(errorMessage);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    progress,
    isUploading,
  };
};
