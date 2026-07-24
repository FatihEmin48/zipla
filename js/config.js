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

// Fizik (px, px/s, px/s²). Zıplama menzili ~180px yatay / ~145px dikey → bölüm
// boşlukları bunun altında tutulur (her ada rahat ulaşılabilir; testle doğrulanır).
const GRAVITY = 2000;
const MOVE_SPEED = 240;
const JUMP_VELOCITY = -760;   // zıplama başlangıç hızı (yukarı)
const MAX_FALL = 960;
const STOMP_BOUNCE = -420;    // düşmana basınca zıplama sekmesi
const MAX_JUMPS = 2;          // çift zıplama (yerde 1 + havada 1)
const JUMP_BUFFER = 0.12;     // inişten hemen önceki zıplama basışını hatırlama (sn)
const WALL_SLIDE_SPEED = 130; // duvara yaslanınca düşme hızı sınırı (tutunma)
const WALL_KICK_TIME = 0.18;  // duvar zıplamasında yatay itme süresi (sn)

// Bölümler: platforms = katı dikdörtgenler [x,y,w,h]; coins = [x,y]; spawn =
// başlangıç; goal = bitiş bayrağı sol-üstü. width/height bölüm sınırları.
const LEVELS = [
  {
    name: 'Başlangıç',
    par: 18,
    width: 1600, height: 384,
    spawn: [40, 300],
    goal: [1520, 296],
    platforms: [
      [0, 352, 460, 32], [560, 352, 520, 32], [1180, 352, 420, 32], // zemin adaları (boşluk 100)
      [300, 270, 110, 20], [700, 250, 110, 20], [900, 214, 110, 20], [1300, 264, 110, 20],
    ],
    hazards: [[780, 336, 48, 16]],
    enemies: [{ x: 940, y: 326, w: 26, h: 26, range: 120, speed: 55 }],
    coins: [[220, 312], [345, 232], [620, 312], [745, 214], [945, 178], [1090, 312], [1345, 228], [1450, 312]],
  },
  {
    name: 'Sıçrayış',
    par: 26,
    width: 1800, height: 384,
    spawn: [40, 300],
    goal: [1720, 296],
    platforms: [
      [0, 352, 360, 32], [460, 352, 300, 32], [860, 352, 300, 32], [1260, 352, 300, 32], [1660, 352, 140, 32], // boşluk 100
      [300, 286, 100, 20], [560, 250, 100, 20], [980, 286, 100, 20], [1160, 244, 100, 20], [1400, 262, 100, 20],
    ],
    hazards: [[560, 336, 48, 16], [1360, 336, 48, 16]],
    movers: [{ x: 770, y: 288, w: 90, h: 16, axis: 'x', amp: 80, speed: 70 }],
    enemies: [{ x: 900, y: 326, w: 26, h: 26, range: 180, speed: 62 }],
    coins: [[200, 312], [350, 250], [610, 214], [720, 312], [820, 252], [1030, 250], [1210, 208], [1310, 312], [1450, 226], [1720, 312]],
  },
  {
    name: 'Yükseliş',
    par: 24,
    width: 1500, height: 384,
    spawn: [40, 300],
    goal: [1400, 62],
    platforms: [
      [0, 352, 420, 32], [520, 352, 980, 32], // boşluk 100
      [500, 300, 110, 20], [650, 258, 110, 20], [800, 216, 110, 20], [950, 180, 110, 20], [1100, 148, 110, 20], [1290, 118, 210, 20],
    ],
    hazards: [[720, 336, 64, 16]],
    movers: [{ x: 1150, y: 240, w: 90, h: 16, axis: 'y', amp: 80, speed: 60 }],
    enemies: [{ x: 900, y: 326, w: 26, h: 26, range: 200, speed: 66 }],
    coins: [[220, 312], [430, 312], [545, 268], [695, 226], [845, 184], [995, 148], [1145, 116], [1195, 150], [1360, 86]],
  },
  {
    name: 'Uçurumlar',
    par: 32,
    width: 2000, height: 384,
    spawn: [40, 300],
    goal: [1920, 296],
    checkpoints: [900, 1400],
    platforms: [
      [0, 352, 340, 32], [440, 352, 300, 32], [840, 352, 260, 32], [1200, 352, 300, 32], [1600, 352, 400, 32], // boşluk 100
      [280, 286, 90, 20], [560, 270, 90, 20], [760, 290, 90, 20], [1000, 250, 100, 20], [1360, 270, 100, 20],
    ],
    hazards: [[900, 336, 64, 16], [1300, 336, 48, 16]],
    movers: [{ x: 1090, y: 300, w: 90, h: 16, axis: 'x', amp: 80, speed: 72 }],
    enemies: [{ x: 500, y: 326, w: 26, h: 26, range: 150, speed: 60 }, { x: 1660, y: 326, w: 26, h: 26, range: 220, speed: 66 }, { x: 700, y: 250, w: 26, h: 22, range: 160, speed: 55, type: 'flyer' }],
    coins: [[180, 312], [305, 250], [585, 234], [900, 300], [1025, 214], [1150, 312], [1385, 234], [1500, 312], [1720, 312], [1860, 312]],
  },
  {
    name: 'Diken Yolu',
    par: 30,
    width: 1900, height: 384,
    spawn: [40, 300],
    goal: [1820, 296],
    checkpoints: [900],
    platforms: [
      [0, 352, 400, 32], [500, 352, 300, 32], [900, 352, 300, 32], [1300, 352, 600, 32], // boşluk 100
      [420, 290, 80, 20], [720, 270, 80, 20], [1120, 290, 90, 20], [1250, 250, 90, 20],
    ],
    hazards: [[300, 336, 48, 16], [620, 336, 64, 16], [1000, 336, 64, 16], [1420, 336, 48, 16], [1560, 336, 48, 16]],
    enemies: [{ x: 950, y: 326, w: 26, h: 26, range: 180, speed: 72 }],
    movingHazards: [{ x: 1080, y: 250, w: 30, h: 30, axis: 'y', amp: 90, speed: 95 }],
    coins: [[180, 312], [455, 254], [755, 234], [850, 312], [1160, 254], [1290, 214], [1400, 312], [1600, 312], [1750, 312]],
  },
  {
    name: 'Zirve',
    par: 34,
    width: 1700, height: 384,
    spawn: [40, 300],
    goal: [1600, 34],
    checkpoints: [560],
    platforms: [
      [0, 352, 420, 32], [520, 352, 1180, 32], // boşluk 100
      [500, 300, 100, 20], [650, 255, 100, 20], [820, 210, 100, 20], [1000, 170, 90, 20], [1180, 150, 90, 20], [1350, 120, 90, 20], [1480, 90, 220, 20],
    ],
    hazards: [[720, 336, 64, 16], [1050, 336, 48, 16]],
    movers: [{ x: 1250, y: 230, w: 90, h: 16, axis: 'y', amp: 80, speed: 66 }],
    enemies: [{ x: 900, y: 326, w: 26, h: 26, range: 150, speed: 66 }, { x: 1000, y: 240, w: 26, h: 22, range: 130, speed: 60, type: 'flyer' }],
    movingHazards: [{ x: 560, y: 316, w: 30, h: 30, axis: 'x', amp: 150, speed: 120 }],
    coins: [[220, 312], [430, 312], [545, 266], [700, 220], [865, 176], [1040, 136], [1290, 190], [1395, 86], [1560, 56]],
  },
];
