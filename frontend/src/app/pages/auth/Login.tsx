
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import PawtopiaLogoIcon from '../../components/PawtopiaLogoIcon';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [attempted, setAttempted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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
  // LOGIN
  // =====================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setAttempted(true);
    setLoginError('');

    const emailValidation = validateEmail(email);
    const passwordValidation = !password.trim()
      ? 'Password is required'
      : '';

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    if (emailValidation || passwordValidation) return;

    setLoading(true);

    try {
      await login(email.trim(), password);

      toast.success('Login successful!');

      const savedUser = JSON.parse(
        sessionStorage.getItem('pawtopia_user') || '{}'
      );

      switch (savedUser.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;

        case 'shelter':
          navigate('/shelter/dashboard');
          break;

        case 'vet':
          navigate('/vet/dashboard');
          break;

        default:
          navigate('/user/home');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '';

      if (/not registered/i.test(message)) {
        setEmailError('This email is not registered');
        setLoginError('');
      } else if (/invalid password/i.test(message)) {
        setLoginError('Invalid password');
        setEmailError('');
      } else {
        setLoginError('Unable to login. Please try again.');
      }
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
            Welcome to Pawtopia
          </CardTitle>

          <CardDescription className="text-gray-300">
            Log In to access your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">
                Email
              </Label>

              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Email Address"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  setLoginError('');

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

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Password
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);
                    setLoginError('');

                    if (attempted) {
                      setPasswordError(
                        !value.trim() ? 'Password is required' : ''
                      );
                    } else {
                      setPasswordError('');
                    }
                  }}
                  aria-invalid={!!passwordError || !!loginError}
                  className={`${inputClass(
                    !!passwordError || !!loginError
                  )} pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>

              {errorMessage(passwordError)}
              {errorMessage(loginError)}
            </div>

            {/* FORGOT PASSWORD */}
            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Forgot password?
              </Link>
            </div>

            {/* LOGIN BUTTON */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-300">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
