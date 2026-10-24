import { students as defaultStudents } from "../data/placementData";

function StudentProfile({ student: propStudent, isLoading = false }) {
  const student = propStudent || defaultStudents[0];

  if (isLoading) {
    return (
      <section className="dashboard-card student-section">
        <div className="card-header">
          <div>
            <h2>Student Profile</h2>
            <p className="section-description">Loading academic information...</p>
          </div>
        </div>
      </section>
    );
  }

  const skillsList = Array.isArray(student.skills)
    ? student.skills
    : typeof student.skills === "string"
    ? student.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <section className="dashboard-card student-section">
      <div className="card-header">
        <div>
          <h2>Student Profile</h2>
          <p className="section-description">
            Your academic information
          </p>
        </div>

        <span className="profile-status">{student.status}</span>
      </div>

      <div className="profile-content">
        <div className="profile-avatar" aria-hidden="true">
          {student.name
            .split(" ")
            .map((part) => part.charAt(0))
            .slice(0, 2)
            .join("")}
        </div>

        <div className="profile-details">
          <h3>{student.name}</h3>
          <p className="student-id">{student.id}</p>

          <div className="profile-info">
            <p>
              <strong>Branch</strong>
              <span>{student.branch}</span>
            </p>

            <p>
              <strong>CGPA</strong>
              <span>{student.cgpa} / 10</span>
            </p>

            <p>
              <strong>Email</strong>
              <span className="email-value">{student.email}</span>
            </p>

            <p>
              <strong>Phone</strong>
              <span>{student.phone}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="skills-section">
        <h3>Technical Skills</h3>

        <div className="skills-list">
          {skillsList.map((skill) => (
            <span className="skill-tag" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StudentProfile;
