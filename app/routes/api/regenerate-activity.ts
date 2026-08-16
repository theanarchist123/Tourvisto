import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const action = async ({ request }: { request: Request }) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { currentActivity, location, tone } = await request.json();
        
        if (!currentActivity || !location || !tone) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const prompt = `You are a travel expert AI. Rewrite the following travel activity to make it more ${tone}. 
Location: ${location}
Current Time: ${currentActivity.time}
Current Description: ${currentActivity.description}

Output ONLY a raw JSON object (no markdown formatting, no backticks) with the keys:
"time" (keep it the same or adjust slightly if the tone requires it)
"description" (the rewritten description, keep it concise but engaging, around 1-2 sentences)

Example:
{"time": "09:00 AM", "description": "Embark on a thrilling morning hike up the rugged trails."}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7
            }
        });

        const text = response.text || "{}";
        const cleanedText = text.replace(/```json\n|\n```|```/g, '').trim();
        const newActivity = JSON.parse(cleanedText);

        return Response.json({ activity: newActivity });
    } catch (error: any) {
        console.error('Error regenerating activity:', error);
        return Response.json(
            { error: 'Failed to regenerate activity', details: error.message },
            { status: 500 }
        );
    }
};
