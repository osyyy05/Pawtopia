
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { toast } from 'sonner';
import {
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

const CHANNEL_NAME = 'pawtopia-password-reset';

type ResetMessage =
  | {
      type: 'RESET_REQUEST';
      uid: string;
      token: string;
      sender: string;
    }
  | {
      type: 'RESET_ACK';
      sender: string;
      target: string;
    };

export default function ForgotPassword() {
  const [searchParams, setSearchParams] = useSearchParams();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const isResetMode = Boolean(uid && token);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [attempted, setAttempted] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [resetError, setResetError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [handoffComplete, setHandoffComplete] = useState(false);

  const tabId = useRef(
    Math.random().toString(36).slice(2)
  );

  const channelRef = useRef<BroadcastChannel | null>(null);

  // =====================================
  // TAB COMMUNICATION
  // =====================================

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ResetMessage>) => {
      const message = event.data;

      if (message.type === 'RESET_REQUEST') {
        // Only an existing Forgot Password tab
        // without a reset token should receive it.
        if (window.location.search.includes('token=')) return;

        channel.postMessage({
          type: 'RESET_ACK',
          sender: tabId.current,
          target: message.sender,
        } satisfies ResetMessage);

        setSearchParams({
          uid: message.uid,
          token: message.token,
        });

        setResetSuccess(false);
        setHandoffComplete(false);

        window.focus();
      }

      if (
        message.type === 'RESET_ACK' &&
        message.target === tabId.current
      ) {
        setHandoffComplete(true);

        // Browsers may block closing tabs opened by Gmail.
        window.close();
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [setSearchParams]);

  useEffect(() => {
    if (!uid || !token) return;

    const channel = channelRef.current;

    if (!channel) return;

    const message: ResetMessage = {
      type: 'RESET_REQUEST',
      uid,
      token,
      sender: tabId.current,
    };

    // Give other Pawtopia tabs time to respond.
    channel.postMessage(message);
  }, [uid, token]);

  // =====================================
  // EMAIL VALIDATION
  // =====================================

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return 'Email is required';
    }

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(value.trim())) {
      return 'Enter a valid Gmail address (example@gmail.com)';
    }

    return '';
  };

  // =====================================
  // SEND RESET LINK
  // =====================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setAttempted(true);

    const error = validateEmail(email);

    if (error) {
      setEmailError(error);
      return;
    }

    setEmailError('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/forgot-password/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.error ||
          data?.detail ||
          data?.email?.[0] ||
          'Failed to send password reset email';

        if (
          /not registered|not found|does not exist|no account|unknown email/i.test(
            message
          )
        ) {
          setEmailError('This email is not registered');
        } else {
          setEmailError(message);
        }

        return;
      }

      setSubmitted(true);
      toast.success('Password reset email sent successfully!');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // PASSWORD REQUIREMENTS
  // =====================================

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strongPassword = Object.values(requirements).every(Boolean);

  // =====================================
  // RESET PASSWORD
  // =====================================

  const handleResetPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    setResetError('');
    setConfirmError('');

    if (!password) {
      setResetError('Password is required');
      return;
    }

    if (!strongPassword) {
      setPasswordTouched(true);
      return;
    }

    if (!confirmPassword) {
      setConfirmError('Confirm password is required');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    if (!uid || !token) {
      setResetError('Invalid password reset link');
      return;
    }

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
        setResetError(
          data?.error ||
          data?.detail ||
          'Unable to reset password'
        );
        return;
      }

      setResetSuccess(true);
      toast.success('Password reset successfully!');
    } catch {
      setResetError(
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // INPUT STYLING
  // =====================================

  const inputClass = (hasError: boolean) =>
    `bg-white/10 text-white placeholder:text-gray-400
    !ring-0 !ring-offset-0 !outline-none
    focus-visible:!ring-0 focus-visible:!ring-offset-0
    ${
      hasError
        ? '!border-red-500 focus-visible:!border-red-500'
        : '!border-white/20 focus-visible:!border-white/20'
    }`;

  const errorMessage = (message: string) =>
    message ? (
      <p
        role="alert"
        className="flex items-start gap-1.5 text-red-400 text-xs mt-1"
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{message}</span>
      </p>
    ) : null;

  // =====================================
  // UI
  // =====================================

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-cyan-900">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1920')] opacity-10 bg-cover bg-center" />

      <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-xl border-white/20">
        <CardHeader className="space-y-1 text-center">
          <div className="text-4xl mb-4">🔒</div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {isResetMode ? 'Reset Password' : 'Forgot Password'}
          </CardTitle>

          <CardDescription className="text-gray-300">
            {isResetMode
              ? resetSuccess
                ? 'Your password has been reset successfully'
                : 'Enter your new password'
              : submitted
              ? 'Check your email for reset instructions'
              : 'Enter your email to reset your password'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {handoffComplete ? (
            <div className="text-center space-y-4">
              <p className="text-gray-300">
                Reset Password has opened in your original Pawtopia tab.
              </p>
              <p className="text-sm text-gray-400">
                You can close this tab and return to Pawtopia.
              </p>
            </div>
          ) : isResetMode ? (
            resetSuccess ? (
              <div className="text-center space-y-4">
                <p className="text-green-400 font-medium">
                  Password reset successfully!
                </p>
                <p className="text-sm text-gray-300">
                  You can now log in using your new password.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleResetPassword}
                noValidate
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="newPassword"
                    className="text-gray-200"
                  >
                    New Password
                  </Label>

                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setResetError('');

                        if (!e.target.value) {
                          setPasswordTouched(false);
                        }
                      }}
                      onBlur={() => {
                        if (password) setPasswordTouched(true);
                      }}
                      className={`${inputClass(!!resetError)} pr-10`}
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
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

                  {errorMessage(resetError)}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-gray-200"
                  >
                    Confirm Password
                  </Label>

                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={
                        showConfirmPassword ? 'text' : 'password'
                      }
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmError('');
                      }}
                      className={`${inputClass(!!confirmError)} pr-10`}
                    />

                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
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

                  {errorMessage(confirmError)}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )
          ) : !submitted ? (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-200"
                >
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);

                    if (attempted) {
                      setEmailError(validateEmail(value));
                    } else {
                      setEmailError('');
                    }
                  }}
                  aria-invalid={!!emailError}
                  className={inputClass(!!emailError)}
                />

                {errorMessage(emailError)}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-300">
                We've sent password reset instructions to{' '}
                <span className="text-cyan-400 font-medium">
                  {email}
                </span>
              </p>

              <p className="text-sm text-gray-400">
                Please check your inbox and follow the instructions
                to reset your password.
              </p>
            </div>
          )}

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
