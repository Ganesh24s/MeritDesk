# MeritDesk – Multi-Tenant Intelligent SLA-Based Ticket Management Platform

MeritDesk is a production-ready enterprise SaaS application that allows multiple companies to register and use their own ticket management systems with full data isolation. It features an intelligent ticket assignment engine using Honour Score, Load Balancing, Skill Matching, and Predictive SLA Automation.

---

## 💻 Tech Stack

### Backend
- **Java 17 & Spring Boot 3.x**
- **Spring Security & JWT** (Role-Based Access Control)
- **Spring Data JPA & Hibernate**
- **Multi-Tenancy**: Shared-schema approach with `company_id` discriminator and `TenantContext` (`ThreadLocal`).
- **MySQL Database**
- **Spring Scheduler**: Cron job checking SLA deadlines and performing auto-reassignments.
- **JavaMailSender & Lombok**

### Frontend
- **React 18 & Vite**
- **Tailwind CSS v3** (Glassmorphic dark-theme aesthetics & transitions)
- **React Router v6**
- **Chart.js & React-Chartjs-2** (Analytics and performance trends)
- **React Hook Form & Axios**
- **React Toastify**

---

## 🏗️ Architecture & Core Features

### 1. Security & Data Isolation
- Standard multi-tenant filter: `TenantContext` stores the `company_id` extracted from the JWT token for the current request.
- Every repository query is scoped to the current tenant (`company_id`).

### 2. Intelligent Assignment Engine
- Multi-factor weighted score calculated for every available agent in the department:
  - **Workload (30%)**: Current load relative to max capacity.
  - **Honour Score (25%)**: Gamified score ranging from 0-100.
  - **Skill Match (20%)**: Number of matched required ticket skills.
  - **Availability (15%)**: Active/inactive status.
  - **SLA Performance (10%)**: Compliance rate in the last 30 days.

### 3. Gamified Honour Score System
- Score adjusts dynamically based on events:
  - SLA Met: `+5`
  - SLA Breach: `-10`
  - Positive Feedback (Rating 4+): `+2`
  - Negative Feedback (Rating <= 2): `-3`
  - Ticket Reopened: `-2`
  - KB Article Published: `+3`
  - Overflow Queue Access: Requires `Honour Score >= 80`.

### 4. Predictive & Self-Healing SLA Automation
- **SLA Scheduler**: Runs every minute.
- **SLA Warning**: Sends warning when a ticket reaches `< 20%` remaining time.
- **Self-Healing SLA**: Auto-reassigns a ticket if no updates are made within `50%` of the resolution SLA time.

---

## 🚀 Running the Project

### Using Docker (Recommended)
From the root directory:
```bash
docker-compose up --build
```
This starts:
- MySQL Database: `localhost:3306`
- Spring Boot Backend: `localhost:8080`
- React Frontend + Nginx: `localhost:80`

### Running Locally

#### 1. Backend
Ensure you have MySQL running. Create a schema named `meritdesk`. Update `backend/src/main/resources/application.yml` with your database credentials.
```bash
cd backend
mvn spring-boot:run
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

---

## 🔑 Seeding Credentials
Super Admin is automatically seeded on startup:
- **Email**: `admin@meritdesk.com`
- **Password**: `Admin@123`
