/*
  Video recommendation data — the ONLY file you need to touch to change
  what shows up in the right-hand "Learning Videos" sidebar.

  video-sidebar.js (same folder) is the reusable component; it reads this
  object and renders whatever topic key matches the current page's
  data-topic attribute. Add a new page/topic by adding a new key here —
  no changes to video-sidebar.js required.

  Each entry:
    title    - short, descriptive label for the card
    channel  - the recommended channel/creator
    lang     - 'ru' or 'en' (drives the flag badge)
    query    - search terms used to build a live, always-valid YouTube
               search link (channel + topic keywords)
    thumbClass - one of 'tc-1'..'tc-5', just a color variant for the
               placeholder thumbnail (swap for a real thumbnail URL by
               adding a `thumb: "https://..."` field instead)

  NOTE: these point to scoped YouTube searches (channel + exact grammar
  point) rather than a single pinned video ID, so every link is guaranteed
  to resolve to real, relevant results even as videos get added/removed/
  reordered on YouTube. Swap in `thumb`/`url` with a specific video's real
  thumbnail + watch URL any time — the component doesn't care which you use.
*/
(function () {
  window.VIDEO_RECOMMENDATIONS = {

    'r1': [ // Third tone sandhi
      { title: 'Third Tone Sandhi Rule — 3rd Tone + 3rd Tone', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese third tone sandhi rule nihao', thumbClass:'tc-1' },
      { title: 'Mandarin Tone Pairs: Third Tone Changes', channel: 'Mandarin Corner', lang: 'en', query: 'Mandarin Corner third tone sandhi tone pairs', thumbClass:'tc-2' },
      { title: 'Chinese Tone Sandhi for Beginners', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod tone sandhi third tone beginner', thumbClass:'tc-3' },
      { title: 'Третий тон в китайском — правило сандхи', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский третий тон сандхи правило', thumbClass:'tc-4' },
      { title: 'Изменение третьего тона в потоке речи', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский третий тон изменение сандхи', thumbClass:'tc-5' }
    ],

    'r2': [ // 不 tone change before 4th tone
      { title: '不 (bù) Tone Change Rule Explained', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese bu tone change fourth tone rule', thumbClass:'tc-2' },
      { title: 'When Does 不 Become bú? Tone Sandhi', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod bu bú tone sandhi fourth tone', thumbClass:'tc-3' },
      { title: 'Mandarin Tone Changes: 不 Before 4th Tone', channel: 'Grace Mandarin Chinese', lang: 'en', query: 'Grace Mandarin Chinese bu tone change before fourth tone', thumbClass:'tc-4' },
      { title: 'Изменение тона 不 (bù → bú)', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский 不 bu изменение тона четвертый тон', thumbClass:'tc-5' },
      { title: '不 перед четвёртым тоном — bú', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский 不 bu bú четвертый тон', thumbClass:'tc-1' }
    ],

    'r3': [ // 了 changes the negation word
      { title: '了 vs 没 vs 不 — Chinese Negation Explained', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese 了 没 不 negation grammar' , thumbClass:'tc-1'},
      { title: 'How to Negate Sentences with 没 and 不', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod 没 不 negation beginner', thumbClass:'tc-2' },
      { title: '没 vs 不 — Beginner Chinese Grammar', channel: 'Grace Mandarin Chinese', lang: 'en', query: 'Grace Mandarin Chinese 没 不 negation', thumbClass:'tc-3' },
      { title: 'Китайский язык: отрицание 不 и 没', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский язык отрицание 不 没', thumbClass:'tc-4' },
      { title: '没 и 不 — как правильно отрицать в китайском', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский 没 不 отрицание', thumbClass:'tc-5' }
    ],

    'r4': [ // No tenses, only the verb
      { title: 'Chinese Grammar: No Verb Tenses! (了 / 过 / 在)', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese Chinese has no tenses 了 过 在', thumbClass:'tc-2' },
      { title: 'Understanding Chinese Aspect Particles 了 过 在', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod aspect particles 了 过 在', thumbClass:'tc-3' },
      { title: 'Talking About Time in Chinese Without Tenses', channel: 'Mandarin Corner', lang: 'en', query: 'Mandarin Corner time without tenses 了 过', thumbClass:'tc-4' },
      { title: 'Как выразить время без времён глагола', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский язык время без времён глагола 了 过 在', thumbClass:'tc-5' },
      { title: 'Частицы 了, 过, 在 — вид действия в китайском', channel: 'Магазета', lang: 'ru', query: 'Магазета китайский язык 了 过 在 вид действия', thumbClass:'tc-1' }
    ],

    'r5': [ // Location: S + 在 + 哪儿/那儿/这儿
      { title: "How to Say Where Something Is (在 + 哪儿/那儿/这儿)", channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese 在 哪儿 那儿 这儿 location', thumbClass:'tc-3' },
      { title: "Asking & Answering 'Where' in Chinese", channel: 'Grace Mandarin Chinese', lang: 'en', query: 'Grace Mandarin Chinese where is 在 哪儿', thumbClass:'tc-4' },
      { title: 'Location Sentences with 在 for Beginners', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod 在 location sentence beginner', thumbClass:'tc-5' },
      { title: '在 哪儿/那儿/这儿 — где, там, здесь по-китайски', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский 在 哪儿 那儿 这儿 где там здесь', thumbClass:'tc-1' },
      { title: "Как спросить 'где' — 在哪儿", channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский язык 在哪儿 где находится', thumbClass:'tc-2' }
    ],

    'r6': [ // S + V + IO + DO
      { title: 'Chinese Sentences with Two Objects (给 IO + DO)', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese double object 给 indirect direct object', thumbClass:'tc-4' },
      { title: 'Using 给, 教, 送, 问 with Two Objects', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod 给 教 送 问 double object grammar', thumbClass:'tc-5' },
      { title: 'Giving and Asking — Double Object Verbs in Chinese', channel: 'Mandarin Corner', lang: 'en', query: 'Mandarin Corner double object verbs 给 教 送', thumbClass:'tc-1' },
      { title: '给 教 送 问 — двойное дополнение в китайском', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский 给 教 送 问 двойное дополнение', thumbClass:'tc-2' },
      { title: 'Косвенное и прямое дополнение в китайском языке', channel: 'Магазета', lang: 'ru', query: 'Магазета китайский косвенное прямое дополнение 给', thumbClass:'tc-3' }
    ],

    'r7': [ // S + V + O + V + 得 + Complement
      { title: 'The Complement 得 (de) — How Well You Do Something', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese 得 de complement how well', thumbClass:'tc-5' },
      { title: 'Degree Complements with 得 Explained', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod degree complement 得 grammar', thumbClass:'tc-1' },
      { title: 'V + 得 + Adjective — Chinese Manner Complement', channel: 'Grace Mandarin Chinese', lang: 'en', query: 'Grace Mandarin Chinese 得 manner complement adjective', thumbClass:'tc-2' },
      { title: 'Дополнение степени 得', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский язык 得 дополнение степени', thumbClass:'tc-3' },
      { title: '得 — как оценить действие в китайском языке', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский 得 оценка действия', thumbClass:'tc-4' }
    ],

    'r8': [ // 是 vs 很
      { title: "是 vs 很 — Chinese 'To Be' with Adjectives", channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese 是 很 to be adjectives', thumbClass:'tc-1' },
      { title: "Why You Don't Need 是 Before Adjectives", channel: 'ChinesePod', lang: 'en', query: 'ChinesePod 是 很 adjectives no shi', thumbClass:'tc-2' },
      { title: '很 + Adjective — Common Beginner Mistake', channel: 'Grace Mandarin Chinese', lang: 'en', query: 'Grace Mandarin Chinese 很 adjective mistake beginner', thumbClass:'tc-3' },
      { title: '是 и 很 — глагол-связка', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский язык 是 很 связка быть', thumbClass:'tc-4' },
      { title: '是 vs 很 — когда какое слово использовать', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский 是 很 разница', thumbClass:'tc-5' }
    ],

    'r9': [ // Result Complement 结果补语
      { title: 'Result Complements in Chinese (写完, 洗干净, 摔破)', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese result complement 结果补语 写完 洗干净', thumbClass:'tc-2' },
      { title: 'Chinese Result Complements Explained', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod result complement grammar 结果补语', thumbClass:'tc-3' },
      { title: 'Verb + Result — How Chinese Shows Outcome', channel: 'Mandarin Corner', lang: 'en', query: 'Mandarin Corner verb result complement outcome', thumbClass:'tc-4' },
      { title: '结果补语 — результативный комплемент', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский 结果补语 результативный комплемент', thumbClass:'tc-5' },
      { title: 'Результативные морфемы после глагола', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский язык результативные морфемы 完 干净 破', thumbClass:'tc-1' }
    ],

    'r10': [ // Directional complement 趋向补语
      { title: 'Directional Complements in Chinese (上/下/进/出/回/过)', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese directional complement 趋向补语 shang xia jin chu', thumbClass:'tc-3' },
      { title: 'Simple vs Compound Directional Complements', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod simple compound directional complement lai qu', thumbClass:'tc-4' },
      { title: 'Verb + 来/去 — Direction Toward or Away from Speaker', channel: 'Mandarin Corner', lang: 'en', query: 'Mandarin Corner directional complement lai qu speaker viewpoint', thumbClass:'tc-5' },
      { title: 'Направительные комплементы 上下进出回过 来去', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский направительный комплемент 上下进出回过 来去', thumbClass:'tc-1' },
      { title: 'Глаголы движения с 来/去 в китайском', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский язык глаголы движения 来 去 направление', thumbClass:'tc-2' }
    ],

    'r11': [ // Measure words 量词
      { title: 'Chinese Measure Words (量词) for Beginners', channel: 'Yoyo Chinese', lang: 'en', query: 'Yoyo Chinese measure words liangci beginner 个 本 只', thumbClass:'tc-4' },
      { title: '两 vs 二 — When to Use Which "Two"', channel: 'ChinesePod', lang: 'en', query: 'ChinesePod liang vs er two measure word', thumbClass:'tc-5' },
      { title: 'The Ultimate Guide to Chinese Measure Words', channel: 'Mandarin Corner', lang: 'en', query: 'Mandarin Corner Chinese measure words guide 量词', thumbClass:'tc-1' },
      { title: 'Счётные слова 量词 в китайском языке', channel: 'Хуалань', lang: 'ru', query: 'Хуалань китайский счётные слова 量词 个 本 只', thumbClass:'tc-2' },
      { title: '两 и 二 — разница между "два"', channel: 'Полиглот', lang: 'ru', query: 'Полиглот китайский язык 两 二 разница два', thumbClass:'tc-3' }
    ]

  };
})();
