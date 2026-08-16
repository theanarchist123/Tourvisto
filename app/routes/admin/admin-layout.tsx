import {Outlet, redirect} from "react-router";
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import {MobileSidebar, NavItems} from '../../../components';
import {account} from "~/appwrite/client";
import {getExistingUser, storeUserData} from "~/appwrite/auth";

export async function clientLoader() {
    try {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            const secret = urlParams.get('secret');

            if (userId && secret) {
                try {
                    await account.createSession(userId, secret);
                    const cleanUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                } catch (sessionErr) {
                    console.error('Error creating session from OAuth token:', sessionErr);
                }
            }
        }

        const user = await account.get();

        if(!user?.$id) return redirect('/sign-in');

        const existingUser = await getExistingUser(user.$id);

        if(existingUser?.status === 'user') {
            return redirect('/');
        }

        return existingUser?.$id ? existingUser : await storeUserData();
    } catch (e: any) {
        if (e?.code !== 401) {
            console.error('Error in admin clientLoader:', e);
        }
        return redirect('/sign-in');
    }
}

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <MobileSidebar />
      <aside className="w-full max-w-[270px] hidden lg:block">
        <SidebarComponent width={270} enableGestures={false}>
          <NavItems/>
        </SidebarComponent>
      </aside>
      <aside className="children">
        <Outlet />
      </aside>
    </div>
  )
}

export default AdminLayout
