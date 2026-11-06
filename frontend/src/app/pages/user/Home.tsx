import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

import {
  Search,
  ArrowRight,
  Book,
  Heart,
  GraduationCap,
  Users,
  Building2,
  DollarSign,
  Sparkles,
} from 'lucide-react';


// =====================================================
// QUICK ACCESS
// =====================================================

const quickAccessCards = [
  {
    title: 'Encyclopedia',
    description: 'Discover Malaysia’s remarkable wildlife',
    icon: Book,
    href: '/user/encyclopedia',
  },
  {
    title: 'Adoption',
    description: 'Find a companion waiting for a home',
    icon: Heart,
    href: '/user/adoption',
  },
  {
    title: 'Training',
    description: 'Build better pet care knowledge',
    icon: GraduationCap,
    href: '/user/training',
  },
  {
    title: 'Community',
    description: 'Share and connect with animal lovers',
    icon: Users,
    href: '/user/community',
  },
  {
    title: 'Vet Clinic',
    description: 'Explore veterinary care and appointments',
    icon: Building2,
    href: '/user/vet-clinic',
  },
  {
    title: 'Donate',
    description: 'Support shelters and animals in need',
    icon: DollarSign,
    href: '/user/donation',
  },
];


// =====================================================
// HOME
// =====================================================

