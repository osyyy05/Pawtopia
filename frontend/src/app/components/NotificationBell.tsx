import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';

import {
  useLocation,
  useNavigate,
} from 'react-router';

import {
  Bell,
  Heart,
  Users,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';


interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type?: string;
  post_id?: number | null;
  donation_id?: number | null;
  is_read: boolean;
  created_at: string;
}


const SHOWN_POPUPS_KEY =
  'pawtopia_shown_notification_popups';


export default function NotificationBell() {

  const navigate = useNavigate();
  const location = useLocation();


  // =========================================================
  // STATE
  // =========================================================

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [popupNotification, setPopupNotification] =
    useState<NotificationItem | null>(null);


  // =========================================================
  // REFS
  // =========================================================

  const popupTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkingPopupRef =
    useRef(false);


  // =========================================================
  // POPUP HISTORY
  // =========================================================

  const getShownPopupIds = (): number[] => {

    try {

      const saved =
        sessionStorage.getItem(
          SHOWN_POPUPS_KEY
        );

      if (!saved) {
        return [];
      }

      const parsed =
        JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch {

      return [];

    }
  };


  const saveShownPopupId = (
    notificationId: number
  ) => {

    const current =
      getShownPopupIds();

    if (
      !current.includes(
        notificationId
      )
    ) {

      current.push(
        notificationId
      );

    }

    sessionStorage.setItem(
      SHOWN_POPUPS_KEY,
      JSON.stringify(
        current.slice(-100)
      )
    );

  };


  // =========================================================
  // SHOW POPUP
  // =========================================================

  const showPopup = (
    notification: NotificationItem
  ) => {

    if (
      popupTimerRef.current
    ) {

      clearTimeout(
        popupTimerRef.current
      );

      popupTimerRef.current =
        null;

    }


    setPopupNotification(
      notification
    );


    // IMPORTANT:
    // 8 seconds starts only when the notification
    // is actually detected by this user's browser.

    popupTimerRef.current =
      setTimeout(() => {

        setPopupNotification(
          null
        );

        popupTimerRef.current =
          null;

      }, 8000);

  };


  // =========================================================
  // CLOSE POPUP
  // =========================================================

  const closePopup = () => {

    if (
      popupTimerRef.current
    ) {

      clearTimeout(
        popupTimerRef.current
      );

      popupTimerRef.current =
        null;

    }

    setPopupNotification(
      null
    );

  };


  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications =
    async () => {

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
              method: 'GET',

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
            'Failed to load notifications:',
            response.status
          );

          return;

        }


        const data =
          await response.json();


        const nextNotifications =
          Array.isArray(data)
            ? data
            : [];


        // ===================================================
        // FIND UNREAD + NOT YET POPPED NOTIFICATION
        // ===================================================

        if (
          !checkingPopupRef.current
        ) {

          checkingPopupRef.current =
            true;


          const shownIds =
            getShownPopupIds();


          const unseenUnread =
            nextNotifications.filter(
              notification =>
                !notification.is_read &&
                !shownIds.includes(
                  notification.id
                )
            );


          if (
            unseenUnread.length > 0
          ) {

            unseenUnread.sort(
              (
                a,
                b
              ) =>
                new Date(
                  b.created_at
                ).getTime() -
                new Date(
                  a.created_at
                ).getTime()
            );


            const newest =
              unseenUnread[0];


            // Save BEFORE showing so it won't
            // popup again when changing pages.

            saveShownPopupId(
              newest.id
            );


            showPopup(
              newest
            );

          }


          checkingPopupRef.current =
            false;

        }


        setNotifications(
          nextNotifications
        );


      } catch (error) {

        console.error(
          'Error loading notifications:',
          error
        );

        checkingPopupRef.current =
          false;

      }

    };


  // =========================================================
  // LOAD + POLL
  // =========================================================

  useEffect(() => {

    fetchNotifications();


    const interval =
      setInterval(
        fetchNotifications,
        5000
      );


    return () => {

      clearInterval(
        interval
      );


      if (
        popupTimerRef.current
      ) {

        clearTimeout(
          popupTimerRef.current
        );

      }

    };

  }, []);


  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const unreadNotifications =
    notifications.filter(
      notification =>
        !notification.is_read
    );


  // =========================================================
  // ICON
  // =========================================================

  const getNotificationIcon = (
    notificationType?: string
  ) => {

    if (
      notificationType ===
      'community_like'
    ) {

      return (
        <Heart
          className="
            w-5
            h-5
            text-pink-400
          "
        />
      );

    }


    if (
      notificationType ===
      'community_comment'
    ) {

      return (
        <Users
          className="
            w-5
            h-5
            text-cyan-400
          "
        />
      );

    }


    if (
      notificationType ===
      'donation'
    ) {

      return (
        <FileText
          className="
            w-5
            h-5
            text-purple-400
          "
        />
      );

    }


    return (
      <Bell
        className="
          w-5
          h-5
          text-cyan-400
        "
      />
    );

  };


  // =========================================================
  // DESTINATION
  // =========================================================

  const getNotificationTarget = (
    notification: NotificationItem
  ) => {

    const type =
      notification.notification_type;


    if (
      type === 'community_like' ||
      type === 'community_comment'
    ) {

      if (
        notification.post_id
      ) {

        return (
          `/user/community#post-${notification.post_id}`
        );

      }

      return '/user/community';

    }


    if (
      type === 'donation'
    ) {

      if (
        location.pathname.startsWith(
          '/admin'
        )
      ) {

        return '/admin/donations';

      }


      if (
        location.pathname.startsWith(
          '/shelter'
        )
      ) {

        return '/shelter/donations';

      }


      return '/user/donation';

    }


    if (
      type === 'appointment'
    ) {

      if (
        location.pathname.startsWith(
          '/vet'
        )
      ) {

        return '/vet/appointments';

      }


      if (
        location.pathname.startsWith(
          '/shelter'
        )
      ) {

        return '/shelter/appointments';

      }


      return '/user/vet-clinic';

    }


    if (
      type === 'adoption'
    ) {

      if (
        location.pathname.startsWith(
          '/admin'
        )
      ) {

        return '/admin/adoptions';

      }


      if (
        location.pathname.startsWith(
          '/shelter'
        )
      ) {

        return '/shelter/applications';

      }


      return '/user/adoption';

    }


    return location.pathname;

  };


  // =========================================================
  // MARK AS READ
  // =========================================================

  const markAsRead = async (
    notification: NotificationItem
  ) => {

    try {

      const token =
        sessionStorage.getItem(
          'access_token'
        );


      if (!token) {
        return;
      }


      await fetch(
        `http://127.0.0.1:8000/api/donations/notifications/${notification.id}/read/`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              'application/json',
          },
        }
      );


    } catch (error) {

      console.error(
        'Error marking notification as read:',
        error
      );

    }


    setNotifications(
      current =>
        current.map(
          item =>
            item.id ===
            notification.id
              ? {
                  ...item,
                  is_read: true,
                }
              : item
        )
    );

  };


  // =========================================================
  // CLICK NOTIFICATION
  // =========================================================

  const handleNotificationClick =
    async (
      notification: NotificationItem
    ) => {

      await markAsRead(
        notification
      );


      closePopup();


      setShowNotifications(
        false
      );


      navigate(
        getNotificationTarget(
          notification
        )
      );

    };


  // =========================================================
  // RETURN
  // =========================================================

  return (
    <>
      {/* ===================================================
          BELL
      =================================================== */}

      <div className="relative">

        <button
          type="button"
          onClick={() =>
            setShowNotifications(
              current =>
                !current
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
                leading-none
                border
                border-gray-900
              "
            >
              {
                unreadNotifications.length
              }
            </span>

          )}

        </button>


        {/* =================================================
            NOTIFICATION HISTORY
        ================================================= */}

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
              shadow-2xl
              overflow-hidden
              z-[1000]
            "
          >

            <div
              className="
                px-4
                py-3
                border-b
                border-white/10
                flex
                items-center
                justify-between
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


              {unreadNotifications.length >
                0 && (

                <span
                  className="
                    text-[10px]
                    text-cyan-400
                  "
                >
                  {
                    unreadNotifications.length
                  }
                  {' '}
                  unread
                </span>

              )}

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
                  notification => (

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
                            shrink-0
                          "
                        >
                          {
                            getNotificationIcon(
                              notification.notification_type
                            )
                          }
                        </div>


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
                              leading-5
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
                              shrink-0
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


      {/* ===================================================
          AUTOMATIC TOP-CENTER POPUP
      =================================================== */}

      {popupNotification &&
        createPortal(

          <div
            className="
              fixed
              top-0
              left-0
              right-0
              z-[99999]
              pointer-events-none
              flex
              justify-center
              px-4
              pt-5
            "
          >

            <div
              className="
                pointer-events-auto
                w-full
                max-w-3xl
                animate-in
                fade-in
                slide-in-from-top-4
                duration-300
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  border
                  border-cyan-400/30
                  bg-gray-950/95
                  backdrop-blur-2xl
                  shadow-2xl
                  shadow-black/60
                  px-5
                  py-4
                "
              >

                {/* ICON */}

                <div
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-cyan-500/10
                    border
                    border-cyan-400/20
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >

                  {
                    getNotificationIcon(
                      popupNotification.notification_type
                    )
                  }

                </div>


                {/* MESSAGE */}

                <button
                  type="button"
                  onClick={() =>
                    handleNotificationClick(
                      popupNotification
                    )
                  }
                  className="
                    flex-1
                    min-w-0
                    text-left
                    cursor-pointer
                  "
                >

                  <div
                    className="
                      text-[10px]
                      uppercase
                      tracking-wider
                      font-bold
                      text-cyan-400
                    "
                  >
                    New Notification
                  </div>


                  <h3
                    className="
                      text-base
                      font-semibold
                      text-white
                      mt-0.5
                      truncate
                    "
                  >
                    {
                      popupNotification.title
                    }
                  </h3>


                  <p
                    className="
                      text-sm
                      text-gray-400
                      mt-0.5
                      truncate
                    "
                  >
                    {
                      popupNotification.message
                    }
                  </p>

                </button>


                {/* VIEW */}

                <button
                  type="button"
                  onClick={() =>
                    handleNotificationClick(
                      popupNotification
                    )
                  }
                  className="
                    hidden
                    sm:flex
                    items-center
                    gap-1
                    text-xs
                    text-cyan-400
                    font-medium
                    whitespace-nowrap
                    shrink-0
                    hover:text-cyan-300
                  "
                >

                  View

                  <ExternalLink
                    className="
                      w-3
                      h-3
                    "
                  />

                </button>


                {/* X */}

                <button
                  type="button"
                  onClick={(event) => {

                    event.stopPropagation();

                    closePopup();

                  }}
                  aria-label="Close notification"
                  className="
                    shrink-0
                    w-9
                    h-9
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-gray-400
                    hover:text-white
                    hover:bg-white/10
                    transition-all
                  "
                >

                  <X
                    className="
                      w-5
                      h-5
                    "
                  />

                </button>

              </div>

            </div>

          </div>,

          document.body

        )}

    </>
  );
}