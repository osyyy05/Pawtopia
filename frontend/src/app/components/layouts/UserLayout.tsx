import {
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router';

import { useAuth } from '../../context/AuthContext';

import { Button } from '../ui/button';
import PawtopiaLogoIcon from '../PawtopiaLogoIcon';

import {
  Home,
  Book,
  Heart,
  GraduationCap,
  Users,
  Building2,
  DollarSign,
  LogOut,
  Menu,
  Bell,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';


// =========================================================
// NAVIGATION
// =========================================================

const navigation = [
  {
    name: 'Home',
    href: '/user/home',
    icon: Home,
  },
  {
    name: 'Encyclopedia',
    href: '/user/encyclopedia',
    icon: Book,
  },
  {
    name: 'Adoption',
    href: '/user/adoption',
    icon: Heart,
    hasBadge: true,
  },
  {
    name: 'Training',
    href: '/user/training',
    icon: GraduationCap,
  },
  {
    name: 'Community',
    href: '/user/community',
    icon: Users,
  },
  {
    name: 'Vet Clinic',
    href: '/user/vet-clinic',
    icon: Building2,
  },
  {
    name: 'Donation',
    href: '/user/donation',
    icon: DollarSign,
  },
];


export default function UserLayout() {

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();


  // =========================================================
  // MOBILE MENU
  // =========================================================

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);


  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] =
    useState<any[]>([]);

  const [showNotifications, setShowNotifications] =
    useState(false);


  // =========================================================
  // ADOPTION COUNT
  // =========================================================
  //
  // This is the red number beside "Adoption".
  // It comes from the real backend.
  //
  // =========================================================

  const [adoptionCount, setAdoptionCount] =
    useState(0);


  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications = async () => {

    try {

      const token =
        sessionStorage.getItem(
          'access_token'
        );


      if (!token) {
        return;
      }


      const response =
        await fetch(
          'http://127.0.0.1:8000/api/donations/notifications/',
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      if (!response.ok) {
        return;
      }


      const data =
        await response.json();


      setNotifications(
        Array.isArray(data)
          ? data
          : []
      );


    } catch (error) {

      console.error(
        'Error loading notifications:',
        error
      );

    }

  };


  // =========================================================
  // FETCH USER ADOPTION APPLICATIONS
  // =========================================================

  const fetchAdoptionCount = async () => {

    try {

      const token =
        sessionStorage.getItem(
          'access_token'
        );


      if (!token) {

        setAdoptionCount(0);

        return;

      }


      const response =
        await fetch(
          'http://127.0.0.1:8000/api/adoptions/my-applications/',
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
          'Failed to load adoption applications:',
          response.status
        );

        return;

      }


      const data =
        await response.json();


      // Support both:
      // [ ... ]
      //
      // and:
      // { results: [ ... ] }

      const applications =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];


      // -----------------------------------------------------
      // COUNT PENDING APPLICATIONS
      // -----------------------------------------------------

      const pendingCount =
        applications.filter(
          (application: any) =>
            String(
              application.status || ''
            ).toUpperCase() ===
            'PENDING'
        ).length;


      setAdoptionCount(
        pendingCount
      );


    } catch (error) {

      console.error(
        'Error loading adoption applications:',
        error
      );

    }

  };


  // =========================================================
  // LOAD DATA + AUTO REFRESH
  // =========================================================

  useEffect(() => {

    fetchNotifications();

    fetchAdoptionCount();


    const interval =
      setInterval(() => {

        fetchNotifications();

        fetchAdoptionCount();

      }, 5000);


    return () =>
      clearInterval(interval);

  }, []);


  // =========================================================
  // UNREAD NOTIFICATIONS
  // =========================================================

  const unreadNotifications =
    notifications.filter(
      notification =>
        !notification.is_read
    );


  // =========================================================
  // MARK NOTIFICATION AS READ
  // =========================================================

  const handleNotificationClick =
    async (
      notification: any
    ) => {

      try {

        const token =
          sessionStorage.getItem(
            'access_token'
          );


        await fetch(
          `http://127.0.0.1:8000/api/donations/notifications/${notification.id}/read/`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      } catch (error) {

        console.error(
          'Error marking notification as read:',
          error
        );

      }


      setShowNotifications(
        false
      );


      // -----------------------------------------------------
      // COMMUNITY NOTIFICATION
      // -----------------------------------------------------

      if (
        notification.notification_type ===
          'community_like' ||
        notification.notification_type ===
          'community_comment'
      ) {

        navigate(
          `/user/community#post-${notification.post_id}`
        );

      }


      // -----------------------------------------------------
      // REFRESH NOTIFICATIONS
      // -----------------------------------------------------

      fetchNotifications();

    };


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


              {/* ADOPTION RED COUNT */}

              {item.hasBadge &&
                adoptionCount >
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
                      adoptionCount
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
          DESKTOP TOP BAR
      ===================================================== */}

      <div
        className="
          hidden
          lg:flex
          fixed
          top-0
          left-0
          right-0
          h-16
          bg-black/40
          backdrop-blur-xl
          border-b
          border-white/10
          z-50
          items-center
          justify-between
          px-6
        "
      >

        {/* LEFT - PAWTOPIA */}

        <Link
          to="/user/home"
          className="
            flex
            items-center
            gap-2
          "
        >

        <PawtopiaLogoIcon size="lg" />

        <span
          className="
            text-2xl
            font-bold
            bg-gradient-to-r
            from-purple-400
            to-cyan-400
            bg-clip-text
            text-transparent
          "
        >
          Pawtopia
        </span>

        </Link>


        {/* RIGHT - NOTIFICATIONS + PROFILE */}

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div
            className="
              relative
            "
          >

            <button
              type="button"
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
              className="
                relative
                p-2
                rounded-lg
                text-gray-300
                hover:bg-white/5
                hover:text-white
                transition-all
              "
              aria-label="Notifications"
            >

              <Bell
                className="
                  w-5
                  h-5
                "
              />


              {/* RED UNREAD COUNT */}

              {unreadNotifications.length >
                0 && (

                <span
                  className="
                    absolute
                    -top-1
                    -right-1
                    min-w-[18px]
                    h-[18px]
                    px-1
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
                    unreadNotifications.length
                  }
                </span>

              )}

            </button>


            {/* =================================================
                NOTIFICATION DROPDOWN
            ================================================= */}

            {showNotifications && (

              <div
                className="
                  absolute
                  right-0
                  mt-2
                  w-80
                  bg-gray-900/95
                  backdrop-blur-xl
                  border
                  border-white/20
                  rounded-xl
                  shadow-xl
                  overflow-hidden
                  z-50
                "
              >

                {/* HEADER */}

                <div
                  className="
                    px-4
                    py-3
                    border-b
                    border-white/10
                  "
                >

                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    Notifications
                  </h3>

                </div>


                {/* LIST */}

                <div
                  className="
                    max-h-80
                    overflow-y-auto
                  "
                >

                  {notifications.length ===
                  0 ? (

                    <div
                      className="
                        px-4
                        py-8
                        text-center
                        text-sm
                        text-gray-400
                      "
                    >
                      No notifications yet.
                    </div>

                  ) : (

                    notifications.map(
                      (
                        notification
                      ) => (

                        <button
                          key={
                            notification.id
                          }
                          type="button"
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          className={`
                            w-full
                            text-left
                            px-4
                            py-3
                            border-b
                            border-white/10
                            hover:bg-white/5
                            transition-all
                            ${
                              !notification.is_read
                                ? 'bg-purple-500/10'
                                : ''
                            }
                          `}
                        >

                          <div
                            className="
                              flex
                              items-start
                              gap-3
                            "
                          >

                            <div
                              className="
                                mt-1
                              "
                            >

                              {
                                notification.notification_type ===
                                'community_like'
                                  ? (
                                    <Heart
                                      className="
                                        w-4
                                        h-4
                                        text-pink-400
                                      "
                                    />
                                  )
                                  : (
                                    <Users
                                      className="
                                        w-4
                                        h-4
                                        text-cyan-400
                                      "
                                    />
                                  )
                              }

                            </div>


                            <div
                              className="
                                flex-1
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
                                  notification.title
                                }
                              </p>


                              <p
                                className="
                                  text-xs
                                  text-gray-400
                                  mt-1
                                "
                              >
                                {
                                  notification.message
                                }
                              </p>


                              <p
                                className="
                                  text-[10px]
                                  text-gray-500
                                  mt-1
                                "
                              >
                                {
                                  new Date(
                                    notification.created_at
                                  ).toLocaleString()
                                }
                              </p>

                            </div>


                            {!notification.is_read && (

                              <span
                                className="
                                  w-2
                                  h-2
                                  rounded-full
                                  bg-cyan-400
                                  mt-2
                                "
                              />

                            )}

                          </div>

                        </button>

                      )

                    )

                  )}

                </div>

              </div>

            )}

          </div>


          {/* =================================================
              PROFILE
          ================================================= */}

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
                  w-9
                  h-9
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
                bg-white/10
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
                to="/user/profile"
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
          pt-16
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
            to="/user/home"
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
              🐾
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
              Pawtopia
            </span>

          </Link>


          {/* MOBILE CONTROLS */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            {/* MOBILE NOTIFICATION BELL */}

            <div
              className="
                relative
              "
            >

              <button
                type="button"
                onClick={() =>
                  setShowNotifications(
                    !showNotifications
                  )
                }
                className="
                  relative
                  p-2
                  rounded-lg
                  text-gray-300
                  hover:bg-white/5
                  hover:text-white
                  transition-all
                "
                aria-label="Notifications"
              >

                <Bell
                  className="
                    w-5
                    h-5
                  "
                />


                {unreadNotifications.length >
                  0 && (

                  <span
                    className="
                      absolute
                      -top-1
                      -right-1
                      min-w-[18px]
                      h-[18px]
                      px-1
                      rounded-full
                      bg-red-500
                      text-white
                      text-[10px]
                      font-bold
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {
                      unreadNotifications.length
                    }
                  </span>

                )}

              </button>


              {/* MOBILE NOTIFICATION DROPDOWN */}

              {showNotifications && (

                <div
                  className="
                    absolute
                    right-0
                    mt-2
                    w-80
                    max-w-[calc(100vw-2rem)]
                    bg-gray-900/95
                    backdrop-blur-xl
                    border
                    border-white/20
                    rounded-xl
                    shadow-xl
                    overflow-hidden
                    z-50
                  "
                >

                  <div
                    className="
                      px-4
                      py-3
                      border-b
                      border-white/10
                    "
                  >

                    <h3
                      className="
                        text-sm
                        font-semibold
                        text-white
                      "
                    >
                      Notifications
                    </h3>

                  </div>


                  <div
                    className="
                      max-h-80
                      overflow-y-auto
                    "
                  >

                    {notifications.length ===
                    0 ? (

                      <div
                        className="
                          px-4
                          py-8
                          text-center
                          text-sm
                          text-gray-400
                        "
                      >
                        No notifications yet.
                      </div>

                    ) : (

                      notifications.map(
                        (
                          notification
                        ) => (

                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                            className={`
                              w-full
                              text-left
                              px-4
                              py-3
                              border-b
                              border-white/10
                              hover:bg-white/5
                              ${
                                !notification.is_read
                                  ? 'bg-purple-500/10'
                                  : ''
                              }
                            `}
                          >

                            <div
                              className="
                                flex
                                items-start
                                gap-3
                              "
                            >

                              <div
                                className="
                                  mt-1
                                "
                              >

                                {
                                  notification.notification_type ===
                                  'community_like'
                                    ? (
                                      <Heart
                                        className="
                                          w-4
                                          h-4
                                          text-pink-400
                                        "
                                      />
                                    )
                                    : (
                                      <Users
                                        className="
                                          w-4
                                          h-4
                                          text-cyan-400
                                        "
                                      />
                                    )
                                }

                              </div>


                              <div
                                className="
                                  flex-1
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
                                    notification.title
                                  }
                                </p>


                                <p
                                  className="
                                    text-xs
                                    text-gray-400
                                    mt-1
                                  "
                                >
                                  {
                                    notification.message
                                  }
                                </p>


                                <p
                                  className="
                                    text-[10px]
                                    text-gray-500
                                    mt-1
                                  "
                                >
                                  {
                                    new Date(
                                      notification.created_at
                                    ).toLocaleString()
                                  }
                                </p>

                              </div>


                              {!notification.is_read && (

                                <span
                                  className="
                                    w-2
                                    h-2
                                    rounded-full
                                    bg-cyan-400
                                    mt-2
                                  "
                                />

                              )}

                            </div>

                          </button>

                        )

                      )

                    )}

                  </div>

                </div>

              )}

            </div>


            {/* MOBILE MENU */}

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
                            text-gray-400
                            truncate
                          "
                        >
                          {
                            user?.email
                          }
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


                  {/* MOBILE LOGOUT */}

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
        "
      >

        <Outlet />

      </main>

    </div>

  );

}