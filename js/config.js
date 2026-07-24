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
];
