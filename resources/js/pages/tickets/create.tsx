import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ticketsRoute from '@/routes/tickets';

interface Category {
    id: string;
    name: string;
}

interface Props {
    categories: Category[];
}

export default function TicketsCreate({ categories }: Props) {
    const form = useForm({
        category_id: '',
        title: '',
        description: '',
        priority: 'medium',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.post(ticketsRoute.store.url(), {
            onSuccess: () => {
                toast.success('Ticket submitted successfully.');
            },
            onError: () => {
                toast.error('Failed to submit ticket. Please check form errors.');
            },
        });
    };

    return (
        <>
            <Head title="Submit Support Ticket" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 max-w-3xl">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild className="size-8">
                        <Link href={ticketsRoute.index.url()}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <span className="text-sm text-muted-foreground">Back to list</span>
                </div>

                <div className="flex flex-col gap-4">
                    <Heading
                        title="Submit a Ticket"
                        description="Let us know what you need help with, and our team will get back to you shortly."
                    />
                </div>

                <Card className="border border-border bg-card/60 backdrop-blur-md mt-2 shadow-sm rounded-xl">
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <LifeBuoy className="size-4 text-primary" />
                            Ticket Information
                        </CardTitle>
                        <CardDescription>
                            Provide a clear title and details to help us debug faster.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Title */}
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="e.g. Cannot log in to the dashboard"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    required
                                    className="w-full"
                                />
                                {form.errors.title && (
                                    <p className="text-xs text-destructive">{form.errors.title}</p>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Category */}
                                <div className="grid gap-2">
                                    <Label htmlFor="category_id">Category</Label>
                                    <Select
                                        value={form.data.category_id}
                                        onValueChange={(value) => form.setData('category_id', value)}
                                    >
                                        <SelectTrigger id="category_id">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.category_id && (
                                        <p className="text-xs text-destructive">{form.errors.category_id}</p>
                                    )}
                                </div>

                                {/* Priority */}
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={form.data.priority}
                                        onValueChange={(value) => form.setData('priority', value)}
                                    >
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.errors.priority && (
                                        <p className="text-xs text-destructive">{form.errors.priority}</p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    placeholder="Describe your issue in detail. Add any steps to reproduce or error messages."
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    required
                                    rows={6}
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {form.errors.description && (
                                    <p className="text-xs text-destructive">{form.errors.description}</p>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={ticketsRoute.index.url()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Submitting...' : 'Submit Ticket'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TicketsCreate.layout = {
    breadcrumbs: [
        {
            title: 'Tickets',
            href: '/tickets',
        },
        {
            title: 'Submit Ticket',
            href: '/tickets/create',
        },
    ],
};
