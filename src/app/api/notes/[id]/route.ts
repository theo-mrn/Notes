import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer une note spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const note = await prisma.note.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la note:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, blocks, isPinned, isArchived, tags, categoryId } = body;

    // Vérifier que la note appartient à l'utilisateur
    const existingNote = await prisma.note.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note non trouvée" },
        { status: 404 }
      );
    }

    const updatedNote = await prisma.note.update({
      where: {
        id: id,
      },
      data: {
        title: title || existingNote.title,
        content: content !== undefined ? content : existingNote.content,
        blocks: blocks !== undefined ? blocks : existingNote.blocks,
        isPinned: isPinned !== undefined ? isPinned : existingNote.isPinned,
        isArchived: isArchived !== undefined ? isArchived : existingNote.isArchived,
        tags: tags !== undefined ? tags : existingNote.tags,
        categoryId: categoryId !== undefined ? categoryId : existingNote.categoryId,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      note: updatedNote,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la note:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Vérifier que la note appartient à l'utilisateur
    const existingNote = await prisma.note.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note non trouvée" },
        { status: 404 }
      );
    }

    await prisma.note.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Note supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la note:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}