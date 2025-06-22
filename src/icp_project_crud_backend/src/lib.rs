use ic_cdk_macros::{query, update};
use std::cell::RefCell;
use std::collections::BTreeMap;
use candid::CandidType;
use serde::{Deserialize, Serialize};
// use std::string;


#[derive(Clone, Debug,CandidType, Serialize, Deserialize)]

//using ids to uniqe identify individual students
struct Student {
    id: u64,
    name: String,
    total_marks: u64,
    total_subjects: u64,
    grade: Option<String>,
    average: Option<f64>,  
}

//Creating a local thread storage to hold student records
thread_local! {
    static STORAGE: RefCell<BTreeMap<u64, Student>> = RefCell::default();
    static NEXT_ID: RefCell<u64> = RefCell::new(0);
}

//write/append funciton for students struct
//will keep grade and average as optional fields
//as they will be calculated later
#[update]
fn create_student(name: String, total_marks: u64, total_subjects: u64) -> u64 {
    let id = NEXT_ID.with(|next_id| {
        let mut next_id = next_id.borrow_mut();
        *next_id += 1;
        *next_id - 1
    });
    
    let student = Student { 
        id, 
        name, 
        total_marks, 
        total_subjects, 
        grade: None,
        average: None
    };
    
    STORAGE.with(|storage| {
        storage.borrow_mut().insert(id, student);
    });
    
    id
}


//read and calculate avg and grade to students and append to struct
//we are using f64 for accuracy in average calculation
#[update]
fn calculate_student_stats(id: u64) -> Option<(f64, String)> {
    STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if let Some(student) = storage.get_mut(&id) {
            // Calculate average if subjects exist
            let average = if student.total_subjects > 0 {
                student.total_marks as f64 / student.total_subjects as f64
            } else {
                0.0
            };
            
            // Calculate grade based on average
            // Assuming the grading scale is:
            let grade = if average >= 90.0 {
                "A".to_string()
            } else if average >= 75.0 {
                "B".to_string()
            } else if average >= 60.0 {
                "C".to_string()
            } else {
                "D".to_string()
            };
            
            // Update student record
            student.average = Some(average);
            student.grade = Some(grade.clone());
            
            Some((average, grade))
        } else {
            None
        }
    })
}



#[query]
fn get_student_stats(id: u64) -> Option<Student> {
    STORAGE.with(|storage| {
        storage.borrow().get(&id).cloned()
    })
}



#[query]
fn get_average_marks(id: u64) -> Option<f64> {
    STORAGE.with(|storage| {
        storage.borrow()
            .get(&id)
            .and_then(|s| s.average)
    })
}

#[query]
fn get_grade(id: u64) -> Option<String> {
    STORAGE.with(|storage| {
        storage.borrow()
            .get(&id)
            .and_then(|s| s.grade.clone())
    })
}
#[query]
fn get_student_count() -> u64 {
    NEXT_ID.with(|next_id| *next_id.borrow())
}
//just in case if icp needs 

// #[query(Clone)]
// fn read_student(id: u64) -> Option<Student> {  // Changed return type from Item to Student
//     STORAGE.with(|storage| {
//         storage.borrow().get(&id).cloned()
//     })
// }