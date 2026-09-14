export const project = {
  name: "Чудо Зайка",
  title: "Праздник, который начинается с улыбки",
  lead: "Аниматоры, экспресс-поздравления, шоу и праздничные станции по Владивостоку и Приморскому краю.",
  phone: "+7 (994) 994-04-33",
  phoneHref: "tel:+79949940433",
  telegram: "https://t.me/CongratulationsinPrimorye",
  region: "Владивосток и весь Приморский край",
};

const media = (path) => `./public/media/catalog/${path}`;
const cover = (name) => media(`new-covers/${name}.jpg`);

export const categories = [
  { id: "animators", navTitle: "Герои", title: "Аниматоры и герои", eyebrow: "20 героев", description: "Каждый персонаж — отдельная карточка с фотографиями из реальных праздников.", image: cover("spider-man") },
  { id: "express", navTitle: "Экспресс", title: "Экспресс-поздравления", eyebrow: "10–15 минут", description: "Два самостоятельных направления: гигантские костюмы и звёздные образы.", image: cover("white-bear-snezhok") },
  { id: "shows", navTitle: "Шоу", title: "Шоу-программы", eyebrow: "9 форматов", description: "Пена, неон, крио, пузыри, серебро, поролон, шары, вода и краски Холи.", image: media("shows/neon/photo-559.jpg") },
  { id: "graduations", navTitle: "Выпускные", title: "Выпускные", eyebrow: "4 · 9 · 11 классы", description: "Отдельные программы после 4, 9 и 11 класса и готовые большие пакеты.", image: media("graduations/photo-500.jpg") },
  { id: "services", navTitle: "Услуги", title: "Услуги на мероприятии", eyebrow: "Привезём оборудование", description: "Аквагрим, сладкая вата и попкорн со всем необходимым для работы на площадке.", image: media("services/aqua-face-painting/photo-380.jpg") },
  { id: "programs", navTitle: "Пакеты", title: "Пакеты и спецпредложения", eyebrow: "Готовый сценарий", description: "Сезонные предложения и большие программы, которые можно заказать целиком.", image: media("santa-bus/cover.jpg") },
];

export const catalogGroups = {
  animators: [
    { id: "cartoons", title: "Мультгерои", description: "Любимые персонажи мультфильмов и игр для активной программы.", image: cover("three-cats") },
    { id: "superheroes", title: "Супергерои", description: "Сильные герои, испытания и командные приключения.", image: cover("spider-man") },
    { id: "fairytale", title: "Сказочные персонажи", description: "Волшебные образы для яркого сюжетного праздника.", image: cover("elsa") },
  ],
  express: [
    { id: "inflatables", title: "Гигантские костюмы", description: "Надувные и ростовые герои для эффектного короткого выхода.", image: cover("white-bear-snezhok") },
    { id: "stars", title: "Звёзды", description: "Музыкальные пародийные образы с личным поздравлением.", image: media("stars/arthur/cover.png") },
  ],
  graduations: [
    { id: "grade-4", title: "После 4 класса", description: "Первый большой школьный выпускной.", image: media("graduations/photo-249.jpg") },
    { id: "grade-9", title: "После 9 класса", description: "Драйвовая программа для подростков.", image: media("graduations/photo-496.jpg") },
    { id: "grade-11", title: "После 11 класса", description: "Финальный школьный праздник с большим шоу.", image: media("graduations/photo-557.jpg") },
    { id: "packages", title: "Пакеты выпускных", description: "Готовые программы с ведущими, музыкой и большим финалом.", image: media("graduations/photo-500.jpg") },
  ],
  shows: [
    { id: "outdoor", title: "Праздник на улице", description: "Пена, вода и краски Холи для тёплого сезона.", image: media("shows/foam/cover-offer.jpg") },
    { id: "discos", title: "Дискотеки", description: "Неоновая и серебряная программы с музыкой и танцами.", image: media("shows/silver/cover-offer.jpg") },
    { id: "interactive", title: "Интерактивные шоу", description: "Пузыри, крио-эффекты, поролон и воздушные приключения.", image: media("shows/bubbles/photo-554.jpg") },
  ],
  services: [
    { id: "stations", title: "Выездные станции", description: "Аквагрим, сладкая вата и попкорн с оборудованием и оператором.", image: media("services/aqua-face-painting/photo-380.jpg") },
  ],
  programs: [
    { id: "seasonal", title: "Сезонные предложения", description: "Ограниченные по датам программы и специальные события.", image: media("santa-bus/cover.jpg") },
    { id: "packages", title: "Праздник под ключ", description: "Герои, ведущие, шоу и услуги в одном сценарии.", image: media("graduations/photo-500.jpg") },
  ],
};

