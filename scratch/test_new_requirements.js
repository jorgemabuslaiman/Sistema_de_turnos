const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: NEW USER REQUIREMENTS ===\n');

// ----------------------------------------------------
// TEST 1: Accessibility speak strictly disabled when isScreenReaderActive is false
// ----------------------------------------------------
console.log('--- TEST 1: Accessibility Voice Assistant Guard ---');

let spokenUtterances = [];
const mockSpeechSynthesis = {
    cancel: () => {},
    speak: (utterance) => { spokenUtterances.push(utterance); },
    getVoices: () => [{ lang: 'es-ES', name: 'Spanish Voice' }]
};

global.SpeechSynthesisUtterance = class {
    constructor(text) {
        this.text = text;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.lang = 'es-ES';
    }
};

const accessCode = fs.readFileSync(path.join(__dirname, '../js/accessibility.js'), 'utf8');

// Evaluate AccessibilityModule class
const vm = require('vm');
const accessContext = {
    window: {
        speechSynthesis: mockSpeechSynthesis
    },
    document: {
        body: { classList: { add: () => {}, remove: () => {} } },
        getElementById: () => null,
        addEventListener: () => {}
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    SpeechSynthesisUtterance: global.SpeechSynthesisUtterance,
    console
};
vm.createContext(accessContext);
vm.runInContext(accessCode, accessContext);

const accessibilityModule = accessContext.window.accessibilityModule;
assert(accessibilityModule, 'AccessibilityModule should be instantiated');

// 1a: isScreenReaderActive is false by default
assert.strictEqual(accessibilityModule.isScreenReaderActive, false, 'Should be inactive by default');
spokenUtterances = [];
accessibilityModule.speak('¡Felicitaciones! Turno reservado para el 2026-10-19 a las 10:00 hs');
assert.strictEqual(spokenUtterances.length, 0, 'Voice must NOT speak when isScreenReaderActive is false!');
console.log('✓ Inactive state: speak() produced 0 spoken utterances as expected.');

// 1b: Turn screen reader on
accessibilityModule.isScreenReaderActive = true;
accessibilityModule.speak('Turno reservado con éxito');
assert.strictEqual(spokenUtterances.length, 1, 'Voice MUST speak when isScreenReaderActive is true');
assert.strictEqual(spokenUtterances[0].text, 'Turno reservado con éxito');
console.log('✓ Active state: speak() properly spoken when activated.');

// ----------------------------------------------------
// TEST 2: HTML checks (profFilterStatus, statProfCanceled, modalProfCancelAppointment)
// ----------------------------------------------------
console.log('\n--- TEST 2: index.html Professional Controls & Modals ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Check profFilterStatus options
const profFilterMatch = indexHtml.match(/<select class="form-select form-select-sm" id="profFilterStatus">([\s\S]*?)<\/select>/);
assert(profFilterMatch, 'profFilterStatus dropdown must exist in index.html');
const profFilterContent = profFilterMatch[1];
assert(profFilterContent.includes('<option value="cancelado">Cancelados</option>'), 'profFilterStatus must include Cancelados option');
assert(!profFilterContent.includes('pendiente'), 'profFilterStatus must NOT include Pendientes');
console.log('✓ profFilterStatus contains Cancelados and does not contain Pendientes.');

// Check KPI Card
assert(indexHtml.includes('id="statProfCanceled"'), 'statProfCanceled KPI element must exist');
assert(!indexHtml.includes('id="statProfPending"'), 'statProfPending KPI element must be removed');
console.log('✓ Professional KPI card changed from Pendientes to Cancelados.');

// Check Bootstrap Modal
assert(indexHtml.includes('id="modalProfCancelAppointment"'), 'modalProfCancelAppointment Bootstrap modal must exist');
assert(indexHtml.includes('id="profCancelPatientName"'), 'Modal must display patient name');
assert(indexHtml.includes('id="profCancelDateTime"'), 'Modal must display appointment date/time');
assert(indexHtml.includes('id="profCancelReasonInput"'), 'Modal must have optional reason input');
assert(indexHtml.includes('id="btnConfirmProfCancelAppt"'), 'Modal must have confirm cancellation button');
console.log('✓ modalProfCancelAppointment Bootstrap modal structure verified.');

// ----------------------------------------------------
// TEST 3: Professional Module Cancellation Logic
// ----------------------------------------------------
console.log('\n--- TEST 3: ProfessionalModule Cancellation & Stats ---');

const profCode = fs.readFileSync(path.join(__dirname, '../js/professional.js'), 'utf8');

let appointmentsDb = [
    { id: 'appt_1', professionalId: 'prof_1', patientName: 'Ana Gomez', patientEmail: 'ana@example.com', date: '2026-10-15', time: '10:00', reason: 'Limpieza', status: 'confirmado' },
    { id: 'appt_2', professionalId: 'prof_1', patientName: 'Carlos Ruiz', patientEmail: 'carlos@example.com', date: '2026-10-15', time: '11:00', reason: 'Ortodoncia', status: 'cancelado' }
];

const mockStorage = {
    getAppointments: () => appointmentsDb,
    updateAppointmentStatus: (id, newStatus, reason) => {
        const found = appointmentsDb.find(a => a.id === id);
        if (found) {
            found.status = newStatus;
            if (reason) found.cancelReason = reason;
        }
    },
    getProfessionalById: () => ({ id: 'prof_1', name: 'Dra. María González', specialty: 'Ortodoncia' }),
    getProfessionals: () => [{ id: 'prof_1', name: 'Dra. María González' }],
    getSettings: () => ({ clinicName: 'Sonrisas & Salud', address: 'Av. Corrientes 1234' })
};

const domElements = {
    profCancelPatientName: { textContent: '' },
    profCancelDateTime: { textContent: '' },
    profCancelApptReason: { textContent: '' },
    profCancelReasonInput: { value: '' },
    modalProfCancelAppointment: {},
    statProfTotal: { textContent: '' },
    statProfToday: { textContent: '' },
    statProfCanceled: { textContent: '' },
    statProfAttended: { textContent: '' }
};

let modalShown = false;
let modalHidden = false;

const profContext = {
    window: {
        storageService: mockStorage,
        authService: { currentUser: { role: 'profesional', email: 'maria@sonrisas.com' } },
        showToast: (msg, type) => console.log(`  [Toast] ${type}: ${msg}`),
        escapeHTML: (str) => str,
        formatWhatsAppUrl: () => '#'
    },
    document: {
        getElementById: (id) => domElements[id] || null,
        addEventListener: () => {}
    },
    bootstrap: {
        Modal: {
            getOrCreateInstance: () => ({
                show: () => { modalShown = true; }
            }),
            getInstance: () => ({
                hide: () => { modalHidden = true; }
            })
        }
    },
    console
};
profContext.window.window = profContext.window;

vm.createContext(profContext);
vm.runInContext(profCode, profContext);

const profMod = profContext.window.professionalModule;
assert(profMod, 'ProfessionalModule must be loaded');

// Test openCancelModal
profMod.openCancelModal('appt_1');
assert.strictEqual(profMod.appointmentToCancelId, 'appt_1', 'appointmentToCancelId should be appt_1');
assert.strictEqual(domElements.profCancelPatientName.textContent, 'Ana Gomez');
assert.strictEqual(modalShown, true, 'Bootstrap modal show() must have been called');
console.log('✓ openCancelModal opens Bootstrap modal with patient details.');

// Test confirmCancelAppointment with optional reason
domElements.profCancelReasonInput.value = 'Reprogramación acordada por teléfono';
profMod.confirmCancelAppointment();

const updatedAppt = appointmentsDb.find(a => a.id === 'appt_1');
assert.strictEqual(updatedAppt.status, 'cancelado', 'Status should be updated to cancelado');
assert.strictEqual(updatedAppt.cancelReason, 'Reprogramación acordada por teléfono');
assert.strictEqual(modalHidden, true, 'Bootstrap modal hide() must have been called');
console.log('✓ confirmCancelAppointment successfully cancels turno with optional reason and hides modal.');

// Test Stats
profMod.renderStats();
assert.strictEqual(domElements.statProfCanceled.textContent, 2, 'Canceled appointments count must be 2');
console.log('✓ renderStats computes and displays canceled appointments count accurately.');

console.log('\n>>> ALL NEW REQUIREMENTS TESTS PASSED SUCCESSFULLY! <<<');
