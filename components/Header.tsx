import { cn } from "~/lib/utils";
import { useLocation, Link } from "react-router";

interface Props {
    title: string;
    description: string;
    ctaText?: string;
    ctaUrl?: string;
}

const Header = ({title, description, ctaText, ctaUrl}: Props) => {
    const location = useLocation();
    
    return (
        <div className="flex items-center justify-between w-full">
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
            
            {ctaText && ctaUrl && (
                <Link 
                    to={ctaUrl}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-primary-100 text-white rounded-lg hover:bg-primary-500 transition-colors"
                >
                    {ctaText}
                </Link>
            )}
        </div>
    );
}

export default Header
