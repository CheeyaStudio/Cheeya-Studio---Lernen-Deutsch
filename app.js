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
  window.playGermanSpeech = function(text) {
    if (!synth) return;
    const cleanText = text.replace(/[*_#`]/g, '').trim();
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    if (germanVoice) utterance.voice = germanVoice;
    synth.speak(utterance);
  };

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

  window.selectChapter = function(index, customPage = null) {
    if (index < 0 || index >= NETZWERK_DATA.chapters.length) return;
    currentChapterIndex = index;
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
            <p class="text-xs font-bold text-rose-600 mb-2">Halaman PDF tidak dapat dimuat langsung</p>
            <a href="${encodeURI(pdfPath)}" target="_blank" class="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs inline-block">Buka File PDF Eksternal</a>
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

    function showScribbleErasedFeedback() {
      let toast = document.getElementById('scribbleToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'scribbleToast';
        toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/90 text-white text-xs font-bold rounded-2xl shadow-xl backdrop-blur-sm pointer-events-none transition-all duration-300 opacity-0 transform scale-90 flex items-center gap-2 border border-sky-400/40';
        toast.innerHTML = '<span>✍️✨</span><span>Scribble Erased (Coretan terhapus)</span>';
        document.body.appendChild(toast);
      }
      toast.classList.remove('opacity-0', 'scale-90');
      toast.classList.add('opacity-100', 'scale-100');
      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(() => {
        toast.classList.remove('opacity-100', 'scale-100');
        toast.classList.add('opacity-0', 'scale-90');
      }, 1200);
    }

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

      const ratio = totalPath / Math.max(1.0, boxDiag);

      // A scribble has at least 3 sharp reversals (back-and-forth) AND ratio >= 1.7
      const isScribble = (reversals >= 3 && ratio >= 1.7) || (reversals >= 4);
      if (!isScribble) return false;

      // Expand bounding box with generous padding (40px)
      const padX = 40 / w;
      const padY = 40 / h;
      const sMinX = minX - padX;
      const sMaxX = maxX + padX;
      const sMinY = minY - padY;
      const sMaxY = maxY + padY;

      const remainingStrokes = [];
      let erasedCount = 0;

      for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
        const targetStroke = strokes[sIdx];
        let overlaps = false;
        if (targetStroke.points) {
          for (let pIdx = 0; pIdx < targetStroke.points.length; pIdx++) {
            const tp = targetStroke.points[pIdx];
            if (tp.x >= sMinX && tp.x <= sMaxX && tp.y >= sMinY && tp.y <= sMaxY) {
              overlaps = true;
              break;
            }
          }
        }

        if (overlaps) {
          erasedCount++;
        } else {
          remainingStrokes.push(targetStroke);
        }
      }

      if (erasedCount > 0) {
        savePageStrokes(remainingStrokes);
        showScribbleErasedFeedback();
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
        <button onclick="selectChapter(Math.max(0, currentChapterIndex - 1))" class="btn-pastel-blue px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${currentChapterIndex === 0 ? 'opacity-40 pointer-events-none' : ''}" title="Go to previous chapter">
          <span>◀</span>
          <span>Prev Chapter</span>
        </button>
        
        <div class="text-center px-2">
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-full">Active Chapter</span>
          <h3 class="font-extrabold text-sm text-sky-950 mt-0.5">${chapter.title}</h3>
        </div>

        <button onclick="selectChapter(Math.min(NETZWERK_DATA.chapters.length - 1, currentChapterIndex + 1))" class="btn-pastel-blue px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${currentChapterIndex === NETZWERK_DATA.chapters.length - 1 ? 'opacity-40 pointer-events-none' : ''}" title="Go to next chapter">
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
          <button class="p-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 transition cursor-pointer flex-shrink-0 ml-2" onclick="playGermanSpeech('${v.de.replace(/'/g, "\\'")}')" title="Listen to German pronunciation">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
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

        <div class="grid grid-cols-3 gap-3 text-center text-xs">
          <div class="bg-white/90 p-3 rounded-2xl border border-sky-200">
            <div class="font-extrabold text-sky-600 text-lg">${completedCount}/${totalChapters}</div>
            <div class="text-[11px] text-sky-700 font-bold">Chapters Done</div>
          </div>
          <div class="bg-white/90 p-3 rounded-2xl border border-sky-200">
            <div class="font-extrabold text-blue-600 text-lg">${answeredQuizzesCount}</div>
            <div class="text-[11px] text-blue-700 font-bold">Quizzes Solved</div>
          </div>
          <div class="bg-white/90 p-3 rounded-2xl border border-sky-200">
            <div class="font-extrabold text-indigo-600 text-lg">${answeredExercisesCount}</div>
            <div class="text-[11px] text-indigo-700 font-bold">Exercises Checked</div>
          </div>
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

  // ================= RUN INITIALIZATION =================
  initSpeech();
  initFontSize();
  initChapters();
  initSparkleEffect();
  initCursorClickEffect();
  renderMusicTracksList();

  function handleRoute(hash) {
    if (['dashboard', 'lesson', 'pdf', 'vocab', 'progress'].includes(hash)) {
      switchView(hash);
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

  // Open initial view based on URL hash or default to 'dashboard'
  const initialHash = window.location.hash.replace('#', '');
  handleRoute(initialHash);

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    handleRoute(hash);
  });
});