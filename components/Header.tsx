import { cn } from "~/lib/utils";
import { useLocation } from "react-router";
interface Props{
    title:String;
    description:String;
}
const Header = ({title, description}: Props) => {
    const location = useLocation();
  return (
    <div>
        <h1 className={cn("text-dark-100",
         location.pathname === '/' ? 'text-2xl md:text-4xl font-bold':
         'text-xl md:text-2xl font-semibold'

  )}>{title}</h1>
        <p className={cn("text-gray-100 font-normal",
         location.pathname === '/' ? 'text-base md:text-lg font-bold':
         'text-sm md:text-lg'

  )}>{description}</p>
    </div>
  )
}

export default Header
