import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { User, LogOut, ArrowLeft, FileText, FlaskConical } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

// Reusing and adapting the Section and SubSection components from the second code block
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

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
          <div className="flex justify-end mb-2">
            <button
              className="px-2 py-1 text-sm text-gray-500 hover:text-gray-800"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

const productForms = ['Capsule', 'Tablet', 'Powder', 'Syrup']

export default function FactoryDashboard() {
  const [activeTab, setActiveTab] = useState('ProductDetails')
  const [qrModal, setQrModal] = useState({ open: false, payload: null })
  const [showProfile, setShowProfile] = useState(false)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [productName, setProductName] = useState('Ashwagandha Capsules')
  const [productType, setProductType] = useState('Capsule')
  const [lotId, setLotId] = useState(() => `FP-${Date.now().toString().slice(-6)}`)
  const [mfgDate, setMfgDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [processSteps, setProcessSteps] = useState('Drying → Grinding → Extraction → Blending → Packaging')
  const [processNotes, setProcessNotes] = useState('')
  const [yieldQty, setYieldQty] = useState('5000')
  const [herbName, setHerbName] = useState('')
  const [otherIngredients, setOtherIngredients] = useState('')


  const handleSignOut = async () => {
    await signOut()
    setShowProfile(false)
  }

  function openQrPreview() {
    const payload = {
      productName,
      dosageForm: productType,
      units: yieldQty,
      factoryBatchId: lotId,
      mfgDate,
      expiryDate,
      provenance: {
        processing: processSteps.split('→').map(s => s.trim()),
        labStatus: 'Approved',
        notes: processNotes,
        herbName,
        otherIngredients
      },
    }
    setQrModal({ open: true, payload })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with new styling */}
      <header className="bg-green-900 text-white px-6 py-4 border-b-4 border-yellow-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FlaskConical className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold tracking-wide">Factory Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('ProductDetails')}
              className={`flex items-center gap-2 bg-white/10 border-white/20 text-white ${activeTab === 'ProductDetails' ? 'bg-yellow-400 text-green-900' : 'hover:bg-white/20'}`}
            >
              Product Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('Products')}
              className={`flex items-center gap-2 bg-white/10 border-white/20 text-white ${activeTab === 'Products' ? 'bg-yellow-400 text-green-900' : 'hover:bg-white/20'}`}
            >
              My Products
            </Button>
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
      </header>

      {/* Main Content with new styling and components */}
      <main className="px-6 py-8 max-w-4xl mx-auto">
        {activeTab === 'ProductDetails' && (
          <>
            {/* Product Details Section */}
            <Section title="Product Details" description="Define product batch details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name (e.g., Ashwagandha Capsules)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                  >
                    {productForms.map((form) => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Date</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                    value={mfgDate}
                    onChange={(e) => setMfgDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yield Quantity</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                    value={yieldQty}
                    onChange={(e) => setYieldQty(e.target.value)}
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
            </Section>

            {/* Ingredients Section */}
            <Section title="Ingredients" description="Define product ingredients">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Herb Name</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                    value={herbName}
                    onChange={(e) => setHerbName(e.target.value)}
                    placeholder="e.g., Ashwagandha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 bg-gray-100 text-gray-700 px-2 py-1"
                    value={lotId}
                    readOnly
                    placeholder="Auto-generated lot ID"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Ingredients</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                    rows={3}
                    value={otherIngredients}
                    onChange={(e) => setOtherIngredients(e.target.value)}
                    placeholder="Other Ingredients used..."
                  />
                </div>
              </div>
            </Section>

            {/* Formulation & Manufacturing Section */}
            <Section title="Formulation & Manufacturing" description="Record steps and notes">
              <SubSection title="Processing Steps">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter Steps</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1"
                      value={processSteps}
                      onChange={(e) => setProcessSteps(e.target.value)}
                      placeholder="Enter steps separated by →"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setProcessSteps('Drying → Grinding → Extraction → Blending → Packaging')}
                    className="h-9 px-4 py-2 border border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 whitespace-nowrap"
                  >
                    Use Default
                  </Button>
                </div>
              </SubSection>

              <SubSection title="Notes">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Process Notes</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-2 py-1"
                  rows={3}
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  placeholder="Add any additional notes about the manufacturing process..."
                />
              </SubSection>

              <div className="pt-4 flex justify-end">
                <Button onClick={openQrPreview} className="bg-green-600 text-white hover:bg-green-700">
                  Generate QR Code
                </Button>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'Products' && (
          <Section title="My Products" description="List of generated product batches (coming soon).">
            <p className="text-sm text-gray-500">This section will display a list of all products you've generated and their details.</p>
          </Section>
        )}
      </main>

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
                <label className="text-sm font-medium text-gray-500">Factory Name</label>
                <p className="text-lg">{profile?.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Factory Email</label>
                <p className="text-lg">{profile?.email}</p>
              </div>
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
              {profile?.organization && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Organization</label>
                  <p className="text-lg">{profile.organization}</p>
                </div>
              )}
              <Button
                onClick={() => setShowProfile(false)}
                className="w-full bg-green-600 text-white hover:bg-green-700"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Modal stays same */}
      <Modal open={qrModal.open} onClose={() => setQrModal({ open: false, payload: null })}>
        {qrModal.payload && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product QR & Provenance</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-center">
                <QRCodeSVG value={JSON.stringify(qrModal.payload)} size={200} level="M" includeMargin />
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">{qrModal.payload.productName}</p>
                <p>Factory Lot: {qrModal.payload.factoryBatchId}</p>
                <p>Form: {qrModal.payload.dosageForm} • Units: {qrModal.payload.units}</p>
                <p>Expiry: {qrModal.payload.expiryDate}</p>
                <p>Lab: {qrModal.payload.provenance.labStatus}</p>
                <p>Processing: {qrModal.payload.provenance.processing.join(' → ')}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}