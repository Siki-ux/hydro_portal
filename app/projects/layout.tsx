import { AppHeader } from "@/components/AppHeader";
import { WaterBackground } from "@/components/WaterBackground";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProjectsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    return (
        <div className="relative min-h-screen bg-water-depth text-white font-[family-name:var(--font-geist-sans)]">
            <div className="fixed inset-0 z-0">
                <WaterBackground />
            </div>

            <AppHeader />

            <main className="relative z-10 pt-20 px-6 max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
}
