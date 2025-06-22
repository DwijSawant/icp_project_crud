import { useState } from 'react';
import { icp_project_crud_backend } from 'declarations/icp_project_crud_backend';
import jsPDF from 'jspdf'; 

function App() {
  const [name, setName] = useState("");
  const [marks, setMarks] = useState("");
  const [subjects, setSubjects] = useState("");
  const [studentId, setStudentId] = useState("");
  const [stats, setStats] = useState(null);
  const [count, setCount] = useState(0);


  //create student frnt end func
  const createStudent = async () => {
    const id = await icp_project_crud_backend.create_student(name, BigInt(marks), BigInt(subjects));
    setStudentId(id.toString());
    alert(`Student created with ID: ${id}`);
  };
//calcuating func for grades and averages
  const calculateStats = async () => {
    const result = await icp_project_crud_backend.calculate_student_stats(BigInt(studentId));

    if (result) {
      const [avg, grade] = result;
      const averageNum = Number(avg);

      if (!isNaN(averageNum)) {
        alert(`Average: ${averageNum.toFixed(2)}, Grade: ${grade}`);
      } else {
        alert(`Received invalid average: ${avg}`);
      }
    } else {
      alert("No student found with the given ID.");
      setStats(null);
    }
  };

  

  const getStudentCount = async () => {
    const result = await icp_project_crud_backend.get_student_count();
    setCount(result.toString());
  };

 const generatePDFfromStats = async () => {
  const idStr = (studentId || "").trim();

  if (!idStr || isNaN(idStr)) {
    alert("Please enter a valid Student ID.");
    return;
  }

  const id = BigInt(idStr);

  try {
    const studentArray = await icp_project_crud_backend.get_student_stats(id);
    const student = Array.isArray(studentArray) ? studentArray[0] : studentArray;

    if (!student || typeof student.id === 'undefined' || student.name === undefined) {
      alert("Student not found.");
      console.log("Fetched student:", student);

      return;
    }


//generating pdf here
    const doc = new jsPDF();

    const average = student.average !== undefined && student.average !== null
      ? Number(student.average).toFixed(2)
      : "Not Calculated";

    const grade = student.grade || "Not Calculated";

    doc.setFontSize(18);
    doc.text("Student Report Card", 20, 20);

    doc.setFontSize(12);
    doc.text(`ID: ${student.id.toString()}`, 20, 40);
    doc.text(`Name: ${student.name}`, 20, 50);
    doc.text(`Total Marks: ${student.total_marks.toString()}`, 20, 60);
    doc.text(`Total Subjects: ${student.total_subjects.toString()}`, 20, 70);
    doc.text(`Average: ${average}`, 20, 80);
    doc.text(`Grade: ${grade}`, 20, 90);

    doc.save(`ReportCard_Student_${student.id}.pdf`);
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    alert("An error occurred. Check the console.");
  }
};


  return (
    <div className="container">
      <h1>ICP Student Portal</h1>

      <div className="form">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Total Marks" type="number" value={marks} onChange={e => setMarks(e.target.value)} />
        <input placeholder="Total Subjects" type="number" value={subjects} onChange={e => setSubjects(e.target.value)} />
        <button onClick={createStudent}>Create Student</button>
      </div>

      <div className="form">
        <input placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} />
        <button onClick={calculateStats}>Calculate Stats</button>
        <button onClick={generatePDFfromStats}>Generate Report Card PDF</button>
        <button onClick={getStudentCount}>Get Student Count</button>
      </div>

      {stats && (
        <div className="card">
          <h3>Student Stats:</h3>
          <p><strong>ID:</strong> {stats.id !== undefined ? stats.id.toString() : "N/A"}</p>
          <p><strong>Name:</strong> {stats.name}</p>
          <p><strong>Marks:</strong> {stats.total_marks.toString()}</p>
          <p><strong>Subjects:</strong> {stats.total_subjects.toString()}</p>
          <p><strong>Average:</strong> 
            {typeof stats.average === 'number' 
              ? stats.average.toFixed(2) 
              : "Not Calculated"}
          </p>
          <p><strong>Grade:</strong> {stats.grade || "Not Calculated"}</p>
        </div>
      )}

      <div className="card">
        <h3>Total Students:</h3>
        <p>{count}</p>
      </div>
    </div>
  );
}

export default App;
