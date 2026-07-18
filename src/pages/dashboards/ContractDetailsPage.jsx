import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function ContractDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign forms state
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerSignature, setSellerSignature] = useState('');
  const [buyerSignature, setBuyerSignature] = useState('');
  const [signing, setSigning] = useState(false);

  const contractRef = useRef(null);

  const fetchContractDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/contracts/${id}`);
      setData(res.data);
      if (res.data.contract) {
        setSellerPhone(res.data.contract.sellerPhone || '');
        setSellerAddress(res.data.contract.sellerAddress || '');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading contract details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractDetails();
  }, [id]);

  const handleSellerSign = async (e) => {
    e.preventDefault();
    if (!sellerPhone.trim() || !sellerAddress.trim() || !sellerSignature.trim()) {
      showToast('Please fill in all signing details');
      return;
    }
    setSigning(true);
    try {
      await axios.post(`${API_BASE_URL}/contracts/${id}/seller-sign`, {
        sellerPhone,
        sellerAddress,
        sellerSignature
      });
      showToast('Contract signed successfully! ✓');
      fetchContractDetails();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error signing contract');
    } finally {
      setSigning(false);
    }
  };

  const handleBuyerSign = async (e) => {
    e.preventDefault();
    if (!buyerSignature.trim()) {
      showToast('Please type your signature');
      return;
    }
    setSigning(true);
    try {
      await axios.post(`${API_BASE_URL}/contracts/${id}/buyer-sign`, {
        buyerSignature
      });
      showToast('Contract fully signed & completed! ✓');
      fetchContractDetails();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error signing contract');
    } finally {
      setSigning(false);
    }
  };

  const handleAdminApprove = async () => {
    setSigning(true);
    try {
      await axios.post(`${API_BASE_URL}/contracts/${id}/approve`);
      showToast('Contract approved and commission stamped! ✓');
      fetchContractDetails();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error approving contract');
    } finally {
      setSigning(false);
    }
  };

  const loadHtml2Pdf = () => {
    return new Promise((resolve) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      document.body.appendChild(script);
    });
  };

  const downloadPDF = async () => {
    showToast('Preparing PDF download...');
    const html2pdf = await loadHtml2Pdf();
    const element = contractRef.current;
    
    // Hide buttons during PDF capture
    const buttons = element.querySelectorAll('.no-pdf');
    buttons.forEach(btn => btn.style.display = 'none');

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `carfever_deal_agreement_${id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      // Restore buttons
      buttons.forEach(btn => btn.style.display = '');
    }).catch(err => {
      console.error(err);
      buttons.forEach(btn => btn.style.display = '');
    });
  };

  if (loading) {
    return <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}><h3>Loading contract...</h3></div>;
  }

  if (!data || !data.contract) {
    return <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}><h3>Contract not found</h3></div>;
  }

  const { contract, car } = data;
  const isBuyer = user?.role === 'buyer' && user.id === contract.buyerId;
  const isSeller = user?.role === 'seller' && user.id === contract.sellerId;
  const isAdmin = user?.role === 'admin';

  if (!isBuyer && !isSeller && !isAdmin) {
    return <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}><h3>Access Denied</h3></div>;
  }

  return (
    <div className="contract-details-page" style={{ padding: '40px 0 100px' }}>
      <div className="container">
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link to={isAdmin ? '/admin' : isSeller ? '/seller' : '/buyer'} className="btn-outline no-pdf" style={{ display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Workflow steps */}
        <div className="workflow-tracker no-pdf" style={{ marginBottom: 40 }}>
          <div className="workflow-steps">
            {[
              { label: 'Initiated', desc: 'Buyer started deal', done: contract.step >= 1 },
              { label: 'Platform Approved', desc: 'Admin stamped fee', done: contract.step >= 2 },
              { label: 'Seller Signed', desc: 'Seller accepted', done: contract.step >= 3 },
              { label: 'Completed', desc: 'Buyer final signed', done: contract.step >= 4 },
            ].map((step, idx) => (
              <div key={idx} className="workflow-step">
                <div className="workflow-step-wrap">
                  <div className={`workflow-circle ${contract.step === idx + 1 ? 'current' : contract.step > idx + 1 ? 'done' : 'pending'}`}>
                    {contract.step > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <span className="workflow-label">{step.label}</span>
                </div>
                {idx < 3 && <div className={`workflow-line${contract.step > idx + 1 ? ' done' : ''}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Printable Contract Card Container */}
        <div className="contract-paper-card" ref={contractRef} style={{ background: 'var(--mm-white)', borderRadius: 12, padding: 40, border: '1px solid var(--mm-silver-light)', color: '#111', fontFamily: 'Inter, sans-serif' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: 20, marginBottom: 30 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--mm-ink)' }}>DEAL AGREEMENT</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#666' }}>Document Reference: {contract.id}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: 0, color: 'var(--mm-blue)', fontSize: '1.4rem' }}>car<em>Fever</em></h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#666' }}>UK Automotive Marketplace</p>
            </div>
          </div>

          {/* Details Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 30 }}>
            
            {/* Buyer Column (visible in full to Buyer, Admin, and partially to Seller) */}
            <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
              <h3 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #ddd', paddingBottom: 6, fontSize: '1rem', color: '#333' }}>Buyer Information</h3>
              <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Name:</strong> {contract.buyerName}</p>
              <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Email:</strong> {contract.buyerEmail}</p>
              {/* Show phone/address if admin or user is buyer */}
              {(isBuyer || isAdmin) ? (
                <>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {contract.buyerPhone}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Address:</strong> {contract.buyerAddress}</p>
                </>
              ) : (
                <p style={{ margin: '6px 0', fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>Private contact details (Secured)</p>
              )}
            </div>

            {/* Seller Column (visible in full to Seller, Admin, and partially to Buyer) */}
            <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
              <h3 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #ddd', paddingBottom: 6, fontSize: '1rem', color: '#333' }}>Seller Information</h3>
              <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Name:</strong> {contract.sellerName}</p>
              <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Email:</strong> {contract.sellerEmail}</p>
              {/* Show phone/address if admin or user is seller, and only if already provided (Step >= 3) */}
              {(isSeller || isAdmin) ? (
                <>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {contract.sellerPhone || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Pending Signature</span>}</p>
                  <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Address:</strong> {contract.sellerAddress || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Pending Signature</span>}</p>
                </>
              ) : (
                <p style={{ margin: '6px 0', fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>Private contact details (Secured)</p>
              )}
            </div>

          </div>

          {/* Vehicle Information */}
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 30 }}>
            <h3 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #ddd', paddingBottom: 6, fontSize: '1rem', color: '#333' }}>Vehicle Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#777', display: 'block', textTransform: 'uppercase' }}>Make</span>
                <strong style={{ fontSize: '0.95rem' }}>{car?.make}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#777', display: 'block', textTransform: 'uppercase' }}>Model</span>
                <strong style={{ fontSize: '0.95rem' }}>{car?.model}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#777', display: 'block', textTransform: 'uppercase' }}>Year</span>
                <strong style={{ fontSize: '0.95rem' }}>{car?.year}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#777', display: 'block', textTransform: 'uppercase' }}>Colour</span>
                <strong style={{ fontSize: '0.95rem' }}>{car?.color}</strong>
              </div>
            </div>
          </div>

          {/* Financials & Payout Calculations */}
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 30, background: '#fff' }}>
            <h3 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #ddd', paddingBottom: 6, fontSize: '1rem', color: '#333' }}>Deal Summary & Commission</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <span>Listed Selling Price</span>
              <strong style={{ fontSize: '1.05rem' }}>£{contract.price.toLocaleString()}</strong>
            </div>
            
            {/* Show Platform Commission details (always visible to all per requirements) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', color: '#555' }}>
              <span>
                Platform Commission Fee 
                <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: 8 }}>
                  ({contract.commissionType === 'percentage' ? `${contract.commissionRate}%` : `Flat rate £${contract.commissionRate}`})
                </span>
              </span>
              <strong style={{ color: '#d96c6c' }}>
                {contract.step >= 2 ? `- £${contract.commissionAmount.toLocaleString()}` : <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.85rem' }}>Awaiting Admin approval</span>}
              </strong>
            </div>

            {/* Calculations depending on who is looking */}
            {isSeller && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontSize: '1.1rem' }}>
                <strong>Net Payout to Seller</strong>
                <strong style={{ color: 'var(--mm-green)', fontSize: '1.25rem' }}>
                  {contract.step >= 2 ? `£${(contract.price - contract.commissionAmount).toLocaleString()}` : 'Pending admin review'}
                </strong>
              </div>
            )}
            
            {isBuyer && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontSize: '1.1rem' }}>
                <strong>Total Amount Payable</strong>
                <strong style={{ color: 'var(--mm-blue)', fontSize: '1.25rem' }}>£{contract.price.toLocaleString()}</strong>
              </div>
            )}

            {isAdmin && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderRight: '1px solid #eee', paddingRight: 20 }}>
                  <span style={{ color: '#555' }}>Buyer Pays:</span>
                  <strong>£{contract.price.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 20 }}>
                  <span style={{ color: '#555' }}>Seller Receives:</span>
                  <strong>£{(contract.price - contract.commissionAmount).toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Signature Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 40 }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#555', fontSize: '0.9rem' }}>Seller Signature</h4>
              <div style={{ border: '1px dashed #bbb', borderRadius: 6, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', position: 'relative' }}>
                {contract.sellerSignature ? (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.4rem', color: '#333' }}>{contract.sellerSignature}</span>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#888', marginTop: 4 }}>Signed: {contract.sellerSignedAt}</span>
                  </div>
                ) : (
                  <span style={{ color: '#bbb', fontStyle: 'italic', fontSize: '0.85rem' }}>Awaiting Seller Signature</span>
                )}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#555', fontSize: '0.9rem' }}>Buyer Signature</h4>
              <div style={{ border: '1px dashed #bbb', borderRadius: 6, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', position: 'relative' }}>
                {contract.buyerSignature ? (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.4rem', color: '#333' }}>{contract.buyerSignature}</span>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#888', marginTop: 4 }}>Signed: {contract.buyerSignedAt}</span>
                  </div>
                ) : (
                  <span style={{ color: '#bbb', fontStyle: 'italic', fontSize: '0.85rem' }}>Awaiting Buyer Signature</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Area (Sign forms & Buttons) */}
          <div className="no-pdf" style={{ marginTop: 40, borderTop: '2px solid #eee', paddingTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {/* If step == 1 (initiated) & user == admin: show approve button */}
              {contract.step === 1 && isAdmin && (
                <div>
                  <p style={{ margin: '0 0 10px 0', color: '#e67e22', fontSize: '0.9rem' }}>★ Stamping commission and activating deal routes to Seller</p>
                  <button className="btn-solid" onClick={handleAdminApprove} disabled={signing}>
                    {signing ? 'Processing...' : 'Approve Contract & Stamp Commission'}
                  </button>
                </div>
              )}

              {/* If step == 2 & user == seller: show signature input form */}
              {contract.step === 2 && isSeller && (
                <form onSubmit={handleSellerSign} style={{ background: '#f5f7fa', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0', width: 400 }}>
                  <h4 style={{ margin: '0 0 12px 0' }}>Provide Details & Sign Contract</h4>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone Number</label>
                    <input type="text" value={sellerPhone} onChange={e => setSellerPhone(e.target.value)} required placeholder="e.g. +44 7700 900077" style={{ background: '#fff', border: '1px solid #ccc', color: '#111' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Home Address</label>
                    <input type="text" value={sellerAddress} onChange={e => setSellerAddress(e.target.value)} required placeholder="e.g. 21 Baker Street, London" style={{ background: '#fff', border: '1px solid #ccc', color: '#111' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Digital Signature (Type your Full Name)</label>
                    <input type="text" value={sellerSignature} onChange={e => setSellerSignature(e.target.value)} required placeholder="Type Name to Sign" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', background: '#fff', border: '1px solid #ccc', color: '#111' }} />
                  </div>
                  <button type="submit" className="btn-solid" disabled={signing} style={{ width: '100%' }}>
                    {signing ? 'Signing...' : 'Sign & Forward to Buyer'}
                  </button>
                </form>
              )}

              {/* If step == 3 & user == buyer: show signature input form */}
              {contract.step === 3 && isBuyer && (
                <form onSubmit={handleBuyerSign} style={{ background: '#f5f7fa', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0', width: 400 }}>
                  <h4 style={{ margin: '0 0 12px 0' }}>Review & Sign Contract to Complete Deal</h4>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 12 }}>
                    By signing, you agree to purchase the vehicle under the details listed above.
                  </p>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Digital Signature (Type your Full Name)</label>
                    <input type="text" value={buyerSignature} onChange={e => setBuyerSignature(e.target.value)} required placeholder="Type Name to Sign" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', background: '#fff', border: '1px solid #ccc', color: '#111' }} />
                  </div>
                  <button type="submit" className="btn-solid" disabled={signing} style={{ width: '100%' }}>
                    {signing ? 'Signing...' : 'Sign & Complete Deal'}
                  </button>
                </form>
              )}

              {/* Completed message */}
              {contract.step === 4 && (
                <div style={{ color: 'var(--mm-green)', fontWeight: 600 }}>
                  ✓ This deal is fully completed and signed by both parties.
                </div>
              )}
            </div>

            {/* PDF download (only available if contract is approved by admin (step >= 2)) */}
            {contract.step >= 2 && (
              <button className="btn-solid" onClick={downloadPDF} style={{ background: '#e74c3c' }}>
                📄 Download Contract PDF
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
