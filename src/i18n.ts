// UI strings: English by default, Vietnamese when the app language is "vi".

import FalconSDK from '@falcongames/game-client-sdk';

type Dict = Record<string, string>;

const en: Dict = {
  coin: 'Coins', star: 'Stars', level: 'Lv',
  silo: 'Silo', barn: 'Barn', feedmill: 'Feed Mill', bakery: 'Bakery', coop: 'Chicken Coop', coop_short: 'Coop', chicken: 'Chicken',
  wheat: 'Wheat', corn: 'Corn', egg: 'Egg', feed: 'Chicken Feed', bread: 'Bread',
  nail: 'Nail', screw: 'Screw', bolt: 'Bolt', tape: 'Duct Tape', plot: 'Farm Plot',
  shop: 'Shop', match: 'Match', orders: 'Orders', inventory: 'Storage', upgrade: 'Upgrade', upgrades: 'Upgrade Shop',
  buy: 'Buy', place: 'Place', plant: 'Plant', harvest: 'Harvest', collect: 'Collect', feed_v: 'Feed', craft: 'Make',
  close: 'Close', continue_: 'Continue', retry: 'Retry', play: 'Play', replay: 'Replay', next: 'Next', farm: 'Farm', skip: 'Skip',
  deliver: 'Deliver', locked: 'Locked', maxed: 'Max level', free: 'Free',
  owned: 'Owned', need: 'Need', capacity: 'Capacity', used: 'Used', tier: 'Level',
  moves: 'Moves', goal: 'Goal', lvl: 'Level', best: 'Best', paused: 'Paused',
  win_title: 'Level cleared!', lose_title: 'Out of moves', stars_earned: '+{n} Stars', stars_none: 'No new stars',
  star_delta: 'Only improvements over your best count.',
  barn_full: 'Barn is full! Make more space.', silo_full: 'Silo is full! Make more space.',
  need_storage: 'Need more storage!', match_cta: 'Play Match-3 to earn Stars',
  err_coin: 'Not enough coins', err_star: 'Not enough stars', err_no_feed: 'No chicken feed', err_inputs: 'Missing ingredients',
  err_materials: 'Missing materials', err_level: 'Reach a higher farm level', err_coop_full: 'The coop is full', err_max: 'Already max level',
  err_tutorial: 'Follow the tutorial first', err_barn_full: 'Barn is full! Make more space.', err_silo_full: 'Silo is full! Make more space.',
  err_state: 'Not now', unlock_at: 'Unlocks at farm level {n}',
  choose_crop: 'What to plant?', chicken_hungry: 'Hungry', chicken_producing: 'Laying…', chicken_ready: 'Eggs ready!',
  machine_idle: 'Idle', machine_processing: 'Working…', machine_output: 'Ready!',
  upgrade_to: 'Upgrade {name} to level {n}', cap_now: 'Capacity {a} → {b}',
  shop_materials: 'Materials for storage upgrades. 1 Star each.',
  order_reward: 'Reward', order_empty: 'Orders unlock after the tutorial.',
  level_up: 'Farm level {n}!', revive_moves: '+{n} moves',
  hint_tap: 'Tap to swap',
  coins_earned: '+{n} Coins', coin_balance: 'You have {n} coins',
  revive_offer: 'Keep playing with +{n} moves',
  boosters: 'Boosters', booster_shovel: 'Golden Shovel',
  booster_shovel_desc: 'Dig up any one tile on the board without using a move.',
  booster_tip: 'Tap a tile to dig it up', booster_bought: '{name} ready!', booster_owned: 'Owned: {n}',
  settings: 'Settings', sound: 'Sound', music: 'Music', haptic: 'Vibration',
  tut_T00: 'Welcome to your farm! Let’s grow some wheat. Tap the glowing field to buy it.',
  tut_T01: 'Buy this plot for 10 coins.',
  tut_T02: 'Tap the plot and plant Wheat.',
  tut_T02_wait: 'Wheat is growing… it only takes a moment.',
  tut_T03: 'Harvest the wheat! It goes into your Silo.',
  tut_T04: 'Open the Shop and buy a Chicken Coop.',
  tut_T05: 'Tap the coop and buy a chicken.',
  tut_T06: 'Tap the Feed Mill: 2 Wheat make 1 Chicken Feed.',
  tut_T06_wait: 'The mill is working…',
  tut_T06_collect: 'Collect the feed into your Barn.',
  tut_T07: 'Tap the chicken and feed it.',
  tut_T07_wait: 'The chicken is laying eggs…',
  tut_T07_collect: 'Collect the eggs!',
  tut_T08: 'The Barn is full! Play Match-3 to earn Stars for a bigger barn.',
  tut_T09: 'Match 3 or more wheat tiles to collect them. Win the level for Stars!',
  tut_T10: 'Open the Upgrade Shop and buy a Nail and a Screw with your Stars.',
  tut_T10_screw: 'Now buy a Screw.',
  tut_T11: 'Tap the Barn and upgrade it!',
  tut_T12: 'Now collect those eggs. Your farm is ready!',
};

