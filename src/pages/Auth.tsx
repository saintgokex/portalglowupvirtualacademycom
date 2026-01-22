import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, loading, signIn, signUp, hasRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user) {
    // Redirect based on role
    if (hasRole('superadmin')) {
      return <Navigate to="/admin" replace />;
    }
    if (hasRole('student')) {
      return <Navigate to="/student" replace />;
    }
    if (hasRole('teacher')) {
      return <Navigate to="/dashboard" replace />;
    }
    // User exists but has no role - this shouldn't happen with the new flow
    // but handle gracefully by showing a message
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Account Setup Incomplete</CardTitle>
            <CardDescription>
              Your account exists but role assignment failed. Please contact an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => supabase.auth.signOut()} 
              variant="outline" 
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully');
    }
    
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, create the auth user
      const { error: signUpError } = await signUp(signupEmail, signupPassword, signupName);
      
      if (signUpError) {
        toast.error(signUpError.message);
        setIsSubmitting(false);
        return;
      }

      // Get the newly created user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Failed to get user session');
        setIsSubmitting(false);
        return;
      }

      // Call edge function to set up user role
      const { error: roleError } = await supabase.functions.invoke('setup-user-role', {
        body: {
          userId: session.user.id,
          role: selectedRole,
          displayName: signupName
        }
      });

      if (roleError) {
        console.error('Role setup error:', roleError);
        toast.error('Account created but role setup failed. Please contact support.');
      } else {
        toast.success(`Account created successfully as ${selectedRole}!`);
        // Force a page reload to refresh auth state with new role
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error('An error occurred during signup');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to GlowUp Academy</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                {/* Role Selection */}
                <div className="space-y-3">
                  <Label>I am a...</Label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as 'student' | 'teacher')}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="student"
                        id="role-student"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="role-student"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <BookOpen className="mb-2 h-6 w-6" />
                        <span className="text-sm font-medium">Student</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="teacher"
                        id="role-teacher"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="role-teacher"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Users className="mb-2 h-6 w-6" />
                        <span className="text-sm font-medium">Teacher</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}