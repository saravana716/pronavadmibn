
import { Status, JobApplication, AdmissionApplication, ContactMessage } from './types';

export const STATUS_OPTIONS = Object.values(Status);

export const STATUS_COLORS: { [key in Status]: string } = {
  [Status.New]: 'bg-blue-100 text-blue-800',
  [Status.InProgress]: 'bg-yellow-100 text-yellow-800',
  [Status.InReview]: 'bg-yellow-100 text-yellow-800',
  [Status.Shortlisted]: 'bg-indigo-100 text-indigo-800',
  [Status.Accepted]: 'bg-green-100 text-green-800',
  [Status.Rejected]: 'bg-red-100 text-red-800',
  [Status.Read]: 'bg-gray-100 text-gray-800',
  [Status.Archived]: 'bg-gray-200 text-gray-500',
};

export const MOCK_JOB_APPLICATIONS: JobApplication[] = [
  { id: 'JOB001', name: 'Alice Johnson', email: 'alice@example.com', phone: '111-222-3333', city: 'New York', position: 'Frontend Developer', resumeUrl: '#', coverLetter: '...', status: Status.New, createdAt: '2023-10-26' },
  { id: 'JOB002', name: 'Bob Smith', email: 'bob@example.com', phone: '222-333-4444', city: 'San Francisco', position: 'Backend Developer', resumeUrl: '#', coverLetter: '...', status: Status.InReview, createdAt: '2023-10-25' },
  { id: 'JOB003', name: 'Charlie Brown', email: 'charlie@example.com', phone: '333-444-5555', city: 'Chicago', position: 'UI/UX Designer', resumeUrl: '#', coverLetter: '...', status: Status.Shortlisted, createdAt: '2023-10-24' },
  { id: 'JOB004', name: 'Diana Prince', email: 'diana@example.com', phone: '444-555-6666', city: 'Los Angeles', position: 'Project Manager', resumeUrl: '#', coverLetter: '...', status: Status.Rejected, createdAt: '2023-10-23' },
  { id: 'JOB005', name: 'Ethan Hunt', email: 'ethan@example.com', phone: '555-666-7777', city: 'Miami', position: 'Frontend Developer', resumeUrl: '#', coverLetter: '...', status: Status.Accepted, createdAt: '2023-10-22' },
];

export const MOCK_ADMISSION_APPLICATIONS: AdmissionApplication[] = [
  { id: 'ADM001', studentName: 'Frank Castle', parentName: 'Maria Castle', email: 'maria@example.com', phone: '666-777-8888', grade: '5th', city: 'Boston', previousSchool: 'Midtown Elementary', message: '...', status: Status.New, createdAt: '2023-10-26' },
  { id: 'ADM002', studentName: 'Gwen Stacy', parentName: 'George Stacy', email: 'george@example.com', phone: '777-888-9999', grade: '9th', city: 'New York', previousSchool: 'Brooklyn High', message: '...', status: Status.InReview, createdAt: '2023-10-25' },
  { id: 'ADM003', studentName: 'Harry Osborn', parentName: 'Norman Osborn', email: 'norman@example.com', phone: '888-999-0000', grade: '10th', city: 'New York', previousSchool: 'Midtown High', message: '...', status: Status.Accepted, createdAt: '2023-10-24' },
  { id: 'ADM004', studentName: 'Iris West', parentName: 'Joe West', email: 'joe@example.com', phone: '999-000-1111', grade: '3rd', city: 'Central City', previousSchool: 'Keystone Elementary', message: '...', status: Status.Rejected, createdAt: '2023-10-23' },
];

export const MOCK_CONTACT_MESSAGES: ContactMessage[] = [
  { id: 'CON001', firstName: 'John', lastName: 'Doe', email: 'john.d@example.com', subject: 'General Inquiry', message: '...', status: Status.New, createdAt: '2023-10-26' },
  { id: 'CON002', firstName: 'Jane', lastName: 'Smith', email: 'jane.s@example.com', subject: 'Partnership Proposal', message: '...', status: Status.Read, createdAt: '2023-10-25' },
  { id: 'CON003', firstName: 'Peter', lastName: 'Jones', email: 'peter.j@example.com', subject: 'Feedback', message: '...', status: Status.Archived, createdAt: '2023-10-24' },
  { id: 'CON004', firstName: 'Mary', lastName: 'Jane', email: 'mary.j@example.com', subject: 'Technical Support', message: '...', status: Status.InProgress, createdAt: '2023-10-23' },
];
