import { type Locale } from 'next-intl'

export type DemoLocale = Locale

export interface DemoExperience {
  language: DemoLocale
  location: string
  hours: number
  months: number
  description: string
  tasks: string[]
}

export const EXPERIENCES: Record<string, DemoExperience> = {
  'food-bank': {
    language: 'en',
    location: 'Milan, Italy',
    hours: 140,
    months: 6,
    description:
      'Weekly food collection and distribution at a neighbourhood food bank, with an extra shift during the winter appeal.',
    tasks: [
      'Sorted and checked donated food',
      'Welcomed families and explained how the distribution works',
      'Led a Saturday team of five volunteers',
      'Kept the stock register up to date',
    ],
  },
  'food-bank-draft': {
    language: 'en',
    location: 'Milan, Italy',
    hours: 0,
    months: 0,
    description: 'Organising the spring collection drive in three local schools.',
    tasks: ['Planned the school calendar', 'Prepared flyers for the parents'],
  },
  'after-school': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 180,
    months: 8,
    description:
      'Aiuto compiti e laboratori creativi per ragazzi delle scuole medie in un doposcuola di quartiere, due pomeriggi a settimana.',
    tasks: [
      'Seguito sei ragazzi nei compiti di matematica e italiano',
      'Preparato un laboratorio mensile di teatro',
      'Tenuto i contatti con le famiglie',
    ],
  },
  'welcome-desk': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 120,
    months: 5,
    description:
      'Accoglienza e orientamento ai servizi del territorio per giovani arrivati da poco in città, presso uno sportello di quartiere.',
    tasks: [
      'Accolto le persone allo sportello',
      'Compilato schede di orientamento con un mediatore',
      'Organizzato incontri di conversazione in italiano',
    ],
  },
  'youth-centre': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 200,
    months: 9,
    description:
      'Animazione e supporto alle attività serali di un centro giovanile, con tornei, serate di cinema e uno spazio studio.',
    tasks: [
      'Organizzato tornei di calcetto e ping pong',
      'Gestito il bar sociale con altri tre volontari',
      'Accompagnato i ragazzi più piccoli nello spazio studio',
    ],
  },
  'community-garden': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 110,
    months: 4,
    description:
      'Cura di un orto condiviso nel quartiere e laboratori di giardinaggio aperti ai bambini della scuola elementare.',
    tasks: [
      'Pianificato la semina di stagione',
      'Guidato i laboratori del sabato mattina',
      'Raccolto e distribuito i prodotti agli abitanti',
    ],
  },
  'senior-visits': {
    language: 'it',
    location: 'Monza, Italia',
    hours: 130,
    months: 6,
    description:
      'Visite settimanali e attività di compagnia in una residenza per anziani, con letture ad alta voce e giochi di memoria.',
    tasks: [
      'Accompagnato gli ospiti nelle attività del pomeriggio',
      'Letto il giornale ad alta voce in piccoli gruppi',
      'Segnalato alla coordinatrice i bisogni emersi',
    ],
  },
  'language-cafe': {
    language: 'en',
    location: 'Milan, Italy',
    hours: 110,
    months: 4,
    description: 'Fortnightly language café at the public library, where residents practise Italian and English.',
    tasks: ['Attended the meetings', 'Helped set up the room'],
  },
  'sports-camp': {
    language: 'it',
    location: 'Cinisello Balsamo, Italia',
    hours: 105,
    months: 3,
    description: 'Centro estivo per bambini dai sei ai dieci anni organizzato da una parrocchia del territorio.',
    tasks: [
      'Animato giochi di squadra',
      'Assistito i bambini durante i pasti',
      'Preparato il materiale per i laboratori',
    ],
  },
  'repair-cafe': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 125,
    months: 7,
    description:
      'Repair Café mensile ai Navigli: riparazione di piccoli elettrodomestici e abiti con la guida di volontari esperti.',
    tasks: [
      'Accolto i visitatori e raccolto gli oggetti da riparare',
      'Riparato abiti e piccoli elettrodomestici',
      'Insegnato le basi del cucito ai nuovi arrivati',
    ],
  },
  library: {
    language: 'en',
    location: 'Milan, Italy',
    hours: 160,
    months: 8,
    description:
      'Reading hours for children and a book delivery service for neighbours who cannot leave home, run from a civic library.',
    tasks: [
      'Read aloud to groups of up to fifteen children',
      'Delivered books to eleven housebound readers',
      'Catalogued donated books',
    ],
  },
  'city-parks': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 115,
    months: 5,
    description: 'Giornate di pulizia e piccola manutenzione dei parchi urbani insieme a un gruppo ambientalista.',
    tasks: [
      'Coordinato squadre di dieci volontari nelle giornate di pulizia',
      'Mappato le aree da curare',
      'Raccolto dati sui rifiuti trovati',
    ],
  },
  'italian-school': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 150,
    months: 6,
    description: 'Scuola di italiano per adulti stranieri, con lezioni serali due volte a settimana.',
    tasks: [
      'Condotto lezioni di conversazione per gruppi di otto persone',
      'Preparato schede di lessico quotidiano',
      'Seguito individualmente chi era in difficoltà',
    ],
  },
  'soup-kitchen': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 100,
    months: 4,
    description: 'Servizio serale alla mensa solidale di quartiere, tre sere al mese.',
    tasks: ['Preparato e servito la cena', 'Accolto gli ospiti', 'Sistemato la sala a fine serata'],
  },
  'food-appeal': {
    language: 'it',
    location: 'Milano, Italia',
    hours: 120,
    months: 5,
    description: 'Raccolta alimentare nei supermercati e smistamento dei pacchi per le famiglie assistite.',
    tasks: [
      'Raccolto alimenti davanti ai supermercati',
      'Smistato e pesato i pacchi',
      'Consegnato i pacchi a domicilio',
    ],
  },
  'valencia-food-bank': {
    language: 'es',
    location: 'Valencia, España',
    hours: 150,
    months: 6,
    description:
      'Recogida y reparto semanal de alimentos en un banco de alimentos de barrio, con campañas especiales en Navidad.',
    tasks: [
      'Clasifiqué y revisé los alimentos donados',
      'Atendí a las familias durante el reparto',
      'Coordiné el turno de los sábados',
    ],
  },
  'elder-company': {
    language: 'es',
    location: 'Valencia, España',
    hours: 110,
    months: 4,
    description: 'Acompañamiento semanal a personas mayores que viven solas en Benimaclet.',
    tasks: [
      'Visité a cuatro personas cada semana',
      'Les ayudé con gestiones sencillas',
      'Organicé una merienda mensual',
    ],
  },
  'school-support': {
    language: 'es',
    location: 'Valencia, España',
    hours: 140,
    months: 5,
    description: 'Clases de apoyo escolar para niños de primaria en Russafa, tres tardes por semana.',
    tasks: ['Ayudé con los deberes de lengua y matemáticas', 'Preparé juegos de lectura', 'Hablé con las familias'],
  },
}

