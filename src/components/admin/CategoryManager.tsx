// Importing required hooks, components, and icons
import { useState, useEffect } from 'react';   
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the Category interface
interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

// Props for the CategoryManager component
interface CategoryManagerProps {
  onCategoryUpdated: () => void;
}

// Main Category Manager Component
export const CategoryManager = ({ onCategoryUpdated }: CategoryManagerProps) => {
  const { toast } = useToast();

  // Local state for categories, form, and UI control
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories(); 
  }, []);

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit handler for form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: 'Category Updated',
          description: 'The category has been updated successfully.'
        });
      } else {
        // Insert new category
        const { error } = await supabase
          .from('categories')
          .insert(formData);

        if (error) throw error;

        toast({
          title: 'Category Created',
          description: 'The new category has been created successfully.'
        });
      }

      // Reset state and refresh categories
      setShowDialog(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      await fetchCategories();
      onCategoryUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save category',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Set editing state and open dialog
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color
    });
    setShowDialog(true);
  };

  // Delete a category after confirmation
  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: 'Category Deleted',
        description: 'The category has been deleted successfully.'
      });

      await fetchCategories();
      onCategoryUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form and open create dialog
  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setShowDialog(true);
  };

  // Loading state if categories are still being fetched
  if (loading && categories.length === 0) {
    return <div className="text-center py-4">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with title and add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Category Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage ticket categories and their properties
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Table listing all categories */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Show message if no categories */}
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                // Map through categories
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Color dot + category name */}
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {category.description || 'No description'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {/* Color badge */}
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: category.color, color: category.color }}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {category.color}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* Format creation date */}
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Edit and Delete buttons */}
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for creating or editing category */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update the category information below.' 
                : 'Add a new category for organizing tickets.'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Category form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                {/* Color picker */}
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1 rounded"
                />
                {/* Hex code input */}
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Form buttons */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
