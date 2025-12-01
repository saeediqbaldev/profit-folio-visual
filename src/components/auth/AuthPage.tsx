import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogIn, UserPlus, TrendingUp, KeyRound, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    phone: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { toast } = useToast();

  // Real-time username availability check
  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username || formData.username.length < 3) {
        setUsernameStatus('idle');
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setUsernameStatus('idle');
        return;
      }

      setUsernameStatus('checking');

      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username.toLowerCase())
        .maybeSingle();

      setUsernameStatus(data ? 'taken' : 'available');
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [formData.username]);

  // Password validation
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 6) errors.push("At least 6 characters");
    if (password.length > 10) errors.push("Maximum 10 characters");
    if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("At least 1 lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("At least 1 number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("At least 1 special character");
    return errors;
  };

  useEffect(() => {
    if (formData.password) {
      setPasswordErrors(validatePassword(formData.password));
    } else {
      setPasswordErrors([]);
    }
  }, [formData.password]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (!formData.fullName.trim()) {
      toast({ variant: "destructive", title: "Full name is required" });
      return;
    }

    if (!formData.username || formData.username.length < 3) {
      toast({ variant: "destructive", title: "Username must be at least 3 characters" });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({ variant: "destructive", title: "Username can only contain letters, numbers, and underscores" });
      return;
    }

    if (usernameStatus === 'taken') {
      toast({ variant: "destructive", title: "Username is already taken" });
      return;
    }

    if (!formData.email.trim()) {
      toast({ variant: "destructive", title: "Email is required" });
      return;
    }

    if (!formData.phone.trim()) {
      toast({ variant: "destructive", title: "Phone number is required" });
      return;
    }

    if (passwordErrors.length > 0) {
      toast({ variant: "destructive", title: "Password does not meet requirements" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      // Check for duplicate phone
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('phone')
        .eq('phone', formData.phone)
        .maybeSingle();

      if (existingPhone) {
        toast({ variant: "destructive", title: "Phone number already registered" });
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: formData.username.toLowerCase(),
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({ variant: "destructive", title: "Email already registered" });
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email: formData.email,
            username: formData.username.toLowerCase(),
            full_name: formData.fullName,
            phone: formData.phone,
          });

        if (profileError) console.error('Profile creation error:', profileError);

        toast({ title: "Account created!", description: "Please check your email to verify your account." });
        onAuthSuccess();
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let email = formData.email;

      if (!formData.email.includes('@')) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', formData.email.toLowerCase())
          .maybeSingle();

        if (!profileData) {
          toast({ variant: "destructive", title: "Invalid username or password" });
          setLoading(false);
          return;
        }
        email = profileData.email || '';
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.password,
      });

      if (error) {
        toast({ variant: "destructive", title: "Invalid email/username or password" });
        setLoading(false);
        return;
      }

      if (data.user) {
        if (formData.rememberMe) localStorage.setItem('sb-remember-me', 'true');
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        onAuthSuccess();
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign in failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) {
        toast({ variant: "destructive", title: "Password reset failed", description: error.message });
      } else {
        toast({ title: "Check your email", description: "We've sent you a password reset link." });
        setResetDialogOpen(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary to-primary-glow rounded-xl shadow-elegant">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Trading Journal
          </h1>
          <p className="text-muted-foreground mt-2">Track your trades, improve your strategy</p>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email or Username</Label>
                    <Input
                      id="signin-email"
                      type="text"
                      placeholder="Enter your email or username"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                      />
                      <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
                    </div>
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="link" className="text-sm text-primary p-0 h-auto">
                          Forgot password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5" />
                            Reset Password
                          </DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="Enter your email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" disabled={resetLoading} className="w-full bg-gradient-to-r from-primary to-primary-glow">
                            {resetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {resetLoading ? "Sending..." : "Send Reset Link"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">Full Name *</Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username *</Label>
                    <div className="relative">
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Choose a unique username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        className="h-11 pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {usernameStatus === 'available' && <CheckCircle className="h-4 w-4 text-success" />}
                        {usernameStatus === 'taken' && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                    </div>
                    {usernameStatus === 'available' && <p className="text-xs text-success">Username is available!</p>}
                    {usernameStatus === 'taken' && <p className="text-xs text-destructive">Username is already taken</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number *</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-11"
                    />
                    {formData.password && (
                      <div className="text-xs space-y-1 mt-2">
                        {['At least 6 characters', 'Maximum 10 characters', 'At least 1 uppercase letter', 'At least 1 lowercase letter', 'At least 1 number', 'At least 1 special character'].map((rule) => (
                          <div key={rule} className={`flex items-center gap-1 ${passwordErrors.includes(rule) ? 'text-destructive' : 'text-success'}`}>
                            {passwordErrors.includes(rule) ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            {rule}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password *</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="h-11"
                    />
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || usernameStatus === 'taken' || passwordErrors.length > 0}
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
