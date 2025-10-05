import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileUploadProps {
  avatarUrl: string | null;
  fullName: string;
  email: string;
  onUploadComplete: (url: string) => void;
}

const ProfileUpload = ({ avatarUrl, fullName, email, onUploadComplete }: ProfileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      
      // Security: File validation
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a PNG, JPG, or WEBP image.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large. Image must be smaller than 5MB.');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
        throw new Error('Invalid file extension. Allowed: png, jpg, jpeg, webp');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUploadComplete(data.publicUrl);
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="w-24 h-24">
        <AvatarImage src={avatarUrl || ""} />
        <AvatarFallback className="text-lg">
          {fullName ? fullName.charAt(0).toUpperCase() : 
           email ? email.charAt(0).toUpperCase() : 'U'}
        </AvatarFallback>
      </Avatar>
      
      <label htmlFor="avatar-upload">
        <Button 
          variant="outline" 
          className="w-full cursor-pointer"
          disabled={uploading}
          asChild
        >
          <span>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </>
            )}
          </span>
        </Button>
      </label>
      
      <input
        id="avatar-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground text-center">
        Upload a profile picture (PNG, JPG, WEBP - Max 5MB)
      </p>
    </div>
  );
};

export default ProfileUpload;