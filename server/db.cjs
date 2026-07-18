const knex = require('knex');
const path = require('path');
require('dotenv').config();

// Determine database configuration from environment
const isMySQL = process.env.DB_CLIENT === 'mysql2';

const dbConfig = isMySQL ? {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'carfever',
    port: Number(process.env.DB_PORT) || 3606
  },
  useNullAsDefault: true
} : {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../carfever.db')
  },
  useNullAsDefault: true
};

const db = knex(dbConfig);

// Seed Data
const DEFAULT_USERS = [
  { id: 'admin-1', email: 'admin@carfever.co.uk', password: 'admin123', name: 'Admin Khan', role: 'admin', active: 1, createdAt: '2026-01-01' },
  { id: 'demo-seller-1', email: 'seller@demo.com', password: 'seller123', name: 'James H.', role: 'seller', active: 1, createdAt: '2026-03-15' },
  { id: 'demo-seller-2', email: 'elite@motors.com', password: 'seller123', name: 'Elite Motors', role: 'seller', active: 1, createdAt: '2026-02-20' },
  { id: 'demo-seller-3', email: 'david@private.com', password: 'seller123', name: 'David R.', role: 'seller', active: 1, createdAt: '2026-04-10' },
  { id: 'demo-buyer-1', email: 'buyer@demo.com', password: 'buyer123', name: 'Ali B.', role: 'buyer', active: 1, createdAt: '2026-05-01' },
];

const DEFAULT_CARS = [
  { id: 'c1', make: 'BMW', model: '3 Series M Sport', year: 2023, price: 38995, mileage: 12400, fuel: 'Petrol', trans: 'Automatic', engine: '2.0L', color: 'Alpine White', city: 'London', bodyType: 'Sedan', description: 'Stunning BMW 3 Series M Sport with full leather interior, heated seats, sat nav, and premium audio. Full BMW service history.', features: JSON.stringify(['Heated Seats', 'Sat Nav', 'Leather Interior', 'Parking Sensors', 'LED Headlights']), badges: JSON.stringify(['featured', 'verified']), sellerId: 'demo-seller-1', sellerName: 'James H.', sellerType: 'Dealer', verified: 1, inspected: 1, status: 'active', engineScore: 92, exteriorScore: 88, interiorScore: 95, transScore: 90, views: 342, createdAt: '2026-07-10' },
  { id: 'c2', make: 'Mercedes-Benz', model: 'C-Class AMG Line', year: 2024, price: 42750, mileage: 3200, fuel: 'Diesel', trans: 'Automatic', engine: '2.0L', color: 'Obsidian Black', city: 'Manchester', bodyType: 'Sedan', description: 'Nearly new Mercedes C-Class AMG Line with stunning spec. Ambient lighting, MBUX system, digital cockpit.', features: JSON.stringify(['AMG Styling', 'MBUX', 'Digital Cockpit', 'Ambient Lighting', 'Keyless Entry']), badges: JSON.stringify(['new', 'verified']), sellerId: 'demo-seller-2', sellerName: 'Elite Motors', sellerType: 'Dealer', verified: 1, inspected: 1, status: 'active', engineScore: 96, exteriorScore: 94, interiorScore: 97, transScore: 95, views: 518, createdAt: '2026-07-12' },
  { id: 'c3', make: 'Audi', model: 'Q5 S Line', year: 2022, price: 35490, mileage: 28600, fuel: 'Diesel', trans: 'Automatic', engine: '2.0L TDI', color: 'Mythos Black', city: 'Birmingham', bodyType: 'SUV', description: 'Audi Q5 S Line with quattro all-wheel drive. Virtual cockpit, MMI navigation plus, and bang & olufsen sound.', features: JSON.stringify(['Quattro AWD', 'Virtual Cockpit', 'B&O Sound', 'MMI Nav', 'Rear Camera']), badges: JSON.stringify(['verified']), sellerId: 'demo-seller-3', sellerName: 'David R.', sellerType: 'Private', verified: 1, inspected: 0, status: 'active', engineScore: 85, exteriorScore: 82, interiorScore: 88, transScore: 87, views: 189, createdAt: '2026-07-08' },
  { id: 'c4', make: 'Volkswagen', model: 'Golf R', year: 2023, price: 34995, mileage: 8900, fuel: 'Petrol', trans: 'Automatic', engine: '2.0L TSI', color: 'Lapiz Blue', city: 'Leeds', bodyType: 'Hatchback', description: 'VW Golf R with 320bhp. Akrapovic exhaust, DCC adaptive suspension, and 19" Estoril alloys.', features: JSON.stringify(['320bhp', 'Akrapovic Exhaust', 'DCC Suspension', 'Digital Cockpit', 'Apple CarPlay']), badges: JSON.stringify(['featured']), sellerId: 'demo-seller-1', sellerName: 'AutoMax UK', sellerType: 'Dealer', verified: 1, inspected: 1, status: 'active', engineScore: 91, exteriorScore: 89, interiorScore: 90, transScore: 93, views: 267, createdAt: '2026-07-05' },
  { id: 'c5', make: 'Range Rover', model: 'Evoque R-Dynamic', year: 2023, price: 46500, mileage: 15300, fuel: 'Petrol', trans: 'Automatic', engine: '2.0L', color: 'Eiger Grey', city: 'London', bodyType: 'SUV', description: 'Range Rover Evoque R-Dynamic with panoramic roof, meridian sound, and 3D surround camera.', features: JSON.stringify(['Panoramic Roof', 'Meridian Sound', '3D Camera', 'Heated Seats', 'Wireless Charging']), badges: JSON.stringify(['featured', 'verified']), sellerId: 'demo-seller-2', sellerName: 'Park Lane Motors', sellerType: 'Dealer', verified: 1, inspected: 1, status: 'active', engineScore: 88, exteriorScore: 91, interiorScore: 93, transScore: 86, views: 421, createdAt: '2026-07-11' },
];

