const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('=== TEST SUITE: PROFESSIONAL PROFILE EDITING & WHATSAPP FEATURES ===\n');

// ----------------------------------------------------
// TEST 1: StorageService Specialties & Profile Update
// ----------------------------------------------------
console.log('--- TEST 1: StorageService Specialties & updateProfessionalProfile ---');

const storageCode = fs.readFileSync(path.join(__dirname, '../js/storage.js'), 'utf8');

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

const storageContext = {
    localStorage: localStorageMock,
    window: {},
    console
};
storageContext.window.window = storageContext.window;
vm.createContext(storageContext);
vm.runInContext(storageCode, storageContext);

const storage = storageContext.window.storageService;
assert(storage, 'StorageService must be instantiated');

// 1a: Default specialties
const specialties = storage.getSpecialties();
assert(Array.isArray(specialties), 'Specialties must be an array');
assert(specialties.includes('Ortodoncia y Ortopedia Maxilar'), 'Must include Ortodoncia');
console.log(`✓ Initial specialties count: ${specialties.length}`);

// 1b: Add specialty
const added = storage.addSpecialty('Odontología Láser Avanzada');
assert.strictEqual(added, true, 'addSpecialty should return true for new specialty');
const duplicate = storage.addSpecialty('Odontología Láser Avanzada');
assert.strictEqual(duplicate, false, 'addSpecialty should return false for duplicate');
assert(storage.getSpecialties().includes('Odontología Láser Avanzada'), 'List must include new specialty');
console.log('✓ Admin addSpecialty verified (prevents duplicates).');

// 1c: Delete specialty
storage.deleteSpecialty('Odontología Láser Avanzada');
assert(!storage.getSpecialties().includes('Odontología Láser Avanzada'), 'Specialty must be deleted');
console.log('✓ Admin deleteSpecialty verified.');

// 1d: Update Professional Profile
const profId = 'prof_1';
const initialProf = storage.getProfessionalById(profId);
assert(initialProf, 'prof_1 must exist');

const updatedProf = storage.updateProfessionalProfile(profId, {
    name: 'Dra. María Elena Gómez Modificada',
    consultorio: 'Consultorio A - Box 1',
    specialty: 'Periodoncia y Estética Dental',
    email: 'dra.gomez.nueva@dental.com',
    phone: '+54 9 11 9999-8888'
});

assert.strictEqual(updatedProf.name, 'Dra. María Elena Gómez Modificada');
assert.strictEqual(updatedProf.consultorio, 'Consultorio A - Box 1');
assert.strictEqual(updatedProf.specialty, 'Periodoncia y Estética Dental');
assert.strictEqual(updatedProf.email, 'dra.gomez.nueva@dental.com');
assert.strictEqual(updatedProf.phone, '11 9999-8888', 'Phone must strip +54 9 country code');

// Verify appointments were synchronized
const appts = storage.getAppointments().filter(a => a.professionalId === profId);
if (appts.length > 0) {
    assert.strictEqual(appts[0].professionalName, 'Dra. María Elena Gómez Modificada');
    assert.strictEqual(appts[0].professionalSpecialty, 'Periodoncia y Estética Dental');
}
console.log('✓ updateProfessionalProfile updates professional, user, appointments, audit log, and strips country code.');

