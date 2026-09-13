// tutor.js - Cheeya Studio German AI Tutor Engine (Gemini & Intelligent Conversational Engine)

class GermanTutor {
  constructor() {
    this.apiKey = localStorage.getItem('netzwerk_gemini_api_key') || '';
    this.chatHistory = [];
    this.currentChapterId = 1;
    this.currentTeacher = localStorage.getItem('netzwerk_selected_teacher') || 'cheeya'; // 'cheeya' or 'saabfan'
    this.initSpeech();
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem('netzwerk_gemini_api_key', this.apiKey);
  }

  getApiKey() {
    return this.apiKey;
  }

  hasApiKey() {
    return !!this.apiKey;
  }

  setChapter(chapterId) {
    this.currentChapterId = chapterId;
  }

  setTeacher(teacherId) {
    this.currentTeacher = teacherId; // 'saabfan' or 'cheeya'
    localStorage.setItem('netzwerk_selected_teacher', teacherId);
  }

  getTeacher() {
    return this.currentTeacher;
  }

  getTeacherInfo() {
    if (this.currentTeacher === 'cheeya') {
      return {
        id: 'cheeya',
        name: 'Frau Cheeya',
        title: 'Lead German Instructor & Co-Founder (Cheeya Studio)',
        avatar: '<img src="LOGO.jpeg" alt="Frau Cheeya" class="w-full h-full object-cover rounded-full">',
        icon: '👩‍🏫',
        colorClass: 'from-pink-600 to-rose-500 border border-pink-500/50',
        textColor: 'text-pink-400',
        badgeBg: 'bg-pink-950/80 text-pink-300 border-pink-800/50'
      };
    }
    return {
      id: 'saabfan',
      name: 'Herr Saabfan',
      title: 'German Grammar & Syntax Specialist',
      avatar: 'HS',
      icon: '👨‍🏫',
      colorClass: 'from-blue-600 to-cyan-500 border border-cyan-500/50',
      textColor: 'text-cyan-400',
      badgeBg: 'bg-blue-950/80 text-cyan-300 border-cyan-800/50'
    };
  }

