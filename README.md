# HAYD — Health At Your Door

> **Prescription delivery, delivered on time.**  
> A modern, responsive healthcare logistics web application for regulated prescription collection and delivery services.

Recreated with pixel-perfection from the original Base44 app with complete standalone local React source code, components, routes, styles, and assets.

---

## 🌟 Key Features

- **Exact Design & Typography**: Built using Tailwind CSS, Radix UI primitives, Lucide React icons, and Google Fonts (*Plus Jakarta Sans* & *Inter*).
- **Multi-Route Navigation**:
  - **Home (`/`)**: Hero section, regulatory standards ticker, four-step logistics round, services overview, compliance controls, customer quotes, interactive accordion FAQ, and CTA.
  - **Services (`/services`)**: Pharmacy fulfilment, urgent runs, and cold-chain/controlled drug specifications.
  - **Partners (`/partners`)**: Information for superintendent pharmacists, compliance controls (MHRA / GDP), and partner onboarding flow.
  - **About (`/about`)**: Company background, operating mission, core statistics, and team values.
  - **Book a Collection (`/request`)**: Interactive 4-step wizard:
    1. *Paperwork*: File drag-and-drop upload (photos/PDFs) or skip for phone follow-up.
    2. *Details*: Patient information, requester, phone, and UK address.
    3. *Timing*: ASAP (under 4 hours), chosen time slot, scheduled date, or repeat frequencies.
    4. *Review & Confirmation*: Review summary with UK GDPR consent, reference generator (`HAYD-XXXXXX`), and one-click copy.
  - **Live Tracking (`/track`)**: Search delivery references with animated real-time status steps (*Request received*, *Pharmacist verification*, *Out for delivery*, *Delivered*). Comes with pre-configured demo reference `HAYD-8F2K9Q`.
  - **Contact (`/contact`)**: Categorized enquiry form (*Pharmacy*, *Patient/Carer*, *Existing*, *Other*), dispatch phone link, email, and operating hours.
  - **Legal (`/privacy`, `/terms`)**: Comprehensive UK GDPR privacy notice and full service terms.
- **Offline / Local Data Persistence**: Uses a clean, self-contained client-side storage adapter (`src/lib/storage.js`) that persists new delivery requests, messages, and tracking references to `localStorage`.
- **Local Assets**: All photography and brand icons are downloaded and served directly from `/public/images/`.

---

## 🚀 Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) + [Tailwind Animate](https://github.com/jamiebuilds/tailwindcss-animate)
- **UI Primitives**: [Radix UI](https://www.radix-ui.com/) (Accordion, Dialog/Sheet, Checkbox, Label)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utilities**: `clsx`, `tailwind-merge`, `class-variance-authority`

---

## 📁 Project Structure

```text
HAYD/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── public/
│   ├── manifest.json
│   └── images/
│       ├── logo.png
│       ├── hero-doorway.png
│       ├── cold-chain-pouch.png
│       ├── pharmacist-checking.png
│       ├── courier-door.png
│       └── dispatch-bench.png
└── src/
    ├── main.jsx                 # Application entry point
    ├── App.jsx                  # Route definitions
    ├── index.css                # Global design system tokens & Tailwind imports
    ├── components/
    │   ├── Header.jsx           # Sticky navigation header & mobile slide-out sheet
    │   ├── Footer.jsx           # Global footer with disclaimers and navigation
    │   ├── Layout.jsx           # Header + Outlet + Footer + Scroll-to-top
    │   ├── Logo.jsx             # SVG cross & door logo component
    │   ├── SharedSections.jsx   # PageHero & CallToAction banner
    │   └── ui/                  # Reusable UI primitives
    │       ├── accordion.jsx
    │       ├── checkbox.jsx
    │       ├── input.jsx
    │       ├── label.jsx
    │       └── sheet.jsx
    ├── lib/
    │   ├── storage.js           # Client-side storage & API mock adapter
    │   └── utils.js             # Tailwind classnames merger
    └── pages/
        ├── Home.jsx             # Homepage
        ├── Services.jsx         # Services overview
        ├── Partners.jsx         # Pharmacy partner portal
        ├── About.jsx            # About & team values
        ├── Request.jsx          # 4-step delivery booking wizard
        ├── Track.jsx            # Real-time order tracking
        ├── Contact.jsx          # Contact and dispatch enquiry form
        ├── Privacy.jsx          # Privacy policy (UK GDPR)
        ├── Terms.jsx            # Service terms
        └── NotFound.jsx         # 404 handler
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm**, **pnpm**, or **yarn**

### Installation

1. Navigate to the project directory:
   ```bash
   cd c:\Users\giwa0\Documents\HAYD
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```text
   http://localhost:5173
   ```

---

## 🧪 Testing the Features

- **Test Tracking**: Visit `/track` and search for the demo reference **`HAYD-8F2K9Q`** to view an active cold-chain route status.
- **Book a Delivery**: Go to `/request`, complete the steps, and hit *Send request*. You will receive a unique tracking code that immediately works on the `/track` page.
- **Contact Dispatch**: Go to `/contact`, select an enquiry type, and send a message. Submissions are saved locally.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 📄 License

Private commercial project for HAYD Ltd. All rights reserved.

