// media-data.js - Complete Curriculum & Media Dataset for Netzwerk Neu A1 (English Edition)

const BASE_PATH = "Netzwerk NEU A1 Kursbuch/Netzwerk NEU A1 Kursbuch/";

const NETZWERK_DATA = {
  pdf: {
    kursbuch: BASE_PATH + "Netzwerk Neu A1 - Kursbuch.pdf",
    loesungen1_6: BASE_PATH + "Netzwerk Neu A1 - Kursbuch_K1-6_loesungen.pdf",
    loesungen7_12: BASE_PATH + "Netzwerk Neu A1 - Kursbuch_K7-12_loesungen.pdf"
  },
  
  // 12 Chapters with complete curriculum metadata, audio tracks, videos, and exercises
  chapters: [
    {
      id: 1,
      title: "Kapitel 1: Guten Tag!",
      subtitle: "Greetings, Introductions, Alphabet, Numbers 0-20 & Languages",
      pdfPage: 9,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_1.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 1  Guten Tag !.mp3",
      audioTracks: [
        { id: "1-001", name: "Track 1-001", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-001.mp3" },
        { id: "1-002", name: "Track 1-002", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-002.mp3" },
        { id: "1-003", name: "Track 1-003", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-003.mp3" },
        { id: "1-004", name: "Track 1-004", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-004.mp3" },
        { id: "1-005", name: "Track 1-005", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-005.mp3" },
        { id: "1-006", name: "Track 1-006", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-006.mp3" },
        { id: "1-007", name: "Track 1-007", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-007.mp3" },
        { id: "1-008", name: "Track 1-008", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-008.mp3" },
        { id: "1-009", name: "Track 1-009", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-009.mp3" },
        { id: "1-010", name: "Track 1-010", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-010.mp3" },
        { id: "1-011", name: "Track 1-011", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-011.mp3" },
        { id: "1-012", name: "Track 1-012", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-012.mp3" },
        { id: "1-013", name: "Track 1-013", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-013.mp3" },
        { id: "1-014", name: "Track 1-014", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-014.mp3" }
      ],
      videos: [
        { title: "Film 001: Guten Tag!", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_1-2/NWn_A1_Film_001.mp4" },
        { title: "Film 001: Guten Tag! (with Subtitles)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_1-2/NWn_A1_Film_001_UT.mp4" },
        { title: "Film 002: Wer bist du? (with Subtitles)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_1-2/NWn_A1_Film_002_UT.mp4" },
        { title: "Film 003: Wie geht's? (with Subtitles)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_1-2/NWn_A1_Film_003_UT.mp4" },
        { title: "Film 001-003: Kapitel 1 Komplett", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_1-2/NWn_A1_Film_001-003_UT.mp4" },
        { title: "G-Clip 01: Verben im PrÃ¤sens", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 01.mp4" },
        { title: "P-Clip 01: Das Alphabet & Aussprache", path: BASE_PATH + "Kursbuch A1 - Video/P-Clip 01.mp4" },
        { title: "R-Clip 01: BegrÃ¼ÃŸung & Verabschiedung", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 01_-_mit_Untertiteln.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Herzlich willkommen zu Kapitel 1: Guten Tag! Lernen Sie Begrüßungen, sich und andere vorzustellen, das deutsche Alphabet mit Aussprache und die Zahlen von 0 bis 20.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 1 — Guten Tag!
**Core Focus**: First contact, formal vs. informal address, personal introductions, spelling names with the German alphabet, and counting numbers 0–20.

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Grüßen & Verabschieden (Greetings & Goodbyes)
| Situation / Context | German Redemittel | English Meaning |
|---|---|---|
| Informal Greeting | **Hallo Nina! / Hallo Niklas!** | Hello Nina! / Hello Niklas! |
| Formal Daytime Greeting | **Guten Tag! / Guten Tag, Herr Hansen!** | Good day! / Good day, Mr. Hansen! |
| Morning Greeting (until ~11:00) | **Guten Morgen!** | Good morning! |
| Evening Greeting (after ~18:00) | **Guten Abend!** | Good evening! |
| Informal Goodbye | **Tschüs! / Ciao!** | Bye! / Bye-bye! |
| Formal Goodbye | **Auf Wiedersehen!** | Goodbye! (Until we meet again) |
| Night (going to bed) | **Gute Nacht!** | Good night! |

#### 2. Sich und andere vorstellen (Introductions)
| Situation / Context | German Redemittel | English Meaning |
|---|---|---|
| Asking Name (informal) | **Wer bist du? / Wie heißt du?** | Who are you? / What is your name? |
| Responding Name (informal) | **Ich bin Julia. / Ich heiße Niklas.** | I am Julia. / My name is Niklas. |
| Asking Name (formal) | **Wie ist Ihr Name? / Wie heißen Sie?** | What is your name? / What are you called? |
| Responding Name (formal) | **Mein Name ist Nina Weber.** | My name is Nina Weber. |
| Introducing Someone Else | **Das ist Herr Hansen. / Das ist Frau Tanaka.** | This is Mr. Hansen. / This is Ms. Tanaka. |

#### 3. Über sich und andere sprechen (Personal Details)
| Situation / Context | German Redemittel | English Meaning |
|---|---|---|
| Asking Residence | **Wo wohnen Sie? / Wo wohnst du?** | Where do you live? |
| Stating Residence | **Ich wohne in Frankfurt. / In Frankfurt.** | I live in Frankfurt. / In Frankfurt. |
| Asking Origin | **Woher kommen Sie? / Woher kommst du?** | Where do you come from? |
| Stating Origin | **Ich komme aus Spanien. / Aus Spanien.** | I come from Spain. / From Spain. |
| Asking Languages | **Welche Sprachen sprechen Sie? / sprichst du?** | Which languages do you speak? |
| Stating Languages | **Ich spreche Deutsch und Russisch.** | I speak German and Russian. |
| Asking Phone Number | **Wie ist Ihre / deine Telefonnummer?** | What is your phone number? |
| Answering Phone Number | **0650 - 32 ...** *(read digit by digit)* | 0650 - 32 ... |
| Asking Email Address | **Wie ist Ihre / deine E-Mail-Adresse?** | What is your email address? |
| Answering Email | **alexis_barbos@quinnet.com** | alexis_barbos@quinnet.com |
| Asking Identity | **Wer ist das? -> Das ist Selina Lang.** | Who is that? -> That is Selina Lang. |

#### 4. Nach dem Befinden fragen (Asking How Someone Is)
| Situation / Context | German Redemittel | English Meaning |
|---|---|---|
| Formal Question | **Wie geht es Ihnen?** | How are you? (formal) |
| Informal Question | **Wie geht's dir? / Wie geht's?** | How are you? / How's it going? (informal) |
| Very Good | **Danke, sehr gut!** | Thank you, very good! |
| Good | **Danke, gut.** | Thank you, good. |
| Neutral / Okay | **Ganz gut. / Es geht.** | Pretty good. / So-so. |
| Counter-Question | **Und Ihnen? / Und dir?** | And you? (formal / informal) |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Satzbau: W-Frage vs. Aussagesatz (Word Order)
> In German main clauses and W-questions, the **conjugated verb always takes Position 2**!

| Position 1 | Position 2 (Conjugated Verb) | Position 3 / Further Info | Sentence Type |
|---|---|---|---|
| **Wer** *(Who)* | **bist** | du? | W-Frage |
| **Wie** *(How)* | **heißt** | du? | W-Frage |
| **Woher** *(Where from)* | **kommt** | Frau Tanaka? | W-Frage |
| **Wo** *(Where)* | **wohnen** | Sie? | W-Frage |
| **Welche Sprachen** *(Which languages)* | **sprechen** | Sie? | W-Frage |
| **Ich** *(Subject)* | **bin** | Julia. | Aussagesatz |
| **Ich** | **heiße** | Niklas. | Aussagesatz |
| **Sie** | **kommt** | aus Japan. | Aussagesatz |
| **Ich** | **wohne** | in Zürich. | Aussagesatz |
| **Ich** | **spreche** | Deutsch. | Aussagesatz |

#### 2. Konjugation im Präsens (Present Tense Conjugation)
| Pronoun | sein *(to be)* | heißen *(to be called)* | kommen *(to come)* | wohnen *(to live)* | Regular Endings |
|---|---|---|---|---|---|
| **ich** | **bin** | **heiße** | **komme** | **wohne** | \`-e\` |
| **du** | **bist** | **heißt** *(stem in -ß adds only -t)* | **kommst** | **wohnst** | \`-st\` |
| **er / sie / es** | **ist** | **heißt** | **kommt** | **wohnt** | \`-t\` |
| **wir** | **sind** | **heißen** | **kommen** | **wohnen** | \`-en\` |
| **ihr** | **seid** | **heißt** | **kommt** | **wohnt** | \`-t\` |
| **sie / Sie** | **sind** | **heißen** | **kommen** | **wohnen** | \`-en\` |

#### 3. Personalpronomen in Texten (3rd Person Reference)
- **Frau Lang** -> **Sie** (*Das ist Frau Lang. **Sie** kommt aus Deutschland. **Sie** wohnt in Frankfurt.*)
- **Jan** -> **Er** (*Das ist Jan. **Er** kommt aus Frankfurt. **Er** wohnt in Zürich.*)

---

### 🔤 Das Alphabet & Die Zahlen 0–20

#### German Alphabet & Phonetics
| Letter | German Sound | Example Word | English Meaning |
|---|---|---|---|
| **A a** | [a:] | der Apfel | apple |
| **B b** | [be:] | das Buch | book |
| **C c** | [tse:] | das Café | café |
| **D d** | [de:] | Deutschland | Germany |
| **E e** | [e:] | der Elefant | elephant |
| **F f** | [ɛf] | die Frage | question |
| **G g** | [ge:] | Guten Tag | good day |
| **H h** | [ha:] | Hallo | hello |
| **I i** | [i:] | der Igel | hedgehog |
| **J j** | [jɔt] *(Y-sound)* | das Jahr | year |
| **K k** | [ka:] | der Kaffee | coffee |
| **L l** | [ɛl] | die Lampe | lamp |
| **M m** | [ɛm] | die Musik | music |
| **N n** | [ɛn] | der Name | name |
| **O o** | [o:] | die Orange | orange |
| **P p** | [pe:] | die Person | person |
| **Q q** | [ku:] | die Quelle | source |
| **R r** | [ɛr] | das Radio | radio |
| **S s** | [ɛs] *(Z-sound before vowels)* | die Sonne | sun |
| **T t** | [te:] | der Tee | tea |
| **U u** | [u:] | die Uhr | clock / watch |
| **V v** | [faʊ] *(F-sound)* | der Vater | father |
| **W w** | [ve:] *(V-sound)* | das Wasser | water |
| **X x** | [ɪks] | das Xylofon | xylophone |
| **Y y** | ['ʏpsilɔn] | das Yoga | yoga |
| **Z z** | [tsɛt] *(sharp TS)* | der Zug | train |
| **Ä ä** | [ɛ:] *(Open E)* | die Äpfel | apples |
| **Ö ö** | [ø:] *(Rounded O)* | Österreich | Austria |
| **Ü ü** | [y:] *(Rounded U)* | über | over / about |
| **ß** | [ɛs'tsɛt] *(sharp S)* | heißen | to be called |

#### Numbers 0 to 20 (Zahlen von 0 bis 20)
| Digits | German Word | Digits | German Word | Special Spelling Notes |
|---|---|---|---|---|
| **0** | **null** | **11** | **elf** | Irregular root |
| **1** | **eins** | **12** | **zwölf** | Irregular root |
| **2** | **zwei** | **13** | **dreizehn** | drei + zehn |
| **3** | **drei** | **14** | **vierzehn** | vier + zehn |
| **4** | **vier** | **15** | **fünfzehn** | fünf + zehn |
| **5** | **fünf** | **16** | **sechzehn** | ⚠️ *Drop the '-s' from sechs!* |
| **6** | **sechs** | **17** | **siebzehn** | ⚠️ *Drop '-en' from sieben!* |
| **7** | **sieben** | **18** | **achtzehn** | acht + zehn |
| **8** | **acht** | **19** | **neunzehn** | neun + zehn |
| **9** | **neun** | **20** | **zwanzig** | tens ending \`-zig\` |
| **10** | **zehn** | | | |

💡 **Pro-Tipp**: Phone numbers in German are dictated **single digit by single digit** (e.g., *null - sechs - fünf - null ...*).

      `
      },
      interactiveExercises: [
        {
          id: "k1_ex1",
          title: "Übung 1: Complete the German Greetings (Begrüßung)",
          instruction: "Fill in the missing German word for each situation:",
          questions: [
            {
              id: "k1_q1",
              prompt: "1. Greeting someone in the morning (8:00 AM): 'Guten ______!'",
              expected: ["Morgen", "morgen"],
              hint: "German word for 'morning', capitalized.",
              explanation: "'Guten Morgen' is used to greet people in the morning."
            },
            {
              id: "k1_q2",
              prompt: "2. Wishing someone sweet dreams before sleeping: 'Gute ______!'",
              expected: ["Nacht", "nacht"],
              hint: "German word for 'night' (feminine: die Nacht).",
              explanation: "'Gute Nacht' is used exclusively when heading to bed."
            },
            {
              id: "k1_q3",
              prompt: "3. Formal polite goodbye: 'Auf ______!'",
              expected: ["Wiedersehen", "wiedersehen"],
              hint: "Literally means 'until seeing again'.",
              explanation: "'Auf Wiedersehen' is the standard formal farewell in German."
            }
          ]
        },
        {
          id: "k1_ex2",
          title: "Übung 2: Introducing Yourself (Sich vorstellen)",
          instruction: "Complete the self-introduction sentences with the correct word:",
          questions: [
            {
              id: "k1_q4",
              prompt: "1. 'Hallo, ich ______ (heißen) Cheeya.'",
              expected: ["heiße", "heisse"],
              hint: "Conjugate 'heißen' for the subject 'ich' (ending -e).",
              explanation: "For subject 'ich', heißen becomes 'heiße'."
            },
            {
              id: "k1_q5",
              prompt: "2. 'Woher ______ (kommen) du?'",
              expected: ["kommst"],
              hint: "Conjugate 'kommen' for the subject 'du' (ending -st).",
              explanation: "For subject 'du', kommen becomes 'kommst'."
            },
            {
              id: "k1_q6",
              prompt: "3. 'Ich komme ______ (from) Deutschland.'",
              expected: ["aus"],
              hint: "German preposition for country origin (from).",
              explanation: "'aus' means 'from' when stating origin (aus Deutschland)."
            }
          ]
        },
        {
          id: "k1_ex3",
          title: "Übung 3: The Verb 'sein' (to be)",
          instruction: "Fill in the correct form of 'sein' (bin, bist, ist, sind):",
          questions: [
            {
              id: "k1_q7",
              prompt: "1. 'Wer ______ du?' (Who are you?)",
              expected: ["bist"],
              hint: "Form of 'sein' for subject 'du'.",
              explanation: "Du bist -> Wer bist du?"
            },
            {
              id: "k1_q8",
              prompt: "2. 'Wer ______ Sie?' (Who are You? - formal)",
              expected: ["sind"],
              hint: "Form of 'sein' for formal 'Sie'.",
              explanation: "Sie sind -> Wer sind Sie?"
            },
            {
              id: "k1_q9",
              prompt: "3. 'Das ______ Herr Müller.' (That is Mr. Müller.)",
              expected: ["ist"],
              hint: "Form of 'sein' for 3rd person singular (er/es/das).",
              explanation: "Er/es/das ist -> Das ist Herr Müller."
            }
          ]
        },
        {
          id: "k1_ex4",
          title: "Übung 4: Das deutsche Alphabet & Buchstabieren (Spelling)",
          instruction: "Answer the questions about the German alphabet and spelling:",
          questions: [
            {
              id: "k1_q10",
              prompt: "1. How do you ask politely: 'Wie ______ man das?' (buchstabieren)",
              expected: ["buchstabiert", "buchstabieren"],
              hint: "Conjugate 'buchstabieren' for 3rd person singular 'man' (ends in -t).",
              explanation: "For subject 'man' (one/you), the verb ending is '-t': 'Wie buchstabiert man das?'"
            },
            {
              id: "k1_q11",
              prompt: "2. Which special German character is called 'Eszett' or 'scharfes S'? Type the symbol:",
              expected: ["ß", "ss"],
              hint: "Type the letter ß (or ss).",
              explanation: "The letter 'ß' is known as Eszett or scharfes S."
            },
            {
              id: "k1_q12",
              prompt: "3. How is the German letter 'W' pronounced? Like English ______ (V / W / B):",
              expected: ["V", "v"],
              hint: "Like the 'v' in victory.",
              explanation: "In German, 'W' sounds like the English 'V' (e.g. Wasser = Vasser)."
            },
            {
              id: "k1_q13",
              prompt: "4. Spell the German word 'Tee' with hyphens (z.B. T-E-E):",
              expected: ["T-E-E", "t-e-e"],
              hint: "Three letters separated by hyphens.",
              explanation: "Tee is spelled T - E - E."
            }
          ]
        },
        {
          id: "k1_ex5",
          title: "Übung 5: Die Zahlen 0 bis 20 (German Numbers)",
          instruction: "Write the correct German number words:",
          questions: [
            {
              id: "k1_q14",
              prompt: "1. 7 + 5 = 12. Write the number 12 in German word:",
              expected: ["zwölf", "zwoelf", "Zwölf", "Zwoelf"],
              hint: "Starts with zw- and contains ö.",
              explanation: "12 = zwölf."
            },
            {
              id: "k1_q15",
              prompt: "2. Which number comes after 15 (fünfzehn)? Note: drop the 's'!",
              expected: ["sechzehn", "Sechzehn"],
              hint: "16 is sechzehn (NOT sechszehn).",
              explanation: "16 = sechzehn (the 's' from sechs is dropped!)."
            },
            {
              id: "k1_q16",
              prompt: "3. How do you write the number 20 in German?",
              expected: ["zwanzig", "Zwanzig"],
              hint: "Starts with zw- and ends with -zig.",
              explanation: "20 = zwanzig."
            },
            {
              id: "k1_q17",
              prompt: "4. Write the phone digits in numbers: 'null - acht - eins - fünf':",
              expected: ["0815", "0 8 1 5", "0-8-1-5"],
              hint: "Four numbers together.",
              explanation: "null (0) - acht (8) - eins (1) - fünf (5) = 0815."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 1):**
1. **Present Tense Verb Conjugation (Präsens):**
   - Base endings: *ich* **-e**, *du* **-st**, *er/sie/es* **-t**, *wir* **-en**, *ihr* **-t**, *sie/Sie* **-en**.
   - Example *kommen* (to come):
     - ich komme
     - du kommst
     - er/sie/es kommt
     - wir kommen
     - ihr kommt
     - sie/Sie kommen
2. **The German Alphabet & Special Letters:**
   - 26 letters + 3 Umlauts (Ä, Ö, Ü) + 1 Eszett (ß).
   - W = [ve:], V = [faʊ], J = [jɔt], Z = [tsɛt].
3. **Numbers 0–20:**
   - 0 null, 1 eins, 2 zwei, 3 drei, 4 vier, 5 fünf, 6 sechs, 7 sieben, 8 acht, 9 neun, 10 zehn.
   - 11 elf, 12 zwölf, 13 dreizehn, 14 vierzehn, 15 fünfzehn, 16 sechzehn, 17 siebzehn, 18 achtzehn, 19 neunzehn, 20 zwanzig.
4. **Word Order (Satzbau):**
   - Statements: Subject + **Verb (Pos. 2)** + Object/Complement (*Ich komme aus Deutschland*).
   - W-Questions: Question Word + **Verb (Pos. 2)** + Subject (*Woher kommst du?*).
      `,
      vocabList: [
        { de: "Hallo / Guten Tag", en: "Hello / Good day", type: "phrase" },
        { de: "Guten Morgen", en: "Good morning", type: "phrase" },
        { de: "Guten Abend", en: "Good evening", type: "phrase" },
        { de: "Gute Nacht", en: "Good night", type: "phrase" },
        { de: "Auf Wiedersehen / Tschüss", en: "Goodbye (formal / informal)", type: "phrase" },
        { de: "Wie heißen Sie? / Wie heißt du?", en: "What is your name? (formal / informal)", type: "phrase" },
        { de: "Ich heiße...", en: "My name is...", type: "phrase" },
        { de: "Woher kommen Sie?", en: "Where do you come from?", type: "phrase" },
        { de: "Ich komme aus...", en: "I come from...", type: "phrase" },
        { de: "Welche Sprachen sprechen Sie?", en: "Which languages do you speak?", type: "phrase" },
        { de: "das Alphabet, -e", en: "alphabet", type: "das" },
        { de: "der Buchstabe, -n", en: "letter / character", type: "der" },
        { de: "die Zahl, -en", en: "number", type: "die" },
        { de: "die Telefonnummer, -n", en: "telephone number", type: "die" },
        { de: "die Handynummer, -n", en: "mobile phone number", type: "die" },
        { de: "der Name, -n", en: "name", type: "der" },
        { de: "der Vorname, -n", en: "first name", type: "der" },
        { de: "der Nachname, -n", en: "last name / surname", type: "der" },
        { de: "der Herr, -en", en: "Mr. / gentleman", type: "der" },
        { de: "die Frau, -en", en: "Ms. / Mrs. / woman", type: "die" },
        { de: "das Land, -\"er", en: "country", type: "das" },
        { de: "die Sprache, -n", en: "language", type: "die" },
        { de: "die Stadt, -\"e", en: "city / town", type: "die" },
        { de: "die E-Mail-Adresse, -n", en: "email address", type: "die" },
        { de: "null", en: "zero (0)", type: "phrase" },
        { de: "eins", en: "one (1)", type: "phrase" },
        { de: "zwei", en: "two (2)", type: "phrase" },
        { de: "drei", en: "three (3)", type: "phrase" },
        { de: "vier", en: "four (4)", type: "phrase" },
        { de: "fünf", en: "five (5)", type: "phrase" },
        { de: "sechs", en: "six (6)", type: "phrase" },
        { de: "sieben", en: "seven (7)", type: "phrase" },
        { de: "acht", en: "eight (8)", type: "phrase" },
        { de: "neun", en: "nine (9)", type: "phrase" },
        { de: "zehn", en: "ten (10)", type: "phrase" },
        { de: "elf", en: "eleven (11)", type: "phrase" },
        { de: "zwölf", en: "twelve (12)", type: "phrase" },
        { de: "dreizehn", en: "thirteen (13)", type: "phrase" },
        { de: "vierzehn", en: "fourteen (14)", type: "phrase" },
        { de: "fünfzehn", en: "fifteen (15)", type: "phrase" },
        { de: "sechzehn", en: "sixteen (16)", type: "phrase" },
        { de: "siebzehn", en: "seventeen (17)", type: "phrase" },
        { de: "achtzehn", en: "eighteen (18)", type: "phrase" },
        { de: "neunzehn", en: "nineteen (19)", type: "phrase" },
        { de: "zwanzig", en: "twenty (20)", type: "phrase" },
        { de: "buchstabieren (er buchstabiert)", en: "to spell", type: "verb" },
        { de: "zählen (er zählt)", en: "to count", type: "verb" },
        { de: "heißen (er heißt)", en: "to be called / named", type: "verb" },
        { de: "sein (er ist)", en: "to be", type: "verb" },
        { de: "kommen (er kommt)", en: "to come", type: "verb" },
        { de: "sprechen (er spricht)", en: "to speak", type: "verb" },
        { de: "wohnen (er wohnt)", en: "to reside / live", type: "verb" },
        { de: "hören (er hört)", en: "to hear / listen", type: "verb" },
        { de: "lesen (er liest)", en: "to read", type: "verb" },
        { de: "schreiben (er schreibt)", en: "to write", type: "verb" },
        { de: "fragen (er fragt)", en: "to ask", type: "verb" },
        { de: "antworten (er antwortet)", en: "to answer", type: "verb" },
        { de: "bitte / danke", en: "please / thank you", type: "phrase" }
      ],
      quizzes: [
        {
          q: "What is the German word for the number 16?",
          options: ["sechzehn", "sechszehn", "sechzig", "siebzehn"],
          correct: 0,
          explanation: "In 16 (sechzehn), the letter 's' from 'sechs' is dropped."
        },
        {
          q: "How is the German letter 'W' pronounced in words like 'Wasser'?",
          options: ["Like English 'W' (water)", "Like English 'V' (vase)", "Like 'B'", "It is silent"],
          correct: 1,
          explanation: "In German, the letter 'W' is pronounced like the English 'V' [ve:]."
        },
        {
          q: "Which letter is known as 'Eszett' or 'scharfes S'?",
          options: ["ß", "Ä", "Ö", "Z"],
          correct: 0,
          explanation: "'ß' is the unique German letter called Eszett or scharfes S."
        },
        {
          q: "What is the result of 'sieben + fünf' (7 + 5) in German?",
          options: ["zehn (10)", "elf (11)", "zwölf (12)", "dreizehn (13)"],
          correct: 2,
          explanation: "7 + 5 = 12, which is 'zwölf' in German."
        },
        {
          q: "Choose the correct verb forms: 'Hallo, ich ______ Julia. Und wer ______ du?'",
          options: ["bin / bist", "heiße / heißen", "komme / kommt", "bist / bin"],
          correct: 0,
          explanation: "Subject 'ich' takes 'bin', and subject 'du' takes 'bist' from the verb 'sein'."
        }
      ]
    },
    {
      id: 2,
      title: "Kapitel 2: Freunde, Kollegen und ich",
      subtitle: "Hobbies, Occupations, Numbers up to 1000, Articles & Days",
      pdfPage: 19,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_2.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 2  Freunde, Kollegen und ich.mp3",
      audioTracks: [
        { id: "1-016", name: "Track 1-016", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-016.mp3" },
        { id: "1-017", name: "Track 1-017", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-017.mp3" },
        { id: "1-018", name: "Track 1-018", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-018.mp3" },
        { id: "1-019", name: "Track 1-019", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-019.mp3" },
        { id: "1-020", name: "Track 1-020", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-020.mp3" },
        { id: "1-021", name: "Track 1-021", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-021.mp3" },
        { id: "1-022", name: "Track 1-022", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-022.mp3" },
        { id: "1-023", name: "Track 1-023", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-023.mp3" },
        { id: "1-024", name: "Track 1-024", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-024.mp3" },
        { id: "1-025", name: "Track 1-025", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-025.mp3" },
        { id: "1-027", name: "Track 1-027", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-027.mp3" },
        { id: "1-029", name: "Track 1-029", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-029.mp3" }
      ],
      videos: [
        { title: "Film 004: Hobbys & Interessen", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_1-2/NWn_A1_Film_004.mp4" },
        { title: "Film 004: Hobbys & Interessen (with Subtitles)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_1-2/NWn_A1_Film_004_UT.mp4" },
        { title: "Film 004-005: Kapitel 2 Komplett", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_1-2/NWn_A1_Film_004-005_UT.mp4" },
        { title: "G-Clip 01: Verben und Personalpronomen", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 01.mp4" },
        { title: "R-Clip 01: Hobbys & Freizeit", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 01.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 2: Freunde, Kollegen und ich! Lernen Sie über Hobbys zu sprechen, sich zu verabreden, Berufe vorzustellen und Zahlen bis eine Million.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 2 — Freunde, Kollegen und ich
**Core Focus**: Discussing hobbies, making social appointments, careers & working hours, large numbers up to one million, verb stem-vowel changes, Ja/Nein questions, and noun plural patterns.

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Über Hobbys sprechen (Discussing Hobbies & Interests)
| Question / Prompt | German Response | English Meaning |
|---|---|---|
| **Was machen Sie gern? / Was machst du gern?** | **Ich reise gern.** | What do you like doing? -> I like traveling. |
| **Hören Sie gern Musik? / Hörst du gern Musik?** | **Ja, sehr gern. / Ja, gern.** | Do you like listening to music? -> Yes, very much. |
| **Gehen Sie gern ins Kino? / Gehst du gern ins Kino?** | **Nein, nicht so gern.** | Do you like going to the cinema? -> No, not really. |
| **Lesen Sie gern? / Liest du gern?** | **Es geht so.** | Do you like reading? -> It's so-so / Moderately. |

#### 2. Sich verabreden (Making Social Plans & Dates)
| Context / Proposal | German Response | English Meaning |
|---|---|---|
| **Gehen wir ins Kino?** | **Ja, gern!** | Shall we go to the cinema? -> Yes, gladly! |
| **Wann gehen wir ins Kino?** | **Am Montag.** | When are we going to the cinema? -> On Monday. |
| **Am Freitag?** | **Nein, das geht (leider) nicht.** | On Friday? -> No, unfortunately that doesn't work. |
| **Am Wochenende?** | **Ja, super! / Das passt mir gut.** | On the weekend? -> Yes, super! / That suits me well. |

#### 3. Über Arbeit, Berufe und Arbeitszeiten sprechen (Work & Schedule)
| Situation / Context | German Redemittel | English Meaning |
|---|---|---|
| Asking Occupation (formal / informal) | **Was sind Sie von Beruf? / Was bist du von Beruf?** | What is your profession? |
| Responding Occupation | **Ich bin Studentin / Ingenieur / Architekt...** | I am a student / engineer / architect... |
| Asking Current Activity | **Was machen Sie? / Was machst du?** | What are you doing? |
| Responding Activity | **Ich studiere... / Ich mache eine Ausbildung.** | I am studying... / I am doing an apprenticeship. |
| Asking Working Hours | **Wann arbeiten Sie? / Wann arbeitest du?** | When do you work? |
| Stating Working Days | **Ich arbeite am Montag und Dienstag.** | I work on Monday and Tuesday. |
| Asking Free Time | **Wann haben Sie frei? / Wann hast du frei?** | When do you have time off? |
| Stating Free Time | **Ich habe am Wochenende frei. / Ich arbeite am Freitag nicht.** | I have the weekend off. / I don't work on Friday. |

#### 4. Zahlen ab 20 bis 1.000.000.000 (Numbers from 20 to One Billion)
| Number | German Word | Number | German Word |
|---|---|---|---|
| **21** | einundzwanzig *(one-and-twenty)* | **70** | siebzig *(drop -en)* |
| **22** | zweiundzwanzig | **80** | achtzig |
| **23** | dreiundzwanzig | **90** | neunzig |
| **24** | vierundzwanzig | **100** | (ein)hundert |
| **25** | fünfundzwanzig | **200** | zweihundert |
| **26** | sechsundzwanzig | **1.000** | (ein)tausend |
| **27** | siebenundzwanzig | **3.000** | dreitausend |
| **28** | achtundzwanzig | **4.520** | viertausendfünfhundertzwanzig |
| **29** | neunundzwanzig | **10.000** | zehntausend |
| **30** | dreißig *(note: -ßig!)* | **74.300** | vierundsiebzigtausenddreihundert |
| **40** | vierzig | **100.000** | (ein)hunderttausend |
| **50** | fünfzig | **1.000.000** | eine Million *(capitalized noun)* |
| **60** | sechzig *(drop -s)* | **1.000.000.000** | eine Milliarde |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Verben und Personalpronomen (Present Conjugation & Stem Changes)
| Pronomen | kochen *(regular)* | arbeiten *(stem -t/-d)* | lesen *(e -> ie)* | sprechen *(e -> i)* | sein *(irregular)* | haben *(irregular)* |
|---|---|---|---|---|---|---|
| **ich** | koche | arbeite | lese | spreche | **bin** | **habe** |
| **du** | kochst | arbeit**e**st | l**ie**st | spr**i**chst | **bist** | **hast** |
| **er / sie / es** | kocht | arbeit**e**t | l**ie**st | spr**i**cht | **ist** | **hat** |
| **wir** | kochen | arbeiten | lesen | sprechen | **sind** | **haben** |
| **ihr** | kocht | arbeit**e**t | lest | sprecht | **seid** | **habt** |
| **sie / Sie** | kochen | arbeiten | lesen | sprechen | **sind** | **haben** |

> ⚠️ **Key Grammar Rule**: In German strong verbs, vowel changes (\`e -> ie\` or \`e -> i\`) occur **only in the 2nd (du) and 3rd person singular (er/es/sie)**! The plural forms remain regular.

#### 2. Satzbau: Ja-/Nein-Frage (Yes/No Inversion)
> In a Ja/Nein question, the **conjugated verb moves to Position 1**!

| Position 1 (Verb) | Position 2 (Subjekt) | Position 3 / Ende | Mögliche Antwort |
|---|---|---|---|
| **Gehen** | wir | ins Kino? | Ja. / Nein. |
| **Arbeitest** | du | am Freitag? | Ja, von 9 bis 17 Uhr. |
| **Spricht** | Frau Tanaka | Deutsch? | Ja, sehr gut. |

#### 3. Bestimmter Artikel (Definite Articles in Nominative)
| Gender | Article | German Noun | English Meaning |
|---|---|---|---|
| **Maskulin** | **der** | der Stift | the pen |
| **Neutrum** | **das** | das Buch | the book |
| **Feminin** | **die** | die Tablette | the pill / tablet |
| **Plural** | **die** | die Bücher | the books |

#### 4. Nomen: Die 5 Pluralendungen (Noun Plural Patterns)
| Pattern | Ending Pattern | Singular | Plural | Meaning |
|---|---|---|---|---|
| **1** | \`(¨)-\` (no ending / umlaut) | der Kilometer | **die Kilometer** | kilometer(s) |
| **2** | \`-(e)n\` (mostly feminine) | die Stunde | **die Stunden** | hour(s) |
| **3** | \`(¨)-e\` (common masculine) | der Tag / der Arzt | **die Tage / die Ärzte** | day(s) / doctor(s) |
| **4** | \`(¨)-er\` (mostly neuter) | das Buch | **die Bücher** | book(s) |
| **5** | \`-s\` (foreign / abbreviations) | das Auto | **die Autos** | car(s) |

💡 **Pro-Tipp**: Always memorize German nouns with their **article and plural form** together (e.g., *das Buch, die Bücher*).

      `
      },
      interactiveExercises: [
        {
          id: "k2_ex1",
          title: "Übung 1: Definite Articles (der, die, or das?)",
          instruction: "Select or type the correct definite article (der / die / das):",
          questions: [
            {
              id: "k2_q1",
              prompt: "1. ______ Lehrer (male teacher)",
              expected: ["der", "Der"],
              hint: "Masculine gender.",
              explanation: "Male professions are masculine: der Lehrer."
            },
            {
              id: "k2_q2",
              prompt: "2. ______ Lehrerin (female teacher)",
              expected: ["die", "Die"],
              hint: "Feminine gender (ending -in).",
              explanation: "Professions ending in -in are feminine: die Lehrerin."
            },
            {
              id: "k2_q3",
              prompt: "3. ______ Buch (book)",
              expected: ["das", "Das"],
              hint: "Neutral gender.",
              explanation: "Buch is neutral: das Buch."
            }
          ]
        },
        {
          id: "k2_ex2",
          title: "Übung 2: The Verb 'haben' (to have)",
          instruction: "Fill in the correct conjugated form of 'haben':",
          questions: [
            {
              id: "k2_q4",
              prompt: "1. '______ du heute Zeit?' (Do you have time today?)",
              expected: ["Hast", "hast"],
              hint: "Conjugation of 'haben' for subject 'du'.",
              explanation: "For 'du', haben becomes 'hast' (Hast du...?)."
            },
            {
              id: "k2_q5",
              prompt: "2. 'Ich ______ zwei Geschwister.' (I have two siblings.)",
              expected: ["habe"],
              hint: "Ending -e for subject 'ich'.",
              explanation: "For 'ich', haben becomes 'habe'."
            }
          ]
        },
        {
          id: "k2_ex3",
          title: "Übung 3: Negation with 'kein' / 'keine'",
          instruction: "Fill in 'kein' or 'keine' to negate the noun:",
          questions: [
            {
              id: "k2_q6",
              prompt: "1. 'Das ist ______ (der) Computer.' (That is not a computer.)",
              expected: ["kein"],
              hint: "Masculine Nominativ negation without -e.",
              explanation: "der Computer (masculine) -> kein Computer."
            },
            {
              id: "k2_q7",
              prompt: "2. 'Ich habe ______ (die) Zeit.' (I have no time.)",
              expected: ["keine"],
              hint: "Feminine negation with -e.",
              explanation: "die Zeit (feminine) -> keine Zeit."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 2):**
1. **Articles in Nominativ (Subject):**
   - Masculine: *der* Mann / *ein* Mann / *kein* Mann
   - Feminine: *die* Frau / *eine* Frau / *keine* Frau
   - Neutral: *das* Kind / *ein* Kind / *kein* Kind
   - Plural: *die* Freunde / - / *keine* Freunde
2. **The Verb *haben* (to have):**
   - *ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben*.
3. **Yes/No Questions (Ja/Nein-Fragen):**
   - Verb moves to **Position 1**: *Arbeitest du bei Siemens?* -> *Ja, ich arbeite bei Siemens.*
      `,
      vocabList: [
        { de: "der Beruf, -e", en: "profession / career", type: "der" },
        { de: "der Lehrer, - / die Lehrerin, -nen", en: "teacher (m / f)", type: "der" },
        { de: "der Arzt, -\"e / die Ärztin, -nen", en: "doctor (m / f)", type: "der" },
        { de: "der Student, -en / die Studentin, -nen", en: "university student (m / f)", type: "der" },
        { de: "das Hobby, -s", en: "hobby", type: "das" },
        { de: "der Kollege, -n / die Kollegin, -nen", en: "colleague (m / f)", type: "der" },
        { de: "der Freund, -e / die Freundin, -nen", en: "friend (m / f)", type: "der" },
        { de: "die Musik", en: "music", type: "die" },
        { de: "die Gitarre, -n", en: "guitar", type: "die" },
        { de: "der Fußball", en: "soccer / football", type: "der" },
        { de: "der Wochentag, -e", en: "day of the week", type: "der" },
        { de: "Montag, Dienstag, Mittwoch...", en: "Monday, Tuesday, Wednesday...", type: "phrase" },
        { de: "das Wochenende, -n", en: "weekend", type: "das" },
        { de: "das Jahr, -e", en: "year", type: "das" },
        { de: "das Alter", en: "age", type: "das" },
        { de: "spielen (er spielt)", en: "to play", type: "verb" },
        { de: "arbeiten (er arbeitet)", en: "to work", type: "verb" },
        { de: "haben (er hat)", en: "to have", type: "verb" },
        { de: "machen (er macht)", en: "to do / make", type: "verb" },
        { de: "kochen (er kocht)", en: "to cook", type: "verb" },
        { de: "schwimmen (er schwimmt)", en: "to swim", type: "verb" },
        { de: "tanzen (er tanzt)", en: "to dance", type: "verb" },
        { de: "reisen (er reist)", en: "to travel", type: "verb" },
        { de: "fotografieren (er fotografiert)", en: "to take photos", type: "verb" },
        { de: "gern / nicht gern", en: "gladly / not gladly (like / dislike)", type: "phrase" },
        { de: "Was sind Sie von Beruf?", en: "What is your profession?", type: "phrase" },
        { de: "Ich arbeite als...", en: "I work as a...", type: "phrase" }
      ],
      quizzes: [
        {
          q: "Choose the correct form of 'haben': '______ du Geschwister?'",
          options: ["Habt", "Hast", "Haben", "Hat"],
          correct: 1,
          explanation: "Subject 'du' takes 'hast' (du hast)."
        },
        {
          q: "How do you negate 'Das ist ein Buch'?",
          options: ["Das ist nicht ein Buch", "Das ist kein Buch", "Das ist keine Buch", "Das ist nichts Buch"],
          correct: 1,
          explanation: "'das Buch' is neutral, so the negative indefinite article is 'kein Buch'."
        }
      ]
    },
    {
      id: 3,
      title: "Kapitel 3: In Hamburg",
      subtitle: "City Places, Asking Directions, Public Transit & Akkusativ Case",
      pdfPage: 29,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_3.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 3  In Hamburg.mp3",
      audioTracks: [
        { id: "1-030", name: "Track 1-030", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-030.mp3" },
        { id: "1-031", name: "Track 1-031", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-031.mp3" },
        { id: "1-032", name: "Track 1-032", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-032.mp3" },
        { id: "1-033", name: "Track 1-033", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-033.mp3" },
        { id: "1-034", name: "Track 1-034", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-034.mp3" },
        { id: "1-035", name: "Track 1-035", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-035.mp3" },
        { id: "1-036", name: "Track 1-036", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-036.mp3" },
        { id: "1-037", name: "Track 1-037", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-037.mp3" },
        { id: "1-038", name: "Track 1-038", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-038.mp3" },
        { id: "1-041", name: "Track 1-041", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-041.mp3" }
      ],
      videos: [
        { title: "Film 006: In Hamburg (with Subtitles)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_3-4/NWn_A1_Film_006_UT.mp4" },
        { title: "Film 007: Nach dem Weg fragen", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_3-4/NWn_A1_Film_007.mp4" },
        { title: "G-Clip 02: Bestimmter und unbestimmter Artikel", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 02.mp4" },
        { title: "P-Clip 03: Aussprache & Melodie", path: BASE_PATH + "Kursbuch A1 - Video/P-Clip 03.mp4" },
        { title: "R-Clip 02: Orientierung in der Stadt", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 02_-_mit_Untertiteln.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 3: In der Stadt! Erkunden Sie Hamburg, fragen Sie nach dem Weg, beschreiben Sie Orte und lernen Sie bestimmte, unbestimmte sowie Negationsartikel.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 3 — In der Stadt
**Core Focus**: Exploring the city (Hamburg), asking about sights and public transport, asking for & describing directions, mastering indefinite, definite, and negative articles, and formal polite commands (Imperativ mit Sie).

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Fragen zu Orten stellen und antworten (Asking About Places & Sights)
| Question | German Response | English Meaning |
|---|---|---|
| **Was ist das?** | **Das ist der Hafen / eine Kirche / das Rathaus.** | What is that? -> That is the port / a church / the city hall. |
| **Ist das eine Kirche?** | **Ja. / Ja, das ist die Michaeliskirche.** | Is that a church? -> Yes, that is St. Michael's Church. |
| **Ist das ein Hotel?** | **Nein, das ist das Rathaus.** | Is that a hotel? -> No, that is the city hall. |

#### 2. Nach Dingen fragen (Asking About Objects & Vehicles)
| Question | Positive Response | Negative Response (kein / keine) |
|---|---|---|
| **Ist das ein Bus?** | Ja, das ist **ein** Bus. | Nein, das ist **kein** Bus. |
| **Ist das ein Auto?** | Ja, das ist **ein** Auto. | Nein, das ist **kein** Auto. |
| **Ist das eine U-Bahn?** | Ja, das ist **eine** U-Bahn. | Nein, das ist **keine** U-Bahn. |

#### 3. Nach dem Weg fragen und Weg beschreiben (Directions)
| Speaker | German Redemittel | English Meaning |
|---|---|---|
| Asking politely | **(Entschuldigung.) Wo ist bitte der Bahnhof / die Kirche?** | (Excuse me.) Where is the station / church please? |
| Giving direction | **Das ist ganz einfach. Gehen Sie rechts / links / geradeaus...** | That's quite simple. Go right / left / straight ahead... |
| Landmark guidance | **... und dann sehen Sie die Kirche. Da ist der Hafen.** | ... and then you see the church. There is the port. |
| Confirming understanding | **Also, hier rechts / links / geradeaus und dann...?** | So, right / left / straight here, and then...? |
| Reassurance | **Ja. / Ja, genau.** | Yes. / Yes, exactly. |
| Thanking & Replying | **Vielen Dank! -> Bitte. / Bitte, gern.** | Thank you very much! -> You're welcome! |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Artikelübersicht: Unbestimmt, Bestimmt & Negation (Nominativ)
> Use **unbestimmt** (*ein/eine*) for new or unidentified objects; use **bestimmt** (*der/das/die*) for specific, already mentioned things; use **Negation** (*kein/keine*) to negate nouns!

| Genus (Gender) | Unbestimmt *(neu / nicht bekannt)* | Bestimmt *(spezifisch / bekannt)* | Negationsartikel *(Negation)* |
|---|---|---|---|
| **Maskulin** | Das ist **ein** Hafen. | Das ist **der** Hafen von Hamburg. | Das ist **kein** Bahnhof. |
| **Neutrum** | Das ist **ein** Hotel. | **Das** Hotel heißt „Linde“. | Das ist **kein** Rathaus. |
| **Feminin** | Das ist **eine** Brücke. | **Die** Brücke heißt „Alsterbrücke“. | Das ist **keine** Straße. |
| **Plural** | Das sind **–** Schiffe. | **Die** Schiffe sind im Hafen. | Das sind **keine** Autos. |

> 💡 **Notice**: The indefinite article *ein* has **NO plural form**! The plural simply has no article (Nullartikel): *Das ist ein Schiff* -> *Das sind Schiffe*.

#### 2. Imperativ mit „Sie“ (Polite Directions & Requests)
> To give polite directions or instructions with *Sie*, invert the subject and verb: **Verb on Position 1 + Sie**!

| Infinitiv | Verb (Position 1) | Sie (Position 2) | Richtungsangabe | Beispielsatz |
|---|---|---|---|---|
| gehen | **Gehen** | **Sie** | links / rechts / geradeaus | *Gehen Sie links!* (Turn left!) |
| fahren | **Fahren** | **Sie** | geradeaus | *Fahren Sie geradeaus!* (Drive straight ahead!) |
| biegen | **Biegen** | **Sie** | an der Kreuzung ab | *Biegen Sie rechts ab!* (Turn right!) |

#### 3. Prädikatives Adjektiv mit „sein“ (Adjectives with to be)
When an adjective follows the verb *sein* to describe a subject, it **does not take any ending**:
- *Der Turm **ist** 112 Meter **hoch**.*
- *Der Hafen **ist groß**.*
- *Die Kirche **ist schön**.*
- *Die Straßen **sind eng**.*

      `
      },
      interactiveExercises: [
        {
          id: "k3_ex1",
          title: "Übung 1: The Akkusativ Case (der -> den / ein -> einen)",
          instruction: "Fill in the correct Akkusativ article:",
          questions: [
            {
              id: "k3_q1",
              prompt: "1. 'Ich suche ______ (der) Bahnhof.'",
              expected: ["den"],
              hint: "In Akkusativ, masculine 'der' becomes 'den'.",
              explanation: "'der Bahnhof' is masculine. As a direct object, 'der' changes to 'den'."
            },
            {
              id: "k3_q2",
              prompt: "2. 'Wir brauchen ______ (ein) Stadtplan (der Stadtplan).'",
              expected: ["einen"],
              hint: "Indefinite masculine article in Akkusativ adds -en.",
              explanation: "der Stadtplan (city map) -> einen Stadtplan."
            },
            {
              id: "k3_q3",
              prompt: "3. 'Sie sucht ______ (die) U-Bahn-Station.'",
              expected: ["die"],
              hint: "Feminine 'die' remains unchanged in Akkusativ!",
              explanation: "Feminine nouns do not change form in Akkusativ: die U-Bahn-Station."
            }
          ]
        },
        {
          id: "k3_ex2",
          title: "Übung 2: Giving Directions (Wegbeschreibung)",
          instruction: "Complete the direction sentences:",
          questions: [
            {
              id: "k3_q4",
              prompt: "1. 'Gehen Sie bitte ______ (straight ahead).'",
              expected: ["geradeaus", "Geradeaus"],
              hint: "German word for straight ahead, starts with g.",
              explanation: "'geradeaus' means straight ahead."
            },
            {
              id: "k3_q5",
              prompt: "2. 'Dann biegen Sie ______ (to the left) ab.'",
              expected: ["links", "Links"],
              hint: "Opposite of 'rechts' (right).",
              explanation: "'links' means left (biegen Sie links ab)."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 3):**
1. **The Akkusativ Case (Direct Object):**
   - ONLY masculine changes:
     - Masculine: *der* -> **den**, *ein* -> **einen**, *kein* -> **keinen**
     - Feminine: *die* -> **die**, *eine* -> **eine**, *keine* -> **keine**
     - Neutral: *das* -> **das**, *ein* -> **ein**, *kein* -> **kein**
     - Plural: *die* -> **die**, *keine* -> **keine**
2. **Negation: *nicht* vs *kein*:**
   - Use *kein* for nouns introduced by *ein* or no article.
   - Use *nicht* for verbs, adjectives, or nouns with definite articles (*der/die/das*).
      `,
      vocabList: [
        { de: "der Bahnhof, -\"e", en: "train station", type: "der" },
        { de: "der Hafen, -\"", en: "harbor / port", type: "der" },
        { de: "der Bus, -se", en: "bus", type: "der" },
        { de: "der Zug, -\"e", en: "train", type: "der" },
        { de: "der Park, -s", en: "park", type: "der" },
        { de: "der Markt, -\"e", en: "market", type: "der" },
        { de: "die Straße, -n", en: "street / road", type: "die" },
        { de: "die Kirche, -n", en: "church", type: "die" },
        { de: "die U-Bahn, -en", en: "subway / underground train", type: "die" },
        { de: "die S-Bahn, -en", en: "suburban train", type: "die" },
        { de: "die Fahrkarte, -n", en: "ticket", type: "die" },
        { de: "das Hotel, -s", en: "hotel", type: "das" },
        { de: "das Museum, Museen", en: "museum", type: "das" },
        { de: "das Rathaus, -\"er", en: "city hall", type: "das" },
        { de: "das Fahrrad, -\"er", en: "bicycle", type: "das" },
        { de: "das Taxi, -s", en: "taxi", type: "das" },
        { de: "suchen (er sucht)", en: "to search / look for", type: "verb" },
        { de: "finden (er findet)", en: "to find", type: "verb" },
        { de: "fahren (er fährt)", en: "to drive / ride / go by vehicle", type: "verb" },
        { de: "gehen (er geht)", en: "to go / walk", type: "verb" },
        { de: "abbiegen (er biegt ab)", en: "to turn (corner)", type: "verb" },
        { de: "links / rechts / geradeaus", en: "left / right / straight ahead", type: "phrase" },
        { de: "Entschuldigung, wo ist...?", en: "Excuse me, where is...?", type: "phrase" },
        { de: "einfach / hin und zurück", en: "one-way / round-trip", type: "phrase" }
      ],
      quizzes: [
        {
          q: "Complete the Akkusativ sentence: 'Ich suche ______ Bahnhof (der Bahnhof).'",
          options: ["der", "den", "dem", "das"],
          correct: 1,
          explanation: "In Akkusativ as a direct object, masculine 'der' becomes 'den'."
        }
      ]
    },
    {
      id: 4,
      title: "Kapitel 4: Guten Appetit!",
      subtitle: "Food, Drinks, Market Shopping & Restaurant Ordering",
      pdfPage: 45,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_4.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 4  Guten Appetit !.mp3",
      audioTracks: [
        { id: "1-042", name: "Track 1-042", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-042.mp3" },
        { id: "1-043", name: "Track 1-043", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-043.mp3" },
        { id: "1-044", name: "Track 1-044", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-044.mp3" },
        { id: "1-045", name: "Track 1-045", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-045.mp3" },
        { id: "1-046", name: "Track 1-046", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-046.mp3" },
        { id: "1-047", name: "Track 1-047", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-047.mp3" },
        { id: "1-048", name: "Track 1-048", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-048.mp3" },
        { id: "1-049", name: "Track 1-049", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-049.mp3" },
        { id: "1-050", name: "Track 1-050", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-050.mp3" },
        { id: "1-051", name: "Track 1-051", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-051.mp3" },
        { id: "1-052", name: "Track 1-052", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-052.mp3" },
        { id: "1-053", name: "Track 1-053", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-053.mp3" },
        { id: "1-054", name: "Track 1-054", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-054.mp3" }
      ],
      videos: [
        { title: "Film 008: Einkaufen auf dem Markt", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_3-4/NWn_A1_Film_008.mp4" },
        { title: "Film 009: Essen und Trinken", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_3-4/NWn_A1_Film_009.mp4" },
        { title: "Film 008-009: Kapitel 4 Komplett (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_3-4/NWn_A1_Film_008-009_UT.mp4" },
        { title: "G-Clip 02: Akkusativ", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 02.mp4" },
        { title: "R-Clip 02: Einkaufen & Bestellen", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 02.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 4: Guten Appetit! Lernen Sie Einkaufsgespräche zu führen, im Restaurant zu bestellen und den Akkusativ sicher anzuwenden.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 4 — Guten Appetit!
**Core Focus**: Grocery shopping, ordering food & drinks in restaurants, meal etiquette, expressing culinary preferences, irregular verbs (*essen, mögen, möchten*), and mastering the Akkusativ case.

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Gespräche beim Einkauf führen (Market & Grocery Shopping)
| Speaker | German Redemittel | English Meaning |
|---|---|---|
| Sales clerk opening | **Bitte? / Was möchten Sie?** | Please? / What would you like? |
| Customer request | **Ich möchte Äpfel, bitte. Haben Sie Käse?** | I would like apples, please. Do you have cheese? |
| Sales clerk follow-up | **Sonst noch etwas? / Ist das alles?** | Anything else? / Is that everything? |
| Customer adding items | **Ja, ich brauche noch Brot. / Ich nehme noch Milch.** | Yes, I also need bread. / I'll also take milk. |
| Customer concluding | **Nein, danke. Das ist alles.** | No, thank you. That's all. |
| Asking for location | **Wo finde ich Kaffee? / Wo gibt es Tomaten?** | Where do I find coffee? / Where are tomatoes? |
| Clerk giving location | **Dort rechts / links / geradeaus.** | Over there on the right / left / straight ahead. |
| Asking price | **Was kostet / kosten...? / Wie viel kostet...?** | What does ... cost? / How much does ... cost? |
| Stating price | **Das kostet 2,50 Euro. / Sie kosten 3 Euro.** | That costs €2.50. / They cost €3.00. |
| Paying & Change | **Können Sie wechseln? -> Ja, Moment.** | Can you break this? -> Yes, one moment. |

#### 2. Gespräche beim Essen führen (Dining Table Etiquette)
| Situation / Context | German Redemittel | English Meaning |
|---|---|---|
| Before eating wish | **Guten Appetit!** | Enjoy your meal! (Bon appétit!) |
| Mutual reply | **Danke, gleichfalls!** | Thank you, same to you! |
| Offering more food | **Möchtest du / Möchten Sie noch Salat?** | Would you like some more salad? |
| Accepting compliment | **Ja, bitte. Das schmeckt sehr gut / lecker!** | Yes, please. That tastes very good / delicious! |
| Declining politely | **Nein, danke. Ich esse kein Fleisch.** | No, thanks. I don't eat meat. |
| Declining when full | **Nein, danke. Ich bin satt.** | No, thanks. I am full / satisfied. |

#### 3. Über Vorlieben beim Essen sprechen (Likes & Dislikes)
| Question | Positive Answer | Negative Answer |
|---|---|---|
| **Essen / Trinken Sie gern Fisch?** | Ja, sehr gern! | Nein, nicht so gern. / Gar nicht gern. |
| **Was isst / trinkst du gern?** | Ich esse / trinke gern Obst. | Ich trinke nicht gern Tee. |
| **Was magst du?** | Ich mag Schokolade sehr gern. | Ich mag keinen Kaffee / kein Bier / keine Milch. |

#### 4. Über die Mahlzeiten des Tages sprechen (Meals of the Day)
- **Zum Frühstück**: *Zum Frühstück trinke ich Kaffee und esse ein Brot mit Käse.*
- **Vormittags / Am Vormittag**: *Vormittags trinke ich viel Wasser.*
- **Mittags / Am Mittag**: *Mittags mag ich gerne eine warme Suppe oder Pasta.*
- **Nachmittags / Am Nachmittag**: *Nachmittags trinke ich gerne einen Cappuccino.*
- **Abends / Am Abend**: *Abends esse ich oft Salat oder Brot mit Butter.*

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Unregelmäßige Verben: essen, mögen, möchten
| Pronomen | essen *(e -> i/iss)* | mögen *(Modalverb mag)* | möchten *(Höflichkeitsform)* |
|---|---|---|---|
| **ich** | esse | **mag** | möchte |
| **du** | **isst** | **magst** | möchtest |
| **er / sie / es** | **isst** | **mag** | möchte |
| **wir** | essen | mögen | möchten |
| **ihr** | esst | mögt | möchtet |
| **sie / Sie** | essen | mögen | möchten |

#### 2. Positionen im Satz (Verb on Position 2 Rule)
> In a German main statement, the **verb is firmly fixed at Position 2**. The subject can stand on Position 1 or directly behind the verb on Position 3!

| Position 1 | Position 2 (Verb) | Position 3 | Position 4 / Rest |
|---|---|---|---|
| **Lina** *(Subject)* | **isst** | morgens | Müsli. |
| **Morgens** *(Time)* | **isst** | **Lina** *(Subject)* | Müsli. |

#### 3. Der Akkusativ (The Direct Object Case)
> The **Akkusativ case** changes ONLY the masculine gender (\`der -> den\`, \`ein -> einen\`, \`kein -> keinen\`). Neuter, feminine, and plural remain identical to Nominativ!

| Genus | Nominativ (Subjekt) | Akkusativ (Objekt) | Beispielsatz im Akkusativ |
|---|---|---|---|
| **Maskulin** | **der / ein / kein** Käse | **den / einen / keinen** Käse | *Ich kaufe **einen** Käse.* |
| **Neutrum** | **das / ein / kein** Brot | **das / ein / kein** Brot | *Wir essen **das** Brot.* |
| **Feminin** | **die / eine / keine** Gurke | **die / eine / keine** Gurke | *Haben Sie **eine** Gurke?* |
| **Plural** | **die / – / keine** Tomaten | **die / – / keine** Tomaten | *Er nimmt **keine** Tomaten.* |

#### 4. Typische Verben mit Akkusativ (Food & Shopping Verbs)
The following key verbs always require an object in the **Akkusativ**:
- **brauchen**: *Ich brauche **einen** Apfel.*
- **haben**: *Wir haben **keinen** Salat.*
- **kochen / machen**: *Er kocht **eine** Gemüsesuppe.*
- **essen / trinken**: *Sie isst **einen** Fisch und trinkt **einen** Tee.*
- **kaufen / nehmen**: *Wir nehmen **den** Schinken und **das** Würstchen.*
- **mögen / möchten**: *Ich möchte **einen** Orangensaft.*

      `
      },
      interactiveExercises: [
        {
          id: "k4_ex1",
          title: "Übung 1: Stem Vowel Change Verbs (e -> i)",
          instruction: "Conjugate the verb in parentheses:",
          questions: [
            {
              id: "k4_q1",
              prompt: "1. 'Was ______ (essen) du gern zum Frühstück?'",
              expected: ["isst"],
              hint: "Vowel e changes to i for subject 'du'.",
              explanation: "Conjugation of 'essen' for 'du' is 'du isst'."
            },
            {
              id: "k4_q2",
              prompt: "2. 'Er ______ (nehmen) ein Stück Kuchen.'",
              expected: ["nimmt"],
              hint: "Conjugation of 'nehmen' for 'er'.",
              explanation: "For 'er', nehmen becomes 'nimmt'."
            }
          ]
        },
        {
          id: "k4_ex2",
          title: "Übung 2: Ordering with 'möchten' & Akkusativ",
          instruction: "Complete the ordering sentences:",
          questions: [
            {
              id: "k4_q3",
              prompt: "1. 'Ich ______ (möchten) bitte einen Apfelsaft.'",
              expected: ["möchte"],
              hint: "Form of möchten for subject 'ich'.",
              explanation: "'ich möchte'."
            },
            {
              id: "k4_q4",
              prompt: "2. 'Ich trinke ______ (kein / keine) Kaffee (der Kaffee).'",
              expected: ["keinen"],
              hint: "der Kaffee in Akkusativ: kein -> keinen.",
              explanation: "Masculine direct object Akkusativ: keinen Kaffee."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 4):**
1. **Stem Vowel Changes (e -> i / ie):**
   - Affects ONLY *du* and *er/sie/es*.
   - *essen*: ich esse, **du isst**, **er isst**, wir essen
   - *nehmen*: ich nehme, **du nimmst**, **er nimmt**, wir nehmen
2. **The Polite Modal *möchten* (would like):**
   - *ich möchte, du möchtest, er/sie/es möchte, wir möchten, ihr möchtet, sie/Sie möchten*.
      `,
      vocabList: [
        { de: "der Apfel, -\"", en: "apple", type: "der" },
        { de: "der Kaffee", en: "coffee", type: "der" },
        { de: "der Tee", en: "tea", type: "der" },
        { de: "der Käse", en: "cheese", type: "der" },
        { de: "der Fisch, -e", en: "fish", type: "der" },
        { de: "die Milch", en: "milk", type: "die" },
        { de: "die Banane, -n", en: "banana", type: "die" },
        { de: "die Tomate, -n", en: "tomato", type: "die" },
        { de: "die Wurst, -\"e", en: "sausage", type: "die" },
        { de: "das Brot, -e", en: "bread", type: "das" },
        { de: "das Brötchen, -", en: "bread roll", type: "das" },
        { de: "das Ei, -er", en: "egg", type: "das" },
        { de: "das Fleisch", en: "meat", type: "das" },
        { de: "das Wasser", en: "water", type: "das" },
        { de: "das Obst", en: "fruit", type: "das" },
        { de: "das Gemüse", en: "vegetables", type: "das" },
        { de: "essen (er isst)", en: "to eat", type: "verb" },
        { de: "trinken (er trinkt)", en: "to drink", type: "verb" },
        { de: "nehmen (er nimmt)", en: "to take", type: "verb" },
        { de: "kosten (es kostet)", en: "to cost", type: "verb" },
        { de: "bezahlen (er bezahlt)", en: "to pay", type: "verb" },
        { de: "Guten Appetit!", en: "Enjoy your meal!", type: "phrase" },
        { de: "Ich möchte bitte...", en: "I would like..., please", type: "phrase" },
        { de: "Zahlen, bitte!", en: "The bill, please!", type: "phrase" }
      ],
      quizzes: [
        {
          q: "What is the correct form: 'Was ______ du zum Frühstück? (essen)'",
          options: ["esst", "isst", "esse", "essen"],
          correct: 1,
          explanation: "The verb 'essen' changes vowel: 'du isst'."
        }
      ]
    },
    {
      id: 5,
      title: "Kapitel 5: Alltag und Familie",
      subtitle: "Daily Routines, Telling Time, Family Members & Separable Verbs",
      pdfPage: 55,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_5.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 5  Alltag und Familie.mp3",
      audioTracks: [
        { id: "1-055", name: "Track 1-055", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-055.mp3" },
        { id: "1-056", name: "Track 1-056", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-056.mp3" },
        { id: "1-057", name: "Track 1-057", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-057.mp3" },
        { id: "1-058", name: "Track 1-058", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-058.mp3" },
        { id: "1-059", name: "Track 1-059", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-059.mp3" },
        { id: "1-060", name: "Track 1-060", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-060.mp3" },
        { id: "1-061", name: "Track 1-061", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-061.mp3" },
        { id: "1-062", name: "Track 1-062", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-062.mp3" },
        { id: "1-063", name: "Track 1-063", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-063.mp3" },
        { id: "1-064", name: "Track 1-064", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-064.mp3" },
        { id: "1-065", name: "Track 1-065", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-065.mp3" },
        { id: "1-066", name: "Track 1-066", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-066.mp3" },
        { id: "1-067", name: "Track 1-067", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-067.mp3" },
        { id: "1-068", name: "Track 1-068", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-068.mp3" },
        { id: "1-069", name: "Track 1-069", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-069.mp3" }
      ],
      videos: [
        { title: "Film 010: Alltag und Termine", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_5/NWn_A1_Film_010.mp4" },
        { title: "Film 010: Alltag und Termine (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_5/NWn_A1_Film_010_UT.mp4" },
        { title: "Film 011: PÃ¼nktlichkeit & VerspÃ¤tung", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_5/NWn_A1_Film_011.mp4" },
        { title: "Film 011: PÃ¼nktlichkeit (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_5/NWn_A1_Film_011_UT.mp4" },
        { title: "Film 012: Familie & Tagesablauf (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_5/NWn_A1_Film_012_UT.mp4" },
        { title: "G-Clip 03: Modalverben & Satzklammer", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 03.mp4" },
        { title: "R-Clip 03: Uhrzeit & Termine vereinbaren", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 03_-_mit_Untertiteln.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 5: Tag für Tag! Meistern Sie Uhrzeiten, Terminabsprachen, Entschuldigungen bei Verspätungen und Modalverben mit der Satzklammer.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 5 — Tag für Tag
**Core Focus**: Daily routines, mastering unofficial and official (24h) time telling, scheduling appointments, apologizing for delays, possessive pronouns in Nominativ & Akkusativ, and modal verbs with the sentence bracket (*Satzklammer*).

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Die Uhrzeit nennen (Telling the Time)
| Frage / Situation | Inoffiziell (Alltagssprache) | Offiziell (Bahn, Radio, Termine) |
|---|---|---|
| **14:45** | Es ist **Viertel vor drei**. | Es ist **vierzehn Uhr fünfundvierzig**. |
| **13:30** | Es ist **halb zwei**. *(halfway to two!)* | Es ist **dreizehn Uhr dreißig**. |
| **09:10** | Es ist **zehn nach neun**. | Es ist **neun Uhr zehn**. |
| **12:58** | Es ist **kurz vor eins**. | Es ist **zwölf Uhr achtundfünfzig**. |
| **15:15** | Es ist **Viertel nach drei**. | Es ist **fünfzehn Uhr fünfzehn**. |
| **17:25** | Es ist **fünf vor halb sechs**. | Es ist **siebzehn Uhr fünfundzwanzig**. |

> 💡 **Important Rule**: In spoken everyday German (*inoffiziell*), **halb zwei** means *half an hour BEFORE two* (= 1:30), not 2:30!

#### 2. Einen Termin vereinbaren (Booking & Rescheduling Appointments)
| Context | German Redemittel | English Meaning |
|---|---|---|
| Requesting Appointment | **Ich hätte gern einen Termin.** | I would like to make an appointment. |
| Asking for Availability | **Haben Sie heute / morgen / am Freitag einen Termin?** | Do you have an appointment today / tomorrow / on Friday? |
| Offering a Slot | **Ja. Da geht es um 14:15 Uhr.** | Yes, 2:15 PM is possible. |
| Declining Slot | **Nein, am Freitag geht es (leider) nicht, aber am Montag.** | No, unfortunately Friday doesn't work, but Monday does. |
| Asking Specific Time | **Können Sie am Mittwoch um 10 Uhr kommen?** | Can you come on Wednesday at 10:00 AM? |
| Feasibility Check | **Geht es am Dienstag um 15 Uhr?** | Does Tuesday at 3:00 PM work? |
| Agreement | **Ja, da kann ich. / Ja, das geht.** | Yes, I can make it then. / Yes, that works. |
| Rejection | **Nein, da kann ich leider nicht. / Das geht leider nicht.** | No, unfortunately I cannot make it then. |

#### 3. Sich für eine Verspätung entschuldigen (Apologies & Reactions)
| Apology (Entschuldigung) | Reaction (Reaktion) | Meaning |
|---|---|---|
| **Entschuldigung, bitte.** | **Schon gut.** | Excuse me, please. -> It's fine. |
| **Bitte entschuldigen Sie.** | **Kein Problem.** | Please excuse me. -> No problem. |
| **Ich bitte um Entschuldigung.** | **Macht nichts.** | I apologize. -> Doesn't matter. |
| **Es tut mir leid, ich bin zu spät.** | **Das nächste Mal bitte pünktlich!** | I'm sorry, I'm late. -> Please be on time next time! |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Zeitangaben: Präpositionen „am“, „um“, „von ... bis“
| Fragewort | Präposition | Verwendung / Kontext | Beispielsatz |
|---|---|---|---|
| **Wann?** | **am** | Wochentage & Tageszeiten | **am** Montag, **am** Vormittag *(Ausnahme: in der Nacht)* |
| **Wann?** | **um** | Genaue Uhrzeit | **um** Viertel vor drei, **um** 14 Uhr |
| **Wie lange?** | **von ... bis** | Zeitspannen / Zeiträume | **von** Montag **bis** Samstag, **von** 9 **bis** 17 Uhr |

#### 2. Possessivartikel im Nominativ und Akkusativ
| Person | Maskulin (Nom -> Akk) | Neutrum (Nom -> Akk) | Feminin (Nom -> Akk) | Plural (Nom -> Akk) |
|---|---|---|---|---|
| **ich** | mein -> **meinen** | mein -> **mein** | meine -> **meine** | meine -> **meine** |
| **du** | dein -> **deinen** | dein -> **dein** | deine -> **deine** | deine -> **deine** |
| **er / es** | sein -> **seinen** | sein -> **sein** | seine -> **seine** | seine -> **seine** |
| **sie** *(she)* | ihr -> **ihren** | ihr -> **ihr** | ihre -> **ihre** | ihre -> **ihre** |
| **wir** | unser -> **unseren** | unser -> **unser** | unsere -> **unsere** | unsere -> **unsere** |
| **ihr** | euer -> **euren** | euer -> **euer** | eur**e** -> **eure** *(drop middle -e-)* | eure -> **eure** |
| **sie** *(they)* | ihr -> **ihren** | ihr -> **ihr** | ihre -> **ihre** | ihre -> **ihre** |
| **Sie** *(formal)* | Ihr -> **Ihren** | Ihr -> **Ihr** | Ihre -> **Ihre** | Ihre -> **Ihre** |

#### 3. Modalverben: müssen, können, wollen
| Pronomen | müssen *(obligation / necessity)* | können *(ability / possibility)* | wollen *(intention / strong desire)* |
|---|---|---|---|
| **ich** | **muss** | **kann** | **will** |
| **du** | **musst** | **kannst** | **willst** |
| **er / sie / es** | **muss** | **kann** | **will** |
| **wir** | müssen | können | wollen |
| **ihr** | müsst | könnt | wollt |
| **sie / Sie** | müssen | können | wollen |

#### 4. Die Satzklammer (Modal Verb Sentence Bracket)
> The conjugated modal verb sits at **Position 2** (or Position 1 in questions), while the main verb moves to the **very end of the sentence in its infinitive form**!

| Position 1 | Position 2 (Modalverb) | Mittelfeld (Information) | Satzende (Infinitiv) |
|---|---|---|---|
| **Wir** | **können** | heute leider nicht ins Kino | **gehen**. |
| **Wollen** | wir | am Samstag zusammen Yoga | **machen**? |
| **Ich** | **muss** | morgen früh um 6 Uhr | **aufstehen**. |

      `
      },
      interactiveExercises: [
        {
          id: "k5_ex1",
          title: "Übung 1: Separable Verbs (Trennbare Verben)",
          instruction: "Complete the prefix at the end of the sentence:",
          questions: [
            {
              id: "k5_q1",
              prompt: "1. 'Anna steht jeden Morgen um 6 Uhr ______ (aufstehen).'",
              expected: ["auf"],
              hint: "Prefix of 'aufstehen' is 'auf'.",
              explanation: "aufstehen separates: 'steht ... auf'."
            },
            {
              id: "k5_q2",
              prompt: "2. 'Am Abend kauft Herr Weber im Supermarkt ______ (einkaufen).'",
              expected: ["ein"],
              hint: "Prefix of 'einkaufen' is 'ein'.",
              explanation: "einkaufen separates: 'kauft ... ein'."
            }
          ]
        },
        {
          id: "k5_ex2",
          title: "Übung 2: Possessive Articles (mein / meine)",
          instruction: "Fill in 'mein' or 'meine':",
          questions: [
            {
              id: "k5_q3",
              prompt: "1. 'Das ist ______ (die) Mutter.'",
              expected: ["meine"],
              hint: "Feminine nouns add -e.",
              explanation: "die Mutter is feminine -> meine Mutter."
            },
            {
              id: "k5_q4",
              prompt: "2. 'Das ist ______ (der) Bruder.'",
              expected: ["mein"],
              hint: "Masculine nouns take mein.",
              explanation: "der Bruder is masculine -> mein Bruder."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 5):**
1. **Separable Verbs (Trennbare Verben):**
   - The prefix moves to the end: *Ich stehe um 7 Uhr **auf**.*
2. **Possessive Articles in Nominativ:**
   - Masculine: *mein / dein*
   - Feminine: *meine / deine*
   - Neutral: *mein / dein*
   - Plural: *meine / deine*
      `,
      vocabList: [
        { de: "die Uhrzeit, -en", en: "time of day", type: "die" },
        { de: "die Familie, -n", en: "family", type: "die" },
        { de: "der Vater, -\"", en: "father", type: "der" },
        { de: "die Mutter, -\"", en: "mother", type: "die" },
        { de: "die Eltern (Pl.)", en: "parents", type: "die" },
        { de: "der Sohn, -\"e", en: "son", type: "der" },
        { de: "die Tochter, -\"", en: "daughter", type: "die" },
        { de: "der Bruder, -\"", en: "brother", type: "der" },
        { de: "die Schwester, -n", en: "sister", type: "die" },
        { de: "die Geschwister (Pl.)", en: "siblings", type: "die" },
        { de: "aufstehen (er steht auf)", en: "to get up / wake up", type: "verb" },
        { de: "anrufen (er ruft an)", en: "to call on phone", type: "verb" },
        { de: "einkaufen (er kauft ein)", en: "to shop / buy groceries", type: "verb" },
        { de: "fernsehen (er sieht fern)", en: "to watch TV", type: "verb" },
        { de: "frühstücken (er frühstückt)", en: "to have breakfast", type: "verb" },
        { de: "schlafen (er schläft)", en: "to sleep", type: "verb" },
        { de: "Wie spät ist es?", en: "What time is it?", type: "phrase" }
      ],
      quizzes: [
        {
          q: "Complete with the separable prefix: 'Ich stehe um 7 Uhr ______.' (aufstehen)",
          options: ["an", "aus", "auf", "ab"],
          correct: 2,
          explanation: "The prefix of 'aufstehen' is 'auf'."
        }
      ]
    },
    {
      id: 6,
      title: "Kapitel 6: Zeit mit Freunden",
      subtitle: "Leisure Time, Making Plans & Modal Verbs (können, wollen, müssen)",
      pdfPage: 65,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_6.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 6  Zeit mit Freunden.mp3",
      audioTracks: [
        { id: "1-070", name: "Track 1-070", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-070.mp3" },
        { id: "1-071", name: "Track 1-071", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-071.mp3" },
        { id: "1-072", name: "Track 1-072", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-072.mp3" },
        { id: "1-073", name: "Track 1-073", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-073.mp3" },
        { id: "1-074", name: "Track 1-074", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-074.mp3" },
        { id: "1-075", name: "Track 1-075", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-075.mp3" },
        { id: "1-076", name: "Track 1-076", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-076.mp3" },
        { id: "1-077", name: "Track 1-077", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-077.mp3" },
        { id: "1-078", name: "Track 1-078", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-078.mp3" },
        { id: "1-079", name: "Track 1-079", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-079.mp3" },
        { id: "1-080", name: "Track 1-080", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-080.mp3" },
        { id: "1-081", name: "Track 1-081", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-081.mp3" },
        { id: "1-082", name: "Track 1-082", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-082.mp3" },
        { id: "1-083", name: "Track 1-083", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-083.mp3" },
        { id: "1-084", name: "Track 1-084", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-084.mp3" },
        { id: "1-085", name: "Track 1-085", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-085.mp3" },
        { id: "1-086", name: "Track 1-086", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-086.mp3" },
        { id: "1-087", name: "Track 1-087", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-087.mp3" },
        { id: "1-088", name: "Track 1-088", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-088.mp3" },
        { id: "1-089", name: "Track 1-089", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-089.mp3" },
        { id: "1-090", name: "Track 1-090", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-090.mp3" },
        { id: "1-091", name: "Track 1-091", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-091.mp3" },
        { id: "1-092", name: "Track 1-092", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-092.mp3" },
        { id: "1-093", name: "Track 1-093", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-093.mp3" },
        { id: "1-094", name: "Track 1-094", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-094.mp3" },
        { id: "1-095", name: "Track 1-095", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-095.mp3" },
        { id: "1-096", name: "Track 1-096", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-096.mp3" },
        { id: "1-097", name: "Track 1-097", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-097.mp3" },
        { id: "1-098", name: "Track 1-098", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-098.mp3" }
      ],
      videos: [
        { title: "Film 013: Einladung zur Feier (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_6/NWn_A1_Film_013_UT.mp4" },
        { title: "Film 014: Im Restaurant", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_6/NWn_A1_Film_014.mp4" },
        { title: "Film 014: Im Restaurant (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_6/NWn_A1_Film_014_UT.mp4" },
        { title: "Film 015: Zusammen oder getrennt zahlen?", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_6/NWn_A1_Film_015.mp4" },
        { title: "Film 015: Zahlen (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_6/NWn_A1_Film_015_UT.mp4" },
        { title: "Film 013-015: Kapitel 6 Komplett", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_6/NWn_A1_Film_013-015.mp4" },
        { title: "G-Clip 03: Trennbare Verben", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 03.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 6: Zeit mit Freunden! Schreiben Sie Einladungen, bestellen und bezahlen Sie im Restaurant und lernen Sie trennbare Verben sowie das Präteritum von sein und haben.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 6 — Zeit mit Freunden
**Core Focus**: Writing party invitations, ordering and paying at restaurants, evaluating events, calendar dates with ordinal numbers, separable verbs (*trennbare Verben*), Präteritum of *haben* and *sein*, and Akkusativ personal pronouns.

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Eine Einladung schreiben (Writing Written Invitations)
| Component | German Template Phrases | English Meaning |
|---|---|---|
| Salutation | **Hallo ..., / Liebe ..., / Lieber ...,** | Hello ..., / Dear (f) ..., / Dear (m) ..., |
| Occasion | **Wir machen ein Fest / eine Party / ein Picknick.** | We are having a celebration / a party / a picnic. |
| Formal Invite | **Wir laden dich / euch herzlich ein!** | We warmly invite you (sing.) / you (plur.)! |
| Time & Location | **Die Party ist am Samstag, 15. Juni, in unserem Garten.** | The party is on Saturday, June 15th, in our garden. |
| Start Time | **Wir fangen um 18:00 Uhr an.** | We start at 6:00 PM. |
| Requests | **Kannst du / Könnt ihr einen Salat mitbringen?** | Can you bring along a salad? |
| Warm Wish | **Hoffentlich hast du / habt ihr Zeit!** | Hopefully you have time! |
| Closing | **Liebe Grüße / Viele Grüße / Herzliche Grüße** | Warm regards / Best regards / Kind regards |

#### 2. Im Restaurant bestellen und bezahlen (Ordering & Paying)
| Situation | German Redemittel | English Meaning |
|---|---|---|
| Waiter greeting | **Was möchten Sie trinken / bestellen? Und für Sie?** | What would you like to drink / order? And for you? |
| Drink order | **Für mich bitte ein Mineralwasser. / Ich hätte gern Apfelsaft.** | For me a mineral water, please. / I'd like an apple juice. |
| Food order | **Ich möchte / nehme die Tomatensuppe und einen Salat.** | I would like / take the tomato soup and a salad. |
| Asking for bill | **Entschuldigung, kann ich / können wir bitte zahlen?** | Excuse me, can I / can we please pay? |
| Waiter question | **Zusammen oder getrennt?** | Together or separately? |
| Customer reply | **Zusammen, bitte! / Getrennt, bitte.** | Together, please! / Separately, please. |
| Total sum | **Das macht zusammen 28,50 Euro.** | That comes to €28.50 altogether. |
| Tipping etiquette | **Stimmt so! / Machen Sie 30 Euro, bitte.** | Keep the change! / Make it €30, please. |

#### 3. Über ein Ereignis sprechen (Reviewing Past Events)
| Question | Positive Feedback | Negative / Neutral Feedback |
|---|---|---|
| **Wie war die Party / das Konzert?** | Es war **super / wunderschön!** | Es war **nicht so gut / langweilig**. |
| **Wie war das Essen?** | Das Essen war **lecker / fantastisch.** | Das Essen war **okay / kalt.** |
| **Wie war der Kellner?** | Der Kellner war **sehr nett und freundlich.** | Der Kellner war **unfreundlich / langsam.** |
| **Hattet ihr Spaß?** | Ja, wir hatten **viel Spaß!** | Nein, wir hatten **leider keinen Spaß.** |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Ordinalzahlen: Datum (Calendar Dates with „am ...sten / ...ten“)
> When stating a date with **am**, add the ending **-ten** (for numbers 1–19) and **-sten** (for numbers 20+):

| Day | German Expression | Day | German Expression | Day | German Expression |
|---|---|---|---|---|---|
| **1.** | am **ersten** *(irregular)* | **8.** | am **achten** *(one -t)* | **20.** | am **zwanzigsten** |
| **2.** | am **zweiten** | **9.** | am **neunten** | **21.** | am **einundzwanzigsten** |
| **3.** | am **dritten** *(irregular)* | **10.** | am **zehnten** | **22.** | am **zweiundzwanzigsten** |
| **4.** | am **vierten** | **11.** | am **elften** | **30.** | am **dreißigsten** |
| **5.** | am **fünften** | **12.** | am **zwölften** | **31.** | am **einunddreißigsten** |
| **6.** | am **sechsten** | **13.** | am **dreizehnten** | | |
| **7.** | am **siebten** *(irregular)* | **14.** | am **vierzehnten** | | |

#### 2. Trennbare Verben (Separable Prefix Verbs)
> In simple present tense, the prefix detaches and moves to the **absolute end of the clause**! When combined with a modal verb, the verb remains unbroken at the end.

| Infinitiv | Präfix | Beispielsatz im Präsens | Satz mit Modalverb |
|---|---|---|---|
| **einladen** | *ein-* | Sie **laden** heute ihre Freunde **ein**. | Wir wollen sie **einladen**. |
| **abholen** | *ab-* | Er **holt** Sofia am Bahnhof **ab**. | Kannst du mich **abholen**? |
| **anfangen** | *an-* | Der Film **fängt** um 20 Uhr **an**. | Wann soll der Kurs **anfangen**? |
| **mitbringen** | *mit-* | Ich **bringe** einen Kuchen **mit**. | Du musst nichts **mitbringen**. |
| **mitmachen** | *mit-* | **Macht** ihr heute Abend **mit**? | Wir möchten gerne **mitmachen**. |

#### 3. Präteritum von „haben“ und „sein“ (Simple Past of Have & Be)
| Pronomen | haben -> hatte *(had)* | sein -> war *(was / were)* |
|---|---|---|
| **ich** | **hatte** | **war** |
| **du** | **hattest** | **warst** |
| **er / sie / es** | **hatte** | **war** |
| **wir** | **hatten** | **waren** |
| **ihr** | **hattet** | **wart** |
| **sie / Sie** | **hatten** | **waren** |

#### 4. Personalpronomen im Akkusativ & Präposition „für“
| Nominativ | Akkusativ | Beispielsatz |
|---|---|---|
| **ich** | **mich** | *Holst du **mich** bitte ab?* |
| **du** | **dich** | *Ich lade **dich** herzlich ein.* |
| **er** | **ihn** | *Das Geschenk ist für **ihn**.* |
| **es** | **es** | *Ich kenne **es** nicht.* |
| **sie** *(she)* | **sie** | *Wir rufen **sie** morgen an.* |
| **wir** | **uns** | *Besucht ihr **uns** am Sonntag?* |
| **ihr** | **euch** | *Wir vermissen **euch** sehr.* |
| **sie** *(they)* | **sie** | *Er lädt **sie** zur Party ein.* |
| **Sie** *(formal)* | **Sie** | *Ich möchte **Sie** gerne kennenlernen.* |

> 💡 **Rule for „für“**: The preposition **für** ALWAYS demands the **Akkusativ**: *Für **wen** ist das Wasser? Das Wasser ist für **den Hund** / für **ihn**.*

      `
      },
      interactiveExercises: [
        {
          id: "k6_ex1",
          title: "Übung 1: Conjugating Modal Verbs",
          instruction: "Fill in the correct modal verb form:",
          questions: [
            {
              id: "k6_q1",
              prompt: "1. 'Cheeya ______ (können) sehr gut Klavier spielen.'",
              expected: ["kann"],
              hint: "Form of können for 3rd person singular.",
              explanation: "sie kann -> Maria kann."
            },
            {
              id: "k6_q2",
              prompt: "2. '______ (wollen) du am Freitag ins Kino gehen?'",
              expected: ["Willst", "willst"],
              hint: "Form of wollen for subject 'du'.",
              explanation: "du willst -> Willst du...?"
            }
          ]
        },
        {
          id: "k6_ex2",
          title: "Übung 2: Sentence Bracket (End-of-Sentence Verb)",
          instruction: "Complete the verb at the end of the sentence in Infinitive form:",
          questions: [
            {
              id: "k6_q3",
              prompt: "1. 'Ich kann heute leider nicht ______ (kommen).'",
              expected: ["kommen"],
              hint: "The main verb remains in Infinitive at the end.",
              explanation: "Modal bracket: 'kann ... kommen'."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 6):**
1. **Modal Verbs:**
   - *können* (can): ich kann, du kannst, er kann
   - *wollen* (want): ich will, du willst, er will
   - *müssen* (must): ich muss, du musst, er muss
2. **Satzklammer (Sentence Bracket):**
   - Modal Verb at Position 2 + Infinitive Verb at the end.
      `,
      vocabList: [
        { de: "die Freizeit", en: "free time / leisure", type: "die" },
        { de: "das Kino, -s", en: "cinema / movie theater", type: "das" },
        { de: "das Theater, -", en: "theater", type: "das" },
        { de: "das Konzert, -e", en: "concert", type: "das" },
        { de: "die Verabredung, -en", en: "appointment / date", type: "die" },
        { de: "treffen (er trifft)", en: "to meet", type: "verb" },
        { de: "können (er kann)", en: "can / to be able to", type: "verb" },
        { de: "wollen (er will)", en: "to want to", type: "verb" },
        { de: "müssen (er muss)", en: "must / to have to", type: "verb" },
        { de: "Hast du Zeit?", en: "Do you have time?", type: "phrase" },
        { de: "Tut mir leid, ich kann nicht", en: "I'm sorry, I can't", type: "phrase" }
      ],
      quizzes: [
        {
          q: "Which word order is correct?",
          options: [
            "Ich will Deutsch lernen heute.",
            "Ich will heute Deutsch lernen.",
            "Ich lernen heute Deutsch will.",
            "Deutsch lernen ich will heute."
          ],
          correct: 1,
          explanation: "Modal verb 'will' at Position 2, infinitive 'lernen' at the very end."
        }
      ]
    },
    {
      id: 7,
      title: "Kapitel 7: Arbeitsalltag",
      subtitle: "Workplace, Office Tasks, Phone Calls, Präteritum (war & hatte)",
      pdfPage: 81,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_7.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 7  Arbeitsalltag.mp3",
      audioTracks: [
        { id: "2-001", name: "Track 2-001", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-001.mp3" },
        { id: "2-002", name: "Track 2-002", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-002.mp3" },
        { id: "2-003", name: "Track 2-003", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-003.mp3" },
        { id: "2-004", name: "Track 2-004", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-004.mp3" },
        { id: "2-005", name: "Track 2-005", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-005.mp3" },
        { id: "2-006", name: "Track 2-006", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-006.mp3" },
        { id: "2-007", name: "Track 2-007", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-007.mp3" },
        { id: "2-008", name: "Track 2-008", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-008.mp3" },
        { id: "2-009", name: "Track 2-009", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-009.mp3" },
        { id: "2-010", name: "Track 2-010", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-010.mp3" },
        { id: "2-011", name: "Track 2-011", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-011.mp3" },
        { id: "2-012", name: "Track 2-012", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-012.mp3" },
        { id: "2-013", name: "Track 2-013", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-013.mp3" },
        { id: "2-014", name: "Track 2-014", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-014.mp3" }
      ],
      videos: [
        { title: "Film 016: Am Arbeitsplatz", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_7/Netzwerk_neu_A1_Film_016.mp4" },
        { title: "Film 016: Am Arbeitsplatz (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_7/Netzwerk_neu_A1_Film_016_UT.mp4" },
        { title: "Film 017: Kontakte & E-Mails", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_7/Netzwerk_neu_A1_Film_017.mp4" },
        { title: "Film 017: Kontakte (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_7/Netzwerk_neu_A1_Film_017_UT.mp4" },
        { title: "Film 016-017: Kapitel 7 Komplett (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_7/Netzwerk_neu_A1_Film_16-17_UT.mp4" },
        { title: "G-Clip 04: Dativ mit PrÃ¤positionen", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 04.mp4" },
        { title: "P-Clip 04: Aussprache & Wortakzent", path: BASE_PATH + "Kursbuch A1 - Video/P-Clip 04.mp4" },
        { title: "R-Clip 04: Small Talk im BÃ¼ro", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 04_UT.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 7: Kontakte! Lernen Sie Büroabläufe zu beschreiben, formelle E-Mails zu verfassen, Small Talk zu führen und den Dativ mit Präpositionen zu gebrauchen.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 7 — Kontakte
**Core Focus**: Office communication, business correspondence standards, casual small talk, contradicting negatives with „Doch!“, connecting sentences (*und, oder, aber*), and mastering the Dativ case with articles, pronouns, and location prepositions.

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Eine Reihenfolge beschreiben (Describing Workflow Sequences)
| Chronological Connector | German Example | English Meaning |
|---|---|---|
| **Zuerst** *(First / Initially)* | **Zuerst fährt Tom den Computer hoch.** | First, Tom boots up the computer. |
| **Dann** *(Then)* | **Dann öffnet er die Datei.** | Then he opens the file. |
| **Danach** *(After that)* | **Danach beantwortet er wichtige Kunden-E-Mails.** | After that, he answers important customer emails. |
| **Später / Schließlich** | **Schließlich macht er eine Kaffeepause.** | Finally, he takes a coffee break. |

> 💡 **Word Order Note**: When starting with connector adverbs (*Zuerst, dann, danach*), the **verb follows immediately on Position 2** (Inversion: *Zuerst **macht** er...*).

#### 2. Briefstandards & E-Mail-Etikette (Letter & Email Standards)
| Section | Informal / Peer | Formal / Business |
|---|---|---|
| **Anrede (Salutation)** | **Liebe Frau Weber, / Lieber Herr Weber,** | **Sehr geehrte Frau Dr. Müller, / Sehr geehrter Herr Meyer,** |
| General Salutation | **Hallo Michael, / Guten Tag Frau Weber,** | **Sehr geehrte Damen und Herren,** *(when recipient is unknown)* |
| **Grüße (Sign-off)** | **Herzliche Grüße / Viele Grüße / Liebe Grüße** | **Mit freundlichen Grüßen** *(Standard formal)* |

#### 3. Small Talk im Büro (Casual Office Small Talk)
| Theme | German Opening / Question | Follow-up / Response |
|---|---|---|
| **Wetter (Weather)** | **Heute ist es wieder so heiß!** | *Ach, jetzt regnet es schon wieder. Schrecklich, oder?* |
| **Sport (Sports)** | **Mögen Sie auch Sport?** | *Sehen Sie auch das Fußballspiel heute Abend?* |
| **Familie (Family)** | **Wie geht es Ihren Eltern / Kindern?** | *Wie alt sind Ihre Kinder jetzt?* |
| **Wochenende (Weekend)**| **Endlich Freitag! Was machen Sie am Wochenende?** | *Und wie war Ihr Wochenende? Haben Sie sich erholt?* |

#### 4. Antworten auf Ja-/Nein-Fragen (Ja, Nein, Doch!)
> **Doch** is used to affirmatively contradict a negative question!

| Frage | Antwort mit „Ja“ | Antwort mit „Nein“ | Antwort mit „Doch!“ (Contradiction) |
|---|---|---|---|
| *Hast du einen Termin?* (Positive question) | **Ja.** (I have one) | **Nein.** (I don't have one) | — |
| *Hast du **keinen** Termin?* (Negative question) | — | **Nein.** (Confirming: I have none) | **Doch!** (Contradicting: I DO have one!) |
| *Kommst du **nicht** mit?* (Negative question) | — | **Nein.** (Confirming: I'm not coming) | **Doch!** (Contradicting: Yes, I AM coming!) |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Sätze verbinden: „und“, „oder“, „aber“ (Coordinating Conjunctions)
> Coordinating conjunctions take **Position 0**. The sentence order remains unchanged!

| Satz 1 | Konjunktion (Pos 0) | Satz 2 (Subjekt + Verb) | Bedeutung |
|---|---|---|---|
| Ich bin in Köln | **und** | (ich) mache dort ein Praktikum. | Addition |
| Ich telefoniere | **oder** | (ich) arbeite am Computer. | Alternative |
| Die Firma ist klein, | **aber** | sie hat sehr viele treue Kunden. | Contrast (comma required!) |

#### 2. Der Dativ: Bestimmter & Unbestimmter Artikel
| Genus | Nominativ | Dativ | Beispielsatz mit „mit“ (+ Dativ) |
|---|---|---|---|
| **Maskulin** | der / ein Freund | **dem / einem** Freund | *Laura fährt mit **einem** Freund.* |
| **Neutrum** | das / ein Taxi | **dem / einem** Taxi | *Sie fahren mit **dem** Taxi.* |
| **Feminin** | die / eine Freundin | **der / einer** Freundin | *Er spricht mit **der** Chefin.* |
| **Plural** | die / – Mitarbeiter | **den / –** Mitarbeiter**n** | *Wir sprechen mit **den** Kollege**n**.* |

> ⚠️ **Dativ Plural Rule**: In the Dativ plural, almost all nouns add an extra **-n** (unless they already end in -n or -s): *die Kinder -> den Kinder**n**; die Tage -> den Tage**n**; aber: den Autos*.

#### 3. Ortsangaben mit Dativ-Präpositionen (zu, bei, aus, von, in)
| Fragewort | Präposition | Bedeutung / Regel | Kurzform & Beispiel |
|---|---|---|---|
| **Wohin?** | **zu** + Dat | Richtung zu Personen / Institutionen | **zum** Chef (*zu + dem*), **zur** Bank (*zu + der*) |
| **Wo?** | **bei** + Dat | Aufenthalt bei Personen / Firmen | **beim** Arzt (*bei + dem*), **bei der** Firma Siemens |
| **Woher?** | **aus** + Dat | Herkunft aus geschlossenen Räumen/Ländern | **aus dem** Haus, **aus der** Schweiz |
| **Woher?** | **von** + Dat | Herkunft von Personen / Landmarken | **vom** Chef (*von + dem*), **von der** Haltestelle |
| **Wo?** | **in** + Dat | Standort / Ort (stationär) | **im** Büro (*in + dem*), **in der** Stadt |

#### Übersicht der Dativ-Kurzformen:
- \`zu + dem\` = **zum**
- \`zu + der\` = **zur**
- \`bei + dem\` = **beim**
- \`von + dem\` = **vom**
- \`in + dem\` = **im**

      `
      },
      interactiveExercises: [
        {
          id: "k7_ex1",
          title: "Übung 1: Past Tense (war vs hatte)",
          instruction: "Fill in 'war' (was) or 'hatte' (had):",
          questions: [
            {
              id: "k7_q1",
              prompt: "1. 'Gestern ______ (sein) ich den ganzen Tag im Büro.'",
              expected: ["war"],
              hint: "Past form of 'sein' for 'ich'.",
              explanation: "ich war."
            },
            {
              id: "k7_q2",
              prompt: "2. 'Wir ______ (haben) gestern viel Arbeit.'",
              expected: ["hatten"],
              hint: "Past form of 'haben' for 'wir'.",
              explanation: "wir hatten."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 7):**
1. **Präteritum of *sein* & *haben*:**
   - *sein* -> war, warst, war, waren, wart, waren
   - *haben* -> hatte, hattest, hatte, hatten, hattet, hatten
2. **Modal Verbs *dürfen* (permission) & *sollen* (duty/recommendation).**
      `,
      vocabList: [
        { de: "die Arbeit, -en", en: "work / job", type: "die" },
        { de: "das Büro, -s", en: "office", type: "das" },
        { de: "der Computer, -", en: "computer", type: "der" },
        { de: "der Drucker, -", en: "printer", type: "der" },
        { de: "die E-Mail, -s", en: "email", type: "die" },
        { de: "der Termin, -e", en: "appointment", type: "der" },
        { de: "drucken (er druckt)", en: "to print", type: "verb" },
        { de: "telefonieren (er telefoniert)", en: "to speak on the phone", type: "verb" },
        { de: "Hier ist Frau Weber...", en: "This is Frau Weber speaking...", type: "phrase" },
        { de: "Ich war gestern im Büro", en: "I was in the office yesterday", type: "phrase" }
      ],
      quizzes: [
        {
          q: "Select the correct past form: 'Gestern ______ ich keine Zeit.'",
          options: ["habe", "hatte", "bin", "war"],
          correct: 1,
          explanation: "For having time in the past: 'ich hatte'."
        }
      ]
    },
    {
      id: 8,
      title: "Kapitel 8: Fit und gesund",
      subtitle: "Body Parts, Health, Doctor Visits & Imperative Commands",
      pdfPage: 91,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_8.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 8  Fit und gesund.mp3",
      audioTracks: [
        { id: "2-015", name: "Track 2-015", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-015.mp3" },
        { id: "2-016", name: "Track 2-016", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-016.mp3" },
        { id: "2-017", name: "Track 2-017", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-017.mp3" },
        { id: "2-018", name: "Track 2-018", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-018.mp3" },
        { id: "2-019", name: "Track 2-019", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-019.mp3" },
        { id: "2-020", name: "Track 2-020", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-020.mp3" },
        { id: "2-021", name: "Track 2-021", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-021.mp3" },
        { id: "2-022", name: "Track 2-022", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-022.mp3" },
        { id: "2-023", name: "Track 2-023", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-023.mp3" },
        { id: "2-024", name: "Track 2-024", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-024.mp3" }
      ],
      videos: [
        { title: "Film 018: Beim Arzt", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_8/Netzwerk_neu_A1_Film_018.mp4" },
        { title: "Film 018: Beim Arzt (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_8/Netzwerk_neu_A1_Film_018_UT.mp4" },
        { title: "Film 019: In der Apotheke", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_8/Netzwerk_neu_A1_Film_019.mp4" },
        { title: "Film 019: Apotheke (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_8/Netzwerk_neu_A1_Film_019_UT.mp4" },
        { title: "Film 020: Fit & Gesund", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_8/Netzwerk_neu_A1_Film_020.mp4" },
        { title: "Film 020: Fit & Gesund (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_8/Netzwerk_neu_A1_Film_020_UT.mp4" },
        { title: "Film 018-020: Kapitel 8 Komplett", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_8/Netzwerk_neu_A1_Film_18-20.mp4" },
        { title: "G-Clip 04: Der Imperativ", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 04.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 8: Mein Tag und Gesundheit! Sprechen Sie über Körper und Gesundheit, Arztbesuche, den Imperativ und die Modalverben dürfen und sollen.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 8 — Mein Tag & Gesundheit
**Core Focus**: Physical health, stating height & weight, visiting the doctor, reporting medical advice with *sollen*, rules, prohibitions & permissions (*dürfen*), and mastering commands with the Imperative (*du, ihr, Sie*).

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Persönliche Angaben machen (Personal Measurements & Stats)
| Frage (Question) | Deutsche Antwort | English Meaning |
|---|---|---|
| **Wie alt bist du?** | **Ich bin 27 Jahre alt. / Ich bin 27.** | How old are you? -> I am 27 years old. |
| **Wie groß bist du?** | **Ich bin ein Meter 75 (groß). / Eins fünfundsiebzig.** | How tall are you? -> I am 1.75 meters tall. |
| **Wie viel wiegst du?** | **(Ich wiege) 73 Kilo. / Circa 73 Kilo.** | How much do you weigh? -> I weigh 73 kg. |
| Boundary discretion | **Das möchte ich nicht sagen.** | I'd rather not say. |

#### 2. Gespräche beim Arzt führen (At the Doctor's Office)
| Rolle | German Redemittel | English Meaning |
|---|---|---|
| **Arzt / Ärztin** | **Wie geht es Ihnen? / Was tut Ihnen weh?** | How are you feeling? / What hurts? |
| | **Haben Sie Schmerzen? / Haben Sie Fieber?** | Are you in pain? / Do you have a fever? |
| | **Ich schreibe Ihnen ein Rezept für Tabletten / Salbe.** | I'll write you a prescription for tablets / ointment. |
| | **Nehmen Sie die Tabletten vor dem Essen.** | Take the tablets before meals. |
| | **Sie dürfen nicht arbeiten. / Sie müssen im Bett bleiben.** | You must not work. / You must stay in bed. |
| | **Gute Besserung!** | Get well soon! |
| **Patient / Patientin** | **Ich bin krank. / Mir ist schlecht.** | I am sick. / I feel nauseous. |
| | **Mein Kopf / Hals / Rücken tut weh.** | My head / throat / back hurts. |
| | **Meine Augen / Beine tun weh.** *(Plural)* | My eyes / legs hurt. |
| | **Ich habe starke Kopfschmerzen / Bauchschmerzen.** | I have severe headaches / stomach ache. |
| | **Wie lange muss ich im Bett bleiben?** | How long do I have to stay in bed? |
| | **Darf ich Sport machen? / Muss ich zu Hause bleiben?** | May I do sports? / Must I stay home? |

#### 3. Anweisungen wiedergeben mit „sollen“ (Reporting Medical Advice)
| Direktive des Arztes | Was der Patient / die Patientin erzählt |
|---|---|
| *„Trinken Sie viel Wasser und Tee!“* | **Der Arzt sagt, ich soll viel Wasser und Tee trinken.** |
| *„Bleiben Sie drei Tage im Bett!“* | **Die Ärztin sagt, ich soll drei Tage im Bett bleiben.** |
| *„Bewegen Sie das verletzte Bein wenig!“*| **Der Arzt sagt, ich soll das Bein wenig bewegen.** |

#### 4. Erlaubnis, Gebote und Verbote ausdrücken
- **Erlaubnis (Er/Sie darf ...)**: *Sie dürfen duschen. Du darfst viel Tee trinken.*
- **Verbot (Er/Sie darf NICHT ... 🚫)**: *Sie dürfen mit Fieber nicht baden. Du darfst nicht zur Arbeit gehen.*
- **Notwendigkeit / Pflicht (Er/Sie muss ... ❗)**: *Sie müssen im Bett bleiben. Du musst diese Medizin nehmen.*

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Der Imperativ mit „du“, „ihr“, „Sie“ (Commands & Requests)
| Verb | du-Form *(informal singular)* | ihr-Form *(informal plural)* | Sie-Form *(formal polite)* |
|---|---|---|---|
| **machen** | **Mach!** *(drop -st and pronoun)* | **Macht!** *(same as ihr-present)* | **Machen Sie!** *(invert verb + Sie)* |
| **aufstehen** | **Steh auf!** | **Steht auf!** | **Stehen Sie auf!** |
| **laufen** *(stem-change a->ä drops umlaut)* | **Lauf!** *(NO umlaut in imperative!)* | **Lauft!** | **Laufen Sie!** |
| **lesen** *(e->ie remains)* | **Lies!** *(drop -st)* | **Lest!** | **Lesen Sie!** |
| **sein** *(irregular imperative)* | **Sei** vorsichtig! | **Seid** vorsichtig! | **Seien Sie** vorsichtig! |

> 💡 **Imperativ-Regeln**:
> 1. In the **du-Form**: Drop the ending \`-st\` and drop the pronoun \`du\`: *Du machst* -> **Mach!**
> 2. Verbs with vowel change \`a -> ä\` drop their umlaut: *Du fährst* -> **Fahr!**
> 3. In the **Sie-Form**: Keep the pronoun \`Sie\` and put the verb on **Position 1**: **Trinken Sie!**

#### 2. Imperativsätze (Word Order in Imperative Sentences)
> The imperative verb **always occupies Position 1**!

| Position 1 (Imperativ) | Mittelfeld | Satzende (bei trennbaren Verben) |
|---|---|---|
| **Geh** | früh ins Bett! | — |
| **Macht** | regelmäßig Sport! | — |
| **Steht** | bitte sofort | **auf!** |
| **Trinken** | Sie viel frisches Wasser! | — |

#### 3. Modalverben: „dürfen“ & „sollen“
| Pronomen | dürfen *(permission / allowed)* | sollen *(advice / recommended duty)* |
|---|---|---|
| **ich** | **darf** | **soll** |
| **du** | **darfst** | **sollst** |
| **er / sie / es** | **darf** | **soll** |
| **wir** | dürfen | sollen |
| **ihr** | dürft | sollt |
| **sie / Sie** | dürfen | sollen |

> ⚠️ **Achtung**: **nicht dürfen** means **forbidden / not allowed** (*Sie dürfen hier nicht rauchen!* = It is illegal/forbidden to smoke here!).

      `
      },
      interactiveExercises: [
        {
          id: "k8_ex1",
          title: "Übung 1: Imperative Commands (Der Imperativ)",
          instruction: "Form the correct imperative command:",
          questions: [
            {
              id: "k8_q1",
              prompt: "1. Doctor's formal advice: '______ (trinken) Sie viel Tee!'",
              expected: ["Trinken", "trinken"],
              hint: "Formal imperative keeps infinitive.",
              explanation: "'Trinken Sie!'."
            },
            {
              id: "k8_q2",
              prompt: "2. Informal advice to a friend: '______ (schlafen) viel!'",
              expected: ["Schlaf", "schlaf"],
              hint: "Drop -st and subject du.",
              explanation: "du schläfst -> Schlaf!"
            }
          ]
        },
        {
          id: "k8_ex2",
          title: "Übung 2: Expressing Pain (tut weh vs tun weh)",
          instruction: "Fill in 'tut weh' (singular) or 'tun weh' (plural):",
          questions: [
            {
              id: "k8_q3",
              prompt: "1. 'Mein Rücken ______.' (singular back pain)",
              expected: ["tut weh"],
              hint: "der Rücken is singular.",
              explanation: "Singular: tut weh."
            },
            {
              id: "k8_q4",
              prompt: "2. 'Meine Augen ______.' (plural eyes pain)",
              expected: ["tun weh"],
              hint: "die Augen is plural.",
              explanation: "Plural: tun weh."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 8):**
1. **The Imperative:**
   - Sie (Formal): *Trinken Sie!*
   - du (Informal singular): *Trink!*
   - ihr (Informal plural): *Trinkt!*
2. **Expressing Pain:**
   - *tut weh* (singular) / *tun weh* (plural).
      `,
      vocabList: [
        { de: "der Kopf, -\"e", en: "head", type: "der" },
        { de: "der Rücken, -", en: "back", type: "der" },
        { de: "der Bauch, -\"e", en: "belly / stomach", type: "der" },
        { de: "das Auge, -n", en: "eye", type: "das" },
        { de: "das Ohr, -en", en: "ear", type: "das" },
        { de: "das Bein, -e", en: "leg", type: "das" },
        { de: "die Hand, -\"e", en: "hand", type: "die" },
        { de: "der Arzt, -\"e / die Ärztin, -nen", en: "doctor", type: "der" },
        { de: "wehtun (es tut weh)", en: "to hurt / ache", type: "verb" },
        { de: "Gute Besserung!", en: "Get well soon!", type: "phrase" }
      ],
      quizzes: [
        {
          q: "What is the polite imperative form for 'schlafen'?",
          options: ["Schlaf Sie!", "Schlafen Sie!", "Schlaft Sie!", "Schläfst du!"],
          correct: 1,
          explanation: "Polite imperative keeps infinitive followed by Sie: 'Schlafen Sie!'."
        }
      ]
    },
    {
      id: 9,
      title: "Kapitel 9: Meine Wohnung",
      subtitle: "Living Spaces, Rooms, Furniture & Location in Dativ",
      pdfPage: 101,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_9.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: null,
      audioTracks: [
        { id: "2-025", name: "Track 2-025", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-025.mp3" },
        { id: "2-026", name: "Track 2-026", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-026.mp3" },
        { id: "2-027", name: "Track 2-027", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-027.mp3" },
        { id: "2-028", name: "Track 2-028", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-028.mp3" },
        { id: "2-029", name: "Track 2-029", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-029.mp3" },
        { id: "2-030", name: "Track 2-030", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-030.mp3" },
        { id: "2-031", name: "Track 2-031", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-031.mp3" },
        { id: "2-032", name: "Track 2-032", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-032.mp3" },
        { id: "2-033", name: "Track 2-033", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-033.mp3" },
        { id: "2-034", name: "Track 2-034", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-034.mp3" }
      ],
      videos: [
        { title: "Film 022: Meine Wohnung & MÃ¶bel", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_9/Netzwerk_neu_A1_Film_022.mp4" },
        { title: "G-Clip 04: WechselprÃ¤positionen (Wohin vs Wo)", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 04.mp4" },
        { title: "R-Clip 04: Wohnung beschreiben", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 04.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 9: Wohnwelten! Beschreiben Sie Wohnungen, antworten Sie auf Einladungen und meistern Sie die Wechselpräpositionen mit Akkusativ und Dativ.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 9 — Wohnwelten
**Core Focus**: Describing apartments and furniture, accepting and declining invitations with social grace, expressing aesthetic taste, qualifying adjectives with *zu* and *sehr*, and mastering the Two-Way Prepositions (*Wechselpräpositionen*).

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Eine Wohnung beschreiben (Describing Apartments & Living Spaces)
| Property | German Redemittel | English Meaning |
|---|---|---|
| Location & Ambience | **Die Wohnung ist sehr ruhig / hell / sonnig.** | The apartment is very quiet / bright / sunny. |
| City Center Proximity | **Die Wohnung liegt zentral / direkt im Zentrum.** | The apartment is centrally located / in the center. |
| Criticisms & Size | **Die Wohnung ist zu laut / zu dunkel / zu klein.** | The apartment is too noisy / too dark / too small. |
| Affordability | **Die Miete ist günstig / leider viel zu teuer.** | The rent is reasonable / unfortunately way too expensive. |

#### 2. Eine Einladung beantworten (Accepting & Declining Invitations)
| Situation | German Redemittel | English Meaning |
|---|---|---|
| Opening Gratitude | **Liebe Julia, lieber Marco, vielen Dank für die Einladung!** | Dear Julia, dear Marco, thanks a lot for the invite! |
| **Zusage (Accepting)** | **Glückwunsch! Ich komme sehr gern.** | Congratulations! I'd love to come. |
| Anticipation | **Ich freue mich schon sehr auf die Feier am Samstag!** | I'm already looking forward to the party on Saturday! |
| Offering Help | **Kann ich etwas mitbringen? Soll ich einen Kuchen backen?** | Can I bring something? Should I bake a cake? |
| Bringing a Guest | **Kann meine Freundin / mein Freund auch mitkommen?** | Can my girlfriend / boyfriend come along too? |
| **Absage (Declining)** | **Es tut mir leid, aber ich kann leider nicht kommen.** | I'm sorry, but unfortunately I cannot make it. |
| Reason (Work) | **Ich habe leider keine Zeit, ich muss am Samstag arbeiten.** | Unfortunately I have no time, I have to work on Saturday. |
| Reason (Prior Plan) | **Ich habe da schon eine andere Verabredung.** | I already have another appointment then. |
| Friendly Wish | **Hoffentlich sehen wir uns bald wieder! Viel Spaß bei der Feier!** | Hopefully we'll see each other soon! Have fun at the party! |

#### 3. Gefallen und Missfallen ausdrücken (Expressing Taste & Opinions)
| Sentiment | German Expression | English Meaning |
|---|---|---|
| Enthusiastic 😊 | **Das Wohnzimmer ist ja wirklich super!** | The living room is really great! |
| Defending 😊 | **Die Lampe ist doch total schön, gar nicht langweilig.** | The lamp is totally lovely, not boring at all. |
| Cozy Impression 😊 | **Ich finde die neue Wohnung echt gemütlich.** | I find the new apartment truly cozy. |
| Disliking ☹️ | **Der Küchentisch ist nicht mehr schön.** | The kitchen table is no longer nice. |
| Strong Dislike ☹️ | **Ich finde dieses Sofa ehrlich gesagt hässlich.** | Honestly, I find this sofa ugly. |
| Incompatible ☹️ | **Die Wohnung ist uns einfach zu klein und zu laut.** | The apartment is simply too small and too noisy for us. |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Prädikatives Adjektiv: „sein“ + Abstufung
Adjectives with *sein* do not take case endings. Notice the difference between **sehr** (positive intensifier) and **zu** (negative excessive):
- *Die Wohnung ist **billig**.* (The flat is cheap.)
- *Die Wohnung ist **nicht billig**.* (The flat is not cheap.)
- *Die Wohnung ist **sehr teuer**.* (The flat is very expensive.)
- *Die Wohnung ist **zu teuer**!* (The flat is **too** expensive — beyond budget!)

#### 2. Die 9 Wechselpräpositionen (Two-Way Prepositions)
The 9 two-way prepositions are: **an, auf, hinter, in, neben, über, unter, vor, zwischen**.
> 🧭 **The Golden Rule**:
> - **Wohin? (Direction / Movement from A to B)** -> **AKKUSATIV**
> - **Wo? (Stationary Location / Position)** -> **DATIV**

| Genus | Wohin? (+ Akkusativ: movement) | Wo? (+ Dativ: position) |
|---|---|---|
| **Maskulin** | Wohin stellen wir den Stuhl? -> in **den** Flur | Wo steht der Schrank? -> **im** Flur (*in dem*) |
| **Neutrum** | Wohin stellen wir das Bett? -> **ins** Zimmer (*in das*) | Wo steht das Bett? -> **im** Zimmer (*in dem*) |
| **Feminin** | Wohin stellen wir den Herd? -> in **die** Küche | Wo steht der Herd? -> in **der** Küche |
| **Plural** | Wohin stellen wir die Bücher? -> in **die** Regale | Wo stehen die Bücher? -> in **den** Regalen |

#### 3. Wichtige Kurzformen:
- \`in + das\` = **ins** (*Wir gehen ins Bad.*)
- \`in + dem\` = **im** (*Wir sind im Bad.*)
- \`an + das\` = **ans** (*Er hängt das Bild ans Fenster.*)
- \`an + dem\` = **am** (*Das Bild hängt am Fenster.*)

      `
      },
      interactiveExercises: [
        {
          id: "k9_ex1",
          title: "Übung 1: Dativ Prepositions of Location (dem / der)",
          instruction: "Fill in the correct Dativ article:",
          questions: [
            {
              id: "k9_q1",
              prompt: "1. 'Das Buch liegt auf ______ (der) Tisch.'",
              expected: ["dem"],
              hint: "In Dativ, masculine 'der' becomes 'dem'.",
              explanation: "der Tisch -> dem Tisch."
            },
            {
              id: "k9_q2",
              prompt: "2. 'Cheeya kocht in ______ (die) Küche.'",
              expected: ["der"],
              hint: "In Dativ, feminine 'die' becomes 'der'.",
              explanation: "die Küche -> der Küche."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 9):**
1. **Dativ Case for Stationary Location (Wo?):**
   - der -> **dem**
   - das -> **dem**
   - die -> **der**
   - Plural -> **den (+n)**
      `,
      vocabList: [
        { de: "die Wohnung, -en", en: "apartment / flat", type: "die" },
        { de: "das Zimmer, -", en: "room", type: "das" },
        { de: "das Wohnzimmer, -", en: "living room", type: "das" },
        { de: "das Schlafzimmer, -", en: "bedroom", type: "das" },
        { de: "die Küche, -n", en: "kitchen", type: "die" },
        { de: "das Bad, -\"er", en: "bathroom", type: "das" },
        { de: "der Tisch, -e", en: "table", type: "der" },
        { de: "der Stuhl, -\"e", en: "chair", type: "der" },
        { de: "das Bett, -en", en: "bed", type: "das" },
        { de: "das Sofa, -s", en: "sofa / couch", type: "das" },
        { de: "der Schrank, -\"e", en: "cupboard / wardrobe", type: "der" },
        { de: "die Lampe, -n", en: "lamp", type: "die" }
      ],
      quizzes: [
        {
          q: "Fill in the Dativ blank: 'Das Bild hängt in ______ Küche (die Küche).'",
          options: ["die", "der", "dem", "den"],
          correct: 1,
          explanation: "In Dativ, feminine 'die' changes to 'der'."
        }
      ]
    },
    {
      id: 10,
      title: "Kapitel 10: Studium und Beruf",
      subtitle: "Education, University, Career Paths & Conversational Past (Perfekt)",
      pdfPage: 117,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_10.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 10  Studium und Beruf.mp3",
      audioTracks: [
        { id: "2-035", name: "Track 2-035", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-035.mp3" },
        { id: "2-036", name: "Track 2-036", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-036.mp3" },
        { id: "2-037", name: "Track 2-037", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-037.mp3" },
        { id: "2-038", name: "Track 2-038", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-038.mp3" },
        { id: "2-039", name: "Track 2-039", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-039.mp3" },
        { id: "2-040", name: "Track 2-040", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-040.mp3" },
        { id: "2-041", name: "Track 2-041", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-041.mp3" },
        { id: "2-042", name: "Track 2-042", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-042.mp3" },
        { id: "2-043", name: "Track 2-043", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-043.mp3" },
        { id: "2-044", name: "Track 2-044", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-044.mp3" }
      ],
      videos: [
        { title: "G-Clip 04: Das Perfekt (haben / sein)", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 04.mp4" },
        { title: "P-Clip 04: Sprachmelodie im Deutschen", path: BASE_PATH + "Kursbuch A1 - Video/P-Clip 04.mp4" },
        { title: "R-Clip 04: Telefonieren im Beruf", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 04.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 10: Gute Arbeit! Führen Sie Telefonate im Beruf, sprechen Sie über Jobs und lernen Sie das Perfekt für vergangene Erlebnisse.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 10 — Gute Arbeit!
**Core Focus**: Careers, modern workplace discussions, professional phone etiquette, and the cornerstone conversational past tense in German: **Das Perfekt** with auxiliary verbs *haben* and *sein*.

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Über Berufe und Arbeitsbedingungen sprechen (Work & Job Satisfaction)
| Aspect | German Redemittel | English Meaning |
|---|---|---|
| Enjoyment | **Die Arbeit / Der Beruf macht mir (großen / keinen) Spaß.** | The work / profession gives me (great / no) joy. |
| Job Description | **Die Arbeit ist sehr interessant / abwechslungsreich / anstrengend.** | The work is very interesting / diverse / demanding. |
| Work Atmosphere | **Die Chefin ist fair. Die Kolleginnen und Kollegen sind nett.** | The boss is fair. The colleagues are very kind. |
| Compensation | **Ich verdiene ganz gut / leider zu wenig Geld.** | I earn quite well / unfortunately too little money. |
| Opportunities | **Ich kann im Job Karriere machen und oft ins Ausland reisen.** | I can advance my career on the job and travel abroad often. |

#### 2. Am Telefon kommunizieren (Professional Phone Etiquette)
| Phase | German Redemittel | English Meaning |
|---|---|---|
| **Sich melden (Answering)** | **Guten Tag. Mein Name ist Nina Weber. / Hier ist...** | Good day. My name is Nina Weber. / This is... |
| Identification | **Firma TechNova, Sie sprechen mit Daniel Schmidt.** | Company TechNova, you are speaking with Daniel Schmidt. |
| **Nach einer Person fragen** | **Ist Frau Dr. Meyer da? / Kann ich bitte Herrn Müller sprechen?** | Is Dr. Meyer available? / May I please speak with Mr. Müller? |
| Asking to Connect | **Können Sie mich bitte mit der Buchhaltung verbinden?** | Could you please connect me to accounting? |
| Extension Number | **Können Sie mir bitte die Durchwahl von Frau Weber geben?** | Could you please give me Ms. Weber's direct extension? |
| **Nachfragen (Clarification)** | **Entschuldigung, wie bitte?** | Excuse me, pardon? / Say that again? |
| Repeat request | **Könnten Sie das bitte noch einmal wiederholen?** | Could you please repeat that once more? |
| Spelling request | **Könnten Sie Ihren Nachnamen bitte buchstabieren?** | Could you please spell your last name? |
| Did not understand | **Entschuldigung, das habe ich akustisch nicht verstanden.** | Excuse me, I did not catch that. |
| **Verabschiedung am Telefon** | **Vielen Dank für Ihre Hilfe. Auf Wiederhören!** | Thank you very much for your help. Goodbye! *(on phone)* |

> 💡 **Phone Tip**: In German phone calls, never say *Auf Wiedersehen* (until we see each other); always use **Auf Wiederhören** (until we hear each other again)!

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Das Perfekt: Die Satzklammer (Auxiliary + Partizip II)
> The auxiliary verb (*haben* or *sein*) is conjugated at **Position 2**, while the **Partizip II moves to the absolute end** of the clause!

| Position 1 | Position 2 (Hilfsverb) | Mittelfeld | Satzende (Partizip II) |
|---|---|---|---|
| Daniel | **hat** | heute sechs Stunden Deutsch | **gelernt**. |
| Tina | **hat** | gestern für ein Uniseminar | **recherchiert**. |
| Claudia | **ist** | mit der Bahn zur Arbeit | **gefahren**. |
| Was | **hast** | du am Wochenende | **gemacht**? |

#### 2. Bildung des Partizip II (How to Form the Past Participle)
| Category | Formation Pattern | Infinitiv | Partizip II |
|---|---|---|---|
| **Regelmäßige Verben** | \`ge-\` + Stamm + \`-(e)t\` | machen -> **gemacht**, lernen -> **gelernt**, arbeiten -> **gearbeitet** |
| **Verben auf -ieren** | Stamm + \`-t\` *(NO ge- prefix!)* | studieren -> **studiert**, recherchieren -> **recherchiert**, telefonieren -> **telefoniert** |
| **Unregelmäßige Verben** | \`ge-\` + (Stammwechsel) + \`-en\` | fahren -> **gefahren**, finden -> **gefunden**, gehen -> **gegangen**, bleiben -> **geblieben** |
| **Gemischte Verben** | \`ge-\` + Stammwechsel + \`-t\` | denken -> **gedacht**, wissen -> **gewusst**, bringen -> **gebracht** |

#### 3. Wann benutzt man „sein“ statt „haben“?
The vast majority of German verbs form the Perfekt with **haben**. Use **sein** ONLY for:
1. **Verbs of movement from point A to B**:
   - *fahren*: Er **ist** nach Berlin **gefahren**.
   - *gehen*: Wir **sind** nach Hause **gegangen**.
   - *kommen*: Sie **ist** spät **gekommen**.
   - *fliegen*: Ich **bin** nach Wien **geflogen**.
2. **Verbs of change of state**:
   - *aufwachen* (*ist aufgewacht*), *einschlafen* (*ist eingeschlafen*).
3. **Exceptions**:
   - *bleiben* (*ist geblieben*), *passieren* (*ist passiert*).

#### 4. Wichtige Konversationsregel: „sein“ & „haben“ im Alltag
In everyday spoken German, native speakers almost never say *„Ich bin gewesen“* or *„Ich habe gehabt“*. Instead, the **Präteritum** is preferred:
- ✅ *Ich **war** gestern im Kino.* (instead of *ich bin gewesen*)
- ✅ *Ich **hatte** keine Zeit.* (instead of *ich habe gehabt*)

      `
      },
      interactiveExercises: [
        {
          id: "k10_ex1",
          title: "Übung 1: Partizip II Forms (ge-...-t)",
          instruction: "Fill in the Partizip II form at the end of the sentence:",
          questions: [
            {
              id: "k10_q1",
              prompt: "1. 'Cheeya hat fleißig Deutsch ______ (lernen).'",
              expected: ["gelernt"],
              hint: "ge- + lern + -t.",
              explanation: "lernen -> gelernt."
            },
            {
              id: "k10_q2",
              prompt: "2. 'Herr Weber hat an der Universität ______ (studieren).'",
              expected: ["studiert"],
              hint: "Verbs ending in -ieren do not take ge-.",
              explanation: "studieren -> studiert."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 10):**
1. **Das Perfekt (Conversational Past Tense):**
   - Helper verb *haben* or *sein* (Position 2) + *Partizip II* (End of clause).
   - Regular verbs: ge- + stem + -t (*gelernt*, *gekauft*).
      `,
      vocabList: [
        { de: "die Universität, -en", en: "university", type: "die" },
        { de: "die Schule, -n", en: "school", type: "die" },
        { de: "die Ausbildung, -en", en: "vocational training / apprenticeship", type: "die" },
        { de: "das Praktikum, Praktika", en: "internship", type: "das" },
        { de: "studieren (er studiert)", en: "to study at university", type: "verb" },
        { de: "lernen (er lernt)", en: "to learn / study", type: "verb" },
        { de: "Ich habe Deutsch gelernt", en: "I learned German", type: "phrase" }
      ],
      quizzes: [
        {
          q: "What is the Perfekt form of 'Er lernt Deutsch'?",
          options: ["Er hat Deutsch gelernt.", "Er ist Deutsch gelernt.", "Er hat Deutsch gelernen.", "Er Deutsch hat gelernt."],
          correct: 0,
          explanation: "Helper verb 'hat' + Partizip II 'gelernt' at the end."
        }
      ]
    },
    {
      id: 11,
      title: "Kapitel 11: Die Jacke gefällt mir!",
      subtitle: "Clothing, Colors, Shopping & Personal Pronouns in Dativ",
      pdfPage: 127,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_11.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 11  Die Jacke gefällt mir.mp3",
      audioTracks: [
        { id: "2-045", name: "Track 2-045", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-045.mp3" },
        { id: "2-046", name: "Track 2-046", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-046.mp3" },
        { id: "2-047", name: "Track 2-047", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-047.mp3" },
        { id: "2-048", name: "Track 2-048", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-048.mp3" },
        { id: "2-049", name: "Track 2-049", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-049.mp3" },
        { id: "2-050", name: "Track 2-050", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-050.mp3" },
        { id: "2-051", name: "Track 2-051", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-051.mp3" },
        { id: "2-052", name: "Track 2-052", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-052.mp3" },
        { id: "2-053", name: "Track 2-053", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-053.mp3" },
        { id: "2-054", name: "Track 2-054", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-054.mp3" }
      ],
      videos: [
        { title: "G-Clip 04: Verben mit Dativ", path: BASE_PATH + "Kursbuch A1 - Video/G-Clip 04.mp4" },
        { title: "P-Clip 03: Aussprache", path: BASE_PATH + "Kursbuch A1 - Video/P-Clip 03.mp4" },
        { title: "R-Clip 02: Kleiderkauf & Farben", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 02.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 11: Unterwegs und Mode! Sprechen Sie über Kleidung, Einkaufsgespräche im Kaufhaus, Welcher-Fragen und Verben mit Dativ.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 11 — Unterwegs und Mode
**Core Focus**: Fashion & clothing, shopping dialogues, department store navigation, Interrogative (*Welcher?*) & Demonstrative (*Dieser*) articles, Dativ verbs (*gefallen, stehen, passen, helfen*), Dativ personal pronouns, and Partizip II with prefixes.

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Über Kleidung & Stil sprechen (Discussing Fashion & Style)
| German Dialogue Line | English Meaning |
|---|---|
| **Sieh mal, der Mantel ist doch toll, oder?** | Look, that coat is really great, isn't it? |
| **Welcher denn? — Na, dieser hier.** | Which one? — Well, this one here. |
| **Findest du? Also, ich finde diese Jacke hier viel besser.** | Do you think so? Personally, I think this jacket here is much better. |
| **Welche Jacke meinst du? Diese rote hier?** | Which jacket do you mean? This red one here? |
| **Ja, genau. Die Farbe passt hervorragend zu deinen Augen.** | Yes, exactly. The color matches your eyes wonderfully. |
| **Oh ja, gut, dann nehme ich die Jacke.** | Oh yes, good, then I'll take the jacket. |

#### 2. Beratungsgespräche beim Kleiderkauf (Sales Conversations)
| Rolle | German Redemittel | English Meaning |
|---|---|---|
| **Verkäufer / Verkäuferin** | **Guten Tag, kann ich Ihnen helfen?** | Good day, can I help you? |
| | **Wie gefällt Ihnen dieser Pullover?** | How do you like this sweater? |
| | **Welche Größe haben / brauchen Sie?** | What size do you take / need? |
| | **Passt Ihnen der Pullover?** | Does the sweater fit you? |
| | **Diese Jacke steht Ihnen wirklich ausgezeichnet!** | This jacket suits you really exceptionally well! |
| **Kunde / Kundin** | **Ich suche einen warmen Winterpullover.** | I am looking for a warm winter sweater. |
| | **Er gefällt mir sehr gut / eigentlich nicht so gut.** | I like it very much / not really that much. |
| | **Ich glaube, Größe M oder L.** | I think size M or L. |
| | **Nein, der Rock ist mir leider zu eng / zu weit / zu kurz.** | No, the skirt is unfortunately too tight / loose / short. |
| | **Haben Sie das Hemd auch in Blau?** | Do you have this shirt in blue as well? |

#### 3. Sich im Kaufhaus orientieren (Orienting in Department Stores)
| Frage (Question) | Wegweisung (Directions in Store) |
|---|---|
| **Entschuldigung, wo finde / kriege ich Schuhe?** | Das finden Sie im **Erdgeschoss** *(ground floor)*. |
| **Wo gibt es Herrenmode / Damenkleidung?** | Das gibt es im **ersten / zweiten / dritten Stock**. |
| **Wo ist die Kosmetikabteilung?** | Im **Untergeschoss** *(basement)*. |
| **Haben Sie noch diese Tasche?** | **Tut mir leid, das haben wir leider nicht mehr.** |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Interrogativartikel & Demonstrativartikel
> The question word **welch-** and demonstrative pointer **dies-** adopt the exact definite article endings (\`der/das/die\` in Nom, Akk, and Dativ)!

| Kasus | Maskulin (der) | Neutrum (das) | Feminin (die) | Plural (die) |
|---|---|---|---|---|
| **Nominativ** | **welcher / dieser** Mantel | **welches / dieses** Kleid | **welche / diese** Jacke | **welche / diese** Schuhe |
| **Akkusativ** | **welchen / diesen** Mantel | **welches / dieses** Kleid | **welche / diese** Jacke | **welche / diese** Schuhe |
| **Dativ** | **welchem / diesem** Mantel | **welchem / diesem** Kleid | **welcher / dieser** Jacke | **welchen / diesen** Schuhen |

#### 2. Spezielle Verben mit Dativ-Objekt
The following important fashion & interaction verbs ALWAYS take their object in the **Dativ**:
- **gefallen** *(to appeal to)*: *Der Pullover gefällt **mir** sehr gut.*
- **stehen** *(to suit someone's look)*: *Die Farbe steht **ihr** ausgezeichnet.*
- **passen** *(to fit someone's size)*: *Die Hose passt **ihm** leider nicht.*
- **helfen** *(to help)*: *Kann ich **Ihnen** helfen?*

#### 3. Personalpronomen im Dativ
| Nominativ | Dativ | Beispielsatz |
|---|---|---|
| **ich** | **mir** | *Wie geht es **mir**?* / *Das gefällt **mir**.* |
| **du** | **dir** | *Wie steht **dir** dieser Hut?* |
| **er / es** | **ihm** | *Der Mantel passt **ihm** nicht.* |
| **sie** *(she)* | **ihr** | *Wir danken **ihr** für das Geschenk.* |
| **wir** | **uns** | *Das Essen schmeckt **uns** gut.* |
| **ihr** | **euch** | *Passt **euch** der Termin am Montag?* |
| **sie** *(they)* | **ihnen** | *Die Schuhe gehören **ihnen**.* |
| **Sie** *(formal)* | **Ihnen** | *Kann ich **Ihnen** behilflich sein?* |

#### 4. Partizip II bei Verben mit Präfix (Prefix Participles)
- **Trennbare Verben** (mit *ab-, an-, auf-, aus-, ein-, mit-, zu-, zurück-*): The \`-ge-\` is placed **between the prefix and the stem**:
  - *ankommen* -> ist **an-ge-kommen**
  - *umtauschen* -> hat **um-ge-tauscht**
  - *anziehen* -> hat **an-ge-zogen**
- **Untrennbare Verben** (mit *be-, emp-, ent-, er-, ge-, ver-, zer-*): **NO \`-ge-\` is added**:
  - *bezahlen* -> hat **bezahlt**
  - *empfehlen* -> hat **empfohlen**
  - *erzählen* -> hat **erzählt**

      `
      },
      interactiveExercises: [
        {
          id: "k11_ex1",
          title: "Übung 1: Dativ Personal Pronouns (mir / dir / Ihnen)",
          instruction: "Fill in the correct Dativ pronoun:",
          questions: [
            {
              id: "k11_q1",
              prompt: "1. 'Die rosa Bluse gefällt ______ (ich) sehr gut.'",
              expected: ["mir"],
              hint: "Dativ of 'ich'.",
              explanation: "ich -> mir (gefällt mir)."
            },
            {
              id: "k11_q2",
              prompt: "2. 'Wie steht ______ (du) das Kleid?'",
              expected: ["dir"],
              hint: "Dativ of 'du'.",
              explanation: "du -> dir (steht dir)."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 11):**
1. **Dativ Pronouns:**
   - ich -> **mir**, du -> **dir**, er/es -> **ihm**, sie -> **ihr**, Sie -> **Ihnen**.
2. **Dativ Verbs:**
   - *gefallen*, *passen*, *stehen*, *helfen*.
      `,
      vocabList: [
        { de: "die Jacke, -n", en: "jacket", type: "die" },
        { de: "das Kleid, -er", en: "dress", type: "das" },
        { de: "die Bluse, -n", en: "blouse", type: "die" },
        { de: "das Hemd, -en", en: "shirt", type: "das" },
        { de: "die Hose, -n", en: "pants / trousers", type: "die" },
        { de: "die Schuhe (Pl.)", en: "shoes", type: "die" },
        { de: "gefallen (es gefällt mir)", en: "to appeal to / to like", type: "verb" },
        { de: "passen (es passt mir)", en: "to fit", type: "verb" }
      ],
      quizzes: [
        {
          q: "Choose the correct Dativ pronoun: 'Wie gefällt ______ das Kleid?' (you - informal)",
          options: ["dich", "du", "dir", "dein"],
          correct: 2,
          explanation: "'gefallen' takes Dativ: 'dir'."
        }
      ]
    },
    {
      id: 12,
      title: "Kapitel 12: Ab in den Urlaub!",
      subtitle: "Vacations, Weather, Travel Directions (Wohin vs Wo) & A1 Review",
      pdfPage: 137,
      pdfChapterFile: BASE_PATH + "per_kapitel_pdf/Kapitel_12.pdf",
      pdfChapterTotalPages: 10,
      audioKapitel: BASE_PATH + "Kursbuch A1 - Audio (per kapitel)/Netzwerk neu Kursbuch - A1 (Audio)  KAPITEL – 12  Ab in den Urlaub !.mp3",
      audioTracks: [
        { id: "2-055", name: "Track 2-055", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-055.mp3" },
        { id: "2-056", name: "Track 2-056", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-056.mp3" },
        { id: "2-057", name: "Track 2-057", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-057.mp3" },
        { id: "2-058", name: "Track 2-058", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-058.mp3" },
        { id: "2-059", name: "Track 2-059", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-059.mp3" },
        { id: "2-060", name: "Track 2-060", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-060.mp3" },
        { id: "2-061", name: "Track 2-061", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-061.mp3" },
        { id: "2-062", name: "Track 2-062", path: BASE_PATH + "Kursbuch A1 - Audio/Kapitel 7-12/NWn_A1_KB_Audio_2-062.mp3" }
      ],
      videos: [
        { title: "Film 027: Ab in den Urlaub!", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_12/Netzwerk_neu_A1_Film_027.mp4" },
        { title: "Film 027: Ab in den Urlaub! (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_12/Netzwerk_neu_A1_Film_027_UT.mp4" },
        { title: "Film 028: Unterwegs im Urlaub", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_12/Netzwerk_neu_A1_Film_028.mp4" },
        { title: "Film 028: Unterwegs (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_12/Netzwerk_neu_A1_Film_028_UT.mp4" },
        { title: "Film 027-028: Kapitel 12 Komplett (UT)", path: BASE_PATH + "Kursbuch A1 - Video/Kapitel_12/Netzwerk_neu_A1_Film_27-28_UT.mp4" },
        { title: "R-Clip 04: Wegbeschreibung & Postkarte", path: BASE_PATH + "Kursbuch A1 - Video/R-Clip 04.mp4" }
      ],
      autoTeaching: {
        cheeyaGreeting: "Willkommen zu Kapitel 12: Ab in den Urlaub! Beschreiben Sie Urlaubswege und Verkehrsmittel, schreiben Sie Postkarten und vertiefen Sie alle Fragewörter und Zeitpräpositionen.",
        lessonSummary: `
### 📘 Curriculum Overview: Kapitel 12 — Ab in den Urlaub!
**Core Focus**: Vacations & holiday travel, describing routes & public transport, writing postcards, weather descriptions, the impersonal pronoun *man*, conjunction *denn*, a complete review of all German question words, and temporal prepositions with Dativ.

---

### 🗣️ kurz und klar: Redemittel (Communicative Phrases)

#### 1. Einen Weg mit öffentlichen Verkehrsmitteln beschreiben (Public Transit)
| Step | German Redemittel | English Meaning |
|---|---|---|
| Destination & Mode | **Zum Bahnhof / Museum / Rathaus fährt man mit der U-Bahn.** | To the station / museum / town hall you take the underground. |
| Female Destination | **Zur Sprachschule / Universität fährt man mit dem Bus Linie 4.** | To the language school / university you take bus line 4. |
| Boarding | **Man steigt an der Haltestelle „Marktplatz“ ein.** | You board at the "Marktplatz" stop. |
| Changing lines | **Am Hauptbahnhof steigt man in die S-Bahn um.** | At the central station you transfer to the suburban train. |
| Final Leg | **Dann nimmt man die Straßenbahn Nummer 12.** | Then you take tram number 12. |
| Arrival | **Das Museum liegt direkt an der Haltestelle „Museumsplatz“.**| The museum is located right at the "Museumsplatz" stop. |

#### 2. Eine Postkarte schreiben (Writing Holiday Postcards)
| Section | German Postcard Expressions | English Meaning |
|---|---|---|
| Salutation | **Hallo Michael, / Liebe Sophia, / Lieber Thomas,** | Hello Michael, / Dear Sophia, / Dear Thomas, |
| Location | **Herzliche Urlaubsgrüße aus Wien / von der Ostsee!** | Warm holiday greetings from Vienna / from the Baltic Sea! |
| Atmosphere | **In Wien ist es wunderschön. Die Stadt gefällt mir super,** | It is wonderful in Vienna. I love the city very much, |
| Reason with *denn* | **... denn hier gibt es unglaublich viele Sehenswürdigkeiten.** | ... because there are incredibly many sights here. |
| Activities | **Heute haben wir das Schloss Schönbrunn besucht.** | Today we visited Schönbrunn Palace. |
| Leisure options | **Man kann hier herrlich spazieren gehen und Sachertorte essen.**| You can go for lovely walks here and eat Sacher torte. |
| Tomorrow's plan | **Morgen machen wir eine Bootsfahrt auf der Donau.** | Tomorrow we are taking a boat trip on the Danube. |
| Sign-off | **Bis bald und viele liebe Grüße! Dein(e) ...** | See you soon and many warm regards! Yours ... |

#### 3. Eine Reiseroute chronologisch beschreiben (Sequencing Sequences)
- **Zuerst**: *Zuerst machen wir eine informative Stadttour mit dem Bus.*
- **Dann**: *Dann gehen wir gemeinsam in das Kunstmuseum.*
- **Danach**: *Danach trinken wir einen traditionellen Wiener Melange-Kaffee.*
- **Später**: *Später essen wir in einem gemütlichen Restaurant zu Abend.*
- **Zum Schluss**: *Und zum Schluss fahren wir müde, aber glücklich ins Hotel zurück.*

#### 4. Das Wetter & Temperaturen beschreiben (Weather Forecasts)
| Weather Condition | German Expression | English Meaning |
|---|---|---|
| General Impression | **Das Wetter ist herrlich / schön / leider schlecht.** | The weather is gorgeous / nice / unfortunately bad. |
| Sun & Wind | **Es ist sonnig. Die Sonne scheint. Es ist windig.** | It is sunny. The sun is shining. It is windy. |
| Clouds & Rain | **Der Himmel ist bewölkt. Es regnet / es schneit.** | The sky is cloudy. It is raining / snowing. |
| Temperature Scale | **Es ist heiß (32 Grad) / warm (22 Grad) / kalt (-3 Grad).** | It is hot (32°C) / warm (22°C) / cold (-3°C). |
| Degrees +/- | **Im Winter haben wir oft 5 Grad minus.** | In winter we often have minus 5 degrees. |

---

### 📐 kurz und klar: Grammatik (Grammar Essentials)

#### 1. Das unpersönliche Pronomen „man“
> **man** refers to people in general (*"one" / "you" / "people"*). It is always conjugated with the **3rd person singular** verb form:

- *In Wien **kann man** fantastische Museen besuchen.*
- *Hier **darf man** leider nicht mit dem Auto fahren.*
- *Am Sonntag **arbeitet man** in Deutschland normalerweise nicht.*

#### 2. Sätze verbinden mit der Konjunktion „denn“ (Because)
> **denn** explains a reason. It stands on **Position 0**, which means it does **NOT invert or change the normal word order** (Subject + Verb remain):

| Satz 1 | denn (Pos 0) | Subjekt (Pos 1) | Verb (Pos 2) | Satzende / Info |
|---|---|---|---|---|
| Die Stadt ist toll, | **denn** | man | **kann** | dort sehr viel erleben. |
| Ich lerne Deutsch, | **denn** | ich | **möchte** | in Hamburg studieren. |

#### 3. Komplette Fragewörter-Übersicht (All German Question Words)
| Kategorie | Kasus / Typ | Fragewort | Beispiel-Frage |
|---|---|---|---|
| **Person** | Nominativ (Subjekt) | **Wer?** *(Who)* | *Wer kommt heute zur Party?* |
| **Person** | Akkusativ (Objekt) | **Wen?** *(Whom)* | *Wen lädst du zum Essen ein?* |
| **Person** | Dativ (Objekt) | **Wem?** *(To whom)* | *Wem gehört diese Tasche?* |
| **Sache / Ding** | Nominativ / Akkusativ | **Was?** *(What)* | *Was kaufst du heute auf dem Markt?* |
| **Ort (Position)** | stationär | **Wo?** *(Where)* | *Wo wohnen Sie im Moment?* |
| **Ort (Richtung)** | Zielort | **Wohin?** *(Where to)* | *Wohin fährst du in den Urlaub?* |
| **Ort (Herkunft)** | Ursprungsort | **Woher?** *(Where from)* | *Woher kommen deine Großeltern?* |
| **Zeitpunkt** | temporal | **Wann?** *(When)* | *Wann fängt die Vorstellung an?* |
| **Zeitdauer** | Dauer | **Wie lange?** *(How long)* | *Wie lange dauert die Zugfahrt?* |
| **Art & Weise** | modal | **Wie?** *(How)* | *Wie heißt deine Deutschlehrerin?* |
| **Grund** | kausal | **Warum?** *(Why)* | *Warum lernst du die deutsche Sprache?* |

#### 4. Zeitangaben: Präpositionen mit Dativ
All of these temporal prepositions require the **Dativ case**:
- **ab** (+ Dativ): *ab **dem** Moment* (from this moment onward)
- **an** (+ Dativ): ***am** Montag* (*an + dem*) (on Monday)
- **in** (+ Dativ): ***im** August* (*in + dem*), *in **einer** Stunde* (in August / in an hour)
- **nach** (+ Dativ): *nach **dem** Urlaub* (after the vacation)
- **seit** (+ Dativ): *seit **einer** Woche* (for a week / since a week ago)
- **vor** (+ Dativ): *vor **der** Reise* (before the journey)

      `
      },
      interactiveExercises: [
        {
          id: "k12_ex1",
          title: "Übung 1: Direction (Wohin? - Akkusativ) vs Location (Wo? - Dativ)",
          instruction: "Fill in the correct prepositional contraction:",
          questions: [
            {
              id: "k12_q1",
              prompt: "1. 'Wohin fährst du? - Ich fahre an ______ (der) Strand.'",
              expected: ["den"],
              hint: "Wohin requires Akkusativ (der -> den).",
              explanation: "an den Strand."
            },
            {
              id: "k12_q2",
              prompt: "2. 'Wo bist du jetzt? - Ich bin an ______ (der) Strand.'",
              expected: ["dem"],
              hint: "Wo requires Dativ (der -> dem).",
              explanation: "an dem Strand = am Strand."
            }
          ]
        },
        {
          id: "k12_ex2",
          title: "Übung 2: Time Prepositions (im / am / um)",
          instruction: "Fill in 'im', 'am', or 'um':",
          questions: [
            {
              id: "k12_q3",
              prompt: "1. 'Wir fliegen ______ Juli nach Berlin.'",
              expected: ["im", "Im"],
              hint: "Months take 'im'.",
              explanation: "im Juli."
            },
            {
              id: "k12_q4",
              prompt: "2. 'Der Flug geht ______ Montag.'",
              expected: ["am", "Am"],
              hint: "Days take 'am'.",
              explanation: "am Montag."
            },
            {
              id: "k12_q5",
              prompt: "3. 'Wir treffen uns ______ 14 Uhr.'",
              expected: ["um", "Um"],
              hint: "Clock time takes 'um'.",
              explanation: "um 14 Uhr."
            }
          ]
        }
      ],
      grammarSummary: `
**Core Grammar Rules (Kapitel 12):**
1. **Two-Way Prepositions:**
   - Wohin? (Motion) -> Akkusativ (*an den Strand*)
   - Wo? (Location) -> Dativ (*am Strand*)
2. **Time Prepositions:** *im* (months/seasons), *am* (days), *um* (clock time).
      `,
      vocabList: [
        { de: "der Urlaub, -e", en: "vacation / holiday", type: "der" },
        { de: "die Reise, -n", en: "journey / trip", type: "die" },
        { de: "der Strand, -\"e", en: "beach", type: "der" },
        { de: "das Meer, -e", en: "sea / ocean", type: "das" },
        { de: "die Berge (Pl.)", en: "mountains", type: "die" },
        { de: "das Wetter", en: "weather", type: "das" },
        { de: "die Sonne", en: "sun", type: "die" },
        { de: "reisen (er reist)", en: "to travel", type: "verb" },
        { de: "fliegen (er fliegt)", en: "to fly", type: "verb" },
        { de: "Schönen Urlaub!", en: "Have a great vacation!", type: "phrase" }
      ],
      quizzes: [
        {
          q: "Select the correct preposition: 'Ich fahre ______ Sommer nach Deutschland.'",
          options: ["am", "im", "um", "an"],
          correct: 1,
          explanation: "Months and seasons take 'im' (im Sommer)."
        }
      ]
    }
  ]
};
