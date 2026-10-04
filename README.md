# 💌 Campus Hearts

<div align="center">
  <img src="./public/CampusHeartLogo.png" alt="Campus Hearts Logo" width="120" height="120" />
  
  ### A dating app exclusively for your college.
  
  *Verified college-email login, swipe-style exploring, and mutual love requests*
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
</div>

---

## 📖 Overview

**Campus Hearts** is the go-to place to find a partner for **freshers night**. It's campus-only, built around a compatibility quiz, and keeps photos locked down.

**How it works:**
1. **Sign in** with any email (OTP, no passwords).
2. **Verify**:
   - Seniors with a college email are verified automatically.
   - Freshers, who have no ID card or activated college email yet, upload the **admission letter PDF**. The server reads the PDF and checks the college name, intake year, the student's name and admission number. One letter can only be linked to one account.
3. **Build a profile**: 3 photos, a bio, interests, and a 10-question **freshers night quiz**.
4. **Explore**: everyone sees verified profiles of the opposite gender, sorted by **compatibility %**. Like someone. If they like you back, it's an **instant match**. Otherwise they get a love request they can accept or decline.
5. On a match, both sides can unlock each other's WhatsApp number.

---

## ✨ Key Features

- **📄 Admission-letter verification**: `/api/verify-admission` extracts the text of the PDF (with `unpdf`) and auto-approves it if it matches. It is rate-limited to 5 attempts, and the PDF hash and admission number are unique per verified account. Letters are kept in a private bucket for audit.
- **🎯 Compatibility matching**: `lib/matching.ts` scores each pair from 0 to 100:
  - weighted quiz agreement (single-choice answers must match; scale answers score by distance),
  - interest overlap (Jaccard),
  - a small penalty for a different year of study,
  - an optional "looking for the same thing" dealbreaker.
- **🔐 Encrypted, hold-to-view photos**:
  - Photos are AES-256-GCM encrypted server-side and stored in a **private** bucket.
  - They're only decrypted by `/api/photos/...` for someone allowed to see that profile, with `no-store` caching.
  - On screen they're drawn into a `<canvas>` (never an `<img>`) only **while the viewer presses and holds**.
  - Each view is watermarked with the viewer's name and the time.
  - The photo is cleared instantly on release, app switch, window blur or screenshot shortcuts (PrintScreen / Cmd+Shift+3/4/5).
  - Photos are hidden when printing.
- **💌 Mutual likes**: a database trigger turns two-way likes into an accepted match automatically.
- **📱 Phone reveal on match**: numbers are only returned by `get_match_phone_number` for accepted matches.

> **Honest limitation:** no website can fully stop a phone's own screenshot button or someone photographing the screen with a second phone. Campus Hearts makes saving photos hard and makes any leak **traceable** through the watermark.

---

## 🛠️ Tech Stack

Campus Hearts is built with modern, production-ready technologies:

