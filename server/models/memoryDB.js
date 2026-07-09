// In-Memory Database Simulator mimicking MongoDB / Mongoose collections
export const users = [
  {
    _id: "u1",
    username: "admin",
    email: "admin@nexus.io",
    password: "$2a$10$324sd8fsfsf", // simulated bcrypt hash
    role: "admin"
  },
  {
    _id: "u2",
    username: "customer",
    email: "customer@nexus.io",
    password: "$2a$10$324sd8fsfsg",
    role: "customer"
  }
];

export const categories = [
  { _id: 'cat1', name: 'Peripherals', slug: 'peripherals' },
  { _id: 'cat2', name: 'Audio', slug: 'audio' },
  { _id: 'cat3', name: 'Accessories', slug: 'accessories' },
  { _id: 'cat4', name: 'Furniture', slug: 'furniture' },
  { _id: 'cat5', name: 'Monitors', slug: 'monitors' }
];

export const products = [
  {
    _id: "p1",
    id: "p1",
    sku: "NEX-KB-MECH-001",
    name: "Apex Pro Mechanical Keyboard",
    price: 189.99,
    discountPrice: 169.99,
    discountPercentage: 10,
    category: "Peripherals",
    brand: "Nexus",
    stock: 24,
    status: "active",
    featured: true,
    bestSeller: true,
    rating: 4.8,
    reviewsCount: 124,
    description: "OmniPoint adjustable switches and anodized black aluminum frame with customizable RGB lighting.",
    images: [{ url: "from-indigo-600 to-purple-600", alt: "Apex Pro Mechanical Keyboard", isPrimary: true }],
    tags: ["keyboard", "mechanical", "rgb"],
    specifications: { Switches: "OmniPoint", Layout: "TKL" }
  },
  {
    _id: "p2",
    id: "p2",
    sku: "NEX-HDP-ANC-002",
    name: "Aero-X ANC Wireless Headphones",
    price: 299.99,
    category: "Audio",
    brand: "Nexus",
    stock: 15,
    status: "active",
    featured: true,
    bestSeller: false,
    rating: 4.9,
    reviewsCount: 87,
    description: "Studio-grade sound profiles with adaptive active noise cancellation and 40-hour deep battery life.",
    images: [{ url: "from-cyan-600 to-blue-600", alt: "Aero-X ANC Wireless Headphones", isPrimary: true }],
    tags: ["audio", "wireless", "anc"],
    specifications: { Battery: "40h", Noise: "Adaptive ANC" }
  },
  {
    _id: "p3",
    id: "p3",
    sku: "NEX-LGT-DESK-003",
    name: "Quantum Desk Light Bar",
    price: 79.99,
    category: "Accessories",
    brand: "Nexus",
    stock: 42,
    status: "active",
    featured: false,
    bestSeller: false,
    rating: 4.6,
    reviewsCount: 62,
    description: "Asymmetric optical glare-reduction with dual ambient glow backlighting and high-accuracy wireless dial.",
    images: [{ url: "from-amber-500 to-orange-600", alt: "Quantum Desk Light Bar", isPrimary: true }],
    tags: ["desk", "lighting", "accessory"],
    specifications: { Brightness: "1200 lumens" }
  },
  {
    _id: "p4",
    id: "p4",
    sku: "NEX-DESK-ERG-004",
    name: "Ergoprop Solid standing Desk",
    price: 549.99,
    category: "Furniture",
    brand: "Nexus",
    stock: 8,
    status: "active",
    featured: true,
    bestSeller: true,
    rating: 4.7,
    reviewsCount: 45,
    description: "Dual motors workspace desk with native organic bamboo top, smart memory control presets, and safety collision stop.",
    images: [{ url: "from-emerald-600 to-teal-700", alt: "Ergoprop Solid standing Desk", isPrimary: true }],
    tags: ["desk", "standing", "furniture"],
    specifications: { Material: "Bamboo", Motors: "Dual" }
  },
  {
    _id: "p5",
    id: "p5",
    sku: "NEX-BAG-DAILY-005",
    name: "Nomad Daily Packable Backpack",
    price: 129.99,
    category: "Accessories",
    brand: "Nexus",
    stock: 31,
    status: "active",
    featured: false,
    bestSeller: false,
    rating: 4.5,
    reviewsCount: 39,
    description: "Cordura weatherproof fabric with dual clamshell compartments and secure passport protection pocket.",
    images: [{ url: "from-rose-500 to-pink-600", alt: "Nomad Daily Packable Backpack", isPrimary: true }],
    tags: ["accessory", "backpack", "travel"],
    specifications: { Material: "Cordura", Capacity: "20L" }
  },
  {
    _id: "p6",
    id: "p6",
    sku: "NEX-MON-ULTRA-006",
    name: "Eclipse QD-OLED UltraWide Monitor",
    price: 899.99,
    category: "Monitors",
    brand: "Nexus",
    stock: 12,
    status: "active",
    featured: true,
    bestSeller: true,
    rating: 4.9,
    reviewsCount: 73,
    description: "34-inch QD-OLED professional curved panel with rapid 175Hz refresh and back-channel active sync lighting.",
    images: [{ url: "from-violet-600 to-fuchsia-600", alt: "Eclipse QD-OLED UltraWide Monitor", isPrimary: true }],
    tags: ["monitor", "display", "ultrawide"],
    specifications: { Panel: "QD-OLED", Refresh: "175Hz" }
  }
];

export const orders = [
  {
    _id: "ord-8831",
    id: "ord-8831",
    date: "2026-06-05T10:14:00Z",
    customer: "Jane Cooper",
    email: "jane.cooper@example.com",
    items: [
      { id: "p1", name: "Apex Pro Mechanical Keyboard", price: 189.99, quantity: 1 }
    ],
    shippingAddress: {
      fullName: "Jane Cooper",
      street: "1248 Oakwood Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94107",
      country: "USA"
    },
    subtotal: 189.99,
    total: 199.98,
    status: "Processing"
  },
  {
    _id: "ord-4209",
    id: "ord-4209",
    date: "2026-06-04T16:45:00Z",
    customer: "Alex Rivera",
    email: "alex.rivera@example.com",
    items: [
      { id: "p3", name: "Quantum Desk Light Bar", price: 79.99, quantity: 2 },
      { id: "p5", name: "Nomad Daily Packable Backpack", price: 129.99, quantity: 1 }
    ],
    shippingAddress: {
      fullName: "Alex Rivera",
      street: "702 Broad St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      country: "USA"
    },
    subtotal: 289.97,
    total: 299.96,
    status: "Shipped"
  }
];
