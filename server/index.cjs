const express = require('express');
const cors = require('cors');
const { initDb, db } = require('./db.cjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Database Schema and seeds
initDb().catch(err => {
  console.error('Failed to initialize database:', err);
});

// Helper to generate IDs similar to the frontend helper
const genId = () => 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

/* ═══════════════════════════════════════════════════════════
   AUTH ENDPOINTS
   ═══════════════════════════════════════════════════════════ */

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields (name, email, password, role) are required' });
  }

  try {
    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = {
      id: genId(),
      email,
      password,
      name,
      role,
      active: 1,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    await db('users').insert(newUser);
    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error registering user' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db('users').where({ email, password }).first();
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error logging in' });
  }
});

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await db('users').whereNot({ role: 'admin' });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Toggle user active status (Admin only)
app.post('/api/users/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot toggle admin status' });
    }

    const nextActive = user.active ? 0 : 1;
    await db('users').where({ id }).update({ active: nextActive });
    res.json({ success: true, active: nextActive === 1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error toggling user status' });
  }
});

/* ═══════════════════════════════════════════════════════════
   LISTING ENDPOINTS
   ═══════════════════════════════════════════════════════════ */

// Fetch all listings
app.get('/api/listings', async (req, res) => {
  try {
    const cars = await db('listings');
    const parsed = cars.map(car => ({
      ...car,
      verified: !!car.verified,
      inspected: !!car.inspected,
      features: car.features ? JSON.parse(car.features) : [],
      badges: car.badges ? JSON.parse(car.badges) : [],
      images: car.images ? JSON.parse(car.images) : [],
      videos: car.videos ? JSON.parse(car.videos) : [],
      scores: {
        engine: car.engineScore,
        exterior: car.exteriorScore,
        interior: car.interiorScore,
        trans: car.transScore
      }
    }));
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching listings' });
  }
});

// Create listing
app.post('/api/listings', async (req, res) => {
  const {
    make, model, year, price, mileage, fuel, trans, engine, color, city, bodyType, description, features, sellerId, sellerName, sellerType, images, videos
  } = req.body;

  if (!make || !model || !price || !city || !sellerId) {
    return res.status(400).json({ error: 'Make, Model, Price, City, and Seller ID are required' });
  }

  try {
    const newCar = {
      id: genId(),
      make,
      model,
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage) || 0,
      fuel: fuel || 'Petrol',
      trans: trans || 'Automatic',
      engine: engine || '2.0L',
      color: color || 'Black',
      city,
      bodyType: bodyType || 'Sedan',
      description: description || '',
      features: JSON.stringify(features || []),
      badges: JSON.stringify([]),
      images: JSON.stringify(images || []),
      videos: JSON.stringify(videos || []),
      sellerId,
      sellerName,
      sellerType: sellerType || 'Private',
      verified: 0,
      inspected: 0,
      status: 'pending',
      engineScore: 85,
      exteriorScore: 80,
      interiorScore: 85,
      transScore: 85,
      views: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    await db('listings').insert(newCar);
    res.status(201).json({ 
      ...newCar, 
      features: JSON.parse(newCar.features), 
      badges: [],
      images: JSON.parse(newCar.images),
      videos: JSON.parse(newCar.videos)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating listing' });
  }
});

// Increment views on listing
app.post('/api/listings/:id/view', async (req, res) => {
  const { id } = req.params;
  try {
    await db('listings').where({ id }).increment('views', 1);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error incrementing views' });
  }
});

// Approve listing (Admin only)
app.post('/api/listings/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await db('listings').where({ id }).update({
      status: 'active',
      verified: 1,
      badges: JSON.stringify(['verified'])
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error approving listing' });
  }
});

// Reject listing (Admin only)
app.post('/api/listings/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await db('listings').where({ id }).update({ status: 'rejected' });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error rejecting listing' });
  }
});

// Delete listing
app.delete('/api/listings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db('listings').where({ id }).delete();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting listing' });
  }
});

/* ═══════════════════════════════════════════════════════════
   WISHLIST ENDPOINTS
   ═══════════════════════════════════════════════════════════ */

