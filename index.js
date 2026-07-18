/**
 * ============================================================================
 * שם הקובץ: index.js
 * תיאור: הקובץ הראשי של צד השרת. מגדיר את שרת ה-Express, מאזין לפורט,
 * ומנתב את כל בקשות הלקוח (Routing) אל פונקציות הטיפול המתאימות.
 * מגישים: איתי מזרחי, ניצן עופר ואיתי שרם 
 * ============================================================================
 */

const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const CRUD = require("./CRUD_functions.js");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const multer = require('multer');

// הגדרות האחסון של Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // שומר את הקובץ בתיקיית public/Photos
        cb(null, path.join(__dirname, 'public', 'Photos'));
    },
    filename: function (req, file, cb) {
        // מוסיף חותמת זמן לשם הקובץ כדי למנוע דריסה של תמונות עם שם זהה
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// ניתוב דף הבית
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ניתובים לטפסים (30% מהציון) [18]
app.post("/api/signup", CRUD.createNewUser);
app.post('/api/new-project', upload.single('projectImageFile'), CRUD.createNewProject);
app.get("/api/projects", CRUD.getAllProjects);
app.post("/api/login", CRUD.loginUser);
app.post("/api/apply", CRUD.applyToProject);
app.get("/api/leader-projects/:leaderId", CRUD.getLeaderProjects);
app.put("/api/application-status", CRUD.updateApplicationStatus);
app.delete('/api/projects/:id', CRUD.deleteProject);
app.put('/api/projects/:id', CRUD.updateProject);

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});