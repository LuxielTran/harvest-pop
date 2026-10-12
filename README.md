# Harvest Pop — Farm × Match-3

Game web của Falcon, khung chuẩn: Vite + TypeScript + `@falcongames/game-client-sdk`.
Nông trại là hub (trồng lúa, nuôi gà, máy thức ăn, đơn hàng); Match-3 cho Sao → đổi vật liệu → nâng Kho/Silo.
Nông trại vẽ theo góc nhìn 2.5D (isometric 2:1, kiểu Hay Day): mọi công trình, ô ruộng và đồ trang trí
chiếu qua cùng một phép chiếu, ánh sáng từ trên-trái.

```bash
npm install
npm run dev      # hoặc mở Preview trong Falcon IDE
npm run build    # dist/index.html — một tệp duy nhất
```

## Cấu trúc

| Tệp | Vai trò |
|---|---|
| `src/config.ts` | Số liệu: crop, gà, recipe, máy, kho & nâng cấp, XP, đơn hàng, **50 màn Match-3** (bản đồ ASCII + mục tiêu), xu thưởng / giá booster / giá hồi sinh, 3 booster |
| `src/state.ts` | Save data + services (wallet, kho, farm state machine, đơn hàng, sao, nâng cấp, booster, hồi sinh). Mọi thay đổi: validate → ghi → `save()` qua `FalconSDK.userData` |
| `src/match3.ts` | Engine Match-3 thuần logic: bàn tới 9×9 mọi hình dạng, Bùn / Thùng gỗ / Đất, thú nuôi rơi xuống, 2 power-up, trọng lực thẳng + trượt chéo, combo, reshuffle, mục tiêu, gợi ý |
| `src/tutorial.ts` | TutorialDirector T00→T12 (bắt buộc, resume theo save, chặn thao tác ngoài bước) |
| `src/ui/farm.ts` | Farm Home: scene 2.5D, HUD, Shop (kể cả 3 booster), Kho/nâng kho, Upgrade Shop, Đơn hàng, Map 50 màn (tag Khó/Siêu khó/Trùm), Cài đặt |
| `src/ui/match.ts` | Màn Match-3 (canvas, khay gỗ 2.5D): HUD lượt / tối đa 3 mục tiêu / sao, hiệu ứng power-up, thanh 3 booster, popup kết quả |
| `src/art.ts` | Toàn bộ art SVG gốc: công trình 2.5D, 7 cropsy, Cropsy Máy Cày, Hạt Cầu Vồng, bùn, thùng (nguyên / nứt), đất, gà con, heo con, icon booster |
| `src/game.ts` | Hợp đồng `FalconGame`: `startLevel(i)` mở thẳng màn Match i, `levelStart` (kèm `difficulty`) / `win` / `lose`, pause/resume/revive, `boosters` |
| `LEVELS.md` | Bảng 50 màn: độ khó, số loại cropsy, lưới, lượt, mục tiêu và tỉ lệ thắng của bot |

## Thiết kế màn (theo "level harvest pop.md")

Một màn = bản đồ ASCII + mục tiêu trong `src/config.ts`:

| Ký tự | Ô |
|---|---|
| `.` | ô thường |
| `x` | không có ô (tạo hình bàn: góc khuyết, chia đôi, đồng hồ cát, chữ T, kim cương, nút thắt…) |
| `m` / `c` | Bùn (1 lớp) / Thùng gỗ (2 lớp) — vỡ khi ghép ngay cạnh, bị blast quét qua, hoặc dùng booster |
| `s` | Đất cần cày — cày khi cropsy trên ô đó bị xoá |
| `M` / `C` | Bùn / Thùng nằm trên Đất (phá vật cản trước, rồi ghép lên trên) |
| `a` | Thú nuôi xuất phát (Gà con hoặc Heo con); thu khi xuống tới hàng dưới cùng (mũi tên xanh) |

Mục tiêu: thu cropsy (một loại hoặc `any`), dọn hết Bùn, phá hết Thùng, cày hết Đất, đưa N thú xuống. Tối đa 3 mục tiêu một màn.
Nhịp độ khó theo tài liệu: 1–10 làm quen (màn 10 chặn cửa đầu tiên), 11–25 răng cưa, 26–50 vòng lặp
siêu dễ → thường → thường → khó, màn 50 là Trùm. Các màn khó có **chỗ kẹt** (ô bị cô lập, đất bị thùng vây,
bùn chặn nút thắt) chỉ với tới bằng power-up hoặc booster.

Mỗi màn có `powerChance`: tỉ lệ một cropsy mới rơi xuống sẵn là Cropsy Máy Cày, cao ở màn dễ và thấp ở màn khó,
cộng với power-up sinh ra khi người chơi ghép hoặc khi cascade tự ghép 4/5.

