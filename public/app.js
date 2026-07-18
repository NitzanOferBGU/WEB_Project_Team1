/**
 * ============================================================================
 * שם הקובץ: app.js
 * תיאור: קובץ הלוגיקה המרכזי של צד הלקוח. מטפל בתקשורת מול השרת (בקשות fetch),
 * יצירה והזרקה דינמית של תוכן ל-DOM, וניהול טפסים ומודלים.
 * מגישים: איתי מזרחי, ניצן עופר ואיתי שרם
 * ============================================================================
 */

// פונקציה לשליפת פרויקטים מהשרת והצגתם במסך
async function loadProjects() {
    const container = document.getElementById('projectsContainer');
    
    // מוודא שהסקריפט רץ רק אם אנחנו בעמוד הפרויקטים
    if (!container) return; 

    // שולפים את המשתמש המחובר כדי שנוכל לבקש מהשרת את הסטטוסים שלו
    const loggedInUserString = localStorage.getItem('loggedInUser');
    let fetchUrl = '/api/projects';
    
    if (loggedInUserString) {
        const loggedInUser = JSON.parse(loggedInUserString);
        // שים לב: ודא שהמזהה שמור אצלך תחת 'id' או 'userId' בהתאם למה שהגדרת בהתחברות
        const userId = loggedInUser.id || loggedInUser.userId; 
        fetchUrl = `/api/projects?userId=${userId}`;
    }

    try {
        const response = await fetch(fetchUrl);
        const projects = await response.json();

        container.innerHTML = ""; // ניקוי הקונטיינר לפני הכנסה

        if (projects.length === 0) {
            container.innerHTML = "<h4 class='text-center mt-5 text-muted'>אין פרויקטים להצגה כרגע...</h4>";
            return;
        }

        projects.forEach(project => {
            // חיתוך התאריך כדי שיוצג יפה (ללא שעות)
            const startDate = project.startDate ? project.startDate.substring(0, 10) : "";
            const endDate = project.endDate ? project.endDate.substring(0, 10) : "";

            // --- כאן מתבצע הקסם של הסטטוס ---
            let actionHtml = '';
            if (project.userApplicationStatus === 'pending') {
                actionHtml = `<button class="btn btn-warning w-100 fs-4 fw-bold py-2" disabled style="opacity: 0.9;">ממתין לאישור ⏳</button>`;
            } else if (project.userApplicationStatus === 'approved') {
                actionHtml = `<button class="btn btn-success w-100 fs-4 fw-bold py-2" disabled style="opacity: 0.9;">הצטרפת לפרויקט ✔️</button>`;
            } else if (project.userApplicationStatus === 'rejected') {
                actionHtml = `<button class="btn btn-danger w-100 fs-4 fw-bold py-2" disabled style="opacity: 0.9;">הבקשה נדחתה ❌</button>`;
            } else {
                // המשתמש טרם נרשם, לכן נציג את כפתור ההרשמה הרגיל
                actionHtml = `<button class="btn btn-action w-100 fs-4 fw-bold register-btn py-2" data-project-id="${project.id}">הרשמה לפרויקט</button>`;
            }

            const projectCard = `
                <div class="card project-card shadow-sm border-0 mb-5">
                    <div class="row g-0 align-items-stretch">
                        <div class="col-lg-6 col-md-12">
                            <img src="${project.imagePath}" class="img-fluid rounded-end h-100 object-fit-cover" alt="תמונת פרויקט">
                        </div>
                        <div class="col-lg-6 col-md-12 d-flex flex-column">
                            <div class="card-body p-4 d-flex flex-column h-100">
                                <h3 class="card-title fw-bold mb-3">${project.projectName}</h3>
                                <p class="card-text flex-grow-1 text-secondary fs-5">${project.projectDesc}</p>
                                
                                <div class="row text-center mt-4 mb-4 bg-light p-3 rounded">
                                    <div class="col-4 border-end border-secondary">
                                        <h6 class="text-muted mb-1 small">כמות משתתפים</h6>
                                        <strong class="fs-5" style="color: var(--primary-color);">${project.participantsCount}</strong>
                                    </div>
                                    <div class="col-4 border-end border-secondary">
                                        <h6 class="text-muted mb-1 small">תאריכים</h6>
                                        <strong class="fs-5" style="color: var(--primary-color);">${startDate} - ${endDate}</strong>
                                    </div>
                                    <div class="col-4">
                                        <h6 class="text-muted mb-1 small">תכונות נדרשות</h6>
                                        <strong class="fs-6" style="color: var(--primary-color);">${project.skills || 'לא הוגדרו'}</strong>
                                    </div>
                                </div>
                                
                                ${actionHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += projectCard;
        });
    } catch (error) {
        console.error("שגיאה בטעינת הפרויקטים:", error);
        container.innerHTML = "<p class='text-center text-danger'>אירעה שגיאה בטעינת הפרויקטים.</p>";
    }
}

// פונקציה לשליפת הפרויקטים של המוביל והבקשות אליהם
async function loadLeaderProjects() {
    const container = document.getElementById('myProjectsContainer');
    if (!container) return;

    const loggedInUserString = localStorage.getItem('loggedInUser');
    if (!loggedInUserString) {
        container.innerHTML = "<h4 class='text-center mt-5 text-muted'>עליך להתחבר כדי לראות את הפרויקטים שלך.</h4>";
        return;
    }

    const loggedInUser = JSON.parse(loggedInUserString);

    if (loggedInUser.role !== 'leader') {
        container.innerHTML = "<h4 class='text-center mt-5 text-muted'>עמוד זה מיועד למובילי פרויקטים בלבד.</h4>";
        return;
    }

    try {
        const response = await fetch(`/api/leader-projects/${loggedInUser.id}`);
        const projects = await response.json();

        container.innerHTML = "";

        if (projects.length === 0) {
            container.innerHTML = "<h4 class='text-center mt-5 text-muted'>טרם יצרת פרויקטים. לחץ על הכפתור למעלה כדי להתחיל!</h4>";
            return;
        }

        projects.forEach(project => {
            const startDate = project.startDate ? project.startDate.substring(0, 10) : "";
            const endDate = project.endDate ? project.endDate.substring(0, 10) : "";

            // יצירת רשימת הבקשות לפרויקט זה
            let applicationsHtml = "";
            let approvedCount = 0; // ספירת משתתפים שאושרו

            if (project.applications && project.applications.length > 0) {
                project.applications.forEach(app => {
                    let actionHtml = "";
                    let liClass = "list-group-item d-flex justify-content-between align-items-center py-3";
                    
                    if (app.status === 'approved') approvedCount++;

                    // קביעת התצוגה לפי הסטטוס (כפתורים או טקסט)
                    if (app.status === 'pending') {
                        // שמנו ב-data את המזהים כדי שנדע איזה משתמש לאשר לאיזה פרויקט
                        actionHtml = `
                            <button class="btn btn-success btn-sm approve-btn px-3" data-user-id="${app.userId}" data-project-id="${project.id}">אישור</button>
                            <button class="btn btn-outline-danger btn-sm reject-btn px-3 ms-1" data-user-id="${app.userId}" data-project-id="${project.id}">דחייה</button>
                        `;
                    } else if (app.status === 'approved') {
                        liClass += " list-group-item-success";
                        actionHtml = `<span class="text-success fw-bold fs-5">אושר ✔</span>`;
                    } else if (app.status === 'rejected') {
                        liClass += " list-group-item-danger";
                        actionHtml = `<span class="text-danger fw-bold fs-5">נדחה ✖</span>`;
                    }

                    applicationsHtml += `
                        <li class="${liClass}">
                            <div>
                                <strong>${app.fullName}</strong> <span class="text-muted small">(מ.א: ${app.personalNum})</span><br>
                                <small class="text-muted">כישורים: ${app.skills || 'לא הוגדרו'}</small>
                            </div>
                            <div class="action-buttons">
                                ${actionHtml}
                            </div>
                        </li>
                    `;
                });
            } else {
                applicationsHtml = "<li class='list-group-item text-center text-muted'>אין בקשות הצטרפות עדיין</li>";
            }

            const projectCard = `
                <div class="card project-card shadow-sm border-0 mb-5">
                    <div class="row g-0 align-items-stretch">
                        <div class="col-lg-6 col-md-12">
                            <img src="${project.imagePath}" class="img-fluid rounded-end h-100 object-fit-cover" alt="תמונת פרויקט">
                        </div>
                        <div class="col-lg-6 col-md-12 d-flex flex-column">
                            <div class="card-body p-4 d-flex flex-column h-100">
                                <h3 class="card-title fw-bold mb-3">${project.projectName}</h3>
                                <p class="card-text text-secondary mb-3">${project.projectDesc}</p>
                                
                                <div class="row text-center mb-4 bg-light p-2 rounded">
                                    <div class="col-4 border-end border-secondary">
                                        <h6 class="text-muted mb-0 small">משתתפים</h6>
                                        <strong style="color: var(--primary-color);">${approvedCount} / ${project.participantsCount}</strong>
                                    </div>
                                    <div class="col-4 border-end border-secondary">
                                        <h6 class="text-muted mb-0 small">תאריכים</h6>
                                        <strong style="color: var(--primary-color);">${startDate} - ${endDate}</strong>
                                    </div>
                                    <div class="col-4">
                                        <h6 class="text-muted mb-0 small">תכונות</h6>
                                        <strong class="small" style="color: var(--primary-color);">${project.skills || 'לא הוגדרו'}</strong>
                                    </div>
                                </div>

                                <h5 class="fw-bold mb-3" style="color: var(--primary-color);">בקשות הצטרפות:</h5>
                                <ul class="list-group list-group-flush border rounded mb-3 flex-grow-1 overflow-auto" style="max-height: 200px;">
                                    ${applicationsHtml}
                                </ul>

                                <!-- כפתורי עריכה ומחיקה -->
                                <div class="d-flex gap-2 mt-auto pt-2 border-top">
                                    <button class="btn btn-warning flex-fill fw-bold" onclick="openEditModal(this)" 
                                        data-id="${project.id}" 
                                        data-name="${project.projectName.replace(/"/g, '&quot;')}" 
                                        data-desc="${project.projectDesc.replace(/"/g, '&quot;')}" 
                                        data-count="${project.participantsCount}" 
                                        data-start="${startDate}" 
                                        data-end="${endDate}" 
                                        data-skills="${project.skills}">ערוך פרויקט ✏️
                                    </button>
                                    <button class="btn btn-danger flex-fill fw-bold" onclick="deleteProjectHandler(${project.id})">מחק פרויקט 🗑️</button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += projectCard;
        });
    } catch (error) {
        console.error("שגיאה בטעינת הפרויקטים של המוביל:", error);
        container.innerHTML = "<p class='text-center text-danger'>אירעה שגיאה בטעינת הנתונים מהשרת.</p>";
    }
}

