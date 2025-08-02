# quick_desk
# 🧰 QuickDesk – Simple, Real-Time Help Desk System

QuickDesk is a streamlined, role-based help desk ticketing system that allows users to raise support tickets, track progress, and receive timely resolutions by support agents. Built with **React**, **Supabase**, and **TailwindCSS**, this project is designed for scalability, responsiveness, and real-time collaboration.

---
Deployment = [Link](https://preview--quick-desk-hub.lovable.app/auth)
Credentials = admin ==> quick_desk_hub_admin@gmail.com || admin@123
              agent ==> quick_desk_hub_agent@gmail.com || agent@123
              user ==> quick_desk_hub_user@gmail.com   || user@123
              
## 🚀 Features

### 👤 End Users (Customers/Employees)
- Register/Login using **Supabase Auth**
- Create tickets with subject, description, category, and optional attachment
- Track ticket status: Open → In Progress → Resolved → Closed
- Comment on own tickets (threaded replies)
- Filter/search tickets by status and category

### 🧑‍💻 Support Agents
- View all open/unassigned tickets
- Assign themselves to tickets
- Change ticket status and reply
- View threaded conversation per ticket

### 🛠️ Admins
- Manage user roles (user, agent, admin)
- Manage ticket categories
- View all tickets across the system

---

## 📦 Tech Stack

| Layer        | Technology                        |
|--------------|------------------------------------|
| Frontend     | React, TailwindCSS (or Shadcn/UI) |
| Backend      | Supabase (Database + Auth)        |
| Realtime     | Supabase Subscriptions (onInsert/onUpdate) |
| Deployment   | Vercel / Netlify + Supabase       |

---

## 🗃️ Database Schema (Supabase)

### `users`
- `id` (UUID, PK)
- `name` (text)
- `email` (text)
- `role` (text: 'user' | 'agent' | 'admin')

### `tickets`
- `id` (UUID, PK)
- `title` (text)
- `description` (text)
- `category` (text)
- `status` (text: 'open', 'in-progress', 'resolved', 'closed')
- `created_by` (FK to `users.id`)
- `assigned_to` (FK to `users.id`, nullable)
- `created_at` (timestamp)

### `comments`
- `id` (UUID)
- `ticket_id` (FK to `tickets.id`)
- `author_id` (FK to `users.id`)
- `content` (text)
- `created_at` (timestamp)

---

## 🔄 Real-time Features

- **Supabase Realtime** used to:
  - Auto-refresh ticket dashboards
  - Show new comments instantly
  - Notify agents of new tickets

---

## 🎨 UI/UX Guidelines

- Responsive layout for mobile & desktop
- Input validation for all forms
- Clean color scheme (consistent branding)
- Role-based navigation (only relevant features shown)
- Pagination, search, and filtering support

---

