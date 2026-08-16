import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string): string => {
    return dayjs(dateString).format("MMMM DD, YYYY");
};

export function parseMarkdownToJson(markdownText: string): unknown | null {
    if (!markdownText) return null;

    // 1. Try extracting from markdown code block ```json ... ``` or ``` ... ```
    const codeBlockRegex = /```(?:json)?\s*([\s\S]+?)\s*```/i;
    const match = markdownText.match(codeBlockRegex);

    if (match && match[1]) {
        try {
            return JSON.parse(match[1].trim());
        } catch (error) {
            console.error("Error parsing JSON from code block:", error);
        }
    }

    // 2. Try extracting JSON object directly using { ... }
    const jsonObjectRegex = /\{[\s\S]*\}/;
    const jsonMatch = markdownText.match(jsonObjectRegex);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0].trim());
        } catch (error) {
            console.error("Error parsing raw JSON object:", error);
        }
    }

    // 3. Try parsing entire text directly
    try {
        return JSON.parse(markdownText.trim());
    } catch (error) {
        console.error("No valid JSON found in text.");
        return null;
    }
}

export function parseTripData(jsonString: string | undefined | null): Trip | null {
    // Validate input before attempting to parse
    if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
        return null;
    }

    try {
        const data: Trip = JSON.parse(jsonString);
        return data;
    } catch (error) {
        console.error("Failed to parse trip data:", error);
        console.error("Input was:", jsonString);
        return null;
    }
}

export function getFirstWord(input: string = ""): string {
    return input.trim().split(/\s+/)[0] || "";
}

export const calculateTrendPercentage = (
    countOfThisMonth: number,
    countOfLastMonth: number
): TrendResult => {
    if (countOfLastMonth === 0) {
        return countOfThisMonth === 0
            ? { trend: "no change", percentage: 0 }
            : { trend: "increment", percentage: 100 };
    }

    const change = countOfThisMonth - countOfLastMonth;
    const percentage = Math.abs((change / countOfLastMonth) * 100);

    if (change > 0) {
        return { trend: "increment", percentage };
    } else if (change < 0) {
        return { trend: "decrement", percentage };
    } else {
        return { trend: "no change", percentage: 0 };
    }
};

export const formatKey = (key: keyof TripFormData) => {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
};