export interface DemoSkillText {
  evidence: Record<DemoLocale, string>
  statement: Record<DemoLocale, string>
}

export const SKILL_TEXTS: Record<string, DemoSkillText> = {
  'team-work': {
    evidence: {
      en: 'I shared the shifts with four other volunteers and we agreed who does what before every session.',
      es: 'Compartí los turnos con otros cuatro voluntarios y acordábamos el reparto de tareas antes de cada sesión.',
      it: 'Ho condiviso i turni con altri quattro volontari e prima di ogni sessione ci mettevamo d’accordo sui compiti.',
    },
    statement: {
      en: 'Works well in a team, offers help early and keeps the group focused on the shared goal.',
      es: 'Trabaja bien en equipo, ofrece ayuda a tiempo y mantiene al grupo centrado en el objetivo común.',
      it: 'Lavora bene in squadra, offre aiuto per tempo e mantiene il gruppo concentrato sull’obiettivo comune.',
    },
  },
  'communication-and-active-listening': {
    evidence: {
      en: 'I learned to ask one more question before answering, especially with people who do not speak much.',
      es: 'Aprendí a hacer una pregunta más antes de responder, sobre todo con las personas que hablan poco.',
      it: 'Ho imparato a fare una domanda in più prima di rispondere, soprattutto con chi parla poco.',
    },
    statement: {
      en: 'Listens carefully, checks understanding and explains things in a clear and friendly way.',
      es: 'Escucha con atención, comprueba que ha entendido y explica las cosas con claridad y cercanía.',
      it: 'Ascolta con attenzione, verifica di aver capito e spiega le cose in modo chiaro e cordiale.',
    },
  },
  responsibility: {
    evidence: {
      en: 'I kept the keys and the opening time for my shift, and I told the coordinator when I could not come.',
      es: 'Me encargué de las llaves y de la hora de apertura de mi turno, y avisaba cuando no podía ir.',
      it: 'Mi occupavo delle chiavi e dell’orario di apertura del mio turno e avvisavo quando non potevo esserci.',
    },
    statement: {
      en: 'Reliable and punctual, takes ownership of tasks and follows them through to the end.',
      es: 'Fiable y puntual, asume sus tareas y las lleva hasta el final.',
      it: 'Affidabile e puntuale, si prende carico dei compiti e li porta a termine.',
    },
  },
  initiative: {
    evidence: {
      en: 'I noticed we lost time at the start of each shift, so I proposed a short checklist and wrote it with the team.',
      es: 'Me di cuenta de que perdíamos tiempo al empezar cada turno y propuse una lista de tareas que redactamos juntos.',
      it: 'Ho notato che perdevamo tempo a inizio turno, così ho proposto una breve lista di controllo scritta con il gruppo.',
    },
    statement: {
      en: 'Spots what needs doing and proposes practical improvements without waiting to be asked.',
      es: 'Detecta lo que hay que hacer y propone mejoras prácticas sin esperar a que se lo pidan.',
      it: 'Vede cosa c’è da fare e propone miglioramenti concreti senza aspettare che glielo si chieda.',
    },
  },
  empathy: {
    evidence: {
      en: 'Some people arrived tired or embarrassed, so I started with a simple hello and let them set the pace.',
      es: 'Algunas personas llegaban cansadas o avergonzadas, así que empezaba con un saludo sencillo y las dejaba marcar el ritmo.',
      it: 'Alcune persone arrivavano stanche o in imbarazzo, quindi iniziavo con un saluto semplice e lasciavo decidere a loro il ritmo.',
    },
    statement: {
      en: 'Shows genuine care for others, adapts to each person and creates a calm, respectful atmosphere.',
      es: 'Muestra interés genuino por los demás, se adapta a cada persona y crea un ambiente tranquilo y respetuoso.',
      it: 'Mostra sincera attenzione agli altri, si adatta a ciascuno e crea un clima sereno e rispettoso.',
    },
  },
  'self-awareness': {
    evidence: {
      en: 'After each session I wrote down what went well and what I would change, and I discussed it with my tutor.',
      es: 'Después de cada sesión anotaba qué había ido bien y qué cambiaría, y lo comentaba con mi tutor.',
      it: 'Dopo ogni sessione annotavo cosa era andato bene e cosa avrei cambiato e ne parlavo con il mio tutor.',
    },
    statement: {
      en: 'Knows their strengths and limits, asks for feedback and uses it to grow.',
      es: 'Conoce sus fortalezas y límites, pide opinión y la utiliza para crecer.',
      it: 'Conosce i propri punti di forza e i propri limiti, chiede feedback e lo usa per crescere.',
    },
  },
  flexibility: {
    evidence: {
      en: 'When the room changed at the last minute I rebuilt the activity in ten minutes and kept the group together.',
      es: 'Cuando cambiaron la sala a última hora rehíce la actividad en diez minutos y mantuve al grupo unido.',
      it: 'Quando la sala è cambiata all’ultimo momento ho riorganizzato l’attività in dieci minuti tenendo unito il gruppo.',
    },
    statement: {
      en: 'Adapts quickly to changes and finds workable solutions when the plan does not hold.',
      es: 'Se adapta rápido a los cambios y encuentra soluciones viables cuando el plan falla.',
      it: 'Si adatta in fretta ai cambiamenti e trova soluzioni praticabili quando il piano salta.',
    },
  },
  'problem-solving': {
    evidence: {
      en: 'We ran out of boxes on a busy day, so I asked nearby shops for spare ones and reorganised the stations.',
      es: 'Un día de mucho trabajo nos quedamos sin cajas, así que pedí algunas a los comercios cercanos y reorganicé los puestos.',
      it: 'In una giornata piena siamo rimasti senza scatole, così ne ho chieste alcune ai negozi vicini e ho riorganizzato le postazioni.',
    },
    statement: {
      en: 'Analyses problems calmly, tries simple options first and involves others in the solution.',
      es: 'Analiza los problemas con calma, prueba primero las opciones sencillas e implica a los demás.',
      it: 'Analizza i problemi con calma, prova prima le soluzioni semplici e coinvolge gli altri.',
    },
  },
  'conflict-management': {
    evidence: {
      en: 'Two volunteers disagreed about the schedule, so I listened to both and we agreed on a rotation.',
      es: 'Dos voluntarios discrepaban sobre el horario; escuché a ambos y acordamos una rotación.',
      it: 'Due volontari non erano d’accordo sugli orari, così ho ascoltato entrambi e abbiamo concordato una rotazione.',
    },
    statement: {
      en: 'Stays neutral in disagreements, helps people express their needs and looks for fair compromises.',
      es: 'Se mantiene neutral en los desacuerdos, ayuda a expresar las necesidades y busca acuerdos justos.',
      it: 'Resta neutrale nei disaccordi, aiuta le persone a esprimere i propri bisogni e cerca compromessi equi.',
    },
  },
  'organization-and-time-management': {
    evidence: {
      en: 'I planned the weekly tasks on a shared sheet and split them in blocks, so nothing piled up at the end.',
      es: 'Planifiqué las tareas semanales en una hoja compartida y las dividí en bloques para que nada se acumulara al final.',
      it: 'Ho pianificato i compiti settimanali su un foglio condiviso e li ho divisi in blocchi, così nulla si accumulava alla fine.',
    },
    statement: {
      en: 'Plans ahead, sets priorities and meets deadlines while keeping the team informed.',
      es: 'Planifica con antelación, fija prioridades y cumple los plazos manteniendo informado al equipo.',
      it: 'Pianifica in anticipo, stabilisce le priorità e rispetta le scadenze tenendo informato il gruppo.',
    },
  },
}

