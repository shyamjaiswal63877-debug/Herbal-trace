import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { 
  QrCode, 
  Search, 
  MapPin, 
  Calendar, 
  Weight, 
  Leaf,
  User,
  FlaskConical,
  Factory,
  CheckCircle,
  Info,
  ExternalLink,
  Shield,
  ArrowLeft,
  Camera,
  Package,
  Thermometer,
  Clock,
  FileText
} from 'lucide-react';
import { log } from 'node:console';

// New data structures based on the API response
interface Stage {
  stage_type: number;
  metadata: any;
  timestamp: string;
  data_integrity: boolean;
  on_chain_verified: boolean;
}

interface BatchTraceData {
  batch_id: string;
  formatted_batch_id: string;
  stages: Stage[];
  summary: {
    total_stages: number;
    verified_stages: number;
    verification_status: string;
  };
}

// Stage-specific components
const StageIcon = ({ type }: { type: number }) => {
  const icons = {
    0: <Leaf className="w-5 h-5 text-green-600" />, // Collection
    1: <FlaskConical className="w-5 h-5 text-purple-600" />, // Quality Test
    2: <Factory className="w-5 h-5 text-orange-600" />, // Processing
  };
  return icons[type] || <Package className="w-5 h-5 text-gray-600" />;
};

const StageTitle = ({ type }: { type: number }) => {
  const titles = {
    0: 'Herb Collection',
    1: 'Quality Assurance Test',
    2: 'Product Manufacturing',
  };
  return <h4 className="font-semibold text-base sm:text-lg">{titles[type] || 'Unknown Stage'}</h4>;
};

const CollectionStage = ({ metadata }) => {
  let lat = null;
  let lng = null;
  let mapsUrl = null;

  if (metadata.geoLocation && typeof metadata.geoLocation === 'string') {
    const match = metadata.geoLocation.match(/LatLng\(lat: ([\d.-]+), lng: ([\d.-]+)\)/);
    if (match) {
      lat = parseFloat(match[1]).toFixed(6);
      lng = parseFloat(match[2]).toFixed(6);
      mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    }
  }

  return (
    <div className="mt-2 space-y-2 text-sm">
      <p><strong>Herb:</strong> {metadata.herbName}</p>
      <p><strong>Plant Part:</strong> {metadata.plantPart}</p>
      <p><strong>Quantity:</strong> {metadata.quantity} kg</p>
      <p><strong>Farmer ID:</strong> <span className="font-mono text-xs">{metadata.farmerId}</span></p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          {lat && lng ? (
            <span>{lat}, {lng}</span>
          ) : (
            <span>{metadata.geoLocation}</span>
          )}
        </div>
        {mapsUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1.5" />
              View on Map
            </a>
          </Button>
        )}
      </div>
      {metadata.imageUrl && (
        <a href={metadata.imageUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img src={metadata.imageUrl} alt="Collected herb" className="rounded-lg max-h-48" />
        </a>
      )}
    </div>
  );
};

