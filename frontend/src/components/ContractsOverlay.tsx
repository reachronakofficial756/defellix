import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useContractsStore } from '../store/useContractsStore';
import { Clock, DollarSign, CheckCircle, AlertCircle, RotateCcw, FileText, User, Calendar, FileCheck, CreditCard, LayoutGrid } from 'lucide-react';
import contractsBg3d from '@/assets/contracts_bg_3d.png';

/** Milestone row as in CreateContractForm (Scope & Deliverables / Payment) */
type MilestoneDetail = {
  title: string;
  description: string;
  amount: number;
  due_date: string;
  is_initial_payment: boolean;
  submission_criteria: string;
  completion_criteria_tc: string;
};

const CONTRACTS = [
  {
    id: 1,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    milestoneDeadline: 'Mar 2025',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ],
    projectType: 'E-Commerce',
    projectDesc: 'Full storefront with cart, checkout, and Stripe integration.',
    startDate: '2024-10-01',
    deadline: '2025-03-31',
    duration: '6 months',
    customTerms: 'Standard confidentiality and professional conduct.',
    clientName: 'Jane Smith',
    clientEmail: 'jane@technova.com',
    clientPhone: '+1 (555) 100-2000',
    clientCountry: 'United States',
    clientCompany: 'TechNova Solutions',
    outOfScope: 'Backend API development, hosting, and ongoing maintenance.',
    coreDeliverable: 'Live staging link + Figma handoff + component library.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '12500',
    paymentMethod: 'Stripe',
    isAdvancePayment: true,
    advanceAmount: '2500',
    milestonesDetail: [
      { title: 'Wireframes', description: 'Low-fi and hi-fi wireframes', amount: 2500, due_date: '2024-11-15', is_initial_payment: true, submission_criteria: 'Figma link', completion_criteria_tc: 'Approval within 5 days' },
      { title: 'Component Architecture', description: 'Core components built', amount: 3500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'GitHub + Storybook', completion_criteria_tc: 'Code review sign-off' },
      { title: 'API Integration', description: 'Stripe and cart integration', amount: 3500, due_date: '2025-02-28', is_initial_payment: false, submission_criteria: 'Staging URL', completion_criteria_tc: 'QA pass' },
      { title: 'Checkout & Deploy', description: 'Checkout flow and production deploy', amount: 3000, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Live link', completion_criteria_tc: 'Final sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 2,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    milestoneDeadline: 'Apr 2025',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'Neobank app UI with dark mode and Lottie animations.',
    startDate: '2024-11-01',
    deadline: '2025-04-30',
    duration: '6 months',
    customTerms: 'NDA and financial data handling terms.',
    clientName: 'Alex Rivera',
    clientEmail: 'alex@finvanguard.com',
    clientPhone: '+44 20 7946 0958',
    clientCountry: 'United Kingdom',
    clientCompany: 'FinVanguard',
    outOfScope: 'Backend, compliance logic, and app store submission.',
    coreDeliverable: 'Figma file + prototype + dev specs PDF.',
    revisionPolicy: '3 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '18000',
    paymentMethod: 'Bank Transfer',
    isAdvancePayment: true,
    advanceAmount: '5000',
    milestonesDetail: [
      { title: 'UX Research & Flow', description: 'User flows and research report', amount: 3000, due_date: '2024-12-01', is_initial_payment: true, submission_criteria: 'PDF + Miro', completion_criteria_tc: 'Stakeholder approval' },
      { title: 'High-Fi Mockups', description: 'All screens in Figma', amount: 5000, due_date: '2025-01-31', is_initial_payment: false, submission_criteria: 'Figma link', completion_criteria_tc: 'Design review' },
      { title: 'Prototype Animation', description: 'Lottie and micro-interactions', amount: 4000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Figma prototype', completion_criteria_tc: 'Approval' },
      { title: 'Dev Handoff Specs', description: 'Specs and asset export', amount: 4000, due_date: '2025-04-15', is_initial_payment: false, submission_criteria: 'PDF + Figma', completion_criteria_tc: 'Handoff complete' },
      { title: 'Final Review', description: 'Post-dev QA and tweaks', amount: 2000, due_date: '2025-04-30', is_initial_payment: false, submission_criteria: 'Sign-off', completion_criteria_tc: 'Client sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 3,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    milestoneDeadline: 'May 2025',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'B2B cloud infrastructure dashboard with D3.js charts.',
    startDate: '2024-12-01',
    deadline: '2025-05-31',
    duration: '6 months',
    customTerms: 'Standard SaaS terms.',
    clientName: 'Sam Chen',
    clientEmail: 'sam@cloudsync.io',
    clientPhone: '+1 (555) 300-4000',
    clientCountry: 'United States',
    clientCompany: 'CloudSync',
    outOfScope: 'Backend API and deployment.',
    coreDeliverable: 'Figma + component specs + D3 chart specs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '8200',
    paymentMethod: 'PayPal',
    isAdvancePayment: false,
    advanceAmount: '',
    milestonesDetail: [
      { title: 'Information Architecture', description: 'IA and wireframes', amount: 2500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Approval' },
      { title: 'Dashboard Components', description: 'Core UI components', amount: 3200, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Review' },
      { title: 'Data Binding & Charts', description: 'D3 charts and data grids', amount: 2500, due_date: '2025-05-31', is_initial_payment: false, submission_criteria: 'Figma + spec', completion_criteria_tc: 'Sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 4,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    milestoneDeadline: 'Jun 2025',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ],
    projectType: 'Web Development',
    projectDesc: 'AI video generation frontend with WebSockets and Fabric.js timeline.',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    duration: '6 months',
    customTerms: 'IP and data usage for AI training.',
    clientName: 'Jordan Lee',
    clientEmail: 'jordan@visionaryai.com',
    clientPhone: '+1 (555) 500-6000',
    clientCountry: 'United States',
    clientCompany: 'Visionary AI',
    outOfScope: 'ML models and video encoding backend.',
    coreDeliverable: 'Staging app + GitHub repo + deployment docs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Shared ownership',
    contractCurrency: 'USD',
    contractAmount: '25000',
    paymentMethod: 'Crypto',
    isAdvancePayment: true,
    advanceAmount: '7500',
    milestonesDetail: [
      { title: 'Prompt Input & UI Shell', description: 'Input UI and app shell', amount: 5000, due_date: '2025-02-01', is_initial_payment: true, submission_criteria: 'Staging URL', completion_criteria_tc: 'Approval' },
      { title: 'WebSocket Streaming', description: 'Progress and stream UI', amount: 5000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Demo', completion_criteria_tc: 'Sign-off' },
      { title: 'Video Timeline Editor', description: 'Fabric.js timeline', amount: 6000, due_date: '2025-05-01', is_initial_payment: false, submission_criteria: 'Staging', completion_criteria_tc: 'QA' },
      { title: 'Export & Rendering Flow', description: 'Export and render pipeline UI', amount: 5000, due_date: '2025-06-01', is_initial_payment: false, submission_criteria: 'E2E test', completion_criteria_tc: 'Pass' },
      { title: 'QA & Launch', description: 'Bug fixes and launch prep', amount: 4000, due_date: '2025-06-30', is_initial_payment: false, submission_criteria: 'Production', completion_criteria_tc: 'Launch' },
    ] as MilestoneDetail[],
  },
  {
    id: 5,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    milestoneDeadline: 'Mar 2025',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ],
    projectType: 'E-Commerce',
    projectDesc: 'Full storefront with cart, checkout, and Stripe integration.',
    startDate: '2024-10-01',
    deadline: '2025-03-31',
    duration: '6 months',
    customTerms: 'Standard confidentiality and professional conduct.',
    clientName: 'Jane Smith',
    clientEmail: 'jane@technova.com',
    clientPhone: '+1 (555) 100-2000',
    clientCountry: 'United States',
    clientCompany: 'TechNova Solutions',
    outOfScope: 'Backend API development, hosting, and ongoing maintenance.',
    coreDeliverable: 'Live staging link + Figma handoff + component library.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '12500',
    paymentMethod: 'Stripe',
    isAdvancePayment: true,
    advanceAmount: '2500',
    milestonesDetail: [
      { title: 'Wireframes', description: 'Low-fi and hi-fi wireframes', amount: 2500, due_date: '2024-11-15', is_initial_payment: true, submission_criteria: 'Figma link', completion_criteria_tc: 'Approval within 5 days' },
      { title: 'Component Architecture', description: 'Core components built', amount: 3500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'GitHub + Storybook', completion_criteria_tc: 'Code review sign-off' },
      { title: 'API Integration', description: 'Stripe and cart integration', amount: 3500, due_date: '2025-02-28', is_initial_payment: false, submission_criteria: 'Staging URL', completion_criteria_tc: 'QA pass' },
      { title: 'Checkout & Deploy', description: 'Checkout flow and production deploy', amount: 3000, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Live link', completion_criteria_tc: 'Final sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 6,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    milestoneDeadline: 'Apr 2025',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'Neobank app UI with dark mode and Lottie animations.',
    startDate: '2024-11-01',
    deadline: '2025-04-30',
    duration: '6 months',
    customTerms: 'NDA and financial data handling terms.',
    clientName: 'Alex Rivera',
    clientEmail: 'alex@finvanguard.com',
    clientPhone: '+44 20 7946 0958',
    clientCountry: 'United Kingdom',
    clientCompany: 'FinVanguard',
    outOfScope: 'Backend, compliance logic, and app store submission.',
    coreDeliverable: 'Figma file + prototype + dev specs PDF.',
    revisionPolicy: '3 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '18000',
    paymentMethod: 'Bank Transfer',
    isAdvancePayment: true,
    advanceAmount: '5000',
    milestonesDetail: [
      { title: 'UX Research & Flow', description: 'User flows and research report', amount: 3000, due_date: '2024-12-01', is_initial_payment: true, submission_criteria: 'PDF + Miro', completion_criteria_tc: 'Stakeholder approval' },
      { title: 'High-Fi Mockups', description: 'All screens in Figma', amount: 5000, due_date: '2025-01-31', is_initial_payment: false, submission_criteria: 'Figma link', completion_criteria_tc: 'Design review' },
      { title: 'Prototype Animation', description: 'Lottie and micro-interactions', amount: 4000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Figma prototype', completion_criteria_tc: 'Approval' },
      { title: 'Dev Handoff Specs', description: 'Specs and asset export', amount: 4000, due_date: '2025-04-15', is_initial_payment: false, submission_criteria: 'PDF + Figma', completion_criteria_tc: 'Handoff complete' },
      { title: 'Final Review', description: 'Post-dev QA and tweaks', amount: 2000, due_date: '2025-04-30', is_initial_payment: false, submission_criteria: 'Sign-off', completion_criteria_tc: 'Client sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 7,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    milestoneDeadline: 'May 2025',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'B2B cloud infrastructure dashboard with D3.js charts.',
    startDate: '2024-12-01',
    deadline: '2025-05-31',
    duration: '6 months',
    customTerms: 'Standard SaaS terms.',
    clientName: 'Sam Chen',
    clientEmail: 'sam@cloudsync.io',
    clientPhone: '+1 (555) 300-4000',
    clientCountry: 'United States',
    clientCompany: 'CloudSync',
    outOfScope: 'Backend API and deployment.',
    coreDeliverable: 'Figma + component specs + D3 chart specs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '8200',
    paymentMethod: 'PayPal',
    isAdvancePayment: false,
    advanceAmount: '',
    milestonesDetail: [
      { title: 'Information Architecture', description: 'IA and wireframes', amount: 2500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Approval' },
      { title: 'Dashboard Components', description: 'Core UI components', amount: 3200, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Review' },
      { title: 'Data Binding & Charts', description: 'D3 charts and data grids', amount: 2500, due_date: '2025-05-31', is_initial_payment: false, submission_criteria: 'Figma + spec', completion_criteria_tc: 'Sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 8,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    milestoneDeadline: 'Jun 2025',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ],
    projectType: 'Web Development',
    projectDesc: 'AI video generation frontend with WebSockets and Fabric.js timeline.',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    duration: '6 months',
    customTerms: 'IP and data usage for AI training.',
    clientName: 'Jordan Lee',
    clientEmail: 'jordan@visionaryai.com',
    clientPhone: '+1 (555) 500-6000',
    clientCountry: 'United States',
    clientCompany: 'Visionary AI',
    outOfScope: 'ML models and video encoding backend.',
    coreDeliverable: 'Staging app + GitHub repo + deployment docs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Shared ownership',
    contractCurrency: 'USD',
    contractAmount: '25000',
    paymentMethod: 'Crypto',
    isAdvancePayment: true,
    advanceAmount: '7500',
    milestonesDetail: [
      { title: 'Prompt Input & UI Shell', description: 'Input UI and app shell', amount: 5000, due_date: '2025-02-01', is_initial_payment: true, submission_criteria: 'Staging URL', completion_criteria_tc: 'Approval' },
      { title: 'WebSocket Streaming', description: 'Progress and stream UI', amount: 5000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Demo', completion_criteria_tc: 'Sign-off' },
      { title: 'Video Timeline Editor', description: 'Fabric.js timeline', amount: 6000, due_date: '2025-05-01', is_initial_payment: false, submission_criteria: 'Staging', completion_criteria_tc: 'QA' },
      { title: 'Export & Rendering Flow', description: 'Export and render pipeline UI', amount: 5000, due_date: '2025-06-01', is_initial_payment: false, submission_criteria: 'E2E test', completion_criteria_tc: 'Pass' },
      { title: 'QA & Launch', description: 'Bug fixes and launch prep', amount: 4000, due_date: '2025-06-30', is_initial_payment: false, submission_criteria: 'Production', completion_criteria_tc: 'Launch' },
    ] as MilestoneDetail[],
  },
  {
    id: 1,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    milestoneDeadline: 'Mar 2025',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ],
    projectType: 'E-Commerce',
    projectDesc: 'Full storefront with cart, checkout, and Stripe integration.',
    startDate: '2024-10-01',
    deadline: '2025-03-31',
    duration: '6 months',
    customTerms: 'Standard confidentiality and professional conduct.',
    clientName: 'Jane Smith',
    clientEmail: 'jane@technova.com',
    clientPhone: '+1 (555) 100-2000',
    clientCountry: 'United States',
    clientCompany: 'TechNova Solutions',
    outOfScope: 'Backend API development, hosting, and ongoing maintenance.',
    coreDeliverable: 'Live staging link + Figma handoff + component library.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '12500',
    paymentMethod: 'Stripe',
    isAdvancePayment: true,
    advanceAmount: '2500',
    milestonesDetail: [
      { title: 'Wireframes', description: 'Low-fi and hi-fi wireframes', amount: 2500, due_date: '2024-11-15', is_initial_payment: true, submission_criteria: 'Figma link', completion_criteria_tc: 'Approval within 5 days' },
      { title: 'Component Architecture', description: 'Core components built', amount: 3500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'GitHub + Storybook', completion_criteria_tc: 'Code review sign-off' },
      { title: 'API Integration', description: 'Stripe and cart integration', amount: 3500, due_date: '2025-02-28', is_initial_payment: false, submission_criteria: 'Staging URL', completion_criteria_tc: 'QA pass' },
      { title: 'Checkout & Deploy', description: 'Checkout flow and production deploy', amount: 3000, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Live link', completion_criteria_tc: 'Final sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 2,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    milestoneDeadline: 'Apr 2025',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'Neobank app UI with dark mode and Lottie animations.',
    startDate: '2024-11-01',
    deadline: '2025-04-30',
    duration: '6 months',
    customTerms: 'NDA and financial data handling terms.',
    clientName: 'Alex Rivera',
    clientEmail: 'alex@finvanguard.com',
    clientPhone: '+44 20 7946 0958',
    clientCountry: 'United Kingdom',
    clientCompany: 'FinVanguard',
    outOfScope: 'Backend, compliance logic, and app store submission.',
    coreDeliverable: 'Figma file + prototype + dev specs PDF.',
    revisionPolicy: '3 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '18000',
    paymentMethod: 'Bank Transfer',
    isAdvancePayment: true,
    advanceAmount: '5000',
    milestonesDetail: [
      { title: 'UX Research & Flow', description: 'User flows and research report', amount: 3000, due_date: '2024-12-01', is_initial_payment: true, submission_criteria: 'PDF + Miro', completion_criteria_tc: 'Stakeholder approval' },
      { title: 'High-Fi Mockups', description: 'All screens in Figma', amount: 5000, due_date: '2025-01-31', is_initial_payment: false, submission_criteria: 'Figma link', completion_criteria_tc: 'Design review' },
      { title: 'Prototype Animation', description: 'Lottie and micro-interactions', amount: 4000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Figma prototype', completion_criteria_tc: 'Approval' },
      { title: 'Dev Handoff Specs', description: 'Specs and asset export', amount: 4000, due_date: '2025-04-15', is_initial_payment: false, submission_criteria: 'PDF + Figma', completion_criteria_tc: 'Handoff complete' },
      { title: 'Final Review', description: 'Post-dev QA and tweaks', amount: 2000, due_date: '2025-04-30', is_initial_payment: false, submission_criteria: 'Sign-off', completion_criteria_tc: 'Client sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 3,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    milestoneDeadline: 'May 2025',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'B2B cloud infrastructure dashboard with D3.js charts.',
    startDate: '2024-12-01',
    deadline: '2025-05-31',
    duration: '6 months',
    customTerms: 'Standard SaaS terms.',
    clientName: 'Sam Chen',
    clientEmail: 'sam@cloudsync.io',
    clientPhone: '+1 (555) 300-4000',
    clientCountry: 'United States',
    clientCompany: 'CloudSync',
    outOfScope: 'Backend API and deployment.',
    coreDeliverable: 'Figma + component specs + D3 chart specs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '8200',
    paymentMethod: 'PayPal',
    isAdvancePayment: false,
    advanceAmount: '',
    milestonesDetail: [
      { title: 'Information Architecture', description: 'IA and wireframes', amount: 2500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Approval' },
      { title: 'Dashboard Components', description: 'Core UI components', amount: 3200, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Review' },
      { title: 'Data Binding & Charts', description: 'D3 charts and data grids', amount: 2500, due_date: '2025-05-31', is_initial_payment: false, submission_criteria: 'Figma + spec', completion_criteria_tc: 'Sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 4,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    milestoneDeadline: 'Jun 2025',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ],
    projectType: 'Web Development',
    projectDesc: 'AI video generation frontend with WebSockets and Fabric.js timeline.',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    duration: '6 months',
    customTerms: 'IP and data usage for AI training.',
    clientName: 'Jordan Lee',
    clientEmail: 'jordan@visionaryai.com',
    clientPhone: '+1 (555) 500-6000',
    clientCountry: 'United States',
    clientCompany: 'Visionary AI',
    outOfScope: 'ML models and video encoding backend.',
    coreDeliverable: 'Staging app + GitHub repo + deployment docs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Shared ownership',
    contractCurrency: 'USD',
    contractAmount: '25000',
    paymentMethod: 'Crypto',
    isAdvancePayment: true,
    advanceAmount: '7500',
    milestonesDetail: [
      { title: 'Prompt Input & UI Shell', description: 'Input UI and app shell', amount: 5000, due_date: '2025-02-01', is_initial_payment: true, submission_criteria: 'Staging URL', completion_criteria_tc: 'Approval' },
      { title: 'WebSocket Streaming', description: 'Progress and stream UI', amount: 5000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Demo', completion_criteria_tc: 'Sign-off' },
      { title: 'Video Timeline Editor', description: 'Fabric.js timeline', amount: 6000, due_date: '2025-05-01', is_initial_payment: false, submission_criteria: 'Staging', completion_criteria_tc: 'QA' },
      { title: 'Export & Rendering Flow', description: 'Export and render pipeline UI', amount: 5000, due_date: '2025-06-01', is_initial_payment: false, submission_criteria: 'E2E test', completion_criteria_tc: 'Pass' },
      { title: 'QA & Launch', description: 'Bug fixes and launch prep', amount: 4000, due_date: '2025-06-30', is_initial_payment: false, submission_criteria: 'Production', completion_criteria_tc: 'Launch' },
    ] as MilestoneDetail[],
  },
  {
    id: 5,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    milestoneDeadline: 'Mar 2025',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ],
    projectType: 'E-Commerce',
    projectDesc: 'Full storefront with cart, checkout, and Stripe integration.',
    startDate: '2024-10-01',
    deadline: '2025-03-31',
    duration: '6 months',
    customTerms: 'Standard confidentiality and professional conduct.',
    clientName: 'Jane Smith',
    clientEmail: 'jane@technova.com',
    clientPhone: '+1 (555) 100-2000',
    clientCountry: 'United States',
    clientCompany: 'TechNova Solutions',
    outOfScope: 'Backend API development, hosting, and ongoing maintenance.',
    coreDeliverable: 'Live staging link + Figma handoff + component library.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '12500',
    paymentMethod: 'Stripe',
    isAdvancePayment: true,
    advanceAmount: '2500',
    milestonesDetail: [
      { title: 'Wireframes', description: 'Low-fi and hi-fi wireframes', amount: 2500, due_date: '2024-11-15', is_initial_payment: true, submission_criteria: 'Figma link', completion_criteria_tc: 'Approval within 5 days' },
      { title: 'Component Architecture', description: 'Core components built', amount: 3500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'GitHub + Storybook', completion_criteria_tc: 'Code review sign-off' },
      { title: 'API Integration', description: 'Stripe and cart integration', amount: 3500, due_date: '2025-02-28', is_initial_payment: false, submission_criteria: 'Staging URL', completion_criteria_tc: 'QA pass' },
      { title: 'Checkout & Deploy', description: 'Checkout flow and production deploy', amount: 3000, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Live link', completion_criteria_tc: 'Final sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 6,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    milestoneDeadline: 'Apr 2025',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'Neobank app UI with dark mode and Lottie animations.',
    startDate: '2024-11-01',
    deadline: '2025-04-30',
    duration: '6 months',
    customTerms: 'NDA and financial data handling terms.',
    clientName: 'Alex Rivera',
    clientEmail: 'alex@finvanguard.com',
    clientPhone: '+44 20 7946 0958',
    clientCountry: 'United Kingdom',
    clientCompany: 'FinVanguard',
    outOfScope: 'Backend, compliance logic, and app store submission.',
    coreDeliverable: 'Figma file + prototype + dev specs PDF.',
    revisionPolicy: '3 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '18000',
    paymentMethod: 'Bank Transfer',
    isAdvancePayment: true,
    advanceAmount: '5000',
    milestonesDetail: [
      { title: 'UX Research & Flow', description: 'User flows and research report', amount: 3000, due_date: '2024-12-01', is_initial_payment: true, submission_criteria: 'PDF + Miro', completion_criteria_tc: 'Stakeholder approval' },
      { title: 'High-Fi Mockups', description: 'All screens in Figma', amount: 5000, due_date: '2025-01-31', is_initial_payment: false, submission_criteria: 'Figma link', completion_criteria_tc: 'Design review' },
      { title: 'Prototype Animation', description: 'Lottie and micro-interactions', amount: 4000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Figma prototype', completion_criteria_tc: 'Approval' },
      { title: 'Dev Handoff Specs', description: 'Specs and asset export', amount: 4000, due_date: '2025-04-15', is_initial_payment: false, submission_criteria: 'PDF + Figma', completion_criteria_tc: 'Handoff complete' },
      { title: 'Final Review', description: 'Post-dev QA and tweaks', amount: 2000, due_date: '2025-04-30', is_initial_payment: false, submission_criteria: 'Sign-off', completion_criteria_tc: 'Client sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 7,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    milestoneDeadline: 'May 2025',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'B2B cloud infrastructure dashboard with D3.js charts.',
    startDate: '2024-12-01',
    deadline: '2025-05-31',
    duration: '6 months',
    customTerms: 'Standard SaaS terms.',
    clientName: 'Sam Chen',
    clientEmail: 'sam@cloudsync.io',
    clientPhone: '+1 (555) 300-4000',
    clientCountry: 'United States',
    clientCompany: 'CloudSync',
    outOfScope: 'Backend API and deployment.',
    coreDeliverable: 'Figma + component specs + D3 chart specs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '8200',
    paymentMethod: 'PayPal',
    isAdvancePayment: false,
    advanceAmount: '',
    milestonesDetail: [
      { title: 'Information Architecture', description: 'IA and wireframes', amount: 2500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Approval' },
      { title: 'Dashboard Components', description: 'Core UI components', amount: 3200, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Review' },
      { title: 'Data Binding & Charts', description: 'D3 charts and data grids', amount: 2500, due_date: '2025-05-31', is_initial_payment: false, submission_criteria: 'Figma + spec', completion_criteria_tc: 'Sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 8,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    milestoneDeadline: 'Jun 2025',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ],
    projectType: 'Web Development',
    projectDesc: 'AI video generation frontend with WebSockets and Fabric.js timeline.',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    duration: '6 months',
    customTerms: 'IP and data usage for AI training.',
    clientName: 'Jordan Lee',
    clientEmail: 'jordan@visionaryai.com',
    clientPhone: '+1 (555) 500-6000',
    clientCountry: 'United States',
    clientCompany: 'Visionary AI',
    outOfScope: 'ML models and video encoding backend.',
    coreDeliverable: 'Staging app + GitHub repo + deployment docs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Shared ownership',
    contractCurrency: 'USD',
    contractAmount: '25000',
    paymentMethod: 'Crypto',
    isAdvancePayment: true,
    advanceAmount: '7500',
    milestonesDetail: [
      { title: 'Prompt Input & UI Shell', description: 'Input UI and app shell', amount: 5000, due_date: '2025-02-01', is_initial_payment: true, submission_criteria: 'Staging URL', completion_criteria_tc: 'Approval' },
      { title: 'WebSocket Streaming', description: 'Progress and stream UI', amount: 5000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Demo', completion_criteria_tc: 'Sign-off' },
      { title: 'Video Timeline Editor', description: 'Fabric.js timeline', amount: 6000, due_date: '2025-05-01', is_initial_payment: false, submission_criteria: 'Staging', completion_criteria_tc: 'QA' },
      { title: 'Export & Rendering Flow', description: 'Export and render pipeline UI', amount: 5000, due_date: '2025-06-01', is_initial_payment: false, submission_criteria: 'E2E test', completion_criteria_tc: 'Pass' },
      { title: 'QA & Launch', description: 'Bug fixes and launch prep', amount: 4000, due_date: '2025-06-30', is_initial_payment: false, submission_criteria: 'Production', completion_criteria_tc: 'Launch' },
    ] as MilestoneDetail[],
  },
  {
    id: 1,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    milestoneDeadline: 'Mar 2025',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ],
    projectType: 'E-Commerce',
    projectDesc: 'Full storefront with cart, checkout, and Stripe integration.',
    startDate: '2024-10-01',
    deadline: '2025-03-31',
    duration: '6 months',
    customTerms: 'Standard confidentiality and professional conduct.',
    clientName: 'Jane Smith',
    clientEmail: 'jane@technova.com',
    clientPhone: '+1 (555) 100-2000',
    clientCountry: 'United States',
    clientCompany: 'TechNova Solutions',
    outOfScope: 'Backend API development, hosting, and ongoing maintenance.',
    coreDeliverable: 'Live staging link + Figma handoff + component library.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '12500',
    paymentMethod: 'Stripe',
    isAdvancePayment: true,
    advanceAmount: '2500',
    milestonesDetail: [
      { title: 'Wireframes', description: 'Low-fi and hi-fi wireframes', amount: 2500, due_date: '2024-11-15', is_initial_payment: true, submission_criteria: 'Figma link', completion_criteria_tc: 'Approval within 5 days' },
      { title: 'Component Architecture', description: 'Core components built', amount: 3500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'GitHub + Storybook', completion_criteria_tc: 'Code review sign-off' },
      { title: 'API Integration', description: 'Stripe and cart integration', amount: 3500, due_date: '2025-02-28', is_initial_payment: false, submission_criteria: 'Staging URL', completion_criteria_tc: 'QA pass' },
      { title: 'Checkout & Deploy', description: 'Checkout flow and production deploy', amount: 3000, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Live link', completion_criteria_tc: 'Final sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 2,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    milestoneDeadline: 'Apr 2025',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'Neobank app UI with dark mode and Lottie animations.',
    startDate: '2024-11-01',
    deadline: '2025-04-30',
    duration: '6 months',
    customTerms: 'NDA and financial data handling terms.',
    clientName: 'Alex Rivera',
    clientEmail: 'alex@finvanguard.com',
    clientPhone: '+44 20 7946 0958',
    clientCountry: 'United Kingdom',
    clientCompany: 'FinVanguard',
    outOfScope: 'Backend, compliance logic, and app store submission.',
    coreDeliverable: 'Figma file + prototype + dev specs PDF.',
    revisionPolicy: '3 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '18000',
    paymentMethod: 'Bank Transfer',
    isAdvancePayment: true,
    advanceAmount: '5000',
    milestonesDetail: [
      { title: 'UX Research & Flow', description: 'User flows and research report', amount: 3000, due_date: '2024-12-01', is_initial_payment: true, submission_criteria: 'PDF + Miro', completion_criteria_tc: 'Stakeholder approval' },
      { title: 'High-Fi Mockups', description: 'All screens in Figma', amount: 5000, due_date: '2025-01-31', is_initial_payment: false, submission_criteria: 'Figma link', completion_criteria_tc: 'Design review' },
      { title: 'Prototype Animation', description: 'Lottie and micro-interactions', amount: 4000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Figma prototype', completion_criteria_tc: 'Approval' },
      { title: 'Dev Handoff Specs', description: 'Specs and asset export', amount: 4000, due_date: '2025-04-15', is_initial_payment: false, submission_criteria: 'PDF + Figma', completion_criteria_tc: 'Handoff complete' },
      { title: 'Final Review', description: 'Post-dev QA and tweaks', amount: 2000, due_date: '2025-04-30', is_initial_payment: false, submission_criteria: 'Sign-off', completion_criteria_tc: 'Client sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 3,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    milestoneDeadline: 'May 2025',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'B2B cloud infrastructure dashboard with D3.js charts.',
    startDate: '2024-12-01',
    deadline: '2025-05-31',
    duration: '6 months',
    customTerms: 'Standard SaaS terms.',
    clientName: 'Sam Chen',
    clientEmail: 'sam@cloudsync.io',
    clientPhone: '+1 (555) 300-4000',
    clientCountry: 'United States',
    clientCompany: 'CloudSync',
    outOfScope: 'Backend API and deployment.',
    coreDeliverable: 'Figma + component specs + D3 chart specs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '8200',
    paymentMethod: 'PayPal',
    isAdvancePayment: false,
    advanceAmount: '',
    milestonesDetail: [
      { title: 'Information Architecture', description: 'IA and wireframes', amount: 2500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Approval' },
      { title: 'Dashboard Components', description: 'Core UI components', amount: 3200, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Review' },
      { title: 'Data Binding & Charts', description: 'D3 charts and data grids', amount: 2500, due_date: '2025-05-31', is_initial_payment: false, submission_criteria: 'Figma + spec', completion_criteria_tc: 'Sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 4,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    milestoneDeadline: 'Jun 2025',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ],
    projectType: 'Web Development',
    projectDesc: 'AI video generation frontend with WebSockets and Fabric.js timeline.',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    duration: '6 months',
    customTerms: 'IP and data usage for AI training.',
    clientName: 'Jordan Lee',
    clientEmail: 'jordan@visionaryai.com',
    clientPhone: '+1 (555) 500-6000',
    clientCountry: 'United States',
    clientCompany: 'Visionary AI',
    outOfScope: 'ML models and video encoding backend.',
    coreDeliverable: 'Staging app + GitHub repo + deployment docs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Shared ownership',
    contractCurrency: 'USD',
    contractAmount: '25000',
    paymentMethod: 'Crypto',
    isAdvancePayment: true,
    advanceAmount: '7500',
    milestonesDetail: [
      { title: 'Prompt Input & UI Shell', description: 'Input UI and app shell', amount: 5000, due_date: '2025-02-01', is_initial_payment: true, submission_criteria: 'Staging URL', completion_criteria_tc: 'Approval' },
      { title: 'WebSocket Streaming', description: 'Progress and stream UI', amount: 5000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Demo', completion_criteria_tc: 'Sign-off' },
      { title: 'Video Timeline Editor', description: 'Fabric.js timeline', amount: 6000, due_date: '2025-05-01', is_initial_payment: false, submission_criteria: 'Staging', completion_criteria_tc: 'QA' },
      { title: 'Export & Rendering Flow', description: 'Export and render pipeline UI', amount: 5000, due_date: '2025-06-01', is_initial_payment: false, submission_criteria: 'E2E test', completion_criteria_tc: 'Pass' },
      { title: 'QA & Launch', description: 'Bug fixes and launch prep', amount: 4000, due_date: '2025-06-30', is_initial_payment: false, submission_criteria: 'Production', completion_criteria_tc: 'Launch' },
    ] as MilestoneDetail[],
  },
  {
    id: 5,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    milestoneDeadline: 'Mar 2025',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ],
    projectType: 'E-Commerce',
    projectDesc: 'Full storefront with cart, checkout, and Stripe integration.',
    startDate: '2024-10-01',
    deadline: '2025-03-31',
    duration: '6 months',
    customTerms: 'Standard confidentiality and professional conduct.',
    clientName: 'Jane Smith',
    clientEmail: 'jane@technova.com',
    clientPhone: '+1 (555) 100-2000',
    clientCountry: 'United States',
    clientCompany: 'TechNova Solutions',
    outOfScope: 'Backend API development, hosting, and ongoing maintenance.',
    coreDeliverable: 'Live staging link + Figma handoff + component library.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '12500',
    paymentMethod: 'Stripe',
    isAdvancePayment: true,
    advanceAmount: '2500',
    milestonesDetail: [
      { title: 'Wireframes', description: 'Low-fi and hi-fi wireframes', amount: 2500, due_date: '2024-11-15', is_initial_payment: true, submission_criteria: 'Figma link', completion_criteria_tc: 'Approval within 5 days' },
      { title: 'Component Architecture', description: 'Core components built', amount: 3500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'GitHub + Storybook', completion_criteria_tc: 'Code review sign-off' },
      { title: 'API Integration', description: 'Stripe and cart integration', amount: 3500, due_date: '2025-02-28', is_initial_payment: false, submission_criteria: 'Staging URL', completion_criteria_tc: 'QA pass' },
      { title: 'Checkout & Deploy', description: 'Checkout flow and production deploy', amount: 3000, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Live link', completion_criteria_tc: 'Final sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 6,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    milestoneDeadline: 'Apr 2025',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'Neobank app UI with dark mode and Lottie animations.',
    startDate: '2024-11-01',
    deadline: '2025-04-30',
    duration: '6 months',
    customTerms: 'NDA and financial data handling terms.',
    clientName: 'Alex Rivera',
    clientEmail: 'alex@finvanguard.com',
    clientPhone: '+44 20 7946 0958',
    clientCountry: 'United Kingdom',
    clientCompany: 'FinVanguard',
    outOfScope: 'Backend, compliance logic, and app store submission.',
    coreDeliverable: 'Figma file + prototype + dev specs PDF.',
    revisionPolicy: '3 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '18000',
    paymentMethod: 'Bank Transfer',
    isAdvancePayment: true,
    advanceAmount: '5000',
    milestonesDetail: [
      { title: 'UX Research & Flow', description: 'User flows and research report', amount: 3000, due_date: '2024-12-01', is_initial_payment: true, submission_criteria: 'PDF + Miro', completion_criteria_tc: 'Stakeholder approval' },
      { title: 'High-Fi Mockups', description: 'All screens in Figma', amount: 5000, due_date: '2025-01-31', is_initial_payment: false, submission_criteria: 'Figma link', completion_criteria_tc: 'Design review' },
      { title: 'Prototype Animation', description: 'Lottie and micro-interactions', amount: 4000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Figma prototype', completion_criteria_tc: 'Approval' },
      { title: 'Dev Handoff Specs', description: 'Specs and asset export', amount: 4000, due_date: '2025-04-15', is_initial_payment: false, submission_criteria: 'PDF + Figma', completion_criteria_tc: 'Handoff complete' },
      { title: 'Final Review', description: 'Post-dev QA and tweaks', amount: 2000, due_date: '2025-04-30', is_initial_payment: false, submission_criteria: 'Sign-off', completion_criteria_tc: 'Client sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 7,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    milestoneDeadline: 'May 2025',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'B2B cloud infrastructure dashboard with D3.js charts.',
    startDate: '2024-12-01',
    deadline: '2025-05-31',
    duration: '6 months',
    customTerms: 'Standard SaaS terms.',
    clientName: 'Sam Chen',
    clientEmail: 'sam@cloudsync.io',
    clientPhone: '+1 (555) 300-4000',
    clientCountry: 'United States',
    clientCompany: 'CloudSync',
    outOfScope: 'Backend API and deployment.',
    coreDeliverable: 'Figma + component specs + D3 chart specs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '8200',
    paymentMethod: 'PayPal',
    isAdvancePayment: false,
    advanceAmount: '',
    milestonesDetail: [
      { title: 'Information Architecture', description: 'IA and wireframes', amount: 2500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Approval' },
      { title: 'Dashboard Components', description: 'Core UI components', amount: 3200, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Review' },
      { title: 'Data Binding & Charts', description: 'D3 charts and data grids', amount: 2500, due_date: '2025-05-31', is_initial_payment: false, submission_criteria: 'Figma + spec', completion_criteria_tc: 'Sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 8,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    milestoneDeadline: 'Jun 2025',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ],
    projectType: 'Web Development',
    projectDesc: 'AI video generation frontend with WebSockets and Fabric.js timeline.',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    duration: '6 months',
    customTerms: 'IP and data usage for AI training.',
    clientName: 'Jordan Lee',
    clientEmail: 'jordan@visionaryai.com',
    clientPhone: '+1 (555) 500-6000',
    clientCountry: 'United States',
    clientCompany: 'Visionary AI',
    outOfScope: 'ML models and video encoding backend.',
    coreDeliverable: 'Staging app + GitHub repo + deployment docs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Shared ownership',
    contractCurrency: 'USD',
    contractAmount: '25000',
    paymentMethod: 'Crypto',
    isAdvancePayment: true,
    advanceAmount: '7500',
    milestonesDetail: [
      { title: 'Prompt Input & UI Shell', description: 'Input UI and app shell', amount: 5000, due_date: '2025-02-01', is_initial_payment: true, submission_criteria: 'Staging URL', completion_criteria_tc: 'Approval' },
      { title: 'WebSocket Streaming', description: 'Progress and stream UI', amount: 5000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Demo', completion_criteria_tc: 'Sign-off' },
      { title: 'Video Timeline Editor', description: 'Fabric.js timeline', amount: 6000, due_date: '2025-05-01', is_initial_payment: false, submission_criteria: 'Staging', completion_criteria_tc: 'QA' },
      { title: 'Export & Rendering Flow', description: 'Export and render pipeline UI', amount: 5000, due_date: '2025-06-01', is_initial_payment: false, submission_criteria: 'E2E test', completion_criteria_tc: 'Pass' },
      { title: 'QA & Launch', description: 'Bug fixes and launch prep', amount: 4000, due_date: '2025-06-30', is_initial_payment: false, submission_criteria: 'Production', completion_criteria_tc: 'Launch' },
    ] as MilestoneDetail[],
  },
  {
    id: 1,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    milestoneDeadline: 'Mar 2025',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ],
    projectType: 'E-Commerce',
    projectDesc: 'Full storefront with cart, checkout, and Stripe integration.',
    startDate: '2024-10-01',
    deadline: '2025-03-31',
    duration: '6 months',
    customTerms: 'Standard confidentiality and professional conduct.',
    clientName: 'Jane Smith',
    clientEmail: 'jane@technova.com',
    clientPhone: '+1 (555) 100-2000',
    clientCountry: 'United States',
    clientCompany: 'TechNova Solutions',
    outOfScope: 'Backend API development, hosting, and ongoing maintenance.',
    coreDeliverable: 'Live staging link + Figma handoff + component library.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '12500',
    paymentMethod: 'Stripe',
    isAdvancePayment: true,
    advanceAmount: '2500',
    milestonesDetail: [
      { title: 'Wireframes', description: 'Low-fi and hi-fi wireframes', amount: 2500, due_date: '2024-11-15', is_initial_payment: true, submission_criteria: 'Figma link', completion_criteria_tc: 'Approval within 5 days' },
      { title: 'Component Architecture', description: 'Core components built', amount: 3500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'GitHub + Storybook', completion_criteria_tc: 'Code review sign-off' },
      { title: 'API Integration', description: 'Stripe and cart integration', amount: 3500, due_date: '2025-02-28', is_initial_payment: false, submission_criteria: 'Staging URL', completion_criteria_tc: 'QA pass' },
      { title: 'Checkout & Deploy', description: 'Checkout flow and production deploy', amount: 3000, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Live link', completion_criteria_tc: 'Final sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 2,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    milestoneDeadline: 'Apr 2025',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'Neobank app UI with dark mode and Lottie animations.',
    startDate: '2024-11-01',
    deadline: '2025-04-30',
    duration: '6 months',
    customTerms: 'NDA and financial data handling terms.',
    clientName: 'Alex Rivera',
    clientEmail: 'alex@finvanguard.com',
    clientPhone: '+44 20 7946 0958',
    clientCountry: 'United Kingdom',
    clientCompany: 'FinVanguard',
    outOfScope: 'Backend, compliance logic, and app store submission.',
    coreDeliverable: 'Figma file + prototype + dev specs PDF.',
    revisionPolicy: '3 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '18000',
    paymentMethod: 'Bank Transfer',
    isAdvancePayment: true,
    advanceAmount: '5000',
    milestonesDetail: [
      { title: 'UX Research & Flow', description: 'User flows and research report', amount: 3000, due_date: '2024-12-01', is_initial_payment: true, submission_criteria: 'PDF + Miro', completion_criteria_tc: 'Stakeholder approval' },
      { title: 'High-Fi Mockups', description: 'All screens in Figma', amount: 5000, due_date: '2025-01-31', is_initial_payment: false, submission_criteria: 'Figma link', completion_criteria_tc: 'Design review' },
      { title: 'Prototype Animation', description: 'Lottie and micro-interactions', amount: 4000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Figma prototype', completion_criteria_tc: 'Approval' },
      { title: 'Dev Handoff Specs', description: 'Specs and asset export', amount: 4000, due_date: '2025-04-15', is_initial_payment: false, submission_criteria: 'PDF + Figma', completion_criteria_tc: 'Handoff complete' },
      { title: 'Final Review', description: 'Post-dev QA and tweaks', amount: 2000, due_date: '2025-04-30', is_initial_payment: false, submission_criteria: 'Sign-off', completion_criteria_tc: 'Client sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 3,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    milestoneDeadline: 'May 2025',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'B2B cloud infrastructure dashboard with D3.js charts.',
    startDate: '2024-12-01',
    deadline: '2025-05-31',
    duration: '6 months',
    customTerms: 'Standard SaaS terms.',
    clientName: 'Sam Chen',
    clientEmail: 'sam@cloudsync.io',
    clientPhone: '+1 (555) 300-4000',
    clientCountry: 'United States',
    clientCompany: 'CloudSync',
    outOfScope: 'Backend API and deployment.',
    coreDeliverable: 'Figma + component specs + D3 chart specs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '8200',
    paymentMethod: 'PayPal',
    isAdvancePayment: false,
    advanceAmount: '',
    milestonesDetail: [
      { title: 'Information Architecture', description: 'IA and wireframes', amount: 2500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Approval' },
      { title: 'Dashboard Components', description: 'Core UI components', amount: 3200, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Review' },
      { title: 'Data Binding & Charts', description: 'D3 charts and data grids', amount: 2500, due_date: '2025-05-31', is_initial_payment: false, submission_criteria: 'Figma + spec', completion_criteria_tc: 'Sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 4,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    milestoneDeadline: 'Jun 2025',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ],
    projectType: 'Web Development',
    projectDesc: 'AI video generation frontend with WebSockets and Fabric.js timeline.',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    duration: '6 months',
    customTerms: 'IP and data usage for AI training.',
    clientName: 'Jordan Lee',
    clientEmail: 'jordan@visionaryai.com',
    clientPhone: '+1 (555) 500-6000',
    clientCountry: 'United States',
    clientCompany: 'Visionary AI',
    outOfScope: 'ML models and video encoding backend.',
    coreDeliverable: 'Staging app + GitHub repo + deployment docs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Shared ownership',
    contractCurrency: 'USD',
    contractAmount: '25000',
    paymentMethod: 'Crypto',
    isAdvancePayment: true,
    advanceAmount: '7500',
    milestonesDetail: [
      { title: 'Prompt Input & UI Shell', description: 'Input UI and app shell', amount: 5000, due_date: '2025-02-01', is_initial_payment: true, submission_criteria: 'Staging URL', completion_criteria_tc: 'Approval' },
      { title: 'WebSocket Streaming', description: 'Progress and stream UI', amount: 5000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Demo', completion_criteria_tc: 'Sign-off' },
      { title: 'Video Timeline Editor', description: 'Fabric.js timeline', amount: 6000, due_date: '2025-05-01', is_initial_payment: false, submission_criteria: 'Staging', completion_criteria_tc: 'QA' },
      { title: 'Export & Rendering Flow', description: 'Export and render pipeline UI', amount: 5000, due_date: '2025-06-01', is_initial_payment: false, submission_criteria: 'E2E test', completion_criteria_tc: 'Pass' },
      { title: 'QA & Launch', description: 'Bug fixes and launch prep', amount: 4000, due_date: '2025-06-30', is_initial_payment: false, submission_criteria: 'Production', completion_criteria_tc: 'Launch' },
    ] as MilestoneDetail[],
  },
  {
    id: 5,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    milestoneDeadline: 'Mar 2025',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ],
    projectType: 'E-Commerce',
    projectDesc: 'Full storefront with cart, checkout, and Stripe integration.',
    startDate: '2024-10-01',
    deadline: '2025-03-31',
    duration: '6 months',
    customTerms: 'Standard confidentiality and professional conduct.',
    clientName: 'Jane Smith',
    clientEmail: 'jane@technova.com',
    clientPhone: '+1 (555) 100-2000',
    clientCountry: 'United States',
    clientCompany: 'TechNova Solutions',
    outOfScope: 'Backend API development, hosting, and ongoing maintenance.',
    coreDeliverable: 'Live staging link + Figma handoff + component library.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '12500',
    paymentMethod: 'Stripe',
    isAdvancePayment: true,
    advanceAmount: '2500',
    milestonesDetail: [
      { title: 'Wireframes', description: 'Low-fi and hi-fi wireframes', amount: 2500, due_date: '2024-11-15', is_initial_payment: true, submission_criteria: 'Figma link', completion_criteria_tc: 'Approval within 5 days' },
      { title: 'Component Architecture', description: 'Core components built', amount: 3500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'GitHub + Storybook', completion_criteria_tc: 'Code review sign-off' },
      { title: 'API Integration', description: 'Stripe and cart integration', amount: 3500, due_date: '2025-02-28', is_initial_payment: false, submission_criteria: 'Staging URL', completion_criteria_tc: 'QA pass' },
      { title: 'Checkout & Deploy', description: 'Checkout flow and production deploy', amount: 3000, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Live link', completion_criteria_tc: 'Final sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 6,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    milestoneDeadline: 'Apr 2025',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'Neobank app UI with dark mode and Lottie animations.',
    startDate: '2024-11-01',
    deadline: '2025-04-30',
    duration: '6 months',
    customTerms: 'NDA and financial data handling terms.',
    clientName: 'Alex Rivera',
    clientEmail: 'alex@finvanguard.com',
    clientPhone: '+44 20 7946 0958',
    clientCountry: 'United Kingdom',
    clientCompany: 'FinVanguard',
    outOfScope: 'Backend, compliance logic, and app store submission.',
    coreDeliverable: 'Figma file + prototype + dev specs PDF.',
    revisionPolicy: '3 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '18000',
    paymentMethod: 'Bank Transfer',
    isAdvancePayment: true,
    advanceAmount: '5000',
    milestonesDetail: [
      { title: 'UX Research & Flow', description: 'User flows and research report', amount: 3000, due_date: '2024-12-01', is_initial_payment: true, submission_criteria: 'PDF + Miro', completion_criteria_tc: 'Stakeholder approval' },
      { title: 'High-Fi Mockups', description: 'All screens in Figma', amount: 5000, due_date: '2025-01-31', is_initial_payment: false, submission_criteria: 'Figma link', completion_criteria_tc: 'Design review' },
      { title: 'Prototype Animation', description: 'Lottie and micro-interactions', amount: 4000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Figma prototype', completion_criteria_tc: 'Approval' },
      { title: 'Dev Handoff Specs', description: 'Specs and asset export', amount: 4000, due_date: '2025-04-15', is_initial_payment: false, submission_criteria: 'PDF + Figma', completion_criteria_tc: 'Handoff complete' },
      { title: 'Final Review', description: 'Post-dev QA and tweaks', amount: 2000, due_date: '2025-04-30', is_initial_payment: false, submission_criteria: 'Sign-off', completion_criteria_tc: 'Client sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 7,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    milestoneDeadline: 'May 2025',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ],
    projectType: 'UI/UX Design',
    projectDesc: 'B2B cloud infrastructure dashboard with D3.js charts.',
    startDate: '2024-12-01',
    deadline: '2025-05-31',
    duration: '6 months',
    customTerms: 'Standard SaaS terms.',
    clientName: 'Sam Chen',
    clientEmail: 'sam@cloudsync.io',
    clientPhone: '+1 (555) 300-4000',
    clientCountry: 'United States',
    clientCompany: 'CloudSync',
    outOfScope: 'Backend API and deployment.',
    coreDeliverable: 'Figma + component specs + D3 chart specs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Client owns all upon payment',
    contractCurrency: 'USD',
    contractAmount: '8200',
    paymentMethod: 'PayPal',
    isAdvancePayment: false,
    advanceAmount: '',
    milestonesDetail: [
      { title: 'Information Architecture', description: 'IA and wireframes', amount: 2500, due_date: '2025-01-15', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Approval' },
      { title: 'Dashboard Components', description: 'Core UI components', amount: 3200, due_date: '2025-03-31', is_initial_payment: false, submission_criteria: 'Figma', completion_criteria_tc: 'Review' },
      { title: 'Data Binding & Charts', description: 'D3 charts and data grids', amount: 2500, due_date: '2025-05-31', is_initial_payment: false, submission_criteria: 'Figma + spec', completion_criteria_tc: 'Sign-off' },
    ] as MilestoneDetail[],
  },
  {
    id: 8,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    milestoneDeadline: 'Jun 2025',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ],
    projectType: 'Web Development',
    projectDesc: 'AI video generation frontend with WebSockets and Fabric.js timeline.',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    duration: '6 months',
    customTerms: 'IP and data usage for AI training.',
    clientName: 'Jordan Lee',
    clientEmail: 'jordan@visionaryai.com',
    clientPhone: '+1 (555) 500-6000',
    clientCountry: 'United States',
    clientCompany: 'Visionary AI',
    outOfScope: 'ML models and video encoding backend.',
    coreDeliverable: 'Staging app + GitHub repo + deployment docs.',
    revisionPolicy: '2 Rounds',
    intellectualProperty: 'Shared ownership',
    contractCurrency: 'USD',
    contractAmount: '25000',
    paymentMethod: 'Crypto',
    isAdvancePayment: true,
    advanceAmount: '7500',
    milestonesDetail: [
      { title: 'Prompt Input & UI Shell', description: 'Input UI and app shell', amount: 5000, due_date: '2025-02-01', is_initial_payment: true, submission_criteria: 'Staging URL', completion_criteria_tc: 'Approval' },
      { title: 'WebSocket Streaming', description: 'Progress and stream UI', amount: 5000, due_date: '2025-03-15', is_initial_payment: false, submission_criteria: 'Demo', completion_criteria_tc: 'Sign-off' },
      { title: 'Video Timeline Editor', description: 'Fabric.js timeline', amount: 6000, due_date: '2025-05-01', is_initial_payment: false, submission_criteria: 'Staging', completion_criteria_tc: 'QA' },
      { title: 'Export & Rendering Flow', description: 'Export and render pipeline UI', amount: 5000, due_date: '2025-06-01', is_initial_payment: false, submission_criteria: 'E2E test', completion_criteria_tc: 'Pass' },
      { title: 'QA & Launch', description: 'Bug fixes and launch prep', amount: 4000, due_date: '2025-06-30', is_initial_payment: false, submission_criteria: 'Production', completion_criteria_tc: 'Launch' },
    ] as MilestoneDetail[],
  },

];

const statusConfig = {
  Active: { color: '#00e676', bg: 'bg-[#00e676]/10', text: 'text-[#00e676]', border: 'border-[#00e676]/30', Icon: CheckCircle },
  'In Review': { color: '#fbc02d', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', Icon: RotateCcw },
  Delayed: { color: '#ef5350', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', Icon: AlertCircle },
};

type ContractItem = (typeof CONTRACTS)[number];

const ContractTabCard = memo(function ContractTabCard({
  contract,
  index,
  isActive,
  isFirst,
  isLast,
  onSelect,
  setButtonRef,
}: {
  contract: ContractItem;
  index: number;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (index: number) => void;
  setButtonRef: (index: number, el: HTMLButtonElement | null) => void;
}) {
  const s = statusConfig[contract.status];
  const roundClass = isFirst && isLast
    ? 'rounded-t-[40px]'
    : isFirst
      ? 'rounded-tl-[40px] rounded-tr-[40px]'
      : isLast
        ? 'rounded-tl-[40px] rounded-tr-[40px]'
        : 'rounded-t-[40px]';
  // Active tab: same bg as detail panel, rounded bottom so it merges into the panel
  const activeRoundClass = isActive ? `${roundClass} rounded-b-[0px]` : roundClass;
  return (
    <motion.button
      ref={(el) => setButtonRef(index, el)}
      onClick={() => onSelect(index)}
      whileHover={{ scale: isActive ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{ marginTop: isActive ? 0 : 50 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative shrink-0 text-left px-5 py-4 border-none cursor-pointer ${isActive ? 'overflow-visible' : 'overflow-hidden'} ${activeRoundClass} ${isActive
        ? 'bg-[#0d1a10] shadow-none'
        : 'bg-[#d4edda]/50 backdrop-blur-sm'
        }`}
      style={{
        minWidth: '210px',
        width: '210px',
        marginBottom: isActive ? '0px' : '0px',
        zIndex: isActive ? 15 : 5,
      }}
    >
      {isActive && (
        <>
          <div className="rotate-180">
            <svg
              className="absolute left-47.5 bottom-15.5 h-14 w-14 pointer-events-none"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="corner-notch-mask">
                  {/* Start fully opaque (white) */}
                  <rect x="0" y="0" width="40" height="40" fill="white" />
                  {/* Cut out the inward curve (black = transparent area) */}
                  <path
                    d="M40 0
             A40 40 0 0 0 0 40
             L40 40 Z"
                    fill="black"
                  />
                </mask>
              </defs>

              {/* Apply the mask to a filled rect */}
              <rect
                x="0"
                y="0"
                width="40"
                height="40"
                fill="#0d1a10"
                mask="url(#corner-notch-mask)"
              />
            </svg>
          </div>
          <div className="rotate-270">
            <svg
              className="absolute -left-8 -bottom-40 h-14 w-14 pointer-events-none"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="corner-notch-mask">
                  {/* Start fully opaque (white) */}
                  <rect x="0" y="0" width="40" height="40" fill="white" />
                  {/* Cut out the inward curve (black = transparent area) */}
                  <path
                    d="M40 0
           A40 40 0 0 0 0 40
           L40 40 Z"
                    fill="black"
                  />
                </mask>
              </defs>

              {/* Apply the mask to a filled rect */}
              <rect
                x="0"
                y="0"
                width="40"
                height="40"
                fill="#0d1a10"
                mask="url(#corner-notch-mask)"
              />
            </svg>
          </div>
        </>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: s.color, boxShadow: isActive ? `0 0 6px ${s.color}` : 'none' }}
        />
        <span className={`text-xs font-semibold ${s.text}`}>{contract.status}</span>
      </div>
      <p className={`text-sm font-bold leading-snug mb-1 truncate ${isActive ? 'text-white' : 'text-gray-900'}`} title={contract.title}>
        {contract.title}
      </p>
      <p className="text-xs text-gray-500 truncate" title={contract.client}>{contract.client}</p>
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${contract.completion}%` }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: s.color }}
              />
            </div>
            <p className={`mt-1 text-[10px] font-medium ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>{contract.completion}% complete</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

export default function ContractsOverlay() {
  const { closeContracts, activeContractId } = useContractsStore();
  // If opened from a notification, start at that contract; otherwise default to first
  const initialIndex = activeContractId != null
    ? Math.max(0, CONTRACTS.findIndex((c) => c.id === activeContractId))
    : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [viewMode, setViewMode] = useState<'details' | 'all'>('details');

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const tabButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const hasInitializedVisibleStart = useRef(false);

  const active = CONTRACTS[activeIndex];
  const cfg = statusConfig[active.status];

  // ─── GSAP page entrance ───────────────────────────────────────────────────
  useEffect(() => {
    if (!pageRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(pageRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
    );
    tl.fromTo(headerRef.current,
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25'
    );
    tl.fromTo(tabsRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.2'
    );
    tl.fromTo(detailsRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.15'
    );
  }, []);

  // ─── Keep active tab centered in the tabs row ────────────────────────────
  useEffect(() => {
    const btn = tabButtonsRef.current[activeIndex];
    if (!btn) return;
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  // ─── Scroll detail panel to top when project changes (no layout jump) ─────
  useEffect(() => {
    if (detailsScrollRef.current) detailsScrollRef.current.scrollTop = 0;
  }, [activeIndex]);

  const handleSelectTab = useCallback((index: number) => setActiveIndex(index), []);
  const setTabButtonRef = useCallback((index: number, el: HTMLButtonElement | null) => {
    tabButtonsRef.current[index] = el;
  }, []);

  const detailsScrollRef = useRef<HTMLDivElement>(null);

  // ─── Fixed card width; show only as many as fit; if any hidden, show "View all projects" as rightmost ─────
  const CARD_WIDTH = 210;
  const CARD_GAP = 8;
  const TABS_HORIZONTAL_PADDING = 112; // px-10 (80) + pl-4 pr-4 (32)
  const [numThatFit, setNumThatFit] = useState<number>(CONTRACTS.length);
  const [visibleStart, setVisibleStart] = useState(0);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const update = () => {
      const containerWidth = el.offsetWidth;
      const availableWidth = Math.max(0, containerWidth - TABS_HORIZONTAL_PADDING);
      const n = Math.floor(availableWidth / (CARD_WIDTH + CARD_GAP));
      setNumThatFit(Math.max(0, n));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [CONTRACTS.length]);

  // On first layout, choose an initial window so the active tab sits at the visual center (only when we have a separate View All card).
  useEffect(() => {
    if (hasInitializedVisibleStart.current) return;
    if (numThatFit <= 0) return;
    const showViewAll = numThatFit > 0 && CONTRACTS.length > numThatFit;
    if (!showViewAll) {
      // All projects fit in the row: show from the first project, no windowing.
      setVisibleStart(0);
      hasInitializedVisibleStart.current = true;
      return;
    }
    const baseVisibleCount = Math.max(0, numThatFit - 1);
    if (baseVisibleCount <= 0) return;
    // Force an odd count so we have a true center slot
    const visibleCountForInit = baseVisibleCount % 2 === 0 ? Math.max(1, baseVisibleCount - 1) : baseVisibleCount;
    const halfWindow = Math.floor(visibleCountForInit / 2);
    const maxStart = Math.max(0, CONTRACTS.length - visibleCountForInit);
    const desiredStart = activeIndex - halfWindow;
    const start = Math.min(maxStart, Math.max(0, desiredStart));
    setVisibleStart(start);
    hasInitializedVisibleStart.current = true;
  }, [numThatFit, activeIndex]);

  // Visible slice: when we show the View All card, reserve one slot and keep an odd number of project tabs.
  const showViewAllCard = numThatFit > 0 && CONTRACTS.length > numThatFit;
  const baseVisibleCount = showViewAllCard ? Math.max(0, numThatFit - 1) : Math.min(CONTRACTS.length, numThatFit);
  const visibleCount = showViewAllCard
    ? (baseVisibleCount % 2 === 0 ? Math.max(1, baseVisibleCount - 1) : baseVisibleCount)
    : baseVisibleCount;
  const visibleContracts = CONTRACTS.slice(visibleStart, visibleStart + visibleCount);

  return (
    <motion.div
      ref={pageRef}
      className="h-full bg-[#1e3824] flex flex-col overflow-hidden pt-80"
    >
      <img src={contractsBg3d} alt="Contracts Overlay Background" className="w-96 h-96 object-cover absolute top-30 left-1/2 -translate-x-1/2" />
      <div className="absolute top-50 left-20 sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
        <div className="shrink-0">
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
            {viewMode === 'all' ? 'All projects' : active.title}
          </h2>
          <p className="text-white text-sm md:text-base mt-1">
            {viewMode === 'all' ? `${CONTRACTS.length} contracts` : `Client: ${active.client}`}
          </p>
        </div>
      </div>

      <div className="absolute top-52 right-20 flex flex-row items-end gap-4 mb-4">
        <button
          className="cursor-pointer px-5 py-3 bg-green-600 text-white rounded-full font-medium shadow hover:bg-green-700 transition"
          onClick={() => { /* TODO: hook up submit work logic */ }}
        >
          Submit Work
        </button>
        <button
          className="flex -ml-2 items-center cursor-pointer justify-center w-12 h-12 rounded-full bg-[#d4edda] shadow hover:bg-[#d4edda]/50 transition border border-white/10"
          title="View Milestone Calendar"
          onClick={() => { /* TODO: hook up calendar logic */ }}
        >
          <Calendar size={24} className="text-black" />
        </button>
      </div>

      {/* ─── Tabs row: project cards, or (when view all) only centered "Go back to project details" ─────────────────── */}
      <div ref={tabsRef} className="relative z-0 shrink-0 px-10 pt-2 min-h-[11rem]">
        <div className="flex gap-2 overflow-visible pb-0 border-none justify-center pl-4 pr-4 items-end">
          <AnimatePresence mode="wait">
            {viewMode === 'all' ? (
              <motion.button
                key="go-back-tab"
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative shrink-0 px-6 py-4 border-none cursor-pointer text-white overflow-visible rounded-t-[40px] bg-[#0f1117]/40 backdrop-blur-sm hover:bg-[#0d1a10]/70 transition-colors flex flex-col items-center justify-center gap-2 min-h-[0rem]"
                style={{ minWidth: CARD_WIDTH, width: CARD_WIDTH, marginTop: 42, marginBottom: 0, zIndex: 10 }}
                onClick={() => setViewMode('details')}
              >

                <LayoutGrid size={24} className="text-gray-200" />
                <span className="text-sm font-bold text-gray-300 text-center">Go back to project details</span>
              </motion.button>
            ) : (
              <motion.div
                key="tabs-details"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex gap-2 overflow-visible pb-0 border-none justify-center items-end w-full"
              >
                {visibleContracts.map((c, i) => {
                  const globalIndex = visibleStart + i;
                  return (
                    <ContractTabCard
                      key={`tab-${c.id}-${globalIndex}`}
                      contract={c}
                      index={globalIndex}
                      isActive={globalIndex === activeIndex}
                      isFirst={visibleStart === 0 && i === 0}
                      isLast={!showViewAllCard && globalIndex === CONTRACTS.length - 1}
                      onSelect={handleSelectTab}
                      setButtonRef={setTabButtonRef}
                    />
                  );
                })}
                {showViewAllCard && (
                  <button
                    type="button"
                    className="relative shrink-0 text-left px-5 py-4 border-none cursor-pointer overflow-hidden rounded-tl-[40px] rounded-tr-[40px] bg-[#d4edda]/30 backdrop-blur-sm hover:bg-[#d4edda]/50 transition-colors flex flex-col items-center justify-center gap-2"
                    style={{ minWidth: CARD_WIDTH, width: CARD_WIDTH, marginTop: 10, marginBottom: -10, zIndex: 5 }}
                    onClick={() => setViewMode('all')}
                  >
                    <LayoutGrid size={24} className="text-gray-600" />
                    <span className="text-sm font-bold text-gray-800 text-center">View all projects</span>
                    <span className="text-xs text-gray-500">+{CONTRACTS.length - visibleCount} more</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Active Contract Detail Panel: fixed position, in front of tabs (no movement on project change) ───────────────────────────────── */}
      <motion.div
        ref={detailsRef}
        className="relative z-10 flex-1 mx-1 -mt-[22px] pt-6 overflow-hidden rounded-t-[40px] min-h-0 flex flex-col flex-shrink-0"
        style={{
          background: '#0d1a10',
        }}
      >
        {/* Scrollable details container — scroll to top when project changes */}
        <div ref={detailsScrollRef} className="h-full overflow-y-auto scrBar flex-1 min-h-0 ">
          <AnimatePresence mode="wait">
            {viewMode === 'all' ? (
              /* ─── All projects list (click project → details + that tab active) ─── */
              <motion.div
                key="all-projects"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="px-4 pb-6"
              >
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } }, hidden: {} }}
                >
                  {CONTRACTS.map((c, i) => {
                    const sc = statusConfig[c.status] ?? statusConfig.Active;
                    return (
                      <motion.button
                        key={c.id}
                        type="button"
                        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="text-left rounded-3xl border border-white/10 p-5 bg-white/4 hover:bg-white/8 hover:border-white/20 transition-colors"
                        onClick={() => {
                          // Make this project active
                          setActiveIndex(i);

                          // If not all projects fit in the tabs row, slide the visible window
                          // so this project appears within (ideally at the center of) the row.
                          if (showViewAllCard && visibleCount > 0) {
                            const halfWindow = Math.floor(visibleCount / 2);
                            const maxStart = Math.max(0, CONTRACTS.length - visibleCount);
                            const desiredStart = i - halfWindow;
                            const nextStart = Math.min(maxStart, Math.max(0, desiredStart));
                            setVisibleStart(nextStart);
                          }

                          setViewMode('details');
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold truncate pr-2">{c.title}</span>
                          <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${sc.color}22`, color: sc.color }}>{c.status}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Client: {c.client}</p>
                        <p className="text-gray-500 text-xs">{c.budget} · {c.date}</p>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="project-details"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <>
                  {/* ─── HERO ROW ── large title + key stats ─── */}
                  <div className="px-4 pb-6">
                    {/* Stats strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {[
                        { icon: DollarSign, label: 'Revenue', value: active.budget, color: '#00e676' },
                        { icon: Calendar, label: 'Timeline', value: active.date, color: '#60a5fa' },
                        { icon: FileText, label: 'Milestones', value: active.milestone, color: '#a78bfa' },
                        { icon: Calendar, label: 'Current Milestone Deadline', value: (active as { milestoneDeadline?: string }).milestoneDeadline ?? '—', color: '#ffd166' },
                      ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="bg-white/4 rounded-3xl p-5 border border-white/6 flex flex-col gap-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                            <Icon size={17} style={{ color }} />
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm font-medium mb-0.5">{label}</p>
                            <p className="text-white font-bold text-2xl truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar — full width */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-gray-400 text-sm font-medium">Overall Progress</p>
                        <p className="font-bold text-sm" style={{ color: cfg.color }}>{active.completion}%</p>
                      </div>
                      <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${active.completion}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}55` }}
                        />
                      </div>
                    </div>

                    {/* ─── CreateContractForm-aligned sections ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
                      <div className="lg:col-span-3 space-y-2">
                        {/* 1. Project Details (Step 1) */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3 space-y-4">
                          <h3 className="text-white font-semibold text-base flex items-center gap-2">
                            <FileText size={18} className="text-[#60a5fa]" /> Project Details
                          </h3>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div><dt className="text-gray-500 mb-0.5">Project Title</dt><dd className="text-white font-medium">{(active as { title: string }).title}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Project Type</dt><dd className="text-white font-medium">{(active as { projectType?: string }).projectType ?? '—'}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-gray-500 mb-0.5">Project Description</dt><dd className="text-gray-300 leading-relaxed">{(active as { projectDesc?: string }).projectDesc ?? active.details}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Start Date</dt><dd className="text-white font-medium">{(active as { startDate?: string }).startDate ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Deadline</dt><dd className="text-white font-medium">{(active as { deadline?: string }).deadline ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Duration</dt><dd className="text-white font-medium">{(active as { duration?: string }).duration ?? '—'}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-gray-500 mb-0.5">Terms & Conditions</dt><dd className="text-gray-300 leading-relaxed">{(active as { customTerms?: string }).customTerms ?? '—'}</dd></div>
                          </dl>
                        </div>



                        {/* 2. Client & Company (Step 2) */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3 space-y-4">
                          <h3 className="text-white font-semibold text-base flex items-center gap-2">
                            <User size={18} className="text-[#f9a8d4]" /> Client & Company
                          </h3>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div><dt className="text-gray-500 mb-0.5">Client Name</dt><dd className="text-white font-medium">{(active as { clientName?: string }).clientName ?? active.client}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Client Email</dt><dd className="text-white font-medium">{(active as { clientEmail?: string }).clientEmail ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Client Phone</dt><dd className="text-white font-medium">{(active as { clientPhone?: string }).clientPhone ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Client Country</dt><dd className="text-white font-medium">{(active as { clientCountry?: string }).clientCountry ?? '—'}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-gray-500 mb-0.5">Company Name</dt><dd className="text-white font-medium">{(active as { clientCompany?: string }).clientCompany ?? active.client}</dd></div>
                          </dl>
                        </div>
                        {/* 4. Payment Terms (Step 4) */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3 space-y-4">
                          <h3 className="text-white font-semibold text-base flex items-center gap-2">
                            <CreditCard size={18} className="text-[#00e676]" /> Payment Terms
                          </h3>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div><dt className="text-gray-500 mb-0.5">Contract Amount</dt><dd className="text-white font-bold">{(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} {(active as { contractAmount?: string }).contractAmount ?? active.budget}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Payment Method</dt><dd className="text-white font-medium">{(active as { paymentMethod?: string }).paymentMethod ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Advance Payment</dt><dd className="text-white font-medium">{(active as { isAdvancePayment?: boolean }).isAdvancePayment ? `Yes — ${(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} ${(active as { advanceAmount?: string }).advanceAmount ?? '—'}` : 'No'}</dd></div>
                          </dl>
                          {((active as { milestonesDetail?: MilestoneDetail[] }).milestonesDetail?.length ?? 0) > 0 && (
                            <div className="pt-4 border-t border-white/8">
                              <h4 className="text-white font-medium text-sm mb-3">Milestone Payment Schedule</h4>
                              <div className="space-y-2">
                                {(active as { milestonesDetail: MilestoneDetail[] }).milestonesDetail.map((ms, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-white/6 last:border-0">
                                    <span className="text-gray-400">{idx + 1}. {ms.title || 'Untitled'}</span>
                                    <span className="text-white font-bold">{(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} {ms.amount?.toLocaleString() ?? '0'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Activity */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3">
                          <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                            <Clock size={15} className="text-gray-400" /> Activity
                          </h4>
                          <div className="space-y-4 relative before:content-[''] before:absolute before:left-[7px] before:top-0 before:bottom-0 before:w-px before:bg-white/8">
                            {['Contract signed', 'Kicked off phase 1', 'Milestone review', 'Ongoing work'].map((a, i) => (
                              <div key={i} className="flex items-start gap-4 pl-5 relative">
                                <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-[#161b27] border-2 shrink-0" style={{ borderColor: i === 0 ? cfg.color : 'rgba(255,255,255,0.12)' }} />
                                <div>
                                  <p className="text-white text-xs font-medium">{a}</p>
                                  <p className="text-gray-600 text-[10px] mt-0.5">{i === 0 ? 'Jan 2025' : i === 1 ? 'Feb 2025' : i === 2 ? 'Mar 2025' : 'Now'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>




                      </div>

                      {/* Sidebar */}
                      <div className="lg:col-span-2 space-y-4">


                        {/* 3. Scope & Deliverables (Step 3) */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3 space-y-2">
                          <h3 className="text-white font-semibold text-base flex items-center gap-2">
                            <FileCheck size={18} className="text-[#a78bfa]" /> Scope & Deliverables
                          </h3>
                          <dl className="space-y-3 text-sm">
                            <div><dt className="text-gray-500 mb-0.5">Revision Policy</dt><dd className="text-white font-medium">{(active as { revisionPolicy?: string }).revisionPolicy ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Out of Scope</dt><dd className="text-gray-300 leading-relaxed">{(active as { outOfScope?: string }).outOfScope ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Core Deliverable</dt><dd className="text-white font-medium">{(active as { coreDeliverable?: string }).coreDeliverable ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Intellectual Property</dt><dd className="text-white font-medium">{(active as { intellectualProperty?: string }).intellectualProperty ?? '—'}</dd></div>
                          </dl>
                          {/* Milestones (form-style with title, description, amount, due_date, etc.) */}
                          {((active as { milestonesDetail?: MilestoneDetail[] }).milestonesDetail?.length ?? 0) > 0 && (
                            <div className="pt-4 border-t border-white/8">
                              <h4 className="text-white font-medium text-sm mb-3">Milestones</h4>
                              <div className="space-y-3">
                                {(active as { milestonesDetail: MilestoneDetail[] }).milestonesDetail.map((ms, i) => (
                                  <div key={i} className="p-4 rounded-xl border border-white/6 bg-white/3 space-y-2">
                                    <div className="flex justify-between items-start">
                                      <span className="text-white font-semibold text-sm">#{i + 1} {ms.title}</span>
                                      <span className="text-[#00e676] font-bold text-sm">{(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} {ms.amount?.toLocaleString() ?? '0'}</span>
                                    </div>
                                    {ms.description && <p className="text-gray-400 text-xs">{ms.description}</p>}
                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                                      <span>Due: {ms.due_date}</span>
                                      {ms.is_initial_payment && <span className="text-[#00e676]">Initial Payment</span>}
                                    </div>
                                    {ms.submission_criteria && <p className="text-gray-500 text-xs">Submission: {ms.submission_criteria}</p>}
                                    {ms.completion_criteria_tc && <p className="text-gray-500 text-xs">Completion: {ms.completion_criteria_tc}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Checklist milestones (label / done) */}
                          <div className="pt-4 border-t border-white/8">
                            <h4 className="text-white font-medium text-sm mb-3">Progress Checklist</h4>
                            <div className="space-y-2">
                              {active.milestones.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.done ? 'bg-[#00e676]/15' : 'bg-white/6 border border-white/10'}`}>
                                    {m.done ? <CheckCircle size={12} className="text-[#00e676]" /> : <span className="text-gray-600 text-[10px] font-bold">{i + 1}</span>}
                                  </div>
                                  <span className={`text-sm ${m.done ? 'text-white' : 'text-gray-500'}`}>{m.label}</span>
                                  {m.done && <span className="ml-auto text-[10px] text-[#00e676] font-semibold">Done</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            className="w-full py-4 rounded-2xl font-bold text-md transition-all duration-200 cursor-pointer"
                            style={{
                              background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}12)`,
                              border: `1px solid ${cfg.color}40`,
                              color: cfg.color,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = `${cfg.color}22`)}
                            onMouseLeave={e => (e.currentTarget.style.background = `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}12)`)}
                          >
                            Submit Work
                          </button>
                          <button
                            className="w-full py-4 rounded-2xl font-bold text-md transition-all duration-200 cursor-pointer"
                            style={{
                              background: `#2d8a3e`,
                              border: `1px solid #3cb44f40`,
                              color: "#fff",
                            }}
                          >
                            Get Section 65b Certificate
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                </>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
