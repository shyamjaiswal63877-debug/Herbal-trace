import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function QRCodeScanner({ onScan, onError, onClose }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      // Create a new reader instance
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Get available video input devices
      const videoInputDevices = await reader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera (usually the default one)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start decoding from the camera
      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const text = result.getText();
            onScan(text);
            stopScanning();
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('QR Code scanning error:', error);
            setError('Failed to scan QR code. Please try again.');
          }
        }
      );

      setHasPermission(true);
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setError(err.message || 'Failed to access camera');
      setIsScanning(false);
      setHasPermission(false);
      onError?.(err.message || 'Failed to access camera');
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const requestPermission = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setHasPermission(true);
      setError('');
    } catch (err: any) {
      setHasPermission(false);
      setError('Camera permission denied. Please allow camera access to scan QR codes.');
      onError?.('Camera permission denied');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-lg object-cover"
            playsInline
            muted
          />
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera preview will appear here</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          {hasPermission === null && (
            <Button onClick={requestPermission} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Allow Camera Access
            </Button>
          )}
          
          {hasPermission === true && !isScanning && (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          )}
          
          {isScanning && (
            <Button onClick={stopScanning} variant="destructive" className="flex-1">
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Scanning
            </Button>
          )}
          
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>Point your camera at a QR code to scan it automatically</p>
        </div>
      </CardContent>
    </Card>
  );
}
