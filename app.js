function safeCreateIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

const form = document.getElementById('patient-form');
const saveBtn = document.getElementById('save-btn');

if (form && saveBtn) {

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    let editingPatient = null;

    if (editId) {
        editingPatient = getPatientById(editId);
        if (editingPatient) {
            prefillForm(editingPatient);
        }
    }

    saveBtn.addEventListener('click', function () {
        const formData = new FormData(form);
        const patientData = {};

        for (const [key, value] of formData) {
            if (patientData[key]) {
                if (Array.isArray(patientData[key])) {
                    patientData[key].push(value);
                } else {
                    patientData[key] = [patientData[key], value];
                }
            } else {
                patientData[key] = value;
            }
        }

        patientData.categories = detectCategories(patientData);

        const existingPatients = JSON.parse(localStorage.getItem('patients')) || [];

        if (editingPatient) {
            patientData.id = editingPatient.id;
            const index = existingPatients.findIndex(p => p.id == editingPatient.id);
            existingPatients[index] = patientData;
        } else {
            patientData.id = Date.now();
            existingPatients.push(patientData);
        }

        localStorage.setItem('patients', JSON.stringify(existingPatients));
        showToast('بیمار با موفقیت ذخیره شد ✅');
        window.location.href = 'index.html';
    });
}

const maleRadio = document.getElementById('male');
const femaleRadio = document.getElementById('female');

if (maleRadio && femaleRadio) {
    const maleSections = [
        document.getElementById('section-male-ros'),
        document.getElementById('section-male-pe')
    ];
    const femaleSections = [
        document.getElementById('section-female-ros'),
        document.getElementById('section-female-pe')
    ];

    function updateGenderSections() {
        if (maleRadio.checked) {
            maleSections.forEach(s => s.style.display = 'block');
            femaleSections.forEach(s => s.style.display = 'none');
        } else if (femaleRadio.checked) {
            femaleSections.forEach(s => s.style.display = 'block');
            maleSections.forEach(s => s.style.display = 'none');
        }
    }

    maleRadio.addEventListener('change', updateGenderSections);
    femaleRadio.addEventListener('change', updateGenderSections);
    updateGenderSections();
}

const patientListDiv = document.getElementById('patient-list');

if (patientListDiv) {
    displayPatients();
}

function renderPatientCards(patients) {
    if (patients.length === 0) {
        patientListDiv.innerHTML = `
            <div class="empty-state">
                <i data-lucide="user-round-search"></i>
                <p>هنوز بیماری ثبت نشده. با دکمه + یکی اضافه کن.</p>
            </div>
        `;
        safeCreateIcons();
        return;
    }

    patientListDiv.innerHTML = '';
    patients.forEach(function (patient) {
        const gender = patient['gender'] === 'زن' ? 'female' : 'male';

        const card = document.createElement('div');
        card.className = 'patient-card';
        card.innerHTML = `
            <div class="patient-avatar ${gender}">
                <i data-lucide="user"></i>
            </div>
            <div class="patient-card-info">
                <h3>${patient['patient-name'] || 'بدون نام'}</h3>
                <p>سن: ${patient['patient-age'] || '-'}</p>
            </div>
        `;
        card.addEventListener('click', function () {
            window.location.href = 'detail.html?id=' + patient.id;
        });
        patientListDiv.appendChild(card);
    });

    safeCreateIcons();
}

function displayPatients() {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    renderPatientCards(patients);
}

const painSeverity = document.getElementById('pain-severity');
const severityValue = document.getElementById('severity-value');

if (painSeverity && severityValue) {
    painSeverity.addEventListener('input', function () {
        severityValue.textContent = painSeverity.value;
    });
}

