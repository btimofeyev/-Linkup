# IRLly: MVP Execution Plan

This document outlines the execution strategy for building the Minimum Viable Product (MVP) of IRLly. The plan is structured in sequential phases, from initial setup to launch and beyond.

## Project Roles:
- **Project Manager (PM)**: Owns the timeline, coordinates the team, and ensures deliverables meet PRD requirements.
- **UI/UX Designer**: Creates wireframes, high-fidelity mockups, and the overall user experience based on the design principles.
- **Backend Developer**: Implements the server-side logic, database, and APIs.
- **Frontend Developer (React Native)**: Builds the user-facing mobile application for iOS and Android.
- **QA Engineer**: Responsible for testing, bug reporting, and ensuring product quality.

**Estimated MVP Timeline: 12-16 weeks**

## Phase 0: Foundation & Design (Weeks 1-2)
**Goal**: Establish the technical and design foundation before development begins.

| Task ID | Task Name | Description | Lead | Deliverable(s) |
|---------|-----------|-------------|------|----------------|
| P0-T1 | Project Kickoff & Setup | Align team on the PRD. Set up project management (Jira/Trello), version control (GitHub), and communication channels (Slack). | PM | Configured project tools; Team alignment |
| P0-T2 | Technical Architecture | Finalize tech stack choices. Set up backend environment (Node.js, Express), database (PostgreSQL via Supabase), and push notification service (FCM). | Backend | Initialized code repositories; Deployed "Hello World" backend; DB schema v1 |
| P0-T3 | Database Schema Design | Design tables for Users, Contacts, Circles, Meetups (Pins & Scheduled), and RSVPs. Prioritize privacy by ensuring location data is not stored historically. | Backend | Finalized database schema diagram |
| P0-T4 | UI/UX Wireframing | Create low-fidelity wireframes for all core user flows: Onboarding, Feed, Drop a Pin, Schedule a Meetup, Circle Management. Focus on the "Quick UX" principle. | UI/UX | Complete set of wireframes |
| P0-T5 | High-Fidelity Mockups | Translate wireframes into high-fidelity designs, defining the visual identity, components, and interactions. Adhere to "Clutter-free" principle. | UI/UX | Figma/Sketch file with all MVP screens |

## Phase 1: User & Circle Management (Weeks 3-5)
**Goal**: Build the foundational social graph and user management features.

| Task ID | Task Name | Description | Lead | Dependencies |
|---------|-----------|-------------|------|--------------|
| P1-T1 | User Authentication | Implement user sign-up/login. Phone number authentication is recommended for a contact-based app. | Backend | P0-T2 |
| P1-T2 | Frontend Onboarding Flow | Build the sign-up/login screens and the flow for requesting contact permissions. | Frontend | P0-T5, P1-T1 |
| P1-T3 | Contact Import & Sync API | Develop backend logic to securely receive and sync user contacts after permission is granted. | Backend | P0-T3 |
| P1-T4 | Circle Management API | Create API endpoints for creating, viewing, updating, and deleting Circles and assigning contacts to them. | Backend | P0-T3 |
| P1-T5 | Frontend Circle Management | Build the UI for creating Circles (e.g., "Close Friends") and assigning imported contacts. | Frontend | P0-T5, P1-4 |

## Phase 2: Core Feature Implementation (Weeks 6-9)
**Goal**: Develop the two primary actions that define the IRLly experience.

