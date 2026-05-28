import { Link } from '@inertiajs/react';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import adminTicketsRoute from '@/routes/admin/tickets';

interface UnassignedAlertProps {
    unassignedCount: number;
}

export function UnassignedAlert({ unassignedCount }: UnassignedAlertProps) {
    if (unassignedCount <= 0) return null;

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive-foreground shadow-xs">
            <div className="p-2 bg-destructive/10 rounded-lg text-destructive flex-shrink-0">
                <ShieldAlert className="size-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-semibold text-sm leading-none text-foreground flex items-center gap-1.5">
                    Unassigned Workload Warning
                </h4>
                <p className="text-xs text-muted-foreground">
                    There are currently <span className="font-semibold text-foreground font-mono">{unassignedCount}</span> unassigned tickets waiting to be assigned to agents.
                </p>
                <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs font-semibold text-destructive hover:underline inline-flex items-center gap-1">
                    <Link href={`${adminTicketsRoute.index.url()}?status=open`}>
                        Go to Triage Queue
                        <ArrowRight className="size-3" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
