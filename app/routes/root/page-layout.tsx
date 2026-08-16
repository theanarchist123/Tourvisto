import {Outlet, redirect, useNavigate} from "react-router";
import {getExistingUser, logoutUser, storeUserData} from "~/appwrite/auth";
import {account} from "~/appwrite/client";
import RootNavbar from "../../../components/RootNavbar";

export async function clientLoader() {
    try {
        const user = await account.get();

        if(!user.$id) return null;

        const existingUser = await getExistingUser(user.$id);
        return existingUser?.$id ? existingUser : await storeUserData();
    } catch (e: any) {
        // Appwrite throws 401 for guests, which is expected. Don't log it.
        if (e?.code !== 401) {
            console.error('Error fetching user:', e);
        }
        return null;
    }
}

const PageLayout = () => {
    return (
        <div className="bg-light-200">
            <RootNavbar />
            <Outlet />
        </div>
    )
}
export default PageLayout