| Task ID | Task Name | Description | Lead | Dependencies |
|---------|-----------|-------------|------|--------------|
| P2-T1 | "Drop a Pin" Backend | API to create a spontaneous meetup. Must handle location, note, emoji, visibility, and trigger a push notification. Implement auto-expiration logic (e.g., using a cron job or TTL index). | Backend | P1-T4, FCM Setup |
| P2-T2 | "Drop a Pin" Frontend | UI for sharing current location (integrating Google Maps/Mapbox SDK), adding a note, and selecting Circle visibility. | Frontend | P0-T5, P2-T1 |
| P2-T3 | "Schedule a Meetup" Backend | API to create a scheduled event. Store title, location, date/time, and visibility. Trigger initial and reminder notifications. | Backend | P1-T4, FCM Setup |
| P2-T4 | "Schedule a Meetup" Frontend | Build the "Plan Something" form with fields for title, location, date/time picker, and Circle visibility, as per the user journey. | Frontend | P0-T5, P2-T3 |
| P2-T5 | Push Notification Integration | Implement logic to send notifications via FCM for new pins and scheduled meetups to the correct Circles. | Backend | P2-T1, P2-T3 |

## Phase 3: The IRL Feed & Interaction (Weeks 10-11)
**Goal**: Tie all features together into a single, cohesive feed where users can see and respond to plans.

| Task ID | Task Name | Description | Lead | Dependencies |
|---------|-----------|-------------|------|--------------|
| P3-T1 | Feed API | Develop the primary API endpoint to fetch a user's feed, containing both Pins and Scheduled Meetups they have been invited to. Logic must sort by time proximity ("Happening Now" first). | Backend | P2-T1, P2-T3 |
| P3-T2 | Feed UI | Build the simple, time-sorted feed screen. Each item should be a tappable card. | Frontend | P0-T5, P3-T1 |
| P3-T3 | Meetup Detail View | On tapping a card, show details: location with a link to open in Maps, who posted, and RSVP options. | Frontend | P3-T2 |
| P3-T4 | RSVP API | Create backend endpoints for "I'm In" and "Can't Make It" responses. | Backend | P0-T3 |
| P3-T5 | Frontend RSVP Buttons | Integrate the quick reply buttons and connect them to the RSVP API. | Frontend | P3-T3, P3-T4 |

## Phase 4: Testing, Polish & Pre-Launch (Weeks 12-14)
**Goal**: Ensure a stable, bug-free, and polished MVP ready for public release.

| Task ID | Task Name | Description | Lead | Dependencies |
|---------|-----------|-------------|------|--------------|
| P4-T1 | End-to-End QA Testing | Execute test cases covering all user journeys, features, and privacy requirements on both iOS and Android devices. | QA | All previous phases |
| P4-T2 | Bug Fixing Sprint | Dedicated time for developers to address all high-priority bugs and issues reported by QA. | All Devs | P4-T1 |
| P4-T3 | Performance & Battery Test | Profile the app for performance bottlenecks and ensure location services are used efficiently to conserve battery. | Frontend | P4-T2 |
| P4-T4 | Analytics Integration | Integrate an analytics SDK to track the success metrics defined in the PRD (e.g., meetups per user, DAU interactions, retention). | Frontend | P4-T2 |
| P4-T5 | App Store Submission Prep | Prepare App Store & Google Play listings: screenshots, descriptions, privacy policy, and app icons. Submit for review. | PM / UI/UX | P4-T2 |

## Phase 5: Launch & Post-Launch (Weeks 15-16+)
**Goal**: Successfully launch the app, monitor its performance, and plan for the next iteration.

| Task ID | Task Name | Description |
|---------|-----------|-------------|
| P5-T1 | MVP Launch | Release the app to the public on the App Store and Google Play Store. |
| P5-T2 | Monitoring & Support | Actively monitor server health, crash reports (Sentry/Crashlytics), and analytics dashboards for the defined success metrics. |
| P5-T3 | Gather User Feedback | Establish channels for collecting user feedback (e.g., in-app form, email, social media). |
| P5-T4 | V1.1 Prioritization | Based on user feedback and success metrics, begin prioritizing the "Nice-to-Have" features (e.g., group polls, calendar sync) for the next development cycle. |

---

This execution plan provides a clear path forward. The key to success will be tight feedback loops between design and development, rigorous testing, and staying true to the core design principles of simplicity and speed.