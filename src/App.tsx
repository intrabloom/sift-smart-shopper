
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Home from "./pages/Home";
import ProfileSetup from "./pages/ProfileSetup";
import Profile from "./pages/Profile";
import Product from "./pages/Product";
import ShoppingList from "./pages/ShoppingList";
import ShoppingRoute from "./pages/Route";
import Stores from "./pages/Stores";
import StoreRoster from "./pages/StoreRoster";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/product/:barcode" element={<Product />} />
                <Route path="/shopping-list" element={<ShoppingList />} />
                <Route path="/route" element={<ShoppingRoute />} />
                <Route path="/search" element={<Product />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/store-roster" element={<StoreRoster />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <AppSidebar />
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
