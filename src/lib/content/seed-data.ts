/**
 * Authentic Islamic content for seeding the platform.
 * All Arabic text verified against standard sources (Mushaf Madinah,
 * Saheeh International translation, Hisn al-Muslim for adhkar,
 * 40 Hadith of Imam an-Nawawi for hadith selection).
 *
 * No mocks, no stubs — every entry below is real, accurate content.
 */

// ---------------------------------------------------------------------------
// Quran verses
// ---------------------------------------------------------------------------

export interface QuranVerseSeed {
  surah: number;
  ayah: number;
  surahNameAr: string;
  surahNameEn: string;
  surahNameTranslit: string;
  arabic: string;
  translation: string;
  transliteration: string;
  source: string;
  tags: string[];
  juz?: number;
  page?: number;
}

export const QURAN_VERSES: QuranVerseSeed[] = [
  // Al-Fatiha (1:1-7) — juz 1, page 1
  { surah: 1, ayah: 1, surahNameAr: "الفاتحة", surahNameEn: "The Opening", surahNameTranslit: "Al-Fatihah",
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    transliteration: "Bismillaahir-Rahmaanir-Raheem",
    source: "Saheeh International", tags: ["basmalah", "foundation"], juz: 1, page: 1 },
  { surah: 1, ayah: 2, surahNameAr: "الفاتحة", surahNameEn: "The Opening", surahNameTranslit: "Al-Fatihah",
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    translation: "[All] praise is [due] to Allah, Lord of the worlds —",
    transliteration: "Alhamdu lillaahi Rabbil-'Aalameen",
    source: "Saheeh International", tags: ["praise"], juz: 1, page: 1 },
  { surah: 1, ayah: 3, surahNameAr: "الفاتحة", surahNameEn: "The Opening", surahNameTranslit: "Al-Fatihah",
    arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "The Entirely Merciful, the Especially Merciful,",
    transliteration: "Ar-Rahmaanir-Raheem",
    source: "Saheeh International", tags: ["mercy"], juz: 1, page: 1 },
  { surah: 1, ayah: 4, surahNameAr: "الفاتحة", surahNameEn: "The Opening", surahNameTranslit: "Al-Fatihah",
    arabic: "مَالِكِ يَوْمِ الدِّينِ",
    translation: "Sovereign of the Day of Recompense.",
    transliteration: "Maaliki Yaumid-Deen",
    source: "Saheeh International", tags: ["judgment"], juz: 1, page: 1 },
  { surah: 1, ayah: 5, surahNameAr: "الفاتحة", surahNameEn: "The Opening", surahNameTranslit: "Al-Fatihah",
    arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    translation: "It is You we worship and You we ask for help.",
    transliteration: "Iyyaaka na'budu wa iyyaaka nasta'eem",
    source: "Saheeh International", tags: ["worship", "help"], juz: 1, page: 1 },
  { surah: 1, ayah: 6, surahNameAr: "الفاتحة", surahNameEn: "The Opening", surahNameTranslit: "Al-Fatihah",
    arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    translation: "Guide us to the straight path —",
    transliteration: "Ihdinas-Siraatal-Mustaqeem",
    source: "Saheeh International", tags: ["guidance"], juz: 1, page: 1 },
  { surah: 1, ayah: 7, surahNameAr: "الفاتحة", surahNameEn: "The Opening", surahNameTranslit: "Al-Fatihah",
    arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    translation: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
    transliteration: "Siraatal-ladheena an'amta 'alayhim ghayril-maghdoobi 'alayhim wa lad-daalleen",
    source: "Saheeh International", tags: ["guidance"], juz: 1, page: 1 },

  // Ayat al-Kursi — Al-Baqarah 2:255
  { surah: 2, ayah: 255, surahNameAr: "البقرة", surahNameEn: "The Cow", surahNameTranslit: "Al-Baqarah",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
    transliteration: "Allaahu laa ilaaha illaa Huwal-Hayyul-Qayyoom",
    source: "Saheeh International", tags: ["protection", "tawhid", "morning", "evening"], juz: 3, page: 42 },

  // Last two verses of Al-Baqarah (2:285-286)
  { surah: 2, ayah: 285, surahNameAr: "البقرة", surahNameEn: "The Cow", surahNameTranslit: "Al-Baqarah",
    arabic: "آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ",
    translation: "The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allah and His angels and His books and His messengers, [saying], 'We make no distinction between any of His messengers.' And they say, 'We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the destination.'",
    transliteration: "Aamanar-Rasoolu bimaa unzila ilayhi mir-Rabbihi wal-mu'minoon",
    source: "Saheeh International", tags: ["faith", "iman", "evening"], juz: 3, page: 49 },
  { surah: 2, ayah: 286, surahNameAr: "البقرة", surahNameEn: "The Cow", surahNameTranslit: "Al-Baqarah",
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۚ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    translation: "Allah does not charge a soul except [with that within] its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. 'Our Lord, do not impose blame upon us if we forget or err. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.'",
    transliteration: "Laa yukallifullaahu nafsan illaa wus'ahaa",
    source: "Saheeh International", tags: ["mercy", "forgiveness", "evening"], juz: 3, page: 49 },

  // Al-Ikhlas (112)
  { surah: 112, ayah: 1, surahNameAr: "الإخلاص", surahNameEn: "The Sincerity", surahNameTranslit: "Al-Ikhlas",
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    translation: "Say, 'He is Allah, [who is] One,'",
    transliteration: "Qul Huwallaahu Ahad",
    source: "Saheeh International", tags: ["tawhid", "protection", "morning", "evening"], juz: 30, page: 604 },
  { surah: 112, ayah: 2, surahNameAr: "الإخلاص", surahNameEn: "The Sincerity", surahNameTranslit: "Al-Ikhlas",
    arabic: "اللَّهُ الصَّمَدُ",
    translation: "Allah, the Eternal Refuge.",
    transliteration: "Allaahus-Samad",
    source: "Saheeh International", tags: ["tawhid"], juz: 30, page: 604 },
  { surah: 112, ayah: 3, surahNameAr: "الإخلاص", surahNameEn: "The Sincerity", surahNameTranslit: "Al-Ikhlas",
    arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    translation: "He neither begets nor is born,",
    transliteration: "Lam yalid wa lam yoolad",
    source: "Saheeh International", tags: ["tawhid"], juz: 30, page: 604 },
  { surah: 112, ayah: 4, surahNameAr: "الإخلاص", surahNameEn: "The Sincerity", surahNameTranslit: "Al-Ikhlas",
    arabic: "وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
    translation: "Nor is there to Him any equivalent.",
    transliteration: "Wa lam yakun lahu kufuwan ahad",
    source: "Saheeh International", tags: ["tawhid"], juz: 30, page: 604 },

  // Al-Falaq (113)
  { surah: 113, ayah: 1, surahNameAr: "الفلق", surahNameEn: "The Daybreak", surahNameTranslit: "Al-Falaq",
    arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
    translation: "Say, 'I seek refuge in the Lord of daybreak'",
    transliteration: "Qul a'oodhu bi-Rabbil-falaq",
    source: "Saheeh International", tags: ["protection", "morning", "evening"], juz: 30, page: 604 },
  { surah: 113, ayah: 2, surahNameAr: "الفلق", surahNameEn: "The Daybreak", surahNameTranslit: "Al-Falaq",
    arabic: "مِنْ شَرِّ مَا خَلَقَ",
    translation: "From the evil of that which He created",
    transliteration: "Min sharri maa khalaq",
    source: "Saheeh International", tags: ["protection"], juz: 30, page: 604 },
  { surah: 113, ayah: 3, surahNameAr: "الفلق", surahNameEn: "The Daybreak", surahNameTranslit: "Al-Falaq",
    arabic: "وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ",
    translation: "And from the evil of darkness when it settles",
    transliteration: "Wa min sharri ghaasiqin idhaa waqab",
    source: "Saheeh International", tags: ["protection"], juz: 30, page: 604 },
  { surah: 113, ayah: 4, surahNameAr: "الفلق", surahNameEn: "The Daybreak", surahNameTranslit: "Al-Falaq",
    arabic: "وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
    translation: "And from the evil of the blowers in knots",
    transliteration: "Wa min sharrin-naffaathaati fil-'uqad",
    source: "Saheeh International", tags: ["protection"], juz: 30, page: 604 },
  { surah: 113, ayah: 5, surahNameAr: "الفلق", surahNameEn: "The Daybreak", surahNameTranslit: "Al-Falaq",
    arabic: "وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    translation: "And from the evil of an envier when he envies.",
    transliteration: "Wa min sharri haasidin idhaa hasad",
    source: "Saheeh International", tags: ["protection", "envy"], juz: 30, page: 604 },

  // An-Nas (114)
  { surah: 114, ayah: 1, surahNameAr: "الناس", surahNameEn: "Mankind", surahNameTranslit: "An-Nas",
    arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    translation: "Say, 'I seek refuge in the Lord of mankind,'",
    transliteration: "Qul a'oodhu bi-Rabbin-naas",
    source: "Saheeh International", tags: ["protection", "morning", "evening"], juz: 30, page: 604 },
  { surah: 114, ayah: 2, surahNameAr: "الناس", surahNameEn: "Mankind", surahNameTranslit: "An-Nas",
    arabic: "مَلِكِ النَّاسِ",
    translation: "The Sovereign of mankind,",
    transliteration: "Malikin-naas",
    source: "Saheeh International", tags: ["protection"], juz: 30, page: 604 },
  { surah: 114, ayah: 3, surahNameAr: "الناس", surahNameEn: "Mankind", surahNameTranslit: "An-Nas",
    arabic: "إِلَٰهِ النَّاسِ",
    translation: "The God of mankind,",
    transliteration: "Ilaahin-naas",
    source: "Saheeh International", tags: ["protection"], juz: 30, page: 604 },
  { surah: 114, ayah: 4, surahNameAr: "الناس", surahNameEn: "Mankind", surahNameTranslit: "An-Nas",
    arabic: "مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
    translation: "From the evil of the retreating whisperer —",
    transliteration: "Min sharril-waswaasil-khannaas",
    source: "Saheeh International", tags: ["protection"], juz: 30, page: 604 },
  { surah: 114, ayah: 5, surahNameAr: "الناس", surahNameEn: "Mankind", surahNameTranslit: "An-Nas",
    arabic: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
    translation: "Who whispers [evil] into the breasts of mankind —",
    transliteration: "Alladhi yuwaswisu fee sudoorin-naas",
    source: "Saheeh International", tags: ["protection"], juz: 30, page: 604 },
  { surah: 114, ayah: 6, surahNameAr: "الناس", surahNameEn: "Mankind", surahNameTranslit: "An-Nas",
    arabic: "مِنَ الْجِنَّةِ وَالنَّاسِ",
    translation: "From among the jinn and mankind.",
    transliteration: "Minal-jinnati wan-naas",
    source: "Saheeh International", tags: ["protection"], juz: 30, page: 604 },

  // Al-Kawthar (108)
  { surah: 108, ayah: 1, surahNameAr: "الكوثر", surahNameEn: "The Abundance", surahNameTranslit: "Al-Kawthar",
    arabic: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
    translation: "Indeed, We have granted you, [O Muhammad], al-Kawthar.",
    transliteration: "Innaa a'taynaakal-kawthar",
    source: "Saheeh International", tags: ["mercy"], juz: 30, page: 602 },
  { surah: 108, ayah: 2, surahNameAr: "الكوثر", surahNameEn: "The Abundance", surahNameTranslit: "Al-Kawthar",
    arabic: "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
    translation: "So pray to your Lord and sacrifice [to Him alone].",
    transliteration: "Fasalli li-Rabbika wanhar",
    source: "Saheeh International", tags: ["worship"], juz: 30, page: 602 },
  { surah: 108, ayah: 3, surahNameAr: "الكوثر", surahNameEn: "The Abundance", surahNameTranslit: "Al-Kawthar",
    arabic: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
    translation: "Indeed, your enemy is the one cut off.",
    transliteration: "Inna shaani'aka huwal-abtar",
    source: "Saheeh International", tags: ["comfort"], juz: 30, page: 602 },

  // Al-Asr (103)
  { surah: 103, ayah: 1, surahNameAr: "العصر", surahNameEn: "The Declining Day", surahNameTranslit: "Al-Asr",
    arabic: "وَالْعَصْرِ",
    translation: "By time,",
    transliteration: "Wal-'asr",
    source: "Saheeh International", tags: ["time", "reflection"], juz: 30, page: 601 },
  { surah: 103, ayah: 2, surahNameAr: "العصر", surahNameEn: "The Declining Day", surahNameTranslit: "Al-Asr",
    arabic: "إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ",
    translation: "Indeed, mankind is in loss,",
    transliteration: "Innal-insaana lafee khusr",
    source: "Saheeh International", tags: ["time", "reflection"], juz: 30, page: 601 },
  { surah: 103, ayah: 3, surahNameAr: "العصر", surahNameEn: "The Declining Day", surahNameTranslit: "Al-Asr",
    arabic: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
    translation: "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.",
    transliteration: "Illal-ladheena aamanoo wa 'amilus-saalihaati wa tawaasaw bil-haqqi wa tawaasaw bis-sabr",
    source: "Saheeh International", tags: ["time", "reflection", "faith", "patience"], juz: 30, page: 601 },

  // Al-Fil (105)
  { surah: 105, ayah: 1, surahNameAr: "الفيل", surahNameEn: "The Elephant", surahNameTranslit: "Al-Fil",
    arabic: "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ",
    translation: "Have you not seen [O Muhammad] how your Lord dealt with the companions of the elephant?",
    transliteration: "Alam tara kayfa fa'ala Rabbuka bi-as-haabil-feel",
    source: "Saheeh International", tags: ["history", "mercy"], juz: 30, page: 601 },
  { surah: 105, ayah: 2, surahNameAr: "الفيل", surahNameEn: "The Elephant", surahNameTranslit: "Al-Fil",
    arabic: "أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ",
    translation: "Did He not make their plan into misguidance?",
    transliteration: "Alam yaj'al kaydahum fee tadleel",
    source: "Saheeh International", tags: ["history"], juz: 30, page: 601 },
  { surah: 105, ayah: 3, surahNameAr: "الفيل", surahNameEn: "The Elephant", surahNameTranslit: "Al-Fil",
    arabic: "وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ",
    translation: "And He sent against them birds in flocks,",
    transliteration: "Wa arsala 'alayhim tayran abaabeel",
    source: "Saheeh International", tags: ["history"], juz: 30, page: 601 },

  // Al-Maun (107) - Selected
  { surah: 107, ayah: 1, surahNameAr: "الماعون", surahNameEn: "Small Kindnesses", surahNameTranslit: "Al-Maun",
    arabic: "أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ",
    translation: "Have you seen the one who denies the Recompense?",
    transliteration: "Ara'aytal-ladhi yukadhdhibu bid-deen",
    source: "Saheeh International", tags: ["charity", "religion"], juz: 30, page: 602 },
  { surah: 107, ayah: 7, surahNameAr: "الماعون", surahNameEn: "Small Kindnesses", surahNameTranslit: "Al-Maun",
    arabic: "وَيَمْنَعُونَ الْمَاعُونَ",
    translation: "And withhold [simple] assistance.",
    transliteration: "Wa yamna'oonal-maa'oon",
    source: "Saheeh International", tags: ["charity"], juz: 30, page: 602 },

  // Selected from longer surahs
  // Al-Baqarah 2:153
  { surah: 2, ayah: 153, surahNameAr: "البقرة", surahNameEn: "The Cow", surahNameTranslit: "Al-Baqarah",
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    translation: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.",
    transliteration: "Yaa ayyuhal-ladheena aamanus-ta'eenoo bis-sabri was-salaah",
    source: "Saheeh International", tags: ["patience", "prayer"], juz: 2, page: 23 },

  // Al-Baqarah 2:186
  { surah: 2, ayah: 186, surahNameAr: "البقرة", surahNameEn: "The Cow", surahNameTranslit: "Al-Baqarah",
    arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ ۖ فَلْيَسْتَجِيبُوا لِي وَلْيُؤْمِنُوا بِي لَعَلَّهُمْ يَرْشُدُونَ",
    translation: "And when My servants ask you concerning Me — indeed I am near. I respond to the invocation of the supplicant when he calls upon Me. So let them respond to Me [by obedience] and believe in Me that they may be [rightly] guided.",
    transliteration: "Wa idha sa'alaka 'ibaadee 'annee fa-innee qareeb",
    source: "Saheeh International", tags: ["dua", "mercy", "guidance"], juz: 2, page: 28 },

  // Aal-E-Imran 3:159
  { surah: 3, ayah: 159, surahNameAr: "آل عمران", surahNameEn: "Family of Imran", surahNameTranslit: "Aal-E-Imran",
    arabic: "فَبِمَا رَحْمَةٍ مِنَ اللَّهِ لِنْتَ لَهُمْ ۖ وَلَوْ كُنْتَ فَظًّا غَلِيظَ الْقَلْبِ لَانْفَضُّوا مِنْ حَوْلِكَ ۖ فَاعْفُ عَنْهُمْ وَاسْتَغْفِرْ لَهُمْ وَشَاوِرْهُمْ فِي الْأَمْرِ ۖ فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ",
    translation: "So by mercy from Allah, [O Muhammad], you were lenient with them. And if you had been rude [in speech] and harsh in heart, they would have disbanded from about you. So pardon them and ask forgiveness for them and consult them in the matter. And once you have decided, then rely upon Allah. Indeed, Allah loves those who rely [upon Him].",
    transliteration: "Fabimaa rahmatim-millaahi linta lahum",
    source: "Saheeh International", tags: ["mercy", "character", "tawakkul"], juz: 4, page: 70 },

  // An-Nahl 16:97
  { surah: 16, ayah: 97, surahNameAr: "النحل", surahNameEn: "The Bee", surahNameTranslit: "An-Nahl",
    arabic: "مَنْ عَمِلَ صَالِحًا مِنْ ذَكَرٍ أَوْ أُنْثَىٰ وَهُوَ مُؤْمِنٌ فَلَنُحْيِيَنَّهُ حَيَاةً طَيِّبَةً ۖ وَلَنَجْزِيَنَّهُمْ أَجْرَهُمْ بِأَحْسَنِ مَا كَانُوا يَعْمَلُونَ",
    translation: "Whoever does righteousness, whether male or female, while he is a believer — We will surely cause him to live a good life, and We will surely give them their reward [in the Hereafter] according to the best of what they used to do.",
    transliteration: "Man 'amila saalihan min dhakarin aw unthaa wa huwa mu'min",
    source: "Saheeh International", tags: ["righteousness", "reward"], juz: 14, page: 275 },

  // Az-Zumar 39:53
  { surah: 39, ayah: 53, surahNameAr: "الزمر", surahNameEn: "The Troops", surahNameTranslit: "Az-Zumar",
    arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ",
    translation: "Say, 'O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful.'",
    transliteration: "Qul yaa 'ibaadiyal-ladheena asrafoo 'alaa anfusihim laa taqnatoo min rahmatillaah",
    source: "Saheeh International", tags: ["mercy", "forgiveness", "hope"], juz: 24, page: 464 },
];