// Get user wishlist
app.get('/api/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const list = await db('wishlist')
      .join('listings', 'wishlist.carId', '=', 'listings.id')
      .where('wishlist.userId', userId)
      .select('listings.*');

    const parsed = list.map(car => ({
      ...car,
      verified: !!car.verified,
      inspected: !!car.inspected,
      features: car.features ? JSON.parse(car.features) : [],
      badges: car.badges ? JSON.parse(car.badges) : [],
      images: car.images ? JSON.parse(car.images) : [],
      videos: car.videos ? JSON.parse(car.videos) : [],
      scores: {
        engine: car.engineScore,
        exterior: car.exteriorScore,
        interior: car.interiorScore,
        trans: car.transScore
      }
    }));
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching wishlist' });
  }
});

// Add to wishlist
app.post('/api/wishlist', async (req, res) => {
  const { userId, carId } = req.body;
  if (!userId || !carId) {
    return res.status(400).json({ error: 'userId and carId are required' });
  }
  try {
    // Check if user is buyer
    const user = await db('users').where({ id: userId }).first();
    if (!user || user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only logged-in buyers can save cars to their wishlist.' });
    }

    const existing = await db('wishlist').where({ userId, carId }).first();
    if (existing) {
      return res.json({ success: true, msg: 'Already saved' });
    }

    await db('wishlist').insert({ userId, carId });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error adding to wishlist' });
  }
});

// Remove from wishlist
app.delete('/api/wishlist/:userId/:carId', async (req, res) => {
  const { userId, carId } = req.params;
  try {
    await db('wishlist').where({ userId, carId }).delete();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error removing from wishlist' });
  }
});

/* ═══════════════════════════════════════════════════════════
   INQUIRY ENDPOINTS
   ═══════════════════════════════════════════════════════════ */

// Fetch inquiries for seller
app.get('/api/inquiries/seller/:sellerId', async (req, res) => {
  const { sellerId } = req.params;
  try {
    const list = await db('inquiries').where({ sellerId }).orderBy('createdAt', 'desc');
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching inquiries' });
  }
});

// Fetch inquiries for buyer
app.get('/api/inquiries/buyer/:buyerId', async (req, res) => {
  const { buyerId } = req.params;
  try {
    const list = await db('inquiries').where({ buyerId }).orderBy('createdAt', 'desc');
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching inquiries' });
  }
});

