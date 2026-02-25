const textTranslations = {
    //Antikeimeno me oles ta keimena tis istoselidas sta ellhnika.
    //Gia kathe glwssa exw titles (pageTitle, Title), minima (loading, popups), buttons text, hmeres kai mines ,
    //locale gia format wron/hmerominion: kwdikos glossas kai morfopoihsh gia ton browser 
        el: {
            pageTitle: 'Κράτηση',
            Title: 'Κλείσε τη θέση σου',
            availability: 'Διαθεσιμότητα για',
            spotsLeftTemplate: 'Απομένουν {spots} θέσεις',
            full: 'Πλήρες',
            capacityLabel: 'Χωρητικότητα:',
            loading: 'Φόρτωση μαθημάτων...',
            noSessions: 'Δεν υπάρχουν μαθήματα για αυτή την ημέρα.',
            loginRequiredTitle: 'Απαιτείται σύνδεση',
            loginRequiredMessage: 'Πρέπει να είσαι συνδεδεμένος/η για να κάνεις κράτηση.<br><br>Παρακαλώ συνδέσου για να συνεχίσεις.',
            waitlistLoginRequiredMessage: 'Πρέπει να είσαι συνδεδεμένος/η για να μπεις στη λίστα αναμονής.',
            loginButton: 'Σύνδεση',
            backButton: 'Πίσω',
            confirmBookingTitle: 'Επιβεβαίωση κράτησης',
            confirmBookingIntro: 'Είσαι σίγουρος/η ότι θέλεις να κλείσεις αυτή τη θέση;',
            levelLabel: 'Επίπεδο',
            dateLabel: 'Ημερομηνία',
            timeLabel: 'Ώρα',
            bookingConfirmedTitle: 'Η κράτηση ολοκληρώθηκε',
            bookingConfirmedMessage: 'Η θέση σου έχει κρατηθεί για:',
            alreadyBooked: 'Έχεις ήδη κρατήσει την θέση σου.',
            waitlistedTitle: 'Λίστα αναμονής',
            waitlistedMessage: 'θα σε ειδοποιήσουμε όταν ανοίξουν θέσεις:',
            ConfirmButton: 'Επιβεβαίωση',
            CancelButton: 'Ακήρωση',
            bookButton: 'Κράτηση',
            dayShort: ['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'],
            days: ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'],
            months: [
                'Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος',
                'Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'
            ],
            // locale gia format wron/hmerominion sta ellhnika
            locale: 'el-GR',
            errorLoading: 'Σφάλμα κατά τη φόρτωση:'
        }
    };

    // Poia glwssa einai energh tin sygkekrimenh stigmi stin istoselida
    // Default 'el' 
    let currentLang = 'el';
    
    function replaceSpotsLeft(template, x) {
    return template.replace('{spots}', x.spots); //tha antikatastisi thn metavliti spots dinamika sto kimeno spotsLeftTemplate
        }

    //BASIKES METABLITES
    let currentDate = new Date(); // trexousa date kai time (let giati sto calendar allazei o minas/mera changeMonth(+-1))
    let selectedDay = currentDate.getDate(); // pairnei mono thn trexon imera tou mina (15/11/2025 - hmera 15)
    const today = new Date(); //const metavliti den allazei h anafora ths (na kaneis nea ekxwrisi) gia thn simerini imera h opoia xrisimopoihte
    // molis anoigoume h otan kanoume refresh thn istoselida mas pernei se afti thn hmera (simera)
        
    function translate(text) {
        return (textTranslations.el && textTranslations.el[text]);
    } // ginete metafrasi tou text poy dinoyme analoga me thn epilegmenh glwssa apo to antikimeno textTranslations

  
    function setLang(language) { 
        currentLang = language; //trexousa glwssa
        updateStaticTexts(); // allazei ta statika texts tis instoselidas
        createCalendar(); // ftiaxnoume xana to imerologio me vasi thn glwssa dinamika
    }

    function updateStaticTexts() {
        document.title = textTranslations.el.pageTitle; //allazei ton titlo sto tab analoga me thn trexousa glwssa
        document.getElementById('Title').textContent = translate('Title');
    //allazei to text tou element sto html me onoma title diladi allazei ton book your spot analoga me thn glwssa epiloghs
        document.getElementById('currentMonth').textContent =
            `${textTranslations.el.months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }  //allazei to text tou element sti html me onoma current Month diladi ton trexon mina pou einai o xrhsths

  // Asygxroni synartisi pou dimiourgei/enimeronei to calendar gia ton trexonta mina
async function createCalendar() {

// Pairnoume etos kai mina apo to currentDate
const year = currentDate.getFullYear();
const month = currentDate.getMonth();

// Ypologizoume tin 1i mera tou mina
const firstDay = new Date(year, month, 1);
// Ypologizoume tin teleftaia mera tou mina 
const lastDay  = new Date(year, month + 1, 0);
// Synoliko plithos meron tou mina 
const daysInMonth = lastDay.getDate();
// Poia mera tis evdomadas einai i 1i tou mina (0=Kyriaki, 1=Deftera klp)
const startingDayOfWeek = firstDay.getDay();
// h proti hmera einai to 0 kai einai h kiriaki opote prepei na kanoume allages gia na einai h prvti h deftera (1) kai h teleftaia h kiriaki (0)
// Metatropi gia na xekiname apo Deftera ws 0 (anti gia Kyriaki)
// An einai Kyriaki (0), theloume na paei sto telos (6), alliws afairoume 1 
let startingDayOfWeekReal;

    if (startingDayOfWeek === 0) {
    startingDayOfWeekReal = 6;
    } else {
    startingDayOfWeekReal = startingDayOfWeek - 1;
            }

// Valloume se mia metavliti to css selector me onoma calendar (to "kouti" tou calendar)
const calendar = document.querySelector('.calendar'); 
//to html tou calendar
// Katharizoume to periexomeno tou gia na ksanadimiourgisoume to calendar
calendar.innerHTML = '';

// Ftiaxnoume tis kefalides meron (Mon–Sun) apo translations
textTranslations.el.dayShort.forEach(day => {
    // Dimiourgoume neo <div> element gia tin kefalida 
    const headerDayShort = document.createElement('div');
    headerDayShort.className = 'day-header';
    // Vazoume to keimeno 
    headerDayShort.textContent = day;
    // Prosthetoume tin kefalida sto calendar
    calendar.appendChild(headerDayShort); //emfanizoyme ta headers tou calendar sto webpage 
});

// Prosthetoume kena koutakia prin tin 1i mera analoga me thn proti mera tou mina an den ine deftera klp
for (let i = 0; i < startingDayOfWeekReal; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'day empty'; // class 'empty' gia styling kenon imerwn
    calendar.appendChild(emptyDay);
}
// APPENDCHILD prosthetoume to () element sto calendar grid
// Ftiaxnoume ta koutakia gia kathe mera tou mina
for (let day = 1; day <= daysInMonth; day++) {
    // Dimiourgoume <div> element gia tin mera
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    dayDiv.textContent = day;

    // Otan o xristis klikarei pano se mia mera
    dayDiv.onclick = () => selectDay(dayDiv, day);

    // Elegxoume an auti i mera einai i simerini (today)
    if (year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate()) {
        // Vazoume class 'selected' gia na fainetai oti einai epilegmeni
        dayDiv.classList.add('selected');
        // Enimeronoume kai tin metavliti selectedDay
        selectedDay = day;
    }

    // Telika prosthetoume tin mera sto calendar grid
    calendar.appendChild(dayDiv);
}

// Enimeronoume ton header tou mina (onoma mina + etos)
updateMonthHeader();
// Enimeronoume ton titlo "availability" gia tin epilegmeni mera
updateAvailabilityTitle();
// Fortonoume ta sessions gia tin epilegmeni mera apo to server
loadSessions();
}

// Synartisi pou kalietai otan o xristis epileksei mia mera sto calendar
function selectDay(element, day) {
// Afairoume to 'selected' apo oles tis meres
document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
// Vazoume 'selected' mono sto trexon element (tin mera pou klikarisame)
element.classList.add('selected');
// Enimeronoume tin global metavliti selectedDay
selectedDay = day;
// Enimeronoume ton titlo availability me ti nea mera
updateAvailabilityTitle();
// Ksanofortonoume ta sessions gia tin nea epilegmeni mera
loadSessions();
//otan o xristis patisi mia mera, kanei scroll sto availability section
setTimeout(() => {
    const availabilitySection = document.getElementById('availabilityTitle');
    if (availabilitySection) {
        availabilitySection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}, 100);

}

// Enimeronei ton titlo pou deixnei tin imerominia kai tin diathesimotita
function updateAvailabilityTitle() {
const year = currentDate.getFullYear();
const month = currentDate.getMonth();
// Ftiaxnoume string me morfi YYYY-MM-DD
const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
// Dimiourgoume Date antikeimeno (vazoume 12:00 gia na apofygoume provlimata me timezone)
const date = new Date(dateStr + 'T12:00:00');

// Pairnoume onoma imeras kai mina apo translations (me basi to getDay/getMonth)
const dayName = textTranslations.el.days[date.getDay()];
const monthName = textTranslations.el.months[date.getMonth()];

// Allazoume to keimeno tou stoixeiou me id 'availabilityTitle'
document.getElementById('availabilityTitle').textContent =
    `${translate('availability')} ${dayName}, ${selectedDay} ${monthName}`;
}

// Allazei mina (direction = -1 gia proigoumeno, +1 gia epomeno)
function changeMonth(direction) { // allazoume ton mina analoga -1 h +1
// Allazoume ton mina sto currentDate me tin timi direction
currentDate.setMonth(currentDate.getMonth() + direction);
// Resetaroume tin epilegmeni mera se 1 (proto tou mina)
selectedDay = 1; 
// Ksanadimiourgoume to calendar gia ton neo mina
createCalendar();
}

// Enimeronei ton header me ton trexonta mina kai etos
function updateMonthHeader() {
document.getElementById('currentMonth').textContent =
    `${textTranslations.el.months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
} // allazoume ton header titlo analoga me ton mina. pigeno kai vrisko to translation tou mina.

// Fortonei ta sessions gia tin epilegmeni mera apo to server kai ta emfanizei sti lista
function loadSessions() {
const year = currentDate.getFullYear();
// Mina kai mera me diplo psifio (2 -> 02)
const month = String(currentDate.getMonth() + 1).padStart(2, '0');
const day = String(selectedDay).padStart(2, '0');
// Ftiaxnoume imerominia se morfi YYYY-MM-DD
const DateString = `${year}-${month}-${day}`;

// Vriskoume to stoixeio pou tha periexei ti lista me ta sessions
const list = document.getElementById('sessions');
// Deixnoume minima "loading" mexri na erthei i apantisi
list.innerHTML = `<div class="loading">${translate('loading')}</div>`;

// Kanoume request sto PHP: get_day_sessions.php me query param 'date'
fetch('get_day_sessions.php?date=' + encodeURIComponent(DateString))
    .then(response => {
   
        // Diavazoume tin apantisi os keimeno
        return response.text();
    })
    .then(text => {
        //kanoume parse to keimeno apo JSON string (tou server php) se js array gia na mporei na to diavasei to js.
            return JSON.parse(text);
    }) // to php mou epistrefei array 
    .then(data => {
        // Katharizoume ti lista prin gemisoume ta nea sessions
        list.innerHTML = '';

        // An to success sto JSON einai false, deixnoume minima error
        if (!data.success) {
            list.innerHTML = `<p>${translate('errorLoading')} ${data.error || ''}</p>`;
            return;
        }

        // An den yparxoun katholou sessions gia auti tin mera
        if (data.sessions.length === 0) {
            list.innerHTML = `<p>${translate('noSessions')}</p>`; // kimeno gia no sessions
            return;
        }

        // Gia kathe session s pou epistrefei o server
        data.sessions.forEach(sess => {   // sess pliada pou mou epistefei to query (pinakas apo db)
            // Ftiaxnoume Date antikeimena gia ora enarksis kai lixis
            const timeStart = new Date(sess.time_start); 
            const timeEnd   = new Date(sess .time_end);

            // Metatrepoume tis ores se anagnwrisimo format gia ton xristi
            const startText = timeStart.toLocaleTimeString(textTranslations.el.locale, {
                hour: 'numeric',
                minute: '2-digit'
            });
            const endText = timeEnd.toLocaleTimeString(textTranslations.el.locale, {
                hour: 'numeric',
                minute: '2-digit'
            });

            // Posous kenous theseis exei akoma to session (an den yparxei, 0) opos to isnull
            const spotsLeft= Number(sess.spots_left ?? 0);

            // An yparxoun theseis, deixnoume "X spots left",
            // alliws deixnoume oti einai full (xrisimopoioume translate)
            let spotsLeftText;
            if(spotsLeft > 0)
                spotsLeftText= replaceSpotsLeft(translate('spotsLeftTemplate'), { spots: spotsLeft });
            else
            spotsLeftText =translate('full');

            // An einai full, theloume na fainetai energopoihmeno to bell
            let bell;
            if(spotsLeft <= 0)
                bell='active';

            // Dimiourgoume container div gia kathe class/session
            const item = document.createElement('div');
            item.className = 'class-item';

            // Ftiaxnoume to eswteriko HTML tou session item
            item.innerHTML = `
                <div class="time">${startText}</div>
                <div class="class-info">
                    <h3>${sess.level}</h3>
                    <div class="class-details">${startText} - ${endText} • ${translate('capacityLabel')} ${sess.capacity}</div>
                </div>
                <div class="status ${spotsLeft > 0 ? '' : 'full'}">${spotsLeftText}</div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="book-button"
                            data-session-id="${sess.session_id}"
                            data-session-level="${sess.level}"
                            data-session-date="${sess.date}"
                            data-session-time="${startText}"
                            onclick="checkBooking(this, ${sess.session_id}, '${sess.level}', '${sess.date}', '${startText}')">
                        ${translate('bookButton')}
                    </button>
                    <span class="bell-icon ${bell}" 
                          onclick="${spotsLeft <= 0 ? `notifyWhenAvailable(${sess.session_id}, '${sess.level}', '${sess.date}', '${startText}')` : 'return false;'}">
                        🔔
                    </span>
                </div>
            `;

            // Telika prosthetoume to item sti lista me ta sessions
            list.appendChild(item);
        });
    })

}

// Pairnoume ta popup stoixeia
let popupID = document.getElementById('popupID');
let popupTitle = document.getElementById('popupTitle');
let popupMessage = document.getElementById('popupMessage');
let popupPrimaryButton = document.getElementById('popupPrimaryButton');
let popupSecondaryButton = document.getElementById('popupSecondaryButton');

// Metavliti gia na thimomaste ti apantise o xristis
let popupCallback = null;

//Emfanizei to popup
function showPopup(title, message, ConfirmText, cancelText) {
    popupTitle.textContent = title;
    popupMessage.innerHTML = message;

   
    if (ConfirmText) { 
        popupPrimaryButton.textContent = ConfirmText;
        popupPrimaryButton.style.display = 'inline-block';
    } else {
        popupPrimaryButton.style.display = 'none'; //an to popup den exei koumpia (poy to theloume sto koumpi oti you have already booked your spot) kai emfanizonte
    }

 
    if (cancelText) {
        popupSecondaryButton.textContent = cancelText;
        popupSecondaryButton.style.display = 'inline-block';
    } else {
        popupSecondaryButton.style.display = 'none'; //an to popup den exei koumpia (poy to theloume sto koumpi oti you have already booked your spot) kai emfanizonte
    }

    popupID.classList.add('active'); //active to koumpi

// Epistrefoume Promise gia na mporei o kwdikas pou kalei tin showPopup()
// na perimenei (me await) mexri o xristis na patisei koumpi (OK h Cancel)
return new Promise(function(resolve) { 
    
    // Apothikevoume tin resolve se mia eksoteriki metavliti (popupCallback)
    // oste na mporoume na tin kalesei argotera otan o xristis patisei koumpi.
    // Diladi to resolve den kaleitai tora — to krataoume gia argotera.
    popupCallback = resolve; 
});
}
//kleinei to popup
function hidePopup() {
popupID.classList.remove('active');
}

//otan pathsh o xrhsths ok
popupPrimaryButton.onclick = function() {
hidePopup();
if (popupCallback) {
    popupCallback(true);
    popupCallback = null;
}
};

//otan pathsh o xrhsths cancel
popupSecondaryButton.onclick = function() {
hidePopup();
if (popupCallback) {
    popupCallback(false);
    popupCallback = null;
}
};


//Kyria sinartisi gia booking - kaleitai otan o xristis patisei to koumpi "Book". button: to koumpi pou patithike,
//sessionId: to id tou mathimatos/session,level: epipedo (Beginner, Intermediate),date: imerominia se morfi string (apo DB),
//time: ora mathimatos (string)
async function checkBooking(button, sessionId, level, date, time) {
console.log('handleBooking called:', { sessionId, level, date, time }); // debug

// Elegxoume an o xristis einai sindedemenos (apo sessionStorage)
const usersId = localStorage.getItem('users_id');

if (!usersId) {
    // Den einai sindedemenos -> deixnoume popup gia login
    const shouldLogin = await showPopup(
        translate('loginRequiredTitle'),
        translate('loginRequiredMessage'),
        translate('loginButton'),
        translate('backButton')
    );
    
    // An dialexei "Login" ton pigenoume sti selida sindesis
    if (shouldLogin) {
        window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
    }   
    // An patisei "Back" aplos gyrname piso
    return;
}

// Metatropi imerominias se pio oraio format gia emfanisi
const dateObj = new Date(date);
const formattedDate = dateObj.toLocaleDateString(textTranslations.el.locale, { 
    weekday: 'long',   // onoma imeras
    year: 'numeric',
    month: 'long',
    day: 'numeric' 
});

console.log('Showing confirmation popup...'); // debug

// Deixnoume popup epivevaiosis prin ginei i kratisi
const confirmed = await showPopup(
    translate('confirmBookingTitle'),
    `
        ${translate('confirmBookingIntro')}<br><br>
        <strong>${translate('levelLabel')}:</strong> ${level}<br>
        <strong>${translate('dateLabel')}:</strong> ${formattedDate}<br>
        <strong>${translate('timeLabel')}:</strong> ${time}
    `,
    translate('ConfirmButton'),
    translate('CancelButton')

);

console.log('User confirmed:', confirmed); // debug

// An o xristis patise "Back", den kanoume booking
if (!confirmed) return;

// An epivevaiose, kaloume tin sinartisi pou steinei to booking sto server
await BookSpot(button, sessionId, level, formattedDate, time);
}

//Stelnei to aitima gia booking sto server (create_booking.php)
//sessionId, level, formattedDate, time: plirofories gia to mathima
async function BookSpot(button, sessionId, level, formattedDate, time) {
    // Apenergopoioume to koumpi prosorina gia na min ginei diplh kratisi
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = '...';
    console.log('users_id:', localStorage.getItem('users_id'));

    try {
        // Stelname POST request sto create_booking.php me ta stoixeia tou session kai tou xristi
        const response = await fetch('create_booking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                user_id: parseInt(localStorage.getItem('users_id'))
            })
        });

        // Pernoume tin apantisi tou server se JSON morfi
        const data = await response.json();

        if (data.success) {
            //An htan ok h kratisi deixnoume kanoniko popup me koumpi epivevaiosis
            await showPopup(
                translate('bookingConfirmedTitle'),
                `
                    ${translate('bookingConfirmedMessage')}<br><br> 
                    <strong>${level}</strong><br>
                    ${formattedDate}<br>
                    ${time}
                `,
                translate('ConfirmButton'),  // keimeno gia to Epiveveosh button
                null                         
            );

            // Meta apo 3 deyterolepta kanoume redirect pisw sto calendar
            setTimeout(() => {
                window.location.href = 'booking_calendar.html';
            }, 3000);

        } else {
            // O xristis exei idi kleisei thn thesi tou se auto to session deixnoume mono minima xoris koumpia (ara den valloume confirm/cancel sto showPopup)
            showPopup(
                translate('alreadyBooked'),
                translate('alreadyBooked') // idio keimeno gia title kai message
            );

            // Meta apo 3 deyterolepta epistrofi sto calendar
            setTimeout(() => {
                window.location.href = 'booking_calendar.html';
            }, 3000);
        }

        // Ksanafortonei ta sessions gia na fainetai i nea katastasi
        loadSessions();

    } catch (error) {
        console.error('Booking error:', error);

        // An ginei kapoio error deixnoume minima lathous
        await showPopup(
            translate('bookingConfirmedTitle'), 
            'Κάτι πήγε στραβά. Προσπάθησε ξανά.',
            translate('ConfirmButton'),
            null
        );

        // Meta apo 3 deyterolepta epistrofi sto calendar
        setTimeout(() => {
            window.location.href = 'booking_calendar.html';
        }, 3000);
    }

    // Epanaenergopoioume to koumpi kai epistrefoyme to arxiko keimeno tou
    button.disabled = false;
    button.textContent = originalText;
}


// arxikh rithmisi statikwn keimenwn (browser title, availability text, month title)
updateStaticTexts();
// orizoume default glwssa ellinika
setLang('el'); 
createCalendar();
