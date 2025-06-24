
import { Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface NavbarProps {
  title: string;
  leftButton?: React.ReactNode;
}

export function Navbar({ title, leftButton }: NavbarProps) {
  return (
    <div className="bg-white shadow-sm p-4 transition-opacity duration-75 ease-in-out">
      <div className="flex items-center justify-between">
        {leftButton || <div />}
        <h1 className="text-xl font-semibold">{title}</h1>
        <SidebarTrigger className="h-8 w-8 p-1">
          <Menu className="h-6 w-6" />
        </SidebarTrigger>
      </div>
    </div>
  );
}
