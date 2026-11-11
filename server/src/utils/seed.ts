import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { HiringManager } from '../models/HiringManager';
import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';
import { Submission } from '../models/Submission';
import { FollowUpTask } from '../models/FollowUpTask';
import { EmailLog } from '../models/EmailLog';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { Setting } from '../models/Setting';
import { evaluateCandidateRisk } from '../services/riskEngine';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export const seedDatabase = async () => {
  console.log('[Seed] Seeding realistic demo data...');
  const salt = await bcrypt.genSalt(10);
  const hash = (pw: string) => bcrypt.hash(pw, salt);

  // === USERS ===
  const akhilAdmin = await User.create({
    name: 'Akhil',
    email: 'akhil@recruitflow.com',
    password: await hash('Admin@123'),
    role: 'admin',
    designation: 'Managing Director & Lead Administrator',
    phone: '+91 98765 43210',
  });

  const adminUser = await User.create({
    name: 'Riya Kapoor',
    email: 'admin@recruitflow.com',
    password: await hash('Admin@123'),
    role: 'admin',
    designation: 'Recruitment Director',
    phone: '+91 98765 00001',
  });

  const recruiter1 = await User.create({
    name: 'Ananya Sharma',
    email: 'ananya@recruitflow.com',
    password: await hash('Recruiter@123'),
    role: 'recruiter',
    designation: 'Senior Technical Recruiter',
    phone: '+91 98765 11111',
  });

  const recruiter2 = await User.create({
    name: 'Vikram Patel',
    email: 'vikram@recruitflow.com',
    password: await hash('Recruiter@123'),
    role: 'recruiter',
    designation: 'Technical Recruiter',
    phone: '+91 98765 22222',
  });

  // === CLIENTS ===
  const client1 = await Client.create({
    companyName: 'TechNova Solutions',
    industry: 'Information Technology',
    website: 'https://technova.example.com',
    location: 'Bangalore, India',
    primaryContact: 'Rahul Mehta',
    contactEmail: 'rahul.mehta@technova.example.com',
    contactPhone: '+91 80 2345 6789',
    assignedRecruiter: recruiter1._id,
    accountStatus: 'Active',
  });

  const client2 = await Client.create({
    companyName: 'Apex Financial Services',
    industry: 'Banking & Finance',
    website: 'https://apexfin.example.com',
    location: 'Mumbai, India',
    primaryContact: 'Sonal Jain',
    contactEmail: 'sonal.jain@apexfin.example.com',
    contactPhone: '+91 22 3456 7890',
    assignedRecruiter: recruiter2._id,
    accountStatus: 'Active',
  });

  const client3 = await Client.create({
    companyName: 'CloudMatrix Systems',
    industry: 'SaaS / Cloud',
    website: 'https://cloudmatrix.example.com',
    location: 'Hyderabad, India',
    primaryContact: 'Arvind Kumar',
    contactEmail: 'arvind@cloudmatrix.example.com',
    contactPhone: '+91 40 2345 1234',
    assignedRecruiter: recruiter1._id,
    accountStatus: 'Active',
  });

  // === HIRING MANAGERS ===
  const hm1 = await HiringManager.create({
    fullName: 'Priya Reddy',
    email: 'priya.reddy@technova.example.com',
    phone: '+91 98001 11234',
    designation: 'VP of Engineering',
    client: client1._id,
  });

  const hm2 = await HiringManager.create({
    fullName: 'Ajay Sharma',
    email: 'ajay.sharma@technova.example.com',
    phone: '+91 98001 22345',
    designation: 'Head of Product',
    client: client1._id,
  });

  const hm3 = await HiringManager.create({
    fullName: 'Meera Nair',
    email: 'meera.nair@apexfin.example.com',
    phone: '+91 98001 33456',
    designation: 'CTO',
    client: client2._id,
  });

  const hm4 = await HiringManager.create({
    fullName: 'Rajesh Kumar',
    email: 'rajesh@cloudmatrix.example.com',
    phone: '+91 98001 44567',
    designation: 'Director of Engineering',
    client: client3._id,
  });

  // === JOBS ===
  const job1 = await Job.create({
    jobId: 'REQ-2001',
    jobTitle: 'Senior Java Developer',
    client: client1._id,
    hiringManager: hm1._id,
    department: 'Engineering',
    requiredSkills: ['Java', 'Spring Boot', 'Microservices', 'MySQL', 'REST APIs', 'Docker'],
    experienceRequired: '4-7 years',
    salaryRange: '₹18L - ₹26L per annum',
    jobLocation: 'Bangalore (Hybrid)',
    employmentType: 'Full-time',
    jobDescription: 'Looking for a skilled Senior Java Developer to build and scale our microservices infrastructure. The ideal candidate will have strong experience in Spring Boot and RESTful API development.',
    assignedRecruiter: recruiter1._id,
    priority: 'Urgent',
    numberOfOpenings: 2,
    jobStatus: 'Open',
    targetClosureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const job2 = await Job.create({
    jobId: 'REQ-2002',
    jobTitle: 'React Frontend Developer',
    client: client1._id,
    hiringManager: hm2._id,
    department: 'Product',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Jest', 'REST APIs'],
    experienceRequired: '3-5 years',
    salaryRange: '₹14L - ₹22L per annum',
    jobLocation: 'Bangalore (Remote-first)',
    employmentType: 'Full-time',
    jobDescription: 'Join our product team to build next-generation financial analytics dashboards.',
    assignedRecruiter: recruiter1._id,
    priority: 'High',
    numberOfOpenings: 1,
    jobStatus: 'Open',
    targetClosureDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  });

  const job3 = await Job.create({
    jobId: 'REQ-2003',
    jobTitle: 'Data Engineer',
    client: client2._id,
    hiringManager: hm3._id,
    department: 'Data & Analytics',
    requiredSkills: ['Python', 'Apache Spark', 'Kafka', 'AWS Redshift', 'ETL', 'SQL'],
    experienceRequired: '3-6 years',
    salaryRange: '₹16L - ₹24L per annum',
    jobLocation: 'Mumbai (Hybrid)',
    employmentType: 'Full-time',
    jobDescription: 'Build and maintain scalable data pipelines for real-time financial analytics processing.',
    assignedRecruiter: recruiter2._id,
    priority: 'High',
    numberOfOpenings: 2,
    jobStatus: 'Open',
    targetClosureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const job4 = await Job.create({
    jobId: 'REQ-2004',
    jobTitle: 'DevOps Engineer',
    client: client3._id,
    hiringManager: hm4._id,
    department: 'Platform',
    requiredSkills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD', 'Helm'],
    experienceRequired: '4-8 years',
    salaryRange: '₹20L - ₹32L per annum',
    jobLocation: 'Hyderabad (Remote)',
    employmentType: 'Full-time',
    jobDescription: 'Lead our infrastructure transformation to fully cloud-native architecture.',
    assignedRecruiter: recruiter1._id,
    priority: 'Urgent',
    numberOfOpenings: 1,
    jobStatus: 'Open',
    targetClosureDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  });

  const job5 = await Job.create({
    jobId: 'REQ-2005',
    jobTitle: 'Product Manager – Fintech',
    client: client2._id,
    hiringManager: hm3._id,
    department: 'Product',
    requiredSkills: ['Product Strategy', 'Agile', 'Fintech', 'Data Analytics', 'Roadmap Planning'],
    experienceRequired: '5-9 years',
    salaryRange: '₹24L - ₹38L per annum',
    jobLocation: 'Mumbai (On-site)',
    employmentType: 'Full-time',
    jobDescription: 'Drive product vision for our digital banking transformation initiative.',
    assignedRecruiter: recruiter2._id,
    priority: 'Medium',
    numberOfOpenings: 1,
    jobStatus: 'Open',
    targetClosureDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  });

  // === CANDIDATES (15) ===

  // KEY DEMO CANDIDATE - RAHUL SHARMA
  const rahul = await Candidate.create({
    candidateId: 'CAN-0101',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 99887 12345',
    location: 'Bangalore, India',
    skills: ['Java', 'Spring Boot', 'Microservices', 'MySQL', 'REST APIs', 'Docker'],
    totalExperience: 5,
    currentCompany: 'Infosys Technologies',
    currentDesignation: 'Senior Software Engineer',
    expectedSalary: '₹24L',
    noticePeriod: '30 days',
    recruiterOwner: recruiter1._id,
    availability: 'Available in 30 days',
    priority: 'Critical',
    source: 'LinkedIn',
    status: 'Submitted',
    inFinalStagesElsewhere: true,
    competingOffers: false,
    dissatisfiedWithDelays: false,
    notes: [
      `[${new Date().toLocaleDateString()}] Ananya Sharma: Rahul is in final round interviews with Swiggy. Very strong candidate, urgent to get TechNova's feedback before he accepts elsewhere.`,
      `[${daysAgo(2).toLocaleDateString()}] Ananya Sharma: Sent first follow-up. Priya Reddy not responding. Escalation risk is rising.`,
    ],
  });

  const priya_c = await Candidate.create({
    candidateId: 'CAN-0102',
    fullName: 'Priya Verma',
    email: 'priya.verma@gmail.com',
    phone: '+91 99887 23456',
    location: 'Pune, India',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Next.js', 'GraphQL'],
    totalExperience: 4,
    currentCompany: 'Wipro Digital',
    currentDesignation: 'Frontend Engineer',
    expectedSalary: '₹18L',
    noticePeriod: '45 days',
    recruiterOwner: recruiter1._id,
    availability: 'Available in 45 days',
    priority: 'High',
    source: 'Naukri',
    status: 'Interview',
    inFinalStagesElsewhere: false,
    competingOffers: true,
  });

  const arun = await Candidate.create({
    candidateId: 'CAN-0103',
    fullName: 'Arun Krishnamurthy',
    email: 'arun.k@hotmail.com',
    phone: '+91 88776 34567',
    location: 'Chennai, India',
    skills: ['Python', 'Apache Spark', 'Kafka', 'SQL', 'AWS Redshift', 'PySpark'],
    totalExperience: 6,
    currentCompany: 'TCS',
    currentDesignation: 'Data Architect',
    expectedSalary: '₹26L',
    noticePeriod: 'Immediate',
    recruiterOwner: recruiter2._id,
    availability: 'Immediate',
    priority: 'High',
    source: 'Referral',
    status: 'Submitted',
  });

  const neha = await Candidate.create({
    candidateId: 'CAN-0104',
    fullName: 'Neha Gupta',
    email: 'neha.gupta@outlook.com',
    phone: '+91 77665 45678',
    location: 'Delhi NCR, India',
    skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'Jenkins', 'Ansible'],
    totalExperience: 7,
    currentCompany: 'HCL Technologies',
    currentDesignation: 'DevOps Lead',
    expectedSalary: '₹30L',
    noticePeriod: '60 days',
    recruiterOwner: recruiter1._id,
    availability: 'Available in 60 days',
    priority: 'High',
    source: 'LinkedIn',
    status: 'Selected',
    inFinalStagesElsewhere: false,
  });

  const saurabh = await Candidate.create({
    candidateId: 'CAN-0105',
    fullName: 'Saurabh Joshi',
    email: 'saurabh.joshi@gmail.com',
    phone: '+91 66554 56789',
    location: 'Mumbai, India',
    skills: ['Product Management', 'Fintech', 'Agile', 'Product Strategy', 'SQL'],
    totalExperience: 7,
    currentCompany: 'Razorpay',
    currentDesignation: 'Senior Product Manager',
    expectedSalary: '₹36L',
    noticePeriod: '90 days',
    recruiterOwner: recruiter2._id,
    availability: 'Available in 90 days',
    priority: 'Medium',
    source: 'LinkedIn',
    status: 'Screened',
  });

  const kavita = await Candidate.create({
    candidateId: 'CAN-0106',
    fullName: 'Kavita Reddy',
    email: 'kavita.r@gmail.com',
    phone: '+91 55443 67890',
    location: 'Hyderabad, India',
    skills: ['Java', 'Spring Boot', 'AWS Lambda', 'DynamoDB', 'Kafka', 'REST APIs'],
    totalExperience: 5,
    currentCompany: 'Mindtree',
    currentDesignation: 'Software Engineer',
    expectedSalary: '₹20L',
    noticePeriod: '30 days',
    recruiterOwner: recruiter1._id,
    availability: 'Available in 30 days',
    priority: 'Medium',
    source: 'Indeed',
    status: 'Submitted',
    dissatisfiedWithDelays: true,
  });

  const dev = await Candidate.create({
    candidateId: 'CAN-0107',
    fullName: 'Dev Chopra',
    email: 'dev.chopra@gmail.com',
    phone: '+91 44332 78901',
    location: 'Bangalore, India',
    skills: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'PostgreSQL', 'AWS'],
    totalExperience: 3,
    currentCompany: 'Freshworks',
    currentDesignation: 'Full Stack Developer',
    expectedSalary: '₹16L',
    noticePeriod: '15 days',
    recruiterOwner: recruiter1._id,
    availability: 'Available in 15 days',
    priority: 'Low',
    source: 'Referral',
    status: 'Shortlisted',
  });

  const meena = await Candidate.create({
    candidateId: 'CAN-0108',
    fullName: 'Meena Pillai',
    email: 'meena.pillai@gmail.com',
    phone: '+91 33221 89012',
    location: 'Kochi, India',
    skills: ['Python', 'TensorFlow', 'Data Science', 'SQL', 'ETL', 'Databricks'],
    totalExperience: 4,
    currentCompany: 'Infosys BPM',
    currentDesignation: 'Data Scientist',
    expectedSalary: '₹18L',
    noticePeriod: '30 days',
    recruiterOwner: recruiter2._id,
    availability: 'Available in 30 days',
    priority: 'Medium',
    source: 'LinkedIn',
    status: 'New',
  });

  const rajan = await Candidate.create({
    candidateId: 'CAN-0109',
    fullName: 'Rajan Mehra',
    email: 'rajan.mehra@gmail.com',
    phone: '+91 22110 90123',
    location: 'Pune, India',
    skills: ['Kubernetes', 'Docker', 'CI/CD', 'Azure', 'Terraform', 'Helm'],
    totalExperience: 5,
    currentCompany: 'Capgemini',
    currentDesignation: 'Cloud Infrastructure Engineer',
    expectedSalary: '₹24L',
    noticePeriod: 'Immediate',
    recruiterOwner: recruiter1._id,
    availability: 'Immediate',
    priority: 'High',
    source: 'Agency Referral',
    status: 'Submitted',
    inFinalStagesElsewhere: false,
    competingOffers: true,
  });

  const sunita = await Candidate.create({
    candidateId: 'CAN-0110',
    fullName: 'Sunita Bhatt',
    email: 'sunita.bhatt@outlook.com',
    phone: '+91 11998 01234',
    location: 'Ahmedabad, India',
    skills: ['Java', 'Hibernate', 'Oracle', 'REST APIs', 'JUnit', 'Maven'],
    totalExperience: 8,
    currentCompany: 'Zydus Technologies',
    currentDesignation: 'Java Architect',
    expectedSalary: '₹32L',
    noticePeriod: '90 days',
    recruiterOwner: recruiter2._id,
    availability: 'Available in 90 days',
    priority: 'Low',
    source: 'LinkedIn',
    status: 'Placed',
  });

  const kiran = await Candidate.create({
    candidateId: 'CAN-0111',
    fullName: 'Kiran Desai',
    email: 'kiran.desai@gmail.com',
    phone: '+91 09887 12340',
    location: 'Bangalore, India',
    skills: ['Python', 'FastAPI', 'Kafka', 'MongoDB', 'Redis', 'AWS'],
    totalExperience: 4,
    currentCompany: 'Lendingkart',
    currentDesignation: 'Backend Engineer',
    expectedSalary: '₹19L',
    noticePeriod: '30 days',
    recruiterOwner: recruiter1._id,
    availability: 'Available in 30 days',
    priority: 'Medium',
    source: 'Naukri',
    status: 'New',
  });

  const tanya = await Candidate.create({
    candidateId: 'CAN-0112',
    fullName: 'Tanya Singh',
    email: 'tanya.singh@gmail.com',
    phone: '+91 09876 23456',
    location: 'Delhi NCR, India',
    skills: ['React', 'Redux', 'JavaScript', 'Jest', 'CSS', 'REST APIs'],
    totalExperience: 2,
    currentCompany: 'Zomato',
    currentDesignation: 'Frontend Developer',
    expectedSalary: '₹12L',
    noticePeriod: 'Immediate',
    recruiterOwner: recruiter1._id,
    availability: 'Immediate',
    priority: 'Low',
    source: 'Job Portal',
    status: 'Shortlisted',
  });

  const amit = await Candidate.create({
    candidateId: 'CAN-0113',
    fullName: 'Amit Kumar',
    email: 'amit.kumar123@gmail.com',
    phone: '+91 09765 34567',
    location: 'Hyderabad, India',
    skills: ['Node.js', 'Express', 'MongoDB', 'AWS', 'TypeScript', 'Redis'],
    totalExperience: 5,
    currentCompany: 'Zoho Corp',
    currentDesignation: 'Senior Backend Developer',
    expectedSalary: '₹22L',
    noticePeriod: '30 days',
    recruiterOwner: recruiter2._id,
    availability: 'Available in 30 days',
    priority: 'Medium',
    source: 'LinkedIn',
    status: 'Submitted',
  });

  const renu = await Candidate.create({
    candidateId: 'CAN-0114',
    fullName: 'Renu Pillai',
    email: 'renu.pillai@gmail.com',
    phone: '+91 09654 45678',
    location: 'Mumbai, India',
    skills: ['SQL', 'Tableau', 'Business Intelligence', 'ETL', 'Power BI'],
    totalExperience: 6,
    currentCompany: 'Citibank India',
    currentDesignation: 'BI Analyst',
    expectedSalary: '₹20L',
    noticePeriod: '60 days',
    recruiterOwner: recruiter2._id,
    availability: 'Available in 60 days',
    priority: 'Low',
    source: 'Job Portal',
    status: 'New',
  });

  const deepak = await Candidate.create({
    candidateId: 'CAN-0115',
    fullName: 'Deepak Singh',
    email: 'deepak.singh.dev@gmail.com',
    phone: '+91 09543 56789',
    location: 'Bangalore, India',
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'GCP', 'REST APIs', 'PostgreSQL'],
    totalExperience: 7,
    currentCompany: 'Accenture',
    currentDesignation: 'Solution Architect',
    expectedSalary: '₹35L',
    noticePeriod: '60 days',
    recruiterOwner: recruiter1._id,
    availability: 'Available in 60 days',
    priority: 'High',
    source: 'Agency Referral',
    status: 'Interview',
  });

  // Helper: generateToken
  const genToken = () => crypto.randomBytes(24).toString('hex');
  const tokenExpiry = (days = 14) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // === SUBMISSIONS (12) ===

  // ============================================================
  // SUBMISSION 1: RAHUL SHARMA - CRITICAL OVERDUE (KEY DEMO CASE)
  // ============================================================
  const sub1ReviewToken = genToken();
  const sub1SubmissionDate = daysAgo(6);
  const sub1FeedbackDue = daysAgo(4); // 2 days after submission => already overdue

  const rahulRisk = evaluateCandidateRisk({
    inFinalStagesElsewhere: true,
    competingOffers: false,
    isOverdue: true,
    daysWaiting: 6,
    priority: 'Critical',
  });

  const sub1 = await Submission.create({
    submissionId: 'SUB-50001',
    candidate: rahul._id,
    job: job1._id,
    client: client1._id,
    hiringManager: hm1._id,
    recruiter: recruiter1._id,
    submissionDate: sub1SubmissionDate,
    submissionMethod: 'Email',
    emailSubject: 'Candidate Submission – Rahul Sharma – Senior Java Developer',
    submissionNotes: 'High priority candidate. 5 years of exp in Java/Spring Boot. Currently in final round with Swiggy. Urgent feedback needed to prevent losing him.',
    priority: 'Critical',
    feedbackDueDate: sub1FeedbackDue,
    submissionStatus: 'Follow-up Due',
    reviewToken: sub1ReviewToken,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: rahulRisk.level,
    riskReasons: rahulRisk.reasons,
    daysWaiting: 6,
    isOverdue: true,
    isEscalated: false,
    lastFollowUpDate: daysAgo(2),
    nextFollowUpDate: daysAgo(0),
  });

  // Follow-up tasks for sub1
  await FollowUpTask.create({
    submission: sub1._id,
    candidate: rahul._id,
    job: job1._id,
    client: client1._id,
    hiringManager: hm1._id,
    assignedRecruiter: recruiter1._id,
    stepNumber: 1,
    title: '1st Follow-up: Hiring Manager Feedback on Rahul Sharma',
    dueDate: daysAgo(4),
    status: 'Sent',
    lastSentDate: daysAgo(2),
    history: [
      { action: 'Follow-up Scheduled', timestamp: sub1SubmissionDate, notes: 'Automated on submission' },
      { action: 'First Follow-up Sent', performedBy: recruiter1._id, timestamp: daysAgo(2), notes: 'Sent to Priya Reddy. No response yet.' },
    ],
  });

  await FollowUpTask.create({
    submission: sub1._id,
    candidate: rahul._id,
    job: job1._id,
    client: client1._id,
    hiringManager: hm1._id,
    assignedRecruiter: recruiter1._id,
    stepNumber: 2,
    title: '2nd Follow-up: URGENT - Rahul Sharma Review Response Required',
    dueDate: daysAgo(0), // Overdue today
    status: 'Pending',
    history: [
      { action: 'Follow-up Scheduled', performedBy: recruiter1._id, timestamp: daysAgo(2), notes: 'Scheduled 2nd follow-up after 1st had no reply' },
    ],
  });

  // Email logs for sub1
  await EmailLog.create({
    submission: sub1._id,
    candidate: rahul._id,
    job: job1._id,
    client: client1._id,
    hiringManager: hm1._id,
    sender: recruiter1._id,
    recipientEmail: 'priya.reddy@technova.example.com',
    recipientName: 'Priya Reddy',
    subject: 'Candidate Submission – Rahul Sharma – Senior Java Developer',
    bodyText: 'Dear Priya,\n\nPlease find the profile of Rahul Sharma for the Senior Java Developer position...',
    templateType: 'Submission',
    status: 'Sent (Simulated)',
    isSimulated: true,
    followUpNumber: 0,
    sentAt: sub1SubmissionDate,
    reviewUrl: `http://localhost:5173/portal/review/${sub1ReviewToken}`,
  });

  await EmailLog.create({
    submission: sub1._id,
    candidate: rahul._id,
    job: job1._id,
    client: client1._id,
    hiringManager: hm1._id,
    sender: recruiter1._id,
    recipientEmail: 'priya.reddy@technova.example.com',
    recipientName: 'Priya Reddy',
    subject: 'Follow-up: Candidate Submission – Rahul Sharma',
    bodyText: 'Dear Priya,\n\nI hope you are doing well. I am following up on the profile of Rahul Sharma...',
    templateType: 'First Follow-up',
    status: 'Sent (Simulated)',
    isSimulated: true,
    followUpNumber: 1,
    sentAt: daysAgo(2),
    reviewUrl: `http://localhost:5173/portal/review/${sub1ReviewToken}`,
  });

  // Activity log for sub1
  await ActivityLog.create({ submission: sub1._id, candidate: rahul._id, job: job1._id, performedBy: recruiter1._id, action: 'Candidate Submitted to Client', details: 'Rahul Sharma submitted to Priya Reddy at TechNova Solutions. Feedback due in 2 days. Priority: Critical.', createdAt: sub1SubmissionDate });
  await ActivityLog.create({ submission: sub1._id, candidate: rahul._id, job: job1._id, performedBy: recruiter1._id, action: 'Email Sent: First Follow-up', details: 'First follow-up email sent to Priya Reddy. No response received.', createdAt: daysAgo(2) });
  await ActivityLog.create({ submission: sub1._id, candidate: rahul._id, job: job1._id, performedBy: adminUser._id, action: '⚠️ Risk Alert: Critical Risk Detected', details: 'Rahul Sharma flagged CRITICAL – in final interview stage at Swiggy. Feedback from Priya Reddy is 4 days overdue.', createdAt: daysAgo(1) });

  // Notifications for sub1
  await Notification.create({ recipient: recruiter1._id, type: 'FOLLOWUP_OVERDUE', title: 'Feedback Overdue: Rahul Sharma', message: 'Hiring manager feedback for Rahul Sharma (Senior Java Developer @ TechNova) is now 4 days overdue!', submission: sub1._id, candidate: rahul._id, job: job1._id, isRead: false, createdAt: daysAgo(1) });
  await Notification.create({ recipient: recruiter1._id, type: 'CANDIDATE_RISK', title: 'CRITICAL: Rahul Sharma at Withdrawal Risk', message: 'Rahul Sharma is in final rounds at Swiggy and 6 days have passed without feedback from TechNova!', submission: sub1._id, candidate: rahul._id, job: job1._id, isRead: false, createdAt: daysAgo(0) });

  // ============================================================
  // SUBMISSION 2: PRIYA VERMA - INTERVIEW REQUESTED
  // ============================================================
  const sub2Token = genToken();
  const sub2 = await Submission.create({
    submissionId: 'SUB-50002',
    candidate: priya_c._id,
    job: job2._id,
    client: client1._id,
    hiringManager: hm2._id,
    recruiter: recruiter1._id,
    submissionDate: daysAgo(5),
    emailSubject: 'Candidate Submission – Priya Verma – React Frontend Developer',
    submissionNotes: 'Strong React developer with Tailwind CSS experience. Available in 45 days.',
    priority: 'High',
    feedbackDueDate: daysAgo(3),
    submissionStatus: 'Interview Requested',
    reviewToken: sub2Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Medium',
    riskReasons: ['Candidate holds active competing offers'],
    daysWaiting: 5,
    isOverdue: false,
    lastFollowUpDate: daysAgo(3),
    nextFollowUpDate: daysAgo(1),
  });

  // ============================================================
  // SUBMISSION 3: ARUN - AWAITING FEEDBACK
  // ============================================================
  const sub3Token = genToken();
  const sub3 = await Submission.create({
    submissionId: 'SUB-50003',
    candidate: arun._id,
    job: job3._id,
    client: client2._id,
    hiringManager: hm3._id,
    recruiter: recruiter2._id,
    submissionDate: daysAgo(3),
    emailSubject: 'Candidate Submission – Arun Krishnamurthy – Data Engineer',
    submissionNotes: 'Experienced Data Engineer with Spark and Kafka skills.',
    priority: 'High',
    feedbackDueDate: daysAgo(1),
    submissionStatus: 'Awaiting Feedback',
    reviewToken: sub3Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Medium',
    riskReasons: ['Waiting 3 days for client review'],
    daysWaiting: 3,
    isOverdue: true,
  });

  // ============================================================
  // SUBMISSION 4: NEHA - SELECTED
  // ============================================================
  const sub4Token = genToken();
  const sub4 = await Submission.create({
    submissionId: 'SUB-50004',
    candidate: neha._id,
    job: job4._id,
    client: client3._id,
    hiringManager: hm4._id,
    recruiter: recruiter1._id,
    submissionDate: daysAgo(14),
    emailSubject: 'Candidate Submission – Neha Gupta – DevOps Engineer',
    submissionNotes: 'Exceptional DevOps profile. 7 years exp. Kubernetes certified.',
    priority: 'High',
    feedbackDueDate: daysAgo(12),
    submissionStatus: 'Selected',
    reviewToken: sub4Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Low',
    riskReasons: [],
    daysWaiting: 0,
    isOverdue: false,
    lastFollowUpDate: daysAgo(12),
  });

  // ============================================================
  // SUBMISSION 5: KAVITA - FOLLOW-UP DUE
  // ============================================================
  const sub5Token = genToken();
  const sub5 = await Submission.create({
    submissionId: 'SUB-50005',
    candidate: kavita._id,
    job: job1._id,
    client: client1._id,
    hiringManager: hm1._id,
    recruiter: recruiter1._id,
    submissionDate: daysAgo(5),
    emailSubject: 'Candidate Submission – Kavita Reddy – Senior Java Developer',
    submissionNotes: 'Solid Java/Spring candidate. Expressed growing frustration with delay.',
    priority: 'High',
    feedbackDueDate: daysAgo(3),
    submissionStatus: 'Follow-up Due',
    reviewToken: sub5Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'High',
    riskReasons: ['Candidate has expressed dissatisfaction with communication delays', 'Hiring manager response is overdue'],
    daysWaiting: 5,
    isOverdue: true,
    lastFollowUpDate: daysAgo(1),
    nextFollowUpDate: new Date(),
  });

  // ============================================================
  // SUBMISSION 6: RAJAN MEHRA - SUBMITTED 
  // ============================================================
  const sub6Token = genToken();
  const sub6 = await Submission.create({
    submissionId: 'SUB-50006',
    candidate: rajan._id,
    job: job4._id,
    client: client3._id,
    hiringManager: hm4._id,
    recruiter: recruiter1._id,
    submissionDate: daysAgo(2),
    emailSubject: 'Candidate Submission – Rajan Mehra – DevOps Engineer',
    submissionNotes: 'Competing offer in hand. Need quick turnaround.',
    priority: 'High',
    feedbackDueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    submissionStatus: 'Submitted',
    reviewToken: sub6Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'High',
    riskReasons: ['Candidate holds competing offers'],
    daysWaiting: 2,
    isOverdue: false,
  });

  // ============================================================
  // SUBMISSION 7: DEEPAK SINGH - INTERVIEW SCHEDULED  
  // ============================================================
  const sub7Token = genToken();
  const sub7 = await Submission.create({
    submissionId: 'SUB-50007',
    candidate: deepak._id,
    job: job1._id,
    client: client1._id,
    hiringManager: hm1._id,
    recruiter: recruiter1._id,
    submissionDate: daysAgo(10),
    emailSubject: 'Candidate Submission – Deepak Singh – Senior Java Developer',
    submissionNotes: 'Solution architect background, strong Java skills.',
    priority: 'Medium',
    feedbackDueDate: daysAgo(8),
    submissionStatus: 'Interview Scheduled',
    reviewToken: sub7Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Low',
    riskReasons: [],
    daysWaiting: 0,
    isOverdue: false,
  });

  // ============================================================
  // SUBMISSION 8: AMIT KUMAR - AWAITING FEEDBACK
  // ============================================================
  const sub8Token = genToken();
  const sub8 = await Submission.create({
    submissionId: 'SUB-50008',
    candidate: amit._id,
    job: job3._id,
    client: client2._id,
    hiringManager: hm3._id,
    recruiter: recruiter2._id,
    submissionDate: daysAgo(4),
    emailSubject: 'Candidate Submission – Amit Kumar – Data Engineer (Node.js Background)',
    submissionNotes: 'While primarily a backend dev, has built ETL pipelines. Worth evaluating for data eng role.',
    priority: 'Medium',
    feedbackDueDate: daysAgo(2),
    submissionStatus: 'Awaiting Feedback',
    reviewToken: sub8Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Medium',
    riskReasons: ['Waiting 4 days for client review'],
    daysWaiting: 4,
    isOverdue: true,
  });

  // ============================================================
  // SUBMISSION 9: SAURABH JOSHI - NEW SUBMISSION  
  // ============================================================
  const sub9Token = genToken();
  const sub9 = await Submission.create({
    submissionId: 'SUB-50009',
    candidate: saurabh._id,
    job: job5._id,
    client: client2._id,
    hiringManager: hm3._id,
    recruiter: recruiter2._id,
    submissionDate: daysAgo(1),
    emailSubject: 'Candidate Submission – Saurabh Joshi – Product Manager Fintech',
    submissionNotes: 'Strong Razorpay background. Fits the digital banking transformation initiative well.',
    priority: 'Medium',
    feedbackDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    submissionStatus: 'Submitted',
    reviewToken: sub9Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Low',
    riskReasons: [],
    daysWaiting: 1,
    isOverdue: false,
  });

  // ============================================================
  // SUBMISSION 10: KAVITA - SECOND JOB SUBMISSION (Demonstrate Independent Submission)
  // ============================================================
  const sub10Token = genToken();
  const sub10 = await Submission.create({
    submissionId: 'SUB-50010',
    candidate: kavita._id,
    job: job4._id,
    client: client3._id,
    hiringManager: hm4._id,
    recruiter: recruiter1._id,
    submissionDate: daysAgo(3),
    emailSubject: 'Candidate Submission – Kavita Reddy – DevOps Engineer',
    submissionNotes: 'Kavita also has some DevOps exposure. Cross-submitting for evaluation.',
    priority: 'Low',
    feedbackDueDate: daysAgo(1),
    submissionStatus: 'Rejected',
    reviewToken: sub10Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Low',
    riskReasons: [],
    daysWaiting: 0,
    isOverdue: false,
  });

  // ============================================================
  // SUBMISSION 11: PRIYA VERMA - SECOND JOB (Another Client)
  // ============================================================
  const sub11Token = genToken();
  const sub11 = await Submission.create({
    submissionId: 'SUB-50011',
    candidate: priya_c._id,
    job: job5._id,
    client: client2._id,
    hiringManager: hm3._id,
    recruiter: recruiter2._id,
    submissionDate: daysAgo(7),
    emailSubject: 'Candidate Submission – Priya Verma – Product Manager',
    submissionNotes: 'Priya has strong UX and product thinking; worth exploring for the PM role.',
    priority: 'Low',
    feedbackDueDate: daysAgo(5),
    submissionStatus: 'Withdrawn',
    reviewToken: sub11Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Low',
    riskReasons: [],
    daysWaiting: 0,
    isOverdue: false,
  });

  // ============================================================
  // SUBMISSION 12: ARUN - FEEDBACK RECEIVED
  // ============================================================
  const sub12Token = genToken();
  const sub12 = await Submission.create({
    submissionId: 'SUB-50012',
    candidate: arun._id,
    job: job5._id,
    client: client2._id,
    hiringManager: hm3._id,
    recruiter: recruiter2._id,
    submissionDate: daysAgo(10),
    emailSubject: 'Candidate Submission – Arun Krishnamurthy – Product Manager Fintech',
    submissionNotes: 'Cross submission. Meera Nair appreciated his data-driven product thinking.',
    priority: 'Low',
    feedbackDueDate: daysAgo(8),
    submissionStatus: 'Feedback Received',
    reviewToken: sub12Token,
    reviewTokenExpiresAt: tokenExpiry(),
    riskLevel: 'Low',
    riskReasons: [],
    daysWaiting: 0,
    isOverdue: false,
    lastFollowUpDate: daysAgo(8),
  });

  // Update Hiring Manager assigned jobs
  await HiringManager.findByIdAndUpdate(hm1._id, {
    $addToSet: { assignedJobs: [job1._id, job2._id] },
  });
  await HiringManager.findByIdAndUpdate(hm2._id, {
    $addToSet: { assignedJobs: [job2._id] },
  });
  await HiringManager.findByIdAndUpdate(hm3._id, {
    $addToSet: { assignedJobs: [job3._id, job5._id] },
  });
  await HiringManager.findByIdAndUpdate(hm4._id, {
    $addToSet: { assignedJobs: [job4._id] },
  });

  // === SETTINGS ===
  await Setting.create({
    key: 'followup_intervals',
    value: {
      firstFollowUpDays: 2,
      secondFollowUpDays: 4,
      escalationDays: 6,
      overdueThresholdDays: 7,
    },
    description: 'Default follow-up reminder schedule intervals (in days)',
  });

  console.log(`\n✅ Demo Database Seeded Successfully!\n`);
  console.log(`👤 Login Credentials:`);
  console.log(`   Admin:     admin@recruitflow.com / Admin@123`);
  console.log(`   Recruiter: ananya@recruitflow.com / Recruiter@123`);
  console.log(`   Recruiter: vikram@recruitflow.com / Recruiter@123`);
  console.log(`\n🔑 Rahul Sharma's submission review token: ${sub1ReviewToken}`);
  console.log(`📋 Review URL: http://localhost:5173/portal/review/${sub1ReviewToken}\n`);
};
