import {Account, Client, Databases, Storage} from "appwrite";

export const appwriteConfig = {
    endpointUrl: import.meta.env.VITE_APPWRITE_API_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    apiKey: import.meta.env.VITE_APPWRITE_API_KEY,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    userCollectionId: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    tripCollectionId: import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID,
}

const client = new Client();

// Initialize the client
client
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

// Create a guest session for public access
const createAnonymousSession = async () => {
    try {
        const tempAccount = new Account(client);
        await tempAccount.createAnonymousSession();
    } catch (error) {
        console.error("Error creating anonymous session:", error);
    }
};

// Initialize anonymous session
createAnonymousSession();

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);

export { client, account, database, storage };