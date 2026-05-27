import { Head, Link, Deferred, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import ticketsRoute from '@/routes/tickets';

// Import modular dashboard components
import { UnassignedAlert } from '@/components/dashboard/unassigned-alert';
import { StatsGrid, StatsSkeleton } from '@/components/dashboard/stats-grid';
import { PriorityBreakdownCard, PriorityBreakdownSkeleton } from '@/components/dashboard/priority-breakdown';
import { RecentTicketsCard, RecentTicketsSkeleton } from '@/components/dashboard/recent-tickets';
import { RecentActivityCard, RecentActivitySkeleton } from '@/components/dashboard/activity-timeline';

// --- TYPE DEFINITIONS ---

interface Category {
    id: string;
    name: string;
}

interface UserType {
    id: number;
    name: string;
}

interface TicketType {
    id: string;
    code: string;
    title: string;
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category_id: string;
    assigned_to: number | null;
    created_at: string;
    category: Category | null;
    assignee: UserType | null;
}

interface TicketTimeline {
    id: number;
    ticket_id: string;
    user_id: number;
    event: string;
    description: string;
    created_at: string;
    ticket: {
        id: string;
        code: string;
        title: string;
    } | null;
    user: {
        id: number;
        name: string;
    } | null;
}

interface DashboardProps {
    stats?: {
        total: number;
        open: number;
        in_progress: number;
        waiting: number;
        resolved: number;
        closed: number;
    };
    recentTickets?: TicketType[];
    recentActivity?: TicketTimeline[];
    priorityBreakdown?: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    unassignedCount?: number;
}

// --- MAIN EXPORT COMPONENT ---

export default function Dashboard({
    stats,
    recentTickets,
    recentActivity,
    priorityBreakdown,
    unassignedCount = 0,
}: DashboardProps) {
    const { auth } = usePage().props;
    const user = auth.user;
    const isAdmin = user?.role === 'admin';

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 overflow-y-auto">
                {/* Welcoming Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title={`Welcome back, ${user?.name}`}
                        description={
                            isAdmin
                                ? 'System administrator dashboard and ticket control board.'
                                : 'Check statistics, track, and manage your help desk request status.'
                        }
                    />

                    {!isAdmin && (
                        <Button asChild className="w-full sm:w-auto shadow-xs transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2">
                            <Link href={ticketsRoute.create.url()}>
                                <Plus className="size-4" />
                                New Support Ticket
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Unassigned Workload Alert Warning (Admin Only) */}
                {isAdmin && <UnassignedAlert unassignedCount={unassignedCount} />}

                {/* Stats Dashboard metrics Row */}
                <Deferred data="stats" fallback={<StatsSkeleton />}>
                    <StatsGrid stats={stats} />
                </Deferred>

                {/* Main Dashboard Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column: Recent Tickets List */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <Deferred data="recentTickets" fallback={<RecentTicketsSkeleton />}>
                            <RecentTicketsCard tickets={recentTickets} isAdmin={isAdmin} />
                        </Deferred>
                    </div>

                    {/* Right Column: Priority Breakdown and Activity Timeline */}
                    <div className="flex flex-col gap-6">
                        {/* Priority Breakdown (Admin Only) */}
                        {isAdmin && (
                            <Deferred data="priorityBreakdown" fallback={<PriorityBreakdownSkeleton />}>
                                <PriorityBreakdownCard breakdown={priorityBreakdown} />
                            </Deferred>
                        )}

                        {/* Recent Activity Timeline */}
                        <Deferred data="recentActivity" fallback={<RecentActivitySkeleton />}>
                            <RecentActivityCard activity={recentActivity} />
                        </Deferred>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
