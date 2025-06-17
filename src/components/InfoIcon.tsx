
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InfoIconProps {
  content: string;
  className?: string;
}

export const InfoIcon = ({ content, className = "" }: InfoIconProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors ${className}`}
          aria-label="More information"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="text-sm text-gray-700">{content}</p>
      </PopoverContent>
    </Popover>
  );
};
