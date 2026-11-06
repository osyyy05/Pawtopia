
import { Link, Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

import {
  LayoutDashboard,
  Users,
  Book,
  Heart,
  Building2,
  DollarSign,
  Calendar,
  GraduationCap,
  HelpCircle,
  FileText,
  LogOut,
  Menu,
} from 'lucide-react';

import { useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';

import NotificationBell from '../NotificationBell';
import PawtopiaLogoIcon from '../PawtopiaLogoIcon';

// =========================================================
// ADMIN NAVIGATION
// =========================================================

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Encyclopedia',
    href: '/admin/encyclopedia',
    icon: Book,
  },
  {
    name: 'Adoptions',
    href: '/admin/adoptions',
    icon: Heart,
  },
  {
    name: 'Shelters',
    href: '/admin/shelters',
    icon: Building2,
  },
  {
    name: 'Donations',
    href: '/admin/donations',
    icon: DollarSign,
  },
  {
    name: 'Clinics',
    href: '/admin/clinics',
    icon: Calendar,
  },
  {
    name: 'Training',
    href: '/admin/training',
    icon: GraduationCap,
  },
  {
    name: 'Quizzes',
    href: '/admin/quizzes',
    icon: HelpCircle,
  },
  {
    name: 'Community',
    href: '/admin/community',
    icon: FileText,
  },
  {
    name: 'News',
    href: '/admin/news',
    icon: FileText,
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // =========================================================
  // NAVIGATION LINKS
  // =========================================================

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;

        const isActive = location.pathname === item.href;

        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />

            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">

        <div className="flex flex-col flex-1 min-h-0 bg-black/40 backdrop-blur-xl border-r-0">

          {/* =================================================
              LOGO + ADMIN PANEL
          ================================================= */}

          <div className="flex items-center justify-center h-20 px-4 border-b border-white/10">

            <div className="text-center">

              <PawtopiaLogoIcon
                size="lg"
                className="mx-auto"
              />

              <div className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Admin Panel
              </div>

            </div>

          </div>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-2">

            <NavLinks />

          </div>

        </div>

      </aside>

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">

        <div className="flex items-center justify-between h-16 px-4">

          {/* MOBILE LOGO */}

          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2"
          >

            <PawtopiaLogoIcon size="lg" />

            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Admin Panel
            </span>

          </Link>

          {/* MOBILE RIGHT CONTROLS */}

          <div className="flex items-center gap-2">

            {/* NOTIFICATION BELL */}

            <NotificationBell />

            {/* MOBILE MENU */}

            <Sheet
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
            >

              <SheetTrigger asChild>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                >

                  <Menu className="w-6 h-6" />

                </Button>

              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-64 bg-[#15112b] backdrop-blur-xl border-violet-500/20 p-0"
              >

                <div className="flex flex-col h-full">

                  {/* MOBILE PROFILE */}

                  <div className="p-4 border-b border-white/10">

                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">

                      <img
                        src={user?.profilePicture}
                        alt={user?.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-medium text-white truncate">
                          {user?.username}
                        </p>

                        <p className="text-xs text-cyan-400">
                          Administrator
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* MOBILE NAVIGATION */}

                  <div className="flex-1 overflow-y-auto p-4 space-y-2">

                    <NavLinks />

                  </div>

                  {/* MOBILE LOGOUT */}

                  <div className="p-4 border-t border-white/10">

                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >

                      <LogOut className="w-4 h-4 mr-2" />

                      Logout

                    </Button>

                  </div>

                </div>

              </SheetContent>

            </Sheet>

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">

        {/* =================================================
            DESKTOP TOP BAR
        ================================================= */}

        <div className="hidden lg:flex justify-end items-center h-20 px-6 border-b border-white/10 bg-black/20 backdrop-blur-xl">

          <div className="flex items-center gap-3">

            {/* NOTIFICATION BELL */}

            <NotificationBell />

            {/* PROFILE */}

            <div className="relative group">

              <div className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg hover:bg-white/5 transition-all">

                <img
                  src={user?.profilePicture}
                  alt={user?.username}
                  className="w-10 h-10 rounded-full border border-white/20 object-cover"
                />

                <div className="text-left">

                  <p className="text-sm font-medium text-white">
                    {user?.username}
                  </p>

                  <p className="text-xs text-gray-400">
                    {user?.email}
                  </p>

                </div>

              </div>

              {/* PROFILE DROPDOWN */}

              <div className="absolute right-0 mt-2 w-48 bg-[#1d1738]/95 backdrop-blur-xl border border-violet-500/20 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">

                <Link
                  to="/admin/profile"
                  className="block px-4 py-3 text-sm text-white hover:bg-violet-500/15"
                >
                  Edit Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
                >
                  Logout
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <Outlet />

      </main>

    </div>
  );
}
