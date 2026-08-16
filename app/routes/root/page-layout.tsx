import {Outlet, redirect, useNavigate, useLoaderData} from "react-router";
import {getExistingUser, logoutUser, storeUserData} from "~/appwrite/auth";
import {account} from "~/appwrite/client";
import RootNavbar from "../../../components/RootNavbar";

export async function clientLoader() {
    try {
        // Exchange OAuth token for session if returning from Google OAuth redirect
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            const secret = urlParams.get('secret');

            if (userId && secret) {
                try {
                    await account.createSession(userId, secret);
                    // Remove userId and secret from the URL bar cleanly
                    const cleanUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                } catch (sessionErr) {
                    console.error('Error creating session from OAuth token:', sessionErr);
                }
            }
        }

        const user = await account.get();

        if(!user || !user.$id) return null;

        const existingUser = await getExistingUser(user.$id);
        if (existingUser?.$id) {
            return {
                ...user,
                ...existingUser,
                $id: user.$id,
                accountId: user.$id
            };
        }

        const newUser = await storeUserData();
        if (newUser?.$id) {
            return {
                ...user,
                ...newUser,
                $id: user.$id,
                accountId: user.$id
            };
        }

        // Fallback: If database document creation/lookup fails, return the authenticated account object!
        return {
            $id: user.$id,
            accountId: user.$id,
            name: user.name,
            email: user.email,
            status: (user as any).status || 'user'
        };
    } catch (e: any) {
        // Appwrite throws 401 for guests, which is expected. Don't log it.
        if (e?.code !== 401) {
            console.error('Error fetching user:', e);
        }
        return null;
    }
}

const PageLayout = () => {
    const user = useLoaderData();
    return (
        <div className="bg-light-200">
            <RootNavbar />
            <Outlet context={{ user }} />
        </div>
    )
}
export default PageLayout