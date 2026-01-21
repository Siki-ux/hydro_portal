
import { auth, parseJwt } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewProjectForm from "./form";

export default async function NewProjectPage() {
    const session = await auth();
    if (!session?.accessToken) {
        redirect("/login");
    }

    let userGroups: string[] = [];
    if (session.accessToken) {
        const decoded = parseJwt(session.accessToken);
        if (decoded) {
            const rawGroups = [];

            // Keycloak Groups
            if (decoded.groups) {
                if (Array.isArray(decoded.groups)) rawGroups.push(...decoded.groups);
                else rawGroups.push(decoded.groups);
            }

            // Realm Roles (also valid for authorization)
            if (decoded.realm_access && decoded.realm_access.roles) {
                rawGroups.push(...decoded.realm_access.roles);
            }

            // Deduplicate and sanitize
            const unique = new Set<string>();
            rawGroups.forEach((g: any) => {
                let s = String(g);

                if (s.startsWith("urn:geant:params:group:")) {
                    s = s.replace("urn:geant:params:group:", "");
                }

                // Remove leading slash from Keycloak group paths
                if (s.startsWith("/")) s = s.substring(1);

                // Filter out empty or effectively empty strings
                if (s && s.trim().length > 0) unique.add(s);
            });

            userGroups = Array.from(unique).sort();
        }
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
                <p className="text-white/60">Initialize a new workspace with Keycloak group and TimeIO integration.</p>
            </div>
            <NewProjectForm token={session.accessToken} groups={userGroups} />
        </div>
    );
}
