import { auth } from "@/lib/auth";
import ProjectMap from "@/components/ProjectMap";
import { Sensor } from "@/types/sensor";

async function getProject(id: string) {
    const session = await auth();
    if (!session?.accessToken) return null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

    // Check for alerts (mock logic for now or real if status reflects it)
    const alertSensors = sensors.filter(s => s.status !== 'active' && s.status !== 'inactive').length;

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
                    <div className="text-4xl font-bold text-orange-400 mb-2">{alertSensors}</div>
                    <div className="text-sm text-white/50">Alerts</div>
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
