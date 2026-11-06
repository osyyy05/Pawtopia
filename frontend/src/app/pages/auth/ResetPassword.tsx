
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export default function ResetPassword() {
  const { uid, token } = useParams<{
    uid: string;
    token: string;
  }>();

  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strongPassword = Object.values(requirements).every(Boolean);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    const nextErrors: typeof errors = {};

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (!strongPassword) {
      nextErrors.password = 'Password does not meet all requirements';
      setPasswordTouched(true);
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm password is required';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (!uid || !token) {
      nextErrors.general = 'Invalid password reset link';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/reset-password/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid,
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          general:
            data?.error ||
            data?.detail ||
            'Unable to reset password',
        });
        return;
      }

      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch {
      setErrors({
        general: 'Unable to connect to the server. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10 ' +
    '!ring-0 !ring-offset-0 !outline-none ' +
    'focus-visible:!ring-0 focus-visible:!ring-offset-0 ' +
    '[&::-ms-reveal]:hidden [&::-ms-clear]:hidden';

  const errorText = (message?: string) =>
    message ? (
      <p role="alert" className="flex items-start gap-1.5 text-red-400 text-xs mt-1">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{message}</span>
      </p>
    ) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-cyan-900">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1920')] opacity-10 bg-cover bg-center" />

      <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-xl border-white/20">
        <CardHeader className="space-y-1 text-center">
          <LockKeyhole className="w-12 h-12 mx-auto mb-4 text-cyan-400" />

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>

          <CardDescription className="text-gray-300">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                New Password
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      password: undefined,
                      confirmPassword: undefined,
                    }));

                    if (!e.target.value) {
                      setPasswordTouched(false);
                    }
                  }}
                  onBlur={() => {
                    if (password) setPasswordTouched(true);
                  }}
                  className={inputClass}
                />

                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>

              {password.length > 0 && (
                <div className="text-xs space-y-1 pt-1">
                  {(
                    [
                      ['length', 'At least 8 characters'],
                      ['uppercase', 'One uppercase letter'],
                      ['lowercase', 'One lowercase letter'],
                      ['number', 'One number'],
                      ['special', 'One special character'],
                    ] as const
                  ).map(([key, label]) => (
                    <p
                      key={key}
                      className={
                        requirements[key]
                          ? 'text-green-400'
                          : passwordTouched
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }
                    >
                      {requirements[key] ? '✓' : '○'} {label}
                    </p>
                  ))}
                </div>
              )}

              {!password && errorText(errors.password)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200">
                Confirm Password
              </Label>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConfirmPassword(value);
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword:
                        value && value !== password
                          ? 'Passwords do not match'
                          : undefined,
                    }));
                  }}
                  className={inputClass}
                />

                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>

              {errorText(
                errors.confirmPassword ||
                  (confirmPassword && confirmPassword !== password
                    ? 'Passwords do not match'
                    : undefined)
              )}
            </div>

            {errorText(errors.general)}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