// Send an inquiry
app.post('/api/inquiries', async (req, res) => {
  const { carId, buyerId, buyerName, sellerId, message } = req.body;
  if (!carId || !buyerId || !buyerName || !sellerId || !message) {
    return res.status(400).json({ error: 'All inquiry details are required' });
  }
  try {
    const newInquiry = {
      id: genId(),
      carId,
      buyerId,
      buyerName,
      sellerId,
      message,
      reply: '',
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await db('inquiries').insert(newInquiry);
    res.status(201).json(newInquiry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating inquiry' });
  }
});

// Reply to an inquiry
app.post('/api/inquiries/:id/reply', async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  if (!reply) {
    return res.status(400).json({ error: 'Reply text is required' });
  }
  try {
    await db('inquiries').where({ id }).update({
      reply,
      status: 'replied'
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error replying to inquiry' });
  }
});

/* ═══════════════════════════════════════════════════════════
   SETTINGS ENDPOINTS (Admin commission setup)
   ═══════════════════════════════════════════════════════════ */

app.get('/api/settings', async (req, res) => {
  try {
    const raw = await db('settings');
    const settings = {};
    raw.forEach(r => {
      settings[r.key] = r.value;
    });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  const { commission_type, commission_rate } = req.body;
  try {
    await db('settings').where({ key: 'commission_type' }).update({ value: commission_type });
    await db('settings').where({ key: 'commission_rate' }).update({ value: commission_rate });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating settings' });
  }
});

/* ═══════════════════════════════════════════════════════════
   CONTRACT WORKFLOW ENDPOINTS
   ═══════════════════════════════════════════════════════════ */

// Fetch contracts
app.get('/api/contracts', async (req, res) => {
  const { buyerId, sellerId } = req.query;
  try {
    let query = db('contracts')
      .join('listings', 'contracts.carId', '=', 'listings.id')
      .select('contracts.*', 'listings.make', 'listings.model', 'listings.year', 'listings.bodyType');

    if (buyerId) {
      query = query.where('contracts.buyerId', buyerId);
    } else if (sellerId) {
      query = query.where('contracts.sellerId', sellerId);
    }
    
    const data = await query;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching contracts' });
  }
});

// Fetch single contract details
app.get('/api/contracts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const contract = await db('contracts').where({ id }).first();
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    const car = await db('listings').where({ id: contract.carId }).first();
    res.json({ contract, car });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching contract' });
  }
});

// Step 1: Initiate Contract (Buyer)
app.post('/api/contracts', async (req, res) => {
  const { carId, buyerId, buyerName, buyerEmail, buyerPhone, buyerAddress } = req.body;
  if (!carId || !buyerId || !buyerName || !buyerEmail || !buyerPhone || !buyerAddress) {
    return res.status(400).json({ error: 'All buyer contract details are required' });
  }

  try {
    const car = await db('listings').where({ id: carId }).first();
    if (!car) {
      return res.status(404).json({ error: 'Car listing not found' });
    }

    const seller = await db('users').where({ id: car.sellerId }).first();
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Default commission setup
    const rawSettings = await db('settings');
    const settings = {};
    rawSettings.forEach(r => { settings[r.key] = r.value; });
    const commType = settings['commission_type'] || 'percentage';
    const commRate = Number(settings['commission_rate']) || 5.0;

    const newContract = {
      id: genId(),
      carId,
      buyerId,
      sellerId: car.sellerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      buyerSignature: '',
      buyerSignedAt: '',
      sellerName: seller.name,
      sellerEmail: seller.email,
      sellerPhone: '',
      sellerAddress: '',
      sellerSignature: '',
      sellerSignedAt: '',
      price: car.price,
      commissionType: commType,
      commissionRate: commRate,
      commissionAmount: 0.0,
      status: 'initiated',
      step: 1,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    await db('contracts').insert(newContract);
    res.status(201).json(newContract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error initiating contract' });
  }
});

// Step 2: Admin Approve Contract (Stamps commission)
app.post('/api/contracts/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const contract = await db('contracts').where({ id }).first();
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Get current admin settings for commission
    const rawSettings = await db('settings');
    const settings = {};
    rawSettings.forEach(r => { settings[r.key] = r.value; });
    const commType = settings['commission_type'] || 'percentage';
    const commRate = Number(settings['commission_rate']) || 5.0;

    let commAmount = 0.0;
    if (commType === 'percentage') {
      commAmount = (contract.price * commRate) / 100.0;
    } else {
      commAmount = commRate;
    }

    await db('contracts').where({ id }).update({
      commissionType: commType,
      commissionRate: commRate,
      commissionAmount: commAmount,
      status: 'admin_approved',
      step: 2
    });

    res.json({ success: true, commissionAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error approving contract' });
  }
});

// Step 3: Seller Signs & Accepts Contract (Enters phone/address/signature)
app.post('/api/contracts/:id/seller-sign', async (req, res) => {
  const { id } = req.params;
  const { sellerPhone, sellerAddress, sellerSignature } = req.body;
  if (!sellerPhone || !sellerAddress || !sellerSignature) {
    return res.status(400).json({ error: 'Seller phone, address, and signature are required' });
  }

  try {
    const contract = await db('contracts').where({ id }).first();
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    await db('contracts').where({ id }).update({
      sellerPhone,
      sellerAddress,
      sellerSignature,
      sellerSignedAt: new Date().toLocaleString(),
      status: 'seller_signed',
      step: 3
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error signing contract' });
  }
});

// Step 4: Buyer Final Signs & Completes Deal
app.post('/api/contracts/:id/buyer-sign', async (req, res) => {
  const { id } = req.params;
  const { buyerSignature } = req.body;
  if (!buyerSignature) {
    return res.status(400).json({ error: 'Buyer signature is required' });
  }

  try {
    const contract = await db('contracts').where({ id }).first();
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    await db('contracts').where({ id }).update({
      buyerSignature,
      buyerSignedAt: new Date().toLocaleString(),
      status: 'completed',
      step: 4
    });

    // Mark car listing as sold (status = 'sold')
    await db('listings').where({ id: contract.carId }).update({ status: 'sold' });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error completing contract' });
  }
});

/* ═══════════════════════════════════════════════════════════
   SERVER LISTENER
   ═══════════════════════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log(`carFever Server listening on port ${PORT}`);
});
