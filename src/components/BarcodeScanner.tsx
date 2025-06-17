
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const { isScanning, lastScan, startScanning, stopScanning } = useBarcodeScanner();

  useEffect(() => {
    startScanning();
    return () => stopScanning();
  }, [startScanning, stopScanning]);

  useEffect(() => {
    if (lastScan) {
      onScan(lastScan.barcode);
    }
  }, [lastScan, onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md mx-4">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Scanner Area */}
        <div className="bg-white rounded-xl p-6 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              {isScanning ? (
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              ) : (
                <Camera className="h-10 w-10 text-blue-600" />
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-2">
              {isScanning ? 'Scanning...' : 'Ready to Scan'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {isScanning 
                ? 'Point your camera at a barcode' 
                : 'Tap the button below to start scanning'
              }
            </p>
          </div>

          {/* Mock Scanner Viewfinder */}
          <div className="relative mb-6">
            <div className="w-64 h-40 mx-auto border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
              <div className="text-gray-400">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Barcode Scanner View</p>
              </div>
            </div>
            
            {/* Scanning Line Animation */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-0.5 bg-red-500 animate-pulse"></div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={isScanning ? stopScanning : startScanning}
              className="flex-1"
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scan
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
