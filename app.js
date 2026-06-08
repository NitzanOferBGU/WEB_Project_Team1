// app.js

document.addEventListener('DOMContentLoaded', () => {
    
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

    // אימות
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
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
            const personalNumRegex = /^\d{7}$/; // הוספנו את \d שאומר שחייבות להיות בדיוק 7 ספרות
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

            //  בדיקת תכונות (רק למשתתף)
            if (userRoleSelect.value === 'participant') {
                const checkedSkills = document.querySelectorAll('.skill-cb:checked').length;
                if (checkedSkills !== 3) {
                    document.getElementById('skillsError').classList.remove('d-none');
                    isValid = false;
                } else {
                    document.getElementById('skillsError').classList.add('d-none');
                }
            }

            
            // לא תקין לא שולחים
            if (!isValid) {
                e.preventDefault();
            } else {
                alert("נרשמת בהצלחה, כעת התחבר למשתמש");
            }
        });
    }

    // אימות דומה גם לעמוד ההתחברות
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            const loginUser = document.getElementById('username').value;
            const loginPass = document.getElementById('password').value;

            if (loginUser.length === 0 || loginPass.length === 0) {
                e.preventDefault();
            }
        });
    }

    //  לחיצה על כפתור "הרשמה לפרויקט" בעמוד הפרויקטים
    const registerButtons = document.querySelectorAll('.register-btn');
    
    registerButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // שינוי מלל
            this.innerHTML = 'הבקשה נשלחה <span class="fs-5">✔</span>';
            // הסרת מחלקת העיצוב הכתומה והוספת מחלקה ירוקה של Bootstrap
            this.classList.remove('btn-action');
            this.classList.add('btn-success');
            // נטרול הכפתור כדי למנוע הרשמה כפולה
            this.disabled = true;
        });
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

    // אימות נתונים
    if (newProjectForm) {
        newProjectForm.addEventListener('submit', (e) => {
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

            // עצירה אם יש שגיאה, או שליחה והקפצת התראה אם תקין
            if (!isProjectValid) {
                e.preventDefault();
            } else {
                alert("הפרויקט החדש נוצר בהצלחה!");
                newProjectForm.reset(); 
            }
        });
    }


    // עמוד הפרויקטים שלי
    const approveButtons = document.querySelectorAll('.approve-btn');
    const rejectButtons = document.querySelectorAll('.reject-btn');

    // אישור משתתף
    approveButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const listItem = this.closest('li');
            const buttonContainer = this.closest('.action-buttons');
            
            // שינוי הבקשה לירוק 
            listItem.classList.add('list-group-item-success');
            // החלפת הכפתורים בטקסט אושר
            buttonContainer.innerHTML = '<span class="text-success fw-bold fs-5">אושר ✔</span>';
        });
    });

    //  דחיית משתתף
    rejectButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const listItem = this.closest('li');
            const buttonContainer = this.closest('.action-buttons');
            
            // שינוי הבקשה לאדום 
            listItem.classList.add('list-group-item-danger');
            // החלפת הכפתורים בטקסט נדחה
            buttonContainer.innerHTML = '<span class="text-danger fw-bold fs-5">נדחה ✖</span>';
        });
    });


    
    // פונקציונליות זמנית כדי להבדיל בין משתתף למוביל, יימחק לאחר בניית צד שרת
    const verifyBtn = document.getElementById('verifyPasswordBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('leaderPasswordInput').value;
            const errorMsg = document.getElementById('passwordError');
            // הסיסמה (שוב, זה זמני וייעלם אחרי הצד שרת)
            const correctPassword = "194";
            // אימות סיסמה 
            if (passwordInput === correctPassword) {
                errorMsg.classList.add("d-none");
                window.location.href = "myprojects.html";
            } else {
                errorMsg.classList.remove("d-none");
            }
        });
    }
});