const QualityTestStage = ({ metadata }) => {
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<string | null>(null);
  const { toast } = useToast();

  const checkLabReportHealth = async () => {
    if (!metadata.reportUrl) {
      toast({
        title: "No Lab Report Available",
        description: "This batch doesn't have a lab report URL attached.",
        variant: "destructive"
      });
      return;
    }

    setHealthCheckLoading(true);
    try {
      const response = await fetch('https://sihayurvedabe.vercel.app/api/ai/analyse-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl: metadata.reportUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze lab report');
      }

      const result = await response.json();
      setHealthResult(result.rating);
    } catch (error) {
      console.error('Error checking lab report health:', error);
      toast({
        title: "Error",
        description: "Failed to analyze lab report. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setHealthCheckLoading(false);
    }
  };

  return (
    <div className="mt-2 space-y-3 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
        <div className="space-y-1">
          <p className="font-medium text-muted-foreground">Location</p>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>
              {metadata.latitude?.toFixed(4)}, {metadata.longitude?.toFixed(4)}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-muted-foreground">Test Date</p>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>
              {new Date(metadata.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {metadata.reportUrl && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <a 
                href={metadata.reportUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center break-all"
              >
                View Lab Report
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <Button 
              onClick={checkLabReportHealth} 
              variant="outline" 
              size="sm"
              disabled={healthCheckLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm"
            >
              {healthCheckLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>Check Health</span>
                </>
              )}
            </Button>
          </div>
          
          {healthResult && (
            <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-md">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="font-medium text-green-800">
                  Health Status: <span className="capitalize">{healthResult}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProcessingStage = ({ metadata }) => (
  <div className="mt-2 space-y-2 text-sm">
    <p><strong>Product:</strong> {metadata.productName} ({metadata.dosageForm})</p>
    <p><strong>Units Produced:</strong> {metadata.units}</p>
    <p><strong>Manufacturing Date:</strong> {new Date(metadata.mfgDate).toLocaleDateString()}</p>
    <p><strong>Expiry Date:</strong> {new Date(metadata.expiryDate).toLocaleDateString()}</p>
    <p><strong>Processing Steps:</strong> {metadata.steps}</p>
    {metadata.notes && <p><strong>Notes:</strong> {metadata.notes}</p>}
  </div>
);

const StageContent = ({ stage }: { stage: Stage }) => {
  switch (stage.stage_type) {
    case 0: return <CollectionStage metadata={stage.metadata} />;
    case 1: return <QualityTestStage metadata={stage.metadata} />;
    case 2: return <ProcessingStage metadata={stage.metadata} />;
    default: return <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(stage.metadata, null, 2)}</pre>;
  }
};

export default function ConsumerPortal() {
  const [qrCode, setQrCode] = useState('');
  const [manualCode, setManualCode] = useState<string>('');

  const [traceData, setTraceData] = useState<BatchTraceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scanQRCode = async (code?: string) => {
    let searchCode = 0;
    if (manualCode && manualCode.trim() !== '') {
      const parsed = parseInt(manualCode.trim(), 10);
      if (!Number.isNaN(parsed)) {
        searchCode = parsed;
      }
    } else if (code) {
      try {
        const parsedFromQR = parseInt(JSON.parse(code).batchId, 10);
        if (!Number.isNaN(parsedFromQR)) {
          searchCode = parsedFromQR;
        }
      } catch (_) {
        // ignore parse errors; will trigger validation below
      }
    }
    if (!searchCode) {
      toast({ title: "Missing ID", description: "Please enter a Batch ID to search.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError('');
    setTraceData(null);
    setShowScanner(false);

    try {
      const response = await fetch(`https://sihayurvedabe.vercel.app/api/batches/batch-stages/${searchCode}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Batch not found');
      }

      const data: BatchTraceData = await response.json();
      setTraceData(data);
      toast({ title: "Search successful!", description: "Full traceability information loaded." });

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      toast({ title: "Search Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleScannerResult = (result: string) => {
    scanQRCode(result);
  };

  const handleScannerError = (error: string) => {
    toast({ title: "Scanner Error", description: error, variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-green-900 text-white px-4 sm:px-6 py-3 sm:py-4 border-b-4 border-yellow-400">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-0 sm:justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-yellow-400" />
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-center sm:text-left">HerbalTrace - Consumer Portal</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>Trace Your Product</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showScanner ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Input
                    className="w-full sm:flex-1"
                    placeholder="Enter Batch ID from product packaging"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && scanQRCode()}
                  />
                  <Button onClick={() => scanQRCode()} disabled={loading} className="flex items-center justify-center space-x-2 w-full sm:w-32">
                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Search className="w-4 h-4" /><span>Search</span></>}
                  </Button>
                </div>
                <div className="flex justify-center">
                  <Button onClick={() => setShowScanner(true)} variant="outline" className="flex w-full sm:w-auto items-center justify-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span>Use Camera to Scan QR</span>
                  </Button>
                </div>
              </div>
            ) : (
              <QRCodeScanner onScan={handleScannerResult} onError={handleScannerError} onClose={() => setShowScanner(false)} />
            )}
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">Error: {error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traceability Results */}
        {traceData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-primary" />
                    <span>Batch Journey: {traceData.formatted_batch_id}</span>
                  </div>
                  <Badge variant={traceData.summary.verification_status === 'VERIFIED' ? 'default' : 'destructive'}>
                    {traceData.summary.verification_status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-4 sm:pl-6">
                  {traceData.stages.map((stage, index) => (
                    <div key={index} className="relative pb-8">
                      {index < traceData.stages.length - 1 && (
                        <div className="absolute left-5 top-1 h-full w-0.5 bg-border"></div>
                      )}
                      <div className="flex items-start space-x-4">
                        <div className="relative z-10 w-10 h-10 bg-background rounded-full flex items-center justify-center border-2 border-primary/50">
                          <StageIcon type={stage.stage_type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <StageTitle type={stage.stage_type} />
                            <span className="text-[11px] sm:text-xs text-muted-foreground">{new Date(stage.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="p-4 border rounded-lg bg-muted/30">
                            <StageContent stage={stage} />
                            <div className="mt-3 pt-3 border-t border-dashed flex items-center justify-end space-x-4 text-xs">
                              <div className={`flex items-center space-x-1 ${stage.data_integrity ? 'text-green-600' : 'text-red-600'}`}>
                                <Shield size={14} />
                                <span>Data {stage.data_integrity ? 'Intact' : 'Compromised'}</span>
                              </div>
                              <div className={`flex items-center space-x-1 ${stage.on_chain_verified ? 'text-green-600' : 'text-gray-500'}`}>
                                <CheckCircle size={14} />
                                <span>{stage.on_chain_verified ? 'On-Chain Verified' : 'Not On-Chain'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Verification Summary */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <Shield className="w-5 h-5" />
                  <span>Blockchain Verification Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Overall Status:</strong> {traceData.summary.verification_status.replace('_', ' ')}</p>
                  <p><strong>Total Stages:</strong> {traceData.summary.total_stages}</p>
                  <p><strong>Verified Stages:</strong> {traceData.summary.verified_stages}</p>
                  <p className="text-muted-foreground pt-2">
                    This product's supply chain journey is recorded and verified for authenticity. Stages marked as 'On-Chain Verified' have their data permanently stored on a blockchain, ensuring it is immutable and trustworthy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}