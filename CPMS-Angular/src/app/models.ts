export type Role = 'STUDENT' | 'RECRUITER' | 'ADMIN';
export interface User { id: number; email: string; name: string; role: Role; student_id: string | null; company_id: number | null; }
export interface Company { id: number; name: string; position: string; salary: string; ctc: string; location: string; openings: number; applicants?: number; workMode?: string; deadline?: string; tags?: string[]; description?: string; }
export interface Candidate { id: string; name: string; email: string; branch: string; cgpa: number | string; phone: string; skills: string; headline?: string; github?: string; linkedin?: string; }
export interface Application { id: number; student_id: string; company_id: number; status: string; applied_date: string; student_name?: string; student_email?: string; company_name?: string; position?: string; }
export interface Interview { id: number; applicationId: number; title: string; at: string; venue: string; duration: string; kind: string; canCancel: boolean; companyId: number; studentId: string; }
export interface Notice { id: number; title: string; detail: string; read: boolean; createdAt: string; }
export interface Workspace { interviews: Interview[]; notices: Notice[]; profiles: Candidate[]; driveDetails: Record<string, Partial<Company>>; }