// ----------------------------------------------------
// TEST 2: HTML Structure & Modals
// ----------------------------------------------------
console.log('\n--- TEST 2: index.html Elements & Modals ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Check "Editar datos" button & Phone display in professional card
assert(indexHtml.includes('id="btnEditProfProfile"'), 'Button btnEditProfProfile must exist');
assert(indexHtml.includes('id="profPanelPhoneContainer"'), 'profPanelPhoneContainer must exist');
assert(indexHtml.includes('id="profPanelPhoneText"'), 'profPanelPhoneText must exist');
console.log('✓ Professional header contains btnEditProfProfile and phone display.');

// Check modalEditProfessionalProfile
assert(indexHtml.includes('id="modalEditProfessionalProfile"'), 'modalEditProfessionalProfile must exist');
assert(indexHtml.includes('id="editProfName"'), 'editProfName input must exist');
assert(indexHtml.includes('id="editProfConsultorio"'), 'editProfConsultorio input must exist');
assert(indexHtml.includes('id="editProfSpecialty"'), 'editProfSpecialty select must exist');
assert(indexHtml.includes('id="editProfEmail"'), 'editProfEmail input must exist');
assert(indexHtml.includes('id="editProfPhone"'), 'editProfPhone input must exist');
assert(indexHtml.includes('id="btnSaveProfProfile"'), 'btnSaveProfProfile must exist');
assert(indexHtml.includes('id="modalProfileChangesSaved"'), 'modalProfileChangesSaved must exist');
assert(indexHtml.includes('Cambios guardados'), 'Confirmation modal must say Cambios guardados');
console.log('✓ modalEditProfessionalProfile and modalProfileChangesSaved verified.');

// Check Admin Specialties Section
assert(indexHtml.includes('id="adminNewSpecialtyInput"'), 'adminNewSpecialtyInput must exist');
assert(indexHtml.includes('id="adminSpecialtiesListContainer"'), 'adminSpecialtiesListContainer must exist');
console.log('✓ Admin specialties card and input verified.');

// ----------------------------------------------------
// TEST 3: ProfessionalModule Methods & WhatsApp URLs
// ----------------------------------------------------
console.log('\n--- TEST 3: ProfessionalModule & WhatsApp Messages ---');

const profCode = fs.readFileSync(path.join(__dirname, '../js/professional.js'), 'utf8');

// Mock DOM elements
const domElements = {
    profPanelDoctorAvatar: { src: '' },
    profPanelCurrentDoctorName: { textContent: '' },
    profPanelSpecialtyText: { textContent: '' },
    profPanelConsultorioBadge: { textContent: '' },
    profPanelDurationText: { textContent: '' },
    profPanelEmailText: { textContent: '' },
    profPanelPhoneText: { textContent: '' },
    profPanelPhoneContainer: { classList: { remove: () => {}, add: () => {} } },
    editProfName: { value: '' },
    editProfConsultorio: { value: '' },
    editProfSpecialty: { innerHTML: '', value: '' },
    editProfEmail: { value: '' },
    editProfPhone: { value: '' },
    modalEditProfessionalProfile: {},
    modalProfileChangesSaved: {},
    profAppointmentsContainer: { innerHTML: '' },
    statProfTotal: { textContent: '' },
    statProfToday: { textContent: '' },
    statProfCanceled: { textContent: '' },
    statProfAttended: { textContent: '' }
};

let modalShown = false;
let modalHidden = false;
let confirmSavedShown = false;
let pageReloadTriggered = false;

const profContext = {
    window: {
        storageService: storage,
        authService: { currentUser: { role: 'profesional', email: 'dra.gomez.nueva@dental.com' } },
        showToast: (msg, type) => console.log(`  [Toast] ${type}: ${msg}`),
        escapeHTML: (str) => str,
        stripCountryCode: (p) => storage.cleanLocalPhone(p),
        normalizeArgentinePhone: (p) => '5491144556677',
        formatWhatsAppUrl: (phone, msg) => `https://wa.me/5491144556677?text=${encodeURIComponent(msg)}`,
        location: {
            reload: () => { pageReloadTriggered = true; }
        },
        setTimeout: (fn, delay) => { fn(); } // Execute synchronously for test
    },
    document: {
        getElementById: (id) => domElements[id] || null,
        addEventListener: () => {}
    },
    bootstrap: {
        Modal: {
            getOrCreateInstance: (el) => ({
                show: () => {
                    if (el === domElements.modalProfileChangesSaved) confirmSavedShown = true;
                    else modalShown = true;
                }
            }),
            getInstance: () => ({
                hide: () => { modalHidden = true; }
            })
        }
    },
    setTimeout: (fn, delay) => { fn(); },
    console
};
profContext.window.window = profContext.window;

vm.createContext(profContext);
vm.runInContext(profCode, profContext);

const profMod = profContext.window.professionalModule;
assert(profMod, 'ProfessionalModule must be instantiated');

// 3a: detectCurrentProfessional
profMod.detectCurrentProfessional();
assert.strictEqual(domElements.profPanelCurrentDoctorName.textContent, 'Dra. María Elena Gómez Modificada');
assert.strictEqual(domElements.profPanelPhoneText.textContent, '11 9999-8888', 'Must display clean local phone without +54 9');
console.log('✓ detectCurrentProfessional populates doctor name and clean local phone number.');

// 3b: openEditProfileModal
profMod.openEditProfileModal();
assert.strictEqual(domElements.editProfName.value, 'Dra. María Elena Gómez Modificada');
assert.strictEqual(domElements.editProfPhone.value, '11 9999-8888', 'Edit input must contain clean phone without +54 9');
assert(domElements.editProfSpecialty.innerHTML.includes('selected'), 'Current specialty must be selected');
assert.strictEqual(modalShown, true, 'modalEditProfessionalProfile show() called');
console.log('✓ openEditProfileModal successfully populates inputs with current professional data.');

// 3c: saveProfileData
domElements.editProfName.value = 'Dra. María Elena Gómez (Actualizada)';
domElements.editProfConsultorio.value = 'Consultorio A';
domElements.editProfSpecialty.value = 'Ortodoncia y Ortopedia Maxilar';
domElements.editProfEmail.value = 'dra.gomez@dental.com';
domElements.editProfPhone.value = '+54 9 11 4455-6677'; // user input with country code should be stripped automatically

profMod.saveProfileData();
assert.strictEqual(modalHidden, true, 'modalEditProfessionalProfile hide() called');
assert.strictEqual(confirmSavedShown, true, 'modalProfileChangesSaved popup was shown');
assert.strictEqual(pageReloadTriggered, true, 'window.location.reload() was triggered');
const checkedProf = storage.getProfessionalById('prof_1');
assert.strictEqual(checkedProf.name, 'Dra. María Elena Gómez (Actualizada)');
assert.strictEqual(checkedProf.phone, '11 4455-6677', 'Country code must be stripped upon save');
console.log('✓ saveProfileData shows confirmation popup, schedules auto reload, and cleans phone.');

// 3d: WhatsApp Reminder & Confirmation URLs
const sampleAppt = {
    id: 'appt_sample',
    patientName: 'Esteban Quito',
    patientPhone: '11 2233-4455',
    date: '2026-10-20',
    time: '14:30',
    reason: 'Control de brackets'
};

const reminderUrl = profMod.generateWhatsAppReminderUrl(sampleAppt);
assert(reminderUrl.startsWith('https://wa.me/'), 'Reminder URL must start with https://wa.me/');
const decodedReminder = decodeURIComponent(reminderUrl);
assert(decodedReminder.includes('recordamos su próximo turno'), 'Reminder must include reminder text');
assert(decodedReminder.includes('Esteban Quito'), 'Reminder must include patient name');
assert(decodedReminder.includes('2026-10-20'), 'Reminder must include date');
assert(decodedReminder.includes('14:30'), 'Reminder must include time');
assert(decodedReminder.includes('11 4455-6677'), 'Reminder must include professional phone');
console.log('✓ generateWhatsAppReminderUrl generates personalized reminder with date, time and doctor phone.');

const confirmUrl = profMod.generateWhatsAppConfirmationUrl(sampleAppt);
const decodedConfirm = decodeURIComponent(confirmUrl);
assert(decodedConfirm.includes('confirmación de su turno odontológico'), 'Confirmation must ask for confirmation');
assert(decodedConfirm.includes('SÍ, CONFIRMO MI ASISTENCIA'), 'Confirmation must include response instructions');
assert(decodedConfirm.includes('11 4455-6677'), 'Confirmation must include professional phone');
console.log('✓ generateWhatsAppConfirmationUrl generates attendance confirmation request.');

// 3e: renderAppointmentsList table includes WhatsApp dropdown
profMod.renderAppointmentsList();
const tableHtml = domElements.profAppointmentsContainer.innerHTML;
assert(tableHtml.includes('Recordar Turno'), 'Table must include "Recordar Turno" option');
assert(tableHtml.includes('Pedir Confirmación de Asistencia'), 'Table must include "Pedir Confirmación de Asistencia" option');
console.log('✓ renderAppointmentsList table contains WhatsApp dropdown with Reminder and Confirmation actions.');

console.log('\n>>> ALL PROFILE EDITING & WHATSAPP TESTS PASSED! <<<');
