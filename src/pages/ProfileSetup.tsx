
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

const ProfileSetup = () => {
  const [zipCode, setZipCode] = useState("");
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { updateProfile } = useProfile();

  const mockStores = [
    "Walmart", "Target", "Kroger", "Safeway", "Whole Foods", "Costco"
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const toggleStore = (store: string) => {
    setFavoriteStores(prev => 
      prev.includes(store) 
        ? prev.filter(s => s !== store)
        : [...prev, store]
    );
  };

  const handleSave = async () => {
    if (!zipCode.trim()) {
      toast({
        title: "Zip code required",
        description: "Please enter your zip code",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    const { error } = await updateProfile({
      zip_code: zipCode,
      favorite_stores: favoriteStores,
    });

    setSaving(false);

    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile saved!",
        description: "Your preferences have been updated",
      });
      navigate("/home");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Help us personalize your shopping experience</p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input
              id="zipCode"
              type="text"
              placeholder="12345"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Favorite Stores</Label>
            <p className="text-sm text-gray-500 mb-3">Select stores you shop at frequently</p>
            <div className="grid grid-cols-2 gap-2">
              {mockStores.map((store) => (
                <Button
                  key={store}
                  variant={favoriteStores.includes(store) ? "default" : "outline"}
                  className="h-auto py-3 text-sm"
                  onClick={() => toggleStore(store)}
                >
                  {store}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