export const REFLECTIONS: Record<DemoLocale, string[]> = {
  en: [
    'This course showed me that small habits make a big difference. I will keep practising them in my next volunteering shifts.',
    'I recognised myself in the lunch story and realised I often decide alone. Next time I will ask the team before I act.',
    'The practice questions were harder than I expected, but the explanations helped me understand what I should do differently.',
  ],
  es: [
    'Este curso me enseñó que los pequeños hábitos marcan una gran diferencia. Seguiré practicándolos en mis próximos turnos de voluntariado.',
    'Me reconocí en la historia del almuerzo y me di cuenta de que a menudo decido sola. La próxima vez preguntaré al equipo antes de actuar.',
    'Las preguntas de práctica fueron más difíciles de lo que esperaba, pero las explicaciones me ayudaron a entender qué debo hacer distinto.',
  ],
  it: [
    'Questo corso mi ha mostrato che le piccole abitudini fanno una grande differenza. Continuerò a metterle in pratica nei prossimi turni di volontariato.',
    'Mi sono riconosciuto nella storia del pranzo e ho capito che spesso decido da solo. La prossima volta chiederò al gruppo prima di agire.',
    'Le domande di pratica erano più difficili del previsto, ma le spiegazioni mi hanno aiutato a capire cosa fare in modo diverso.',
  ],
}

