import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { User, LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

function SectionCard({ title, subtitle, children, right = null, center = false }) {
  return (
    <section className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6${center ? ' text-center' : ''}`}>
      <div
        className={
          center
            ? 'mb-4 flex items-start justify-center text-center'
            : 'mb-4 flex items-start justify-between'
        }
      >
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          ) : null}
        </div>
        {!center && right}
      </div>
      {children}
    </section>
  )
}

function TopNav({ activeTab, setActiveTab, showProfile, setShowProfile, handleSignOut, navigate }) {
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto h-14 px-4 md:px-6 flex items-center justify-between">
        {/* Left side: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full ring-1 ring-emerald-200 bg-emerald-50 text-emerald-700 grid place-items-center">
              <BoxedLeafIcon className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-[15px]" style={{ color: 'var(--color-brand)' }}>HerbalTrace</span>
          </div>
          <span aria-hidden className="h-5 w-px" style={{ backgroundColor: 'color-mix(in oklab, var(--color-brand) 30%, transparent)' }} />
          <div className="flex items-center gap-2 text-gray-700">
            <span className="h-6 w-6 grid place-items-center rounded-md ring-1" style={{ backgroundColor: '#EAF3EA', color: 'var(--color-brand)', borderColor: 'color-mix(in oklab, var(--color-brand) 25%, white)' }}>
              <FactoryIcon className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-[14px]" style={{ color: 'var(--color-brand)' }}>Factory Portal</span>
          </div>
        </div>

        {/* ✅ Right side: Tabs + Profile */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('ProductDetails')}
            className={`text-sm font-medium ${activeTab === 'ProductDetails' ? 'text-emerald-700' : 'text-gray-700 hover:text-emerald-600'}`}
          >
            Product Details
          </button>
          <button
            onClick={() => setActiveTab('Products')}
            className={`text-sm font-medium ${activeTab === 'Products' ? 'text-emerald-700' : 'text-gray-700 hover:text-emerald-600'}`}
          >
            My Products
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 bg-white/10 border-white/20 text-gray-700 hover:bg-gray-100"
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white/10 border-white/20 text-gray-700 hover:bg-red-100 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white/10 border-white/20 text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
          <div className="h-7 w-7 rounded-full grid place-items-center text-[13px]" style={{ backgroundColor: '#EAF3EA', color: 'var(--color-brand)', border: '1px solid color-mix(in oklab, var(--color-brand) 25%, white)' }}>F</div>
        </div>
      </div>
    </header>
  )
}

function BoxedLeafIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
    </svg>
  )
}

function FactoryIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21V9l6 4V9l6 4V7l6-3v17Z" />
      <path d="M3 21h18" />
      <path d="M14 21v-4" />
      <path d="M10 21v-2" />
      <path d="M6 21v-2" />
    </svg>
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
      },
    }
    setQrModal({ open: true, payload })
  }

  return (
    <div className="min-h-screen bg-[#F3F8F4] text-gray-900">
      {/* ✅ Navbar with tabs integrated */}
      <TopNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        showProfile={showProfile}
        setShowProfile={setShowProfile}
        handleSignOut={handleSignOut}
        navigate={navigate}
      />

      {/* ✅ Content without sidebar */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {activeTab === 'ProductDetails' && (
          <>
            {/* Product Details Card */}
            <SectionCard title="Product Details" subtitle="Define product batch details" center>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name (e.g., Ashwagandha Capsules)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Product Type</label>
                  <select
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                  >
                    {productForms.map((form) => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Manufacturing Date</label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={mfgDate}
                    onChange={(e) => setMfgDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>
            </SectionCard>




            {/* Formulation & Manufacturing Card */}
          

            <SectionCard title="Ingredients" subtitle="Define product ingredients" center>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Herb Name</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name (e.g., Ashwagandha Capsules)"
                  />
                </div>
               
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Batch ID</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg p-3 w-full bg-gray-50 text-gray-600"
                    value={lotId}
                    readOnly
                    placeholder="Auto-generated lot ID"
                  />
                </div>

               <div className="space-y-2 md:col-span-2">
  <label className="block text-sm font-medium text-gray-700">Other Ingredients</label>
  <textarea
    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    rows={3}
    value={processNotes}
    onChange={(e) => setProcessNotes(e.target.value)}
    placeholder="Other Ingredients used..."
  />
</div>

                
              </div>
            </SectionCard>

            <SectionCard title="Formulation & Manufacturing" subtitle="Record steps and notes" center>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Processing Steps</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg p-3 flex-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={processSteps}
                      onChange={(e) => setProcessSteps(e.target.value)}
                      placeholder="Enter processing steps separated by → (e.g., Drying → Grinding → Extraction → Blending → Packaging)"
                    />
                    <button
                      className="px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 whitespace-nowrap"
                      onClick={() => setProcessSteps('Drying → Grinding → Extraction → Blending → Packaging')}
                    >
                      Use default steps
                    </button>
                  </div>
                </div>

                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Process Notes</label>
                  <textarea
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={3}
                    value={processNotes}
                    onChange={(e) => setProcessNotes(e.target.value)}
                    placeholder="Add any additional notes about the manufacturing process..."
                  />
                </div>
                <div className="pt-4">
                  <button
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                    onClick={openQrPreview}
                  >
                    Generate QR Code
                  </button>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {activeTab === 'Products' && (
          <SectionCard title="My Products" subtitle="List of generated product batches">
            <p className="text-sm text-gray-500">This section will show all saved product batches (coming soon).</p>
          </SectionCard>
        )}

        {activeTab === 'Compliance' && (
          <SectionCard title="Compliance Reports" subtitle="Audit and certifications">
            <p className="text-sm text-gray-500">Compliance reports and lab test results will appear here (coming soon).</p>
          </SectionCard>
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
                className="w-full"
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
