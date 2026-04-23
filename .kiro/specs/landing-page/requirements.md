# Requirements Document

## Introduction

This feature adds a dedicated public-facing landing page (`landing.html`) for the **Intelligent Project Collaboration Platform** (branded as *SynergySphere*). The landing page is the first thing visitors see before reaching the login page. It must communicate the platform's value proposition with a high-impact, modern design — dark background, animated glows and floating orbs, gradient typography, a mock dashboard preview, a feature showcase, and a clear call-to-action that routes the user to the login page (`/pages/index.html`). The design language must be consistent with the existing UI: Plus Jakarta Sans typeface, indigo brand palette (`#5b57f5` / `#4a45df`), glassmorphism surfaces, and large rounded corners.

---

## Glossary

- **Landing_Page**: The standalone HTML page (`frontend/landing.html`) served as the entry point before authentication.
- **Login_Page**: The existing authentication page at `frontend/pages/index.html`.
- **CTA**: Call-to-action — a prominent button or link that directs the visitor to the Login_Page.
- **Hero_Section**: The full-viewport opening section of the Landing_Page containing the headline, sub-headline, CTA, and dashboard preview.
- **Navbar**: The fixed top navigation bar present on the Landing_Page.
- **Feature_Card**: An individual card in the features grid that highlights one platform capability.
- **Stats_Band**: A horizontal strip displaying key platform metrics (e.g., active teams, tasks completed).
- **Scroll_Animation**: A CSS/JS-driven animation that triggers when a section enters the viewport.
- **Brand_Palette**: The colour set defined in `style.css` — primary brand `#5b57f5`, deep `#4a45df`, light `#7b78ff`.
- **Gradient_Text**: Text rendered with a CSS `background-clip: text` gradient spanning indigo to sky-blue.

---

## Requirements

### Requirement 1: Landing Page Entry Point

**User Story:** As a visitor, I want to land on a visually impressive page before logging in, so that I immediately understand the platform's value and feel confident proceeding.

#### Acceptance Criteria

1. THE Landing_Page SHALL be served at the path `/landing.html` (i.e., `frontend/landing.html`).
2. WHEN a visitor navigates to the root of the frontend, THE Landing_Page SHALL be the first page displayed.
3. THE Landing_Page SHALL use the Plus Jakarta Sans typeface (loaded from Google Fonts) consistent with the rest of the application.
4. THE Landing_Page SHALL use the Brand_Palette (`#5b57f5`, `#4a45df`, `#7b78ff`) as the primary accent colours.
5. THE Landing_Page SHALL have a dark background (`#0b0d17`) to create visual contrast with the light-themed authenticated app.

---

### Requirement 2: Fixed Navigation Bar

**User Story:** As a visitor, I want a persistent navigation bar, so that I can always access the CTA and understand the product name regardless of scroll position.

#### Acceptance Criteria

1. THE Navbar SHALL be fixed to the top of the viewport and remain visible during scrolling.
2. THE Navbar SHALL display the SynergySphere brand badge (initials "SS" in an indigo gradient square) and the product name.
3. THE Navbar SHALL include anchor links to the Features section and the Stats_Band section on the same page.
4. THE Navbar SHALL include a CTA button labelled "Get Started" that navigates to the Login_Page.
5. WHEN the page is scrolled more than 20 pixels from the top, THE Navbar SHALL increase its background opacity to improve readability.
6. THE Navbar SHALL apply a `backdrop-filter: blur` effect to maintain legibility over page content.

---

### Requirement 3: Hero Section

**User Story:** As a visitor, I want a full-viewport hero section with a compelling headline and animated visuals, so that I immediately grasp the platform's purpose and feel excited to try it.

#### Acceptance Criteria