export const RATING_COMMENTS: Record<DemoLocale, string[]> = {
  en: [
    'Clear tasks, a coordinator who answers quickly and a tutor who made the certificate process simple.',
    'I felt trusted from the first week. More training on the first day would have helped.',
  ],
  es: [
    'Tareas claras, una coordinadora que responde rápido y un proceso de certificación muy sencillo.',
    'Me sentí acompañada desde la primera semana. Me habría gustado más formación el primer día.',
  ],
  it: [
    'Compiti chiari, una coordinatrice che risponde in fretta e un tutor che ha reso semplice il percorso di certificazione.',
    'Mi sono sentita coinvolta fin dalla prima settimana. Un po’ di formazione in più il primo giorno sarebbe stata utile.',
  ],
}

export const ORGANIZATION_DESCRIPTIONS: Record<string, Record<DemoLocale, string>> = {
  ponte: {
    en: 'Ponte Volunteers connects young people in Milan with local food, school and neighbourhood projects, and certifies the skills they build along the way.',
    es: 'Ponte Volunteers conecta a jóvenes de Milán con proyectos locales de alimentación, escuela y barrio, y certifica las competencias que desarrollan.',
    it: 'Ponte Volunteers mette in contatto i giovani di Milano con progetti locali di cibo, scuola e quartiere e certifica le competenze che sviluppano.',
  },
  red: {
    en: 'Red Solidaria coordinates volunteers across Valencia for food banks, school support and companionship for older neighbours.',
    es: 'Red Solidaria coordina a voluntarios de toda Valencia en bancos de alimentos, apoyo escolar y acompañamiento a personas mayores.',
    it: 'Red Solidaria coordina volontari in tutta Valencia per banchi alimentari, doposcuola e compagnia agli anziani del quartiere.',
  },
  'open-doors': {
    en: 'Open Doors Collective welcomes newcomers to Lisbon with language exchange, mentoring and community events.',
    es: 'Open Doors Collective acoge a las personas recién llegadas a Lisboa con intercambio de idiomas, mentoría y actividades comunitarias.',
    it: 'Open Doors Collective accoglie i nuovi arrivati a Lisbona con scambi linguistici, mentoring ed eventi comunitari.',
  },
}

