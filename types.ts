
export enum Status {
  New = 'New',
  InProgress = 'In Progress',
  InReview = 'In Review',
  Shortlisted = 'Shortlisted',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Read = 'Read',
  Archived = 'Archived',
}

export interface JobApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  position: string;
  resumeUrl: string;
  coverLetter: string;
  status: Status;
  createdAt: string;
}

export interface AdmissionApplication {
  id: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  grade: string;
  city: string;
  previousSchool: string;
  message: string;
  status: Status;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: Status;
  createdAt: string;
}