1. THE Hero_Section SHALL occupy at least 100vh of vertical space.
2. THE Hero_Section SHALL display a headline containing the product name "SynergySphere" with Gradient_Text applied to a key phrase.
3. THE Hero_Section SHALL display a sub-headline of no more than 25 words describing the platform's core benefit.
4. THE Hero_Section SHALL include a primary CTA button labelled "Start Collaborating" that navigates to the Login_Page.
5. THE Hero_Section SHALL include a secondary ghost-style button labelled "See Features" that smooth-scrolls to the features section.
6. THE Hero_Section SHALL render at least two animated floating orbs (radial-gradient circles) that move vertically using a CSS keyframe animation.
7. THE Hero_Section SHALL render a pulsing radial glow behind the headline using a CSS keyframe animation.
8. WHEN the Landing_Page first loads, THE Hero_Section content (badge, headline, sub-headline, buttons) SHALL animate in sequentially using staggered `fadeSlideDown` CSS animations with delays between 0s and 0.5s.
9. THE Hero_Section SHALL display a trust indicator row showing stacked avatar circles and a short social-proof label (e.g., "Trusted by 500+ teams").

---

### Requirement 4: Dashboard Preview Mockup

**User Story:** As a visitor, I want to see a realistic-looking preview of the dashboard UI, so that I can visualise what the product looks like before signing up.

#### Acceptance Criteria

1. THE Hero_Section SHALL include a browser-frame mockup below the CTA buttons that visually represents the SynergySphere dashboard.
2. THE Dashboard_Preview SHALL contain a simulated browser chrome (traffic-light dots, URL bar).
3. THE Dashboard_Preview SHALL render a two-column layout mirroring the real app shell: a sidebar with nav items and a main content area with stat cards and project cards.
4. THE Dashboard_Preview SHALL use muted dark colours (`rgba(255,255,255,0.03–0.06)`) for cards and panels to match the dark landing theme.
5. THE Dashboard_Preview SHALL have a radial glow beneath it to create a floating effect.
6. THE Dashboard_Preview SHALL animate in with a `fadeSlideDown` animation with a 0.5s delay on page load.

---

### Requirement 5: Stats Band

**User Story:** As a visitor, I want to see key platform metrics, so that I can quickly assess the platform's scale and credibility.

#### Acceptance Criteria

1. THE Stats_Band SHALL display exactly 4 metric items in a horizontal grid.
2. EACH metric item SHALL show a large numeric value and a short descriptive label.
3. THE Stats_Band SHALL use Gradient_Text for the numeric values.
4. THE Stats_Band SHALL be separated from adjacent sections by subtle horizontal borders (`rgba(255,255,255,0.06)`).
5. WHEN a Stats_Band metric item enters the viewport, THE Landing_Page SHALL trigger a count-up animation from 0 to the target value over 1.5 seconds using a JavaScript IntersectionObserver.

---

### Requirement 6: Features Section

**User Story:** As a visitor, I want to see the platform's key features presented clearly, so that I can evaluate whether it meets my team's needs.

#### Acceptance Criteria

1. THE Features section SHALL display a section label badge, a section title, and a sub-description above the feature grid.
2. THE Features section SHALL render at least 6 Feature_Cards in a 3-column responsive grid.
3. EACH Feature_Card SHALL display an icon (emoji or SVG), a feature name, and a 1–2 sentence description.
4. WHEN a visitor hovers over a Feature_Card, THE Feature_Card SHALL translate upward by 4px and increase its border opacity to `rgba(91,87,245,0.3)`.
5. WHEN a Feature_Card enters the viewport during scroll, THE Feature_Card SHALL animate in with a `fadeSlideUp` animation with a staggered delay based on its grid position.
6. THE Features section SHALL cover capabilities including: project management, task tracking, team collaboration, real-time notifications, role-based access, and AI-assisted planning.

---

### Requirement 7: Call-to-Action Section

**User Story:** As a visitor who has scrolled through the page, I want a final prominent CTA section, so that I am prompted to sign up after reviewing the features.

#### Acceptance Criteria