// פונקציה למחיקת פרויקט (בקשת DELETE)
async function deleteProjectHandler(projectId) {
    // הודעת אישור לפני מחיקה
    if (!confirm("האם אתה בטוח שברצונך למחוק פרויקט זה? פעולה זו בלתי הפיכה.")) {
        return;
    }

    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("הפרויקט נמחק בהצלחה!");
            // רענון רשימת הפרויקטים בעמוד כדי להעלים את הפרויקט שנמחק
            loadLeaderProjects(); 
        } else {
            alert("אירעה שגיאה במחיקת הפרויקט.");
        }
    } catch (error) {
        console.error("שגיאה בביצוע הבקשה:", error);
    }
}

// פתיחת חלון העריכה ומילוי כל הנתונים הקיימים
function openEditModal(buttonElement) {
    const id = buttonElement.getAttribute('data-id');
    const name = buttonElement.getAttribute('data-name');
    const desc = buttonElement.getAttribute('data-desc');
    const count = buttonElement.getAttribute('data-count');
    const start = buttonElement.getAttribute('data-start');
    const end = buttonElement.getAttribute('data-end');
    const skills = buttonElement.getAttribute('data-skills');

    // השמת ערכי טקסט ותאריך
    document.getElementById('editProjectId').value = id;
    document.getElementById('editProjectName').value = name;
    document.getElementById('editProjectDesc').value = desc;
    document.getElementById('editParticipantsCount').value = count;
    document.getElementById('editStartDate').value = start;
    document.getElementById('editEndDate').value = end;

    // איפוס תכונות נדרשות (צ'קבוקסים)
    const checkboxes = document.querySelectorAll('.edit-skill-cb');
    checkboxes.forEach(cb => cb.checked = false);

    // סימון התכונות שהיו שמורות בפרויקט
    if (skills) {
        const skillsArray = skills.split(',').map(s => s.trim());
        checkboxes.forEach(cb => {
            if (skillsArray.includes(cb.value)) {
                cb.checked = true;
            }
        });
    }

    const editModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    editModal.show();
}

