import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY non configurée sur le serveur.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { action, payload } = body;
    const ai = new GoogleGenAI({ apiKey });

    switch (action) {
      case 'generateContent': {
        const { model = 'gemini-3-flash-preview', contents } = payload;
        const response = await ai.models.generateContent({
          model,
          contents,
        });
        return NextResponse.json({ text: response.text });
      }

      default:
        return NextResponse.json(
          { error: `Action '${action}' non reconnue.` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Erreur API Gemini Route Handler:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
