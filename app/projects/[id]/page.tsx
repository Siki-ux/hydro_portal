import { auth } from "@/lib/auth";
import ProjectMap from "@/components/ProjectMap";
import { Sensor } from "@/types/sensor";
import { getApiUrl } from "@/lib/utils";

async function getProject(id: string) {
    const session = await auth();
    if (!session?.accessToken) return null;

    const apiUrl = getApiUrl();

    try {
        const res = await fetch(`${apiUrl}/projects/${id}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getProjectSensors(id: string) {
    const session = await auth();
    if (!session?.accessToken) return [];

    const apiUrl = getApiUrl();

    try {
        const res = await fetch(`${apiUrl}/projects/${id}/sensors`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return await res.json() as Sensor[];
    } catch {
        return [];
    }
}

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;
    const project = await getProject(id);
    const sensors = await getProjectSensors(id);

    if (!project) {
        return <div className="text-red-400">Project not found or access denied.</div>;
    }

    // Basic stats calculation
    const activeSensors = sensors.filter(s => s.status === 'active').length;

    // Fetch Active Alerts Count
    let activeAlertsCount = 0;
    try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/alerts/history/${id}?status=active&limit=1`, {
            headers: { Authorization: `Bearer ${session?.accessToken || ''}` },
            cache: 'no-store'
        });
        if (res.ok) {
            // If we fetch all active alerts, we get the count. 
            // Optimally we'd have a count endpoint, but for now fetching list is okay for MVP unless huge.
            // Wait, I passed limit=1? That won't give count.
            // Let's remove limit to get count, or use a separate logic.
            // Given "proper amount", fetch all active is safest for now (assuming <1000 active).
            const resAll = await fetch(`${apiUrl}/alerts/history/${id}?status=active`, {
                headers: { Authorization: `Bearer ${session?.accessToken || ''}` },
                cache: 'no-store'
            });
            if (resAll.ok) {
                const alerts = await resAll.json();
                activeAlertsCount = alerts.length;
            }
        }
    } catch (e) {
        console.error("Failed to fetch alert count", e);
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-white/60">{project.description || "No description provided."}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-4xl font-bold text-hydro-secondary mb-2">{sensors.length}</div>
                    <div className="text-sm text-white/50">Total Sensors</div>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-4xl font-bold text-green-400 mb-2">{activeSensors}</div>
                    <div className="text-sm text-white/50">Active Sensors</div>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-4xl font-bold text-orange-400 mb-2">{activeAlertsCount}</div>
                    <div className="text-sm text-white/50">Active Alerts</div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">Sensor Map</h2>
                <div className="h-[500px]">
                    <ProjectMap sensors={sensors} projectId={id} token={session?.accessToken || ""} className="h-full shadow-2xl" />
                </div>
            </div>
        </div>
    );
}
