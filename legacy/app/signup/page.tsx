'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Lock, User, Building2, AlertCircle, Hotel, Loader2, Sparkles, Ticket } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationMode, setOrganizationMode] = useState<'create' | 'join'>('create');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('hotel');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }

      if (!name) {
        setError('Please enter your name');
        setIsSubmitting(false);
        return;
      }

      if (organizationMode === 'create' && !organizationName) {
        setError('Please enter an organization name');
        setIsSubmitting(false);
        return;
      }

      if (organizationMode === 'join' && !inviteCode) {
        setError('Please enter an invite code');
        setIsSubmitting(false);
        return;
      }

      const userCredential = await signUpWithEmail(email, password);
      const firebaseUser = userCredential.user;

      const requestBody: any = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name,
        isNewOrg: organizationMode === 'create',
      };

      if (organizationMode === 'create') {
        requestBody.organizationName = organizationName;
        requestBody.organizationType = organizationType;
      } else {
        requestBody.inviteCode = inviteCode;
      }

      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create account');
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      console.error('Signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-background overflow-y-auto">
      <div className="w-full max-w-md my-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">HospitalityAI</h1>
          </div>
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Training
          </Badge>
        </div>

          <Card className="border-border shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold">
                Create Your Account
              </CardTitle>
              <CardDescription>Start training your team with AI-powered scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="john@hotel.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat your password"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Organization Mode Selection */}
                <div className="space-y-3">
                  <Label>Organization</Label>
                  <RadioGroup value={organizationMode} onValueChange={(value) => setOrganizationMode(value as 'create' | 'join')}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="create" id="create" />
                      <Label htmlFor="create" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Create New Organization</div>
                        <div className="text-sm text-muted-foreground">Start a new team</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="join" id="join" />
                      <Label htmlFor="join" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Join Existing Organization</div>
                        <div className="text-sm text-muted-foreground">Use an invite code</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Create Organization Fields */}
                {organizationMode === 'create' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="organizationName"
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          required
                          placeholder="Grand Hotel"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizationType">Organization Type</Label>
                      <Select value={organizationType} onValueChange={setOrganizationType}>
                        <SelectTrigger id="organizationType">
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hotel">Hotel</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="resort">Resort</SelectItem>
                          <SelectItem value="spa">Spa</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Join Organization Fields */}
                {organizationMode === 'join' && (
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="inviteCode"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        required
                        placeholder="ABC123"
                        className="pl-10 font-mono tracking-wider"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-character code provided by your organization
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <Separator className="my-6" />
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-semibold">
                  Sign In
                </Link>
              </p>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
