import { Link, NavLink, useLoaderData,useNavigate } from "react-router"
import { sidebarItems } from "~/constants"
import {cn} from "../app/lib/utils"
import { logoutUser } from "~/appwrite/auth";
const NavItems = ({handleClick }: {handleClick?: () => void}) => {
  const user = useLoaderData();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logoutUser();
    navigate('/sign-in');
  }


  return (
    <section className="nav-items">
      <Link to='/' className="link-logo">
      <img src="/assets/icons/logo.svg" alt="logo" className="size-[30px]"/>
      <h1>Tourvisto</h1>
      </Link>
<div className="container">
<nav>
    {sidebarItems.map(({id,href,icon,label})=>(
        <NavLink to={href} key={id}>
            {({ isActive }:{isActive:boolean})=>(
                <div className={cn('group nav-item',{
                  'bg-primary-100 !text-white': isActive,
                })} onClick={handleClick}>
                  <img
                    src={icon}
                    alt={label}
                    className={`group-hover:brightness-0 size-0 group-hover:invert ${isActive ? 'brightness-0 invert': 'text-dark-200'}`}
                  
                  />
                  {label}
                  </div>
            )}
        </NavLink>
    )
)}
</nav>

<footer className="nav-footer">
  {user?.imageUrl ? (
    <img 
      src={user.imageUrl} 
      alt={user?.name || 'User'} 
      className="rounded-full size-10 aspect-square object-cover"
      referrerPolicy="no-referrer"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = '/assets/images/david.webp';
      }}
    />
  ) : (
    <div 
      className="rounded-full size-10 aspect-square flex items-center justify-center text-white text-lg font-semibold"
      style={{
        backgroundColor: `hsl(${user?.name?.charCodeAt(0) * 137.5 % 360}, 50%, 50%)`
      }}
    >
      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
  )}

  <article>
    <h2>{user?.name}</h2>
    <p>{user?.email}</p>
  </article>

  <button
  onClick={handleLogout}
  className="cursor-pointer">
    <img src="/assets/icons/logout.svg" alt="logout" className="size-6"/>
    
  </button>
</footer>
</div>
     
    </section>
  )
}

export default NavItems
