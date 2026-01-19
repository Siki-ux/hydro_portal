# Water DP - Hydro Portal (Frontend)

This is the user-facing dashboard built with Next.js, providing visualization for maps, charts, and data analysis.

## 📦 Services
*   **hydro_portal**: Next.js Application (Port 3000).

## 🚀 Quick Start

1.  **Configure Environment**:
    Ensure `.env` points to the correct API URLs (Localhost for browser, container names for server-side).
    ```bash
    cp env.example .env
    ```

2.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```

3.  **Access**:
    *   Dashboard: [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration
The frontend connects to multiple services:
*   **NEXT_PUBLIC_API_URL**: Connects to `water-dp-api` (Backend).
*   **NEXT_PUBLIC_GEOSERVER_URL**: Connects to `water-dp-geoserver`.
*   **Auth**: Redirects to `timeio-keycloak` for login.