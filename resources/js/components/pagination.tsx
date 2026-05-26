import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
    className?: string;
}

export function Pagination({ links, className = '' }: PaginationProps) {
    if (links.length <= 3) {
        return null; // Don't render if there's only 1 page (Prev, 1, Next)
    }

    return (
        <nav
            role="navigation"
            aria-label="Pagination Navigation"
            className={`flex items-center justify-center gap-1.5 py-4 ${className}`}
        >
            {links.map((link, key) => {
                // Clean up html entity labels like &laquo; and &raquo;
                let label = link.label;
                let icon: React.ReactNode = null;

                if (label.includes('Previous')) {
                    label = '';
                    icon = <ChevronLeft className="size-4" />;
                } else if (label.includes('Next')) {
                    label = '';
                    icon = <ChevronRight className="size-4 text-muted-foreground" />;
                }

                const isArrow = icon !== null;

                if (link.url === null) {
                    return (
                        <Button
                            key={key}
                            variant="ghost"
                            size={isArrow ? 'icon' : 'default'}
                            disabled
                            className={`pointer-events-none opacity-50 ${!isArrow ? 'min-w-9 h-9' : 'size-9'}`}
                        >
                            {icon || label}
                        </Button>
                    );
                }

                return (
                    <Button
                        key={key}
                        variant={link.active ? 'default' : 'outline'}
                        size={isArrow ? 'icon' : 'default'}
                        className={`${!isArrow ? 'min-w-9 h-9 px-3' : 'size-9'} transition-all duration-200`}
                        asChild
                    >
                        <Link
                            href={link.url}
                            preserveScroll
                            preserveState
                        >
                            {icon || label}
                        </Link>
                    </Button>
                );
            })}
        </nav>
    );
}
