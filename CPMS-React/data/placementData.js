// Placement data for the Campus Placement Management System (CPMS)

export const placementSummary = {
  totalStudents: 150,
  placedStudents: 120,
  placementRate: 80,
  averagePackage: "8.5 LPA",
  highestPackage: "25 LPA",
  lowestPackage: "5 LPA",
};

export const students = [
  {
    id: "STU001",
    name: "Rahul Sharma",
    email: "rahul.sharma@university.edu",
    phone: "+91-9876543210",
    cgpa: 8.5,
    branch: "Computer Science",
    skills: ["Java", "React", "Node.js", "SQL"],
    status: "Placed",
  },
  {
    id: "STU002",
    name: "Jane Smith",
    email: "jane.smith@university.edu",
    phone: "+91-9876543211",
    cgpa: 8.8,
    branch: "Computer Science",
    skills: ["Python", "Machine Learning", "TensorFlow"],
    status: "Placed",
  },
  {
    id: "STU003",
    name: "Mike Johnson",
    email: "mike.johnson@university.edu",
    phone: "+91-9876543212",
    cgpa: 7.9,
    branch: "Information Technology",
    skills: ["C++", "Data Structures", "System Design"],
    status: "Placed",
  },
];

export const companies = [
  {
    id: 1,
    name: "TechCorp",
    position: "Software Engineer",
    salary: "8.0 LPA",
    ctc: "10.5 LPA",
    location: "Bangalore",
    openings: 5,
    applicants: 45,
  },
  {
    id: 2,
    name: "DataSystems",
    position: "Data Analyst",
    salary: "6.5 LPA",
    ctc: "8.0 LPA",
    location: "Pune",
    openings: 3,
    applicants: 28,
  },
  {
    id: 3,
    name: "CloudTech",
    position: "Full Stack Developer",
    salary: "9.0 LPA",
    ctc: "11.5 LPA",
    location: "Hyderabad",
    openings: 4,
    applicants: 52,
  },
  {
    id: 4,
    name: "InnovateSoft",
    position: "DevOps Engineer",
    salary: "7.5 LPA",
    ctc: "9.8 LPA",
    location: "Mumbai",
    openings: 2,
    applicants: 20,
  },
];

export const applications = [
  {
    id: 1,
    studentId: "STU001",
    company: "TechCorp",
    position: "Software Engineer",
    status: "Interview",
    appliedDate: "2026-09-10",
    round: "Technical Round 2",
  },
  {
    id: 2,
    studentId: "STU002",
    company: "DataSystems",
    position: "Data Analyst",
    status: "Shortlisted",
    appliedDate: "2026-09-12",
    round: "Pending Interview",
  },
  {
    id: 3,
    studentId: "STU003",
    company: "CloudTech",
    position: "Full Stack Developer",
    status: "Applied",
    appliedDate: "2026-09-15",
    round: "Under Review",
  },
  {
    id: 4,
    studentId: "STU001",
    company: "CloudTech",
    position: "Full Stack Developer",
    status: "Offered",
    appliedDate: "2026-09-08",
    round: "Offer Received",
  },
];

export const placementBranches = [
  { name: "Computer Science", placed: 45, total: 50 },
  { name: "Information Technology", placed: 38, total: 45 },
  { name: "Electronics & Communication", placed: 22, total: 30 },
  { name: "Mechanical Engineering", placed: 15, total: 25 },
];