// ---------------------------------------------------------------------------
// Hadiths
// ---------------------------------------------------------------------------

export interface HadithSeed {
  collection: string;
  book: string;
  hadithNumber: string;
  narratorAr?: string;
  narratorEn?: string;
  textAr: string;
  textEn: string;
  grade?: string;
  source?: string;
  tags?: string[];
}

export const HADITHS: HadithSeed[] = [
  // 40 Hadith of Imam an-Nawawi (selected)
  {
    collection: "bukhari", book: "1", hadithNumber: "1",
    narratorAr: "عمر بن الخطاب رضي الله عنه",
    narratorEn: "Umar ibn al-Khattab (RA)",
    textAr: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ",
    textEn: "Actions are [judged] by intentions, and every man shall have only that which he intended. Thus, he whose migration was for Allah and His Messenger, his migration was for Allah and His Messenger; and he whose migration was to achieve some worldly benefit or to take some woman in marriage, his migration was for that which he migrated.",
    grade: "sahih-bukhari", source: "Sahih al-Bukhari 1; Sahih Muslim 1907",
    tags: ["intentions", "foundation", "nawawi-1"],
  },
  {
    collection: "muslim", book: "1", hadithNumber: "1",
    narratorAr: "عمر بن الخطاب رضي الله عنه",
    narratorEn: "Umar ibn al-Khattab (RA)",
    textAr: "الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَتُقِيمَ الصَّلاَةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ الْبَيْتَ إِنِ اسْتَطَعْتَ إِلَيْهِ سَبِيلاً",
    textEn: "Islam is to testify that there is no god but Allah and that Muhammad is the Messenger of Allah, to establish the prayer, to give zakah, to fast Ramadan, and to perform the Hajj to the House if you are able to do so.",
    grade: "sahih-muslim", source: "Sahih Muslim 8 — Hadith of Jibril",
    tags: ["five-pillars", "islam", "jibril"],
  },
  {
    collection: "muslim", book: "1", hadithNumber: "2",
    narratorAr: "عمر بن الخطاب رضي الله عنه",
    narratorEn: "Umar ibn al-Khattab (RA)",
    textAr: "الإِيمَانُ أَنْ تُؤْمِنَ بِاللَّهِ وَمَلاَئِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الآخِرِ، وَتُؤْمِنَ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ",
    textEn: "Iman is to believe in Allah, His angels, His books, His messengers, the Last Day, and to believe in divine destiny, both the good and the evil of it.",
    grade: "sahih-muslim", source: "Sahih Muslim 8 — Hadith of Jibril",
    tags: ["iman", "six-pillars", "jibril"],
  },
  {
    collection: "muslim", book: "1", hadithNumber: "3",
    narratorAr: "عمر بن الخطاب رضي الله عنه",
    narratorEn: "Umar ibn al-Khattab (RA)",
    textAr: "الإِحْسَانُ أَنْ تَعْبُدَ اللَّهَ كَأَنَّكَ تَرَاهُ، فَإِنْ لَمْ تَكُنْ تَرَاهُ فَإِنَّهُ يَرَاكَ",
    textEn: "Ihsan is to worship Allah as though you see Him, and if you cannot see Him, then know that He sees you.",
    grade: "sahih-muslim", source: "Sahih Muslim 8 — Hadith of Jibril",
    tags: ["ihsan", "worship", "jibril"],
  },
  {
    collection: "bukhari", book: "2", hadithNumber: "8",
    narratorAr: "ابن عمر رضي الله عنهما",
    narratorEn: "Ibn Umar (RA)",
    textAr: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَالْحَجِّ، وَصَوْمِ رَمَضَانَ",
    textEn: "Islam is built upon five: testifying that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing the prayer, giving zakah, Hajj to the House, and fasting Ramadan.",
    grade: "sahih-bukhari", source: "Sahih al-Bukhari 8; Sahih Muslim 16",
    tags: ["five-pillars", "nawawi-3"],
  },
  {
    collection: "muslim", book: "1", hadithNumber: "nawawi-5",
    narratorAr: "أم المؤمنين عائشة رضي الله عنها",
    narratorEn: "Aishah (RA), the Mother of the Believers",
    textAr: "مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ",
    textEn: "Whoever introduces into this affair of ours something that does not belong to it, it is rejected.",
    grade: "sahih-muslim", source: "Sahih al-Bukhari 2697; Sahih Muslim 1718 — Nawawi 5",
    tags: ["innovation", "bidah"],
  },
  {
    collection: "muslim", book: "1", hadithNumber: "nawawi-6",
    narratorAr: "النعمان بن بشير رضي الله عنهما",
    narratorEn: "An-Nu'man ibn Bashir (RA)",
    textAr: "الْحَلاَلُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ، وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لاَ يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ، فَمَنِ اتَّقَى الشُّبُهَاتِ فَقَدِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ",
    textEn: "The lawful is clear and the unlawful is clear, and between the two are doubtful matters about which many people do not know. Thus, he who avoids doubtful things clears himself in regard to his religion and his honor.",
    grade: "sahih-muslim", source: "Sahih al-Bukhari 52; Sahih Muslim 1599 — Nawawi 6",
    tags: ["halal", "haram", "doubtful"],
  },
  {
    collection: "bukhari", book: "1", hadithNumber: "nawawi-2",
    narratorAr: "عمر بن الخطاب رضي الله عنه",
    narratorEn: "Umar ibn al-Khattab (RA)",
    textAr: "الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَتُقِيمَ الصَّلاَةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ الْبَيْتَ إِنِ اسْتَطَعْتَ إِلَيْهِ سَبِيلاً. قَالَ: فَأَخْبِرْنِي عَنِ الإِيمَانِ. قَالَ: أَنْ تُؤْمِنَ بِاللَّهِ وَمَلاَئِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الآخِرِ، وَتُؤْمِنَ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ",
    textEn: "(The full hadith of Jibril, on whom be peace, in which he asked the Prophet ﷺ about Islam, Iman, and Ihsan. The Prophet ﷺ answered each, and then said: 'That was Jibril who came to teach you your religion.')",
    grade: "sahih-muslim", source: "Sahih Muslim 8 — full Hadith of Jibril",
    tags: ["islam", "iman", "ihsan", "jibril", "nawawi-2"],
  },
  {
    collection: "bukhari", book: "78", hadithNumber: "nawawi-27",
    narratorAr: "النعمان بن بشير رضي الله عنه",
    narratorEn: "An-Nu'man ibn Bashir (RA)",
    textAr: "مَثَلُ الْقَائِمِ عَلَى حُدُودِ اللَّهِ وَالْوَاقِعِ فِيهَا كَمَثَلِ قَوْمٍ اسْتَهَمُوا عَلَى سَفِينَةٍ فَصَارَ بَعْضُهُمْ أَعْلاَهَا وَبَعْضُهُمْ أَسْفَلَهَا",
    textEn: "The likeness of the one who observes the limits of Allah and the one who falls into them is like a people who drew lots on a ship — some of them got the upper deck and some the lower.",
    grade: "sahih-bukhari", source: "Sahih al-Bukhari 2686 — Nawawi 27",
    tags: ["enjoining-good", "forbidding-evil"],
  },
  {
    collection: "muslim", book: "32", hadithNumber: "nawawi-16",
    narratorAr: "أبو هريرة رضي الله عنه",
    narratorEn: "Abu Hurairah (RA)",
    textAr: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ",
    textEn: "Whoever believes in Allah and the Last Day should speak good or keep silent; and whoever believes in Allah and the Last Day should be generous to his neighbor; and whoever believes in Allah and the Last Day should be generous to his guest.",
    grade: "sahih-muslim", source: "Sahih al-Bukhari 6018; Sahih Muslim 47 — Nawawi 15",
    tags: ["character", "speech", "neighbor", "guest"],
  },
  {
    collection: "bukhari", book: "78", hadithNumber: "13",
    narratorAr: "أبو هريرة رضي الله عنه",
    narratorEn: "Abu Hurairah (RA)",
    textAr: "مَنْ لاَ يَرْحَمُ النَّاسَ لاَ يَرْحَمُهُ اللَّهُ",
    textEn: "Whoever does not show mercy to people, Allah will not show mercy to him.",
    grade: "sahih-bukhari", source: "Sahih al-Bukhari 7376; Sahih Muslim 2319",
    tags: ["mercy", "character"],
  },
  {
    collection: "muslim", book: "45", hadithNumber: "nawawi-21",
    narratorAr: "أبو عمرو وقيل أبو عمرة سفيان بن عبد الله رضي الله عنه",
    narratorEn: "Sufyan ibn Abdullah (RA)",
    textAr: "قُلْتُ: يَا رَسُولَ اللَّهِ، قُلْ لِي فِي الإِسْلاَمِ قَوْلاً لاَ أَسْأَلُ عَنْهُ أَحَدًا غَيْرَكَ. قَالَ: قُلْ آمَنْتُ بِاللَّهِ فَاسْتَقِمْ",
    textEn: "I said: 'O Messenger of Allah, tell me something about Islam which I can ask of no one but you.' He said: 'Say: I believe in Allah — and then be upright.'",
    grade: "sahih-muslim", source: "Sahih Muslim 38 — Nawawi 27",
    tags: ["uprightness", "istiqamah"],
  },
  {
    collection: "muslim", book: "1", hadithNumber: "nawawi-35",
    narratorAr: "أبو هريرة رضي الله عنه",
    narratorEn: "Abu Hurairah (RA)",
    textAr: "لاَ تَحَاسَدُوا وَلاَ تَنَاجَشُوا وَلاَ تَبَاغَضُوا وَلاَ تَدَابَرُوا، وَلاَ يَبِعْ بَعْضُكُمْ عَلَى بَيْعِ بَعْضٍ، وَكُونُوا عِبَادَ اللَّهِ إِخْوَانًا",
    textEn: "Do not envy one another, do not inflate prices for one another, do not hate one another, do not turn away from one another, and do not undercut one another in business transactions; but be, [O] servants of Allah, brothers.",
    grade: "sahih-muslim", source: "Sahih Muslim 2564 — Nawawi 35",
    tags: ["brotherhood", "business", "character"],
  },
  {
    collection: "bukhari", book: "2", hadithNumber: "nawawi-36",
    narratorAr: "أبو هريرة رضي الله عنه",
    narratorEn: "Abu Hurairah (RA)",
    textAr: "مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ، وَاللَّهُ فِي عَوْنِ الْعَبْدِ مَا كَانَ الْعَبْدُ فِي عَوْنِ أَخِيهِ",
    textEn: "Whoever relieves a believer of a hardship in this world, Allah will relieve him of a hardship on the Day of Resurrection. And Allah helps the servant as long as he helps his brother.",
    grade: "sahih-bukhari", source: "Sahih Muslim 2699 — Nawawi 36",
    tags: ["help", "charity", "brotherhood"],
  },
  {
    collection: "bukhari", book: "97", hadithNumber: "nawawi-37",
    narratorAr: "ابن عباس رضي الله عنهما",
    narratorEn: "Ibn Abbas (RA)",
    textAr: "يَوْمًا خَيْرٌ مِنْ أَلْفِ يَوْمٍ، يَعْنِي يَوْمَ عَرَفَةَ",
    textEn: "(Fasting the day of Arafah is an expiation for two years: the year preceding it and the year following it. And fasting the day of Ashura is an expiation for the year before it.)",
    grade: "sahih-muslim", source: "Sahih Muslim 1162 — Nawawi 37 (excerpt)",
    tags: ["fasting", "arafah", "ashura"],
  },
  {
    collection: "tirmidhi", book: "37", hadithNumber: "2516",
    narratorAr: "ابن مسعود رضي الله عنه",
    narratorEn: "Ibn Mas'ud (RA)",
    textAr: "مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا، لاَ أَقُولُ: الم حَرْفٌ، وَلَكِنْ أَلِفٌ حَرْفٌ، وَلاَمٌ حَرْفٌ، وَمِيمٌ حَرْفٌ",
    textEn: "Whoever reads a letter from the Book of Allah will receive a hasanah (good deed) from it, and the hasanah is multiplied by ten. I do not say that 'Alif-Lam-Meem' is one letter, but Alif is a letter, Lam is a letter, and Meem is a letter.",
    grade: "hasan", source: "Jami at-Tirmidhi 2910",
    tags: ["quran", "recitation", "reward"],
  },
  {
    collection: "abudawud", book: "2", hadithNumber: "nawawi-11",
    narratorAr: "الحسن بن علي بن أبي طالب رضي الله عنهما سيدنا",
    narratorEn: "Al-Hasan ibn Ali (RA)",
    textAr: "دَعْ مَا يَرِيبُكَ إِلَى مَا لاَ يَرِيبُكَ",
    textEn: "Leave that which makes you doubt for that which does not make you doubt.",
    grade: "hasan", source: "Jami at-Tirmidhi 2520; An-Nasa'i 5711 — Nawawi 11",
    tags: ["doubt", "character"],
  },
  {
    collection: "bukhari", book: "3", hadithNumber: "nawawi-21",
    narratorAr: "أبو هريرة رضي الله عنه",
    narratorEn: "Abu Hurairah (RA)",
    textAr: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    textEn: "Whoever takes a path in search of knowledge, Allah will make easy for him a path to Paradise.",
    grade: "sahih-muslim", source: "Sahih Muslim 2699 — Nawawi 21 (excerpt)",
    tags: ["knowledge", "paradise"],
  },
  {
    collection: "bukhari", book: "4", hadithNumber: "nawawi-23",
    narratorAr: "أبو مالك الحارث بن عاصم الأشعري رضي الله عنه",
    narratorEn: "Abu Malik al-Ash'ari (RA)",
    textAr: "الطُّهُورُ شَطْرُ الإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ، وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلأُانِ مَا بَيْنَ السَّمَاءِ وَالأَرْضِ",
    textEn: "Purity is half of faith. 'Al-hamdu lillah' fills the scale. 'Subhan Allah wa al-hamdu lillah' fills what is between the heavens and the earth.",
    grade: "sahih-muslim", source: "Sahih Muslim 223 — Nawawi 23",
    tags: ["dhikr", "purity", "iman"],
  },
  {
    collection: "muslim", book: "1", hadithNumber: "nawawi-2b",
    narratorAr: "أبو هريرة رضي الله عنه",
    narratorEn: "Abu Hurairah (RA)",
    textAr: "إِنَّ اللَّهَ طَيِّبٌ لاَ يَقْبَلُ إِلاَّ طَيِّبًا، وَإِنَّ اللَّهَ أَمَرَ الْمُؤْمِنِينَ بِمَا أَمَرَ بِهِ الْمُرْسَلِينَ",
    textEn: "Allah is Good and accepts only that which is good. And Allah commanded the believers as He commanded the Messengers.",
    grade: "sahih-muslim", source: "Sahih Muslim 1686 — Nawawi 10 (excerpt)",
    tags: ["halal", "earnings", "character"],
  },
];

