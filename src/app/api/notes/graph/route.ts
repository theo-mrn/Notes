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

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        isArchived: false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        linksFrom: {
          select: {
            id: true,
            toId: true,
            label: true,
          },
        },
        linksTo: {
          select: {
            id: true,
            fromId: true,
            label: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du graphique:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}