const expressIncludes = ["герой и соведущий", "персональное поздравление", "музыкальный интерактив", "фотографии с гостями"];
const animatorIncludes = ["аниматор в образе", "игры и конкурсы", "музыкальное сопровождение", "поздравление и фотографии"];
const showIncludes = ["ведущий", "оборудование и реквизит", "музыкальное сопровождение", "интерактив с гостями"];
const service = (value) => ({ badge: "Праздничная программа", duration: "по сценарию", price: null, gallery: [value.image], includes: [], ...value });

const star = (id, title, image, gallery = [], video = null, extra = {}) => service({
  id, category: "express", subgroup: "stars", title, badge: "Звёздный экспресс", duration: "10–15 минут", price: 5000,
  image, gallery: [image, ...gallery], video, short: `Эффектное персональное поздравление в образе ${title}.`,
  description: `Музыкальный выход в образе ${title}: личные слова, танцевальный интерактив и фотографии с гостями.`, includes: expressIncludes, ...extra,
});

const inflatable = (id, title, image, gallery = [], video = null, extra = {}) => service({
  id, category: "express", subgroup: "inflatables", title, badge: "Гигантский герой", duration: "10–15 минут", price: 5000,
  image, gallery: [image, ...gallery], video, short: `${title}: короткий вау-сюрприз, поздравление, танцы и фотографии.`,
  description: `${title} приезжает с соведущим, эффектно появляется, поздравляет адресата и остаётся для общей фотосессии.`, includes: expressIncludes, ...extra,
});

const animator = (id, title, image, subgroup = "cartoons", extra = {}) => service({
  id, category: "animators", subgroup, title, badge: subgroup === "superheroes" ? "Супергерой" : "Любимый герой", duration: "от 60 минут", image,
  gallery: [image], short: `${title} проведёт игры, конкурсы, танцы и личное поздравление.`,
  description: `Полноценная игровая программа с героем ${title}. Сценарий подстраиваем под возраст детей, площадку и количество гостей.`, includes: animatorIncludes, ...extra,
});

const show = (id, title, image, short, extra = {}) => service({
  id, category: "shows", subgroup: "shows", title, badge: "Самостоятельное шоу", duration: "45–60 минут", image, gallery: [image], short,
  description: `${short} Привезём оборудование и заранее согласуем требования к площадке.`, includes: showIncludes, ...extra,
});