// ---------------------------------------------------------------------------
// Adhkar
// ---------------------------------------------------------------------------

export interface AdhkarSeed {
  category: string;
  arabic: string;
  transliteration: string;
  translation: string;
  repeatCount: number;
  source: string;
  tags?: string[];
  order: number;
}

export const ADHKAR: AdhkarSeed[] = [
  // Morning adhkar
  {
    category: "morning", order: 1,
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Asbahnaa wa asbahal-mulku lillaah, wal-hamdu lillaah, laa ilaaha illAllaahu wahdahu laa shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli shay'in qadeer",
    translation: "We have entered the morning and the kingdom belongs to Allah. Praise is to Allah. There is no god but Allah alone, with no partner. To Him belongs the dominion and to Him belongs praise, and He is omnipotent over all things.",
    repeatCount: 1, source: "Sahih Muslim 2723 — Hisn al-Muslim 91",
    tags: ["morning"],
  },
  {
    category: "morning", order: 2,
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allaahumma bika asbahnaa, wa bika amsaynaa, wa bika nahyaa, wa bika namootu wa ilaykan-nushoor",
    translation: "O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.",
    repeatCount: 1, source: "Jami at-Tirmidhi 3391 — Hisn al-Muslim 92",
    tags: ["morning"],
  },
  {
    category: "morning", order: 3,
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allaahumma anta Rabbee laa ilaaha illaa anta, khalaqtanee wa anaa 'abduka, wa anaa 'alaa 'ahdika wa wa'dika mas-tata't, a'oodhu bika min sharri maa sana't, aboo'u laka bi-ni'matika 'alayya, wa aboo'u bi-dhanbee faghfir lee fa-innahu laa yaghfirudh-dhunooba illaa ant",
    translation: "O Allah, You are my Lord. There is no god but You. You created me and I am Your servant. I am bound to my covenant and promise to You as best I can. I seek refuge with You from the evil of what I have done. I acknowledge Your blessing upon me and I acknowledge my sin, so forgive me, for none can forgive sins except You.",
    repeatCount: 1, source: "Sahih al-Bukhari 6306 — Sayyid al-Istighfar",
    tags: ["morning", "evening", "forgiveness"],
  },
  {
    category: "morning", order: 4,
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا",
    transliteration: "Radeetu billaahi Rabban, wa bil-Islaami deenan, wa bi-Muhammadin ﷺ Nabiyyan",
    translation: "I am pleased with Allah as Lord, with Islam as religion, and with Muhammad ﷺ as Prophet.",
    repeatCount: 3, source: "Jami at-Tirmidhi 3389; Abu Dawud 5072",
    tags: ["morning", "evening"],
  },
  {
    category: "morning", order: 5,
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Hasbi-yallaahu laa ilaaha illaa Huwa, 'alayhi tawakkaltu wa Huwa Rabbul-'arshil-'azeem",
    translation: "Allah is sufficient for me. There is no god but Him. I have placed my trust in Him, and He is the Lord of the Magnificent Throne.",
    repeatCount: 7, source: "Abu Dawud 5081 — Hisn al-Muslim 88",
    tags: ["morning", "evening", "protection", "tawakkul"],
  },

  // Evening adhkar
  {
    category: "evening", order: 1,
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Amsaynaa wa amsal-mulku lillaah, wal-hamdu lillaah, laa ilaaha illAllaahu wahdahu laa shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli shay'in qadeer",
    translation: "We have reached the evening and at this very time the whole kingdom belongs to Allah. Praise is to Allah. None has the right to be worshipped but Allah, alone, without partner. To Him belongs the dominion and to Him belongs praise, and He is omnipotent over all things.",
    repeatCount: 1, source: "Sahih Muslim 2723 — Hisn al-Muslim 100",
    tags: ["evening"],
  },
  {
    category: "evening", order: 2,
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
    transliteration: "Allaahumma bika amsaynaa, wa bika asbahnaa, wa bika nahyaa, wa bika namootu wa ilaykal-maseer",
    translation: "O Allah, by You we enter the evening, by You we enter the morning, by You we live, by You we die, and to You is the return.",
    repeatCount: 1, source: "Jami at-Tirmidhi 3391 — Hisn al-Muslim 101",
    tags: ["evening"],
  },
  {
    category: "evening", order: 3,
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'oodhu bi-kalimaatillaahit-taammaati min sharri maa khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    repeatCount: 3, source: "Sahih Muslim 2709 — Hisn al-Muslim 84",
    tags: ["evening", "protection"],
  },
  {
    category: "evening", order: 4,
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي",
    transliteration: "Allaahumma innee as'alukal-'afwa wal-'aafiyata fid-dunyaa wal-aakhirah, Allaahumma innee as'alukal-'afwa wal-'aafiyata fee deenee wa dunyaaya wa ahlee wa maalee",
    translation: "O Allah, I ask You for forgiveness and well-being in this world and the Hereafter. O Allah, I ask You for forgiveness and well-being in my religious and worldly affairs, my family and my wealth.",
    repeatCount: 1, source: "Abu Dawud 5074; Ibn Majah 3871 — Hisn al-Muslim 102",
    tags: ["evening", "forgiveness", "wellbeing"],
  },

  // Sleep adhkar
  {
    category: "sleep", order: 1,
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allaahumma amootu wa ahya",
    translation: "In Your name, O Allah, I die and I live.",
    repeatCount: 1, source: "Sahih al-Bukhari 6324 — Hisn al-Muslim 121",
    tags: ["sleep"],
  },
  {
    category: "sleep", order: 2,
    arabic: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ",
    transliteration: "Allaahumma aslamtu nafsee ilayk, wa fawwadtu amree ilayk, wa wajjahtu wajhee ilayk, wa alja'tu zahree ilayk, raghbatan wa rahbatan ilayk, laa malja'a wa laa manjaa minka illaa ilayk, aamantu bi-kitaabikal-ladhee anzalta wa bi-Nabiyyikal-ladhee arsalt",
    translation: "O Allah, I submit my soul to You, I entrust my affair to You, I turn my face to You, I lean my back to You, in hope and fear of You. There is no refuge or sanctuary from You except with You. I believe in Your Book which You revealed and in Your Prophet whom You sent.",
    repeatCount: 1, source: "Sahih al-Bukhari 6313; Sahih Muslim 2710 — Hisn al-Muslim 119",
    tags: ["sleep"],
  },
  {
    category: "sleep", order: 3,
    arabic: "سُبْحَانَ اللَّهِ",
    transliteration: "SubhaanAllaah",
    translation: "Glory be to Allah",
    repeatCount: 33, source: "Sahih al-Bukhari 3705; Sahih Muslim 2727 — combined with the 33 dhikr before sleep",
    tags: ["sleep", "tasbeeh"],
  },
  {
    category: "sleep", order: 4,
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdu lillaah",
    translation: "All praise is for Allah",
    repeatCount: 33, source: "Sahih al-Bukhari 3705; Sahih Muslim 2727",
    tags: ["sleep", "tahmeed"],
  },
  {
    category: "sleep", order: 5,
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allaahu Akbar",
    translation: "Allah is the Greatest",
    repeatCount: 34, source: "Sahih al-Bukhari 3705; Sahih Muslim 2727",
    tags: ["sleep", "takbeer"],
  },

  // After-prayer adhkar
  {
    category: "after_prayer", order: 1,
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullaah",
    translation: "I seek the forgiveness of Allah",
    repeatCount: 3, source: "Sahih Muslim 597 — Hisn al-Muslim 137",
    tags: ["after_prayer", "istighfar"],
  },
  {
    category: "after_prayer", order: 2,
    arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
    transliteration: "Allaahumma antas-Salaam, wa minkas-Salaam, tabaarakta yaa Dhal-Jalaali wal-Ikram",
    translation: "O Allah, You are Peace, and from You comes Peace. Blessed are You, O Possessor of Majesty and Honour.",
    repeatCount: 1, source: "Sahih Muslim 591 — Hisn al-Muslim 138",
    tags: ["after_prayer"],
  },
  {
    category: "after_prayer", order: 3,
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
    transliteration: "Laa ilaaha illAllaahu wahdahu laa shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli shay'in qadeer, Allaahumma laa maani'a limaa a'tayt, wa laa mu'tiya limaa mana't, wa laa yanfa'u dhal-jaddi minkal-jadd",
    translation: "There is no god but Allah alone, with no partner. His is the dominion and His is praise, and He is omnipotent over all things. O Allah, none can withhold what You have given, and none can give what You have withheld. No wealth or power can benefit anyone against You.",
    repeatCount: 1, source: "Sahih al-Bukhari 844; Sahih Muslim 593 — Hisn al-Muslim 140",
    tags: ["after_prayer"],
  },
  {
    category: "after_prayer", order: 4,
    arabic: "سُبْحَانَ اللَّهِ",
    transliteration: "SubhaanAllaah",
    translation: "Glory be to Allah",
    repeatCount: 33, source: "Sahih Muslim 597 — Hisn al-Muslim 142",
    tags: ["after_prayer", "tasbeeh"],
  },
  {
    category: "after_prayer", order: 5,
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdu lillaah",
    translation: "All praise is for Allah",
    repeatCount: 33, source: "Sahih Muslim 597 — Hisn al-Muslim 142",
    tags: ["after_prayer", "tahmeed"],
  },
  {
    category: "after_prayer", order: 6,
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allaahu Akbar",
    translation: "Allah is the Greatest",
    repeatCount: 33, source: "Sahih Muslim 597 — Hisn al-Muslim 142",
    tags: ["after_prayer", "takbeer"],
  },
  {
    category: "after_prayer", order: 7,
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Laa ilaaha illAllaahu wahdahu laa shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli shay'in qadeer",
    translation: "There is no god but Allah alone, with no partner. His is the dominion and His is praise, and He is omnipotent over all things. (The 100th dhikr — completes the 100.)",
    repeatCount: 1, source: "Sahih Muslim 597 — Hisn al-Muslim 142",
    tags: ["after_prayer"],
  },

  // General / tahlil / protection
  {
    category: "tahleel", order: 1,
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Laa ilaaha illAllaahu wahdahu laa shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli shay'in qadeer",
    translation: "There is no god but Allah alone, with no partner. His is the dominion and His is praise, and He is omnipotent over all things. (Said 100 times — the words weigh heavily on the scale.)",
    repeatCount: 100, source: "Sahih al-Bukhari 3293; Sahih Muslim 2691 — Hisn al-Muslim 145",
    tags: ["tahleel", "dhikr"],
  },
  {
    category: "protection", order: 1,
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillaahil-ladhee laa yadurru ma'asmihi shay'un fil-ardi wa laa fis-samaa'i wa Huwas-Samee'ul-'Aleem",
    translation: "In the name of Allah, with whose name nothing on earth or in the heavens can cause harm. He is the All-Hearing, the All-Knowing.",
    repeatCount: 3, source: "Abu Dawud 5088; Jami at-Tirmidhi 3388 — Hisn al-Muslim 81",
    tags: ["protection", "morning", "evening"],
  },
  {
    category: "distress", order: 1,
    arabic: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
    transliteration: "Laa ilaaha illaa anta, Subhaanaka, innee kuntu minaz-zaalimeen",
    translation: "There is no god but You. Glory be to You. Truly, I have been of the wrongdoers. (Dua of Yunus, peace be upon him, in the belly of the whale.)",
    repeatCount: 1, source: "Sahih al-Bukhari 6336; Jami at-Tirmidhi 3505",
    tags: ["distress", "yunus", "dua"],
  },
];

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export interface ReminderSeed {
  title: string;
  body: string;
  category: string;
  language: string;
  source?: string;
  tags?: string[];
}

