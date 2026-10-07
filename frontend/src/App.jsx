import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Security & Theme
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const correctPin = '1234';

  // Wallet State
  const [userId, setUserId] = useState(1);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  
  // Payment & Navigation
  const [paymentMode, setPaymentMode] = useState('mobile'); 
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [totalBill, setTotalBill] = useState('');
  const [splitCount, setSplitCount] = useState(2);
  const [scannedQR, setScannedQR] = useState(false);

  // Top-Up State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  // Biometric (Face ID) & PIN Modal States
  const [showFaceIdModal, setShowFaceIdModal] = useState(false);
  const [faceIdStatus, setFaceIdStatus] = useState('scanning'); // 'scanning', 'success', 'failed'
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [transactionPin, setTransactionPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick Contacts
  const contacts = [
    { id: 2, name: 'Rahul Sharma', phone: '9876543210' },
    { id: 3, name: 'Priya Verma', phone: '9123456789' },
    { id: 4, name: 'Amit Patel', phone: '9988776655' }
  ];

  const fetchData = async () => {
    try {
      const walletRes = await axios.get(`http://localhost:8080/api/payments/wallet/${userId}`);
      setBalance(walletRes.data.balance);

      const historyRes = await axios.get(`http://localhost:8080/api/payments/history/${userId}`);
      setTransactions(historyRes.data);
    } catch (err) {
      console.error("Error loading wallet data", err);
    }
  };

  useEffect(() => {
    if (isUnlocked) fetchData();
  }, [userId, isUnlocked]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passcode === correctPin) {
      setIsUnlocked(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscode('');
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:8080/api/payments/topup?userId=${userId}&amount=${topUpAmount}`);
      setShowTopUpModal(false);
      setTopUpAmount('');
      fetchData();
    } catch (err) {
      alert('Top-up failed');
    }
  };

  // Step 1: User clicks "Pay Now" -> Triggers Face ID check first!
  const handleInitiatePayment = (e) => {
    e.preventDefault();
    setShowFaceIdModal(true);
    setFaceIdStatus('scanning');

    // Simulate Face ID scan delay (2 seconds)
    setTimeout(() => {
      setFaceIdStatus('success');
      setTimeout(() => {
        setShowFaceIdModal(false);
        // After Face ID passes, pop open standard UPI PIN entry for final security confirmation
        setShowPinModal(true);
        setTransactionPin('');
        setPinError(false);
      }, 1000);
    }, 2000);
  };

  // Step 2: Confirm Transaction via PIN
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (transactionPin !== correctPin) {
      setPinError(true);
      setTransactionPin('');
      return;
    }

    setShowPinModal(false);
    setLoading(true);

    try {
      const payAmount = paymentMode === 'split' ? (totalBill / splitCount).toFixed(2) : amount;
      
      const response = await axios.post(
        `http://localhost:8080/api/payments/pay?senderId=${userId}&receiverId=2&amount=${payAmount}&paymentMethod=WALLET`
      );
      
      setSuccessReceipt({
        amount: payAmount,
        refId: response.data.transactionReferenceId,
        date: new Date().toLocaleString()
      });

      setAmount('');
      setMobileNumber('');
      setTotalBill('');
      setScannedQR(false);
      fetchData();
    } catch (error) {
      setStatusMessage(`Payment Failed: ${error.response?.data || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: darkMode ? '#121212' : '#f8f9fa',
    cardBg: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#e0e0e0' : '#1a1a1a',
    subText: darkMode ? '#aaa' : '#666',
    border: darkMode ? '#333' : '#e1e4e8'
  };

  if (!isUnlocked) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'Inter, sans-serif', background: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h2 style={{ color: '#007bff', marginBottom: '8px' }}>⚡ QuickPay Secure</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Enter PIN (Default: 1234)</p>
        <form onSubmit={handleUnlock}>
          <input 
            type="password" 
            maxLength="4" 
            placeholder="••••"
            value={passcode} 
            onChange={(e) => setPasscode(e.target.value)} 
            style={{ width: '150px', padding: '12px', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '16px' }}
            required
            autoFocus
          />
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Unlock Wallet
          </button>
        </form>
        {passcodeError && <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '12px' }}>❌ Incorrect PIN.</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '30px auto', fontFamily: 'Inter, sans-serif', background: theme.bg, color: theme.text, padding: '24px', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', transition: 'all 0.3s' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>⚡ QuickPay Wallet</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '5px 10px', fontSize: '12px', background: darkMode ? '#ffc107' : '#343a40', color: darkMode ? '#000' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button onClick={() => setIsUnlocked(false)} style={{ padding: '5px 10px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Lock
          </button>
        </div>
      </div>

      {/* Balance & Add Money Banner */}
      <div style={{ background: 'linear-gradient(135deg, #007bff, #0056b3)', color: 'white', padding: '20px', borderRadius: '10px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '14px', opacity: 0.9 }}>Available Balance</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '4px' }}>₹{balance}</div>
        </div>
        <button onClick={() => setShowTopUpModal(true)} style={{ padding: '10px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          + Add Money
        </button>
      </div>

      {/* Recent Contacts */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: theme.subText, display: 'block', marginBottom: '8px' }}>QUICK PAY BENEFICIARIES</label>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {contacts.map(c => (
            <div 
              key={c.id} 
              onClick={() => { setMobileNumber(c.phone); setPaymentMode('mobile'); }}
              style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', minWidth: '90px' }}
            >
              <div style={{ width: '32px', height: '32px', background: '#007bff', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontWeight: 'bold', fontSize: '14px' }}>
                {c.name[0]}
              </div>
              <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{c.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Tabs */}
      <div style={{ display: 'flex', marginBottom: '16px', background: darkMode ? '#222' : '#e9ecef', padding: '4px', borderRadius: '8px', gap: '4px' }}>
        {['mobile', 'qr', 'split'].map(mode => (
          <button 
            key={mode}
            onClick={() => setPaymentMode(mode)}
            style={{ flex: 1, padding: '10px', border: 'none', background: paymentMode === mode ? theme.cardBg : 'transparent', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: paymentMode === mode ? '#007bff' : theme.subText }}
          >
            {mode === 'mobile' ? '📱 Mobile' : mode === 'qr' ? '📷 QR Scan' : '🍕 Split Bill'}
          </button>
        ))}
      </div>

      {/* Payment Form Container */}
      <div style={{ background: theme.cardBg, padding: '20px', borderRadius: '10px', border: `1px solid ${theme.border}`, marginBottom: '24px' }}>
        <form onSubmit={handleInitiatePayment}>
          {paymentMode === 'mobile' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Receiver Mobile Number</label>
              <input type="tel" placeholder="Enter 10-digit number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, boxSizing: 'border-box' }} required />
            </div>
          )}

          {paymentMode === 'qr' && (
            <div style={{ marginBottom: '16px', textAlign: 'center', padding: '15px', border: '2px dashed #007bff', borderRadius: '8px', background: darkMode ? '#1a2634' : '#f0f7ff' }}>
              <p style={{ margin: '0 0 10px 0', color: '#0056b3', fontWeight: '500' }}>{scannedQR ? "✅ QR Code Scanned!" : "Point camera at merchant QR"}</p>
              {!scannedQR ? (
                <button type="button" onClick={() => setScannedQR(true)} style={{ padding: '6px 14px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Simulate Scan</button>
              ) : (
                <span style={{ fontSize: '12px', color: '#28a745' }}>Merchant: QuickPay Store #402</span>
              )}
            </div>
          )}

          {paymentMode === 'split' && (
            <div style={{ marginBottom: '16px', padding: '15px', background: darkMode ? '#2c2518' : '#fff8f0', borderRadius: '8px', border: '1px solid #ffeeba' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#856404' }}>Split Bill Calculator</h4>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600' }}>Total Bill (INR)</label>
                <input type="number" placeholder="1200" value={totalBill} onChange={(e) => setTotalBill(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600' }}>Split With (People)</label>
                <input type="number" min="1" value={splitCount} onChange={(e) => setSplitCount(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              </div>
              {totalBill && <div style={{ background: '#fff3cd', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#856404', textAlign: 'center' }}>Your Share: ₹{(totalBill / splitCount).toFixed(2)}</div>}
            </div>
          )}

          {paymentMode !== 'split' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Amount (INR)</label>
              <input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, boxSizing: 'border-box' }} required />
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Processing...' : 'Pay Now with Face ID'}
          </button>
        </form>
      </div>

      {/* FACE ID MODAL */}
      {showFaceIdModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ background: theme.cardBg, color: theme.text, padding: '30px', borderRadius: '16px', width: '280px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '48px', margin: '10px 0' }}>
              {faceIdStatus === 'scanning' ? '📷' : '✅'}
            </div>
            <h3 style={{ margin: '10px 0 5px 0' }}>
              {faceIdStatus === 'scanning' ? 'Scanning Face...' : 'Face Recognized!'}
            </h3>
            <p style={{ fontSize: '12px', color: theme.subText }}>
              {faceIdStatus === 'scanning' ? 'Verifying biometric identity' : 'Redirecting to UPI PIN...'}
            </p>
          </div>
        </div>
      )}

      {/* TOP-UP MODAL */}
      {showTopUpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: theme.cardBg, color: theme.text, padding: '25px', borderRadius: '12px', width: '300px', textAlign: 'center' }}>
            <h3>💳 Add Money to Wallet</h3>
            <form onSubmit={handleTopUp}>
              <input type="number" placeholder="Enter amount" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} style={{ width: '100%', padding: '10px', margin: '15px 0', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc' }} required />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowTopUpModal(false)} style={{ flex: 1, padding: '8px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '8px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION PIN MODAL */}
      {showPinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: theme.cardBg, color: theme.text, padding: '25px', borderRadius: '12px', width: '300px', textAlign: 'center' }}>
            <h3>🔒 Enter UPI PIN</h3>
            <p style={{ fontSize: '12px', color: theme.subText }}>PIN: 1234</p>
            <form onSubmit={handleConfirmPayment}>
              <input type="password" maxLength="4" placeholder="••••" value={transactionPin} onChange={(e) => setTransactionPin(e.target.value)} style={{ width: '120px', padding: '10px', fontSize: '20px', textAlign: 'center', letterSpacing: '6px', margin: '10px 0', borderRadius: '6px', border: '1px solid #ccc' }} required autoFocus />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowPinModal(false)} style={{ flex: 1, padding: '8px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '8px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Confirm</button>
              </div>
            </form>
            {pinError && <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '8px' }}>❌ Wrong PIN</p>}
          </div>
        </div>
      )}

      {/* SUCCESS RECEIPT MODAL */}
      {successReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', color: '#333', padding: '30px', borderRadius: '16px', width: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '50px', height: '50px', background: '#28a745', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 15px auto' }}>✓</div>
            <h3 style={{ margin: '0 0 5px 0', color: '#28a745' }}>Payment Successful!</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>₹{successReceipt.amount}</p>
            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#555', textAlign: 'left', margin: '15px 0' }}>
              <p style={{ margin: '4px 0' }}><b>Ref ID:</b> {successReceipt.refId}</p>
              <p style={{ margin: '4px 0' }}><b>Time:</b> {successReceipt.date}</p>
            </div>
            <button onClick={() => setSuccessReceipt(null)} style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Recent Transactions</h3>
      <div style={{ background: theme.cardBg, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: darkMode ? '#222' : '#f1f3f5', color: theme.subText }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Amount</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Reference</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id} style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '10px' }}>{tx.id}</td>
                  <td style={{ padding: '10px', fontWeight: '600' }}>₹{tx.amount}</td>
                  <td style={{ padding: '10px', color: tx.status === 'SUCCESS' ? '#28a745' : '#dc3545' }}>{tx.status}</td>
                  <td style={{ padding: '10px', fontSize: '11px', color: theme.subText }}>{tx.transactionReferenceId}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: theme.subText }}>No transactions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default App;