const rosCategories = {
    'ros-general': 'General (عمومی)',
    'ros-skin': 'Skin (پوست)',
    'ros-head': 'Head (سر)',
    'ros-eye': 'Eye (چشم)',
    'ros-ear': 'Ear (گوش)',
    'ros-nose': 'Nose (بینی)',
    'ros-mouth': 'Mouth & Throat (دهان و گلو)',
    'ros-neck': 'Neck (گردن)',
    'ros-breast': 'Breast (پستان)',
    'ros-resp': 'Respiratory (تنفسی)',
    'ros-heart': 'Heart (قلب)',
    'ros-gi': 'GI (گوارش)',
    'ros-uri': 'Urinary (ادراری)',
    'ros-male': 'Male Genitalia (تناسلی مردان)',
    'ros-female': 'Female Genitalia (تناسلی زنان)',
    'ros-vasc': 'Vascular (عروقی)',
    'ros-musc': 'Musculoskeletal (عضلانی-اسکلتی)',
    'ros-neuro': 'Nervous System (عصبی)',
    'ros-heme': 'Hematologic (خونی)',
    'ros-endo': 'Endocrine (غدد)',
    'ros-mental': 'Mental (ذهنی)',
    'ros-sleep': 'Sleep (خواب)',
    'ros-confusion': 'Behavior (رفتاری)',
    'ros-speech': 'Speech (تکلم)',
    'ros-skills': 'Functional Skills (مهارت‌های عملکردی)'
};

function detectCategories(patientData) {
    const found = [];
    for (const prefix in rosCategories) {
        if (patientData[prefix]) {
            found.push(rosCategories[prefix]);
        }
    }
    return found;
}

function renderFilterCheckboxes() {
    const list = document.getElementById('filter-categories-list');
    if (!list) return;

    list.innerHTML = '';
    for (const prefix in rosCategories) {
        list.innerHTML += `
            <div class="checkbox-group">
                <input type="checkbox" id="filter-${prefix}" value="${prefix}" class="filter-category-checkbox">
                <label for="filter-${prefix}">${rosCategories[prefix]}</label>
            </div>
        `;
    }
}

function applyFilters() {
    const ageMin = document.getElementById('filter-age-min').value;
    const ageMax = document.getElementById('filter-age-max').value;
    const gender = document.getElementById('filter-gender').value;

    const selectedCategories = Array.from(
        document.querySelectorAll('.filter-category-checkbox:checked')
    ).map(cb => cb.value);

    const patients = JSON.parse(localStorage.getItem('patients')) || [];

    const filtered = patients.filter(function (patient) {
        const age = parseInt(patient['patient-age']);

        if (ageMin && age < parseInt(ageMin)) return false;
        if (ageMax && age > parseInt(ageMax)) return false;
        if (gender && patient['gender'] !== gender) return false;

        if (selectedCategories.length > 0) {
            const patientCategories = patient.categories || [];
            const hasMatch = selectedCategories.some(cat =>
                patientCategories.includes(rosCategories[cat])
            );
            if (!hasMatch) return false;
        }

        return true;
    });

    renderPatientCards(filtered);
}

const filterToggleBtn = document.getElementById('filter-toggle-btn');
const filterPanel = document.getElementById('filter-panel');
const applyFilterBtn = document.getElementById('apply-filter-btn');
const clearFilterBtn = document.getElementById('clear-filter-btn');

if (filterToggleBtn && filterPanel) {
    renderFilterCheckboxes();

    filterToggleBtn.addEventListener('click', function () {
        filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
    });

    applyFilterBtn.addEventListener('click', applyFilters);

    clearFilterBtn.addEventListener('click', function () {
        document.getElementById('filter-age-min').value = '';
        document.getElementById('filter-age-max').value = '';
        document.getElementById('filter-gender').value = '';
        document.querySelectorAll('.filter-category-checkbox:checked').forEach(cb => cb.checked = false);
        displayPatients();
    });
}

const searchInput = document.getElementById('search-input');
const searchIconBtn = document.getElementById('search-icon-btn');

if (searchInput) {
    searchInput.addEventListener('input', function () {
        const query = searchInput.value.trim().toLowerCase();
        const patients = JSON.parse(localStorage.getItem('patients')) || [];
        const filtered = patients.filter(function (patient) {
            const name = (patient['patient-name'] || '').toLowerCase();
            return name.includes(query);
        });
        renderPatientCards(filtered);
    });
}

if (searchIconBtn && searchInput) {
    searchIconBtn.addEventListener('click', function () {
        searchInput.focus();
    });
}

function getPatientById(id) {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    return patients.find(p => p.id == id);
}

