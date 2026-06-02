import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

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
        throw new Error("You must select an image to upload.");
      }
      const file = event.target.files[0];
      const MAX = 5 * 1024 * 1024;
      const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!ALLOWED.includes(file.type)) throw new Error("Invalid file type.");
      if (file.size > MAX) throw new Error("Image must be smaller than 5MB.");

      const { url } = await api.upload(file);
      onUploadComplete(url);
      toast({ title: "Profile picture updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="w-24 h-24">
        <AvatarImage src={avatarUrl || ""} />
        <AvatarFallback className="text-lg">
          {fullName ? fullName.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : "U"}
        </AvatarFallback>
      </Avatar>
      <label htmlFor="avatar-upload">
        <Button variant="outline" className="w-full cursor-pointer" disabled={uploading} asChild>
          <span>
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Upload Photo</>
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
      <p className="text-xs text-muted-foreground text-center">PNG, JPG, WEBP - Max 5MB</p>
    </div>
  );
};

export default ProfileUpload;
