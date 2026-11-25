-- The first roadmap items. Texts use typographic apostrophes (’), so the strings need no escaping.
INSERT INTO "roadmap_items" ("status", "icon", "category", "title", "description", "released_on", "sort_order") VALUES
(
	'in_progress', 'crop', 'people',
	'{"en": "Photo cropping", "es": "Recorte de fotos", "de": "Fotos zuschneiden", "fr": "Recadrage des photos", "ru": "Обрезка фото", "uk": "Обрізання фото"}',
	'{"en": "Choose which part of a photo appears on a person’s card.", "es": "Elige qué parte de la foto se ve en la tarjeta de cada persona.", "de": "Wähle aus, welcher Teil eines Fotos auf der Karte einer Person zu sehen ist.", "fr": "Choisissez la partie de la photo affichée sur la fiche d’une personne.", "ru": "Выбирайте, какая часть фото видна на карточке человека.", "uk": "Обирайте, яку частину фото видно на картці людини."}',
	NULL, 1
),
(
	'in_progress', 'add_a_photo', 'integrations',
	'{"en": "Photos from Google Contacts", "es": "Fotos de Contactos de Google", "de": "Fotos aus Google Kontakte", "fr": "Photos depuis Google Contacts", "ru": "Фото из Google Контактов", "uk": "Фото з Google Контактів"}',
	'{"en": "People imported from Google Contacts get their contact photos.", "es": "Las personas importadas de Contactos de Google reciben la foto de su contacto.", "de": "Aus Google Kontakte importierte Personen erhalten ihre Kontaktfotos.", "fr": "Les personnes importées de Google Contacts reçoivent la photo de leur contact.", "ru": "Люди, импортированные из Google Контактов, получат фото из контакта.", "uk": "Люди, імпортовані з Google Контактів, отримають фото з контакту."}',
	NULL, 2
),
(
	'planned', 'send', 'reminders',
	'{"en": "Telegram reminders", "es": "Recordatorios en Telegram", "de": "Erinnerungen in Telegram", "fr": "Rappels sur Telegram", "ru": "Напоминания в Telegram", "uk": "Нагадування в Telegram"}',
	'{"en": "A Telegram bot that reminds you about birthdays and lets you check who is next.", "es": "Un bot de Telegram que te recuerda los cumpleaños y te dice quién es el siguiente.", "de": "Ein Telegram-Bot, der dich an Geburtstage erinnert und zeigt, wer als Nächstes dran ist.", "fr": "Un bot Telegram qui vous rappelle les anniversaires et vous montre le prochain.", "ru": "Telegram-бот, который напоминает о днях рождения и подсказывает, чей праздник следующий.", "uk": "Telegram-бот, який нагадує про дні народження та підказує, чиє свято наступне."}',
	NULL, 1
),
(
	'planned', 'workspace_premium', 'account',
	'{"en": "Premium features", "es": "Funciones premium", "de": "Premium-Funktionen", "fr": "Fonctionnalités premium", "ru": "Премиум-возможности", "uk": "Преміум-можливості"}',
	'{"en": "Extra options for those who want more from Birthdly.", "es": "Opciones adicionales para quienes quieren más de Birthdly.", "de": "Zusätzliche Optionen für alle, die mehr von Birthdly wollen.", "fr": "Des options en plus pour ceux qui attendent davantage de Birthdly.", "ru": "Дополнительные возможности для тех, кто хочет от Birthdly большего.", "uk": "Додаткові можливості для тих, хто хоче від Birthdly більшого."}',
	NULL, 2
),
(
	'planned', 'keyboard', 'calendar',
	'{"en": "Keyboard navigation in the calendar", "es": "Navegación con teclado en el calendario", "de": "Tastaturnavigation im Kalender", "fr": "Navigation au clavier dans le calendrier", "ru": "Навигация по календарю с клавиатуры", "uk": "Навігація календарем з клавіатури"}',
	'{"en": "Move between days and months of the year view with the arrow keys.", "es": "Muévete entre los días y meses de la vista anual con las flechas.", "de": "Wechsle mit den Pfeiltasten zwischen Tagen und Monaten der Jahresansicht.", "fr": "Parcourez les jours et les mois de la vue annuelle avec les flèches.", "ru": "Перемещайтесь по дням и месяцам годового вида стрелками.", "uk": "Переміщуйтеся днями та місяцями річного вигляду стрілками."}',
	NULL, 3
),
(
	'planned', 'tune', 'reminders',
	'{"en": "Flexible reminder settings", "es": "Recordatorios más flexibles", "de": "Flexiblere Erinnerungen", "fr": "Rappels plus flexibles", "ru": "Гибкая настройка напоминаний", "uk": "Гнучке налаштування нагадувань"}',
	'{"en": "Choose when and how often to be reminded, separately for different people.", "es": "Elige cuándo y con qué frecuencia recibir recordatorios, por separado para cada persona.", "de": "Lege fest, wann und wie oft du erinnert wirst, auch für einzelne Personen.", "fr": "Choisissez quand et à quelle fréquence être rappelé, séparément pour chaque personne.", "ru": "Выбирайте, когда и как часто получать напоминания, отдельно для разных людей.", "uk": "Обирайте, коли й як часто отримувати нагадування, окремо для різних людей."}',
	NULL, 4
),
(
	'planned', 'mail', 'reminders',
	'{"en": "Email reminders", "es": "Recordatorios por correo", "de": "Erinnerungen per E-Mail", "fr": "Rappels par e-mail", "ru": "Напоминания на почту", "uk": "Нагадування на пошту"}',
	'{"en": "Get birthday reminders by email as well as push notifications.", "es": "Recibe los recordatorios de cumpleaños también por correo electrónico.", "de": "Erhalte Geburtstagserinnerungen auch per E-Mail.", "fr": "Recevez aussi les rappels d’anniversaire par e-mail.", "ru": "Получайте напоминания о днях рождения не только push-уведомлением, но и письмом.", "uk": "Отримуйте нагадування про дні народження не лише push-сповіщенням, а й листом."}',
	NULL, 5
),
(
	'planned', 'id_card', 'people',
	'{"en": "Richer person page", "es": "Página de persona más completa", "de": "Ausführlichere Personenseite", "fr": "Fiche personne enrichie", "ru": "Расширенная страница человека", "uk": "Розширена сторінка людини"}',
	'{"en": "More on each person’s page: contact details, notes and everything about their birthday in one place.", "es": "Más información en la página de cada persona: contactos, notas y todo sobre su cumpleaños en un solo lugar.", "de": "Mehr auf der Seite jeder Person: Kontaktdaten, Notizen und alles rund um den Geburtstag an einem Ort.", "fr": "Plus d’informations sur la page de chaque personne : coordonnées, notes et tout sur son anniversaire au même endroit.", "ru": "Больше информации на странице человека: контакты, заметки и всё о его дне рождения в одном месте.", "uk": "Більше інформації на сторінці людини: контакти, нотатки й усе про її день народження в одному місці."}',
	NULL, 6
),
(
	'planned', 'checklist', 'people',
	'{"en": "Wishlists", "es": "Listas de deseos", "de": "Wunschlisten", "fr": "Listes d’envies", "ru": "Списки желаний", "uk": "Списки бажань"}',
	'{"en": "Keep your own wishlist and share it, so friends know what to give you.", "es": "Crea tu lista de deseos y compártela para que tus amigos sepan qué regalarte.", "de": "Lege deine eigene Wunschliste an und teile sie, damit Freunde wissen, was sie dir schenken können.", "fr": "Créez votre liste d’envies et partagez-la pour que vos amis sachent quoi vous offrir.", "ru": "Ведите свой список желаний и делитесь им, чтобы друзья знали, что вам подарить.", "uk": "Ведіть свій список бажань і діліться ним, щоб друзі знали, що вам подарувати."}',
	NULL, 7
),
(
	'planned', 'redeem', 'people',
	'{"en": "Gift ideas", "es": "Ideas de regalos", "de": "Geschenkideen", "fr": "Idées cadeaux", "ru": "Идеи подарков", "uk": "Ідеї подарунків"}',
	'{"en": "Jot down gift ideas for each person whenever they come to mind.", "es": "Apunta ideas de regalos para cada persona en cuanto se te ocurran.", "de": "Notiere Geschenkideen für jede Person, sobald sie dir einfallen.", "fr": "Notez des idées cadeaux pour chaque personne dès qu’elles vous viennent.", "ru": "Записывайте идеи подарков для каждого человека, как только они приходят в голову.", "uk": "Записуйте ідеї подарунків для кожної людини, щойно вони спадають на думку."}',
	NULL, 8
),
(
	'planned', 'bookmark_add', 'celebrities',
	'{"en": "Celebrities in your calendar", "es": "Famosos en tu calendario", "de": "Prominente in deinem Kalender", "fr": "Célébrités dans votre calendrier", "ru": "Знаменитости в вашем календаре", "uk": "Знаменитості у вашому календарі"}',
	'{"en": "Add a famous person from the celebrity pages to your own birthday calendar.", "es": "Añade a un famoso desde las páginas de famosos a tu propio calendario de cumpleaños.", "de": "Füge eine prominente Person von den Promi-Seiten zu deinem eigenen Geburtstagskalender hinzu.", "fr": "Ajoutez une célébrité depuis les pages des célébrités à votre propre calendrier des anniversaires.", "ru": "Добавляйте известных людей со страниц знаменитостей в свой календарь дней рождения.", "uk": "Додавайте відомих людей зі сторінок знаменитостей до свого календаря днів народження."}',
	NULL, 9
),
(
	'planned', 'event_repeat', 'calendar',
	'{"en": "Anniversaries and other dates", "es": "Aniversarios y otras fechas", "de": "Jahrestage und andere Daten", "fr": "Autres dates importantes", "ru": "Годовщины и другие даты", "uk": "Річниці та інші дати"}',
	'{"en": "Keep anniversaries and other yearly dates next to birthdays, with the same reminders.", "es": "Guarda aniversarios y otras fechas anuales junto a los cumpleaños, con los mismos recordatorios.", "de": "Speichere Jahrestage und andere jährliche Daten neben Geburtstagen, mit denselben Erinnerungen.", "fr": "Ajoutez anniversaires de mariage et autres dates annuelles à côté des anniversaires, avec les mêmes rappels.", "ru": "Храните годовщины и другие ежегодные даты рядом с днями рождения, с теми же напоминаниями.", "uk": "Зберігайте річниці та інші щорічні дати поруч із днями народження, з тими самими нагадуваннями."}',
	NULL, 10
),
(
	'planned', 'layers', 'calendar',
	'{"en": "Several calendars", "es": "Varios calendarios", "de": "Mehrere Kalender", "fr": "Plusieurs calendriers", "ru": "Несколько календарей", "uk": "Кілька календарів"}',
	'{"en": "Keep separate calendars, for example for family and work, and switch between them.", "es": "Ten calendarios separados, por ejemplo para la familia y el trabajo, y cambia entre ellos.", "de": "Führe getrennte Kalender, etwa für Familie und Arbeit, und wechsle zwischen ihnen.", "fr": "Gardez des calendriers séparés, par exemple pour la famille et le travail, et passez de l’un à l’autre.", "ru": "Ведите отдельные календари, например для семьи и работы, и переключайтесь между ними.", "uk": "Ведіть окремі календарі, наприклад для родини й роботи, і перемикайтеся між ними."}',
	NULL, 11
),
(
	'planned', 'share', 'calendar',
	'{"en": "Share your calendar", "es": "Comparte tu calendario", "de": "Kalender teilen", "fr": "Partager votre calendrier", "ru": "Поделиться календарём", "uk": "Поділитися календарем"}',
	'{"en": "Share a read-only link to your birthday calendar.", "es": "Comparte un enlace de solo lectura a tu calendario de cumpleaños.", "de": "Teile einen Link zu deinem Geburtstagskalender, den andere ansehen, aber nicht ändern können.", "fr": "Partagez un lien en lecture seule vers votre calendrier des anniversaires.", "ru": "Делитесь ссылкой на свой календарь дней рождения только для просмотра.", "uk": "Діліться посиланням на свій календар днів народження лише для перегляду."}',
	NULL, 12
),
(
	'planned', 'family_restroom', 'people',
	'{"en": "Shared lists with family", "es": "Listas compartidas en familia", "de": "Gemeinsame Listen mit der Familie", "fr": "Listes partagées en famille", "ru": "Общие списки с семьёй", "uk": "Спільні списки з родиною"}',
	'{"en": "Keep one list of birthdays together with your family, and everyone can add to it.", "es": "Lleva una lista de cumpleaños junto con tu familia; todos pueden añadir personas.", "de": "Führe eine Geburtstagsliste gemeinsam mit der Familie, alle können etwas hinzufügen.", "fr": "Tenez une liste d’anniversaires avec votre famille ; chacun peut y ajouter des personnes.", "ru": "Ведите один список дней рождения вместе с близкими, добавлять в него сможет каждый.", "uk": "Ведіть один список днів народження разом із близькими, додавати до нього зможе кожен."}',
	NULL, 13
),
(
	'planned', 'event_upcoming', 'integrations',
	'{"en": "Calendar export", "es": "Exportar el calendario", "de": "Kalenderexport", "fr": "Export du calendrier", "ru": "Экспорт календаря", "uk": "Експорт календаря"}',
	'{"en": "Subscribe to your birthdays in Apple Calendar, Outlook and other calendar apps.", "es": "Suscríbete a tus cumpleaños en Apple Calendar, Outlook y otras apps de calendario.", "de": "Abonniere deine Geburtstage in Apple Kalender, Outlook und anderen Kalender-Apps.", "fr": "Abonnez-vous à vos anniversaires dans Calendrier d’Apple, Outlook et d’autres applications d’agenda.", "ru": "Подписывайтесь на свои дни рождения в Apple Календаре, Outlook и других календарях.", "uk": "Підписуйтеся на свої дні народження в Apple Календарі, Outlook та інших календарях."}',
	NULL, 14
),
(
	'planned', 'upload_file', 'people',
	'{"en": "Import from CSV and Excel", "es": "Importar desde CSV y Excel", "de": "Import aus CSV und Excel", "fr": "Import depuis CSV et Excel", "ru": "Импорт из CSV и Excel", "uk": "Імпорт із CSV та Excel"}',
	'{"en": "Add many people at once from a spreadsheet.", "es": "Añade muchas personas a la vez desde una hoja de cálculo.", "de": "Füge viele Personen auf einmal aus einer Tabelle hinzu.", "fr": "Ajoutez de nombreuses personnes d’un coup depuis un tableur.", "ru": "Добавляйте сразу много людей из таблицы.", "uk": "Додавайте одразу багато людей із таблиці."}',
	NULL, 15
),
(
	'planned', 'celebration', 'reminders',
	'{"en": "Greeting templates", "es": "Plantillas de felicitación", "de": "Glückwunschvorlagen", "fr": "Modèles de vœux", "ru": "Шаблоны поздравлений", "uk": "Шаблони привітань"}',
	'{"en": "Ready-made birthday wishes to copy or send in a tap.", "es": "Felicitaciones listas para copiar o enviar con un toque.", "de": "Fertige Geburtstagsgrüße zum Kopieren oder Senden mit einem Tipp.", "fr": "Des messages d’anniversaire prêts à copier ou à envoyer en un geste.", "ru": "Готовые поздравления, которые можно скопировать или отправить в одно касание.", "uk": "Готові привітання, які можна скопіювати або надіслати в один дотик."}',
	NULL, 16
),
(
	'planned', 'install_mobile', 'app',
	'{"en": "Install on your phone", "es": "Instálala en tu móvil", "de": "Auf dem Handy installieren", "fr": "Installer sur votre téléphone", "ru": "Установка на телефон", "uk": "Встановлення на телефон"}',
	'{"en": "Add Birthdly to your home screen and open it like an app, even offline.", "es": "Añade Birthdly a la pantalla de inicio y ábrela como una app, incluso sin conexión.", "de": "Lege Birthdly auf deinen Startbildschirm und öffne es wie eine App, auch offline.", "fr": "Ajoutez Birthdly à votre écran d’accueil et ouvrez-le comme une application, même hors ligne.", "ru": "Добавьте Birthdly на главный экран и открывайте как приложение, даже без интернета.", "uk": "Додайте Birthdly на головний екран і відкривайте як застосунок, навіть без інтернету."}',
	NULL, 17
),
(
	'done', 'photo_camera', 'people',
	'{"en": "Person photos", "es": "Fotos de personas", "de": "Fotos von Personen", "fr": "Photos des personnes", "ru": "Фото людей", "uk": "Фото людей"}',
	'{"en": "Add a photo to anyone on your list so you recognize them at a glance.", "es": "Añade una foto a cualquier persona de tu lista para reconocerla de un vistazo.", "de": "Füge jeder Person auf deiner Liste ein Foto hinzu, um sie sofort zu erkennen.", "fr": "Ajoutez une photo à chaque personne de votre liste pour la reconnaître d’un coup d’œil.", "ru": "Добавьте фото любому человеку из списка, чтобы узнавать его с первого взгляда.", "uk": "Додайте фото будь-кому зі списку, щоб упізнавати людину з першого погляду."}',
	'2026-11-25', 0
),
(
	'done', 'account_circle', 'account',
	'{"en": "Profile", "es": "Perfil", "de": "Profil", "fr": "Profil", "ru": "Профиль", "uk": "Профіль"}',
	'{"en": "Your display name, your own birthday and a summary of your account in one place.", "es": "Tu nombre visible, tu propio cumpleaños y un resumen de tu cuenta en un solo lugar.", "de": "Dein Anzeigename, dein eigener Geburtstag und eine Übersicht deines Kontos an einem Ort.", "fr": "Votre nom affiché, votre propre anniversaire et un résumé de votre compte au même endroit.", "ru": "Ваше имя, ваш собственный день рождения и сводка по аккаунту в одном месте.", "uk": "Ваше ім’я, ваш власний день народження та підсумок акаунта в одному місці."}',
	'2026-11-24', 0
),
(
	'done', 'feedback', 'app',
	'{"en": "Feedback form", "es": "Formulario de comentarios", "de": "Feedback-Formular", "fr": "Formulaire de retour", "ru": "Форма обратной связи", "uk": "Форма зворотного зв’язку"}',
	'{"en": "Report a bug or share an idea right from the app.", "es": "Informa de un error o comparte una idea desde la propia app.", "de": "Melde einen Fehler oder teile eine Idee direkt in der App.", "fr": "Signalez un bug ou proposez une idée directement depuis l’application.", "ru": "Сообщайте об ошибках и делитесь идеями прямо из приложения.", "uk": "Повідомляйте про помилки та діліться ідеями просто із застосунку."}',
	'2026-11-23', 0
),
(
	'done', 'link', 'people',
	'{"en": "Invite links", "es": "Enlaces de invitación", "de": "Einladungslinks", "fr": "Liens d’invitation", "ru": "Ссылки-приглашения", "uk": "Посилання-запрошення"}',
	'{"en": "Share a link and let friends add their own birthdays to your list.", "es": "Comparte un enlace y deja que tus amigos añadan su cumpleaños a tu lista.", "de": "Teile einen Link, und Freunde tragen ihren Geburtstag selbst in deine Liste ein.", "fr": "Partagez un lien pour que vos amis ajoutent eux-mêmes leur anniversaire à votre liste.", "ru": "Поделитесь ссылкой, и друзья сами добавят свой день рождения в ваш список.", "uk": "Поділіться посиланням, і друзі самі додадуть свій день народження до вашого списку."}',
	'2026-11-20', 0
),
(
	'done', 'star', 'celebrities',
	'{"en": "Celebrity birthdays", "es": "Cumpleaños de famosos", "de": "Geburtstage von Prominenten", "fr": "Anniversaires de célébrités", "ru": "Дни рождения знаменитостей", "uk": "Дні народження знаменитостей"}',
	'{"en": "See which famous people were born on any day of the year.", "es": "Descubre qué famosos nacieron cualquier día del año.", "de": "Sieh nach, welche Prominenten an einem beliebigen Tag des Jahres geboren wurden.", "fr": "Découvrez les célébrités nées n’importe quel jour de l’année.", "ru": "Узнайте, кто из известных людей родился в любой день года.", "uk": "Дізнайтеся, хто з відомих людей народився будь-якого дня року."}',
	'2026-11-20', 0
),
(
	'done', 'dark_mode', 'app',
	'{"en": "Dark theme", "es": "Tema oscuro", "de": "Dunkles Design", "fr": "Thème sombre", "ru": "Тёмная тема", "uk": "Темна тема"}',
	'{"en": "Choose a light or dark theme, or follow your system setting.", "es": "Elige un tema claro u oscuro, o sigue la configuración del sistema.", "de": "Wähle ein helles oder dunkles Design oder folge der Systemeinstellung.", "fr": "Choisissez un thème clair ou sombre, ou suivez le réglage du système.", "ru": "Светлая или тёмная тема — или как в системе.", "uk": "Світла чи темна тема — або як у системі."}',
	'2026-11-19', 0
),
(
	'done', 'groups', 'people',
	'{"en": "People list", "es": "Lista de personas", "de": "Personenliste", "fr": "Liste des personnes", "ru": "Список людей", "uk": "Список людей"}',
	'{"en": "A sortable list with search, categories and a details page for every person.", "es": "Una lista ordenable con búsqueda, categorías y una página de detalles para cada persona.", "de": "Eine sortierbare Liste mit Suche, Kategorien und einer Detailseite für jede Person.", "fr": "Une liste triable avec recherche, catégories et une page de détails pour chaque personne.", "ru": "Сортируемый список с поиском, категориями и отдельной страницей для каждого человека.", "uk": "Сортований список із пошуком, категоріями та окремою сторінкою для кожної людини."}',
	'2026-11-15', 0
),
(
	'done', 'translate', 'app',
	'{"en": "Six languages", "es": "Seis idiomas", "de": "Sechs Sprachen", "fr": "Six langues", "ru": "Шесть языков", "uk": "Шість мов"}',
	'{"en": "Birthdly speaks English, Spanish, German, French, Russian and Ukrainian.", "es": "Birthdly está en inglés, español, alemán, francés, ruso y ucraniano.", "de": "Birthdly gibt es auf Englisch, Spanisch, Deutsch, Französisch, Russisch und Ukrainisch.", "fr": "Birthdly parle anglais, espagnol, allemand, français, russe et ukrainien.", "ru": "Birthdly говорит на английском, испанском, немецком, французском, русском и украинском.", "uk": "Birthdly розмовляє англійською, іспанською, німецькою, французькою, російською та українською."}',
	'2026-11-12', 0
),
(
	'done', 'notifications', 'reminders',
	'{"en": "Push reminders", "es": "Recordatorios push", "de": "Push-Erinnerungen", "fr": "Rappels push", "ru": "Push-напоминания", "uk": "Push-нагадування"}',
	'{"en": "Get a notification on your phone or computer before a birthday.", "es": "Recibe una notificación en tu móvil u ordenador antes de un cumpleaños.", "de": "Erhalte vor einem Geburtstag eine Benachrichtigung auf Handy oder Computer.", "fr": "Recevez une notification sur votre téléphone ou ordinateur avant un anniversaire.", "ru": "Получайте уведомление на телефон или компьютер перед днём рождения.", "uk": "Отримуйте сповіщення на телефон або комп’ютер перед днем народження."}',
	'2026-11-10', 0
),
(
	'done', 'sync', 'integrations',
	'{"en": "Google Calendar and Contacts sync", "es": "Sincronización con Google Calendar y Contactos de Google", "de": "Synchronisierung mit Google Kalender und Kontakte", "fr": "Synchronisation avec Google Agenda et Contacts", "ru": "Синхронизация с Google Календарём и Контактами", "uk": "Синхронізація з Google Календарем і Контактами"}',
	'{"en": "Import birthdays from Google Contacts and see them in Google Calendar.", "es": "Importa cumpleaños de Contactos de Google y velos en Google Calendar.", "de": "Importiere Geburtstage aus Google Kontakte und sieh sie im Google Kalender.", "fr": "Importez les anniversaires depuis Google Contacts et retrouvez-les dans Google Agenda.", "ru": "Импортируйте дни рождения из Google Контактов и смотрите их в Google Календаре.", "uk": "Імпортуйте дні народження з Google Контактів і переглядайте їх у Google Календарі."}',
	'2026-11-03', 0
),
(
	'done', 'calendar_month', 'calendar',
	'{"en": "Birthday calendar", "es": "Calendario de cumpleaños", "de": "Geburtstagskalender", "fr": "Calendrier des anniversaires", "ru": "Календарь дней рождения", "uk": "Календар днів народження"}',
	'{"en": "All birthdays on one calendar, with the upcoming ones and ages at hand.", "es": "Todos los cumpleaños en un calendario, con los próximos y las edades a mano.", "de": "Alle Geburtstage in einem Kalender, mit den nächsten und dem Alter auf einen Blick.", "fr": "Tous les anniversaires dans un calendrier, avec les prochains et les âges sous la main.", "ru": "Все дни рождения в одном календаре: ближайшие праздники и возраст всегда под рукой.", "uk": "Усі дні народження в одному календарі: найближчі свята та вік завжди під рукою."}',
	'2026-10-30', 0
);
