# 🦷 Centro Odontológico Sonrisas & Salud - Agenda Virtual

Sistema web moderno, accesible y responsivo desarrollado con **HTML5, Bootstrap 5.3 y JavaScript modular**, diseñado para centros odontológicos con múltiples especialistas, secretaría, administración y reserva directa para pacientes.

---

## 🌟 Novedades y Características Principales

### 1. 🏠 Página de Inicio e Intro para Pacientes
- **Encabezado Limpio del Centro:** Presenta el nombre del centro y las 5 especialidades destacadas (Ortodoncia, Implantología, Odontopediatría, Endodoncia y Periodoncia/Estética).
- **Carrusel Automático de 5 Especialistas:**
  1. **Dra. María Elena Gómez** – Ortodoncia y Ortopedia Maxilar (Consultorio A)
  2. **Dr. Javier Morales** – Implantología y Cirugía Oral (Consultorio B)
  3. **Dra. Sofía Valenzuela** – Odontopediatría y Prevención Infantil (Consultorio C)
  4. **Dr. Fernando Rossi** – Endodoncia y Tratamiento de Conducto (Consultorio D)
  5. **Dra. Luciana Benítez** – Periodoncia y Estética Dental (Consultorio E)
- **2 Botones de Acción Directos (Sin Información Extra Repetida):**
  - **📅 [Reservar Turno]:** Despliega el flujo guiado en 2 pasos:
    - **Paso 1 (Selección de Turno):** Selector del profesional odontólogo/a, recuadro dinámico con foto, consultorio y duración exacta de consulta (15, 30, 45 o 60 min), selector de motivos específicos del profesional, selector de fecha y grilla de horarios disponibles.
    - **Validación Estricta con Foco Automático:** Al presionar el botón *"Siguiente: Datos de Contacto"*, el sistema valida todos los campos obligatorios, remarca en rojo los faltantes (`is-invalid`) y traslada suavemente la vista y el foco (`focus()`) al **primer elemento superior que le falte completar**.
    - **Paso 2 (Datos del Paciente y Confirmación):** Resumen de la cita y formulario de contacto (Nombre, Correo, WhatsApp, Notas) con botón para confirmar o volver al Paso 1 a modificar la cita sin perder datos.
  - **❌ [Cancelar Turno]:** Muestra de forma directa la búsqueda por correo y lista de turnos activos para cancelar con 1 clic.

---

### 2. 👩‍⚕️ Configuración Personalizada por Profesional
- **Motivos de Consulta Propios:** Cada odontólogo/a puede agregar, editar o eliminar los motivos de consulta específicos de su especialidad desde su panel. Los pacientes únicamente verán las opciones configuradas por el doctor que elijan.
- **Tiempos de Consulta Configurables:** Cada profesional selecciona la duración de su turno entre **15 minutos, 30 minutos, 45 minutos o 60 minutos (1 hora)**, adaptando la grilla de turnos generada.
- **Días y Horarios Semanales Fijos:** Activación de días (Lunes a Domingo) y hasta 2 turnos por día (Mañana y Tarde).
- **Bloqueo de Vacaciones / Feriados:** Fechas no laborables donde no se permitirán reservas.

---

### 3. 🛡️ Control Estricto de Roles por Administrador
- **Altas y Bajas Exclusivas:** Solo el Administrador tiene permisos para dar de alta nuevos odontólogos en el sistema o darlos de baja.
- **Creación y Asignación de Secretaría:** Solo el Administrador puede crear cuentas con el rol de Secretaría/Recepción o modificar los roles de los usuarios.

---

### 4. 📋 Rol de Secretaría / Recepción
- **Agenda General del Centro:** Visualiza las citas de todos los profesionales del día o de cualquier fecha en una tabla unificada.
- **Modo Solo Lectura:** Puede despachar recordatorios automáticos por WhatsApp y consultar pacientes, **sin poder alterar las agendas ni los horarios de los médicos**.

---

### 5. ♿ Accesibilidad Universal (WCAG AAA)
- **Lector de Pantalla por Voz (Web Speech API):** Asistente nativo para personas no videntes o con disminución visual (<kbd>Alt + V</kbd> para activar, <kbd>Alt + L</kbd> para escuchar sección).
- **Modos para Daltonismo:** Alto Contraste oscuro, Protanopía/Deuteranopía (sustitución rojo/verde) y badges con doble codificación textual entre corchetes (ej. `[Disponible]`, `[Ocupado]`).
- **Zoom de Texto:** Ajuste del tamaño tipográfico desde el 85% al 150%.
- **Modo Dislexia:** Tipografía amigable de alta legibilidad.

---

## 💻 Cómo Probar la Aplicación

1. Abra directamente [`index.html`](file:///c:/Users/Estudiante/Desktop/Escritorio%20Netbook/Proyectos%20personales/odontologia-agenda/index.html) en su navegador web.
2. Utilice el menú **"Probar Rol"** en la barra superior para alternar instantáneamente entre los perfiles de prueba:
   - **Ana López** (Secretaría / Recepción)
   - **Dra. María Elena Gómez** (Odontóloga - Ortodoncia)
   - **Dr. Javier Morales** (Odontólogo - Implantes)
   - **Martín Bossi** (Administrador General)
   - **Lucas Martínez** (Paciente)
