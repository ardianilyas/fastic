import { Head, useForm } from '@inertiajs/react';
import {
    Calendar,
    Check,
    Edit2,
    MessageSquare,
    Plus,
    Search,
    Terminal,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import cannedResponsesRoute from '@/routes/admin/canned-responses';
import AppLayout from '@/layouts/app-layout';

interface CannedResponse {
    id: string;
    title: string;
    shortcut: string;
    body: string;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
}

interface Props {
    cannedResponses: PaginatedData<CannedResponse>;
}

export default function CannedResponsesIndex({ cannedResponses }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
    const [deletingResponse, setDeletingResponse] = useState<CannedResponse | null>(null);

    // Create Form
    const createForm = useForm({
        title: '',
        shortcut: '/',
        body: '',
    });

    // Edit Form
    const editForm = useForm({
        title: '',
        shortcut: '',
        body: '',
    });

    // Delete Form
    const deleteForm = useForm({});

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(cannedResponsesRoute.store.url(), {
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
                toast.success('Canned response created successfully!');
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors)[0] as string;
                toast.error(errorMessage || 'Failed to create canned response.');
            },
        });
    };

    const handleEditOpen = (response: CannedResponse) => {
        setEditingResponse(response);
        editForm.setData({
            title: response.title,
            shortcut: response.shortcut,
            body: response.body,
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingResponse) return;

        editForm.put(cannedResponsesRoute.update.url(editingResponse.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingResponse(null);
                toast.success('Canned response updated successfully!');
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors)[0] as string;
                toast.error(errorMessage || 'Failed to update canned response.');
            },
        });
    };

    const handleDeleteOpen = (response: CannedResponse) => {
        setDeletingResponse(response);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!deletingResponse) return;

        deleteForm.delete(cannedResponsesRoute.destroy.url(deletingResponse.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingResponse(null);
                toast.success('Canned response deleted successfully!');
            },
            onError: () => {
                toast.error('Failed to delete canned response.');
            },
        });
    };

    // Filter responses based on client search
    const filteredData = cannedResponses.data.filter(
        (resp) =>
            resp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resp.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resp.body.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={CannedResponsesIndex.layout.breadcrumbs}>
            <Head title="Canned Responses Management" />
            <div className="flex flex-col gap-6 px-6 py-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
                    <Heading
                        title="Canned Responses"
                        description="Manage predefined message templates to resolve user tickets swiftly."
                    />
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-xs bg-primary text-white hover:bg-primary/90">
                        <Plus className="size-4" />
                        New Template
                    </Button>
                </div>

                {/* Filters and Controls */}
                <div className="flex items-center gap-3 w-full max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/80" />
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full bg-surface-card"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Card/Table */}
                <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-xs">
                    {filteredData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="px-6 py-4">Template Title</th>
                                        <th className="px-6 py-4">Shortcut</th>
                                        <th className="px-6 py-4">Content Preview</th>
                                        <th className="px-6 py-4">Created At</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60 text-sm">
                                    {filteredData.map((response) => (
                                        <tr
                                            key={response.id}
                                            className="hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-semibold text-foreground">
                                                {response.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="secondary"
                                                    className="font-mono gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
                                                >
                                                    <Terminal className="size-3" />
                                                    {response.shortcut}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate text-muted-foreground">
                                                {response.body}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5">
                                                <Calendar className="size-3.5 text-muted-foreground/60" />
                                                {new Date(response.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/70"
                                                        onClick={() => handleEditOpen(response)}
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteOpen(response)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <MessageSquare className="size-12 text-muted-foreground/40 mb-3" />
                            <h3 className="text-lg font-semibold text-foreground">No canned responses found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                Create reply templates that support agents can instantly inject to save time.
                            </p>
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="mt-4 gap-2 bg-primary text-white hover:bg-primary/90"
                            >
                                <Plus className="size-4" />
                                Create your first template
                            </Button>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {cannedResponses.last_page > 1 && (
                    <div className="mt-4">
                        <Pagination meta={cannedResponses} />
                    </div>
                )}
            </div>

            {/* Create Dialog Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>New Canned Response</DialogTitle>
                        <DialogDescription>
                            Add a reply template with a custom trigger shortcut.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-title">Title</Label>
                            <Input
                                id="create-title"
                                placeholder="e.g. Thanks & Investigating"
                                value={createForm.data.title}
                                onChange={(e) => createForm.setData('title', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-shortcut">
                                Shortcut (must start with /)
                            </Label>
                            <Input
                                id="create-shortcut"
                                placeholder="e.g. /thanks"
                                value={createForm.data.shortcut}
                                onChange={(e) => createForm.setData('shortcut', e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Used to quickly insert this response. Try <code>/thanks</code> or <code>/solved</code>.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-body">Template Body</Label>
                            <textarea
                                id="create-body"
                                placeholder="Write template body here..."
                                rows={6}
                                value={createForm.data.body}
                                onChange={(e) => createForm.setData('body', e.target.value)}
                                required
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[150px] font-sans"
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                                className="bg-primary text-white hover:bg-primary/90"
                            >
                                {createForm.processing ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Edit Canned Response</DialogTitle>
                        <DialogDescription>
                            Update the reply template details.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                placeholder="e.g. Thanks & Investigating"
                                value={editForm.data.title}
                                onChange={(e) => editForm.setData('title', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-shortcut">
                                Shortcut (must start with /)
                            </Label>
                            <Input
                                id="edit-shortcut"
                                placeholder="e.g. /thanks"
                                value={editForm.data.shortcut}
                                onChange={(e) => editForm.setData('shortcut', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-body">Template Body</Label>
                            <textarea
                                id="edit-body"
                                placeholder="Write template body here..."
                                rows={6}
                                value={editForm.data.body}
                                onChange={(e) => editForm.setData('body', e.target.value)}
                                required
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[150px] font-sans"
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                                className="bg-primary text-white hover:bg-primary/90"
                            >
                                {editForm.processing ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the template{" "}
                            <strong className="text-foreground">"{deletingResponse?.title}"</strong>? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="mt-6 gap-2">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className={buttonVariants({ variant: 'destructive' })}
                            disabled={deleteForm.processing}
                        >
                            {deleteForm.processing ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

CannedResponsesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Canned Responses',
            href: '/admin/canned-responses',
        },
    ],
};
