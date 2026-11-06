import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'shelter' | 'vet';
  profilePicture?: string;
  bio?: string;
  contactNumber?: string;
  badges?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  sendOTP: (
    email: string,
    username: string,
    password: string
  ) => Promise<void>;
  verifyOTP: (
    email: string,
    username: string,
    password: string,
    otp: string
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isShelter: boolean;
  isVet: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('pawtopia_user');

    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        sessionStorage.removeItem('pawtopia_user');
      }
    }

    return null;
  });

  
  // =========================
  // SESSION EXPIRATION
  // =========================
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener(
      'pawtopia:session-expired',
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        'pawtopia:session-expired',
        handleSessionExpired
      );
    };
  }, []);


  // =========================
  // LOGIN
  // =========================
  const login = async (email: string, password: string) => {
    const response = await fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.detail ||
        'Login failed'
      );
    }

    sessionStorage.setItem('access_token', data.access);
    sessionStorage.setItem('refresh_token', data.refresh);

    const userData: User = {
      id: String(data.user.id),
      email: data.user.email,
      username: data.user.username,
      role: data.user.role,
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
      bio: 'Animal lover and conservation enthusiast',
      contactNumber: '',
      badges: [],
    };

    setUser(userData);
    sessionStorage.setItem('pawtopia_user', JSON.stringify(userData));
  };

  // =========================
  // SEND OTP
  // =========================
  const sendOTP = async (
    email: string,
    username: string,
    password: string
  ) => {
    const response = await fetch(
      'http://127.0.0.1:8000/api/send-otp/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.detail ||
        data?.email?.[0] ||
        'Failed to send OTP'
      );
    }
  };

  // =========================
  // VERIFY OTP
  // =========================
  const verifyOTP = async (
    email: string,
    username: string,
    password: string,
    otp: string
  ) => {
    const response = await fetch(
      'http://127.0.0.1:8000/api/verify-otp/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          otp,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.detail ||
        'Invalid OTP or registration failed'
      );
    }

    if (!data?.access || !data?.refresh || !data?.user) {
      throw new Error(
        'Account created, but automatic login failed. Please login manually.'
      );
    }

    /*
     * Your backend may return the newly-created user.
     * If it does, use that information.
     *
     * Otherwise use the information entered during signup.
     */
    const returnedUser = data?.user;

    const userData: User = {
      id: String(
        returnedUser?.id ??
        data?.id ??
        username
      ),
      email: returnedUser?.email ?? data?.email ?? email,
      username: returnedUser?.username ?? data?.username ?? username,
      role: returnedUser?.role ?? 'user',
      profilePicture:
        returnedUser?.profilePicture ??
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      bio: 'Animal lover and conservation enthusiast',
      contactNumber: '',
      badges: [],
    };

    setUser(userData);

    sessionStorage.setItem(
      'pawtopia_user',
      JSON.stringify(userData)
    );

    /*
     * If your backend returns JWT tokens after OTP verification,
     * save them.
     */
    sessionStorage.setItem('access_token', data.access);
    sessionStorage.setItem('refresh_token', data.refresh);
  };

  // =========================
  // OLD SIGNUP FUNCTION
  // =========================
  /*
   * Keep this function so other existing pages in your project
   * don't break.
   *
   * The NEW Signup page should use sendOTP() and verifyOTP()
   * instead of this function.
   */
  const signup = async (
    email: string,
    password: string,
    username: string
  ) => {
    const response = await fetch(
      'http://127.0.0.1:8000/api/register/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message =
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        data?.detail ||
        data?.error ||
        'Registration failed';

      throw new Error(message);
    }

    const userData: User = {
      id: String(data.id ?? data.username),
      email: data.email,
      username: data.username,
      role: 'user',
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      bio: 'Animal lover and conservation enthusiast',
      contactNumber: '',
      badges: [],
    };

    setUser(userData);

    sessionStorage.setItem(
      'pawtopia_user',
      JSON.stringify(userData)
    );
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    setUser(null);

    sessionStorage.removeItem('pawtopia_user');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  };

  // =========================
  // UPDATE PROFILE
  // =========================
  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = {
        ...user,
        ...data,
      };

      setUser(updatedUser);

      sessionStorage.setItem(
        'pawtopia_user',
        JSON.stringify(updatedUser)
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        sendOTP,
        verifyOTP,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isShelter: user?.role === 'shelter',
        isVet: user?.role === 'vet',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};