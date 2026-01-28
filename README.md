# Paw Notes

> A centralized pet care journal for tracking veterinary visits, medications, grooming appointments, and health events in one place.

![Status](https://img.shields.io/badge/status-MVP%20Development-blue)
![Version](https://img.shields.io/badge/version-1.0.0--MVP-green)
![Node](https://img.shields.io/badge/node-22.14.0-brightgreen)

## 📋 Table of Contents

- [Project Description](#-project-description)
- [Tech Stack](#-tech-stack)
- [Getting Started Locally](#-getting-started-locally)
- [Available Scripts](#-available-scripts)
- [Project Scope](#-project-scope)
- [Project Status](#-project-status)
- [License](#-license)

## 📖 Project Description

**Paw Notes** is a web application designed to solve the common problem of scattered pet care information. Pet owners, especially those with pets requiring regular medical care, medications, and frequent specialist visits, often struggle with:

- **Information fragmentation** - notes stored in different places (phone notes, paper, memory, photos)
- **Lack of accessibility** - difficulty recalling exact dates of vaccinations, medications, or food changes during vet visits
- **Forgotten events** - important health incidents that fade from memory over time
- **Time-consuming systems** - complex management tools that take too long to use


## 🛠 Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Fast, content-focused web framework with minimal JavaScript
- **[React 19](https://react.dev/)** - Interactive UI components where needed
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe code with enhanced IDE support
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework for rapid styling
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible React component library

### Backend

- **[Supabase](https://supabase.com/)** - Backend-as-a-Service providing:
  - PostgreSQL database
  - Built-in authentication
  - Real-time subscriptions
  - RESTful API and SDK
  - Open-source with self-hosting options

### DevOps & Deployment

- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipelines
- **[DigitalOcean](https://www.digitalocean.com/)** - Application hosting via Docker containers

### Testing

- **[Vitest](https://vitest.dev/)** - Fast unit testing framework with native ESM support
- **[Testing Library](https://testing-library.com/)** - User-centric testing utilities for React components
- **[Happy-dom](https://github.com/capricorn86/happy-dom)** - Fast DOM environment for unit tests
- **[Playwright](https://playwright.dev/)** - End-to-end testing across multiple browsers
- **[MSW](https://mswjs.io/)** (Mock Service Worker) - API mocking for integration tests
- **[axe-core](https://github.com/dequelabs/axe-core)** - Automated accessibility testing (WCAG compliance)
- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** - Performance testing and Core Web Vitals monitoring

## 🚀 Getting Started Locally

### Prerequisites

- Node.js `22.14.0` (specified in `.nvmrc`)
- npm or yarn package manager
- Supabase account (free tier available)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/pet-care-app.git
cd pet-care-app
```

2. **Install Node.js version** (using nvm)

```bash
nvm install
nvm use
```

3. **Install dependencies**

```bash
npm install
```

4. **Start development server**

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build production-ready application |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Fix auto-fixable ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit and integration tests with Vitest |
| `npm run test:watch` | Run Vitest in watch mode for iterative feedback |
| `npm run test:unit` | Alias for `npm run test` to emphasize unit testing focus |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run test:e2e:headed` | Run Playwright in headed mode for debugging |
| `npm run test:e2e:codegen` | Launch Playwright Codegen to record flows |
| `npm run astro` | Run Astro CLI commands directly |
## 🧪 Testing

- **Unit + integration** – `npm run test` initializes the Vitest suite with `jsdom`, shared setup files, and coverage reports. Use `npm run test:watch` during development and `npm run test:unit` when you need an explicit unit-test run that mirrors `npm run test`.
- **End-to-end** – Playwright targets Chromium (Desktop Chrome) only; `npm run test:e2e` launches the server, reuses browser contexts, and records traces/screenshots under `tests/e2e/results`. Use `npm run test:e2e:headed` when you need a visible browser and `npm run test:e2e:codegen` to scaffold new flows.
- **Project structure** – Store reusable selectors and navigation logic in `tests/e2e/pages` (POM), keep screenshots under `tests/e2e/report`, and rely on Playwright hooks for setup/teardown so contexts stay isolated per test.
- **Testing library** – The global setup file (`tests/setup/vitest.setup.ts`) loads `@testing-library/jest-dom`, so component tests can use familiar matchers, while Vitest encourages `expectTypeOf` and `vi` helpers for typed, deterministic assertions.

### Development Workflow

```bash
# Start development
npm run dev

# Before committing
npm run lint        # Check for errors
npm run format      # Format code
npm run test        # Run unit tests

# Testing
npm run test        # Unit and integration tests
npm run test:e2e    # End-to-end tests

# Build for production
npm run build
npm run preview     # Test production build
```

## 📦 Project Scope

### ✅ MVP Features (In Scope)

**Authentication & Account Management**
- User registration (email + password)
- Login/logout functionality
- Session management via Supabase Auth
- No email verification in MVP (instant account activation)

**Pet Management**
- Add pet (name + species: Dog, Cat, Other)
- View pets list on dashboard (sorted alphabetically)
- Pet profile with care history
- Delete pet (with cascade deletion of all entries)

**Care Entry Management**
- Add care entry with 6 categories:
  - 🏥 Veterinary visit
  - 💊 Medications & supplements
  - ✂️ Groomer/barber
  - 🍖 Food
  - 🩹 Health incident
  - 📝 Note
- Required fields: category + date
- Optional: notes (max 1000 characters)
- View chronological history (newest first)
- Delete care entries

## 📊 Project Status

**Current Phase:** MVP Development (v1.0 Lean)

## 📄 License

This project does not currently have a license specified.

---

## 🤝 Contributing

This is an MVP project for educational purposes. Contributions, issues, and feature requests are welcome once the MVP is completed.

## 📧 Contact

For questions or feedback about this project, please open an issue in the GitHub repository.

---

**Built with ❤️ for pet owners who want to provide the best care for their companions.**
