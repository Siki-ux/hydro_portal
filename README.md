# Hydro Portal

**Hydro Portal** is a highly customizable, modern frontend application designed for hydrological data analysis and visualization. It serves as the user interface for the **Water Data Platform (`water_dp`)**.

## Vision

The goal is to build a "Grafana-like" experience tailored for hydrology. Users can create personalized dashboards where they can mix and match:
-   **Interactive Maps**: Displaying River basins, water bodies, and custom regions (e.g., Czech Republic layers) using geospatial data.
-   **Time Series Charts**: Visualizing sensor data (Water level, discharge, precipitation) linked to map features.
-   **Computation Controls**: Widgets to upload and run Python analysis scripts on selected data.

The interface is built around **Drag-and-Drop** dashboards, where users can resize and rearrange widgets to suit their workflow.

## Features (Implemented)

### 1. Core Platform
-   **Authentication**: Secure login via Keycloak (SSO).
-   **Project Management**:
    -   **Context Sidebar**: Quick navigation for Overview, Dashboards, Map, Data, Computations, and Alerts.
    -   **Overview**: Project status summary.

### 2. Data Visualization
-   **Interactive Map**:
    -   Displays Stations and Datasets.
    -   GeoServer WMS/WFS Integration.
    -   Dataset Filtering (e.g., Hide static datasets).
-   **Time Series Data**:
    -   Raw data viewer.
    -   Chart widgets in dashboards.

### 3. Computation Engine
-   **Script Management**: Upload `.py` scripts.
-   **Code Editor**: Built-in editor to view/modify computation logic.
-   **Execution**:
    -   Run scripts directly from the UI.
    -   **History**: View detailed execution logs and results.

### 4. Alerting System
-   **Rule Management**: Create custom alert rules (e.g., "Water Level > 5m").
-   **Test Triggers**: Manually trigger alerts for testing.
-   **History**: Audit log of all triggered alerts.

### 5. Technology Stack
-   **Core**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
-   **State**: [Zustand](https://github.com/pmndrs/zustand) + [TanStack Query](https://tanstack.com/query/latest).
-   **UI**: [Lucide Icons](https://lucide.dev/), Modern Dark Theme.
-   **Map**: [React-Leaflet](https://react-leaflet.js.org/).

## App Architecture & Navigation

The application follows a **Project-Centric** workflow:

1.  **Authentication**: Users sign in via `/auth/signin`.
2.  **Project Selection (`/projects`)**: The main landing page.
3.  **Project Context (`/projects/[id]`)**:
    -   **Overview**: Project summary.
    -   **Dashboards**: Customizable grid layouts.
    -   **Map**: Geospatial view.
    -   **Data**: Sensor and Dataset management.
    -   **Computations**: Python script execution and history.
    -   **Alerts**: Rule configuration and notifications.

## Development Setup

1.  **Prerequisites**: Node.js 20+, Docker.
2.  **Install**: `npm install`
3.  **Run Dev**: `npm run dev`
4.  **Build**: `npm run build`

## Roadmap

- [ ] **Dashboard Editor**: Drag-and-drop widget resizing (React-Grid-Layout integration).
- [ ] **Advanced Charts**: More visualization types (Heatmaps, Scatter plots).
- [ ] **Widget Library**: dedicated widgets for "Alert Status" or "Latest Computation Result".