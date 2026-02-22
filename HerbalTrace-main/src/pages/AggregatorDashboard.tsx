import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createBlockchainRecord, generateQRCode } from '@/utils/blockchain';
import { 
  Package, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Weight, 
  Leaf,
  FlaskConical,
  Factory,
  QrCode,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Herb {
  id: string;
  botanical_name: string;
  local_name: string;
  conservation_status: string;
  approved_regions: string[];
}

interface CollectionEvent {
  id: string;
  collector: {
    profile: {
      full_name: string;
      location: string;
    };
  };
  herb: Herb;
  plant_part: string;
  quantity_kg: number;
  latitude: number;
  longitude: number;
  collection_timestamp: string;
  initial_condition: string;
}

interface Batch {
  id: string;
  batch_id: string;
  herb: Herb;
  total_quantity_kg: number;
  batch_status: string;
  creation_timestamp: string;
  quality_notes: string;
  storage_location: string;
  qr_code: string;
}

export default function AggregatorDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<CollectionEvent[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [collectors, setCollectors] = useState<Array<{ id: string; profile?: { id: string; full_name: string; location: string | null } | null; contact_details?: any }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [batchForm, setBatchForm] = useState({
    herb_id: '',
    plant_part: '',
    time_window: '' as 'today' | 'last_3_days' | 'last_7_days' | '',
    quality_notes: '',
    storage_location: '',
  });

  // Collector registration state
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string; email: string; role: string }>>([]);
  const [collectorForm, setCollectorForm] = useState({
    name: '',
    collector_type: 'farmer' as 'farmer' | 'wild_collector',
    aadhaar_id: '',
    cooperative_id: '',
    phone: '',
  });
  const [savingCollector, setSavingCollector] = useState(false);

  // Collection entry state
  const [collectionForm, setCollectionForm] = useState({
    collector_id: '',
    herb_id: '',
    plant_part: '',
    quantity_kg: '',
    latitude: '',
    longitude: '',
    initial_condition: '',
    storage_temp: '',
    storage_humidity: '',
    packaging: '',
    override_seasonal: false,
    override_reason: '',
  });
  const [savingCollection, setSavingCollection] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load collection events
      const { data: collectionsData } = await supabase
        .from('collection_events')
        .select(`
          *,
          collector:collectors(
            *,
            profile:profiles(*)
          ),
          herb:herbs(*)
        `)
        .order('collection_timestamp', { ascending: false });

      // Load batches created by this aggregator
      const { data: batchesData } = await supabase
        .from('batches')
        .select(`
          *,
          herb:herbs(*)
        `)
        .eq('aggregator_id', profile?.id)
        .order('creation_timestamp', { ascending: false });

      // Load herbs
      const { data: herbsData } = await supabase
        .from('herbs')
        .select('*')
        .order('local_name');

      // Load collectors with profile (via FK)
      const { data: collectorsData } = await supabase
        .from('collectors')
        .select('id, contact_details, profile:profiles!collectors_profile_id_fkey(id, full_name, location)')
        .order('created_at', { ascending: false });

      // Load existing farmer/wild collector profiles to link
      const { data: profileOptions } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['farmer', 'wild_collector'])
        .order('full_name');

      setCollections(collectionsData || []);
      setBatches(batchesData || []);
      setHerbs(herbsData || []);
      setCollectors(collectorsData as any || []);
      setProfiles(profileOptions || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const registerCollector = async () => {
    if (!collectorForm.name || !collectorForm.collector_type) {
      toast({
        title: 'Missing information',
        description: 'Please enter farmer name and collector type.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingCollector(true);
      const contact_details: any = { name: collectorForm.name };
      if (collectorForm.phone) contact_details.phone = collectorForm.phone;

      const { error } = await supabase.from('collectors').insert({
        // profile_id omitted intentionally for name-only registration
        collector_type: collectorForm.collector_type,
        aadhaar_id: collectorForm.aadhaar_id || null,
        cooperative_id: collectorForm.cooperative_id || null,
        contact_details,
      } as any);

      if (error) throw error;

      toast({
        title: 'Collector registered',
        description: 'The collector has been linked successfully.',
      });

      setCollectorForm({ name: '', collector_type: 'farmer', aadhaar_id: '', cooperative_id: '', phone: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error registering collector',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSavingCollector(false);
    }
  };

  const validateCompliance = async (params: {
    herbId: string;
    collectorId: string;
    quantityKg: number;
    latitude?: number;
    longitude?: number;
    overrideSeasonal?: boolean;
  }): Promise<{ ok: boolean; message?: string }> => {
    try {
      // Seasonal check using herb.harvest_season
      const herb = herbs.find(h => h.id === params.herbId) as any;
      if (!params.overrideSeasonal && herb?.harvest_season && Array.isArray(herb.harvest_season) && herb.harvest_season.length > 0) {
        const month = new Date().getMonth() + 1; // 1-12
        const inSeason = herb.harvest_season.includes(String(month));
        if (!inSeason) {
          return { ok: false, message: 'Seasonal restriction: current month not in approved harvest season.' };
        }
      }

      // Pull compliance rules for herb
      const { data: rules } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('herb_id', params.herbId)
        .eq('is_active', true);

      if (rules && rules.length > 0) {
        for (const rule of rules) {
          if (rule.rule_type === 'species_limit') {
            const maxPerDay = (rule.rule_parameters as any)?.max_quantity_per_day_kg;
            if (maxPerDay) {
              const start = new Date(); start.setHours(0,0,0,0);
              const end = new Date(); end.setHours(23,59,59,999);
              const { data: dayEvents } = await supabase
                .from('collection_events')
                .select('quantity_kg, collection_timestamp')
                .eq('collector_id', params.collectorId)
                .eq('herb_id', params.herbId)
                .gte('collection_timestamp', start.toISOString())
                .lte('collection_timestamp', end.toISOString());
              const used = (dayEvents || []).reduce((s, e: any) => s + Number(e.quantity_kg), 0);
              if (used + params.quantityKg > maxPerDay) {
                return { ok: false, message: 'Species-specific daily limit exceeded.' };
              }
            }
          }
          if (rule.rule_type === 'geofence') {
            const approvedRegions = (rule.rule_parameters as any)?.approved_regions as string[] | undefined;
            if (approvedRegions && approvedRegions.length > 0) {
              const collector = collectors.find(c => c.id === params.collectorId);
              const region = collector?.profile?.location || '';
              if (region && !approvedRegions.includes(region)) {
                return { ok: false, message: 'Geo-fencing validation failed: location not approved.' };
              }
            }
          }
          if (rule.rule_type === 'seasonal_restriction') {
            const allowedMonths = (rule.rule_parameters as any)?.allowed_months as string[] | undefined;
            if (allowedMonths && allowedMonths.length > 0) {
              const month = String(new Date().getMonth() + 1);
              if (!allowedMonths.includes(month)) {
                return { ok: false, message: 'Out-of-season entry blocked by compliance rule.' };
              }
            }
          }
        }
      }

      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  };

  const saveCollection = async () => {
    if (!collectionForm.collector_id || !collectionForm.herb_id || !collectionForm.plant_part || !collectionForm.quantity_kg) {
      toast({ title: 'Missing fields', description: 'Fill collector, herb, plant part, and quantity.', variant: 'destructive' });
      return;
    }

    const quantity = Number(collectionForm.quantity_kg);
    if (Number.isNaN(quantity) || quantity <= 0) {
      toast({ title: 'Invalid quantity', description: 'Quantity must be a positive number.', variant: 'destructive' });
      return;
    }

    setSavingCollection(true);
    try {
      const lat = collectionForm.latitude ? Number(collectionForm.latitude) : undefined;
      const lon = collectionForm.longitude ? Number(collectionForm.longitude) : undefined;
      const compliance = await validateCompliance({
        herbId: collectionForm.herb_id,
        collectorId: collectionForm.collector_id,
        quantityKg: quantity,
        latitude: lat,
        longitude: lon,
        overrideSeasonal: collectionForm.override_seasonal,
      });
      if (!compliance.ok && !collectionForm.override_seasonal) {
        toast({ title: 'Compliance failed', description: compliance.message, variant: 'destructive' });
        return;
      }

      const storage_conditions: any = {};
      if (collectionForm.storage_temp) storage_conditions.temperature_c = Number(collectionForm.storage_temp);
      if (collectionForm.storage_humidity) storage_conditions.humidity_pct = Number(collectionForm.storage_humidity);
      if (collectionForm.packaging) storage_conditions.packaging = collectionForm.packaging;

      const { data: inserted, error } = await supabase
        .from('collection_events')
        .insert({
          collector_id: collectionForm.collector_id,
          herb_id: collectionForm.herb_id,
          plant_part: collectionForm.plant_part,
          quantity_kg: quantity,
          latitude: lat ?? 0,
          longitude: lon ?? 0,
          initial_condition: collectionForm.initial_condition || 'fresh',
          harvest_season: new Date().toISOString().slice(0,7),
          storage_conditions: Object.keys(storage_conditions).length ? storage_conditions : null,
          compliance_validated: compliance.ok && !collectionForm.override_seasonal,
          environmental_data: collectionForm.override_seasonal && !compliance.ok ? { override_reason: collectionForm.override_reason || 'Seasonal override by aggregator' } : null,
        })
        .select()
        .single();
      if (error) throw error;

      await createBlockchainRecord('COLLECTION_RECORDED', {
        collection_event_id: inserted.id,
        herb_id: collectionForm.herb_id,
        quantity_kg: quantity,
      }, inserted.id);

      toast({ title: 'Collection saved', description: collectionForm.override_seasonal && !compliance.ok ? 'Saved with seasonal override.' : 'Herb collection entry recorded.' });

      setCollectionForm({
        collector_id: '', herb_id: '', plant_part: '', quantity_kg: '', latitude: '', longitude: '', initial_condition: '', storage_temp: '', storage_humidity: '', packaging: '', override_seasonal: false, override_reason: '',
      });
      loadData();
    } catch (e: any) {
      toast({ title: 'Error saving collection', description: e.message, variant: 'destructive' });
    } finally {
      setSavingCollection(false);
    }
  };

  const createBatch = async () => {
    if (!batchForm.herb_id || selectedCollections.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select herb type and at least one collection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedCollectionData = collections.filter(c => 
        selectedCollections.includes(c.id) && c.herb.id === batchForm.herb_id
      );

      if (selectedCollectionData.length === 0) {
        toast({
          title: "Invalid selection",
          description: "Selected collections don't match the chosen herb type.",
          variant: "destructive",
        });
        return;
      }

      const totalQuantity = selectedCollectionData.reduce((sum, c) => sum + Number(c.quantity_kg), 0);
      
      // Generate batch ID
      const batchId = `BATCH_${Date.now()}`;
      const qrCode = generateQRCode({ type: 'batch', batchId, herbId: batchForm.herb_id });

      // Create batch
      const { data: newBatch, error: batchError } = await supabase
        .from('batches')
        .insert({
          batch_id: batchId,
          herb_id: batchForm.herb_id,
          total_quantity_kg: totalQuantity,
          aggregator_id: profile?.id,
          quality_notes: batchForm.quality_notes,
          storage_location: batchForm.storage_location,
          qr_code: qrCode,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Create batch-collection mappings
      const batchCollections = selectedCollectionData.map(collection => ({
        batch_id: newBatch.id,
        collection_event_id: collection.id,
        contribution_percentage: (Number(collection.quantity_kg) / totalQuantity) * 100,
      }));

      const { error: mappingError } = await supabase
        .from('batch_collections')
        .insert(batchCollections);

      if (mappingError) throw mappingError;

      // Create blockchain record
      await createBlockchainRecord('BATCH_CREATED', {
        batch_id: batchId,
        herb_id: batchForm.herb_id,
        total_quantity_kg: totalQuantity,
        collections: selectedCollections.length,
        aggregator_id: profile?.id,
      }, newBatch.id);

      toast({
        title: "Batch created successfully!",
        description: `Batch ${batchId} has been created with ${selectedCollections.length} collections.`,
      });

      // Reset form
      setBatchForm({ herb_id: '', plant_part: '', time_window: '', quality_notes: '', storage_location: '' });
      setSelectedCollections([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error creating batch",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendToLab = async (batchId: string) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ batch_status: 'lab_testing' })
        .eq('id', batchId);

      if (error) throw error;

      // Create blockchain record
      await createBlockchainRecord('BATCH_SENT_TO_LAB', {
        batch_id: batchId,
        status: 'lab_testing',
      }, batchId);

      toast({
        title: "Batch sent to lab",
        description: "The batch has been marked for lab testing.",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error updating batch",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      created: { variant: 'secondary' as const, icon: Package },
      lab_testing: { variant: 'default' as const, icon: FlaskConical },
      approved: { variant: 'default' as const, icon: CheckCircle },
      rejected: { variant: 'destructive' as const, icon: AlertCircle },
      dispatched: { variant: 'outline' as const, icon: Factory },
      sold: { variant: 'default' as const, icon: QrCode },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.created;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const availableCollections = collections.filter(c => 
    !batches.some(b => 
      b.herb.id === c.herb.id && 
      selectedCollections.includes(c.id)
    )
  );

//   const filteredCollections = batchForm.herb_id 
//     ? availableCollections.filter(c => c.herb.id === batchForm.herb_id)
//     : [];

const filteredCollections = batchForm.herb_id 
  ? collections.filter(c => {
      if (c.herb.id !== batchForm.herb_id) return false;
      if (batchForm.plant_part && c.plant_part !== batchForm.plant_part) return false;
      if (batchForm.time_window) {
        const ts = new Date(c.collection_timestamp).getTime();
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        if (batchForm.time_window === 'today') {
          const start = new Date(); start.setHours(0,0,0,0);
          if (ts < start.getTime()) return false;
        } else if (batchForm.time_window === 'last_3_days') {
          if (ts < now - 3 * dayMs) return false;
        } else if (batchForm.time_window === 'last_7_days') {
          if (ts < now - 7 * dayMs) return false;
        }
      }
      return true;
    })
  : [];

  if (loading) {
    return (
      <DashboardLayout title="Aggregator Dashboard" description="Manage herb collections and create batches">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Aggregator Dashboard" 
      description="Manage herb collections and create batches for distribution"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collections</p>
                <p className="text-2xl font-bold">{collections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Batches</p>
                <p className="text-2xl font-bold">{batches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {batches.filter(b => b.batch_status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">
                  {collections.reduce((sum, c) => sum + Number(c.quantity_kg), 0).toFixed(1)}kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="new-collection">New Collection</TabsTrigger>
          <TabsTrigger value="create-batch">Create Batch</TabsTrigger>
          <TabsTrigger value="batches">My Batches</TabsTrigger>
          <TabsTrigger value="register-collector">Register Collector</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Recent Collections</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collections.slice(0, 10).map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{collection.herb.local_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {collection.collector.profile.full_name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Weight className="w-4 h-4" />
                        <span>{collection.quantity_kg}kg</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{collection.collector.profile.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(collection.collection_timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-collection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Leaf className="w-5 h-5" />
                <span>Herb Collection Entry</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collector_id">Collector</Label>
                  <Select
                    value={collectionForm.collector_id}
                    onValueChange={(value) => setCollectionForm(prev => ({ ...prev, collector_id: String(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collector" />
                    </SelectTrigger>
                    <SelectContent>
                      {collectors.length === 0 && (
                        <SelectItem value="__none__" disabled>No collectors found</SelectItem>
                      )}
                      {collectors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {(c.profile?.full_name || c.contact_details?.name || 'Unnamed')}{(c.profile?.location ? ` • ${c.profile.location}` : '')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="herb_id">Herb</Label>
                  <Select
                    value={collectionForm.herb_id}
                    onValueChange={(value) => setCollectionForm(prev => ({ ...prev, herb_id: String(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select herb" />
                    </SelectTrigger>
                    <SelectContent>
                      {herbs.length === 0 && (
                        <SelectItem value="__none__" disabled>No herbs found</SelectItem>
                      )}
                      {herbs.map(h => (
                        <SelectItem key={h.id} value={h.id}>{h.local_name} ({h.botanical_name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plant_part">Plant Part</Label>
                  <Input id="plant_part" placeholder="leaf, root, seed, bark" value={collectionForm.plant_part} onChange={(e) => setCollectionForm(prev => ({ ...prev, plant_part: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_kg">Quantity (kg)</Label>
                  <Input id="quantity_kg" type="number" step="0.01" placeholder="e.g. 12.5" value={collectionForm.quantity_kg} onChange={(e) => setCollectionForm(prev => ({ ...prev, quantity_kg: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" type="number" placeholder="e.g. 28.6139" value={collectionForm.latitude} onChange={(e) => setCollectionForm(prev => ({ ...prev, latitude: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" type="number" placeholder="e.g. 77.2090" value={collectionForm.longitude} onChange={(e) => setCollectionForm(prev => ({ ...prev, longitude: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial_condition">Initial Condition</Label>
                  <Input id="initial_condition" placeholder="fresh, dry, damaged" value={collectionForm.initial_condition} onChange={(e) => setCollectionForm(prev => ({ ...prev, initial_condition: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_temp">Storage Temperature (°C)</Label>
                  <Input id="storage_temp" type="number" step="0.1" placeholder="e.g. 8" value={collectionForm.storage_temp} onChange={(e) => setCollectionForm(prev => ({ ...prev, storage_temp: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_humidity">Storage Humidity (%)</Label>
                  <Input id="storage_humidity" type="number" step="0.1" placeholder="e.g. 65" value={collectionForm.storage_humidity} onChange={(e) => setCollectionForm(prev => ({ ...prev, storage_humidity: e.target.value }))} />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="packaging">Packaging</Label>
                  <Input id="packaging" placeholder="jute bag, sealed pouch" value={collectionForm.packaging} onChange={(e) => setCollectionForm(prev => ({ ...prev, packaging: e.target.value }))} />
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={collectionForm.override_seasonal}
                      onCheckedChange={(v) => setCollectionForm(prev => ({ ...prev, override_seasonal: !!v }))}
                    />
                    <Label>Override seasonal restriction</Label>
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Reason for override (required when overriding)"
                      value={collectionForm.override_reason}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, override_reason: e.target.value }))}
                      disabled={!collectionForm.override_seasonal}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg text-sm text-muted-foreground">
                Compliance checks will validate season, approved regions, and daily species limits.
              </div>

              <Button className="w-full" onClick={saveCollection} disabled={savingCollection}>
                {savingCollection ? 'Saving…' : 'Save Collection Entry'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Batch</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="herb_id">Herb Type</Label>
                  <Select 
                    value={batchForm.herb_id} 
                    onValueChange={(value) => setBatchForm(prev => ({ ...prev, herb_id: String(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select herb type" />
                    </SelectTrigger>
                    <SelectContent>
                      {herbs.length === 0 && (
                        <SelectItem value="__none__" disabled>No herbs found</SelectItem>
                      )}
                      {herbs.map((herb) => (
                        <SelectItem key={herb.id} value={herb.id}>
                          {herb.local_name} ({herb.botanical_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plant_part">Plant Part</Label>
                  <Input
                    id="plant_part"
                    placeholder="leaf, root, seed, bark"
                    value={batchForm.plant_part}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, plant_part: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_window">Time Window</Label>
                  <Select
                    value={batchForm.time_window}
                    onValueChange={(value) => setBatchForm(prev => ({ ...prev, time_window: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last_3_days">Last 3 days</SelectItem>
                      <SelectItem value="last_7_days">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_location">Storage Location</Label>
                  <Input
                    id="storage_location"
                    placeholder="Warehouse location"
                    value={batchForm.storage_location}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, storage_location: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality_notes">Quality Notes</Label>
                  <Input
                    id="quality_notes"
                    placeholder="Visual inspection notes"
                    value={batchForm.quality_notes}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, quality_notes: e.target.value }))}
                  />
                </div>
              </div>

              {batchForm.herb_id && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select Collections to Include</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
                    {filteredCollections.length === 0 && (
                      <div className="p-4 text-sm text-muted-foreground">No collections match filters.</div>
                    )}
                    {filteredCollections.map((collection) => {
                      const checked = selectedCollections.includes(collection.id);
                      return (
                        <label key={collection.id} className={`p-4 border rounded-lg flex items-center justify-between gap-4 ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => {
                                setSelectedCollections(prev =>
                                  prev.includes(collection.id)
                                    ? prev.filter(id => id !== collection.id)
                                    : [...prev, collection.id]
                                );
                              }}
                            />
                            <div>
                              <p className="font-medium">{collection.collector.profile.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {collection.plant_part} • {collection.initial_condition}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{collection.quantity_kg}kg</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(collection.collection_timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {selectedCollections.length > 0 && (
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="font-medium">Batch Summary</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCollections.length} collections • {' '}
                        {filteredCollections
                          .filter(c => selectedCollections.includes(c.id))
                          .reduce((sum, c) => sum + Number(c.quantity_kg), 0)
                          .toFixed(1)}kg total
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Time window: {batchForm.time_window || 'any'} • Plant part: {batchForm.plant_part || 'any'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Locations: {filteredCollections
                          .filter(c => selectedCollections.includes(c.id))
                          .map(c => c.collector.profile.location)
                          .filter(Boolean)
                          .slice(0, 4)
                          .join(', ')}{filteredCollections.filter(c => selectedCollections.includes(c.id)).length > 4 ? ', …' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* Sticky footer button */}
            <div className="p-4 border-t bg-background sticky bottom-0">
              <Button 
                onClick={createBatch}
                disabled={selectedCollections.length === 0}
                className="w-full"
              >
                Create Batch
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>My Batches</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{batch.batch_id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {batch.herb.local_name} • {batch.total_quantity_kg}kg
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(batch.batch_status)}
                      {batch.batch_status === 'created' && (
                        <Button 
                          size="sm" 
                          onClick={() => sendToLab(batch.id)}
                          className="flex items-center space-x-1"
                        >
                          <FlaskConical className="w-4 h-4" />
                          <span>Send to Lab</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register-collector" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Register Collector</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farmer_name">Farmer Name</Label>
                  <Input
                    id="farmer_name"
                    placeholder="Enter farmer name"
                    value={collectorForm.name}
                    onChange={(e) => setCollectorForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collector_type">Collector Type</Label>
                  <Select
                    value={collectorForm.collector_type}
                    onValueChange={(value) => setCollectorForm((prev) => ({ ...prev, collector_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">Farmer</SelectItem>
                      <SelectItem value="wild_collector">Wild Collector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaar_id">Aadhaar / Co-op ID</Label>
                  <Input
                    id="aadhaar_id"
                    placeholder="Aadhaar or cooperative ID"
                    value={collectorForm.aadhaar_id}
                    onChange={(e) => setCollectorForm((prev) => ({ ...prev, aadhaar_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooperative_id">Cooperative Group</Label>
                  <Input
                    id="cooperative_id"
                    placeholder="Cooperative/SHG name or ID"
                    value={collectorForm.cooperative_id}
                    onChange={(e) => setCollectorForm((prev) => ({ ...prev, cooperative_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Phone number"
                    value={collectorForm.phone}
                    onChange={(e) => setCollectorForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={registerCollector} disabled={savingCollector}>
                {savingCollector ? 'Saving…' : 'Register Collector'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
