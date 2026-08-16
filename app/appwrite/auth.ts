import { ID, OAuthProvider, Query } from "appwrite";
import { account, database, appwriteConfig } from "~/appwrite/client";
import { redirect } from "react-router";

export const getExistingUser = async (id: string) => {
    try {
        const { documents, total } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", id)]
        );
        return total > 0 ? documents[0] : null;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};

export const storeUserData = async () => {
    try {
        const user = await account.get();
        if (!user) throw new Error("User not found");

        const { providerAccessToken } = (await account.getSession("current")) || {};
        const profilePicture = providerAccessToken
            ? await getGooglePicture(providerAccessToken)
            : null;

        try {
            const createdUser = await database.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                ID.unique(),
                {
                    accountId: user.$id,
                    email: user.email,
                    name: user.name,
                    imageUrl: profilePicture,
                    joinedAt: new Date().toISOString(),
                }
            );

            return createdUser;
        } catch (dbError) {
            console.warn("Could not save user to database collection, falling back to account object:", dbError);
            return {
                $id: user.$id,
                accountId: user.$id,
                email: user.email,
                name: user.name,
                imageUrl: profilePicture,
                joinedAt: new Date().toISOString(),
            };
        }
    } catch (error) {
        console.error("Error storing user data:", error);
        return null;
    }
};

const getGooglePicture = async (accessToken: string) => {
    try {
        const response = await fetch(
            "https://people.googleapis.com/v1/people/me?personFields=photos",
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) throw new Error("Failed to fetch Google profile picture");

        const { photos } = await response.json();
        return photos?.[0]?.url || null;
    } catch (error) {
        console.error("Error fetching Google picture:", error);
        return null;
    }
};

export const loginWithGoogle = async () => {
    try {
        // Get current origin at runtime to ensure it matches the registered domain
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 
            (import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5173');
        
        // Use createOAuth2Token for token-based session creation (bypasses 3rd party cookie blocking on Vercel)
        account.createOAuth2Token(
            OAuthProvider.Google,
            `${currentOrigin}/`,  // Success redirect URL
            `${currentOrigin}/sign-in`  // Failure redirect URL
        );
    } catch (error) {
        console.error("Error during OAuth2 token creation:", error);
    }
};

export const logoutUser = async () => {
    try {
        await account.deleteSession("current");
    } catch (error) {
        console.error("Error during logout:", error);
    }
};

export const getUser = async () => {
    try {
        const user = await account.get();
        if (!user || !user.$id) return null;

        try {
            const { documents } = await database.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [
                    Query.equal("accountId", user.$id),
                    Query.select(["name", "email", "imageUrl", "joinedAt", "accountId"]),
                ]
            );

            if (documents.length > 0) {
                return {
                    ...user,
                    ...documents[0],
                    $id: user.$id,
                    accountId: user.$id
                };
            }
        } catch (dbError) {
            // If database lookup fails, fall back to account object
        }

        return {
            $id: user.$id,
            accountId: user.$id,
            name: user.name,
            email: user.email,
        };
    } catch (error: any) {
        if (error?.code !== 401) {
            console.error("Error fetching user:", error);
        }
        return null;
    }
};

export const getAllUsers = async (limit: number, offset: number) => {
    try {
        const { documents: users, total } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.limit(limit), Query.offset(offset)]
        )

        if(total === 0) return { users: [], total };

        return { users, total };
    } catch (e) {
        console.log('Error fetching users')
        return { users: [], total: 0 }
    }
}