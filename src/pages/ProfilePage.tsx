import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Save, Target, Plus, X, Share2, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStrategies } from "@/hooks/useStrategies";
import { api } from "@/lib/api";
import ProfileUpload from "@/components/profile/ProfileUpload";
import ResourceUsage from "@/components/profile/ResourceUsage";
import CandleLoader from "@/components/ui/candle-loader";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  phone: string | null;
  share_enabled: boolean;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { strategies, addStrategy, removeStrategy, maxStrategies } = useStrategies();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", email: "", phone: "", username: "" });
  const [newStrategy, setNewStrategy] = useState("");
  const [addingStrategy, setAddingStrategy] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadProfile(); /* eslint-disable-next-line */ }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get<Profile>("/api/profile");
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          username: data.username || "",
        });
        setShareEnabled(!!data.share_enabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/profile", formData);
      toast({ title: "Profile updated" });
      loadProfile();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error updating profile", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    try {
      await api.put("/api/profile", { avatar_url: url });
      loadProfile();
    } catch (e) {
      toast({ variant: "destructive", title: "Error updating picture" });
    }
  };

  const handleAddStrategy = async () => {
    if (!newStrategy.trim()) return;
    setAddingStrategy(true);
    const ok = await addStrategy(newStrategy);
    if (ok) setNewStrategy("");
    setAddingStrategy(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4"><CandleLoader /><span className="text-muted-foreground">Loading profile...</span></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-card border-border/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile Picture</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <ProfileUpload avatarUrl={profile?.avatar_url || null} fullName={formData.full_name} email={formData.email} onUploadComplete={handleAvatarUpload} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-card border-border/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name</Label>
                  <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Full name" /></div>
                <div className="space-y-2"><Label>Username</Label>
                  <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Username" /></div>
                <div className="space-y-2"><Label>Email Address</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" /></div>
                <div className="space-y-2"><Label>Phone Number</Label>
                  <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" /></div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-primary-glow">
                  <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Trading Strategies</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Manage your trading strategies (max {maxStrategies}).</p>
            <div className="flex flex-wrap gap-2">
              {strategies.map((s) => (
                <Badge key={s} variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-2">
                  {s}
                  <button onClick={() => removeStrategy(s)} className="hover:text-destructive" disabled={strategies.length <= 1}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {strategies.length < maxStrategies && (
              <div className="flex gap-2">
                <Input value={newStrategy} onChange={(e) => setNewStrategy(e.target.value)} placeholder="New strategy name"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddStrategy(); } }} />
                <Button onClick={handleAddStrategy} disabled={addingStrategy || !newStrategy.trim()} variant="outline">
                  <Plus className="h-4 w-4 mr-1" />Add
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{strategies.length} of {maxStrategies} used</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" />Public Sharing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Enable public sharing to let others view your trading statistics.</p>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="space-y-1">
                <p className="font-medium">Share my trading progress</p>
                <p className="text-sm text-muted-foreground">Anyone with the link can view your stats</p>
              </div>
              <Switch checked={shareEnabled}
                onCheckedChange={async (checked) => {
                  setShareEnabled(checked);
                  try {
                    await api.put("/api/profile", { share_enabled: checked });
                    toast({ title: checked ? "Sharing enabled" : "Sharing disabled" });
                  } catch {
                    setShareEnabled(!checked);
                    toast({ variant: "destructive", title: "Failed to update sharing" });
                  }
                }} />
            </div>
            {shareEnabled && user && (
              <div className="space-y-2">
                <Label>Your public share link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={`${window.location.origin}/share/${user.id}`} className="font-mono text-sm" />
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/share/${user.id}`);
                    setCopied(true);
                    toast({ title: "Link copied" });
                    setTimeout(() => setCopied(false), 2000);
                  }}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ResourceUsage />
      </div>
    </div>
  );
};

export default ProfilePage;
