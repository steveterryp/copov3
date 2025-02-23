I want to build a modern full-stack project management tool for managing customer trials which are called Proof of Value (ie. PoV). The web app should function as a Progressive Web App (PWA) for mobile and desktop users, but it does not need offline support. The app should initially use a custom JWT-based authentication system but should be designed to easily transition to Okta SSO in the future. Here's what I need:_

---

#### **Frontend**

- **Framework**:
    
    - Use **Next.js with the App Router** and **React Server Components (RSC)** for server-side rendering.
    - Style the app with **Tailwind CSS**, ensuring **mobile responsiveness** for small screens and touch-friendly components.
- **UI Components**:
    
    - Include the following features:
        - **Dashboards** for tracking customer PoV's, tasks, and outcomes.
        - **Kanban boards** for task management with drag-and-drop functionality.
        - **Calendar views** for scheduling PoV phases.
        - **Reporting views** for PoV progress and success metrics.
    - Provide a clean, user-friendly layout optimized for both desktop and mobile users.
- **PWA Features**:
    
    - Add a **Web App Manifest** to enable installability on mobile and desktop devices.
        - Define app name, icons, theme color, and display mode (`standalone`).
    - Enable **add to home screen** functionality for mobile users.
    - Ensure **HTTPS** compliance (required for PWA features like installability).
- **Authentication**:

	- Use a custom JWT implementation for login and session handling.
	- Design the frontend to be compatible with future integration of **Okta SSO**:
    - Tokens (access and refresh) should be securely stored (e.g., in HTTP-only cookies or local storage).
    - Modularize authentication logic to handle token issuance and validation.

---

#### **Backend**

- **API Logic**:
    
    - Use **Next.js API routes** (`app/api/`) for:
        - Managing PoV's, tasks, and phases.
        - Providing APIs for frontend components (e.g., kanban boards, dashboards).
        - Periodically syncing Salesforce data via cron jobs.
- **Custom JWT Authentication**:

- Implement the following:
    - **Access Tokens**: Short-lived tokens for authorizing API requests.
    - **Refresh Tokens**: Long-lived tokens for obtaining new access tokens without re-authenticating.
    - Use the `jsonwebtoken` library to issue and validate tokens.
- Modularize the authentication logic so it can be replaced with Okta in the future.
- **Salesforce Integration**:
    
    - Use the Salesforce **REST API** to fetch data such as leads, accounts, or opportunities.
    - Sync updated records every 15 minutes using **node-cron** or similar scheduling tools.
    - Store Salesforce data in a **PostgreSQL** database, managed by **Prisma**.

---

#### **Middleware**

- Add middleware for:
    - **Authentication**: Use JWT-based authentication for securing API routes.
    - **Role-Based Access Control**: Restrict access based on user roles (e.g., project managers, engineers, customers).
    - **Logging**: Track API usage, user actions, and cron job executions.

---

#### **State Management**

- **Server State**:
    - Use **React Query (TanStack Query)** to handle server-side data fetching, caching, and synchronization with backend APIs.
- **Global State**:
    - Use **Zustand** for lightweight global state management, such as user authentication and app settings.

---

#### **Tools**

- **PWA-Specific**:
    
    - Implement a **Web App Manifest** to define installable app properties (name, icons, theme color, etc.).
    - Skip service workers and offline caching.
- **Frontend**:
    
    - Use **Tailwind CSS** for styling.
    - Leverage libraries like **React Beautiful DnD** for kanban boards and **Recharts** or **Chart.js** for data visualization.
- **Authentication**:

- Start with **custom JWT authentication** using `jsonwebtoken`.
- Prepare for future integration with **Okta SSO**:
    - Abstract token issuance and validation logic into a modular middleware.
    - Use environment variables to toggle between custom JWT and Okta during development or deployment.
- **Testing**:
    
    - Use **Jest** for unit testing and **Cypress** for end-to-end testing.

---

#### **Performance Optimization**

- Use **Next.js’s built-in optimizations**, including:
    - Dynamic imports for lazy loading components.
    - Built-in image optimization with `<Image>` components.

---

#### **Deployment**

- Deploy the app on **Vercel** with full PWA support (e.g., Web App Manifest, HTTPS).
- Set up **CI/CD pipelines** using **GitHub Actions** for testing and deployment.

---

#### **Monitoring and Analytics**

- **Sentry** for error tracking across web and PWA contexts.
- **Google Analytics** to track user behavior and app installs.

---

#### **Focus**

- Build a **scalable, responsive project management tool** for managing Proof of Value trials, with **basic PWA functionality** (installability without offline support).
- Leverage modern web technologies to create a mobile-friendly and desktop-friendly experience.
- Start with **custom JWT authentication**. Ensure the system can seamlessly transition to **Okta SSO** in the future without major architectural changes.