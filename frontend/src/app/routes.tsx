import { createBrowserRouter, Navigate } from "react-router-dom";
import RoleRoute from "./components/RoleRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

// User Pages
import UserLayout from "./components/layouts/UserLayout";
import Home from "./pages/user/Home";
import Encyclopedia from "./pages/user/Encyclopedia";
import AnimalDetail from "./pages/user/AnimalDetail";
import Adoption from "./pages/user/Adoption";
import AdoptionDetail from "./pages/user/AdoptionDetail";
import Training from "./pages/user/Training";
import TrainingDetail from "./pages/user/TrainingDetail";
import Community from "./pages/user/Community";
import VetClinic from "./pages/user/VetClinic";
import Donation from "./pages/user/Donation";
import DonationPayment from "./pages/user/DonationPayment";
import DonationPending from "./pages/user/DonationPending";
import Profile from "./pages/user/Profile";
import DonationSuccess from "./pages/user/DonationSuccess";
import ShelterDetail from "./pages/user/ShelterDetail";

// Admin Pages
import AdminLayout from "./components/layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Adoptions from "./pages/admin/Adoptions";
import AdminNewsManagement from "./pages/admin/AdminNewsManagement";
import { AdminDonationManagement } from "./pages/admin/Donations";
import { AdminVetManagement } from "./pages/admin/Vet";
import AdminProfile from "./pages/admin/AdminProfile";
import Shelters from "./pages/admin/Shelters";
import AdminEncyclopedia from "./pages/admin/Encyclopedia";
import AdminTraining from "./pages/admin/Training";
import AdminQuizzes from "./pages/admin/Quizzes";
import AdminCommunity from "./pages/admin/AdminCommunity";

// Shelter Pages
import ShelterLayout from "./components/layouts/ShelterLayout";
import ShelterDashboard from "./pages/shelter/Dashboard";
import ShelterAnimals from "./pages/shelter/Animals";
import AdoptionListings from "./pages/shelter/AdoptionListings";
import Applications from "./pages/shelter/Applications";
import ShelterAppointments from "./pages/shelter/Appointments";
import Statistics from "./pages/shelter/Statistics";
import ShelterProfile from "./pages/shelter/Profile";
import ShelterDonations from "./pages/shelter/Donations";

// Vet Pages
import VetLayout from "./components/layouts/VetLayout";
import VetDashboard from "./pages/vet/Dashboard";
import VetAppointments from "./pages/vet/Appointments";
import HealthRecords from "./pages/vet/HealthRecords";
import Vaccinations from "./pages/vet/Vaccinations";
import Treatments from "./pages/vet/Treatments";
import PetOwners from "./pages/vet/PetOwners";
import Schedule from "./pages/vet/Schedule";
import VetProfile from "./pages/vet/Profile";

import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  // =========================
  // PUBLIC ROUTES
  // =========================
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },

  // =========================
  // USER ROUTES
  // =========================
  {
    element: <RoleRoute allowedRole="user" />,
    children: [
      {
        path: "/user",
        element: <UserLayout />,
        children: [
          {
            path: "home",
            element: <Home />,
          },
          {
            path: "encyclopedia",
            element: <Encyclopedia />,
          },
          {
            path: "encyclopedia/:id",
            element: <AnimalDetail />,
          },
          {
            path: "adoption",
            element: <Adoption />,
          },
          {
            path: "adoption/:id",
            element: <AdoptionDetail />,
          },
          {
            path: "adoption/shelter/:id",
            element: <ShelterDetail />,
          },
          {
            path: "training",
            element: <Training />,
          },
          {
            path: "training/:id",
            element: <TrainingDetail />,
          },
          {
            path: "community",
            element: <Community />,
          },
          {
            path: "vet-clinic",
            element: <VetClinic />,
          },
          {
            path: "donation",
            element: <Donation />,
          },
          {
            path: "donation-payment",
            element: <DonationPayment />,
          },
          {
            path: "donation-pending",
            element: <DonationPending />,
          },
          {
            path: "profile",
            element: <Profile />,
          },
          {
            path: "donation-success",
            element: <DonationSuccess />,
          },
        ],
      },
    ],
  },

  // =========================
  // ADMIN ROUTES
  // =========================
  {
    element: <RoleRoute allowedRole="admin" />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "users",
            element: <Users />,
          },
          {
            path: "encyclopedia",
            element: <AdminEncyclopedia />,
          },
          {
            path: "adoptions",
            element: <Adoptions />,
          },
          {
            path: "shelters",
            element: <Shelters />,
          },
          {
            path: "donations",
            element: <AdminDonationManagement />,
          },
          {
            path: "clinics",
            element: <AdminVetManagement />,
          },
          {
            path: "training",
            element: <AdminTraining />,
          },
          {
            path: "quizzes",
            element: <AdminQuizzes  />,
          },
          {
            path: "community",
            element: <AdminCommunity />,
          },
          {
            path: "news",
            element: <AdminNewsManagement />,
          },
          {
            path: "profile",
            element: <AdminProfile />,
          },
        ],
      },
    ],
  },

  // =========================
  // SHELTER ROUTES
  // =========================
  {
    element: <RoleRoute allowedRole="shelter" />,
    children: [
      {
        path: "/shelter",
        element: <ShelterLayout />,
        children: [
          {
            path: "dashboard",
            element: <ShelterDashboard />,
          },
          {
            path: "animals",
            element: <ShelterAnimals />,
          },
          {
            path: "listings",
            element: <AdoptionListings />,
          },
          {
            path: "applications",
            element: <Applications />,
          },
          {
            path: "appointments",
            element: <ShelterAppointments />,
          },
          {
            path: "donations",
            element: <ShelterDonations />,
          },
          {
            path: "statistics",
            element: <Statistics />,
          },
          {
            path: "profile",
            element: <ShelterProfile />,
          },
        ],
      },
    ],
  },

  // =========================
  // VET ROUTES
  // =========================
  {
    element: <RoleRoute allowedRole="vet" />,
    children: [
      {
        path: "/vet",
        element: <VetLayout />,
        children: [
          {
            path: "dashboard",
            element: <VetDashboard />,
          },
          {
            path: "appointments",
            element: <VetAppointments />,
          },
          {
            path: "health-records",
            element: <HealthRecords />,
          },
          {
            path: "vaccinations",
            element: <Vaccinations />,
          },
          {
            path: "treatments",
            element: <Treatments />,
          },
          {
            path: "pet-owners",
            element: <PetOwners />,
          },
          {
            path: "schedule",
            element: <Schedule />,
          },
          {
            path: "profile",
            element: <VetProfile />,
          },
        ],
      },
    ],
  },

  // =========================
  // NOT FOUND
  // =========================
  {
    path: "*",
    element: <NotFound />,
  },
]);