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

// שליפת כל הפרויקטים, תוך כדי סינון לפי חוק ה-2 כישורים (עבור משתתפים)
const getAllProjects = function(req, res) {
    const userId = req.query.userId;
    
    let query = "SELECT * FROM Projects";
    let params = [];

    if (userId) {
        query = `
            SELECT p.*, a.status AS userApplicationStatus 
            FROM Projects p 
            LEFT JOIN Applications a ON p.id = a.projectId AND a.userId = ?
        `;
        params.push(userId);

        sql.query(query, params, (err, projects) => {
            if (err) {
                console.error("Error fetching projects: ", err);
                return res.status(500).send(err);
            }

            // שליפת נתוני המשתמש (כישורים ותפקיד) כדי לסנן פרויקטים מתאימים
            sql.query("SELECT role, skills FROM Users WHERE id = ?", [userId], (err, users) => {
                if (err) {
                    console.error("Error fetching user details: ", err);
                    return res.status(500).send(err);
                }

                if (users.length === 0) return res.status(404).send({message: "User not found"});
                
                const user = users[0];

                // אם מדובר במוביל פרויקטים, נציג לו את הכל (כי הוא לא מגדיר כישורים)
                if (user.role === 'leader') {
                    return res.status(200).json(projects);
                }

                // אם למשתתף אין כישורים מוגדרים, הוא לא יוכל לראות פרויקטים
                if (!user.skills) {
                    return res.status(200).json([]);
                }

                const userSkills = user.skills.split(',').map(s => s.trim());

                // סינון הפרויקטים: חובה לפחות 2 כישורים תואמים
                const filteredProjects = projects.filter(project => {
                    if (!project.skills) return false;
                    const projectSkills = project.skills.split(',').map(s => s.trim());
                    
                    // ספירת כמות הכישורים התואמים
                    const matchCount = projectSkills.filter(skill => userSkills.includes(skill)).length;
                    
                    // מחזירים רק פרויקטים שעונים לתנאי (2 לפחות)
                    return matchCount >= 2;
                });

                res.status(200).json(filteredProjects);
            });
        });
    } else {
        // אם משתמש לא מחובר צופה בעמוד, נחזיר את כל הקטלוג
        sql.query(query, params, (err, results) => {
            if (err) {
                console.error("Error fetching projects: ", err);
                return res.status(500).send(err);
            }
            res.status(200).json(results);
        });
    }
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

// עדכון סטטוס בקשה (אישור/דחייה על ידי המוביל) - כולל מניעת חפיפת תאריכים
const updateApplicationStatus = function(req, res) {
    const { userId, projectId, status } = req.body; 

    if (status === 'approved') {
        // שלב 1: שולפים את תאריכי הפרויקט שאנחנו רוצים לאשר עכשיו
        const targetProjectQuery = "SELECT startDate, endDate FROM Projects WHERE id = ?";
        
        sql.query(targetProjectQuery, [projectId], (err, targetResults) => {
            if (err || targetResults.length === 0) {
                console.error("Error fetching target project: ", err);
                return res.status(500).send({ message: "שגיאה בשליפת הפרויקט", error: err });
            }

            const targetStart = new Date(targetResults[0].startDate);
            const targetEnd = new Date(targetResults[0].endDate);

            // שלב 2: שולפים את כל הפרויקטים שכבר מאושרים למשתמש זה
            const approvedProjectsQuery = `
                SELECT p.startDate, p.endDate 
                FROM Projects p
                JOIN Applications a ON p.id = a.projectId
                WHERE a.userId = ? AND a.status = 'approved' AND a.projectId != ?
            `;

            sql.query(approvedProjectsQuery, [userId, projectId], (err, approvedResults) => {
                if (err) {
                    console.error("Error fetching approved projects: ", err);
                    return res.status(500).send({ message: "שגיאה בבדיקת חפיפת פרויקטים", error: err });
                }

                // שלב 3: סופרים כמה מהפרויקטים המאושרים חופפים בתאריכים לפרויקט הנוכחי
                let overlapCount = 0;
                approvedResults.forEach(project => {
                    const pStart = new Date(project.startDate);
                    const pEnd = new Date(project.endDate);

                    // בדיקת חפיפה: אם הפרויקט מתחיל לפני שהשני מסתיים, ומסתיים אחרי שהשני מתחיל
                    if (targetStart <= pEnd && targetEnd >= pStart) {
                        overlapCount++;
                    }
                });

                // חסימה: אם יש כבר 2 פרויקטים מקבילים (או יותר) שחופפים באותם תאריכים
                if (overlapCount >= 2) {
                    return res.status(400).send({ 
                        message: "לא ניתן לאשר משתתף זה. המשתמש כבר משובץ ל-2 פרויקטים לפחות שחופפים בתאריכים אלו." 
                    });
                }

                // אם אין חפיפה בעייתית, מבצעים את העדכון כרגיל
                executeUpdateQuery();
            });
        });
    } else {
        // אם הסטטוס הוא 'rejected' או 'pending', אין צורך בבדיקת תאריכים
        executeUpdateQuery();
    }

    // פונקציית עזר פנימית לביצוע העדכון בפועל
    function executeUpdateQuery() {
        const updateQuery = "UPDATE Applications SET status = ? WHERE userId = ? AND projectId = ?";
        sql.query(updateQuery, [status, userId, projectId], (err, results) => {
            if (err) {
                console.error("Error updating status: ", err);
                return res.status(500).send({ message: "שגיאה בעדכון הסטטוס", error: err });
            }
            res.status(200).send({ message: "הסטטוס עודכן בהצלחה" });
        });
    }
};

// מחיקת פרויקט קיים (DELETE) - כולל מחיקת הבקשות המקושרות אליו
const deleteProject = function(req, res) {
    const projectId = req.params.id; // קבלת ה-ID מתוך כתובת ה-URL

    // שלב 1: מחיקת כל בקשות ההצטרפות (applications) המקושרות לפרויקט
    sql.query("DELETE FROM Applications WHERE projectId = ?", [projectId], (err, appResults) => {
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