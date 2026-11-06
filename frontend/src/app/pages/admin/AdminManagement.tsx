import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminManagementProps {
  title: string;
  description: string;
  columns: string[];
  data: any[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function AdminManagement({ 
  title, 
  description, 
  columns, 
  data,
  onAdd,
  onEdit,
  onDelete 
}: AdminManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to deactivate this item?')) {
      onDelete?.(id);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              {title}
            </h1>
            <p className="text-gray-300">{description}</p>
          </div>
          {onAdd && (
            <Button 
              onClick={onAdd}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">All {title}</CardTitle>
            <CardDescription className="text-gray-400">
              Total: {data.length} items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    {columns.map((column) => (
                      <TableHead key={column} className="text-gray-400">
                        {column}
                      </TableHead>
                    ))}
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={item.id || index} className="border-white/10">
                      {columns.map((column, idx) => {
                          const key = column.toLowerCase().replace(/\s+/g, '_');
                          const value = item[key];

                          return (
                            <TableCell key={idx} className="text-gray-300">
                              {typeof value === 'boolean' ? (
                                <Badge className={value ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}>
                                  {value ? 'Yes' : 'No'}
                                </Badge>
                              ) : (
                                value?.toString() || '-'
                              )}
                            </TableCell>
                          );
                        })}
                      <TableCell>
                        <div className="flex gap-2">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(item.id)}
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-600/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-600/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