const DEFAULT_INQUIRIES = [
  { id: 'inq1', carId: 'c1', buyerId: 'demo-buyer-1', buyerName: 'Ali B.', sellerId: 'demo-seller-1', message: "Hi, I'm interested in the BMW 3 Series. Is it still available?", reply: "Yes it is! Would you like to schedule a viewing?", createdAt: '2026-07-14', status: 'replied' },
  { id: 'inq2', carId: 'c5', buyerId: 'demo-buyer-1', buyerName: 'Ali B.', sellerId: 'demo-seller-2', message: "What's the lowest you'd accept for the Evoque?", reply: '', createdAt: '2026-07-16', status: 'pending' },
];

async function initDb() {
  console.log(`Initializing database using: ${isMySQL ? 'MySQL' : 'SQLite3'}`);

  // Create Users Table
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', table => {
      table.string('id').primary();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('name').notNullable();
      table.string('role').notNullable();
      table.boolean('active').defaultTo(true);
      table.string('createdAt').notNullable();
    });
    console.log('Created table: users');
  }

  // Create Listings Table
  if (!(await db.schema.hasTable('listings'))) {
    await db.schema.createTable('listings', table => {
      table.string('id').primary();
      table.string('make').notNullable();
      table.string('model').notNullable();
      table.integer('year').notNullable();
      table.integer('price').notNullable();
      table.integer('mileage').notNullable();
      table.string('fuel').notNullable();
      table.string('trans').notNullable();
      table.string('engine').notNullable();
      table.string('color').notNullable();
      table.string('city').notNullable();
      table.string('bodyType').notNullable();
      table.text('description');
      table.text('features'); // Stringified JSON array
      table.text('badges'); // Stringified JSON array
      table.string('sellerId').notNullable();
      table.string('sellerName').notNullable();
      table.string('sellerType').notNullable();
      table.boolean('verified').defaultTo(false);
      table.boolean('inspected').defaultTo(false);
      table.string('status').notNullable().defaultTo('pending'); // active, pending, rejected
      table.integer('engineScore').defaultTo(85);
      table.integer('exteriorScore').defaultTo(85);
      table.integer('interiorScore').defaultTo(85);
      table.integer('transScore').defaultTo(85);
      table.integer('views').defaultTo(0);
      table.string('createdAt').notNullable();
    });
    console.log('Created table: listings');
  }

  // Ensure listings table has images and videos columns (migration support)
  if (await db.schema.hasTable('listings')) {
    if (!(await db.schema.hasColumn('listings', 'images'))) {
      await db.schema.table('listings', table => {
        table.text('images');
      });
      console.log('Added column: images to listings');
    }
    if (!(await db.schema.hasColumn('listings', 'videos'))) {
      await db.schema.table('listings', table => {
        table.text('videos');
      });
      console.log('Added column: videos to listings');
    }
  }

  // Create Inquiries Table
  if (!(await db.schema.hasTable('inquiries'))) {
    await db.schema.createTable('inquiries', table => {
      table.string('id').primary();
      table.string('carId').notNullable();
      table.string('buyerId').notNullable();
      table.string('buyerName').notNullable();
      table.string('sellerId').notNullable();
      table.text('message').notNullable();
      table.text('reply').defaultTo('');
      table.string('status').notNullable().defaultTo('pending'); // pending, replied
      table.string('createdAt').notNullable();
    });
    console.log('Created table: inquiries');
  }

  // Create Wishlist Table
  if (!(await db.schema.hasTable('wishlist'))) {
    await db.schema.createTable('wishlist', table => {
      table.string('userId').notNullable();
      table.string('carId').notNullable();
      table.primary(['userId', 'carId']);
    });
    console.log('Created table: wishlist');
  }

  // Create Settings Table
  if (!(await db.schema.hasTable('settings'))) {
    await db.schema.createTable('settings', table => {
      table.string('key').primary();
      table.string('value').notNullable();
    });
    console.log('Created table: settings');
  }

  // Create Contracts Table
  if (!(await db.schema.hasTable('contracts'))) {
    await db.schema.createTable('contracts', table => {
      table.string('id').primary();
      table.string('carId').notNullable();
      table.string('buyerId').notNullable();
      table.string('sellerId').notNullable();
      table.string('buyerName').notNullable();
      table.string('buyerEmail').notNullable();
      table.string('buyerPhone').notNullable();
      table.string('buyerAddress').notNullable();
      table.string('buyerSignature');
      table.string('buyerSignedAt');
      table.string('sellerName').notNullable();
      table.string('sellerEmail').notNullable();
      table.string('sellerPhone').notNullable();
      table.string('sellerAddress').notNullable();
      table.string('sellerSignature');
      table.string('sellerSignedAt');
      table.integer('price').notNullable();
      table.string('commissionType').notNullable().defaultTo('percentage'); // percentage, flat
      table.float('commissionRate').notNullable().defaultTo(5.0);
      table.float('commissionAmount').notNullable().defaultTo(0.0);
      table.string('status').notNullable().defaultTo('initiated'); // initiated, admin_approved, seller_signed, completed
      table.integer('step').notNullable().defaultTo(1);
      table.string('createdAt').notNullable();
    });
    console.log('Created table: contracts');
  }

  // Seed default data if users is empty
  const usersCount = await db('users').count('id as count').first();
  if (Number(usersCount.count) === 0) {
    console.log('Seeding initial data...');
    await db('users').insert(DEFAULT_USERS);
    await db('listings').insert(DEFAULT_CARS);
    await db('inquiries').insert(DEFAULT_INQUIRIES);
    
    // Seed default settings
    await db('settings').insert([
      { key: 'commission_type', value: 'percentage' },
      { key: 'commission_rate', value: '5' } // 5%
    ]);
    console.log('Database seeded successfully.');
  }
}

module.exports = {
  db,
  initDb
};
