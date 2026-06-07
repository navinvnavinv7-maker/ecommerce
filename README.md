# 🛍️ Nexus Couture Shop — Full-Stack MERN E-Commerce

A premium, modern full-stack e-commerce web application built with React, Tailwind CSS, Node.js, Express, MongoDB, and JWT Authentication.

## 🌐 Live Demo

| | URL |
|---|---|
| 🖥️ App | https://navin-ecommerce.onrender.com |
| 🐙 GitHub | https://github.com/navinvnavinv7-maker/ecommerce |

> ⚠️ Hosted on Render free tier — first load may take 30–50 seconds to wake up.

---

## ✨ Features

- 🔐 **JWT Authentication** — Register/Login with bcryptjs password hashing
- 👤 **Role-Based Access** — Admin and Customer roles
- 🛍️ **Product Catalog** — Browse products with search and category filters
- 🛒 **Shopping Cart** — Add, remove, update quantities with live totals
- 💳 **Checkout** — Shipping form with order confirmation
- ⚙️ **Admin Panel** — Full product CRUD + order management
- 📦 **Order Tracking** — Update order status (Pending/Processing/Shipped/Delivered)
- 🗑️ **Delete Orders** — Admin can delete orders with confirmation
- 🍃 **MongoDB Atlas** — Cloud database with auto-seeding
- 📱 **Responsive UI** — Works on mobile and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Tailwind CSS v4 |
| Animations | motion/react, Lucide Icons |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| Deployment | Render (full-stack) |

---

## 📂 Project Structure

```
ecommerce/
├── client/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── SystemStatusBanner.jsx
│       │   ├── ShopView.jsx
│       │   ├── ProductCard.jsx
│       │   ├── CartView.jsx
│       │   ├── CheckoutView.jsx
│       │   ├── AdminView.jsx
│       │   ├── ProductModal.jsx
│       │   ├── DeleteProductModal.jsx
│       │   ├── DeleteOrderModal.jsx
│       │   ├── AuthModal.jsx
│       │   └── ToastNotification.jsx
│       ├── App.jsx
│       ├── config.js
│       ├── index.css
│       └── main.jsx
├── server/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── memoryDB.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── orders.js
│   ├── dbConnection.js
│   └── server.js
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Environment Variables

Create `.env` in root:

```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce
JWT_SECRET=your_secure_random_string
PORT=3000
NODE_ENV=development
```

---

## 🚀 Setup & Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/navinvnavinv7-maker/ecommerce.git
cd ecommerce
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create .env file
```bash
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET
```

### 4. Run development server
```bash
node server/server.js
```

Open: http://localhost:3000

---

## 🔑 Default Test Accounts

After first run, MongoDB auto-seeds these accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexus.io | admin |
| Customer | customer@nexus.io | customer |

---

## 🌍 Production Deployment

Deployed on **Render** as a single full-stack service:

| Setting | Value |
|---|---|
| Build Command | npm install && npm run build |
| Start Command | node server/server.js |
| Port | 3000 |

### Render Environment Variables:
```
MONGODB_URI = mongodb+srv://...
JWT_SECRET  = your_secret
PORT        = 3000
NODE_ENV    = production
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/products` | Get all products |
| POST | `/api/products` | Add product (Admin) |
| PUT | `/api/products/:id` | Update product (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |
| GET | `/api/orders` | Get all orders (Admin) |
| POST | `/api/orders` | Place new order |
| PUT | `/api/orders/:id` | Update order status |
| DELETE | `/api/orders/:id` | Delete order (Admin) |

---

## 📝 Notes

- Keep `.env` local — never commit it
- MongoDB Atlas auto-seeds 6 products on first run
- Frontend and backend run on same port (3000)
- No separate Vercel deployment needed

---

## 👨‍💻 Author

**Navin V**
B.E. Information Technology — APEC College of Engineering and Technology
Anna University | R-2021

- Email: navinvnavinv7@gmail.com
- GitHub: github.com/navinvnavinv7-maker
- LinkedIn: linkedin.com/in/navin-navin-72330637a

---

## 📄 License

MIT License
