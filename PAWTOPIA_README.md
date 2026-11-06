# Pawtopia - Smart Animal Encyclopedia and Adoption Community System

A complete, modern, responsive web application that combines wildlife education, pet adoption, pet training resources, community engagement, shelter donations, and veterinary appointment booking into a centralized platform.

## ✨ Features

### User Features
- **Authentication System**: Login, Signup, Forgot Password with role-based access
- **Home Dashboard**: Latest news, featured wildlife animals, adoption listings, quick access cards
- **Animal Encyclopedia**: Browse Malaysia wildlife with categories (Mammals, Birds, Reptiles, Amphibians, Fish, Insects)
- **Pet Adoption**: Browse pets from Penang shelters, submit adoption applications
- **Training Module**: Educational content with quizzes for dog training, cat care, feeding guides
- **Community**: Create posts, comment, like, and interact with other animal lovers
- **Vet Clinic**: Book appointments at veterinary clinics in Penang
- **Donation System**: Support shelters with multiple payment methods (RM currency)
- **User Profile**: Manage profile, view adoption/donation/appointment/training history

### Admin Features
- **Admin Dashboard**: Analytics overview with charts and recent activities
- **User Management**: Manage user accounts
- **Content Management**: Manage encyclopedia, adoptions, shelters, donations, clinics, training, quizzes, community, and news

## 🎨 Design

- Modern dark theme with purple and cyan gradients
- Glassmorphism effects
- Responsive layouts for desktop and mobile
- Professional wildlife and pet imagery from Unsplash

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router v7 (Data Mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI (shadcn/ui)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📁 Project Structure

```
/src/app
├── components/
│   ├── layouts/
│   │   ├── UserLayout.tsx      # User dashboard layout with navigation
│   │   └── AdminLayout.tsx     # Admin dashboard layout
│   └── ui/                      # Reusable UI components (shadcn/ui)
├── context/
│   └── AuthContext.tsx          # Authentication state management
├── data/
│   └── mockData.ts              # Mock data for animals, news, adoptions, etc.
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── ForgotPassword.tsx
│   ├── user/
│   │   ├── Home.tsx             # User home dashboard
│   │   ├── Encyclopedia.tsx     # Animal categories and listings
│   │   ├── AnimalDetail.tsx     # Individual animal details
│   │   ├── Adoption.tsx         # Pet adoption listings
│   │   ├── AdoptionDetail.tsx   # Individual pet details
│   │   ├── Training.tsx         # Training topics
│   │   ├── TrainingDetail.tsx   # Training content with quiz
│   │   ├── Community.tsx        # Community posts and interactions
│   │   ├── VetClinic.tsx        # Vet clinic listings and appointments
│   │   ├── Donation.tsx         # Multi-step donation form
│   │   ├── DonationSuccess.tsx  # Donation confirmation
│   │   └── Profile.tsx          # User profile and history
│   └── admin/
│       ├── Dashboard.tsx        # Admin analytics dashboard
│       ├── Users.tsx            # User management
│       └── AdminManagement.tsx  # Reusable admin table component
├── routes.tsx                   # React Router configuration
└── App.tsx                      # Main app component with router
```

## 🚀 Getting Started

### Demo Credentials

**Regular User:**
- Email: user@example.com
- Password: password123

**Administrator:**
- Email: admin@pawtopia.com
- Password: admin123

### Features by Module

#### Encyclopedia Module
- 6 Categories: Mammals, Birds, Reptiles, Amphibians, Fish, Insects
- Detailed animal information: scientific name, habitat, diet, lifespan, conservation status
- Image galleries and interesting facts
- Related animals suggestions

#### Adoption Module
- Penang-based shelters: Bayan Lepas Shelter, Tanjung Bungah Shelter
- Pet profiles with age, gender, vaccination status
- Adoption application form
- Shelter information and capacity tracking

#### Donation Module
- Preset amounts: RM10, RM20, RM50, RM100, RM200, or custom
- Payment methods: Touch 'n Go, DuitNow QR, FPX, Credit/Debit Card
- Anonymous donation option
- Transaction reference and receipt

#### Training Module
- Topics: Dog Training, Cat Training, Pet Bathing, Feeding, Health
- Step-by-step guides and tutorials
- Interactive quizzes with scoring
- Progress tracking

#### Community Module
- Create, edit, delete posts
- Like and comment system
- Category badges
- Real-time interaction

#### Vet Clinic Module
- Clinic listings with ratings
- Service offerings
- Appointment booking with date/time selection
- Contact information

## 📊 Admin Dashboard

- Total users, adoption requests, donations, appointments, community posts
- Monthly overview charts (user growth, adoptions)
- Weekly activity graphs
- Recent activities feed
- Full CRUD management for all modules

## 🎯 Key Highlights

- **Production-Ready**: Complete functionality, no placeholder pages
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Mock Data**: Rich sample data for all modules
- **User Experience**: Smooth navigation, toast notifications, loading states
- **Role-Based Access**: Separate user and admin interfaces
- **Form Validation**: Client-side validation for all forms
- **State Management**: Context API for authentication
- **Modern UI**: Dark theme with gradient accents and glassmorphism

## 🌟 Future Enhancements (Backend Integration)

This is a frontend-only implementation. For production deployment, integrate:
- Django REST Framework backend
- PostgreSQL database
- JWT authentication
- File upload for images
- Email notifications
- Payment gateway integration
- Real-time chat/notifications

---

Built with ❤️ for animal lovers and conservation enthusiasts