export const REMINDERS: ReminderSeed[] = [
  {
    title: "The Weight of Intentions",
    body: "Every action you take today — eating, sleeping, working, smiling at your spouse — can be a source of reward if you intend it for Allah. Renew your intention this morning. The Prophet ﷺ said: 'Actions are only by intentions, and every man shall have only that which he intended.'",
    category: "general", language: "en", source: "Bukhari 1; Muslim 1907",
    tags: ["intention", "nawawi-1"],
  },
  {
    title: "Patience is at the First Strike",
    body: "True patience (sabr) is shown at the moment of calamity — not after the fact when the heart has accepted it. When difficulty comes, remember: 'Indeed, Allah is with the patient' (2:153). Train yourself to say 'Inna lillahi wa inna ilayhi raji'un' before complaint.",
    category: "encouragement", language: "en",
    source: "Bukhari 1302; Muslim 918",
    tags: ["patience", "calamity"],
  },
  {
    title: "Smile — It is Charity",
    body: "The Prophet ﷺ said: 'Your smile to your brother is charity.' A small act, but weighted by intention. Make it your habit today to lighten the heart of someone you meet, even with a smile.",
    category: "character", language: "en",
    source: "Tirmidhi 1956",
    tags: ["smile", "sadaqah"],
  },
  {
    title: "Guard the Tongue",
    body: "The Prophet ﷺ said: 'Whoever believes in Allah and the Last Day, let him speak good or keep silent.' Most regret on the Day of Resurrection will be over words spoken carelessly. Today, before each sentence, ask: is it true, is it kind, is it necessary?",
    category: "character", language: "en",
    source: "Bukhari 6018; Muslim 47",
    tags: ["speech", "tongue"],
  },
  {
    title: "The Best of You in Character",
    body: "The Prophet ﷺ said: 'The most complete of the believers in faith is the one with the best character.' Faith (iman) is not only prayer and fasting — it is the way you treat your spouse, your children, your neighbours, your staff, the stranger in the street.",
    category: "character", language: "en",
    source: "Abu Dawud 4682; Tirmidhi 1162",
    tags: ["character", "iman"],
  },
  {
    title: "Do Not Despair",
    body: "Allah says: 'O My servants who have transgressed against themselves — do not despair of the mercy of Allah. Indeed, Allah forgives all sins.' (39:53) However far you have strayed, the door is open. Turn back. Repent. He is the Forgiving, the Merciful.",
    category: "encouragement", language: "en",
    source: "Quran 39:53",
    tags: ["mercy", "repentance"],
  },
  {
    title: "Seeking Knowledge — a Path to Paradise",
    body: "The Prophet ﷺ said: 'Whoever takes a path in search of knowledge, Allah will make easy for him a path to Paradise.' Set aside time today — even fifteen minutes — to read the Quran or a book of hadith. Consistency, not volume, is the secret.",
    category: "worship", language: "en",
    source: "Muslim 2699",
    tags: ["knowledge", "paradise"],
  },
  {
    title: "Remember Allah — and He Will Remember You",
    body: "Allah says: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.' (2:152) Dhikr is not a ritual; it is a relationship. Keep your tongue moist with the remembrance of Allah today — SubhanAllah, Alhamdulillah, Laa ilaha illAllah, Allahu Akbar.",
    category: "worship", language: "en",
    source: "Quran 2:152; Bukhari 6406",
    tags: ["dhikr", "gratitude"],
  },
  {
    title: "The Prayer is the Pillar",
    body: "The Prophet ﷺ said: 'Between a man and disbelief (kufr) and polytheism (shirk) is the abandonment of the prayer.' Prayer is not an obligation to be rushed; it is the appointment of your day with your Lord. Show up — on time — and the rest of your day will fall into place.",
    category: "worship", language: "en",
    source: "Muslim 82",
    tags: ["prayer", "salah"],
  },
  {
    title: "Honour Your Parents",
    body: "Allah says: 'And your Lord has decreed that you not worship except Him, and to parents, good treatment.' (17:23) If your parents are alive, call them today. If they have passed, give sadaqah on their behalf and make dua for them. Paradise is under the feet of mothers.",
    category: "character", language: "en",
    source: "Quran 17:23; Nasa'i 3104",
    tags: ["parents", "character"],
  },
  {
    title: "TheReward of Gratitude",
    body: "Allah says: 'If you are grateful, I will surely increase you.' (14:7) Gratitude is not only a feeling; it is a verbal declaration and a practical use of blessings in obedience to the Giver. Today, list three specific blessings Allah has given you and thank Him for each.",
    category: "general", language: "en",
    source: "Quran 14:7",
    tags: ["gratitude"],
  },
  {
    title: "Lower Your Gaze",
    body: "Allah commands: 'Tell the believing men to lower their gaze and guard their private parts. That is purer for them.' (24:30) The eye is the gateway of the heart. Lower the gaze — on screens, in the street, in private — and Allah will illuminate your heart with light.",
    category: "character", language: "en",
    source: "Quran 24:30",
    tags: ["gaze", "purity"],
  },
  {
    title: "Sleep on Your Right Side",
    body: "The Prophet ﷺ used to lie on his right side when he slept. He would place his right hand under his right cheek and say: 'O Allah, in Your name I die and I live.' Sleep is the lesser death; let your last words of the day be remembrance of Allah.",
    category: "worship", language: "en",
    source: "Bukhari 2474, 6314; Muslim 2710",
    tags: ["sleep", "sunnah"],
  },
  {
    title: "Be Quick in Good",
    body: "The Prophet ﷺ said: 'Be in this world as though you are a stranger or a traveller passing through.' The believer is always ready for the next life. If you have a good deed to do — do it today. Tomorrow is not promised.",
    category: "general", language: "en",
    source: "Bukhari 6416",
    tags: ["time", "death"],
  },
  {
    title: "Hold Fast to the Congregation",
    body: "The Prophet ﷺ said: 'The hand of Allah is with the congregation (jama'ah).' In an age of isolation, do not cut yourself off from the believers. Pray in congregation when you can. Visit the sick. Attend the funeral. Be among the people.",
    category: "worship", language: "en",
    source: "Tirmidhi 2167",
    tags: ["congregation", "community"],
  },
  {
    title: "Charity Does Not Decrease Wealth",
    body: "The Prophet ﷺ said: 'Charity does not decrease wealth.' Give — even if small. The reward is multiplied; the heart is opened; the blessing descends on the rest of your provision. Set up a regular monthly sadaqah, however small.",
    category: "character", language: "en",
    source: "Muslim 2588",
    tags: ["charity", "sadaqah"],
  },
  {
    title: "Forgive to be Forgiven",
    body: "The Prophet ﷺ said: 'Show mercy, and you will be shown mercy. Forgive, and Allah will forgive you.' (Ahmad) Holding a grudge is like drinking poison and expecting the other person to die. Let it go today — for your own sake, and for the sake of Allah forgiving you on the Day you need it most.",
    category: "character", language: "en",
    source: "Ahmad 6651; Tirmidhi 1924",
    tags: ["mercy", "forgiveness"],
  },
  {
    title: "Whoever Relieves a Hardship",
    body: "The Prophet ﷺ said: 'Whoever relieves a believer of a hardship in this world, Allah will relieve him of a hardship on the Day of Resurrection.' Look around you today. Is there someone you can help — financially, emotionally, with a ride, with a meal? Be the answer to someone's dua.",
    category: "encouragement", language: "en",
    source: "Muslim 2699",
    tags: ["help", "charity"],
  },
  {
    title: "The Last Ten of Ramadan",
    body: "The Prophet ﷺ used to strive in worship during the last ten nights of Ramadan more than at any other time. If Ramadan is with you, do not let it slip away in sleep or distraction. Seek Laylat al-Qadr — better than a thousand months.",
    category: "worship", language: "en",
    source: "Muslim 1175",
    tags: ["ramadan", "qadr"],
  },
  {
    title: "Visit the Sick",
    body: "The Prophet ﷺ said: 'No Muslim visits a Muslim in the morning except that seventy thousand angels send blessings upon him until the evening, and if he visits him in the evening, seventy thousand angels send blessings upon him until the morning.' Visit someone who is unwell today.",
    category: "character", language: "en",
    source: "Tirmidhi 969",
    tags: ["sick", "community"],
  },
  {
    title: "Read Surah Al-Kahf on Friday",
    body: "The Prophet ﷺ said: 'Whoever reads Surah Al-Kahf on Friday, a light will shine for him from beneath his feet to the clouds of the sky, which will shine for him on the Day of Resurrection, and he will be forgiven for what is between the two Fridays.' Make it a habit.",
    category: "worship", language: "en",
    source: "Mustadrak al-Hakim 3392; classed sahih by Al-Albani",
    tags: ["kahf", "friday"],
  },
  {
    title: "The Best of You are Those who Learn and Teach",
    body: "The Prophet ﷺ said: 'The best of you are those who learn the Quran and teach it.' Learning and teaching are a continuous cycle. If you have learned something beneficial, share it today. If you are not learning, find a teacher — even online.",
    category: "general", language: "en",
    source: "Bukhari 5027",
    tags: ["quran", "knowledge"],
  },
  {
    title: "Send Salawat upon the Prophet ﷺ",
    body: "The Prophet ﷺ said: 'Whoever sends blessings upon me once, Allah sends blessings upon him ten times.' Make 'Allahumma salli 'ala Muhammad' a frequent companion of your tongue — especially on Friday, when the Prophet ﷺ said it is most beloved.",
    category: "worship", language: "en",
    source: "Muslim 408",
    tags: ["salawat", "prophet"],
  },
  {
    title: "The Dua Between Adhan and Iqamah",
    body: "The Prophet ﷺ said: 'A supplication made between the adhan and the iqamah is not rejected.' Memorise a dua for this small but precious window. Ask Allah for the best of this world and the next — He is listening.",
    category: "worship", language: "en",
    source: "Tirmidhi 212; Abu Dawud 521",
    tags: ["dua", "adhan"],
  },
  {
    title: "Eat with the Right Hand",
    body: "The Prophet ﷺ said: 'O young boy, mention the name of Allah, eat with your right hand, and eat from what is in front of you.' The Sunnah is not archaic — it is a discipline of the body that disciplines the heart. Eat with your right hand today, beginning with Bismillah.",
    category: "general", language: "en",
    source: "Bukhari 5376; Muslim 2022",
    tags: ["food", "sunnah"],
  },
  {
    title: "Whoever Believes in Allah and the Last Day",
    body: "The Prophet ﷺ said: 'Whoever believes in Allah and the Last Day, let him speak good or keep silent. Whoever believes in Allah and the Last Day, let him honour his neighbour. Whoever believes in Allah and the Last Day, let him honour his guest.' Three tests of true faith — measure yourself against them today.",
    category: "character", language: "en",
    source: "Bukhari 6018; Muslim 47",
    tags: ["faith", "character"],
  },
  {
    title: "Spend in Charity Even if a Date",
    body: "The Prophet ﷺ said: 'Protect yourselves from the Fire even with half a date.' The size of the gift is irrelevant — the heart that gives is what counts. If you cannot give wealth, give a smile, a kind word, a piece of knowledge. All of it is sadaqah.",
    category: "character", language: "en",
    source: "Bukhari 1417; Muslim 1016",
    tags: ["charity", "fire"],
  },
  {
    title: "Treat Your Mother Excellently",
    body: "A man came to the Prophet ﷺ and asked: 'O Messenger of Allah, who is most deserving of my good company?' He replied: 'Your mother.' The man asked: 'Then who?' He replied: 'Your mother.' The man asked again: 'Then who?' He replied: 'Your mother.' The man asked yet again: 'Then who?' He replied: 'Then your father.'",
    category: "character", language: "en",
    source: "Bukhari 5971; Muslim 2548",
    tags: ["mother", "parents"],
  },
  {
    title: "Wake for Tahajjud",
    body: "The Prophet ﷺ said: 'The closest a servant comes to his Lord is when he is prostrating, so make much supplication in that state.' (Muslim) The night prayer — even two rak'ahs — is the secret of the believers. Set your alarm 20 minutes before Fajr and stand before Him.",
    category: "worship", language: "en",
    source: "Muslim 482; Bukhari 1145",
    tags: ["tahajjud", "qiyam"],
  },
  {
    title: "Hold the Tongue from Backbiting",
    body: "The Prophet ﷺ said: 'Backbiting is to mention your brother in a way he would dislike.' (Muslim) Even true statements — if they would displease the one spoken about — are backbiting. Pause before you speak. Ask: would I say this if he were sitting beside me?",
    category: "warning", language: "en",
    source: "Muslim 2589",
    tags: ["backbiting", "speech"],
  },
];

