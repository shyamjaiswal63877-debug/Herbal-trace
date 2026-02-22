import { useState, useEffect, useRef } from 'react'
import { FileText, FlaskConical, LogOut, User, ArrowLeft } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
//import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { supabase, storage } from '@/integrations/supabase/client'

function Section({ title, children, description = undefined }) {
  return (
    <section className="bg-white rounded border border-gray-300 mb-6 shadow-sm">
      <div className="px-6 py-3 border-b border-gray-300 bg-gray-100">
        <h3 className="text-base font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
        {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function SubSection({ title, children }) {
  return (
    <div>
      <div className="flex items-center my-6">
        <h4 className="text-sm font-semibold text-gray-800 bg-gray-100 p-2 rounded">{title}</h4>
        <div className="flex-grow border-t border-gray-300 ml-4"></div>
      </div>
      {children}
    </div>
  )
}

function SubSectiona({ title, children }) {
  return (
    <div>
      <div className="flex items-center mb-4">
        <h4 className="text-sm font-semibold text-gray-800 bg-gray-100 p-2 rounded">{title}</h4>
        <div className="flex-grow border-t border-gray-300 ml-4"></div>
      </div>
      {children}
    </div>
  )
}

export default function LabDashboard() {
  const [pesticides, setPesticides] = useState([{ name: '', method: '', result: '', limit: '' }])
  const [showProfile, setShowProfile] = useState(false)
  const reportRef = useRef(null)
  const chartRef = useRef(null)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!chartRef.current) return
    import('chart.js/auto').then((ChartModule) => {
      const Chart = ChartModule.default || ChartModule.Chart
      const ctx = chartRef.current.getContext('2d')
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Moisture', 'Pb', 'Cd', 'Hg', 'As'],
          datasets: [
            { label: 'Result', data: [8, 0.2, 0.05, 0.01, 0.07], backgroundColor: '#1d4ed855' },
            { label: 'Limit', data: [10, 0.3, 0.1, 0.05, 0.1], backgroundColor: '#64748b55' }
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      })
    })
  }, [])

  const addPesticideRow = () => setPesticides(prev => [...prev, { name: '', method: '', result: '', limit: '' }])
  const updatePesticide = (i, field, val) => setPesticides(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const handleSignOut = async () => {
    await signOut()
    setShowProfile(false)
    navigate('/')
  }

  const handleGeneratePdf = () => {
    window.print();
  };

  const handleBlockchainQr = async () => {
    const payload = { reportId: '#REP-2025-0001', timestamp: Date.now(), status: 'draft' }
    const url = await QRCode.toDataURL(JSON.stringify(payload))
    const win = window.open('about:blank')
    if (win) {
      win.document.write(`<img src="${url}" alt="QR Code" style="width:280px;height:280px" />`)
      win.document.close()
    }
  }

  const [batchId, setBatchId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleLabTestUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !batchId) return

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setIsUploading(true)
      // Upload the file first
      const response = await fetch('https://sihayurvedabe.vercel.app/api/batches/upload-report', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload report')
      }

      const data = await response.json()
      console.log('File uploaded successfully. URL:', data.fileUrl)
      
      // Get user's geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('User location:', { latitude, longitude });
            
            try {
              // Send stage event with geolocation
              const stageResponse = await fetch('https://sihayurvedabe.vercel.app/api/batches/add-stage-event', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  formatted_batch_id: batchId,
                  stage_type: 'QualityTest',
                  metadata: {
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString(),
                    reportUrl: data.fileUrl
                  }
                })
              });

              if (!stageResponse.ok) {
                throw new Error('Failed to record quality test event');
              }

              const stageData = await stageResponse.json();
              console.log('Quality test event recorded:', stageData);
              alert(`Report uploaded successfully!\nLocation recorded: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}`);
            } catch (error) {
              console.error('Error recording quality test event:', error);
              alert('Report uploaded, but failed to record location data.');
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            alert('Report uploaded successfully!\nCould not determine your location.');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // Increased timeout to 10 seconds
            maximumAge: 0
          }
        );
      } else {
        console.log('Geolocation is not supported by this browser');
        alert('Report uploaded successfully!\nGeolocation is not supported by your browser.');
      }
      
      setBatchId('')
      setSelectedFile(null)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload report. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-900 text-white px-6 py-4 border-b-4 border-yellow-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold tracking-wide">Government Laboratory Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">Herbal Sample Testing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Lab Name</label>
                <p className="text-lg">{profile?.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Lab Email</label>
                <p className="text-lg">{profile?.email}</p>
              </div>
              {/* <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <Badge variant="secondary" className="ml-2">
                  {profile?.role?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div> */}
              {profile?.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{profile.phone}</p>
                </div>
              )}
              {(profile?.address || profile?.location) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg">{profile.address || profile.location}</p>
                </div>
              )}
              <Button
                onClick={() => setShowProfile(false)}
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main */}
      <main className="px-6 py-8 max-w-4xl mx-auto" ref={reportRef}>
        {/* Lab Test Report Upload Section */}
        <Section title="Upload Lab Test Report">
          <form onSubmit={handleLabTestUpload} className="space-y-4">
            <div>
              <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-1">
                Batch ID
              </label>
              <input
                type="text"
                id="batchId"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter batch ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lab Test Report (PDF only)
              </label>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                  {selectedFile ? selectedFile.name : 'Choose file'}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                    required
                  />
                </label>
                {selectedFile && (
                  <span className="ml-3 text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Only PDF files are accepted. Max size: 10MB
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!batchId || !selectedFile || isUploading}
                className="bg-green-700 hover:bg-green-800"
              >
                {isUploading ? 'Uploading...' : 'Upload Report'}
              </Button>
            </div>
          </form>
        </Section>

        {/* Report Details */}
        <Section title="Report Details" description="Manual metadata for the sample and test session">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report ID</label>
              <input disabled defaultValue="#REP-2025-0001" className="w-full rounded-md border border-gray-300 bg-gray-100 text-gray-700 px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch / QR Code ID</label>
              <input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="Scan or enter Batch ID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Recieved On</label>
              <input type="date" className="w-full rounded-md border border-gray-300 px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Testing</label>
              <input type="date" className="w-full rounded-md border border-gray-300 px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Herb Name</label>
              <input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="e.g., Ashwagandha" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plant Part</label>
              <select className="w-full rounded-md border border-gray-300 px-2 py-1">
                <option>Leaf</option>
                <option>Root</option>
                <option>Seed</option>
                <option>Bark</option>
                <option>Flower</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Sample Information */}
        <Section title="Sample Information" description="Physical characteristics and storage conditions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Description</label>
              <textarea rows={3} className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="Appearance, color, odor, etc." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition on Arrival</label>
              <select className="w-full rounded-md border border-gray-300 px-2 py-1">
                <option>Fresh</option>
                <option>Dry</option>
                <option>Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Condition Before Testing</label>
              <input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="e.g., 4°C, dark, airtight" />
            </div>
          </div>
        </Section>

        {/* Tests Conducted */}
        <Section title="Tests Conducted" description="Comprehensive testing procedures and results">
          {/* A. Identity & Authentication */}
          <SubSectiona title="A. Identity & Authentication">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Botanical ID</label>
                <input className="w-full rounded-md border border-gray-300 px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNA Barcoding Result</label>
                <select className="w-full rounded-md border border-gray-300 px-2 py-1">
                  <option>Pass</option>
                  <option>Fail</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Marker Compound</label>
                <input className="w-full rounded-md border border-gray-300 px-2 py-1" />
              </div>
            </div>
          </SubSectiona>

          {/* B. Physicochemical Tests */}
          <SubSection title="B. Physicochemical Tests">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Moisture Content (%)' },
                { label: 'Ash Value (Total %)' },
                { label: 'Ash Value (Acid-insoluble %)' },
                { label: 'Extractive Value (Alcohol %)' },
                { label: 'Extractive Value (Water %)' },
                { label: 'pH' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input className="w-full rounded-md border border-gray-300 px-2 py-1" />
                </div>
              ))}
            </div>
          </SubSection>

          {/* C. Contaminant & Safety Tests */}
          <SubSection title="C. Contaminant & Safety Tests">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">Pesticide Residues</span>
                <button type="button" onClick={addPesticideRow} className="text-sm text-blue-700 hover:underline">Add Row</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-gray-600">
                      <th className="py-2 px-3 border border-gray-300">Pesticide Name</th>
                      <th className="py-2 px-3 border border-gray-300">Method</th>
                      <th className="py-2 px-3 border border-gray-300">Result</th>
                      <th className="py-2 px-3 border border-gray-300">Permissible Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pesticides.map((row, i) => (
                      <tr className="border border-gray-300" key={i}>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="e.g., Chlorpyrifos" value={row.name} onChange={e => updatePesticide(i, 'name', e.target.value)} /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="e.g., GC-MS" value={row.method} onChange={e => updatePesticide(i, 'method', e.target.value)} /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="Result" value={row.result} onChange={e => updatePesticide(i, 'result', e.target.value)} /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="Limit" value={row.limit} onChange={e => updatePesticide(i, 'limit', e.target.value)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-sm font-medium text-gray-800">Heavy Metals</span>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-gray-600">
                      <th className="py-2 px-3 border border-gray-300">Metals</th>
                      <th className="py-2 px-3 border border-gray-300">Method</th>
                      <th className="py-2 px-3 border border-gray-300">Result</th>
                      <th className="py-2 px-3 border border-gray-300">Permissible Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Pb', 'Cd', 'Hg', 'As'].map((p) => (
                      <tr className="border border-gray-300" key={p}>
                        <td className="py-2 px-3 border border-gray-300">{p}</td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-sm font-medium text-gray-800">Mycotoxins</span>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-gray-600">
                      <th className="py-2 px-3 border border-gray-300">Name</th>
                      <th className="py-2 px-3 border border-gray-300">Method</th>
                      <th className="py-2 px-3 border border-gray-300">Result</th>
                      <th className="py-2 px-3 border border-gray-300">Permissible Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Aflatoxin B1', 'Aflatoxin B2', 'Aflatoxin G1', 'Aflatoxin G2'].map((p) => (
                      <tr className="border border-gray-300" key={p}>
                        <td className="py-2 px-3 border border-gray-300">{p}</td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-800">Microbial Load</span>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-gray-600">
                      <th className="py-2 px-3 border border-gray-300">Parameter</th>
                      <th className="py-2 px-3 border border-gray-300">Method</th>
                      <th className="py-2 px-3 border border-gray-300">Result</th>
                      <th className="py-2 px-3 border border-gray-300">Permissible Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Total Aerobic Count', 'Yeast & Mold', 'E. coli', 'Salmonella'].map((p) => (
                      <tr className="border border-gray-300" key={p}>
                        <td className="py-2 px-3 border border-gray-300">{p}</td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                        <td className="py-2 px-3 border border-gray-300"><input className="w-full rounded-md border border-gray-300 px-2 py-1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SubSection>

        </Section>

        {/* Compliance Evaluation */}
        <Section title="Compliance Evaluation" description="Final assessment and blockchain integration">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overall Status</label>
              <select className="w-full rounded-md border border-gray-300 px-2 py-1">
                <option>Pass</option>
                <option>Fail</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Smart Contract Status</label>
              <select className="w-full rounded-md border border-gray-300 px-2 py-1">
                <option>Accepted</option>
                <option>Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blockchain Hash ID</label>
              <input disabled defaultValue="Auto-generated on submit" className="w-full rounded-md border border-gray-300 bg-gray-100 text-gray-700 px-2 py-1" />
            </div>
          </div>
        </Section>

        {/* Remarks & Sign-off */}
        <Section title="Remarks & Sign-off" description="Final observations and authorization">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observation Notes</label>
              <textarea rows={3} className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="Enter observations and comments" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
              <select className="w-full rounded-md border border-gray-300 px-2 py-1">
                <option>Approve</option>
                <option>Reprocess</option>
                <option>Reject</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Analyst Name</label>
              <input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="Enter analyst name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">QC Officer Name</label>
              <input className="w-full rounded-md border border-gray-300 px-2 py-1" placeholder="Enter QC officer name" />
            </div>
          </div>
        </Section>

        {/* Outputs */}
        <Section title="Outputs" description="Generate reports and export data">
          <div className="flex flex-wrap gap-3">
            <button onClick={handleGeneratePdf} className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800">Generate PDF Report</button>
            {/* <button onClick={() => document.getElementById('chart-preview')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded border border-gray-400">Preview Charts</button>
            <button onClick={handleBlockchainQr} className="px-4 py-2 rounded border border-gray-400">Blockchain / QR Link</button> */}
          </div>
        </Section>
      </main>
    </div>
  )
}