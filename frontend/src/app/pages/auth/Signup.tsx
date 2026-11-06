
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
import PawtopiaLogoIcon from '../../components/PawtopiaLogoIcon';

type FieldName = 'username' | 'email' | 'password' | 'confirmPassword';
type FormErrors = Partial<Record<FieldName, string>>;

const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [otpError, setOtpError] = useState('');

  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  // PASSWORD REQUIREMENTS
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strongPassword = Object.values(passwordRequirements).every(Boolean);

  // VALIDATION
  const getFieldError = (
    field: FieldName,
    values = { username, email, password, confirmPassword }
  ): string | undefined => {
    switch (field) {
      case 'username':
        return values.username.trim()
          ? undefined
          : 'Username is required';

      case 'email':
        if (!values.email.trim()) return 'Email is required';
        return gmailRegex.test(values.email.trim())
          ? undefined
          : 'Enter a valid Gmail address (example@gmail.com)';

      case 'password': {
        if (!values.password) return 'Password is required';

        const p = values.password;
        const valid =
          p.length >= 8 &&
          /[A-Z]/.test(p) &&
          /[a-z]/.test(p) &&
          /[0-9]/.test(p) &&
          /[^A-Za-z0-9]/.test(p);

        return valid
          ? undefined
          : 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character';
      }

      case 'confirmPassword':
        if (!values.confirmPassword) {
          return 'Confirm password is required';
        }
        return values.confirmPassword === values.password
          ? undefined
          : 'Passwords do not match';
    }
  };

  const updateField = (field: FieldName, value: string) => {
    const values = {
      username,
      email,
      password,
      confirmPassword,
      [field]: value,
    };

    if (field === 'username') setUsername(value);
    if (field === 'email') setEmail(value);

    if (field === 'password') {
      setPassword(value);
      setShowPasswordRequirements(value.length > 0);

      // Reset validation when password is completely cleared
      if (value.length === 0) {
        setPasswordTouched(false);
      }
    }

    if (field === 'confirmPassword') setConfirmPassword(value);

    setErrors((previous) => ({
      ...previous,
      [field]: submitted ? getFieldError(field, values) : undefined,
      ...(field === 'password' && submitted
        ? {
            confirmPassword: getFieldError('confirmPassword', values),
          }
        : {}),
    }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    (
      ['username', 'email', 'password', 'confirmPassword'] as FieldName[]
    ).forEach((field) => {
      const message = getFieldError(field);
      if (message) nextErrors[field] = message;
    });

    setSubmitted(true);
    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // SEND OTP
  const handleSendOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading || !validateForm()) return;

    setLoading(true);

    try {
      await sendOTP(email.trim(), username.trim(), password);
      setOtpSent(true);
      setOtpError('');
      toast.success(`OTP sent to ${email.trim()}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to send OTP';

      if (
        /email/i.test(message) &&
        /already|exists|registered|in use/i.test(message)
      ) {
        setErrors((prev) => ({
          ...prev,
          email: 'Email is already registered',
        }));
      } else if (
        /username/i.test(message) &&
        /already|exists|registered|in use/i.test(message)
      ) {
        setErrors((prev) => ({
          ...prev,
          username: 'Username is already taken',
        }));
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    if (!otp.trim()) {
      setOtpError('Verification code is required');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setOtpError('');
    setLoading(true);

    try {
      await verifyOTP(email.trim(), username.trim(), password, otp.trim());
      toast.success('Email verified! Account created successfully!');
      navigate('/user/home');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Invalid OTP';

      if (/expired|expire|timeout|timed out/i.test(message)) {
        setOtpError('OTP has expired. Please request a new OTP.');
      } else if (
        /invalid|incorrect|wrong|mismatch|not found/i.test(message)
      ) {
        setOtpError('Invalid OTP. Please check the code and try again.');
      } else {
        setOtpError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setOtpSent(false);
    setOtp('');
    setOtpError('');
  };

  const fieldClass = (field: FieldName) =>
    `bg-white/10 text-white placeholder:text-gray-400
    focus-visible:ring-0 focus-visible:ring-offset-0
    focus-visible:outline-none
    ${
      errors[field]
        ? 'border-red-500 focus-visible:border-red-500'
        : 'border-white/20 focus-visible:border-white/20'
    }`;

  const errorMessage = (message?: string) =>
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
          <PawtopiaLogoIcon
            size="lg"
            className="mx-auto mb-4 !w-30 !h-20 translate-y-5"
          />

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Join Pawtopia
          </CardTitle>

          <CardDescription className="text-gray-300">
            {otpSent
              ? `Enter the verification code sent to ${email}`
              : 'Create your account to get started'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!otpSent ? (
            <form
              onSubmit={handleSendOTP}
              noValidate
              className="space-y-4"
            >
              {/* USERNAME */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-200">
                  Username
                </Label>

                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => updateField('username', e.target.value)}
                  aria-invalid={!!errors.username}
                  className={fieldClass('username')}
                />
                {errorMessage(errors.username)}
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => updateField('email', e.target.value)}
                  aria-invalid={!!errors.email}
                  className={fieldClass('email')}
                />
                {errorMessage(errors.email)}
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => updateField('password', e.target.value)}
                    onBlur={() => {
                      if (password.length > 0) {
                        setPasswordTouched(true);
                      }
                    }}
                    className={`${fieldClass('password')} pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
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

                {showPasswordRequirements && (
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
                          passwordRequirements[key]
                            ? 'text-green-400'
                            : passwordTouched
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }
                      >
                        {passwordRequirements[key] ? '✓' : '○'} {label}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-200">
                  Confirm Password
                </Label>

                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) =>
                      updateField('confirmPassword', e.target.value)
                    }
                    aria-invalid={
                      !!errors.confirmPassword ||
                      (!!confirmPassword && confirmPassword !== password)
                    }
                    className={`${fieldClass('confirmPassword')} pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-500'
                        : ''
                    }`}
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

                {errorMessage(
                  errors.confirmPassword ||
                    (confirmPassword && confirmPassword !== password
                      ? 'Passwords do not match'
                      : undefined)
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            /* OTP SCREEN */
            <form
              onSubmit={handleVerifyOTP}
              noValidate
              className="space-y-5"
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-cyan-400" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-300 text-sm">
                  We've sent a 6-digit verification code to
                </p>
                <p className="text-cyan-400 font-medium mt-1">
                  {email}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-200">
                  Verification Code
                </Label>

                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setOtpError('');
                  }}
                  aria-invalid={!!otpError}
                  className={`bg-white/10 text-white placeholder:text-gray-400 text-center text-2xl tracking-[0.5em] ${
                    otpError ? 'border-red-500' : 'border-white/20'
                  }`}
                />

                {errorMessage(otpError)}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="w-full text-gray-300 hover:text-white hover:bg-white/10"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </form>
          )}

          {!otpSent && (
            <div className="mt-6 text-center text-sm text-gray-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Log In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
