import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const action = async ({ request }: { request: Request }) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { reviews, tripName } = await request.json();
        
        if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
            return Response.json({ error: 'No reviews to summarize' }, { status: 400 });
        }

        const prompt = `You are an intelligent travel AI. Below are user reviews for a trip called "${tripName}". 
Read all the reviews and their "vibes" and write a single, intelligent 1-2 sentence summary of what travelers thought overall. 
Keep it engaging and honest. Do not use markdown formatting.

Reviews:
${reviews.map((r: any) => `- Vibe: ${r.vibe} | Comment: ${r.comment}`).join('\n')}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5
            }
        });

        const summary = response.text?.trim() || "No summary could be generated.";

        return Response.json({ summary });
    } catch (error: any) {
        console.error('Error summarizing reviews:', error);
        return Response.json(
            { error: 'Failed to summarize reviews', details: error.message },
            { status: 500 }
        );
    }
};