export const services = [
  star("arthur-pirozhkov", "Артур Пирожков", media("stars/arthur/cover.png"), [], media("stars/arthur/performance.m4v"), {
    short: "Артур без усов: яркий музыкальный выход, юмор и персональное поздравление.",
    description: "Проверенный образ Артура Пирожкова без усов. Герой появляется под музыку, поздравляет адресата, проводит короткий интерактив и фотографируется с гостями.",
  }),
  star("stas-mikhailov", "Стас Михайлов", media("stars/stas/photo-059.jpg"), [media("stars/stas/photo-070.jpg"), media("stars/stas/photo-188.jpg"), media("stars/stas/photo-210.jpg"), media("stars/stas/photo-217.jpg")], media("stars/stas/performance.m4v"), {
    short: "Стас с характерными усами и бородкой: душевный музыкальный сюрприз.",
  }),
  star("loboda", "Лобода", media("stars/loboda-cover.png"), [], media("stars/shared/loboda-performance.m4v"), {
    short: "Проверенный женский сценический образ Лободы для яркого музыкального сюрприза.",
  }),
  star("kirkorov", "Филипп Киркоров", media("stars/kirkorov/photo-427.jpg"), [media("stars/kirkorov/photo-426.jpg"), media("stars/kirkorov/photo-489.jpg"), media("stars/kirkorov/photo-527.jpg")]),
  star("allegrova", "Ирина Аллегрова", media("stars/allegrova/photo-540.jpg")),
  star("galustyan", "Михаил Галустян", media("stars/shared/galustyan-photo-006.jpg")),
  star("vlad-a4", "Влад А4", media("stars/vlad-a4/photo-052.jpg")),
  star("instasamka", "Инстасамка", "./public/media/stars.jpg", [], null, { badge: "Образ по запросу", short: "Яркое экспресс-поздравление в образе Инстасамки. Актуальное фото костюма подтвердим перед заказом." }),

  inflatable("white-bear", "Белый мишка-гигант «Снежок»", cover("white-bear-snezhok"), [media("inflatables/white-bear/photo-056.jpg"), media("inflatables/white-bear/photo-067.jpg"), media("inflatables/white-bear/photo-111.jpg"), media("inflatables/white-bear/photo-354.jpg"), media("inflatables/white-bear/photo-356.jpg")], media("inflatables/white-bear/performance.m4v"), { badge: "До 3 метров" }),
  inflatable("barney", "Мишка Барни", cover("barney"), [media("inflatables/brown-bear/photo-564.jpg")], media("inflatables/brown-bear/performance.m4v")),
  inflatable("shiny-bear", "Блестящий мишка", cover("shiny-bear"), [media("inflatables/shiny-bear/photo-047.jpg"), media("inflatables/shiny-bear/photo-193.jpg")], media("inflatables/shiny-bear/performance.m4v")),
  inflatable("gorilla", "Горилла / Кинг-Конг", cover("gorilla"), [media("inflatables/gorilla/photo-551.jpg")], media("inflatables/gorilla/performance.m4v")),
  inflatable("labubu-express", "Лабубу", cover("labubu"), [media("inflatables/labubu/photo-337.jpg"), media("inflatables/labubu/photo-468.jpg")], media("inflatables/labubu/performance.m4v")),
  inflatable("pink-bunny", "Розовый зайка", cover("pink-bunny"), [media("inflatables/pink-bunny/photo-159.jpg"), media("inflatables/pink-bunny/photo-175.jpg"), media("inflatables/pink-bunny/photo-177.jpg"), media("inflatables/pink-bunny/photo-513.jpg")], media("inflatables/pink-bunny/performance.m4v")),
  inflatable("cheburashka-express", "Чебурашка", cover("cheburashka"), [media("inflatables/cheburashka/photo-016.jpg"), media("inflatables/cheburashka/photo-021.jpg"), media("inflatables/cheburashka/photo-459.jpg")], media("inflatables/cheburashka/performance.m4v")),
  animator("rosa-barboskina", "Роза Барбоскина", cover("rosa-barboskina"), "cartoons", { gallery: [cover("rosa-barboskina"), media("animator-cards/photo-147.jpg")] }),
  animator("marshal", "Маршал", cover("marshal"), "cartoons", { gallery: [cover("marshal"), media("animator-cards/photo-148.jpg")] }), animator("gonshik", "Гонщик", cover("gonshik"), "cartoons", { gallery: [cover("gonshik"), media("inflatables/gonshik/photo-153.jpg")] }),
  animator("three-cats", "Три Кота", cover("three-cats"), "cartoons", { gallery: [cover("three-cats"), media("animator-cards/photo-509.jpg")] }), animator("rozochka", "Розочка", cover("rozochka"), "cartoons", { gallery: [cover("rozochka"), media("animator-cards/photo-161.jpg")] }),
  animator("sparkle-pony", "Единорожка", cover("unicorn"), "fairytale", { gallery: [cover("unicorn"), media("animator-cards/photo-135.jpg")] }), animator("tuchka", "Тучка", cover("tuchka"), "cartoons", { gallery: [cover("tuchka"), media("animator-cards/photo-146.jpg")] }),
  animator("kesha", "Кеша", cover("kesha"), "cartoons", { gallery: [cover("kesha"), media("animator-cards/photo-162.jpg")] }), animator("peppa", "Свинка Пеппа", cover("peppa"), "cartoons", { gallery: [cover("peppa"), media("animator-cards/photo-137.jpg")] }),
  animator("luntik", "Лунтик", cover("luntik"), "cartoons", { gallery: [cover("luntik"), media("animator-cards/photo-149.jpg")] }), animator("mcqueen", "Молния МакКуин", cover("lightning-mcqueen"), "cartoons", { gallery: [cover("lightning-mcqueen"), media("animator-cards/photo-510.jpg")] }),
  animator("lady-bug", "Леди Баг", cover("lady-bug"), "superheroes", { gallery: [cover("lady-bug"), media("animator-cards/photo-154.jpg")] }), animator("spider-man", "Человек-паук", cover("spider-man"), "superheroes", { gallery: [cover("spider-man"), media("animator-cards/photo-394.jpg")] }),
  animator("black-panther", "Чёрная Пантера", media("animator-cards/photo-167.jpg"), "superheroes"), animator("optimus-prime", "Оптимус Прайм", cover("optimus-prime"), "superheroes", { gallery: [cover("optimus-prime"), media("animator-cards/photo-155.jpg")] }),
  animator("bumblebee", "Бамблби", cover("bumblebee"), "superheroes", { gallery: [cover("bumblebee"), media("animator-cards/photo-136.jpg")] }), animator("minion", "Миньон", cover("minion"), "cartoons", { gallery: [cover("minion"), media("animator-cards/photo-152.jpg")] }),
  animator("elsa", "Эльза", cover("elsa"), "fairytale", { gallery: [cover("elsa"), media("animator-cards/photo-547.jpg")] }), animator("lol-pranksta", "Кукла LOL", cover("lol"), "cartoons", {
    gallery: [cover("lol"), media("inflatables/lol/photo-276.jpg"), media("inflatables/lol/photo-124.jpg"), media("inflatables/lol/photo-479.jpg")],
  }),
  animator("simka-nolik", "Симка и Нолик", cover("simka-nolik"), "cartoons", { gallery: [cover("simka-nolik"), media("animator-cards/shared-catalog-163.jpg")] }),

  show("foam-party", "Пенная вечеринка", media("shows/foam/cover-offer.jpg"), "Море пены, музыка и активные игры на открытой площадке.", {
    subgroup: "outdoor", gallery: [media("shows/foam/cover-offer.jpg"), media("shows/foam/photo-486.jpg")], badge: "Летний хит", includes: ["пенная установка", "ведущий", "музыка", "игры в пене"],
  }),
  show("neon-show", "Неоновое шоу", media("shows/neon/photo-559.jpg"), "Светящийся реквизит, трендовые игры и дискотека в темноте.", { subgroup: "discos" }),
  show("silver-disco", "Серебряная дискотека", media("shows/silver/cover-offer.jpg"), "Сияющая фольга, музыка и танцы внутри серебряного вихря.", { subgroup: "discos", gallery: [media("shows/silver/cover-offer.jpg"), media("shows/silver/photo-400.jpg")] }),
  show("foam-blocks-show", "Поролоновое шоу", media("shows/foam-blocks/photo-558.jpg"), "Огромные мягкие кубики и безопасные командные игры.", { subgroup: "interactive" }),
  show("cryo-show", "Крио-шоу", media("shows/cryo/photo-572.jpg"), "Густой туман, эффектные опыты и научный интерактив.", { subgroup: "interactive", price: 7500 }),
  show("bubble-show", "Шоу мыльных пузырей", media("shows/bubbles/photo-554.jpg"), "Гигантские пузыри, трюки и участие детей и взрослых.", { subgroup: "interactive" }),
  show("balloon-show", "Остров Надувляндия", media("shows/balloons/photo-566.jpg"), "Сюжетное приключение с волшебными шарами и заданиями.", { subgroup: "interactive" }),
  show("water-battle", "Водная битва", media("shows/water/photo-560.jpg"), "Летние водные челленджи и командные испытания.", { subgroup: "outdoor" }),
  show("holi-colors", "Фестиваль красок Холи", media("shows/holi/photo-531.jpg"), "Общий цветной взрыв и яркие фотографии на память.", { subgroup: "outdoor" }),

  service({ id: "graduation-grade-4", category: "graduations", subgroup: "grade-4", title: "Выпускной после 4 класса", badge: "Начальная школа", duration: "от 60 минут", image: media("graduations/photo-249.jpg"), gallery: [media("graduations/photo-249.jpg"), media("graduations/photo-500.jpg")], video: media("graduations/performance.m4v"), short: "Игры, музыка и общий яркий финал для первого школьного выпускного.", description: "Программа для класса после 4 класса с ведущими, диджеем, интерактивами и выбранным шоу.", includes: ["два ведущих", "диджей и звук", "игры для класса", "праздничный финал"] }),
  service({ id: "graduation-grade-9", category: "graduations", subgroup: "grade-9", title: "Выпускной после 9 класса", badge: "Для подростков", duration: "от 60 минут", image: media("graduations/photo-496.jpg"), gallery: [media("graduations/photo-496.jpg"), media("graduations/photo-497.jpg"), media("graduations/photo-483.jpg")], short: "Драйвовый выпускной с ведущими, диджеем и современными интерактивами.", description: "Подростковая программа после 9 класса: музыка, челленджи, командные задания и шоу на выбор.", includes: ["два ведущих", "диджей и звук", "интерактивы", "шоу на выбор"] }),
  service({ id: "graduation-grade-11", category: "graduations", subgroup: "grade-11", title: "Выпускной после 11 класса", badge: "Большой финал", duration: "от 60 минут", image: media("graduations/photo-557.jpg"), gallery: [media("graduations/photo-557.jpg"), media("graduations/photo-500.jpg"), media("graduations/photo-483.jpg")], short: "Большой школьный финал с ведущими, музыкой и зрелищным шоу.", description: "Программа после 11 класса собирается под площадку и класс: ведущие, профессиональный звук, интерактивы и кульминация.", includes: ["два ведущих", "диджей и звук", "индивидуальный сценарий", "большое шоу"] }),
  service({ id: "graduation-color-boom", category: "graduations", subgroup: "packages", title: "Пакет «Красочный БУМ»", badge: "Готовый пакет", duration: "60 минут", price: 35000, image: media("graduations/photo-483.jpg"), gallery: [media("graduations/photo-483.jpg"), media("graduations/photo-500.jpg")], short: "Два ведущих, диджей, профессиональный звук и наборы красок для класса.", description: "Готовая часовая программа выпускного с общим красочным финалом.", includes: ["два ведущих", "диджей и звук", "индивидуальные наборы краски", "общий финал"] }),
  service({ id: "graduation-mega-show", category: "graduations", subgroup: "packages", title: "Пакет «Мега-шоу»", badge: "Большой пакет", duration: "от 60 минут", price: 45000, image: media("graduations/photo-500.jpg"), gallery: [media("graduations/photo-500.jpg"), media("graduations/photo-557.jpg")], short: "Ведущие, диджей, краски Холи и одно большое шоу на выбор.", description: "Всё из «Красочного БУМа» и кульминация на выбор: крио, серебряная дискотека, поролон или другое доступное шоу.", includes: ["два ведущих", "диджей и звук", "краски Холи", "одно шоу на выбор"] }),

  service({ id: "face-painting", category: "services", subgroup: "stations", title: "Аквагрим", badge: "Выездная станция", duration: "по времени мероприятия", image: media("services/aqua-face-painting/photo-380.jpg"), gallery: [media("services/aqua-face-painting/photo-380.jpg"), media("services/aqua-face-painting/photo-528.jpg")], short: "Яркие рисунки на лице безопасными профессиональными красками.", description: "Приезжаем на площадку со столом, материалами и всем необходимым для работы мастера.", includes: ["мастер", "профессиональные краски", "оборудование", "уборка рабочего места"] }),
  service({ id: "cotton-candy", category: "services", subgroup: "stations", title: "Сладкая вата", badge: "Выездная станция", duration: "по времени мероприятия", image: media("services/cotton-candy/photo-524.jpg"), gallery: [media("services/cotton-candy/photo-524.jpg")], video: media("services/shared/service-stations.m4v"), short: "Готовим сладкую вату прямо на мероприятии.", description: "Привозим аппарат, расходные материалы и оператора. Заранее согласуем количество гостей и доступ к электричеству.", includes: ["аппарат", "оператор", "расходные материалы", "подача гостям"] }),
  service({ id: "popcorn", category: "services", subgroup: "stations", title: "Попкорн", badge: "Выездная станция", duration: "по времени мероприятия", image: media("services/popcorn/photo-525.jpg"), gallery: [media("services/popcorn/photo-525.jpg")], video: media("services/shared/service-stations.m4v"), short: "Свежий попкорн из аппарата для детей и взрослых.", description: "Устанавливаем аппарат на площадке, готовим порции и обслуживаем гостей в согласованное время.", includes: ["аппарат", "оператор", "продукты и упаковка", "подача гостям"] }),

  service({ id: "santa-bus", category: "programs", subgroup: "seasonal", title: "Автобус Деда Мороза", badge: "Последнее предложение", duration: "60 минут", price: 1900, priceUnit: "с человека", image: media("santa-bus/cover.jpg"), gallery: [media("santa-bus/cover.jpg")], short: "Впервые в Большом Камне: часовое новогоднее приключение внутри праздничного автобуса.", description: "Танцы, песни, интерактивы и аттракцион эмоций — дети будут в восторге. Каждому ребёнку — блеск-тату и новогодний коктейль. Даты: 21–24 декабря. Бронирование: +7 (994) 994-04-33. Места ограничены.", includes: ["часовая программа", "танцы и песни", "блеск-тату каждому ребёнку", "новогодний коктейль"] }),
  service({ id: "custom-party-package", category: "programs", subgroup: "packages", title: "Праздник под ключ", badge: "Соберём под вас", duration: "от 60 минут", image: media("graduations/photo-500.jpg"), gallery: [media("graduations/photo-500.jpg"), media("shows/neon/photo-559.jpg"), media("shows/silver/photo-400.jpg")], short: "Герои, ведущие, шоу и праздничные станции в одном сценарии.", description: "Соберём программу под возраст, площадку, количество гостей и ваш бюджет.", includes: ["единый сценарий", "ведущие и герои", "шоу на выбор", "координация программы"] }),
];

