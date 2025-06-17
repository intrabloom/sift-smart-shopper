
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Phone, Trash2, Plus, GripVertical } from 'lucide-react';
import { useStoreRoster } from '@/hooks/useStoreRoster';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  item: any;
  index: number;
  onRemove: (rosterId: string, storeName: string) => void;
}

const SortableItem = ({ id, item, index, onRemove }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className="flex items-center text-gray-400 mt-1 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{item.store.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    #{index + 1}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="text-sm">
                    {item.store.address}, {item.store.city}, {item.store.state} {item.store.zip_code}
                  </span>
                </div>
                
                {item.store.phone && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-sm">{item.store.phone}</span>
                  </div>
                )}
                
                {item.store.supported_apis && item.store.supported_apis.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.store.supported_apis.map((api: string) => (
                      <span
                        key={api}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                      >
                        {api.replace('_', ' ').replace('api', 'API')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(item.id, item.store.name)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StoreRoster = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { roster, loading, removeStoreFromRoster, updateStoreOrder } = useStoreRoster();
  const { toast } = useToast();
  const [items, setItems] = useState(roster);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setItems(roster);
  }, [roster]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update the preference order for all affected items
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        if (item.preference_order !== i) {
          await updateStoreOrder(item.id, i);
        }
      }

      toast({
        title: "Store order updated",
        description: "Your store preferences have been reordered",
      });
    }
  };

  const handleRemoveStore = async (rosterId: string, storeName: string) => {
    const success = await removeStoreFromRoster(rosterId);
    if (success) {
      toast({
        title: "Store removed",
        description: `${storeName} has been removed from your roster`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove store from roster",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/stores')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">My Store Roster</h1>
            <p className="text-sm text-gray-500">Manage your preferred stores ({roster.length})</p>
          </div>
          <Button onClick={() => navigate('/stores')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stores
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {roster.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <MapPin className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No stores in your roster</h3>
              <p className="text-gray-600 mb-4">
                Add stores to your roster to make shopping easier and get personalized recommendations
              </p>
              <Button onClick={() => navigate('/stores')}>
                <Plus className="h-4 w-4 mr-2" />
                Find Stores
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Pro Tip:</strong> Drag stores to reorder your preferences. Your roster helps us show you the best prices and optimize your shopping routes.
              </p>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                {items.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    item={item}
                    index={index}
                    onRemove={handleRemoveStore}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreRoster;
