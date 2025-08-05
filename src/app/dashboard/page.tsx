"use client";

import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkspaceOverview } from "@/components/dashboard/WorkspaceOverview";
import { NewNoteButton } from "@/components/notes/NewNoteButton";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleCreateNote = (type: string) => {
    console.log('Créer une nouvelle note de type:', type);
    // TODO: Implémenter la création de note avec type
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Veuillez vous connecter pour accéder au dashboard.</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <WorkspaceOverview />
      </div>
      
      <NewNoteButton onCreateNote={handleCreateNote} />
    </DashboardLayout>
  );
}