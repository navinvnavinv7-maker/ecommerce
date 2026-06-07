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

export const products = [
  {
    _id: "p1",
    id: "p1", // Frontend backward-compatibility
    name: "Apex Pro Mechanical Keyboard",
    price: 189.99,
    category: "Peripherals",
    rating: 4.8,
    reviewsCount: 124,
    description: "OmniPoint adjustable switches and anodized black aluminum frame with customizable RGB lighting.",
    image: "from-indigo-600 to-purple-600"
  },
  {
    _id: "p2",
    id: "p2",
    name: "Aero-X ANC Wireless Headphones",
    price: 299.99,
    category: "Audio",
    rating: 4.9,
    reviewsCount: 87,
    description: "Studio-grade sound profiles with adaptive active noise cancellation and 40-hour deep battery life.",
    image: "from-cyan-600 to-blue-600"
  },
  {
    _id: "p3",
    id: "p3",
    name: "Quantum Desk Light Bar",
    price: 79.99,
    category: "Accessories",
    rating: 4.6,
    reviewsCount: 62,
    description: "Asymmetric optical glare-reduction with dual ambient glow backlighting and high-accuracy wireless dial.",
    image: "from-amber-500 to-orange-600"
  },
  {
    _id: "p4",
    id: "p4",
    name: "Ergoprop Solid standing Desk",
    price: 549.99,
    category: "Furniture",
    rating: 4.7,
    reviewsCount: 45,
    description: "Dual motors workspace desk with native organic bamboo top, smart memory control presets, and safety collision stop.",
    image: "from-emerald-600 to-teal-700"
  },
  {
    _id: "p5",
    id: "p5",
    name: "Nomad Daily Packable Backpack",
    price: 129.99,
    category: "Accessories",
    rating: 4.5,
    reviewsCount: 39,
    description: "Cordura weatherproof fabric with dual clamshell compartments and secure passport protection pocket.",
    image: "from-rose-500 to-pink-600"
  },
  {
    _id: "p6",
    id: "p6",
    name: "Eclipse QD-OLED UltraWide Monitor",
    price: 899.99,
    category: "Monitors",
    rating: 4.9,
    reviewsCount: 73,
    description: "34-inch QD-OLED professional curved panel with rapid 175Hz refresh and back-channel active sync lighting.",
    image: "from-violet-600 to-fuchsia-600"
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