const vi: Dict = {
  coin: 'Xu', star: 'Sao', level: 'Cấp',
  silo: 'Silo', barn: 'Kho', feedmill: 'Máy thức ăn', bakery: 'Lò bánh', coop: 'Chuồng gà', coop_short: 'Chuồng', chicken: 'Gà',
  wheat: 'Lúa mì', corn: 'Ngô', egg: 'Trứng', feed: 'Thức ăn gà', bread: 'Bánh mì',
  nail: 'Đinh', screw: 'Ốc vít', bolt: 'Bu lông', tape: 'Băng keo', plot: 'Ô ruộng',
  shop: 'Cửa hàng', match: 'Match', orders: 'Đơn hàng', inventory: 'Kho hàng', upgrade: 'Nâng cấp', upgrades: 'Shop nâng cấp',
  buy: 'Mua', place: 'Đặt', plant: 'Trồng', harvest: 'Thu hoạch', collect: 'Nhận', feed_v: 'Cho ăn', craft: 'Làm',
  close: 'Đóng', continue_: 'Tiếp tục', retry: 'Chơi lại', play: 'Chơi', replay: 'Chơi lại', next: 'Tiếp', farm: 'Nông trại', skip: 'Bỏ qua',
  deliver: 'Giao', locked: 'Khóa', maxed: 'Tối đa', free: 'Miễn phí',
  owned: 'Đang có', need: 'Cần', capacity: 'Sức chứa', used: 'Đã dùng', tier: 'Cấp',
  moves: 'Lượt', goal: 'Mục tiêu', lvl: 'Màn', best: 'Tốt nhất', paused: 'Tạm dừng',
  win_title: 'Qua màn!', lose_title: 'Hết lượt', stars_earned: '+{n} Sao', stars_none: 'Không có sao mới',
  star_delta: 'Chỉ nhận phần hơn so với kỷ lục.',
  barn_full: 'Kho đã đầy! Hãy mở rộng kho.', silo_full: 'Silo đã đầy! Hãy mở rộng silo.',
  need_storage: 'Cần thêm kho chứa!', match_cta: 'Chơi Match-3 để lấy Sao',
  err_coin: 'Không đủ xu', err_star: 'Không đủ sao', err_no_feed: 'Hết thức ăn gà', err_inputs: 'Thiếu nguyên liệu',
  err_materials: 'Thiếu vật liệu', err_level: 'Cần cấp nông trại cao hơn', err_coop_full: 'Chuồng đã đầy', err_max: 'Đã tối đa',
  err_tutorial: 'Làm theo hướng dẫn trước nhé', err_barn_full: 'Kho đã đầy! Hãy mở rộng kho.', err_silo_full: 'Silo đã đầy! Hãy mở rộng silo.',
  err_state: 'Chưa được', unlock_at: 'Mở ở cấp nông trại {n}',
  choose_crop: 'Trồng gì?', chicken_hungry: 'Đói', chicken_producing: 'Đang đẻ…', chicken_ready: 'Có trứng!',
  machine_idle: 'Rảnh', machine_processing: 'Đang làm…', machine_output: 'Xong!',
  upgrade_to: 'Nâng {name} lên cấp {n}', cap_now: 'Sức chứa {a} → {b}',
  shop_materials: 'Vật liệu nâng kho. Mỗi món 1 Sao.',
  order_reward: 'Thưởng', order_empty: 'Đơn hàng mở sau hướng dẫn.',
  level_up: 'Nông trại cấp {n}!', revive_moves: '+{n} lượt',
  hint_tap: 'Chạm để đổi chỗ',
  coins_earned: '+{n} Xu', coin_balance: 'Bạn có {n} xu',
  revive_offer: 'Chơi tiếp với +{n} lượt',
  boosters: 'Trợ thủ', booster_shovel: 'Xẻng vàng',
  booster_shovel_desc: 'Xúc bỏ bất kỳ một ô nào trên bàn mà không tốn lượt.',
  booster_tip: 'Chạm vào một ô để xúc', booster_bought: 'Đã có {name}!', booster_owned: 'Đang có: {n}',
  settings: 'Cài đặt', sound: 'Âm thanh', music: 'Nhạc', haptic: 'Rung',
  tut_T00: 'Chào mừng đến nông trại! Trồng lúa mì nào. Chạm vào ô đất sáng để mua.',
  tut_T01: 'Mua ô ruộng này với 10 xu.',
  tut_T02: 'Chạm vào ô ruộng và trồng Lúa mì.',
  tut_T02_wait: 'Lúa đang lớn… chỉ một lát thôi.',
  tut_T03: 'Thu hoạch lúa! Lúa sẽ vào Silo.',
  tut_T04: 'Mở Cửa hàng và mua Chuồng gà.',
  tut_T05: 'Chạm vào chuồng và mua một con gà.',
  tut_T06: 'Chạm Máy thức ăn: 2 Lúa mì làm 1 Thức ăn gà.',
  tut_T06_wait: 'Máy đang làm…',
  tut_T06_collect: 'Nhận thức ăn vào Kho.',
  tut_T07: 'Chạm vào gà và cho ăn.',
  tut_T07_wait: 'Gà đang đẻ trứng…',
  tut_T07_collect: 'Nhận trứng nào!',
  tut_T08: 'Kho đầy rồi! Chơi Match-3 để lấy Sao nâng kho.',
  tut_T09: 'Ghép 3 lúa mì trở lên để thu. Thắng màn để nhận Sao!',
  tut_T10: 'Mở Shop nâng cấp, dùng Sao mua Đinh và Ốc vít.',
  tut_T10_screw: 'Giờ mua Ốc vít.',
  tut_T11: 'Chạm vào Kho và nâng cấp!',
  tut_T12: 'Giờ nhận trứng thôi. Nông trại sẵn sàng!',
};

let dict: Dict = en;

export function initLang(): void {
  let lang = '';
  try { lang = FalconSDK.bridge.env.language || ''; } catch { /* not booted yet */ }
  const q = new URLSearchParams(location.search).get('lang');
  if (q) lang = q;
  if (!lang) lang = navigator.language || '';
  dict = lang.toLowerCase().startsWith('vi') ? vi : en;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = dict[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
