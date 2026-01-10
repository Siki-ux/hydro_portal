# Hydro Portal

**Hydro Portal** is a highly customizable, modern frontend application designed for hydrological data analysis and visualization. It serves as the user interface for the **Water Data Platform (`water_dp`)**.

## Vision

The goal is to build a "Grafana-like" experience tailored for hydrology. Users can create personalized dashboards where they can mix and match:
-   **Interactive Maps**: Displaying River basins, water bodies, and custom regions (e.g., Czech Republic layers) using geospatial data.
-   **Time Series Charts**: Visualizing sensor data (Water level, discharge, precipitation) linked to map features.
-   **Computation Controls**: Widgets to upload and run Python analysis scripts on selected data.

The interface is built around **Drag-and-Drop** dashboards, where users can resize and rearrange widgets to suit their workflow.

## Features

-   **Authentication**: Secure login via Keycloak (SSO).
-   **Customizable Dashboards**:
    -   Create, Edit, and Share dashboards.
    -   Grid-based layout system (move and resize widgets).
    -   Persistence of user layouts to the backend.
-   **Widget Library**:
    -   **Map Widget**: Layer control, Region selection, GeoServer WMS integration.
    -   **Chart Widget**: Interactive time-series plots.
    -   **Script Widget**: Upload python scripts, trigger calculation jobs, view results.
-   **Data Integration**:
    -   Seamless Drill-down: Click a river on the map -> Open data in a Chart widget.
    -   Bulk Operations: Manage large datasets.
-   **Data Management**:
    -   **Unified Interface**: Manage physical **Sensors** and virtual **Datasets** in one place.
    -   **Easy Import**: Drag-and-drop CSV upload for creating new data series.
    -   **Smart Creation**: Context-aware "Add Sensor" vs "New Dataset" workflows.

## Technology Stack

We use a modern, performance-oriented stack to ensure a premium user experience ("Wow factor").

-   **Core Framework**: [React](https://react.dev/) (v18+) with [Vite](https://vitejs.dev/) (Fast build tool).
-   **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing for robustness).
-   **State Management**:
    -   [Zustand](https://github.com/pmndrs/zustand) (Global client state).
    -   [TanStack Query](https://tanstack.com/query/latest) (Server state / Async data caching).
-   **UI Component Library**: [Mantine](https://mantine.dev/) or [Shadcn/UI](https://ui.shadcn.com/).
    -   *Why?* Comprehensive components, modern aesthetics (Dark mode support), and accessible.
-   **Dashboard Layout**: [React-Grid-Layout](https://github.com/react-grid-layout/react-grid-layout).
    -   Enables the "Grafana-like" draggable/resizable grid system.
-   **Maps**: [React-Leaflet](https://react-leaflet.js.org/) or [MapLibre GL JS](https://maplibre.org/).
    -   *Recommendation*: MapLibre for vector tiles and performance, or Leaflet for simplicity with WMS. Given the "Premium" requirement, **MapLibre** is better for smooth vector interactions.
-   **Charts**: [Recharts](https://recharts.org/) or [Nivo](https://nivo.rocks/).
    -   SVG/Canvas based, highly customizable.
-   **Auth**: [NextAuth.js](https://next-auth.js.org/) (Secure authentication with Keycloak Provider).
    -   Handles session management, token refreshing, and server-side protection.

## Implementation Plan

### Phase 1: Foundation & Authentication
-   [ ] Initialize project (Vite + TS + ESLint + Prettier).
-   [ ] Configure Docker environment (Dockerfile, Compose).
-   [ ] Implement Keycloak Integration (Login/Logout, Token handling).
-   [ ] Create Basic App Layout (Sidebar, Header, Main Content Area).

### Phase 2: Dashboard Core
-   [ ] Implement Dashboard State Management (Zustand store).
-   [ ] Integrate `react-grid-layout`.
-   [ ] Create "Dashboard Editor" mode (Add/Remove widgets, Drag/Resize).
-   [ ] Connect to Backend API (`GET /dashboards`, `POST /dashboards`).

### Phase 3: The Map Widget (Geospatial)
-   [ ] Create generic Map Component.
-   [ ] Implement WMS Layer support (Connect to GeoServer).
-   [ ] Add "Region Selection" interaction (Click feature -> Select State).
## App Architecture & User Flow

The application follows a **Project-Centric** workflow:

1.  **Authentication**: Users sign in via `/auth/signin`.
2.  **Project Selection (`/projects`)**: The main landing page for logged-in users. Lists all projects the user is a member of.
3.  **Project Context (`/projects/[id]`)**: Once a project is selected, the user enters the project context.
    -   **Context Sidebar**: Provides access to project-specific resources:
        -   **Overview**: Project status and summary.
        -   **Dashboards**: Visualizations specific to this project.
        -   **Map**: Geospatial data for this project area.
        -   **Data**: Raw time-series data access.

## Getting Started
-   [ ] Implement "Layers Control" (Toggle Rivers, Districts, etc.).

### Phase 4: Data Visualization (Time Series)
-   [ ] Create Chart Widget.
-   [ ] Implement "Data Source" selector (Link to Map Selection or specific Station ID).
-   [ ] Fetch data from `water_dp` TimeSeries API.
-   [ ] Add Interactivity (Zoom, Pan, Tooltip).

### Phase 5: Advanced Features (Computations)
-   [ ] Create "Computation Control" Widget.
-   [ ] UI for Script Upload (`POST /computations/upload`).
-   [ ] UI for Job triggering and Status monitoring.
-   [ ] Visualization of Computation Results (if applicable).

### Phase 6: Polish & Optimization
-   [ ] Aesthetic refinements (Glassmorphism, Animations, Transitions).
-   [ ] Performance optimization (Lazy loading, Memoization).
-   [ ] Responsive Design checks.

## Development Setup

1.  **Prerequisites**: Node.js 20+, Docker.
2.  **Install**: `npm install`
3.  **Run Dev**: `npm run dev`
4.  **Build**: `npm run build`