
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewProjectForm from "./form";

export default async function NewProjectPage() {
    const session = await auth();
    if (!session?.accessToken) {
        redirect("/login");
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
                <p className="text-white/60">Initialize a new workspace with Keycloak group and TimeIO integration.</p>
            </div>
            <NewProjectForm token={session.accessToken} />
        </div>
    );
}
