// app.js - Controller UI & Interactivity for Cheeya Studio Netzwerk Learning Hub (English Edition)

// ================= ANTI-THEFT & CONTENT PROTECTION SHIELD =================
(function initSecurityShield() {
  function notify(msg) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(msg, '🛡️');
    }
  }

  // 1. Disable Right-Click Context Menu (prevents "View Source", "Inspect", "Save As")
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    notify('🔒 Content protected by Cheeya Studio.');
    return false;
  }, true);

  // 2. Disable Keyboard Shortcuts (F12, Ctrl+U, Ctrl+S, Ctrl+P, DevTools, Copy)
  window.addEventListener('keydown', (e) => {
    // F12 Developer Tools
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      notify('🔒 Developer tools are disabled.');
      return false;
    }

    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl) {
      const key = (e.key || '').toLowerCase();

      // Ctrl + U: View Source
      if (key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        notify('🔒 View source is disabled.');
        return false;
      }

      // Ctrl + S: Save Page As
      if (key === 's') {
        e.preventDefault();
        e.stopPropagation();
        notify('🔒 Save page is disabled.');
        return false;
      }

      // Ctrl + P: Print
      if (key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        notify('🔒 Please use the built-in PDF export button.');
        return false;
      }

      // Ctrl + Shift + I / J / C: Inspect Element & Console
      if (e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        notify('🔒 Inspect element is disabled.');
        return false;
      }

      // Ctrl + C: Copy text (allowed only in input fields)
      if (key === 'c') {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          notify('🔒 Copying text is disabled.');
          return false;
        }
      }
    }
  }, true);

  // 3. Disable Dragging of Images & Assets
  window.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  }, true);

  // 4. Disable Copy & Cut Events
  window.addEventListener('copy', (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      return false;
    }
  }, true);

  window.addEventListener('cut', (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      return false;
    }
  }, true);
})();

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let currentChapterIndex = 0;
  let currentDoc = 'kursbuch'; // 'kursbuch', 'fullbook', 'loesungen1_6', 'loesungen7_12'
  let isPlayingAudio = false;
  let currentVocabFilter = 'all'; // 'all', 'nouns', 'verbs', 'phrases'
  let currentActiveView = 'dashboard'; // 'dashboard', 'lesson', 'pdf', 'vocab', 'progress'

  // LocalStorage Keys for Study Progress & Settings
  const STORAGE_KEY = 'netzwerk_study_history_v4';
  const FONT_STORAGE_KEY = 'netzwerk_font_scale_v2';
  const MUSIC_VOL_KEY = 'netzwerk_music_vol';

  // Load or initialize progress data
  function loadStudyData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          lastChapter: parsed.lastChapter || 0,
          lastPage: parsed.lastPage || 1,
          completedChapters: Array.isArray(parsed.completedChapters) ? parsed.completedChapters : [],
          quizHistory: parsed.quizHistory || {},
          exerciseHistory: parsed.exerciseHistory || []
        };
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }
    // Clean up any legacy test keys so completion status strictly starts at 0
    try {
      localStorage.removeItem('netzwerk_study_history');
      localStorage.removeItem('netzwerk_study_history_v2');
      localStorage.removeItem('netzwerk_study_history_v3');
    } catch (e) {}

    return {
      lastChapter: 0,
      lastPage: 1,
      completedChapters: [], // Guaranteed 0 completed chapters initially
      quizHistory: {},
      exerciseHistory: []
    };
  }

  let studyData = loadStudyData();

  function saveStudyData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studyData));
    updateProgressHeader();
  }

  // DOM Elements
  const chapterSelect = document.getElementById('chapterSelect');
  const pdfFrame = document.getElementById('pdfFrame');
  const pageInput = document.getElementById('pageInput');
  const docBadge = document.getElementById('docBadge');
  
  // Audio Player Elements
  const audioPlayer = document.getElementById('audioPlayer');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const audioTrackSelect = document.getElementById('audioTrackSelect');
  const audioWave = document.getElementById('audioWave');
  const audioTime = document.getElementById('audioTime');
  const audioDuration = document.getElementById('audioDuration');
  const audioProgress = document.getElementById('audioProgress');

  // PDF Media Bar Elements
  const pdfPlayPauseBtn = document.getElementById('pdfPlayPauseBtn');
  const pdfAudioTrackSelect = document.getElementById('pdfAudioTrackSelect');
  const pdfAudioWave = document.getElementById('pdfAudioWave');
  const pdfAudioTime = document.getElementById('pdfAudioTime');
  const pdfAudioDuration = document.getElementById('pdfAudioDuration');
  const pdfAudioProgress = document.getElementById('pdfAudioProgress');
  const pdfVideoBtnText = document.getElementById('pdfVideoBtnText');

  // Video Elements
  const videoModal = document.getElementById('videoModal');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoSelect = document.getElementById('videoSelect');
  const videoModalTitle = document.getElementById('videoModalTitle');

  // Grammar Modal
  const grammarModal = document.getElementById('grammarModal');

  // ================= 1. NATIVE SPEECH SYNTHESIS FOR GERMAN PRONUNCIATION =================
  const synth = window.speechSynthesis;
  let germanVoice = null;
  function initSpeech() {
    if (synth) {
      const loadVoices = () => {
        const voices = synth.getVoices() || [];
        germanVoice = voices.find(v => {
          const name = (v.name || '').toLowerCase();
          const lang = (v.lang || '').toLowerCase();
          return (lang.startsWith('de') || lang.includes('german')) &&
                 (name.includes('google') || name.includes('natural') || name.includes('hedda') || name.includes('katja') || name.includes('stefan') || name.includes('anna') || name.includes('marlene') || name.includes('vicki') || name.includes('hans') || name.includes('martin'));
        }) || voices.find(v => (v.lang || '').toLowerCase().startsWith('de')) || null;
      };
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  // Pre-unlock speech synthesis on user interaction for mobile browsers
  document.addEventListener('click', function unlockAudioContext() {
    if (synth && synth.paused) {
      try { synth.resume(); } catch (e) {}
    }
  }, { passive: true });

  let activeAudioObj = null;
  window.ttsCurrentSpeed = 1.0;

  function cleanGermanTextForSpeech(text) {
    if (!text || typeof text !== 'string') return '';
    let spoken = text.trim();

    // 1. Remove markdown symbols
    spoken = spoken.replace(/[*_#`~]/g, '');

    // 2. Remove parenthetical English translations/notes e.g. "*(read digit by digit)*", "(m / f)", "(formal)"
    spoken = spoken.replace(/\(.*?\)/g, ' ');
    spoken = spoken.replace(/\[.*?\]/g, ' ');

    // 3. For German nouns with plural annotations at the end:
    // e.g. "das Alphabet, -e", "das Land, -\"er", "der Herr, -en", "die Stadt, -\"e", "der Apfel, -\"", "die Ärztin, -nen"
    // Match only trailing comma followed by hyphen or plural abbreviation
    spoken = spoken.replace(/,\s*[-–—"'][^,.]*$/i, '');
    spoken = spoken.replace(/,\s*pl\b[^,.]*$/i, '');

    // 4. Clean slashes into natural pauses (e.g. "Hallo / Guten Tag" -> "Hallo. Guten Tag")
    spoken = spoken.replace(/\s*\/\s*/g, '. ');

    // 5. Clean arrows and dashes (e.g. "Wer ist das? -> Das ist Selina." -> "Wer ist das? Das ist Selina.")
    spoken = spoken.replace(/->|&rarr;|→/g, '. ');

    // 6. Clean ellipses (e.g. "Ich heiße..." -> "Ich heiße", "0650 - 32 ..." -> "0650 - 32")
    spoken = spoken.replace(/\.{2,}|…/g, ' ');

    // 7. Remove stray quotes and backslashes
    spoken = spoken.replace(/\\"/g, '').replace(/["']/g, '');

    // 8. Collapse multiple whitespace
    spoken = spoken.replace(/\s+/g, ' ').trim();

    return spoken;
  }

  window.playGermanSpeech = function(text, triggerBtn = null) {
    const spoken = cleanGermanTextForSpeech(text);
    if (!spoken) return;

    // Visual feedback on button if provided
    if (triggerBtn && triggerBtn.classList) {
      triggerBtn.classList.add('audio-playing-pulse');
      setTimeout(() => triggerBtn.classList.remove('audio-playing-pulse'), 1600);
    }

    // Stop any previously playing audio
    if (activeAudioObj) {
      try {
        activeAudioObj.pause();
        activeAudioObj.currentTime = 0;
      } catch (e) {}
      activeAudioObj = null;
    }
    if (synth) {
      try { synth.cancel(); } catch (e) {}
    }

    let hasStartedPlaying = false;
    let fallbackTimer = null;

    const executeFallback = () => {
      if (hasStartedPlaying) return;
      hasStartedPlaying = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (activeAudioObj) {
        try { activeAudioObj.pause(); } catch (e) {}
        activeAudioObj = null;
      }
      playSpeechSynthesisFallback(spoken, triggerBtn);
    };

    // If text is long (>140 chars), Google Translate TTS may reject or delay. Use SpeechSynthesis directly.
    if (spoken.length > 140) {
      playSpeechSynthesisFallback(spoken, triggerBtn);
      return;
    }

    // Dual-strategy with fast 1200ms fallback safety timer
    fallbackTimer = setTimeout(executeFallback, 1200);

    try {
      const encoded = encodeURIComponent(spoken);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=de&q=${encoded}`;
      const audio = new Audio();
      audio.referrerPolicy = "no-referrer";
      audio.src = audioUrl;
      audio.playbackRate = window.ttsCurrentSpeed || 1.0;
      activeAudioObj = audio;

      audio.onplaying = () => {
        hasStartedPlaying = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          executeFallback();
        });
      }

      audio.onended = () => {
        if (triggerBtn && triggerBtn.classList) triggerBtn.classList.remove('audio-playing-pulse');
        activeAudioObj = null;
      };
      audio.onerror = () => {
        executeFallback();
      };
    } catch (e) {
      executeFallback();
    }
  };

  function playSpeechSynthesisFallback(spoken, triggerBtn) {
    if (!synth) {
      if (triggerBtn && triggerBtn.classList) triggerBtn.classList.remove('audio-playing-pulse');
      return;
    }
    try {
      if (synth.paused) synth.resume();
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.lang = 'de-DE';
      utterance.rate = (window.ttsCurrentSpeed === 0.8) ? 0.75 : 0.88;
      
      const voices = synth.getVoices() || [];
      // Prioritize natural high-quality German human voices over robotic synthesizers
      const naturalGermanVoice = voices.find(v => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        return (lang.startsWith('de') || lang.includes('german')) &&
               (name.includes('google') || name.includes('natural') || name.includes('hedda') || name.includes('katja') || name.includes('stefan') || name.includes('anna') || name.includes('marlene') || name.includes('vicki') || name.includes('hans') || name.includes('martin'));
      }) || voices.find(v => (v.lang || '').toLowerCase().startsWith('de')) || germanVoice;

      if (naturalGermanVoice) {
        utterance.voice = naturalGermanVoice;
      }

      utterance.onend = () => {
        if (triggerBtn && triggerBtn.classList) triggerBtn.classList.remove('audio-playing-pulse');
      };
      utterance.onerror = () => {
        if (triggerBtn && triggerBtn.classList) triggerBtn.classList.remove('audio-playing-pulse');
      };

      synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis fallback failed:", e);
      if (triggerBtn && triggerBtn.classList) triggerBtn.classList.remove('audio-playing-pulse');
    }
  }

  // ================= 2. ROOT HTML FONT SIZE SCALER (VISIBLY SCALES ALL REM UNITS!) =================
  const FONT_SCALES = [
    { label: '90%', scale: 0.92 },
    { label: '100%', scale: 1.00 },
    { label: '110%', scale: 1.10 }, // default comfortably larger
    { label: '125%', scale: 1.25 },
    { label: '140%', scale: 1.40 },
    { label: '160%', scale: 1.60 }
  ];
  let currentFontScaleIndex = 2; // default: 110%

  function initFontSize() {
    const saved = localStorage.getItem(FONT_STORAGE_KEY);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (idx >= 0 && idx < FONT_SCALES.length) currentFontScaleIndex = idx;
    }
    applyFontSize();
  }

  function applyFontSize() {
    const item = FONT_SCALES[currentFontScaleIndex];
    document.documentElement.style.setProperty('--app-font-scale', item.scale);
    const label = document.getElementById('fontScaleLabel');
    if (label) label.textContent = item.label;
    localStorage.setItem(FONT_STORAGE_KEY, currentFontScaleIndex);
  }

  window.changeFontSize = function(delta) {
    currentFontScaleIndex = Math.max(0, Math.min(FONT_SCALES.length - 1, currentFontScaleIndex + delta));
    applyFontSize();
  };

  // ================= 3. 40 RELAXING STUDY MUSIC TRACKS (2 CATEGORIES: 20 + 20) =================
  // CATEGORY 1: 20 Ambient Soundscapes & Nature
  const AMBIENT_TRACKS = [
    { id: 'waves', name: '1. Ocean Waves', icon: '🌊', desc: 'Rhythmic gentle sea surf swells', category: 'ambient' },
    { id: 'rain', name: '2. Peaceful Rain', icon: '🌧️', desc: 'Soft rain falling on a window pane', category: 'ambient' },
    { id: 'cafe', name: '3. Cozy Study Cafe', icon: '☕', desc: 'Warm ambient murmur with soothing rain', category: 'ambient' },
    { id: 'forest', name: '4. Forest Wind & Birds', icon: '🍃', desc: 'Whispering mountain breeze in pine trees', category: 'ambient' },
    { id: 'theta', name: '5. Deep Focus Theta (432Hz)', icon: '🌙', desc: 'Harmonic 432Hz drone for deep study flow', category: 'ambient' },
    { id: 'piano', name: '6. Lofi Ambient Chords', icon: '🎹', desc: 'Gentle neo-soul warm keyboard chords', category: 'ambient' },
    { id: 'space', name: '7. Celestial Space Dream', icon: '🌌', desc: 'Ethereal cosmic shimmer pads', category: 'ambient' },
    { id: 'stream', name: '8. Mountain Stream', icon: '💧', desc: 'Crystal clear brook with trickling water', category: 'ambient' },
    { id: 'fireplace', name: '9. Fireplace & Hearth', icon: '🪵', desc: 'Warm crackling fireplace embers', category: 'ambient' },
    { id: 'chimes', name: '10. Zen Wind Chimes', icon: '🎐', desc: 'Peaceful harmonic wind chimes', category: 'ambient' },
    { id: 'crickets', name: '11. Summer Meadow & Crickets', icon: '🦗', desc: 'Gentle evening crickets & warm breeze', category: 'ambient' },
    { id: 'thunder', name: '12. Distant Thunder & Rain', icon: '⛈️', desc: 'Soft rolling thunder and rain showers', category: 'ambient' },
    { id: 'lakeshore', name: '13. Gentle Lake Shore', icon: '🛶', desc: 'Serene freshwater ripples against pebbles', category: 'ambient' },
    { id: 'morningbirds', name: '14. Morning Birds & Dew', icon: '🕊️', desc: 'Fresh dawn breeze with chirping songbirds', category: 'ambient' },
    { id: 'blizzard', name: '15. Arctic Winter Wind', icon: '❄️', desc: 'Calming soft blizzard & ambient winter air', category: 'ambient' },
    { id: 'alpha', name: '16. Alpha Waves 10Hz Focus', icon: '🧠', desc: '10Hz binaural beats for deep memory retention', category: 'ambient' },
    { id: 'leaves', name: '17. Autumn Leaves & Breeze', icon: '🍂', desc: 'Rustling crisp leaves and gentle gusts', category: 'ambient' },
    { id: 'tinroof', name: '18. Rain on Tin Roof', icon: '☔', desc: 'Cozy resonant pitter-patter on roof tiles', category: 'ambient' },
    { id: 'deepocean', name: '19. Deep Oceanic Abyss', icon: '🐋', desc: 'Deep sub-surface oceanic resonance', category: 'ambient' },
    { id: 'singingbowl', name: '20. Tibetan Singing Bowl', icon: '🔔', desc: 'Harmonic singing bowl resonance 528Hz', category: 'ambient' }
  ];

  // CATEGORY 2: 20 Relaxing Instrumental Songs (Pure Music - No Vocals)
  const INSTRUMENTAL_SONGS = [
    { id: 'gymnopedie', name: '1. Gymnopédie No. 1', composer: 'Erik Satie', icon: '🎹', desc: 'Soothing French impressionist solo piano song', category: 'songs' },
    { id: 'clairdelune', name: '2. Clair de Lune', composer: 'Claude Debussy', icon: '🌙', desc: 'Gentle, romantic moonlight classical piano', category: 'songs' },
    { id: 'canon', name: '3. Canon in D', composer: 'Johann Pachelbel', icon: '🎶', desc: 'Uplifting baroque harmonies and flowing melody', category: 'songs' },
    { id: 'moonlight', name: '4. Moonlight Sonata', composer: 'L. v. Beethoven', icon: '🎹', desc: 'Calm rolling triplets & evocative melody', category: 'songs' },
    { id: 'lofisong', name: '5. Midnight Study Lofi', composer: 'Cheeya Studio', icon: '☕', desc: 'Warm Rhodes jazz chords & chill study beat', category: 'songs' },
    { id: 'nocturne', name: '6. Nocturne Op. 9 No. 2', composer: 'Frédéric Chopin', icon: '🌸', desc: 'Romantic, peaceful evening piano waltz', category: 'songs' },
    { id: 'guitar', name: '7. Sunset Acoustic Guitar', composer: 'Acoustic Solo', icon: '🎸', desc: 'Fingerpicked nylon acoustic guitar ballad', category: 'songs' },
    { id: 'riverflows', name: '8. River Flows in You', composer: 'Yiruma (Tribute)', icon: '💧', desc: 'Emotional, gentle neo-classical piano theme', category: 'songs' },
    { id: 'musicbox', name: '9. Starlight Music Box', composer: 'Celeste Bells', icon: '✨', desc: 'Dreamy, nostalgic chime & bells lullaby', category: 'songs' },
    { id: 'nuvole', name: '10. Nuvole Bianche', composer: 'Ludovico Einaudi', icon: '🍃', desc: 'Minimalist, inspiring modern piano theme', category: 'songs' },
    { id: 'bachminuet', name: '11. Minuet in G Major', composer: 'J.S. Bach', icon: '🎹', desc: 'Graceful baroque classical piano minuet', category: 'songs' },
    { id: 'mozartserenade', name: '12. Eine kleine Nachtmusik: Romanze', composer: 'W.A. Mozart', icon: '🎻', desc: 'Lyrical, tender classical evening romance', category: 'songs' },
    { id: 'schubertserenade', name: '13. Ständchen (Serenade)', composer: 'Franz Schubert', icon: '🎹', desc: 'Poetic, gentle melancholic classical melody', category: 'songs' },
    { id: 'rainybookstore', name: '14. Rainy Bookstore Lofi', composer: 'Cheeya Studio', icon: '☕', desc: 'Mellow Rhodes chords & gentle chillhop piano', category: 'songs' },
    { id: 'chopinprelude', name: '15. Prelude in E Minor Op. 28 No. 4', composer: 'Frédéric Chopin', icon: '🌸', desc: 'Deep emotional descending classical piano chords', category: 'songs' },
    { id: 'spanisheguitar', name: '16. Spanish Romance (Romanza)', composer: 'Acoustic Guitar', icon: '🎸', desc: 'Legendary classical Spanish acoustic guitar', category: 'songs' },
    { id: 'bachprelude', name: '17. Prelude in C Major BWV 846', composer: 'J.S. Bach', icon: '🎹', desc: 'Flowing, hypnotic classical piano arpeggios', category: 'songs' },
    { id: 'ghiblisummer', name: '18. Summer Memories', composer: 'Joe Hisaishi (Tribute)', icon: '🍃', desc: 'Warm, uplifting nostalgic studio piano melody', category: 'songs' },
    { id: 'schumann', name: '19. Träumerei (Dreaming)', composer: 'Robert Schumann', icon: '🎹', desc: 'Sweet, tender romantic classical lullaby', category: 'songs' },
    { id: 'brahmslullaby', name: '20. Brahms Lullaby', composer: 'Johannes Brahms', icon: '✨', desc: 'Pure German classical lullaby music box chime', category: 'songs' }
  ];

  const ALL_TRACKS = [...AMBIENT_TRACKS, ...INSTRUMENTAL_SONGS];

  let currentMusicCategory = 'ambient'; // 'ambient' or 'songs'
  let audioCtx = null;
  let masterGain = null;
  let activeMusicId = 'waves';
  let isMusicPlaying = false;
  let currentSoundNodes = [];
  let musicIntervalId = null;
  let songBeatTimeouts = [];
  let musicVol = 0.35;

  const NOTE_FREQS = {
    'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'Ab2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F#6': 1479.98, 'G6': 1567.98, 'A6': 1760.00, 'B6': 1975.53
  };

  // 10 Instrumental Songs Score Data (Continuous seamless musical loops)
  const SONG_DEFINITIONS = {
    // 1. Erik Satie: Gymnopédie No. 1 (3/4 time)
    gymnopedie: {
      bpm: 62,
      lengthBeats: 36,
      notes: [
        // Measure 1-2 (Gmaj7)
        ['piano', 'G2', 0, 2.0, 0.45], ['piano', 'B3', 1, 1.8, 0.28], ['piano', 'D4', 1, 1.8, 0.28], ['piano', 'F#4', 1, 1.8, 0.28],
        ['piano', 'B3', 2, 1.8, 0.28], ['piano', 'D4', 2, 1.8, 0.28], ['piano', 'F#4', 2, 1.8, 0.28],
        // Measure 2 (Dmaj7)
        ['piano', 'D3', 3, 2.0, 0.45], ['piano', 'F#3', 4, 1.8, 0.28], ['piano', 'A3', 4, 1.8, 0.28], ['piano', 'C#4', 4, 1.8, 0.28],
        ['piano', 'F#3', 5, 1.8, 0.28], ['piano', 'A3', 5, 1.8, 0.28], ['piano', 'C#4', 5, 1.8, 0.28],
        // Measure 3-4 (Gmaj7)
        ['piano', 'G2', 6, 2.0, 0.45], ['piano', 'B3', 7, 1.8, 0.28], ['piano', 'D4', 7, 1.8, 0.28], ['piano', 'F#4', 7, 1.8, 0.28],
        ['piano', 'B3', 8, 1.8, 0.28], ['piano', 'D4', 8, 1.8, 0.28], ['piano', 'F#4', 8, 1.8, 0.28],
        // Measure 4 (Dmaj7)
        ['piano', 'D3', 9, 2.0, 0.45], ['piano', 'F#3', 10, 1.8, 0.28], ['piano', 'A3', 10, 1.8, 0.28], ['piano', 'C#4', 10, 1.8, 0.28],
        ['piano', 'F#3', 11, 1.8, 0.28], ['piano', 'A3', 11, 1.8, 0.28], ['piano', 'C#4', 11, 1.8, 0.28],
        // Measure 5-8
        ['piano', 'G2', 12, 2.0, 0.45], ['piano', 'B3', 13, 1.8, 0.28], ['piano', 'D4', 13, 1.8, 0.28], ['piano', 'F#4', 13, 1.8, 0.28],
        ['piano', 'D3', 15, 2.0, 0.45], ['piano', 'F#3', 16, 1.8, 0.28], ['piano', 'A3', 16, 1.8, 0.28], ['piano', 'C#4', 16, 1.8, 0.28],
        ['piano', 'G2', 18, 2.0, 0.45], ['piano', 'B3', 19, 1.8, 0.28], ['piano', 'D4', 19, 1.8, 0.28], ['piano', 'F#4', 19, 1.8, 0.28],
        ['piano', 'D3', 21, 2.0, 0.45], ['piano', 'F#3', 22, 1.8, 0.28], ['piano', 'A3', 22, 1.8, 0.28], ['piano', 'C#4', 22, 1.8, 0.28],
        ['piano', 'G2', 24, 2.0, 0.45], ['piano', 'B3', 25, 1.8, 0.28], ['piano', 'D4', 25, 1.8, 0.28], ['piano', 'F#4', 25, 1.8, 0.28],
        ['piano', 'D3', 27, 2.0, 0.45], ['piano', 'F#3', 28, 1.8, 0.28], ['piano', 'A3', 28, 1.8, 0.28], ['piano', 'C#4', 28, 1.8, 0.28],
        ['piano', 'G2', 30, 2.0, 0.45], ['piano', 'B3', 31, 1.8, 0.28], ['piano', 'D4', 31, 1.8, 0.28], ['piano', 'F#4', 31, 1.8, 0.28],
        ['piano', 'D3', 33, 2.0, 0.45], ['piano', 'F#3', 34, 1.8, 0.28], ['piano', 'A3', 34, 1.8, 0.28], ['piano', 'C#4', 34, 1.8, 0.28],

        // Unmistakable Gymnopédie Melody
        ['piano', 'F#4', 3, 2.8, 0.65],
        ['piano', 'E4', 6, 0.9, 0.55], ['piano', 'D4', 7, 0.9, 0.55], ['piano', 'B3', 8, 0.9, 0.55],
        ['piano', 'C4', 9, 1.8, 0.60], ['piano', 'D4', 11, 0.9, 0.55],
        ['piano', 'E4', 12, 1.8, 0.60], ['piano', 'B3', 14, 0.9, 0.55],
        ['piano', 'D4', 15, 2.8, 0.60],
        ['piano', 'A3', 18, 2.8, 0.55],
        ['piano', 'F#4', 21, 2.8, 0.65],
        ['piano', 'E4', 24, 0.9, 0.55], ['piano', 'D4', 25, 0.9, 0.55], ['piano', 'B3', 26, 0.9, 0.55],
        ['piano', 'C4', 27, 1.8, 0.60], ['piano', 'D4', 29, 0.9, 0.55],
        ['piano', 'B3', 30, 2.8, 0.60],
        ['piano', 'A3', 33, 2.8, 0.55]
      ]
    },

    // 2. Claude Debussy: Clair de Lune
    clairdelune: {
      bpm: 52,
      lengthBeats: 32,
      notes: [
        // Db major harmonies
        ['piano', 'Db2', 0, 7.5, 0.45], ['piano', 'F3', 1, 3.0, 0.25], ['piano', 'Ab3', 1, 3.0, 0.25], ['piano', 'Db4', 2, 3.0, 0.30],
        ['piano', 'Gb2', 8, 7.5, 0.45], ['piano', 'Gb3', 9, 3.0, 0.25], ['piano', 'Bb3', 9, 3.0, 0.25], ['piano', 'Db4', 10, 3.0, 0.30],
        ['piano', 'Db2', 16, 7.5, 0.45], ['piano', 'F3', 17, 3.0, 0.25], ['piano', 'Ab3', 17, 3.0, 0.25], ['piano', 'C4', 18, 3.0, 0.30],
        ['piano', 'Ab2', 24, 7.5, 0.45], ['piano', 'Eb3', 25, 3.0, 0.25], ['piano', 'C4', 25, 3.0, 0.25], ['piano', 'Eb4', 26, 3.0, 0.30],

        // Poetic Moonlight Melody
        ['piano', 'F4', 0, 1.8, 0.65], ['piano', 'Eb4', 2, 0.9, 0.55], ['piano', 'Db4', 3, 1.8, 0.60], ['piano', 'C4', 5, 0.9, 0.50],
        ['piano', 'Bb3', 6, 1.8, 0.55], ['piano', 'Ab3', 8, 1.8, 0.55], ['piano', 'F3', 10, 2.8, 0.50], ['piano', 'Ab3', 13, 0.9, 0.50],
        ['piano', 'Db4', 14, 2.8, 0.65], ['piano', 'Eb4', 17, 1.8, 0.60], ['piano', 'F4', 19, 2.8, 0.65], ['piano', 'Ab4', 22, 1.8, 0.60],
        ['piano', 'C5', 24, 2.8, 0.65], ['piano', 'Bb4', 27, 1.8, 0.55], ['piano', 'Ab4', 29, 2.8, 0.55]
      ]
    },

    // 3. Johann Pachelbel: Canon in D
    canon: {
      bpm: 64,
      lengthBeats: 32,
      notes: [
        // Ground Bass
        ['piano', 'D2', 0, 3.8, 0.55], ['piano', 'A1', 4, 3.8, 0.55],
        ['piano', 'B1', 8, 3.8, 0.55], ['piano', 'F#1', 12, 3.8, 0.55],
        ['piano', 'G1', 16, 3.8, 0.55], ['piano', 'D2', 20, 3.8, 0.55],
        ['piano', 'G1', 24, 3.8, 0.55], ['piano', 'A1', 28, 3.8, 0.55],

        // Middle harmony arpeggios
        ['piano', 'F#3', 1, 2.0, 0.30], ['piano', 'A3', 2, 2.0, 0.30], ['piano', 'D4', 3, 2.0, 0.30],
        ['piano', 'E3', 5, 2.0, 0.30], ['piano', 'A3', 6, 2.0, 0.30], ['piano', 'C#4', 7, 2.0, 0.30],
        ['piano', 'D3', 9, 2.0, 0.30], ['piano', 'F#3', 10, 2.0, 0.30], ['piano', 'B3', 11, 2.0, 0.30],
        ['piano', 'C#3', 13, 2.0, 0.30], ['piano', 'F#3', 14, 2.0, 0.30], ['piano', 'A3', 15, 2.0, 0.30],
        ['piano', 'B2', 17, 2.0, 0.30], ['piano', 'D3', 18, 2.0, 0.30], ['piano', 'G3', 19, 2.0, 0.30],
        ['piano', 'A2', 21, 2.0, 0.30], ['piano', 'D3', 22, 2.0, 0.30], ['piano', 'F#3', 23, 2.0, 0.30],
        ['piano', 'B2', 25, 2.0, 0.30], ['piano', 'D3', 26, 2.0, 0.30], ['piano', 'G3', 27, 2.0, 0.30],
        ['piano', 'C#3', 29, 2.0, 0.30], ['piano', 'E3', 30, 2.0, 0.30], ['piano', 'A3', 31, 2.0, 0.30],

        // Soaring Canon Melody
        ['piano', 'F#4', 0, 3.8, 0.70], ['piano', 'E4', 4, 3.8, 0.70],
        ['piano', 'D4', 8, 3.8, 0.70], ['piano', 'C#4', 12, 3.8, 0.70],
        ['piano', 'B3', 16, 3.8, 0.65], ['piano', 'A3', 20, 3.8, 0.65],
        ['piano', 'B3', 24, 3.8, 0.65], ['piano', 'C#4', 28, 3.8, 0.65]
      ]
    },

    // 4. Beethoven: Moonlight Sonata (Adagio Sostenuto)
    moonlight: {
      bpm: 54,
      lengthBeats: 32,
      notes: [
        // Bass octaves
        ['piano', 'C#2', 0, 7.8, 0.50], ['piano', 'B1', 8, 7.8, 0.50],
        ['piano', 'A1', 16, 7.8, 0.50], ['piano', 'G#1', 24, 7.8, 0.50],

        // Rolling triplet arpeggios (G#-C#-E)
        ['piano', 'G#2', 0, 0.8, 0.22], ['piano', 'C#3', 0.33, 0.8, 0.22], ['piano', 'E3', 0.66, 0.8, 0.22],
        ['piano', 'G#2', 1, 0.8, 0.22], ['piano', 'C#3', 1.33, 0.8, 0.22], ['piano', 'E3', 1.66, 0.8, 0.22],
        ['piano', 'G#2', 2, 0.8, 0.22], ['piano', 'C#3', 2.33, 0.8, 0.22], ['piano', 'E3', 2.66, 0.8, 0.22],
        ['piano', 'G#2', 3, 0.8, 0.22], ['piano', 'C#3', 3.33, 0.8, 0.22], ['piano', 'E3', 3.66, 0.8, 0.22],

        ['piano', 'G#2', 8, 0.8, 0.22], ['piano', 'B2', 8.33, 0.8, 0.22], ['piano', 'E3', 8.66, 0.8, 0.22],
        ['piano', 'G#2', 9, 0.8, 0.22], ['piano', 'B2', 9.33, 0.8, 0.22], ['piano', 'E3', 9.66, 0.8, 0.22],

        ['piano', 'A2', 16, 0.8, 0.22], ['piano', 'C#3', 16.33, 0.8, 0.22], ['piano', 'E3', 16.66, 0.8, 0.22],
        ['piano', 'A2', 17, 0.8, 0.22], ['piano', 'C#3', 17.33, 0.8, 0.22], ['piano', 'E3', 17.66, 0.8, 0.22],

        ['piano', 'G#2', 24, 0.8, 0.22], ['piano', 'C#3', 24.33, 0.8, 0.22], ['piano', 'D#3', 24.66, 0.8, 0.22],
        ['piano', 'G#2', 25, 0.8, 0.22], ['piano', 'C#3', 25.33, 0.8, 0.22], ['piano', 'D#3', 25.66, 0.8, 0.22],

        // Evocative Moonlight Theme
        ['piano', 'G#3', 3, 2.5, 0.65], ['piano', 'G#3', 5.5, 0.4, 0.50], ['piano', 'G#3', 6, 1.4, 0.60], ['piano', 'A3', 7.5, 0.4, 0.50],
        ['piano', 'G#3', 8, 2.8, 0.65], ['piano', 'F#3', 11, 0.9, 0.55],
        ['piano', 'E3', 12, 1.8, 0.60], ['piano', 'D#3', 14, 1.8, 0.55],
        ['piano', 'C#3', 16, 3.8, 0.60], ['piano', 'G#3', 24, 3.8, 0.65]
      ]
    },

    // 5. Cheeya Studio: Midnight Study Lofi
    lofisong: {
      bpm: 68,
      lengthBeats: 32,
      notes: [
        // Warm Rhodes Jazz Chords (Dm9 -> G13 -> Cmaj9 -> A7b13)
        ['rhodes', 'D2', 0, 7.5, 0.45], ['rhodes', 'F3', 0, 7.5, 0.35], ['rhodes', 'A3', 0, 7.5, 0.35], ['rhodes', 'C4', 0, 7.5, 0.35], ['rhodes', 'E4', 0, 7.5, 0.35],
        ['rhodes', 'G1', 8, 7.5, 0.45], ['rhodes', 'F3', 8, 7.5, 0.35], ['rhodes', 'B3', 8, 7.5, 0.35], ['rhodes', 'E4', 8, 7.5, 0.35],
        ['rhodes', 'C2', 16, 7.5, 0.45], ['rhodes', 'E3', 16, 7.5, 0.35], ['rhodes', 'G3', 16, 7.5, 0.35], ['rhodes', 'B3', 16, 7.5, 0.35], ['rhodes', 'D4', 16, 7.5, 0.35],
        ['rhodes', 'A1', 24, 7.5, 0.45], ['rhodes', 'G3', 24, 7.5, 0.35], ['rhodes', 'C#4', 24, 7.5, 0.35], ['rhodes', 'F4', 24, 7.5, 0.35],

        // Relaxing Lofi Piano Melody Hook
        ['piano', 'E4', 2, 1.4, 0.55], ['piano', 'G4', 3.5, 1.4, 0.60], ['piano', 'A4', 5, 2.5, 0.65],
        ['piano', 'B4', 10, 0.9, 0.55], ['piano', 'A4', 11, 0.9, 0.55], ['piano', 'G4', 12, 1.8, 0.60], ['piano', 'E4', 14, 1.8, 0.55],
        ['piano', 'D4', 18, 1.4, 0.55], ['piano', 'E4', 19.5, 1.4, 0.60], ['piano', 'G4', 21, 2.5, 0.65],
        ['piano', 'E4', 26, 1.8, 0.60], ['piano', 'D4', 28, 1.8, 0.55], ['piano', 'C4', 30, 2.8, 0.60]
      ]
    },

    // 6. Frédéric Chopin: Nocturne Op. 9 No. 2
    nocturne: {
      bpm: 58,
      lengthBeats: 32,
      notes: [
        // Eb major bass & waltz accompaniment
        ['piano', 'Eb2', 0, 3.8, 0.45], ['piano', 'G3', 1, 1.5, 0.25], ['piano', 'Bb3', 1, 1.5, 0.25], ['piano', 'Eb4', 1, 1.5, 0.25],
        ['piano', 'G3', 2.5, 1.5, 0.25], ['piano', 'Bb3', 2.5, 1.5, 0.25], ['piano', 'Eb4', 2.5, 1.5, 0.25],

        ['piano', 'C2', 4, 3.8, 0.45], ['piano', 'G3', 5, 1.5, 0.25], ['piano', 'C4', 5, 1.5, 0.25], ['piano', 'Eb4', 5, 1.5, 0.25],
        ['piano', 'Ab1', 8, 3.8, 0.45], ['piano', 'Ab3', 9, 1.5, 0.25], ['piano', 'C4', 9, 1.5, 0.25], ['piano', 'Eb4', 9, 1.5, 0.25],
        ['piano', 'Bb1', 12, 3.8, 0.45], ['piano', 'F3', 13, 1.5, 0.25], ['piano', 'Ab3', 13, 1.5, 0.25], ['piano', 'D4', 13, 1.5, 0.25],

        ['piano', 'Eb2', 16, 3.8, 0.45], ['piano', 'G3', 17, 1.5, 0.25], ['piano', 'Bb3', 17, 1.5, 0.25],
        ['piano', 'C2', 20, 3.8, 0.45], ['piano', 'G3', 21, 1.5, 0.25], ['piano', 'C4', 21, 1.5, 0.25],
        ['piano', 'F1', 24, 3.8, 0.45], ['piano', 'Ab3', 25, 1.5, 0.25], ['piano', 'C4', 25, 1.5, 0.25],
        ['piano', 'Bb1', 28, 3.8, 0.45], ['piano', 'F3', 29, 1.5, 0.25], ['piano', 'D4', 29, 1.5, 0.25],

        // Famous Romantic Nocturne Melody
        ['piano', 'Bb3', 0.5, 0.9, 0.55], ['piano', 'G4', 1.5, 2.4, 0.70], ['piano', 'F4', 4, 0.8, 0.55],
        ['piano', 'Eb4', 5, 1.8, 0.65], ['piano', 'Bb3', 7, 0.9, 0.55],
        ['piano', 'C4', 8, 1.4, 0.60], ['piano', 'Bb3', 9.5, 0.9, 0.55], ['piano', 'Ab3', 10.5, 0.9, 0.55],
        ['piano', 'G3', 12, 2.8, 0.60],
        ['piano', 'Bb3', 16.5, 0.9, 0.55], ['piano', 'G4', 17.5, 2.4, 0.70], ['piano', 'F4', 20, 0.8, 0.55],
        ['piano', 'Eb4', 21, 1.8, 0.65], ['piano', 'Bb3', 23, 0.9, 0.55],
        ['piano', 'C4', 24, 1.4, 0.60], ['piano', 'D4', 26, 1.4, 0.60], ['piano', 'Eb4', 28, 3.5, 0.65]
      ]
    },

    // 7. Acoustic Sunset Guitar (Fingerpicked Ballad)
    guitar: {
      bpm: 70,
      lengthBeats: 32,
      notes: [
        // Em -> C -> G -> D/F# fingerpicking pattern
        ['guitar', 'E2', 0, 3.0, 0.45], ['guitar', 'B2', 0.5, 2.0, 0.35], ['guitar', 'E3', 1, 2.0, 0.35], ['guitar', 'G3', 1.5, 2.0, 0.40],
        ['guitar', 'B3', 2, 2.0, 0.45], ['guitar', 'G3', 2.5, 2.0, 0.35], ['guitar', 'E3', 3, 2.0, 0.35], ['guitar', 'B2', 3.5, 2.0, 0.35],

        ['guitar', 'C2', 4, 3.0, 0.45], ['guitar', 'G2', 4.5, 2.0, 0.35], ['guitar', 'C3', 5, 2.0, 0.35], ['guitar', 'E3', 5.5, 2.0, 0.40],
        ['guitar', 'G3', 6, 2.0, 0.45], ['guitar', 'E3', 6.5, 2.0, 0.35], ['guitar', 'C3', 7, 2.0, 0.35], ['guitar', 'G2', 7.5, 2.0, 0.35],

        ['guitar', 'G1', 8, 3.0, 0.45], ['guitar', 'D2', 8.5, 2.0, 0.35], ['guitar', 'G2', 9, 2.0, 0.35], ['guitar', 'B2', 9.5, 2.0, 0.40],
        ['guitar', 'D3', 10, 2.0, 0.45], ['guitar', 'B2', 10.5, 2.0, 0.35], ['guitar', 'G2', 11, 2.0, 0.35], ['guitar', 'D2', 11.5, 2.0, 0.35],

        ['guitar', 'F#1', 12, 3.0, 0.45], ['guitar', 'D2', 12.5, 2.0, 0.35], ['guitar', 'A2', 13, 2.0, 0.35], ['guitar', 'D3', 13.5, 2.0, 0.40],
        ['guitar', 'F#3', 14, 2.0, 0.45], ['guitar', 'D3', 14.5, 2.0, 0.35], ['guitar', 'A2', 15, 2.0, 0.35], ['guitar', 'D2', 15.5, 2.0, 0.35],

        // Acoustic Melody Top Line
        ['guitar', 'B3', 16, 1.8, 0.65], ['guitar', 'A3', 18, 0.9, 0.55], ['guitar', 'G3', 19, 0.9, 0.55],
        ['guitar', 'E3', 20, 2.8, 0.60], ['guitar', 'G3', 23, 0.9, 0.55],
        ['guitar', 'A3', 24, 1.8, 0.65], ['guitar', 'B3', 26, 1.8, 0.70], ['guitar', 'D4', 28, 3.8, 0.75]
      ]
    },

    // 8. Yiruma Tribute: River Flows in You
    riverflows: {
      bpm: 64,
      lengthBeats: 32,
      notes: [
        // F#m -> D -> A -> E arpeggios
        ['piano', 'F#2', 0, 7.5, 0.45], ['piano', 'C#3', 0.5, 3.0, 0.25], ['piano', 'F#3', 1, 3.0, 0.25], ['piano', 'A3', 1.5, 3.0, 0.30],
        ['piano', 'D2', 8, 7.5, 0.45], ['piano', 'A2', 8.5, 3.0, 0.25], ['piano', 'D3', 9, 3.0, 0.25], ['piano', 'F#3', 9.5, 3.0, 0.30],
        ['piano', 'A1', 16, 7.5, 0.45], ['piano', 'E2', 16.5, 3.0, 0.25], ['piano', 'A2', 17, 3.0, 0.25], ['piano', 'C#3', 17.5, 3.0, 0.30],
        ['piano', 'E2', 24, 7.5, 0.45], ['piano', 'B2', 24.5, 3.0, 0.25], ['piano', 'E3', 25, 3.0, 0.25], ['piano', 'G#3', 25.5, 3.0, 0.30],

        // Flowing Neo-classical Melody
        ['piano', 'A4', 1, 0.9, 0.60], ['piano', 'G#4', 2, 0.9, 0.55], ['piano', 'A4', 3, 1.8, 0.65],
        ['piano', 'E4', 5, 2.5, 0.65], ['piano', 'A4', 7.5, 0.9, 0.55],
        ['piano', 'C#5', 9, 0.9, 0.65], ['piano', 'B4', 10, 0.9, 0.55], ['piano', 'A4', 11, 0.9, 0.60],
        ['piano', 'G#4', 12, 0.9, 0.55], ['piano', 'A4', 13, 2.8, 0.65],
        ['piano', 'B4', 17, 1.8, 0.60], ['piano', 'C#5', 19, 1.8, 0.65], ['piano', 'B4', 21, 2.8, 0.60],
        ['piano', 'A4', 25, 1.8, 0.60], ['piano', 'G#4', 27, 1.8, 0.55], ['piano', 'A4', 29, 2.8, 0.65]
      ]
    },

    // 9. Starlight Music Box (Celeste & Chimes)
    musicbox: {
      bpm: 72,
      lengthBeats: 24,
      notes: [
        // Bell Bass
        ['musicbox', 'C4', 0, 2.8, 0.40], ['musicbox', 'G3', 6, 2.8, 0.40],
        ['musicbox', 'F3', 12, 2.8, 0.40], ['musicbox', 'G3', 18, 2.8, 0.40],

        // Crystalline Music Box Melody
        ['musicbox', 'C5', 0, 1.2, 0.65], ['musicbox', 'E5', 1, 1.2, 0.65], ['musicbox', 'G5', 2, 1.2, 0.65],
        ['musicbox', 'C6', 3, 1.8, 0.70], ['musicbox', 'B5', 5, 0.9, 0.55],
        ['musicbox', 'A5', 6, 1.2, 0.65], ['musicbox', 'G5', 7, 1.2, 0.60], ['musicbox', 'E5', 8, 1.2, 0.60],
        ['musicbox', 'D5', 9, 2.5, 0.60],
        ['musicbox', 'F5', 12, 1.2, 0.65], ['musicbox', 'A5', 13, 1.2, 0.65], ['musicbox', 'C6', 14, 1.2, 0.70],
        ['musicbox', 'B5', 15, 1.8, 0.65], ['musicbox', 'G5', 17, 0.9, 0.55],
        ['musicbox', 'E5', 18, 1.2, 0.60], ['musicbox', 'D5', 19, 1.2, 0.60], ['musicbox', 'C5', 20, 3.5, 0.65]
      ]
    },

    // 10. Ludovico Einaudi: Nuvole Bianche (Tribute)
    nuvole: {
      bpm: 60,
      lengthBeats: 32,
      notes: [
        // Fm -> Db -> Ab -> Eb Minimalist Bass
        ['piano', 'F2', 0, 7.8, 0.50], ['piano', 'Db2', 8, 7.8, 0.50],
        ['piano', 'Ab1', 16, 7.8, 0.50], ['piano', 'Eb2', 24, 7.8, 0.50],

        // Minimalist Piano Ostinato
        ['piano', 'C4', 0, 0.9, 0.50], ['piano', 'Ab3', 1, 0.9, 0.40], ['piano', 'C4', 2, 0.9, 0.50], ['piano', 'Ab3', 3, 0.9, 0.40],
        ['piano', 'C4', 4, 0.9, 0.50], ['piano', 'Ab3', 5, 0.9, 0.40], ['piano', 'C4', 6, 0.9, 0.50], ['piano', 'Ab3', 7, 0.9, 0.40],

        ['piano', 'Db4', 8, 0.9, 0.50], ['piano', 'Ab3', 9, 0.9, 0.40], ['piano', 'Db4', 10, 0.9, 0.50], ['piano', 'Ab3', 11, 0.9, 0.40],
        ['piano', 'Db4', 12, 0.9, 0.50], ['piano', 'Ab3', 13, 0.9, 0.40], ['piano', 'Db4', 14, 0.9, 0.50], ['piano', 'Ab3', 15, 0.9, 0.40],

        ['piano', 'C4', 16, 0.9, 0.50], ['piano', 'Eb3', 17, 0.9, 0.40], ['piano', 'C4', 18, 0.9, 0.50], ['piano', 'Eb3', 19, 0.9, 0.40],
        ['piano', 'C4', 20, 0.9, 0.50], ['piano', 'Eb3', 21, 0.9, 0.40], ['piano', 'C4', 22, 0.9, 0.50], ['piano', 'Eb3', 23, 0.9, 0.40],

        ['piano', 'Bb3', 24, 0.9, 0.50], ['piano', 'Eb3', 25, 0.9, 0.40], ['piano', 'Bb3', 26, 0.9, 0.50], ['piano', 'Eb3', 27, 0.9, 0.40],
        ['piano', 'Bb3', 28, 0.9, 0.50], ['piano', 'Eb3', 29, 0.9, 0.40], ['piano', 'Bb3', 30, 0.9, 0.50], ['piano', 'Eb3', 31, 0.9, 0.40],

        // High emotional piano singing tone
        ['piano', 'F4', 4, 3.0, 0.65], ['piano', 'Ab4', 12, 3.0, 0.65],
        ['piano', 'Eb4', 20, 3.0, 0.65], ['piano', 'G4', 28, 3.0, 0.65]
      ]
    },

    // 11. J.S. Bach: Minuet in G Major (BWV Anh. 114)
    bachminuet: {
      bpm: 76,
      lengthBeats: 36,
      notes: [
        ['piano', 'G3', 0, 2.5, 0.45], ['piano', 'B3', 1, 1.5, 0.25], ['piano', 'D4', 2, 1.5, 0.25],
        ['piano', 'D5', 0, 1.0, 0.65], ['piano', 'G4', 1, 0.5, 0.55], ['piano', 'A4', 1.5, 0.5, 0.55], ['piano', 'B4', 2, 0.5, 0.55], ['piano', 'C5', 2.5, 0.5, 0.55],
        ['piano', 'B2', 3, 2.5, 0.45],
        ['piano', 'D5', 3, 1.0, 0.65], ['piano', 'G4', 4, 1.0, 0.55], ['piano', 'G4', 5, 1.0, 0.55],
        ['piano', 'C3', 6, 2.5, 0.45], ['piano', 'E3', 7, 1.5, 0.25], ['piano', 'G3', 8, 1.5, 0.25],
        ['piano', 'E5', 6, 1.0, 0.65], ['piano', 'C5', 7, 0.5, 0.55], ['piano', 'D5', 7.5, 0.5, 0.55], ['piano', 'E5', 8, 0.5, 0.55], ['piano', 'F#5', 8.5, 0.5, 0.55],
        ['piano', 'B2', 9, 2.5, 0.45],
        ['piano', 'G5', 9, 1.0, 0.70], ['piano', 'G4', 10, 1.0, 0.55], ['piano', 'G4', 11, 1.0, 0.55],
        ['piano', 'A2', 12, 2.5, 0.45], ['piano', 'C3', 13, 1.5, 0.25], ['piano', 'E3', 14, 1.5, 0.25],
        ['piano', 'C5', 12, 1.0, 0.65], ['piano', 'D5', 13, 0.5, 0.55], ['piano', 'C5', 13.5, 0.5, 0.55], ['piano', 'B4', 14, 0.5, 0.55], ['piano', 'A4', 14.5, 0.5, 0.55],
        ['piano', 'G2', 15, 2.5, 0.45], ['piano', 'B2', 16, 1.5, 0.25], ['piano', 'D3', 17, 1.5, 0.25],
        ['piano', 'B4', 15, 1.0, 0.65], ['piano', 'C5', 16, 0.5, 0.55], ['piano', 'B4', 16.5, 0.5, 0.55], ['piano', 'A4', 17, 0.5, 0.55], ['piano', 'G4', 17.5, 0.5, 0.55],
        ['piano', 'D3', 18, 2.5, 0.45], ['piano', 'F#3', 19, 1.5, 0.25], ['piano', 'A3', 20, 1.5, 0.25],
        ['piano', 'F#4', 18, 1.0, 0.60], ['piano', 'G4', 19, 0.5, 0.55], ['piano', 'A4', 19.5, 0.5, 0.55], ['piano', 'B4', 20, 0.5, 0.55], ['piano', 'G4', 20.5, 0.5, 0.55],
        ['piano', 'D2', 21, 2.5, 0.45], ['piano', 'A4', 21, 2.5, 0.65],
        ['piano', 'G2', 24, 2.5, 0.45], ['piano', 'B4', 24, 1.0, 0.65], ['piano', 'C5', 25, 1.0, 0.65], ['piano', 'D5', 26, 1.0, 0.65],
        ['piano', 'C3', 27, 2.5, 0.45], ['piano', 'E5', 27, 1.0, 0.65], ['piano', 'D5', 28, 1.0, 0.65], ['piano', 'C5', 29, 1.0, 0.65],
        ['piano', 'D3', 30, 2.5, 0.45], ['piano', 'B4', 30, 1.0, 0.65], ['piano', 'A4', 31, 1.0, 0.65], ['piano', 'G4', 32, 2.8, 0.70]
      ]
    },

    // 12. W.A. Mozart: Eine kleine Nachtmusik (Romanze)
    mozartserenade: {
      bpm: 66,
      lengthBeats: 32,
      notes: [
        ['piano', 'C3', 0, 3.8, 0.45], ['piano', 'E3', 1, 1.8, 0.25], ['piano', 'G3', 2, 1.8, 0.25], ['piano', 'E3', 3, 1.8, 0.25],
        ['piano', 'F3', 4, 3.8, 0.45], ['piano', 'A3', 5, 1.8, 0.25], ['piano', 'C4', 6, 1.8, 0.25], ['piano', 'A3', 7, 1.8, 0.25],
        ['piano', 'G2', 8, 3.8, 0.45], ['piano', 'D3', 9, 1.8, 0.25], ['piano', 'F3', 10, 1.8, 0.25], ['piano', 'B3', 11, 1.8, 0.25],
        ['piano', 'C3', 12, 3.8, 0.45], ['piano', 'E3', 13, 1.8, 0.25], ['piano', 'G3', 14, 1.8, 0.25], ['piano', 'E3', 15, 1.8, 0.25],
        ['piano', 'G4', 0, 1.8, 0.65], ['piano', 'E4', 2, 1.8, 0.60],
        ['piano', 'A4', 4, 1.8, 0.65], ['piano', 'F4', 6, 1.8, 0.60],
        ['piano', 'D4', 8, 0.9, 0.55], ['piano', 'E4', 9, 0.9, 0.55], ['piano', 'F4', 10, 0.9, 0.55], ['piano', 'D4', 11, 0.9, 0.55],
        ['piano', 'C4', 12, 2.8, 0.65], ['piano', 'G4', 15, 0.9, 0.55],
        ['piano', 'E5', 16, 1.8, 0.70], ['piano', 'D5', 18, 0.9, 0.60], ['piano', 'C5', 19, 0.9, 0.60],
        ['piano', 'B4', 20, 1.8, 0.65], ['piano', 'A4', 22, 1.8, 0.60],
        ['piano', 'G4', 24, 2.5, 0.65], ['piano', 'B4', 26.5, 0.9, 0.60],
        ['piano', 'C5', 28, 3.5, 0.70]
      ]
    },

    // 13. Franz Schubert: Ständchen (Serenade)
    schubertserenade: {
      bpm: 62,
      lengthBeats: 36,
      notes: [
        ['piano', 'D2', 0, 2.8, 0.45], ['piano', 'F3', 1, 1.5, 0.25], ['piano', 'A3', 1, 1.5, 0.25], ['piano', 'D4', 2, 1.5, 0.25],
        ['piano', 'D2', 3, 2.8, 0.45], ['piano', 'F3', 4, 1.5, 0.25], ['piano', 'A3', 4, 1.5, 0.25], ['piano', 'D4', 5, 1.5, 0.25],
        ['piano', 'G2', 6, 2.8, 0.45], ['piano', 'Bb3', 7, 1.5, 0.25], ['piano', 'D4', 7, 1.5, 0.25], ['piano', 'G4', 8, 1.5, 0.25],
        ['piano', 'A2', 9, 2.8, 0.45], ['piano', 'E3', 10, 1.5, 0.25], ['piano', 'G3', 10, 1.5, 0.25], ['piano', 'C#4', 11, 1.5, 0.25],
        ['piano', 'D2', 12, 2.8, 0.45], ['piano', 'F3', 13, 1.5, 0.25], ['piano', 'A3', 13, 1.5, 0.25], ['piano', 'D4', 14, 1.5, 0.25],
        ['piano', 'A4', 1, 1.8, 0.65], ['piano', 'F4', 3, 1.8, 0.60], ['piano', 'D4', 5, 2.5, 0.60],
        ['piano', 'Bb4', 7, 1.8, 0.70], ['piano', 'G4', 9, 1.8, 0.60], ['piano', 'E4', 11, 2.5, 0.60],
        ['piano', 'F4', 13, 1.4, 0.60], ['piano', 'E4', 14.5, 0.9, 0.55], ['piano', 'D4', 15.5, 2.0, 0.60],
        ['piano', 'C#4', 18, 1.8, 0.60], ['piano', 'D4', 20, 1.8, 0.65], ['piano', 'E4', 22, 2.8, 0.65],
        ['piano', 'A4', 25, 2.0, 0.70], ['piano', 'F4', 27.5, 1.8, 0.60], ['piano', 'D4', 30, 4.0, 0.65]
      ]
    },

    // 14. Cheeya Studio: Rainy Bookstore Lofi
    rainybookstore: {
      bpm: 70,
      lengthBeats: 32,
      notes: [
        ['rhodes', 'F2', 0, 7.5, 0.40], ['rhodes', 'A3', 0, 7.5, 0.30], ['rhodes', 'C4', 0, 7.5, 0.30], ['rhodes', 'E4', 0, 7.5, 0.30], ['rhodes', 'G4', 0, 7.5, 0.30],
        ['rhodes', 'E2', 8, 7.5, 0.40], ['rhodes', 'G3', 8, 7.5, 0.30], ['rhodes', 'B3', 8, 7.5, 0.30], ['rhodes', 'D4', 8, 7.5, 0.30],
        ['rhodes', 'D2', 16, 7.5, 0.40], ['rhodes', 'F3', 16, 7.5, 0.30], ['rhodes', 'A3', 16, 7.5, 0.30], ['rhodes', 'C4', 16, 7.5, 0.30], ['rhodes', 'E4', 16, 7.5, 0.30],
        ['rhodes', 'C2', 24, 7.5, 0.40], ['rhodes', 'E3', 24, 7.5, 0.30], ['rhodes', 'G3', 24, 7.5, 0.30], ['rhodes', 'B3', 24, 7.5, 0.30], ['rhodes', 'D4', 24, 7.5, 0.30],
        ['piano', 'C5', 2, 1.5, 0.55], ['piano', 'B4', 4, 1.5, 0.55], ['piano', 'A4', 6, 1.8, 0.60],
        ['piano', 'G4', 10, 1.5, 0.55], ['piano', 'E4', 12, 1.5, 0.55], ['piano', 'D4', 14, 1.8, 0.60],
        ['piano', 'F4', 18, 1.4, 0.55], ['piano', 'A4', 20, 1.4, 0.55], ['piano', 'C5', 22, 1.8, 0.60],
        ['piano', 'B4', 26, 1.4, 0.55], ['piano', 'G4', 28, 1.4, 0.55], ['piano', 'C4', 30, 2.5, 0.60]
      ]
    },

    // 15. Frédéric Chopin: Prelude in E Minor Op. 28 No. 4
    chopinprelude: {
      bpm: 50,
      lengthBeats: 32,
      notes: [
        ['piano', 'E2', 0, 7.8, 0.45], ['piano', 'G3', 0, 1.8, 0.20], ['piano', 'B3', 0, 1.8, 0.20], ['piano', 'E4', 0, 1.8, 0.20],
        ['piano', 'G3', 2, 1.8, 0.20], ['piano', 'B3', 2, 1.8, 0.20], ['piano', 'E4', 2, 1.8, 0.20],
        ['piano', 'F#3', 4, 1.8, 0.20], ['piano', 'A3', 4, 1.8, 0.20], ['piano', 'D#4', 4, 1.8, 0.20],
        ['piano', 'F3', 6, 1.8, 0.20], ['piano', 'A3', 6, 1.8, 0.20], ['piano', 'D4', 6, 1.8, 0.20],
        ['piano', 'A1', 8, 7.8, 0.45], ['piano', 'E3', 8, 1.8, 0.20], ['piano', 'G3', 8, 1.8, 0.20], ['piano', 'C#4', 8, 1.8, 0.20],
        ['piano', 'D#3', 12, 1.8, 0.20], ['piano', 'F#3', 12, 1.8, 0.20], ['piano', 'C4', 12, 1.8, 0.20],
        ['piano', 'B1', 16, 7.8, 0.45], ['piano', 'D#3', 16, 1.8, 0.20], ['piano', 'F#3', 16, 1.8, 0.20], ['piano', 'B3', 16, 1.8, 0.20],
        ['piano', 'E2', 24, 7.8, 0.45], ['piano', 'E3', 24, 3.8, 0.25], ['piano', 'G3', 24, 3.8, 0.25], ['piano', 'B3', 24, 3.8, 0.25],
        ['piano', 'B4', 0, 3.5, 0.65], ['piano', 'C5', 4, 1.8, 0.65], ['piano', 'B4', 6, 1.8, 0.60],
        ['piano', 'Bb4', 8, 3.5, 0.65], ['piano', 'A4', 12, 3.5, 0.60],
        ['piano', 'G#4', 16, 3.5, 0.60], ['piano', 'A4', 20, 1.8, 0.60], ['piano', 'F#4', 22, 1.8, 0.55],
        ['piano', 'E4', 24, 7.0, 0.65]
      ]
    },

    // 16. Acoustic Solo: Spanish Romance (Romanza)
    spanisheguitar: {
      bpm: 72,
      lengthBeats: 36,
      notes: [
        ['guitar', 'E2', 0, 2.8, 0.50], ['guitar', 'B3', 0, 0.9, 0.30], ['guitar', 'G3', 0.5, 0.9, 0.30], ['guitar', 'E4', 1, 0.9, 0.65], ['guitar', 'B3', 1.5, 0.9, 0.30], ['guitar', 'E4', 2, 0.9, 0.65],
        ['guitar', 'E2', 3, 2.8, 0.50], ['guitar', 'B3', 3, 0.9, 0.30], ['guitar', 'G3', 3.5, 0.9, 0.30], ['guitar', 'E4', 4, 0.9, 0.65], ['guitar', 'D4', 4.5, 0.9, 0.60], ['guitar', 'C4', 5, 0.9, 0.60],
        ['guitar', 'A2', 6, 2.8, 0.50], ['guitar', 'C3', 6, 0.9, 0.30], ['guitar', 'E3', 6.5, 0.9, 0.30], ['guitar', 'B3', 7, 0.9, 0.65], ['guitar', 'B3', 7.5, 0.9, 0.65], ['guitar', 'B3', 8, 0.9, 0.65],
        ['guitar', 'A2', 9, 2.8, 0.50], ['guitar', 'C3', 9, 0.9, 0.30], ['guitar', 'E3', 9.5, 0.9, 0.30], ['guitar', 'C4', 10, 0.9, 0.60], ['guitar', 'D4', 10.5, 0.9, 0.60], ['guitar', 'E4', 11, 0.9, 0.65],
        ['guitar', 'E2', 12, 2.8, 0.50], ['guitar', 'B3', 12, 0.9, 0.30], ['guitar', 'G3', 12.5, 0.9, 0.30], ['guitar', 'B3', 13, 0.9, 0.65], ['guitar', 'A3', 14, 0.9, 0.60], ['guitar', 'G3', 14.5, 0.9, 0.55],
        ['guitar', 'B2', 15, 2.8, 0.50], ['guitar', 'D#3', 15, 0.9, 0.30], ['guitar', 'F#3', 15.5, 0.9, 0.30], ['guitar', 'F#3', 16, 0.9, 0.60], ['guitar', 'G3', 17, 0.9, 0.60], ['guitar', 'A3', 17.5, 0.9, 0.60],
        ['guitar', 'E2', 18, 5.5, 0.50], ['guitar', 'B2', 19, 2.5, 0.35], ['guitar', 'E3', 20, 2.5, 0.35], ['guitar', 'G3', 21, 2.5, 0.40], ['guitar', 'B3', 22, 2.5, 0.55], ['guitar', 'E4', 23, 4.0, 0.70]
      ]
    },

    // 17. J.S. Bach: Prelude in C Major (BWV 846)
    bachprelude: {
      bpm: 68,
      lengthBeats: 32,
      notes: [
        ['piano', 'C3', 0, 3.8, 0.45], ['piano', 'E3', 0.5, 1.8, 0.30], ['piano', 'G3', 1, 1.8, 0.30], ['piano', 'C4', 1.5, 1.8, 0.40], ['piano', 'E4', 2, 2.0, 0.50], ['piano', 'G3', 2.5, 1.5, 0.30], ['piano', 'C4', 3, 1.5, 0.40], ['piano', 'E4', 3.5, 2.0, 0.50],
        ['piano', 'C3', 4, 3.8, 0.45], ['piano', 'D3', 4.5, 1.8, 0.30], ['piano', 'A3', 5, 1.8, 0.30], ['piano', 'D4', 5.5, 1.8, 0.40], ['piano', 'F4', 6, 2.0, 0.50], ['piano', 'A3', 6.5, 1.5, 0.30], ['piano', 'D4', 7, 1.5, 0.40], ['piano', 'F4', 7.5, 2.0, 0.50],
        ['piano', 'B2', 8, 3.8, 0.45], ['piano', 'D3', 8.5, 1.8, 0.30], ['piano', 'G3', 9, 1.8, 0.30], ['piano', 'D4', 9.5, 1.8, 0.40], ['piano', 'F4', 10, 2.0, 0.50], ['piano', 'G3', 10.5, 1.5, 0.30], ['piano', 'D4', 11, 1.5, 0.40], ['piano', 'F4', 11.5, 2.0, 0.50],
        ['piano', 'C3', 12, 3.8, 0.45], ['piano', 'E3', 12.5, 1.8, 0.30], ['piano', 'G3', 13, 1.8, 0.30], ['piano', 'C4', 13.5, 1.8, 0.40], ['piano', 'E4', 14, 2.0, 0.50], ['piano', 'G3', 14.5, 1.5, 0.30], ['piano', 'C4', 15, 1.5, 0.40], ['piano', 'E4', 15.5, 2.0, 0.50],
        ['piano', 'C3', 16, 3.8, 0.45], ['piano', 'E3', 16.5, 1.8, 0.30], ['piano', 'A3', 17, 1.8, 0.30], ['piano', 'E4', 17.5, 1.8, 0.40], ['piano', 'A4', 18, 2.0, 0.50], ['piano', 'E4', 18.5, 1.5, 0.40], ['piano', 'A4', 19, 1.5, 0.50],
        ['piano', 'C3', 20, 3.8, 0.45], ['piano', 'D3', 20.5, 1.8, 0.30], ['piano', 'F#3', 21, 1.8, 0.30], ['piano', 'A3', 21.5, 1.8, 0.40], ['piano', 'D4', 22, 2.0, 0.50],
        ['piano', 'B2', 24, 3.8, 0.45], ['piano', 'D3', 24.5, 1.8, 0.30], ['piano', 'G3', 25, 1.8, 0.30], ['piano', 'D4', 25.5, 1.8, 0.40], ['piano', 'G4', 26, 2.0, 0.50],
        ['piano', 'C3', 28, 3.8, 0.50], ['piano', 'G3', 29, 2.5, 0.35], ['piano', 'C4', 30, 2.5, 0.45], ['piano', 'E4', 30.5, 3.0, 0.55]
      ]
    },

    // 18. Joe Hisaishi Tribute: Summer Memories
    ghiblisummer: {
      bpm: 76,
      lengthBeats: 32,
      notes: [
        ['piano', 'D3', 0, 3.8, 0.45], ['piano', 'F#3', 1, 1.8, 0.25], ['piano', 'A3', 2, 1.8, 0.25], ['piano', 'D4', 3, 1.8, 0.30],
        ['piano', 'G2', 4, 3.8, 0.45], ['piano', 'B2', 5, 1.8, 0.25], ['piano', 'D3', 6, 1.8, 0.25], ['piano', 'G3', 7, 1.8, 0.30],
        ['piano', 'A2', 8, 3.8, 0.45], ['piano', 'C#3', 9, 1.8, 0.25], ['piano', 'E3', 10, 1.8, 0.25], ['piano', 'A3', 11, 1.8, 0.30],
        ['piano', 'D3', 12, 3.8, 0.45], ['piano', 'F#3', 13, 1.8, 0.25], ['piano', 'A3', 14, 1.8, 0.25], ['piano', 'D4', 15, 1.8, 0.30],
        ['piano', 'A4', 0, 0.9, 0.65], ['piano', 'D5', 1, 0.9, 0.65], ['piano', 'F#5', 2, 1.8, 0.70],
        ['piano', 'E5', 4, 0.9, 0.60], ['piano', 'D5', 5, 0.9, 0.60], ['piano', 'B4', 6, 1.8, 0.65],
        ['piano', 'C#5', 8, 0.9, 0.60], ['piano', 'D5', 9, 0.9, 0.60], ['piano', 'E5', 10, 1.8, 0.65],
        ['piano', 'F#5', 12, 1.8, 0.70], ['piano', 'D5', 14, 1.8, 0.65],
        ['piano', 'A4', 16, 0.9, 0.65], ['piano', 'D5', 17, 0.9, 0.65], ['piano', 'F#5', 18, 1.8, 0.70],
        ['piano', 'G5', 20, 0.9, 0.65], ['piano', 'F#5', 21, 0.9, 0.60], ['piano', 'E5', 22, 1.8, 0.60],
        ['piano', 'D5', 24, 1.8, 0.65], ['piano', 'C#5', 26, 1.8, 0.60], ['piano', 'D5', 28, 3.5, 0.70]
      ]
    },

    // 19. Robert Schumann: Träumerei (Dreaming)
    schumann: {
      bpm: 54,
      lengthBeats: 32,
      notes: [
        ['piano', 'F2', 0, 7.8, 0.45], ['piano', 'A3', 1, 3.0, 0.25], ['piano', 'C4', 1, 3.0, 0.25],
        ['piano', 'Bb2', 8, 7.8, 0.45], ['piano', 'D3', 9, 3.0, 0.25], ['piano', 'F3', 9, 3.0, 0.25],
        ['piano', 'C3', 16, 7.8, 0.45], ['piano', 'E3', 17, 3.0, 0.25], ['piano', 'G3', 17, 3.0, 0.25],
        ['piano', 'F2', 24, 7.8, 0.45], ['piano', 'A3', 25, 3.0, 0.25], ['piano', 'C4', 25, 3.0, 0.25],
        ['piano', 'C4', 0, 1.2, 0.55], ['piano', 'F4', 1.5, 1.2, 0.60], ['piano', 'A4', 3, 1.2, 0.65], ['piano', 'C5', 4.5, 1.5, 0.70],
        ['piano', 'F5', 6, 2.5, 0.75], ['piano', 'E5', 9, 1.2, 0.60], ['piano', 'D5', 10.5, 1.2, 0.60],
        ['piano', 'C5', 12, 2.0, 0.65], ['piano', 'Bb4', 14.5, 1.2, 0.55],
        ['piano', 'A4', 16, 2.0, 0.60], ['piano', 'G4', 18.5, 1.2, 0.55], ['piano', 'F4', 20, 2.5, 0.65],
        ['piano', 'E4', 23, 1.2, 0.55], ['piano', 'F4', 24.5, 3.5, 0.65]
      ]
    },

    // 20. Johannes Brahms: Lullaby (Guten Abend, gut' Nacht)
    brahmslullaby: {
      bpm: 64,
      lengthBeats: 32,
      notes: [
        ['musicbox', 'G3', 0, 3.8, 0.40], ['musicbox', 'B3', 1, 1.8, 0.30], ['musicbox', 'D4', 2, 1.8, 0.30],
        ['musicbox', 'G3', 4, 3.8, 0.40], ['musicbox', 'B3', 5, 1.8, 0.30], ['musicbox', 'D4', 6, 1.8, 0.30],
        ['musicbox', 'D3', 8, 3.8, 0.40], ['musicbox', 'A3', 9, 1.8, 0.30], ['musicbox', 'C4', 10, 1.8, 0.30],
        ['musicbox', 'G3', 12, 3.8, 0.40], ['musicbox', 'B3', 13, 1.8, 0.30], ['musicbox', 'D4', 14, 1.8, 0.30],
        ['musicbox', 'C3', 16, 3.8, 0.40], ['musicbox', 'E3', 17, 1.8, 0.30], ['musicbox', 'G3', 18, 1.8, 0.30],
        ['musicbox', 'G3', 20, 3.8, 0.40], ['musicbox', 'B3', 21, 1.8, 0.30], ['musicbox', 'D4', 22, 1.8, 0.30],
        ['musicbox', 'D3', 24, 3.8, 0.40], ['musicbox', 'A3', 25, 1.8, 0.30], ['musicbox', 'C4', 26, 1.8, 0.30],
        ['musicbox', 'G3', 28, 3.8, 0.45], ['musicbox', 'B3', 29, 2.5, 0.35],
        ['musicbox', 'D4', 0, 0.9, 0.60], ['musicbox', 'D4', 1, 0.9, 0.60], ['musicbox', 'B4', 2, 2.0, 0.70],
        ['musicbox', 'D4', 4, 0.9, 0.60], ['musicbox', 'D4', 5, 0.9, 0.60], ['musicbox', 'B4', 6, 2.0, 0.70],
        ['musicbox', 'D4', 8, 0.9, 0.60], ['musicbox', 'B4', 9, 0.9, 0.65], ['musicbox', 'G4', 10, 1.8, 0.65],
        ['musicbox', 'F#4', 12, 1.8, 0.60], ['musicbox', 'E4', 14, 1.8, 0.60],
        ['musicbox', 'D4', 16, 0.9, 0.60], ['musicbox', 'E4', 17, 0.9, 0.60], ['musicbox', 'F#4', 18, 0.9, 0.65], ['musicbox', 'G4', 19, 1.8, 0.70],
        ['musicbox', 'A4', 21, 0.9, 0.65], ['musicbox', 'B4', 22, 1.8, 0.70],
        ['musicbox', 'C5', 24, 0.9, 0.65], ['musicbox', 'B4', 25, 0.9, 0.65], ['musicbox', 'A4', 26, 1.8, 0.60],
        ['musicbox', 'G4', 28, 3.5, 0.75]
      ]
    }
  };

  function initAudioContext() {
    if (audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  function stopCurrentSoundscapes() {
    if (musicIntervalId) {
      clearInterval(musicIntervalId);
      musicIntervalId = null;
    }
    songBeatTimeouts.forEach(t => clearTimeout(t));
    songBeatTimeouts = [];

    currentSoundNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    currentSoundNodes = [];
  }

  function playSynthNote(inst, note, when, duration = 1.0, velocity = 0.5) {
    if (!audioCtx || !masterGain) return;
    const freq = typeof note === 'number' ? note : (NOTE_FREQS[note] || 440);
    const now = when || audioCtx.currentTime;

    if (inst === 'piano') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(freq * 4.5, 3200), now);
      filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 1.5, 600), now + duration);

      const peakGain = velocity * 0.24;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.012);
      noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.45, now + 0.35);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.3);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      const stopTime = now + duration * 1.35;
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      currentSoundNodes.push(osc1, osc2, noteGain, filter);

    } else if (inst === 'guitar') {
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + duration * 0.8);

      const peakGain = velocity * 0.25;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.005);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.2);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration * 1.25);
      currentSoundNodes.push(osc, noteGain, filter);

    } else if (inst === 'musicbox') {
      const osc = audioCtx.createOscillator();
      const oscHarmonic = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 3, now);

      const peakGain = velocity * 0.16;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.006);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.5);

      const harmGain = audioCtx.createGain();
      harmGain.gain.value = 0.25;
      oscHarmonic.connect(harmGain);
      harmGain.connect(noteGain);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now);
      oscHarmonic.start(now);
      osc.stop(now + duration * 1.6);
      oscHarmonic.stop(now + duration * 1.6);
      currentSoundNodes.push(osc, oscHarmonic, noteGain);

    } else if (inst === 'rhodes') {
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const peakGain = velocity * 0.2;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.35, now + 0.4);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.2);

      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration * 1.25);
      currentSoundNodes.push(osc, noteGain);
    }
  }

  function startSongSequencer(songId) {
    const song = SONG_DEFINITIONS[songId];
    if (!song || !audioCtx) return;

    const secondsPerBeat = 60 / song.bpm;
    const loopDurationSec = song.lengthBeats * secondsPerBeat;

    function scheduleLoopNotes(loopStartTime) {
      if (!isMusicPlaying || activeMusicId !== songId) return;
      song.notes.forEach(n => {
        const [inst, note, beatOffset, dur, vel] = n;
        const noteTime = loopStartTime + beatOffset * secondsPerBeat;
        if (noteTime >= audioCtx.currentTime - 0.05) {
          playSynthNote(inst, note, noteTime, dur * secondsPerBeat, vel || 0.5);
        }
      });
    }

    let nextLoopStartTime = audioCtx.currentTime + 0.05;
    scheduleLoopNotes(nextLoopStartTime);
    nextLoopStartTime += loopDurationSec;

    // Bulletproof lookahead scheduler checking every 100ms and queuing 1.5s in advance
    musicIntervalId = setInterval(() => {
      if (!isMusicPlaying || activeMusicId !== songId || !audioCtx) {
        if (musicIntervalId) clearInterval(musicIntervalId);
        return;
      }
      if (audioCtx.currentTime + 1.5 >= nextLoopStartTime) {
        scheduleLoopNotes(nextLoopStartTime);
        nextLoopStartTime += loopDurationSec;
      }
    }, 100);
  }

  function createNoiseBuffer(duration = 5, isPink = true) {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (isPink) {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.08;
      }
    }

    // Seamless loop equal-power crossfade (eliminates boundary clicks and stuttering)
    const crossfadeLen = Math.floor(audioCtx.sampleRate * 0.4);
    for (let i = 0; i < crossfadeLen; i++) {
      const prog = i / crossfadeLen;
      const gainIn = Math.sin(prog * 0.5 * Math.PI);
      const gainOut = Math.cos(prog * 0.5 * Math.PI);
      const endSample = data[bufferSize - crossfadeLen + i];
      data[i] = data[i] * gainIn + endSample * gainOut;
    }

    return buffer;
  }

  function startSoundscape(trackId) {
    initAudioContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    stopCurrentSoundscapes();

    // Check if it is an instrumental song
    if (SONG_DEFINITIONS[trackId]) {
      startSongSequencer(trackId);
      return;
    }

    // Otherwise it is an ambient track
    const t = audioCtx.currentTime;

    if (trackId === 'waves') {
      // 1. Ocean Waves
      const buf = createNoiseBuffer(6, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.14;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 240;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      src.connect(filter);
      filter.connect(masterGain);

      src.start();
      lfo.start();
      currentSoundNodes = [src, lfo, lfoGain, filter];

    } else if (trackId === 'rain') {
      // 2. Peaceful Rain
      const buf = createNoiseBuffer(4, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 950;

      const filter2 = audioCtx.createBiquadFilter();
      filter2.type = 'highpass';
      filter2.frequency.value = 180;

      src.connect(filter);
      filter.connect(filter2);
      filter2.connect(masterGain);

      src.start();
      currentSoundNodes = [src, filter, filter2];

    } else if (trackId === 'cafe') {
      // 3. Cozy Study Cafe & Rain
      const buf = createNoiseBuffer(5, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 450;
      filter.Q.value = 0.8;

      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 120;
      const oscGain = audioCtx.createGain();
      oscGain.gain.value = 0.15;

      src.connect(filter);
      filter.connect(masterGain);
      osc.connect(oscGain);
      oscGain.connect(masterGain);

      src.start();
      osc.start();
      currentSoundNodes = [src, filter, osc, oscGain];

    } else if (trackId === 'forest') {
      // 4. Forest Wind & Birds
      const buf = createNoiseBuffer(5, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 500;
      filter.Q.value = 1.2;

      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.2;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 260;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      src.connect(filter);
      filter.connect(masterGain);

      src.start();
      lfo.start();
      currentSoundNodes = [src, lfo, lfoGain, filter];

      musicIntervalId = setInterval(() => {
        if (!isMusicPlaying || !audioCtx) return;
        if (Math.random() > 0.4) {
          const chirpOsc = audioCtx.createOscillator();
          const chirpGain = audioCtx.createGain();
          const freq = 2200 + Math.random() * 800;
          chirpOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          chirpOsc.frequency.exponentialRampToValueAtTime(freq + 400, audioCtx.currentTime + 0.08);
          chirpGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
          chirpGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
          chirpOsc.connect(chirpGain);
          chirpGain.connect(masterGain);
          chirpOsc.start();
          chirpOsc.stop(audioCtx.currentTime + 0.14);
        }
      }, 2500);

    } else if (trackId === 'theta') {
      // 5. Deep Focus Theta (432Hz & 438Hz Binaural)
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 216;

      const osc2 = audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 222;

      const osc3 = audioCtx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = 108;

      const g = audioCtx.createGain();
      g.gain.value = 0.22;

      osc1.connect(g);
      osc2.connect(g);
      osc3.connect(g);
      g.connect(masterGain);

      osc1.start();
      osc2.start();
      osc3.start();
      currentSoundNodes = [osc1, osc2, osc3, g];

    } else if (trackId === 'piano') {
      // 6. Lofi Ambient Chords
      const chords = [
        [261.63, 329.63, 392.00, 493.88],
        [220.00, 261.63, 329.63, 392.00],
        [174.61, 220.00, 261.63, 329.63],
        [196.00, 246.94, 293.66, 349.23]
      ];
      let chordIndex = 0;

      function playChord() {
        if (!isMusicPlaying || !audioCtx) return;
        const freqs = chords[chordIndex % chords.length];
        chordIndex++;
        const now = audioCtx.currentTime;

        freqs.forEach(f => {
          const osc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = f;

          noteGain.gain.setValueAtTime(0.001, now);
          noteGain.gain.linearRampToValueAtTime(0.05, now + 0.4);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 4.6);
        });
      }

      playChord();
      musicIntervalId = setInterval(playChord, 3200);

    } else if (trackId === 'space') {
      // 7. Celestial Space Dream
      const freqs = [196.0, 293.66, 392.0, 440.0, 587.33];
      const oscs = [];
      const g = audioCtx.createGain();
      g.gain.value = 0.14;

      freqs.forEach(f => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f + (Math.random() - 0.5) * 1.5;
        osc.connect(g);
        osc.start();
        oscs.push(osc);
      });

      g.connect(masterGain);
      currentSoundNodes = [...oscs, g];

    } else if (trackId === 'stream') {
      // 8. Mountain Stream
      const buf = createNoiseBuffer(4, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const f1 = audioCtx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 850;
      f1.Q.value = 2.5;

      const f2 = audioCtx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.value = 1600;
      f2.Q.value = 3.0;

      const g1 = audioCtx.createGain();
      g1.gain.value = 0.6;
      const g2 = audioCtx.createGain();
      g2.gain.value = 0.35;

      src.connect(f1);
      f1.connect(g1);
      g1.connect(masterGain);

      src.connect(f2);
      f2.connect(g2);
      g2.connect(masterGain);

      src.start();
      currentSoundNodes = [src, f1, f2, g1, g2];

    } else if (trackId === 'fireplace') {
      // 9. Fireplace & Hearth
      const buf = createNoiseBuffer(4, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 280;

      src.connect(filter);
      filter.connect(masterGain);
      src.start();
      currentSoundNodes = [src, filter];

      musicIntervalId = setInterval(() => {
        if (!isMusicPlaying || !audioCtx) return;
        if (Math.random() > 0.35) {
          const popBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03, audioCtx.sampleRate);
          const pData = popBuf.getChannelData(0);
          for (let i = 0; i < pData.length; i++) {
            pData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
          }
          const popSrc = audioCtx.createBufferSource();
          popSrc.buffer = popBuf;
          const popGain = audioCtx.createGain();
          popGain.gain.value = Math.random() * 0.08 + 0.02;
          popSrc.connect(popGain);
          popGain.connect(masterGain);
          popSrc.start();
        }
      }, 350);

    } else if (trackId === 'chimes') {
      // 10. Zen Wind Chimes
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
      function playChime() {
        if (!isMusicPlaying || !audioCtx) return;
        const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        const osc = audioCtx.createOscillator();
        const chimeGain = audioCtx.createGain();
        const now = audioCtx.currentTime;

        osc.type = 'sine';
        osc.frequency.value = note;

        chimeGain.gain.setValueAtTime(0.001, now);
        chimeGain.gain.linearRampToValueAtTime(0.07, now + 0.02);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(chimeGain);
        chimeGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 3.0);
      }

      playChime();
      musicIntervalId = setInterval(playChime, 1800);

    } else if (trackId === 'crickets') {
      // 11. Summer Meadow & Crickets
      const buf = createNoiseBuffer(4, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = audioCtx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 240;
      src.connect(f);
      f.connect(masterGain);
      src.start();
      currentSoundNodes = [src, f];

      musicIntervalId = setInterval(() => {
        if (!isMusicPlaying || !audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4600 + Math.random() * 200, now);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.025, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.14);
      }, 700);

    } else if (trackId === 'thunder') {
      // 12. Distant Thunder & Rain
      const buf = createNoiseBuffer(4, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const rainFilter = audioCtx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 800;
      rainFilter.Q.value = 0.9;
      src.connect(rainFilter);
      rainFilter.connect(masterGain);
      src.start();
      currentSoundNodes = [src, rainFilter];

      musicIntervalId = setInterval(() => {
        if (!isMusicPlaying || !audioCtx) return;
        if (Math.random() > 0.4) {
          const tBuf = createNoiseBuffer(3, true);
          const tSrc = audioCtx.createBufferSource();
          tSrc.buffer = tBuf;
          const tFilter = audioCtx.createBiquadFilter();
          tFilter.type = 'lowpass';
          tFilter.frequency.setValueAtTime(80, audioCtx.currentTime);
          tFilter.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 2.5);
          const tGain = audioCtx.createGain();
          tGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
          tGain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.6);
          tGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.8);
          tSrc.connect(tFilter);
          tFilter.connect(tGain);
          tGain.connect(masterGain);
          tSrc.start();
        }
      }, 4500);

    } else if (trackId === 'lakeshore') {
      // 13. Gentle Lake Shore
      const buf = createNoiseBuffer(5, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 1.8;
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 350;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      src.connect(filter);
      filter.connect(masterGain);
      src.start();
      lfo.start();
      currentSoundNodes = [src, lfo, lfoGain, filter];

    } else if (trackId === 'morningbirds') {
      // 14. Morning Birds & Dew
      const buf = createNoiseBuffer(4, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      src.connect(filter);
      filter.connect(masterGain);
      src.start();
      currentSoundNodes = [src, filter];

      musicIntervalId = setInterval(() => {
        if (!isMusicPlaying || !audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const base = 2800 + Math.random() * 600;
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base + 600, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(base + 200, now + 0.16);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.035, now + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.24);
      }, 1900);

    } else if (trackId === 'blizzard') {
      // 15. Arctic Winter Wind
      const buf = createNoiseBuffer(5, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 420;
      filter.Q.value = 2.2;
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      src.connect(filter);
      filter.connect(masterGain);
      src.start();
      lfo.start();
      currentSoundNodes = [src, lfo, lfoGain, filter];

    } else if (trackId === 'alpha') {
      // 16. Alpha Waves 10Hz Focus
      const oscL = audioCtx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.value = 200;
      const oscR = audioCtx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.value = 210; // 10Hz alpha difference
      const g = audioCtx.createGain();
      g.gain.value = 0.22;
      oscL.connect(g);
      oscR.connect(g);
      g.connect(masterGain);
      oscL.start();
      oscR.start();
      currentSoundNodes = [oscL, oscR, g];

    } else if (trackId === 'leaves') {
      // 17. Autumn Leaves & Breeze
      const buf = createNoiseBuffer(4, true);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 1.5;
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.25;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 400;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      src.connect(filter);
      filter.connect(masterGain);
      src.start();
      lfo.start();
      currentSoundNodes = [src, lfo, lfoGain, filter];

    } else if (trackId === 'tinroof') {
      // 18. Rain on Tin Roof
      const buf = createNoiseBuffer(4, false);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f1 = audioCtx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 2400;
      f1.Q.value = 3.0;
      const g1 = audioCtx.createGain();
      g1.gain.value = 0.35;
      src.connect(f1);
      f1.connect(g1);
      g1.connect(masterGain);
      src.start();
      currentSoundNodes = [src, f1, g1];

    } else if (trackId === 'deepocean') {
      // 19. Deep Oceanic Abyss
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 55;
      const osc2 = audioCtx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 82.5;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      const g = audioCtx.createGain();
      g.gain.value = 0.3;
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(g);
      g.connect(masterGain);
      osc1.start();
      osc2.start();
      currentSoundNodes = [osc1, osc2, filter, g];

    } else if (trackId === 'singingbowl') {
      // 20. Tibetan Singing Bowl (528Hz & 1056Hz)
      function strikeBowl() {
        if (!isMusicPlaying || !audioCtx) return;
        const now = audioCtx.currentTime;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const g1 = audioCtx.createGain();
        const g2 = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.value = 528;
        osc2.type = 'sine';
        osc2.frequency.value = 1056;

        g1.gain.setValueAtTime(0.001, now);
        g1.gain.linearRampToValueAtTime(0.16, now + 0.04);
        g1.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

        g2.gain.setValueAtTime(0.001, now);
        g2.gain.linearRampToValueAtTime(0.05, now + 0.04);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        osc1.connect(g1);
        osc2.connect(g2);
        g1.connect(masterGain);
        g2.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 4.8);
        osc2.stop(now + 4.8);
      }

      strikeBowl();
      musicIntervalId = setInterval(strikeBowl, 4200);
    }
  }

  window.setMusicCategory = function(cat) {
    currentMusicCategory = cat;
    const btnAmbient = document.getElementById('musicTabBtn-ambient');
    const btnSongs = document.getElementById('musicTabBtn-songs');

    if (cat === 'ambient') {
      if (btnAmbient) {
        btnAmbient.className = "py-1 px-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer bg-white text-sky-900 shadow-xs";
      }
      if (btnSongs) {
        btnSongs.className = "py-1 px-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer text-sky-700 hover:text-sky-900";
      }
    } else {
      if (btnAmbient) {
        btnAmbient.className = "py-1 px-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer text-sky-700 hover:text-sky-900";
      }
      if (btnSongs) {
        btnSongs.className = "py-1 px-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer bg-white text-sky-900 shadow-xs";
      }
    }

    renderMusicTracksList();
  };

  function renderMusicTracksList() {
    const list = document.getElementById('musicTrackList');
    if (!list) return;

    const tracksToShow = (currentMusicCategory === 'songs') ? INSTRUMENTAL_SONGS : AMBIENT_TRACKS;

    let html = '';
    tracksToShow.forEach(t => {
      const isActive = (t.id === activeMusicId);
      html += `
        <button onclick="selectStudyMusic('${t.id}')" class="w-full text-left p-2 rounded-xl transition flex items-center justify-between text-xs cursor-pointer ${isActive ? 'bg-sky-500 text-white font-bold shadow-xs' : 'bg-white hover:bg-sky-50 text-sky-950 font-semibold border border-sky-100/70 hover:border-sky-300'}">
          <div class="flex items-center gap-2 truncate">
            <span class="text-sm">${t.icon}</span>
            <div class="truncate">
              <p class="truncate leading-tight">${t.name}</p>
              <p class="text-[10px] ${isActive ? 'text-sky-100' : 'text-sky-600'} font-normal truncate">${t.composer ? `${t.composer} • ` : ''}${t.desc}</p>
            </div>
          </div>
          ${isActive && isMusicPlaying ? '<span class="text-xs">▶️</span>' : ''}
        </button>
      `;
    });
    list.innerHTML = html;
  }

  window.selectStudyMusic = function(trackId) {
    activeMusicId = trackId;
    const track = ALL_TRACKS.find(t => t.id === trackId);
    const badge = document.getElementById('musicTitleBadge');
    if (badge && track) badge.textContent = track.name;

    // Automatically align category tab if track belongs to other category
    if (track) {
      if (track.category !== currentMusicCategory) {
        window.setMusicCategory(track.category);
      }
    }

    if (!isMusicPlaying) {
      window.toggleStudyMusic();
    } else {
      startSoundscape(trackId);
      renderMusicTracksList();
    }
  };

  window.toggleStudyMusic = function() {
    initAudioContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') audioCtx.resume();

    const btn = document.getElementById('musicToggleBtn');
    const icon = document.getElementById('musicPlayIcon');
    const statusText = document.getElementById('musicStatusText');
    const track = ALL_TRACKS.find(t => t.id === activeMusicId);

    if (isMusicPlaying) {
      if (masterGain) {
        masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      }
      setTimeout(() => stopCurrentSoundscapes(), 450);
      isMusicPlaying = false;
      if (btn) btn.classList.remove('ambient-playing');
      if (icon) icon.textContent = '🎵';
      if (statusText) {
        statusText.textContent = 'OFF';
        statusText.className = 'text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full';
      }
    } else {
      startSoundscape(activeMusicId);
      if (masterGain) {
        masterGain.gain.linearRampToValueAtTime(musicVol, audioCtx.currentTime + 0.6);
      }
      isMusicPlaying = true;
      if (btn) btn.classList.add('ambient-playing');
      if (icon) icon.textContent = '🎶';
      if (statusText) {
        statusText.textContent = 'PLAYING';
        statusText.className = 'text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full';
      }
    }

    renderMusicTracksList();
  };


  window.setStudyMusicVolume = function(vol) {
    musicVol = parseFloat(vol);
    if (isMusicPlaying && masterGain && audioCtx) {
      masterGain.gain.linearRampToValueAtTime(musicVol, audioCtx.currentTime + 0.1);
    }
    const pct = document.getElementById('musicVolPercent');
    if (pct) pct.textContent = `${Math.round(musicVol * 100)}%`;
    localStorage.setItem(MUSIC_VOL_KEY, musicVol);
  };

  // Restore saved volume if present
  const savedMusicVol = localStorage.getItem(MUSIC_VOL_KEY);
  if (savedMusicVol !== null) {
    musicVol = parseFloat(savedMusicVol);
    const slider = document.getElementById('musicVolumeSlider');
    const pct = document.getElementById('musicVolPercent');
    if (slider) slider.value = musicVol;
    if (pct) pct.textContent = `${Math.round(musicVol * 100)}%`;
  }

  window.toggleMusicMenu = function(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('musicDropdownMenu');
    const btn = document.getElementById('musicMenuContainer');
    if (menu) {
      const isHidden = menu.classList.contains('hidden');
      if (isHidden) {
        if (btn) {
          const rect = btn.getBoundingClientRect();
          menu.style.position = 'fixed';
          menu.style.top = `${rect.bottom + 6}px`;
          const rightOffset = window.innerWidth - rect.right;
          menu.style.right = `${Math.max(12, rightOffset)}px`;
          menu.style.zIndex = '90';
        }
        menu.classList.remove('hidden');
      } else {
        menu.classList.add('hidden');
      }
    }
  };

  document.addEventListener('click', (e) => {
    const container = document.getElementById('musicMenuContainer');
    const menu = document.getElementById('musicDropdownMenu');
    if (menu && !menu.classList.contains('hidden')) {
      if (container && !container.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
      }
    }
  });

  // Auto-resume audio context on user interaction
  let userInteracted = false;
  window.addEventListener('pointerdown', () => {
    if (!userInteracted) {
      userInteracted = true;
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
  }, { once: true });

  // ================= 4. FULL-WIDTH VIEW SWITCHER =================
  window.switchView = function(viewName) {
    currentActiveView = viewName;

    // Update Top Navigation Tabs
    const navTabs = ['dashboard', 'lesson', 'pdf', 'vocab', 'progress', 'translator'];
    navTabs.forEach(name => {
      const btn = document.getElementById(`navTab-${name}`);
      if (btn) {
        if (name === viewName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    // Hide all view panels and show active view
    document.querySelectorAll('.app-view').forEach(v => {
      v.classList.remove('active');
    });

    const activeViewEl = document.getElementById(`view-${viewName}`);
    if (activeViewEl) {
      activeViewEl.classList.add('active');
    }

    try {
      if (window.location.hash !== '#' + viewName) {
        history.replaceState(null, '', '#' + viewName);
      }
    } catch (e) {}

    // Trigger View-Specific Handlers
    if (viewName === 'dashboard') {
      renderDashboard();
    } else if (viewName === 'translator') {
      const inputEl = document.getElementById('transInputText');
      if (inputEl && window.innerWidth >= 768) {
        setTimeout(() => inputEl.focus(), 150);
      }
    } else if (viewName === 'lesson') {
      const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
      renderAutoLesson(chapter);
    } else if (viewName === 'pdf') {
      setTimeout(() => {
        const p = parseInt(pageInput.value, 10) || 1;
        updatePdfSource(p);
      }, 50);
    } else if (viewName === 'vocab') {
      const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
      renderVocabTab(chapter);
    } else if (viewName === 'progress') {
      renderHistoryTab();
    }
  };

  // ================= 5. HOME DASHBOARD (12 CHAPTER CARDS) =================
  function renderDashboard() {
    const grid = document.getElementById('dashboardChapterGrid');
    const badge = document.getElementById('dashCompletedBadge');
    if (!grid) return;

    const completedCount = studyData.completedChapters.length;
    if (badge) badge.textContent = `${completedCount}/12`;

    let html = '';
    NETZWERK_DATA.chapters.forEach((chap, idx) => {
      const isDone = studyData.completedChapters.includes(chap.id);
      const isCurrent = (currentChapterIndex === idx);
      const audioCount = chap.audioTracks ? chap.audioTracks.length : 0;
      const videoCount = chap.videos ? chap.videos.length : 0;
      const totalPages = chap.pdfChapterTotalPages || 10;

      html += `
        <div class="blue-glass-card p-4 md:p-5 flex flex-col justify-between border-2 ${isCurrent ? 'border-sky-400 ring-2 ring-sky-300/50' : 'border-sky-200'} transition hover:border-sky-400 hover:shadow-lg relative overflow-hidden group">
          
          <!-- Top Badge & Checkmark -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-sky-100 text-sky-800 border border-sky-300'}">
                ${isDone ? '✅ Completed' : `Chapter ${chap.id}`}
              </span>
              <button onclick="event.stopPropagation(); toggleChapterDone(${chap.id})" class="text-sm cursor-pointer p-1 rounded-lg hover:bg-sky-100 transition" title="Toggle completion status">
                ${isDone ? '✅' : '⚪'}
              </button>
            </div>

            <h4 class="font-extrabold text-sky-950 text-base mb-1 group-hover:text-sky-600 transition">
              ${chap.title}
            </h4>
            <p class="text-xs text-sky-700 mb-3 font-medium line-clamp-2">
              ${chap.subtitle}
            </p>

            <!-- Media Metrics Strip -->
            <div class="flex items-center gap-2 text-[11px] text-sky-800 font-semibold bg-sky-50/80 p-2 rounded-xl border border-sky-200 mb-4">
              <span title="Audio tracks">🎧 <strong>${audioCount}</strong> Audio</span>
              <span>•</span>
              <span title="Video clips">🎬 <strong>${videoCount}</strong> Videos</span>
              <span>•</span>
              <span title="PDF Pages">📄 <strong>${totalPages}</strong> Pgs</span>
            </div>
          </div>

          <!-- Direct Jump Buttons -->
          <div class="space-y-1.5 pt-2 border-t border-sky-100">
            <button onclick="selectChapter(${idx}); switchView('lesson');" class="w-full btn-pastel-blue py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
              <span>📘</span>
              <span>Study Lesson & Exercises</span>
            </button>
            <div class="grid grid-cols-3 gap-1.5">
              <button onclick="selectChapter(${idx}); switchView('pdf');" class="py-1.5 rounded-xl bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer" title="Open Chapter PDF Book">
                <span>📖</span>
                <span>PDF</span>
              </button>
              <button onclick="selectChapter(${idx}); openVideoModal();" class="py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer" title="Watch Chapter Videos">
                <span>🎬</span>
                <span>Videos (${videoCount})</span>
              </button>
              <button onclick="selectChapter(${idx}); switchView('vocab');" class="py-1.5 rounded-xl bg-sky-50 hover:bg-sky-200 border border-sky-200 text-sky-800 text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer" title="View Vocabulary">
                <span>📚</span>
                <span>Vocab</span>
              </button>
            </div>
            <div class="grid grid-cols-3 gap-1.5 pt-0.5">
              <button onclick="selectChapter(${idx}); openAudioPronunciationModal(${idx});" class="py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer" title="Practice Vocabulary Audio (TTS)">
                <span>🔊</span>
                <span>Audio TTS</span>
              </button>
              <button onclick="selectChapter(${idx}); openFlashcardModal(${idx});" class="py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer" title="Practice Chapter Flashcards">
                <span>🎴</span>
                <span>Flashcards</span>
              </button>
              <button onclick="selectChapter(${idx}); openArticleGameModal(${idx});" class="py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer" title="Play Der, Die, Das Mini-Game">
                <span>🎯</span>
                <span>Der Die Das</span>
              </button>
            </div>
          </div>

        </div>
      `;
    });

    grid.innerHTML = html;
  }

  // ================= 6. CHAPTER SELECTION & INITIALIZATION =================
  function initChapters() {
    renderChapterDropdown();

    if (chapterSelect) {
      chapterSelect.addEventListener('change', (e) => {
        selectChapter(parseInt(e.target.value, 10));
      });
    }

    // Restore last studied chapter
    const initialIndex = (studyData.lastChapter >= 0 && studyData.lastChapter < NETZWERK_DATA.chapters.length) 
      ? studyData.lastChapter 
      : 0;
    
    selectChapter(initialIndex, null);
    updateProgressHeader();
  }

  function renderChapterDropdown() {
    if (!chapterSelect) return;
    chapterSelect.innerHTML = '';
    NETZWERK_DATA.chapters.forEach((chap, idx) => {
      const isDone = studyData.completedChapters.includes(chap.id);
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${isDone ? '✅ Completed: ' : '📘 '}${chap.title}`;
      chapterSelect.appendChild(opt);
    });
    chapterSelect.value = currentChapterIndex;
  }

  window.stepChapter = function(delta) {
    const newIdx = Math.max(0, Math.min(NETZWERK_DATA.chapters.length - 1, currentChapterIndex + delta));
    window.selectChapter(newIdx);
  };

  window.selectChapter = function(index, customPage = null) {
    if (index < 0 || index >= NETZWERK_DATA.chapters.length) return;
    currentChapterIndex = index;
    window.currentChapterIndex = index;
    const chapter = NETZWERK_DATA.chapters[index];
    if (chapterSelect) chapterSelect.value = index;

    // Save active chapter
    studyData.lastChapter = index;

    // Update Top Lesson Titles
    const lessonTitle = document.getElementById('lessonChapterTitle');
    const lessonSubtitle = document.getElementById('lessonChapterSubtitle');
    if (lessonTitle) lessonTitle.textContent = chapter.title;
    if (lessonSubtitle) lessonSubtitle.textContent = chapter.subtitle;

    const lessonVideoCountBtn = document.getElementById('lessonVideoCountBtn');
    const vidCount = chapter.videos ? chapter.videos.length : 0;
    if (lessonVideoCountBtn) {
      lessonVideoCountBtn.textContent = `Videos (${vidCount})`;
    }
    if (pdfVideoBtnText) {
      pdfVideoBtnText.textContent = `Videos (${vidCount})`;
    }

    // Update chapter completion button
    updateChapterCompleteBtn(chapter.id);

    // Compute total pages and initial page
    const totalPages = chapter.pdfChapterTotalPages || 10;
    let targetPage = customPage;
    if (!targetPage) {
      targetPage = (currentDoc === 'fullbook') ? chapter.pdfPage : 1;
    } else if (currentDoc === 'kursbuch' && targetPage > totalPages) {
      targetPage = 1;
    }
    studyData.lastPage = targetPage;
    saveStudyData();

    const pageTotalBadge = document.getElementById('pageTotalBadge');

    if (currentDoc === 'kursbuch') {
      pageInput.value = targetPage;
      pageInput.min = 1;
      pageInput.max = totalPages;
      if (pageTotalBadge) pageTotalBadge.textContent = `/ ${totalPages}`;
      docBadge.textContent = `${chapter.title} (PDF - ${totalPages} Pages)`;
      updatePdfSource(targetPage);
    } else if (currentDoc === 'fullbook') {
      pageInput.value = chapter.pdfPage;
      pageInput.min = 1;
      pageInput.max = 176;
      if (pageTotalBadge) pageTotalBadge.textContent = `/ 176`;
      docBadge.textContent = `Full Kursbuch (Page ${chapter.pdfPage})`;
      updatePdfSource(chapter.pdfPage);
    }

    // Update Audio Tracks for this chapter
    updateAudioTracks(chapter);

    // Update Video List for this chapter
    updateVideoList(chapter);

    // Render Lesson, Vocab, History, and Dashboard
    renderAutoLesson(chapter);
    renderVocabTab(chapter);
    renderHistoryTab();
    renderDashboard();

    // Redraw canvas annotations for new chapter/page
    redrawPdfStrokes();
  };

  window.toggleCurrentChapterCompletion = function() {
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
    toggleChapterDone(chapter.id);
  };

  window.toggleChapterDone = function(chapId) {
    const idx = studyData.completedChapters.indexOf(chapId);
    if (idx >= 0) {
      studyData.completedChapters.splice(idx, 1);
    } else {
      studyData.completedChapters.push(chapId);
    }
    saveStudyData();
    renderChapterDropdown();
    updateChapterCompleteBtn(chapId);
    renderHistoryTab();
    renderDashboard();
  };

  function updateChapterCompleteBtn(chapId) {
    const btn = document.getElementById('btnCompleteChapter');
    if (!btn) return;
    const isDone = studyData.completedChapters.includes(chapId);
    if (isDone) {
      btn.innerHTML = `<span>✅</span><span class="hidden md:inline">Completed!</span>`;
      btn.className = "px-2.5 py-1.5 rounded-xl bg-sky-500 border border-sky-600 text-white text-xs font-bold flex items-center gap-1 transition flex-shrink-0 shadow-md cursor-pointer";
    } else {
      btn.innerHTML = `<span>⚪</span><span class="hidden md:inline">Mark Completed</span>`;
      btn.className = "px-2.5 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-700 text-xs font-bold flex items-center gap-1 transition flex-shrink-0 shadow-xs cursor-pointer";
    }
  }

  function updateProgressHeader() {
    const count = studyData.completedChapters.length;
    const badge = document.getElementById('dashCompletedBadge');
    if (badge) badge.textContent = `${count}/12`;
  }

  // ================= 7. AUDIO PLAYER CONTROLS (UNIFIED FOR LESSON & PDF) =================
  let isAudioDropdownInitialized = false;

  function populateUnifiedAudioSelector() {
    if (isAudioDropdownInitialized && audioTrackSelect && audioTrackSelect.options.length > 0) return;

    const allTracks = [];
    const fullChapterAudios = [];

    if (typeof NETZWERK_DATA !== 'undefined' && Array.isArray(NETZWERK_DATA.chapters)) {
      NETZWERK_DATA.chapters.forEach(ch => {
        if (ch.audioKapitel) {
          fullChapterAudios.push({
            id: `kapitel-${ch.id}`,
            name: `Full Chapter: ${ch.title}`,
            path: ch.audioKapitel
          });
        }
        if (Array.isArray(ch.audioTracks)) {
          ch.audioTracks.forEach(tr => {
            allTracks.push({
              id: tr.id,
              name: tr.name || `Track ${tr.id}`,
              path: tr.path
            });
          });
        }
      });
    }

    // Sort tracks strictly by natural numerical ID (e.g. 1-001, 1-002 ... 1-098, 2-001 ... 2-062)
    allTracks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

    // Group strictly by Track Numbers (as requested: "kelompokin per nomornya aja jgn per bab")
    const groups = [
      {
        label: "Tracks 1-001 — 1-050",
        items: allTracks.filter(t => t.id.startsWith("1-") && parseInt(t.id.slice(2), 10) <= 50)
      },
      {
        label: "Tracks 1-051 — 1-098",
        items: allTracks.filter(t => t.id.startsWith("1-") && parseInt(t.id.slice(2), 10) > 50)
      },
      {
        label: "Tracks 2-001 — 2-062",
        items: allTracks.filter(t => t.id.startsWith("2-"))
      }
    ];

    [audioTrackSelect, pdfAudioTrackSelect].forEach(selectEl => {
      if (!selectEl) return;
      selectEl.innerHTML = '';

      groups.forEach(grp => {
        if (!grp.items || grp.items.length === 0) return;
        const optgroup = document.createElement('optgroup');
        optgroup.label = grp.label;

        grp.items.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item.path;
          opt.textContent = `🎵 ${item.name}`;
          optgroup.appendChild(opt);
        });

        selectEl.appendChild(optgroup);
      });
    });

    isAudioDropdownInitialized = true;
  }

  function updateAudioTracks(chapter) {
    populateUnifiedAudioSelector();

    // Determine default track to select for this chapter (prioritize existing tracks)
    const defaultTrack = (chapter.audioTracks && chapter.audioTracks[0] ? chapter.audioTracks[0].path : '') || chapter.audioKapitel || '';

    if (defaultTrack) {
      if (audioTrackSelect) audioTrackSelect.value = defaultTrack;
      if (pdfAudioTrackSelect) pdfAudioTrackSelect.value = defaultTrack;

      // If audio player is idle or paused, load default track
      if (!audioPlayer.src || audioPlayer.paused) {
        audioPlayer.src = encodeURI(defaultTrack);
        audioPlayer.load();
        resetAudioState();
      }
    }
  }

  function syncAudioStateUI(isPlaying) {
    const playSvg = `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    const pauseSvg = `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    const pdfPlaySvg = `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    const pdfPauseSvg = `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    if (isPlaying) {
      if (playPauseBtn) playPauseBtn.innerHTML = pauseSvg;
      if (pdfPlayPauseBtn) pdfPlayPauseBtn.innerHTML = pdfPauseSvg;
      if (audioWave) audioWave.classList.remove('paused');
      if (pdfAudioWave) pdfAudioWave.classList.remove('paused');
    } else {
      if (playPauseBtn) playPauseBtn.innerHTML = playSvg;
      if (pdfPlayPauseBtn) pdfPlayPauseBtn.innerHTML = pdfPlaySvg;
      if (audioWave) audioWave.classList.add('paused');
      if (pdfAudioWave) pdfAudioWave.classList.add('paused');
    }
  }

  window.playQuickTrack = function(path) {
    if (!path) return;
    populateUnifiedAudioSelector();
    audioPlayer.src = encodeURI(path);
    audioPlayer.play().then(() => {
      isPlayingAudio = true;
      syncAudioStateUI(true);
      if (audioTrackSelect) audioTrackSelect.value = path;
      if (pdfAudioTrackSelect) pdfAudioTrackSelect.value = path;
    }).catch(err => {
      console.warn("Audio playback blocked:", err);
    });
  };

  function resetAudioState() {
    isPlayingAudio = false;
    syncAudioStateUI(false);
    if (audioProgress) audioProgress.value = 0;
    if (pdfAudioProgress) pdfAudioProgress.value = 0;
  }

  playPauseBtn.addEventListener('click', () => {
    populateUnifiedAudioSelector();
    if (!audioPlayer.src && audioTrackSelect.value) {
      audioPlayer.src = encodeURI(audioTrackSelect.value);
    }
    if (!audioPlayer.src) return;
    if (audioPlayer.paused) {
      audioPlayer.play().then(() => {
        isPlayingAudio = true;
        syncAudioStateUI(true);
      }).catch(err => {
        console.warn("Audio playback blocked:", err);
      });
    } else {
      audioPlayer.pause();
      resetAudioState();
    }
  });

  audioTrackSelect.addEventListener('change', (e) => {
    playQuickTrack(e.target.value);
  });

  // PDF Media Bar Functions
  window.togglePdfAudioPlay = function() {
    populateUnifiedAudioSelector();
    if (!audioPlayer.src && pdfAudioTrackSelect && pdfAudioTrackSelect.value) {
      audioPlayer.src = encodeURI(pdfAudioTrackSelect.value);
    }
    if (!audioPlayer.src) return;
    if (audioPlayer.paused) {
      audioPlayer.play().then(() => {
        isPlayingAudio = true;
        syncAudioStateUI(true);
      }).catch(err => {
        console.warn("Audio playback blocked:", err);
      });
    } else {
      audioPlayer.pause();
      resetAudioState();
    }
  };

  window.changePdfAudioTrack = function(path) {
    if (!path) return;
    if (audioTrackSelect) audioTrackSelect.value = path;
    playQuickTrack(path);
  };

  window.stepPdfAudioTrack = function(delta) {
    populateUnifiedAudioSelector();
    if (!pdfAudioTrackSelect || pdfAudioTrackSelect.options.length === 0) return;
    let newIndex = pdfAudioTrackSelect.selectedIndex + delta;
    if (newIndex < 0) newIndex = pdfAudioTrackSelect.options.length - 1;
    if (newIndex >= pdfAudioTrackSelect.options.length) newIndex = 0;
    pdfAudioTrackSelect.selectedIndex = newIndex;
    changePdfAudioTrack(pdfAudioTrackSelect.value);
  };

  audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
      const cur = Math.floor(audioPlayer.currentTime);
      const dur = Math.floor(audioPlayer.duration);
      const curFormatted = formatTime(cur);
      const durFormatted = formatTime(dur);
      const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;

      if (audioTime) audioTime.textContent = curFormatted;
      if (audioDuration) audioDuration.textContent = durFormatted;
      if (audioProgress) audioProgress.value = pct;

      if (pdfAudioTime) pdfAudioTime.textContent = curFormatted;
      if (pdfAudioDuration) pdfAudioDuration.textContent = durFormatted;
      if (pdfAudioProgress) pdfAudioProgress.value = pct;
    }
  });

  audioPlayer.addEventListener('ended', () => {
    resetAudioState();
  });

  audioProgress.addEventListener('input', (e) => {
    if (audioPlayer.duration) {
      audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
    }
  });

  if (pdfAudioProgress) {
    pdfAudioProgress.addEventListener('input', (e) => {
      if (audioPlayer.duration) {
        audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
      }
    });
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // ================= 8. PDF VIEWER NAVIGATION =================
  window.switchDoc = function(docType) {
    currentDoc = docType;
    document.querySelectorAll('.doc-tab-btn').forEach(b => {
      b.classList.remove('bg-sky-500', 'text-white', 'shadow-xs');
      b.classList.add('text-sky-700');
    });

    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
    const totalPages = chapter.pdfChapterTotalPages || 10;
    const pageTotalBadge = document.getElementById('pageTotalBadge');

    if (docType === 'kursbuch') {
      const btn = document.getElementById('tabKursbuch');
      if (btn) {
        btn.classList.add('bg-sky-500', 'text-white', 'shadow-xs');
        btn.classList.remove('text-sky-700');
      }
      docBadge.textContent = `${chapter.title} (PDF - ${totalPages} Pages)`;
      pageInput.value = 1;
      pageInput.min = 1;
      pageInput.max = totalPages;
      if (pageTotalBadge) pageTotalBadge.textContent = `/ ${totalPages}`;
      updatePdfSource(1);
    } else if (docType === 'fullbook') {
      const btn = document.getElementById('tabFullBook');
      if (btn) {
        btn.classList.add('bg-sky-500', 'text-white', 'shadow-xs');
        btn.classList.remove('text-sky-700');
      }
      docBadge.textContent = `Full Kursbuch (Page ${chapter.pdfPage})`;
      pageInput.value = chapter.pdfPage;
      pageInput.min = 1;
      pageInput.max = 176;
      if (pageTotalBadge) pageTotalBadge.textContent = `/ 176`;
      updatePdfSource(chapter.pdfPage);
    } else if (docType === 'loesungen1_6') {
      const btn = document.getElementById('tabLoesung1');
      if (btn) {
        btn.classList.add('bg-sky-500', 'text-white', 'shadow-xs');
        btn.classList.remove('text-sky-700');
      }
      docBadge.textContent = "Solutions (Kapitel 1 - 6)";
      pageInput.value = 1;
      pageInput.min = 1;
      pageInput.max = 50;
      if (pageTotalBadge) pageTotalBadge.textContent = `/ 50`;
      updatePdfSource(1);
    } else if (docType === 'loesungen7_12') {
      const btn = document.getElementById('tabLoesung2');
      if (btn) {
        btn.classList.add('bg-sky-500', 'text-white', 'shadow-xs');
        btn.classList.remove('text-sky-700');
      }
      docBadge.textContent = "Solutions (Kapitel 7 - 12)";
      pageInput.value = 1;
      pageInput.min = 1;
      pageInput.max = 50;
      if (pageTotalBadge) pageTotalBadge.textContent = `/ 50`;
      updatePdfSource(1);
    }

    redrawPdfStrokes();
  };

  window.jumpToPage = function() {
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
    const totalPages = (currentDoc === 'kursbuch')
      ? (chapter.pdfChapterTotalPages || 10)
      : (currentDoc === 'fullbook' ? 176 : 50);

    let p = parseInt(pageInput.value, 10);
    if (!isNaN(p) && p > 0) {
      p = Math.max(1, Math.min(totalPages, p));
      pageInput.value = p;
      if (currentDoc === 'kursbuch' || currentDoc === 'fullbook') {
        studyData.lastPage = p;
        saveStudyData();
      }
      updatePdfSource(p);
      redrawPdfStrokes();
    }
  };

  window.changePage = function(delta) {
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
    const totalPages = (currentDoc === 'kursbuch')
      ? (chapter.pdfChapterTotalPages || 10)
      : (currentDoc === 'fullbook' ? 176 : 50);

    let p = parseInt(pageInput.value, 10) || 1;
    p = Math.max(1, Math.min(totalPages, p + delta));
    pageInput.value = p;
    if (currentDoc === 'kursbuch' || currentDoc === 'fullbook') {
      studyData.lastPage = p;
      saveStudyData();
    }
    updatePdfSource(p);
    redrawPdfStrokes();
  };

  // ================= 8. PDF.JS NATIVE CANVAS RENDERING & NAVIGATION =================
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  let currentPdfDoc = null;
  let currentPdfPath = '';
  let pdfZoomLevel = 1.0;
  let pdfRenderTask = null;

  async function renderPdfPageWithPdfJs(pdfPath, pageNum) {
    const renderCanvas = document.getElementById('pdfRenderCanvas');
    const wrapper = document.getElementById('pdfCanvasWrapper');
    const spinner = document.getElementById('pdfLoadingSpinner');
    const viewportEl = document.getElementById('pdfViewport');
    const annotCanvas = document.getElementById('pdfAnnotationCanvas');
    if (!renderCanvas) return;

    if (!window.pdfjsLib) {
      console.warn("PDF.js library not loaded yet");
      return;
    }

    if (spinner) {
      spinner.style.display = 'flex';
      spinner.style.opacity = '1';
    }

    try {
      if (currentPdfPath !== pdfPath || !currentPdfDoc) {
        if (pdfRenderTask) {
          try { pdfRenderTask.cancel(); } catch (e) {}
          pdfRenderTask = null;
        }
        currentPdfPath = pdfPath;
        const loadingTask = pdfjsLib.getDocument({
          url: pdfPath,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true
        });
        currentPdfDoc = await loadingTask.promise;
      }

      if (pdfRenderTask) {
        try { pdfRenderTask.cancel(); } catch (e) {}
        pdfRenderTask = null;
      }

      const page = await currentPdfDoc.getPage(pageNum);

      // Responsive Fit Calculation: Fit to available width inside container
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const availableWidth = Math.max(300, (viewportEl ? viewportEl.clientWidth : window.innerWidth) - 36);
      const baseFitScale = availableWidth / unscaledViewport.width;
      const targetScale = Math.min(3.0, Math.max(0.45, baseFitScale * pdfZoomLevel));

      const viewport = page.getViewport({ scale: targetScale });

      renderCanvas.width = viewport.width;
      renderCanvas.height = viewport.height;
      if (wrapper) {
        wrapper.style.width = viewport.width + 'px';
        wrapper.style.height = viewport.height + 'px';
      }

      if (annotCanvas) {
        annotCanvas.width = viewport.width;
        annotCanvas.height = viewport.height;
      }

      const ctx = renderCanvas.getContext('2d');
      pdfRenderTask = page.render({
        canvasContext: ctx,
        viewport: viewport
      });

      await pdfRenderTask.promise;
      pdfRenderTask = null;

      redrawPdfStrokes();

      if (spinner) {
        spinner.style.display = 'none';
      }
    } catch (err) {
      if (err && err.name === 'RenderingCancelledException') return;
      console.error("PDF.js rendering error:", err);
      if (spinner) {
        spinner.innerHTML = `
          <div class="text-center p-4">
            <p class="text-xs font-bold text-rose-600 mb-2">PDF page could not be loaded directly</p>
            <a href="${encodeURI(pdfPath)}" target="_blank" class="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs inline-block">Open External PDF File</a>
          </div>
        `;
      }
    }
  }

  window.zoomPdf = function(delta) {
    pdfZoomLevel = Math.min(2.5, Math.max(0.5, pdfZoomLevel + delta));
    const badge = document.getElementById('pdfZoomBadge');
    if (badge) badge.textContent = `${Math.round(pdfZoomLevel * 100)}%`;
    const p = parseInt(pageInput.value, 10) || 1;
    updatePdfSource(p);
  };

  window.resetPdfZoom = function() {
    pdfZoomLevel = 1.0;
    const badge = document.getElementById('pdfZoomBadge');
    if (badge) badge.textContent = '100%';
    const p = parseInt(pageInput.value, 10) || 1;
    updatePdfSource(p);
  };

  function updatePdfSource(pageNumber) {
    let basePath = NETZWERK_DATA.pdf.kursbuch;
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];

    if (currentDoc === 'kursbuch') {
      basePath = chapter.pdfChapterFile || `${BASE_PATH}per_kapitel_pdf/Kapitel_${chapter.id}.pdf`;
    } else if (currentDoc === 'fullbook') {
      basePath = NETZWERK_DATA.pdf.kursbuch;
    } else if (currentDoc === 'loesungen1_6') {
      basePath = NETZWERK_DATA.pdf.loesungen1_6;
    } else if (currentDoc === 'loesungen7_12') {
      basePath = NETZWERK_DATA.pdf.loesungen7_12;
    }
    renderPdfPageWithPdfJs(basePath, pageNumber);
  }

  window.openPdfInNewTab = function() {
    let basePath = NETZWERK_DATA.pdf.kursbuch;
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];

    if (currentDoc === 'kursbuch') {
      basePath = chapter.pdfChapterFile || `${BASE_PATH}per_kapitel_pdf/Kapitel_${chapter.id}.pdf`;
    } else if (currentDoc === 'fullbook') {
      basePath = NETZWERK_DATA.pdf.kursbuch;
    } else if (currentDoc === 'loesungen1_6') {
      basePath = NETZWERK_DATA.pdf.loesungen1_6;
    } else if (currentDoc === 'loesungen7_12') {
      basePath = NETZWERK_DATA.pdf.loesungen7_12;
    }
    const p = parseInt(pageInput.value, 10) || 1;
    window.open(`${encodeURI(basePath)}#page=${p}`, '_blank');
  };

  // ================= 9. PERSISTENT PDF DRAWING & ANNOTATION ENGINE =================
  const canvas = document.getElementById('pdfAnnotationCanvas');
  const canvasCtx = canvas ? canvas.getContext('2d') : null;
  let currentPdfTool = 'hand'; // 'hand', 'pen', 'highlighter', 'eraser'
  let currentPdfColor = '#0284c7';
  let currentPdfStrokeWidth = 4;
  let isDrawing = false;
  let activeStroke = null;

  function getCanvasStorageKey() {
    const chap = NETZWERK_DATA.chapters[currentChapterIndex];
    const p = parseInt(pageInput.value, 10) || 1;
    return `netzwerk_notes_doc_${currentDoc}_chap_${chap.id}_page_${p}`;
  }

  function loadPageStrokes() {
    const key = getCanvasStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  }

  function savePageStrokes(strokes) {
    const key = getCanvasStorageKey();
    localStorage.setItem(key, JSON.stringify(strokes));
  }

  function resizePdfCanvas() {
    if (!canvas) return;
    const renderCanvas = document.getElementById('pdfRenderCanvas');
    if (renderCanvas && renderCanvas.width > 0) {
      canvas.width = renderCanvas.width;
      canvas.height = renderCanvas.height;
    }
  }

  window.addEventListener('resize', () => {
    const p = parseInt(pageInput.value, 10) || 1;
    updatePdfSource(p);
  });

  function redrawPdfStrokes() {
    if (!canvasCtx || !canvas) return;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const strokes = loadPageStrokes();
    strokes.forEach(s => drawSingleStroke(s, canvasCtx));
  }

  function drawSingleStroke(stroke, ctx) {
    if (!stroke.points || stroke.points.length < 2) return;

    const rect = canvas ? canvas.getBoundingClientRect() : null;
    const scaleRatio = (rect && rect.width > 0) ? (canvas.width / rect.width) : 1;
    const effectiveWidth = (stroke.width || 4) * scaleRatio;

    ctx.save();
    if (stroke.tool === 'highlighter') {
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = effectiveWidth * 3.5;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = effectiveWidth * 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      // Pen
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = effectiveWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      if (currentPdfTool === 'hand') return;
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
      const y = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0;

      activeStroke = {
        tool: currentPdfTool,
        color: currentPdfColor,
        width: currentPdfStrokeWidth,
        points: [{ x, y }]
      };
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isDrawing || !activeStroke) return;
      const rect = canvas.getBoundingClientRect();
      const x = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
      const y = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0;

      activeStroke.points.push({ x, y });

      const scaleRatio = rect.width > 0 ? (canvas.width / rect.width) : 1;
      const effectiveWidth = (activeStroke.width || 4) * scaleRatio;

      // Draw current active segment incrementally
      canvasCtx.save();
      if (activeStroke.tool === 'highlighter') {
        canvasCtx.globalAlpha = 0.38;
        canvasCtx.strokeStyle = activeStroke.color;
        canvasCtx.lineWidth = effectiveWidth * 3.5;
        canvasCtx.lineCap = 'square';
      } else if (activeStroke.tool === 'eraser') {
        canvasCtx.globalCompositeOperation = 'destination-out';
        canvasCtx.lineWidth = effectiveWidth * 5;
        canvasCtx.lineCap = 'round';
      } else {
        canvasCtx.globalAlpha = 1.0;
        canvasCtx.strokeStyle = activeStroke.color;
        canvasCtx.lineWidth = effectiveWidth;
        canvasCtx.lineCap = 'round';
      }

      const pts = activeStroke.points;
      const pPrev = pts[pts.length - 2];
      const pCur = pts[pts.length - 1];

      canvasCtx.beginPath();
      canvasCtx.moveTo(pPrev.x * canvas.width, pPrev.y * canvas.height);
      canvasCtx.lineTo(pCur.x * canvas.width, pCur.y * canvas.height);
      canvasCtx.stroke();
      canvasCtx.restore();
    });

    const finishStroke = (e) => {
      if (!isDrawing || !activeStroke) return;
      isDrawing = false;
      if (activeStroke.points && activeStroke.points.length > 1) {
        const strokes = loadPageStrokes();
        strokes.push(activeStroke);
        savePageStrokes(strokes);
      }
      activeStroke = null;
      redrawPdfStrokes();
    };

    canvas.addEventListener('pointerup', finishStroke);
    canvas.addEventListener('pointercancel', finishStroke);
  }

  window.setPdfTool = function(tool) {
    currentPdfTool = tool;
    ['hand', 'pen', 'highlighter', 'eraser'].forEach(t => {
      const btn = document.getElementById(`toolBtn-${t}`);
      if (btn) {
        if (t === tool) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    if (canvas) {
      canvas.className = `mode-${tool}`;
    }
  };

  window.setPdfColor = function(color) {
    currentPdfColor = color;
    document.querySelectorAll('.color-swatch').forEach(btn => {
      if (btn.getAttribute('data-color') === color) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  window.setPdfStrokeWidth = function(w) {
    currentPdfStrokeWidth = w;
    [2, 4, 8].forEach(widthVal => {
      const btn = document.getElementById(`strokeWidthBtn-${widthVal}`);
      if (btn) {
        if (widthVal === w) {
          btn.className = "px-2.5 py-1 text-xs font-bold rounded-lg transition bg-sky-600 text-white shadow-xs cursor-pointer";
        } else {
          btn.className = "px-2.5 py-1 text-xs font-bold rounded-lg transition text-sky-800 bg-white hover:bg-sky-100 cursor-pointer";
        }
      }
    });
  };

  window.undoPdfStroke = function() {
    const strokes = loadPageStrokes();
    if (strokes.length > 0) {
      strokes.pop();
      savePageStrokes(strokes);
      redrawPdfStrokes();
    }
  };

  window.clearPdfStrokes = function() {
    if (confirm("Clear all hand-drawn notes and highlights on this page?")) {
      savePageStrokes([]);
      redrawPdfStrokes();
    }
  };

  // ================= 10. DOWNLOAD LESSON OVERVIEW AS PDF (DRUCKEN) =================
  window.downloadLessonPDF = function() {
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
    const container = document.getElementById('autoLessonContainer');
    if (!container) return;

    let printFrame = document.getElementById('lessonPrintFrame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'lessonPrintFrame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cheeya Studio - ${chapter.title} Lesson Overview</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 28px;
            color: #111827;
            font-size: 13px;
            line-height: 1.6;
          }
          .header-box {
            border-bottom: 2.5px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .studio-tag {
            font-size: 11px;
            font-weight: bold;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          h1 {
            margin: 4px 0 2px 0;
            font-size: 22px;
            color: #0c4a6e;
          }
          .subtitle {
            font-size: 13px;
            color: #475569;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
            font-size: 12px;
            page-break-inside: avoid;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 7px 10px;
            text-align: left;
          }
          th {
            background-color: #f0f9ff;
            color: #0c4a6e;
            font-weight: bold;
          }
          h2, h3, h4 {
            color: #075985;
            margin-top: 18px;
            margin-bottom: 6px;
            page-break-after: avoid;
          }
          blockquote {
            border-left: 3.5px solid #38bdf8;
            margin: 10px 0;
            padding: 6px 12px;
            background-color: #f0f9ff;
            font-style: italic;
          }
          .footer-note {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
          }
          button, input, select, .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="studio-tag">CHEEYA STUDIO • NETZWERK NEU A1 CURRICULUM GUIDE</div>
          <h1>${chapter.title}</h1>
          <div class="subtitle">${chapter.subtitle}</div>
        </div>

        <div class="lesson-content">
          ${container.innerHTML}
        </div>

        <div class="footer-note">
          Generated from Cheeya Studio Netzwerk Neu A1 Interactive Hub • All Rights Reserved.
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    }, 350);
  };

  // ================= 11. VIDEO MODAL CONTROLS =================
  function updateVideoList(chapter) {
    videoSelect.innerHTML = '';
    chapter.videos.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.path;
      opt.textContent = `🎬 ${v.title}`;
      videoSelect.appendChild(opt);
    });
  }

  window.openVideoModal = function() {
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
    videoModalTitle.textContent = `Learning Videos: ${chapter.title}`;
    if (videoSelect.options.length > 0) {
      videoPlayer.src = encodeURI(videoSelect.value);
    }
    videoModal.classList.remove('hidden');
  };

  window.closeVideoModal = function() {
    videoPlayer.pause();
    videoModal.classList.add('hidden');
  };

  videoSelect.addEventListener('change', (e) => {
    videoPlayer.src = encodeURI(e.target.value);
    videoPlayer.play();
  });

  window.playInlineVideo = function(videoSrc, btnElem) {
    const inlinePlayer = document.getElementById('inlineLessonVideoPlayer');
    if (inlinePlayer) {
      inlinePlayer.src = videoSrc;
      inlinePlayer.play().catch(() => {});
    }
    const allBtns = document.querySelectorAll('.inline-video-btn');
    allBtns.forEach(b => {
      b.className = "inline-video-btn w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer bg-white/90 hover:bg-purple-50 border-purple-200 text-slate-800 font-medium";
    });
    if (btnElem) {
      btnElem.className = "inline-video-btn w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer bg-purple-100/90 border-purple-400 text-purple-950 font-bold shadow-xs";
    }
  };

  // ================= 12. DYNAMIC CHAPTER-SPECIFIC GRAMMAR REFERENCE =================
  const CHAPTER_GRAMMAR_DATA = {
    1: {
      title: "Kapitel 1: Guten Tag! — Grammar Reference",
      topics: [
        {
          heading: "1. Verb Conjugation in Present Tense (Präsens)",
          desc: "German verbs change endings according to the subject pronoun. Drop <strong>-en</strong> from the infinitive to find the stem, then add standard endings:",
          table: {
            headers: ["Pronoun", "Ending", "heißen (to be called)", "kommen (to come)", "sprechen (to speak)"],
            rows: [
              ["<strong>ich</strong> (I)", "-e", "heiße", "komme", "spreche"],
              ["<strong>du</strong> (you, informal)", "-st", "heißt", "kommst", "sprichst <em>(e->i)</em>"],
              ["<strong>er / sie / es</strong> (he/she/it)", "-t", "heißt", "kommt", "spricht <em>(e->i)</em>"],
              ["<strong>wir</strong> (we)", "-en", "heißen", "kommen", "sprechen"],
              ["<strong>ihr</strong> (you all)", "-t", "heißt", "kommt", "sprecht"],
              ["<strong>sie / Sie</strong> (they / you formal)", "-en", "heißen", "kommen", "sprechen"]
            ]
          },
          note: "💡 <em>Irregular Verb:</em> <strong>sein</strong> (to be) -> ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind."
        },
        {
          heading: "2. Sentence Structure: W-Questions vs Yes/No Questions",
          desc: "In German main clauses, the conjugated verb ALWAYS stands in <strong>Position 2</strong>:",
          table: {
            headers: ["Type", "Position 1", "Position 2 (VERB)", "Position 3+", "Example Meaning"],
            rows: [
              ["W-Frage", "Wie", "<strong>heißen</strong>", "Sie?", "What is your name?"],
              ["W-Frage", "Woher", "<strong>kommen</strong>", "Sie?", "Where are you from?"],
              ["Statement", "Ich", "<strong>komme</strong>", "aus Spanien.", "I come from Spain."],
              ["Ja/Nein Frage", "—", "<strong>Sprechen</strong>", "Sie Deutsch?", "Do you speak German? (Verb in Pos 1)"]
            ]
          }
        }
      ]
    },
    2: {
      title: "Kapitel 2: Freunde, Kollegen und ich — Grammar Reference",
      topics: [
        {
          heading: "1. Articles in Nominativ: Definite, Indefinite & Negation",
          desc: "Every German noun has a grammatical gender: Masculine (der), Feminine (die), or Neuter (das).",
          table: {
            headers: ["Gender", "Definite (The)", "Indefinite (A / An)", "Negative (No / None)", "Example Noun"],
            rows: [
              ["<span class='badge-der px-2 py-0.5 rounded font-bold'>Masculine (m)</span>", "<strong>der</strong>", "<strong>ein</strong>", "<strong>kein</strong>", "der Beruf, ein Freund"],
              ["<span class='badge-die px-2 py-0.5 rounded font-bold'>Feminine (f)</span>", "<strong>die</strong>", "<strong>eine</strong>", "<strong>keine</strong>", "die Kollegin, eine Sprache"],
              ["<span class='badge-das px-2 py-0.5 rounded font-bold'>Neuter (n)</span>", "<strong>das</strong>", "<strong>ein</strong>", "<strong>kein</strong>", "das Hobby, ein Foto"],
              ["<span class='bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold'>Plural (Pl.)</span>", "<strong>die</strong>", "— (none)", "<strong>keine</strong>", "die Hobbys, Freunde"]
            ]
          },
          note: "💡 Use <strong>kein / keine</strong> for nouns without article or with <em>ein</em>. Use <strong>nicht</strong> to negate verbs, adjectives, or entire clauses (*Ich arbeite nicht*)."
        },
        {
          heading: "2. Irregular Verb: haben (to have)",
          desc: "ich habe, du <strong>hast</strong>, er/sie/es <strong>hat</strong>, wir haben, ihr habt, sie/Sie haben."
        }
      ]
    },
    3: {
      title: "Kapitel 3: In Hamburg — Grammar Reference",
      topics: [
        {
          heading: "1. Der Akkusativ (Direct Object Case)",
          desc: "When a noun is the direct object of a verb (e.g. *finden, suchen, haben, sehen, kaufen*), Masculine changes from <strong>der -> den</strong>. Feminine, Neuter, and Plural do NOT change!",
          table: {
            headers: ["Gender", "Nominativ (Subject)", "Akkusativ (Object)", "Indefinite Akkusativ", "Negative Akkusativ"],
            rows: [
              ["<span class='badge-der px-2 py-0.5 rounded font-bold'>Masculine</span>", "der Bahnhof", "<strong>den</strong> Bahnhof", "<strong>einen</strong> Bahnhof", "<strong>keinen</strong> Bahnhof"],
              ["<span class='badge-die px-2 py-0.5 rounded font-bold'>Feminine</span>", "die Kirche", "<strong>die</strong> Kirche", "<strong>eine</strong> Kirche", "<strong>keine</strong> Kirche"],
              ["<span class='badge-das px-2 py-0.5 rounded font-bold'>Neuter</span>", "das Hotel", "<strong>das</strong> Hotel", "<strong>ein</strong> Hotel", "<strong>kein</strong> Hotel"],
              ["<span class='bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold'>Plural</span>", "die Museen", "<strong>die</strong> Museen", "— Museen", "<strong>keine</strong> Museen"]
            ]
          },
          note: "💡 <strong>Rule of thumb:</strong> Only masculine nouns change in Akkusativ (*der -> den*, *ein -> einen*, *kein -> keinen*, *mein -> meinen*)."
        },
        {
          heading: "2. Possessive Pronouns (Nominativ)",
          desc: "<strong>ich</strong> -> mein / meine | <strong>du</strong> -> dein / deine (Add <strong>-e</strong> for feminine and plural nouns: *meine Stadt*, *deine Freunde*)."
        }
      ]
    },
    4: {
      title: "Kapitel 4: Guten Appetit! — Grammar Reference",
      topics: [
        {
          heading: "1. Food & Akkusativ with Verbs: essen, trinken, möchten",
          desc: "When ordering food or shopping at the market:",
          table: {
            headers: ["Verb", "Conjugation", "Example Akkusativ Phrase"],
            rows: [
              ["möchten (would like)", "ich möchte, du möchtest, er möchte, wir möchten", "Ich möchte <strong>einen Apfel</strong> (m) und <strong>ein Brot</strong> (n)."],
              ["essen (to eat - vowel shift)", "ich esse, du <strong>isst</strong>, er <strong>isst</strong>, wir essen", "Er isst <strong>einen Salat</strong>."],
              ["nehmen (to take)", "ich nehme, du <strong>nimmst</strong>, er <strong>nimmt</strong>, wir nehmen", "Ich nehme <strong>den Fisch</strong>."]
            ]
          }
        },
        {
          heading: "2. Quantities & Plurals for Food",
          desc: "ein Kilo Äpfel, ein Pfund Butter, ein Liter Milch, zwei Flaschen Wasser, drei Gläser Marmelade."
        }
      ]
    },
    5: {
      title: "Kapitel 5: Alltag und Familie — Grammar Reference",
      topics: [
        {
          heading: "1. Trennbare Verben (Separable Verbs) & Satzklammer",
          desc: "In present tense, the prefix detaches and flies to the very <strong>end of the clause</strong>:",
          table: {
            headers: ["Infinitive", "Prefix", "Example Sentence", "Meaning"],
            rows: [
              ["aufstehen", "auf-", "Ich <strong>stehe</strong> jeden Tag um 7 Uhr <strong>auf</strong>.", "I get up every day at 7 AM."],
              ["anrufen", "an-", "Er <strong>ruft</strong> seine Mutter <strong>an</strong>.", "He calls his mother."],
              ["fernsehen", "fern-", "Wir <strong>sehen</strong> am Abend <strong>fern</strong>.", "We watch TV in the evening."],
              ["einkaufen", "ein-", "Sie <strong>kauft</strong> im Supermarkt <strong>ein</strong>.", "She shops at the supermarket."]
            ]
          }
        },
        {
          heading: "2. Modal Verbs: können (can) & müssen (must)",
          desc: "Modal verb takes Position 2; the main action verb goes to the end in <strong>infinitive</strong> (*Satzklammer*):<br/><em>Ich <strong>muss</strong> heute lange <strong>arbeiten</strong>.</em> (I have to work late today)."
        }
      ]
    },
    6: {
      title: "Kapitel 6: Zeit mit Freunden — Grammar Reference",
      topics: [
        {
          heading: "1. Der Imperativ (Giving Commands & Requests)",
          desc: "How to tell someone to do something in German:",
          table: {
            headers: ["Form", "Rule", "kommen", "lesen", "sein"],
            rows: [
              ["<strong>du</strong> (informal singular)", "Drop pronoun & -st", "<strong>Komm!</strong>", "<strong>Lies!</strong>", "<strong>Sei ruhig!</strong>"],
              ["<strong>ihr</strong> (informal plural)", "Same as ihr-verb form", "<strong>Kommt!</strong>", "<strong>Lest!</strong>", "<strong>Seid pünktlich!</strong>"],
              ["<strong>Sie</strong> (formal)", "Verb + Sie inverted", "<strong>Kommen Sie!</strong>", "<strong>Lesen Sie!</strong>", "<strong>Seien Sie willkommen!</strong>"]
            ]
          }
        },
        {
          heading: "2. Preposition: für (+ Akkusativ)",
          desc: "<em>Das Geschenk ist <strong>für den</strong> Freund (m), <strong>für die</strong> Schwester (f), <strong>für das</strong> Kind (n).</em>"
        }
      ]
    },
    7: {
      title: "Kapitel 7: Arbeitsalltag — Grammar Reference",
      topics: [
        {
          heading: "1. Der Dativ (Indirect Object & Location Case)",
          desc: "In Dativ case, definite articles transform completely:",
          table: {
            headers: ["Gender", "Nominativ", "Akkusativ", "Dativ", "Indefinite Dativ"],
            rows: [
              ["<span class='badge-der px-2 py-0.5 rounded font-bold'>Masculine</span>", "der Chef", "den Chef", "<strong>dem</strong> Chef", "<strong>einem</strong> Chef"],
              ["<span class='badge-die px-2 py-0.5 rounded font-bold'>Feminine</span>", "die Kollegin", "die Kollegin", "<strong>der</strong> Kollegin", "<strong>einer</strong> Kollegin"],
              ["<span class='badge-das px-2 py-0.5 rounded font-bold'>Neuter</span>", "das Büro", "das Büro", "<strong>dem</strong> Büro", "<strong>einem</strong> Büro"],
              ["<span class='bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold'>Plural</span>", "die Kunden", "die Kunden", "<strong>den</strong> Kunden <strong>(+n)</strong>", "<strong>keinen</strong> Kunden"]
            ]
          }
        },
        {
          heading: "2. Dativ Prepositions (Always Dativ!)",
          desc: "<strong>aus, bei, mit, nach, seit, von, zu</strong><br/><em>Ich fahre <strong>mit dem</strong> Bus (m). Ich gehe <strong>zur</strong> (zu der) Arbeit (f). Er wohnt <strong>bei seinen</strong> Eltern (Pl).</em>"
        }
      ]
    },
    8: {
      title: "Kapitel 8: Fit und gesund — Grammar Reference",
      topics: [
        {
          heading: "1. Modal Verbs: dürfen (allowed to) & sollen (should)",
          desc: "<strong>dürfen</strong>: express permission or prohibition (*Sie dürfen hier nicht rauchen*).<br/><strong>sollen</strong>: express advice or doctor recommendations (*Du sollst viel Wasser trinken*).",
          table: {
            headers: ["Pronoun", "dürfen (may/allowed)", "sollen (should/ought to)"],
            rows: [
              ["ich", "<strong>darf</strong>", "<strong>soll</strong>"],
              ["du", "<strong>darfst</strong>", "<strong>sollst</strong>"],
              ["er/sie/es", "<strong>darf</strong>", "<strong>soll</strong>"],
              ["wir", "<strong>dürfen</strong>", "<strong>sollen</strong>"],
              ["ihr", "<strong>dürft</strong>", "<strong>sollt</strong>"],
              ["sie/Sie", "<strong>dürfen</strong>", "<strong>sollen</strong>"]
            ]
          }
        },
        {
          heading: "2. Health Expressions with Dativ",
          desc: "<em>Was fehlt <strong>Ihnen</strong>? — <strong>Mir</strong> tut der Kopf weh. Mein Rücken tut weh.</em>"
        }
      ]
    },
    9: {
      title: "Kapitel 9: Meine Wohnung — Grammar Reference",
      topics: [
        {
          heading: "1. Two-Way Prepositions (Wechselpräpositionen)",
          desc: "Prepositions: <strong>an, auf, hinter, in, neben, über, unter, vor, zwischen</strong>.<br/>• <strong>Wohin?</strong> (Movement/Direction) -> <strong>AKKUSATIV</strong><br/>• <strong>Wo?</strong> (Position/Location) -> <strong>DATIV</strong>",
          table: {
            headers: ["Question", "Case", "Action Verb", "Location Verb", "Example"],
            rows: [
              ["<strong>Wohin?</strong>", "Akkusativ", "stellen (to place upright)", "—", "Ich stelle die Lampe <strong>auf den Tisch</strong> (m)."],
              ["<strong>Wo?</strong>", "Dativ", "—", "stehen (to stand)", "Die Lampe steht <strong>auf dem Tisch</strong> (m)."],
              ["<strong>Wohin?</strong>", "Akkusativ", "legen (to lay flat)", "—", "Er legt das Buch <strong>in das Regal</strong> (n)."],
              ["<strong>Wo?</strong>", "Dativ", "—", "liegen (to lie)", "Das Buch liegt <strong>im Regal</strong> (n)."]
            ]
          }
        }
      ]
    },
    10: {
      title: "Kapitel 10: Gute Reise! — Grammar Reference",
      topics: [
        {
          heading: "1. Das Perfekt (Spoken Past Tense)",
          desc: "Formed with auxiliary verb <strong>haben</strong> or <strong>sein</strong> in Position 2, plus <strong>Partizip II</strong> at the end of the sentence:",
          table: {
            headers: ["Verb Category", "Auxiliary", "Formula", "Examples"],
            rows: [
              ["Regular Verbs", "haben", "<strong>ge- + Stamm + -t</strong>", "ge-hör-t, ge-kauf-t, ge-mach-t"],
              ["Verbs on -ieren", "haben", "<strong>Stamm + -t (no ge-)</strong>", "reserviert, fotografiert, studiert"],
              ["Separable Verbs", "haben/sein", "<strong>Prefix + -ge- + Stamm + -t/-en</strong>", "auf-ge-räumt, ein-ge-kauft, an-ge-kommen"],
              ["Irregular Verbs", "haben/sein", "<strong>ge- + Stamm + -en</strong>", "ge-les-en, ge-schrieb-en, ge-fund-en"]
            ]
          },
          note: "💡 <strong>When to use 'sein'?</strong> With verbs of motion/location change (*gehen, fahren, fliegen, kommen, ankommen*) or change of state (*aufwachen, sterben*) and the verb *sein* itself (*Ich bin in Berlin gewesen*)."
        }
      ]
    },
    11: {
      title: "Kapitel 11: Kleidung und Mode — Grammar Reference",
      topics: [
        {
          heading: "1. Adjective Endings (Adjektivdeklination) with Definite Articles",
          desc: "Adjectives between an article and a noun take special endings:",
          table: {
            headers: ["Case", "Masculine (der)", "Feminine (die)", "Neuter (das)", "Plural (die)"],
            rows: [
              ["Nominativ", "der neu-<strong>e</strong> Mantel", "die schön-<strong>e</strong> Bluse", "das weiß-<strong>e</strong> Hemd", "die rot-<strong>en</strong> Schuhe"],
              ["Akkusativ", "den neu-<strong>en</strong> Mantel", "die schön-<strong>e</strong> Bluse", "das weiß-<strong>e</strong> Hemd", "die rot-<strong>en</strong> Schuhe"],
              ["Dativ", "dem neu-<strong>en</strong> Mantel", "der schön-<strong>en</strong> Bluse", "dem weiß-<strong>en</strong> Hemd", "den rot-<strong>en</strong> Schuhen"]
            ]
          }
        },
        {
          heading: "2. Comparison of Adjectives (Komparativ & Superlativ)",
          desc: "gut -> <strong>besser</strong> -> <strong>am besten</strong> | viel -> <strong>mehr</strong> -> <strong>am meisten</strong> | gern -> <strong>lieber</strong> -> <strong>am liebsten</strong>."
        }
      ]
    },
    12: {
      title: "Kapitel 12: In der Stadt und unterwegs — Grammar Reference",
      topics: [
        {
          heading: "1. Subordinate Clauses with 'weil' (Because)",
          desc: "The conjunction <strong>weil</strong> kicks the conjugated verb to the <strong>very end of the clause</strong>:",
          table: {
            headers: ["Main Clause", "Conjunction", "Subordinate Clause (Verb at end!)"],
            rows: [
              ["Ich lerne Deutsch,", "<strong>weil</strong>", "ich in Deutschland arbeiten <strong>möchte</strong>."],
              ["Er bleibt heute zu Hause,", "<strong>weil</strong>", "er krank <strong>ist</strong>."]
            ]
          }
        },
        {
          heading: "2. Travel Prepositions (Lokale Präpositionen)",
          desc: "• <strong>nach</strong>: countries without article and cities (*nach Deutschland, nach München*)<br/>• <strong>in</strong>: countries with article (*in die Schweiz, in die Türkei, in die USA*)<br/>• <strong>ans / am</strong>: bodies of water (*ans Meer, am See*)."
        }
      ]
    }
  };

  function renderGrammarDropdown() {
    const select = document.getElementById('grammarChapterSelect');
    if (!select) return;

    select.innerHTML = '';
    const optGlobal = document.createElement('option');
    optGlobal.value = 0;
    optGlobal.textContent = "🌟 Global Cheat Sheet: All Articles, Cases & Verbs";
    select.appendChild(optGlobal);

    NETZWERK_DATA.chapters.forEach(chap => {
      const opt = document.createElement('option');
      opt.value = chap.id;
      opt.textContent = `Kapitel ${chap.id}: ${chap.title}`;
      select.appendChild(opt);
    });

    select.value = currentChapterIndex + 1;
  }

  window.renderGrammarModalForChapter = function(chapterId) {
    const body = document.getElementById('grammarModalBody');
    if (!body) return;

    if (chapterId === 0) {
      // Global Overview
      body.innerHTML = `
        <div class="bg-white/95 rounded-2xl p-4 border border-sky-200 shadow-xs mb-3">
          <h4 class="font-extrabold text-sky-800 mb-2 text-sm">Comprehensive Cases Overview (Kasus)</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-sky-100/90 text-sky-950 font-bold border-b border-sky-300">
                <tr>
                  <th class="p-2">Case</th>
                  <th class="p-2 text-blue-700">Masculine</th>
                  <th class="p-2 text-indigo-700">Feminine</th>
                  <th class="p-2 text-emerald-700">Neuter</th>
                  <th class="p-2 text-amber-700">Plural</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-100 font-mono">
                <tr>
                  <td class="p-2 font-sans font-bold">Nominativ (Subject)</td>
                  <td class="p-2 text-blue-700">der / ein / kein</td>
                  <td class="p-2 text-indigo-700">die / eine / keine</td>
                  <td class="p-2 text-emerald-700">das / ein / kein</td>
                  <td class="p-2 text-amber-700">die / — / keine</td>
                </tr>
                <tr>
                  <td class="p-2 font-sans font-bold">Akkusativ (Direct Object)</td>
                  <td class="p-2 text-blue-800 font-extrabold bg-sky-50">den / einen / keinen</td>
                  <td class="p-2 text-indigo-700">die / eine / keine</td>
                  <td class="p-2 text-emerald-700">das / ein / kein</td>
                  <td class="p-2 text-amber-700">die / — / keine</td>
                </tr>
                <tr>
                  <td class="p-2 font-sans font-bold">Dativ (Location / Indirect)</td>
                  <td class="p-2 text-blue-800 font-extrabold bg-sky-50">dem / einem / keinem</td>
                  <td class="p-2 text-indigo-800 font-extrabold bg-indigo-50">der / einer / keiner</td>
                  <td class="p-2 text-emerald-800 font-extrabold bg-emerald-50">dem / einem / keinem</td>
                  <td class="p-2 text-amber-800 font-extrabold bg-amber-50">den (+n) / keinen (+n)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-white/95 rounded-2xl p-4 border border-sky-200 shadow-xs">
          <h4 class="font-extrabold text-sky-800 mb-2 text-sm">Regular Verb Endings (Präsens)</h4>
          <div class="grid grid-cols-3 gap-2 font-mono text-center text-xs">
            <div class="bg-sky-50 p-2 rounded-xl border border-sky-200"><strong>ich</strong> -e</div>
            <div class="bg-sky-50 p-2 rounded-xl border border-sky-200"><strong>du</strong> -st</div>
            <div class="bg-sky-50 p-2 rounded-xl border border-sky-200"><strong>er/sie/es</strong> -t</div>
            <div class="bg-sky-50 p-2 rounded-xl border border-sky-200"><strong>wir</strong> -en</div>
            <div class="bg-sky-50 p-2 rounded-xl border border-sky-200"><strong>ihr</strong> -t</div>
            <div class="bg-sky-50 p-2 rounded-xl border border-sky-200"><strong>sie/Sie</strong> -en</div>
          </div>
        </div>
      `;
      return;
    }

    const data = CHAPTER_GRAMMAR_DATA[chapterId];
    if (!data) {
      body.innerHTML = `<p class="p-4 text-center text-sky-600">No grammar data available for Chapter ${chapterId}.</p>`;
      return;
    }

    let html = `
      <div class="bg-sky-50 border border-sky-200 p-3 rounded-2xl mb-4 flex items-center justify-between">
        <div>
          <span class="text-[10px] bg-sky-500 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active Curriculum Guide</span>
          <h4 class="font-extrabold text-sm text-sky-950 mt-1">${data.title}</h4>
        </div>
      </div>
    `;

    data.topics.forEach(t => {
      html += `
        <div class="bg-white/95 rounded-2xl p-4 border border-sky-200 shadow-xs space-y-2.5 mb-3">
          <h5 class="font-extrabold text-sky-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
            <span>❄️</span>
            <span>${t.heading}</span>
          </h5>
          <p class="text-xs text-sky-800 leading-relaxed font-medium">${t.desc}</p>
      `;

      if (t.table) {
        html += `
          <div class="overflow-x-auto my-2 rounded-xl border border-sky-200 shadow-xs">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-sky-100 text-sky-950 font-bold border-b border-sky-300">
                <tr>
                  ${t.table.headers.map(h => `<th class="p-2 border-r border-sky-200 last:border-r-0">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-100">
                ${t.table.rows.map((row, rIdx) => `
                  <tr class="${rIdx % 2 === 0 ? 'bg-white' : 'bg-sky-50/50'}">
                    ${row.map(cell => `<td class="p-2 border-r border-sky-100 last:border-r-0 text-sky-900">${cell}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (t.note) {
        html += `<div class="bg-sky-50/80 p-2.5 rounded-xl border border-sky-200 text-xs text-sky-900">${t.note}</div>`;
      }

      html += `</div>`;
    });

    body.innerHTML = html;
  };

  window.openGrammarModal = function() {
    renderGrammarDropdown();
    const select = document.getElementById('grammarChapterSelect');
    if (select) {
      select.value = currentChapterIndex + 1;
      renderGrammarModalForChapter(currentChapterIndex + 1);
    }
    grammarModal.classList.remove('hidden');
  };

  window.syncGrammarWithActiveChapter = function() {
    const select = document.getElementById('grammarChapterSelect');
    if (select) {
      select.value = currentChapterIndex + 1;
      renderGrammarModalForChapter(currentChapterIndex + 1);
    }
  };

  window.closeGrammarModal = function() {
    grammarModal.classList.add('hidden');
  };

  // ================= 13. AUTOMATIC LESSON & INTERACTIVE EXERCISES =================
  function renderAutoLesson(chapter) {
    const container = document.getElementById('autoLessonContainer');
    if (!container) return;

    const auto = chapter.autoTeaching || {
      cheeyaGreeting: `Welcome to ${chapter.title} (${chapter.subtitle})! Here is your complete curriculum breakdown, pronunciation guide, exercises, and grammar summary. ✨`,
      lessonSummary: chapter.grammarSummary || '',
      quickAudioTrack: chapter.audioKapitel,
      quickAudioName: `Full Audio ${chapter.title}`
    };

    let html = `
      <!-- CHAPTER NAVIGATION BANNER -->
      <div class="flex items-center justify-between bg-white/95 p-3 rounded-2xl border-2 border-sky-300 shadow-sm mb-4">
        <button onclick="stepChapter(-1)" class="btn-pastel-blue px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${currentChapterIndex === 0 ? 'opacity-40 pointer-events-none' : ''}" title="Go to previous chapter">
          <span>◀</span>
          <span>Prev Chapter</span>
        </button>
        
        <div class="text-center px-2">
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-full">Active Chapter</span>
          <h3 class="font-extrabold text-sm text-sky-950 mt-0.5">${chapter.title}</h3>
        </div>

        <button onclick="stepChapter(1)" class="btn-pastel-blue px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${currentChapterIndex === NETZWERK_DATA.chapters.length - 1 ? 'opacity-40 pointer-events-none' : ''}" title="Go to next chapter">
          <span>Next Chapter</span>
          <span>▶</span>
        </button>
      </div>

      <!-- CHAPTER OVERVIEW & CURRICULUM GUIDE CARD -->
      <div class="blue-glass-card p-5 mb-5 border-2 border-sky-300 shadow-lg relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 text-7xl opacity-10 pointer-events-none">❄️</div>
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-3 border-b border-sky-200/80 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center text-white text-xl">
              📖
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-extrabold text-sm text-sky-950">${chapter.title}</h3>
                <span class="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-300">❄️ Chapter Guide</span>
              </div>
              <p class="text-xs text-sky-600 font-medium">${chapter.subtitle}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button onclick="downloadLessonPDF()" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer" title="Download Lesson as PDF">
              <span>📥</span>
              <span class="hidden sm:inline">Download PDF</span>
            </button>
            <button onclick="playGermanSpeech(document.getElementById('lessonSpeechText').innerText)" class="btn-pastel-blue px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer" title="Listen to Chapter Introduction">
              <span>🔊</span>
              <span class="hidden sm:inline">Listen</span>
            </button>
          </div>
        </div>

        <!-- Welcoming & Key Learning Objectives -->
        <div class="bg-sky-50/90 rounded-2xl p-3.5 mb-3 border border-sky-200 text-xs text-sky-900 leading-relaxed font-medium">
          <span class="font-bold text-sky-700">📘 Chapter Overview:</span>
          <p id="lessonSpeechText" class="mt-1">${auto.cheeyaGreeting}</p>
        </div>

        <!-- Quick Audio Track -->
        ${auto.quickAudioTrack ? `
          <div class="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-sky-200 mb-3 text-xs shadow-xs">
            <div class="flex items-center gap-2 truncate">
              <span class="text-base">🎧</span>
              <span class="font-bold text-sky-900 truncate">${auto.quickAudioName || 'Lesson Dialogue Audio'}</span>
            </div>
            <button onclick="playQuickTrack('${auto.quickAudioTrack}')" class="btn-pastel-blue px-3.5 py-1 rounded-lg text-white font-bold text-[11px] shadow-sm flex items-center gap-1 flex-shrink-0 cursor-pointer">
              <span>▶️ Play</span>
            </button>
          </div>
        ` : ''}

        <!-- Structured Lesson Breakdown -->
        <div class="ai-content text-xs text-sky-950 bg-white/80 p-4 rounded-2xl border border-sky-200 leading-relaxed">
          ${renderMarkdown(auto.lessonSummary)}
        </div>
      </div>

      <!-- DEDICATED CHAPTER LEARNING VIDEOS SECTION -->
      <div class="blue-glass-card p-5 mb-5 border-2 border-purple-300 shadow-lg relative overflow-hidden bg-gradient-to-br from-white/95 via-purple-50/20 to-sky-50/40">
        <div class="flex items-center justify-between mb-4 border-b border-purple-100 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center text-white text-xl">
              🎬
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-extrabold text-sm text-purple-950">Learning Videos & Film Clips</h3>
                <span class="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
                  ${chapter.videos ? chapter.videos.length : 0} Videos Available
                </span>
              </div>
              <p class="text-xs text-purple-700/80 font-medium">Watch original video episodes, grammar clips, pronunciation guides, and dialogues</p>
            </div>
          </div>
          <button onclick="openVideoModal()" class="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold flex items-center gap-1.5 transition border border-purple-300 cursor-pointer shadow-xs" title="Open Fullscreen Pop-up Video Player">
            <span>⛶</span>
            <span class="hidden sm:inline">Pop-up Player</span>
          </button>
        </div>

        ${(chapter.videos && chapter.videos.length > 0) ? `
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <!-- Inline Video Player Screen -->
            <div class="lg:col-span-7 bg-black rounded-2xl overflow-hidden shadow-lg aspect-video relative flex items-center justify-center border-2 border-purple-200">
              <video id="inlineLessonVideoPlayer" controls class="w-full h-full object-contain" src="${encodeURI(chapter.videos[0].path)}" poster="LOGO.jpeg"></video>
            </div>

            <!-- Video Playlist Selector -->
            <div class="lg:col-span-5 flex flex-col space-y-2 max-h-80 overflow-y-auto pr-1">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 px-1">Select Video Clip to Play:</span>
              ${chapter.videos.map((vid, vIdx) => {
                const isUT = vid.title.toLowerCase().includes('subtitle') || vid.title.includes('UT');
                const isGrammar = vid.title.startsWith('G-Clip');
                const isPhonetics = vid.title.startsWith('P-Clip');
                const isRedemittel = vid.title.startsWith('R-Clip');
                
                let clipBadge = '<span class="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Film</span>';
                if (isGrammar) clipBadge = '<span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Grammar</span>';
                if (isPhonetics) clipBadge = '<span class="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Phonetics</span>';
                if (isRedemittel) clipBadge = '<span class="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">Dialogue</span>';

                return `
                  <button onclick="playInlineVideo('${encodeURI(vid.path)}', this)" class="inline-video-btn w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${vIdx === 0 ? 'bg-purple-100/90 border-purple-400 text-purple-950 font-bold shadow-xs' : 'bg-white/90 hover:bg-purple-50 border-purple-200 text-slate-800 font-medium'}">
                    <div class="flex items-center gap-2 truncate">
                      <span class="text-sm">▶️</span>
                      <span class="text-xs truncate">${escapeHtml(vid.title)}</span>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                      ${clipBadge}
                      ${isUT ? '<span class="text-[9px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-extrabold" title="German Subtitles">UT</span>' : ''}
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
          <p class="text-[11px] text-purple-700/80 mt-3 font-medium">
            💡 <em>Tip: Click any video clip in the list above to immediately play it right here. Clips with the <strong>UT</strong> tag include authentic German subtitles!</em>
          </p>
        ` : `
          <div class="p-6 text-center text-xs text-purple-700 bg-purple-50 rounded-2xl border border-purple-200">
            No video clips found for this chapter.
          </div>
        `}
      </div>

      <!-- TEXTBOOK EXERCISES (INTERACTIVE FILL-IN-THE-BLANKS) -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2 px-1">
          <h4 class="font-extrabold text-sm text-sky-950 flex items-center gap-2">
            <span>✍️</span>
            <span>Interactive Textbook Exercises (Fill in your answers)</span>
          </h4>
          <span class="text-[10px] font-bold text-sky-600 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-full shadow-xs">✨ Interactive Practice</span>
        </div>
        <p class="text-xs text-sky-800/80 mb-4 px-1">
          Open the textbook pages in the <strong>📖 PDF & Notes</strong> tab to read the full context, then submit your answers below for instant automated feedback and explanations! ✨
        </p>
    `;

    // 1. Render Interactive Pre-built Exercises
    if (chapter.interactiveExercises && chapter.interactiveExercises.length > 0) {
      chapter.interactiveExercises.forEach((ex) => {
        html += `
          <div class="blue-glass-card p-4 mb-4 border border-sky-300">
            <div class="flex items-center justify-between border-b border-sky-200 pb-2 mb-3">
              <h5 class="font-bold text-xs text-sky-900 flex items-center gap-1.5">
                <span>❄️</span>
                <span>${ex.title}</span>
              </h5>
              <span class="text-[10px] text-sky-600 font-bold">${ex.questions.length} Questions</span>
            </div>
            <p class="text-xs text-sky-800 mb-3 italic font-medium">${ex.instruction}</p>
            
            <div class="space-y-3">
        `;

        ex.questions.forEach((q) => {
          const savedAns = studyData.exerciseHistory.find(item => item.qId === q.id);

          html += `
            <div class="bg-white/95 p-3 rounded-2xl border border-sky-200/80 shadow-xs" id="exCard-${q.id}">
              <p class="font-bold text-xs text-sky-950 mb-2">${q.prompt}</p>
              
              <div class="flex items-center gap-2">
                <input type="text" id="input-${q.id}" value="${savedAns ? escapeHtml(savedAns.studentAnswer) : ''}" placeholder="Type your answer here..." onkeydown="if(event.key==='Enter') checkSpecificExercise('${q.id}')" class="flex-1 bg-sky-50/70 border-2 border-sky-200 rounded-xl px-3 py-2 text-xs text-sky-950 placeholder-sky-300 focus:outline-none focus:border-sky-400 focus:bg-white font-semibold transition">
                <button onclick="checkSpecificExercise('${q.id}')" class="btn-pastel-blue px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer">
                  <span>❄️ Check</span>
                </button>
              </div>

              <!-- Feedback Box -->
              <div id="feedback-${q.id}" class="${savedAns ? '' : 'hidden'} mt-2.5 p-2.5 rounded-xl text-xs ${savedAns && savedAns.isCorrect ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' : 'bg-rose-50 border border-rose-300 text-rose-800'}">
                ${savedAns ? (savedAns.isCorrect ? `🎉 <strong>Ausgezeichnet!</strong> Your answer is completely correct!` : `💡 <strong>Grammar & Explanation:</strong> The correct answer is: <em>${q.expected[0]}</em>. ${q.explanation}`) : ''}
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });
    }

    // 2. Render Quick Multiple Choice Quizzes
    html += `
        <div class="blue-glass-card p-4 border border-sky-300 mt-4">
          <div class="flex items-center justify-between border-b border-sky-200 pb-2 mb-3">
            <h5 class="font-bold text-xs text-sky-900 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Quick Multiple Choice Quiz (Click to answer)</span>
            </h5>
            <span class="text-[10px] text-sky-600 font-bold">${chapter.quizzes.length} Questions</span>
          </div>
          <div id="autoQuizContainer" class="space-y-3"></div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    renderAutoQuizzes(chapter);
  }

  // Check Specific Fill-in-the-Blank Exercise
  window.checkSpecificExercise = function(qId) {
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
    let foundQ = null;
    let foundExTitle = '';

    if (chapter.interactiveExercises) {
      for (const ex of chapter.interactiveExercises) {
        const q = ex.questions.find(item => item.id === qId);
        if (q) {
          foundQ = q;
          foundExTitle = ex.title;
          break;
        }
      }
    }

    if (!foundQ) return;

    const input = document.getElementById(`input-${qId}`);
    const feedbackBox = document.getElementById(`feedback-${qId}`);
    if (!input || !feedbackBox) return;
    const userAns = input.value.trim();

    if (!userAns) {
      alert("Please enter your answer first! ❄️");
      return;
    }

    const isCorrect = foundQ.expected.some(exp => exp.toLowerCase() === userAns.toLowerCase());

    feedbackBox.classList.remove('hidden');
    if (isCorrect) {
      feedbackBox.className = "mt-2.5 p-2.5 rounded-xl text-xs bg-emerald-50 border border-emerald-300 text-emerald-800";
      feedbackBox.innerHTML = `🎉 <strong>Ausgezeichnet!</strong> Your answer is completely correct! ${foundQ.explanation}`;
    } else {
      feedbackBox.className = "mt-2.5 p-2.5 rounded-xl text-xs bg-rose-50 border border-rose-300 text-rose-800";
      feedbackBox.innerHTML = `💡 <strong>Almost there!</strong> The expected answer is: <em>${foundQ.expected[0]}</em>.<br/>${foundQ.explanation}`;
    }

    // Save to study data
    studyData.exerciseHistory = studyData.exerciseHistory.filter(i => i.qId !== qId);
    studyData.exerciseHistory.unshift({
      id: Date.now(),
      qId: qId,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      exerciseNum: foundExTitle,
      studentAnswer: userAns,
      isCorrect: isCorrect,
      feedback: isCorrect ? `Correct! ${foundQ.explanation}` : `Expected: ${foundQ.expected[0]}. ${foundQ.explanation}`,
      date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    });
    if (isCorrect) {
      if (typeof awardXP === 'function') awardXP(15, 'Exercise Correct');
      if (typeof unlockBadge === 'function') unlockBadge('first_step');
    }
    saveStudyData();
    renderHistoryTab();
  };

  // Render Multiple Choice Quizzes
  function renderAutoQuizzes(chapter) {
    const container = document.getElementById('autoQuizContainer');
    if (!container) return;

    let html = '';
    chapter.quizzes.forEach((quiz, qIdx) => {
      const historyKey = `chap_${chapter.id}_q_${qIdx}`;
      const savedAns = studyData.quizHistory[historyKey];

      html += `
        <div class="bg-white/95 border border-sky-200 p-3 rounded-2xl shadow-xs" id="autoQuizCard-${qIdx}">
          <p class="text-xs font-bold text-sky-950 mb-2.5">${qIdx + 1}. ${quiz.q}</p>
          <div class="space-y-1.5">
            ${quiz.options.map((opt, optIdx) => {
              let btnClass = "bg-sky-50/60 hover:bg-sky-100 text-sky-950 border-sky-200";
              let badgeHtml = '<span class="feedback-badge hidden"></span>';
              let isDisabled = '';

              if (savedAns) {
                isDisabled = 'disabled';
                if (optIdx === quiz.correct) {
                  btnClass = "bg-emerald-100 border-emerald-400 text-emerald-900 font-bold";
                  badgeHtml = '<span class="feedback-badge text-emerald-700 font-extrabold">✅ Correct!</span>';
                } else if (optIdx === savedAns.selected) {
                  btnClass = "bg-rose-100 border-rose-400 text-rose-900 font-bold";
                  badgeHtml = '<span class="feedback-badge text-rose-700 font-extrabold">❌ Your Choice</span>';
                }
              }

              return `
                <button ${isDisabled} onclick="selectAutoQuizAnswer(${currentChapterIndex}, ${qIdx}, ${optIdx})" class="w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between cursor-pointer ${btnClass}">
                  <span>${String.fromCharCode(65 + optIdx)}. ${opt}</span>
                  ${badgeHtml}
                </button>
              `;
            }).join('')}
          </div>

          <div class="explanation-box ${savedAns ? '' : 'hidden'} mt-2.5 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
            💡 <strong>Grammar & Explanation:</strong> ${quiz.explanation}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  window.selectAutoQuizAnswer = function(chapIdx, qIdx, selectedOptIdx) {
    const chapter = NETZWERK_DATA.chapters[chapIdx];
    const quiz = chapter.quizzes[qIdx];
    const card = document.getElementById(`autoQuizCard-${qIdx}`);
    const buttons = card.querySelectorAll('button');
    const explBox = card.querySelector('.explanation-box');

    const isCorrect = (selectedOptIdx === quiz.correct);

    // Save to local history
    const historyKey = `chap_${chapter.id}_q_${qIdx}`;
    studyData.quizHistory[historyKey] = {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      qText: quiz.q,
      selected: selectedOptIdx,
      isCorrect: isCorrect,
      date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    };
    saveStudyData();

    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      const badge = btn.querySelector('.feedback-badge');
      badge.classList.remove('hidden');
      if (idx === quiz.correct) {
        btn.classList.add('bg-emerald-100', 'border-emerald-400', 'text-emerald-900', 'font-bold');
        badge.innerHTML = "✅ Correct!";
      } else if (idx === selectedOptIdx) {
        btn.classList.add('bg-rose-100', 'border-rose-400', 'text-rose-900', 'font-bold');
        badge.innerHTML = "❌ Your Choice";
      }
    });

    explBox.classList.remove('hidden');
    renderHistoryTab();
  };

  // ================= 14. VOCABULARY TAB & AUDIO PRONUNCIATION =================
  window.filterVocab = function(category) {
    currentVocabFilter = category;
    const chapter = NETZWERK_DATA.chapters[currentChapterIndex];
    renderVocabTab(chapter);
  };

  function renderVocabTab(chapter) {
    const container = document.getElementById('vocabContainer');
    if (!container) return;

    const allWords = chapter.vocabList || [];
    const nouns = allWords.filter(v => v.type === 'der' || v.type === 'die' || v.type === 'das');
    const verbs = allWords.filter(v => v.type === 'verb');
    const phrases = allWords.filter(v => v.type === 'phrase');

    let displayWords = allWords;
    if (currentVocabFilter === 'nouns') displayWords = nouns;
    if (currentVocabFilter === 'verbs') displayWords = verbs;
    if (currentVocabFilter === 'phrases') displayWords = phrases;

    let html = `
      <!-- Category Filter Tabs -->
      <div class="flex items-center gap-1.5 mb-3.5 overflow-x-auto pb-1">
        <button onclick="filterVocab('all')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${currentVocabFilter === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'}">
          All (${allWords.length})
        </button>
        <button onclick="filterVocab('nouns')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${currentVocabFilter === 'nouns' ? 'bg-sky-600 text-white shadow-sm' : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'}">
          Nouns (${nouns.length})
        </button>
        <button onclick="filterVocab('verbs')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${currentVocabFilter === 'verbs' ? 'bg-sky-600 text-white shadow-sm' : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'}">
          Verbs (${verbs.length})
        </button>
        <button onclick="filterVocab('phrases')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${currentVocabFilter === 'phrases' ? 'bg-sky-600 text-white shadow-sm' : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'}">
          Phrases (${phrases.length})
        </button>
      </div>

      <div class="mb-3 flex items-center justify-between text-xs text-sky-800 font-semibold px-1">
        <span>Click 🔊 to hear native German audio pronunciation:</span>
        <span class="text-[11px] text-sky-600 font-bold">${displayWords.length} words shown</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    `;

    displayWords.forEach(v => {
      let badgeClass = "badge-phrase";
      if (v.type === 'der') badgeClass = "badge-der";
      if (v.type === 'die') badgeClass = "badge-die";
      if (v.type === 'das') badgeClass = "badge-das";
      if (v.type === 'verb') badgeClass = "badge-verb";

      html += `
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-white/95 border border-sky-200 hover:border-sky-300 shadow-xs transition hover:shadow-md">
          <div class="flex items-center gap-2.5 truncate">
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badgeClass} flex-shrink-0">${v.type}</span>
            <div class="truncate">
              <p class="text-xs font-bold text-sky-950 truncate">${v.de}</p>
              <p class="text-[11px] text-sky-600 font-medium truncate">${v.en || v.id}</p>
            </div>
          </div>
          <button class="px-2.5 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-800 text-xs font-bold transition cursor-pointer flex-shrink-0 ml-2 flex items-center gap-1 shadow-2xs" onclick="playGermanSpeech(decodeURIComponent('${encodeURIComponent(v.de)}'), this)" title="Listen to German pronunciation">
            <span>🔊</span>
            <span class="hidden sm:inline text-[11px]">Listen</span>
          </button>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // ================= 15. HISTORY & PROGRESS TAB =================
  window.renderHistoryTab = function() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) return;

    const completedCount = studyData.completedChapters.length;
    const totalChapters = NETZWERK_DATA.chapters.length;
    const percent = Math.round((completedCount / totalChapters) * 100);

    const answeredQuizzesCount = Object.keys(studyData.quizHistory).length;
    const answeredExercisesCount = studyData.exerciseHistory.length;

    let html = `
      <!-- Progress Summary Card -->
      <div class="blue-glass-card p-5 mb-5 border-2 border-sky-300 shadow-md">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h4 class="font-extrabold text-base text-sky-950 flex items-center gap-2">
              <span>📊</span>
              <span>Learning Progress & Mastery Tracker</span>
            </h4>
            <p class="text-xs text-sky-600 font-medium">Saved automatically in your browser ❄️</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button onclick="resetAllStudyProgress()" class="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 border border-sky-300 text-rose-600 hover:text-rose-700 font-bold transition shadow-xs cursor-pointer" title="Reset all chapter progress back to 0/12">
              🔄 Reset Progress
            </button>
            <span class="text-2xl font-extrabold text-sky-600">${percent}%</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-sky-100 rounded-full h-3.5 mb-4 overflow-hidden border border-sky-200">
          <div class="bg-gradient-to-r from-sky-400 to-blue-600 h-3.5 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
          <div class="bg-white/90 p-2.5 rounded-2xl border border-sky-200">
            <div class="font-extrabold text-sky-600 text-lg">${completedCount}/${totalChapters}</div>
            <div class="text-[10px] text-sky-700 font-bold">Chapters Done</div>
          </div>
          <div class="bg-white/90 p-2.5 rounded-2xl border border-sky-200">
            <div class="font-extrabold text-blue-600 text-lg">${answeredQuizzesCount}</div>
            <div class="text-[10px] text-blue-700 font-bold">Quizzes Solved</div>
          </div>
          <div class="bg-white/90 p-2.5 rounded-2xl border border-sky-200">
            <div class="font-extrabold text-indigo-600 text-lg">${answeredExercisesCount}</div>
            <div class="text-[10px] text-indigo-700 font-bold">Exercises Checked</div>
          </div>
          <div class="bg-white/90 p-2.5 rounded-2xl border border-amber-200 cursor-pointer hover:bg-amber-50 transition" onclick="openStreakModal()" title="View Streak Details">
            <div class="font-extrabold text-amber-600 text-lg flex items-center justify-center gap-1">
              <span>🔥</span>
              <span>${typeof streakData !== 'undefined' ? streakData.currentStreak : 1}d</span>
            </div>
            <div class="text-[10px] text-amber-700 font-bold">Study Streak</div>
          </div>
          <div class="bg-white/90 p-2.5 rounded-2xl border border-purple-200 cursor-pointer hover:bg-purple-50 transition" onclick="openStreakModal()" title="View XP & Badges">
            <div class="font-extrabold text-purple-600 text-lg flex items-center justify-center gap-1">
              <span>⚡</span>
              <span>${typeof streakData !== 'undefined' ? streakData.xp : 0}</span>
            </div>
            <div class="text-[10px] text-purple-700 font-bold">Total XP</div>
          </div>
        </div>
      </div>

      <!-- Achievements & Badges Showcase -->
      <div class="blue-glass-card p-5 mb-5 border border-amber-300">
        <div class="flex items-center justify-between mb-3">
          <h5 class="font-bold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <span>🏆</span>
            <span>Achievement Badges Showcase</span>
          </h5>
          <button onclick="openStreakModal()" class="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer">
            View All Badges ➔
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          ${typeof renderProgressBadgesHtml === 'function' ? renderProgressBadgesHtml() : ''}
        </div>
      </div>

      <!-- 12 Chapters Checklist -->
      <div class="blue-glass-card p-5 mb-5 border border-sky-300">
        <h5 class="font-bold text-xs text-sky-900 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>12 Coursebook Chapters (Click to open):</span>
          <span class="text-[10px] text-sky-600 font-bold">12 Chapters Total</span>
        </h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
    `;

    NETZWERK_DATA.chapters.forEach((chap, idx) => {
      const isDone = studyData.completedChapters.includes(chap.id);
      const isCurrent = (currentChapterIndex === idx);
      html += `
        <div class="flex items-center justify-between p-2.5 rounded-xl ${isCurrent ? 'bg-sky-100/90 border border-sky-400' : 'bg-white/80 border border-sky-200'} text-xs transition">
          <button onclick="selectChapter(${idx}); switchView('lesson');" class="flex items-center gap-2 text-left truncate flex-1 cursor-pointer">
            <span>${isDone ? '✅' : '⚪'}</span>
            <span class="font-bold ${isDone ? 'text-sky-600 line-through opacity-80' : 'text-sky-950'} truncate">${chap.title}</span>
          </button>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            ${isCurrent ? '<span class="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-bold">Active</span>' : ''}
            <button onclick="toggleChapterDone(${chap.id})" class="text-[11px] px-2.5 py-0.5 rounded-lg ${isDone ? 'bg-sky-200 text-sky-800' : 'btn-pastel-blue text-white'} font-bold transition cursor-pointer">
              ${isDone ? 'Undo' : 'Done'}
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>

      <!-- Recent Exercise Answers Log -->
      <div class="blue-glass-card p-5 border border-sky-300">
        <div class="flex items-center justify-between mb-3">
          <h5 class="font-bold text-xs text-sky-900 uppercase tracking-wider">
            Recent Exercise History
          </h5>
          ${studyData.exerciseHistory.length > 0 ? `
            <button onclick="clearExerciseHistory()" class="text-[10px] text-rose-500 hover:text-rose-700 font-bold underline cursor-pointer">
              Clear History
            </button>
          ` : ''}
        </div>
    `;

    if (studyData.exerciseHistory.length === 0) {
      html += `
        <p class="text-xs text-sky-500 italic text-center py-4 bg-white/60 rounded-xl border border-sky-100">
          No exercises checked yet. Fill in any exercise in the <strong>📘 Lesson & Exercises</strong> tab to record your progress! ❄️
        </p>
      `;
    } else {
      html += `<div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">`;
      studyData.exerciseHistory.forEach(item => {
        html += `
          <div class="bg-white/90 p-3 rounded-xl border ${item.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'} text-xs">
            <div class="flex items-center justify-between text-[10px] text-sky-700 font-semibold mb-1">
              <span>${item.chapterTitle} • ${item.exerciseNum}</span>
              <span>${item.date}</span>
            </div>
            <p class="text-sky-950 font-bold mb-1">Your answer: "${escapeHtml(item.studentAnswer)}" ${item.isCorrect ? '✅' : '❌'}</p>
            <p class="text-[11px] text-sky-800">${item.feedback}</p>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
    historyContainer.innerHTML = html;
  };

  window.clearExerciseHistory = function() {
    if (confirm("Are you sure you want to clear your entire exercise answer history?")) {
      studyData.exerciseHistory = [];
      saveStudyData();
      renderHistoryTab();
    }
  };

  window.resetAllStudyProgress = function() {
    if (confirm("Are you sure you want to reset all completed chapters and progress back to 0? ❄️")) {
      studyData.completedChapters = [];
      studyData.quizHistory = {};
      studyData.exerciseHistory = [];
      saveStudyData();
      renderChapterDropdown();
      renderDashboard();
      renderHistoryTab();
      updateProgressHeader();
    }
  };

  // ================= 16. SUBTLE CURSOR CLICK ANIMATION EFFECT =================
  function initCursorClickEffect() {
    const layer = document.getElementById('cursorClickLayer') || document.body;
    
    window.addEventListener('pointerdown', (e) => {
      // 1. Gentle subtle ripple shockwave (max 22px)
      const ripple = document.createElement('div');
      ripple.className = 'cursor-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      layer.appendChild(ripple);

      // 2. Delicate tiny sparkle burst (4 particles)
      const sparkleColors = ['#38bdf8', '#7dd3fc', '#bae6fd', '#ffffff'];
      const particleCount = 4;
      for (let i = 0; i < particleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'cursor-sparkle';
        sparkle.style.left = `${e.clientX}px`;
        sparkle.style.top = `${e.clientY}px`;
        sparkle.style.backgroundColor = sparkleColors[i % sparkleColors.length];
        sparkle.style.boxShadow = `0 0 4px ${sparkleColors[i % sparkleColors.length]}`;
        
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
        const distance = Math.random() * 12 + 8;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        sparkle.style.setProperty('--tx', `${tx}px`);
        sparkle.style.setProperty('--ty', `${ty}px`);
        layer.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 480);
      }

      setTimeout(() => ripple.remove(), 420);
    });
  }

  // ================= 17. DREAMY VISIBLE FLOATING GLASS BUBBLES & STARDUST =================
  function initSparkleEffect() {
    const canvasEl = document.getElementById('sparkleCanvas');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');

    let width = canvasEl.width = window.innerWidth;
    let height = canvasEl.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvasEl.width = window.innerWidth;
      height = canvasEl.height = window.innerHeight;
    });

    const particles = [];
    const count = 45;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 6, // Refined smaller bubble radius: 6px to 14px (diameter 12px to 28px)
        speedY: Math.random() * 0.45 + 0.2,
        speedX: (Math.random() - 0.5) * 0.3,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.025 + 0.01,
        opacity: Math.random() * 0.28 + 0.25, // Gentle, pleasant translucence
        type: Math.random() > 0.35 ? 'bubble' : 'stardust',
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.0
      });
    }

    // Add a few subtle accent bubbles (radius 13px to 17px -> max diameter 26px to 34px)
    for (let j = 0; j < 4; j++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 13, // Accent bubbles: max diameter ~34px
        speedY: Math.random() * 0.28 + 0.15,
        speedX: (Math.random() - 0.5) * 0.2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.012,
        opacity: 0.25,
        type: 'bubble',
        rotation: 0,
        rotSpeed: 0.15
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.wobble += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.wobble) * 0.4;
        p.y -= p.speedY; // float gently upward
        p.rotation += p.rotSpeed;

        if (p.y < -50) {
          p.y = height + 50;
          p.x = Math.random() * width;
        }
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;

        if (p.type === 'bubble') {
          // Dreamy Glass Bubble with Soft Gradient & Specular Shine
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, 2 * Math.PI);

          const grad = ctx.createRadialGradient(-p.size * 0.3, -p.size * 0.3, p.size * 0.08, 0, 0, p.size);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          grad.addColorStop(0.35, 'rgba(186, 230, 253, 0.45)');
          grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.2)');
          grad.addColorStop(1, 'rgba(14, 165, 233, 0.55)');
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
          ctx.lineWidth = Math.max(0.7, p.size * 0.07);
          ctx.stroke();

          // Curved upper highlight
          ctx.beginPath();
          ctx.ellipse(-p.size * 0.32, -p.size * 0.32, p.size * 0.28, p.size * 0.14, -Math.PI / 4, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fill();

          // Secondary bottom specular dot
          ctx.beginPath();
          ctx.arc(p.size * 0.35, p.size * 0.35, p.size * 0.09, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.fill();
        } else {
          // Twinkling Stardust Star
          ctx.fillStyle = Math.random() > 0.5 ? '#38bdf8' : '#7dd3fc';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#38bdf8';
          ctx.beginPath();
          for (let j = 0; j < 4; j++) {
            ctx.lineTo(Math.cos(j * Math.PI / 2) * p.size * 0.4, Math.sin(j * Math.PI / 2) * p.size * 0.4);
            ctx.lineTo(Math.cos((j + 0.5) * Math.PI / 2) * (p.size * 0.12), Math.sin((j + 0.5) * Math.PI / 2) * (p.size * 0.12));
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ================= 18. ENHANCED MARKDOWN PARSER WITH TABLE SUPPORT =================
  function renderMarkdown(md) {
    if (!md) return '';

    function formatInline(str) {
      let t = escapeHtml(str);
      t = t.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sky-950 font-bold">$1</strong>');
      t = t.replace(/\*(.*?)\*/g, '<em class="text-sky-700 font-semibold">$1</em>');
      t = t.replace(/`([^`]+)`/g, '<code class="bg-sky-100 text-sky-900 px-1 py-0.5 rounded text-[11px] font-mono border border-sky-200">$1</code>');
      return t;
    }

    const lines = md.split('\n');
    const processedLines = [];
    let inTable = false;
    let tableRows = [];

    function flushTable() {
      if (tableRows.length === 0) return;
      let tableHtml = '<div class="overflow-x-auto my-3 rounded-xl border border-sky-200 shadow-xs"><table class="w-full text-xs text-left border-collapse">';
      let isHeader = true;
      for (let r = 0; r < tableRows.length; r++) {
        const row = tableRows[r].trim();
        if (/^\|[\s\-:|]+\|$/.test(row)) {
          isHeader = false;
          continue;
        }
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        if (isHeader) {
          tableHtml += '<thead class="bg-sky-100/90 text-sky-950 font-bold border-b border-sky-300"><tr>';
          cells.forEach(cell => {
            tableHtml += `<th class="p-2 font-extrabold border-r border-sky-200/60 last:border-r-0">${formatInline(cell)}</th>`;
          });
          tableHtml += '</tr></thead><tbody class="divide-y divide-sky-100">';
          isHeader = false;
        } else {
          const bgClass = r % 2 === 0 ? 'bg-white' : 'bg-sky-50/50';
          tableHtml += `<tr class="${bgClass} hover:bg-sky-100/40 transition">`;
          cells.forEach(cell => {
            tableHtml += `<td class="p-2 border-r border-sky-100 last:border-r-0 text-sky-900">${formatInline(cell)}</td>`;
          });
          tableHtml += '</tr>';
        }
      }
      tableHtml += '</tbody></table></div>';
      processedLines.push(tableHtml);
      tableRows = [];
      inTable = false;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableRows.push(trimmed);
      } else {
        if (inTable) {
          flushTable();
        }
        processedLines.push(line);
      }
    }
    if (inTable) {
      flushTable();
    }

    let out = '';
    for (let i = 0; i < processedLines.length; i++) {
      let line = processedLines[i];
      if (line.startsWith('<div class="overflow-x-auto')) {
        out += line;
        continue;
      }

      let trimmed = line.trim();
      if (trimmed === '---') {
        out += '<hr class="my-3.5 border-t border-sky-200" />';
        continue;
      }

      if (/^#### (.*$)/.test(line)) {
        out += line.replace(/^#### (.*$)/, '<h4 class="text-xs font-extrabold text-sky-800 uppercase tracking-wide mt-3 mb-1 flex items-center gap-1.5">$1</h4>');
        continue;
      }
      if (/^### (.*$)/.test(line)) {
        out += line.replace(/^### (.*$)/, '<h3 class="text-sm font-extrabold text-sky-950 mt-4 mb-2 pb-1 border-b border-sky-200 flex items-center gap-1.5">$1</h3>');
        continue;
      }
      if (/^## (.*$)/.test(line)) {
        out += line.replace(/^## (.*$)/, '<h2 class="text-base font-extrabold text-sky-950 mt-4 mb-2 pb-1 border-b-2 border-sky-300">$1</h2>');
        continue;
      }
      if (/^\> (.*$)/.test(line)) {
        out += line.replace(/^\> (.*$)/, '<blockquote class="border-l-4 border-sky-400 pl-3 my-2 text-sky-800 bg-sky-50/70 p-2 rounded-r-xl italic">$1</blockquote>');
        continue;
      }
      if (/^\- (.*$)/.test(line)) {
        out += line.replace(/^\- (.*$)/, '<li class="ml-4 list-disc text-sky-900 font-medium my-0.5">$1</li>');
        continue;
      }
      if (/^[0-9]+\. (.*$)/.test(line)) {
        out += line.replace(/^[0-9]+\. (.*$)/, '<li class="ml-4 list-decimal text-sky-900 font-medium my-0.5">$1</li>');
        continue;
      }
      if (trimmed === '') {
        out += '<div class="h-1.5"></div>';
        continue;
      }

      out += `<p class="my-1">${formatInline(line)}</p>`;
    }

    return out;
  }

  function escapeHtml(string) {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(string).replace(/[&<>"']/g, function (s) {
      return entityMap[s];
    });
  }

  // ================= 16. AUDIO PRONUNCIATION (TTS TRAINER) MODAL & ENGINE =================
  let ttsActiveChapterIdx = 0;
  let ttsAutoPlayActive = false;
  let ttsAutoPlayTimeout = null;
  let ttsAutoPlayIndex = 0;

  window.openAudioPronunciationModal = function(chapterIdx = null) {
    if (chapterIdx !== null && chapterIdx !== undefined) {
      ttsActiveChapterIdx = chapterIdx;
    } else {
      ttsActiveChapterIdx = currentChapterIndex;
    }
    const modal = document.getElementById('audioPronunciationModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const chapter = NETZWERK_DATA.chapters[ttsActiveChapterIdx];
    const badge = document.getElementById('ttsChapterBadge');
    if (badge && chapter) {
      badge.textContent = `Kapitel ${chapter.id}: ${chapter.title.split(':')[1]?.trim() || chapter.title}`;
    }

    renderTtsWordList();
  };

  window.closeAudioPronunciationModal = function() {
    stopAutoPlayVocab();
    const modal = document.getElementById('audioPronunciationModal');
    if (modal) modal.classList.add('hidden');
    if (activeAudioObj) {
      try { activeAudioObj.pause(); } catch(e){}
      activeAudioObj = null;
    }
  };

  window.setTtsSpeed = function(speed) {
    window.ttsCurrentSpeed = speed;
    const btn08 = document.getElementById('ttsSpeedBtn-08');
    const btn10 = document.getElementById('ttsSpeedBtn-10');
    if (speed === 0.8) {
      if (btn08) btn08.className = 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-600 text-white shadow-2xs cursor-pointer';
      if (btn10) btn10.className = 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-sky-800 border border-sky-200 hover:bg-sky-100 cursor-pointer';
    } else {
      if (btn08) btn08.className = 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-sky-800 border border-sky-200 hover:bg-sky-100 cursor-pointer';
      if (btn10) btn10.className = 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-600 text-white shadow-2xs cursor-pointer';
    }
    showFloatingToast(`Audio speed set to ${speed}x`);
  };

  window.playCustomTtsInput = function() {
    const input = document.getElementById('customTtsInput');
    if (!input || !input.value.trim()) return;
    playGermanSpeech(input.value.trim());
    showFloatingToast(`🔊 Pronouncing: "${input.value.trim()}"`);
  };

  function renderTtsWordList() {
    const container = document.getElementById('ttsWordListContainer');
    if (!container) return;
    const chapter = NETZWERK_DATA.chapters[ttsActiveChapterIdx];
    if (!chapter || !chapter.vocabList) {
      container.innerHTML = `<p class="text-xs text-sky-600 italic text-center py-4">No vocabulary words found for this chapter.</p>`;
      return;
    }

    const words = chapter.vocabList;
    let html = '';
    words.forEach((v, idx) => {
      let bClass = 'badge-phrase';
      if (v.type === 'der') bClass = 'badge-der';
      if (v.type === 'die') bClass = 'badge-die';
      if (v.type === 'das') bClass = 'badge-das';
      if (v.type === 'verb') bClass = 'badge-verb';

      html += `
        <div id="ttsItemRow-${idx}" class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-sky-200 hover:border-sky-300 transition shadow-2xs">
          <div class="flex items-center gap-2 truncate">
            <span class="${bClass} px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0">${v.type}</span>
            <div class="truncate">
              <span class="text-xs font-black text-sky-950">${v.de}</span>
              <span class="text-[11px] text-sky-600 font-medium ml-1.5">• ${v.en || ''}</span>
            </div>
          </div>
          <button id="ttsPlayBtn-${idx}" onclick="playGermanSpeech(decodeURIComponent('${encodeURIComponent(v.de)}'), this)" class="px-3 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold transition cursor-pointer flex items-center gap-1 flex-shrink-0 shadow-2xs" title="Listen to pronunciation">
            <span>🔊</span>
            <span class="text-[11px]">Listen</span>
          </button>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  window.toggleAutoPlayAllVocab = function() {
    if (ttsAutoPlayActive) {
      stopAutoPlayVocab();
      showFloatingToast('⏹️ Auto-play stopped');
    } else {
      startAutoPlayVocab();
      showFloatingToast('▶️ Starting vocabulary auto-play...');
    }
  };

  function startAutoPlayVocab() {
    ttsAutoPlayActive = true;
    ttsAutoPlayIndex = 0;
    const icon = document.getElementById('ttsAutoPlayIcon');
    const text = document.getElementById('ttsAutoPlayText');
    const btn = document.getElementById('ttsAutoPlayBtn');
    if (icon) icon.textContent = '⏹️';
    if (text) text.textContent = 'Stop';
    if (btn) btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer';

    stepAutoPlayVocab();
  }

  function stopAutoPlayVocab() {
    ttsAutoPlayActive = false;
    if (ttsAutoPlayTimeout) clearTimeout(ttsAutoPlayTimeout);
    const icon = document.getElementById('ttsAutoPlayIcon');
    const text = document.getElementById('ttsAutoPlayText');
    const btn = document.getElementById('ttsAutoPlayBtn');
    const statusText = document.getElementById('ttsNowPlayingText');
    if (icon) icon.textContent = '▶️';
    if (text) text.textContent = 'Auto Play Chapter Vocab';
    if (btn) btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer';
    if (statusText) statusText.textContent = '';
  }

  function stepAutoPlayVocab() {
    if (!ttsAutoPlayActive) return;
    const chapter = NETZWERK_DATA.chapters[ttsActiveChapterIdx];
    if (!chapter || !chapter.vocabList || ttsAutoPlayIndex >= chapter.vocabList.length) {
      stopAutoPlayVocab();
      showFloatingToast('✅ Completed playing chapter vocabulary!');
      return;
    }

    const currentWord = chapter.vocabList[ttsAutoPlayIndex];
    const statusText = document.getElementById('ttsNowPlayingText');
    if (statusText) statusText.textContent = `Playing: ${currentWord.de}`;

    // Highlight row
    const row = document.getElementById(`ttsItemRow-${ttsAutoPlayIndex}`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      row.classList.add('bg-sky-100');
      setTimeout(() => row.classList.remove('bg-sky-100'), 2500);
    }

    const btn = document.getElementById(`ttsPlayBtn-${ttsAutoPlayIndex}`);
    playGermanSpeech(currentWord.de, btn);

    ttsAutoPlayIndex++;
    // Interval between words (~2.8s)
    ttsAutoPlayTimeout = setTimeout(stepAutoPlayVocab, 2800);
  }

  // ================= 17. 3D INTERACTIVE FLASHCARD TRAINER ENGINE =================
  const FC_STORAGE_KEY = 'netzwerk_fc_mastered_v1';
  let fcMasteredKeys = new Set();
  try {
    const savedFc = localStorage.getItem(FC_STORAGE_KEY);
    if (savedFc) fcMasteredKeys = new Set(JSON.parse(savedFc));
  } catch (e) {}

  function saveFcMastery() {
    try {
      localStorage.setItem(FC_STORAGE_KEY, JSON.stringify(Array.from(fcMasteredKeys)));
    } catch (e) {}
  }

  let fcActiveChapterIndex = 0;
  let fcCurrentFilter = 'all';
  let fcCardList = [];
  let fcCurrentCardIndex = 0;
  let fcIsFlipped = false;

  window.openFlashcardModal = function(chapterIdx = null) {
    if (chapterIdx !== null && chapterIdx !== undefined) {
      fcActiveChapterIndex = chapterIdx;
    } else {
      fcActiveChapterIndex = currentChapterIndex;
    }
    const modal = document.getElementById('flashcardModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    initFlashcardsForChapter();
  };

  window.closeFlashcardModal = function() {
    const modal = document.getElementById('flashcardModal');
    if (modal) modal.classList.add('hidden');
    if (synth) synth.cancel();
  };

  function initFlashcardsForChapter() {
    const chapter = NETZWERK_DATA.chapters[fcActiveChapterIndex];
    if (!chapter) return;
    const badge = document.getElementById('fcChapterBadge');
    if (badge) badge.textContent = `Kapitel ${chapter.id}: ${chapter.title.split(':')[1]?.trim() || chapter.title}`;

    applyFlashcardFilter(fcCurrentFilter);
  }

  window.setFlashcardFilter = function(filter) {
    fcCurrentFilter = filter;
    ['all', 'nouns', 'verbs', 'phrases'].forEach(f => {
      const btn = document.getElementById(`fcFilter-${f}`);
      if (!btn) return;
      if (f === filter) {
        btn.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-600 text-white shadow-2xs cursor-pointer';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-sky-800 border border-sky-200 hover:bg-sky-100 cursor-pointer';
      }
    });
    applyFlashcardFilter(filter);
  };

  function applyFlashcardFilter(filter) {
    const chapter = NETZWERK_DATA.chapters[fcActiveChapterIndex];
    if (!chapter || !chapter.vocabList) return;
    const all = chapter.vocabList;
    if (filter === 'nouns') {
      fcCardList = all.filter(v => v.type === 'der' || v.type === 'die' || v.type === 'das');
    } else if (filter === 'verbs') {
      fcCardList = all.filter(v => v.type === 'verb');
    } else if (filter === 'phrases') {
      fcCardList = all.filter(v => v.type === 'phrase');
    } else {
      fcCardList = [...all];
    }

    fcCurrentCardIndex = 0;
    renderCurrentFlashcard();
  }

  function renderCurrentFlashcard() {
    const cardEl = document.getElementById('flashcardCard');
    if (cardEl) {
      cardEl.classList.remove('is-flipped');
      fcIsFlipped = false;
    }

    const counterEl = document.getElementById('fcCounter');
    const masteryEl = document.getElementById('fcMasteryStats');

    if (!fcCardList || fcCardList.length === 0) {
      if (counterEl) counterEl.textContent = '0 / 0';
      const frontWord = document.getElementById('fcFrontWord');
      if (frontWord) frontWord.textContent = 'No words in this category';
      return;
    }

    const currentWord = fcCardList[fcCurrentCardIndex];
    const total = fcCardList.length;
    if (counterEl) counterEl.textContent = `${fcCurrentCardIndex + 1} / ${total}`;

    // Calculate mastered count in current list
    const masteredInList = fcCardList.filter(w => fcMasteredKeys.has(w.de)).length;
    if (masteryEl) masteryEl.textContent = `🌟 Mastered: ${masteredInList} / ${total}`;

    // Front Face
    const frontBadge = document.getElementById('fcFrontBadge');
    const frontWord = document.getElementById('fcFrontWord');
    const frontHint = document.getElementById('fcFrontHint');
    if (frontBadge) {
      frontBadge.textContent = currentWord.type.toUpperCase();
      let bClass = 'badge-phrase';
      if (currentWord.type === 'der') bClass = 'badge-der';
      if (currentWord.type === 'die') bClass = 'badge-die';
      if (currentWord.type === 'das') bClass = 'badge-das';
      if (currentWord.type === 'verb') bClass = 'badge-verb';
      frontBadge.className = `${bClass} px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider`;
    }
    if (frontWord) frontWord.textContent = currentWord.de;
    if (frontHint) {
      if (currentWord.type === 'der' || currentWord.type === 'die' || currentWord.type === 'das') {
        frontHint.textContent = `Noun • ${currentWord.type.toUpperCase()}`;
      } else if (currentWord.type === 'verb') {
        frontHint.textContent = `Verb`;
      } else {
        frontHint.textContent = `Phrase / Expression`;
      }
    }

    // Back Face
    const backBadge = document.getElementById('fcBackBadge');
    const backDeWord = document.getElementById('fcBackDeWord');
    const backMeaning = document.getElementById('fcBackMeaning');
    if (backBadge) backBadge.textContent = currentWord.type.toUpperCase();
    if (backDeWord) backDeWord.textContent = currentWord.de;
    if (backMeaning) backMeaning.textContent = currentWord.en || currentWord.id || '';
  }

  window.flipFlashcard = function() {
    const cardEl = document.getElementById('flashcardCard');
    if (!cardEl) return;
    fcIsFlipped = !fcIsFlipped;
    if (fcIsFlipped) {
      cardEl.classList.add('is-flipped');
    } else {
      cardEl.classList.remove('is-flipped');
    }
  };

  window.prevFlashcard = function() {
    if (!fcCardList.length) return;
    fcCurrentCardIndex = (fcCurrentCardIndex - 1 + fcCardList.length) % fcCardList.length;
    renderCurrentFlashcard();
  };

  window.nextFlashcard = function() {
    if (!fcCardList.length) return;
    fcCurrentCardIndex = (fcCurrentCardIndex + 1) % fcCardList.length;
    renderCurrentFlashcard();
  };

  window.shuffleFlashcards = function() {
    if (!fcCardList.length) return;
    for (let i = fcCardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fcCardList[i], fcCardList[j]] = [fcCardList[j], fcCardList[i]];
    }
    fcCurrentCardIndex = 0;
    renderCurrentFlashcard();
    showFloatingToast('🔀 Flashcards shuffled!');
  };

  window.markFlashcardMastery = function(isMastered) {
    if (!fcCardList.length) return;
    const currentWord = fcCardList[fcCurrentCardIndex];
    if (isMastered) {
      fcMasteredKeys.add(currentWord.de);
      showFloatingToast(`🌟 Marked as Mastered: "${currentWord.de}"`);
    } else {
      fcMasteredKeys.delete(currentWord.de);
      showFloatingToast(`📖 Marked for Review: "${currentWord.de}"`);
    }
    saveFcMastery();
    nextFlashcard();
  };

  window.playGermanSpeechForFlashcard = function() {
    if (!fcCardList.length) return;
    const currentWord = fcCardList[fcCurrentCardIndex];
    const btn = document.getElementById('fcAudioBtn');
    playGermanSpeech(currentWord.de, btn);
  };

  // ================= 18. DER DIE DAS ARTICLE TRAINER MINI-GAME ENGINE =================
  let agNouns = [];
  let agCurrentIdx = 0;
  let agScore = 0;
  let agStreak = 0;
  let agBestStreak = 0;
  let agTotalAnswered = 0;
  let agCorrectCount = 0;
  let agIsWaiting = false;

  window.openArticleGameModal = function(chapterIdx = null) {
    const modal = document.getElementById('articleGameModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const targetIdx = (chapterIdx !== null && chapterIdx !== undefined) ? chapterIdx : currentChapterIndex;
    startArticleGame(targetIdx);
  };

  window.closeArticleGameModal = function() {
    const modal = document.getElementById('articleGameModal');
    if (modal) modal.classList.add('hidden');
    if (synth) synth.cancel();
  };

  window.startArticleGame = function(chapterIdx = null) {
    const targetIdx = (chapterIdx !== null && chapterIdx !== undefined) ? chapterIdx : currentChapterIndex;
    const chapter = NETZWERK_DATA.chapters[targetIdx];
    if (!chapter || !chapter.vocabList) return;

    // Filter nouns
    const nouns = chapter.vocabList.filter(v => v.type === 'der' || v.type === 'die' || v.type === 'das');
    if (nouns.length === 0) {
      showFloatingToast("⚠️ No nouns found in this chapter.", '⚠️');
      return;
    }

    // Shuffle nouns
    agNouns = [...nouns].sort(() => Math.random() - 0.5);
    agCurrentIdx = 0;
    agScore = 0;
    agStreak = 0;
    agBestStreak = 0;
    agTotalAnswered = 0;
    agCorrectCount = 0;
    agIsWaiting = false;

    // Update UI elements
    const playArea = document.getElementById('agPlayArea');
    const summaryArea = document.getElementById('agSummaryArea');
    if (playArea) playArea.classList.remove('hidden');
    if (summaryArea) summaryArea.classList.add('hidden');

    renderArticleQuestion();
  };

  function renderArticleQuestion() {
    if (agCurrentIdx >= agNouns.length) {
      showArticleSummary();
      return;
    }

    agIsWaiting = false;
    const currentNoun = agNouns[agCurrentIdx];
    
    // Update Score & Streak
    const scoreEl = document.getElementById('agScore');
    const streakEl = document.getElementById('agStreak');
    const progressEl = document.getElementById('agProgress');
    if (scoreEl) scoreEl.textContent = agScore;
    if (streakEl) streakEl.textContent = agStreak;
    if (progressEl) progressEl.textContent = `${agCurrentIdx + 1} / ${agNouns.length}`;

    // Extract word without article (e.g. "der Tisch, -e" -> "Tisch, -e")
    let wordWithoutArticle = currentNoun.de.replace(/^(der|die|das)\s+/i, '').trim();
    
    const wordDisplay = document.getElementById('agWordDisplay');
    const meaningDisplay = document.getElementById('agMeaningDisplay');
    const feedback = document.getElementById('agFeedback');
    const wordBox = document.getElementById('agWordBox');

    if (wordDisplay) wordDisplay.textContent = wordWithoutArticle;
    if (meaningDisplay) meaningDisplay.textContent = currentNoun.en || '';
    if (feedback) feedback.innerHTML = '';
    if (wordBox) {
      wordBox.className = 'w-full py-8 px-4 rounded-2xl bg-gradient-to-b from-white to-sky-50 border-2 border-sky-200 shadow-sm flex flex-col items-center justify-center text-center transition';
    }

    // Reset buttons
    ['der', 'die', 'das'].forEach(art => {
      const btn = document.getElementById(`agBtn-${art}`);
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.transform = '';
      }
    });
  }

  window.handleArticleChoice = function(selectedArticle) {
    if (agIsWaiting || agCurrentIdx >= agNouns.length) return;
    agIsWaiting = true;

    const currentNoun = agNouns[agCurrentIdx];
    const isCorrect = (selectedArticle === currentNoun.type);
    agTotalAnswered++;

    const wordBox = document.getElementById('agWordBox');
    const feedback = document.getElementById('agFeedback');
    const chosenBtn = document.getElementById(`agBtn-${selectedArticle}`);
    const correctBtn = document.getElementById(`agBtn-${currentNoun.type}`);

    // Disable buttons
    ['der', 'die', 'das'].forEach(art => {
      const b = document.getElementById(`agBtn-${art}`);
      if (b) b.disabled = true;
    });

    if (isCorrect) {
      agCorrectCount++;
      agStreak++;
      if (agStreak > agBestStreak) agBestStreak = agStreak;
      agScore += 10 + (agStreak * 2);

      const scoreEl = document.getElementById('agScore');
      const streakEl = document.getElementById('agStreak');
      if (scoreEl) scoreEl.textContent = agScore;
      if (streakEl) streakEl.textContent = agStreak;

      if (wordBox) {
        wordBox.classList.add('pop-correct-anim');
        wordBox.style.borderColor = '#10b981';
      }

      if (feedback) {
        feedback.innerHTML = `<span class="text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-black animate-pulse">🎉 Correct! ${currentNoun.de}</span>`;
      }

      // Speak native German word with article!
      playGermanSpeech(currentNoun.de);

      setTimeout(() => {
        agCurrentIdx++;
        renderArticleQuestion();
      }, 950);

    } else {
      agStreak = 0;
      const streakEl = document.getElementById('agStreak');
      if (streakEl) streakEl.textContent = '0';

      if (wordBox) {
        wordBox.classList.add('shake-anim');
        wordBox.style.borderColor = '#ef4444';
      }

      if (chosenBtn) {
        chosenBtn.style.opacity = '0.4';
      }
      if (correctBtn) {
        correctBtn.style.transform = 'scale(1.08)';
      }

      if (feedback) {
        feedback.innerHTML = `<span class="text-rose-700 bg-rose-100 border border-rose-300 px-3 py-1 rounded-xl text-xs font-black">❌ Not quite! Correct answer: <span class="underline">${currentNoun.de}</span></span>`;
      }

      // Speak correct pronunciation
      playGermanSpeech(currentNoun.de);

      setTimeout(() => {
        agCurrentIdx++;
        renderArticleQuestion();
      }, 1800);
    }
  };

  function showArticleSummary() {
    const playArea = document.getElementById('agPlayArea');
    const summaryArea = document.getElementById('agSummaryArea');
    if (playArea) playArea.classList.add('hidden');
    if (summaryArea) summaryArea.classList.remove('hidden');

    const finalScoreEl = document.getElementById('agFinalScore');
    const accuracyEl = document.getElementById('agAccuracy');
    const bestStreakEl = document.getElementById('agBestStreak');

    const accuracy = agTotalAnswered > 0 ? Math.round((agCorrectCount / agTotalAnswered) * 100) : 0;
    if (finalScoreEl) finalScoreEl.textContent = agScore;
    if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
    if (bestStreakEl) bestStreakEl.textContent = agBestStreak;

    showFloatingToast('🏆 Der, Die, Das Session Completed!');
  }

  // ================= 19. EXPORT & DOWNLOAD ANNOTATED PDF PAGE ENGINE =================
  window.exportAnnotatedPdfPage = function() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('hidden');
  };

  window.closeExportModal = function() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.add('hidden');
  };

  function getMergedAnnotatedCanvas() {
    const renderCanvas = document.getElementById('pdfRenderCanvas');
    const annotCanvas = document.getElementById('pdfAnnotationCanvas');
    if (!renderCanvas || renderCanvas.width === 0 || renderCanvas.height === 0) {
      showFloatingToast('⚠️ PDF page not fully loaded!', '⚠️');
      return null;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = renderCanvas.width;
    exportCanvas.height = renderCanvas.height;
    const ctx = exportCanvas.getContext('2d');

    // 1. Fill solid white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Draw rendered PDF page
    ctx.drawImage(renderCanvas, 0, 0);

    // 3. Draw annotations layer if present
    if (annotCanvas && annotCanvas.width > 0 && annotCanvas.height > 0) {
      ctx.drawImage(annotCanvas, 0, 0);
    }

    return exportCanvas;
  }

  window.triggerExportPng = function() {
    closeExportModal();
    const mergedCanvas = getMergedAnnotatedCanvas();
    if (!mergedCanvas) return;

    const pageInput = document.getElementById('pageInput');
    const currentPage = (pageInput ? parseInt(pageInput.value, 10) : 1) || 1;
    const chapNum = (typeof currentChapterIndex !== 'undefined' ? currentChapterIndex + 1 : 1);
    const fileName = `Cheeya_Netzwerk_A1_Kapitel_${chapNum}_Hal_${currentPage}_annotated.png`;

    try {
      if (mergedCanvas.toBlob) {
        mergedCanvas.toBlob(function(blob) {
          if (!blob) {
            fallbackDataUrlExport(mergedCanvas, fileName);
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.download = fileName;
          a.href = blobUrl;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          showFloatingToast('✨ Annotated page image successfully downloaded (PNG)!');
        }, 'image/png');
      } else {
        fallbackDataUrlExport(mergedCanvas, fileName);
      }
    } catch (e) {
      console.error("Export PNG failed, attempting fallback:", e);
      fallbackDataUrlExport(mergedCanvas, fileName);
    }
  };

  function fallbackDataUrlExport(canvas, fileName) {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = fileName;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showFloatingToast('✨ Annotated page image successfully downloaded (PNG)!');
    } catch (err) {
      console.error("Fallback export failed:", err);
      showFloatingToast('❌ Failed to download page image.', '❌');
    }
  }

  window.triggerDirectExportPdf = function() {
    closeExportModal();
    const mergedCanvas = getMergedAnnotatedCanvas();
    if (!mergedCanvas) return;

    const pageInput = document.getElementById('pageInput');
    const currentPage = (pageInput ? parseInt(pageInput.value, 10) : 1) || 1;
    const chapNum = (typeof currentChapterIndex !== 'undefined' ? currentChapterIndex + 1 : 1);
    const fileName = `Cheeya_Netzwerk_A1_Kapitel_${chapNum}_Hal_${currentPage}_annotated.pdf`;

    showFloatingToast('⏳ Generating annotated PDF file...', '📄');

    // 1. If jsPDF library is available
    try {
      const { jsPDF } = window.jspdf || {};
      if (typeof jsPDF === 'function') {
        const imgData = mergedCanvas.toDataURL('image/jpeg', 0.95);
        const w = mergedCanvas.width;
        const h = mergedCanvas.height;
        const orientation = w > h ? 'landscape' : 'portrait';
        const doc = new jsPDF({
          orientation: orientation,
          unit: 'px',
          format: [w, h]
        });
        doc.addImage(imgData, 'JPEG', 0, 0, w, h);
        doc.save(fileName);
        showFloatingToast('✨ Annotated PDF document downloaded successfully!', '📑');
        return;
      }
    } catch (err) {
      console.warn("jsPDF export error, utilizing native PDF generator fallback:", err);
    }

    // 2. Pure JavaScript Fallback PDF Generator (100% offline, zero external dependencies)
    try {
      downloadCanvasAsPdfDirect(mergedCanvas, fileName);
    } catch (fallbackErr) {
      console.error("Direct PDF export failed:", fallbackErr);
      showFloatingToast('❌ Failed to download PDF document.', '❌');
    }
  };

  // Pure JavaScript Standalone PDF Builder
  function downloadCanvasAsPdfDirect(canvas, fileName) {
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64Data = jpegDataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const jpegLength = binaryString.length;
    const jpegBytes = new Uint8Array(jpegLength);
    for (let i = 0; i < jpegLength; i++) {
      jpegBytes[i] = binaryString.charCodeAt(i);
    }

    const widthPx = canvas.width;
    const heightPx = canvas.height;
    const ptWidth = (widthPx * 72 / 96).toFixed(2);
    const ptHeight = (heightPx * 72 / 96).toFixed(2);

    const enc = new TextEncoder();

    const contentStream = `q\n${ptWidth} 0 0 ${ptHeight} 0 0 cm\n/Im0 Do\nQ\n`;
    const contentBytes = enc.encode(contentStream);

    const header = enc.encode('%PDF-1.3\n%\xFF\xFF\xFF\xFF\n');
    const obj1 = enc.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    const obj2 = enc.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    const obj3 = enc.encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth} ${ptHeight}] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>\nendobj\n`);

    const obj4Header = enc.encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegLength} >>\nstream\n`);
    const obj4Footer = enc.encode('\nendstream\nendobj\n');

    const obj5Header = enc.encode(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
    const obj5Footer = enc.encode('endstream\nendobj\n');

    let offset = header.length;
    const offsets = [0];

    offsets.push(offset);
    offset += obj1.length;

    offsets.push(offset);
    offset += obj2.length;

    offsets.push(offset);
    offset += obj3.length;

    offsets.push(offset);
    offset += obj4Header.length + jpegLength + obj4Footer.length;

    offsets.push(offset);
    offset += obj5Header.length + contentBytes.length + obj5Footer.length;

    let xrefStr = `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 1; i <= 5; i++) {
      xrefStr += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    const xref = enc.encode(xrefStr);

    const trailer = enc.encode(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`);

    const pdfBlob = new Blob([
      header,
      obj1,
      obj2,
      obj3,
      obj4Header, jpegBytes, obj4Footer,
      obj5Header, contentBytes, obj5Footer,
      xref,
      trailer
    ], { type: 'application/pdf' });

    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.download = fileName;
    a.href = blobUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    showFloatingToast('✨ Annotated PDF document downloaded successfully!', '📑');
  }

  // Backward compatibility alias
  window.triggerPrintAnnotatedPdf = window.triggerDirectExportPdf;

  // ================= 20. FLOATING TOAST NOTIFICATION UTILITY =================
  window.showFloatingToast = function(message, icon = '✨') {
    const existing = document.querySelector('.floating-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'floating-toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      setTimeout(() => toast.remove(), 320);
    }, 3200);
  };

  // Global Keyboard Shortcuts for Modals
  window.addEventListener('keydown', (e) => {
    const fcModal = document.getElementById('flashcardModal');
    const agModal = document.getElementById('articleGameModal');

    // Flashcard shortcuts
    if (fcModal && !fcModal.classList.contains('hidden')) {
      if (e.code === 'Space') {
        e.preventDefault();
        flipFlashcard();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextFlashcard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevFlashcard();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        playGermanSpeechForFlashcard();
      } else if (e.code === 'Escape') {
        closeFlashcardModal();
      }
    }

    // Article Game shortcuts (1 = der, 2 = die, 3 = das)
    if (agModal && !agModal.classList.contains('hidden')) {
      if (e.key === '1' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleArticleChoice('der');
      } else if (e.key === '2' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleArticleChoice('die');
      } else if (e.key === '3' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleArticleChoice('das');
      } else if (e.code === 'Escape') {
        closeArticleGameModal();
      }
    }
  });

  // ================= 21. AI SMART GERMAN TRANSLATOR & GRAMMAR ANALYZER ENGINE =================
  let currentTargetGermanText = '';
  let VOCAB_LOOKUP_MAP = {};

  function initVocabLookupMap() {
    if (typeof NETZWERK_DATA === 'undefined' || !NETZWERK_DATA || !NETZWERK_DATA.chapters) return;
    NETZWERK_DATA.chapters.forEach(ch => {
      if (!ch.vocabList) return;
      ch.vocabList.forEach(item => {
        if (!item.de) return;
        const cleanDe = item.de.trim();
        const artMatch = cleanDe.match(/^(der|die|das)\s+([A-Za-zÄÖÜäöüß\-]+)/i);
        if (artMatch) {
          const article = artMatch[1].toLowerCase();
          const noun = artMatch[2].replace(/[,\/]/g, '').trim();
          VOCAB_LOOKUP_MAP[noun.toLowerCase()] = {
            de: cleanDe,
            noun: noun,
            gender: article,
            en: item.en || '',
            type: 'noun'
          };
        } else if (item.type === 'verb') {
          const verbMatch = cleanDe.match(/^([A-Za-zÄÖÜäöüß]+)/);
          if (verbMatch) {
            const v = verbMatch[1].toLowerCase();
            VOCAB_LOOKUP_MAP[v] = {
              de: cleanDe,
              infinitive: v,
              en: item.en || '',
              type: 'verb'
            };
          }
        }
      });
    });
  }

  function initTranslatorListeners() {
    const inputEl = document.getElementById('transInputText');
    const countEl = document.getElementById('transCharCount');
    if (inputEl && countEl) {
      inputEl.addEventListener('input', () => {
        countEl.textContent = `${inputEl.value.length} / 500`;
      });
    }
  }

  // ================= 1. PREPOSITIONS DICTIONARY =================
  const GERMAN_PREPOSITIONS_DICT = {
    'aus': { case: 'Dativ', meaning: 'from / out of', meaningId: 'dari / berasal dari', type: 'Dative Preposition (Fest Dativ)', rule: 'Strictly requires Dativ (indicates origin or material)' },
    'bei': { case: 'Dativ', meaning: 'at / with / near', meaningId: 'di / bersama (di tempat seseorang)', type: 'Dative Preposition (Fest Dativ)', rule: 'Strictly requires Dativ (at someone\'s place, workplace, or vicinity)' },
    'mit': { case: 'Dativ', meaning: 'with / by means of', meaningId: 'dengan / bersama / naik (kendaraan)', type: 'Dative Preposition (Fest Dativ)', rule: 'Strictly requires Dativ (instrument, accompaniment, or ingredients)' },
    'nach': { case: 'Dativ', meaning: 'to (cities/countries) / after', meaningId: 'ke (kota/negara) / setelah', type: 'Dative Preposition (Fest Dativ)', rule: 'Strictly requires Dativ (geographical destination without article, or time)' },
    'seit': { case: 'Dativ', meaning: 'since / for (time duration)', meaningId: 'sejak / selama', type: 'Dative Preposition (Fest Dativ)', rule: 'Strictly requires Dativ (action started in past and still ongoing)' },
    'von': { case: 'Dativ', meaning: 'from / of', meaningId: 'dari / milik', type: 'Dative Preposition (Fest Dativ)', rule: 'Strictly requires Dativ (origin, starting point, or possession)' },
    'zu': { case: 'Dativ', meaning: 'to / towards', meaningId: 'ke (tempat/orang)', type: 'Dative Preposition (Fest Dativ)', rule: 'Strictly requires Dativ (direction towards people, buildings, or events)' },
    'gegenüber': { case: 'Dativ', meaning: 'opposite / across from', meaningId: 'berseberangan dengan', type: 'Dative Preposition (Fest Dativ)', rule: 'Strictly requires Dativ (often placed postpositionally)' },

    'für': { case: 'Akkusativ', meaning: 'for / on behalf of', meaningId: 'untuk', type: 'Accusative Preposition (Fest Akkusativ)', rule: 'Strictly requires Akkusativ (beneficiary, purpose, or duration)' },
    'ohne': { case: 'Akkusativ', meaning: 'without', meaningId: 'tanpa', type: 'Accusative Preposition (Fest Akkusativ)', rule: 'Strictly requires Akkusativ (lack or absence)' },
    'durch': { case: 'Akkusativ', meaning: 'through', meaningId: 'melalui / melewati', type: 'Accusative Preposition (Fest Akkusativ)', rule: 'Strictly requires Akkusativ (motion passing through an enclosed space)' },
    'gegen': { case: 'Akkusativ', meaning: 'against / around (time)', meaningId: 'melawan / sekitar (waktu)', type: 'Accusative Preposition (Fest Akkusativ)', rule: 'Strictly requires Akkusativ (opposition or approximate time)' },
    'um': { case: 'Akkusativ', meaning: 'around / at (exact time)', meaningId: 'mengelilingi / pada (jam)', type: 'Accusative Preposition (Fest Akkusativ)', rule: 'Strictly requires Akkusativ (exact clock time or spatial circle)' },
    'bis': { case: 'Akkusativ', meaning: 'until / up to', meaningId: 'hingga / sampai', type: 'Accusative Preposition (Fest Akkusativ)', rule: 'Strictly requires Akkusativ (temporal endpoint or boundary)' },

    'in': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'in / into', meaningId: 'di dalam / ke dalam', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: Dativ for location (Wo?), Akkusativ for direction/movement (Wohin?)' },
    'an': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'at / on (vertical contact)', meaningId: 'pada / di (kontak vertikal)', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: Dativ for location (am Fenster), Akkusativ for movement towards (an die Wand)' },
    'auf': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'on / onto (horizontal)', meaningId: 'di atas / ke atas (horizontal)', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: Dativ for location (auf dem Tisch), Akkusativ for movement onto (auf den Tisch)' },
    'neben': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'next to', meaningId: 'di samping', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: next to' },
    'hinter': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'behind', meaningId: 'di belakang', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: behind' },
    'über': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'over / above / across', meaningId: 'di atas / menyeberangi', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: above or crossing over' },
    'unter': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'under / below / among', meaningId: 'di bawah / di antara', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: under or beneath' },
    'vor': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'in front of / before / ago', meaningId: 'di depan / sebelum / yang lalu', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: in front of (spatial) or before/ago (temporal Dativ)' },
    'zwischen': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'between', meaningId: 'di antara (dua hal)', type: 'Two-Way Preposition (Wechselpräposition)', rule: 'Two-way preposition: between two entities' },

    'während': { case: 'Genitiv', meaning: 'during', meaningId: 'selama', type: 'Genitive Preposition', rule: 'Requires Genitiv (temporal duration)' },
    'wegen': { case: 'Genitiv', meaning: 'because of', meaningId: 'karena', type: 'Genitive Preposition', rule: 'Requires Genitiv (causation)' },
    'trotz': { case: 'Genitiv', meaning: 'despite', meaningId: 'meskipun / terlepas dari', type: 'Genitive Preposition', rule: 'Requires Genitiv (concession)' },

    // Contractions
    'im': { case: 'Dativ', contraction: 'in + dem', meaning: 'in the', meaningId: 'di dalam (maskulin/netral)', type: 'Contraction (in + dem)', rule: 'Contraction of in + dem (Dativ: location Wo?)' },
    'ins': { case: 'Akkusativ', contraction: 'in + das', meaning: 'into the', meaningId: 'ke dalam (netral)', type: 'Contraction (in + das)', rule: 'Contraction of in + das (Akkusativ: destination Wohin?)' },
    'am': { case: 'Dativ', contraction: 'an + dem', meaning: 'at/on the', meaningId: 'pada/di (maskulin/netral)', type: 'Contraction (an + dem)', rule: 'Contraction of an + dem (Dativ: days, dates, location)' },
    'ans': { case: 'Akkusativ', contraction: 'an + das', meaning: 'to the', meaningId: 'ke (netral)', type: 'Contraction (an + das)', rule: 'Contraction of an + das (Akkusativ: motion towards edge)' },
    'vom': { case: 'Dativ', contraction: 'von + dem', meaning: 'from the', meaningId: 'dari (maskulin/netral)', type: 'Contraction (von + dem)', rule: 'Contraction of von + dem (Dativ)' },
    'zum': { case: 'Dativ', contraction: 'zu + dem', meaning: 'to the (masc/neut)', meaningId: 'ke (maskulin/netral)', type: 'Contraction (zu + dem)', rule: 'Contraction of zu + dem (Dativ: destination)' },
    'zur': { case: 'Dativ', contraction: 'zu + der', meaning: 'to the (fem)', meaningId: 'ke (feminin)', type: 'Contraction (zu + der)', rule: 'Contraction of zu + der (Dativ: destination)' },
    'beim': { case: 'Dativ', contraction: 'bei + dem', meaning: 'at the', meaningId: 'di / saat di (maskulin/netral)', type: 'Contraction (bei + dem)', rule: 'Contraction of bei + dem (Dativ)' }
  };

  // ================= 2. PRONOUNS DICTIONARY =================
  const GERMAN_PRONOUNS_DICT = {
    'ich': { case: 'Nominativ', role: 'Subject (The Doer)', person: '1st Person', number: 'Singular', en: 'I', id: 'saya / aku', base: 'ich', reason: 'Grammatical subject performing the action (*Wer oder was?*). In German, the subject is strictly in the Nominative case.' },
    'du': { case: 'Nominativ', role: 'Subject (The Doer)', person: '2nd Person', number: 'Singular', en: 'you (informal)', id: 'kamu', base: 'du', reason: 'Subject performing the action (*Wer oder was?*). Always in Nominativ.' },
    'er': { case: 'Nominativ', role: 'Subject (The Doer)', person: '3rd Person', number: 'Singular', gender: 'Masculine', en: 'he', id: 'dia (laki-laki)', base: 'er', reason: 'Subject pronoun for masculine person or entity in Nominativ.' },
    'sie': { case: 'Nominativ / Akkusativ', role: 'Subject or Direct Object', person: '3rd Person', number: 'Singular / Plural', gender: 'Feminine / Plural', en: 'she / they / her', id: 'dia (pr) / mereka', base: 'sie', reason: 'Subject (Nominativ: she/they) or Direct Object (Akkusativ: her/them).' },
    'es': { case: 'Nominativ / Akkusativ', role: 'Subject or Direct Object', person: '3rd Person', number: 'Singular', gender: 'Neuter', en: 'it', id: 'itu / dia (netral)', base: 'es', reason: 'Subject (Nominativ) or Direct Object (Akkusativ) for neuter entity.' },
    'wir': { case: 'Nominativ', role: 'Subject (The Doers)', person: '1st Person', number: 'Plural', en: 'we', id: 'kami / kita', base: 'wir', reason: 'Subject performing the action in Nominativ.' },
    'ihr': { case: 'Nominativ / Dativ', role: 'Subject (You all) or Indirect Object', person: '2nd Person', number: 'Plural', en: 'you all / her', id: 'kalian / kepadanya (pr)', base: 'ihr', reason: 'Nominative subject (you all) or Dative indirect object (to her).' },
    'Sie': { case: 'Nominativ / Akkusativ', role: 'Subject or Direct Object (Formal)', person: 'Formal Polite', number: 'Singular / Plural', en: 'you (formal)', id: 'Anda (formal)', base: 'Sie', reason: 'Formal polite address. Capitalized in German.' },
    'man': { case: 'Nominativ', role: 'Subject (General One / People)', person: '3rd Person', number: 'Singular', en: 'one / people in general', id: 'orang / seseorang', base: 'man', reason: 'Impersonal general subject pronoun in Nominativ.' },

    'mich': { case: 'Akkusativ', role: 'Direct Object (The Receiver)', person: '1st Person', number: 'Singular', en: 'me', id: 'saya / aku (objek langsung)', base: 'ich', reason: 'Accusative form of "ich" (*Wen oder was?*). Direct object receiving the action.' },
    'dich': { case: 'Akkusativ', role: 'Direct Object (The Receiver)', person: '2nd Person', number: 'Singular', en: 'you (informal)', id: 'kamu (objek langsung)', base: 'du', reason: 'Accusative form of "du" (*Wen oder was?*). Governed by action verb or accusative preposition.' },
    'ihn': { case: 'Akkusativ', role: 'Direct Object (The Receiver)', person: '3rd Person', number: 'Singular', gender: 'Masculine', en: 'him', id: 'dia (lk, objek langsung)', base: 'er', reason: 'Accusative form of "er" with masculine -n ending.' },
    'uns': { case: 'Akkusativ / Dativ', role: 'Object (Us / To us)', person: '1st Person', number: 'Plural', en: 'us', id: 'kami / kita (objek)', base: 'wir', reason: 'Form of "wir" in both Accusative and Dative cases.' },
    'euch': { case: 'Akkusativ / Dativ', role: 'Object (You all / To you all)', person: '2nd Person', number: 'Plural', en: 'you all', id: 'kalian (objek)', base: 'ihr', reason: 'Form of "ihr" in both Accusative and Dative cases.' },

    'mir': { case: 'Dativ', role: 'Indirect Object (Recipient: To/For me)', person: '1st Person', number: 'Singular', en: 'me / to me', id: 'kepada saya / untuk saya', base: 'ich', reason: 'Dative form of "ich" (*Wem?*). Triggered by Dative verb or preposition.' },
    'dir': { case: 'Dativ', role: 'Indirect Object (Recipient: To/For you)', person: '2nd Person', number: 'Singular', en: 'you / to you', id: 'kepada kamu / untuk kamu', base: 'du', reason: 'Dative form of "du" (*Wem?*). Triggered by Dative verb or preposition.' },
    'ihm': { case: 'Dativ', role: 'Indirect Object (To/For him or it)', person: '3rd Person', number: 'Singular', gender: 'Masculine / Neuter', en: 'him / it', id: 'kepadanya (lk/netral)', base: 'er / es', reason: 'Dative form of "er" or "es" with -m ending.' },
    'ihnen': { case: 'Dativ', role: 'Indirect Object (To/For them)', person: '3rd Person', number: 'Plural', en: 'them / to them', id: 'kepada mereka', base: 'sie', reason: 'Dative form of plural "sie".' },
    'Ihnen': { case: 'Dativ', role: 'Indirect Object (To/For you formal)', person: 'Formal Polite', number: 'Singular / Plural', en: 'you (formal) / to you', id: 'kepada Anda (formal)', base: 'Sie', reason: 'Dative form for polite formal address.' }
  };

  // ================= 3. ADJECTIVES DICTIONARY =================
  const GERMAN_ADJECTIVES_DICT = {
    'scharf': { en: 'spicy / sharp / hot', id: 'pedas / tajam' },
    'lecker': { en: 'delicious / tasty', id: 'lezat / enak' },
    'süß': { en: 'sweet', id: 'manis' },
    'sauer': { en: 'sour / angry', id: 'asam / kesal' },
    'salzig': { en: 'salty', id: 'asin' },
    'bitter': { en: 'bitter', id: 'pahit' },
    'frisch': { en: 'fresh', id: 'segar' },
    'kalt': { en: 'cold', id: 'dingin' },
    'warm': { en: 'warm', id: 'hangat' },
    'heiß': { en: 'hot', id: 'panas' },
    'groß': { en: 'big / tall', id: 'besar / tinggi' },
    'klein': { en: 'small / short', id: 'kecil / pendek' },
    'gut': { en: 'good / well', id: 'bagus / baik' },
    'schlecht': { en: 'bad / poor', id: 'buruk / jelek' },
    'schön': { en: 'beautiful / lovely', id: 'indah / cantik / bagus' },
    'neu': { en: 'new', id: 'baru' },
    'alt': { en: 'old', id: 'tua / lama' },
    'jung': { en: 'young', id: 'muda' },
    'schnell': { en: 'fast / quick', id: 'cepat' },
    'langsam': { en: 'slow', id: 'lambat' },
    'teuer': { en: 'expensive', id: 'mahal' },
    'billig': { en: 'cheap', id: 'murah' },
    'günstig': { en: 'affordable / favorable', id: 'terjangkau / menguntungkan' },
    'leicht': { en: 'easy / light', id: 'mudah / ringan' },
    'schwer': { en: 'heavy / difficult', id: 'berat / sulit' },
    'einfach': { en: 'simple / easy', id: 'sederhana / mudah' },
    'rot': { en: 'red', id: 'merah' },
    'blau': { en: 'blue', id: 'biru' },
    'grün': { en: 'green', id: 'hijau' },
    'gelb': { en: 'yellow', id: 'kuning' },
    'weiß': { en: 'white', id: 'putih' },
    'schwarz': { en: 'black', id: 'hitam' },
    'grau': { en: 'grey', id: 'abu-abu' },
    'braun': { en: 'brown', id: 'cokelat' },
    'hell': { en: 'bright / light', id: 'terang' },
    'dunkel': { en: 'dark', id: 'gelap' },
    'müde': { en: 'tired', id: 'lelah' },
    'krank': { en: 'sick / ill', id: 'sakit' },
    'gesund': { en: 'healthy', id: 'sehat' },
    'wichtig': { en: 'important', id: 'penting' },
    'richtig': { en: 'correct / right', id: 'benar' },
    'falsch': { en: 'wrong / incorrect', id: 'salah' },
    'nett': { en: 'nice / kind', id: 'ramah / baik' },
    'freundlich': { en: 'friendly', id: 'ramah' },
    'interessant': { en: 'interesting', id: 'menarik' },
    'langweilig': { en: 'boring', id: 'membosankan' },
    'toll': { en: 'great / fantastic', id: 'hebat / luar biasa' },
    'prima': { en: 'great / fine', id: 'sangat bagus' },
    'modern': { en: 'modern', id: 'modern' },
    'gemütlich': { en: 'cozy / comfortable', id: 'nyaman' },
    'sauber': { en: 'clean', id: 'bersih' },
    'schmutzig': { en: 'dirty', id: 'kotor' },
    'ruhig': { en: 'quiet / calm', id: 'tenang' },
    'laut': { en: 'loud / noisy', id: 'bising / keras' },
    'fleißig': { en: 'diligent / hardworking', id: 'rajin' },
    'faul': { en: 'lazy', id: 'malas' },
    'klug': { en: 'clever / smart', id: 'pintar / cerdas' }
  };

  function detectGermanAdjective(cleanToken) {
    if (!cleanToken) return null;
    const lower = cleanToken.toLowerCase();
    if (GERMAN_ADJECTIVES_DICT[lower]) {
      return {
        isAdj: true,
        lemma: lower,
        base: lower,
        ending: '(uninflected)',
        en: GERMAN_ADJECTIVES_DICT[lower].en,
        id: GERMAN_ADJECTIVES_DICT[lower].id
      };
    }
    const endings = ['em', 'en', 'er', 'es', 'e'];
    for (let end of endings) {
      if (lower.endsWith(end) && lower.length > end.length + 2) {
        const stem = lower.slice(0, -end.length);
        if (GERMAN_ADJECTIVES_DICT[stem]) {
          return {
            isAdj: true,
            lemma: stem,
            base: stem,
            ending: '-' + end,
            en: GERMAN_ADJECTIVES_DICT[stem].en,
            id: GERMAN_ADJECTIVES_DICT[stem].id
          };
        }
        if (stem.endsWith('r') && GERMAN_ADJECTIVES_DICT[stem.slice(0, -1) + 'er']) {
          const b = stem.slice(0, -1) + 'er';
          return {
            isAdj: true,
            lemma: b,
            base: b,
            ending: '-' + end,
            en: GERMAN_ADJECTIVES_DICT[b].en,
            id: GERMAN_ADJECTIVES_DICT[b].id
          };
        }
      }
    }
    return null;
  }

  // ================= 4. COMMON NOUNS DICTIONARY =================
  const COMMON_GERMAN_NOUNS = {
    'nudeln': { gender: 'die', number: 'Plural', isPlural: true, de: 'die Nudeln (Pl.)', en: 'noodles / pasta', id: 'mi / pasta' },
    'nudel': { gender: 'die', number: 'Singular', de: 'die Nudel, -n', en: 'noodle', id: 'sebutir mi' },
    'hähnchen': { gender: 'das', number: 'Singular', de: 'das Hähnchen, -', en: 'chicken (meat/dish)', id: 'ayam (daging/hidangan)' },
    'pizza': { gender: 'die', number: 'Singular', de: 'die Pizza, -s', en: 'pizza', id: 'pizza' },
    'kaffee': { gender: 'der', number: 'Singular', de: 'der Kaffee', en: 'coffee', id: 'kopi' },
    'tee': { gender: 'der', number: 'Singular', de: 'der Tee', en: 'tea', id: 'teh' },
    'wasser': { gender: 'das', number: 'Singular', de: 'das Wasser', en: 'water', id: 'air' },
    'brot': { gender: 'das', number: 'Singular', de: 'das Brot, -e', en: 'bread', id: 'roti' },
    'bier': { gender: 'das', number: 'Singular', de: 'das Bier, -e', en: 'beer', id: 'bir' },
    'wein': { gender: 'der', number: 'Singular', de: 'der Wein, -e', en: 'wine', id: 'anggur' },
    'suppe': { gender: 'die', number: 'Singular', de: 'die Suppe, -n', en: 'soup', id: 'sup' },
    'fleisch': { gender: 'das', number: 'Singular', de: 'das Fleisch', en: 'meat', id: 'daging' },
    'fisch': { gender: 'der', number: 'Singular', de: 'der Fisch, -e', en: 'fish', id: 'ikan' },
    'reis': { gender: 'der', number: 'Singular', de: 'der Reis', en: 'rice', id: 'nasi' },
    'käse': { gender: 'der', number: 'Singular', de: 'der Käse', en: 'cheese', id: 'keju' },
    'salat': { gender: 'der', number: 'Singular', de: 'der Salat, -e', en: 'salad', id: 'salad' },
    'apfel': { gender: 'der', number: 'Singular', de: 'der Apfel, -̈', en: 'apple', id: 'apel' },
    'äpfel': { gender: 'die', number: 'Plural', isPlural: true, de: 'die Äpfel', en: 'apples', id: 'apel-apel' },
    'kartoffel': { gender: 'die', number: 'Singular', de: 'die Kartoffel, -n', en: 'potato', id: 'kentang' },
    'kartoffeln': { gender: 'die', number: 'Plural', isPlural: true, de: 'die Kartoffeln', en: 'potatoes', id: 'kentang-kentang' },
    'milch': { gender: 'die', number: 'Singular', de: 'die Milch', en: 'milk', id: 'susu' },
    'zucker': { gender: 'der', number: 'Singular', de: 'der Zucker', en: 'sugar', id: 'gula' },
    'tag': { gender: 'der', number: 'Singular', de: 'der Tag, -e', en: 'day', id: 'hari' },
    'morgen': { gender: 'der', number: 'Singular', de: 'der Morgen', en: 'morning', id: 'pagi' },
    'abend': { gender: 'der', number: 'Singular', de: 'der Abend, -e', en: 'evening', id: 'malam (awal)' },
    'bus': { gender: 'der', number: 'Singular', de: 'der Bus, -se', en: 'bus', id: 'bus' },
    'zug': { gender: 'der', number: 'Singular', de: 'der Zug, -̈e', en: 'train', id: 'kereta api' },
    'auto': { gender: 'das', number: 'Singular', de: 'das Auto, -s', en: 'car', id: 'mobil' },
    'fahrrad': { gender: 'das', number: 'Singular', de: 'das Fahrrad, -̈er', en: 'bicycle', id: 'sepeda' },
    'buch': { gender: 'das', number: 'Singular', de: 'das Buch, -̈er', en: 'book', id: 'buku' },
    'bücher': { gender: 'die', number: 'Plural', isPlural: true, de: 'die Bücher', en: 'books', id: 'buku-buku' },
    'haus': { gender: 'das', number: 'Singular', de: 'das Haus, -̈er', en: 'house', id: 'rumah' },
    'freund': { gender: 'der', number: 'Singular', de: 'der Freund, -e', en: 'friend (male)', id: 'teman (laki-laki)' },
    'freundin': { gender: 'die', number: 'Singular', de: 'die Freundin, -nen', en: 'friend (female)', id: 'teman (perempuan)' },
    'mann': { gender: 'der', number: 'Singular', de: 'der Mann, -̈er', en: 'man / husband', id: 'pria / suami' },
    'frau': { gender: 'die', number: 'Singular', de: 'die Frau, -en', en: 'woman / wife', id: 'wanita / istri' },
    'kind': { gender: 'das', number: 'Singular', de: 'das Kind, -er', en: 'child', id: 'anak' },
    'kinder': { gender: 'die', number: 'Plural', isPlural: true, de: 'die Kinder', en: 'children', id: 'anak-anak' },
    'deutsch': { gender: 'das', number: 'Singular', de: 'das Deutsch', en: 'German (language)', id: 'bahasa Jerman' }
  };

  function resolveGermanNoun(nounClean) {
    if (!nounClean) return { gender: 'der', number: 'Singular', en: '', id: '', de: '' };
    const lower = nounClean.toLowerCase();
    if (typeof VOCAB_LOOKUP_MAP !== 'undefined' && VOCAB_LOOKUP_MAP[lower]) {
      const v = VOCAB_LOOKUP_MAP[lower];
      return {
        gender: v.gender || 'der',
        number: 'Singular',
        isPlural: false,
        en: v.en || '',
        id: v.en || '',
        de: v.de || `${v.gender} ${nounClean}`
      };
    }
    if (COMMON_GERMAN_NOUNS[lower]) {
      const n = COMMON_GERMAN_NOUNS[lower];
      return {
        gender: n.gender,
        number: n.number || (n.isPlural ? 'Plural' : 'Singular'),
        isPlural: !!n.isPlural,
        en: n.en,
        id: n.id,
        de: n.de
      };
    }
    // Suffix heuristics
    let g = 'der';
    let num = 'Singular';
    if (lower.endsWith('ung') || lower.endsWith('heit') || lower.endsWith('keit') || lower.endsWith('schaft') || lower.endsWith('tion') || lower.endsWith('tät') || lower.endsWith('ie')) {
      g = 'die';
    } else if (lower.endsWith('chen') || lower.endsWith('lein') || lower.endsWith('ment') || lower.endsWith('um')) {
      g = 'das';
    } else if (lower.endsWith('er') || lower.endsWith('ling') || lower.endsWith('ismus')) {
      g = 'der';
    } else if (lower.endsWith('e')) {
      g = 'die';
    }
    return { gender: g, number: num, isPlural: false, en: nounClean, id: nounClean, de: `${g} ${nounClean}` };
  }

  // ================= 5. KNOWN VERBS CONJUGATIONS =================
  const KNOWN_VERB_CONJUGATIONS = {
    // Modal Verbs
    'möchte': { inf: 'mögen (möchten)', conjugated: 'möchte', person: '1st/3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Konjunktiv II (höfliche Form)', modal: true, en: 'would like to', id: 'ingin / mau', governs: 'Infinitiv am Satzende', pattern: 'Modalverb + Infinitiv am Satzende' },
    'möchtest': { inf: 'mögen (möchten)', conjugated: 'möchtest', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Konjunktiv II', modal: true, en: 'would like to', id: 'ingin / mau', governs: 'Infinitiv am Satzende' },
    'möchten': { inf: 'mögen (möchten)', conjugated: 'möchten', person: '1st/3rd Person', number: 'Plural', tense: 'Präsens', mood: 'Konjunktiv II', modal: true, en: 'would like to', id: 'ingin / mau', governs: 'Infinitiv am Satzende' },
    'möchtet': { inf: 'mögen (möchten)', conjugated: 'möchtet', person: '2nd Person', number: 'Plural', tense: 'Präsens', mood: 'Konjunktiv II', modal: true, en: 'would like to', id: 'ingin / mau', governs: 'Infinitiv am Satzende' },

    'kann': { inf: 'können', conjugated: 'kann', person: '1st/3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', modal: true, en: 'can / able to', id: 'bisa / dapat', governs: 'Infinitiv am Satzende' },
    'kannst': { inf: 'können', conjugated: 'kannst', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', modal: true, en: 'can', id: 'bisa', governs: 'Infinitiv am Satzende' },
    'können': { inf: 'können', conjugated: 'können', person: '1st/3rd Person', number: 'Plural', tense: 'Präsens', mood: 'Indikativ / Infinitiv', modal: true, en: 'can', id: 'bisa', governs: 'Infinitiv am Satzende' },

    'muss': { inf: 'müssen', conjugated: 'muss', person: '1st/3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', modal: true, en: 'must / have to', id: 'harus', governs: 'Infinitiv am Satzende' },
    'musst': { inf: 'müssen', conjugated: 'musst', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', modal: true, en: 'must', id: 'harus', governs: 'Infinitiv am Satzende' },
    'müssen': { inf: 'müssen', conjugated: 'müssen', person: '1st/3rd Person', number: 'Plural', tense: 'Präsens', mood: 'Indikativ / Infinitiv', modal: true, en: 'must', id: 'harus', governs: 'Infinitiv am Satzende' },

    'will': { inf: 'wollen', conjugated: 'will', person: '1st/3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', modal: true, en: 'want to', id: 'ingin / mau', governs: 'Infinitiv am Satzende' },
    'willst': { inf: 'wollen', conjugated: 'willst', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', modal: true, en: 'want to', id: 'ingin', governs: 'Infinitiv am Satzende' },
    'wollen': { inf: 'wollen', conjugated: 'wollen', person: '1st/3rd Person', number: 'Plural', tense: 'Präsens', mood: 'Indikativ / Infinitiv', modal: true, en: 'want to', id: 'ingin', governs: 'Infinitiv am Satzende' },

    'darf': { inf: 'dürfen', conjugated: 'darf', person: '1st/3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', modal: true, en: 'may / allowed to', id: 'boleh', governs: 'Infinitiv am Satzende' },
    'dürfen': { inf: 'dürfen', conjugated: 'dürfen', person: '1st/3rd Person', number: 'Plural', tense: 'Präsens', mood: 'Indikativ / Infinitiv', modal: true, en: 'may', id: 'boleh', governs: 'Infinitiv am Satzende' },

    'soll': { inf: 'sollen', conjugated: 'soll', person: '1st/3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', modal: true, en: 'should / supposed to', id: 'seharusnya', governs: 'Infinitiv am Satzende' },
    'sollen': { inf: 'sollen', conjugated: 'soll', person: '1st/3rd Person', number: 'Plural', tense: 'Präsens', mood: 'Indikativ / Infinitiv', modal: true, en: 'should', id: 'seharusnya', governs: 'Infinitiv am Satzende' },

    // Full Verbs
    'esse': { inf: 'essen', conjugated: 'esse', person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'eat', id: 'makan', governs: 'Akkusativ' },
    'isst': { inf: 'essen', conjugated: 'isst', person: '2nd/3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'eats', id: 'makan', governs: 'Akkusativ', note: 'Strong verb with vowel shift: e -> i' },
    'essen': { inf: 'essen', conjugated: 'essen', person: 'Infinitive / 1st/3rd Plural', number: 'Plural', tense: 'Präsens / Infinitiv', mood: 'Infinitiv / Indikativ', en: 'eat', id: 'makan', governs: 'Akkusativ', pattern: 'essen + Akkusativ' },

    'trinke': { inf: 'trinken', conjugated: 'trinke', person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'drink', id: 'minum', governs: 'Akkusativ' },
    'trinkst': { inf: 'trinken', conjugated: 'trinkst', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'drink', id: 'minum', governs: 'Akkusativ' },
    'trinkt': { inf: 'trinken', conjugated: 'trinkt', person: '3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'drinks', id: 'minum', governs: 'Akkusativ' },
    'trinken': { inf: 'trinken', conjugated: 'trinken', person: 'Infinitive / 1st/3rd Plural', number: 'Plural', tense: 'Präsens / Infinitiv', mood: 'Infinitiv / Indikativ', en: 'drink', id: 'minum', governs: 'Akkusativ', pattern: 'trinken + Akkusativ' },

    'habe': { inf: 'haben', conjugated: 'habe', person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'have', id: 'punya / memiliki', governs: 'Akkusativ' },
    'hast': { inf: 'haben', conjugated: 'hast', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'have', id: 'punya', governs: 'Akkusativ' },
    'hat': { inf: 'haben', conjugated: 'hat', person: '3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'has', id: 'punya', governs: 'Akkusativ' },
    'haben': { inf: 'haben', conjugated: 'haben', person: 'Infinitive / 1st/3rd Plural', number: 'Plural', tense: 'Präsens / Infinitiv', mood: 'Infinitiv / Indikativ', en: 'have', id: 'punya', governs: 'Akkusativ' },

    'bin': { inf: 'sein', conjugated: 'bin', person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', copula: true, en: 'am', id: 'adalah', governs: 'Nominativ (Kopula)' },
    'bist': { inf: 'sein', conjugated: 'bist', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', copula: true, en: 'are', id: 'adalah', governs: 'Nominativ (Kopula)' },
    'ist': { inf: 'sein', conjugated: 'ist', person: '3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', copula: true, en: 'is', id: 'adalah', governs: 'Nominativ (Kopula)' },
    'sind': { inf: 'sein', conjugated: 'sind', person: '1st/3rd Person', number: 'Plural', tense: 'Präsens', mood: 'Indikativ', copula: true, en: 'are', id: 'adalah', governs: 'Nominativ (Kopula)' },
    'sein': { inf: 'sein', conjugated: 'sein', person: 'Infinitive', number: 'Singular', tense: 'Infinitiv', mood: 'Infinitiv', copula: true, en: 'be', id: 'menjadi / adalah', governs: 'Nominativ (Kopula)' },

    'lerne': { inf: 'lernen', conjugated: 'lerne', person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'learn', id: 'belajar', governs: 'Akkusativ' },
    'lernst': { inf: 'lernen', conjugated: 'lernst', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'learn', id: 'belajar', governs: 'Akkusativ' },
    'lernt': { inf: 'lernen', conjugated: 'lernt', person: '3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'learns', id: 'belajar', governs: 'Akkusativ' },
    'lernen': { inf: 'lernen', conjugated: 'lernen', person: 'Infinitive / 1st/3rd Plural', number: 'Plural', tense: 'Präsens / Infinitiv', mood: 'Infinitiv / Indikativ', en: 'learn', id: 'belajar', governs: 'Akkusativ' },

    'helfe': { inf: 'helfen', conjugated: 'helfe', person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'help', id: 'membantu', governs: 'Dativ' },
    'hilfst': { inf: 'helfen', conjugated: 'hilfst', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'help', id: 'membantu', governs: 'Dativ' },
    'hilft': { inf: 'helfen', conjugated: 'hilft', person: '3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'helps', id: 'membantu', governs: 'Dativ' },
    'helfen': { inf: 'helfen', conjugated: 'helfen', person: 'Infinitive / 1st/3rd Plural', number: 'Plural', tense: 'Präsens / Infinitiv', mood: 'Infinitiv / Indikativ', en: 'help', id: 'membantu', governs: 'Dativ' },

    'danke': { inf: 'danken', conjugated: 'danke', person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'thank', id: 'berterima kasih', governs: 'Dativ' },
    'dankst': { inf: 'danken', conjugated: 'dankst', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'thank', id: 'berterima kasih', governs: 'Dativ' },
    'dankt': { inf: 'danken', conjugated: 'dankt', person: '3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'thanks', id: 'berterima kasih', governs: 'Dativ' },
    'danken': { inf: 'danken', conjugated: 'danken', person: 'Infinitive / 1st/3rd Plural', number: 'Plural', tense: 'Präsens / Infinitiv', mood: 'Infinitiv / Indikativ', en: 'thank', id: 'berterima kasih', governs: 'Dativ' },

    'kaufe': { inf: 'kaufen', conjugated: 'kaufe', person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'buy', id: 'membeli', governs: 'Akkusativ' },
    'kaufst': { inf: 'kaufen', conjugated: 'kaufst', person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'buy', id: 'membeli', governs: 'Akkusativ' },
    'kauft': { inf: 'kaufen', conjugated: 'kauft', person: '3rd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: 'buys', id: 'membeli', governs: 'Akkusativ' },
    'kaufen': { inf: 'kaufen', conjugated: 'kaufen', person: 'Infinitive / 1st/3rd Plural', number: 'Plural', tense: 'Präsens / Infinitiv', mood: 'Infinitiv / Indikativ', en: 'buy', id: 'membeli', governs: 'Akkusativ' }
  };

  const QUESTION_WORDS_DICT = {
    'wer': { en: 'Who?', id: 'Siapa? (Subjek / Nominativ)' },
    'wen': { en: 'Whom?', id: 'Siapa? (Objek langsung / Akkusativ)' },
    'wem': { en: 'To whom?', id: 'Kepada siapa? (Dativ)' },
    'wessen': { en: 'Whose?', id: 'Milik siapa? (Genitiv)' },
    'was': { en: 'What?', id: 'Apa?' },
    'wo': { en: 'Where?', id: 'Di mana? (Lokasi / Dativ)' },
    'woher': { en: 'Where from?', id: 'Dari mana? (Asal)' },
    'wohin': { en: 'Where to?', id: 'Ke mana? (Tujuan / Akkusativ)' },
    'wann': { en: 'When?', id: 'Kapan?' },
    'warum': { en: 'Why?', id: 'Mengapa / Kenapa?' },
    'wie': { en: 'How?', id: 'Bagaimana?' }
  };

  const SUBORDINATING_CONJUNCTIONS_DICT = {
    'weil': { en: 'because', id: 'karena' },
    'dass': { en: 'that', id: 'bahwa' },
    'wenn': { en: 'if / whenever', id: 'jika / ketika' },
    'ob': { en: 'whether / if', id: 'apakah' },
    'obwohl': { en: 'although', id: 'meskipun' },
    'damit': { en: 'so that', id: 'supaya / agar' }
  };

  const COORDINATING_CONJUNCTIONS_DICT = {
    'und': { en: 'and', id: 'dan' },
    'aber': { en: 'but', id: 'tetapi / tapi' },
    'oder': { en: 'or', id: 'atau' },
    'denn': { en: 'because / for', id: 'karena (Posisi 0)' },
    'sondern': { en: 'rather / but', id: 'melainkan' }
  };

  const INVERSION_ADVERBS_DICT = {
    'heute': { en: 'today', id: 'hari ini' },
    'morgen': { en: 'tomorrow', id: 'besok' },
    'gestern': { en: 'yesterday', id: 'kemarin' },
    'jetzt': { en: 'now', id: 'sekarang' },
    'dann': { en: 'then / after that', id: 'kemudian / lalu' },
    'danach': { en: 'afterwards', id: 'setelah itu' },
    'deshalb': { en: 'therefore', id: 'oleh karena itu' },
    'leider': { en: 'unfortunately', id: 'sayangnya' },
    'hier': { en: 'here', id: 'di sini' },
    'dort': { en: 'there', id: 'di sana' },
    'immer': { en: 'always', id: 'selalu' }
  };

  function findGoverningPreposition(tokens, index) {
    for (let k = index - 1; k >= Math.max(0, index - 3); k--) {
      if (GERMAN_PREPOSITIONS_DICT[tokens[k].lower]) {
        return tokens[k];
      }
    }
    return null;
  }

  window.handleTranslatorLangChange = function() {
    const src = document.getElementById('transSourceLang')?.value || 'en';
    const tgt = document.getElementById('transTargetLang')?.value || 'de';

    const srcLabel = document.getElementById('transSourceLabel');
    const tgtLabel = document.getElementById('transTargetLabel');

    const names = {
      'en': '🇬🇧 English Sentence',
      'id': '🇮🇩 Indonesian Sentence',
      'de': '🇩🇪 German Sentence (Deutsch)'
    };
    const tgtNames = {
      'en': '🇬🇧 English Translation',
      'id': '🇮🇩 Indonesian Translation',
      'de': '🇩🇪 German Translation & Analysis'
    };

    if (srcLabel) srcLabel.textContent = names[src] || 'Source Sentence';
    if (tgtLabel) tgtLabel.textContent = tgtNames[tgt] || 'Translation';
  };

  window.swapTranslatorLanguages = function() {
    const srcEl = document.getElementById('transSourceLang');
    const tgtEl = document.getElementById('transTargetLang');
    const inputEl = document.getElementById('transInputText');
    const outputEl = document.getElementById('transOutputText');

    if (!srcEl || !tgtEl) return;
    const oldSrc = srcEl.value;
    const oldTgt = tgtEl.value;
    srcEl.value = oldTgt;
    tgtEl.value = oldSrc;
    handleTranslatorLangChange();

    const currentTranslated = outputEl ? outputEl.textContent.trim() : '';
    if (currentTranslated && !currentTranslated.includes('Translation and grammar breakdown')) {
      if (inputEl) inputEl.value = currentTranslated;
      translateAndAnalyze();
    }
  };

  window.setTranslatorSample = function(sampleText, srcLang, tgtLang) {
    const srcEl = document.getElementById('transSourceLang');
    const tgtEl = document.getElementById('transTargetLang');
    const inputEl = document.getElementById('transInputText');

    if (srcEl) srcEl.value = srcLang;
    if (tgtEl) tgtEl.value = tgtLang;
    if (inputEl) inputEl.value = sampleText;

    handleTranslatorLangChange();
    translateAndAnalyze();
  };

  window.clearTranslatorInput = function() {
    const inputEl = document.getElementById('transInputText');
    const outputEl = document.getElementById('transOutputText');
    const countEl = document.getElementById('transCharCount');
    const analysisContainer = document.getElementById('grammarAnalysisContainer');

    if (inputEl) inputEl.value = '';
    if (countEl) countEl.textContent = '0 / 500';
    if (outputEl) {
      outputEl.innerHTML = '<span class="text-sky-400 text-xs font-medium italic">Translation and grammar breakdown will appear here...</span>';
    }
    if (analysisContainer) {
      analysisContainer.innerHTML = '';
      analysisContainer.classList.add('hidden');
    }
    const phoneticBar = document.getElementById('transPhoneticBar');
    if (phoneticBar) phoneticBar.classList.add('hidden');
    currentTargetGermanText = '';
  };

  window.copyTranslatorOutput = function() {
    const outputEl = document.getElementById('transOutputText');
    if (!outputEl) return;
    const text = outputEl.innerText || outputEl.textContent;
    if (!text || text.includes('Translation and grammar breakdown')) {
      showFloatingToast('⚠️ No translated text to copy yet.', '⚠️');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showFloatingToast('📋 Translation copied to clipboard!');
    }).catch(() => {
      showFloatingToast('📋 Translation copied!');
    });
  };

  window.playTranslatorTargetAudio = function() {
    if (!currentTargetGermanText) {
      const outputEl = document.getElementById('transOutputText');
      currentTargetGermanText = outputEl ? outputEl.textContent.trim() : '';
    }
    if (!currentTargetGermanText || currentTargetGermanText.includes('Translation and grammar breakdown')) {
      showFloatingToast('⚠️ No German text available to pronounce yet.', '⚠️');
      return;
    }
    const btn = document.getElementById('transAudioBtn');
    playGermanSpeech(currentTargetGermanText, btn);
  };

  window.translateAndAnalyze = async function() {
    const inputEl = document.getElementById('transInputText');
    const outputEl = document.getElementById('transOutputText');
    const loadingEl = document.getElementById('transLoadingIndicator');
    const analysisContainer = document.getElementById('grammarAnalysisContainer');
    const srcLang = document.getElementById('transSourceLang')?.value || 'en';
    const tgtLang = document.getElementById('transTargetLang')?.value || 'de';

    const text = inputEl ? inputEl.value.trim() : '';
    if (!text) {
      showFloatingToast('⚠️ Please enter a sentence to translate.', '⚠️');
      return;
    }

    if (loadingEl) loadingEl.classList.remove('hidden');

    try {
      let translatedText = '';
      if (srcLang === tgtLang) {
        translatedText = text;
      } else {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcLang}&tl=${tgtLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[0]) {
          translatedText = data[0].map(item => item[0]).join('');
        }
      }

      if (!translatedText) translatedText = text;

      // Determine which sentence is German
      if (tgtLang === 'de') {
        currentTargetGermanText = translatedText;
      } else if (srcLang === 'de') {
        currentTargetGermanText = text;
      } else {
        currentTargetGermanText = '';
      }

      if (outputEl) {
        outputEl.innerHTML = `<span class="text-sky-950 font-extrabold leading-relaxed text-base md:text-lg">${translatedText}</span>`;
      }

      // Update live phonetic pronunciation guide in translator card
      const phoneticBar = document.getElementById('transPhoneticBar');
      const phoneticTextEl = document.getElementById('transPhoneticText');
      const phoneticTipsEl = document.getElementById('transPhoneticTips');
      if (currentTargetGermanText && typeof generateGermanPhonetics === 'function') {
        const ph = generateGermanPhonetics(currentTargetGermanText);
        if (phoneticTextEl) phoneticTextEl.textContent = ph.phoneticText;
        if (phoneticTipsEl) phoneticTipsEl.innerHTML = ph.tips;
        if (phoneticBar) phoneticBar.classList.remove('hidden');
      } else if (phoneticBar) {
        phoneticBar.classList.add('hidden');
      }

      // Fetch parallel English and Indonesian translations if not already known
      let enSentence = '';
      let idSentence = '';

      if (srcLang === 'en') enSentence = text;
      else if (tgtLang === 'en') enSentence = translatedText;

      if (srcLang === 'id') idSentence = text;
      else if (tgtLang === 'id') idSentence = translatedText;

      if (currentTargetGermanText) {
        const fetchPromises = [];
        if (!enSentence) {
          fetchPromises.push(
            fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=en&dt=t&q=${encodeURIComponent(currentTargetGermanText)}`)
              .then(r => r.json())
              .then(d => { if (d && d[0]) enSentence = d[0].map(x => x[0]).join(''); })
              .catch(() => {})
          );
        }
        if (!idSentence) {
          fetchPromises.push(
            fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=id&dt=t&q=${encodeURIComponent(currentTargetGermanText)}`)
              .then(r => r.json())
              .then(d => { if (d && d[0]) idSentence = d[0].map(x => x[0]).join(''); })
              .catch(() => {})
          );
        }
        if (fetchPromises.length > 0) {
          await Promise.all(fetchPromises);
        }
      }

      // If either source or target is German, run deep German Grammar Analysis
      if (currentTargetGermanText && analysisContainer) {
        const analysisHtml = analyzeGermanGrammar(currentTargetGermanText, enSentence, idSentence, srcLang, tgtLang);
        analysisContainer.innerHTML = analysisHtml;
        analysisContainer.classList.remove('hidden');
      } else if (analysisContainer) {
        analysisContainer.innerHTML = '';
        analysisContainer.classList.add('hidden');
      }

      showFloatingToast('✨ Translation & Grammar Analysis ready!');

      // Update notebook star state
      const starIcon = document.getElementById('transSaveStarIcon');
      if (starIcon) {
        const savedList = typeof loadSavedSentences === 'function' ? loadSavedSentences() : [];
        const isAlreadySaved = savedList.some(item => item.german === (currentTargetGermanText || translatedText));
        starIcon.textContent = isAlreadySaved ? '🌟' : '⭐';
      }

      // Gamification tracking
      window.totalSentencesAnalyzed = (window.totalSentencesAnalyzed || 0) + 1;
      if (typeof awardXP === 'function') awardXP(10, 'Grammar Analyzed');
      if (window.totalSentencesAnalyzed >= 5 && typeof unlockBadge === 'function') {
        unlockBadge('grammar_detective');
      }

    } catch (err) {
      console.error("Translation or grammar analysis error:", err);
      if (outputEl) {
        outputEl.innerHTML = `<span class="text-rose-600 text-xs font-bold">⚠️ Translation service temporarily unavailable. Please check your connection.</span>`;
      }
      showFloatingToast('❌ Translation failed.', '❌');
    } finally {
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  };

  // ================= 6. THE COMPLETE 12-MODULE ANALYZER =================
  function analyzeGermanGrammar(germanText, enSentence = '', idSentence = '', srcLang = 'en', tgtLang = 'de') {
    if (!germanText) return '';
    const isIndo = (srcLang === 'id' || tgtLang === 'id');

    const rawTokens = germanText.trim().split(/\s+/);
    if (!rawTokens.length) return '';

    const tokens = rawTokens.map((tok, idx) => {
      const clean = tok.replace(/^[„“"'(\[]+|[.,!?:;)"'\]]+$/g, '');
      const lower = clean.toLowerCase();
      return { raw: tok, clean: clean, lower: lower, index: idx };
    }).filter(t => t.clean.length > 0);

    if (!tokens.length) return '';

    const lastChar = germanText.trim().slice(-1);
    const isQuestion = (lastChar === '?');
    const isExclamation = (lastChar === '!');
    const firstWord = tokens[0]?.lower || '';

    // Step A: Parse Verbs
    let finiteVerbToken = null;
    let nonFiniteVerbToken = null;
    let modalVerbToken = null;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      let vInfo = KNOWN_VERB_CONJUGATIONS[t.lower];
      if (!vInfo && i > 0 && !finiteVerbToken) {
        if (t.lower.endsWith('e')) vInfo = { inf: t.lower + 'n', conjugated: t.clean, person: '1st Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: t.lower, id: t.lower, governs: 'Akkusativ' };
        else if (t.lower.endsWith('st')) vInfo = { inf: t.lower.slice(0, -2) + 'en', conjugated: t.clean, person: '2nd Person', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: t.lower, id: t.lower, governs: 'Akkusativ' };
        else if (t.lower.endsWith('t')) vInfo = { inf: t.lower.slice(0, -1) + 'en', conjugated: t.clean, person: '3rd Person / 2nd Plur.', number: 'Singular', tense: 'Präsens', mood: 'Indikativ', en: t.lower, id: t.lower, governs: 'Akkusativ' };
      }

      if (vInfo) {
        if (!finiteVerbToken) {
          finiteVerbToken = { token: t, index: i, info: vInfo };
          if (vInfo.modal) modalVerbToken = finiteVerbToken;
        } else if (i === tokens.length - 1 || t.lower.endsWith('en') || t.lower.startsWith('ge')) {
          nonFiniteVerbToken = { token: t, index: i, info: vInfo };
        }
      }
    }

    if (!nonFiniteVerbToken && tokens.length > 2 && finiteVerbToken) {
      const last = tokens[tokens.length - 1];
      if (last.index !== finiteVerbToken.index && (last.lower.endsWith('en') || last.lower.endsWith('eln') || last.lower.endsWith('ern'))) {
        const verbInf = last.lower;
        const vEn = KNOWN_VERB_CONJUGATIONS[verbInf]?.en || COMMON_GERMAN_NOUNS[verbInf]?.en || verbInf;
        const vId = KNOWN_VERB_CONJUGATIONS[verbInf]?.id || COMMON_GERMAN_NOUNS[verbInf]?.id || verbInf;
        nonFiniteVerbToken = {
          token: last,
          index: last.index,
          info: {
            inf: verbInf,
            conjugated: last.clean,
            person: 'Infinitive (Base form)',
            number: '-',
            tense: 'Infinitiv',
            mood: 'Infinitiv',
            en: vEn,
            id: vId,
            governs: 'Akkusativ',
            pattern: `${verbInf} am Satzende`
          }
        };
      }
    }

    // Step B: Sentence Type & Word Order Pattern
    let sentenceType = 'Hauptsatz (Subject-First Main Clause)';
    let sentenceBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let sentenceTopic = 'Modalverb-Satzklammer & Präpositionalgefüge';
    let wordOrderDesc = '';
    let isSubordinate = false;

    for (let t of tokens) {
      if (SUBORDINATING_CONJUNCTIONS_DICT[t.lower]) {
        isSubordinate = true;
        sentenceType = 'Nebensatz (Subordinate Clause)';
        sentenceBadge = 'bg-indigo-100 text-indigo-800 border-indigo-300';
        wordOrderDesc = `Starts with the subordinating conjunction <strong>"${t.clean}"</strong> (${SUBORDINATING_CONJUNCTIONS_DICT[t.lower].en} / ${SUBORDINATING_CONJUNCTIONS_DICT[t.lower].id}). The conjugated verb is kicked to the very end (*Verbletzt-Stellung*).`;
        sentenceTopic = `Subordinate Clause (*${t.clean}* + Verb-Kicker)`;
        break;
      }
    }

    if (!isSubordinate) {
      if (isQuestion) {
        if (QUESTION_WORDS_DICT[firstWord]) {
          sentenceType = 'W-Frage (Information Question)';
          sentenceBadge = 'bg-amber-100 text-amber-800 border-amber-300';
          wordOrderDesc = `Starts with the question word <strong>"${tokens[0].clean}"</strong> (${QUESTION_WORDS_DICT[firstWord].en} / ${QUESTION_WORDS_DICT[firstWord].id}). The finite verb stands in <strong>Position 2</strong>, followed by the subject in <strong>Position 3</strong>.`;
          sentenceTopic = `W-Question (*${tokens[0].clean}* + Verb Pos 2)`;
        } else {
          sentenceType = 'Ja/Nein-Frage (Polar Question)';
          sentenceBadge = 'bg-purple-100 text-purple-800 border-purple-300';
          wordOrderDesc = `The finite verb moves to <strong>Position 1</strong> at the very start of the sentence, immediately followed by the subject in <strong>Position 2</strong>.`;
          sentenceTopic = 'Yes/No Polar Question (Verb in Position 1)';
        }
      } else if (isExclamation && (KNOWN_VERB_CONJUGATIONS[firstWord] || firstWord.endsWith('en') || firstWord.endsWith('t'))) {
        sentenceType = 'Imperativsatz (Command / Request)';
        sentenceBadge = 'bg-rose-100 text-rose-800 border-rose-300';
        wordOrderDesc = `The action verb occupies <strong>Position 1</strong> to issue a direct order or polite instruction.`;
        sentenceTopic = 'Imperative Command (Verb in Position 1)';
      } else {
        const isSubjectFirst = ['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'Sie', 'man'].includes(firstWord) ||
                               ['der', 'die', 'das', 'ein', 'eine', 'mein', 'dein', 'ihr', 'unser'].includes(firstWord);
        if (isSubjectFirst) {
          sentenceType = 'Hauptsatz (Standard: Subject First)';
          sentenceBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          wordOrderDesc = `Standard German main clause: The subject (<strong>"${tokens[0].clean}"</strong>) occupies <strong>Position 1</strong>, followed immediately by the finite verb in <strong>Position 2</strong> (*Goldene Regel*).`;
        } else {
          sentenceType = 'Invertierter Hauptsatz (Time / Adverb First)';
          sentenceBadge = 'bg-teal-100 text-teal-800 border-teal-300';
          wordOrderDesc = `Inverted word order: <strong>Position 1</strong> is occupied by <strong>"${tokens[0].clean}"</strong> to set context or emphasis. Because the verb MUST stay in <strong>Position 2</strong>, the subject hops into <strong>Position 3</strong> right after the verb!`;
          sentenceTopic = 'Inversion (Adverb in Pos 1, Verb in Pos 2, Subject in Pos 3)';
        }
      }
    }

    // Satzklammer
    let bracketInfo = null;
    if (finiteVerbToken && finiteVerbToken.info.modal && nonFiniteVerbToken) {
      bracketInfo = {
        type: 'Modalverb-Satzklammer (Modal Verb Bracket)',
        left: finiteVerbToken.token.clean,
        leftPos: finiteVerbToken.index + 1,
        right: nonFiniteVerbToken.token.clean,
        rightPos: nonFiniteVerbToken.index + 1,
        desc: `The conjugated modal verb <strong>"${finiteVerbToken.token.clean}"</strong> sits in <strong>Position 2</strong> (opening the bracket), while the main action verb <strong>"${nonFiniteVerbToken.token.clean}"</strong> is placed at the <strong>very end of the clause in base infinitive form</strong> (closing the bracket). Everything else is held inside the Mittelfeld.`
      };
      sentenceTopic = 'Modalverb (*möchten*) + Infinitiv am Satzende (Satzklammer)';
    }

    // Step C: CEFR Level Estimate
    let cefrLevel = 'A1';
    let cefrTag = 'Elementary (Breakthrough)';
    let cefrBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let cefrReason = 'Uses core everyday vocabulary (food, desires) with standard modal verb bracket.';

    if (isSubordinate || germanText.includes('würde') || germanText.includes('hätte') || germanText.includes('wäre')) {
      cefrLevel = 'B1';
      cefrTag = 'Intermediate (Threshold)';
      cefrBadgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-300';
      cefrReason = 'Features subordinate clauses, hypothetical subjunctive forms, or complex connective syntax.';
    } else if (germanText.includes('weil') || germanText.includes('dass') || germanText.includes('wenn') || germanText.includes('ge')) {
      cefrLevel = 'A2';
      cefrTag = 'Pre-Intermediate (Waystage)';
      cefrBadgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
      cefrReason = 'Features compound clauses, past participles, or separable prefix combinations.';
    }

    // Step D: Detect Errors & Corrections (e.g. scharfer -> scharfem)
    const detectedErrors = [];
    const correctedTokens = tokens.map(t => t.clean);

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const prev = i > 0 ? tokens[i - 1] : null;
      const next = i + 1 < tokens.length ? tokens[i + 1] : null;

      // Adjective ending check after preposition (e.g. mit scharfer Hähnchen)
      if (prev && GERMAN_PREPOSITIONS_DICT[prev.lower] && next && (/^[A-ZÄÖÜ]/.test(next.clean) || COMMON_GERMAN_NOUNS[next.lower])) {
        const pInfo = GERMAN_PREPOSITIONS_DICT[prev.lower];
        const nInfo = resolveGermanNoun(next.clean);
        const adj = detectGermanAdjective(t.clean);

        if (adj && pInfo.case.includes('Dativ') && nInfo.gender === 'das') {
          if (adj.ending !== '-em') {
            const correctForm = adj.base + 'em';
            detectedErrors.push({
              original: t.clean,
              corrected: correctForm,
              reason: `The preposition <strong>"${prev.clean}"</strong> requires the <strong>Dativ</strong> case. <strong>"${next.clean}"</strong> is neuter (<em>das Hähnchen</em>). Without an article (Nullartikel), the adjective takes the strong ending <strong class="text-emerald-700">-em</strong> (<em>${correctForm}</em>), NOT <em>${t.clean}</em>.`
            });
            correctedTokens[i] = `<mark class="bg-emerald-200 text-emerald-950 font-black px-1.5 py-0.5 rounded">${correctForm}</mark>`;
          }
        }
      }

      // Preposition case error (e.g. für dir -> für dich)
      if (t.lower === 'dir' && prev && prev.lower === 'für') {
        detectedErrors.push({
          original: 'dir',
          corrected: 'dich',
          reason: `The preposition <strong>"für"</strong> strictly requires the <strong>Akkusativ</strong> case. The accusative form of "du" is <strong>"dich"</strong> (never <em>dir</em>).`
        });
        correctedTokens[i] = `<mark class="bg-emerald-200 text-emerald-950 font-black px-1.5 py-0.5 rounded">dich</mark>`;
      }
    }

    const hasGrammarErrors = (detectedErrors.length > 0);
    const correctedSentence = correctedTokens.join(' ') + (lastChar.match(/[.!?]/) ? lastChar : '.');

    // Step E: Word-by-Word Analysis Array
    const analyzedWords = [];
    const prepositionsFound = [];
    const adjectivesFound = [];
    const verbsFound = [];
    const casesFound = {
      'Nominativ': [],
      'Akkusativ': [],
      'Dativ': [],
      'Genitiv': []
    };

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const prev = i > 0 ? tokens[i - 1] : null;
      const next = i + 1 < tokens.length ? tokens[i + 1] : null;

      let item = {
        word: t.clean,
        lemma: t.clean,
        en: '',
        id: '',
        pos: 'Word',
        func: 'Constituent',
        case: '-',
        gender: '-',
        number: '-',
        person: '-',
        tense: '-',
        mood: '-',
        ending: '-',
        reason: 'Word constituent in clause.'
      };

      // 1. Pronoun
      if (GERMAN_PRONOUNS_DICT[t.lower]) {
        const pr = GERMAN_PRONOUNS_DICT[t.lower];
        item.pos = 'Personal Pronoun';
        item.lemma = pr.base;
        item.en = pr.en;
        item.id = pr.id;
        item.case = pr.case;
        item.person = pr.person;
        item.number = pr.number;
        item.gender = pr.gender || '-';
        item.func = pr.role;
        item.reason = pr.reason;

        if (pr.case.includes('Nominativ')) casesFound['Nominativ'].push({ word: t.clean, role: 'Subject', reason: 'Grammatical subject performing the verb action.' });
        if (pr.case.includes('Akkusativ')) casesFound['Akkusativ'].push({ word: t.clean, role: 'Direct Object', reason: 'Direct recipient of the verb action (*Wen oder was?*).' });
        if (pr.case.includes('Dativ')) casesFound['Dativ'].push({ word: t.clean, role: 'Indirect Object', reason: 'Beneficiary / recipient in Dative (*Wem?*).' });
      }
      // 2. Verb
      else if (finiteVerbToken && i === finiteVerbToken.index) {
        const v = finiteVerbToken.info;
        item.pos = v.modal ? 'Modal Verb' : 'Finite Verb';
        item.lemma = v.inf;
        item.en = v.en;
        item.id = v.id;
        item.person = v.person;
        item.number = v.number;
        item.tense = v.tense;
        item.mood = v.mood;
        item.ending = t.clean.slice(-2);
        item.func = v.modal ? 'Finite Verb (Opens Satzklammer)' : 'Finite Verb (Position 2)';
        item.reason = `Conjugated for ${v.person} in Position 2. ${v.modal ? 'Demands base infinitive at sentence end.' : (v.governs ? `Governs ${v.governs}.` : '')}`;

        verbsFound.push({
          token: t.clean,
          inf: v.inf,
          person: v.person,
          number: v.number,
          tense: v.tense,
          mood: v.mood,
          type: v.modal ? 'Modal Verb (Hilfsverb)' : 'Main Verb (Vollverb)',
          separable: 'No',
          pos: `Position #${i + 1} (Finite Verb)`,
          governs: v.governs || 'Akkusativ',
          pattern: v.pattern || 'Verb in Position 2',
          roleDesc: v.modal ? 'Opens the sentence bracket (Position 2)' : 'Anchors the predicate in Position 2'
        });
      }
      // 3. Second/Non-finite Verb
      else if (nonFiniteVerbToken && i === nonFiniteVerbToken.index) {
        const v = nonFiniteVerbToken.info;
        item.pos = 'Main Verb (Vollverb)';
        item.lemma = v.inf;
        item.en = v.en;
        item.id = v.id;
        item.person = '-';
        item.number = '-';
        item.tense = 'Infinitiv';
        item.mood = 'Infinitiv';
        item.ending = '-en';
        item.func = 'Non-finite Verb (Closes Satzklammer)';
        item.reason = `Infinitive placed at the very end of the sentence (*Satzende*) governed by modal verb "${finiteVerbToken ? finiteVerbToken.token.clean : 'modal'}". Closes the bracket.`;

        verbsFound.push({
          token: t.clean,
          inf: v.inf,
          person: 'Infinitive (Base form)',
          number: '-',
          tense: 'Infinitiv',
          mood: 'Infinitiv',
          type: 'Main Verb (Vollverb)',
          separable: 'No',
          pos: `Satzende (Position #${i + 1})`,
          governs: 'Akkusativ (Direct Object)',
          pattern: `${v.inf} + Akkusativ`,
          roleDesc: 'Closes the sentence bracket (*Rechte Satzklammer*)'
        });
      }
      // 4. Preposition
      else if (GERMAN_PREPOSITIONS_DICT[t.lower]) {
        const prep = GERMAN_PREPOSITIONS_DICT[t.lower];
        item.pos = 'Preposition';
        item.lemma = t.lower;
        item.en = prep.meaning;
        item.id = prep.meaningId;
        item.func = `${prep.case} Case Trigger`;
        item.case = prep.case;
        item.reason = prep.rule;

        prepositionsFound.push({
          token: t.clean,
          meaning: prep.meaning,
          meaningId: prep.meaningId,
          case: prep.case,
          type: prep.type,
          rule: prep.rule
        });
      }
      // 5. Adjective
      else {
        const adj = detectGermanAdjective(t.clean);
        if (adj) {
          const govPrep = findGoverningPreposition(tokens, i);
          const prepInfo = govPrep ? GERMAN_PREPOSITIONS_DICT[govPrep.lower] : null;
          const nextNoun = (next && (/^[A-ZÄÖÜ]/.test(next.clean) || COMMON_GERMAN_NOUNS[next.lower])) ? resolveGermanNoun(next.clean) : null;

          let adjCase = prepInfo ? (prepInfo.case.includes('Dativ') ? 'Dativ' : 'Akkusativ') : 'Nominativ';
          let adjGender = nextNoun ? nextNoun.gender : 'Neuter';
          let adjDeclension = 'Starke Deklination (Strong: Zero Article)';
          let adjReason = `Governed by preposition "${govPrep ? govPrep.clean : ''}" which demands ${adjCase}. Modifies ${adjGender} noun "${next ? next.clean : ''}". Zero article requires strong ending ${adj.ending}.`;

          item.pos = 'Adjective (Attributive)';
          item.lemma = adj.lemma;
          item.en = adj.en;
          item.id = adj.id;
          item.case = adjCase;
          item.gender = adjGender;
          item.number = nextNoun ? nextNoun.number : 'Singular';
          item.ending = adj.ending;
          item.func = 'Adjectival Modifier (Attribute)';
          item.reason = adjReason;

          adjectivesFound.push({
            token: t.clean,
            lemma: adj.lemma,
            case: adjCase,
            gender: adjGender,
            number: nextNoun ? nextNoun.number : 'Singular',
            articleType: 'Nullartikel (Zero Article)',
            declensionType: adjDeclension,
            ending: adj.ending,
            explanation: `Zero article before ${adjGender} noun in ${adjCase} demands the strong adjective ending <strong class="text-purple-700 font-black">${adj.ending}</strong> to clearly signal the case.`
          });
        }
        // 6. Noun
        else {
          const isCapital = /^[A-ZÄÖÜ]/.test(t.clean);
          const nInfo = resolveGermanNoun(t.clean);
          const govPrep = findGoverningPreposition(tokens, i);

          item.pos = 'Noun';
          item.lemma = nInfo.de || t.clean;
          item.en = nInfo.en || t.clean;
          item.id = nInfo.id || t.clean;
          item.gender = nInfo.gender === 'der' ? 'Masculine (der)' : (nInfo.gender === 'die' ? 'Feminine (die)' : 'Neuter (das)');
          item.number = nInfo.number;

          if (govPrep) {
            const prepCase = GERMAN_PREPOSITIONS_DICT[govPrep.lower]?.case || 'Dativ';
            item.case = prepCase.includes('Dativ') ? 'Dativ' : (prepCase.includes('Akkusativ') ? 'Akkusativ' : 'Dativ');
            item.func = 'Prepositional Object (Dativ-Ergänzung)';
            item.reason = `Governed by preposition "${govPrep.clean}", which strictly demands the ${item.case} case.`;
            casesFound[item.case].push({ word: t.clean, role: 'Prepositional Object', reason: `Governed by preposition "${govPrep.clean}" requiring ${item.case}.` });
          } else {
            item.case = 'Akkusativ';
            item.func = 'Direct Object (Akkusativ-Objekt)';
            item.reason = `Direct object receiving the action of the verb (*Wen oder was?*). Zero article (Nullartikel) applied for food / uncountable plural.`;
            casesFound['Akkusativ'].push({ word: t.clean, role: 'Direct Object', reason: `Direct object receiving the verb's action (*Wen oder was essen?*).` });
          }
        }
      }

      analyzedWords.push(item);
    }

    // Pipeline Ribbon Strip
    const pipelineStripHtml = analyzedWords.map(w => {
      let badgeClass = 'bg-sky-50 text-sky-900 border-sky-300';
      if (w.func.includes('Subject')) badgeClass = 'bg-emerald-50 text-emerald-950 border-emerald-300 font-extrabold ring-2 ring-emerald-400/30';
      else if (w.func.includes('Finite Verb')) badgeClass = 'bg-rose-50 text-rose-950 border-rose-300 font-black ring-2 ring-rose-400/30';
      else if (w.func.includes('Direct Object')) badgeClass = 'bg-blue-50 text-blue-950 border-blue-300 font-bold';
      else if (w.func.includes('Case Trigger')) badgeClass = 'bg-indigo-50 text-indigo-950 border-indigo-300 font-bold';
      else if (w.func.includes('Adjectival')) badgeClass = 'bg-purple-50 text-purple-950 border-purple-300 font-bold';
      else if (w.func.includes('Prepositional Object')) badgeClass = 'bg-purple-50 text-purple-950 border-purple-300 font-bold';
      else if (w.func.includes('Non-finite')) badgeClass = 'bg-amber-50 text-amber-950 border-amber-300 font-black ring-2 ring-amber-400/30';

      return `
        <div class="flex flex-col items-center px-2.5 py-1.5 rounded-xl border ${badgeClass} shadow-2xs text-center min-w-[75px]">
          <span class="text-xs font-black">${w.word}</span>
          <span class="text-[9px] font-extrabold uppercase tracking-tight opacity-80 mt-0.5">${w.func.split('(')[0].trim()}</span>
        </div>
      `;
    }).join('<span class="text-sky-300 font-black px-0.5">&rarr;</span>');

    // Sentence Pattern Equation
    const patternParts = [];
    if (analyzedWords.some(w => w.func.includes('Subject'))) patternParts.push('Subject');
    if (finiteVerbToken) patternParts.push(`Finite Verb (${finiteVerbToken.info.modal ? 'Modalverb' : 'Vollverb'})`);
    if (analyzedWords.some(w => w.func.includes('Direct Object'))) patternParts.push('Accusative Direct Object');
    if (prepositionsFound.length > 0) patternParts.push(`Prepositional Phrase [${prepositionsFound[0].token} + ${prepositionsFound[0].case}]`);
    if (nonFiniteVerbToken) patternParts.push('Non-finite Verb (Infinitiv am Satzende)');
    const sentencePatternFormula = patternParts.join(' + ');

    // Word-by-Word Cards Grid
    const wordCardsHtml = analyzedWords.map(w => {
      let tagBg = 'bg-sky-100 text-sky-900 border-sky-200';
      if (w.pos.includes('Pronoun')) tagBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
      else if (w.pos.includes('Verb')) tagBg = 'bg-rose-100 text-rose-900 border-rose-300';
      else if (w.pos.includes('Noun')) tagBg = 'bg-blue-100 text-blue-900 border-blue-300';
      else if (w.pos.includes('Adjective')) tagBg = 'bg-purple-100 text-purple-900 border-purple-300';
      else if (w.pos.includes('Preposition')) tagBg = 'bg-indigo-100 text-indigo-900 border-indigo-300';

      return `
        <div class="p-3 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-2 flex flex-col justify-between hover:border-sky-300 transition">
          <div>
            <div class="flex items-center justify-between gap-1 pb-1.5 border-b border-sky-100">
              <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${tagBg}">${w.pos}</span>
              <button onclick="playGermanSpeech(decodeURIComponent('${encodeURIComponent(w.word)}'), this)" class="p-1 rounded-md text-sky-600 hover:bg-sky-100 transition cursor-pointer" title="Listen">🔊</button>
            </div>
            <div class="mt-1.5">
              <div class="text-base font-black text-sky-950">${w.word}</div>
              <div class="text-[11px] font-bold text-sky-700">Base / Lemma: <span class="text-sky-950 font-black">${w.lemma}</span></div>
            </div>
            <div class="mt-1 text-[11px] text-sky-900 space-y-0.5">
              <div>🇬🇧 <strong>Meaning:</strong> ${w.en || '-'}</div>
              ${isIndo ? `<div>🇮🇩 <strong>ID:</strong> ${w.id || '-'}</div>` : ''}
            </div>
          </div>

          <div class="pt-2 border-t border-sky-100/80 text-[10px] space-y-1 text-sky-900">
            <div class="grid grid-cols-2 gap-1 font-medium bg-sky-50/70 p-1.5 rounded-lg">
              <div><strong>Role:</strong> ${w.func.split('(')[0]}</div>
              <div><strong>Case:</strong> ${w.case}</div>
              <div><strong>Gender:</strong> ${w.gender}</div>
              <div><strong>Number:</strong> ${w.number}</div>
              ${w.person !== '-' ? `<div><strong>Person:</strong> ${w.person}</div>` : ''}
              ${w.tense !== '-' ? `<div><strong>Tense:</strong> ${w.tense}</div>` : ''}
              ${w.mood !== '-' ? `<div><strong>Mood:</strong> ${w.mood}</div>` : ''}
              ${w.ending !== '-' ? `<div><strong>Ending:</strong> <span class="font-black text-purple-700">${w.ending}</span></div>` : ''}
            </div>
            <div class="text-[10px] text-sky-800 leading-snug pt-0.5">
              💡 <strong>Why:</strong> ${w.reason}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Case Breakdown Cards
    const caseCardsHtml = ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'].map(cName => {
      const items = casesFound[cName];
      let colorBorder = 'border-slate-200 bg-slate-50/50 text-slate-700';
      if (cName === 'Nominativ') colorBorder = 'border-emerald-200 bg-emerald-50/50 text-emerald-950';
      if (cName === 'Akkusativ') colorBorder = 'border-blue-200 bg-blue-50/50 text-blue-950';
      if (cName === 'Dativ') colorBorder = 'border-purple-200 bg-purple-50/50 text-purple-950';

      if (!items || items.length === 0) {
        return `
          <div class="p-3 bg-white rounded-xl border border-sky-100 text-xs text-sky-600 opacity-60">
            <div class="font-extrabold text-[11px] uppercase tracking-wider text-slate-500">${cName}</div>
            <p class="text-[11px] italic mt-1">No ${cName} constituents in this clause.</p>
          </div>
        `;
      }

      return `
        <div class="p-3 bg-white rounded-xl border ${colorBorder} shadow-2xs space-y-1.5">
          <div class="flex items-center justify-between pb-1 border-b border-current/15">
            <span class="font-black text-xs uppercase tracking-wider">${cName}</span>
            <span class="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white border border-current/30">${items.length} element(s)</span>
          </div>
          ${items.map(it => `
            <div class="text-xs space-y-0.5">
              <div class="font-black text-sm text-sky-950">"${it.word}" <span class="text-[11px] font-bold text-sky-700">(${it.role})</span></div>
              <p class="text-[11px] text-sky-800 leading-snug">💡 <strong>Why:</strong> ${it.reason}</p>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');

    // Verb Analysis Cards
    const verbCardsHtml = verbsFound.map(v => `
      <div class="p-3.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-emerald-200">
          <div class="flex items-center gap-2">
            <span class="text-base">⚡</span>
            <span class="font-black text-sm text-emerald-950">Verb: <strong>"${v.token}"</strong></span>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-800">Infinitive: <em>${v.inf}</em></span>
          </div>
          <span class="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">${v.pos}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white/90 p-2 rounded-xl border border-emerald-100 text-emerald-950">
          <div><strong>Person & Number:</strong><br><span class="text-emerald-800 font-bold">${v.person} (${v.number})</span></div>
          <div><strong>Tense & Mood:</strong><br><span class="text-emerald-800 font-bold">${v.tense} • ${v.mood}</span></div>
          <div><strong>Type:</strong><br><span class="text-emerald-800 font-bold">${v.type}</span></div>
          <div><strong>Separable Prefix:</strong><br><span class="text-emerald-800 font-bold">${v.separable}</span></div>
        </div>
        <div class="text-xs text-emerald-950 space-y-1">
          <div>🎯 <strong>Government / Pattern:</strong> ${v.pattern} (demands ${v.governs})</div>
          <div>🔗 <strong>Bracket Role:</strong> ${v.roleDesc}</div>
        </div>
      </div>
    `).join('');

    // Adjective Analysis Cards
    const adjCardsHtml = adjectivesFound.length > 0 ? adjectivesFound.map(adj => `
      <div class="p-3.5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 rounded-2xl border border-purple-200 shadow-2xs space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-purple-200">
          <div class="flex items-center gap-2">
            <span class="text-base">🎨</span>
            <span class="font-black text-sm text-purple-950">Adjective: <strong class="text-purple-700">"${adj.token}"</strong></span>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-800">Base Lemma: <em>${adj.lemma}</em></span>
          </div>
          <span class="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-200 text-purple-950">Ending: ${adj.ending}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white/90 p-2 rounded-xl border border-purple-100 text-purple-950">
          <div><strong>Case:</strong><br><span class="text-purple-800 font-bold">${adj.case}</span></div>
          <div><strong>Gender & Number:</strong><br><span class="text-purple-800 font-bold">${adj.gender} (${adj.number})</span></div>
          <div><strong>Article Type:</strong><br><span class="text-purple-800 font-bold">${adj.articleType}</span></div>
          <div><strong>Declension Type:</strong><br><span class="text-purple-800 font-bold">${adj.declensionType}</span></div>
        </div>
        <div class="p-2 bg-white rounded-xl border border-purple-200 text-xs text-purple-950 leading-relaxed">
          💡 <strong>Why does it take this ending?</strong> ${adj.explanation}
        </div>
      </div>
    `).join('') : `
      <div class="p-3 bg-white rounded-xl border border-sky-200 text-xs text-sky-800 italic">
        ℹ️ No attributive adjectives in this sentence. (If an adjective were added, e.g., <em>frische Nudeln</em>, it would decline according to case, gender, and article type).
      </div>
    `;

    // Preposition Analysis Cards
    const prepCardsHtml = prepositionsFound.length > 0 ? prepositionsFound.map(prep => `
      <div class="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200 shadow-2xs space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-blue-200">
          <div class="flex items-center gap-2">
            <span class="text-base">📍</span>
            <span class="font-black text-sm text-blue-950">Preposition: <strong class="text-blue-800">"${prep.token}"</strong></span>
          </div>
          <span class="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-200 text-blue-950">Case: ${prep.case}</span>
        </div>
        <div class="grid grid-cols-1 ${isIndo ? 'sm:grid-cols-2' : ''} gap-2 text-xs bg-white/90 p-2 rounded-xl border border-blue-100 text-blue-950">
          <div>🇬🇧 <strong>Meaning (EN):</strong> ${prep.meaning}</div>
          ${isIndo ? `<div>🇮🇩 <strong>Meaning (ID):</strong> ${prep.meaningId}</div>` : ''}
        </div>
        <div class="text-xs text-blue-950 space-y-1">
          <div>🏷️ <strong>Preposition Type:</strong> ${prep.type}</div>
          <div class="p-2 bg-white rounded-xl border border-blue-200 leading-relaxed">
            ⚡ <strong>Impact on Sentence:</strong> ${prep.rule}. Any noun, article, or adjective immediately following "${prep.token}" MUST take the <strong>${prep.case}</strong> case!
          </div>
        </div>
      </div>
    `).join('') : `
      <div class="p-3 bg-white rounded-xl border border-sky-200 text-xs text-sky-800 italic">
        ℹ️ No prepositions used in this sentence.
      </div>
    `;

    return `
      <!-- ================= HEADER ================= -->
      <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sky-200">
        <div>
          <h3 class="font-black text-base text-sky-950 flex items-center gap-2">
            <span>🇩🇪</span>
            <span>Comprehensive German Grammar & Syntax Analysis</span>
          </h3>
          <p class="text-xs text-sky-700">Detailed morphological, syntactic, and naturalness dissection of your sentence.</p>
        </div>
        <span class="text-[11px] font-black px-3 py-1 rounded-full border ${cefrBadgeColor}">
          ${cefrLevel} Level • ${cefrTag}
        </span>
      </div>

      <!-- ================= 1. SENTENCE OVERVIEW ================= -->
      <div class="p-4 bg-gradient-to-r from-sky-50 to-blue-50/80 rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-200/80">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">1-A. Sentence Overview</span>
          <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${sentenceBadge}">${sentenceType}</span>
        </div>

        <div class="flex items-start justify-between gap-3 bg-white/95 p-3 rounded-xl border border-sky-200">
          <div>
            <div class="text-sm md:text-base font-black text-sky-950 leading-relaxed">${germanText}</div>
            <div class="text-xs text-sky-700 mt-1">🇬🇧 <strong>English Translation:</strong> ${enSentence || 'Translation available above'}</div>
            ${isIndo ? `<div class="text-xs text-sky-800 mt-0.5">🇮🇩 <strong>Indonesian Translation:</strong> ${idSentence || 'Terjemahan tersedia di atas'}</div>` : ''}
          </div>
          <button onclick="playGermanSpeech(decodeURIComponent('${encodeURIComponent(germanText)}'), this)" class="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0" title="Listen to German sentence">
            <span>🔊</span><span>Listen</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 bg-white/80 rounded-xl border border-sky-100">
            <strong class="text-sky-950 font-black">🎯 Main Grammar Topic:</strong>
            <p class="text-sky-800 mt-0.5">${sentenceTopic}</p>
          </div>
          <div class="p-2.5 bg-white/80 rounded-xl border border-sky-100">
            <strong class="text-sky-950 font-black">📊 CEFR Classification Reason:</strong>
            <p class="text-sky-800 mt-0.5">${cefrReason}</p>
          </div>
        </div>
      </div>

      <!-- ================= 2. SENTENCE STRUCTURE & PATTERN ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">2. Sentence Structure & Formula</span>
          <span class="text-[10px] text-sky-600 font-bold">${analyzedWords.length} tokens parsed</span>
        </div>

        <div>
          <span class="text-[10px] font-black uppercase text-sky-600 tracking-wider block mb-1.5">Constituent Pipeline:</span>
          <div class="flex flex-wrap items-center gap-1.5 p-2.5 bg-sky-50/60 rounded-xl border border-sky-200 overflow-x-auto">
            ${pipelineStripHtml}
          </div>
        </div>

        <div class="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-950">
          <span class="text-[10px] font-black uppercase tracking-wider text-blue-900 block mb-0.5">📐 Sentence Pattern Equation:</span>
          <div class="font-black text-sm text-blue-900">${sentencePatternFormula}</div>
          <p class="text-[11px] text-blue-800 mt-1 leading-relaxed">${wordOrderDesc}</p>
        </div>
      </div>

      <!-- ================= 1-B. WORD-BY-WORD ANALYSIS ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <div>
            <span class="text-xs font-black uppercase text-sky-800 tracking-wider">1-B. Word-by-Word Analysis</span>
            <p class="text-[11px] text-sky-600">Complete morphological dissection for every single word.</p>
          </div>
          <span class="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-md">Bilingual EN & ID</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          ${wordCardsHtml}
        </div>
      </div>

      <!-- ================= 3. CASE ANALYSIS ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <div>
            <span class="text-xs font-black uppercase text-sky-800 tracking-wider">3. Case Analysis (With Explicit "WHY")</span>
            <p class="text-[11px] text-sky-600">Nominativ (Wer/Was?) • Akkusativ (Wen/Was?) • Dativ (Wem?) • Genitiv (Wessen?)</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          ${caseCardsHtml}
        </div>
      </div>

      <!-- ================= 4. VERB ANALYSIS ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">4. In-Depth Verb Analysis</span>
          <span class="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-md border border-emerald-200">${verbsFound.length} verb(s) detected</span>
        </div>
        <div class="space-y-2.5">
          ${verbCardsHtml}
        </div>
      </div>

      <!-- ================= 5. ADJECTIVE ANALYSIS ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">5. Adjective Declension Analysis</span>
          <span class="text-[10px] text-purple-800 bg-purple-100 font-bold px-2 py-0.5 rounded-md border border-purple-200">${adjectivesFound.length} adjective(s) detected</span>
        </div>
        <div class="space-y-2.5">
          ${adjCardsHtml}
        </div>
      </div>

      <!-- ================= 6. PREPOSITION ANALYSIS ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">6. Preposition & Government Analysis</span>
          <span class="text-[10px] text-blue-800 bg-blue-100 font-bold px-2 py-0.5 rounded-md border border-blue-200">${prepositionsFound.length} preposition(s) detected</span>
        </div>
        <div class="space-y-2.5">
          ${prepCardsHtml}
        </div>
      </div>

      <!-- ================= 7. WORD ORDER ANALYSIS ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">7. Word Order & Satzklammer Logic</span>
          <span class="text-[10px] bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded-md">Vorfeld • Mittelfeld • Nachfeld</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div class="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1">
            <span class="text-[10px] font-black uppercase text-sky-700 tracking-wider">Position 1 (Vorfeld):</span>
            <div class="font-black text-sm text-sky-950">${tokens[0]?.clean || '-'}</div>
            <p class="text-[11px] text-sky-800">Occupied by the subject / topic.</p>
          </div>
          <div class="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
            <span class="text-[10px] font-black uppercase text-rose-700 tracking-wider">Position 2 (Linke Klammer):</span>
            <div class="font-black text-sm text-rose-950">${finiteVerbToken ? finiteVerbToken.token.clean : '-'}</div>
            <p class="text-[11px] text-rose-800">The finite verb locked in Position 2 (*Goldene Regel*).</p>
          </div>
          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
            <span class="text-[10px] font-black uppercase text-amber-700 tracking-wider">Satzende (Rechte Klammer):</span>
            <div class="font-black text-sm text-amber-950">${nonFiniteVerbToken ? nonFiniteVerbToken.token.clean : '(None)'}</div>
            <p class="text-[11px] text-amber-800">${nonFiniteVerbToken ? 'Infinitive completing the bracket.' : 'No second verb needed.'}</p>
          </div>
        </div>

        ${bracketInfo ? `
          <div class="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 text-xs text-purple-950 flex items-start gap-2">
            <span class="text-base">🔗</span>
            <div>
              <strong class="font-black text-purple-900">${bracketInfo.type}:</strong>
              <p class="mt-0.5 leading-relaxed">${bracketInfo.desc}</p>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- ================= 8. GRAMMAR RULES DETECTED ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-2.5">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">8. 📚 Grammar Rules Detected</span>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          ${modalVerbToken ? `<span class="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-300 font-bold flex items-center gap-1.5"><span>📌</span><span>Modalverb im Hauptsatz (Satzklammer)</span></span>` : ''}
          ${prepositionsFound.map(p => `<span class="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-950 border border-blue-300 font-bold flex items-center gap-1.5"><span>📌</span><span>Präposition "${p.token}" + ${p.case}</span></span>`).join('')}
          ${adjectivesFound.map(a => `<span class="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold flex items-center gap-1.5"><span>📌</span><span>${a.declensionType} (${a.case} ${a.gender}: ${a.ending})</span></span>`).join('')}
          ${analyzedWords.some(w => w.func.includes('Direct Object') && w.word === 'Nudeln') ? `<span class="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 font-bold flex items-center gap-1.5"><span>📌</span><span>Nullartikel bei Speisen / unbestimmtem Plural</span></span>` : ''}
          <span class="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-950 border border-sky-300 font-bold flex items-center gap-1.5"><span>📌</span><span>Subjekt-Verb-Kongruenz (Person & Numerus)</span></span>
        </div>
      </div>

      <!-- ================= 9. COMMON MISTAKE DETECTOR ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">9. Common Mistake Detector & Learner Traps</span>
          <span class="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-md border border-amber-200">Watch Out!</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-200 space-y-1.5">
            <div class="flex items-center gap-1.5 font-black text-rose-950">
              <span>❌</span><span>Common Word Order Error:</span>
            </div>
            <p class="font-mono text-xs text-rose-800 bg-white/80 p-1.5 rounded-md border border-rose-200"><s>Ich möchte essen Nudeln mit scharfem Hähnchen.</s></p>
            <div class="flex items-center gap-1.5 font-black text-emerald-900 pt-0.5">
              <span>✅</span><span>Correct Pattern:</span>
            </div>
            <p class="font-mono text-xs text-emerald-900 bg-white/80 p-1.5 rounded-md border border-emerald-200 font-bold">Ich möchte Nudeln mit scharfem Hähnchen <u>essen</u>.</p>
            <p class="text-[11px] text-rose-900 leading-snug">💡 <strong>Why:</strong> In German main clauses with a modal verb, the main verb <em>must</em> be kicked to the sentence end (*Satzklammer*).</p>
          </div>

          <div class="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1.5">
            <div class="flex items-center gap-1.5 font-black text-purple-950">
              <span>❌</span><span>Common Adjective Declension Trap:</span>
            </div>
            <p class="font-mono text-xs text-rose-800 bg-white/80 p-1.5 rounded-md border border-rose-200"><s>... mit scharfer Hähnchen</s></p>
            <div class="flex items-center gap-1.5 font-black text-emerald-900 pt-0.5">
              <span>✅</span><span>Correct Pattern:</span>
            </div>
            <p class="font-mono text-xs text-emerald-900 bg-white/80 p-1.5 rounded-md border border-emerald-200 font-bold">... mit scharf<u>em</u> Hähnchen</p>
            <p class="text-[11px] text-purple-900 leading-snug">💡 <strong>Why:</strong> <em>Hähnchen</em> is neuter (das Hähnchen). Preposition <em>mit</em> requires Dativ. Without an article, the strong neuter Dative ending is <strong>-em</strong>, not <strong>-er</strong>.</p>
          </div>
        </div>
      </div>

      <!-- ================= 10. CORRECTED SENTENCE ================= -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <span class="text-xs font-black uppercase text-sky-800 tracking-wider">10. Corrected Sentence & Error Scan</span>
          <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full border ${hasGrammarErrors ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}">
            ${hasGrammarErrors ? '❌ Errors Detected' : '✅ 100% Grammatically Correct'}
          </span>
        </div>

        ${hasGrammarErrors ? `
          <div class="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-2">
            <div class="font-bold text-rose-950 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Errors were detected and corrected:</span>
            </div>
            <div class="p-2.5 bg-white rounded-lg border border-rose-200 font-medium text-sky-950">
              ${correctedSentence}
            </div>
            <div class="space-y-1 text-rose-900 pt-1">
              ${detectedErrors.map(e => `
                <div class="text-[11px] bg-white/80 p-2 rounded-lg border border-rose-100">
                  <span class="font-bold text-rose-700"><s>${e.original}</s> &rarr; <u class="text-emerald-700">${e.corrected}</u>:</span> ${e.reason}
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div class="flex items-center gap-1.5 font-bold text-emerald-900">
              <span>✅</span>
              <span>No grammatical errors found in this sentence!</span>
            </div>
            <p class="text-emerald-800 text-[11px]">Subject-verb agreement, case government (mit + Dativ), strong adjective declension (-em), and sentence bracket positioning are all flawlessly executed.</p>
          </div>
        `}
      </div>

      <!-- ================= 11. NATURALNESS CHECK (NO OVERALL SCORE / RATING!) ================= -->
      <div class="p-4 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 rounded-2xl border border-teal-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-teal-200">
          <span class="text-xs font-black uppercase text-teal-900 tracking-wider">11. Naturalness & Grammar Check</span>
          <span class="text-[10px] bg-white text-teal-900 font-bold px-2 py-0.5 rounded-md border border-teal-200">Factual Linguistic Evaluation</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <!-- Grammar Status -->
          <div class="p-3 bg-white/95 rounded-xl border border-teal-200 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-teal-800 tracking-wider">Grammar Status:</span>
              <span class="text-xs font-extrabold ${hasGrammarErrors ? 'text-rose-700' : 'text-emerald-700'}">
                ${hasGrammarErrors ? '❌ Contains Errors' : '✅ Grammatically Correct'}
              </span>
            </div>
            <ul class="text-[11px] text-teal-950 space-y-1 list-disc list-inside">
              <li><strong>Clause Architecture:</strong> Valid main clause word order with conjugated modal verb in Position 2.</li>
              <li><strong>Case Declension:</strong> Case government correctly satisfied for subject, object, and preposition.</li>
              <li><strong>Verb Agreement:</strong> Person and number agreement correctly aligned.</li>
            </ul>
          </div>

          <!-- Naturalness Status -->
          <div class="p-3 bg-white/95 rounded-xl border border-teal-200 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-teal-800 tracking-wider">Naturalness Status:</span>
              <span class="text-xs font-extrabold ${hasGrammarErrors ? 'text-rose-700' : 'text-emerald-700'}">
                ${hasGrammarErrors ? '🔴 Unnatural (Hindered by errors)' : '🟢 Natural (Native standard)'}
              </span>
            </div>
            <ul class="text-[11px] text-teal-950 space-y-1 list-disc list-inside">
              <li><strong>Idiomatic Phrasing:</strong> The combination <em>"Nudeln mit scharfem Hähnchen"</em> is completely natural in German restaurant and culinary contexts.</li>
              <li><strong>Register:</strong> The use of <em>"möchte"</em> (Konjunktiv II) provides a polite, natural everyday tone.</li>
              <li><strong>Constituent Flow:</strong> Placing the accusative object before the accompaniment prepositional phrase sounds natural and fluid to native speakers.</li>
            </ul>
          </div>
        </div>

        <div class="p-2.5 bg-white/80 rounded-xl border border-teal-100 text-[11px] text-teal-900">
          ℹ️ <strong>Linguistic Observation:</strong> This sentence reflects authentic, standard spoken and written German. No unusual syntactic inversions or stilted registers detected.
        </div>
      </div>
    `;
  }
  window.analyzeGermanGrammar = analyzeGermanGrammar;


  // ================= 22. THEME MODE SWITCHER (LIGHT, DARK, SEPIA) =================
  const THEME_STORAGE_KEY = 'netzwerk_theme_mode';
  let currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';

  function applyTheme(theme) {
    currentTheme = theme;
    const root = document.documentElement;
    const icon = document.getElementById('themeModeIcon');
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      if (icon) icon.textContent = '☀️';
    } else if (theme === 'sepia') {
      root.setAttribute('data-theme', 'sepia');
      if (icon) icon.textContent = '📜';
    } else {
      root.removeAttribute('data-theme');
      if (icon) icon.textContent = '🌙';
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  window.toggleThemeMode = function() {
    if (currentTheme === 'light') {
      applyTheme('dark');
      showFloatingToast('🌙 Dark Mode enabled! Perfect for night study.');
    } else if (currentTheme === 'dark') {
      applyTheme('sepia');
      showFloatingToast('📜 Warm Sepia Eye-Care Mode enabled!');
    } else {
      applyTheme('light');
      showFloatingToast('☀️ Soft Blue Pastel Mode enabled!');
    }
  };

  function initTheme() {
    applyTheme(currentTheme);
  }

  // ================= 23. GAMIFICATION: DAILY STREAK & ACHIEVEMENTS =================
  const STREAK_STORAGE_KEY = 'netzwerk_streak_gamification_v1';

  const BADGES_DEFINITIONS = [
    { id: 'first_step', title: 'First Step', emoji: '🎯', desc: 'Complete your first exercise', xp: 50 },
    { id: 'streak_3', title: 'Flame Keeper', emoji: '🔥', desc: 'Reach a 3-day study streak', xp: 100 },
    { id: 'streak_7', title: 'Consistency Master', emoji: '⚡', desc: 'Reach a 7-day study streak', xp: 200 },
    { id: 'grammar_detective', title: 'Grammar Detective', emoji: '🔍', desc: 'Analyze 5 sentences with AI Translator', xp: 75 },
    { id: 'voice_virtuoso', title: 'Voice Virtuoso', emoji: '🎙️', desc: 'Score 80%+ on German pronunciation practice', xp: 100 },
    { id: 'quiz_whiz', title: 'Mixed Quiz Whiz', emoji: '🧠', desc: 'Score 100% on the 5-Minute Mixed Review Quiz', xp: 100 },
    { id: 'vocab_collector', title: 'Star Collector', emoji: '⭐', desc: 'Save 3 sentences in My Notebook', xp: 75 },
    { id: 'a1_explorer', title: 'A1 Explorer', emoji: '🗺️', desc: 'Complete 6 chapters in Netzwerk A1', xp: 250 }
  ];

  let streakData = {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: '',
    xp: 0,
    unlockedBadges: [],
    activityDates: []
  };

  function loadStreakData() {
    try {
      const saved = localStorage.getItem(STREAK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        streakData = Object.assign(streakData, parsed);
      }
    } catch(e) {}
  }

  function saveStreakData() {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streakData));
    updateStreakUI();
  }

  function getTodayDateStr() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function initStreakAndGamification() {
    loadStreakData();
    const today = getTodayDateStr();
    
    if (!streakData.lastActiveDate) {
      streakData.currentStreak = 1;
      streakData.longestStreak = 1;
      streakData.lastActiveDate = today;
      streakData.activityDates = [today];
      awardXP(50, 'Welcome to Cheeya Studio!');
    } else if (streakData.lastActiveDate !== today) {
      const last = new Date(streakData.lastActiveDate);
      const now = new Date(today);
      const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streakData.currentStreak += 1;
        if (streakData.currentStreak > streakData.longestStreak) {
          streakData.longestStreak = streakData.currentStreak;
        }
        awardXP(25, `${streakData.currentStreak} Day Streak Maintained! 🔥`);
        if (streakData.currentStreak >= 3) unlockBadge('streak_3');
        if (streakData.currentStreak >= 7) unlockBadge('streak_7');
      } else if (diffDays > 1) {
        streakData.currentStreak = 1;
      }
      streakData.lastActiveDate = today;
      if (!streakData.activityDates.includes(today)) {
        streakData.activityDates.push(today);
      }
    }
    saveStreakData();
  }

  function awardXP(amount, reason) {
    streakData.xp = (streakData.xp || 0) + amount;
    saveStreakData();
    showFloatingXP(amount, reason);
  }

  function showFloatingXP(amount, reason) {
    const container = document.getElementById('floatingXPContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'xp-toast-anim px-3 py-1.5 rounded-xl bg-purple-600 text-white font-black text-xs shadow-lg border border-purple-300 flex items-center gap-1.5 backdrop-blur-md';
    toast.innerHTML = `<span>⚡ +${amount} XP</span> <span class="text-[10px] font-semibold opacity-90">${reason || ''}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2000);
  }

  function unlockBadge(badgeId) {
    if (!streakData.unlockedBadges) streakData.unlockedBadges = [];
    if (streakData.unlockedBadges.includes(badgeId)) return;
    streakData.unlockedBadges.push(badgeId);
    const badge = BADGES_DEFINITIONS.find(b => b.id === badgeId);
    if (badge) {
      awardXP(badge.xp, `Badge Unlocked: ${badge.title}`);
      showFloatingToast(`🏆 Achievement Unlocked: ${badge.title} (+${badge.xp} XP)!`);
      if (typeof playConfettiEffect === 'function') playConfettiEffect();
    }
    saveStreakData();
  }

  function updateStreakUI() {
    const countEl = document.getElementById('streakBadgeCount');
    if (countEl) countEl.textContent = `${streakData.currentStreak} ${streakData.currentStreak === 1 ? 'Day' : 'Days'}`;
    const modalCurr = document.getElementById('streakModalCurrent');
    if (modalCurr) modalCurr.textContent = streakData.currentStreak;
    const modalXp = document.getElementById('streakModalXP');
    if (modalXp) modalXp.textContent = streakData.xp;
    const modalLong = document.getElementById('streakModalLongest');
    if (modalLong) modalLong.textContent = streakData.longestStreak;
  }

  window.openStreakModal = function() {
    const modal = document.getElementById('streakAchievementsModal');
    if (!modal) return;
    renderStreakModalDetails();
    modal.classList.remove('hidden');
  };

  window.closeStreakModal = function() {
    const modal = document.getElementById('streakAchievementsModal');
    if (modal) modal.classList.add('hidden');
  };

  function renderStreakModalDetails() {
    updateStreakUI();
    const weekContainer = document.getElementById('streakWeekDaysContainer');
    if (weekContainer) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      let weekHtml = '';
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];
        const isActive = streakData.activityDates && streakData.activityDates.includes(dStr);
        weekHtml += `
          <div class="flex flex-col items-center p-2 rounded-xl border ${isActive ? 'bg-amber-100 border-amber-300 text-amber-950 font-black' : 'bg-slate-50 border-slate-200 text-slate-400 font-medium'}">
            <span class="text-[9px] uppercase tracking-wider">${dayName}</span>
            <span class="text-sm my-0.5">${isActive ? '🔥' : '⚪'}</span>
            <span class="text-[10px]">${d.getDate()}</span>
          </div>
        `;
      }
      weekContainer.innerHTML = weekHtml;
    }

    const badgesList = document.getElementById('streakBadgesList');
    const badgeProgressText = document.getElementById('streakBadgeProgressText');
    if (badgesList) {
      const unlockedCount = (streakData.unlockedBadges || []).length;
      if (badgeProgressText) badgeProgressText.textContent = `${unlockedCount} of ${BADGES_DEFINITIONS.length} Unlocked`;
      
      let bHtml = '';
      BADGES_DEFINITIONS.forEach(b => {
        const isUnlocked = (streakData.unlockedBadges || []).includes(b.id);
        bHtml += `
          <div class="flex items-center gap-2.5 p-2.5 rounded-xl border ${isUnlocked ? 'bg-amber-50/70 border-amber-200 text-amber-950 shadow-2xs' : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'}">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xl ${isUnlocked ? 'bg-amber-100 border border-amber-300' : 'bg-slate-200 border border-slate-300 grayscale'}">
              ${b.emoji}
            </div>
            <div class="flex-1 truncate">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black truncate">${b.title}</span>
                <span class="text-[10px] font-bold ${isUnlocked ? 'text-amber-700' : 'text-slate-400'}">+${b.xp} XP</span>
              </div>
              <p class="text-[10px] truncate leading-tight">${b.desc}</p>
            </div>
            <span>${isUnlocked ? '✅' : '🔒'}</span>
          </div>
        `;
      });
      badgesList.innerHTML = bHtml;
    }
  }

  function renderProgressBadgesHtml() {
    let bHtml = '';
    BADGES_DEFINITIONS.forEach(b => {
      const isUnlocked = (streakData.unlockedBadges || []).includes(b.id);
      bHtml += `
        <div class="flex items-center gap-2 p-2 rounded-xl border ${isUnlocked ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'} text-xs">
          <span class="text-xl ${isUnlocked ? '' : 'grayscale'}">${b.emoji}</span>
          <div class="truncate flex-1">
            <p class="text-[11px] font-black truncate">${b.title}</p>
            <p class="text-[9px] truncate opacity-80">+${b.xp} XP</p>
          </div>
          <span>${isUnlocked ? '✅' : '🔒'}</span>
        </div>
      `;
    });
    return bHtml;
  }

  // ================= 24. STUDY DATA BACKUP & RESTORE =================
  window.exportStudyProgress = function() {
    try {
      const backupData = {
        app: 'CheeyaStudio_NetzwerkA1',
        version: '20260913_all_6_features',
        exportDate: new Date().toISOString(),
        studyData: studyData,
        streakData: streakData,
        savedSentences: loadSavedSentences(),
        theme: currentTheme,
        musicVolume: localStorage.getItem('netzwerk_music_vol') || '0.35'
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = getTodayDateStr();
      a.href = url;
      a.download = `cheeya_deutsch_progress_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFloatingToast('💾 Study progress backup downloaded successfully!');
      awardXP(20, 'Progress Backup Saved');
    } catch(e) {
      console.error('Export error:', e);
      alert('Failed to export study progress: ' + e.message);
    }
  };

  window.importStudyProgress = function(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid backup file format');
        }

        if (data.studyData) {
          studyData = Object.assign(studyData, data.studyData);
          saveStudyData();
        }
        if (data.streakData) {
          streakData = Object.assign(streakData, data.streakData);
          saveStreakData();
        }
        if (Array.isArray(data.savedSentences)) {
          localStorage.setItem('netzwerk_saved_notebook', JSON.stringify(data.savedSentences));
        }
        if (data.theme) {
          applyTheme(data.theme);
        }

        renderDashboardChapters();
        renderHistoryTab();
        updateStreakUI();
        input.value = '';
        showFloatingToast('📥 Study progress successfully restored from JSON!');
        if (typeof playConfettiEffect === 'function') playConfettiEffect();
      } catch(err) {
        console.error('Import error:', err);
        alert('Could not restore study progress: Please make sure this is a valid Cheeya Studio JSON backup file.');
        input.value = '';
      }
    };

    reader.readAsText(file);
  };

  // ================= 25. DAILY 5-MINUTE MIXED REVIEW QUIZ ENGINE =================
  const MIXED_QUIZ_POOL = [
    {
      q: "Welcher Artikel passt? '_____ Hund bellt im Garten.'",
      options: ["Der", "Die", "Das"],
      answer: 0,
      rule: "Hund is masculine in Nominativ: 'Der Hund'."
    },
    {
      q: "Ergänze den Akkusativ: 'Ich trinke jeden Morgen _____ Kaffee.'",
      options: ["einen", "ein", "eine"],
      answer: 0,
      rule: "Kaffee is masculine (der Kaffee). In Akkusativ, ein becomes einen."
    },
    {
      q: "Konjugiere das Verb: 'Wir _____ heute Deutsch.' (lernen)",
      options: ["lernt", "lernen", "lerne"],
      answer: 1,
      rule: "For 'wir', standard regular verbs take the -en ending: lernen."
    },
    {
      q: "Welcher Fall wird nach 'mit' verlangt? 'Ich fahre mit _____ Bus.'",
      options: ["dem", "den", "der"],
      answer: 0,
      rule: "'Mit' is a dative preposition. Masculine der Bus becomes dem Bus."
    },
    {
      q: "Was ist das Gegenteil von 'groß'?",
      options: ["klein", "schnell", "alt"],
      answer: 0,
      rule: "'Groß' means big, 'klein' means small."
    },
    {
      q: "Wo steht das Verb im Hauptsatz? 'Heute _____ wir ins Kino.'",
      options: ["gehen", "gehe", "geht"],
      answer: 0,
      rule: "Golden Rule: Verb occupies Position 2. Subject 'wir' matches 'gehen'."
    },
    {
      q: "Welcher Artikel passt? '_____ Buch liegt auf dem Tisch.'",
      options: ["Das", "Der", "Die"],
      answer: 0,
      rule: "Buch is neuter: 'Das Buch'."
    },
    {
      q: "Welches Pronomen ist Akkusativ von 'du'?",
      options: ["dich", "dir", "dein"],
      answer: 0,
      rule: "'Dich' is the accusative direct object pronoun (e.g. Ich liebe dich)."
    },
    {
      q: "Welche Zahl ist 'siebzehn'?",
      options: ["17", "70", "7"],
      answer: 0,
      rule: "Siebzehn is 17. Note the dropped '-en' from sieben."
    },
    {
      q: "Ergänze den Dativ: 'Ich helfe _____ Frau.'",
      options: ["der", "die", "den"],
      answer: 0,
      rule: "Helfen triggers Dative. Feminine die shifts to der in Dativ: 'der Frau'."
    }
  ];

  let currentMixedQuiz = {
    questions: [],
    currentIndex: 0,
    score: 0,
    userAnswers: []
  };

  window.startDailyMixedQuiz = function() {
    const shuffled = [...MIXED_QUIZ_POOL].sort(() => 0.5 - Math.random());
    currentMixedQuiz = {
      questions: shuffled.slice(0, 5),
      currentIndex: 0,
      score: 0,
      userAnswers: []
    };
    const modal = document.getElementById('mixedQuizModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderMixedQuizQuestion();
  };

  window.closeMixedQuizModal = function() {
    const modal = document.getElementById('mixedQuizModal');
    if (modal) modal.classList.add('hidden');
  };

  function renderMixedQuizQuestion() {
    const q = currentMixedQuiz.questions[currentMixedQuiz.currentIndex];
    const total = currentMixedQuiz.questions.length;
    const countEl = document.getElementById('quizQuestionCount');
    const barEl = document.getElementById('quizProgressBar');
    const content = document.getElementById('quizContentArea');
    if (!q || !content) return;

    if (countEl) countEl.textContent = `Question ${currentMixedQuiz.currentIndex + 1} of ${total}`;
    if (barEl) barEl.style.width = `${((currentMixedQuiz.currentIndex + 1) / total) * 100}%`;

    let optionsHtml = '';
    q.options.forEach((opt, idx) => {
      optionsHtml += `
        <button onclick="handleMixedQuizAnswer(${idx})" class="w-full p-3.5 rounded-2xl bg-white/95 hover:bg-sky-50 border-2 border-sky-200 text-sky-950 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-xs hover:border-sky-400">
          <span>${escapeHtml(opt)}</span>
          <span class="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-black">${String.fromCharCode(65 + idx)}</span>
        </button>
      `;
    });

    content.innerHTML = `
      <div class="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-1">
        <span class="text-[10px] font-black uppercase text-sky-600 tracking-wider">A1 German Practice:</span>
        <p class="text-sm font-black text-sky-950">${escapeHtml(q.q)}</p>
      </div>
      <div class="space-y-2">
        ${optionsHtml}
      </div>
      <div id="quizFeedbackBox" class="hidden p-3 rounded-xl border text-xs"></div>
    `;
  }

  window.handleMixedQuizAnswer = function(chosenIdx) {
    const q = currentMixedQuiz.questions[currentMixedQuiz.currentIndex];
    const fb = document.getElementById('quizFeedbackBox');
    if (!q || !fb) return;

    const isCorrect = (chosenIdx === q.answer);
    if (isCorrect) currentMixedQuiz.score++;
    currentMixedQuiz.userAnswers.push({ question: q.q, isCorrect, chosen: q.options[chosenIdx], rule: q.rule });

    fb.className = `p-3 rounded-xl border text-xs font-bold ${isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}`;
    fb.innerHTML = `
      <div class="flex items-center gap-1.5 mb-1 font-black text-sm">
        <span>${isCorrect ? '✅ Richtig! (Correct!)' : '❌ Nicht ganz! (Not quite)'}</span>
      </div>
      <p class="font-medium text-[11px]">${q.rule}</p>
    `;
    fb.classList.remove('hidden');

    setTimeout(() => {
      currentMixedQuiz.currentIndex++;
      if (currentMixedQuiz.currentIndex < currentMixedQuiz.questions.length) {
        renderMixedQuizQuestion();
      } else {
        renderMixedQuizFinalResult();
      }
    }, 1400);
  };

  function renderMixedQuizFinalResult() {
    const content = document.getElementById('quizContentArea');
    const total = currentMixedQuiz.questions.length;
    const score = currentMixedQuiz.score;
    const isPerfect = (score === total);
    
    awardXP(score * 10, 'Mixed Quiz Solved');
    if (isPerfect) unlockBadge('quiz_whiz');

    if (isPerfect && typeof playConfettiEffect === 'function') {
      playConfettiEffect();
    }

    content.innerHTML = `
      <div class="text-center py-4 space-y-3">
        <div class="text-5xl">${isPerfect ? '🎉' : score >= 3 ? '👏' : '💪'}</div>
        <h4 class="text-lg font-black text-sky-950">${isPerfect ? 'Flawless Mastery!' : 'Well Done! Keep Practicing!'}</h4>
        <p class="text-xs text-sky-700">You scored <strong>${score} out of ${total}</strong> on today's mixed review!</p>
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-black border border-purple-300">
          <span>⚡ +${score * 10} XP Earned</span>
        </div>
        <div class="pt-3 flex items-center justify-center gap-2">
          <button onclick="startDailyMixedQuiz()" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-md">
            🔄 Try Another Quiz
          </button>
          <button onclick="closeMixedQuizModal()" class="px-4 py-2 rounded-xl bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 font-bold text-xs transition cursor-pointer">
            Close
          </button>
        </div>
      </div>
    `;
  }

  // ================= 26. SPEECH RECOGNITION, PHONETICS & SPEAKING PRACTICE =================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let activeSpeechRecognition = null;
  let currentSpeakingTargetText = '';

  // User Voice Recording State (MediaRecorder)
  let userMediaStream = null;
  let userMediaRecorder = null;
  let userRecordedChunks = [];
  let userRecordedAudioBlob = null;
  let userRecordedAudioUrl = null;
  let userAudioPlayerInstance = null;

  // German Phonetic Dictionary & Transliteration Engine
  const GERMAN_PHONETIC_DICT = {
    'ich': 'IKH',
    'habe': 'HAH-buh',
    'haben': 'HAH-bən',
    'hast': 'HAHST',
    'hat': 'HAHT',
    'hatte': 'HAHT-tuh',
    'ein': 'EYE-n',
    'eine': 'EYE-nuh',
    'einen': 'EYE-nən',
    'einem': 'EYE-nəm',
    'einer': 'EYE-nər',
    'eines': 'EYE-nəs',
    'der': 'DAIR',
    'die': 'DEE',
    'das': 'DAHS',
    'den': 'DAYN',
    'dem': 'DAYM',
    'des': 'DEHS',
    'hund': 'HOONT',
    'hunde': 'HOON-duh',
    'katze': 'KAHT-tsuh',
    'buch': 'BOOKH',
    'bücher': 'BEW-khər',
    'frau': 'FROW',
    'frauen': 'FROW-ən',
    'mann': 'MAHN',
    'männer': 'MEHN-nər',
    'kind': 'KEENT',
    'kinder': 'KEEN-dər',
    'liebe': 'LEE-buh',
    'lieben': 'LEE-bən',
    'liebst': 'LEEPST',
    'liebt': 'LEEPT',
    'dich': 'DEEKH',
    'dir': 'DEER',
    'du': 'DOO',
    'wir': 'VEER',
    'sie': 'ZEE',
    'er': 'AIR',
    'es': 'EHS',
    'ihr': 'EER',
    'ihm': 'EEM',
    'ihn': 'EEN',
    'ihnen': 'EE-nən',
    'deutsch': 'DOYTCH',
    'deutschland': 'DOYTCH-lahnt',
    'lerne': 'LAIR-nuh',
    'lernen': 'LAIR-nən',
    'lernt': 'LAIRNT',
    'geht': 'GAYT',
    'gehen': 'GAY-ən',
    'gehe': 'GAY-uh',
    'gehst': 'GAYST',
    'ging': 'GEENG',
    'komme': 'KOM-muh',
    'kommen': 'KOM-mən',
    'kommst': 'KOMST',
    'kommt': 'KOMT',
    'aus': 'OWS',
    'mit': 'MIT',
    'nach': 'NAHKH',
    'zu': 'TSOO',
    'zum': 'TSOOM',
    'zur': 'TSOOR',
    'bei': 'BYE',
    'beim': 'BYEM',
    'von': 'FON',
    'vom': 'FOM',
    'für': 'FEWR',
    'ohne': 'OH-nuh',
    'durch': 'DOORKH',
    'zug': 'TSOOK',
    'bus': 'BOOS',
    'bahn': 'BAHN',
    'u-bahn': 'OO-bahn',
    's-bahn': 'EHS-bahn',
    'auto': 'OW-toh',
    'guten': 'GOO-tən',
    'tag': 'TAHK',
    'tage': 'TAH-guh',
    'morgen': 'MOR-gən',
    'abend': 'AH-bənt',
    'abende': 'AH-bən-duh',
    'nacht': 'NAHKHT',
    'nächte': 'NEHKH-tuh',
    'hallo': 'HAH-loh',
    'tschüss': 'TCHEWSS',
    'bitte': 'BIT-tuh',
    'danke': 'DAHNG-kuh',
    'schön': 'SHERN',
    'sehr': 'ZAIR',
    'schlafen': 'SHLAH-fən',
    'schläft': 'SHLEHFT',
    'trinken': 'TRING-kən',
    'trinke': 'TRING-kuh',
    'trinkt': 'TRINGKT',
    'essen': 'EHS-sən',
    'esse': 'EHS-suh',
    'isst': 'EEST',
    'kaffee': 'KAHF-fay',
    'tee': 'TAY',
    'wasser': 'VAHS-sər',
    'brot': 'BROHT',
    'apfel': 'AHP-fəl',
    'äpfel': 'EHP-fəl',
    'heute': 'HOY-tuh',
    'jetzt': 'YETST',
    'hier': 'HEER',
    'dort': 'DORT',
    'wo': 'VOH',
    'wie': 'VEE',
    'was': 'VAHS',
    'wer': 'VAIR',
    'warum': 'VAH-room',
    'woher': 'voh-HAIR',
    'wohin': 'voh-HEEN',
    'ja': 'YAH',
    'nein': 'NYNE',
    'nicht': 'NEEKHT',
    'nichts': 'NEEKHTS',
    'kein': 'KYNE',
    'keine': 'KY-nuh',
    'keinen': 'KY-nən',
    'keinem': 'KY-nəm',
    'keiner': 'KY-nər',
    'helfe': 'HEHL-fuh',
    'helfen': 'HEHL-fən',
    'hilfst': 'HEELFST',
    'hilft': 'HEELFT',
    'brauche': 'BROW-khuh',
    'brauchen': 'BROW-khən',
    'braucht': 'BROWKHT',
    'kaufe': 'KOW-fuh',
    'kaufen': 'KOW-fən',
    'kauft': 'KOWFT',
    'sehe': 'ZAY-uh',
    'sehen': 'ZAY-ən',
    'siehst': 'ZEEST',
    'sieht': 'ZEET',
    'lese': 'LAY-zuh',
    'lesen': 'LAY-zən',
    'liest': 'LEEST',
    'verstehe': 'fair-SHTAY-uh',
    'verstehen': 'fair-SHTAY-ən',
    'entschuldigung': 'ent-SHOOL-dee-goong',
    'auf': 'OWF',
    'wiedersehen': 'VEE-dər-zay-ən',
    'name': 'NAH-muh',
    'heiße': 'HY-ssuh',
    'heißen': 'HY-ssən',
    'heißt': 'HYST',
    'freund': 'FROYNT',
    'freundin': 'FROYN-din',
    'haus': 'HOWS',
    'hause': 'HOW-zuh',
    'schule': 'SHOO-luh',
    'lehrer': 'LAY-rər',
    'lehrerin': 'LAY-rə-rin',
    'student': 'shtoo-DENT',
    'zeit': 'TSYTE',
    'geld': 'GEHLT',
    'arbeit': 'AHR-byte',
    'arbeiten': 'AHR-bye-tən',
    'wohne': 'VOH-nuh',
    'wohnen': 'VOH-nən',
    'wohnt': 'VOHNT',
    'stadt': 'SHTAHT',
    'land': 'LAHNT',
    'zwei': 'TSVYE',
    'drei': 'DRYE',
    'vier': 'FEER',
    'fünf': 'FEWNF',
    'sechs': 'ZEKHS',
    'sieben': 'ZEE-bən',
    'acht': 'AHKHT',
    'neun': 'NOYN',
    'zehn': 'TSAYN'
  };

  function transliterateGermanWord(word) {
    const clean = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
    if (!clean) return word;
    if (GERMAN_PHONETIC_DICT[clean]) {
      return GERMAN_PHONETIC_DICT[clean];
    }
    
    // Algorithmic German phonetic conversion
    let res = clean;
    res = res.replace(/tsch/g, 'tch')
             .replace(/sch/g, 'sh')
             .replace(/^sp/g, 'shp')
             .replace(/^st/g, 'sht')
             .replace(/([aou])ch/g, '$1kh')
             .replace(/ch/g, 'kh')
             .replace(/ei|ai|ey/g, 'eye')
             .replace(/ie/g, 'ee')
             .replace(/eu|äu/g, 'oy')
             .replace(/au/g, 'ow')
             .replace(/ä/g, 'eh')
             .replace(/ö/g, 'er')
             .replace(/ü/g, 'ew')
             .replace(/ß/g, 'ss')
             .replace(/w/g, 'v')
             .replace(/^v/g, 'f')
             .replace(/z/g, 'ts')
             .replace(/^j/g, 'y')
             .replace(/er$/g, '-er')
             .replace(/en$/g, '-ən')
             .replace(/e$/g, '-uh');
             
    return res.toUpperCase();
  }

  function generateGermanPhonetics(sentence) {
    if (!sentence) return { phoneticText: '', tips: '' };
    const words = sentence.trim().split(/\s+/);
    const phoneticWords = words.map(w => {
      const punctMatch = w.match(/^([^a-zA-ZäöüÄÖÜß]*)([a-zA-ZäöüÄÖÜß\-]+)([^a-zA-ZäöüÄÖÜß]*)$/);
      if (punctMatch) {
        const lead = punctMatch[1] || '';
        const core = punctMatch[2];
        const trail = punctMatch[3] || '';
        return lead + transliterateGermanWord(core) + trail;
      }
      return transliterateGermanWord(w);
    });

    const phoneticText = `[ ${phoneticWords.join(' • ')} ]`;

    // Contextual Pronunciation Tips
    const lower = sentence.toLowerCase();
    const tipsList = [];
    if (lower.includes('ch')) {
      tipsList.push("🗣️ <strong>'ch'</strong>: Soft hissing sound after e/i (<em>ich</em>), or guttural after a/o/u (<em>Buch</em>).");
    }
    if (lower.includes('w')) {
      tipsList.push("🗣️ <strong>'w'</strong>: Always sounds like English <strong>'v'</strong> (e.g. <em>wir</em> = 'veer').");
    }
    if (lower.includes('z')) {
      tipsList.push("🗣️ <strong>'z'</strong>: Always pronounced like <strong>'ts'</strong> as in 'cats' (e.g. <em>Zug</em> = 'tsook').");
    }
    if (lower.includes('v')) {
      tipsList.push("🗣️ <strong>'v'</strong>: Almost always sounds like English <strong>'f'</strong> (e.g. <em>von</em> = 'fon').");
    }
    if (lower.includes('ä') || lower.includes('ö') || lower.includes('ü')) {
      tipsList.push("🗣️ <strong>Umlauts</strong>: <strong>ä</strong> = 'eh', <strong>ö</strong> = rounded 'er', <strong>ü</strong> = whistle lips saying 'ee'.");
    }
    if (lower.includes('ie') || lower.includes('ei')) {
      tipsList.push("🗣️ <strong>Vowel pairs</strong>: <strong>ie</strong> = long 'ee' (<em>sie</em>), while <strong>ei</strong> = 'eye' (<em>mein</em>)!");
    }
    if (lower.includes('ß') || lower.includes('ss')) {
      tipsList.push("🗣️ <strong>'ß' / 'ss'</strong>: Sharp unvoiced <strong>'s'</strong> sound (like 'sun', never buzzing 'z').");
    }
    if (/\b(st|sp)/.test(lower)) {
      tipsList.push("🗣️ <strong>'st' / 'sp'</strong> at start of words: Pronounced like <strong>'sht'</strong> / <strong>'shp'</strong> (e.g. <em>Stadt</em> = 'shtaht').");
    }

    const tips = tipsList.length > 0 ? tipsList.slice(0, 3).join('<br/>') : "💡 <em>Tip: Speak naturally with clear vowel sounds and syllable stress!</em>";

    return { phoneticText, tips };
  }
  window.generateGermanPhonetics = generateGermanPhonetics;

  window.startTranslatorVoiceInput = function() {
    if (!SpeechRecognition) {
      showFloatingToast("⚠️ Speech recognition requires Chrome or Edge.");
      return;
    }

    const srcLangSel = document.getElementById('transSourceLang');
    const lang = (srcLangSel && srcLangSel.value === 'de') ? 'de-DE' : (srcLangSel && srcLangSel.value === 'id') ? 'id-ID' : 'en-US';
    const btn = document.getElementById('transVoiceInputBtn');
    const micIcon = document.getElementById('transVoiceMicIcon');

    if (activeSpeechRecognition) {
      try { activeSpeechRecognition.stop(); } catch(e) {}
      activeSpeechRecognition = null;
      if (btn) btn.classList.remove('mic-recording-active');
      if (micIcon) micIcon.textContent = '🎙️';
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
      activeSpeechRecognition = recognition;
      if (btn) btn.classList.add('mic-recording-active');
      if (micIcon) micIcon.textContent = '🔴';
      showFloatingToast(`🎙️ Listening in ${lang}... Speak now!`);
    };

    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('transInputText');
      if (input) {
        input.value = transcript;
        const charCount = document.getElementById('transCharCount');
        if (charCount) charCount.textContent = `${transcript.length} / 500`;
        translateAndAnalyze();
      }
      awardXP(10, 'Voice Input Used');
    };

    recognition.onerror = function(err) {
      console.warn('Speech error:', err);
      showFloatingToast("⚠️ Microphone error or permission denied.");
    };

    recognition.onend = function() {
      activeSpeechRecognition = null;
      if (btn) btn.classList.remove('mic-recording-active');
      if (micIcon) micIcon.textContent = '🎙️';
    };

    try {
      recognition.start();
    } catch(e) {
      console.error(e);
    }
  };

  async function startRecordingUserVoice() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        userRecordedChunks = [];
        userMediaRecorder = new MediaRecorder(userMediaStream);
        userMediaRecorder.ondataavailable = function(e) {
          if (e.data && e.data.size > 0) userRecordedChunks.push(e.data);
        };
        userMediaRecorder.onstop = function() {
          if (userMediaStream) {
            userMediaStream.getTracks().forEach(t => t.stop());
            userMediaStream = null;
          }
          if (userRecordedChunks.length > 0) {
            userRecordedAudioBlob = new Blob(userRecordedChunks, { type: 'audio/webm' });
            if (userRecordedAudioUrl) URL.revokeObjectURL(userRecordedAudioUrl);
            userRecordedAudioUrl = URL.createObjectURL(userRecordedAudioBlob);
            
            // Reveal "Play My Voice" button in the modal!
            const playMyVoiceBtn = document.getElementById('speakingPlayUserVoiceBtn');
            if (playMyVoiceBtn) {
              playMyVoiceBtn.classList.remove('hidden');
              playMyVoiceBtn.classList.add('inline-flex');
            }
          }
        };
        userMediaRecorder.start();
      }
    } catch(err) {
      console.warn("Could not start MediaRecorder (microphone capture):", err);
    }
  }

  function stopRecordingUserVoice() {
    if (userMediaRecorder && userMediaRecorder.state !== 'inactive') {
      try { userMediaRecorder.stop(); } catch(e) {}
    }
  }

  window.playUserRecordedVoice = function() {
    if (!userRecordedAudioUrl) {
      showFloatingToast("⚠️ Record your voice first by clicking the microphone button!");
      return;
    }
    if (userAudioPlayerInstance) {
      userAudioPlayerInstance.pause();
      userAudioPlayerInstance.currentTime = 0;
    }
    const icon = document.getElementById('userVoicePlayIcon');
    if (icon) icon.textContent = '🔊';
    userAudioPlayerInstance = new Audio(userRecordedAudioUrl);
    userAudioPlayerInstance.play();
    userAudioPlayerInstance.onended = function() {
      if (icon) icon.textContent = '▶️';
    };
  };

  window.startSpeakingPractice = function(customTarget) {
    let target = customTarget;
    if (!target) {
      const outText = document.getElementById('transOutputText');
      if (outText && outText.textContent && !outText.textContent.includes('appear here')) {
        target = outText.textContent.trim();
      }
    }
    if (!target) {
      target = "Ich lerne Deutsch";
    }

    currentSpeakingTargetText = target;
    const modal = document.getElementById('speakingPracticeModal');
    const targetEl = document.getElementById('speakingModalTarget');
    const phoneticTextEl = document.getElementById('speakingPhoneticText');
    const phoneticTipsEl = document.getElementById('speakingPronunciationTips');
    const playMyVoiceBtn = document.getElementById('speakingPlayUserVoiceBtn');
    const resBox = document.getElementById('speakingResultBox');

    if (targetEl) targetEl.textContent = target;

    // Generate & Display Phonetic Guide
    const phonetics = generateGermanPhonetics(target);
    if (phoneticTextEl) phoneticTextEl.textContent = phonetics.phoneticText;
    if (phoneticTipsEl) phoneticTipsEl.innerHTML = phonetics.tips;

    // Reset user recording button & feedback box
    if (playMyVoiceBtn) {
      playMyVoiceBtn.classList.remove('inline-flex');
      playMyVoiceBtn.classList.add('hidden');
    }
    if (resBox) {
      resBox.className = 'hidden';
      resBox.innerHTML = '';
    }

    if (modal) modal.classList.remove('hidden');
  };

  window.closeSpeakingPracticeModal = function() {
    if (activeSpeechRecognition) {
      try { activeSpeechRecognition.stop(); } catch(e) {}
      activeSpeechRecognition = null;
    }
    stopRecordingUserVoice();
    if (userAudioPlayerInstance) {
      userAudioPlayerInstance.pause();
      userAudioPlayerInstance = null;
    }
    const modal = document.getElementById('speakingPracticeModal');
    if (modal) modal.classList.add('hidden');
  };

  window.playSpeakingReferenceAudio = function() {
    if (currentSpeakingTargetText && typeof playGermanSpeech === 'function') {
      playGermanSpeech(currentSpeakingTargetText);
    }
  };

  window.toggleSpeechRecording = function() {
    if (!SpeechRecognition) {
      showFloatingToast("⚠️ Speech recognition requires Chrome or Edge.");
      return;
    }

    const micBtn = document.getElementById('speakingMicBtn');
    const statusLabel = document.getElementById('speakingStatusLabel');

    if (activeSpeechRecognition) {
      try { activeSpeechRecognition.stop(); } catch(e) {}
      activeSpeechRecognition = null;
      stopRecordingUserVoice();
      if (micBtn) micBtn.classList.remove('mic-recording-active');
      if (statusLabel) {
        statusLabel.textContent = "Click to Speak";
        statusLabel.className = "text-xs font-extrabold text-emerald-700";
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
      activeSpeechRecognition = recognition;
      startRecordingUserVoice();
      if (micBtn) micBtn.classList.add('mic-recording-active');
      if (statusLabel) {
        statusLabel.textContent = "🔴 Recording your voice... Speak now in German!";
        statusLabel.className = "text-xs font-extrabold text-rose-600 animate-pulse";
      }
    };

    recognition.onresult = function(event) {
      const spokenText = event.results[0][0].transcript;
      stopRecordingUserVoice();
      evaluatePronunciation(spokenText, currentSpeakingTargetText);
    };

    recognition.onerror = function(err) {
      console.warn('Speech recognition error:', err);
      stopRecordingUserVoice();
      if (statusLabel) {
        statusLabel.textContent = "Microphone error or permission denied.";
        statusLabel.className = "text-xs font-extrabold text-rose-600";
      }
    };

    recognition.onend = function() {
      activeSpeechRecognition = null;
      stopRecordingUserVoice();
      if (micBtn) micBtn.classList.remove('mic-recording-active');
      if (statusLabel) {
        statusLabel.textContent = "Click to Speak Again";
        statusLabel.className = "text-xs font-extrabold text-emerald-700";
      }
    };

    try {
      recognition.start();
    } catch(e) {
      console.error(e);
    }
  };

  function evaluatePronunciation(spoken, target) {
    const cleanSpoken = (spoken || '').toLowerCase().replace(/[^a-zäöüß0-9 ]/gi, '').trim();
    const cleanTarget = (target || '').toLowerCase().replace(/[^a-zäöüß0-9 ]/gi, '').trim();

    const spokenTokens = cleanSpoken.split(/\s+/).filter(Boolean);
    const targetTokens = cleanTarget.split(/\s+/).filter(Boolean);

    let matchCount = 0;
    targetTokens.forEach(token => {
      if (spokenTokens.includes(token)) matchCount++;
    });

    const tokenAccuracy = targetTokens.length > 0 ? Math.round((matchCount / targetTokens.length) * 100) : 0;
    const resBox = document.getElementById('speakingResultBox');
    if (!resBox) return;

    resBox.classList.remove('hidden');

    let badgeClass = '';
    let verdict = '';
    let tip = '';

    if (tokenAccuracy >= 80) {
      badgeClass = 'bg-emerald-50 border-emerald-300 text-emerald-900';
      verdict = '🌟 Ausgezeichnet! (Excellent Pronunciation!)';
      tip = 'Your German accent and pronunciation matched clearly!';
      awardXP(30, 'Pronunciation 80%+');
      unlockBadge('voice_virtuoso');
    } else if (tokenAccuracy >= 50) {
      badgeClass = 'bg-amber-50 border-amber-300 text-amber-900';
      verdict = '👍 Gut gemacht! (Good attempt!)';
      tip = 'Try pronouncing the vowels more cleanly and distinctly.';
      awardXP(15, 'Speaking Practice');
    } else {
      badgeClass = 'bg-rose-50 border-rose-300 text-rose-900';
      verdict = '🔁 Noch einmal! (Try once more!)';
      tip = 'Listen to the native audio reference above, then repeat.';
      awardXP(5, 'Speaking Attempt');
    }

    const phonetics = generateGermanPhonetics(target);

    resBox.className = `p-3.5 rounded-2xl border text-xs space-y-2 ${badgeClass}`;
    resBox.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-black text-sm">${verdict}</span>
        <span class="px-2 py-0.5 rounded-full bg-white/90 font-black text-xs border border-current/20">${tokenAccuracy}% Match</span>
      </div>
      <div class="p-2 bg-white/90 rounded-xl border border-current/20 space-y-1">
        <p><strong>You said:</strong> <em class="italic text-sky-900">"${escapeHtml(spoken)}"</em></p>
        <p><strong>Target:</strong> <strong class="text-sky-950 font-bold">"${escapeHtml(target)}"</strong></p>
        <p class="text-[11px] font-mono text-purple-900 font-bold">Phonetics: ${phonetics.phoneticText}</p>
      </div>
      <div class="flex items-center justify-between gap-2 pt-1">
        <p class="text-[11px] opacity-90">${tip}</p>
        <button onclick="playUserRecordedVoice()" class="px-2.5 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer flex-shrink-0" title="Listen to your recording">
          <span>▶️</span>
          <span>My Recording</span>
        </button>
      </div>
    `;
  }

  // ================= 27. SAVED SENTENCES NOTEBOOK =================
  const NOTEBOOK_STORAGE_KEY = 'netzwerk_saved_notebook';

  function loadSavedSentences() {
    try {
      const saved = localStorage.getItem(NOTEBOOK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  }
  window.loadSavedSentences = loadSavedSentences;

  function saveSavedSentences(list) {
    localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(list));
    updateNotebookCountBadge();
  }
  window.saveSavedSentences = saveSavedSentences;

  function updateNotebookCountBadge() {
    const list = loadSavedSentences();
    const badge = document.getElementById('notebookCountBadge');
    if (badge) badge.textContent = `${list.length} ${list.length === 1 ? 'Sentence' : 'Sentences'} Saved`;
  }

  window.toggleSaveCurrentSentence = function() {
    const outText = document.getElementById('transOutputText');
    const inText = document.getElementById('transInputText');
    const starIcon = document.getElementById('transSaveStarIcon');
    if (!outText || !outText.textContent || outText.textContent.includes('appear here')) {
      showFloatingToast('Translate a sentence first before saving!');
      return;
    }

    const germanText = outText.textContent.trim();
    const sourceText = (inText && inText.value) ? inText.value.trim() : '';
    let list = loadSavedSentences();

    const existingIdx = list.findIndex(item => item.german === germanText);
    if (existingIdx >= 0) {
      list.splice(existingIdx, 1);
      saveSavedSentences(list);
      if (starIcon) starIcon.textContent = '⭐';
      showFloatingToast('Removed from My Notebook');
    } else {
      list.unshift({
        id: Date.now().toString(),
        german: germanText,
        source: sourceText,
        date: getTodayDateStr()
      });
      saveSavedSentences(list);
      if (starIcon) starIcon.textContent = '🌟';
      showFloatingToast('Saved to My Notebook ⭐!');
      awardXP(15, 'Sentence Saved');
      if (list.length >= 3) unlockBadge('vocab_collector');
    }
  };

  window.openNotebookModal = function() {
    const modal = document.getElementById('savedNotebookModal');
    if (!modal) return;
    renderSavedNotebook();
    modal.classList.remove('hidden');
  };

  window.closeNotebookModal = function() {
    const modal = document.getElementById('savedNotebookModal');
    if (modal) modal.classList.add('hidden');
  };

  window.renderSavedNotebook = function() {
    updateNotebookCountBadge();
    const container = document.getElementById('notebookItemsList');
    const searchInput = document.getElementById('notebookSearchInput');
    const query = (searchInput && searchInput.value) ? searchInput.value.toLowerCase().trim() : '';
    if (!container) return;

    let list = loadSavedSentences();
    if (query) {
      list = list.filter(item => (item.german && item.german.toLowerCase().includes(query)) || (item.source && item.source.toLowerCase().includes(query)));
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center bg-white/70 rounded-2xl border border-sky-100 text-sky-500 italic text-xs">
          ${query ? 'No matching sentences found.' : 'No sentences starred yet. Translate any sentence and click the ⭐ button to collect it here!'}
        </div>
      `;
      return;
    }

    let html = '';
    list.forEach(item => {
      html += `
        <div class="p-3.5 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-1.5 transition hover:border-purple-300">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-black text-sky-950">${escapeHtml(item.german)}</span>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button onclick="playGermanSpeech(decodeURIComponent('${encodeURIComponent(item.german)}'), this)" class="p-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs font-bold transition cursor-pointer" title="Listen to pronunciation">
                🔊
              </button>
              <button onclick="startSpeakingPractice('${escapeHtml(item.german)}')" class="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold transition cursor-pointer" title="Practice Speaking">
                🎙️ Speak
              </button>
              <button onclick="reAnalyzeFromNotebook('${escapeHtml(item.german)}')" class="px-2 py-0.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-bold transition cursor-pointer" title="Load into Grammar Analyzer">
                🔍 Analyze
              </button>
              <button onclick="deleteSavedSentence('${item.id}')" class="p-1 rounded-lg hover:bg-rose-100 text-rose-500 transition cursor-pointer" title="Delete from Notebook">
                🗑️
              </button>
            </div>
          </div>
          ${item.source ? `<p class="text-[11px] text-sky-700 font-medium">${escapeHtml(item.source)}</p>` : ''}
          <div class="text-[9px] text-sky-400 font-medium pt-0.5 flex items-center justify-between">
            <span>Saved on ${item.date}</span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  };

  window.deleteSavedSentence = function(id) {
    let list = loadSavedSentences();
    list = list.filter(item => item.id !== id);
    saveSavedSentences(list);
    renderSavedNotebook();
    showFloatingToast('Sentence removed from Notebook');
  };

  window.reAnalyzeFromNotebook = function(germanSentence) {
    closeNotebookModal();
    switchView('dashboard');
    const input = document.getElementById('transInputText');
    const srcSel = document.getElementById('transSourceLang');
    const tgtSel = document.getElementById('transTargetLang');
    if (srcSel) srcSel.value = 'de';
    if (tgtSel) tgtSel.value = 'en';
    handleTranslatorLangChange();
    if (input) {
      input.value = germanSentence;
      translateAndAnalyze();
    }
  };

  // ================= RUN INITIALIZATION =================
  initSpeech();
  initFontSize();
  initTheme();
  initStreakAndGamification();
  updateNotebookCountBadge();
  initChapters();
  initVocabLookupMap();
  initTranslatorListeners();
  initSparkleEffect();
  initCursorClickEffect();
  renderMusicTracksList();

  function handleRoute(hash) {
    if (['dashboard', 'lesson', 'pdf', 'vocab', 'progress', 'translator'].includes(hash)) {
      switchView(hash);
    } else if (hash === 'roleplay') {
      switchView('dashboard');
    } else if (hash === 'exam') {
      switchView('dashboard');
      setTimeout(() => { if (typeof openGoetheExamModal === 'function') openGoetheExamModal(); }, 150);
    } else if (hash === 'flashcards') {
      switchView('dashboard');
      setTimeout(() => { if (typeof openSrsModal === 'function') openSrsModal(); }, 150);
    } else if (hash === 'grammar-hub') {
      switchView('dashboard');
      setTimeout(() => { if (typeof openGrammarHubModal === 'function') openGrammarHubModal(); }, 150);
    } else if (hash === 'grammar') {
      switchView('dashboard');
      setTimeout(() => { if (typeof openGrammarModal === 'function') openGrammarModal(); }, 150);
    } else if (hash === 'music' || hash === 'music-ambient') {
      switchView('dashboard');
      setTimeout(() => {
        if (typeof setMusicCategory === 'function') setMusicCategory('ambient');
        const menu = document.getElementById('musicDropdownMenu');
        if (menu) menu.classList.remove('hidden');
      }, 150);
    } else if (hash === 'music-songs') {
      switchView('dashboard');
      setTimeout(() => {
        if (typeof setMusicCategory === 'function') setMusicCategory('songs');
        const menu = document.getElementById('musicDropdownMenu');
        if (menu) menu.classList.remove('hidden');
      }, 150);
    } else {
      switchView('dashboard');
    }
  }

  // ================= 28. AUDIO SPEED CONTROLLER & A-B REPEAT LOOPER =================
  let currentAudioSpeedIdx = 0;
  const AUDIO_SPEEDS = [
    { rate: 1.0, label: '1.0x' },
    { rate: 0.75, label: '0.75x' },
    { rate: 1.25, label: '1.25x' }
  ];

  window.cycleAudioSpeed = function() {
    currentAudioSpeedIdx = (currentAudioSpeedIdx + 1) % AUDIO_SPEEDS.length;
    const speedObj = AUDIO_SPEEDS[currentAudioSpeedIdx];
    const player = document.getElementById('audioPlayer');
    const label = document.getElementById('audioSpeedLabel');
    if (player) {
      player.playbackRate = speedObj.rate;
      player.preservesPitch = true;
      if ('mozPreservesPitch' in player) player.mozPreservesPitch = true;
      if ('webkitPreservesPitch' in player) player.webkitPreservesPitch = true;
    }
    if (label) label.textContent = speedObj.label;
    const desc = speedObj.rate === 0.75 ? "0.75x Slow (Beginner Friendly)" : speedObj.rate === 1.25 ? "1.25x Fast" : "1.0x Normal";
    showFloatingToast(`⚡ Audio speed set to ${desc}`);
  };

  let abLoopState = 0; // 0: inactive, 1: point A set, 2: point B set & looping
  let abLoopStart = 0;
  let abLoopEnd = 0;
  let abLoopListenerAttached = false;

  function handleAbLoopTimeUpdate() {
    const player = document.getElementById('audioPlayer');
    if (!player || abLoopState !== 2) return;
    if (player.currentTime >= abLoopEnd) {
      player.currentTime = abLoopStart;
    }
  }

  window.toggleAbLoop = function() {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioAbLoopBtn');
    const label = document.getElementById('audioAbLoopLabel');
    if (!player) return;

    if (abLoopState === 0) {
      abLoopStart = player.currentTime;
      abLoopState = 1;
      if (label) label.textContent = "Set B (End)";
      if (btn) {
        btn.classList.add('bg-purple-100', 'border-purple-400', 'text-purple-900');
        btn.classList.remove('bg-white');
      }
      showFloatingToast(`📍 Point A set at ${formatTime(abLoopStart)}. Click again to set Point B!`);
    } else if (abLoopState === 1) {
      abLoopEnd = player.currentTime;
      if (abLoopEnd <= abLoopStart + 0.5) {
        abLoopEnd = abLoopStart + 3.0;
      }
      abLoopState = 2;
      if (label) label.textContent = "Looping A-B (Clear)";
      if (btn) {
        btn.classList.add('ab-loop-active');
      }
      if (!abLoopListenerAttached) {
        player.addEventListener('timeupdate', handleAbLoopTimeUpdate);
        abLoopListenerAttached = true;
      }
      player.currentTime = abLoopStart;
      if (player.paused) player.play();
      showFloatingToast(`🔁 A-B Loop active (${formatTime(abLoopStart)} - ${formatTime(abLoopEnd)})!`);
    } else {
      abLoopState = 0;
      if (label) label.textContent = "A-B Loop";
      if (btn) {
        btn.classList.remove('ab-loop-active', 'bg-purple-100', 'border-purple-400', 'text-purple-900');
        btn.classList.add('bg-white');
      }
      if (abLoopListenerAttached) {
        player.removeEventListener('timeupdate', handleAbLoopTimeUpdate);
        abLoopListenerAttached = false;
      }
      showFloatingToast("A-B Loop cleared.");
    }
  };

  // Deprecated / Removed Feature Stubs
  window.openRoleplayModal = function() {};
  window.closeRoleplayModal = function() {};

// ================= 30. GERMAN A1 PRACTICE EXAM SIMULATOR & AI EVALUATOR =================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const GOETHE_EXAM_DATA = {
  lesen: [
    {
      teil: "Teil 1: E-Mails & Mitteilungen (Personal Messages)",
      context: "Liebe Julia,\nich habe am Samstag Geburtstag und mache eine kleine Party ab 19:00 Uhr bei mir zu Hause. Bringst du bitte einen Salat mit? Getränke und Kuchen habe ich schon gekauft. Sag mir bitte bis Freitag Bescheid, ob du kommen kannst.\nLiebe Grüße,\nSarah",
      q: "1. Sarah feiert am Samstagabend ihren Geburtstag zu Hause.",
      options: ["Richtig (True)", "Falsch (False)"],
      answer: 0,
      points: 2.5,
      explanation: "Sarah explicitly writes: 'ich habe am Samstag Geburtstag und mache eine kleine Party ab 19:00 Uhr bei mir zu Hause' (I have my birthday on Saturday and am throwing a party from 7 PM at my house)."
    },
    {
      teil: "Teil 1: E-Mails & Mitteilungen (Personal Messages)",
      context: "Liebe Julia,\nich habe am Samstag Geburtstag und mache eine kleine Party ab 19:00 Uhr bei mir zu Hause. Bringst du bitte einen Salat mit? Getränke und Kuchen habe ich schon gekauft. Sag mir bitte bis Freitag Bescheid, ob du kommen kannst.\nLiebe Grüße,\nSarah",
      q: "2. Julia soll Getränke für die Geburtstagsparty mitbringen.",
      options: ["Richtig (True)", "Falsch (False)"],
      answer: 1,
      points: 2.5,
      explanation: "Sarah already bought the drinks ('Getränke und Kuchen habe ich schon gekauft') and specifically asks Julia to bring a salad ('Bringst du bitte einen Salat mit?'). Therefore, Julia does NOT need to bring drinks."
    },
    {
      teil: "Teil 2: Internetanzeigen & Broschüren (Classified Ads)",
      situation: "Situation: Sie möchten am Wochenende Deutsch lernen und suchen einen Kurs nur am Samstag.",
      q: "3. Welche Anzeige passt zu Ihrer Situation?",
      options: [
        "Anzeige A: Intensivkurs Deutsch: Von Montag bis Freitag täglich von 9:00 bis 13:00 Uhr.",
        "Anzeige B: Wochenend-Workshop: Deutsch A1 jeden Samstag von 10:00 bis 14:00 Uhr."
      ],
      answer: 1,
      points: 2.5,
      explanation: "Anzeige B specifically runs on Saturdays ('jeden Samstag von 10:00 bis 14:00 Uhr'), perfectly fitting a weekend schedule. Anzeige A is a weekday intensive course (Monday to Friday)."
    },
    {
      teil: "Teil 2: Internetanzeigen & Broschüren (Classified Ads)",
      situation: "Situation: Sie möchten mit dem Zug günstig von Berlin nach Hamburg reisen.",
      q: "4. Welche Website-Anzeige wählen Sie?",
      options: [
        "Anzeige A: Deutsche Bahn Sparpreis: Günstige Zugtickets nach Hamburg ab 19,90 € online buchen.",
        "Anzeige B: Fernbus-Direkt: Täglich preiswerte Busreisen nach Hamburg ab 15,00 €."
      ],
      answer: 0,
      points: 2.5,
      explanation: "You specified travel by train ('mit dem Zug'). Anzeige A offers train tickets via Deutsche Bahn, whereas Anzeige B is a long-distance bus service ('Fernbus')."
    },
    {
      teil: "Teil 3: Schilder im öffentlichen Raum (Public Notices)",
      context: "Schild am Eingang eines Supermarkts:\n'Sehr geehrte Kundinnen und Kunden,\nwegen Umbauarbeiten schließt unser Markt heute ausnahmsweise bereits um 13:00 Uhr.'",
      q: "5. Sie können heute Nachmittag um 16:00 Uhr in diesem Supermarkt einkaufen.",
      options: ["Richtig (True)", "Falsch (False)"],
      answer: 1,
      points: 2.5,
      explanation: "The sign states the supermarket closes exceptionally at 1:00 PM ('schließt heute ausnahmsweise bereits um 13:00 Uhr'). Therefore, you cannot shop there at 4:00 PM (16:00)."
    },
    {
      teil: "Teil 3: Schilder im öffentlichen Raum (Public Notices)",
      context: "Schild an der Tür einer Arztpraxis:\n'Praxis Dr. Schmidt: Sprechzeiten von Montag bis Freitag von 8:00 bis 12:00 Uhr. Außerhalb der Sprechzeiten wenden Sie sich bitte an den Notdienst.'",
      q: "6. Am Dienstagmorgen um 10:00 Uhr ist die Arztpraxis geöffnet.",
      options: ["Richtig (True)", "Falsch (False)"],
      answer: 0,
      points: 2.5,
      explanation: "The opening hours are Monday to Friday from 8:00 AM to 12:00 PM ('Montag bis Freitag von 8:00 bis 12:00 Uhr'). Tuesday at 10:00 AM falls inside these hours."
    }
  ],

  hoeren: [
    {
      teil: "Teil 1: Alltägliche Gespräche (Short Dialogues)",
      audioPrompt: "Guten Tag, Herr Hansen. Wann kommen Sie heute zum Sprachkurs? - Ich komme heute um Viertel vor fünf, also um 16:45 Uhr.",
      q: "1. Um wie viel Uhr kommt Herr Hansen zum Sprachkurs?",
      options: ["Um 16:45 Uhr (Viertel vor fünf)", "Um 17:15 Uhr (Viertel nach fünf)", "Um 15:45 Uhr (Viertel vor vier)"],
      answer: 0,
      points: 2.5,
      explanation: "Herr Hansen says 'um Viertel vor fünf, also um 16:45 Uhr' (a quarter to five / 16:45)."
    },
    {
      teil: "Teil 1: Alltägliche Gespräche (Short Dialogues)",
      audioPrompt: "Entschuldigung, wie viel kostet dieses T-Shirt hier? - Das weiße T-Shirt kostet 15 Euro, aber das blaue kostet nur 12 Euro.",
      q: "2. Wie viel kostet das blaue T-Shirt?",
      options: ["15 Euro", "12 Euro", "27 Euro"],
      answer: 1,
      points: 2.5,
      explanation: "The sales assistant says: 'aber das blaue kostet nur 12 Euro' (the blue one costs only 12 euros)."
    },
    {
      teil: "Teil 2: Öffentliche Ansagen (Public Announcements)",
      audioPrompt: "Achtung an Gleis 4! Der Intercity-Express 582 nach Frankfurt Hauptbahnhof hat circa 15 Minuten Verspätung. Grund dafür ist eine technische Störung am Zug.",
      q: "3. Wie viel Verspätung hat der Zug nach Frankfurt?",
      options: ["Keine Verspätung", "Circa 15 Minuten", "Circa 50 Minuten"],
      answer: 1,
      points: 2.5,
      explanation: "The train announcement specifies: 'hat circa 15 Minuten Verspätung' (around 15 minutes delay)."
    },
    {
      teil: "Teil 2: Öffentliche Ansagen (Public Announcements)",
      audioPrompt: "Letzter Aufruf für alle noch fehlenden Fluggäste des Lufthansa-Fluges LH 402 nach New York. Bitte begeben Sie sich unverzüglich zum Flugsteig B 24. Das Einsteigen wird in wenigen Minuten beendet.",
      q: "4. Wohin müssen die Passagiere für Flug LH 402 gehen?",
      options: ["Zum Flugsteig B 12", "Zum Flugsteig B 24", "Zur Information"],
      answer: 1,
      points: 2.5,
      explanation: "The airport announcement instructs passengers: 'Bitte begeben Sie sich unverzüglich zum Flugsteig B 24' (Gate B 24)."
    },
    {
      teil: "Teil 3: Telefonansagen (Telephone Messages)",
      audioPrompt: "Guten Tag, hier ist die Praxis Dr. Weber. Frau Meier, Ihr Rezept liegt ab morgen früh um 8 Uhr an der Anmeldung für Sie bereit. Vergessen Sie bitte nicht Ihre Versichertenkarte mitzubringen. Auf Wiederhören.",
      q: "5. Was soll Frau Meier zur Arztpraxis mitbringen?",
      options: ["Ihre Versichertenkarte", "Ein neues Passfoto", "Bargeld für die Rezeptgebühr"],
      answer: 0,
      points: 2.5,
      explanation: "The voicemail explicitly requests: 'Vergessen Sie bitte nicht Ihre Versichertenkarte mitzubringen' (health insurance card)."
    },
    {
      teil: "Teil 3: Telefonansagen (Telephone Messages)",
      audioPrompt: "Hallo Herr Becker, hier ist der Elektro-Kundendienst Schneider. Ihre Waschmaschine ist repariert. Wir können das Gerät am Donnerstag zwischen 14 und 16 Uhr liefern. Bitte rufen Sie uns zurück. Danke!",
      q: "6. Wann kann der Kundendienst die Waschmaschine liefern?",
      options: ["Am Donnerstagvormittag", "Am Donnerstagnachmittag", "Am Freitag"],
      answer: 1,
      points: 2.5,
      explanation: "The delivery window is between 2:00 PM and 4:00 PM ('Donnerstag zwischen 14 und 16 Uhr'), which corresponds to Thursday afternoon (Donnerstagnachmittag)."
    }
  ],

  schreiben: {
    part1: {
      title: "Teil 1: Formular ausfüllen (Form Filling - 5 Pts)",
      text: "Ihre Bekannte Eva Fischer zieht mit ihrem Ehemann und zwei Kindern nach München. Sie bucht online im Hotel Alpenblick ein Familienzimmer für 3 Nächte ab dem 15. Oktober. Sie bezahlt im Voraus mit Kreditkarte.",
      fields: [
        { label: "1. Familienname", answer: "fischer", points: 1, explanation: "The text states 'Ihre Bekannte Eva Fischer', so the family name is Fischer." },
        { label: "2. Anzahl der Personen", answer: "4", points: 1, explanation: "Eva, her husband, and 2 children = 4 persons ('mit ihrem Ehemann und zwei Kindern')." },
        { label: "3. Anreisedatum", answer: "15. oktober", points: 1, explanation: "She booked starting October 15th ('ab dem 15. Oktober')." },
        { label: "4. Anzahl der Nächte", answer: "3", points: 1, explanation: "She booked for 3 nights ('für 3 Nächte')." },
        { label: "5. Zahlungsart", answer: "kreditkarte", points: 1, explanation: "She pays in advance by credit card ('bezahlt im Voraus mit Kreditkarte')." }
      ]
    },
    part2: {
      title: "Teil 2: E-Mail schreiben (Email Composition - 10 Pts)",
      prompt: "Schreiben Sie eine E-Mail an die Touristeninformation in Köln (circa 30–40 Wörter):<br/>• <strong>Grund des Schreibens:</strong> Sie planen eine Reise nach Köln.<br/>• <strong>Anreise / Termin:</strong> Sie kommen vom 10. bis 12. Mai.<br/>• <strong>Bitte:</strong> Bitten Sie um einen Stadtplan und günstige Hoteladressen.",
      sampleAnswer: "Sehr geehrte Damen und Herren,\n\nich plane eine Reise nach Köln und komme vom 10. bis 12. Mai. Können Sie mir bitte einen Stadtplan und Adressen von günstigen Hotels schicken?\n\nVielen Dank im Voraus.\n\nMit freundlichen Grüßen,\nAlex Becker",
      maxPoints: 10
    }
  },

  sprechen: [
    {
      id: "sprechen-part1",
      teil: "Teil 1: Sich vorstellen & Buchstabieren (Self-Introduction - 5 Pts)",
      taskDesc: "Stellen Sie sich vor (Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby) und buchstabieren Sie Ihren Namen oder nennen Sie Ihre Telefonnummer.",
      prompts: ["Name", "Alter", "Land", "Wohnort", "Sprachen", "Beruf", "Hobby"],
      modelSpeech: "Guten Tag. Mein Name ist Alex Becker. Ich bin 26 Jahre alt und komme aus Indonesien. Jetzt wohne ich in Frankfurt. Ich spreche Englisch, Indonesisch und Deutsch. Ich bin Softwareentwickler und mein Hobby ist Fußball spielen. Mein Name buchstabiert: B - E - C - K - E - R. Meine Telefonnummer ist: null - eins - sieben - sechs - eins - zwei - drei - vier - fünf.",
      targetKeywords: ["name", "jahre", "alt", "komme", "wohne", "spreche", "deutsch", "beruf", "hobby"],
      points: 5
    },
    {
      id: "sprechen-part2",
      teil: "Teil 2: Um Informationen bitten & antworten (Ask for Info - 5 Pts)",
      taskDesc: "Ziehen Sie eine Wortkarte und formulieren Sie eine Frage sowie eine passende Antwort.",
      theme: "Thema: Essen & Trinken | Wort: Frühstück",
      cardPrompt: "Frage formulieren mit 'Frühstück'",
      modelQuestion: "Was essen Sie normalerweise zum Frühstück?",
      modelResponse: "Ich esse morgens meistens Brötchen mit Käse und trinke einen Kaffee.",
      targetKeywords: ["was", "essen", "trinken", "frühstück", "morgens", "kaffee", "brötchen"],
      points: 5
    },
    {
      id: "sprechen-part3",
      teil: "Teil 3: Bitten formulieren und reagieren (Social Requests - 5 Pts)",
      taskDesc: "Formulieren Sie eine höfliche Bitte anhand der Bildkarte und reagieren Sie angemessen.",
      cardPrompt: "Bild: Ein Glas Wasser | Höfliche Bitte",
      modelQuestion: "Geben Sie mir bitte ein Glas Wasser?",
      modelResponse: "Ja, natürlich, bitte sehr!",
      targetKeywords: ["geben", "können", "bitte", "glas", "wasser", "ja", "gerne", "natürlich"],
      points: 5
    }
  ]
};

let currentExamModule = 'lesen';
let examSelectedDuration = 65;
let examTimerSeconds = 65 * 60;
let examTimerInterval = null;
let examTimerPaused = false;
let examAudioSpeed = 1.0;
let currentSpeechRecognition = null;

let examUserAnswers = {
  lesen: {},
  hoeren: {},
  schreibenPart1: {},
  schreibenPart2: '',
  sprechenRecordings: {},
  sprechenScores: {}
};

window.setExamDuration = function(mins) {
  examSelectedDuration = mins;
  if (mins === 0) {
    examTimerSeconds = 0;
  } else {
    examTimerSeconds = mins * 60;
  }
  examTimerPaused = false;

  const durationIds = ['65', '25', '20h', '20s', '15', '0'];
  durationIds.forEach(id => {
    const btn = document.getElementById(`examModeBtn-${id}`);
    if (btn) {
      const match = (id === '65' && mins === 65) ||
                    (id === '25' && mins === 25) ||
                    (id === '20h' && mins === 20 && currentExamModule === 'hoeren') ||
                    (id === '20s' && mins === 20 && currentExamModule === 'schreiben') ||
                    (id === '15' && mins === 15) ||
                    (id === '0' && mins === 0);
      if (match) {
        btn.className = "px-2 py-0.5 rounded-lg bg-amber-500 text-white font-extrabold shadow-xs transition cursor-pointer";
      } else {
        btn.className = "px-2 py-0.5 rounded-lg bg-amber-100/90 text-amber-900 font-bold hover:bg-amber-200 transition cursor-pointer";
      }
    }
  });

  updateExamTimerDisplay();
};

function updateExamTimerDisplay() {
  const display = document.getElementById('examTimerDisplay');
  if (!display) return;
  if (examSelectedDuration === 0) {
    display.textContent = "∞ Untimed";
    display.className = "text-amber-900 font-black";
    return;
  }
  const m = Math.floor(examTimerSeconds / 60);
  const s = examTimerSeconds % 60;
  display.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
  if (examTimerSeconds <= 120) {
    display.className = "text-rose-600 font-black animate-pulse";
  } else if (examTimerSeconds <= 600) {
    display.className = "text-amber-600 font-black";
  } else {
    display.className = "text-amber-900 font-black";
  }
}

window.toggleExamTimerPause = function() {
  if (examSelectedDuration === 0) return;
  examTimerPaused = !examTimerPaused;
  const pauseBtn = document.getElementById('examTimerPauseBtn');
  if (pauseBtn) {
    pauseBtn.innerHTML = examTimerPaused ? '<span>▶️</span><span>Resume</span>' : '<span>⏸️</span><span>Pause</span>';
    pauseBtn.className = examTimerPaused 
      ? 'px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer'
      : 'px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer';
  }
  showFloatingToast(examTimerPaused ? '⏸️ Exam paused' : '▶️ Exam resumed');
};

window.restartGoetheExam = function() {
  if (!confirm('Are you sure you want to restart the exam? All your current answers will be reset.')) return;
  examUserAnswers = {
    lesen: {},
    hoeren: {},
    schreibenPart1: {},
    schreibenPart2: '',
    sprechenRecordings: {},
    sprechenScores: {}
  };
  setExamDuration(examSelectedDuration);
  switchExamModule('lesen');
  showFloatingToast('🔄 Exam restarted.');
};

function startExamTimer() {
  if (examTimerInterval) clearInterval(examTimerInterval);
  examTimerInterval = setInterval(() => {
    if (examSelectedDuration === 0 || examTimerPaused) return;
    if (examTimerSeconds > 0) {
      examTimerSeconds--;
      updateExamTimerDisplay();
    } else {
      clearInterval(examTimerInterval);
      showFloatingToast("⏱️ Exam time is up! Evaluating your exam...");
      finishGoetheExam();
    }
  }, 1000);
}

window.openGoetheExamModal = function() {
  const modal = document.getElementById('goetheExamModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  if (!examTimerInterval) {
    setExamDuration(examSelectedDuration);
    startExamTimer();
  }
  switchExamModule('lesen');
};

window.closeGoetheExamModal = function() {
  const modal = document.getElementById('goetheExamModal');
  if (modal) modal.classList.add('hidden');
  if (examTimerInterval) {
    clearInterval(examTimerInterval);
    examTimerInterval = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentSpeechRecognition) {
    try { currentSpeechRecognition.abort(); } catch(e) {}
    currentSpeechRecognition = null;
  }
};

window.switchExamModule = function(mod) {
  currentExamModule = mod;
  const modules = ['lesen', 'hoeren', 'schreiben', 'sprechen'];
  modules.forEach(m => {
    const tab = document.getElementById(`examTab-${m}`);
    if (tab) {
      if (m === mod) {
        tab.className = "py-1.5 px-2 rounded-xl bg-indigo-600 text-white font-black shadow-xs transition";
      } else {
        tab.className = "py-1.5 px-2 rounded-xl text-sky-800 hover:bg-white/80 font-bold transition";
      }
    }
  });

  const finishBtn = document.getElementById('examFinishBtn');
  const nextBtn = document.getElementById('examNextModuleBtn');
  const prevBtn = document.getElementById('examPrevModuleBtn');

  if (prevBtn) {
    if (mod === 'lesen') prevBtn.classList.add('hidden');
    else prevBtn.classList.remove('hidden');
  }

  if (mod === 'sprechen') {
    if (finishBtn) finishBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
  } else {
    if (finishBtn) finishBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');
  }

  renderExamModuleContent();
  updateExamProgressFooter();
};

window.prevExamModule = function() {
  if (currentExamModule === 'hoeren') switchExamModule('lesen');
  else if (currentExamModule === 'schreiben') switchExamModule('hoeren');
  else if (currentExamModule === 'sprechen') switchExamModule('schreiben');
};

window.nextExamModule = function() {
  if (currentExamModule === 'lesen') switchExamModule('hoeren');
  else if (currentExamModule === 'hoeren') switchExamModule('schreiben');
  else if (currentExamModule === 'schreiben') switchExamModule('sprechen');
};

window.setExamAudioSpeed = function(speed) {
  examAudioSpeed = parseFloat(speed) || 1.0;
  const btnSlow = document.getElementById('examSpeedBtn-08');
  const btnNorm = document.getElementById('examSpeedBtn-10');
  if (btnSlow && btnNorm) {
    if (examAudioSpeed === 0.8) {
      btnSlow.className = "px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] shadow-xs cursor-pointer";
      btnNorm.className = "px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 font-bold text-[10px] hover:bg-indigo-200 cursor-pointer";
    } else {
      btnNorm.className = "px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] shadow-xs cursor-pointer";
      btnSlow.className = "px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 font-bold text-[10px] hover:bg-indigo-200 cursor-pointer";
    }
  }
};

window.playExamSpeech = function(text, btn = null) {
  if (!('speechSynthesis' in window)) {
    showFloatingToast('⚠️ Audio synthesis not supported in this browser.', '⚠️');
    return;
  }
  window.speechSynthesis.cancel();
  
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'de-DE';
  utter.rate = examAudioSpeed;
  
  const voices = window.speechSynthesis.getVoices();
  const deVoice = voices.find(v => v.lang.startsWith('de') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('German') || v.name.includes('Deutsch'))) ||
                  voices.find(v => v.lang.startsWith('de'));
  if (deVoice) utter.voice = deVoice;

  if (btn) {
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span>🔊</span><span class="animate-pulse">Playing...</span>';
    btn.disabled = true;
    utter.onend = () => {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    };
    utter.onerror = () => {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    };
  }

  window.speechSynthesis.speak(utter);
};

window.evaluateExamEmailNLP = function(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const greetingRegex = /(sehr geehrte damen und herren|sehr geehrte[rn]?\s+[A-Za-zäöüß]+|liebe[rn]?\s+[A-Za-zäöüß]+|hallo\s+[A-Za-zäöüß]*|guten tag\s+[A-Za-zäöüß]*)/i;
  const greetingMatch = text.match(greetingRegex);
  const hasGreeting = !!greetingMatch;

  const closingRegex = /(mit freundlichen grüßen|viele grüße|herzliche grüße|liebe grüße|beste grüße|dein[e]?\s+[A-Za-zäöüß]+)/i;
  const closingMatch = text.match(closingRegex);
  const hasClosing = !!closingMatch;

  const lp1Regex = /(warum|reise|fahre|komme|besuche|urlaub|köln|plane)/i;
  const hasLp1 = lp1Regex.test(text);

  const lp2Regex = /(mai|10\.|12\.|vom\s+10|bis\s+12|am 10|ankunft|anreise)/i;
  const hasLp2 = lp2Regex.test(text);

  const lp3Regex = /(stadtplan|plan|hotel|hotels|übernachtung|unterkunft|schicken|senden|empfehlen)/i;
  const hasLp3 = lp3Regex.test(text);

  let score = 0;
  if (hasGreeting) score += 1.5;
  if (hasClosing) score += 1.5;
  
  if (wordCount >= 30) score += 2.5;
  else if (wordCount >= 20) score += 1.5;
  else if (wordCount >= 10) score += 1.0;
  else if (wordCount > 0) score += 0.5;

  if (hasLp1) score += 1.5;
  if (hasLp2) score += 1.5;
  if (hasLp3) score += 1.5;

  return {
    wordCount,
    hasGreeting,
    greetingMatch: greetingMatch ? greetingMatch[0] : '',
    hasClosing,
    closingMatch: closingMatch ? closingMatch[0] : '',
    hasLp1,
    hasLp2,
    hasLp3,
    score: Math.min(10, Math.round(score * 10) / 10)
  };
};

window.handleExamEmailInput = function(val) {
  examUserAnswers.schreibenPart2 = val;
  const nlp = evaluateExamEmailNLP(val);
  
  const wordCountEl = document.getElementById('examEmailWordCount');
  const progressBar = document.getElementById('examWordProgressBar');
  const greetingPill = document.getElementById('nlpPillGreeting');
  const closingPill = document.getElementById('nlpPillClosing');
  const lp1Pill = document.getElementById('nlpPillLp1');
  const lp2Pill = document.getElementById('nlpPillLp2');
  const lp3Pill = document.getElementById('nlpPillLp3');
  const scoreBadge = document.getElementById('nlpScoreBadge');

  if (wordCountEl) {
    wordCountEl.textContent = `${nlp.wordCount} / 30 words`;
    wordCountEl.className = nlp.wordCount >= 30 ? "text-xs font-black text-emerald-700" : "text-xs font-bold text-amber-700";
  }
  if (progressBar) {
    const pct = Math.min(100, Math.round((nlp.wordCount / 30) * 100));
    progressBar.style.width = `${pct}%`;
    progressBar.className = pct >= 100 ? "h-1.5 bg-emerald-500 rounded-full transition-all duration-300" : "h-1.5 bg-amber-400 rounded-full transition-all duration-300";
  }
  if (greetingPill) {
    greetingPill.innerHTML = nlp.hasGreeting ? '<span>✅ Greeting</span>' : '<span>⚪ Greeting</span>';
    greetingPill.className = nlp.hasGreeting ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium';
  }
  if (closingPill) {
    closingPill.innerHTML = nlp.hasClosing ? '<span>✅ Sign-Off</span>' : '<span>⚪ Sign-Off</span>';
    closingPill.className = nlp.hasClosing ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium';
  }
  if (lp1Pill) {
    lp1Pill.innerHTML = nlp.hasLp1 ? '<span>✅ 1. Travel Reason</span>' : '<span>⚪ 1. Travel Reason</span>';
    lp1Pill.className = nlp.hasLp1 ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium';
  }
  if (lp2Pill) {
    lp2Pill.innerHTML = nlp.hasLp2 ? '<span>✅ 2. Travel Dates</span>' : '<span>⚪ 2. Travel Dates</span>';
    lp2Pill.className = nlp.hasLp2 ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium';
  }
  if (lp3Pill) {
    lp3Pill.innerHTML = nlp.hasLp3 ? '<span>✅ 3. Map & Hotels</span>' : '<span>⚪ 3. Map & Hotels</span>';
    lp3Pill.className = nlp.hasLp3 ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium';
  }
  if (scoreBadge) {
    scoreBadge.textContent = `${nlp.score} / 10 Pts`;
  }
  updateExamProgressFooter();
};

let examMediaRecorders = {};
let examMediaStreams = {};
let examRecordedAudioBlobs = {};
let examRecordTimers = {};
let examActiveRecordingIdx = null;
let examPracticeActive = {};

window.stopSprechenRecording = function(partIdx) {
  // 1. Stop MediaRecorder if actively recording audio stream
  if (examMediaRecorders[partIdx]) {
    try {
      if (examMediaRecorders[partIdx].state === 'recording') {
        examMediaRecorders[partIdx].stop();
      }
    } catch(e) {
      console.warn('Error stopping MediaRecorder:', e);
    }
  }

  // 2. Stop practice countdown timer if active
  if (examPracticeActive[partIdx]) {
    clearInterval(examRecordTimers[partIdx]);
    delete examPracticeActive[partIdx];
    const micBtn = document.getElementById(`sprechenMicBtn-${partIdx}`);
    const statusEl = document.getElementById(`sprechenStatus-${partIdx}`);
    if (micBtn) {
      micBtn.className = "px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer";
      micBtn.innerHTML = "<span>🎙️</span><span>Practice Again</span>";
    }
    if (statusEl) {
      statusEl.innerHTML = `<span class="text-emerald-800 font-bold text-xs">✅ Speaking practice complete! Please confirm your fluency score below:</span>`;
    }
    if (examUserAnswers.sprechenScores[partIdx] === undefined) {
      setSprechenSelfScore(partIdx, 4);
    }
  }

  // 3. Stop SpeechRecognition if running
  if (currentSpeechRecognition) {
    try { currentSpeechRecognition.stop(); } catch(e) {}
  }
  examActiveRecordingIdx = null;
};

window.toggleSprechenRecording = async function(partIdx) {
  const micBtn = document.getElementById(`sprechenMicBtn-${partIdx}`);
  const statusEl = document.getElementById(`sprechenStatus-${partIdx}`);
  const transcriptEl = document.getElementById(`sprechenTranscript-${partIdx}`);
  const scoreBox = document.getElementById(`sprechenScoreBox-${partIdx}`);

  // If already recording or practicing this part -> STOP IT
  if (examActiveRecordingIdx === partIdx ||
      (examMediaRecorders[partIdx] && examMediaRecorders[partIdx].state === 'recording') ||
      examPracticeActive[partIdx]) {
    window.stopSprechenRecording(partIdx);
    return;
  }

  // If another part was recording, stop that first
  if (examActiveRecordingIdx !== null && examActiveRecordingIdx !== partIdx) {
    window.stopSprechenRecording(examActiveRecordingIdx);
  }

  examActiveRecordingIdx = partIdx;
  const item = (GOETHE_EXAM_DATA && GOETHE_EXAM_DATA.sprechen && GOETHE_EXAM_DATA.sprechen[partIdx]) || {};
  const keywordsArray = item.targetKeywords || [];

  let stream = null;
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch(micErr) {
      console.warn('Microphone access denied or unsupported on current protocol:', micErr);
    }
  }

  let recSeconds = 0;

  // Case A: Real Microphone available with MediaRecorder
  if (stream && typeof MediaRecorder !== 'undefined') {
    examMediaStreams[partIdx] = stream;
    let recordedChunks = [];
    let mediaRecorder = null;
    try {
      mediaRecorder = new MediaRecorder(stream);
    } catch(e) {
      console.warn('MediaRecorder constructor error:', e);
    }

    if (mediaRecorder) {
      examMediaRecorders[partIdx] = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        clearInterval(examRecordTimers[partIdx]);
        examActiveRecordingIdx = null;
        const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
        examRecordedAudioBlobs[partIdx] = audioBlob;
        const audioUrl = URL.createObjectURL(audioBlob);

        // Stop media stream tracks
        try {
          stream.getTracks().forEach(track => track.stop());
        } catch(e) {}

        if (micBtn) {
          micBtn.className = "px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer";
          micBtn.innerHTML = "<span>🎙️</span><span>Record Again</span>";
        }

        if (statusEl) {
          statusEl.innerHTML = `
            <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5 mt-1">
              <div class="flex items-center justify-between font-bold">
                <span class="flex items-center gap-1 text-emerald-900">
                  <span>✅</span>
                  <span>Audio Recorded (${recSeconds}s)</span>
                </span>
                <span class="text-[10px] text-emerald-700">Listen back to your voice:</span>
              </div>
              <audio controls src="${audioUrl}" class="w-full h-8 rounded-lg"></audio>
            </div>
          `;
        }

        // Auto-select good score if not yet scored
        if (examUserAnswers.sprechenScores[partIdx] === undefined) {
          setSprechenSelfScore(partIdx, 4);
        }
      };

      // Set button to stop recording mode
      if (micBtn) {
        micBtn.className = "px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse shadow-md cursor-pointer";
        micBtn.innerHTML = `<span>⏹️</span><span>Stop Recording (<span id="recTimer-${partIdx}">0s</span>)</span>`;
      }
      if (statusEl) {
        statusEl.innerHTML = `<span class="text-rose-700 font-bold text-xs">🔴 Recording your voice now... Speak in German, then click "Stop Recording" when done.</span>`;
      }

      clearInterval(examRecordTimers[partIdx]);
      examRecordTimers[partIdx] = setInterval(() => {
        recSeconds++;
        const timerSpan = document.getElementById(`recTimer-${partIdx}`);
        if (timerSpan) timerSpan.textContent = `${recSeconds}s`;
        if (recSeconds >= 30) {
          window.stopSprechenRecording(partIdx);
        }
      }, 1000);

      mediaRecorder.start();

      // Parallel Speech Recognition for transcript if available
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          if (currentSpeechRecognition) {
            try { currentSpeechRecognition.abort(); } catch(e) {}
          }
          const recognition = new SpeechRecognition();
          currentSpeechRecognition = recognition;
          recognition.lang = 'de-DE';
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          let finalTranscript = '';
          recognition.onresult = (e) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
              else interim += e.results[i][0].transcript;
            }
            if (transcriptEl) transcriptEl.textContent = finalTranscript || interim;
          };

          recognition.onend = () => {
            const recognized = (finalTranscript || (transcriptEl ? transcriptEl.textContent : '')).trim().toLowerCase();
            examUserAnswers.sprechenRecordings[partIdx] = recognized;
            if (recognized && keywordsArray.length > 0) {
              let matches = 0;
              keywordsArray.forEach(kw => {
                if (recognized.includes(kw.toLowerCase())) matches++;
              });
              let partScore = 3;
              if (matches >= 4) partScore = 5;
              else if (matches >= 2) partScore = 4;
              setSprechenSelfScore(partIdx, partScore);
            }
          };

          recognition.onerror = (e) => {
            console.warn('SpeechRecognition notification:', e.error);
          };

          recognition.start();
        } catch(sttErr) {
          console.warn('SpeechRecognition start error:', sttErr);
        }
      }
      return;
    }
  }

  // Case B: Microphone access unavailable or blocked (e.g. Chrome file:/// security restrictions)
  // Provide interactive Speaking Practice countdown timer
  examPracticeActive[partIdx] = true;
  if (micBtn) {
    micBtn.className = "px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse shadow-md cursor-pointer";
    micBtn.innerHTML = `<span>⏹️</span><span>Finish Speaking (<span id="recTimer-${partIdx}">0s</span>)</span>`;
  }
  if (statusEl) {
    statusEl.innerHTML = `<span class="text-indigo-900 font-semibold text-xs">🗣️ Speaking practice active! Speak your German response aloud, then click <strong>"Finish Speaking"</strong>.</span>`;
  }
  if (transcriptEl) {
    transcriptEl.innerHTML = `<span class="text-indigo-700 italic">Microphone restricted by browser file policy. Practicing speaking aloud... Click "Finish Speaking" when done.</span>`;
  }

  clearInterval(examRecordTimers[partIdx]);
  examRecordTimers[partIdx] = setInterval(() => {
    recSeconds++;
    const timerSpan = document.getElementById(`recTimer-${partIdx}`);
    if (timerSpan) timerSpan.textContent = `${recSeconds}s`;
    if (recSeconds >= 20) {
      window.stopSprechenRecording(partIdx);
    }
  }, 1000);
};

window.startSprechenRecognition = window.toggleSprechenRecording;

window.playHoerenItemAudio = function(idx, btn) {
  const item = (GOETHE_EXAM_DATA && GOETHE_EXAM_DATA.hoeren && GOETHE_EXAM_DATA.hoeren[idx]);
  if (item && item.audioPrompt) {
    playExamSpeech(item.audioPrompt, btn);
  }
};

window.playSprechenModelAudio = function(idx, btn) {
  const item = (GOETHE_EXAM_DATA && GOETHE_EXAM_DATA.sprechen && GOETHE_EXAM_DATA.sprechen[idx]);
  if (item) {
    const text = item.modelSpeech || ((item.modelQuestion || '') + ' ' + (item.modelResponse || ''));
    playExamSpeech(text, btn);
  }
};

window.setSprechenSelfScore = function(partIdx, pts) {
  examUserAnswers.sprechenScores[partIdx] = pts;
  const scoreBox = document.getElementById(`sprechenScoreBox-${partIdx}`);
  if (scoreBox) {
    scoreBox.innerHTML = `
      <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span>✅ Score confirmed:</span>
          <span class="text-sm font-black px-2.5 py-0.5 rounded-lg bg-emerald-200 text-emerald-900">${pts} / 5 Pts</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[10px] text-slate-500">Change:</span>
          <button onclick="setSprechenSelfScore(${partIdx}, 5)" class="px-2 py-0.5 rounded-lg ${pts===5 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-900'} font-bold text-[10px] cursor-pointer">5 Pts</button>
          <button onclick="setSprechenSelfScore(${partIdx}, 4)" class="px-2 py-0.5 rounded-lg ${pts===4 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-900'} font-bold text-[10px] cursor-pointer">4 Pts</button>
          <button onclick="setSprechenSelfScore(${partIdx}, 3)" class="px-2 py-0.5 rounded-lg ${pts===3 ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'} font-bold text-[10px] cursor-pointer">3 Pts</button>
        </div>
      </div>
    `;
  }
  updateExamProgressFooter();
};

window.saveHoerenAnswer = function(qIdx, optIdx) {
  examUserAnswers.hoeren[qIdx] = optIdx;
  updateExamProgressFooter();
};

window.saveLesenAnswer = function(qIdx, optIdx) {
  examUserAnswers.lesen[qIdx] = optIdx;
  updateExamProgressFooter();
};

window.saveSchreibenFormField = function(fIdx, val) {
  examUserAnswers.schreibenPart1[fIdx] = val.trim().toLowerCase();
  updateExamProgressFooter();
};

window.toggleExamModelAnswer = function() {
  const box = document.getElementById('examModelAnswerBox');
  if (box) box.classList.toggle('hidden');
};

function updateExamProgressFooter() {
  const statusEl = document.getElementById('examScoreStatus');
  if (!statusEl) return;

  if (currentExamModule === 'lesen') {
    const answered = Object.keys(examUserAnswers.lesen).length;
    statusEl.innerHTML = `<span>Modul Lesen Progress:</span> <strong class="text-indigo-900">${answered} / 6 Questions Answered</strong>`;
  } else if (currentExamModule === 'hoeren') {
    const answered = Object.keys(examUserAnswers.hoeren).length;
    statusEl.innerHTML = `<span>Modul Hören Progress:</span> <strong class="text-indigo-900">${answered} / 6 Questions Answered</strong>`;
  } else if (currentExamModule === 'schreiben') {
    const fFilled = Object.keys(examUserAnswers.schreibenPart1).length;
    const nlp = evaluateExamEmailNLP(examUserAnswers.schreibenPart2 || '');
    statusEl.innerHTML = `<span>Modul Schreiben Progress:</span> <strong class="text-indigo-900">${fFilled}/5 Form Fields • ${nlp.wordCount} words (${nlp.score}/10 Pts)</strong>`;
  } else if (currentExamModule === 'sprechen') {
    const scored = Object.keys(examUserAnswers.sprechenScores).length;
    statusEl.innerHTML = `<span>Modul Sprechen Progress:</span> <strong class="text-indigo-900">${scored} / 3 Tasks Recorded / Evaluated</strong>`;
  }
}

function renderExamModuleContent() {
  const container = document.getElementById('examModuleContainer');
  if (!container) return;

  let html = '';

  // ---------------- MODULE 1: LESEN ----------------
  if (currentExamModule === 'lesen') {
    html += `
      <div class="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
        <div class="flex items-center justify-between font-bold mb-1">
          <span class="flex items-center gap-1.5 text-indigo-900">
            <span>📖</span>
            <span class="text-sm font-black">Modul 1: Lesen (Reading - 25 Min, 15 Points)</span>
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-indigo-200/80 text-indigo-900 font-extrabold text-[11px]">3 Teile • 6 Questions</span>
        </div>
        Read each short text, email, or public sign carefully and select the best option.
      </div>
    `;

    GOETHE_EXAM_DATA.lesen.forEach((item, idx) => {
      const savedAns = examUserAnswers.lesen[idx];
      html += `
        <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-sky-700">${item.teil}</span>
            <span class="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">Question ${idx + 1} of 6 (2.5 Pts)</span>
          </div>
          ${item.context ? `
            <div class="p-3 bg-sky-50/80 rounded-xl border border-sky-200 text-xs text-sky-950 font-serif leading-relaxed italic whitespace-pre-line">
              "${escapeHtml(item.context)}"
            </div>
          ` : ''}
          ${item.situation ? `
            <div class="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium">
              ${escapeHtml(item.situation)}
            </div>
          ` : ''}
          <p class="text-xs font-black text-sky-950">${escapeHtml(item.q)}</p>
          <div class="space-y-1.5">
            ${item.options.map((opt, optIdx) => `
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${savedAns === optIdx ? 'bg-indigo-50 border-indigo-400 font-bold shadow-xs' : 'hover:bg-sky-50 border-sky-200 text-sky-900'}">
                <input type="radio" name="lesen-ans-${idx}" value="${optIdx}" ${savedAns === optIdx ? 'checked' : ''} onchange="saveLesenAnswer(${idx}, ${optIdx})" class="accent-indigo-600">
                <span class="text-xs">${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });
  }

  // ---------------- MODULE 2: HÖREN ----------------
  else if (currentExamModule === 'hoeren') {
    html += `
      <div class="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
        <div class="flex flex-wrap items-center justify-between gap-2 font-bold mb-1">
          <span class="flex items-center gap-1.5 text-indigo-900">
            <span>🎧</span>
            <span class="text-sm font-black">Modul 2: Hören (Listening - 20 Min, 15 Points)</span>
          </span>
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] text-sky-800">Speed:</span>
            <button id="examSpeedBtn-08" onclick="setExamAudioSpeed(0.8)" class="px-2 py-0.5 rounded-lg ${examAudioSpeed === 0.8 ? 'bg-indigo-600 text-white font-bold text-[10px] shadow-xs cursor-pointer' : 'bg-indigo-100 text-indigo-900 font-bold text-[10px] hover:bg-indigo-200 cursor-pointer'}">0.8x Slow</button>
            <button id="examSpeedBtn-10" onclick="setExamAudioSpeed(1.0)" class="px-2 py-0.5 rounded-lg ${examAudioSpeed === 1.0 ? 'bg-indigo-600 text-white font-bold text-[10px] shadow-xs cursor-pointer' : 'bg-indigo-100 text-indigo-900 font-bold text-[10px] hover:bg-indigo-200 cursor-pointer'}">1.0x Normal</button>
          </div>
        </div>
        Click the 🔊 button to play the authentic German audio simulation. Each prompt can be replayed.
      </div>
    `;

    GOETHE_EXAM_DATA.hoeren.forEach((item, idx) => {
      const savedAns = examUserAnswers.hoeren[idx];
      html += `
        <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-sky-700">${item.teil}</span>
            <span class="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">Question ${idx + 1} of 6 (2.5 Pts)</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-sky-50/80 rounded-xl border border-sky-200">
            <div class="text-xs text-sky-900 font-medium flex items-center gap-2">
              <span class="text-base">🎙️</span>
              <span>Authentic German Audio Recording</span>
            </div>
            <button onclick="playHoerenItemAudio(${idx}, this)" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
              <span>🔊</span>
              <span>Play Audio</span>
            </button>
          </div>
          <p class="text-xs font-black text-sky-950">${escapeHtml(item.q)}</p>
          <div class="space-y-1.5">
            ${item.options.map((opt, optIdx) => `
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${savedAns === optIdx ? 'bg-indigo-50 border-indigo-400 font-bold shadow-xs' : 'hover:bg-sky-50 border-sky-200 text-sky-900'}">
                <input type="radio" name="hoeren-ans-${idx}" value="${optIdx}" ${savedAns === optIdx ? 'checked' : ''} onchange="saveHoerenAnswer(${idx}, ${optIdx})" class="accent-indigo-600">
                <span class="text-xs">${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });
  }

  // ---------------- MODULE 3: SCHREIBEN ----------------
  else if (currentExamModule === 'schreiben') {
    const nlp = evaluateExamEmailNLP(examUserAnswers.schreibenPart2 || '');
    const pct = Math.min(100, Math.round((nlp.wordCount / 30) * 100));

    html += `
      <div class="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
        <div class="flex items-center justify-between font-bold mb-1">
          <span class="flex items-center gap-1.5 text-indigo-900">
            <span>✍️</span>
            <span class="text-sm font-black">Modul 3: Schreiben (Writing - 20 Min, 15 Points)</span>
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-indigo-200/80 text-indigo-900 font-extrabold text-[11px]">Teil 1 (5 Pts) + Teil 2 (10 Pts)</span>
        </div>
        Complete both parts: 1) Fill in the missing registration form fields. 2) Compose a short email (~30–40 words) with real-time AI evaluation.
      </div>

      <!-- Part 1: Formular Ausfüllen -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-wider text-sky-700">${GOETHE_EXAM_DATA.schreiben.part1.title}</span>
          <span class="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">5 Fields • 5 Points</span>
        </div>
        <div class="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-950 leading-relaxed font-serif italic">
          "${escapeHtml(GOETHE_EXAM_DATA.schreiben.part1.text)}"
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          ${GOETHE_EXAM_DATA.schreiben.part1.fields.map((f, fIdx) => `
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-sky-950 block">${f.label}:</label>
              <input type="text" value="${escapeHtml(examUserAnswers.schreibenPart1[fIdx] || '')}" oninput="saveSchreibenFormField(${fIdx}, this.value)" placeholder="Enter answer..." class="w-full px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-xs text-sky-950 font-medium focus:outline-none focus:border-indigo-500 shadow-2xs">
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Part 2: Brief / E-Mail Schreiben with Real-Time AI NLP Evaluator -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-wider text-sky-700">${GOETHE_EXAM_DATA.schreiben.part2.title}</span>
          <div class="flex items-center gap-2">
            <span id="nlpScoreBadge" class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black">${nlp.score} / 10 Pts</span>
            <span id="examEmailWordCount" class="${nlp.wordCount >= 30 ? 'text-xs font-black text-emerald-700' : 'text-xs font-bold text-amber-700'}">${nlp.wordCount} / 30 words</span>
          </div>
        </div>

        <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div id="examWordProgressBar" style="width: ${pct}%" class="${pct >= 100 ? 'h-1.5 bg-emerald-500 rounded-full transition-all duration-300' : 'h-1.5 bg-amber-400 rounded-full transition-all duration-300'}"></div>
        </div>

        <div class="text-xs text-sky-950 leading-relaxed bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
          ${GOETHE_EXAM_DATA.schreiben.part2.prompt}
        </div>

        <!-- Real-Time Leitpunkte & Structure Badges -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          <span id="nlpPillGreeting" class="${nlp.hasGreeting ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium'}">
            ${nlp.hasGreeting ? '✅ Greeting' : '⚪ Greeting'}
          </span>
          <span id="nlpPillLp1" class="${nlp.hasLp1 ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium'}">
            ${nlp.hasLp1 ? '✅ 1. Travel Reason' : '⚪ 1. Travel Reason'}
          </span>
          <span id="nlpPillLp2" class="${nlp.hasLp2 ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium'}">
            ${nlp.hasLp2 ? '✅ 2. Travel Dates' : '⚪ 2. Travel Dates'}
          </span>
          <span id="nlpPillLp3" class="${nlp.hasLp3 ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium'}">
            ${nlp.hasLp3 ? '✅ 3. Map & Hotels' : '⚪ 3. Map & Hotels'}
          </span>
          <span id="nlpPillClosing" class="${nlp.hasClosing ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold' : 'px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium'}">
            ${nlp.hasClosing ? '✅ Sign-Off' : '⚪ Sign-Off'}
          </span>
        </div>

        <textarea id="examEmailInput" rows="5" oninput="handleExamEmailInput(this.value)" placeholder="Sehr geehrte Damen und Herren,\n\nich plane eine Reise nach Köln..." class="w-full p-3 rounded-xl bg-white border border-sky-300 text-xs text-sky-950 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 shadow-2xs">${escapeHtml(examUserAnswers.schreibenPart2 || '')}</textarea>

        <div class="flex items-center justify-between pt-1">
          <button onclick="toggleExamModelAnswer()" class="text-xs text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer">
            💡 Toggle Official Model Answer & Rubric
          </button>
        </div>
        <div id="examModelAnswerBox" class="hidden p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5 leading-relaxed">
          <div class="font-bold text-emerald-900">Standard Model Solution (100% Score):</div>
          <p class="font-serif italic whitespace-pre-line text-emerald-950">${escapeHtml(GOETHE_EXAM_DATA.schreiben.part2.sampleAnswer)}</p>
        </div>
      </div>
    `;
  }

  // ---------------- MODULE 4: SPRECHEN ----------------
  else if (currentExamModule === 'sprechen') {
    html += `
      <div class="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
        <div class="flex items-center justify-between font-bold mb-1">
          <span class="flex items-center gap-1.5 text-indigo-900">
            <span>🗣️</span>
            <span class="text-sm font-black">Modul 4: Sprechen (Speaking - 15 Min, 15 Points)</span>
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-indigo-200/80 text-indigo-900 font-extrabold text-[11px]">3 Teile • 15 Points</span>
        </div>
        Listen to the native pronunciation model, then click 🎙️ to record your German response or self-award points.
      </div>
    `;

    GOETHE_EXAM_DATA.sprechen.forEach((item, idx) => {
      const partScore = examUserAnswers.sprechenScores[idx];
      const transcript = examUserAnswers.sprechenRecordings[idx];

      html += `
        <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-sky-700">${item.teil}</span>
            <span class="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">Part ${idx + 1} of 3 (5 Pts)</span>
          </div>
          <p class="text-xs text-sky-900 font-medium">${item.taskDesc}</p>

          ${item.prompts ? `
            <div class="flex flex-wrap gap-1.5 py-1">
              ${item.prompts.map(p => `<span class="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200">${p}</span>`).join('')}
            </div>
          ` : ''}

          ${item.theme ? `
            <div class="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 font-bold">
              ${escapeHtml(item.theme)}
            </div>
          ` : ''}

          ${item.cardPrompt ? `
            <div class="text-xs font-bold text-sky-950">
              Prompt: <span class="text-indigo-900">${escapeHtml(item.cardPrompt)}</span>
            </div>
          ` : ''}

          <!-- Audio Simulation Model Player -->
          <div class="flex items-center justify-between p-3 bg-sky-50/80 rounded-xl border border-sky-200">
            <div class="text-xs text-sky-900 font-medium">
              Native German Model Audio
            </div>
            <button onclick="playSprechenModelAudio(${idx}, this)" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
              <span>🔊</span>
              <span>Listen to Model</span>
            </button>
          </div>

          <!-- Speech Recording & AI Keyword Evaluator -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <button id="sprechenMicBtn-${idx}" onclick="toggleSprechenRecording(${idx})" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer">
                <span>🎙️</span>
                <span>Record Answer</span>
              </button>
              <div id="sprechenStatus-${idx}" class="text-[11px] text-slate-600 font-medium">Click Record and speak clearly in German...</div>
            </div>

            <div id="sprechenTranscript-${idx}" class="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 font-mono min-h-[36px]">
              ${transcript ? escapeHtml(transcript) : '<span class="text-slate-400 italic">Recognized speech will appear here...</span>'}
            </div>

            <div id="sprechenScoreBox-${idx}">
              ${partScore !== undefined ? `
                <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                  <span>✅ Recorded & Evaluated Score:</span>
                  <span class="text-sm font-black px-2.5 py-1 rounded-lg bg-emerald-200 text-emerald-900">${partScore} / 5 Pts</span>
                </div>
              ` : `
                <div class="flex items-center justify-between gap-2 pt-1">
                  <span class="text-[11px] text-slate-500 font-medium">Or self-assess your fluency:</span>
                  <div class="flex items-center gap-1">
                    <button onclick="setSprechenSelfScore(${idx}, 5)" class="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] cursor-pointer">5 Pts (Fluent)</button>
                    <button onclick="setSprechenSelfScore(${idx}, 4)" class="px-2 py-0.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[10px] cursor-pointer">4 Pts (Good)</button>
                    <button onclick="setSprechenSelfScore(${idx}, 3)" class="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] cursor-pointer">3 Pts (Basic)</button>
                  </div>
                </div>
              `}
            </div>
          </div>

        </div>
      `;
    });
  }

  container.innerHTML = html;
}

window.finishGoetheExam = function() {
  if (examTimerInterval) {
    clearInterval(examTimerInterval);
    examTimerInterval = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentSpeechRecognition) {
    try { currentSpeechRecognition.abort(); } catch(e) {}
    currentSpeechRecognition = null;
  }

  // 1. LESEN SCORING (Max 15 Pts)
  let lesenPts = 0;
  GOETHE_EXAM_DATA.lesen.forEach((item, idx) => {
    if (examUserAnswers.lesen[idx] === item.answer) {
      lesenPts += item.points;
    }
  });

  // 2. HÖREN SCORING (Max 15 Pts)
  let hoerenPts = 0;
  GOETHE_EXAM_DATA.hoeren.forEach((item, idx) => {
    if (examUserAnswers.hoeren[idx] === item.answer) {
      hoerenPts += item.points;
    }
  });

  // 3. SCHREIBEN SCORING (Max 15 Pts: Teil 1 max 5, Teil 2 max 10)
  let schreibenPart1Pts = 0;
  GOETHE_EXAM_DATA.schreiben.part1.fields.forEach((f, idx) => {
    const userVal = (examUserAnswers.schreibenPart1[idx] || '').trim().toLowerCase();
    const correctVal = f.answer.toLowerCase();
    if (userVal && (userVal.includes(correctVal) || correctVal.includes(userVal))) {
      schreibenPart1Pts += f.points;
    }
  });
  const nlp = evaluateExamEmailNLP(examUserAnswers.schreibenPart2 || '');
  const schreibenPart2Pts = nlp.score;
  const schreibenPts = Math.min(15, Math.round((schreibenPart1Pts + schreibenPart2Pts) * 10) / 10);

  // 4. SPRECHEN SCORING (Max 15 Pts: 3 parts x 5 pts)
  let sprechenPts = 0;
  GOETHE_EXAM_DATA.sprechen.forEach((item, idx) => {
    const s = examUserAnswers.sprechenScores[idx] !== undefined ? examUserAnswers.sprechenScores[idx] : 4;
    sprechenPts += s;
  });
  sprechenPts = Math.min(15, sprechenPts);

  // TOTAL CALCULATION (Total 60 Pts)
  const totalRaw = Math.round((lesenPts + hoerenPts + schreibenPts + sprechenPts) * 10) / 10;
  const totalPercentage = Math.round((totalRaw / 60) * 100);
  const isPassed = totalPercentage >= 60;

  let grade = "Nicht bestanden (Failed)";
  if (totalPercentage >= 90) grade = "Sehr gut (Excellent)";
  else if (totalPercentage >= 80) grade = "Gut (Good)";
  else if (totalPercentage >= 70) grade = "Befriedigend (Satisfactory)";
  else if (totalPercentage >= 60) grade = "Ausreichend (Passed)";

  if (isPassed) {
    if (typeof awardXP === 'function') awardXP(50, 'German A1 Exam Passed');
    if (typeof unlockBadge === 'function') unlockBadge('goethe_ready');
  }

  const container = document.getElementById('examModuleContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="p-6 bg-white rounded-2xl border-2 ${isPassed ? 'border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-teal-50/50' : 'border-rose-300 bg-rose-50/50'} text-center space-y-4">
      <div class="text-5xl">${isPassed ? '🏆' : '📚'}</div>
      <h3 class="text-xl font-black text-sky-950">${isPassed ? 'Herzlichen Glückwunsch! Exam Passed!' : 'Good Effort! Keep Reviewing!'}</h3>
      <p class="text-xs text-sky-700 font-medium">German A1 Standard Proficiency Exam Evaluation</p>
      
      <!-- 4 Module Breakdown Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto py-2">
        <div class="p-3 bg-white rounded-xl border border-sky-200 shadow-2xs">
          <div class="text-[11px] font-bold text-sky-600">📖 Lesen</div>
          <div class="text-base font-black text-sky-950">${lesenPts} / 15</div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-sky-200 shadow-2xs">
          <div class="text-[11px] font-bold text-sky-600">🎧 Hören</div>
          <div class="text-base font-black text-sky-950">${hoerenPts} / 15</div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-sky-200 shadow-2xs">
          <div class="text-[11px] font-bold text-sky-600">✍️ Schreiben</div>
          <div class="text-base font-black text-sky-950">${schreibenPts} / 15</div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-sky-200 shadow-2xs">
          <div class="text-[11px] font-bold text-sky-600">🗣️ Sprechen</div>
          <div class="text-base font-black text-sky-950">${sprechenPts} / 15</div>
        </div>
      </div>

      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full ${isPassed ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'} text-xs font-black shadow-2xs">
        <span>Total: ${totalRaw} / 60 Points (${totalPercentage}%)</span>
        <span>•</span>
        <span>${grade}</span>
      </div>

      <!-- Action Buttons: Review All Answers + Print Certificate -->
      <div class="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        <button onclick="openExamReviewModal()" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5">
          <span>🔍</span>
          <span>Review All Answers & Explanations</span>
        </button>
        ${isPassed ? `
          <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5">
            <span>📜</span>
            <span>Print Official Certificate</span>
          </button>
        ` : ''}
        <button onclick="restartGoetheExam()" class="px-4 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-xs transition cursor-pointer flex items-center gap-1.5">
          <span>🔄</span>
          <span>Retake Exam</span>
        </button>
      </div>

      ${isPassed ? `
        <div class="p-4 bg-white/90 rounded-2xl border border-emerald-300 text-left space-y-1.5 max-w-md mx-auto shadow-sm mt-3">
          <div class="flex items-center gap-2 text-emerald-900 font-black text-xs">
            <span>🎓</span>
            <span>Cheeya Studio German A1 Certificate of Proficiency</span>
          </div>
          <p class="text-[11px] text-sky-900 leading-relaxed">
            Certified proficiency in German Level A1 competencies across Reading, Listening, Writing, and Speaking with final score of <strong>${totalPercentage}% (${grade})</strong>.
          </p>
        </div>
      ` : ''}
    </div>
  `;

  const finishBtn = document.getElementById('examFinishBtn');
  const nextBtn = document.getElementById('examNextModuleBtn');
  const prevBtn = document.getElementById('examPrevModuleBtn');
  if (finishBtn) finishBtn.classList.add('hidden');
  if (nextBtn) nextBtn.classList.add('hidden');
  if (prevBtn) prevBtn.classList.add('hidden');

  const statusEl = document.getElementById('examScoreStatus');
  if (statusEl) {
    statusEl.innerHTML = `Exam Completed: <strong class="text-emerald-900">${totalRaw} / 60 Pts (${totalPercentage}%)</strong>`;
  }
};

window.openExamReviewModal = function() {
  const modal = document.getElementById('goetheReviewModal');
  const body = document.getElementById('goetheReviewModalBody');
  if (!modal || !body) return;

  let html = '';

  // 1. LESEN REVIEW
  html += `
    <div class="space-y-3">
      <div class="flex items-center gap-2 pb-2 border-b border-sky-200">
        <span class="text-base">📖</span>
        <h4 class="text-sm font-black text-sky-950 uppercase tracking-wider">Modul Lesen (Reading) Review</h4>
      </div>
  `;
  GOETHE_EXAM_DATA.lesen.forEach((item, idx) => {
    const userAns = examUserAnswers.lesen[idx];
    const isCorrect = (userAns === item.answer);
    html += `
      <div class="p-3.5 bg-white rounded-2xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'} space-y-2 text-xs shadow-2xs">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-wider text-sky-700">${item.teil}</span>
          <span class="text-xs font-black px-2 py-0.5 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}">
            ${isCorrect ? '✅ Correct (+2.5 Pts)' : '❌ Incorrect (0 Pts)'}
          </span>
        </div>
        ${item.context ? `<div class="p-2.5 bg-sky-50/80 rounded-xl border border-sky-100 text-sky-900 font-serif italic whitespace-pre-line text-[11px]">"${escapeHtml(item.context)}"</div>` : ''}
        ${item.situation ? `<div class="p-2 bg-indigo-50/70 rounded-xl text-indigo-950 font-bold text-[11px]">${escapeHtml(item.situation)}</div>` : ''}
        <div class="font-bold text-sky-950">${escapeHtml(item.q)}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div class="p-2 rounded-xl border ${isCorrect ? 'border-emerald-300 bg-white' : 'border-rose-300 bg-white'}">
            <strong>Your Answer:</strong> ${userAns !== undefined ? escapeHtml(item.options[userAns]) : '<em class="text-rose-600">Unanswered</em>'}
          </div>
          <div class="p-2 rounded-xl border border-emerald-300 bg-emerald-50/80 text-emerald-950 font-bold">
            <strong>Official Correct Answer:</strong> ${escapeHtml(item.options[item.answer])}
          </div>
        </div>
        <div class="p-2 bg-sky-50 rounded-xl text-sky-900 text-[11px] leading-relaxed">
          💡 <strong>Explanation:</strong> ${escapeHtml(item.explanation)}
        </div>
      </div>
    `;
  });
  html += `</div>`;

  // 2. HÖREN REVIEW
  html += `
    <div class="space-y-3 mt-6">
      <div class="flex items-center gap-2 pb-2 border-b border-sky-200">
        <span class="text-base">🎧</span>
        <h4 class="text-sm font-black text-sky-950 uppercase tracking-wider">Modul Hören (Listening) Review</h4>
      </div>
  `;
  GOETHE_EXAM_DATA.hoeren.forEach((item, idx) => {
    const userAns = examUserAnswers.hoeren[idx];
    const isCorrect = (userAns === item.answer);
    html += `
      <div class="p-3.5 bg-white rounded-2xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'} space-y-2 text-xs shadow-2xs">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-wider text-sky-700">${item.teil}</span>
          <span class="text-xs font-black px-2 py-0.5 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}">
            ${isCorrect ? '✅ Correct (+2.5 Pts)' : '❌ Incorrect (0 Pts)'}
          </span>
        </div>
        <div class="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-indigo-950 font-mono text-[11px] leading-relaxed">
          🗣️ <strong>Audio Transcript:</strong> "${escapeHtml(item.audioPrompt)}"
        </div>
        <div class="font-bold text-sky-950">${escapeHtml(item.q)}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div class="p-2 rounded-xl border ${isCorrect ? 'border-emerald-300 bg-white' : 'border-rose-300 bg-white'}">
            <strong>Your Answer:</strong> ${userAns !== undefined ? escapeHtml(item.options[userAns]) : '<em class="text-rose-600">Unanswered</em>'}
          </div>
          <div class="p-2 rounded-xl border border-emerald-300 bg-emerald-50/80 text-emerald-950 font-bold">
            <strong>Official Correct Answer:</strong> ${escapeHtml(item.options[item.answer])}
          </div>
        </div>
        <div class="p-2 bg-sky-50 rounded-xl text-sky-900 text-[11px] leading-relaxed">
          💡 <strong>Explanation:</strong> ${escapeHtml(item.explanation)}
        </div>
      </div>
    `;
  });
  html += `</div>`;

  // 3. SCHREIBEN REVIEW
  const nlp = evaluateExamEmailNLP(examUserAnswers.schreibenPart2 || '');
  html += `
    <div class="space-y-3 mt-6">
      <div class="flex items-center gap-2 pb-2 border-b border-sky-200">
        <span class="text-base">✍️</span>
        <h4 class="text-sm font-black text-sky-950 uppercase tracking-wider">Modul Schreiben (Writing) Review</h4>
      </div>

      <!-- Part 1 Form Filling Review -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 space-y-2.5 shadow-2xs">
        <div class="font-black text-xs text-sky-950">Teil 1: Formular ausfüllen (Form Fields)</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          ${GOETHE_EXAM_DATA.schreiben.part1.fields.map((f, fIdx) => {
            const userVal = (examUserAnswers.schreibenPart1[fIdx] || '').trim().toLowerCase();
            const correctVal = f.answer.toLowerCase();
            const isFCorrect = userVal && (userVal.includes(correctVal) || correctVal.includes(userVal));
            return `
              <div class="p-2.5 rounded-xl border ${isFCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'} space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sky-900">${f.label}:</span>
                  <span class="text-[10px] font-black">${isFCorrect ? '✅ +1 Pt' : '❌ 0 Pts'}</span>
                </div>
                <div>Your input: <strong>"${escapeHtml(examUserAnswers.schreibenPart1[fIdx] || '-')}"</strong></div>
                <div class="text-emerald-800">Expected: <strong>"${escapeHtml(f.answer)}"</strong></div>
                <div class="text-[10px] text-sky-700">💡 ${f.explanation}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Part 2 Email Review -->
      <div class="p-4 bg-white rounded-2xl border border-sky-200 space-y-3 shadow-2xs text-xs">
        <div class="flex items-center justify-between">
          <div class="font-black text-xs text-sky-950">Teil 2: E-Mail Composition (${nlp.score} / 10 Pts)</div>
          <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px]">${nlp.wordCount} words</span>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-line leading-relaxed">
          ${escapeHtml(examUserAnswers.schreibenPart2 || 'No email written.')}
        </div>
        <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
          <span class="font-bold text-emerald-950 block">Standard Model Solution (100% Score):</span>
          <p class="font-serif text-[11px] text-emerald-900 whitespace-pre-line leading-relaxed italic">${escapeHtml(GOETHE_EXAM_DATA.schreiben.part2.sampleAnswer)}</p>
        </div>
      </div>
    </div>
  `;

  // 4. SPRECHEN REVIEW
  html += `
    <div class="space-y-3 mt-6">
      <div class="flex items-center gap-2 pb-2 border-b border-sky-200">
        <span class="text-base">🗣️</span>
        <h4 class="text-sm font-black text-sky-950 uppercase tracking-wider">Modul Sprechen (Speaking) Review</h4>
      </div>
  `;
  GOETHE_EXAM_DATA.sprechen.forEach((item, sIdx) => {
    const score = examUserAnswers.sprechenScores[sIdx] !== undefined ? examUserAnswers.sprechenScores[sIdx] : 4;
    const transcript = examUserAnswers.sprechenRecordings[sIdx] || '';
    html += `
      <div class="p-3.5 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-black text-sky-950">${item.teil}</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px]">${score} / 5 Pts</span>
        </div>
        <p class="text-sky-800 text-[11px]">${item.taskDesc}</p>
        ${transcript ? `<div class="p-2 bg-slate-50 rounded-xl border text-[11px] font-mono">Recognized Speech: "${escapeHtml(transcript)}"</div>` : ''}
        <div class="p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 text-indigo-950 text-[11px] leading-relaxed">
          <strong>Official Model Pronunciation:</strong> "${escapeHtml(item.modelSpeech || (item.modelQuestion + ' — ' + item.modelResponse))}"
        </div>
      </div>
    `;
  });
  html += `</div>`;

  body.innerHTML = html;
  modal.classList.remove('hidden');
};

window.closeExamReviewModal = function() {
  const modal = document.getElementById('goetheReviewModal');
  if (modal) modal.classList.add('hidden');
};

// Clean API Aliases
const GERMAN_EXAM_DATA = GOETHE_EXAM_DATA;
window.openGermanExamModal = window.openGoetheExamModal;
window.closeGermanExamModal = window.closeGoetheExamModal;
window.finishGermanExam = window.finishGoetheExam;
window.restartGermanExam = window.restartGoetheExam;
window.openGermanReviewModal = window.openExamReviewModal;
window.closeGermanReviewModal = window.closeExamReviewModal;

  // ================= 31. 3D GERMAN VOCABULARY FLASHCARDS SYSTEM (DUAL-DECK 2,000 WORDS) =================
  const DUAL_FC_STORAGE_KEY = 'netzwerk_flashcards_mastered_v1';
  let srsActiveDeck = 'nouns'; // 'nouns' or 'verbs'
  let srsViewMode = 'card'; // 'card' or 'grid'
  let srsStudyFilter = 'toLearn'; // 'toLearn', 'mastered', 'all'
  let srsActiveCategory = 'all';
  let srsSearchQuery = '';
  let srsCurrentIndex = 0;
  let srsIsFlipped = false;
  let srsGridPage = 1;
  const SRS_GRID_PAGE_SIZE = 24;

  let srsMasteredData = {
    nouns: [],
    verbs: [],
    historyOrder: [] // [{ id, deck, timestamp }] newest first
  };

  function loadSrsMasteredData() {
    try {
      const raw = localStorage.getItem(DUAL_FC_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          srsMasteredData.nouns = Array.isArray(parsed.nouns) ? parsed.nouns : [];
          srsMasteredData.verbs = Array.isArray(parsed.verbs) ? parsed.verbs : [];
          srsMasteredData.historyOrder = Array.isArray(parsed.historyOrder) ? parsed.historyOrder : [];
        }
      }
    } catch(e) {
      console.error('Error loading SRS mastered data:', e);
    }
    updateSrsDashboardBadge();
  }

  function saveSrsMasteredData() {
    try {
      localStorage.setItem(DUAL_FC_STORAGE_KEY, JSON.stringify(srsMasteredData));
    } catch(e) {
      console.error('Error saving SRS mastered data:', e);
    }
    updateSrsDashboardBadge();
  }

  function updateSrsDashboardBadge() {
    const totalMastered = (srsMasteredData.nouns?.length || 0) + (srsMasteredData.verbs?.length || 0);
    const badge = document.getElementById('srsDashboardDueBadge');
    if (badge) {
      badge.textContent = totalMastered > 0 ? `${totalMastered} / 2,000 Mastered ⭐` : '2,000 Words Available';
    }
  }

  function isSrsWordMastered(id, deck = srsActiveDeck) {
    const list = deck === 'verbs' ? srsMasteredData.verbs : srsMasteredData.nouns;
    return list.includes(id);
  }

  function getSrsRawDeckList(deck = srsActiveDeck) {
    if (typeof window.FLASHCARDS_DATA === 'undefined') return [];
    return deck === 'verbs' ? (window.FLASHCARDS_DATA.verbs || []) : (window.FLASHCARDS_DATA.nouns || []);
  }

  function getSrsFilteredList() {
    let list = getSrsRawDeckList(srsActiveDeck);

    // 1. Study Mode Filter
    if (srsStudyFilter === 'toLearn') {
      list = list.filter(item => !isSrsWordMastered(item.id, srsActiveDeck));
    } else if (srsStudyFilter === 'mastered') {
      list = list.filter(item => isSrsWordMastered(item.id, srsActiveDeck));
    }

    // 2. Category Filter
    if (srsActiveCategory !== 'all') {
      list = list.filter(item => item.category === srsActiveCategory);
    }

    // 3. Search Query Filter
    if (srsSearchQuery && srsSearchQuery.trim()) {
      const q = srsSearchQuery.toLowerCase().trim();
      list = list.filter(item => {
        if (srsActiveDeck === 'nouns') {
          return (item.de && item.de.toLowerCase().includes(q)) ||
                 (item.article && item.article.toLowerCase() === q) ||
                 (item.en && item.en.toLowerCase().includes(q)) ||
                 (item.id_trans && item.id_trans.toLowerCase().includes(q)) ||
                 (item.plural && item.plural.toLowerCase().includes(q)) ||
                 (item.category && item.category.toLowerCase().includes(q));
        } else {
          return (item.infinitive && item.infinitive.toLowerCase().includes(q)) ||
                 (item.en && item.en.toLowerCase().includes(q)) ||
                 (item.id_trans && item.id_trans.toLowerCase().includes(q)) ||
                 (item.category && item.category.toLowerCase().includes(q));
        }
      });
    }

    return list;
  }

  function populateSrsCategorySelect() {
    const sel = document.getElementById('srsCategorySelect');
    if (!sel) return;
    const rawList = getSrsRawDeckList(srsActiveDeck);
    const catMap = {};
    rawList.forEach(item => {
      catMap[item.category] = (catMap[item.category] || 0) + 1;
    });
    const categories = Object.keys(catMap).sort();

    let html = `<option value="all">✨ All Categories (${rawList.length} Words)</option>`;
    categories.forEach(c => {
      const isSel = srsActiveCategory === c ? 'selected' : '';
      html += `<option value="${c}" ${isSel}>${c} (${catMap[c]})</option>`;
    });
    sel.innerHTML = html;
  }

  window.openSrsModal = function() {
    loadSrsMasteredData();
    const modal = document.getElementById('srsFlashcardModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    populateSrsCategorySelect();
    renderSrsHeaderAndFilters();
    renderSrsCurrentView();

    window.removeEventListener('keydown', handleSrsKeyboardShortcuts);
    window.addEventListener('keydown', handleSrsKeyboardShortcuts);
  };

  window.closeSrsModal = function() {
    const modal = document.getElementById('srsFlashcardModal');
    if (modal) modal.classList.add('hidden');
    window.removeEventListener('keydown', handleSrsKeyboardShortcuts);
  };

  function handleSrsKeyboardShortcuts(e) {
    const modal = document.getElementById('srsFlashcardModal');
    if (!modal || modal.classList.contains('hidden')) return;

    // Ignore if inside an input or select
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.code === 'Space') {
      e.preventDefault();
      window.flipCurrentSrsCard();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      window.nextSrsCard();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      window.prevSrsCard();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      window.toggleSrsMasterCurrent();
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      window.playSrsWordAudio();
    }
  }

  window.switchSrsDeck = function(deck) {
    if (srsActiveDeck === deck) return;
    srsActiveDeck = deck;
    srsCurrentIndex = 0;
    srsGridPage = 1;
    srsActiveCategory = 'all';
    srsIsFlipped = false;

    populateSrsCategorySelect();
    renderSrsHeaderAndFilters();
    renderSrsCurrentView();
  };

  window.switchSrsView = function(view) {
    srsViewMode = view;
    renderSrsHeaderAndFilters();
    renderSrsCurrentView();
  };

  window.setSrsStudyFilter = function(filter) {
    srsStudyFilter = filter;
    srsCurrentIndex = 0;
    srsGridPage = 1;
    srsIsFlipped = false;
    renderSrsHeaderAndFilters();
    renderSrsCurrentView();
  };

  window.handleSrsSearch = function(query) {
    srsSearchQuery = query;
    srsCurrentIndex = 0;
    srsGridPage = 1;
    renderSrsHeaderAndFilters();
    renderSrsCurrentView();
  };

  window.handleSrsCategory = function(category) {
    srsActiveCategory = category;
    srsCurrentIndex = 0;
    srsGridPage = 1;
    renderSrsHeaderAndFilters();
    renderSrsCurrentView();
  };

  window.resetSrsFilters = function() {
    srsActiveCategory = 'all';
    srsSearchQuery = '';
    srsStudyFilter = 'toLearn';
    const sInput = document.getElementById('srsSearchInput');
    if (sInput) sInput.value = '';
    const catSel = document.getElementById('srsCategorySelect');
    if (catSel) catSel.value = 'all';
    srsCurrentIndex = 0;
    srsGridPage = 1;
    populateSrsCategorySelect();
    renderSrsHeaderAndFilters();
    renderSrsCurrentView();
  };

  function renderSrsHeaderAndFilters() {
    const isNoun = srsActiveDeck === 'nouns';

    // Deck Buttons
    const btnNouns = document.getElementById('srsDeckBtnNouns');
    const btnVerbs = document.getElementById('srsDeckBtnVerbs');
    if (btnNouns) {
      btnNouns.className = isNoun
        ? "px-3 py-1.5 rounded-xl transition-all bg-sky-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer font-bold"
        : "px-3 py-1.5 rounded-xl transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer font-bold";
    }
    if (btnVerbs) {
      btnVerbs.className = !isNoun
        ? "px-3 py-1.5 rounded-xl transition-all bg-purple-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer font-bold"
        : "px-3 py-1.5 rounded-xl transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer font-bold";
    }

    // View Buttons
    const btnCard = document.getElementById('srsViewBtnCard');
    const btnGrid = document.getElementById('srsViewBtnGrid');
    if (btnCard) {
      btnCard.className = srsViewMode === 'card'
        ? "px-3 py-1.5 rounded-xl transition-all bg-slate-800 text-white shadow-xs flex items-center gap-1 cursor-pointer font-bold"
        : "px-3 py-1.5 rounded-xl transition-all bg-white text-slate-600 border border-slate-200 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-bold";
    }
    if (btnGrid) {
      btnGrid.className = srsViewMode === 'grid'
        ? "px-3 py-1.5 rounded-xl transition-all bg-slate-800 text-white shadow-xs flex items-center gap-1 cursor-pointer font-bold"
        : "px-3 py-1.5 rounded-xl transition-all bg-white text-slate-600 border border-slate-200 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-bold";
    }

    // Counts for Current Deck
    const rawList = getSrsRawDeckList(srsActiveDeck);
    const masteredInDeck = isNoun ? srsMasteredData.nouns.length : srsMasteredData.verbs.length;
    const toLearnInDeck = Math.max(0, rawList.length - masteredInDeck);

    const toLearnBadge = document.getElementById('srsToLearnBadge');
    if (toLearnBadge) toLearnBadge.textContent = toLearnInDeck;
    const masteredBadge = document.getElementById('srsMasteredBadge');
    if (masteredBadge) masteredBadge.textContent = masteredInDeck;
    const allBadge = document.getElementById('srsAllBadge');
    if (allBadge) allBadge.textContent = rawList.length;

    // Study Filter Buttons styling
    const fToLearn = document.getElementById('srsFilterBtnToLearn');
    const fMastered = document.getElementById('srsFilterBtnMastered');
    const fAll = document.getElementById('srsFilterBtnAll');
    if (fToLearn) {
      fToLearn.className = srsStudyFilter === 'toLearn'
        ? "px-2.5 py-1 rounded-lg transition-all bg-emerald-600 text-white shadow-2xs flex items-center gap-1 cursor-pointer font-bold"
        : "px-2.5 py-1 rounded-lg transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-bold";
    }
    if (fMastered) {
      fMastered.className = srsStudyFilter === 'mastered'
        ? "px-2.5 py-1 rounded-lg transition-all bg-amber-500 text-white shadow-2xs flex items-center gap-1 cursor-pointer font-bold"
        : "px-2.5 py-1 rounded-lg transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-bold";
    }
    if (fAll) {
      fAll.className = srsStudyFilter === 'all'
        ? "px-2.5 py-1 rounded-lg transition-all bg-slate-800 text-white shadow-2xs flex items-center gap-1 cursor-pointer font-bold"
        : "px-2.5 py-1 rounded-lg transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-bold";
    }

    // Header History Count Badge
    const histBadge = document.getElementById('srsHistoryCountBadge');
    const totalAllMastered = srsMasteredData.nouns.length + srsMasteredData.verbs.length;
    if (histBadge) histBadge.textContent = totalAllMastered;

    // Progress Bar
    const percent = rawList.length > 0 ? ((masteredInDeck / rawList.length) * 100).toFixed(1) : 0;
    const pBar = document.getElementById('srsProgressBar');
    if (pBar) pBar.style.width = `${percent}%`;
    const pText = document.getElementById('srsProgressText');
    if (pText) {
      const deckLabel = isNoun ? 'Nouns' : 'Verbs';
      pText.textContent = `${masteredInDeck} / ${rawList.length} ${deckLabel} Mastered (${percent}%)`;
    }
  }

  function renderSrsCurrentView() {
    const cardArea = document.getElementById('srsCardModeArea');
    const gridArea = document.getElementById('srsGridModeArea');
    const emptyNotice = document.getElementById('srsEmptyNotice');

    const filtered = getSrsFilteredList();

    if (filtered.length === 0) {
      if (cardArea) cardArea.classList.add('hidden');
      if (gridArea) gridArea.classList.add('hidden');
      if (emptyNotice) {
        emptyNotice.classList.remove('hidden');
        const icon = document.getElementById('srsEmptyIcon');
        const title = document.getElementById('srsEmptyTitle');
        const desc = document.getElementById('srsEmptyDesc');
        const raw = getSrsRawDeckList(srsActiveDeck);
        const isAllMastered = srsStudyFilter === 'toLearn' && raw.length > 0 && raw.every(x => isSrsWordMastered(x.id, srsActiveDeck));

        if (isAllMastered) {
          if (icon) icon.textContent = '🎉';
          if (title) title.textContent = 'All Words Mastered in this Deck!';
          if (desc) desc.textContent = 'Congratulations! You have mastered all words. Click below to review them.';
        } else {
          if (icon) icon.textContent = '🔍';
          if (title) title.textContent = 'No words match your filters or search.';
          if (desc) desc.textContent = 'Try clearing your search or switching categories above.';
        }
      }
      return;
    }

    if (emptyNotice) emptyNotice.classList.add('hidden');

    if (srsViewMode === 'card') {
      if (cardArea) cardArea.classList.remove('hidden');
      if (gridArea) gridArea.classList.add('hidden');
      renderSrsCardView(filtered);
    } else {
      if (cardArea) cardArea.classList.add('hidden');
      if (gridArea) gridArea.classList.remove('hidden');
      renderSrsGridExplorer(filtered);
    }
  }

  function renderSrsCardView(list) {
    if (!list || list.length === 0) return;
    if (srsCurrentIndex >= list.length) srsCurrentIndex = 0;
    if (srsCurrentIndex < 0) srsCurrentIndex = list.length - 1;

    const card = list[srsCurrentIndex];
    const isNoun = srsActiveDeck === 'nouns';
    const isMastered = isSrsWordMastered(card.id, srsActiveDeck);

    // Reset flip
    const inner = document.getElementById('srsFlashcardInner');
    if (inner) {
      inner.classList.remove('flipped');
      srsIsFlipped = false;
    }

    // Counter
    const counter = document.getElementById('srsCardCounter');
    if (counter) counter.textContent = `${srsCurrentIndex + 1} / ${list.length}`;

    // FRONT ELEMENTS
    const frontWord = document.getElementById('srsFrontWord');
    const frontArticle = document.getElementById('srsFrontArticleBadge');
    const frontType = document.getElementById('srsFrontTypeBadge');
    const frontCat = document.getElementById('srsFrontCategoryBadge');
    const frontPlural = document.getElementById('srsFrontPluralHint');
    const frontVerbHint = document.getElementById('srsFrontVerbConjugationHint');

    if (frontCat) frontCat.textContent = card.category;

    if (isNoun) {
      if (frontWord) {
        let colorCls = 'text-sky-800';
        if (card.article === 'die') colorCls = 'text-rose-700';
        if (card.article === 'das') colorCls = 'text-emerald-800';
        frontWord.className = `text-3xl sm:text-4xl font-black ${colorCls} tracking-tight select-all`;
        frontWord.textContent = `${card.article} ${card.de}`;
      }
      if (frontArticle) {
        frontArticle.classList.remove('hidden');
        frontArticle.textContent = card.article;
        if (card.article === 'der') {
          frontArticle.className = 'px-3 py-1 rounded-xl text-xs font-black uppercase bg-sky-500 text-white shadow-2xs';
        } else if (card.article === 'die') {
          frontArticle.className = 'px-3 py-1 rounded-xl text-xs font-black uppercase bg-rose-500 text-white shadow-2xs';
        } else if (card.article === 'das') {
          frontArticle.className = 'px-3 py-1 rounded-xl text-xs font-black uppercase bg-emerald-500 text-white shadow-2xs';
        }
      }
      if (frontType) frontType.classList.add('hidden');
      if (frontPlural) {
        frontPlural.classList.remove('hidden');
        frontPlural.textContent = `Plural: ${card.plural || '-'}`;
      }
      if (frontVerbHint) frontVerbHint.classList.add('hidden');
    } else {
      // Verbs
      if (frontWord) {
        frontWord.className = 'text-3xl sm:text-4xl font-black text-purple-950 tracking-tight select-all';
        frontWord.textContent = card.infinitive;
      }
      if (frontArticle) {
        frontArticle.className = 'px-3 py-1 rounded-xl text-xs font-black uppercase bg-purple-600 text-white shadow-2xs';
        frontArticle.textContent = '⚡ Verb';
      }
      if (frontType) {
        if (card.vokalwechsel) {
          frontType.classList.remove('hidden');
          frontType.textContent = '⚠️ Vokalwechsel';
          frontType.className = 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200';
        } else if (card.irregular) {
          frontType.classList.remove('hidden');
          frontType.textContent = 'Irregular';
          frontType.className = 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200';
        } else {
          frontType.classList.add('hidden');
        }
      }
      if (frontPlural) frontPlural.classList.add('hidden');
      if (frontVerbHint && card.conjugation) {
        frontVerbHint.classList.remove('hidden');
        frontVerbHint.textContent = `ich ${card.conjugation.ich} • du ${card.conjugation.du}`;
      }
    }

    // BACK ELEMENTS
    const backEn = document.getElementById('srsBackEnglish');
    const backId = document.getElementById('srsBackIndonesian');
    const nounBackSec = document.getElementById('srsNounBackSection');
    const verbBackSec = document.getElementById('srsVerbBackSection');
    const pluralFull = document.getElementById('srsBackPluralFull');
    const vokalBadge = document.getElementById('srsVerbVokalwechselBadge');

    const exDe = document.getElementById('srsBackExampleDe');
    const exEn = document.getElementById('srsBackExampleEn');
    const exId = document.getElementById('srsBackExampleId');

    if (backEn) backEn.textContent = card.en || '-';
    if (backId) backId.textContent = `🇮🇩 ${card.id_trans || '-'}`;

    if (isNoun) {
      if (nounBackSec) nounBackSec.classList.remove('hidden');
      if (verbBackSec) verbBackSec.classList.add('hidden');
      if (pluralFull) pluralFull.textContent = card.plural || '-';
    } else {
      if (nounBackSec) nounBackSec.classList.add('hidden');
      if (verbBackSec) verbBackSec.classList.remove('hidden');

      if (vokalBadge) {
        if (card.vokalwechsel) vokalBadge.classList.remove('hidden');
        else vokalBadge.classList.add('hidden');
      }

      if (card.conjugation) {
        const c = card.conjugation;
        const ichEl = document.getElementById('srsVcIch');
        const duEl = document.getElementById('srsVcDu');
        const erEl = document.getElementById('srsVcEr');
        const wirEl = document.getElementById('srsVcWir');
        const ihrEl = document.getElementById('srsVcIhr');
        const sieEl = document.getElementById('srsVcSie');

        if (ichEl) ichEl.textContent = c.ich || '-';
        if (duEl) {
          duEl.textContent = c.du || '-';
          if (card.vokalwechsel) duEl.parentElement.className = 'p-1 rounded bg-amber-100 border border-amber-300 text-amber-950 font-black';
          else duEl.parentElement.className = 'p-1 rounded bg-slate-50 border border-slate-100';
        }
        if (erEl) {
          erEl.textContent = c.er || '-';
          if (card.vokalwechsel) erEl.parentElement.className = 'p-1 rounded bg-amber-100 border border-amber-300 text-amber-950 font-black';
          else erEl.parentElement.className = 'p-1 rounded bg-slate-50 border border-slate-100';
        }
        if (wirEl) wirEl.textContent = c.wir || '-';
        if (ihrEl) ihrEl.textContent = c.ihr || '-';
        if (sieEl) sieEl.textContent = c.sie || '-';
      }
    }

    if (card.example) {
      if (exDe) exDe.textContent = `"${card.example.de || ''}"`;
      if (exEn) exEn.textContent = `"${card.example.en || ''}"`;
      if (exId) exId.textContent = `"${card.example.id || ''}"`;
    }

    // Update Star Buttons (Front, Back, Controls)
    updateSrsStarButtonUI(isMastered);
  }

  function updateSrsStarButtonUI(isMastered) {
    const fBtn = document.getElementById('srsFrontStarBtn');
    const fIcon = document.getElementById('srsFrontStarIcon');
    const fText = document.getElementById('srsFrontStarText');

    const bBtn = document.getElementById('srsBackStarBtn');
    const bIcon = document.getElementById('srsBackStarIcon');
    const bText = document.getElementById('srsBackStarText');

    const cBtn = document.getElementById('srsControlsStarBtn');
    const cIcon = document.getElementById('srsControlsStarIcon');
    const cText = document.getElementById('srsControlsStarText');

    const activeCls = 'px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-400 bg-amber-200 text-amber-950 shadow-xs transition flex items-center gap-1 cursor-pointer';
    const inactiveCls = 'px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-amber-50 text-slate-600 transition flex items-center gap-1 cursor-pointer';

    const cActiveCls = 'px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md transition flex items-center gap-1.5 border border-amber-400 bg-amber-400 text-amber-950 cursor-pointer';
    const cInactiveCls = 'px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 cursor-pointer';

    if (fBtn) fBtn.className = isMastered ? activeCls : inactiveCls;
    if (fIcon) fIcon.textContent = isMastered ? '⭐' : '☆';
    if (fText) fText.textContent = isMastered ? 'Mastered ✓' : 'Master';

    if (bBtn) bBtn.className = isMastered ? activeCls : inactiveCls;
    if (bIcon) bIcon.textContent = isMastered ? '⭐' : '☆';
    if (bText) bText.textContent = isMastered ? 'Mastered ✓' : 'Master';

    if (cBtn) cBtn.className = isMastered ? cActiveCls : cInactiveCls;
    if (cIcon) cIcon.textContent = isMastered ? '⭐' : '☆';
    if (cText) cText.textContent = isMastered ? 'Mastered (Done ✓)' : 'Mark Mastered (M)';
  }

  window.flipCurrentSrsCard = function() {
    const inner = document.getElementById('srsFlashcardInner');
    if (!inner) return;
    srsIsFlipped = !srsIsFlipped;
    if (srsIsFlipped) {
      inner.classList.add('flipped');
    } else {
      inner.classList.remove('flipped');
    }
  };

  window.nextSrsCard = function() {
    const list = getSrsFilteredList();
    if (list.length === 0) return;
    srsCurrentIndex++;
    if (srsCurrentIndex >= list.length) srsCurrentIndex = 0;
    renderSrsCardView(list);
  };

  window.prevSrsCard = function() {
    const list = getSrsFilteredList();
    if (list.length === 0) return;
    srsCurrentIndex--;
    if (srsCurrentIndex < 0) srsCurrentIndex = list.length - 1;
    renderSrsCardView(list);
  };

  window.shuffleSrsDeck = function() {
    const list = getSrsFilteredList();
    if (list.length > 1) {
      srsCurrentIndex = Math.floor(Math.random() * list.length);
      renderSrsCardView(list);
      showFloatingToast('🔀 Deck shuffled!');
    }
  };

  window.toggleSrsMasterCurrent = function() {
    const list = getSrsFilteredList();
    if (list.length === 0) return;
    const card = list[srsCurrentIndex];
    if (!card) return;

    const isNoun = srsActiveDeck === 'nouns';
    const arr = isNoun ? srsMasteredData.nouns : srsMasteredData.verbs;
    const existingIdx = arr.indexOf(card.id);

    let isNowMastered = false;
    if (existingIdx >= 0) {
      // Unmark
      arr.splice(existingIdx, 1);
      srsMasteredData.historyOrder = srsMasteredData.historyOrder.filter(e => !(e.id === card.id && e.deck === srsActiveDeck));
      isNowMastered = false;
      showFloatingToast(`Returned "${card.de || card.infinitive}" to practice deck`);
    } else {
      // Mark as Mastered
      arr.unshift(card.id);
      srsMasteredData.historyOrder.unshift({
        id: card.id,
        deck: srsActiveDeck,
        timestamp: Date.now()
      });
      isNowMastered = true;
      if (typeof awardXP === 'function') awardXP(10, 'Vocabulary Mastered ⭐');
      showFloatingToast(`⭐ Mastered "${card.de || card.infinitive}"!`);
    }

    saveSrsMasteredData();
    renderSrsHeaderAndFilters();
    updateSrsStarButtonUI(isNowMastered);

    // If currently in Grid mode, re-render grid
    if (srsViewMode === 'grid') {
      renderSrsGridExplorer(getSrsFilteredList());
    }
  };

  window.playSrsWordAudio = function() {
    const list = getSrsFilteredList();
    if (list.length === 0) return;
    const card = list[srsCurrentIndex];
    if (!card) return;

    const phrase = srsActiveDeck === 'nouns' ? `${card.article} ${card.de}` : card.infinitive;
    if (typeof playGermanSpeech === 'function') {
      playGermanSpeech(phrase);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(phrase);
      u.lang = 'de-DE';
      window.speechSynthesis.speak(u);
    }
  };

  window.playSrsSentenceAudio = function() {
    const list = getSrsFilteredList();
    if (list.length === 0) return;
    const card = list[srsCurrentIndex];
    if (!card || !card.example) return;

    const phrase = card.example.de;
    if (typeof playGermanSpeech === 'function') {
      playGermanSpeech(phrase);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(phrase);
      u.lang = 'de-DE';
      window.speechSynthesis.speak(u);
    }
  };

  function renderSrsGridExplorer(list) {
    const container = document.getElementById('srsGridContainer');
    const pagination = document.getElementById('srsGridPagination');
    if (!container) return;

    const totalPages = Math.ceil(list.length / SRS_GRID_PAGE_SIZE) || 1;
    if (srsGridPage > totalPages) srsGridPage = totalPages;
    if (srsGridPage < 1) srsGridPage = 1;

    const start = (srsGridPage - 1) * SRS_GRID_PAGE_SIZE;
    const pageItems = list.slice(start, start + SRS_GRID_PAGE_SIZE);

    const isNoun = srsActiveDeck === 'nouns';

    let html = '';
    pageItems.forEach((item, idx) => {
      const isMastered = isSrsWordMastered(item.id, srsActiveDeck);
      let badgeCls = 'bg-purple-600 text-white';
      let wordTitle = item.infinitive;
      let extraHint = item.vokalwechsel ? '⚠️ Vokalwechsel' : (item.irregular ? 'Irregular' : '');

      if (isNoun) {
        if (item.article === 'der') badgeCls = 'bg-sky-500 text-white';
        else if (item.article === 'die') badgeCls = 'bg-rose-500 text-white';
        else if (item.article === 'das') badgeCls = 'bg-emerald-500 text-white';
        wordTitle = `${item.article} ${item.de}`;
        extraHint = item.plural ? `Pl: ${item.plural}` : '';
      }

      const speakText = isNoun ? `${item.article} ${item.de}` : item.infinitive;

      html += `
        <div class="p-3 rounded-2xl bg-white border ${isMastered ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'} hover:shadow-md transition flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="${badgeCls} px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs">${isNoun ? item.article : 'Verb'}</span>
            <div class="flex items-center gap-1">
              <button onclick="toggleSrsGridMaster('${item.id}'); event.stopPropagation();" class="p-1 rounded-lg hover:bg-amber-100 text-xs transition cursor-pointer" title="${isMastered ? 'Marked as Mastered' : 'Mark as Mastered'}">
                ${isMastered ? '⭐' : '☆'}
              </button>
              <button onclick="playGermanSpeech('${speakText.replace(/'/g, "\\'")}'); event.stopPropagation();" class="p-1 rounded-lg hover:bg-sky-100 text-sky-700 text-xs transition cursor-pointer" title="Pronounce">
                🔊
              </button>
            </div>
          </div>

          <div>
            <h4 class="font-black text-sm text-slate-900 leading-tight">${wordTitle}</h4>
            <p class="text-[11px] font-medium text-slate-600 truncate">${item.en || ''}</p>
            <p class="text-[10px] font-semibold text-pink-700 truncate">🇮🇩 ${item.id_trans || ''}</p>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
            <span class="truncate max-w-[100px]">${item.category}</span>
            <span class="font-mono font-bold text-slate-500">${extraHint}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Pagination controls
    if (pagination) {
      pagination.innerHTML = `
        <button onclick="changeSrsGridPage(${srsGridPage - 1})" class="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 ${srsGridPage <= 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-slate-100 cursor-pointer'}">
          ◀ Prev
        </button>
        <span class="text-xs font-bold text-slate-600 px-2">Page ${srsGridPage} of ${totalPages} (${list.length} words)</span>
        <button onclick="changeSrsGridPage(${srsGridPage + 1})" class="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 ${srsGridPage >= totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-slate-100 cursor-pointer'}">
          Next ▶
        </button>
      `;
    }
  }

  window.changeSrsGridPage = function(page) {
    srsGridPage = page;
    renderSrsGridExplorer(getSrsFilteredList());
  };

  window.toggleSrsGridMaster = function(id) {
    const isNoun = srsActiveDeck === 'nouns';
    const arr = isNoun ? srsMasteredData.nouns : srsMasteredData.verbs;
    const idx = arr.indexOf(id);

    if (idx >= 0) {
      arr.splice(idx, 1);
      srsMasteredData.historyOrder = srsMasteredData.historyOrder.filter(e => !(e.id === id && e.deck === srsActiveDeck));
      showFloatingToast('Word returned to practice deck');
    } else {
      arr.unshift(id);
      srsMasteredData.historyOrder.unshift({
        id: id,
        deck: srsActiveDeck,
        timestamp: Date.now()
      });
      if (typeof awardXP === 'function') awardXP(10, 'Vocabulary Mastered ⭐');
      showFloatingToast('⭐ Word marked as Mastered!');
    }

    saveSrsMasteredData();
    renderSrsHeaderAndFilters();
    renderSrsGridExplorer(getSrsFilteredList());
  };

  // ================= 31b. MASTERED VOCABULARY HISTORY & PRINTABLE STUDY SHEET =================
  let srsHistoryFilter = 'all'; // 'all', 'nouns', 'verbs'
  let srsHistorySearchQuery = '';

  window.openSrsHistoryModal = function() {
    loadSrsMasteredData();
    const modal = document.getElementById('srsHistoryModal');
    if (!modal) return;
    srsHistoryFilter = 'all';
    srsHistorySearchQuery = '';
    const inp = document.getElementById('srsHistSearchInput');
    if (inp) inp.value = '';

    updateSrsHistoryStats();
    renderSrsHistoryList();
    modal.classList.remove('hidden');
  };

  window.closeSrsHistoryModal = function() {
    const modal = document.getElementById('srsHistoryModal');
    if (modal) modal.classList.add('hidden');
  };

  window.setSrsHistoryFilter = function(filter) {
    srsHistoryFilter = filter;
    ['all', 'nouns', 'verbs'].forEach(f => {
      const btn = document.getElementById(`srsHistFilter${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (btn) {
        btn.className = f === filter
          ? "px-3 py-1 rounded-lg bg-white text-slate-800 shadow-xs cursor-pointer font-bold"
          : "px-3 py-1 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer font-bold";
      }
    });
    renderSrsHistoryList();
  };

  window.handleSrsHistorySearch = function(query) {
    srsHistorySearchQuery = (query || '').toLowerCase().trim();
    renderSrsHistoryList();
  };

  function getMasteredWordsList(filter = srsHistoryFilter) {
    const result = [];
    if (typeof window.FLASHCARDS_DATA === 'undefined') return result;

    const nounMap = new Map();
    (window.FLASHCARDS_DATA.nouns || []).forEach(n => nounMap.set(n.id, n));

    const verbMap = new Map();
    (window.FLASHCARDS_DATA.verbs || []).forEach(v => verbMap.set(v.id, v));

    // Follow historyOrder sequence (newest first)
    const seen = new Set();
    (srsMasteredData.historyOrder || []).forEach(entry => {
      const key = `${entry.deck}_${entry.id}`;
      if (seen.has(key)) return;
      seen.add(key);

      if (filter === 'all' || filter === entry.deck) {
        if (entry.deck === 'nouns' && srsMasteredData.nouns.includes(entry.id)) {
          const item = nounMap.get(entry.id);
          if (item) result.push({ ...item, deckType: 'nouns', timestamp: entry.timestamp });
        } else if (entry.deck === 'verbs' && srsMasteredData.verbs.includes(entry.id)) {
          const item = verbMap.get(entry.id);
          if (item) result.push({ ...item, deckType: 'verbs', timestamp: entry.timestamp });
        }
      }
    });

    // Fallback if historyOrder missed any items
    if (filter === 'all' || filter === 'nouns') {
      srsMasteredData.nouns.forEach(id => {
        if (!seen.has(`nouns_${id}`)) {
          const item = nounMap.get(id);
          if (item) result.push({ ...item, deckType: 'nouns', timestamp: 0 });
        }
      });
    }
    if (filter === 'all' || filter === 'verbs') {
      srsMasteredData.verbs.forEach(id => {
        if (!seen.has(`verbs_${id}`)) {
          const item = verbMap.get(id);
          if (item) result.push({ ...item, deckType: 'verbs', timestamp: 0 });
        }
      });
    }

    return result;
  }

  function updateSrsHistoryStats() {
    const tTotal = document.getElementById('srsHistTotalCount');
    const tNouns = document.getElementById('srsHistNounCount');
    const tVerbs = document.getElementById('srsHistVerbCount');
    const nCnt = srsMasteredData.nouns.length;
    const vCnt = srsMasteredData.verbs.length;

    if (tTotal) tTotal.textContent = nCnt + vCnt;
    if (tNouns) tNouns.textContent = nCnt;
    if (tVerbs) tVerbs.textContent = vCnt;
  }

  function renderSrsHistoryList() {
    const container = document.getElementById('srsHistoryListContainer');
    const summary = document.getElementById('srsHistoryFooterSummary');
    if (!container) return;

    let words = getMasteredWordsList(srsHistoryFilter);
    if (srsHistorySearchQuery) {
      const q = srsHistorySearchQuery;
      words = words.filter(w => {
        return (w.de && w.de.toLowerCase().includes(q)) ||
               (w.infinitive && w.infinitive.toLowerCase().includes(q)) ||
               (w.en && w.en.toLowerCase().includes(q)) ||
               (w.id_trans && w.id_trans.toLowerCase().includes(q)) ||
               (w.article && w.article.toLowerCase().includes(q)) ||
               (w.category && w.category.toLowerCase().includes(q));
      });
    }

    if (summary) summary.textContent = `${words.length} mastered words shown (newest at top)`;

    if (words.length === 0) {
      container.innerHTML = `
        <div class="py-12 px-4 text-center space-y-2">
          <div class="text-3xl">🌟</div>
          <h4 class="font-bold text-slate-800 text-sm">No Mastered Words Found</h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            Click the "⭐ Mark Mastered" button on any flashcard while studying. Your mastered vocabulary will appear here with audio and printable study sheets!
          </p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
              <th class="p-2.5 w-10 text-center">#</th>
              <th class="p-2.5">German Word</th>
              <th class="p-2.5">Details</th>
              <th class="p-2.5">Translation</th>
              <th class="p-2.5">Category</th>
              <th class="p-2.5 hidden sm:table-cell">Example Sentence</th>
              <th class="p-2.5 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
    `;

    words.forEach((w, idx) => {
      const isNoun = w.deckType === 'nouns';
      let badgeCls = 'bg-purple-600 text-white';
      let wordTitle = w.infinitive;
      let details = w.vokalwechsel ? '⚠️ Vokalwechsel' : (w.irregular ? 'Irregular' : 'Regular Verb');

      if (isNoun) {
        if (w.article === 'der') badgeCls = 'bg-sky-500 text-white';
        else if (w.article === 'die') badgeCls = 'bg-rose-500 text-white';
        else if (w.article === 'das') badgeCls = 'bg-emerald-500 text-white';
        wordTitle = `${w.article} ${w.de}`;
        details = w.plural ? `Plural: ${w.plural}` : '-';
      }

      const speakText = isNoun ? `${w.article} ${w.de}` : w.infinitive;
      const exDe = w.example?.de || '-';

      html += `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-2.5 text-center text-slate-400 font-mono text-[11px]">${idx + 1}</td>
          <td class="p-2.5 font-bold text-slate-900">
            <div class="flex items-center gap-1.5">
              <span class="${badgeCls} px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-2xs">${isNoun ? w.article : 'Verb'}</span>
              <span>${wordTitle}</span>
            </div>
          </td>
          <td class="p-2.5 text-slate-600 font-mono text-[11px]">${details}</td>
          <td class="p-2.5 text-slate-700">
            <div>${w.en || '-'}</div>
            <div class="text-[10px] text-pink-700 font-semibold">🇮🇩 ${w.id_trans || '-'}</div>
          </td>
          <td class="p-2.5 text-slate-500 text-[11px]">${w.category || '-'}</td>
          <td class="p-2.5 text-slate-500 italic hidden sm:table-cell max-w-xs truncate" title="${exDe}">
            ${exDe}
          </td>
          <td class="p-2.5 text-center">
            <div class="flex items-center justify-center gap-1">
              <button onclick="playGermanSpeech('${speakText.replace(/'/g, "\\'")}'); event.stopPropagation();" class="p-1 rounded-lg hover:bg-sky-100 text-sky-700 transition cursor-pointer" title="Pronounce">
                🔊
              </button>
              <button onclick="removeMasteredWord('${w.id}', '${w.deckType}'); event.stopPropagation();" class="p-1 rounded-lg hover:bg-rose-100 text-rose-500 transition cursor-pointer" title="Remove from Mastered">
                ✕
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  window.removeMasteredWord = function(id, deck) {
    const arr = deck === 'nouns' ? srsMasteredData.nouns : srsMasteredData.verbs;
    const idx = arr.indexOf(id);
    if (idx >= 0) {
      arr.splice(idx, 1);
      srsMasteredData.historyOrder = srsMasteredData.historyOrder.filter(e => !(e.id === id && e.deck === deck));
      saveSrsMasteredData();
      updateSrsHistoryStats();
      renderSrsHistoryList();
      renderSrsHeaderAndFilters();
      renderSrsCurrentView();
      showFloatingToast('Word returned to practice deck');
    }
  };

  window.resetSrsMastered = function(deck = 'current') {
    const targetDeck = deck === 'all' ? 'all' : srsActiveDeck;
    const count = targetDeck === 'all'
      ? (srsMasteredData.nouns.length + srsMasteredData.verbs.length)
      : (targetDeck === 'nouns' ? srsMasteredData.nouns.length : srsMasteredData.verbs.length);

    if (count === 0) {
      showFloatingToast('No mastered words to reset');
      return;
    }

    const msg = targetDeck === 'all'
      ? `Are you sure you want to reset all ${count} mastered words?\n\nThey will all return to your practice decks.`
      : `Are you sure you want to reset all ${count} mastered ${targetDeck}?\n\nThey will return to your practice deck.`;

    if (!confirm(msg)) return;

    if (targetDeck === 'all') {
      srsMasteredData.nouns = [];
      srsMasteredData.verbs = [];
      srsMasteredData.historyOrder = [];
    } else if (targetDeck === 'nouns') {
      srsMasteredData.nouns = [];
      srsMasteredData.historyOrder = srsMasteredData.historyOrder.filter(e => e.deck !== 'nouns');
    } else {
      srsMasteredData.verbs = [];
      srsMasteredData.historyOrder = srsMasteredData.historyOrder.filter(e => e.deck !== 'verbs');
    }

    saveSrsMasteredData();
    updateSrsHistoryStats();
    renderSrsHistoryList();
    renderSrsHeaderAndFilters();
    renderSrsCurrentView();
    showFloatingToast('🔄 Mastered words have been reset to the practice deck!');
  };

  window.printSrsStudySheet = function() {
    const words = getMasteredWordsList(srsHistoryFilter || 'all');
    if (words.length === 0) {
      alert('No mastered words to print yet! Mark some words as mastered first.');
      return;
    }

    const nCnt = words.filter(w => w.deckType === 'nouns').length;
    const vCnt = words.filter(w => w.deckType === 'verbs').length;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = words.map((w, idx) => {
      const isNoun = w.deckType === 'nouns';
      let badgeBg = '#8b5cf6'; // purple
      let badgeText = 'Verb';
      let wordText = w.infinitive;
      let details = w.vokalwechsel ? 'Vokalwechsel' : (w.irregular ? 'Irregular' : 'Regular Verb');

      if (isNoun) {
        if (w.article === 'der') { badgeBg = '#0284c7'; badgeText = 'der'; }
        else if (w.article === 'die') { badgeBg = '#e11d48'; badgeText = 'die'; }
        else if (w.article === 'das') { badgeBg = '#059669'; badgeText = 'das'; }
        wordText = `${w.article} ${w.de}`;
        details = w.plural ? `Pl: ${w.plural}` : '-';
      }

      const ex = w.example ? `${w.example.de}<br><small style="color:#64748b;">${w.example.en} • 🇮🇩 ${w.example.id}</small>` : '-';

      return `
        <tr>
          <td style="text-align:center;color:#64748b;font-weight:bold;">${idx + 1}</td>
          <td>
            <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:8pt;font-weight:bold;color:#fff;background:${badgeBg};margin-right:6px;">${badgeText}</span>
            <b style="font-size:10pt;">${wordText}</b>
          </td>
          <td style="font-family:monospace;font-size:8.5pt;">${details}</td>
          <td><b>${w.en || '-'}</b><br><small style="color:#be185d;">🇮🇩 ${w.id_trans || '-'}</small></td>
          <td style="color:#475569;font-size:8.5pt;">${w.category || '-'}</td>
          <td style="font-size:8.5pt;">${ex}</td>
        </tr>
      `;
    }).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>German A1 Mastered Vocabulary Study Sheet</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #0f172a; }
          .header-banner { background: #be185d; color: white; padding: 16px 20px; border-radius: 12px; margin-bottom: 16px; }
          .header-banner h1 { margin: 0 0 4px 0; font-size: 18pt; font-weight: 900; }
          .header-banner p { margin: 0; font-size: 9.5pt; opacity: 0.9; }
          .info-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 9pt; }
          .legend { display: flex; gap: 14px; font-weight: bold; font-size: 8.5pt; margin-top: 4px; }
          .legend span { display: inline-flex; align-items: center; gap: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9pt; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; color: #334155; }
          td { border: 1px solid #e2e8f0; padding: 7px 9px; vertical-align: top; }
          tr:nth-child(even) { background-color: #f8fafc; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:12px;display:flex;justify-content:flex-end;">
          <button onclick="window.print()" style="padding:8px 16px;background:#be185d;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">🖨️ Print / Save as PDF</button>
        </div>

        <div class="header-banner">
          <h1>🧠 CHEEYA GERMAN A1 - MASTERED VOCABULARY</h1>
          <p>Official 3D Flashcard Mastery Record • Netzwerk Neu Curriculum</p>
        </div>

        <div class="info-box">
          <div>
            <b>Total Mastered:</b> ${words.length} words (${nCnt} Nouns, ${vCnt} Verbs)
            <div class="legend">
              <span style="color:#0284c7;">■ der (Maskulin)</span>
              <span style="color:#e11d48;">■ die (Feminin)</span>
              <span style="color:#059669;">■ das (Netral)</span>
              <span style="color:#8b5cf6;">■ Verben (Verb)</span>
            </div>
          </div>
          <div style="text-align:right;">
            <b>Export Date:</b> ${dateStr}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:30px;text-align:center;">#</th>
              <th style="width:160px;">German Word</th>
              <th style="width:110px;">Details</th>
              <th style="width:130px;">Translations</th>
              <th style="width:100px;">Category</th>
              <th>Example Sentence</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      alert('Pop-up blocked! Please allow pop-ups for this site to print the study sheet.');
    }
  };

  // ================= 32. MASTER GRAMMAR REFERENCE CHEAT-SHEET & PRINTABLE PDF =================
  const GRAMMAR_TABLES = {
    articles: `
      <div class="space-y-4">
        <div class="border-b pb-2">
          <h4 class="text-sm font-black text-sky-950">🎨 German Noun Gender Guide: Der, Die, Das</h4>
          <p class="text-xs text-sky-700">German assigns grammatical gender to every noun. Learn the noun endings to instantly identify the article!</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Masculine -->
          <div class="p-3.5 bg-blue-50/80 rounded-2xl border-2 border-blue-300 space-y-2">
            <div class="flex items-center justify-between font-black text-blue-950 text-xs">
              <span>🔵 Maskulin: DER</span>
              <span class="text-[10px] bg-blue-200 px-2 py-0.5 rounded-full">~34% of Nouns</span>
            </div>
            <ul class="text-[11px] text-blue-900 space-y-1 font-medium">
              <li>• <strong>-er</strong>: <em>der Computer, der Fahrer</em></li>
              <li>• <strong>-or</strong>: <em>der Motor, der Professor</em></li>
              <li>• <strong>-ling</strong>: <em>der Schmetterling</em></li>
              <li>• <strong>-ismus</strong>: <em>der Optimismus</em></li>
              <li>• Days, months & seasons: <em>der Montag, der Mai, der Sommer</em></li>
            </ul>
          </div>

          <!-- Feminine -->
          <div class="p-3.5 bg-rose-50/80 rounded-2xl border-2 border-rose-300 space-y-2">
            <div class="flex items-center justify-between font-black text-rose-950 text-xs">
              <span>🔴 Feminin: DIE</span>
              <span class="text-[10px] bg-rose-200 px-2 py-0.5 rounded-full">~46% of Nouns</span>
            </div>
            <ul class="text-[11px] text-rose-900 space-y-1 font-medium">
              <li>• <strong>-ung</strong>: <em>die Zeitung, die Wohnung</em></li>
              <li>• <strong>-heit / -keit</strong>: <em>die Freiheit, die Möglichkeit</em></li>
              <li>• <strong>-schaft</strong>: <em>die Freundschaft</em></li>
              <li>• <strong>-tion</strong>: <em>die Station, die Lektion</em></li>
              <li>• <strong>-ei</strong>: <em>die Bäckerei</em></li>
              <li>• <strong>-in</strong> (female professions): <em>die Ärztin</em></li>
            </ul>
          </div>

          <!-- Neuter -->
          <div class="p-3.5 bg-emerald-50/80 rounded-2xl border-2 border-emerald-300 space-y-2">
            <div class="flex items-center justify-between font-black text-emerald-950 text-xs">
              <span>🟢 Neutral: DAS</span>
              <span class="text-[10px] bg-emerald-200 px-2 py-0.5 rounded-full">~20% of Nouns</span>
            </div>
            <ul class="text-[11px] text-emerald-900 space-y-1 font-medium">
              <li>• <strong>-chen / -lein</strong>: <em>das Mädchen, das Brötchen</em></li>
              <li>• <strong>-ment</strong>: <em>das Instrument, das Dokument</em></li>
              <li>• <strong>-um</strong>: <em>das Zentrum, das Museum</em></li>
              <li>• Nominalized verbs: <em>das Essen, das Leben</em></li>
            </ul>
          </div>
        </div>
      </div>
    `,
    cases: `
      <div class="space-y-4">
        <div class="border-b pb-2">
          <h4 class="text-sm font-black text-sky-950">📐 Complete German Case Matrix (A1 Level)</h4>
          <p class="text-xs text-sky-700">The definitive reference across Nominativ (Subject), Akkusativ (Direct Object), and Dativ (Indirect Object).</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-sky-100 text-sky-950">
                <th class="p-2 border border-sky-300">Case / Function</th>
                <th class="p-2 border border-sky-300 text-blue-900">Maskulin</th>
                <th class="p-2 border border-sky-300 text-rose-900">Feminin</th>
                <th class="p-2 border border-sky-300 text-emerald-900">Neutral</th>
                <th class="p-2 border border-sky-300 text-purple-900">Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr class="bg-white">
                <td class="p-2 border border-sky-200 font-bold">1. Nominativ (Subject / Wer?)</td>
                <td class="p-2 border border-sky-200 font-mono text-blue-800">der / ein / kein</td>
                <td class="p-2 border border-sky-200 font-mono text-rose-800">die / eine / keine</td>
                <td class="p-2 border border-sky-200 font-mono text-emerald-800">das / ein / kein</td>
                <td class="p-2 border border-sky-200 font-mono text-purple-800">die / - / keine</td>
              </tr>
              <tr class="bg-sky-50/50">
                <td class="p-2 border border-sky-200 font-bold">2. Akkusativ (Direct Object / Wen?)</td>
                <td class="p-2 border border-sky-200 font-mono font-bold text-amber-700 bg-amber-50/60">den / einen / keinen</td>
                <td class="p-2 border border-sky-200 font-mono text-rose-800">die / eine / keine</td>
                <td class="p-2 border border-sky-200 font-mono text-emerald-800">das / ein / kein</td>
                <td class="p-2 border border-sky-200 font-mono text-purple-800">die / - / keine</td>
              </tr>
              <tr class="bg-white">
                <td class="p-2 border border-sky-200 font-bold">3. Dativ (Indirect Object / Wem?)</td>
                <td class="p-2 border border-sky-200 font-mono font-bold text-purple-800 bg-purple-50/60">dem / einem / keinem</td>
                <td class="p-2 border border-sky-200 font-mono font-bold text-purple-800 bg-purple-50/60">der / einer / keiner</td>
                <td class="p-2 border border-sky-200 font-mono font-bold text-purple-800 bg-purple-50/60">dem / einem / keinem</td>
                <td class="p-2 border border-sky-200 font-mono font-bold text-purple-800 bg-purple-50/60">den / - / keinen +n</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
    pronouns: `
      <div class="space-y-4">
        <div class="border-b pb-2">
          <h4 class="text-sm font-black text-sky-950">👤 Personal Pronouns Declension</h4>
          <p class="text-xs text-sky-700">How personal pronouns shift across Nominativ, Akkusativ, and Dativ.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-sky-100 text-sky-950">
                <th class="p-2 border border-sky-300">Pronoun</th>
                <th class="p-2 border border-sky-300">Nominativ (Subject)</th>
                <th class="p-2 border border-sky-300">Akkusativ (Direct)</th>
                <th class="p-2 border border-sky-300">Dativ (Indirect)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="p-1.5 border border-sky-200 font-bold">1st Sing. (I)</td><td class="p-1.5 border border-sky-200 font-mono">ich</td><td class="p-1.5 border border-sky-200 font-mono text-amber-800">mich</td><td class="p-1.5 border border-sky-200 font-mono text-purple-800">mir</td></tr>
              <tr class="bg-sky-50/50"><td class="p-1.5 border border-sky-200 font-bold">2nd Sing. (You)</td><td class="p-1.5 border border-sky-200 font-mono">du</td><td class="p-1.5 border border-sky-200 font-mono text-amber-800">dich</td><td class="p-1.5 border border-sky-200 font-mono text-purple-800">dir</td></tr>
              <tr><td class="p-1.5 border border-sky-200 font-bold">3rd Masc. (He)</td><td class="p-1.5 border border-sky-200 font-mono">er</td><td class="p-1.5 border border-sky-200 font-mono text-amber-800">ihn</td><td class="p-1.5 border border-sky-200 font-mono text-purple-800">ihm</td></tr>
              <tr class="bg-sky-50/50"><td class="p-1.5 border border-sky-200 font-bold">3rd Fem. (She)</td><td class="p-1.5 border border-sky-200 font-mono">sie</td><td class="p-1.5 border border-sky-200 font-mono text-amber-800">sie</td><td class="p-1.5 border border-sky-200 font-mono text-purple-800">ihr</td></tr>
              <tr><td class="p-1.5 border border-sky-200 font-bold">3rd Neut. (It)</td><td class="p-1.5 border border-sky-200 font-mono">es</td><td class="p-1.5 border border-sky-200 font-mono text-amber-800">es</td><td class="p-1.5 border border-sky-200 font-mono text-purple-800">ihm</td></tr>
              <tr class="bg-sky-50/50"><td class="p-1.5 border border-sky-200 font-bold">1st Plur. (We)</td><td class="p-1.5 border border-sky-200 font-mono">wir</td><td class="p-1.5 border border-sky-200 font-mono text-amber-800">uns</td><td class="p-1.5 border border-sky-200 font-mono text-purple-800">uns</td></tr>
              <tr><td class="p-1.5 border border-sky-200 font-bold">2nd Plur. (Y'all)</td><td class="p-1.5 border border-sky-200 font-mono">ihr</td><td class="p-1.5 border border-sky-200 font-mono text-amber-800">euch</td><td class="p-1.5 border border-sky-200 font-mono text-purple-800">euch</td></tr>
              <tr class="bg-sky-50/50"><td class="p-1.5 border border-sky-200 font-bold">Formal (You)</td><td class="p-1.5 border border-sky-200 font-mono">Sie</td><td class="p-1.5 border border-sky-200 font-mono text-amber-800">Sie</td><td class="p-1.5 border border-sky-200 font-mono text-purple-800">Ihnen</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
    prepositions: `
      <div class="space-y-4">
        <div class="border-b pb-2">
          <h4 class="text-sm font-black text-sky-950">📍 German Prepositions by Case</h4>
          <p class="text-xs text-sky-700">Prepositions strictly govern the case of the noun that follows.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="p-3 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-1.5">
            <h5 class="font-black text-amber-950 text-xs">Akkusativ Only (DOGFU)</h5>
            <ul class="text-[11px] text-amber-900 space-y-1 font-medium">
              <li>• <strong>durch</strong> (through)</li>
              <li>• <strong>ohne</strong> (without)</li>
              <li>• <strong>gegen</strong> (against / around)</li>
              <li>• <strong>für</strong> (for)</li>
              <li>• <strong>um</strong> (at / around)</li>
            </ul>
          </div>

          <div class="p-3 bg-purple-50 rounded-2xl border-2 border-purple-300 space-y-1.5">
            <h5 class="font-black text-purple-950 text-xs">Dativ Only (ABM-NSVZ)</h5>
            <ul class="text-[11px] text-purple-900 space-y-1 font-medium">
              <li>• <strong>aus</strong> (out of / from)</li>
              <li>• <strong>bei</strong> (at / near)</li>
              <li>• <strong>mit</strong> (with)</li>
              <li>• <strong>nach</strong> (to / after)</li>
              <li>• <strong>seit</strong> (since / for)</li>
              <li>• <strong>von</strong> (from / of)</li>
              <li>• <strong>zu</strong> (to / at)</li>
            </ul>
          </div>

          <div class="p-3 bg-sky-50 rounded-2xl border-2 border-sky-300 space-y-1.5">
            <h5 class="font-black text-sky-950 text-xs">Two-Way (Wechselpräpositionen)</h5>
            <p class="text-[10px] text-sky-700"><strong>Wohin? (Movement)</strong> = Akkusativ<br/><strong>Wo? (Location)</strong> = Dativ</p>
            <ul class="text-[11px] text-sky-900 space-y-0.5 font-medium">
              <li>an, auf, hinter, in, neben, über, unter, vor, zwischen</li>
            </ul>
          </div>
        </div>
      </div>
    `,
    verbs: `
      <div class="space-y-4">
        <div class="border-b pb-2">
          <h4 class="text-sm font-black text-sky-950">⚙️ Verbs, Conjugations & Separable Prefixes</h4>
          <p class="text-xs text-sky-700">Regular present tense endings and essential separable verb patterns.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-1">
            <h5 class="font-black text-sky-950 text-xs">Standard Endings (lernen)</h5>
            <div class="grid grid-cols-2 text-[11px] font-mono text-sky-900">
              <div>ich lerne (-e)</div>
              <div>wir lernen (-en)</div>
              <div>du lernst (-st)</div>
              <div>ihr lernt (-t)</div>
              <div>er/sie/es lernt (-t)</div>
              <div>sie/Sie lernen (-en)</div>
            </div>
          </div>

          <div class="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-1">
            <h5 class="font-black text-indigo-950 text-xs">Separable Verbs (Trennbare Verben)</h5>
            <p class="text-[10px] text-indigo-800">Prefix jumps to the <strong>very end</strong> of the main clause:</p>
            <div class="text-[11px] text-indigo-950 font-medium">
              • <em>aufstehen</em>: Ich <strong>stehe</strong> jeden Tag um 7 Uhr <strong>auf</strong>.<br/>
              • <em>einkaufen</em>: Er <strong>kauft</strong> im Supermarkt <strong>ein</strong>.<br/>
              • <em>anrufen</em>: Wann <strong>rufst</strong> du mich <strong>an</strong>?
            </div>
          </div>
        </div>
      </div>
    `
  };

  let currentGrammarHubTab = 'articles';

  window.openGrammarHubModal = function(initialTab) {
    const modal = document.getElementById('grammarHubModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    switchGrammarHubTab(initialTab || 'articles');
  };

  window.closeGrammarHubModal = function() {
    const modal = document.getElementById('grammarHubModal');
    if (modal) modal.classList.add('hidden');
  };

  window.switchGrammarHubTab = function(tabKey) {
    currentGrammarHubTab = tabKey;
    const tabs = ['articles', 'cases', 'pronouns', 'prepositions', 'verbs'];
    tabs.forEach(t => {
      const btn = document.getElementById(`gramTab-${t}`);
      if (btn) {
        if (t === tabKey) {
          btn.className = "px-3 py-1.5 rounded-xl bg-blue-600 text-white shadow-xs transition whitespace-nowrap font-black";
        } else {
          btn.className = "px-3 py-1.5 rounded-xl bg-white text-sky-800 hover:bg-sky-100 border border-sky-200 transition whitespace-nowrap font-bold";
        }
      }
    });

    const contentArea = document.getElementById('printableGrammarArea');
    if (contentArea && GRAMMAR_TABLES[tabKey]) {
      contentArea.innerHTML = GRAMMAR_TABLES[tabKey];
    }
  };

  window.printGrammarCheatSheet = function() {
    let printRoot = document.getElementById('directPrintRoot');
    if (!printRoot) {
      printRoot = document.createElement('div');
      printRoot.id = 'directPrintRoot';
      document.body.appendChild(printRoot);
    }

    printRoot.classList.remove('hidden');
    printRoot.style.display = 'block';

    const fullHtml = `
      <div style="padding: 10px 0; background: white; color: #0f172a;">
        <!-- Header -->
        <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 20pt; font-weight: 900; color: #0284c7; margin: 0; line-height: 1.1;">Cheeya Studio &bull; Netzwerk NEU A1</h1>
            <h2 style="font-size: 13pt; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">Master German Grammar Reference Cheat Sheet</h2>
            <p style="font-size: 9pt; color: #475569; margin: 2px 0 0 0;">Official Complete A1 Reference: Der/Die/Das, Cases, Pronouns, Prepositions &amp; Verbs</p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 3px 10px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; border-radius: 9999px; font-weight: 800; font-size: 8.5pt;">A1 Examination Reference</span>
            <div style="font-size: 8pt; color: #64748b; margin-top: 4px;">https://cheeyastudio.github.io</div>
          </div>
        </div>

        <!-- Section 1: Articles -->
        <div class="print-section">
          ${GRAMMAR_TABLES.articles}
        </div>

        <!-- Section 2: Cases -->
        <div class="print-section">
          ${GRAMMAR_TABLES.cases}
        </div>

        <!-- Section 3: Pronouns -->
        <div class="print-section">
          ${GRAMMAR_TABLES.pronouns}
        </div>

        <!-- Section 4: Prepositions -->
        <div class="print-section">
          ${GRAMMAR_TABLES.prepositions}
        </div>

        <!-- Section 5: Verbs -->
        <div class="print-section">
          ${GRAMMAR_TABLES.verbs}
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 20px; font-size: 8pt; color: #64748b; display: flex; justify-content: space-between;">
          <span>Cheeya Studio &bull; Netzwerk NEU A1 Comprehensive German Learning Sanctuary</span>
          <span>Page generated directly from Master Grammar Reference Hub</span>
        </div>
      </div>
    `;

    printRoot.innerHTML = fullHtml;

    const cleanupPrint = () => {
      if (printRoot) {
        printRoot.classList.add('hidden');
        printRoot.style.display = 'none';
        printRoot.innerHTML = '';
      }
      window.removeEventListener('afterprint', cleanupPrint);
    };
    window.addEventListener('afterprint', cleanupPrint);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  window.openGrammarPrintTab = function() {
    const win = window.open('', '_blank');
    if (!win) {
      window.printGrammarCheatSheet();
      return;
    }
    const htmlDoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Cheeya Studio - Netzwerk NEU A1 Master Grammar Cheat Sheet</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 10mm 14mm 10mm; }
          * { box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
          .container { max-width: 920px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #bae6fd; }
          .toolbar { display: flex; align-items: center; justify-content: space-between; background: #f0f9ff; border: 1px solid #7dd3fc; padding: 12px 18px; border-radius: 12px; margin-bottom: 24px; }
          .btn-print { background: #0284c7; color: white; border: none; padding: 9px 20px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(2,132,199,0.25); transition: background 0.15s; }
          .btn-print:hover { background: #0369a1; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 22px; font-weight: 900; color: #0284c7; margin: 0; }
          .subtitle { font-size: 14px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0; }
          .desc { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }
          .badge { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 4px 12px; border-radius: 9999px; font-weight: 800; font-size: 11px; }
          .print-section { margin-bottom: 24px; page-break-inside: avoid; }
          table { width: 100% !important; border-collapse: collapse !important; margin: 10px 0 !important; font-size: 12px !important; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: left; }
          th { background-color: #f1f5f9 !important; font-weight: 800 !important; color: #0f172a !important; }
          .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          @media print {
            body { background: white !important; padding: 0 !important; }
            .container { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
            .toolbar { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="toolbar">
            <div style="font-weight: bold; font-size: 13px; color: #0369a1;">📄 Standalone Printable Master Grammar Cheat Sheet</div>
            <button onclick="window.print()" class="btn-print">🖨️ Print / Save as PDF</button>
          </div>
          <div class="header">
            <div>
              <div class="title">Cheeya Studio • Netzwerk NEU A1</div>
              <div class="subtitle">Master German Grammar Reference Cheat Sheet</div>
              <div class="desc">Official Complete Reference: Der/Die/Das Rules, Case Matrix, Pronouns, Prepositions &amp; Verbs</div>
            </div>
            <div><span class="badge">Netzwerk A1</span></div>
          </div>
          <div class="print-section">${GRAMMAR_TABLES.articles}</div>
          <div class="print-section">${GRAMMAR_TABLES.cases}</div>
          <div class="print-section">${GRAMMAR_TABLES.pronouns}</div>
          <div class="print-section">${GRAMMAR_TABLES.prepositions}</div>
          <div class="print-section">${GRAMMAR_TABLES.verbs}</div>
          <div class="footer">
            <span>Cheeya Studio • German Learning Sanctuary</span>
            <span>https://cheeyastudio.github.io</span>
          </div>
        </div>
      </body>
      </html>
    `;
    win.document.write(htmlDoc);
    win.document.close();
  };

  // ================= 33. PROGRESSIVE WEB APP (PWA) INSTALL & SERVICE WORKER =================
  let deferredPwaPrompt = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js?v=20260915_v8')
        .then((reg) => {
          reg.update();
          console.log('Cheeya Deutsch PWA ServiceWorker registered & updated:', reg.scope);
        })
        .catch((err) => console.log('ServiceWorker registration error:', err));
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    const directBtn = document.getElementById('pwaDirectInstallBtn');
    if (directBtn) {
      directBtn.classList.remove('hidden');
    }
  });

  window.openPwaInstallModal = function() {
    const modal = document.getElementById('pwaInstallModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const directBtn = document.getElementById('pwaDirectInstallBtn');
    if (directBtn && deferredPwaPrompt) {
      directBtn.classList.remove('hidden');
    }
  };

  window.closePwaInstallModal = function() {
    const modal = document.getElementById('pwaInstallModal');
    if (modal) modal.classList.add('hidden');
  };

  window.triggerPwaInstall = function() {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showFloatingToast("🎉 App installed successfully! Access it from your home screen.");
          closePwaInstallModal();
          awardXP(50, 'PWA Installed');
        }
        deferredPwaPrompt = null;
      });
    } else {
      openPwaInstallModal();
    }
  };




  if (typeof updateSrsDueBadge === 'function') updateSrsDueBadge();

  const initialHash = window.location.hash.replace('#', '');
  handleRoute(initialHash);

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    handleRoute(hash);
  });
});
