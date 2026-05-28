import { Head, useForm } from '@inertiajs/react';
import {
    Calendar,
    Check,
    Cpu,
    Edit2,
    Globe,
    Laptop,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    Tag,
    Tags,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import categoriesRoute from '@/routes/admin/categories';

interface Category {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    categories: PaginatedData<Category>;
}

const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('hardware') || lowerName.includes('device') || lowerName.includes('computer') || lowerName.includes('screen') || lowerName.includes('monitor') || lowerName.includes('laptop')) {
        return { icon: Laptop, color: 'text-blue-500 bg-blue-500/8 border-blue-500/10' };
    }
    if (lowerName.includes('software') || lowerName.includes('bug') || lowerName.includes('app') || lowerName.includes('error') || lowerName.includes('crash') || lowerName.includes('code')) {
        return { icon: Terminal, color: 'text-amber-500 bg-amber-500/8 border-amber-500/10' };
    }
    if (lowerName.includes('network') || lowerName.includes('internet') || lowerName.includes('wifi') || lowerName.includes('server') || lowerName.includes('cloud')) {
        return { icon: Globe, color: 'text-emerald-500 bg-emerald-500/8 border-emerald-500/10' };
    }
    if (lowerName.includes('security') || lowerName.includes('login') || lowerName.includes('auth') || lowerName.includes('password') || lowerName.includes('account')) {
        return { icon: ShieldAlert, color: 'text-red-500 bg-red-500/8 border-red-500/10' };
    }
    if (lowerName.includes('billing') || lowerName.includes('payment') || lowerName.includes('invoice') || lowerName.includes('pricing') || lowerName.includes('subscription')) {
        return { icon: Cpu, color: 'text-violet-500 bg-violet-500/8 border-violet-500/10' };
    }
    return { icon: Tag, color: 'text-primary bg-primary/8 border-primary/10' };
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CategoriesIndex({ categories }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    // Save Form (Create & Update)
    const saveForm = useForm({
        name: '',
        description: '',
        is_active: '1', // string representation for select component
    });

    // Delete Form
    const deleteForm = useForm({});

    // Filter categories (client-side of currently paginated items)
    const filteredCategories = categories.data.filter((category) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            category.name.toLowerCase().includes(query) ||
            (category.description?.toLowerCase() || '').includes(query);

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && category.is_active) ||
            (statusFilter === 'inactive' && !category.is_active);

        return matchesSearch && matchesStatus;
    });

    const hasFilters = searchQuery || statusFilter !== 'all';

    const handleCreateClick = () => {
        setEditingCategory(null);
        saveForm.reset();
        saveForm.clearErrors();
        saveForm.setData({
            name: '',
            description: '',
            is_active: '1',
        });
        setIsSaveOpen(true);
    };

    const handleEditClick = (category: Category) => {
        setEditingCategory(category);
        saveForm.clearErrors();
        saveForm.setData({
            name: category.name,
            description: category.description || '',
            is_active: category.is_active ? '1' : '0',
        });
        setIsSaveOpen(true);
    };

    const handleDeleteClick = (category: Category) => {
        setDeletingCategory(category);
        setIsDeleteOpen(true);
    };

    const handleSaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategory) {
            saveForm.put(categoriesRoute.update.url(editingCategory.id), {
                onSuccess: () => {
                    setIsSaveOpen(false);
                    toast.success('Category updated successfully.');
                },
                onError: () => {
                    toast.error('Failed to update category.');
                },
            });
        } else {
            saveForm.post(categoriesRoute.store.url(), {
                onSuccess: () => {
                    setIsSaveOpen(false);
                    saveForm.reset();
                    toast.success('Category created successfully.');
                },
                onError: () => {
                    toast.error('Failed to create category.');
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!deletingCategory) {
            return;
        }

        deleteForm.delete(categoriesRoute.destroy.url(deletingCategory.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingCategory(null);
                toast.success('Category deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete category.');
            },
        });
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
    };

    return (
        <>
            <Head title="Categories Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Categories"
                        description="Manage help desk ticket categories for classifying issues."
                    />

                    <Button
                        onClick={handleCreateClick}
                        className="w-full sm:w-auto flex items-center gap-2 shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="size-4" />
                        Add Category
                    </Button>
                </div>

                {/* Filters Row */}
                <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative min-w-48 flex-1 max-w-md">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 pl-8 text-sm"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear button */}
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="h-8 gap-1.5 px-2.5 text-xs text-primary hover:bg-primary/8 hover:text-primary"
                            >
                                <RefreshCw className="size-3" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Categories Grid */}
                {filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-16 text-center bg-card/25">
                        <Tags className="size-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-base font-semibold">No categories found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                            {hasFilters ? 'Try adjusting your search or filters.' : 'Get started by creating a new category.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredCategories.map((category) => {
                                const catIcon = getCategoryIcon(category.name);
                                const IconComp = catIcon.icon;

                                return (
                                    <div
                                        key={category.id}
                                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sidebar-border hover:shadow-md"
                                    >
                                        {/* Dynamic Category Icon Badge + Status Tag */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className={`flex size-9 items-center justify-center rounded-xl border ${catIcon.color}`}>
                                                    <IconComp className="size-4.5" strokeWidth={2} />
                                                </span>

                                                {/* Pulsing Active State indicator */}
                                                {category.is_active ? (
                                                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/8 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <span className="relative flex h-1.5 w-1.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                        </span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 rounded-full bg-slate-500/8 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
                                                    {category.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-3 min-h-12 leading-relaxed">
                                                    {category.description || 'No description provided.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Bottom Action Footer */}
                                        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Calendar className="size-3.5 text-muted-foreground/60" />
                                                {formatDate(category.created_at)}
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(category)}
                                                    className="size-8 rounded-lg text-muted-foreground hover:bg-primary/8 hover:text-primary transition-all duration-150"
                                                    title="Edit Category"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(category)}
                                                    className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-all duration-150"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reusable Pagination Component */}
                        <div className="mt-6">
                            <Pagination links={categories.links} />
                        </div>
                    </>
                )}
            </div>

            {/* Save Modal Dialog (Create & Update) */}
            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSaveSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to {editingCategory ? 'update the' : 'create a new'} category.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={saveForm.data.name}
                                    onChange={(e) => saveForm.setData('name', e.target.value)}
                                    placeholder="e.g. Hardware Issues"
                                    required
                                />
                                {saveForm.errors.name && (
                                    <p className="text-xs text-destructive">{saveForm.errors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={saveForm.data.description}
                                    onChange={(e) => saveForm.setData('description', e.target.value)}
                                    placeholder="Describe the type of issues in this category"
                                    rows={3}
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {saveForm.errors.description && (
                                    <p className="text-xs text-destructive">{saveForm.errors.description}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="is_active">Status</Label>
                                <Select
                                    value={saveForm.data.is_active}
                                    onValueChange={(value) => saveForm.setData('is_active', value)}
                                >
                                    <SelectTrigger id="is_active">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Active</SelectItem>
                                        <SelectItem value="0">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                {saveForm.errors.is_active && (
                                    <p className="text-xs text-destructive">{saveForm.errors.is_active}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={saveForm.processing}>
                                {saveForm.processing ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the category{' '}
                            <strong className="text-foreground">"{deletingCategory?.name}"</strong>? This action
                            cannot be undone and will affect associated tickets.
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
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: '/admin/categories',
        },
    ],
};