const detailDiv = document.getElementById('patient-detail');

if (detailDiv) {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    const patient = getPatientById(patientId);

    if (patient) {
        renderPatientDetail(patient);
    } else {
        detailDiv.innerHTML = '<p>بیمار پیدا نشد.</p>';
    }
}

function formatLabel(key) {
    return key
        .replace(/^ros-|^pe-/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function renderPatientDetail(patient) {
    let html = `
    <div class="detail-actions">
        <button onclick="window.location.href='form.html?id=${patient.id}'"><i data-lucide="pencil"></i> ویرایش</button>
        <button id="download-pdf-btn"><i data-lucide="file-down"></i> دانلود PDF</button>
        <button id="delete-patient-btn"><i data-lucide="trash-2"></i> حذف</button>
    </div>
    <div class="a4-page">
        <h2>${patient['patient-name'] || 'بدون نام'}</h2>
`;

    for (const key in patient) {
        if (key === 'id' || key === 'categories') continue;
        const value = patient[key];
        if (!value || (Array.isArray(value) && value.length === 0)) continue;

        const displayValue = Array.isArray(value) ? value.join('، ') : value;
        html += `
            <div class="detail-row">
                <span class="detail-label">${formatLabel(key)}:</span>
                <span class="detail-value">${displayValue}</span>
            </div>
        `;
    }

    html += `</div>`;
    detailDiv.innerHTML = html;
    safeCreateIcons();

    document.getElementById('download-pdf-btn').addEventListener('click', function () {
        generatePDF(patient);
    });

    document.getElementById('delete-patient-btn').addEventListener('click', async function () {
        const confirmed = await showConfirm('آیا مطمئنی می‌خوای این بیمار رو حذف کنی؟ این کار قابل بازگشت نیست.');
        if (confirmed) deletePatient(patient.id);
    });
}

function generatePDF(patient) {
    const element = document.querySelector('.a4-page');
    const downloadBtn = document.getElementById('download-pdf-btn');
    downloadBtn.textContent = 'در حال ساخت PDF...';

    const wasDark = document.documentElement.classList.contains('dark');
    if (wasDark) {
        document.documentElement.classList.remove('dark');
    }

    element.classList.add('pdf-render');

    html2canvas(element, { scale: 2 }).then(function (canvas) {
        element.classList.remove('pdf-render');
        if (wasDark) {
            document.documentElement.classList.add('dark');
        }

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const pageWidth = 210;
        const pageHeight = 297;
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        doc.save((patient['patient-name'] || 'patient') + '.pdf');
        downloadBtn.textContent = '📄 دانلود PDF';
    });
}

function deletePatient(id) {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const filtered = patients.filter(p => p.id != id);
    localStorage.setItem('patients', JSON.stringify(filtered));
    window.location.href = 'index.html';
}

function prefillForm(patient) {
    for (const key in patient) {
        if (key === 'id' || key === 'categories') continue;
        const value = patient[key];
        const elements = document.querySelectorAll(`[name="${key}"]`);

        elements.forEach(function (el) {
            if (el.type === 'checkbox' || el.type === 'radio') {
                const values = Array.isArray(value) ? value : [value];
                el.checked = values.includes(el.value);
            } else {
                el.value = Array.isArray(value) ? value.join(', ') : value;
            }
        });
    }
}

// ---------- Toast ----------
function showToast(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' error' : '');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(function () {
        toast.remove();
    }, 3000);
}

// ---------- Confirm Modal ----------
function showConfirm(message) {
    return new Promise(function (resolve) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="cancel-btn" id="modal-cancel">انصراف</button>
                    <button id="modal-confirm">تایید</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('modal-confirm').addEventListener('click', function () {
            overlay.remove();
            resolve(true);
        });
        document.getElementById('modal-cancel').addEventListener('click', function () {
            overlay.remove();
            resolve(false);
        });
    });
}

if (typeof lucide !== 'undefined') {
    safeCreateIcons();
}

function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerHTML = theme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        if (typeof lucide !== 'undefined') safeCreateIcons();
    }
}

const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

const themeToggleBtn = document.getElementById('theme-toggle-btn');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
}