export const currentOffer = services.find((item) => item.id === "santa-bus");

export const reviews = [
  { text: "Спасибо вам огромное за праздник — дочка очень рада!", context: "Детский день рождения", source: "Отзыв из Telegram-канала" },
  { text: "Дети с удовольствием участвовали в конкурсах и танцевали. Всем всё очень понравилось.", context: "Праздник с аниматорами", source: "Отзыв из Telegram-канала" },
  { text: "Спасибо огромное, вы — чудо. Мама очень счастлива и ещё долго будет вспоминать этот сюрприз.", context: "Поздравление с большим медведем", source: "Отзыв из Telegram-канала" },
  { text: "Всегда на связи, слышат и поддерживают любые идеи, создают атмосферу праздника за секунды.", context: "Сюрприз для подруги", source: "Видеоотзыв клиента" },
];

export const steps = [
  { number: "01", icon: "✦", title: "Выберите формат", text: "Герой, экспресс, шоу, выпускной, услуга или готовый пакет." },
  { number: "02", icon: "+", title: "Соберите заявку", text: "Добавьте подходящие варианты в одну корзину." },
  { number: "03", icon: "✓", title: "Уточним детали", text: "Проверим дату, место и подтвердим точную стоимость." },
];

export function getService(id) {
  return services.find((item) => item.id === id);
}