### Frontend Framework
- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.3](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript 5.x](https://www.typescriptlang.org/)** - Type-safe JavaScript

### UI & Styling
- **[Tailwind CSS 4.x](https://tailwindcss.com/)** - Utility-first CSS framework
- **[HeroUI/React 2.8.8](https://www.heroui.com/)** - Beautiful React component library
- **[Framer Motion 12.29.3](https://www.framer.com/motion/)** - Production-ready animation library
- **[GSAP 3.14.2](https://greensock.com/gsap/)** - Professional-grade animation platform

### Backend
- **[Supabase](https://supabase.com/)** - Postgres database, email-OTP Auth, Storage for profile photos, and Row Level Security to enforce who can see whom
- **[@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/nextjs)** - Session handling in Next.js Server Components and route proxy

### 3D & Graphics
- **[Three.js 0.182.0](https://threejs.org/)** - 3D graphics library
- **[@react-three/fiber 9.5.0](https://docs.pmnd.rs/react-three-fiber)** - React renderer for Three.js

### Development Tools
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing and optimization

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20.x or higher recommended)
- **npm** (v10.x or higher) or **yarn** / **pnpm** / **bun**
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jjf2009/CampusHearts.git
   cd CampusHearts
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up Supabase**

   Create a project at [supabase.com](https://supabase.com), then run these in the Supabase SQL editor, in order (or use `supabase db push`):
   - [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). Before running it, edit `is_college_email` to check your college's real email domain.
   - [`supabase/migrations/0002_freshers.sql`](./supabase/migrations/0002_freshers.sql): admission-letter verification, both-ways browsing, mutual matches, and private photo storage.

   > Photos uploaded before `0002` were stored unencrypted in a public bucket. Ask those users to re-upload their photos from the Profile page.

4. **Set up environment variables**

   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   # Server-only. Never expose this to the browser.
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Admission-letter checks: comma-separated names that appear on your college's letters
   COLLEGE_NAME_KEYWORDS=Goa College of Engineering,GEC
   ADMISSION_YEAR=2026

   # 32 random bytes, base64. Generate with: openssl rand -base64 32
   # Keep it safe: if you lose it, every stored photo becomes unreadable.
   PHOTO_ENCRYPTION_KEY=
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

The page will auto-reload when you make changes. You can start editing by modifying files in the `app` directory.

---

## 📁 Project Structure

```
CampusHearts/
├── app/                      # Next.js App Router directory
│   ├── (auth)/              # Auth routes (grouped)
│   │   ├── login/           # Email-OTP login/signup
│   │   └── signup/          # Redirects to /login (OTP handles both)
│   ├── (main)/              # Gated app routes (grouped, share AppNavbar)
│   │   ├── explore/         # Female-only swipe/explore feed
│   │   ├── requests/        # Male-only incoming love requests
│   │   └── matches/         # Accepted matches + phone reveal
│   ├── profile/             # Edit own profile
│   ├── profile-setup/       # First-time onboarding form
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Home page
│   ├── providers.tsx        # Global providers (theme, etc.)
│   └── globals.css          # Global styles
│
├── components/               # Reusable React components
│   ├── auth/                # Login component
│   ├── explore/              # Swipe deck
│   ├── requests/              # Love request list
│   ├── matches/                # Match list + phone reveal
│   ├── profile/                # Profile edit form
│   ├── home/                  # Landing page sections
│   ├── AppNavbar.tsx          # Nav for logged-in app routes
│   ├── Navbar.tsx             # Landing page navbar
│   └── Footer.tsx             # Footer component
│
├── lib/supabase/             # Supabase browser/server client helpers + shared types
├── supabase/migrations/      # SQL: schema, RLS policies, storage bucket, email gate
├── proxy.ts                  # Route protection (auth/gender/profile-completion gating)
│
├── public/                  # Static assets
│   └── CampusHeartLogo.png # Application logo
│
├── hero.ts                  # HeroUI configuration
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── postcss.config.mjs       # PostCSS configuration
├── eslint.config.mjs        # ESLint configuration
└── package.json             # Project dependencies
```

---

## 💻 Development

### Available Scripts

- **`npm run dev`** - Start development server at http://localhost:3000
- **`npm run build`** - Build the application for production
- **`npm run start`** - Start the production server
- **`npm run lint`** - Run ESLint to check code quality

### Code Quality

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Strict mode** enabled for better error catching

### Coding Guidelines

1. **Component Structure**
   - Use functional components with hooks
   - Keep components small and focused on a single responsibility
   - Use TypeScript for all new components

2. **Styling**
   - Use Tailwind CSS utility classes
   - Follow the established color palette (rose, peach, lavender, cream, blush)
   - Maintain consistent spacing and typography

3. **Animation**
   - Use Framer Motion for UI animations
   - Use GSAP for complex timeline animations
   - Keep animations subtle and purposeful

4. **File Organization**
   - Group related components in directories
   - Use route groups in the `app` directory for logical separation
   - Keep component files focused and maintainable

---

## 🎨 Design Philosophy

Campus Hearts follows a **warm, inviting, and calm** design aesthetic:

### Color Palette
- **Rose** (#F6B5BE) - Primary accent for love and connection
- **Peach** (#FFD7C2) - Warmth and friendliness
- **Lavender** (#E6D5F5) - Calm and serenity
- **Cream** (#FFF9F5) - Soft, neutral background
- **Charcoal** (#333333) - Readable text

### Typography
- **Font Family**: Serif for headings (elegance), Sans-serif for body (readability)
- **Font Weights**: Medium (500) for headings, Normal (400) for body

### Animations
- Smooth, intentional transitions
- Floating and fading effects for visual interest
- Staggered animations for list items
- Scroll-triggered animations for engagement

---

## 🚢 Deployment

### Deploy on Vercel (Recommended)

The easiest way to deploy Campus Hearts is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your repository to Vercel
3. Configure environment variables
4. Deploy!

Vercel automatically detects Next.js and configures the build settings.

### Other Deployment Options

- **[Netlify](https://www.netlify.com/)** - Alternative static hosting
- **[Railway](https://railway.app/)** - Full-stack deployment
- **[Docker](https://www.docker.com/)** - Containerized deployment

For detailed deployment instructions, check the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## 🤝 Contributing

We welcome contributions to Campus Hearts! Here's how you can help:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Test your changes thoroughly
- Update documentation as needed
- Be respectful and constructive in discussions

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ♿ Accessibility improvements
- 🌐 Internationalization

---

## 📚 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Next.js GitHub](https://github.com/vercel/next.js) - Feedback and contributions welcome

### Related Technologies
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

## 📄 License

This project is currently **private** and proprietary. All rights reserved.

For licensing inquiries, please contact the repository owner.

---

## 🙏 Acknowledgments

- Built with love for college students in Goa
- Inspired by the slow movement and intentional living
- Designed to bring back meaningful connections in the digital age

---

## 📞 Contact & Support

- **Repository**: [github.com/jjf2009/CampusHearts](https://github.com/jjf2009/CampusHearts)
- **Issues**: [Report a bug or request a feature](https://github.com/jjf2009/CampusHearts/issues)

---

<div align="center">
  <p><strong>Made with 💌 for genuine connections</strong></p>
  <p><em>Real connection takes time — and that's okay.</em></p>
</div>
