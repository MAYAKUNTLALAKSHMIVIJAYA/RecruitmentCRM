# RecruitFlow CRM – Smart Candidate Submission, Feedback & Follow-up System

> **Tagline:** Never Miss a Candidate. Never Miss a Follow-up.  
> Inspired by Recruit CRM, Linear, and HubSpot CRM. Built specifically for recruitment agencies managing high-velocity client requisitions.

---

## 🎯 Case Study & Business Problem Solved

### The Problem
In agency recruitment:
1. Recruiters manage multiple urgent client job requirements in parallel.
2. Candidate submissions and pitches are sent via disjointed email threads.
3. Hiring managers frequently delay or fail to provide timely feedback.
4. Other team members and recruiters have zero centralized visibility into submission statuses.
5. Critical candidates who are actively in final stages with another employer withdraw due to client response delays.

### The Solution: RecruitFlow CRM
- **Structured Candidate Submissions:** Every candidate-job relationship is an independent submission record with its own status, feedback due date, and SLA tracker.
- **Explainable Withdrawal Risk Engine:** Flag candidate withdrawal risks (**Low, Medium, High, Critical**) based on market conditions (e.g. final rounds elsewhere, competing offers, overdue client feedback).
- **Automated Follow-up Scheduler:** Automated reminders at Day 0, Day 2 (1st follow-up), Day 4 (2nd urgent follow-up), and Day 6 (leadership escalation).
- **Dedicated External Hiring Manager Portal:** Secure, tokenized review link (`/portal/review/:token`) where managers can view candidate credentials and make one-click decisions (Accept, Reject, Request Interview, Request More Info, Review).
- **Simulated Communication Center:** Transparently tracks and previews email pitches and reminder logs with real-time audit history.
- **Executive Recruitment Analytics:** Real-time metrics on feedback response percentages, average turnaround times, recruiter conversion matrices, and client SLA compliance.

---

## 🚀 Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router v7, Axios, Date-fns
- **Backend:** Node.js, Express.js, TypeScript, JWT Authentication, bcryptjs, Socket.IO, node-cron
- **Database:** MongoDB & Mongoose ODM (with automatic fallback to embedded in-memory MongoDB for instant zero-config startup)
- **Email:** Safe mock communication engine with full audit logging

---

## 🔑 Demo User Credentials

The database is pre-seeded with realistic data and ready for demonstration:

| Role | Name | Email | Password | Primary Use |
|---|---|---|---|---|
| **Admin** | Riya Kapoor | `admin@recruitflow.com` | `Admin@123` | Full agency oversight, team escalations, analytics |
| **Recruiter** | Ananya Sharma | `ananya@recruitflow.com` | `Recruiter@123` | Primary demo user (owns Rahul Sharma submission) |
| **Recruiter** | Vikram Patel | `vikram@recruitflow.com` | `Recruiter@123` | Multi-recruiter team collaboration |

---

## 🌟 The Primary Demonstration Scenario

### Case Study Showcase: **Rahul Sharma**
- **Candidate:** Rahul Sharma (5 years exp, Senior Java Developer)
- **Target Role:** Senior Java Developer (`REQ-2001`) at **TechNova Solutions**
- **Hiring Manager:** Priya Reddy (VP of Engineering)
- **Recruiter Owner:** Ananya Sharma
- **Condition:** Rahul is in final interview rounds with another company (Swiggy).
- **Submission Date:** 6 days ago
- **Manager Feedback:** Not received (Overdue by 4 days)
- **System Detection:** Marked as **CRITICAL RISK** with automated alerts:
  - *"Candidate is in final interview rounds with another company."*
  - *"Hiring manager feedback deadline has expired (6 days waiting)."*
- **Actionable Guidance:** Escalation to Director Riya Kapoor, priority follow-up, and direct phone contact suggestion.
- **Hiring Manager Review Link:** Available in the submission details or under the demo link for Priya Reddy.

---

## 🖥️ Running the Application

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Server
```bash
cd server
npm install
npm run build
npm start
```
*Backend runs on `http://localhost:5000` and automatically starts embedded MongoDB if a local instance is not present.*

### 3. Frontend Client
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📋 Key Application Modules & Routes

1. **Dashboard (`/dashboard`):** Real-time KPI summary, pipeline distribution, recruiter performance, and urgent **"Attention Required"** panel.
2. **Candidates Pool (`/candidates`):** Multi-factor search, filter by skill/experience/status, and candidate profile cards with competing offer flags.
3. **Candidate Detail (`/candidates/:id`):** Full profile, multi-job submission history, activity timeline, and internal notes.
4. **Client Accounts (`/clients`):** Company directories, assigned hiring managers, and average turnaround SLA benchmarks.
5. **Job Requisitions (`/jobs`):** Open requirements, candidate pipelines per opening, and submission conversion rates.
6. **Submissions Tracker (`/submissions`):** Independent candidate-job submission records, SLA countdowns, and withdrawal risk badges.
7. **Submission Detail (`/submissions/:id`):** Single source of truth with complete communication timeline, automated follow-up tasks, and hiring manager feedback.
8. **Follow-ups Management (`/followups`):** Quick actions to send follow-ups, snooze reminders, mark complete, or escalate to team leads.
9. **Email Center (`/emails`):** Audit log of all dispatched email templates with review links.
10. **Hiring Manager Portal (`/portal/review/:token`):** Standalone review interface for hiring managers to submit decisions with interview availability.
11. **Notifications (`/notifications`):** Real-time notification center for feedback arrivals, overdue reminders, and risk alerts.
12. **Agency Team (`/team`):** Recruiter performance and active submission distribution.
13. **Analytics & Reports (`/analytics`):** Feedback response percentages, average turnaround days, recruiter conversion funnels, and client SLA compliance.
14. **Settings (`/settings`):** Follow-up automation intervals and system parameters.