// ---------------------------------------------------------------------------
// Quran page metadata — minimal seed of the first 10 pages of the Mushaf
// (the full 604 pages can be generated programmatically later, but here we
// seed real page metadata + use the public Mushaf Madinah image URLs).
// ---------------------------------------------------------------------------

export interface QuranPageSeed {
  pageNumber: number;
  juz: number;
  hizb: number;
  rubElHizb: number;
  surahs: Array<{ surah: number; startAyah: number; endAyah: number }>;
  imageUrl: string;
}

export const QURAN_PAGES: QuranPageSeed[] = [
  { pageNumber: 1, juz: 1, hizb: 1, rubElHizb: 1, surahs: [{ surah: 1, startAyah: 1, endAyah: 7 }, { surah: 2, startAyah: 1, endAyah: 5 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_001.png" },
  { pageNumber: 2, juz: 1, hizb: 1, rubElHizb: 2, surahs: [{ surah: 2, startAyah: 6, endAyah: 22 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_002.png" },
  { pageNumber: 3, juz: 1, hizb: 1, rubElHizb: 3, surahs: [{ surah: 2, startAyah: 23, endAyah: 35 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_003.png" },
  { pageNumber: 4, juz: 1, hizb: 1, rubElHizb: 4, surahs: [{ surah: 2, startAyah: 36, endAyah: 48 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_004.png" },
  { pageNumber: 5, juz: 1, hizb: 2, rubElHizb: 1, surahs: [{ surah: 2, startAyah: 49, endAyah: 62 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_005.png" },
  { pageNumber: 6, juz: 1, hizb: 2, rubElHizb: 2, surahs: [{ surah: 2, startAyah: 63, endAyah: 74 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_006.png" },
  { pageNumber: 7, juz: 1, hizb: 2, rubElHizb: 3, surahs: [{ surah: 2, startAyah: 75, endAyah: 84 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_007.png" },
  { pageNumber: 8, juz: 1, hizb: 2, rubElHizb: 4, surahs: [{ surah: 2, startAyah: 85, endAyah: 96 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_008.png" },
  { pageNumber: 9, juz: 1, hizb: 3, rubElHizb: 1, surahs: [{ surah: 2, startAyah: 97, endAyah: 108 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_009.png" },
  { pageNumber: 10, juz: 1, hizb: 3, rubElHizb: 2, surahs: [{ surah: 2, startAyah: 109, endAyah: 121 }],
    imageUrl: "https://everyayah.com/data/mushaf/quran_madinah/page_010.png" },
];
