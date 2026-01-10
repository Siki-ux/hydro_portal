import { ProjectCard } from "@/components/ProjectCard";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";

async function getProjects() {
    const session = await auth();
    if (!session?.accessToken) return [];

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    try {
        const res = await fetch(`${apiUrl}/projects`, {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
            cache: 'no-store' // Ensure fresh data
        });

        if (!res.ok) throw new Error("Failed to fetch projects");

        return await res.json();
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
}

async function getProjectSensorCount(id: string, session: any) {
    if (!session?.accessToken) return 0;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    try {
        const res = await fetch(`${apiUrl}/projects/${id}/sensors`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store'
        });
        if (!res.ok) return 0;
        const sensors = await res.json();
        return sensors.length;
    } catch {
        return 0;
    }
}

export default async function ProjectsPage() {
    const session = await auth();
    const projects = await getProjects();

    // Fetch sensor counts in parallel
    const projectsWithCounts = await Promise.all(projects.map(async (project: any) => {
        const count = await getProjectSensorCount(project.id, session);
        return { ...project, sensorCount: count };
    }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Your Projects</h1>
                    <p className="text-white/60 mt-1">Manage and access your hydrological workspaces</p>
                </div>

                <Link
                    href="/projects/new"
                    className="flex items-center gap-2 px-4 py-2 bg-hydro-primary hover:bg-blue-600 rounded-lg font-medium text-white transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </Link>
            </div>

            {projectsWithCounts.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-white/60">No projects found. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projectsWithCounts.map((project: any) => (
                        <ProjectCard
                            key={project.id}
                            id={project.id}
                            name={project.name}
                            description={project.description || "No description"}
                            role={project.role || "Member"}
                            sensorCount={project.sensorCount}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
