import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "trader";
  created_at: string;
}

const emptyForm = { username: "", email: "", full_name: "", phone: "", password: "", role: "trader" as "trader" | "admin" };

const MembersManager = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try { setMembers(await api.get<Member[]>("/api/admin/users")); }
    catch (e: any) { toast({ variant: "destructive", title: "Failed to load members", description: e.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ username: m.username, email: m.email || "", full_name: m.full_name || "", phone: m.phone || "", password: "", role: m.role });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.username.trim() || (!editing && !form.password)) {
      toast({ variant: "destructive", title: "Username and password required" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const payload: any = { username: form.username, email: form.email, full_name: form.full_name, phone: form.phone, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/api/admin/users/${editing.id}`, payload);
        toast({ title: "Member updated" });
      } else {
        await api.post("/api/admin/users", form);
        toast({ title: "Member created" });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e.message });
    } finally { setSaving(false); }
  };

  const remove = async (m: Member) => {
    try { await api.del(`/api/admin/users/${m.id}`); toast({ title: "Member deleted" }); load(); }
    catch (e: any) { toast({ variant: "destructive", title: "Delete failed", description: e.message }); }
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Members</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-to-r from-primary to-primary-glow">
              <Plus className="h-4 w-4 mr-1" />Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Member" : "Add Member"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2"><Label>Username *</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Full Name</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>{editing ? "New Password (leave blank to keep)" : "Password *"}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "trader" | "admin" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trader">Trader</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No members yet.</div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{m.username} {m.full_name && <span className="text-muted-foreground font-normal">· {m.full_name}</span>}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.email || "no email"}{m.phone ? ` · ${m.phone}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.role === "admin" ? "default" : "secondary"}>{m.role}</Badge>
                  <Button variant="outline" size="icon" onClick={() => openEdit(m)}><Edit className="h-4 w-4" /></Button>
                  {m.id !== "admin" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete member?</AlertDialogTitle>
                          <AlertDialogDescription>This will also delete all of {m.username}'s trades. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(m)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MembersManager;