  initSpeech() {
    this.synth = window.speechSynthesis;
    this.germanVoice = null;
    if (this.synth) {
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        this.germanVoice = voices.find(v => v.lang.startsWith('de')) || null;
      };
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  speak(text) {
    if (!this.synth) {
      alert("Your browser does not support Speech Synthesis (Text-to-Speech).");
      return;
    }
    const cleanText = text.replace(/[*_#`]/g, '').trim();
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.88;
    if (this.germanVoice) {
      utterance.voice = this.germanVoice;
    }
    this.synth.speak(utterance);
  }

  // System instructions for Gemini AI in English
  getSystemInstruction() {
    const chapter = NETZWERK_DATA.chapters.find(c => c.id === this.currentChapterId) || NETZWERK_DATA.chapters[0];
    const teacher = this.getTeacherInfo();

    const persona = (teacher.id === 'cheeya')
      ? `You are "Frau Cheeya", a super warm, friendly, enthusiastic, and encouraging German language teacher at Cheeya Studio. You love teaching German vocabulary (Wortschatz), conversational dialogues, pronunciation, and everyday speaking. You speak affectionately and motivate the learner with positive energy.`
      : `You are "Herr Saabfan", a sharp, patient, structured, and insightful German grammar specialist at Cheeya Studio. You excel at explaining German grammar (Grammatik), sentence structure (Satzklammer), noun genders (der/die/das), and verb conjugations with crystal-clear logic and tables.`;

    return `
${persona}
Your student is self-studying German from the "Netzwerk Neu A1 Kursbuch" curriculum.
Active Chapter: ${chapter.title} - ${chapter.subtitle}.

Core Pedagogical Principles for ${teacher.name}:
1. Always communicate in clear, natural, friendly English.
2. Whenever introducing German words or sentences, always provide English translations in parentheses or bullet points.
3. Highlight German noun genders clearly (der = masculine, die = feminine, das = neutral, die = plural).
4. Emphasize verb conjugations and word order rules (Verb in Position 2 in declarative sentences).
5. If the student expresses confusion, frustration, or says they don't understand, respond with warm empathy, reassure them, and break down the topic into 2-3 easy steps.
6. If the student answers a question or asks to check exercises, praise their effort first ("Ausgezeichnet!", "Sehr gut!", "Almost there!"), point out any grammar nuances kindly, and provide the correct German sentence.
7. Keep responses concise, clean, well-structured with markdown headings, bullet points, and emojis.
`;
  }

  // Call Google Gemini API
  async askGemini(userMessage, context = '') {
    if (!this.apiKey) {
      return this.getOfflineResponse(userMessage, context);
    }

    const currentChapter = NETZWERK_DATA.chapters.find(c => c.id === this.currentChapterId) || NETZWERK_DATA.chapters[0];

    const promptPayload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${this.getSystemInstruction()}\n\n[Current Chapter Context: ${currentChapter.title} - ${currentChapter.subtitle}]\n${context ? '[Additional Context: ' + context + ']\n' : ''}\n[Student's Question/Message]: ${userMessage}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1200
      }
    };

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptPayload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn("Gemini API error, falling back to smart offline tutor:", errData);
        const teacher = this.getTeacherInfo();
        return this.getOfflineResponse(userMessage, context, `💡 *(Note: Gemini API notice: ${errData?.error?.message || 'Check your API key in Settings'}. ${teacher.name} is responding using our built-in German knowledge base.)*\n\n`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      } else {
        return this.getOfflineResponse(userMessage, context);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      const teacher = this.getTeacherInfo();
      return this.getOfflineResponse(userMessage, context, `💡 *(Note: Offline Mode active. ${teacher.name} is responding using our built-in German A1 tutor engine.)*\n\n`);
    }
  }

  // Intelligent Conversational Engine (Offline / Fallback) - Natural & Human-like (ChatGPT style)
  getOfflineResponse(userMessage, context = '', prefix = '') {
    const chapter = NETZWERK_DATA.chapters.find(c => c.id === this.currentChapterId) || NETZWERK_DATA.chapters[0];
    const teacher = this.getTeacherInfo();
    const rawMsg = userMessage.trim();
    const msg = rawMsg.toLowerCase();

    // 1. Meta / Feedback on being "stiff", "robot", "chat gpt", "kurang responsif", "kaku"
    if (msg.includes('kaku') || msg.includes('stiff') || msg.includes('robot') || 
        msg.includes('chat gpt') || msg.includes('chatgpt') || msg.includes('responsif') || 
        msg.includes('responsive') || msg.includes('kyk manusia') || msg.includes('like a human') ||
        msg.includes('lebih hidup') || msg.includes('kurang responsif')) {
      const intro = (teacher.id === 'cheeya')
        ? `Huhu Cheeya! 💖 I hear you loud and clear, and thank you so much for telling me!`
        : `Guten Tag Cheeya! 👨‍🏫 I appreciate your honest feedback, and you are 100% right!`;

      return prefix + `### ${intro}\n\n` +
        `From now on, let's chat just like you're talking with **ChatGPT** or a real personal German friend sitting right next to you at a cafe! No rigid templates, no robotic canned answers. 🌸\n\n` +
        `I am completely tuned in to **${chapter.title}** (*${chapter.subtitle}*). Here is what we can do together right now:\n\n` +
        `- 🔤 **German Alphabet & Pronunciation**: Want to learn how letters like *W*, *V*, *Z*, *J*, or the Umlauts (*Ä, Ö, Ü, ß*) sound? Or want to practice spelling names?\n` +
        `- 🔢 **Numbers 0 to 20**: Want to count, learn tricky numbers like *sechzehn* and *siebzehn*, or practice stating phone numbers?\n` +
        `- 🗣️ **Real German Conversation**: Greet me in German, ask me how to say any phrase, or practice a quick introduction dialogue!\n` +
        `- 📝 **Exercise Help**: Stuck on any question in the textbook? Just ask me!\n\n` +
        `What would you like to dive into first? Tell me in your own words, Cheeya! ✨`;
    }

    // 2. Alphabet & Spelling Inquiries (alphabet, huruf, abc, spelling, eja, buchstabieren, umlaute, ä, ö, ü, ß)
    if (msg.includes('alphabet') || msg.includes('alfabeth') || msg.includes('huruf') || 
        msg.includes('buchstabe') || msg.includes('eja') || msg.includes('spell') || 
        msg.includes('buchstabieren') || msg.includes('umlaute') || msg.includes('umlaut') ||
        msg.includes('eszett') || msg.includes('scharfes s') || msg.includes('abc')) {
      return prefix + `### 🔤 Das deutsche Alphabet & Aussprache (The German Alphabet)!\n\n` +
        `Oh, the German alphabet is such a fun and essential foundation! In Kapitel 1, we learn the 26 standard letters, plus **4 special German characters**:\n\n` +
        `#### 🌟 Key Letters that surprise English speakers:\n` +
        `- **W** is pronounced like English **"V"** (*Wasser* = 'Vasser', *Wie* = 'Vee').\n` +
        `- **V** is pronounced like English **"F"** (*Vater* = 'Fater', *Vier* = 'Feer').\n` +
        `- **J** is pronounced like English **"Y"** (*Ja* = 'Ya', *Jahr* = 'Yahr').\n` +
        `- **Z** is pronounced like a sharp **"TS"** (*Zug* = 'Tsoog', *Zwei* = 'Tsvye').\n` +
        `- **S** before a vowel sounds like English **"Z"** (*Sonne* = 'Zonne', *Sie* = 'Zee').\n\n` +
        `#### 🇩🇪 The 4 Special Characters (Umlaute & Eszett):\n` +
        `1. **Ä / ä** [ɛ:] = Sounds like "eh" in *bed* (e.g. *Äpfel* = apples).\n` +
        `2. **Ö / ö** [ø:] = Round your lips to say "O", but make the sound "E" (e.g. *Österreich* = Austria).\n` +
        `3. **Ü / ü** [y:] = Round your lips tightly as if whistling and say "EE" (e.g. *Über* = about/over).\n` +
        `4. **ß** [s] = The famous *Eszett* or *scharfes S* (sharp S), always pronounced like a soft unvoiced 's' (e.g. *heißen* = to be named).\n\n` +
        `💡 **Spelling Formula (*Buchstabieren*):**\n` +
        `- *"Wie schreibt man das?"* = How do you write that?\n` +
        `- *"Buchstabieren Sie bitte!"* = Please spell it out!\n\n` +
        `**Cheeya's Name Challenge:** To spell **C-H-E-E-Y-A**, Germans say:\n` +
        `> **C** [tse:] - **H** [ha:] - **E** [e:] - **E** [e:] - **Y** ['ʏpsilɔn] - **A** [a:]! 💖\n\n` +
        `Try typing any word or your full name, and I will spell it out in authentic German for you! 🌸`;
    }

    // 3. Numbers & Counting Inquiries (angka, nomor, number, zahlen, hitung, count, 0-20, telefon)
    if (msg.includes('angka') || msg.includes('nomor') || msg.includes('number') || 
        msg.includes('zahlen') || msg.includes('zahl') || msg.includes('hitung') || 
        msg.includes('count') || msg.includes('0-20') || msg.includes('telepon') || 
        msg.includes('telephone') || msg.includes('phone number') || msg.includes('handynummer') ||
        msg.includes('sechzehn') || msg.includes('siebzehn') || msg.includes('zwanzig')) {
      return prefix + `### 🔢 Die Zahlen 0 bis 20 (German Numbers 0–20)!\n\n` +
        `Numbers in German are super logical once you catch the pattern! Here is your complete Chapter 1 guide:\n\n` +
        `| Number | German Word | Pronunciation Tip |\n` +
        `|---|---|---|\n` +
        `| **0** | **null** | like 'nool' |\n` +
        `| **1** | **eins** | like 'eyns' |\n` +
        `| **2** | **zwei** | like 'tsvye' (sharp ts!) |\n` +
        `| **3** | **drei** | roll the r gently |\n` +
        `| **4** | **vier** | 'feer' (V sounds like F!) |\n` +
        `| **5** | **fünf** | round your lips for ü |\n` +
        `| **6** | **sechs** | 'zex' (chs sounds like x) |\n` +
        `| **7** | **sieben** | 'zeeben' |\n` +
        `| **8** | **acht** | throaty ch sound |\n` +
        `| **9** | **neun** | like 'noyn' |\n` +
        `| **10** | **zehn** | 'tsehn' |\n` +
        `| **11** | **elf** | 'elf' (just like in English!) |\n` +
        `| **12** | **zwölf** | 'tsvoelf' |\n` +
        `| **13** | **dreizehn** | drei + zehn |\n` +
        `| **14** | **vierzehn** | vier + zehn |\n` +
        `| **15** | **fünfzehn** | fünf + zehn |\n` +
        `| **16** | **sechzehn** | ⚠️ *Drop the 's'!* (NOT sechszehn) |\n` +
        `| **17** | **siebzehn** | ⚠️ *Drop the 'en'!* (NOT siebenzehn) |\n` +
        `| **18** | **achtzehn** | acht + zehn |\n` +
        `| **19** | **neunzehn** | neun + zehn |\n` +
        `| **20** | **zwanzig** | 'tsvantsig' |\n\n` +
        `📱 **How to give your Phone Number in Germany:**\n` +
        `Germans read phone numbers **digit by digit**:\n` +
        `> *"Meine Telefonnummer ist: null - acht - eins - zwei..."* (0812...)\n\n` +
        `✨ **Quick Quiz for you:** What is 8 + 7 in German? Reply with the German number word and let's see if you get it right! 🎉`;
    }

    // 4. Empathy / Feeling Overwhelmed ("aku ga ngerti", "pusing", "bingung", "ajarin semuanya", "help me", "don't understand")
    if (msg.includes('ga ngerti') || msg.includes('gak ngerti') || msg.includes('don\'t understand') || 
        msg.includes('dont understand') || msg.includes('confused') || msg.includes('semuanya') || 
        msg.includes('everything') || msg.includes('help me') || msg.includes('pusing') || 
        msg.includes('bingung') || msg.includes('susah') || msg.includes('terlalu banyak')) {
      return prefix + `### Take a deep breath, Cheeya! 💖 I've got your back!\n\n` +
        `Learning German can definitely feel like a storm of rules at first, but **${teacher.name}** is here with you every step of the way! You do NOT need to memorize everything today.\n\n` +
        `Let's make **${chapter.title}** super friendly with just **3 bite-sized steps**:\n\n` +
        `1. **Step 1 - Say Hello**: Start with just two words: *Hallo!* (Hi) and *Guten Tag!* (Hello).\n` +
        `2. **Step 2 - Introduce Yourself**: Just master one sentence: *"Ich heiße Cheeya und ich lerne Deutsch."* (My name is Cheeya and I am learning German).\n` +
        `3. **Step 3 - One Fun Exercise**: Switch to the **🌸 Lesson & Exercises** tab and try just Exercise 1. Don't worry about getting 100%—making mistakes is how your brain grows!\n\n` +
        `Which part feels most confusing right now—is it the verb endings, the alphabet sounds, or the numbers? Tell me, and we will conquer it together! 🌸`;
    }

    // 5. Direct German Greetings & Conversational Inputs (Hallo, Guten Tag, Wie gehts, etc.)
    if (msg.startsWith('hallo') || msg.startsWith('hi') || msg.startsWith('hello') || 
        msg.includes('guten tag') || msg.includes('guten morgen') || msg.includes('guten abend') || 
        msg.includes('wie geht') || msg.startsWith('danke') || msg.includes('tschüss') || msg.includes('tschus')) {
      const greetingDe = (teacher.id === 'cheeya')
        ? `Huhu Cheeya! 💖 Hallo und herzliche Grüße!`
        : `Guten Tag Cheeya! 👨‍🏫 Schön, von dir zu hören!`;

      return prefix + `### ${greetingDe} 👋\n\n` +
        `*Mir geht es hervorragend, danke der Nachfrage!* (I am doing wonderfully, thank you for asking!)\n\n` +
        `We are currently studying **${chapter.title}** (*${chapter.subtitle}*). How is your study session going so far?\n\n` +
        `- Would you like to practice a quick self-introduction dialogue with me in German?\n` +
        `- Or do you have a specific question about the vocabulary or exercises?\n\n` +
        `Go ahead, answer me in German or English—I'm listening! ✨`;
    }

    // 6. Translation Requests ("how do I say", "gimana cara ngomong", "cara bilang", "artinya apa", "what does ... mean")
    if (msg.includes('how do i say') || msg.includes('how to say') || msg.includes('cara ngomong') || 
        msg.includes('cara bilang') || msg.includes('bahasa jermannya') || msg.includes('artinya') || 
        msg.includes('what does') || msg.includes('translate')) {
      // Look up in vocab list first
      const found = this.searchVocab(msg, chapter);
      if (found) {
        return prefix + `### 💬 German Expression: **${found.de}**\n\n` +
          `- **Meaning in English:** ${found.en || found.id}\n` +
          `- **Grammar Category:** \`${found.type}\` ${found.type.startsWith('d') ? '(Noun Gender: ' + (found.type === 'der' ? 'Masculine 🔵' : found.type === 'die' ? 'Feminine 🔴' : 'Neutral 🟢') + ')' : ''}\n` +
          `- **How to use it in a sentence:**\n` +
          `  > *"${found.de} ist sehr wichtig im Alltag."* (${found.de} is very important in everyday life.)\n\n` +
          `🔊 You can also click the sound icon in the **Vocabulary & Audio** tab to hear native German pronunciation! Would you like another phrase? 🌸`;
      }

      return prefix + `### Here is how you say that in German! 🇩🇪\n\n` +
        `In German conversation, everyday expressions often have formal and informal versions:\n\n` +
        `- **Formal (with elders, teachers, strangers):** Use *Sie* (capital S) + infinitive verb.\n` +
        `  - *Wie heißen Sie?* (What is your name?)\n` +
        `  - *Sprechen Sie Englisch?* (Do you speak English?)\n` +
        `- **Informal (with friends, family, peers):** Use *du* + verb ending in *-st*.\n` +
        `  - *Wie heißt du?* (What's your name?)\n` +
        `  - *Sprichst du Englisch?* (Do you speak English?)\n\n` +
        `What exact sentence or phrase would you like me to translate for you right now? Just type it out! 💖`;
    }

    // 7. Grammar Topic Inquiries (articles, akkusativ, dativ, modal, sein, haben, sentence structure)
    const grammarTopic = this.findGrammarTopic(msg);
    if (grammarTopic) {
      return prefix + grammarTopic;
    }

    // 8. Specific Chapter Exercises & Practice Request
    if (msg.includes('exercise') || msg.includes('quiz') || msg.includes('practice') || 
        msg.includes('soal') || msg.includes('latihan') || msg.includes('uji')) {
      if (chapter.interactiveExercises && chapter.interactiveExercises.length > 0) {
        const firstEx = chapter.interactiveExercises[0];
        const firstQ = firstEx.questions[0];
        return prefix + `### ✍️ Practice Time with ${teacher.name}! 🌟\n\n` +
          `Let's warm up with this textbook question from **${firstEx.title}**:\n\n` +
          `> **${firstQ.prompt}**\n\n` +
          `💡 *Helpful Hint:* ${firstQ.hint}\n\n` +
          `You can type your answer right here in our chat, or switch to the **"🌸 Lesson & Exercises"** tab to fill in all the textbook fields and get instant badges! What do you think the answer is? 🌸`;
      }
    }

    // 9. Vocabulary Search across Chapter
    const foundVocab = this.searchVocab(msg, chapter);
    if (foundVocab) {
      return prefix + `### 📚 Vocabulary Insight: **${foundVocab.de}**\n\n` +
        `- **Meaning:** ${foundVocab.en || foundVocab.id}\n` +
        `- **Category:** \`${foundVocab.type}\` ${foundVocab.type.startsWith('d') ? '(Noun Gender: ' + (foundVocab.type === 'der' ? 'Masculine 🔵' : foundVocab.type === 'die' ? 'Feminine 🔴' : 'Neutral 🟢') + ')' : ''}\n` +
        `- **In Chapter:** ${chapter.title}\n\n` +
        `Click 🔊 in the **Vocabulary & Audio** tab anytime to listen to the pronunciation! Would you like to practice using this word in a sentence? 🌸`;
    }

    // 10. Natural Conversational Fallback (ChatGPT Style - Adaptive & Engaging)
    const chapterTip = this.getQuickGrammarTip(chapter.id);
    return prefix + `### That's an interesting question, Cheeya! 💡\n\n` +
      `Regarding **"${rawMsg}"** as we study **${chapter.title}** (*${chapter.subtitle}*):\n\n` +
      `Here is a key insight to keep in mind:\n` +
      `- ${chapterTip}\n\n` +
      `In everyday German communication, the golden rule is **clarity over perfection**. Even native speakers appreciate when you try your best with the articles (*der/die/das*) and verb positions!\n\n` +
      `💡 *Tip: If you'd like to ask completely unrestricted open-ended questions about anything in the universe, you can connect your free Google Gemini API key via the ⚙️ Settings button.*\n\n` +
      `Would you like me to explain the grammar behind this, practice a short dialogue, or show you the vocabulary for this topic? Tell me what you'd like to do next! 🌸`;
  }

  getQuickGrammarTip(chapterId) {
    switch (chapterId) {
      case 1: return "Remember that in statements and W-questions, the conjugated verb is always in **Position 2** (*Ich **heiße** Cheeya* | *Woher **kommst** du?*). Also, all German nouns must be capitalized!";
      case 2: return "Nouns have 3 genders: *der* (masculine 🔵), *die* (feminine 🔴), *das* (neutral 🟢). Female professions add *-in* (e.g. *die Lehrerin*).";
      case 3: return "In the Akkusativ case (direct object), ONLY masculine changes: *der* becomes *den* (*Ich suche den Bahnhof*). Feminine, neutral, and plural stay the same!";
      case 4: return "Stem vowel change verbs (e -> i): *essen* -> *du isst*, *nehmen* -> *du nimmst*. Use *möchte* for polite requests (*Ich möchte einen Kaffee*).";
      case 5: return "Separable verbs throw their prefix to the very end of the sentence: *Ich stehe um 7 Uhr auf* (*aufstehen*).";
      case 6: return "Modal verbs (*können, wollen, müssen*) take Position 2, while the main infinitive verb is sent to the very end of the sentence!";
      case 7: return "For past tense in spoken German, use *war* (was) and *hatte* (had): *Gestern war ich im Büro*.";
      case 8: return "The imperative (commands/advice): Formal is *Trinken Sie!*, informal is *Trink!* (drop -st and du).";
      case 9: return "Location (Wo? - stationary position) uses the Dativ case: *auf dem Tisch* (der -> dem), *in der Küche* (die -> der).";
      case 10: return "The Perfekt past tense uses *haben/sein* + *Partizip II* (ge-...-t) at the end of the sentence: *Ich habe Deutsch gelernt*.";
      case 11: return "Verbs like *gefallen* (to please) and *passen* (to fit) take Dativ objects: *Die Jacke gefällt mir* (mir = to me).";
      case 12: return "Direction (*Wohin?*) uses Akkusativ (*an den Strand*), while location (*Wo?*) uses Dativ (*am Strand*).";
      default: return "Focus on mastering verb positions and noun articles.";
    }
  }

  findGrammarTopic(msg) {
    if (msg.includes('der die das') || msg.includes('gender') || msg.includes('article') || msg.includes('artikel')) {
      return `### 🔵 🔴 🟢 German Noun Genders (*der, die, das*)\n\n` +
        `Every German noun has an inherent grammatical gender:\n\n` +
        `- 🔵 **der** (Masculine): *der Mann* (man), *der Tisch* (table), *der Tag* (day).\n` +
        `- 🔴 **die** (Feminine): *die Frau* (woman), *die Lampe* (lamp), *die Nacht* (night).\n` +
        `- 🟢 **das** (Neutral): *das Kind* (child), *das Buch* (book), *das Bild* (picture).\n` +
        `- 🟣 **die** (Plural): *die Freunde* (friends), *die Bücher* (books).\n\n` +
        `💡 **Golden Rule:** Always learn every new noun together with its article (*der/die/das*) and its plural form!`;
    }

    if (msg.includes('akkusativ') || msg.includes('accusative')) {
      return `### 🎯 The German Akkusativ Case (Direct Object)\n\n` +
        `The Akkusativ case is used for the direct object—the person or thing receiving the action of the verb.\n\n` +
        `Here is the best secret: **Only the MASCULINE gender changes!**\n\n` +
        `| Gender | Nominativ (Subject) | Akkusativ (Direct Object) |\n` +
        `|---|---|---|\n` +
        `| **Masculine** | der / ein / kein | **den / einen / keinen** |\n` +
        `| **Feminine** | die / eine / keine | die / eine / keine (unchanged) |\n` +
        `| **Neutral** | das / ein / kein | das / ein / kein (unchanged) |\n` +
        `| **Plural** | die / - / keine | die / - / keine (unchanged) |\n\n` +
        `*Example:* Ich suche **den** Bahnhof (*der Bahnhof* -> *den Bahnhof*).`;
    }

    if (msg.includes('dativ') || msg.includes('dative')) {
      return `### 📍 The German Dativ Case (Indirect Object & Location)\n\n` +
        `The Dativ case is used to answer **Wo?** (Where? - stationary location) and for indirect objects:\n\n` +
        `- 🔵 **der** -> **dem** (*auf dem Tisch*)\n` +
        `- 🟢 **das** -> **dem** (*im Zimmer* = in dem Zimmer)\n` +
        `- 🔴 **die** -> **der** (*in der Küche*)\n` +
        `- 🟣 **die (Plural)** -> **den + n** (*an den Wänden*)\n\n` +
        `*Personal Pronouns in Dativ:* *mir* (to me), *dir* (to you), *Ihnen* (to formal You).`;
    }

    if (msg.includes('sein') || msg.includes('to be')) {
      return `### 🌟 Conjugation of the Irregular Verb *sein* (to be)\n\n` +
        `- **ich bin** (I am)\n` +
        `- **du bist** (you are - informal)\n` +
        `- **er/sie/es ist** (he/she/it is)\n` +
        `- **wir sind** (we are)\n` +
        `- **ihr seid** (you all are)\n` +
        `- **sie/Sie sind** (they are / You are - formal)\n\n` +
        `*Examples:* *Ich bin Cheeya.* / *Sind Sie Herr Müller?*`;
    }

    if (msg.includes('haben') || msg.includes('to have')) {
      return `### 🌟 Conjugation of the Verb *haben* (to have)\n\n` +
        `- **ich habe** (I have)\n` +
        `- **du hast** (you have)\n` +
        `- **er/sie/es hat** (he/she/it has)\n` +
        `- **wir haben** (we have)\n` +
        `- **ihr habt** (you all have)\n` +
        `- **sie/Sie haben** (they have / You have - formal)\n\n` +
        `*Example:* *Ich habe ein Buch.* (*haben* takes the Akkusativ case!)`;
    }

    return null;
  }

  searchVocab(msg, chapter) {
    if (!chapter.vocabList) return null;
    return chapter.vocabList.find(v => {
      const cleanDe = v.de.toLowerCase().replace(/[^a-zäöüß]/g, '');
      const cleanMsg = msg.replace(/[^a-zäöüß]/g, '');
      return cleanMsg.includes(cleanDe) || cleanDe.includes(cleanMsg) && cleanMsg.length >= 3;
    });
  }
}

// Global instance
const tutor = new GermanTutor();
