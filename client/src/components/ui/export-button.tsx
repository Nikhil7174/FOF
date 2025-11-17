import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  onExportCSV: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  disabled?: boolean;
}

export function ExportButton({ onExportCSV, onExportExcel, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: "csv" | "excel", exportFn: () => Promise<void>) => {
    if (disabled || isExporting) return;
    
    setIsExporting(true);
    try {
      await exportFn();
      toast({
        title: "Export successful",
        description: `Data exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error?.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting} size="sm">
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport("csv", onExportCSV)}
          disabled={isExporting}
        >
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("excel", onExportExcel)}
          disabled={isExporting}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

