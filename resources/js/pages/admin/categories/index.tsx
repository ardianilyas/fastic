import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Head, useForm } from '@inertiajs/react';
import { Check, Edit2, Plus, Search, Tags, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

export default function CategoriesIndex({ categories }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
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
        return (
            category.name.toLowerCase().includes(query) ||
            (category.description?.toLowerCase() || '').includes(query)
        );
    });

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

        const payload = {
            name: saveForm.data.name,
            description: saveForm.data.description,
            is_active: saveForm.data.is_active === '1',
        };

        if (editingCategory) {
            // Using Wayfinder routes instead of Ziggy global route helper to fix the frontend bug
            saveForm.put(categoriesRoute.update.url(editingCategory.id), {
                data: payload,
                onSuccess: () => {
                    setIsSaveOpen(false);
                    toast.success('Category updated successfully.');
                },
                onError: () => {
                    toast.error('Failed to update category.');
                },
            });
        } else {
            // Using Wayfinder routes instead of Ziggy global route helper to fix the frontend bug
            saveForm.post(categoriesRoute.store.url(), {
                data: payload,
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

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingCategory) return;

        // Using Wayfinder routes instead of Ziggy global route helper to fix the frontend bug
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
                        className="w-full sm:w-auto flex items-center gap-2 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="size-4" />
                        Add Category
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search categories on this page..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>

                {/* Categories Grid */}
                {filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card/20">
                        <Tags className="size-10 text-muted-foreground/60 mb-4" />
                        <h3 className="text-lg font-semibold">No categories found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                            {searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating a new category.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-md p-5 transition-all duration-300 hover:border-sidebar-border hover:shadow-md"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {category.name}
                                            </h3>
                                            <Badge
                                                variant={category.is_active ? 'default' : 'secondary'}
                                                className={`px-2 py-0.5 text-xs flex items-center gap-1 font-medium ${
                                                    category.is_active
                                                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10'
                                                        : ''
                                                }`}
                                            >
                                                {category.is_active ? (
                                                    <>
                                                        <Check className="size-3" /> Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="size-3" /> Inactive
                                                    </>
                                                )}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[40px]">
                                            {category.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                                        <span className="text-xs text-muted-foreground">
                                            Created {new Date(category.created_at).toLocaleDateString()}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(category)}
                                                className="size-8 text-muted-foreground hover:text-foreground"
                                                title="Edit Category"
                                            >
                                                <Edit2 className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(category)}
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                title="Delete Category"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                <Input
                                    id="description"
                                    value={saveForm.data.description}
                                    onChange={(e) => saveForm.setData('description', e.target.value)}
                                    placeholder="Describe the type of issues in this category"
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

            {/* Delete Modal Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <form onSubmit={handleDeleteSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-destructive">Delete Category</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the category{' '}
                                <strong className="text-foreground">"{deletingCategory?.name}"</strong>? This action
                                cannot be undone and will affect associated tickets.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="mt-6 gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" variant="destructive" disabled={deleteForm.processing}>
                                {deleteForm.processing ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
