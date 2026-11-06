import {
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router';

import { useAuth } from '../../context/AuthContext';

import { Button } from '../ui/button';

import {
  LayoutDashboard,
  PawPrint,
  Heart,
  FileText,
  Calendar,
  BarChart2,
  User,
  LogOut,
  Menu,
  HandHeart,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';

import NotificationBell from '../NotificationBell';
import PawtopiaLogoIcon from '../PawtopiaLogoIcon';


// =========================================================
// NAVIGATION
// =========================================================

const navigation = [
  {
    name: 'Dashboard',
    href: '/shelter/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Shelter Animals',
    href: '/shelter/animals',
    icon: PawPrint,
  },
  {
    name: 'Adoption Listings',
    href: '/shelter/listings',
    icon: Heart,
  },
  {
    name: 'Adoption Applications',
    href: '/shelter/applications',
    icon: FileText,
    hasBadge: true,
  },
  {
    name: 'Appointments',
    href: '/shelter/appointments',
    icon: Calendar,
  },
  {
    name: 'Donations',
    href: '/shelter/donations',
    icon: HandHeart,
  },
  {
    name: 'Statistics',
    href: '/shelter/statistics',
    icon: BarChart2,
  },
  {
    name: 'Profile',
    href: '/shelter/profile',
    icon: User,
  },
];


export default function ShelterLayout() {

  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();


  // =========================================================
  // MOBILE MENU
  // =========================================================

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);


  // =========================================================
  // PENDING ADOPTION APPLICATION COUNT
  // =========================================================

  const [applicationCount, setApplicationCount] =
    useState(0);


  // =========================================================
  // FETCH PENDING APPLICATIONS
  // =========================================================

  const fetchApplicationCount = async () => {

    try {

      const token =
        sessionStorage.getItem(
          'access_token'
        );


      if (!token) {

        setApplicationCount(0);

        return;

      }


      const response =
        await fetch(
          'http://127.0.0.1:8000/api/adoptions/shelter/applications/',
          {
            headers: {
              Authorization:
                `Bearer ${token}`,

              Accept:
                'application/json',
            },
          }
        );


      if (!response.ok) {

        console.error(
          'Failed to load shelter applications:',
          response.status
        );

        return;

      }


      const data =
        await response.json();


      // Support:
      // [ applications ]
      //
      // or:
      // { results: [ applications ] }

      const applications =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];


      // -----------------------------------------------------
      // COUNT ONLY PENDING APPLICATIONS
      // -----------------------------------------------------

      const pendingCount =
        applications.filter(
          (application: any) =>
            String(
              application.status || ''
            ).toUpperCase() ===
            'PENDING'
        ).length;


      setApplicationCount(
        pendingCount
      );


    } catch (error) {

      console.error(
        'Error loading shelter application count:',
        error
      );

    }

  };


  // =========================================================
  // LOAD COUNT + AUTO REFRESH
  // =========================================================

  useEffect(() => {

    fetchApplicationCount();


    const interval =
      setInterval(
        fetchApplicationCount,
        5000
      );


    return () =>
      clearInterval(interval);

  }, []);


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

      {navigation.map(
        (item) => {

          const Icon =
            item.icon;


          const isActive =
            location.pathname ===
            item.href;


          return (

            <Link
              key={
                item.name
              }
              to={
                item.href
              }
              onClick={() =>
                setMobileMenuOpen(
                  false
                )
              }
              className={`
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-lg
                transition-all
                ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }
              `}
            >

              {/* ICON */}

              <Icon
                className="
                  w-5
                  h-5
                  shrink-0
                "
              />


              {/* NAME */}

              <span>
                {
                  item.name
                }
              </span>


              {/* RED PENDING COUNT */}

              {item.hasBadge &&
                applicationCount >
                  0 && (

                  <span
                    className="
                      ml-auto
                      min-w-[20px]
                      h-5
                      px-1.5
                      rounded-full
                      bg-red-500
                      text-white
                      text-[10px]
                      font-bold
                      flex
                      items-center
                      justify-center
                      leading-none
                    "
                  >
                    {
                      applicationCount
                    }
                  </span>

                )}

            </Link>

          );

        }
      )}

    </>

  );


  return (

    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-gray-900
        via-purple-900
        to-indigo-900
      "
    >

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside
        className="
          hidden
          lg:fixed
          lg:inset-y-0
          lg:flex
          lg:w-64
          lg:flex-col
        "
      >

        <div
          className="
            flex
            flex-col
            flex-1
            min-h-0
            bg-black/40
            backdrop-blur-xl
            border-r
            border-white/10
          "
        >

          {/* LOGO */}

          <div
            className="
              flex
              items-center
              justify-center
              h-20
              px-4
              border-b
              border-white/10
            "
          >

            <div
              className="
                text-center
              "
            >

              <PawtopiaLogoIcon
                size="lg"
                className="mx-auto"
              />


              <div
                className="
                  text-xl
                  font-bold
                  bg-gradient-to-r
                  from-purple-400
                  to-cyan-400
                  bg-clip-text
                  text-transparent
                "
              >
                Shelter Portal
              </div>

            </div>

          </div>


          {/* NAVIGATION */}

          <div
            className="
              flex-1
              flex
              flex-col
              overflow-y-auto
              p-4
              space-y-2
            "
          >
            <NavLinks />
          </div>

        </div>

      </aside>


      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <div
        className="
          lg:hidden
          fixed
          top-0
          left-0
          right-0
          z-40
          bg-black/40
          backdrop-blur-xl
          border-b
          border-white/10
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            h-16
            px-4
          "
        >

          {/* MOBILE LOGO */}

          <Link
            to="/shelter/dashboard"
            className="
              flex
              items-center
              gap-2
            "
          >

            <span
              className="
                text-2xl
              "
            >
              🏠
            </span>


            <span
              className="
                text-xl
                font-bold
                bg-gradient-to-r
                from-purple-400
                to-cyan-400
                bg-clip-text
                text-transparent
              "
            >
              Shelter
            </span>

          </Link>


          {/* RIGHT CONTROLS */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            {/* NOTIFICATION BELL */}

            <NotificationBell />


            {/* MENU */}

            <Sheet
              open={
                mobileMenuOpen
              }
              onOpenChange={
                setMobileMenuOpen
              }
            >

              <SheetTrigger
                asChild
              >

                <Button
                  variant="ghost"
                  size="icon"
                  className="
                    text-white
                  "
                >

                  <Menu
                    className="
                      w-6
                      h-6
                    "
                  />

                </Button>

              </SheetTrigger>


              <SheetContent
                side="right"
                className="
                  w-64
                  bg-black/95
                  backdrop-blur-xl
                  border-white/10
                  p-0
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    h-full
                  "
                >

                  {/* MOBILE PROFILE */}

                  <div
                    className="
                      p-4
                      border-b
                      border-white/10
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                        p-3
                        bg-white/5
                        rounded-lg
                      "
                    >

                      <img
                        src={
                          user?.profilePicture
                        }
                        alt={
                          user?.username
                        }
                        className="
                          w-10
                          h-10
                          rounded-full
                        "
                      />


                      <div
                        className="
                          flex-1
                          min-w-0
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-medium
                            text-white
                            truncate
                          "
                        >
                          {
                            user?.username
                          }
                        </p>


                        <p
                          className="
                            text-xs
                            text-cyan-400
                          "
                        >
                          Shelter Organiser
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* MOBILE NAVIGATION */}

                  <div
                    className="
                      flex-1
                      overflow-y-auto
                      p-4
                      space-y-2
                    "
                  >
                    <NavLinks />
                  </div>


                  {/* LOGOUT */}

                  <div
                    className="
                      p-4
                      border-t
                      border-white/10
                    "
                  >

                    <Button
                      onClick={
                        handleLogout
                      }
                      variant="outline"
                      className="
                        w-full
                        bg-transparent
                        border-red-500/30
                        text-red-400
                        hover:bg-red-500/10
                        hover:text-red-300
                      "
                    >

                      <LogOut
                        className="
                          w-4
                          h-4
                          mr-2
                        "
                      />

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

      <main
        className="
          lg:pl-64
          pt-16
          lg:pt-0
        "
      >

        {/* =================================================
            DESKTOP TOP BAR
        ================================================= */}

        <div
          className="
            hidden
            lg:flex
            justify-end
            items-center
            h-20
            px-6
            border-b
            border-white/10
            bg-black/20
            backdrop-blur-xl
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            {/* NOTIFICATION */}

            <NotificationBell />


            {/* PROFILE */}

            <div
              className="
                relative
                group
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                  cursor-pointer
                  px-3
                  py-2
                  rounded-lg
                  hover:bg-white/5
                "
              >

                <img
                  src={
                    user?.profilePicture
                  }
                  alt={
                    user?.username
                  }
                  className="
                    w-10
                    h-10
                    rounded-full
                    border
                    border-white/20
                  "
                />


                <div
                  className="
                    text-left
                  "
                >

                  <p
                    className="
                      text-sm
                      font-medium
                      text-white
                    "
                  >
                    {
                      user?.username
                    }
                  </p>


                  <p
                    className="
                      text-xs
                      text-gray-400
                    "
                  >
                    {
                      user?.email
                    }
                  </p>

                </div>

              </div>


              {/* PROFILE DROPDOWN */}

              <div
                className="
                  absolute
                  right-0
                  mt-2
                  w-48
                  bg-black/80
                  backdrop-blur-xl
                  border
                  border-white/20
                  rounded-lg
                  opacity-0
                  invisible
                  group-hover:opacity-100
                  group-hover:visible
                  transition-all
                  z-50
                "
              >

                <Link
                  to="/shelter/profile"
                  className="
                    block
                    px-4
                    py-3
                    text-sm
                    text-white
                    hover:bg-white/10
                  "
                >
                  Edit Profile
                </Link>


                <button
                  onClick={
                    handleLogout
                  }
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    text-sm
                    text-red-400
                    hover:bg-red-500/10
                  "
                >
                  Logout
                </button>

              </div>

            </div>

          </div>

        </div>


        <Outlet />

      </main>

    </div>

  );
}