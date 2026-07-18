/**
 * ============================================================================
 * שם הקובץ: CRUD_functions.js
 * תיאור: ניהול כלל פעולות צד השרת מול מסד הנתונים (Create, Read, Update, Delete).
 * הקובץ כולל ביצוע שאילתות SQL, ולידציות נתונים בצד השרת, ואבטחת מידע.
 * מגישים: איתי מזרחי, ניצן עופר ואיתי שרם
 * ============================================================================
 */

const sql = require("./db.js");

// הרשמת משתמש עם בדיקת תפריט הכישורים וולידציות צד שרת
const createNewUser = function(req, res) {
    const fullName = req.body.fullName || req.body.FullName;
    const personalNum = req.body.personalNum;
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role || req.body.userRole;
    
    // --- ולידציות צד שרת להרשמה ---
    
    // 1. בדיקת נוכחות חובה
    if (!fullName || !personalNum || !username || !password || !role) {
        return res.status(400).send({ message: "שגיאה: חובה למלא את כל פרטי ההרשמה." });
    }
    
    // 2. בדיקת אורך סיסמה מינימלי
    if (password.length < 6) {
        return res.status(400).send({ message: "שגיאה: הסיסמה חייבת להכיל לפחות 6 תווים." });
    }
    
    // 3. בדיקת אורך מספר אישי (הנחה שצריך להיות לפחות 5 ספרות, תשנה אם צריך)
    if (personalNum.length < 5) {
        return res.status(400).send({ message: "שגיאה: מספר אישי קצר מדי." });
    }
    
    // --- סוף בלוק ולידציות ---

    const newUser = {
        fullName: fullName,
        personalNum: personalNum,
        username: username,
        password: password,
        role: role,
        skills: (req.body.skills && req.body.skills.length > 0) ? req.body.skills.join(', ') : null
    };

    sql.query("INSERT INTO Users SET ?", newUser, (err, result) => {
        if (err) {
            console.error("Error creating user:", err);
            return res.status(400).send({ message: "שגיאה ביצירת המשתמש", error: err });
        }
        res.status(201).send({ message: "נרשמת בהצלחה" }); 
    });
};

// יצירת פרויקט עם תכונות ושמירה למסד הנתונים כולל ולידציות צד שרת
const createNewProject = function(req, res) {
    const { projectName, projectDesc, participantsCount, startDate, endDate } = req.body;
    
    // טיפול בטוח במערך התכונות (Express הופך בחירה יחידה ל-String, ובחירה מרובה למערך)
    let skillsArray = [];
    if (req.body.skills) {
        skillsArray = Array.isArray(req.body.skills) ? req.body.skills : [req.body.skills];
    }

    // --- ולידציות צד שרת ליצירת פרויקט ---
    
    // 1. נוכחות חובה
    if (!projectName || !projectDesc || !participantsCount || !startDate || !endDate) {
        return res.status(400).send("שגיאה: חובה למלא את כל שדות הטקסט והתאריכים.");
    }
    
    // 2. בדיקת כמות משתתפים הגיונית
    if (participantsCount <= 0) {
        return res.status(400).send("שגיאה: כמות המשתתפים חייבת להיות לפחות 1.");
    }
    
    // 3. בדיקת תאריכים
    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).send("שגיאה: תאריך הסיום חייב להיות מאוחר מתאריך ההתחלה.");
    }
    
    // 4. בדיקת 3 תכונות בדיוק
    if (skillsArray.length !== 3) {
        return res.status(400).send("שגיאה: יש לבחור בדיוק 3 תכונות נדרשות לפרויקט.");
    }
    
    // --- סוף בלוק ולידציות ---

    // בניית נתיב התמונה בהתאם לבחירת המשתמש
    let finalImagePath = '';
    
    if (req.body.imageOption === 'url') {
        finalImagePath = req.body.projectImageURL;
    } else if (req.body.imageOption === 'file' && req.file) {
        finalImagePath = `/Photos/${req.file.filename}`;
    }

    const newProject = {
        projectName: projectName,
        projectDesc: projectDesc,
        imagePath: finalImagePath,
        participantsCount: participantsCount,
        startDate: startDate,
        endDate: endDate,
        leaderId: req.body.currentLeaderId || 1, 
        skills: skillsArray.join(",") 
    };

    sql.query("INSERT INTO Projects SET ?", newProject, (err, result) => {
        if (err) {
            console.error("Error creating project:", err);
            return res.status(400).send(err);
        }
        res.redirect('/myprojects.html');
    });
};