export const APPLICATION_MOTIVATION =
  'We host around sixty young volunteers a year and want to give them a recognised certificate of the soft skills they gain, in particular for Erasmus+ and European Solidarity Corps participants.'

export const INVITATION_MESSAGES = {
  volunteer: 'Ciao Davide, ci farebbe piacere averti con noi nella campagna di raccolta di primavera. Ti aspettiamo!',
  tutor: 'Hi, we are looking for one more tutor to review the certificates of our volunteers. Would you join us?',
  red: 'Hola, nos encantaría contar contigo para el reparto de los sábados.',
}

export const JOIN_REQUEST_MESSAGES = {
  pending:
    'Ciao, ho sentito parlare di voi alla fiera del volontariato ai Navigli e vorrei unirmi alla squadra del banco alimentare.',
  accepted: 'Hi, I would like to help with the weekend activities and I am available on Saturdays.',
  rejected: 'Ciao, vorrei partecipare ma posso essere presente solo una volta al mese.',
  rejectedReply:
    'Grazie per l’interesse. Per ora cerchiamo volontari con almeno due turni al mese: riprova a settembre.',
}

export const REVIEW_COMMENTS = {
  approved: {
    en: 'Well documented experience and consistent evidence for each skill. Congratulations!',
    es: 'Experiencia bien documentada y evidencias coherentes para cada competencia. Enhorabuena.',
    it: 'Esperienza ben documentata e prove coerenti per ogni competenza. Complimenti!',
  },
  changes: {
    comment:
      'Il tuo impegno si vede, ma servono alcuni chiarimenti prima di approvare: aggiungi cosa hai fatto in concreto e rivedi le date.',
    tasks: 'Descrivi i compiti con verbi concreti: cosa facevi tu, con chi e con quale frequenza.',
    experience: 'Il periodo indicato non coincide con le ore dichiarate. Controlla le date di inizio e fine.',
  },
  rejected:
    'The tasks describe attending events rather than your own volunteering work, so the activity cannot be certified as it stands. Please speak with your coordinator and apply again with a description of your contribution.',
  revoked: 'Il totale delle ore era stato indicato in modo errato. Verrà emesso un nuovo certificato corretto.',
  revokedEs:
    'El certificado se emitió con datos de otra persona voluntaria. Se emitirá uno nuevo con los datos correctos.',
  suspended: 'Repeated spam in profile fields',
}
