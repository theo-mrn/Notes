import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Créer un lien entre deux notes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { fromId, toId, label } = await request.json();

    if (!fromId || !toId) {
      return NextResponse.json(
        { error: "fromId et toId sont requis" },
        { status: 400 }
      );
    }

    if (fromId === toId) {
      return NextResponse.json(
        { error: "Une note ne peut pas être liée à elle-même" },
        { status: 400 }
      );
    }

    // Vérifier que les deux notes appartiennent à l'utilisateur
    const [fromNote, toNote] = await Promise.all([
      prisma.note.findFirst({
        where: { id: fromId, userId: session.user.id }
      }),
      prisma.note.findFirst({
        where: { id: toId, userId: session.user.id }
      })
    ]);

    if (!fromNote || !toNote) {
      return NextResponse.json(
        { error: "Une ou plusieurs notes n'existent pas" },
        { status: 404 }
      );
    }

    // Créer le lien (ou le mettre à jour s'il existe déjà)
    const link = await prisma.noteLink.upsert({
      where: {
        fromId_toId: {
          fromId,
          toId
        }
      },
      update: {
        label: label || null
      },
      create: {
        fromId,
        toId,
        label: label || null
      }
    });

    return NextResponse.json({
      success: true,
      link
    });
  } catch (error) {
    console.error("Erreur lors de la création du lien:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un lien
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');
    const fromId = searchParams.get('fromId');
    const toId = searchParams.get('toId');

    if (!linkId && (!fromId || !toId)) {
      return NextResponse.json(
        { error: "ID du lien ou fromId/toId requis" },
        { status: 400 }
      );
    }

    let whereClause: any;
    
    if (linkId) {
      whereClause = { id: linkId };
    } else {
      whereClause = {
        fromId_toId: {
          fromId: fromId!,
          toId: toId!
        }
      };
    }

    // Vérifier que le lien existe et appartient à l'utilisateur
    const link = await prisma.noteLink.findFirst({
      where: whereClause,
      include: {
        fromNote: { select: { userId: true } }
      }
    });

    if (!link || link.fromNote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lien non trouvé" },
        { status: 404 }
      );
    }

    await prisma.noteLink.delete({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      message: "Lien supprimé avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du lien:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}