// שליפת כל הפרויקטים, כולל סטטוס ההרשמה של המשתמש המחובר (אם קיים)
const getAllProjects = function(req, res) {
    const userId = req.query.userId;
    
    let query = "SELECT * FROM Projects";
    let params = [];

    // אם הגיע מזהה משתמש בבקשה, נשלוף גם את הסטטוס שלו מתוך טבלת ההרשמות
    if (userId) {
        query = `
            SELECT p.*, a.status AS userApplicationStatus 
            FROM Projects p 
            LEFT JOIN applications a ON p.id = a.projectId AND a.userId = ?
        `;
        params.push(userId);
    }

    sql.query(query, params, (err, results) => {
        if (err) {
            console.error("Error fetching projects: ", err);
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
};

// אימות משתמש (התחברות)
const loginUser = function(req, res) {
    const { username, password } = req.body;
    
    // שאילתה לבדיקה אם המשתמש קיים והסיסמה נכונה
    const query = "SELECT id, fullName, role FROM Users WHERE username = ? AND password = ?";
    
    sql.query(query, [username, password], (err, results) => {
        if (err) {
            console.error("Error during login: ", err);
            return res.status(500).send({ message: "שגיאת שרת", error: err });
        }
        
        // אם לא נמצא משתמש כזה
        if (results.length === 0) {
            return res.status(401).send({ message: "שם משתמש או סיסמה שגויים" });
        }
        
        // אם נמצא, מחזירים את פרטי המשתמש (ללא הסיסמה)
        res.status(200).send({ message: "התחברת בהצלחה", user: results[0] });
    });
};

// הרשמה של משתתף לפרויקט
const applyToProject = function(req, res) {
    const { userId, projectId } = req.body;
    
    const query = "INSERT INTO Applications (userId, projectId) VALUES (?, ?)";
    
    sql.query(query, [userId, projectId], (err, results) => {
        if (err) {
            // אם המשתמש כבר שלח בקשה לפרויקט הזה (המפתח הראשי המורכב יזרוק שגיאה)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).send({ message: "כבר שלחת בקשה לפרויקט זה." });
            }
            console.error("Error applying to project: ", err);
            return res.status(500).send({ message: "שגיאת שרת", error: err });
        }
        res.status(201).send({ message: "הבקשה נשלחה בהצלחה" });
    });
};

// שליפת הפרויקטים של מוביל ספציפי כולל הבקשות אליהם
const getLeaderProjects = function(req, res) {
    const leaderId = req.params.leaderId;

    // שאילתת JOIN מורכבת ששולפת את הפרויקט, הבקשה ופרטי המשתמש שהגיש אותה
    const query = `
        SELECT p.id as projectId, p.projectName, p.projectDesc, p.imagePath, p.participantsCount, p.startDate, p.endDate, p.skills as projectSkills,
               a.userId, u.fullName, u.personalNum, u.skills as userSkills, a.status
        FROM Projects p
        LEFT JOIN Applications a ON p.id = a.projectId
        LEFT JOIN Users u ON a.userId = u.id
        WHERE p.leaderId = ?
    `;

    sql.query(query, [leaderId], (err, results) => {
        if (err) {
            console.error("Error fetching leader projects: ", err);
            return res.status(500).send({ message: "שגיאה בשליפת הפרויקטים", error: err });
        }

        // סידור הנתונים למבנה נוח של פרויקטים, כאשר לכל פרויקט יש מערך של בקשות
        const projectsMap = {};
        results.forEach(row => {
            if (!projectsMap[row.projectId]) {
                projectsMap[row.projectId] = {
                    id: row.projectId,
                    projectName: row.projectName,
                    projectDesc: row.projectDesc,
                    imagePath: row.imagePath,
                    participantsCount: row.participantsCount,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    skills: row.projectSkills,
                    applications: []
                };
            }
            // אם יש בקשה לפרויקט, נוסיף אותה למערך הבקשות שלו
            if (row.userId) {
                projectsMap[row.projectId].applications.push({
                    userId: row.userId,
                    fullName: row.fullName,
                    personalNum: row.personalNum,
                    skills: row.userSkills,
                    status: row.status
                });
            }
        });

        res.status(200).json(Object.values(projectsMap));
    });
};

// עדכון סטטוס בקשה (אישור/דחייה על ידי המוביל)
const updateApplicationStatus = function(req, res) {
    const { userId, projectId, status } = req.body; // status יהיה 'approved' או 'rejected'

    const query = "UPDATE Applications SET status = ? WHERE userId = ? AND projectId = ?";

    sql.query(query, [status, userId, projectId], (err, results) => {
        if (err) {
            console.error("Error updating status: ", err);
            return res.status(500).send({ message: "שגיאה בעדכון הסטטוס", error: err });
        }
        res.status(200).send({ message: "הסטטוס עודכן בהצלחה" });
    });
};

// מחיקת פרויקט קיים (DELETE) - כולל מחיקת הבקשות המקושרות אליו
const deleteProject = function(req, res) {
    const projectId = req.params.id; // קבלת ה-ID מתוך כתובת ה-URL

    // שלב 1: מחיקת כל בקשות ההצטרפות (applications) המקושרות לפרויקט
    sql.query("DELETE FROM applications WHERE projectId = ?", [projectId], (err, appResults) => {
        if (err) {
            console.error("שגיאה במחיקת בקשות ההצטרפות: ", err);
            return res.status(500).send({ error: "שגיאה במחיקת בקשות ההצטרפות" });
        }

        // שלב 2: לאחר שהבקשות נמחקו, מוחקים את הפרויקט עצמו מטבלת Projects
        sql.query("DELETE FROM Projects WHERE id = ?", [projectId], (err, projResults) => {
            if (err) {
                console.error("שגיאה במחיקת הפרויקט: ", err);
                return res.status(500).send({ error: "שגיאה במחיקת הפרויקט" });
            }
            
            // בדיקה אם הפרויקט אכן היה קיים ונמחק
            if (projResults.affectedRows === 0) {
                return res.status(404).send({ message: "הפרויקט לא נמצא" });
            }
            
            res.status(200).send({ message: "הפרויקט ובקשות ההצטרפות נמחקו בהצלחה!" });
        });
    });
};

// עדכון פרויקט קיים (PUT) - עריכה מלאה
const updateProject = function(req, res) {
    const projectId = req.params.id;
    const { projectName, projectDesc, participantsCount, startDate, endDate, skills } = req.body; 

    // ולידציה בצד שרת 
    if (!projectName || !projectDesc || !participantsCount || !startDate || !endDate) {
        return res.status(400).send({ error: "נא לספק את כל שדות החובה." });
    }

    const query = `
        UPDATE Projects 
        SET projectName = ?, projectDesc = ?, participantsCount = ?, startDate = ?, endDate = ?, skills = ? 
        WHERE id = ?
    `;
    
    sql.query(query, [projectName, projectDesc, participantsCount, startDate, endDate, skills, projectId], (err, results) => {
        if (err) {
            console.error("שגיאה בעדכון הפרויקט: ", err);
            return res.status(500).send({ error: "שגיאה בשרת בעת עדכון הפרויקט" });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).send({ message: "הפרויקט לא נמצא" });
        }
        
        res.status(200).send({ message: "הפרויקט עודכן בהצלחה!" });
    });
};

// ייצוא פונקיות
module.exports = { createNewUser, createNewProject, getAllProjects, loginUser, applyToProject, getLeaderProjects, updateApplicationStatus, deleteProject, updateProject };