
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Search, ShoppingCart, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleScan = () => {
    toast({
      title: "Scanner opened",
      description: "Point your camera at a barcode",
    });
    setTimeout(() => {
      const mockBarcode = "123456789012";
      navigate(`/product/${mockBarcode}`);
    }, 2000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
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

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Welcome back, {displayName}!</h1>
            <p className="text-sm text-gray-500">Let's find the best deals</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Scan Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Scan Product</h2>
          <Button
            onClick={handleScan}
            className="w-full bg-blue-600 hover:bg-blue-700 h-32 text-lg"
          >
            <Camera className="h-8 w-8 mr-3" />
            Scan Barcode
          </Button>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Search Products</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => navigate("/shopping-list")}
          >
            <ShoppingCart className="h-6 w-6 mb-2" />
            Shopping List
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => navigate("/stores")}
          >
            <Search className="h-6 w-6 mb-2" />
            Find Stores
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-around">
          <Button variant="ghost" className="flex-col h-auto py-2">
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-xs">Scan</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate("/shopping-list")}>
            <ShoppingCart className="h-5 w-5 mb-1" />
            <span className="text-xs">List</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate("/profile")}>
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
