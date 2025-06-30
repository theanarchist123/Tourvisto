import { Query } from "appwrite";
import { database, appwriteConfig } from "~/appwrite/client";

export const action = async ({ params }: { params: { userId: string } }) => {
    try {
        const { userId } = params;
        
        if (!userId) {
            return Response.json({ error: "User ID is required" }, { status: 400 });
        }

        // First, find the user document by accountId using proper Query builder
        const { documents } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [
                Query.equal("accountId", userId)
            ]
        );

        if (documents.length === 0) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        const userDocument = documents[0];

        // Delete the user document from the database
        await database.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            userDocument.$id
        );

        return Response.json({ 
            success: true, 
            message: "User deleted successfully" 
        });

    } catch (error: any) {
        console.error("Error deleting user:", error);
        return Response.json(
            { 
                error: "Failed to delete user", 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
};