1. THE CTA section SHALL appear after the Features section and before the footer.
2. THE CTA section SHALL display a headline of no more than 10 words inviting the visitor to get started.
3. THE CTA section SHALL include a primary button labelled "Get Started Free" that navigates to the Login_Page.
4. THE CTA section SHALL have a background with a radial gradient glow centred on the section to draw visual focus.
5. WHEN the CTA section enters the viewport, THE CTA section SHALL animate in with a `fadeSlideUp` animation.

---

### Requirement 8: Footer

**User Story:** As a visitor, I want a footer with basic product information, so that the page feels complete and professional.

#### Acceptance Criteria

1. THE Landing_Page SHALL include a footer at the bottom of the page.
2. THE footer SHALL display the SynergySphere brand name and a short tagline.
3. THE footer SHALL display a copyright notice with the current year.
4. THE footer SHALL be separated from the CTA section by a subtle horizontal border.

---

### Requirement 9: Navigation to Login Page

**User Story:** As a visitor ready to sign in or sign up, I want every CTA on the landing page to take me directly to the login page, so that I can access the platform without confusion.

#### Acceptance Criteria

1. WHEN a visitor clicks any CTA button on the Landing_Page, THE Landing_Page SHALL navigate the browser to `/pages/index.html`.
2. THE navigation SHALL use standard `href` or `window.location.href` — no new tab SHALL be opened.
3. WHEN a visitor is already authenticated (a valid JWT token exists in `localStorage`), THE Landing_Page SHALL automatically redirect to the appropriate role dashboard without displaying the landing content.

---

### Requirement 10: Responsive Design

**User Story:** As a visitor on a mobile device, I want the landing page to display correctly on small screens, so that I have a good experience regardless of device.

#### Acceptance Criteria

1. THE Landing_Page SHALL be fully usable on viewport widths from 320px to 1920px.
2. WHEN the viewport width is 768px or less, THE Navbar links SHALL be hidden and only the brand and CTA button SHALL remain visible.
3. WHEN the viewport width is 768px or less, THE Features section grid SHALL collapse to a single column.
4. WHEN the viewport width is 768px or less, THE Stats_Band grid SHALL collapse to a 2-column layout.
5. WHEN the viewport width is 768px or less, THE Dashboard_Preview SHALL be hidden to avoid layout overflow.
6. THE Landing_Page SHALL use `clamp()` for all headline font sizes to scale fluidly between breakpoints.

---

### Requirement 12: Back to Landing Page Button on Login Page

**User Story:** As a visitor on the login page, I want a "Back" button that returns me to the landing page, so that I can review the product information again before signing in.

#### Acceptance Criteria

1. THE Login_Page (`frontend/pages/index.html`) SHALL display a back-navigation element (arrow icon + "Back to Home" label) in the top-left corner of the page.
2. WHEN a visitor clicks the back button, THE browser SHALL navigate to `../landing.html` (i.e., `frontend/landing.html`).
3. THE back button SHALL be styled to match the existing Login_Page design — subtle, unobtrusive, using the Brand_Palette accent colour on hover.
4. THE back button SHALL be visible on all viewport widths without overlapping the login card.
5. THE back button SHALL have a visible focus style for keyboard accessibility.

---

### Requirement 11: Performance and Accessibility

**User Story:** As a visitor, I want the landing page to load quickly and be accessible, so that I can use it regardless of my connection speed or assistive technology.

#### Acceptance Criteria

1. THE Landing_Page SHALL preconnect to `fonts.googleapis.com` and `fonts.gstatic.com` to reduce font load latency.
2. THE Landing_Page SHALL use semantic HTML elements (`<nav>`, `<section>`, `<footer>`, `<h1>`, `<h2>`, `<p>`) for screen-reader compatibility.
3. ALL interactive elements (buttons, links) on the Landing_Page SHALL have visible focus styles.
4. THE Landing_Page SHALL not depend on any external JavaScript libraries — all animations and interactions SHALL be implemented in vanilla JS.
5. ALL decorative animated elements (orbs, glows) SHALL use `pointer-events: none` so they do not interfere with user interaction.