// האזנה לשליחת טופס העריכה (PUT)
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editProjectForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // בדיקת קצה: וידוא בחירת 3 תכונות בדיוק
            const checkedSkills = Array.from(document.querySelectorAll('.edit-skill-cb:checked')).map(cb => cb.value);
            if (checkedSkills.length !== 3) {
                alert("יש לבחור בדיוק 3 תכונות!");
                return;
            }

            const id = document.getElementById('editProjectId').value;
            const updatedData = {
                projectName: document.getElementById('editProjectName').value,
                projectDesc: document.getElementById('editProjectDesc').value,
                participantsCount: document.getElementById('editParticipantsCount').value,
                startDate: document.getElementById('editStartDate').value,
                endDate: document.getElementById('editEndDate').value,
                skills: checkedSkills.join(', ') // איחוד למחרוזת אחת עבור מסד הנתונים
            };

            try {
                const response = await fetch(`/api/projects/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    alert("הפרויקט עודכן בהצלחה!");
                    window.location.reload(); 
                } else {
                    const errorObj = await response.json();
                    alert("שגיאה בעדכון הפרויקט: " + (errorObj.error || ""));
                }
            } catch (error) {
                console.error("שגיאה בשליחת עדכון הפרויקט:", error);
            }
        });
    }
});


document.addEventListener('DOMContentLoaded', () => {
    
    // טעינת פרויקטים כלליים (רק בעמוד projects.html)
    if (document.getElementById('projectsContainer')) {
        loadProjects();
    }

    // טעינת הפרויקטים של המוביל (רק בעמוד myprojects.html)
    if (document.getElementById('myProjectsContainer')) {
        loadLeaderProjects();
    }

    // ניהול תצוגת כפתור "מעבר לפרויקטים שלי" ב-Navbar
    const leaderNavbarItem = document.getElementById('leaderNavbarItem');
    if (leaderNavbarItem) {
        const loggedInUserString = localStorage.getItem('loggedInUser');
        if (loggedInUserString) {
            const loggedInUser = JSON.parse(loggedInUserString);
            
            // אם המשתמש אינו מוביל, נעלים את הכפתור לחלוטין
            if (loggedInUser.role !== 'leader') {
                leaderNavbarItem.classList.add('d-none');
            }
        } else {
            // למקרה שאין משתמש מחובר בכלל בזיכרון (הגנה נוספת)
            leaderNavbarItem.classList.add('d-none');
        }
    }

    const signupForm = document.getElementById('signupForm');
    const userRoleSelect = document.getElementById('userRole');
    const skillsSection = document.getElementById('skillsSection');

    // תפריט נפתח של תכונות
    if (userRoleSelect) {
        userRoleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'participant') {
                skillsSection.classList.remove('d-none');
            } else {
                skillsSection.classList.add('d-none');
                // איפוס בחירה במעבר למוביל
                document.querySelectorAll('.skill-cb').forEach(cb => cb.checked = false);
            }
        });
    }

    // אימות הרשמה ושליחה דינמית לשרת
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // מונע את קפיצת הדפדפן לכתובת השרת - חובה!
            let isValid = true;

            // בדיקת סוג משתמש
            if (!userRoleSelect.value) {
                document.getElementById('roleError').classList.remove('d-none');
                isValid = false;
            } else {
                document.getElementById('roleError').classList.add('d-none');
            }

            // בדיקת שם מלא
            const fullName = document.getElementById('FullName').value;
            const fullNameRegex = /^[a-zA-Zא-ת\s]+$/; 

            if (!fullNameRegex.test(fullName)) {
                document.getElementById('fullNameError').classList.remove('d-none');
                isValid = false;
            } else {
                document.getElementById('fullNameError').classList.add('d-none');
            }

            // בדיקת מספר אישי
            const personalNum = document.getElementById('personalNum').value;
            const personalNumRegex = /^\d{7}$/; 
            if (!personalNumRegex.test(personalNum)) {
                document.getElementById('personalNumError').classList.remove('d-none');
                isValid = false;
            } else {
                document.getElementById('personalNumError').classList.add('d-none');
            }

            // בדיקת שם משתמש
            const username = document.getElementById('username').value;
            if (username.length < 3) {
                document.getElementById('usernameError').classList.remove('d-none');
                isValid = false;
            } else {
                document.getElementById('usernameError').classList.add('d-none');
            }

            // בדיקת סיסמה
            const password = document.getElementById('password').value;
            if (password.length < 6) {
                document.getElementById('passwordError').classList.remove('d-none');
                isValid = false;
            } else {
                document.getElementById('passwordError').classList.add('d-none');
            }

            // בדיקת תכונות ואיסוף למערך (רק למשתתף)
            const skillsArray = [];
            if (userRoleSelect.value === 'participant') {
                const checkedSkills = document.querySelectorAll('.skill-cb:checked');
                if (checkedSkills.length !== 3) {
                    document.getElementById('skillsError').classList.remove('d-none');
                    isValid = false;
                } else {
                    document.getElementById('skillsError').classList.add('d-none');
                    // דחיפת הערכים שנבחרו לתוך המערך
                    checkedSkills.forEach(cb => skillsArray.push(cb.value)); 
                }
            }

            // עצירה אם הטופס לא תקין
            if (!isValid) return;

            try {
                // שליחת הבקשה לשרת
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role: userRoleSelect.value,
                        fullName: fullName,
                        personalNum: personalNum,
                        username: username,
                        password: password,
                        skills: skillsArray // שולחים כמערך מוגדר היטב (יהיה ריק עבור מוביל)
                    })
                });

                if (response.ok) {
                    alert("נרשמת בהצלחה, כעת התחבר למשתמש");
                    window.location.href = "login.html"; // הפניה מסודרת חזרה לעמוד ההתחברות
                } else {
                    const data = await response.json();
                    alert("שגיאה בהרשמה: " + (data.message || "נסה שוב."));
                }
            } catch (error) {
                console.error("Signup error:", error);
                alert("אירעה שגיאה בתקשורת עם השרת.");
            }
        });
    }

    // אימות התחברות דינמי מול השרת
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // <-- השורה הקריטית שעוצרת את ה"זריקה"

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            if (usernameInput.length === 0 || passwordInput.length === 0) return;

            try {
                // שליחת הבקשה לראוט שיצרנו בשרת
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usernameInput, password: passwordInput })
                });

                const data = await response.json();

                if (response.ok) {
                    // התחברות מוצלחת - שומרים את פרטי המשתמש ב-localStorage
                    localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                    
                    alert("התחברת בהצלחה!");
                    
                    // ניתוב חכם לפי סוג משתמש
                    if (data.user.role === 'leader') {
                        window.location.href = "myprojects.html";
                    } else if (data.user.role === 'participant') {
                        window.location.href = "projects.html";
                    } else {
                        // גיבוי למקרה שמשהו חסר
                        window.location.href = "projects.html"; 
                    }
                } else {
                    // שגיאת התחברות (שם משתמש או סיסמה שגויים)
                    document.getElementById('loginError').classList.remove('d-none');
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("אירעה שגיאה בתקשורת עם השרת.");
            }
        });
    }

    // לחיצה על כפתור "הרשמה לפרויקט" בעמוד הפרויקטים
    document.addEventListener('click', async function(e) {
        if (e.target && e.target.classList.contains('register-btn')) {
            const btn = e.target;
            const projectId = btn.getAttribute('data-project-id');
            
            // משיכת פרטי המשתמש המחובר מהזיכרון
            const loggedInUserString = localStorage.getItem('loggedInUser');
            if (!loggedInUserString) {
                alert("עליך להתחבר למערכת כדי להירשם לפרויקטים!");
                window.location.href = "login.html";
                return;
            }

            const loggedInUser = JSON.parse(loggedInUserString);

            // וידוא שרק משתתף יכול להירשם (ולא מוביל פרויקט)
            if (loggedInUser.role !== 'participant') {
                alert("רק משתמש מסוג 'משתתף' יכול להירשם לפרויקטים.");
                return;
            }

            try {
                // שליחת בקשת ההרשמה לשרת
                const response = await fetch('/api/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: loggedInUser.id, projectId: projectId })
                });

                const data = await response.json();

                if (response.ok) {
                    // עדכון חזותי של הכפתור
                    btn.innerHTML = 'הבקשה נשלחה <span class="fs-5">✔</span>';
                    btn.classList.remove('btn-action');
                    btn.classList.add('btn-success');
                    btn.disabled = true;
                } else {
                    alert(data.message || "שגיאה בהרשמה לפרויקט.");
                }
            } catch (error) {
                console.error("Error applying to project:", error);
                alert("אירעה שגיאה בתקשורת עם השרת.");
            }
        }
    });

    // דף יצירת פרוייקט
    const newProjectForm = document.getElementById('newProjectForm');
    const projectDesc = document.getElementById('projectDesc');
    const charCount = document.getElementById('charCount');

    // אלמנטים לשיטות העלאת תמונה
    const urlOption = document.getElementById('urlOption');
    const fileOption = document.getElementById('fileOption');
    const projectImageURL = document.getElementById('projectImageURL');
    const projectImageFile = document.getElementById('projectImageFile');

    // העלאת קובץ או הדבקת כתובת URL
    if (urlOption && fileOption) {
        urlOption.addEventListener('change', () => {
            projectImageURL.classList.remove('d-none');
            projectImageURL.setAttribute('required', 'required');
            projectImageFile.classList.add('d-none');
            projectImageFile.removeAttribute('required');
            projectImageFile.value = ''; 
        });

        fileOption.addEventListener('change', () => {
            projectImageFile.classList.remove('d-none');
            projectImageFile.setAttribute('required', 'required');
            projectImageURL.classList.add('d-none');
            projectImageURL.removeAttribute('required');
            projectImageURL.value = ''; 
        });
    }

    // מונה תווים של תיאור הפרויקט
    if (projectDesc && charCount) {
        projectDesc.addEventListener('input', () => {
            const currentLength = projectDesc.value.length;
            charCount.textContent = `${currentLength} / 300 תווים`;
        });
    }

    // אימות נתונים טופס יצירת פרויקט
    if (newProjectForm) {
        newProjectForm.addEventListener('submit', (e) => {
            console.log("--- הטופס מנסה להישלח! ---"); // בדיקה לאיתור שגיאה שהייתה במהלך ההרצה הראשונה
            let isProjectValid = true;

            // בדיקת שם הפרויקט
            if (document.getElementById('projectName').value.trim() === '') {
                document.getElementById('projectNameError').classList.remove('d-none');
                isProjectValid = false;
            } else {
                document.getElementById('projectNameError').classList.add('d-none');
            }

            // בדיקת תמונה לפי בחירת המשתמש
            if (urlOption && urlOption.checked) {
                if (projectImageURL.value.trim() === '') {
                    document.getElementById('projectImageError').classList.remove('d-none');
                    isProjectValid = false;
                } else {
                    document.getElementById('projectImageError').classList.add('d-none');
                }
            } else if (fileOption && fileOption.checked) {
                if (projectImageFile.files.length === 0) {
                    document.getElementById('projectImageError').classList.remove('d-none');
                    isProjectValid = false;
                } else {
                    document.getElementById('projectImageError').classList.add('d-none');
                }
            }

            // אימות תיאור
            if (document.getElementById('projectDesc').value.trim() === '') {
                document.getElementById('projectDescError').classList.remove('d-none');
                isProjectValid = false;
            } else {
                document.getElementById('projectDescError').classList.add('d-none');
            }

            // בדיקת כמות משתתפים נדרשת
            const participantsCount = parseInt(document.getElementById('participantsCount').value);
            if (isNaN(participantsCount) || participantsCount < 1) {
                document.getElementById('participantsError').classList.remove('d-none');
                isProjectValid = false;
            } else {
                document.getElementById('participantsError').classList.add('d-none');
            }

            // בדיקת תאריכים
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate) {
                document.getElementById('startDateError').classList.remove('d-none');
                isProjectValid = false;
            } else {
                document.getElementById('startDateError').classList.add('d-none');
            }

            if (!endDate || (startDate && endDate && new Date(endDate) < new Date(startDate))) {
                document.getElementById('endDateError').classList.remove('d-none');
                isProjectValid = false;
            } else {
                document.getElementById('endDateError').classList.add('d-none');
            }

            // בדיקת בחירת תכונות
            const checkedProjectSkills = document.querySelectorAll('.project-skill-cb:checked').length;
            if (checkedProjectSkills !== 3) {
                document.getElementById('projectSkillsError').classList.remove('d-none');
                isProjectValid = false;
            } else {
                document.getElementById('projectSkillsError').classList.add('d-none');
            }

            // עצירה אם יש שגיאה
            if (!isProjectValid) {
                e.preventDefault();
            } else {
                // הוספת שדה נסתר להעברת ה-ID של המוביל לשרת
                const loggedInUserString = localStorage.getItem('loggedInUser');
                if (loggedInUserString) {
                    const loggedInUser = JSON.parse(loggedInUserString);
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'currentLeaderId';
                    hiddenInput.value = loggedInUser.id;
                    newProjectForm.appendChild(hiddenInput);
                }
                alert("הפרויקט החדש נוצר בהצלחה ומועבר לשרת!");
            }
        });
    }

// טיפול דינמי בלחיצה על כפתורי אישור או דחייה של משתתף
    document.addEventListener('click', async function(e) {
        if (e.target && (e.target.classList.contains('approve-btn') || e.target.classList.contains('reject-btn'))) {
            const btn = e.target;
            const isApprove = btn.classList.contains('approve-btn');
            const userId = btn.getAttribute('data-user-id');
            const projectId = btn.getAttribute('data-project-id');
            const newStatus = isApprove ? 'approved' : 'rejected';

            try {
                const response = await fetch('/api/application-status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: userId, projectId: projectId, status: newStatus })
                });

                if (response.ok) {
                    const listItem = btn.closest('li');
                    const buttonContainer = btn.closest('.action-buttons');
                    
                    if (isApprove) {
                        listItem.classList.add('list-group-item-success');
                        buttonContainer.innerHTML = '<span class="text-success fw-bold fs-5">אושר ✔</span>';
                    } else {
                        listItem.classList.add('list-group-item-danger');
                        buttonContainer.innerHTML = '<span class="text-danger fw-bold fs-5">נדחה ✖</span>';
                    }
                    
                    // רענון העמוד כדי לעדכן את מונה "משתתפים"
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    const errorObj = await response.json();
                    alert(errorObj.message || "שגיאה בעדכון הסטטוס מול השרת.");
                }
            } catch (error) {
                console.error("Error updating status:", error);
                alert("אירעה שגיאה בתקשורת עם השרת.");
            }
        }
    }); 
});