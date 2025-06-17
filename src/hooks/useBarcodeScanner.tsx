
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ScanResult {
  barcode: string;
  timestamp: Date;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const startScanning = useCallback(() => {
    setIsScanning(true);
    
    // Mock barcode scanning - in production this would use camera
    toast({
      title: "Scanner active",
      description: "Point your camera at a barcode to scan",
    });

    // Simulate scanning delay
    setTimeout(() => {
      // Mock successful scan with random product
      const mockBarcodes = [
        '012345678901', // Organic Bananas
        '012345678902', // Whole Milk
        '012345678903', // Sourdough Bread
        '012345678904', // Greek Yogurt
        '012345678905', // Organic Spinach
        '012345678906'  // Almond Butter
      ];
      
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      const scanResult = {
        barcode: randomBarcode,
        timestamp: new Date()
      };
      
      setLastScan(scanResult);
      setIsScanning(false);
      
      toast({
        title: "Barcode scanned!",
        description: `Found product: ${randomBarcode}`,
      });
    }, 2000);
  }, [toast]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    lastScan,
    startScanning,
    stopScanning
  };
};
