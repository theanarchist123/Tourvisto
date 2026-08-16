import { type ActionFunctionArgs } from "react-router";
import {GoogleGenerativeAI} from "@google/generative-ai";
import { parseMarkdownToJson } from "~/lib/utils";
import {appwriteConfig, database} from "~/appwrite/client";
import {ID} from "appwrite";


export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const {
            country,
            numberOfDays,
            travelStyle,
            interests,
            budget,
            groupType,
            userId,
        } = await request.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY environment variable is missing on the server." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY || "";

        const prompt = `Generate a ${numberOfDays}-day travel itinerary for ${country} based on the following user information:
        Budget: '${budget}'
        Interests: '${interests}'
        TravelStyle: '${travelStyle}'
        GroupType: '${groupType}'
        Return the itinerary and lowest estimated price in a clean JSON format with the following structure:
        {
        "name": "A descriptive title for the trip",
        "description": "A brief description of the trip and its highlights not exceeding 100 words",
        "estimatedPrice": "Lowest average price for the trip in USD, e.g.$price",
        "duration": ${numberOfDays},
        "budget": "${budget}",
        "travelStyle": "${travelStyle}",
        "country": "${country}",
        "interests": ${JSON.stringify(interests)},
        "groupType": "${groupType}",
        "bestTimeToVisit": [
          "🌸 Season (from month to month): reason to visit",
          "☀️ Season (from month to month): reason to visit",
          "🍁 Season (from month to month): reason to visit",
          "❄️ Season (from month to month): reason to visit"
        ],
        "weatherInfo": [
          "☀️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
          "🌦️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
          "🌧️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
          "❄️ Season: temperature range in Celsius (temperature range in Fahrenheit)"
        ],
        "location": {
          "city": "name of the city or region",
          "coordinates": [latitude, longitude],
          "openStreetMap": "link to open street map"
        },
        "itinerary": [
        {
          "day": 1,
          "location": "City/Region Name",
          "activities": [
            {"time": "Morning", "description": "🏰 Visit the local historic castle and enjoy a scenic walk"},
            {"time": "Afternoon", "description": "🖼️ Explore a famous art museum with a guided tour"},
            {"time": "Evening", "description": "🍷 Dine at a rooftop restaurant with local wine"}
          ]
        }
        ]
        }`;

        const flashModels = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];
        let textResult = null;

        for (const modelName of flashModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json",
                    },
                });
                textResult = await model.generateContent([prompt]);
                if (textResult) break;
            } catch (err: any) {
                console.warn(`Model ${modelName} failed, trying next model...`, err?.message);
            }
        }

        if (!textResult) {
            return new Response(
                JSON.stringify({ error: "Failed to generate content from Gemini Flash models." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const responseText = textResult.response.text();

        const trip = parseMarkdownToJson(responseText);

        if (!trip) {
            console.error("Failed to parse trip JSON from Gemini response:", responseText);
            return new Response(
                JSON.stringify({ error: "Failed to parse generated travel itinerary from AI response." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        let imageUrls: string[] = [];
        if (unsplashApiKey) {
            try {
                const searchQuery = encodeURIComponent(`${country} ${interests} ${travelStyle}`);
                const imageResponse = await fetch(
                    `https://api.unsplash.com/search/photos?query=${searchQuery}&client_id=${unsplashApiKey}`
                );
                if (imageResponse.ok) {
                    const imageData = await imageResponse.json();
                    imageUrls = (imageData.results || [])
                        .slice(0, 3)
                        .map((result: any) => result.urls?.regular || null)
                        .filter(Boolean);
                }
            } catch (imgError) {
                console.error("Unsplash fetch error:", imgError);
            }
        }

        const result = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.tripCollectionId,
            ID.unique(),
            {
                tripDetail: JSON.stringify(trip),
                createdAt: new Date().toISOString(),
                imageUrls,
                userId,
            }
        );

        return new Response(JSON.stringify({ id: result.$id }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        console.error("Error generating travel plan: ", e);
        return new Response(
            JSON.stringify({ error: e?.message || "An unexpected error occurred while generating trip" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};