import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les notes de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const sort = searchParams.get('sort') || 'updated';

    let orderBy: any = [
      { isPinned: "desc" },
      { updatedAt: "desc" },
    ];

    if (sort === 'recent') {
      orderBy = [{ updatedAt: "desc" }];
    } else if (sort === 'created') {
      orderBy = [{ createdAt: "desc" }];
    } else if (sort === 'title') {
      orderBy = [{ title: "asc" }];
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
      },
      orderBy,
      take: limit,
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Erreur lors de la récupération des notes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notes" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { title, content, blocks, categoryId, tags, isPinned, isPublic } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Titre et contenu requis" },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        blocks: blocks || null,
        tags: tags || [],
        isPinned: isPinned || false,
        isPublic: isPublic || false,
        userId: session.user.id,
        categoryId: categoryId || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la note:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la note" },
      { status: 500 }
    );
  }
} 