export default function Home() {

  const [encyclopediaAnimals, setEncyclopediaAnimals] =
    useState<any[]>([]);

  const [adoptionListings, setAdoptionListings] =
    useState<any[]>([]);

  const [newsArticles, setNewsArticles] =
    useState<any[]>([]);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [showAllNews, setShowAllNews] =
    useState(false);


  // =====================================================
  // PROFILE COMPLETION POPUP
  // =====================================================

  const [showProfilePopup, setShowProfilePopup] =
    useState(false);

  const [profileChecked, setProfileChecked] =
    useState(false);

  const [fullName, setFullName] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [savingProfile, setSavingProfile] =
    useState(false);


  // =====================================================
  // LOAD HOME DATA
  // =====================================================

  useEffect(() => {

    const fetchHomeData = async () => {

      const token =
        sessionStorage.getItem('access_token');


      // =============================
      // ANIMALS
      // =============================

      try {

        const response = await fetch(
          'http://127.0.0.1:8000/api/animals/'
        );

        if (response.ok) {

          const data = await response.json();

          setEncyclopediaAnimals(

            Array.isArray(data)

              ? data.map((animal: any) => ({
                  ...animal,

                  scientificName:
                    animal.scientific_name,

                  conservationStatus:
                    animal.conservation_status,
                }))

              : []
          );

        }

      } catch (error) {

        console.error(
          'Error loading animals:',
          error
        );

      }


      // =============================
      // ADOPTION
      // =============================

      try {

        const response = await fetch(
          'http://127.0.0.1:8000/api/adoptions/',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {

          const data = await response.json();

          setAdoptionListings(

            Array.isArray(data)

              ? data.map((pet: any) => ({
                  ...pet,

                  traits:
                    Array.isArray(pet.requirements)
                      ? pet.requirements
                      : pet.requirements
                        ? [pet.requirements]
                        : [],

                  shelterId:
                    String(pet.shelter),

                  shelterName:
                    pet.shelter_name,

                  adoptionStatus:
                    pet.status === 'AVAILABLE'
                      ? 'Available'
                      : pet.status,
                }))

              : []
          );

        }

      } catch (error) {

        console.error(
          'Error loading adoption listings:',
          error
        );

      }

    };


    fetchHomeData();

  }, []);


  // =====================================================
  // LOAD NEWS
  // =====================================================

  useEffect(() => {

    const fetchNews = async () => {

      try {

        const response = await fetch(
          'http://127.0.0.1:8000/api/news/'
        );

        if (!response.ok) {

          throw new Error(
            'Failed to fetch news'
          );

        }

        const data =
          await response.json();

        setNewsArticles(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          'Failed to load news:',
          error
        );

      }

    };


    fetchNews();

  }, []);


  // =====================================================
  // CHECK PROFILE POPUP
  // =====================================================

  useEffect(() => {

    const checkProfilePrompt =
      async () => {

        const accessToken =
          sessionStorage.getItem(
            'access_token'
          );


        if (!accessToken) {

          setProfileChecked(true);

          return;

        }


        try {

          const response = await fetch(
            'http://127.0.0.1:8000/api/profile/',
            {
              method: 'GET',

              headers: {

                Authorization:
                  `Bearer ${accessToken}`,

                Accept:
                  'application/json',

              },
            }
          );


          const data =
            await response.json();


          if (!response.ok) {

            setShowProfilePopup(false);

            setProfileChecked(true);

            return;

          }


          setFullName(
            data.full_name || ''
          );

          setPhone(
            data.phone || ''
          );


          const profileCompleted =

            data.profile_prompt_seen === true ||

            (
              data.full_name &&
              data.full_name.trim() !== '' &&

              data.phone &&
              data.phone.trim() !== ''
            );


          if (profileCompleted) {

            setShowProfilePopup(false);

          } else {

            setShowProfilePopup(true);

          }


        } catch (error) {

          console.error(
            'Failed to check profile:',
            error
          );

          setShowProfilePopup(false);


        } finally {

          setProfileChecked(true);

        }

      };


    checkProfilePrompt();

  }, []);


  // =====================================================
  // SAVE / SKIP PROFILE
  // =====================================================

  const handleProfilePrompt =
    async (skip = false) => {

      const accessToken =
        sessionStorage.getItem(
          'access_token'
        );


      if (!accessToken) {
        return;
      }


      setSavingProfile(true);


      try {

        const response = await fetch(
          'http://127.0.0.1:8000/api/profile/complete-prompt/',
          {
            method: 'POST',

            headers: {

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${accessToken}`,

            },

            body: JSON.stringify({

              full_name:
                skip
                  ? ''
                  : fullName.trim(),

              phone:
                skip
                  ? ''
                  : phone.trim(),

            }),
          }
        );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(

            data?.error ||

            data?.detail ||

            'Failed to save profile information'

          );

        }


        setShowProfilePopup(false);

        setFullName(
          data.full_name ||
          fullName
        );

        setPhone(
          data.phone ||
          phone
        );


      } catch (error) {

        console.error(
          'Profile update failed:',
          error
        );


        alert(

          error instanceof Error

            ? error.message

            : 'Unable to save your profile.'

        );


      } finally {

        setSavingProfile(false);

      }

    };


  // =====================================================
  // SEARCH LINK
  // =====================================================

  const encyclopediaSearchLink =
    searchQuery.trim()

      ? `/user/encyclopedia?search=${encodeURIComponent(
          searchQuery.trim()
        )}`

      : '/user/encyclopedia';


  // =====================================================
  // RETURN
  // =====================================================

  return (

    <div
      className="
        min-h-screen
        bg-[#101322]
        text-white
        relative
        overflow-hidden
      "
    >


      {/* =================================================
          BACKGROUND GLOW
          ================================================= */}

      <div
        className="
          fixed
          inset-0
          pointer-events-none
          overflow-hidden
        "
      >

        <div
          className="
            absolute
            -top-40
            left-[18%]
            w-[650px]
            h-[650px]
            rounded-full
            bg-violet-500/[0.13]
            blur-[160px]
          "
        />

        <div
          className="
            absolute
            top-[38%]
            -right-48
            w-[550px]
            h-[550px]
            rounded-full
            bg-cyan-400/[0.08]
            blur-[160px]
          "
        />

      </div>


      {/* =================================================
          PROFILE POPUP
          ================================================= */}

      {profileChecked &&
        showProfilePopup && (

          <div
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              p-4
            "
          >

            <div
              className="
                absolute
                inset-0
                bg-black/60
                backdrop-blur-sm
              "
            />


            <Card
              className="
                relative
                z-10
                w-full
                max-w-md
                bg-[#191D30]/95
                backdrop-blur-2xl
                border
                border-white/[0.10]
                rounded-3xl
                shadow-2xl
                shadow-black/40
              "
            >

              <CardHeader
                className="
                  text-center
                  pb-4
                "
              >

                <div
                  className="
                    mx-auto
                    mb-4
                    w-14
                    h-14
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    bg-violet-500/15
                    border
                    border-violet-400/25
                  "
                >

                  <Sparkles
                    className="
                      w-6
                      h-6
                      text-violet-300
                    "
                  />

                </div>


                <CardTitle
                  className="
                    text-2xl
                    font-semibold
                    text-white
                  "
                >

                  Welcome to Pawtopia

                </CardTitle>


                <CardDescription
                  className="
                    text-zinc-400
                    mt-2
                    leading-relaxed
                  "
                >

                  Complete your profile so
                  we can provide you with a
                  better Pawtopia experience.

                </CardDescription>

              </CardHeader>


              <CardContent
                className="
                  space-y-5
                "
              >

                <div
                  className="
                    space-y-2
                  "
                >

                  <label
                    className="
                      text-sm
                      font-medium
                      text-zinc-200
                    "
                  >

                    Full Name

                  </label>


                  <Input

                    type="text"

                    placeholder="Enter your full name"

                    value={fullName}

                    onChange={(e) =>
                      setFullName(
                        e.target.value
                      )
                    }

                    className="
                      h-11
                      bg-white/[0.06]
                      border-white/[0.10]
                      text-white
                      placeholder:text-zinc-500
                    "

                  />

                </div>


                <div
                  className="
                    space-y-2
                  "
                >

                  <label
                    className="
                      text-sm
                      font-medium
                      text-zinc-200
                    "
                  >

                    Phone Number

                  </label>


                  <Input

                    type="tel"

                    placeholder="Enter your phone number"

                    value={phone}

                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }

                    className="
                      h-11
                      bg-white/[0.06]
                      border-white/[0.10]
                      text-white
                      placeholder:text-zinc-500
                    "

                  />

                </div>


                <p
                  className="
                    text-sm
                    text-zinc-500
                    text-center
                    leading-relaxed
                  "
                >

                  You can update these
                  details anytime from your
                  Profile page.

                </p>


                <div
                  className="
                    flex
                    gap-3
                  "
                >

                  <Button

                    type="button"

                    variant="outline"

                    disabled={savingProfile}

                    onClick={() =>
                      handleProfilePrompt(true)
                    }

                    className="
                      flex-1
                      h-11
                      bg-transparent
                      border-white/[0.12]
                      text-zinc-300
                      hover:bg-white/[0.06]
                      hover:text-white
                    "
                  >

                    Skip for Now

                  </Button>


                  <Button

                    type="button"

                    disabled={savingProfile}

                    onClick={() =>
                      handleProfilePrompt(false)
                    }

                    className="
                      flex-1
                      h-11
                      bg-violet-600
                      hover:bg-violet-500
                      text-white
                    "
                  >

                    {savingProfile
                      ? 'Saving...'
                      : 'Save & Continue'}

                  </Button>

                </div>

              </CardContent>

            </Card>

          </div>

        )}


      {/* =================================================
          HERO
          ================================================= */}

      <section
        className="
          relative
          min-h-[520px]
          flex
          items-center
          justify-center
          overflow-hidden
          border-b
          border-white/[0.07]
        "
      >

        {/* BACKGROUND IMAGE */}

        <div
          className="
            absolute
            inset-0
            bg-cover
            bg-center
          "
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1920)",
          }}
        />


        {/* SOFTER OVERLAY */}

        <div
          className="
            absolute
            inset-0
            bg-[#101322]/55
          "
        />


        {/* CENTER GRADIENT */}

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12),transparent_60%)]
          "
        />


        {/* EDGE OVERLAY */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-[#101322]/70
            via-transparent
            to-[#101322]/70
          "
        />


        {/* BOTTOM FADE */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-[#101322]
            via-transparent
            to-[#101322]/15
          "
        />


        {/* HERO CONTENT */}

        <div
          className="
            relative
            z-10
            w-full
            max-w-4xl
            mx-auto
            px-5
            sm:px-8
            py-20
            text-center
            flex
            flex-col
            items-center
            justify-center
          "
        >

          {/* HERO BADGE */}

          <div
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              px-4
              py-2
              mb-6
              rounded-full
              bg-violet-500/15
              border
              border-violet-400/30
              backdrop-blur-lg
              text-sm
              text-violet-100
              shadow-lg
              shadow-black/10
            "
          >

            <Sparkles
              className="
                w-4
                h-4
                text-violet-300
              "
            />

            Explore • Learn • Adopt • Care

          </div>


          {/* TITLE */}

          <h1
            className="
              text-4xl
              sm:text-5xl
              lg:text-[58px]
              font-semibold
              tracking-[-0.035em]
              leading-[1.08]
              text-white
            "
          >

            Welcome to{' '}

            <span
              className="
                bg-gradient-to-r
                from-violet-400
                via-blue-400
                to-cyan-300
                bg-clip-text
                text-transparent
              "
            >

              Pawtopia

            </span>

          </h1>


          {/* DESCRIPTION */}

          <p
            className="
              mt-5
              max-w-2xl
              mx-auto
              text-base
              sm:text-lg
              text-zinc-200
              leading-relaxed
            "
          >

            Discover Malaysia&apos;s wildlife,
            find loving companions, build better
            pet-care knowledge and support animals
            in need.

          </p>


          {/* SEARCH */}

          <div
            className="
              mt-8
              w-full
              max-w-2xl
              mx-auto
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                p-1.5
                rounded-2xl
                bg-[#191D30]/90
                backdrop-blur-xl
                border
                border-white/[0.13]
                shadow-2xl
                shadow-black/25
              "
            >

              <div
                className="
                  relative
                  flex-1
                "
              >

                <Search
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    w-5
                    h-5
                    text-zinc-400
                  "
                />


                <Input

                  type="text"

                  placeholder="Search animals and wildlife..."

                  value={searchQuery}

                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }

                  onKeyDown={(e) => {

                    if (
                      e.key === 'Enter'
                    ) {

                      window.location.href =
                        encyclopediaSearchLink;

                    }

                  }}

                  className="
                    h-12
                    pl-12
                    border-0
                    bg-transparent
                    text-white
                    placeholder:text-zinc-500
                    focus-visible:ring-0
                    focus-visible:ring-offset-0
                  "

                />

              </div>


              <Link
                to={encyclopediaSearchLink}
              >

                <Button
                  className="
                    h-11
                    px-7
                    rounded-xl
                    bg-violet-600
                    hover:bg-violet-500
                    text-white
                    shadow-lg
                    shadow-violet-950/30
                  "
                >

                  Search

                </Button>

              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main
        className="
          relative
          z-10
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          py-14
          space-y-16
        "
      >


        {/* =================================================
            EXPLORE PAWTOPIA
            ================================================= */}

        <section>

          <SectionHeader

            eyebrow="Discover"

            title="Explore Pawtopia"

            description="Everything you need for wildlife education, adoption and animal care."

          />


          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-5
            "
          >

            {quickAccessCards.map(
              (card) => {

                const Icon = card.icon;


                return (

                  <Link
                    key={card.title}
                    to={card.href}
                    className="
                      group
                      block
                    "
                  >

                    <Card
                      className="
                        h-full
                        bg-[#191D30]/85
                        backdrop-blur-xl
                        border
                        border-white/[0.09]
                        rounded-2xl
                        transition-all
                        duration-300
                        hover:bg-[#20253A]
                        hover:border-violet-400/30
                        hover:-translate-y-1
                        hover:shadow-xl
                        hover:shadow-black/20
                      "
                    >

                      <CardContent
                        className="
                          p-6
                          flex
                          items-center
                          gap-5
                        "
                      >

                        <div
                          className="
                            shrink-0
                            w-12
                            h-12
                            rounded-xl
                            bg-violet-500/15
                            border
                            border-violet-400/20
                            flex
                            items-center
                            justify-center
                            transition-all
                            duration-300
                            group-hover:bg-violet-500/20
                            group-hover:border-violet-400/40
                          "
                        >

                          <Icon
                            className="
                              w-5
                              h-5
                              text-violet-300
                              transition-colors
                              group-hover:text-cyan-300
                            "
                          />

                        </div>


                        <div
                          className="
                            flex-1
                            min-w-0
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              gap-3
                            "
                          >

                            <h3
                              className="
                                text-base
                                font-semibold
                                text-white
                              "
                            >

                              {card.title}

                            </h3>


                            <ArrowRight
                              className="
                                w-4
                                h-4
                                text-zinc-500
                                transition-all
                                group-hover:text-cyan-300
                                group-hover:translate-x-1
                              "
                            />

                          </div>


                          <p
                            className="
                              mt-1
                              text-sm
                              text-zinc-400
                              leading-relaxed
                            "
                          >

                            {card.description}

                          </p>

                        </div>

                      </CardContent>

                    </Card>

                  </Link>

                );

              }
            )}

          </div>

        </section>


        {/* =================================================
            NEWS
            ================================================= */}

        <section>

          <SectionHeader

            eyebrow="Stay Informed"

            title="Latest News"

            description="Updates, stories and developments from the animal world."

            action={

              <Button

                variant="ghost"

                onClick={() =>
                  setShowAllNews(
                    !showAllNews
                  )
                }

                className="
                  text-zinc-300
                  hover:text-cyan-300
                  hover:bg-white/[0.06]
                "
              >

                {showAllNews
                  ? 'Show Less'
                  : 'View All'}

                <ArrowRight
                  className="
                    w-4
                    h-4
                    ml-2
                  "
                />

              </Button>

            }

          />


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-4
              gap-5
            "
          >

            {(showAllNews

              ? newsArticles

              : newsArticles.slice(0, 4)

            ).map((article) => (

              <Card

                key={article.id}

                className="
                  group
                  bg-[#191D30]/85
                  border
                  border-white/[0.09]
                  rounded-2xl
                  overflow-hidden
                  transition-all
                  duration-300
                  hover:bg-[#20253A]
                  hover:border-violet-400/30
                  hover:-translate-y-1
                  hover:shadow-xl
                  hover:shadow-black/20
                "
              >

                <div
                  className="
                    aspect-[16/10]
                    overflow-hidden
                    bg-[#20253A]
                  "
                >

                  <img

                    src={article.image}

                    alt={article.title}

                    className="
                      w-full
                      h-full
                      object-cover
                      transition-transform
                      duration-500
                      group-hover:scale-105
                    "

                  />

                </div>


                <CardHeader
                  className="
                    pb-3
                  "
                >

                  <Badge
                    className="
                      w-fit
                      mb-2
                      bg-violet-500/15
                      text-violet-200
                      border-violet-400/25
                    "
                  >

                    {article.category}

                  </Badge>


                  <CardTitle
                    className="
                      text-lg
                      leading-snug
                      text-white
                      line-clamp-2
                    "
                  >

                    {article.title}

                  </CardTitle>


                  <CardDescription
                    className="
                      text-zinc-400
                      line-clamp-2
                      leading-relaxed
                    "
                  >

                    {article.summary}

                  </CardDescription>

                </CardHeader>


                <CardContent
                  className="
                    pt-0
                  "
                >

                  <Button

                    variant="ghost"

                    className="
                      w-full
                      justify-between
                      text-zinc-300
                      hover:text-cyan-300
                      hover:bg-white/[0.05]
                    "

                    onClick={() =>
                      window.open(
                        article.url,
                        '_blank'
                      )
                    }

                  >

                    Read More

                    <ArrowRight
                      className="
                        w-4
                        h-4
                      "
                    />

                  </Button>

                </CardContent>

              </Card>

            ))}

          </div>

        </section>


        {/* =================================================
            FEATURED WILDLIFE
            ================================================= */}

        <section>

          <SectionHeader

            eyebrow="Malaysia's Wildlife"

            title="Featured Wildlife"

            description="Meet some of the remarkable species in the Pawtopia encyclopedia."

            action={

              <Link
                to="/user/encyclopedia"
              >

                <Button
                  variant="ghost"
                  className="
                    text-zinc-300
                    hover:text-cyan-300
                    hover:bg-white/[0.06]
                  "
                >

                  View Encyclopedia

                  <ArrowRight
                    className="
                      w-4
                      h-4
                      ml-2
                    "
                  />

                </Button>

              </Link>

            }

          />


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-3
              gap-5
            "
          >

            {encyclopediaAnimals
              .slice(0, 3)
              .map((animal) => (

                <Link

                  key={animal.id}

                  to={`/user/encyclopedia/${animal.id}`}

                  className="
                    group
                  "
                >

                  <Card
                    className="
                      h-full
                      bg-[#191D30]/85
                      border
                      border-white/[0.09]
                      rounded-2xl
                      overflow-hidden
                      transition-all
                      duration-300
                      hover:bg-[#20253A]
                      hover:border-violet-400/30
                      hover:-translate-y-1
                      hover:shadow-xl
                      hover:shadow-black/20
                    "
                  >

                    <div
                      className="
                        relative
                        aspect-[16/10]
                        overflow-hidden
                        bg-[#20253A]
                      "
                    >

                      <img

                        src={
                          animal.image_file ||
                          animal.image
                        }

                        alt={animal.name}

                        className="
                          w-full
                          h-full
                          object-cover
                          transition-transform
                          duration-500
                          group-hover:scale-105
                        "

                      />


                      <div
                        className="
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-[#101322]/80
                          via-transparent
                          to-transparent
                        "
                      />


                      <Badge
                        className="
                          absolute
                          left-4
                          bottom-4
                          bg-black/45
                          backdrop-blur-md
                          border-white/15
                          text-zinc-100
                          capitalize
                        "
                      >

                        {animal.category}

                      </Badge>

                    </div>


                    <CardHeader
                      className="
                        pb-3
                      "
                    >

                      <CardTitle
                        className="
                          text-xl
                          text-white
                        "
                      >

                        {animal.name}

                      </CardTitle>


                      <CardDescription
                        className="
                          text-zinc-400
                          italic
                        "
                      >

                        {animal.scientificName}

                      </CardDescription>

                    </CardHeader>


                    <CardContent>

                      {animal.conservationStatus && (

                        <Badge
                          className={`mb-4 ${
                            animal.conservationStatus.includes(
                              'Critically'
                            )

                              ? 'bg-red-500/15 text-red-300 border-red-400/25'

                              : animal.conservationStatus.includes(
                                  'Endangered'
                                )

                                ? 'bg-amber-500/15 text-amber-300 border-amber-400/25'

                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-400/25'
                          }`}
                        >

                          {
                            animal.conservationStatus
                          }

                        </Badge>

                      )}


                      <p
                        className="
                          text-sm
                          text-zinc-400
                          leading-relaxed
                          line-clamp-2
                        "
                      >

                        {animal.description}

                      </p>


                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mt-5
                          text-sm
                          font-medium
                          text-violet-300
                          transition-colors
                          group-hover:text-cyan-300
                        "
                      >

                        Explore species

                        <ArrowRight
                          className="
                            w-4
                            h-4
                            transition-transform
                            group-hover:translate-x-1
                          "
                        />

                      </div>

                    </CardContent>

                  </Card>

                </Link>

              ))}

          </div>

        </section>


        {/* =================================================
            ADOPTION
            ================================================= */}

        <section>

          <SectionHeader

            eyebrow="Find a Companion"

            title="Pets Looking for Homes"

            description="Meet animals currently waiting for a loving home."

            action={

              <Link
                to="/user/adoption"
              >

                <Button
                  variant="ghost"
                  className="
                    text-zinc-300
                    hover:text-cyan-300
                    hover:bg-white/[0.06]
                  "
                >

                  View All Pets

                  <ArrowRight
                    className="
                      w-4
                      h-4
                      ml-2
                    "
                  />

                </Button>

              </Link>

            }

          />


          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-5
            "
          >

            {adoptionListings
              .slice(0, 4)
              .map((pet) => (

                <Link

                  key={pet.id}

                  to={`/user/adoption/${pet.id}`}

                  className="
                    group
                  "
                >

                  <Card
                    className="
                      h-full
                      bg-[#191D30]/85
                      border
                      border-white/[0.09]
                      rounded-2xl
                      overflow-hidden
                      transition-all
                      duration-300
                      hover:bg-[#20253A]
                      hover:border-violet-400/30
                      hover:-translate-y-1
                      hover:shadow-xl
                      hover:shadow-black/20
                    "
                  >

                    <div
                      className="
                        relative
                        aspect-square
                        overflow-hidden
                        bg-[#20253A]
                      "
                    >

                      <img

                        src={pet.image}

                        alt={pet.name}

                        className="
                          w-full
                          h-full
                          object-cover
                          transition-transform
                          duration-500
                          group-hover:scale-105
                        "

                      />


                      {pet.adoptionStatus && (

                        <Badge
                          className="
                            absolute
                            top-4
                            left-4
                            bg-emerald-500/90
                            text-white
                            border-0
                          "
                        >

                          {pet.adoptionStatus}

                        </Badge>

                      )}

                    </div>


                    <CardHeader
                      className="
                        pb-3
                      "
                    >

                      <CardTitle
                        className="
                          text-xl
                          text-white
                        "
                      >

                        {pet.name}

                      </CardTitle>


                      <CardDescription
                        className="
                          text-zinc-400
                        "
                      >

                        {pet.breed}
                        {' • '}
                        {pet.age}

                      </CardDescription>

                    </CardHeader>


                    <CardContent>

                      <div
                        className="
                          flex
                          flex-wrap
                          gap-2
                          mb-4
                        "
                      >

                        {pet.traits
                          ?.slice(0, 2)
                          .map(
                            (
                              trait: string
                            ) => (

                              <Badge

                                key={trait}

                                variant="outline"

                                className="
                                  text-xs
                                  border-violet-400/25
                                  text-violet-300
                                  bg-violet-500/[0.08]
                                "
                              >

                                {trait}

                              </Badge>

                            )
                          )}

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-3
                        "
                      >

                        <p
                          className="
                            text-sm
                            text-zinc-400
                            truncate
                          "
                        >

                          {pet.shelterName}

                        </p>


                        <ArrowRight
                          className="
                            shrink-0
                            w-4
                            h-4
                            text-zinc-500
                            transition-all
                            group-hover:text-cyan-300
                            group-hover:translate-x-1
                          "
                        />

                      </div>

                    </CardContent>

                  </Card>

                </Link>

              ))}

          </div>

        </section>


        {/* =================================================
            BOTTOM CTA
            ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            border-white/[0.10]
            bg-[#191D30]/90
            px-6
            py-10
            sm:px-10
          "
        >

          <div
            className="
              absolute
              -right-20
              -top-20
              w-72
              h-72
              rounded-full
              bg-violet-500/15
              blur-[100px]
              pointer-events-none
            "
          />


          <div
            className="
              absolute
              -left-20
              -bottom-28
              w-72
              h-72
              rounded-full
              bg-cyan-400/[0.08]
              blur-[100px]
              pointer-events-none
            "
          />


          <div
            className="
              relative
              z-10
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-8
            "
          >

            <div
              className="
                max-w-2xl
              "
            >

              <p
                className="
                  text-sm
                  font-medium
                  uppercase
                  tracking-[0.18em]
                  text-cyan-300
                  mb-3
                "
              >

                Make a Difference

              </p>


              <h2
                className="
                  text-2xl
                  sm:text-3xl
                  font-semibold
                  tracking-tight
                  text-white
                "
              >

                Every animal deserves care,
                knowledge and a loving home.

              </h2>


              <p
                className="
                  mt-3
                  text-zinc-400
                  leading-relaxed
                "
              >

                Explore Pawtopia&apos;s animal
                resources, support local shelters
                or discover your next companion.

              </p>

            </div>


            <div
              className="
                flex
                flex-wrap
                gap-3
              "
            >

              <Link
                to="/user/adoption"
              >

                <Button
                  className="
                    bg-violet-600
                    hover:bg-violet-500
                    text-white
                  "
                >

                  Explore Adoption

                  <Heart
                    className="
                      w-4
                      h-4
                      ml-2
                    "
                  />

                </Button>

              </Link>


              <Link
                to="/user/donation"
              >

                <Button
                  variant="outline"
                  className="
                    bg-transparent
                    border-white/[0.12]
                    text-zinc-200
                    hover:bg-white/[0.06]
                    hover:text-white
                  "
                >

                  Support Shelters

                </Button>

              </Link>

            </div>

          </div>

        </section>

      </main>

    </div>

  );

}


// =====================================================
// SECTION HEADER
// =====================================================

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {

  return (

    <div
      className="
        flex
        flex-col
        sm:flex-row
        sm:items-end
        sm:justify-between
        gap-4
        mb-7
      "
    >

      <div>

        <p
          className="
            text-sm
            font-medium
            uppercase
            tracking-[0.18em]
            text-violet-400
            mb-2
          "
        >

          {eyebrow}

        </p>


        <h2
          className="
            text-3xl
            font-semibold
            tracking-tight
            text-white
          "
        >

          {title}

        </h2>


        <p
          className="
            mt-2
            text-zinc-400
          "
        >

          {description}

        </p>

      </div>


      {action && (

        <div
          className="
            shrink-0
          "
        >

          {action}

        </div>

      )}

    </div>

  );

}