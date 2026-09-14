// app.js - Controller UI & Interactivity for Cheeya Studio Netzwerk Learning Hub (English Edition)

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
        const voices = synth.getVoices();
        germanVoice = voices.find(v => v.lang.startsWith('de')) || null;
      };
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }
  let activeAudioObj = null;
  window.ttsCurrentSpeed = 1.0;

  window.playGermanSpeech = function(text, triggerBtn = null) {
    if (!text || typeof text !== 'string') return;
    
    // Clean markdown formatting
    let spoken = text.replace(/[*_#`]/g, '').trim();
    
    // For German nouns with plural annotations (e.g. "das Alphabet, -e", "das Land, -\"er", "der Herr, -en", "die Stadt, -\"e")
    // extract base form up to the comma so the voice speaks clean natural German
    if (spoken.includes(',')) {
      const parts = spoken.split(',');
      spoken = parts[0].trim();
    }
    // Clean slashes e.g. "Hallo / Guten Tag" -> natural pause
    spoken = spoken.replace(/\s*\/\s*/g, ', ');

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

    // Method 1: Google Native German Audio Stream (Authentic native German human pronunciation)
    try {
      const encoded = encodeURIComponent(spoken);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=de&q=${encoded}`;
      const audio = new Audio();
      audio.referrerPolicy = "no-referrer";
      audio.src = audioUrl;
      audio.playbackRate = window.ttsCurrentSpeed || 1.0;
      activeAudioObj = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Audio stream blocked, falling back to Web Speech API:", err);
          playSpeechSynthesisFallback(spoken, triggerBtn);
        });
      }

      audio.onended = () => {
        if (triggerBtn && triggerBtn.classList) triggerBtn.classList.remove('audio-playing-pulse');
        activeAudioObj = null;
      };
      audio.onerror = () => {
        playSpeechSynthesisFallback(spoken, triggerBtn);
      };
    } catch (e) {
      playSpeechSynthesisFallback(spoken, triggerBtn);
    }
  };

  function playSpeechSynthesisFallback(spoken, triggerBtn) {
    if (!synth) return;
    try {
      if (synth.paused) synth.resume();
      synth.cancel();

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(spoken);
        utterance.lang = 'de-DE';
        utterance.rate = (window.ttsCurrentSpeed === 0.8) ? 0.75 : 0.88;
        
        const voices = synth.getVoices() || [];
        // Prioritize premium/natural German voices over robotic synthesizers
        const preferredGermanVoices = ['Google Deutsch', 'Microsoft Hedda', 'Microsoft Katja', 'Microsoft Stefan', 'Anna', 'Marlene', 'Vicki', 'Hans'];
        let gVoice = voices.find(v => preferredGermanVoices.some(pref => v.name && v.name.includes(pref)));
        if (!gVoice) {
          gVoice = voices.find(v => v.lang && (v.lang === 'de-DE' || (v.lang && v.lang.toLowerCase().startsWith('de'))));
        }
        
        if (gVoice) {
          utterance.voice = gVoice;
        } else {
          console.warn("No native German voice found in system synthesizer.");
        }

        utterance.onend = () => {
          if (triggerBtn && triggerBtn.classList) triggerBtn.classList.remove('audio-playing-pulse');
        };
        utterance.onerror = () => {
          if (triggerBtn && triggerBtn.classList) triggerBtn.classList.remove('audio-playing-pulse');
        };

        synth.speak(utterance);
      }, 30);
    } catch (e) {
      console.warn("Speech synthesis fallback failed:", e);
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

    function scheduleCycle(startAudioTime) {
      if (!isMusicPlaying || activeMusicId !== songId) return;

      song.notes.forEach(n => {
        const [inst, note, beatOffset, dur, vel] = n;
        const noteTime = startAudioTime + beatOffset * secondsPerBeat;
        if (noteTime >= audioCtx.currentTime - 0.1) {
          playSynthNote(inst, note, noteTime, dur * secondsPerBeat, vel || 0.5);
        }
      });

      const nextLoopTime = startAudioTime + loopDurationSec;
      const delayMs = Math.max(100, (nextLoopTime - audioCtx.currentTime - 0.25) * 1000);

      const tid = setTimeout(() => {
        scheduleCycle(nextLoopTime);
      }, delayMs);
      songBeatTimeouts.push(tid);
    }

    scheduleCycle(audioCtx.currentTime + 0.05);
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
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 3.4);
        });
      }

      playChord();
      musicIntervalId = setInterval(playChord, 3500);

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
    if (menu) {
      menu.classList.toggle('hidden');
    }
  };

  document.addEventListener('click', (e) => {
    const container = document.getElementById('musicMenuContainer');
    const menu = document.getElementById('musicDropdownMenu');
    if (container && menu && !container.contains(e.target)) {
      menu.classList.add('hidden');
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
    const navTabs = ['dashboard', 'lesson', 'pdf', 'vocab', 'progress'];
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
  function updateAudioTracks(chapter) {
    audioTrackSelect.innerHTML = '';
    if (pdfAudioTrackSelect) pdfAudioTrackSelect.innerHTML = '';
    
    // Full Chapter Track option if available
    if (chapter.audioKapitel) {
      const optFull = document.createElement('option');
      optFull.value = chapter.audioKapitel;
      optFull.textContent = `🎧 Full Chapter: ${chapter.title}`;
      audioTrackSelect.appendChild(optFull);

      if (pdfAudioTrackSelect) {
        const pdfOptFull = document.createElement('option');
        pdfOptFull.value = chapter.audioKapitel;
        pdfOptFull.textContent = `🎧 Full Chapter Audio: ${chapter.title}`;
        pdfAudioTrackSelect.appendChild(pdfOptFull);
      }
    }

    // Individual Exercise Tracks
    chapter.audioTracks.forEach(tr => {
      const opt = document.createElement('option');
      opt.value = tr.path;
      opt.textContent = `🎵 ${tr.name}`;
      audioTrackSelect.appendChild(opt);

      if (pdfAudioTrackSelect) {
        const pdfOpt = document.createElement('option');
        pdfOpt.value = tr.path;
        pdfOpt.textContent = `🎵 ${tr.name}`;
        pdfAudioTrackSelect.appendChild(pdfOpt);
      }
    });

    // Load initial track to player
    if (audioTrackSelect.options.length > 0) {
      audioPlayer.src = encodeURI(audioTrackSelect.value);
      audioPlayer.load();
      resetAudioState();
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
      const vpWidth = (viewportEl && viewportEl.clientWidth > 0) ? viewportEl.clientWidth : window.innerWidth;
      const screenWidth = window.innerWidth;
      const isMobile = screenWidth < 640;
      const padding = isMobile ? 12 : 32;
      const availableWidth = Math.max(260, Math.min(vpWidth - padding, screenWidth - padding));
      const baseFitScale = availableWidth / unscaledViewport.width;
      const targetScale = Math.min(3.0, Math.max(0.35, baseFitScale * pdfZoomLevel));

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

  // Debounced auto-fit on window resize or mobile orientation change
  let pdfResizeTimer = null;
  window.addEventListener('resize', () => {
    const pdfView = document.getElementById('view-pdf');
    if (pdfView && !pdfView.classList.contains('hidden') && pdfView.classList.contains('active')) {
      clearTimeout(pdfResizeTimer);
      pdfResizeTimer = setTimeout(() => {
        const p = parseInt(pageInput.value, 10) || 1;
        updatePdfSource(p);
      }, 200);
    }
  });

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

    function checkScribbleToErase(stroke, strokes) {
      const pts = stroke.points;
      if (!pts || pts.length < 8) return false;

      const w = canvas.width;
      const h = canvas.height;

      // 1. Simplify points (filter out tiny jitter < 4px)
      const simplified = [];
      const minDist = 4.0;
      for (let i = 0; i < pts.length; i++) {
        const px = pts[i].x * w;
        const py = pts[i].y * h;
        if (simplified.length === 0) {
          simplified.push({ x: px, y: py, normX: pts[i].x, normY: pts[i].y });
        } else {
          const last = simplified[simplified.length - 1];
          const dist = Math.hypot(px - last.x, py - last.y);
          if (dist >= minDist) {
            simplified.push({ x: px, y: py, normX: pts[i].x, normY: pts[i].y });
          }
        }
      }

      if (simplified.length < 5) return false;

      // 2. Measure normalized directional vectors and sharp angle reversals
      const vectors = [];
      for (let i = 1; i < simplified.length; i++) {
        const dx = simplified[i].x - simplified[i - 1].x;
        const dy = simplified[i].y - simplified[i - 1].y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          vectors.push({ dx: dx / len, dy: dy / len, len });
        }
      }

      // Count sharp reversals (dot product < -0.3, meaning angle > 107 degrees)
      let reversals = 0;
      for (let i = 1; i < vectors.length; i++) {
        const dot = (vectors[i].dx * vectors[i - 1].dx) + (vectors[i].dy * vectors[i - 1].dy);
        if (dot < -0.3) {
          reversals++;
        }
      }

      // 3. Compute bounding box and path length
      let minX = 1.0, maxX = 0.0, minY = 1.0, maxY = 0.0;
      let totalPath = 0;
      for (let i = 0; i < simplified.length; i++) {
        const p = simplified[i];
        if (p.normX < minX) minX = p.normX;
        if (p.normX > maxX) maxX = p.normX;
        if (p.normY < minY) minY = p.normY;
        if (p.normY > maxY) maxY = p.normY;
        if (i > 0) {
          const prev = simplified[i - 1];
          totalPath += Math.hypot(p.x - prev.x, p.y - prev.y);
        }
      }

      const boxW = (maxX - minX) * w;
      const boxH = (maxY - minY) * h;
      const boxDiag = Math.hypot(boxW, boxH);
      if (boxDiag < 12) return false;

      const startPt = simplified[0];
      const endPt = simplified[simplified.length - 1];
      const netDisp = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
      const dispRatio = netDisp / Math.max(1.0, totalPath);

      // In cursive handwriting, strokes progress horizontally across the line (dispRatio >= 0.35 or reversals < 5)
      // A genuine scratch-out scribble stays tightly in place over the mistake (dispRatio < 0.35, reversals >= 5, ratio >= 2.8)
      const isScribble = (reversals >= 5 && ratio >= 2.8 && dispRatio < 0.35) || (reversals >= 7 && ratio >= 2.4);
      if (!isScribble) return false;

      // Surgical letter-level precision bounding box (tight 6px padding)
      const padX = 6 / w;
      const padY = 6 / h;
      const sMinX = minX - padX;
      const sMaxX = maxX + padX;
      const sMinY = minY - padY;
      const sMaxY = maxY + padY;

      const newStrokes = [];
      let erasedPointsCount = 0;

      for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
        const targetStroke = strokes[sIdx];
        const tpts = targetStroke.points;
        if (!tpts || tpts.length === 0) continue;

        let currentSegment = [];
        let strokeModified = false;

        for (let pIdx = 0; pIdx < tpts.length; pIdx++) {
          const tp = tpts[pIdx];
          const isInside = (tp.x >= sMinX && tp.x <= sMaxX && tp.y >= sMinY && tp.y <= sMaxY);

          if (isInside) {
            strokeModified = true;
            erasedPointsCount++;
            if (currentSegment.length >= 2) {
              newStrokes.push({
                tool: targetStroke.tool,
                color: targetStroke.color,
                width: targetStroke.width,
                points: currentSegment
              });
            }
            currentSegment = [];
          } else {
            currentSegment.push(tp);
          }
        }

        if (currentSegment.length >= 2) {
          if (strokeModified) {
            newStrokes.push({
              tool: targetStroke.tool,
              color: targetStroke.color,
              width: targetStroke.width,
              points: currentSegment
            });
          } else {
            newStrokes.push(targetStroke);
          }
        }
      }

      if (erasedPointsCount > 0) {
        savePageStrokes(newStrokes);
      }
      return true; // Always discard the scribble itself!
    }

    const finishStroke = (e) => {
      if (!isDrawing || !activeStroke) return;
      isDrawing = false;
      if (activeStroke.points.length > 1) {
        const strokes = loadPageStrokes();
        let wasScribbled = false;
        if (activeStroke.tool === 'pen' || activeStroke.tool === 'highlighter') {
          wasScribbled = checkScribbleToErase(activeStroke, strokes);
        }
        if (!wasScribbled) {
          strokes.push(activeStroke);
          savePageStrokes(strokes);
        }
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
          <button class="px-2.5 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-800 text-xs font-bold transition cursor-pointer flex-shrink-0 ml-2 flex items-center gap-1 shadow-2xs" onclick="playGermanSpeech('${v.de.replace(/'/g, "\\'")}', this)" title="Listen to German pronunciation">
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
          <button id="ttsPlayBtn-${idx}" onclick="playGermanSpeech('${v.de.replace(/'/g, "\\'")}', this)" class="px-3 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold transition cursor-pointer flex items-center gap-1 flex-shrink-0 shadow-2xs" title="Listen to pronunciation">
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

    try {
      const dataUrl = mergedCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      const chapNum = currentChapterIndex + 1;
      a.download = `Cheeya_Netzwerk_A1_Kapitel_${chapNum}_Hal_${currentPdfPage}_annotated.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showFloatingToast('✨ Annotated page image successfully downloaded (PNG)!');
    } catch (e) {
      console.error("Export PNG failed:", e);
      showFloatingToast('❌ Failed to download page image.', '❌');
    }
  };

  window.triggerPrintAnnotatedPdf = function() {
    closeExportModal();
    const mergedCanvas = getMergedAnnotatedCanvas();
    if (!mergedCanvas) return;

    try {
      const dataUrl = mergedCanvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showFloatingToast('⚠️ Pop-up blocked by browser. Please allow pop-ups to print!', '⚠️');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cheeya Studio - Print Netzwerk A1 Page ${currentPdfPage}</title>
          <style>
            @page { size: auto; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
            img { width: 100%; height: auto; max-width: 100vw; display: block; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); setTimeout(function(){ window.close(); }, 1000);" />
        </body>
        </html>
      `);
      printWindow.document.close();
      showFloatingToast('🖨️ Opening print dialog / Save as PDF...');
    } catch (e) {
      console.error("Print failed:", e);
      showFloatingToast('❌ Failed to open print preview.', '❌');
    }
  };

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

  // Prepositions dictionary with German case rules
  const GERMAN_PREPOSITIONS_DICT = {
    'aus': { case: 'Dativ', meaning: 'from / out of', rule: 'Strictly requires Dativ (indicates origin or material)' },
    'bei': { case: 'Dativ', meaning: 'at / with / near', rule: 'Strictly requires Dativ (at someone\'s place, workplace, or vicinity)' },
    'mit': { case: 'Dativ', meaning: 'with / by means of', rule: 'Strictly requires Dativ (instrument, means of transport, or company)' },
    'nach': { case: 'Dativ', meaning: 'to (cities/countries) / after', rule: 'Strictly requires Dativ (geographical destination without article, or time)' },
    'seit': { case: 'Dativ', meaning: 'since / for (time duration)', rule: 'Strictly requires Dativ (action started in past and still ongoing)' },
    'von': { case: 'Dativ', meaning: 'from / of', rule: 'Strictly requires Dativ (origin, starting point, or possession)' },
    'zu': { case: 'Dativ', meaning: 'to / towards', rule: 'Strictly requires Dativ (direction towards people, buildings, or events)' },
    'gegenüber': { case: 'Dativ', meaning: 'opposite / across from', rule: 'Strictly requires Dativ (often placed postpositionally)' },

    'für': { case: 'Akkusativ', meaning: 'for / on behalf of', rule: 'Strictly requires Akkusativ (beneficiary, purpose, or duration)' },
    'ohne': { case: 'Akkusativ', meaning: 'without', rule: 'Strictly requires Akkusativ (lack or absence)' },
    'durch': { case: 'Akkusativ', meaning: 'through', rule: 'Strictly requires Akkusativ (motion passing through an enclosed space)' },
    'gegen': { case: 'Akkusativ', meaning: 'against / around (time)', rule: 'Strictly requires Akkusativ (opposition or approximate time)' },
    'um': { case: 'Akkusativ', meaning: 'around / at (exact time)', rule: 'Strictly requires Akkusativ (exact clock time or spatial circle)' },
    'bis': { case: 'Akkusativ', meaning: 'until / up to', rule: 'Strictly requires Akkusativ (temporal endpoint or boundary)' },

    'in': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'in / into', rule: 'Two-way preposition: Dativ for location (Wo?), Akkusativ for direction/movement (Wohin?)' },
    'an': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'at / on (vertical contact)', rule: 'Two-way preposition: Dativ for location (am Fenster), Akkusativ for movement towards (an die Wand)' },
    'auf': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'on / onto (horizontal)', rule: 'Two-way preposition: Dativ for location (auf dem Tisch), Akkusativ for movement onto (auf den Tisch)' },
    'neben': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'next to', rule: 'Two-way preposition: next to' },
    'hinter': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'behind', rule: 'Two-way preposition: behind' },
    'über': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'over / above / across', rule: 'Two-way preposition: above or crossing over' },
    'unter': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'under / below / among', rule: 'Two-way preposition: under or beneath' },
    'vor': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'in front of / before / ago', rule: 'Two-way preposition: in front of (spatial) or before/ago (temporal Dativ)' },
    'zwischen': { case: 'Wechsel (Dativ / Akkusativ)', meaning: 'between', rule: 'Two-way preposition: between two entities' },

    'im': { case: 'Dativ', contraction: 'in + dem', meaning: 'in the', rule: 'Contraction of in + dem (Dativ: stationary location Wo?)' },
    'ins': { case: 'Akkusativ', contraction: 'in + das', meaning: 'into the', rule: 'Contraction of in + das (Akkusativ: destination Wohin?)' },
    'am': { case: 'Dativ', contraction: 'an + dem', meaning: 'at/on the', rule: 'Contraction of an + dem (Dativ: days, dates, or vertical location)' },
    'ans': { case: 'Akkusativ', contraction: 'an + das', meaning: 'to the', rule: 'Contraction of an + das (Akkusativ: motion towards water or edge)' },
    'vom': { case: 'Dativ', contraction: 'von + dem', meaning: 'from the', rule: 'Contraction of von + dem (Dativ)' },
    'zum': { case: 'Dativ', contraction: 'zu + dem', meaning: 'to the (masc/neut)', rule: 'Contraction of zu + dem (Dativ: destination)' },
    'zur': { case: 'Dativ', contraction: 'zu + der', meaning: 'to the (fem)', rule: 'Contraction of zu + der (Dativ: destination)' },
    'beim': { case: 'Dativ', contraction: 'bei + dem', meaning: 'at the', rule: 'Contraction of bei + dem (Dativ: while doing or at location)' }
  };

  const QUESTION_WORDS_DICT = {
    'wer': 'Who? (Nominative subject interrogative)',
    'wen': 'Whom? (Accusative direct object interrogative)',
    'wem': 'To whom? (Dative indirect object interrogative)',
    'wessen': 'Whose? (Genitive possessive interrogative)',
    'was': 'What? (Object / activity interrogative)',
    'wo': 'Where? (Stationary location interrogative, triggers Dativ)',
    'woher': 'Where from? (Origin interrogative, often used with aus / von)',
    'wohin': 'Where to? (Destination/direction interrogative, triggers Akkusativ)',
    'wann': 'When? (Time interrogative)',
    'warum': 'Why? (Reason / causation interrogative)',
    'wieso': 'Why? / How come? (Informal causation interrogative)',
    'wie': 'How? (Manner / adjective interrogative)',
    'welcher': 'Which? (Masculine interrogative)',
    'welche': 'Which? (Feminine / Plural interrogative)',
    'welches': 'Which? (Neuter interrogative)'
  };

  const SUBORDINATING_CONJUNCTIONS_DICT = {
    'weil': 'because (Subordinate clause: conjugated verb is pushed to the very end — Verbletzt-Stellung)',
    'dass': 'that (Subordinate clause: conjugated verb is pushed to the end)',
    'wenn': 'if / whenever (Conditional/temporal clause: verb pushed to end)',
    'ob': 'whether / if (Indirect question clause: verb pushed to end)',
    'obwohl': 'although / even though (Concessive clause: verb pushed to end)',
    'da': 'since / because (Causal clause: verb pushed to end)',
    'damit': 'so that / in order that (Purpose clause: verb pushed to end)',
    'bevor': 'before (Temporal clause: verb pushed to end)',
    'nachdem': 'after (Temporal clause: verb pushed to end)',
    'seitdem': 'since (Temporal clause: verb pushed to end)'
  };

  const COORDINATING_CONJUNCTIONS_DICT = {
    'und': 'and (Position 0: Connects clauses without modifying word order)',
    'aber': 'but / however (Position 0: Connects contrasting clauses without modifying word order)',
    'oder': 'or (Position 0: Connects alternatives without modifying word order)',
    'denn': 'because / for (Position 0: Connects clauses without modifying word order)',
    'sondern': 'rather / but on the contrary (Position 0: Used after a negation)'
  };

  const INVERSION_ADVERBS_DICT = {
    'heute': 'today (Temporal adverbial: occupies Position 1, triggers subject-verb inversion)',
    'morgen': 'tomorrow (Temporal adverbial: occupies Position 1, triggers subject-verb inversion)',
    'gestern': 'yesterday (Temporal adverbial: occupies Position 1, triggers subject-verb inversion)',
    'jetzt': 'now (Temporal adverbial: occupies Position 1, triggers inversion)',
    'dann': 'then / after that (Sequential adverbial: occupies Position 1, triggers inversion)',
    'danach': 'afterwards (Sequential adverbial: occupies Position 1, triggers inversion)',
    'deshalb': 'therefore / that\'s why (Consequential adverbial: triggers inversion)',
    'darum': 'therefore (Consequential adverbial: triggers inversion)',
    'trotzdem': 'nevertheless (Concessive adverbial: triggers inversion)',
    'leider': 'unfortunately (Attitudinal adverbial: occupies Position 1, triggers inversion)',
    'vielleicht': 'maybe / perhaps (Modal adverbial: occupies Position 1, triggers inversion)',
    'oft': 'often (Frequency adverbial: triggers inversion when in Pos 1)',
    'manchmal': 'sometimes (Frequency adverbial: triggers inversion when in Pos 1)',
    'hier': 'here (Locational adverbial: triggers inversion when in Pos 1)',
    'dort': 'there (Locational adverbial: triggers inversion when in Pos 1)',
    'immer': 'always (Adverb of frequency)'
  };

  const GERMAN_PRONOUNS_DICT = {
    // Nominativ (Subject - The Doer)
    'ich': { case: 'Nominativ', role: 'Subject (The Doer)', person: '1st Person Singular', en: 'I', reason: 'The person doing the action (Wer? = Who?). In German, the subject is ALWAYS in the Nominative case.' },
    'du': { case: 'Nominativ', role: 'Subject (The Doer)', person: '2nd Person Singular', en: 'you (informal)', reason: 'The person doing the action (Wer? = Who?). Always in the Nominative case.' },
    'er': { case: 'Nominativ', role: 'Subject (The Doer)', person: '3rd Person Singular (masc)', en: 'he', reason: 'The person/thing doing the action (Wer? = Who?). Always in the Nominative case.' },
    'sie': { case: 'Nominativ / Akkusativ', role: 'Subject or Direct Object', person: '3rd Person', en: 'she / they / her', reason: 'Acts as Subject (Nominativ: she/they) or Direct Object (Akkusativ: her/them).' },
    'es': { case: 'Nominativ / Akkusativ', role: 'Subject or Direct Object', person: '3rd Person Singular (neut)', en: 'it', reason: 'Acts as Subject (Nominativ) or Direct Object (Akkusativ).' },
    'wir': { case: 'Nominativ', role: 'Subject (The Doers)', person: '1st Person Plural', en: 'we', reason: 'The group doing the action (Wer? = Who?). Always in the Nominative case.' },
    'ihr': { case: 'Nominativ / Dativ', role: 'Subject (You all) or Indirect Object', person: '2nd Person Plural', en: 'you all / her', reason: 'Nominative subject (you all) or Dative indirect object (to her).' },
    'Sie': { case: 'Nominativ / Akkusativ', role: 'Subject or Direct Object (Formal)', person: 'Formal Polite', en: 'you (formal)', reason: 'Formal polite address. Acts as subject in Nominative or object in Akkusativ.' },
    'man': { case: 'Nominativ', role: 'Subject (General One / People)', person: '3rd Person Singular', en: 'one / people in general', reason: 'General indefinite subject pronoun (e.g. Man spricht Deutsch).' },

    // Akkusativ (Direct Object - The Receiver)
    'mich': { case: 'Akkusativ', role: 'Direct Object (The Receiver)', person: '1st Person Singular', en: 'me', base: 'ich', reason: 'Direct object receiving the action (Wen? = Whom?). Form of "ich" in the Accusative case.' },
    'dich': { case: 'Akkusativ', role: 'Direct Object (The Receiver)', person: '2nd Person Singular', en: 'you (informal)', base: 'du', reason: 'Direct object receiving the action (Wen? = Whom?). Form of "du" in the Accusative case. Triggered because the verb directs its action directly onto you!' },
    'ihn': { case: 'Akkusativ', role: 'Direct Object (The Receiver)', person: '3rd Person Singular (masc)', en: 'him', base: 'er', reason: 'Direct object receiving the action (Wen? = Whom?). Form of "er" in the Accusative case.' },
    'uns': { case: 'Akkusativ / Dativ', role: 'Object (Us / To us)', person: '1st Person Plural', en: 'us', base: 'wir', reason: 'Acts as Accusative (direct object) or Dative (indirect object) for "wir".' },
    'euch': { case: 'Akkusativ / Dativ', role: 'Object (You all / To you all)', person: '2nd Person Plural', en: 'you all', base: 'ihr', reason: 'Acts as Accusative or Dative for "ihr".' },

    // Dativ (Indirect Object / Recipient)
    'mir': { case: 'Dativ', role: 'Indirect Object (Recipient: To/For me)', person: '1st Person Singular', en: 'me / to me', base: 'ich', reason: 'Dative case (Wem? = To whom?). Triggered by a Dative verb (helfen, schmecken, gefallen) or a Dative preposition (mit, bei, zu).' },
    'dir': { case: 'Dativ', role: 'Indirect Object (Recipient: To/For you)', person: '2nd Person Singular', en: 'you / to you', base: 'du', reason: 'Dative case (Wem? = To whom?). Triggered by a Dative verb (helfen, danken) or a Dative preposition (mit, bei).' },
    'ihm': { case: 'Dativ', role: 'Indirect Object (To/For him or it)', person: '3rd Person Singular (masc/neut)', en: 'him / it', base: 'er / es', reason: 'Dative case for masculine or neuter pronoun.' },
    'ihnen': { case: 'Dativ', role: 'Indirect Object (To/For them)', person: '3rd Person Plural', en: 'them / to them', base: 'sie', reason: 'Dative case for plural third person.' },
    'Ihnen': { case: 'Dativ', role: 'Indirect Object (To/For you formal)', person: 'Formal Polite', en: 'you (formal) / to you', base: 'Sie', reason: 'Dative case for polite formal address (e.g. "Wie geht es Ihnen?").' }
  };

  const KNOWN_VERB_CONJUGATIONS = {
    // sein (to be) - Copula / Equal sign
    'bin': { inf: 'sein', person: '1st Sing. (ich)', tense: 'Present (Präsens)', en: 'am', copula: true, note: 'Acts like an equal sign (=). Both sides stay in Nominative!' },
    'bist': { inf: 'sein', person: '2nd Sing. (du)', tense: 'Present (Präsens)', en: 'are', copula: true, note: 'Acts like an equal sign (=).' },
    'ist': { inf: 'sein', person: '3rd Sing. (er/sie/es/man)', tense: 'Present (Präsens)', en: 'is', copula: true, note: 'Acts like an equal sign (=).' },
    'sind': { inf: 'sein', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Present (Präsens)', en: 'are', copula: true, note: 'Acts like an equal sign (=).' },
    'seid': { inf: 'sein', person: '2nd Plur. (ihr)', tense: 'Present (Präsens)', en: 'are', copula: true, note: 'Acts like an equal sign (=).' },
    'war': { inf: 'sein', person: '1st/3rd Sing. (ich/er/sie/es)', tense: 'Past (Präteritum)', en: 'was', copula: true },
    'waren': { inf: 'sein', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Past (Präteritum)', en: 'were', copula: true },

    // haben (to have) - Takes Akkusativ!
    'habe': { inf: 'haben', person: '1st Sing. (ich)', tense: 'Present (Präsens)', en: 'have', governs: 'Akkusativ', note: 'Takes an Accusative direct object (e.g. Ich habe einen Hund)' },
    'hast': { inf: 'haben', person: '2nd Sing. (du)', tense: 'Present (Präsens)', en: 'have', governs: 'Akkusativ', note: 'Stem change: -b- drops (du hast)' },
    'hat': { inf: 'haben', person: '3rd Sing. (er/sie/es/man)', tense: 'Present (Präsens)', en: 'has', governs: 'Akkusativ', note: 'Stem change: -b- drops (er hat)' },
    'haben': { inf: 'haben', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Present (Präsens)', en: 'have', governs: 'Akkusativ' },
    'habt': { inf: 'haben', person: '2nd Plur. (ihr)', tense: 'Present (Präsens)', en: 'have', governs: 'Akkusativ' },
    'hatte': { inf: 'haben', person: '1st/3rd Sing. (ich/er/sie/es)', tense: 'Past (Präteritum)', en: 'had', governs: 'Akkusativ' },
    'hatten': { inf: 'haben', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Past (Präteritum)', en: 'had', governs: 'Akkusativ' },

    // lieben (to love) - Takes Akkusativ!
    'liebe': { inf: 'lieben', person: '1st Sing. (ich)', tense: 'Present (Präsens)', en: 'love', governs: 'Akkusativ', note: 'Takes an Accusative direct object (e.g. Ich liebe dich)' },
    'liebst': { inf: 'lieben', person: '2nd Sing. (du)', tense: 'Present (Präsens)', en: 'love', governs: 'Akkusativ' },
    'liebt': { inf: 'lieben', person: '3rd Sing. / 2nd Plur.', tense: 'Present (Präsens)', en: 'loves / love', governs: 'Akkusativ' },
    'lieben': { inf: 'lieben', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Present (Präsens)', en: 'love', governs: 'Akkusativ' },

    // werden (to become / auxiliary for future)
    'werde': { inf: 'werden', person: '1st Sing. (ich)', tense: 'Präsens', en: 'become / will', irregular: false },
    'wirst': { inf: 'werden', person: '2nd Sing. (du)', tense: 'Präsens', en: 'become / will', irregular: true, note: 'Vowel change: e -> i' },
    'wird': { inf: 'werden', person: '3rd Sing. (er/sie/es/man)', tense: 'Präsens', en: 'becomes / will', irregular: true, note: 'Vowel change: e -> i' },
    'werden': { inf: 'werden', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'become / will', irregular: false },
    'werdet': { inf: 'werden', person: '2nd Plur. (ihr)', tense: 'Präsens', en: 'become / will', irregular: false },

    // Modal Verbs
    'kann': { inf: 'können', person: '1st/3rd Sing. (ich/er/sie/es)', tense: 'Präsens', en: 'can / able to', modal: true, note: 'Modalverb (Ability / Possibility). Vowel shift: ö -> a. Second verb placed at the sentence end in infinitive.' },
    'kannst': { inf: 'können', person: '2nd Sing. (du)', tense: 'Präsens', en: 'can / able to', modal: true, note: 'Modalverb (Ability / Possibility)' },
    'können': { inf: 'können', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'can / able to', modal: true, note: 'Modalverb' },
    'könnt': { inf: 'können', person: '2nd Plur. (ihr)', tense: 'Präsens', en: 'can / able to', modal: true, note: 'Modalverb' },

    'muss': { inf: 'müssen', person: '1st/3rd Sing. (ich/er/sie/es)', tense: 'Präsens', en: 'must / have to', modal: true, note: 'Modalverb (Obligation / Necessity). Vowel shift: ü -> u. Second verb at sentence end in infinitive.' },
    'musst': { inf: 'müssen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'must / have to', modal: true, note: 'Modalverb' },
    'müssen': { inf: 'müssen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'must / have to', modal: true, note: 'Modalverb' },
    'müsst': { inf: 'müssen', person: '2nd Plur. (ihr)', tense: 'Präsens', en: 'must / have to', modal: true, note: 'Modalverb' },

    'will': { inf: 'wollen', person: '1st/3rd Sing. (ich/er/sie/es)', tense: 'Präsens', en: 'want to', modal: true, note: 'Modalverb (Strong intention / Desire). Vowel shift: o -> i.' },
    'willst': { inf: 'wollen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'want to', modal: true, note: 'Modalverb' },
    'wollen': { inf: 'wollen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'want to', modal: true, note: 'Modalverb' },
    'wollt': { inf: 'wollen', person: '2nd Plur. (ihr)', tense: 'Präsens', en: 'want to', modal: true, note: 'Modalverb' },

    'möchte': { inf: 'möchten', person: '1st/3rd Sing. (ich/er/sie/es)', tense: 'Konjunktiv II', en: 'would like to', modal: true, note: 'Polite subjunctive form of mögen used as a modal auxiliary for polite requests.' },
    'möchtest': { inf: 'möchten', person: '2nd Sing. (du)', tense: 'Konjunktiv II', en: 'would like to', modal: true },
    'möchten': { inf: 'möchten', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Konjunktiv II', en: 'would like to', modal: true },
    'möchtet': { inf: 'möchten', person: '2nd Plur. (ihr)', tense: 'Konjunktiv II', en: 'would like to', modal: true },

    'darf': { inf: 'dürfen', person: '1st/3rd Sing. (ich/er/sie/es)', tense: 'Präsens', en: 'may / allowed to', modal: true, note: 'Modalverb (Permission). Vowel shift: ü -> a.' },
    'darfst': { inf: 'dürfen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'may / allowed to', modal: true },
    'dürfen': { inf: 'dürfen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'may / allowed to', modal: true },
    'dürft': { inf: 'dürfen', person: '2nd Plur. (ihr)', tense: 'Präsens', en: 'may / allowed to', modal: true },

    'soll': { inf: 'sollen', person: '1st/3rd Sing. (ich/er/sie/es)', tense: 'Präsens', en: 'should / supposed to', modal: true, note: 'Modalverb (Duty / External demand / Advice).' },
    'sollst': { inf: 'sollen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'should / supposed to', modal: true },
    'sollen': { inf: 'sollen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'should / supposed to', modal: true },
    'sollt': { inf: 'sollen', person: '2nd Plur. (ihr)', tense: 'Präsens', en: 'should / supposed to', modal: true },

    // Common Netzwerk A1 Verbs
    'lerne': { inf: 'lernen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'learn / study', regular: true },
    'lernst': { inf: 'lernen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'learn / study', regular: true },
    'lernt': { inf: 'lernen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'learns / learn', regular: true },
    'lernen': { inf: 'lernen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'learn / study', regular: true },

    'fahre': { inf: 'fahren', person: '1st Sing. (ich)', tense: 'Präsens', en: 'drive / ride / travel', irregular: true },
    'fährst': { inf: 'fahren', person: '2nd Sing. (du)', tense: 'Präsens', en: 'drive / ride / travel', irregular: true, note: 'Strong verb: stem vowel umlaut shift a -> ä' },
    'fährt': { inf: 'fahren', person: '3rd Sing. (er/sie/es/man)', tense: 'Präsens', en: 'drives / travels', irregular: true, note: 'Strong verb: stem vowel umlaut shift a -> ä' },
    'fahren': { inf: 'fahren', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'drive / travel', irregular: false },

    'komme': { inf: 'kommen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'come', regular: true },
    'kommst': { inf: 'kommen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'come', regular: true },
    'kommt': { inf: 'kommen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'comes / come', regular: true },
    'kommen': { inf: 'kommen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'come', regular: true },

    'gehe': { inf: 'gehen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'go / walk', regular: true },
    'gehst': { inf: 'gehen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'go / walk', regular: true },
    'geht': { inf: 'gehen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'goes / walk', regular: true },
    'gehen': { inf: 'gehen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'go / walk', regular: true },

    'wohne': { inf: 'wohnen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'live / reside', regular: true },
    'wohnst': { inf: 'wohnen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'live / reside', regular: true },
    'wohnt': { inf: 'wohnen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'lives / live', regular: true },
    'wohnen': { inf: 'wohnen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'live / reside', regular: true },

    'heiße': { inf: 'heißen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'be named', regular: true },
    'heißt': { inf: 'heißen', person: '2nd/3rd Sing. (du/er/sie/es)', tense: 'Präsens', en: 'is named', regular: true, note: 'Due to ß ending, 2nd person du adds only -t (du heißt)' },
    'heißen': { inf: 'heißen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'are named', regular: true },

    'spreche': { inf: 'sprechen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'speak', irregular: true },
    'sprichst': { inf: 'sprechen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'speak', irregular: true, note: 'Strong verb with vowel shift: e -> i (du sprichst)' },
    'spricht': { inf: 'sprechen', person: '3rd Sing. (er/sie/es/man)', tense: 'Präsens', en: 'speaks', irregular: true, note: 'Strong verb with vowel shift: e -> i (er spricht)' },
    'sprechen': { inf: 'sprechen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'speak', irregular: false },

    'trinke': { inf: 'trinken', person: '1st Sing. (ich)', tense: 'Präsens', en: 'drink', regular: true, governs: 'Akkusativ' },
    'trinkst': { inf: 'trinken', person: '2nd Sing. (du)', tense: 'Präsens', en: 'drink', regular: true, governs: 'Akkusativ' },
    'trinkt': { inf: 'trinken', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'drinks / drink', regular: true, governs: 'Akkusativ' },
    'trinken': { inf: 'trinken', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'drink', regular: true, governs: 'Akkusativ' },

    'esse': { inf: 'essen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'eat', irregular: true, governs: 'Akkusativ' },
    'isst': { inf: 'essen', person: '2nd/3rd Sing. (du/er/sie/es)', tense: 'Präsens', en: 'eats / eat', irregular: true, governs: 'Akkusativ', note: 'Strong verb with vowel shift: e -> i (du/er isst)' },
    'essen': { inf: 'essen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'eat', irregular: false, governs: 'Akkusativ' },

    'arbeite': { inf: 'arbeiten', person: '1st Sing. (ich)', tense: 'Präsens', en: 'work', regular: true },
    'arbeitest': { inf: 'arbeiten', person: '2nd Sing. (du)', tense: 'Präsens', en: 'work', regular: true, note: 'Stem ends in -t: epenthetic -e- inserted before -st' },
    'arbeitet': { inf: 'arbeiten', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'works / work', regular: true, note: 'Stem ends in -t: epenthetic -e- inserted before -t' },
    'arbeiten': { inf: 'arbeiten', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'work', regular: true },

    'helfe': { inf: 'helfen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'help', irregular: true, governs: 'Dativ', note: 'Strictly governs a DATIVE recipient (e.g. Ich helfe dir/dem Mann)' },
    'hilfst': { inf: 'helfen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'help', irregular: true, governs: 'Dativ', note: 'Strong verb: e -> i. Strictly governs a DATIVE object.' },
    'hilft': { inf: 'helfen', person: '3rd Sing. (er/sie/es)', tense: 'Präsens', en: 'helps', irregular: true, governs: 'Dativ', note: 'Strong verb: e -> i. Strictly governs a DATIVE object.' },
    'helfen': { inf: 'helfen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'help', irregular: false, governs: 'Dativ', note: 'Strictly governs a DATIVE object.' },

    'brauche': { inf: 'brauchen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'need', regular: true, governs: 'Akkusativ' },
    'brauchst': { inf: 'brauchen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'need', regular: true, governs: 'Akkusativ' },
    'braucht': { inf: 'brauchen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'needs / need', regular: true, governs: 'Akkusativ' },
    'brauchen': { inf: 'brauchen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'need', regular: true, governs: 'Akkusativ' },

    'kaufe': { inf: 'kaufen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'buy', regular: true, governs: 'Akkusativ' },
    'kaufst': { inf: 'kaufen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'buy', regular: true, governs: 'Akkusativ' },
    'kauft': { inf: 'kaufen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'buys / buy', regular: true, governs: 'Akkusativ' },
    'kaufen': { inf: 'kaufen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'buy', regular: true, governs: 'Akkusativ' },

    'lese': { inf: 'lesen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'read', irregular: true, governs: 'Akkusativ' },
    'liest': { inf: 'lesen', person: '2nd/3rd Sing. (du/er/sie/es)', tense: 'Präsens', en: 'reads / read', irregular: true, governs: 'Akkusativ', note: 'Strong verb with vowel shift: e -> ie (du liest, er liest)' },
    'lesen': { inf: 'lesen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'read', irregular: false, governs: 'Akkusativ' },

    'sehe': { inf: 'sehen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'see', irregular: true, governs: 'Akkusativ' },
    'siehst': { inf: 'sehen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'see', irregular: true, governs: 'Akkusativ', note: 'Strong verb with vowel shift: e -> ie (du siehst)' },
    'sieht': { inf: 'sehen', person: '3rd Sing. (er/sie/es)', tense: 'Präsens', en: 'sees', irregular: true, governs: 'Akkusativ', note: 'Strong verb with vowel shift: e -> ie (er sieht)' },
    'sehen': { inf: 'sehen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'see', irregular: false, governs: 'Akkusativ' },

    'schlafe': { inf: 'schlafen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'sleep', irregular: true },
    'schläfst': { inf: 'schlafen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'sleep', irregular: true, note: 'Strong verb with vowel shift: a -> ä' },
    'schläft': { inf: 'schlafen', person: '3rd Sing. (er/sie/es)', tense: 'Präsens', en: 'sleeps', irregular: true, note: 'Strong verb with vowel shift: a -> ä' },
    'schlafen': { inf: 'schlafen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'sleep', irregular: false },

    'bleibe': { inf: 'bleiben', person: '1st Sing. (ich)', tense: 'Präsens', en: 'stay / remain', regular: true },
    'bleibst': { inf: 'bleiben', person: '2nd Sing. (du)', tense: 'Präsens', en: 'stay / remain', regular: true },
    'bleibt': { inf: 'bleiben', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'stays / stay', regular: true },
    'bleiben': { inf: 'bleiben', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'stay / remain', regular: true },

    // machen (to make / do)
    'mache': { inf: 'machen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'do / make', governs: 'Akkusativ' },
    'machst': { inf: 'machen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'do / make', governs: 'Akkusativ' },
    'macht': { inf: 'machen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'does / make', governs: 'Akkusativ' },
    'machen': { inf: 'machen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'do / make', governs: 'Akkusativ' },

    // sagen (to say)
    'sage': { inf: 'sagen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'say' },
    'sagst': { inf: 'sagen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'say' },
    'sagt': { inf: 'sagen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'says' },
    'sagen': { inf: 'sagen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'say' },

    // fragen (to ask)
    'frage': { inf: 'fragen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'ask', governs: 'Akkusativ' },
    'fragst': { inf: 'fragen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'ask', governs: 'Akkusativ' },
    'fragt': { inf: 'fragen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'asks', governs: 'Akkusativ' },
    'fragen': { inf: 'fragen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'ask', governs: 'Akkusativ' },

    // geben (to give)
    'gebe': { inf: 'geben', person: '1st Sing. (ich)', tense: 'Präsens', en: 'give' },
    'gibst': { inf: 'geben', person: '2nd Sing. (du)', tense: 'Präsens', en: 'give', note: 'Strong verb with vowel shift: e -> i' },
    'gibt': { inf: 'geben', person: '3rd Sing. (er/sie/es/man)', tense: 'Präsens', en: 'gives', note: 'Strong verb with vowel shift: e -> i. "es gibt" takes Akkusativ.' },
    'geben': { inf: 'geben', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'give' },

    // nehmen (to take)
    'nehme': { inf: 'nehmen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'take', governs: 'Akkusativ' },
    'nimmst': { inf: 'nehmen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'take', governs: 'Akkusativ', note: 'Strong verb with vowel shift: e -> i' },
    'nimmt': { inf: 'nehmen', person: '3rd Sing. (er/sie/es)', tense: 'Präsens', en: 'takes', governs: 'Akkusativ', note: 'Strong verb with vowel shift: e -> i' },
    'nehmen': { inf: 'nehmen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'take', governs: 'Akkusativ' },

    // finden (to find)
    'finde': { inf: 'finden', person: '1st Sing. (ich)', tense: 'Präsens', en: 'find / think', governs: 'Akkusativ' },
    'findest': { inf: 'finden', person: '2nd Sing. (du)', tense: 'Präsens', en: 'find', governs: 'Akkusativ' },
    'findet': { inf: 'finden', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'finds', governs: 'Akkusativ' },
    'finden': { inf: 'finden', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'find', governs: 'Akkusativ' },

    // kennen (to know someone/place)
    'kenne': { inf: 'kennen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'know', governs: 'Akkusativ' },
    'kennst': { inf: 'kennen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'know', governs: 'Akkusativ' },
    'kennt': { inf: 'kennen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'knows', governs: 'Akkusativ' },
    'kennen': { inf: 'kennen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'know', governs: 'Akkusativ' },

    // hören (to hear / listen)
    'höre': { inf: 'hören', person: '1st Sing. (ich)', tense: 'Präsens', en: 'hear / listen', governs: 'Akkusativ' },
    'hörst': { inf: 'hören', person: '2nd Sing. (du)', tense: 'Präsens', en: 'hear', governs: 'Akkusativ' },
    'hört': { inf: 'hören', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'hears', governs: 'Akkusativ' },
    'hören': { inf: 'hören', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'hear', governs: 'Akkusativ' },

    // schreiben (to write)
    'schreibe': { inf: 'schreiben', person: '1st Sing. (ich)', tense: 'Präsens', en: 'write', governs: 'Akkusativ' },
    'schreibst': { inf: 'schreiben', person: '2nd Sing. (du)', tense: 'Präsens', en: 'write', governs: 'Akkusativ' },
    'schreibt': { inf: 'schreiben', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'writes', governs: 'Akkusativ' },
    'schreiben': { inf: 'schreiben', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'write', governs: 'Akkusativ' },

    // spielen (to play)
    'spiele': { inf: 'spielen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'play', governs: 'Akkusativ' },
    'spielst': { inf: 'spielen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'play', governs: 'Akkusativ' },
    'spielt': { inf: 'spielen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'plays', governs: 'Akkusativ' },
    'spielen': { inf: 'spielen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'play', governs: 'Akkusativ' },

    // treffen (to meet)
    'treffe': { inf: 'treffen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'meet', governs: 'Akkusativ' },
    'triffst': { inf: 'treffen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'meet', governs: 'Akkusativ', note: 'Vowel shift: e -> i' },
    'trifft': { inf: 'treffen', person: '3rd Sing. (er/sie/es)', tense: 'Präsens', en: 'meets', governs: 'Akkusativ', note: 'Vowel shift: e -> i' },
    'treffen': { inf: 'treffen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'meet', governs: 'Akkusativ' },

    // verstehen (to understand)
    'verstehe': { inf: 'verstehen', person: '1st Sing. (ich)', tense: 'Präsens', en: 'understand', governs: 'Akkusativ' },
    'verstehst': { inf: 'verstehen', person: '2nd Sing. (du)', tense: 'Präsens', en: 'understand', governs: 'Akkusativ' },
    'versteht': { inf: 'verstehen', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'understands', governs: 'Akkusativ' },
    'verstehen': { inf: 'verstehen', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'understand', governs: 'Akkusativ' },

    // danken (to thank) - DATIV
    'danke': { inf: 'danken', person: '1st Sing. (ich)', tense: 'Präsens', en: 'thank', governs: 'Dativ', note: 'Strictly requires a DATIVE object (e.g. Ich danke dir!)' },
    'dankst': { inf: 'danken', person: '2nd Sing. (du)', tense: 'Präsens', en: 'thank', governs: 'Dativ' },
    'dankt': { inf: 'danken', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'thanks', governs: 'Dativ' },
    'danken': { inf: 'danken', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'thank', governs: 'Dativ' },

    // gefallen (to appeal to / like) - DATIV
    'gefällt': { inf: 'gefallen', person: '3rd Sing. (er/sie/es)', tense: 'Präsens', en: 'pleases / appeals to', governs: 'Dativ', note: 'Requires DATIVE (e.g. Das gefällt mir!)' },
    'gefallen': { inf: 'gefallen', person: '3rd Plur.', tense: 'Präsens', en: 'please / appeal to', governs: 'Dativ' },

    // schmecken (to taste good to) - DATIV
    'schmeckt': { inf: 'schmecken', person: '3rd Sing. (er/sie/es)', tense: 'Präsens', en: 'tastes good to', governs: 'Dativ', note: 'Requires DATIVE recipient (e.g. Das schmeckt mir!)' },
    'schmecken': { inf: 'schmecken', person: '3rd Plur.', tense: 'Präsens', en: 'taste good to', governs: 'Dativ' },

    // antworten (to answer) - DATIV
    'antworte': { inf: 'antworten', person: '1st Sing. (ich)', tense: 'Präsens', en: 'answer', governs: 'Dativ' },
    'antwortest': { inf: 'antworten', person: '2nd Sing. (du)', tense: 'Präsens', en: 'answer', governs: 'Dativ' },
    'antwortet': { inf: 'antworten', person: '3rd Sing. / 2nd Plur.', tense: 'Präsens', en: 'answers', governs: 'Dativ' },
    'antworten': { inf: 'antworten', person: '1st/3rd Plur. (wir/sie/Sie)', tense: 'Präsens', en: 'answer', governs: 'Dativ' },

    // passen (to suit / fit) - DATIV
    'passt': { inf: 'passen', person: '3rd Sing.', tense: 'Präsens', en: 'fits / suits', governs: 'Dativ', note: 'Requires DATIVE (e.g. Das passt mir gut)' },
    'passen': { inf: 'passen', person: '3rd Plur.', tense: 'Präsens', en: 'fit / suit', governs: 'Dativ' }
  };

  const COMMON_GERMAN_NOUNS = {
    // Masculine (der)
    'tag': { gender: 'der', de: 'der Tag, -e', en: 'day' },
    'morgen': { gender: 'der', de: 'der Morgen', en: 'morning' },
    'abend': { gender: 'der', de: 'der Abend, -e', en: 'evening' },
    'monat': { gender: 'der', de: 'der Monat, -e', en: 'month' },
    'zug': { gender: 'der', de: 'der Zug, -̈e', en: 'train' },
    'bus': { gender: 'der', de: 'der Bus, -se', en: 'bus' },
    'bahnhof': { gender: 'der', de: 'der Bahnhof, -̈e', en: 'train station' },
    'flughafen': { gender: 'der', de: 'der Flughafen, -̈', en: 'airport' },
    'park': { gender: 'der', de: 'der Park, -s', en: 'park' },
    'garten': { gender: 'der', de: 'der Garten, -̈', en: 'garden' },
    'supermarkt': { gender: 'der', de: 'der Supermarkt, -̈e', en: 'supermarket' },
    'tisch': { gender: 'der', de: 'der Tisch, -e', en: 'table' },
    'stuhl': { gender: 'der', de: 'der Stuhl, -̈e', en: 'chair' },
    'schrank': { gender: 'der', de: 'der Schrank, -̈e', en: 'wardrobe / cupboard' },
    'apfel': { gender: 'der', de: 'der Apfel, -̈', en: 'apple' },
    'salat': { gender: 'der', de: 'der Salat, -e', en: 'salad' },
    'kuchen': { gender: 'der', de: 'der Kuchen, -', en: 'cake' },
    'käse': { gender: 'der', de: 'der Käse', en: 'cheese' },
    'fisch': { gender: 'der', de: 'der Fisch, -e', en: 'fish' },
    'reis': { gender: 'der', de: 'der Reis', en: 'rice' },
    'zucker': { gender: 'der', de: 'der Zucker', en: 'sugar' },
    'kaffee': { gender: 'der', de: 'der Kaffee', en: 'coffee' },
    'tee': { gender: 'der', de: 'der Tee', en: 'tea' },
    'saft': { gender: 'der', de: 'der Saft, -̈e', en: 'juice' },
    'wein': { gender: 'der', de: 'der Wein, -e', en: 'wine' },
    'kugelschreiber': { gender: 'der', de: 'der Kugelschreiber, -', en: 'pen' },
    'stift': { gender: 'der', de: 'der Stift, -e', en: 'pencil / pen' },
    'bleistift': { gender: 'der', de: 'der Bleistift, -e', en: 'pencil' },
    'computer': { gender: 'der', de: 'der Computer, -', en: 'computer' },
    'laptop': { gender: 'der', de: 'der Laptop, -s', en: 'laptop' },
    'fernseher': { gender: 'der', de: 'der Fernseher, -', en: 'TV' },
    'schlüssel': { gender: 'der', de: 'der Schlüssel, -', en: 'key' },
    'koffer': { gender: 'der', de: 'der Koffer, -', en: 'suitcase' },
    'rucksack': { gender: 'der', de: 'der Rucksack, -̈e', en: 'backpack' },
    'mantel': { gender: 'der', de: 'der Mantel, -̈', en: 'coat' },
    'pullover': { gender: 'der', de: 'der Pullover, -', en: 'sweater' },
    'schuh': { gender: 'der', de: 'der Schuh, -e', en: 'shoe' },
    'brief': { gender: 'der', de: 'der Brief, -e', en: 'letter' },
    'freund': { gender: 'der', de: 'der Freund, -e', en: 'friend (male)' },
    'lehrer': { gender: 'der', de: 'der Lehrer, -', en: 'teacher (male)' },
    'arzt': { gender: 'der', de: 'der Arzt, -̈e', en: 'doctor (male)' },
    'beruf': { gender: 'der', de: 'der Beruf, -e', en: 'profession / job' },
    'name': { gender: 'der', de: 'der Name, -n', en: 'name' },
    'vater': { gender: 'der', de: 'der Vater, -̈', en: 'father' },
    'sohn': { gender: 'der', de: 'der Sohn, -̈e', en: 'son' },
    'bruder': { gender: 'der', de: 'der Bruder, -̈', en: 'brother' },
    'mann': { gender: 'der', de: 'der Mann, -̈er', en: 'man / husband' },
    'junge': { gender: 'der', de: 'der Junge, -n', en: 'boy' },
    'chef': { gender: 'der', de: 'der Chef, -s', en: 'boss (male)' },
    'kollege': { gender: 'der', de: 'der Kollege, -n', en: 'colleague (male)' },
    'student': { gender: 'der', de: 'der Student, -en', en: 'student (male)' },
    'hund': { gender: 'der', de: 'der Hund, -e', en: 'dog' },
    'vogel': { gender: 'der', de: 'der Vogel, -̈', en: 'bird' },

    // Feminine (die)
    'frau': { gender: 'die', de: 'die Frau, -en', en: 'woman / wife' },
    'mutter': { gender: 'die', de: 'die Mutter, -̈', en: 'mother' },
    'tochter': { gender: 'die', de: 'die Tochter, -̈', en: 'daughter' },
    'schwester': { gender: 'die', de: 'die Schwester, -n', en: 'sister' },
    'freundin': { gender: 'die', de: 'die Freundin, -nen', en: 'friend (female)' },
    'lehrerin': { gender: 'die', de: 'die Lehrerin, -nen', en: 'teacher (female)' },
    'ärztin': { gender: 'die', de: 'die Ärztin, -nen', en: 'doctor (female)' },
    'chefin': { gender: 'die', de: 'die Chefin, -nen', en: 'boss (female)' },
    'kollegin': { gender: 'die', de: 'die Kollegin, -nen', en: 'colleague (female)' },
    'studentin': { gender: 'die', de: 'die Studentin, -nen', en: 'student (female)' },
    'katze': { gender: 'die', de: 'die Katze, -n', en: 'cat' },
    'stadt': { gender: 'die', de: 'die Stadt, -̈e', en: 'city' },
    'straße': { gender: 'die', de: 'die Straße, -n', en: 'street' },
    'schule': { gender: 'die', de: 'die Schule, -n', en: 'school' },
    'universität': { gender: 'die', de: 'die Universität, -en', en: 'university' },
    'sprache': { gender: 'die', de: 'die Sprache, -n', en: 'language' },
    'wohnung': { gender: 'die', de: 'die Wohnung, -en', en: 'apartment' },
    'küche': { gender: 'die', de: 'die Küche, -n', en: 'kitchen' },
    'lampe': { gender: 'die', de: 'die Lampe, -n', en: 'lamp' },
    'tür': { gender: 'die', de: 'die Tür, -en', en: 'door' },
    'tasche': { gender: 'die', de: 'die Tasche, -n', en: 'bag' },
    'uhr': { gender: 'die', de: 'die Uhr, -en', en: 'clock / watch' },
    'brille': { gender: 'die', de: 'die Brille, -n', en: 'glasses' },
    'flasche': { gender: 'die', de: 'die Flasche, -n', en: 'bottle' },
    'tasse': { gender: 'die', de: 'die Tasse, -n', en: 'cup' },
    'zeit': { gender: 'die', de: 'die Zeit, -en', en: 'time' },
    'stunde': { gender: 'die', de: 'die Stunde, -n', en: 'hour' },
    'minute': { gender: 'die', de: 'die Minute, -n', en: 'minute' },
    'woche': { gender: 'die', de: 'die Woche, -n', en: 'week' },
    'nacht': { gender: 'die', de: 'die Nacht, -̈e', en: 'night' },
    'arbeit': { gender: 'die', de: 'die Arbeit, -en', en: 'work' },
    'musik': { gender: 'die', de: 'die Musik', en: 'music' },
    'zeitung': { gender: 'die', de: 'die Zeitung, -en', en: 'newspaper' },
    'frage': { gender: 'die', de: 'die Frage, -n', en: 'question' },
    'antwort': { gender: 'die', de: 'die Antwort, -en', en: 'answer' },
    'hilfe': { gender: 'die', de: 'die Hilfe', en: 'help' },
    'post': { gender: 'die', de: 'die Post', en: 'post / mail' },
    'bank': { gender: 'die', de: 'die Bank, -en', en: 'bank' },
    'apotheke': { gender: 'die', de: 'die Apotheke, -n', en: 'pharmacy' },
    'blume': { gender: 'die', de: 'die Blume, -n', en: 'flower' },
    'hose': { gender: 'die', de: 'die Hose, -n', en: 'pants / trousers' },
    'jacke': { gender: 'die', de: 'die Jacke, -n', en: 'jacket' },
    'pizza': { gender: 'die', de: 'die Pizza, -s', en: 'pizza' },
    'suppe': { gender: 'die', de: 'die Suppe, -n', en: 'soup' },
    'milch': { gender: 'die', de: 'die Milch', en: 'milk' },
    'butter': { gender: 'die', de: 'die Butter', en: 'butter' },
    'schokolade': { gender: 'die', de: 'die Schokolade', en: 'chocolate' },
    'banane': { gender: 'die', de: 'die Banane, -n', en: 'banana' },
    'orange': { gender: 'die', de: 'die Orange, -n', en: 'orange' },
    'kartoffel': { gender: 'die', de: 'die Kartoffel, -n', en: 'potato' },

    // Neuter (das)
    'buch': { gender: 'das', de: 'das Buch, -̈er', en: 'book' },
    'heft': { gender: 'das', de: 'das Heft, -e', en: 'notebook' },
    'auto': { gender: 'das', de: 'das Auto, -s', en: 'car' },
    'fahrrad': { gender: 'das', de: 'das Fahrrad, -̈er', en: 'bicycle' },
    'haus': { gender: 'das', de: 'das Haus, -̈er', en: 'house' },
    'zimmer': { gender: 'das', de: 'das Zimmer, -', en: 'room' },
    'bad': { gender: 'das', de: 'das Bad, -̈er', en: 'bathroom' },
    'fenster': { gender: 'das', de: 'das Fenster, -', en: 'window' },
    'bett': { gender: 'das', de: 'das Bett, -en', en: 'bed' },
    'sofa': { gender: 'das', de: 'das Sofa, -s', en: 'sofa' },
    'bild': { gender: 'das', de: 'das Bild, -er', en: 'picture' },
    'foto': { gender: 'das', de: 'das Foto, -s', en: 'photo' },
    'handy': { gender: 'das', de: 'das Handy, -s', en: 'mobile phone' },
    'telefon': { gender: 'das', de: 'das Telefon, -e', en: 'telephone' },
    'radio': { gender: 'das', de: 'das Radio, -s', en: 'radio' },
    'glas': { gender: 'das', de: 'das Glas, -̈er', en: 'glass' },
    'brot': { gender: 'das', de: 'das Brot, -e', en: 'bread' },
    'brötchen': { gender: 'das', de: 'das Brötchen, -', en: 'bread roll' },
    'wasser': { gender: 'das', de: 'das Wasser', en: 'water' },
    'bier': { gender: 'das', de: 'das Bier, -e', en: 'beer' },
    'fleisch': { gender: 'das', de: 'das Fleisch', en: 'meat' },
    'hähnchen': { gender: 'das', de: 'das Hähnchen, -', en: 'chicken' },
    'ei': { gender: 'das', de: 'das Ei, -er', en: 'egg' },
    'obst': { gender: 'das', de: 'das Obst', en: 'fruit' },
    'gemüse': { gender: 'das', de: 'das Gemüse', en: 'vegetables' },
    'kind': { gender: 'das', de: 'das Kind, -er', en: 'child' },
    'baby': { gender: 'das', de: 'das Baby, -s', en: 'baby' },
    'mädchen': { gender: 'das', de: 'das Mädchen, -', en: 'girl' },
    'hotel': { gender: 'das', de: 'das Hotel, -s', en: 'hotel' },
    'restaurant': { gender: 'das', de: 'das Restaurant, -s', en: 'restaurant' },
    'café': { gender: 'das', de: 'das Café, -s', en: 'café' },
    'kino': { gender: 'das', de: 'das Kino, -s', en: 'cinema' },
    'museum': { gender: 'das', de: 'das Museum, Museen', en: 'museum' },
    'theater': { gender: 'das', de: 'das Theater, -', en: 'theatre' },
    'ticket': { gender: 'das', de: 'das Ticket, -s', en: 'ticket' },
    'hemd': { gender: 'das', de: 'das Hemd, -en', en: 'shirt' },
    't-shirt': { gender: 'das', de: 'das T-Shirt, -s', en: 'T-shirt' },
    'kleid': { gender: 'das', de: 'das Kleid, -er', en: 'dress' },
    'deutsch': { gender: 'das', de: 'das Deutsch', en: 'German (language)' },
    'englisch': { gender: 'das', de: 'das Englisch', en: 'English (language)' },
    'jahr': { gender: 'das', de: 'das Jahr, -e', en: 'year' },
    'leben': { gender: 'das', de: 'das Leben', en: 'life' },
    'problem': { gender: 'das', de: 'das Problem, -e', en: 'problem' },
    'geld': { gender: 'das', de: 'das Geld', en: 'money' }
  };

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

      // If either source or target is German, run deep German Grammar Analysis
      if (currentTargetGermanText && analysisContainer) {
        const analysisHtml = analyzeGermanGrammar(currentTargetGermanText, text, srcLang, tgtLang);
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

  function analyzeGermanGrammar(germanText, sourceText, sourceLang, targetLang) {
    if (!germanText) return '';

    const rawTokens = germanText.trim().split(/\s+/);
    if (!rawTokens.length) return '';

    const tokens = rawTokens.map(tok => {
      const clean = tok.replace(/^[„“"'(\[]+|[.,!?:;)"'\]]+$/g, '');
      const lower = clean.toLowerCase();
      return { raw: tok, clean: clean, lower: lower };
    }).filter(t => t.clean.length > 0);

    if (!tokens.length) return '';

    const lastChar = germanText.trim().slice(-1);
    const isQuestion = (lastChar === '?');
    const isExclamation = (lastChar === '!');
    const firstWord = tokens[0]?.lower || '';

    // 1. Identify Finite Verb Token & Subject Agreement
    let finiteVerbToken = null;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      let verbInfo = KNOWN_VERB_CONJUGATIONS[t.lower];
      // Algorithmic detection for regular verbs if not in dictionary
      if (!verbInfo && i > 0 && !KNOWN_VERB_CONJUGATIONS[tokens[0].lower]) {
        if (t.lower.endsWith('e') && i === 1) {
          verbInfo = { inf: t.lower + 'n', person: '1st Sing. (ich)', tense: 'Present (Präsens)', en: t.lower, regular: true, governs: 'Akkusativ' };
        } else if (t.lower.endsWith('st') && i === 1) {
          verbInfo = { inf: t.lower.slice(0, -2) + 'en', person: '2nd Sing. (du)', tense: 'Present (Präsens)', en: t.lower, regular: true, governs: 'Akkusativ' };
        } else if (t.lower.endsWith('t') && i === 1) {
          verbInfo = { inf: t.lower.slice(0, -1) + 'en', person: '3rd Sing. (er/sie/es)', tense: 'Present (Präsens)', en: t.lower, regular: true, governs: 'Akkusativ' };
        }
      }
      if (verbInfo && !finiteVerbToken) {
        finiteVerbToken = { token: t, index: i, info: verbInfo };
      }
    }

    // 2. Sentence Architecture & Word Order Rules (Newbie-Friendly)
    let sentenceType = 'Standard Sentence (Subject First)';
    let sentenceBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let sentenceDesc = '';
    let wordOrderExplanation = '';
    let isSubordinate = false;

    // Check Subordinate Conjunctions
    for (let t of tokens) {
      if (SUBORDINATING_CONJUNCTIONS_DICT[t.lower]) {
        isSubordinate = true;
        sentenceType = 'Subordinate Clause (Nebensatz)';
        sentenceBadgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-300';
        sentenceDesc = `Starts with the conjunction <strong>"${t.clean}"</strong> (${SUBORDINATING_CONJUNCTIONS_DICT[t.lower]}).`;
        wordOrderExplanation = `💡 <strong>The Verb-Kicker Rule</strong>: In German, subordinate conjunctions like <strong>"${t.clean}"</strong> kick the conjugated verb all the way to the <strong>very end of the sentence</strong>!`;
        break;
      }
    }

    if (!isSubordinate) {
      if (isQuestion) {
        if (QUESTION_WORDS_DICT[firstWord]) {
          sentenceType = 'W-Question (Information Question)';
          sentenceBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
          sentenceDesc = `Starts with the question word <strong>"${tokens[0].clean}"</strong> (${QUESTION_WORDS_DICT[firstWord]}).`;
          wordOrderExplanation = `💡 <strong>W-Question Rule</strong>: <strong>Position 1</strong> is the question word (<em>${tokens[0].clean}</em>), the verb is locked in <strong>Position 2</strong>, and the subject follows in <strong>Position 3</strong>.`;
        } else {
          sentenceType = 'Yes/No Question (Ja/Nein-Frage)';
          sentenceBadgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
          sentenceDesc = 'A polar question answered with Yes (Ja) or No (Nein).';
          wordOrderExplanation = `💡 <strong>Yes/No Question Rule</strong>: The verb jumps to <strong>Position 1</strong> at the very start of the sentence, followed directly by the subject in <strong>Position 2</strong>!`;
        }
      } else if (isExclamation && (KNOWN_VERB_CONJUGATIONS[firstWord] || firstWord.endsWith('en') || firstWord.endsWith('t'))) {
        sentenceType = 'Command / Imperative (Imperativ)';
        sentenceBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
        sentenceDesc = 'An imperative command or instruction.';
        wordOrderExplanation = '💡 <strong>Command Rule</strong>: The action verb occupies <strong>Position 1</strong> at the very beginning of the sentence.';
      } else {
        const isSubjectFirst = ['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'Sie', 'man'].includes(firstWord) ||
                               ['der', 'die', 'das', 'ein', 'eine', 'mein', 'dein', 'ihr', 'unser'].includes(firstWord);
        
        if (isSubjectFirst) {
          sentenceType = 'Standard Sentence (Subject First)';
          sentenceBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          sentenceDesc = 'A classic German sentence starting with the person or thing doing the action.';
          wordOrderExplanation = `💡 <strong>The Golden German Rule (Verb in Position 2)</strong>: In normal German sentences, the conjugated verb (action word) ALWAYS occupies <strong>Position 2</strong>. The subject (<strong>"${tokens[0].clean}"</strong>) takes <strong>Position 1</strong>, followed immediately by the verb in <strong>Position 2</strong>.`;
        } else {
          sentenceType = 'Inverted Sentence (Time/Adverb First)';
          sentenceBadgeColor = 'bg-teal-100 text-teal-800 border-teal-300';
          sentenceDesc = `Starts with <strong>"${tokens[0].clean}"</strong> to set the time, place, or emphasis.`;
          wordOrderExplanation = `💡 <strong>The Inversion Hop Rule</strong>: Because <strong>Position 1</strong> is occupied by <strong>"${tokens[0].clean}"</strong>, and the verb MUST stay in <strong>Position 2</strong>, the subject (<strong>"${tokens[2] ? tokens[2].clean : 'subject'}"</strong>) politely hops into <strong>Position 3</strong> right after the verb!`;
        }
      }
    }

    // Check Satzklammer (Sentence Bracket: modal verbs, separable verbs, Perfekt past tense)
    let bracketInfo = null;
    if (tokens.length > 2) {
      const lastTok = tokens[tokens.length - 1];
      const SEPARABLE_PREFIXES = ['auf', 'an', 'ab', 'aus', 'ein', 'mit', 'nach', 'vor', 'zu', 'zurück', 'fern'];
      if (SEPARABLE_PREFIXES.includes(lastTok.lower)) {
        bracketInfo = {
          type: 'Separable Verb Bracket (Trennbare Verben)',
          desc: `💡 <strong>The Separable Prefix Bracket</strong>: The main conjugated stem occupies <strong>Position 2</strong>, while the detached prefix <strong>"${lastTok.clean}"</strong> moves all the way to the <strong>very end of the sentence</strong> (like a bracket holding the sentence together!).`
        };
      } else if (finiteVerbToken && finiteVerbToken.info.modal && (lastTok.lower.endsWith('en') || lastTok.lower.endsWith('ern') || lastTok.lower.endsWith('eln'))) {
        bracketInfo = {
          type: 'Modal Verb Bracket (Modalverb-Satzklammer)',
          desc: `💡 <strong>The Modal Verb Bracket</strong>: The helping modal verb <strong>"${finiteVerbToken.token.clean}"</strong> takes <strong>Position 2</strong>, and the main action verb <strong>"${lastTok.clean}"</strong> is placed at the <strong>sentence end in base infinitive form</strong>.`
        };
      } else if (finiteVerbToken && (finiteVerbToken.info.inf === 'haben' || finiteVerbToken.info.inf === 'sein') && (lastTok.lower.startsWith('ge') || lastTok.lower.includes('t') || lastTok.lower.includes('en')) && lastTok.lower !== finiteVerbToken.token.lower) {
        bracketInfo = {
          type: 'Perfekt Past Tense Bracket (Perfekt-Satzklammer)',
          desc: `💡 <strong>The Past Tense Bracket (Perfekt)</strong>: The auxiliary helping verb <strong>"${finiteVerbToken.token.clean}"</strong> sits in <strong>Position 2</strong>, and the past participle (Partizip II) <strong>"${lastTok.clean}"</strong> closes the sentence bracket at the <strong>sentence end</strong>.`
        };
      }
    }

    // Visual Position Pills Strip
    let positionPillsHtml = tokens.map((t, idx) => {
      const posNum = idx + 1;
      let posLabel = `Pos ${posNum}`;
      let pillBg = 'bg-sky-50 text-sky-900 border-sky-300';
      let roleNote = '';

      if (finiteVerbToken && idx === finiteVerbToken.index) {
        pillBg = 'bg-rose-50 text-rose-900 border-rose-300 ring-2 ring-rose-400/30';
        roleNote = 'Verb ⭐';
      } else if (GERMAN_PRONOUNS_DICT[t.lower]) {
        const pr = GERMAN_PRONOUNS_DICT[t.lower];
        if (pr.case === 'Nominativ') {
          pillBg = 'bg-emerald-50 text-emerald-900 border-emerald-300';
          roleNote = 'Subject (Nom)';
        } else if (pr.case === 'Akkusativ') {
          pillBg = 'bg-blue-50 text-blue-900 border-blue-300';
          roleNote = 'Object (Akk)';
        } else if (pr.case === 'Dativ') {
          pillBg = 'bg-purple-50 text-purple-900 border-purple-300';
          roleNote = 'Object (Dat)';
        }
      } else if (QUESTION_WORDS_DICT[t.lower]) {
        pillBg = 'bg-amber-50 text-amber-900 border-amber-300';
        roleNote = 'Question';
      } else if (GERMAN_PREPOSITIONS_DICT[t.lower]) {
        pillBg = 'bg-indigo-50 text-indigo-900 border-indigo-300';
        roleNote = 'Preposition';
      } else if (['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'einem'].includes(t.lower)) {
        pillBg = 'bg-sky-50 text-sky-900 border-sky-200';
        roleNote = 'Article';
      } else if (/^[A-ZÄÖÜ]/.test(t.clean)) {
        pillBg = 'bg-cyan-50 text-cyan-900 border-cyan-300';
        roleNote = 'Noun';
      }

      return `
        <div class="flex flex-col items-center px-2.5 py-1.5 rounded-xl border ${pillBg} shadow-2xs text-center min-w-[70px]">
          <span class="text-[9px] font-black uppercase tracking-wider opacity-75">${posLabel}</span>
          <span class="text-xs font-black my-0.5">${t.clean}</span>
          ${roleNote ? `<span class="text-[9px] font-bold px-1 rounded bg-white/80 border border-current/20">${roleNote}</span>` : ''}
        </div>
      `;
    }).join('');

    // Verb Details (Newbie-Friendly)
    let verbDetailsHtml = '';
    if (finiteVerbToken) {
      const v = finiteVerbToken.info;
      const governsDesc = v.governs === 'Akkusativ'
        ? `🎯 <strong>A1 Object Requirement</strong>: <em>${v.inf}</em> is an <strong>Accusative verb</strong>! The direct object receiving the action takes the <strong>Akkusativ</strong> case (e.g. <em>ich liebe dich</em>, <em>ich trinke einen Kaffee</em>).`
        : (v.governs === 'Dativ'
            ? `🎯 <strong>A1 Special Dative Verb</strong>: <em>${v.inf}</em> strictly demands a <strong>Dative recipient</strong> (e.g. <em>ich helfe dir</em>, never <em>dich</em>!).`
            : (v.copula ? `🎯 <strong>A1 Equal Sign Rule (=)</strong>: The verb <em>sein</em> links two sides together like an equation ($A = B$). Both sides stay in <strong>Nominativ</strong>!` : ''));

      verbDetailsHtml = `
        <div class="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-xs space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200/80">
            <div class="flex items-center gap-2">
              <span class="text-base">⚡</span>
              <span class="font-extrabold text-emerald-950 text-sm">
                Conjugated Verb: <strong class="text-emerald-800">"${finiteVerbToken.token.clean}"</strong>
              </span>
              <span class="text-[11px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-emerald-200">Base: <em>${v.inf}</em> (${v.en || ''})</span>
            </div>
            <span class="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-md">
              Position #${finiteVerbToken.index + 1}
            </span>
          </div>

          <div class="space-y-1.5 text-emerald-900 font-medium leading-relaxed">
            <p>• <strong>Why does it end this way?</strong> In German, verbs change their endings like a uniform to match WHO is doing the action. Because the subject is <strong>${v.person}</strong>, the verb takes the ending for that person (e.g. <em>ich lieb<strong>e</strong></em>, <em>du lieb<strong>st</strong></em>, <em>er lieb<strong>t</strong></em>).</p>
            ${governsDesc ? `<div class="p-2 bg-white/90 rounded-xl border border-emerald-200 text-emerald-950">${governsDesc}</div>` : ''}
            ${v.note ? `<p class="p-2 bg-emerald-100/60 rounded-xl border border-emerald-300 text-emerald-900">💡 <em>Helpful Tip:</em> ${v.note}</p>` : ''}
          </div>

          <!-- A1 Conjugation Cheat Sheet -->
          <div class="mt-2 pt-2 border-t border-emerald-200/60">
            <span class="text-[10px] font-black uppercase text-emerald-800 tracking-wider">A1 Verb Endings Cheat-Sheet:</span>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-1 mt-1 text-[10px] text-center font-bold">
              <span class="p-1 rounded bg-white border border-emerald-200">ich: <strong>-e</strong></span>
              <span class="p-1 rounded bg-white border border-emerald-200">du: <strong>-st</strong></span>
              <span class="p-1 rounded bg-white border border-emerald-200">er/sie/es: <strong>-t</strong></span>
              <span class="p-1 rounded bg-white border border-emerald-200">wir: <strong>-en</strong></span>
              <span class="p-1 rounded bg-white border border-emerald-200">ihr: <strong>-t</strong></span>
              <span class="p-1 rounded bg-white border border-emerald-200">sie/Sie: <strong>-en</strong></span>
            </div>
          </div>
        </div>
      `;
    } else {
      verbDetailsHtml = `
        <div class="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-800">
          <p>• Regular verb detected matching the clause subject.</p>
        </div>
      `;
    }

    // Helper to resolve noun gender and dictionary info
    function resolveNounGender(nounClean, articleToken = null) {
      if (!nounClean) return { gender: 'der', en: '', de: '' };
      const lower = nounClean.toLowerCase();
      if (VOCAB_LOOKUP_MAP && VOCAB_LOOKUP_MAP[lower]) {
        return { gender: VOCAB_LOOKUP_MAP[lower].gender, en: VOCAB_LOOKUP_MAP[lower].en || '', de: VOCAB_LOOKUP_MAP[lower].de || `${VOCAB_LOOKUP_MAP[lower].gender} ${nounClean}` };
      }
      if (COMMON_GERMAN_NOUNS && COMMON_GERMAN_NOUNS[lower]) {
        return { gender: COMMON_GERMAN_NOUNS[lower].gender, en: COMMON_GERMAN_NOUNS[lower].en || '', de: COMMON_GERMAN_NOUNS[lower].de || `${COMMON_GERMAN_NOUNS[lower].gender} ${nounClean}` };
      }
      if (articleToken) {
        const artLower = articleToken.toLowerCase();
        if (['den', 'einen', 'keinen', 'meinen', 'deinen', 'seinen', 'ihren', 'unseren', 'euren', 'ihren'].includes(artLower)) {
          return { gender: 'der', en: nounClean, de: `der ${nounClean}` };
        }
        if (['das', 'ein', 'ins', 'ans', 'aufs'].includes(artLower)) {
          return { gender: 'das', en: nounClean, de: `das ${nounClean}` };
        }
        if (['die', 'eine', 'keine', 'meine', 'zur'].includes(artLower)) {
          return { gender: 'die', en: nounClean, de: `die ${nounClean}` };
        }
      }
      // Suffix heuristics
      if (lower.endsWith('ung') || lower.endsWith('heit') || lower.endsWith('keit') || lower.endsWith('schaft') || lower.endsWith('tion') || lower.endsWith('tät') || lower.endsWith('ie')) {
        return { gender: 'die', en: nounClean, de: `die ${nounClean}` };
      }
      if (lower.endsWith('chen') || lower.endsWith('lein') || lower.endsWith('ment') || lower.endsWith('um')) {
        return { gender: 'das', en: nounClean, de: `das ${nounClean}` };
      }
      if (lower.endsWith('er') || lower.endsWith('ling') || lower.endsWith('ismus')) {
        return { gender: 'der', en: nounClean, de: `der ${nounClean}` };
      }
      if (lower.endsWith('e')) {
        return { gender: 'die', en: nounClean, de: `die ${nounClean}` };
      }
      return { gender: 'der', en: nounClean, de: `der ${nounClean}` };
    }

    // =========================================================================
    // 3. DEDICATED OBJECT & ARTICLE ANALYSIS ENGINE (Akkusativ, Dativ & Declensions)
    // =========================================================================
    const detectedObjects = [];
    const objConsumedIndices = new Set();
    if (finiteVerbToken) objConsumedIndices.add(finiteVerbToken.index);

    // Identify Subject Token Indices so we don't confuse Subject with Object
    const subjectIndices = new Set();
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (['ich', 'du', 'er', 'wir', 'ihr', 'man'].includes(t.lower)) {
        subjectIndices.add(i);
        break;
      }
      if (i === 0 && ['sie', 'es'].includes(t.lower)) {
        subjectIndices.add(i);
        break;
      }
      if (i === 2 && finiteVerbToken && finiteVerbToken.index === 1 && ['sie', 'es'].includes(t.lower)) {
        subjectIndices.add(i);
        break;
      }
      // Subject with article at Pos 1
      if (i === 0 && ['der', 'die', 'das', 'ein', 'eine', 'mein', 'dein', 'ihr', 'unser'].includes(t.lower)) {
        subjectIndices.add(i);
        if (i + 1 < tokens.length) subjectIndices.add(i + 1);
        if (i + 2 < tokens.length && /^[A-ZÄÖÜ]/.test(tokens[i + 2].clean)) subjectIndices.add(i + 2);
        break;
      }
    }

    // A. Detect Prepositional Phrases first
    for (let i = 0; i < tokens.length; i++) {
      if (objConsumedIndices.has(i) || subjectIndices.has(i)) continue;
      const t = tokens[i];
      const prep = GERMAN_PREPOSITIONS_DICT[t.lower];
      if (!prep) continue;

      let phrase = t.clean;
      let prepArticle = '';
      let prepNoun = '';
      let prepPronoun = null;
      let endIdx = i;

      const next = i + 1 < tokens.length ? tokens[i + 1] : null;
      const nextNext = i + 2 < tokens.length ? tokens[i + 2] : null;

      if (next && ['der','die','das','dem','den','des','ein','eine','einen','einem','einer','kein','keinem','keiner','meinem','meiner','deinem'].includes(next.lower)) {
        phrase += ' ' + next.clean;
        prepArticle = next.clean;
        endIdx = i + 1;
        if (nextNext && (/^[A-ZÄÖÜ]/.test(nextNext.clean) || COMMON_GERMAN_NOUNS[nextNext.lower] || (VOCAB_LOOKUP_MAP && VOCAB_LOOKUP_MAP[nextNext.lower]))) {
          phrase += ' ' + nextNext.clean;
          prepNoun = nextNext.clean;
          endIdx = i + 2;
        }
      } else if (next && GERMAN_PRONOUNS_DICT[next.lower]) {
        phrase += ' ' + next.clean;
        prepPronoun = GERMAN_PRONOUNS_DICT[next.lower];
        endIdx = i + 1;
      } else if (next && (/^[A-ZÄÖÜ]/.test(next.clean) || COMMON_GERMAN_NOUNS[next.lower])) {
        phrase += ' ' + next.clean;
        prepNoun = next.clean;
        endIdx = i + 1;
      }

      for (let k = i; k <= endIdx; k++) objConsumedIndices.add(k);

      let prepNounInfo = null;
      if (prepNoun) {
        prepNounInfo = resolveNounGender(prepNoun, prepArticle);
      }

      detectedObjects.push({
        type: 'Prepositional Object',
        case: prep.case === 'Wechsel' ? 'Dativ (Location) / Akkusativ (Direction)' : prep.case,
        phrase: phrase,
        prep: t.clean,
        prepMeaning: prep.meaning,
        prepCase: prep.case,
        article: prepArticle,
        noun: prepNoun,
        nounInfo: prepNounInfo,
        pronoun: prepPronoun
      });
    }

    // B. Detect Noun Phrase Objects with Articles
    for (let i = 0; i < tokens.length; i++) {
      if (objConsumedIndices.has(i) || subjectIndices.has(i)) continue;
      const t = tokens[i];
      const lower = t.lower;

      const isMascAkkArt = ['den', 'einen', 'keinen', 'meinen', 'deinen', 'seinen', 'ihren', 'unseren', 'euren', 'Ihren'].includes(lower);
      const isFemAkkArt = ['die', 'eine', 'keine', 'meine', 'deine', 'seine', 'ihre', 'unsere', 'eure', 'Ihre'].includes(lower);
      const isNeutAkkArt = ['das', 'ein', 'kein', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'Ihr'].includes(lower);
      const isDatMascNeutArt = ['dem', 'einem', 'keinem', 'meinem', 'deinem', 'seinem', 'ihrem', 'unserem', 'eurem', 'Ihrem'].includes(lower);
      const isDatFemArt = ['der', 'einer', 'keiner', 'meiner', 'deiner', 'seiner', 'ihrer', 'unserer', 'eurer', 'Ihrer'].includes(lower);

      if (isMascAkkArt || isFemAkkArt || isNeutAkkArt || isDatMascNeutArt || isDatFemArt) {
        let nounToken = null;
        let adjToken = null;
        let phrase = t.clean;

        if (i + 1 < tokens.length) {
          const c1 = tokens[i + 1];
          if (/^[A-ZÄÖÜ]/.test(c1.clean) || COMMON_GERMAN_NOUNS[c1.lower] || (VOCAB_LOOKUP_MAP && VOCAB_LOOKUP_MAP[c1.lower])) {
            nounToken = c1;
            phrase += ' ' + c1.clean;
            objConsumedIndices.add(i);
            objConsumedIndices.add(i + 1);
          } else if (i + 2 < tokens.length) {
            const c2 = tokens[i + 2];
            if (/^[A-ZÄÖÜ]/.test(c2.clean) || COMMON_GERMAN_NOUNS[c2.lower] || (VOCAB_LOOKUP_MAP && VOCAB_LOOKUP_MAP[c2.lower])) {
              adjToken = c1;
              nounToken = c2;
              phrase += ' ' + c1.clean + ' ' + c2.clean;
              objConsumedIndices.add(i);
              objConsumedIndices.add(i + 1);
              objConsumedIndices.add(i + 2);
            }
          }
        }

        if (nounToken) {
          const nInfo = resolveNounGender(nounToken.clean, t.clean);
          let objCase = 'Akkusativ';
          let objRole = 'Direct Object (Akkusativ-Objekt)';

          if (isDatMascNeutArt || isDatFemArt || (finiteVerbToken && finiteVerbToken.info.governs === 'Dativ')) {
            objCase = 'Dativ';
            objRole = 'Indirect Object (Dativ-Objekt)';
          }

          detectedObjects.push({
            type: objRole,
            case: objCase,
            phrase: phrase,
            article: t.clean,
            articleLower: lower,
            noun: nounToken.clean,
            nounLower: nounToken.lower,
            nounInfo: nInfo,
            adj: adjToken ? adjToken.clean : null
          });
          continue;
        }
      }
    }

    // C. Detect Pronoun Objects
    for (let i = 0; i < tokens.length; i++) {
      if (objConsumedIndices.has(i) || subjectIndices.has(i)) continue;
      const t = tokens[i];
      if (GERMAN_PRONOUNS_DICT[t.lower]) {
        const pr = GERMAN_PRONOUNS_DICT[t.lower];
        if (['dich', 'mich', 'ihn', 'uns', 'euch'].includes(t.lower)) {
          objConsumedIndices.add(i);
          detectedObjects.push({
            type: 'Direct Object (Akkusativ-Objekt)',
            case: 'Akkusativ',
            phrase: t.clean,
            isPronoun: true,
            pronoun: pr
          });
        } else if (['dir', 'mir', 'ihm', 'ihnen', 'Ihnen'].includes(t.lower)) {
          objConsumedIndices.add(i);
          detectedObjects.push({
            type: 'Indirect Object (Dativ-Objekt)',
            case: 'Dativ',
            phrase: t.clean,
            isPronoun: true,
            pronoun: pr
          });
        } else if (['sie', 'es'].includes(t.lower)) {
          objConsumedIndices.add(i);
          detectedObjects.push({
            type: 'Direct Object (Akkusativ-Objekt)',
            case: 'Akkusativ',
            phrase: t.clean,
            isPronoun: true,
            pronoun: pr
          });
        }
      }
    }

    // D. Detect Bare Nouns (Nullartikel) following action verbs
    for (let i = 0; i < tokens.length; i++) {
      if (objConsumedIndices.has(i) || subjectIndices.has(i)) continue;
      const t = tokens[i];
      const isNoun = /^[A-ZÄÖÜ]/.test(t.clean) || COMMON_GERMAN_NOUNS[t.lower] || (VOCAB_LOOKUP_MAP && VOCAB_LOOKUP_MAP[t.lower]);
      if (isNoun && !KNOWN_VERB_CONJUGATIONS[t.lower] && !GERMAN_PRONOUNS_DICT[t.lower]) {
        const nInfo = resolveNounGender(t.clean);
        objConsumedIndices.add(i);
        detectedObjects.push({
          type: 'Direct Object (Akkusativ • Zero Article)',
          case: 'Akkusativ',
          phrase: t.clean,
          article: null,
          noun: t.clean,
          nounLower: t.lower,
          nounInfo: nInfo,
          isBare: true
        });
      }
    }

    // Build Objects HTML & Explanations
    let objectsHtml = '';
    const vName = finiteVerbToken ? finiteVerbToken.token.clean : 'the verb';
    const vInf = finiteVerbToken ? finiteVerbToken.info.inf : 'the verb';

    if (detectedObjects.length > 0) {
      objectsHtml = detectedObjects.map((obj) => {
        const escapedPhrase = obj.phrase.replace(/'/g, "\\'");
        let caseBadgeColor = 'bg-blue-100 text-blue-950 border-blue-300';
        if (obj.case.includes('Dativ')) caseBadgeColor = 'bg-purple-100 text-purple-950 border-purple-300';

        // 1. Question Answered
        let questionText = '';
        if (obj.case === 'Akkusativ') {
          questionText = `<strong>Wen oder was ${vName} ...?</strong> (Whom or what?) &rarr; <span class="text-blue-700 underline font-black">${obj.phrase}</span>`;
        } else if (obj.case === 'Dativ') {
          questionText = `<strong>Wem ${vName} ...?</strong> (To whom / for whom?) &rarr; <span class="text-purple-700 underline font-black">${obj.phrase}</span>`;
        } else {
          questionText = `Governed by preposition <strong>"${obj.prep || 'preposition'}"</strong>.`;
        }

        // 2. Trigger
        let triggerText = '';
        if (obj.prep) {
          triggerText = `The preposition <strong>"${obj.prep}"</strong> (${obj.prepMeaning || ''}) strictly forces the <strong>${obj.prepCase}</strong> case. In German, any noun or pronoun after "${obj.prep}" MUST take ${obj.prepCase}!`;
        } else if (finiteVerbToken && finiteVerbToken.info.governs === 'Dativ') {
          triggerText = `The verb <strong>"${vName}"</strong> (base: <em>${vInf}</em>) is a special German Dative verb that strictly requires an <strong>Indirect Object in the Dativ case</strong>.`;
        } else {
          triggerText = `The verb <strong>"${vName}"</strong> (base: <em>${vInf}</em>) is an action verb directing its action onto a recipient. The direct object receiving the action takes the <strong>Akkusativ</strong> case.`;
        }

        // 3. Base Noun Info & Step-by-Step Transformation
        let baseNounHtml = '';
        let stepPillsHtml = '';
        let whyRuleHtml = '';

        if (obj.isPronoun) {
          const pr = obj.pronoun;
          baseNounHtml = `
            <div class="p-2.5 bg-white/90 rounded-xl border border-sky-200 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span class="text-[10px] font-black uppercase text-sky-700 tracking-wider">Pronoun Form:</span>
                <span class="font-extrabold text-sky-950 ml-1">"${obj.phrase}"</span>
              </div>
              <div>
                <span class="text-[10px] font-black uppercase text-sky-700 tracking-wider">Base Pronoun (Nominativ):</span>
                <span class="font-extrabold text-emerald-800 ml-1">"${pr.base}" (${pr.en})</span>
              </div>
            </div>
          `;
          stepPillsHtml = `
            <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">1. Base: ${pr.base} (${pr.en})</span>
            <span class="text-sky-400 font-black">&rarr;</span>
            <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-300">2. ${obj.case} Object</span>
            <span class="text-sky-400 font-black">&rarr;</span>
            <span class="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300">3. Shifts: ${pr.base} &rarr; ${obj.phrase}</span>
            <span class="text-sky-400 font-black">&rarr;</span>
            <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">4. Result: ${obj.phrase} ✅</span>
          `;
          whyRuleHtml = `
            <p>🔄 <strong>Pronoun Declension Rule:</strong> In German, personal pronouns have special object forms. Just like English switches from <em>"he" &rarr; "him"</em> or <em>"I" &rarr; "me"</em>, German switches from <strong>"${pr.base}" &rarr; "${obj.phrase}"</strong> in the ${obj.case} case. (e.g. <em>ich liebe dich</em>, NEVER <s>ich liebe du</s>!).</p>
          `;
        } else if (obj.noun) {
          const nInfo = obj.nounInfo || { gender: 'der', en: obj.noun };
          const gGender = nInfo.gender || 'der';
          const gColor = gGender === 'der' ? 'text-blue-600' : (gGender === 'die' ? 'text-rose-600' : 'text-emerald-600');
          const gLabel = gGender === 'der' ? 'Masculine 🔵' : (gGender === 'die' ? 'Feminine 🔴' : 'Neuter 🟢');

          baseNounHtml = `
            <div class="p-2.5 bg-white/90 rounded-xl border border-sky-200 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span class="text-[10px] font-black uppercase text-sky-700 tracking-wider">Base Dictionary Word:</span>
                <span class="font-extrabold text-sky-950 ml-1"><strong>${gGender} ${obj.noun}</strong></span>
                <span class="text-[11px] font-bold ${gColor} ml-1">(${gLabel})</span>
              </div>
              <div>
                <span class="text-[10px] font-black uppercase text-sky-700 tracking-wider">Meaning:</span>
                <span class="font-extrabold text-sky-900 ml-1">${nInfo.en ? `"${nInfo.en}"` : ''}</span>
              </div>
            </div>
          `;

          if (obj.isBare) {
            stepPillsHtml = `
              <span class="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-900 border border-sky-300">1. Base: ${gGender} ${obj.noun}</span>
              <span class="text-sky-400 font-black">&rarr;</span>
              <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-300">2. Akkusativ Object</span>
              <span class="text-sky-400 font-black">&rarr;</span>
              <span class="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold">3. Zero Article (Nullartikel)</span>
              <span class="text-sky-400 font-black">&rarr;</span>
              <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">4. Result: ${obj.phrase} ✅</span>
            `;
            whyRuleHtml = `
              <p>💡 <strong>Nullartikel (Zero Article) in Akkusativ:</strong></p>
              <p>The noun <strong>"${obj.noun}"</strong> is used without an article. In German, zero article is standard for uncountable food & drinks (Kaffee, Tee, Wasser, Brot), languages (Deutsch, Englisch), and abstract concepts (Zeit, Hilfe). It remains the <strong>Akkusativ direct object</strong> of "${vName}".</p>
            `;
          } else if (obj.case === 'Akkusativ') {
            if (gGender === 'der') {
              stepPillsHtml = `
                <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-300">1. Base: der / ein ${obj.noun} 🔵</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">2. Case: Akkusativ (Direct Obj)</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-black">3. Masculine Rule: der/ein &rarr; den/einen (-en)</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">4. Result: ${obj.phrase} ✅</span>
              `;
              whyRuleHtml = `
                <p>🚨 <strong>The Golden Masculine Rule (Why it became "${obj.article || 'einen/den'}"):</strong></p>
                <p>In German, <strong>ONLY masculine nouns change their articles in the Accusative case</strong>! Feminine (die), neuter (das), and plural never change in Akkusativ.</p>
                <ul class="list-disc list-inside space-y-1 font-semibold text-blue-950 pl-1">
                  <li>Definite: <em>der</em> &rarr; <strong class="text-rose-600 font-black">den</strong></li>
                  <li>Indefinite: <em>ein</em> &rarr; <strong class="text-rose-600 font-black">einen</strong> (receives the signature <strong>-en</strong> ending!)</li>
                  <li>Negative / Possessive: <em>kein / mein</em> &rarr; <strong class="text-rose-600 font-black">keinen / meinen</strong></li>
                </ul>
                <p class="pt-1 text-emerald-800 font-bold">✨ <strong>Crucial A1 Rule:</strong> Because <em>${obj.noun}</em> is masculine (<strong>der ${obj.noun}</strong>), you MUST say <u class="text-rose-600 font-black">"${obj.phrase}"</u>. Saying <s>"ich habe ein ${obj.noun}"</s> is a very common beginner mistake!</p>
              `;
            } else if (gGender === 'die') {
              stepPillsHtml = `
                <span class="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-300">1. Base: die / eine ${obj.noun} 🔴</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">2. Case: Akkusativ (Direct Obj)</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">3. Feminine Rule: Stays UNCHANGED!</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">4. Result: ${obj.phrase} ✅</span>
              `;
              whyRuleHtml = `
                <p>✅ <strong>The Feminine Akkusativ Rule (Why "${obj.article || 'eine/die'}" did NOT change):</strong></p>
                <p>In German, <strong>feminine articles NEVER change in the Accusative case</strong>! They remain 100% identical to the base Nominativ form:</p>
                <p>• <em>die</em> stays <strong>die</strong>, and <em>eine</em> stays <strong>eine</strong>.</p>
                <p class="pt-1 text-emerald-800 font-bold">✨ <strong>Crucial A1 Rule:</strong> You say <u class="text-emerald-700 font-bold">"${obj.phrase}"</u> (NOT <s>"einen ${obj.noun}"</s>). The <strong>-en</strong> ending belongs strictly to masculine nouns!</p>
              `;
            } else {
              // das (Neuter)
              stepPillsHtml = `
                <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">1. Base: das / ein ${obj.noun} 🟢</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">2. Case: Akkusativ (Direct Obj)</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">3. Neuter Rule: Stays UNCHANGED!</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">4. Result: ${obj.phrase} ✅</span>
              `;
              whyRuleHtml = `
                <p>✅ <strong>The Neuter Akkusativ Rule (Why "${obj.article || 'ein/das'}" did NOT change):</strong></p>
                <p>In German, <strong>neuter articles NEVER change in the Accusative case</strong>! They remain 100% identical to the base Nominativ form:</p>
                <p>• <em>das</em> stays <strong>das</strong>, and <em>ein</em> stays <strong>ein</strong>.</p>
                <p class="pt-1 text-emerald-800 font-bold">✨ <strong>Crucial A1 Rule:</strong> You say <u class="text-emerald-700 font-bold">"${obj.phrase}"</u> (NOT <s>"einen ${obj.noun}"</s>). Neuter nouns never take -en in Akkusativ!</p>
              `;
            }
          } else {
            // Dativ
            if (gGender === 'die') {
              stepPillsHtml = `
                <span class="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-300">1. Base: die / eine ${obj.noun} 🔴</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-300">2. Case: Dativ (Indirect / Prep)</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-purple-200 text-purple-950 border border-purple-400 font-black">3. Feminine Shift: die &rarr; der / eine &rarr; einer (-er)</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">4. Result: ${obj.phrase} ✅</span>
              `;
              whyRuleHtml = `
                <p>⚡ <strong>The Feminine Dative Surprise (die &rarr; der, eine &rarr; einer):</strong></p>
                <p>In Dativ, the feminine article shifts from <strong>die &rarr; der</strong>, and from <strong>eine &rarr; einer</strong> (receiving the <strong>-er</strong> ending)!</p>
                <p>⚠️ <strong>Crucial Beginner Insight:</strong> Although 'der' is masculine in Nominativ, here it is the <strong>feminine dative article</strong> meaning <em>"to the woman / with the subway"</em> (e.g. <em>Ich helfe der Frau</em>, <em>Ich fahre mit der U-Bahn</em>).</p>
                <p class="pt-1 text-purple-900 font-bold">✨ That is why you say <u class="text-purple-700 font-bold">"${obj.phrase}"</u>!</p>
              `;
            } else {
              // der or das in Dativ
              stepPillsHtml = `
                <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-300">1. Base: ${gGender} ${obj.noun}</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-300">2. Case: Dativ (Indirect / Prep)</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-purple-200 text-purple-950 border border-purple-400 font-black">3. Dative -em Rule: ${gGender} &rarr; dem / ein &rarr; einem (-em)</span>
                <span class="text-sky-400 font-black">&rarr;</span>
                <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">4. Result: ${obj.phrase} ✅</span>
              `;
              whyRuleHtml = `
                <p>🚨 <strong>The Dative -em Rule (der/das &rarr; dem, ein &rarr; einem):</strong></p>
                <p>In the Dativ case, both masculine (<strong>der</strong>) and neuter (<strong>das</strong>) articles change to <strong class="text-purple-700">dem</strong> (definite) or <strong class="text-purple-700">einem</strong> (indefinite), taking the signature <strong>-em</strong> ending.</p>
                <p class="pt-1 text-purple-900 font-bold">✨ That is why you say <u class="text-purple-700 font-bold">"${obj.phrase}"</u> (e.g. <em>dem Mann</em>, <em>mit dem Bus</em>)!</p>
              `;
            }
          }
        }

        return `
          <div class="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 rounded-2xl border border-blue-200 shadow-2xs space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-blue-200">
              <div class="flex items-center gap-2">
                <span class="text-base">🎯</span>
                <span class="font-black text-sm text-blue-950">
                  Object: <strong class="text-blue-800">"${obj.phrase}"</strong>
                </span>
                <button onclick="playGermanSpeech('${escapedPhrase}', this)" class="px-2 py-0.5 rounded-md bg-white text-blue-600 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Listen to pronunciation">
                  <span>🔊</span><span>Listen</span>
                </button>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${caseBadgeColor}">${obj.type}</span>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-white text-blue-900 border-blue-200">Case: ${obj.case}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div class="p-2.5 bg-white/95 rounded-xl border border-blue-100 text-blue-950 space-y-1">
                <span class="text-[10px] font-black uppercase text-blue-800 tracking-wider">❓ Question Answered in German:</span>
                <p class="font-bold text-sky-900 leading-snug">${questionText}</p>
              </div>
              <div class="p-2.5 bg-white/95 rounded-xl border border-blue-100 text-blue-950 space-y-1">
                <span class="text-[10px] font-black uppercase text-blue-800 tracking-wider">⚡ Case Trigger (Why this case?):</span>
                <p class="text-sky-900 leading-snug">${triggerText}</p>
              </div>
            </div>

            ${baseNounHtml}

            <div class="space-y-1">
              <span class="text-[10px] font-black uppercase text-blue-900 tracking-wider">🔄 Step-by-Step Transformation:</span>
              <div class="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-blue-200 text-[11px] font-bold">
                ${stepPillsHtml}
              </div>
            </div>

            <div class="p-2.5 bg-white/95 rounded-xl border border-blue-200 text-xs text-blue-950 leading-relaxed space-y-1.5">
              <div class="font-black text-xs text-blue-900 flex items-center gap-1.5">
                <span>💡</span>
                <span>Why did the article change this way? (A1 Rule Breakdown):</span>
              </div>
              ${whyRuleHtml}
            </div>
          </div>
        `;
      }).join('');

      // Add Two-Object explanation if there are both Dative and Accusative objects
      const hasDativObj = detectedObjects.some(o => o.case.includes('Dativ'));
      const hasAkkObj = detectedObjects.some(o => o.case.includes('Akkusativ'));
      if (hasDativObj && hasAkkObj && detectedObjects.length >= 2) {
        objectsHtml += `
          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
            <span class="text-base">💡</span>
            <div>
              <strong class="font-extrabold text-amber-900">German Two-Object Word Order Rule:</strong>
              <p>When a sentence has both a <strong>Dativ person (the recipient)</strong> and an <strong>Akkusativ thing (the item)</strong>, German puts the <strong>Dative person FIRST</strong> and the <strong>Accusative thing SECOND</strong>! (e.g. <em>Ich gebe [der Frau - Dativ] [das Buch - Akkusativ]</em>).</p>
            </div>
          </div>
        `;
      }
    } else {
      // No object detected
      if (finiteVerbToken && finiteVerbToken.info.copula) {
        objectsHtml = `
          <div class="p-3 bg-white rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1.5">
            <div class="flex items-center gap-2 font-bold text-sky-950">
              <span class="text-base">💡</span>
              <span>The Equal Sign Rule ($A = B$) • No Object Required</span>
            </div>
            <p>The verb <strong>"${vName}"</strong> (base: <em>${vInf}</em>) is a linking verb (copula). It acts like an equal sign in mathematics ($A = B$). Both sides stay in the <strong>Nominativ</strong> case, so there is no accusative or dative object in this sentence!</p>
          </div>
        `;
      } else {
        objectsHtml = `
          <div class="p-3 bg-white rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1.5">
            <div class="flex items-center gap-2 font-bold text-sky-950">
              <span class="text-base">ℹ️</span>
              <span>Intransitive Verb • No Direct Object Required</span>
            </div>
            <p>The verb <strong>"${vName}"</strong> (base: <em>${vInf}</em>) is used intransitively here (it describes an action of the subject alone without an object receiving it). No object or article declension is needed!</p>
          </div>
        `;
      }
    }

    const masterArticleTableHtml = `
      <div class="p-3.5 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-1">
          <div class="flex items-center gap-1.5 font-extrabold text-xs text-sky-950">
            <span>📊</span>
            <span>A1 Master Article Declension Table (Nominativ vs Akkusativ vs Dativ):</span>
          </div>
          <span class="text-[10px] text-sky-600 italic">Notice the highlighted changes!</span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-sky-200">
          <table class="w-full text-center text-[11px] border-collapse">
            <thead>
              <tr class="bg-sky-100 text-sky-950 font-black border-b border-sky-200">
                <th class="p-2 text-left">Case & Role</th>
                <th class="p-2 bg-blue-50 text-blue-950">Masculine (der) 🔵</th>
                <th class="p-2 bg-rose-50 text-rose-950">Feminine (die) 🔴</th>
                <th class="p-2 bg-emerald-50 text-emerald-950">Neuter (das) 🟢</th>
                <th class="p-2 bg-amber-50 text-amber-950">Plural (die) 🟡</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sky-100 text-sky-900">
              <tr>
                <td class="p-2 text-left font-bold bg-slate-50 text-slate-800">
                  <strong>Nominativ</strong> (Subject • <em>Wer/Was?</em>)
                </td>
                <td class="p-2 font-medium">der / ein</td>
                <td class="p-2 font-medium">die / eine</td>
                <td class="p-2 font-medium">das / ein</td>
                <td class="p-2 font-medium">die / keine</td>
              </tr>
              <tr class="bg-blue-50/40">
                <td class="p-2 text-left font-bold text-blue-950">
                  <strong>Akkusativ</strong> (Direct Object • <em>Wen/Was?</em>)
                </td>
                <td class="p-2 font-black text-rose-600 bg-rose-100/80 rounded border border-rose-300">
                  den / einen ⭐
                  <span class="block text-[9px] font-bold text-rose-600 uppercase">Only masc changes! (-en)</span>
                </td>
                <td class="p-2 text-emerald-800 font-semibold">
                  die / eine
                  <span class="block text-[9px] text-emerald-600 font-bold">(Unchanged)</span>
                </td>
                <td class="p-2 text-emerald-800 font-semibold">
                  das / ein
                  <span class="block text-[9px] text-emerald-600 font-bold">(Unchanged)</span>
                </td>
                <td class="p-2 text-emerald-800 font-semibold">
                  die / keine
                  <span class="block text-[9px] text-emerald-600 font-bold">(Unchanged)</span>
                </td>
              </tr>
              <tr class="bg-purple-50/40">
                <td class="p-2 text-left font-bold text-purple-950">
                  <strong>Dativ</strong> (Indirect Object • <em>Wem?</em>)
                </td>
                <td class="p-2 font-black text-purple-900 bg-purple-100/60 rounded border border-purple-200">
                  dem / einem (-em)
                </td>
                <td class="p-2 font-black text-purple-700 bg-purple-200/80 rounded border border-purple-400">
                  der / einer ⚡
                  <span class="block text-[9px] font-bold text-purple-700 uppercase">die &rarr; der shift!</span>
                </td>
                <td class="p-2 font-black text-purple-900 bg-purple-100/60 rounded border border-purple-200">
                  dem / einem (-em)
                </td>
                <td class="p-2 font-bold text-purple-900">
                  den (+n to noun)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 text-sky-900">
          <div class="p-2 bg-rose-50 rounded-xl border border-rose-200">
            <strong class="text-rose-900 font-extrabold">🚨 The Akkusativ Secret:</strong>
            <p>In the Accusative case, <strong>ONLY masculine nouns change</strong> (<em>der &rarr; den</em>, <em>ein &rarr; einen</em>). Feminine and neuter NEVER change in Akkusativ!</p>
          </div>
          <div class="p-2 bg-purple-50 rounded-xl border border-purple-200">
            <strong class="text-purple-900 font-extrabold">⚡ The Dativ Secret:</strong>
            <p>In Dative, masculine and neuter get <strong>-em</strong> (<em>dem / einem</em>), while feminine flips from <strong>die &rarr; der</strong> (<em>der / einer</em>)!</p>
          </div>
        </div>
      </div>
    `;

    // 4. Cases & Roles Engine (Overview: Who Does What?)
    let caseItems = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const prev = i > 0 ? tokens[i - 1] : null;
      const prevPrev = i > 1 ? tokens[i - 2] : null;

      // Check Pronouns
      if (GERMAN_PRONOUNS_DICT[t.lower]) {
        const pr = GERMAN_PRONOUNS_DICT[t.lower];
        let detectedCase = pr.case;
        let detectedRole = pr.role;
        let reason = pr.reason;

        if (t.lower === 'dich' || t.lower === 'mich' || t.lower === 'ihn') {
          detectedCase = 'Akkusativ';
          detectedRole = 'Direct Object (The Receiver)';
          reason = `<strong>Who is receiving the action?</strong> <strong>"${t.clean}"</strong> (${pr.en}). In German, the base pronoun <em>${pr.base}</em> changes to <strong>"${t.clean}"</strong> in the <strong>Akkusativ</strong> case because the verb <strong>"${vName}"</strong> directs its action directly onto it!`;
        } else if (t.lower === 'dir' || t.lower === 'mir' || t.lower === 'ihm' || t.lower === 'ihnen' || t.lower === 'Ihnen') {
          detectedCase = 'Dativ';
          detectedRole = 'Indirect Object / Recipient';
          const trigger = (prev && GERMAN_PREPOSITIONS_DICT[prev.lower]) ? `preposition "${prev.clean}"` : (finiteVerbToken ? `verb "${finiteVerbToken.token.clean}"` : 'Dative rule');
          reason = `<strong>Who is receiving the benefit or object?</strong> <strong>"${t.clean}"</strong> (${pr.en}). Form of <em>${pr.base}</em> in the <strong>Dativ</strong> case, triggered by ${trigger}.`;
        } else if (['ich', 'du', 'er', 'wir', 'ihr', 'man'].includes(t.lower)) {
          detectedCase = 'Nominativ';
          detectedRole = 'Subject (The Doer)';
          reason = `<strong>Who is doing the action?</strong> <strong>"${t.clean}"</strong> (${pr.en}) is the <strong>Subject</strong> (*Wer oder was?*). In German, the subject is ALWAYS in the <strong>Nominative (Nominativ)</strong> case.`;
        } else if (t.lower === 'sie' || t.lower === 'es') {
          if (i === 0 || (i === 2 && finiteVerbToken && finiteVerbToken.index === 1 && !['ich','du','er','wir','ihr'].includes(tokens[0].lower))) {
            detectedCase = 'Nominativ';
            detectedRole = 'Subject (The Doer)';
            reason = `Acts as the grammatical subject performing the action (${t.lower === 'es' ? 'it' : 'she / they'}).`;
          } else {
            detectedCase = 'Akkusativ';
            detectedRole = 'Direct Object (The Receiver)';
            reason = `Direct object receiving the verb\'s action (${t.lower === 'es' ? 'it' : 'her / them'}).`;
          }
        }

        caseItems.push({
          word: t.clean,
          type: 'Personal Pronoun',
          role: detectedRole,
          case: detectedCase,
          reason: reason
        });
        continue;
      }

      // Check Prepositions & Prepositional Phrases
      if (GERMAN_PREPOSITIONS_DICT[t.lower]) {
        const prep = GERMAN_PREPOSITIONS_DICT[t.lower];
        const next = i + 1 < tokens.length ? tokens[i + 1] : null;
        const nextNext = i + 2 < tokens.length ? tokens[i + 2] : null;
        let phrase = t.clean;
        if (next && ['der','die','das','dem','den','des','ein','eine','einen','einem','einer','kein','keinem','meinem','meiner','deinem'].includes(next.lower)) {
          phrase += ' ' + next.clean;
          if (nextNext && /^[A-ZÄÖÜ]/.test(nextNext.clean)) phrase += ' ' + nextNext.clean;
        } else if (next && (GERMAN_PRONOUNS_DICT[next.lower] || /^[A-ZÄÖÜ]/.test(next.clean))) {
          phrase += ' ' + next.clean;
        }

        let caseExpl = '';
        if (prep.case === 'Dativ') {
          caseExpl = `The preposition <strong>"${t.clean}"</strong> (${prep.meaning}) strictly requires the <strong>Dativ</strong> case! ${prep.contraction ? `(Contraction of <em>${prep.contraction}</em>).` : ''} Any noun or pronoun following it must be in Dativ.`;
        } else if (prep.case === 'Akkusativ') {
          caseExpl = `The preposition <strong>"${t.clean}"</strong> (${prep.meaning}) strictly requires the <strong>Akkusativ</strong> case! ${prep.contraction ? `(Contraction of <em>${prep.contraction}</em>).` : ''} Any noun or pronoun following it must be in Akkusativ.`;
        } else {
          caseExpl = `Two-way preposition (Wechselpräposition). Takes <strong>Dativ</strong> for location (*Wo?* = Where at?) and <strong>Akkusativ</strong> for destination (*Wohin?* = Where to?).`;
        }

        caseItems.push({
          word: phrase,
          type: 'Prepositional Phrase',
          role: `${prep.case} Trigger`,
          case: prep.case,
          reason: caseExpl
        });
        continue;
      }

      // Check Nouns & Articles
      const lookup = VOCAB_LOOKUP_MAP[t.lower] || COMMON_GERMAN_NOUNS[t.lower];
      const isCapitalized = /^[A-ZÄÖÜ]/.test(t.clean);

      if ((lookup || isCapitalized) && !KNOWN_VERB_CONJUGATIONS[t.lower]) {
        if (prev && GERMAN_PREPOSITIONS_DICT[prev.lower]) continue;
        if (prevPrev && GERMAN_PREPOSITIONS_DICT[prevPrev.lower]) continue;

        const nounName = lookup ? lookup.noun || t.clean : t.clean;
        const gender = lookup ? lookup.gender : 'noun';
        let detectedCase = 'Nominativ';
        let detectedRole = 'Subject';
        let reason = '';

        if (prev && ['den', 'einen', 'keinen', 'meinen', 'deinen'].includes(prev.lower)) {
          detectedCase = 'Akkusativ';
          detectedRole = 'Direct Object (Akkusativ)';
          reason = `<strong>Masculine Accusative Change</strong>: <strong>${prev.clean} ${t.clean}</strong> is the direct object receiving the action. In German, ONLY masculine articles change in Akkusativ: <em>der &rarr; den</em>, <em>ein &rarr; einen</em>!`;
        } else if (prev && ['dem', 'einem', 'keinem', 'meinem', 'deinem'].includes(prev.lower)) {
          detectedCase = 'Dativ';
          detectedRole = 'Dative Object (Dativ)';
          reason = `<strong>Dative Case</strong>: Article changes to <strong>${prev.clean}</strong> in the Dative case (<em>der/das &rarr; dem</em>, <em>ein &rarr; einem</em>).`;
        } else if (prev && ['der', 'einer'].includes(prev.lower) && gender === 'die') {
          detectedCase = 'Dativ';
          detectedRole = 'Feminine in Dative';
          reason = `<strong>Feminine Dative Shift</strong>: In Dative, the feminine article turns into <strong>${prev.clean}</strong> (<em>die Frau &rarr; der Frau</em>).`;
        } else if (i > 1 && finiteVerbToken && finiteVerbToken.info.copula) {
          detectedCase = 'Nominativ';
          detectedRole = 'Predicate Noun (Equal Sign =)';
          reason = `Linked by the verb <em>sein</em> (is/are). Acts like an equal sign, so <strong>${t.clean}</strong> stays in the base <strong>Nominative</strong> case.`;
        } else if (i > 1 && finiteVerbToken && finiteVerbToken.info.governs === 'Akkusativ') {
          detectedCase = 'Akkusativ';
          detectedRole = 'Direct Object (Akkusativ)';
          reason = `Direct object receiving the action of the verb <strong>"${finiteVerbToken.token.clean}"</strong> (*Wen oder was?*). Feminine and neuter nouns keep their standard articles in Akkusativ!`;
        } else {
          detectedCase = 'Nominativ';
          detectedRole = 'Subject (The Doer)';
          reason = `Acts as the grammatical subject (*Wer oder was?*) performing the action. Always in the base Nominative case.`;
        }

        caseItems.push({
          word: (prev && ['der','die','das','den','dem','ein','eine','einen','einem','kein','keinen','mein','meinen'].includes(prev.lower) ? prev.clean + ' ' : '') + t.clean,
          type: gender !== 'noun' ? `Noun (${gender})` : 'Noun',
          role: detectedRole,
          case: detectedCase,
          reason: reason
        });
      }
    }

    let caseCardsHtml = '';
    if (caseItems.length > 0) {
      caseCardsHtml = caseItems.map(c => {
        let caseBadge = 'bg-emerald-100 text-emerald-900 border-emerald-300';
        if (c.case === 'Akkusativ') caseBadge = 'bg-blue-100 text-blue-900 border-blue-300';
        if (c.case === 'Dativ') caseBadge = 'bg-purple-100 text-purple-900 border-purple-300';

        return `
          <div class="p-3 bg-white rounded-xl border border-sky-200 shadow-2xs text-xs space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="font-black text-sky-950 text-sm">${c.word}</span>
              <div class="flex items-center gap-1">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded border bg-sky-100 text-sky-800 border-sky-200">${c.role}</span>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded border ${caseBadge}">${c.case}</span>
              </div>
            </div>
            <p class="text-sky-800 leading-snug">${c.reason}</p>
          </div>
        `;
      }).join('');
    } else {
      caseCardsHtml = `<p class="text-sky-600 italic text-xs">No complex noun phrases or pronouns requiring case declension in this short clause.</p>`;
    }

    // 5. Word-by-Word Interactive Token Grid
    let tokenCardsHtml = tokens.map((t, idx) => {
      let pos = 'Word';
      let posColor = 'bg-slate-100 text-slate-800 border-slate-300';
      let note = 'Word in sentence';

      if (finiteVerbToken && idx === finiteVerbToken.index) {
        pos = 'Verb (Pos 2)';
        posColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
        note = `${finiteVerbToken.info.person} • Base: ${finiteVerbToken.info.inf}`;
      } else if (GERMAN_PRONOUNS_DICT[t.lower]) {
        const pr = GERMAN_PRONOUNS_DICT[t.lower];
        if (pr.case === 'Nominativ') {
          pos = 'Subject (Nom)';
          posColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
          note = `Pronoun: ${pr.en} • The Doer`;
        } else if (pr.case === 'Akkusativ') {
          pos = 'Object (Akk)';
          posColor = 'bg-blue-100 text-blue-900 border-blue-300';
          note = `Pronoun: ${pr.en} • The Receiver`;
        } else if (pr.case === 'Dativ') {
          pos = 'Object (Dat)';
          posColor = 'bg-purple-100 text-purple-900 border-purple-300';
          note = `Pronoun: ${pr.en} • Recipient`;
        }
      } else if (GERMAN_PREPOSITIONS_DICT[t.lower]) {
        pos = 'Preposition';
        posColor = 'bg-indigo-100 text-indigo-900 border-indigo-300';
        note = `${GERMAN_PREPOSITIONS_DICT[t.lower].case} • ${GERMAN_PREPOSITIONS_DICT[t.lower].meaning}`;
      } else if (QUESTION_WORDS_DICT[t.lower]) {
        pos = 'Question Word';
        posColor = 'bg-amber-100 text-amber-900 border-amber-300';
        note = QUESTION_WORDS_DICT[t.lower];
      } else if (SUBORDINATING_CONJUNCTIONS_DICT[t.lower] || COORDINATING_CONJUNCTIONS_DICT[t.lower]) {
        pos = 'Conjunction';
        posColor = 'bg-sky-100 text-sky-900 border-sky-300';
        note = SUBORDINATING_CONJUNCTIONS_DICT[t.lower] ? 'Subordinator (Verb-Kicker)' : 'Coordinator (Pos 0)';
      } else if (INVERSION_ADVERBS_DICT[t.lower]) {
        pos = 'Adverb';
        posColor = 'bg-teal-100 text-teal-900 border-teal-300';
        note = INVERSION_ADVERBS_DICT[t.lower];
      } else if (['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'kein', 'keine', 'keinen', 'keinem'].includes(t.lower)) {
        pos = 'Article';
        posColor = 'bg-blue-100 text-blue-900 border-blue-300';
        note = 'Determiner / Article';
      } else if (/^[A-ZÄÖÜ]/.test(t.clean)) {
        pos = 'Noun';
        posColor = 'bg-cyan-100 text-cyan-900 border-cyan-300';
        const lk = VOCAB_LOOKUP_MAP[t.lower] || COMMON_GERMAN_NOUNS[t.lower];
        note = lk ? `${lk.gender.toUpperCase()} (${lk.en})` : 'Noun';
      }

      const escapedWord = t.clean.replace(/'/g, "\\'");
      return `
        <div class="bg-white p-2.5 rounded-xl border border-sky-200 shadow-2xs flex flex-col justify-between hover:border-sky-400 transition">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${posColor}">${pos}</span>
            <button onclick="playGermanSpeech('${escapedWord}', this)" class="p-1 rounded-md text-sky-600 hover:bg-sky-100 transition cursor-pointer" title="Listen to pronunciation">
              🔊
            </button>
          </div>
          <div class="text-sm font-black text-sky-950 my-1">${t.clean}</div>
          <div class="text-[10px] text-sky-700 font-medium leading-tight">${note}</div>
        </div>
      `;
    }).join('');

    return `
      <!-- Grammar Analysis Header -->
      <div class="flex items-center justify-between pb-2 border-b border-sky-200">
        <h4 class="font-extrabold text-sm text-sky-950 flex items-center gap-2">
          <span>📑</span>
          <span>A1 Beginner-Friendly German Grammar Breakdown</span>
        </h4>
        <span class="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
          A1 Level Guide
        </span>
      </div>

      <!-- Card 1: Sentence Architecture & Word Positions -->
      <div class="p-4 bg-gradient-to-r from-sky-50 to-blue-50/70 rounded-2xl border border-sky-200 shadow-2xs space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-base">🧩</span>
            <span class="font-extrabold text-xs text-sky-950">Sentence Structure & Word Positions:</span>
          </div>
          <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${sentenceBadgeColor}">${sentenceType}</span>
        </div>

        <!-- Visual Position Pills -->
        <div class="flex flex-wrap items-center gap-2 pt-1 pb-1">
          ${positionPillsHtml}
        </div>

        <div class="p-2.5 bg-white/95 rounded-xl border border-sky-200 text-xs text-sky-900 leading-relaxed space-y-1">
          <p>${sentenceDesc}</p>
          <p>${wordOrderExplanation}</p>
        </div>

        ${bracketInfo ? `
          <div class="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
            <span class="text-sm">🔗</span>
            <div>
              <strong class="font-extrabold">${bracketInfo.type}:</strong> ${bracketInfo.desc}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Card 2: Verb Conjugation Analysis -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-base">⚡</span>
          <span class="font-extrabold text-xs text-sky-950">Verb & Conjugation (Why does the verb end this way?):</span>
        </div>
        ${verbDetailsHtml}
      </div>

      <!-- Card 3: Dedicated Object & Article Deep Dive -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">🎯</span>
            <span class="font-extrabold text-xs text-sky-950">Object & Article Analysis (What Case is the Object and Why Did the Article Change?):</span>
          </div>
          <span class="text-[10px] text-sky-600 font-bold">${detectedObjects.length} object(s) analyzed</span>
        </div>
        <div class="space-y-3">
          ${objectsHtml}
          ${masterArticleTableHtml}
        </div>
      </div>

      <!-- Card 4: Cases & Roles Engine Overview -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">📦</span>
            <span class="font-extrabold text-xs text-sky-950">Sentence Roles Overview (Who Does What?):</span>
          </div>
          <span class="text-[10px] text-sky-600 font-bold">${caseItems.length} items identified</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          ${caseCardsHtml}
        </div>
      </div>

      <!-- Card 5: Word-by-Word Interactive Token Grid -->
      <div class="space-y-2 pt-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">🔍</span>
            <span class="font-extrabold text-xs text-sky-950">Interactive Word-by-Word Breakdown (Click 🔊 to listen to each word):</span>
          </div>
          <span class="text-[10px] text-sky-600 font-semibold">${tokens.length} words analyzed</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          ${tokenCardsHtml}
        </div>
      </div>
    `;
  }

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
              <button onclick="playGermanSpeech('${escapeHtml(item.german)}', this)" class="p-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs font-bold transition cursor-pointer" title="Listen to pronunciation">
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
    if (['dashboard', 'lesson', 'pdf', 'vocab', 'progress'].includes(hash)) {
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

  // ================= 29. AI GERMAN CONVERSATIONAL ROLEPLAY (DIALOG PARTNER) =================
  const ROLEPLAY_SCENARIOS = {
    cafe: {
      title: "☕ Im Café (Ordering in a Café)",
      partner: "Herr Weber (Waiter)",
      initialGreeting: "Guten Tag! Herzlich willkommen im Café Alpenrose. Was darf ich Ihnen bringen?",
      initialGreetingEn: "Good day! Welcome to Café Alpenrose. What may I bring you?",
      suggestions: [
        { de: "Ich möchte bitte einen Kaffee und ein Stück Kuchen.", en: "I would like a coffee and a piece of cake, please." },
        { de: "Haben Sie auch Tee mit Zitrone?", en: "Do you also have tea with lemon?" },
        { de: "Eine heiße Schokolade, bitte.", en: "A hot chocolate, please." }
      ],
      responses: [
        {
          triggers: ["kaffee", "kuchen", "tee", "schokolade", "wasser", "cola"],
          botDe: "Sehr gerne! Möchten Sie Zucker und Milch dazu? Und darf es sonst noch etwas sein?",
          botEn: "With pleasure! Would you like sugar and milk with that? And anything else?",
          suggestions: [
            { de: "Mit Milch und ohne Zucker, bitte.", en: "With milk and without sugar, please." },
            { de: "Nein danke, das ist alles.", en: "No thank you, that is all." },
            { de: "Wir möchten auch zahlen, bitte.", en: "We would also like to pay, please." }
          ]
        },
        {
          triggers: ["zahlen", "rechnung", "bezahlen", "kostet"],
          botDe: "Zusammen oder getrennt? Das macht dann insgesamt 6 Euro 50, bitte.",
          botEn: "Together or separately? That makes 6 Euros 50 in total, please.",
          suggestions: [
            { de: "Zusammen, bitte. Hier sind 10 Euro.", en: "Together, please. Here is 10 Euros." },
            { de: "Stimmt so, vielen Dank!", en: "Keep the change, thank you very much!" },
            { de: "Kann ich mit Karte zahlen?", en: "Can I pay with card?" }
          ]
        },
        {
          triggers: ["stimmt", "hier", "karte", "danke", "euro"],
          botDe: "Vielen herzlichen Dank! Einen wunderschönen Tag noch und auf Wiedersehen!",
          botEn: "Thank you very much! Have a wonderful day and goodbye!",
          suggestions: [
            { de: "Danke gleichfalls! Auf Wiedersehen!", en: "Thanks, likewise! Goodbye!" },
            { de: "Tschüs, bis zum nächsten Mal!", en: "Bye, until next time!" }
          ]
        }
      ]
    },
    intro: {
      title: "👋 Sich vorstellen (Personal Introductions)",
      partner: "Lukas (Language Partner)",
      initialGreeting: "Hallo! Ich bin Lukas aus Berlin. Ich lerne Spanisch. Wie heißt du und woher kommst du?",
      initialGreetingEn: "Hello! I am Lukas from Berlin. I am learning Spanish. What is your name and where are you from?",
      suggestions: [
        { de: "Hallo Lukas! Ich heiße Maya und komme aus Indonesien.", en: "Hello Lukas! My name is Maya and I come from Indonesia." },
        { de: "Ich bin Alex. Ich wohne jetzt in Frankfurt.", en: "I am Alex. I live in Frankfurt now." },
        { de: "Freut mich! Ich lerne seit drei Monaten Deutsch.", en: "Pleased to meet you! I have been learning German for three months." }
      ],
      responses: [
        {
          triggers: ["heiße", "bin", "komme", "wohne", "indonesien", "spanien", "deutschland"],
          botDe: "Schön dich kennenzulernen! Welche Sprachen sprichst du denn, und was machst du beruflich?",
          botEn: "Nice to meet you! Which languages do you speak, and what do you do for work?",
          suggestions: [
            { de: "Ich spreche Englisch, Indonesisch und ein bisschen Deutsch.", en: "I speak English, Indonesian, and a little German." },
            { de: "Ich bin Studentin an der Universität.", en: "I am a university student." },
            { de: "Ich arbeite als Softwareentwickler in Vollzeit.", en: "I work full-time as a software developer." }
          ]
        },
        {
          triggers: ["englisch", "deutsch", "student", "arbeite", "beruf", "sprache"],
          botDe: "Toll! Dein Deutsch ist schon richtig gut! Was machst du gerne in deiner Freizeit? Hast du Hobbys?",
          botEn: "Great! Your German is already really good! What do you like doing in your free time? Do you have hobbies?",
          suggestions: [
            { de: "In meiner Freizeit höre ich Musik und koche gern.", en: "In my free time I listen to music and like cooking." },
            { de: "Ich spiele Fußball und treffe gern Freunde.", en: "I play football and like meeting friends." },
            { de: "Ich lese gern Bücher und reise viel.", en: "I like reading books and traveling a lot." }
          ]
        },
        {
          triggers: ["musik", "koche", "fußball", "freunde", "bücher", "reise", "hobby"],
          botDe: "Klingt super spannend! Wir können gerne öfter zusammen Deutsch und Englisch üben!",
          botEn: "Sounds super exciting! We can gladly practice German and English together more often!",
          suggestions: [
            { de: "Sehr gern! Danke für das nette Gespräch.", en: "With pleasure! Thanks for the nice conversation." },
            { de: "Ja super, bis bald!", en: "Yes great, see you soon!" }
          ]
        }
      ]
    },
    station: {
      title: "🚆 Am Bahnhof (At the Train Station)",
      partner: "Frau Schmidt (Deutsche Bahn Agent)",
      initialGreeting: "Guten Tag, Deutsche Bahn Reisezentrum. Wohin möchten Sie fahren?",
      initialGreetingEn: "Good day, Deutsche Bahn Travel Center. Where would you like to travel to?",
      suggestions: [
        { de: "Guten Tag! Ich brauche eine Fahrkarte nach München, bitte.", en: "Good day! I need a ticket to Munich, please." },
        { de: "Fährt heute noch ein ICE nach Berlin?", en: "Is there an ICE to Berlin departing today?" },
        { de: "Wann fährt der nächste Zug nach Hamburg ab?", en: "When does the next train to Hamburg depart?" }
      ],
      responses: [
        {
          triggers: ["münchen", "berlin", "hamburg", "köln", "frankfurt", "fahrkarte", "zug"],
          botDe: "Der nächste ICE fährt um 14:28 Uhr von Gleis 7 ab. Möchten Sie einfach oder hin und zurück?",
          botEn: "The next ICE departs at 14:28 from Platform 7. Would you like one-way or round trip?",
          suggestions: [
            { de: "Hin und zurück, bitte. Zweite Klasse.", en: "Round trip, please. Second class." },
            { de: "Nur einfach, bitte.", en: "One-way only, please." },
            { de: "Muss ich umsteigen oder ist es eine Direktverbindung?", en: "Do I have to change trains or is it a direct connection?" }
          ]
        },
        {
          triggers: ["einfach", "hin", "zurück", "klasse", "direkt", "umsteigen"],
          botDe: "Das ist ein direkter ICE ohne Umsteigen. Haben Sie eine BahnCard 25 oder 50?",
          botEn: "That is a direct ICE with no transfers. Do you have a BahnCard 25 or 50?",
          suggestions: [
            { de: "Nein, ich habe keine BahnCard.", en: "No, I do not have a BahnCard." },
            { de: "Ja, ich habe eine BahnCard 25.", en: "Yes, I have a BahnCard 25." }
          ]
        },
        {
          triggers: ["nein", "keine", "ja", "bahncard"],
          botDe: "Alles klar. Das Ticket kostet 49 Euro. Hier ist Ihre Fahrkarte. Gute Reise!",
          botEn: "All set. The ticket costs 49 Euros. Here is your ticket. Safe travels!",
          suggestions: [
            { de: "Vielen Dank für Ihre Hilfe! Auf Wiedersehen!", en: "Thank you very much for your help! Goodbye!" }
          ]
        }
      ]
    },
    market: {
      title: "🛒 Im Supermarkt (At the Supermarket / Market)",
      partner: "Herr Meier (Grocer)",
      initialGreeting: "Guten Tag! Der Käse und das Obst sind heute ganz frisch. Was darf es sein?",
      initialGreetingEn: "Good day! The cheese and fruit are completely fresh today. What can I get for you?",
      suggestions: [
        { de: "Ich nehme bitte ein Kilo Äpfel und etwas Käse.", en: "I will take one kilo of apples and some cheese, please." },
        { de: "Wie viel kosten die Tomaten heute?", en: "How much do the tomatoes cost today?" },
        { de: "Haben Sie frische Brötchen?", en: "Do you have fresh bread rolls?" }
      ],
      responses: [
        {
          triggers: ["äpfel", "käse", "tomaten", "brötchen", "brot", "kilo", "gramm"],
          botDe: "Sehr gerne. Wie viel Gramm Käse möchten Sie? Wir haben milden Gouda und würzigen Bergkäse.",
          botEn: "Gladly. How many grams of cheese would you like? We have mild Gouda and spicy alpine cheese.",
          suggestions: [
            { de: "200 Gramm Gouda, bitte.", en: "200 grams of Gouda, please." },
            { de: "150 Gramm Bergkäse in Scheiben, bitte.", en: "150 grams of alpine cheese sliced, please." }
          ]
        },
        {
          triggers: ["gramm", "gouda", "bergkäse", "scheiben", "stück"],
          botDe: "Bitteschön, das macht 200 Gramm. Darf es sonst noch etwas sein?",
          botEn: "Here you go, that is 200 grams. Anything else?",
          suggestions: [
            { de: "Nein danke, das ist alles. Was macht das zusammen?", en: "No thank you, that is all. How much is that altogether?" },
            { de: "Ich brauche noch eine Tüte, bitte.", en: "I also need a bag, please." }
          ]
        },
        {
          triggers: ["alles", "macht", "tüte", "kostet", "zahlen"],
          botDe: "Das macht zusammen 7 Euro 80. Vielen Dank für Ihren Einkauf!",
          botEn: "That makes 7 Euros 80 altogether. Thank you for your purchase!",
          suggestions: [
            { de: "Hier sind 10 Euro. Schönen Tag noch!", en: "Here are 10 Euros. Have a nice day!" }
          ]
        }
      ]
    },
    doctor: {
      title: "🩺 Beim Arzt (At the Doctor's Clinic)",
      partner: "Frau Dr. Weber (Doctor)",
      initialGreeting: "Guten Tag! Nehmen Sie bitte Platz. Was fehlt Ihnen denn? Wo haben Sie Schmerzen?",
      initialGreetingEn: "Good day! Please take a seat. What is troubling you? Where do you have pain?",
      suggestions: [
        { de: "Guten Tag, Frau Doktor. Ich habe seit gestern starke Kopfschmerzen.", en: "Good day, Doctor. I have had a severe headache since yesterday." },
        { de: "Mein Hals tut weh und ich habe leichtes Fieber.", en: "My throat hurts and I have a mild fever." },
        { de: "Ich fühle mich schwach und muss oft husten.", en: "I feel weak and have to cough often." }
      ],
      responses: [
        {
          triggers: ["kopf", "hals", "fieber", "husten", "schmerzen", "weh", "schwach"],
          botDe: "Ich verstehe. Haben Sie auch Bauchschmerzen oder Übelkeit? Wie hoch ist das Fieber?",
          botEn: "I understand. Do you also have stomach ache or nausea? How high is the fever?",
          suggestions: [
            { de: "Das Fieber ist bei 38,5 Grad, aber kein Bauchweh.", en: "The fever is at 38.5 degrees, but no stomach ache." },
            { de: "Nein, nur Husten und Halsschmerzen.", en: "No, only coughing and sore throat." }
          ]
        },
        {
          triggers: ["grad", "fieber", "husten", "halsschmerzen", "bauchweh", "nein"],
          botDe: "Das ist eine typische Erkältung. Ich schreibe Ihnen ein Rezept für Hustensaft auf. Trinken Sie viel warmen Tee und ruhen Sie sich drei Tage aus!",
          botEn: "That is a typical cold. I will write you a prescription for cough syrup. Drink plenty of warm tea and rest for three days!",
          suggestions: [
            { de: "Vielen Dank, Frau Doktor. Brauche ich eine Krankschreibung für die Arbeit?", en: "Thank you, Doctor. Do I need a sick note for work?" },
            { de: "Muss ich nächste Woche noch einmal wiederkommen?", en: "Do I need to come back again next week?" }
          ]
        },
        {
          triggers: ["arbeit", "krankschreibung", "wiederkommen", "woche", "danke"],
          botDe: "Hier ist Ihre Krankschreibung bis Freitag. Wenn es nicht besser wird, kommen Sie bitte am Montag wieder. Gute Besserung!",
          botEn: "Here is your sick note until Friday. If it does not get better, please return on Monday. Get well soon!",
          suggestions: [
            { de: "Vielen Dank für Ihre Hilfe! Auf Wiedersehen.", en: "Thank you very much for your help! Goodbye." }
          ]
        }
      ]
    }
  };

  let activeRoleplayKey = 'cafe';
  let roleplayChatHistory = [];
  let roleplayStepIndex = 0;

  window.openRoleplayModal = function(initialKey) {
    const modal = document.getElementById('roleplayModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    switchRoleplayScenario(initialKey || 'cafe');
  };

  window.closeRoleplayModal = function() {
    const modal = document.getElementById('roleplayModal');
    if (modal) modal.classList.add('hidden');
  };

  window.switchRoleplayScenario = function(key) {
    if (!ROLEPLAY_SCENARIOS[key]) key = 'cafe';
    activeRoleplayKey = key;
    roleplayStepIndex = 0;
    const scen = ROLEPLAY_SCENARIOS[key];

    // Update tab styling
    const tabs = ['cafe', 'intro', 'station', 'market', 'doctor'];
    tabs.forEach(t => {
      const el = document.getElementById(`roleplayTab-${t}`);
      if (el) {
        if (t === key) {
          el.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap bg-emerald-600 text-white shadow-xs";
        } else {
          el.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap bg-white text-sky-800 hover:bg-sky-100 border border-sky-200";
        }
      }
    });

    roleplayChatHistory = [
      {
        sender: 'bot',
        name: scen.partner,
        de: scen.initialGreeting,
        en: scen.initialGreetingEn
      }
    ];

    renderRoleplayChat();
    renderRoleplaySuggestions(scen.suggestions);
  };

  function renderRoleplayChat() {
    const container = document.getElementById('roleplayChatArea');
    if (!container) return;

    let html = '';
    roleplayChatHistory.forEach((msg, idx) => {
      if (msg.sender === 'bot') {
        html += `
          <div class="flex items-start gap-2.5 max-w-[88%]">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs">
              🤖
            </div>
            <div class="bg-white p-3 rounded-2xl rounded-tl-xs border border-sky-200 shadow-2xs space-y-1">
              <div class="flex items-center justify-between gap-3 text-[10px] text-emerald-800 font-extrabold">
                <span>${escapeHtml(msg.name)}</span>
                <button onclick="playGermanSpeech('${escapeHtml(msg.de)}')" class="hover:text-emerald-950 transition cursor-pointer" title="Listen to pronunciation">🔊</button>
              </div>
              <p class="text-xs font-black text-sky-950 leading-relaxed">${escapeHtml(msg.de)}</p>
              <div id="roleplayTrans-${idx}" class="hidden text-[11px] text-sky-700 italic border-t border-sky-100 pt-1 mt-1">
                ${escapeHtml(msg.en)}
              </div>
              <div class="pt-0.5 text-right">
                <button onclick="toggleRoleplayTranslation(${idx})" class="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer">
                  👁️ Translation
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="flex items-start justify-end gap-2.5 max-w-[88%] ml-auto">
            <div class="bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-xs shadow-2xs space-y-1 text-right">
              <div class="text-[10px] text-emerald-200 font-extrabold">You</div>
              <p class="text-xs font-bold leading-relaxed text-white">${escapeHtml(msg.de)}</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs">
              👤
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  window.toggleRoleplayTranslation = function(idx) {
    const el = document.getElementById(`roleplayTrans-${idx}`);
    if (el) el.classList.toggle('hidden');
  };

  function renderRoleplaySuggestions(suggestions) {
    const container = document.getElementById('roleplaySuggestionChips');
    if (!container) return;

    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = `
        <div class="text-xs text-emerald-800 font-medium py-1">
          🎉 Scenario complete! You can switch tabs above to practice another dialogue!
        </div>
      `;
      return;
    }

    let html = '';
    suggestions.forEach(item => {
      html += `
        <button onclick="submitRoleplayText('${escapeHtml(item.de)}')" class="text-left px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-sky-950 transition cursor-pointer shadow-2xs group flex items-center gap-1.5">
          <span class="text-[11px] font-black group-hover:text-emerald-700 text-sky-900">${escapeHtml(item.de)}</span>
          <span class="text-[10px] text-sky-400 italic">(${escapeHtml(item.en)})</span>
        </button>
      `;
    });
    container.innerHTML = html;
  }

  window.submitRoleplayText = function(text) {
    const input = document.getElementById('roleplayInputText');
    if (input) input.value = text;
    sendRoleplayMessage();
  };

  window.sendRoleplayMessage = function() {
    const input = document.getElementById('roleplayInputText');
    const text = input ? input.value.trim() : '';
    if (!text) return;

    if (input) input.value = '';

    // Add user message
    roleplayChatHistory.push({ sender: 'user', de: text });
    renderRoleplayChat();

    const scen = ROLEPLAY_SCENARIOS[activeRoleplayKey];
    const lower = text.toLowerCase();

    // Find next bot response
    let nextResponse = null;
    if (scen.responses && roleplayStepIndex < scen.responses.length) {
      nextResponse = scen.responses[roleplayStepIndex];
      roleplayStepIndex++;
    }

    setTimeout(() => {
      if (nextResponse) {
        roleplayChatHistory.push({
          sender: 'bot',
          name: scen.partner,
          de: nextResponse.botDe,
          en: nextResponse.botEn
        });
        renderRoleplayChat();
        renderRoleplaySuggestions(nextResponse.suggestions);
        if (typeof playGermanSpeech === 'function') {
          playGermanSpeech(nextResponse.botDe);
        }
        awardXP(10, 'Roleplay Dialogue');
      } else {
        roleplayChatHistory.push({
          sender: 'bot',
          name: scen.partner,
          de: "Das war eine wunderbare Unterhaltung! Vielen Dank und einen schönen Tag noch!",
          en: "That was a wonderful conversation! Thank you very much and have a nice day!"
        });
        renderRoleplayChat();
        renderRoleplaySuggestions([]);
        awardXP(25, 'Scenario Completed');
        unlockBadge('chat_champion');
      }
    }, 600);
  };

  window.toggleRoleplayVoiceInput = function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showFloatingToast("⚠️ Speech recognition requires Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const btn = document.getElementById('roleplayVoiceBtn');
    const icon = document.getElementById('roleplayVoiceIcon');
    if (btn) btn.classList.add('mic-recording-active');
    if (icon) icon.textContent = '🔴';
    showFloatingToast("🎙️ Listening in German... Speak now!");

    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('roleplayInputText');
      if (input) input.value = transcript;
      showFloatingToast(`Heard: "${transcript}"`);
      sendRoleplayMessage();
    };

    recognition.onerror = function(err) {
      console.warn("Roleplay speech error:", err);
      showFloatingToast("⚠️ Microphone error or permission denied.");
    };

    recognition.onend = function() {
      if (btn) btn.classList.remove('mic-recording-active');
      if (icon) icon.textContent = '🎙️';
    };

    try {
      recognition.start();
    } catch(e) {
      console.error(e);
    }
  };

  // ================= 30. GOETHE-ZERTIFIKAT A1 / TELC MOCK EXAM HUB =================
  const GOETHE_EXAM_DATA = {
    hoeren: [
      {
        part: "Teil 1: Alltägliche Gespräche (Short Dialogues)",
        audioPrompt: "Guten Tag, Herr Hansen. Wann kommen Sie heute zum Sprachkurs? - Ich komme heute um Viertel vor fünf.",
        audioTrack: "Netzwerk NEU A1 Kursbuch/Netzwerk NEU A1 Kursbuch/Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-001.mp3",
        q: "1. Um wie viel Uhr kommt Herr Hansen zum Sprachkurs?",
        options: ["Um 16:45 Uhr (Viertel vor fünf)", "Um 17:15 Uhr (Viertel nach fünf)", "Um 15:45 Uhr (Viertel vor vier)"],
        answer: 0,
        points: 5
      },
      {
        part: "Teil 2: Öffentliche Ansagen (Public Announcements)",
        audioPrompt: "Achtung an Gleis 7! Der ICE 591 nach München Hauptbahnhof über Nürnberg fährt jetzt ein. Bitte Vorsicht an der Bahnsteigkante.",
        audioTrack: "Netzwerk NEU A1 Kursbuch/Netzwerk NEU A1 Kursbuch/Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-002.mp3",
        q: "2. Aussage: Der Zug nach München fährt von Gleis 7 ab.",
        options: ["Richtig (True)", "Falsch (False)"],
        answer: 0,
        points: 5
      },
      {
        part: "Teil 3: Telefonansagen (Telephone Messages)",
        audioPrompt: "Hier ist die Praxis Dr. Weber. Unsere Praxis ist heute geschlossen. In dringenden Fällen rufen Sie bitte die Notrufnummer 112 an.",
        audioTrack: "Netzwerk NEU A1 Kursbuch/Netzwerk NEU A1 Kursbuch/Kursbuch A1 - Audio/Kapitel 1-6/NWn_A1_KB_Audio_1-003.mp3",
        q: "3. Was soll der Anrufer im Notfall tun?",
        options: ["Die Nummer 112 anrufen", "Bis morgen warten", "Eine E-Mail schreiben"],
        answer: 0,
        points: 5
      }
    ],
    lesen: [
      {
        part: "Teil 1: E-Mails & Mitteilungen (Messages)",
        context: "Liebe Julia, ich habe am Samstag Geburtstag und mache eine kleine Party ab 19 Uhr. Bringst du bitte einen Salat mit? Getränke habe ich schon gekauft. Liebe Grüße, Sarah.",
        q: "1. Aussage: Sarah feiert am Samstagabend ihren Geburtstag.",
        options: ["Richtig (True)", "Falsch (False)"],
        answer: 0,
        points: 5
      },
      {
        part: "Teil 2: Internetanzeigen (Classifieds)",
        context: "Situation: Sie möchten am Wochenende Deutsch lernen und suchen einen Kurs nur am Samstag.",
        q: "2. Welche Anzeige passt zu Ihrer Situation?",
        options: [
          "Anzeige A: Intensivkurs Montag bis Freitag 9:00 - 13:00 Uhr.",
          "Anzeige B: Wochenend-Workshop: Deutsch A1 jeden Samstag von 10:00 bis 14:00 Uhr."
        ],
        answer: 1,
        points: 5
      },
      {
        part: "Teil 3: Schilder im öffentlichen Raum (Signs)",
        context: "Schild am Supermarkteingang: 'Sehr geehrte Kunden, wegen Renovierung bleibt unser Markt am Mittwoch ab 14 Uhr geschlossen.'",
        q: "3. Aussage: Man kann am Mittwochnachmittag um 16 Uhr hier einkaufen.",
        options: ["Richtig (True)", "Falsch (False)"],
        answer: 1,
        points: 5
      }
    ],
    schreiben: {
      part1: {
        text: "Ihre Freundin Eva Fischer zieht mit ihrem Ehemann und zwei Kindern nach München. Sie bucht online ein Familienzimmer für 3 Nächte ab dem 15. Oktober und zahlt mit Kreditkarte.",
        fields: [
          { label: "1. Familienname", answer: "fischer" },
          { label: "2. Anzahl der Personen (Erwachsene + Kinder)", answer: "4" },
          { label: "3. Anreisedatum", answer: "15. oktober" },
          { label: "4. Anzahl der Nächte", answer: "3" },
          { label: "5. Zahlungsart", answer: "kreditkarte" }
        ]
      },
      part2: {
        prompt: "Schreiben Sie eine E-Mail an die Touristeninformation in Köln (~30 Wörter):<br/>- Warum schreiben Sie? (Informationen über Köln)<br/>- Sie kommen vom 10. bis 12. Mai.<br/>- Bitten Sie um Hoteladressen und Stadtplan.",
        sampleAnswer: "Sehr geehrte Damen und Herren,\n\nich reise vom 10. bis zum 12. Mai nach Köln. Können Sie mir bitte einen Stadtplan und eine Liste mit günstigen Hotels schicken?\n\nVielen Dank für Ihre Hilfe.\n\nMit freundlichen Grüßen,\nAlex"
      }
    },
    sprechen: [
      {
        part: "Teil 1: Sich vorstellen (Personal Introduction)",
        prompts: ["Name", "Alter", "Land", "Wohnort", "Sprachen", "Beruf", "Hobby"],
        modelSpeech: "Guten Tag. Mein Name ist Alex Becker. Ich bin 26 Jahre alt und komme aus Indonesien. Jetzt wohne ich in Frankfurt. Ich spreche Englisch, Indonesisch und Deutsch. Ich bin Softwareentwickler und mein Hobby ist Fußball spielen."
      },
      {
        part: "Teil 2: Um Informationen bitten (W-Fragen)",
        theme: "Thema: Essen & Trinken | Wort: Frühstück",
        cardPrompt: "Frage formulieren mit 'Frühstück'",
        modelQuestion: "Was essen Sie normalerweise zum Frühstück?",
        modelResponse: "Ich esse morgens meistens Brötchen mit Käse und trinke einen Kaffee."
      },
      {
        part: "Teil 3: Bitten formulieren und reagieren",
        cardPrompt: "Bild: Ein Glas Wasser | Bitte formulieren",
        modelQuestion: "Geben Sie mir bitte ein Glas Wasser?",
        modelResponse: "Ja, natürlich, bitte sehr!"
      }
    ]
  };

  // Deprecated / Removed Feature Stubs
  window.openRoleplayModal = function() {};
  window.closeRoleplayModal = function() {};

  let currentExamModule = 'hoeren';
  let examUserAnswers = {
    hoeren: {},
    lesen: {},
    schreibenPart1: {},
    schreibenPart2: '',
    sprechenCompleted: {}
  };
  let examSelectedDuration = 65;
  let examTimerSeconds = 65 * 60; // 3900s (65 minutes official Goethe written exam standard)
  let examTimerInterval = null;

  window.setExamDuration = function(mins) {
    examSelectedDuration = mins;
    examTimerSeconds = mins * 60;
    const btn65 = document.getElementById('examModeBtn-65');
    const btn30 = document.getElementById('examModeBtn-30');
    if (btn65 && btn30) {
      if (mins === 65) {
        btn65.className = "px-2 py-0.5 rounded-lg bg-amber-500 text-white shadow-xs transition cursor-pointer";
        btn30.className = "px-2 py-0.5 rounded-lg text-amber-900 hover:bg-amber-100 transition cursor-pointer";
      } else {
        btn30.className = "px-2 py-0.5 rounded-lg bg-amber-500 text-white shadow-xs transition cursor-pointer";
        btn65.className = "px-2 py-0.5 rounded-lg text-amber-900 hover:bg-amber-100 transition cursor-pointer";
      }
    }
    const display = document.getElementById('examTimerDisplay');
    if (display) {
      const m = Math.floor(examTimerSeconds / 60);
      const s = examTimerSeconds % 60;
      display.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }
  };

  window.openGoetheExamModal = function() {
    const modal = document.getElementById('goetheExamModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if (!examTimerInterval) {
      examTimerSeconds = examSelectedDuration * 60;
      setExamDuration(examSelectedDuration);
      startExamTimer();
    }
    switchExamModule('hoeren');
  };

  window.closeGoetheExamModal = function() {
    const modal = document.getElementById('goetheExamModal');
    if (modal) modal.classList.add('hidden');
    if (examTimerInterval) {
      clearInterval(examTimerInterval);
      examTimerInterval = null;
    }
  };

  function startExamTimer() {
    if (examTimerInterval) clearInterval(examTimerInterval);
    const display = document.getElementById('examTimerDisplay');
    examTimerInterval = setInterval(() => {
      if (examTimerSeconds > 0) {
        examTimerSeconds--;
        const m = Math.floor(examTimerSeconds / 60);
        const s = examTimerSeconds % 60;
        if (display) display.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
      } else {
        clearInterval(examTimerInterval);
        showFloatingToast("⏱️ Exam time is up! Submitting your answers...");
        finishGoetheExam();
      }
    }, 1000);
  }

  window.switchExamModule = function(mod) {
    currentExamModule = mod;
    const modules = ['hoeren', 'lesen', 'schreiben', 'sprechen'];
    modules.forEach(m => {
      const tab = document.getElementById(`examTab-${m}`);
      if (tab) {
        if (m === mod) {
          tab.className = "py-1.5 px-2 rounded-lg bg-indigo-600 text-white shadow-xs transition";
        } else {
          tab.className = "py-1.5 px-2 rounded-lg text-sky-700 hover:bg-white/60 transition";
        }
      }
    });

    const finishBtn = document.getElementById('examFinishBtn');
    const nextBtn = document.getElementById('examNextModuleBtn');
    if (mod === 'sprechen') {
      if (finishBtn) finishBtn.classList.remove('hidden');
      if (nextBtn) nextBtn.classList.add('hidden');
    } else {
      if (finishBtn) finishBtn.classList.add('hidden');
      if (nextBtn) nextBtn.classList.remove('hidden');
    }

    renderExamModuleContent();
  };

  window.nextExamModule = function() {
    if (currentExamModule === 'hoeren') switchExamModule('lesen');
    else if (currentExamModule === 'lesen') switchExamModule('schreiben');
    else if (currentExamModule === 'schreiben') switchExamModule('sprechen');
  };

  function renderExamModuleContent() {
    const container = document.getElementById('examModuleContainer');
    if (!container) return;

    let html = '';
    if (currentExamModule === 'hoeren') {
      html += `
        <div class="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900 font-medium">
          🎧 <strong>Modul Hören:</strong> Listen to each audio prompt carefully and choose the correct answer. You can replay the audio by clicking the 🔊 button.
        </div>
      `;
      GOETHE_EXAM_DATA.hoeren.forEach((item, idx) => {
        const savedAns = examUserAnswers.hoeren[idx];
        html += `
          <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-indigo-700 tracking-wider">${item.part}</span>
              <button onclick="playGermanSpeech('${escapeHtml(item.audioPrompt)}')" class="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs">
                <span>🔊</span>
                <span>Play Audio Track</span>
              </button>
            </div>
            <p class="text-xs font-black text-sky-950">${escapeHtml(item.q)}</p>
            <div class="space-y-1.5">
              ${item.options.map((opt, optIdx) => `
                <label class="flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition ${savedAns === optIdx ? 'bg-indigo-50 border-indigo-400 font-bold' : 'hover:bg-sky-50 border-sky-200 text-sky-900'}">
                  <input type="radio" name="hoeren-ans-${idx}" value="${optIdx}" ${savedAns === optIdx ? 'checked' : ''} onchange="saveHoerenAnswer(${idx}, ${optIdx})" class="accent-indigo-600">
                  <span class="text-xs">${escapeHtml(opt)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      });
    } else if (currentExamModule === 'lesen') {
      html += `
        <div class="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900 font-medium">
          📖 <strong>Modul Lesen:</strong> Read the notices and emails below, then determine whether the statements are True or False.
        </div>
      `;
      GOETHE_EXAM_DATA.lesen.forEach((item, idx) => {
        const savedAns = examUserAnswers.lesen[idx];
        html += `
          <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-2.5">
            <span class="text-[10px] font-black uppercase text-indigo-700 tracking-wider">${item.part}</span>
            <div class="p-3 bg-sky-50/80 rounded-xl border border-sky-200 text-xs text-sky-950 font-serif leading-relaxed italic">
              "${escapeHtml(item.context)}"
            </div>
            <p class="text-xs font-black text-sky-950">${escapeHtml(item.q)}</p>
            <div class="space-y-1.5">
              ${item.options.map((opt, optIdx) => `
                <label class="flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition ${savedAns === optIdx ? 'bg-indigo-50 border-indigo-400 font-bold' : 'hover:bg-sky-50 border-sky-200 text-sky-900'}">
                  <input type="radio" name="lesen-ans-${idx}" value="${optIdx}" ${savedAns === optIdx ? 'checked' : ''} onchange="saveLesenAnswer(${idx}, ${optIdx})" class="accent-indigo-600">
                  <span class="text-xs">${escapeHtml(opt)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      });
    } else if (currentExamModule === 'schreiben') {
      html += `
        <div class="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900 font-medium">
          ✍️ <strong>Modul Schreiben:</strong> Part 1 requires filling in 5 missing fields in the registration form. Part 2 requires writing a short email (~30 words).
        </div>

        <!-- Part 1: Formular Ausfüllen -->
        <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
          <span class="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Teil 1: Formular ausfüllen (Form Filling)</span>
          <p class="text-xs text-sky-800 bg-sky-50 p-2.5 rounded-xl border border-sky-200 leading-relaxed font-medium">
            ${escapeHtml(GOETHE_EXAM_DATA.schreiben.part1.text)}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            ${GOETHE_EXAM_DATA.schreiben.part1.fields.map((f, fIdx) => `
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-sky-950">${f.label}:</label>
                <input type="text" value="${escapeHtml(examUserAnswers.schreibenPart1[fIdx] || '')}" oninput="saveSchreibenFormField(${fIdx}, this.value)" placeholder="Enter answer..." class="w-full px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-xs text-sky-950 font-medium focus:outline-none focus:border-indigo-500">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Part 2: Brief / E-Mail Schreiben -->
        <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Teil 2: E-Mail schreiben (~30 Wörter)</span>
            <span id="examEmailWordCount" class="text-xs font-bold text-sky-600">0 words</span>
          </div>
          <div class="text-xs text-sky-900 leading-relaxed bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-200">
            ${GOETHE_EXAM_DATA.schreiben.part2.prompt}
          </div>
          <textarea id="examEmailInput" rows="5" oninput="handleExamEmailInput(this.value)" placeholder="Sehr geehrte Damen und Herren, ..." class="w-full p-3 rounded-xl bg-white border border-sky-300 text-xs text-sky-950 font-mono leading-relaxed focus:outline-none focus:border-indigo-500">${escapeHtml(examUserAnswers.schreibenPart2 || '')}</textarea>
          
          <button onclick="toggleExamModelAnswer()" class="text-xs text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer">
            💡 Toggle Official Model Answer & Rubric
          </button>
          <div id="examModelAnswerBox" class="hidden p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-serif leading-relaxed whitespace-pre-line">
            <strong>Sample 100% Score Answer:</strong>
            ${escapeHtml(GOETHE_EXAM_DATA.schreiben.part2.sampleAnswer)}
          </div>
        </div>
      `;
    } else if (currentExamModule === 'sprechen') {
      html += `
        <div class="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900 font-medium">
          🗣️ <strong>Modul Sprechen:</strong> Review the official Goethe oral cards below. Click 🔊 to listen to authentic native pronunciation models for each part.
        </div>
      `;
      GOETHE_EXAM_DATA.sprechen.forEach((item, idx) => {
        html += `
          <div class="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-indigo-700 tracking-wider">${item.part}</span>
              <button onclick="playGermanSpeech('${escapeHtml(item.modelSpeech || item.modelQuestion)}')" class="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs">
                <span>🔊</span>
                <span>Listen to Model Audio</span>
              </button>
            </div>
            ${item.prompts ? `
              <div class="flex flex-wrap gap-1.5 py-1">
                ${item.prompts.map(p => `<span class="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-xs font-bold">${p}</span>`).join('')}
              </div>
              <div class="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-950 leading-relaxed">
                <strong>Model Introduction:</strong> "${escapeHtml(item.modelSpeech)}"
              </div>
            ` : `
              <div class="p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-xs font-bold text-sky-950">
                Card Prompt: ${escapeHtml(item.cardPrompt)}
              </div>
              <div class="space-y-1 text-xs text-sky-900">
                <p><strong>Question:</strong> <em class="text-indigo-900">"${escapeHtml(item.modelQuestion)}"</em></p>
                <p><strong>Response:</strong> <em class="text-emerald-900">"${escapeHtml(item.modelResponse)}"</em></p>
              </div>
            `}
          </div>
        `;
      });
    }

    container.innerHTML = html;
  }

  window.saveHoerenAnswer = function(qIdx, optIdx) {
    examUserAnswers.hoeren[qIdx] = optIdx;
  };

  window.saveLesenAnswer = function(qIdx, optIdx) {
    examUserAnswers.lesen[qIdx] = optIdx;
  };

  window.saveSchreibenFormField = function(fIdx, val) {
    examUserAnswers.schreibenPart1[fIdx] = val.trim().toLowerCase();
  };

  window.handleExamEmailInput = function(val) {
    examUserAnswers.schreibenPart2 = val;
    const words = val.trim().split(/\s+/).filter(Boolean);
    const countEl = document.getElementById('examEmailWordCount');
    if (countEl) countEl.textContent = `${words.length} words`;
  };

  window.toggleExamModelAnswer = function() {
    const box = document.getElementById('examModelAnswerBox');
    if (box) box.classList.toggle('hidden');
  };

  window.finishGoetheExam = function() {
    if (examTimerInterval) clearInterval(examTimerInterval);

    // Calculate Scores
    let hoerenPts = 0;
    GOETHE_EXAM_DATA.hoeren.forEach((item, idx) => {
      if (examUserAnswers.hoeren[idx] === item.answer) hoerenPts += item.points;
    });

    let lesenPts = 0;
    GOETHE_EXAM_DATA.lesen.forEach((item, idx) => {
      if (examUserAnswers.lesen[idx] === item.answer) lesenPts += item.points;
    });

    let schreibenPts = 0;
    GOETHE_EXAM_DATA.schreiben.part1.fields.forEach((f, idx) => {
      const userVal = examUserAnswers.schreibenPart1[idx] || '';
      if (userVal && (userVal.includes(f.answer) || f.answer.includes(userVal))) {
        schreibenPts += 1.5;
      }
    });
    // Email word count points (up to 7.5 points)
    const emailWords = (examUserAnswers.schreibenPart2 || '').trim().split(/\s+/).filter(Boolean);
    if (emailWords.length >= 20) schreibenPts += 7.5;
    else if (emailWords.length >= 10) schreibenPts += 4;
    schreibenPts = Math.min(15, Math.round(schreibenPts));

    // Sprechen estimated points (awarded for review)
    let sprechenPts = 13;

    const totalRaw = hoerenPts + lesenPts + schreibenPts + sprechenPts;
    const totalPercentage = Math.round((totalRaw / 60) * 100);
    const isPassed = totalPercentage >= 60;

    let grade = "Nicht bestanden (Failed)";
    if (totalPercentage >= 90) grade = "Sehr gut (Excellent)";
    else if (totalPercentage >= 80) grade = "Gut (Good)";
    else if (totalPercentage >= 70) grade = "Befriedigend (Satisfactory)";
    else if (totalPercentage >= 60) grade = "Ausreichend (Passed)";

    if (isPassed) {
      awardXP(50, 'Goethe A1 Exam Passed');
      unlockBadge('goethe_ready');
    }

    const container = document.getElementById('examModuleContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="p-6 bg-white rounded-2xl border-2 ${isPassed ? 'border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-teal-50/50' : 'border-rose-300 bg-rose-50/50'} text-center space-y-4">
        <div class="text-5xl">${isPassed ? '🏆' : '📚'}</div>
        <h3 class="text-xl font-black text-sky-950">${isPassed ? 'Herzlichen Glückwunsch! Exam Passed!' : 'Good Effort! Keep Reviewing!'}</h3>
        <p class="text-xs text-sky-700">Official Goethe-Zertifikat A1 / Start Deutsch 1 Simulation Results</p>
        
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto py-2">
          <div class="p-2.5 bg-white rounded-xl border border-sky-200">
            <div class="text-[10px] font-bold text-sky-600">🎧 Hören</div>
            <div class="text-sm font-black text-sky-950">${hoerenPts} / 15</div>
          </div>
          <div class="p-2.5 bg-white rounded-xl border border-sky-200">
            <div class="text-[10px] font-bold text-sky-600">📖 Lesen</div>
            <div class="text-sm font-black text-sky-950">${lesenPts} / 15</div>
          </div>
          <div class="p-2.5 bg-white rounded-xl border border-sky-200">
            <div class="text-[10px] font-bold text-sky-600">✍️ Schreiben</div>
            <div class="text-sm font-black text-sky-950">${schreibenPts} / 15</div>
          </div>
          <div class="p-2.5 bg-white rounded-xl border border-sky-200">
            <div class="text-[10px] font-bold text-sky-600">🗣️ Sprechen</div>
            <div class="text-sm font-black text-sky-950">${sprechenPts} / 15</div>
          </div>
        </div>

        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full ${isPassed ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'} text-xs font-black">
          <span>Overall Score: ${totalRaw} / 60 Pts (${totalPercentage}%)</span>
          <span>•</span>
          <span>${grade}</span>
        </div>

        ${isPassed ? `
          <div class="p-4 bg-white/90 rounded-2xl border border-emerald-300 text-left space-y-1.5 max-w-md mx-auto shadow-sm">
            <div class="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
              <span>📜</span>
              <span>Cheeya Studio A1 Certificate of Proficiency</span>
            </div>
            <p class="text-[11px] text-sky-900">This verifies successful mastery of German Language Level A1 competencies across Listening, Reading, Writing, and Speaking.</p>
            <button onclick="window.print()" class="mt-2 w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer">
              🖨️ Print / Save Official Certificate
            </button>
          </div>
        ` : ''}

        <div class="pt-2">
          <button onclick="openGoetheExamModal()" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition cursor-pointer shadow-xs">
            🔄 Retake Exam
          </button>
        </div>
      </div>
    `;

    const finishBtn = document.getElementById('examFinishBtn');
    const nextBtn = document.getElementById('examNextModuleBtn');
    if (finishBtn) finishBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
  };

  // ================= 31. SMART SPACED REPETITION (SRS) 3D FLASHCARDS =================
  const DEFAULT_SRS_DECK = [
    { id: "srs-1", de: "Hund", article: "der", en: "Dog", plural: "die Hunde", example: "Der Hund spielt im Garten.", chapter: 1, category: "nouns" },
    { id: "srs-2", de: "Katze", article: "die", en: "Cat", plural: "die Katzen", example: "Die Katze schläft auf dem Sofa.", chapter: 1, category: "nouns" },
    { id: "srs-3", de: "Buch", article: "das", en: "Book", plural: "die Bücher", example: "Ich lese ein interessantes Buch.", chapter: 1, category: "nouns" },
    { id: "srs-4", de: "lernen", article: "", en: "to learn / study", plural: "", example: "Wir lernen jeden Tag Deutsch.", chapter: 1, category: "verbs" },
    { id: "srs-5", de: "sprechen", article: "", en: "to speak", plural: "", example: "Sprichst du auch Englisch?", chapter: 1, category: "verbs" },
    { id: "srs-6", de: "groß", article: "", en: "big / tall", plural: "", example: "Das Haus ist sehr groß.", chapter: 1, category: "adjectives" },
    { id: "srs-7", de: "klein", article: "", en: "small / little", plural: "", example: "Die Wohnung ist gemütlich und klein.", chapter: 1, category: "adjectives" },
    { id: "srs-8", de: "Bahnhof", article: "der", en: "Train station", plural: "die Bahnhöfe", example: "Der Zug hält am Bahnhof.", chapter: 3, category: "nouns" },
    { id: "srs-9", de: "Fahrkarte", article: "die", en: "Ticket", plural: "die Fahrkarten", example: "Ich kaufe eine Fahrkarte nach Berlin.", chapter: 3, category: "nouns" },
    { id: "srs-10", de: "Kaffee", article: "der", en: "Coffee", plural: "die Kaffees", example: "Möchten Sie einen Kaffee trinken?", chapter: 4, category: "nouns" },
    { id: "srs-11", de: "Brötchen", article: "das", en: "Bread roll", plural: "die Brötchen", example: "Zwei frische Brötchen, bitte.", chapter: 4, category: "nouns" },
    { id: "srs-12", de: "frühstücken", article: "", en: "to eat breakfast", plural: "", example: "Ich frühstücke um sieben Uhr.", chapter: 5, category: "verbs" },
    { id: "srs-13", de: "aufstehen", article: "", en: "to stand up / get up", plural: "", example: "Er steht jeden Tag um sechs Uhr auf.", chapter: 5, category: "verbs" },
    { id: "srs-14", de: "Wohnung", article: "die", en: "Apartment", plural: "die Wohnungen", example: "Unsere Wohnung hat drei Zimmer.", chapter: 8, category: "nouns" },
    { id: "srs-15", de: "Krankenhaus", article: "das", en: "Hospital", plural: "die Krankenhäuser", example: "Die Ärztin arbeitet im Krankenhaus.", chapter: 11, category: "nouns" }
  ];

  const SRS_STORAGE_KEY = 'netzwerk_srs_cards_v1';
  let currentSrsDeck = [];
  let currentSrsIndex = 0;
  let isSrsFlipped = false;

  function loadSrsCards() {
    try {
      const saved = localStorage.getItem(SRS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    // Seed default cards with initial intervals
    const seeded = DEFAULT_SRS_DECK.map(c => ({
      ...c,
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
      nextReviewDate: getTodayDateStr()
    }));
    saveSrsCards(seeded);
    return seeded;
  }

  function saveSrsCards(cards) {
    try {
      localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(cards));
      updateSrsDueBadge();
    } catch(e) {}
  }

  function updateSrsDueBadge() {
    const cards = loadSrsCards();
    const today = getTodayDateStr();
    const dueCount = cards.filter(c => !c.nextReviewDate || c.nextReviewDate <= today).length;
    const badge = document.getElementById('srsDashboardDueBadge');
    if (badge) {
      badge.textContent = dueCount > 0 ? `${dueCount} Due for Review` : 'All Reviewed Today ✨';
    }
  }

  window.openSrsModal = function() {
    const modal = document.getElementById('srsFlashcardModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    filterSrsDeck();
  };

  window.closeSrsModal = function() {
    const modal = document.getElementById('srsFlashcardModal');
    if (modal) modal.classList.add('hidden');
  };

  window.filterSrsDeck = function() {
    const chapSel = document.getElementById('srsChapterSelect');
    const catSel = document.getElementById('srsCategorySelect');
    const chapVal = chapSel ? chapSel.value : 'all';
    const catVal = catSel ? catSel.value : 'all';

    let cards = loadSrsCards();
    if (chapVal !== 'all') {
      cards = cards.filter(c => c.chapter.toString() === chapVal);
    }
    if (catVal !== 'all') {
      cards = cards.filter(c => c.category === catVal);
    }

    currentSrsDeck = cards.length > 0 ? cards : loadSrsCards();
    currentSrsIndex = 0;
    isSrsFlipped = false;
    renderCurrentSrsCard();
  };

  function renderCurrentSrsCard() {
    if (currentSrsDeck.length === 0) return;
    const card = currentSrsDeck[currentSrsIndex];

    const cardContainer = document.getElementById('srsFlashcardContainer');
    if (cardContainer) cardContainer.classList.remove('flashcard-flipped');
    isSrsFlipped = false;

    // Count label
    const countEl = document.getElementById('srsCardCountLabel');
    if (countEl) countEl.textContent = `Card ${currentSrsIndex + 1} of ${currentSrsDeck.length}`;

    // Front elements
    const frontWord = document.getElementById('srsFrontWord');
    const frontGender = document.getElementById('srsFrontGenderBadge');
    const frontPhonetic = document.getElementById('srsFrontPhonetic');
    if (frontWord) frontWord.textContent = card.de;

    if (frontGender) {
      if (card.article === 'der') {
        frontGender.textContent = 'der';
        frontGender.className = 'px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300';
      } else if (card.article === 'die') {
        frontGender.textContent = 'die';
        frontGender.className = 'px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300';
      } else if (card.article === 'das') {
        frontGender.textContent = 'das';
        frontGender.className = 'px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300';
      } else {
        frontGender.textContent = card.category;
        frontGender.className = 'px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300';
      }
    }

    if (frontPhonetic && typeof generateGermanPhonetics === 'function') {
      const ph = generateGermanPhonetics(card.article ? `${card.article} ${card.de}` : card.de);
      frontPhonetic.textContent = ph.phoneticText;
    }

    // Back elements
    const backEnglish = document.getElementById('srsBackEnglish');
    const backPlural = document.getElementById('srsBackPlural');
    const backExample = document.getElementById('srsBackExample');

    if (backEnglish) backEnglish.textContent = card.en;
    if (backPlural) backPlural.textContent = card.plural ? `Plural: ${card.plural}` : `Category: ${card.category}`;
    if (backExample) backExample.textContent = card.example ? `"${card.example}"` : '';
  }

  window.flipCurrentSrsCard = function() {
    const cardContainer = document.getElementById('srsFlashcardContainer');
    if (!cardContainer) return;
    isSrsFlipped = !isSrsFlipped;
    if (isSrsFlipped) {
      cardContainer.classList.add('flashcard-flipped');
    } else {
      cardContainer.classList.remove('flashcard-flipped');
    }
  };

  window.playSrsAudio = function() {
    if (currentSrsDeck.length === 0) return;
    const card = currentSrsDeck[currentSrsIndex];
    const phrase = card.article ? `${card.article} ${card.de}` : card.de;
    if (typeof playGermanSpeech === 'function') playGermanSpeech(phrase);
  };

  window.gradeCurrentSrsCard = function(rating) {
    if (currentSrsDeck.length === 0) return;
    const card = currentSrsDeck[currentSrsIndex];

    // SuperMemo-2 Spaced Repetition logic
    let daysToAdd = 1;
    if (rating === 1) { // Again
      card.interval = 0;
      card.repetitions = 0;
      daysToAdd = 0;
    } else if (rating === 2) { // Hard
      card.interval = 1;
      daysToAdd = 1;
    } else if (rating === 3) { // Good
      card.interval = card.interval === 0 ? 1 : card.interval === 1 ? 3 : Math.round(card.interval * card.easeFactor);
      daysToAdd = card.interval;
      card.repetitions++;
    } else if (rating === 4) { // Easy
      card.interval = card.interval === 0 ? 3 : Math.round(card.interval * card.easeFactor * 1.3);
      daysToAdd = card.interval;
      card.easeFactor = Math.min(3.0, card.easeFactor + 0.15);
      card.repetitions++;
    }

    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    card.nextReviewDate = d.toISOString().split('T')[0];

    // Update in all cards
    const allCards = loadSrsCards();
    const idx = allCards.findIndex(c => c.id === card.id);
    if (idx >= 0) allCards[idx] = card;
    saveSrsCards(allCards);

    awardXP(5, 'Flashcard Reviewed');

    // Move to next card in current review deck
    if (currentSrsIndex + 1 < currentSrsDeck.length) {
      currentSrsIndex++;
      renderCurrentSrsCard();
    } else {
      showFloatingToast("🎉 Deck completed! Well done reviewing today!");
      currentSrsIndex = 0;
      renderCurrentSrsCard();
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
      navigator.serviceWorker.register('./sw.js?v=20260914_v2')
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


  // Open initial view based on URL hash or default to 'dashboard'
  if (typeof updateSrsDueBadge === 'function') updateSrsDueBadge();

  const initialHash = window.location.hash.replace('#', '');
  handleRoute(initialHash);

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    handleRoute(hash);
  });
});