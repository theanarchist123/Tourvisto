import React from 'react'
import {Link, useLoaderData, useLocation, useNavigate, useParams} from "react-router";
import {logoutUser} from "~/appwrite/auth";
import {cn} from "~/lib/utils";

const RootNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation()
    const params = useParams();
    const user = useLoaderData();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/sign-in')
    }

    return (
        <nav className={cn(location.pathname === `/travel/${params.tripId}` ? 'bg-white' : 'glassmorphism', 'w-full fixed z-50')}>
            <header className="root-nav wrapper">
                <Link to='/' className="link-logo">
                    <img src="/assets/icons/logo.svg" alt="logo" className="size-[30px]" />
                    <h1>Tourvisto</h1>
                </Link>

                <aside>
                    {user.status === 'admin' && (
                        <Link to="/dashboard" className={cn('text-base font-normal text-white', {"text-dark-100": location.pathname.startsWith('/travel')})}>
                            Admin Panel
                        </Link>
                    )}

                    {user?.imageUrl ? (
                        <img 
                            src={user.imageUrl} 
                            alt="user" 
                            className="rounded-full size-8 aspect-square object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/assets/images/david.webp';
                            }}
                        />
                    ) : (
                        <div 
                            className="rounded-full size-8 aspect-square flex items-center justify-center text-white text-sm font-semibold"
                            style={{
                                backgroundColor: `hsl(${user?.name?.charCodeAt(0) * 137.5 % 360}, 50%, 50%)`
                            }}
                        >
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    )}

                    <button onClick={handleLogout} className="cursor-pointer">
                        <img
                            src="/assets/icons/logout.svg"
                            alt="logout"
                            className="size-6 rotate-180"
                        />
                    </button>
                </aside>
            </header>
        </nav>
    )
}
export default RootNavbar