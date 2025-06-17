
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ProfileSetup = () => {
  const [zipCode, setZipCode] = useState("");
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const mockStores = [
    "Walmart", "Target", "Kroger", "Safeway", "Whole Foods", "Costco"
  ];

  useEffect(() => {
    const userData = localStorage.getItem("sift_user");
    if (!userData) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const toggleStore = (store: string) => {
    setFavoriteStores(prev => 
      prev.includes(store) 
        ? prev.filter(s => s !== store)
        : [...prev, store]
    );
  };

  const handleSave = () => {
    if (!zipCode.trim()) {
      toast({
        title: "Zip code required",
        description: "Please enter your zip code",
        variant: "destructive",
      });
      return;
    }

    const updatedUser = {
      ...user,
      zipCode,
      favoriteStores,
      profileComplete: true
    };

    localStorage.setItem("sift_user", JSON.stringify(updatedUser));
    
    toast({
      title: "Profile saved!",
      description: "Your preferences have been updated",
    });
    
    navigate("/home");
  };

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
          >
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
