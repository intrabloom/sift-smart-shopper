
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
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
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setDisplayName(parsedUser.displayName || "");
    setZipCode(parsedUser.zipCode || "");
    setFavoriteStores(parsedUser.favoriteStores || []);
  }, [navigate]);

  const toggleStore = (store: string) => {
    setFavoriteStores(prev => 
      prev.includes(store) 
        ? prev.filter(s => s !== store)
        : [...prev, store]
    );
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      displayName,
      zipCode,
      favoriteStores,
    };

    localStorage.setItem("sift_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    
    toast({
      title: "Profile updated!",
      description: "Your changes have been saved",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("sift_user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Favorite Stores</h3>
          <div className="grid grid-cols-2 gap-2">
            {mockStores.map((store) => (
              <Button
                key={store}
                variant={favoriteStores.includes(store) ? "default" : "outline"}
                className="h-auto py-3 text-sm"
                onClick={() => isEditing && toggleStore(store)}
                disabled={!isEditing}
              >
                {store}
              </Button>
            ))}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setDisplayName(user.displayName || "");
                setZipCode(user.zipCode || "");
                setFavoriteStores(user.favoriteStores || []);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
