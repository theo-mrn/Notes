import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Récupérer toutes les statistiques en parallèle
    const [
      totalNotes,
      pinnedNotes,
      todaysNotes,
      categoriesCount,
      allNotes
    ] = await Promise.all([
      // Total des notes
      prisma.note.count({
        where: {
          userId,
          isArchived: false
        }
      }),
      
      // Notes épinglées
      prisma.note.count({
        where: {
          userId,
          isPinned: true,
          isArchived: false
        }
      }),
      
      // Notes créées aujourd'hui
      prisma.note.count({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // Nombre de catégories
      prisma.category.count({
        where: {
          userId
        }
      }),
      
      // Toutes les notes pour calculer les tags uniques
      prisma.note.findMany({
        where: {
          userId,
          isArchived: false
        },
        select: {
          tags: true
        }
      })
    ]);

    // Calculer le nombre de tags uniques
    const allTags = allNotes.reduce((acc, note) => {
      note.tags.forEach(tag => acc.add(tag));
      return acc;
    }, new Set<string>());

    const stats = {
      totalNotes,
      pinnedNotes,
      recentNotes: Math.min(totalNotes, 10), // Approximation
      categoriesCount,
      tagsCount: allTags.size,
      todaysNotes
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}