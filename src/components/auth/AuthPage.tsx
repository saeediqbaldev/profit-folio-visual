import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogIn, UserPlus, TrendingUp, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || formData.username.length < 3) {
      toast({
        variant: "destructive",
        title: "Invalid username",
        description: "Username must be at least 3 characters long.",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({
        variant: "destructive",
        title: "Invalid username",
        description: "Username can only contain letters, numbers, and underscores.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle();

      if (existingProfile) {
        toast({
          variant: "destructive",
          title: "Username taken",
          description: "This username is already in use. Please choose another.",
        });
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
            username: formData.username,
            full_name: formData.fullName || "",
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            variant: "destructive",
            title: "Email already registered",
            description: "This email is already in use. Please sign in or use a different email.",
          });
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create profile with username
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email: formData.email,
            username: formData.username,
            full_name: formData.fullName || "",
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        onAuthSuccess();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let email = formData.email;

      // Check if input is a username (no @ symbol)
      if (!formData.email.includes('@')) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', formData.email)
          .maybeSingle();

        if (!profileData) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: "Invalid username or password.",
          });
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
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: "Invalid email/username or password.",
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        if (formData.rememberMe) {
          localStorage.setItem('sb-remember-me', 'true');
        }

        toast({
          title: "Welcome back!",
          description: "Successfully signed into your trading journal.",
        });
        onAuthSuccess();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Password reset failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link. Please check your inbox.",
        });
        setResetDialogOpen(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
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
          <p className="text-muted-foreground mt-2">
            Track your trades, improve your strategy
          </p>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
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
                      <Label htmlFor="remember-me" className="text-sm font-medium">
                        Remember me
                      </Label>
                    </div>
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="link"
                          className="text-sm text-primary p-0 h-auto"
                        >
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
                          <Button
                            type="submit"
                            disabled={resetLoading}
                            className="w-full bg-gradient-to-r from-primary to-primary-glow"
                          >
                            {resetLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending...
                              </div>
                            ) : (
                              "Send Reset Link"
                            )}
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
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">Full Name (Optional)</Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
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
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      className="h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Sign Up
                      </div>
                    )}
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
