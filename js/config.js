// Zıpla! — platform oyunu sabitleri ve bölüm verileri.
// Koordinatlar piksel; y aşağı doğru artar. Görüntü alanı 640×384, kamera
// oyuncuyu yatayda takip eder (bölümler daha geniştir).

const SAVE_KEY = 'zipla_save';

const VIEW_W = 640;
const VIEW_H = 384;
const TILE = 32;

// Oyuncu + nesne boyutları
const PLAYER_W = 26;
const PLAYER_H = 34;
const COIN = 20;
const GOAL_W = 28;
const GOAL_H = 56;

// Fizik (px, px/s, px/s²)
const GRAVITY = 2000;
const MOVE_SPEED = 220;
const JUMP_VELOCITY = -660;   // zıplama başlangıç hızı (yukarı) → ~3 tile yükseklik
const MAX_FALL = 920;

// Bölümler: platforms = katı dikdörtgenler [x,y,w,h]; coins = [x,y]; spawn =
// başlangıç; goal = bitiş bayrağı sol-üstü. width/height bölüm sınırları.
const LEVELS = [
  {
    name: 'Başlangıç',
    width: 1600, height: 384,
    spawn: [40, 300],
    goal: [1520, 296],
    platforms: [
      [0, 352, 520, 32], [640, 352, 560, 32], [1280, 352, 320, 32], // zeminler (2 çukur)
      [340, 268, 110, 20], [780, 250, 120, 20], [1000, 190, 110, 20], [1120, 300, 90, 20],
    ],
    hazards: [[900, 336, 48, 16]],
    coins: [[220, 312], [380, 236], [700, 312], [820, 216], [1030, 156], [1150, 268], [1420, 312]],
  },
  {
    name: 'Sıçrayış',
    width: 1900, height: 384,
    spawn: [40, 300],
    goal: [1820, 296],
    platforms: [
      [0, 352, 360, 32], [470, 352, 260, 32], [860, 352, 220, 32], [1230, 352, 260, 32], [1600, 352, 300, 32],
      [300, 280, 90, 20], [560, 250, 90, 20], [760, 210, 90, 20], [980, 250, 90, 20],
      [1150, 200, 90, 20], [1360, 260, 90, 20], [1520, 210, 90, 20],
    ],
    hazards: [[560, 336, 48, 16], [1300, 336, 48, 16]],
    coins: [[200, 312], [330, 246], [590, 216], [790, 176], [1010, 216], [1180, 166], [1390, 226], [1550, 176], [1700, 312]],
  },
  {
    name: 'Yükseliş',
    width: 1500, height: 384,
    spawn: [40, 300],
    goal: [1400, 100],
    platforms: [
      [0, 352, 420, 32], [520, 352, 980, 32],
      [360, 290, 90, 20], [540, 250, 90, 20], [720, 300, 90, 20],
      [860, 250, 90, 20], [1000, 210, 90, 20], [1140, 250, 90, 20],
      [1240, 190, 90, 20], [1360, 156, 160, 20],
    ],
    hazards: [[700, 336, 64, 16]],
    coins: [[220, 312], [390, 256], [570, 216], [750, 266], [890, 216], [1030, 176], [1170, 216], [1270, 156], [1420, 120]],
  },
];