Số lượng mục tiêu và số lượt được chỉnh bằng bot: bot tham lam có tính mục tiêu chơi mỗi màn 60 lần, không booster
và với 1 booster mỗi loại (kết quả ở `LEVELS.md`). Dải mục tiêu của bot: hướng dẫn / siêu dễ / dễ ≈ 95–100% (còn dư lượt),
thường ≈ 65–85%, khó ≈ 30–45%, siêu khó ≈ 10–20%, trùm ≈ 30%; có booster thì màn khó lên ≈ 70–85%.

## Power-up (cropsy đặc biệt)

| Tạo bằng | Tên | Tác dụng |
|---|---|---|
| Đúng 4 thành hàng | **Cropsy Máy Cày** (Tractor Cropsy) — cropsy mang dải vết bánh xe | Máy cày chạy hết một hàng (ghép dọc) hoặc một cột (ghép ngang) |
| 5+ thành hàng | **Hạt Cầu Vồng** (Rainbow Seed) | Đổi với một cropsy: xoá mọi cropsy loại đó; đổi với Hạt Cầu Vồng khác: xoá cả bàn |

Máy Cày + Máy Cày = cày chữ thập. Power-up bị blast trúng sẽ tự kích hoạt (dây chuyền). Blast quét qua cả ô trống.

## Xu (Coin) có ba việc

| Việc | Số liệu (`src/config.ts`) | Ở đâu |
|---|---|---|
| Thưởng qua màn | `WIN_COINS = 40` lần đầu qua màn; `REPLAY_COINS = 10` khi chơi lại màn đã qua | popup "Qua màn!" |
| Mua booster | `BOOSTERS[].price = 300` / 1 đơn vị | thanh booster dưới bàn (bấm ô "+"), hoặc Shop ở nông trại |
| Hồi sinh khi thua | `REVIVE_PRICE = 900` → `+REVIVE_MOVES = 5` lượt | nút "Tiếp tục" trên popup "Hết lượt" |

Xu cũng vẫn dùng mua ruộng, chuồng, gà, máy như cũ (đơn hàng là nguồn xu ở nông trại).
Thiếu xu ở mọi đường (mua booster, hồi sinh) → `FalconSDK.shop.open(where)`; shop tắt (dev) thì toast "Không đủ xu".
`.falcon/sdk-config.json` giữ `winCoins` / `revivePrice` cùng giá trị cho lớp studio.

## Booster (300 xu mỗi cái, không tốn lượt)

| Booster | Mở từ màn | Cách dùng |
|---|---|---|
| **Xẻng vàng** (Golden Shovel) | 2 | Trang bị → chạm một cropsy hoặc vật cản: xúc bỏ hẳn (thùng 2 lớp cũng vỡ ngay) |
| **Móng ngựa may mắn** (Lucky Horseshoe) | 5 | Chạm là dùng: +5 lượt |
| **Quả Phù Thủy** (Witch Fruit) | 8 | Trang bị → chạm bất kỳ đâu (kể cả ô trống): xoá vùng 3×3, vật cản mất 1 lớp |

- Thanh booster ẩn trên bàn tutorial. Hết hàng → popup mua rồi tự dùng / trang bị. Bấm lại plate đang sáng để huỷ.
- Khi dùng: `FalconSDK.analytics.turn.useBooster(key)` tại chỗ tiêu.
- Hợp đồng `game.boosters` (defs/activate/isArmed/cancel) cũng được cài: đơn vị do lớp studio cấp qua `activate`
  không trừ vào kho booster của game.

## Cờ QA (thêm vào URL)

| Cờ | Tác dụng |
|---|---|
| `?level=N` | Boot thẳng vào màn Match N |
| `?reset=1` | Xoá save, về T00 |
| `?skiptut=1` | Bỏ tutorial (save mới) |
| `?lang=vi` | UI tiếng Việt (mặc định theo ngôn ngữ app/trình duyệt) |
| `?mock=1` | Giả lập bridge app của SDK |
| `?data={"hp":{"wallet":{"coin":2000}}}` | (SDK) ghi đè user data lúc boot — tiện cấp xu để test booster/hồi sinh |
| `?debug=1` | `window.__hp` cho test tự động: `state/board/hint/moves/cell/tileAt`, `play` (bot đi 1 nước), `swap`, `arm/use/buy` (booster), `setMoves/nearWin` |

Save nằm trong `userData.hp` (schema giống mục 11 của GDD, thêm `boosters: {shovel, moves, witch}`); `userData.coins` là bản sao ví xu
cho header của lớp studio. Tutorial lưu `stepId`, thoát giữa chừng sẽ resume đúng bước.
