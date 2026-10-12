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
| `src/config.ts` | Số liệu MVP: crop, gà, recipe, máy, kho & nâng cấp, XP, đơn hàng, 30 màn Match-3, xu thưởng / giá booster / giá hồi sinh, danh sách booster |
| `src/state.ts` | Save data + services (wallet, kho, farm state machine, đơn hàng, sao, nâng cấp, booster, hồi sinh). Mọi thay đổi: validate → ghi → `save()` qua `FalconSDK.userData` |
| `src/match3.ts` | Engine Match-3 8×8 (seed, swap-only-if-match, clear → gravity → spawn → cascade, legal move, reshuffle, hint) |
| `src/tutorial.ts` | TutorialDirector T00→T12 (bắt buộc, resume theo save, chặn thao tác ngoài bước) |
| `src/ui/farm.ts` | Farm Home: scene 2.5D (depth-sort theo z-index), HUD, Shop (kể cả booster), Kho/nâng kho, Upgrade Shop, Đơn hàng, Map màn, Cài đặt |
| `src/ui/match.ts` | Màn Match-3 (canvas, khay gỗ 2.5D), HUD moves/goal/sao, thanh booster, popup mua booster, popup kết quả (xu thưởng, hồi sinh) |
| `src/art.ts` | Toàn bộ art SVG gốc: helper chiếu isometric (`isoBox`, `isoRoof`…), công trình 2.5D, ô ruộng & cây trồng, decor sân (hàng rào, ao, cây, kiện rơm), item, 5 tile "cropsie", icon Xẻng vàng |
| `src/game.ts` | Hợp đồng `FalconGame`: `startLevel(i)` mở thẳng màn Match i, `levelStart`/`win`/`lose`, pause/resume/revive, `boosters` |

## Luồng boot

`registerFalconGame` gọi `startLevel(saved)` khi boot. Lần gọi tự động này mở **nông trại** (tutorial bắt đầu ở đó);
mọi lần gọi khác (map màn, Next, Retry, IDE verify, `?level=N`) mở thẳng màn Match-3 và phát `levelStart`.
Rời màn Match bằng nút Home kết thúc turn với `Skip`.

## Xu (Coin) có ba việc

| Việc | Số liệu (`src/config.ts`) | Ở đâu |
|---|---|---|
| Thưởng qua màn | `WIN_COINS = 40` lần đầu qua màn; `REPLAY_COINS = 10` khi chơi lại màn đã qua | popup "Qua màn!" |
| Mua booster | `BOOSTERS[].price = 300` / 1 Xẻng vàng | thanh booster dưới bàn (bấm ô "+"), hoặc Shop ở nông trại |
| Hồi sinh khi thua | `REVIVE_PRICE = 900` → `+REVIVE_MOVES = 5` lượt | nút "Tiếp tục" trên popup "Hết lượt" |

Xu cũng vẫn dùng mua ruộng, chuồng, gà, máy như cũ (đơn hàng là nguồn xu ở nông trại).
Thiếu xu ở mọi đường (mua booster, hồi sinh) → `FalconSDK.shop.open(where)`; shop tắt (dev) thì toast "Không đủ xu".
`.falcon/sdk-config.json` giữ `winCoins` / `revivePrice` cùng giá trị cho lớp studio.

## Booster: Xẻng vàng (Golden Shovel)

Tương đương búa kẹo của Candy Crush: xúc bỏ **một ô bất kỳ** trên bàn, **không tốn lượt**; ô mục tiêu vẫn tính vào goal,
bàn rơi và cascade như thường. Một lần dùng = một đơn vị (`S.boosters.shovel`).

- Thanh booster hiện từ màn `BOOSTERS[].unlock` (2) và ẩn trên bàn tutorial.
- Bấm plate: có hàng → "trang bị" (plate sáng, bàn nhấp nháy, tooltip "Chạm vào một ô để xúc"); bấm lại để huỷ.
  Hết hàng → popup mua (300 xu) rồi tự trang bị.
- Khi xúc: `FalconSDK.analytics.turn.useBooster('shovel')` tại chỗ tiêu.
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
| `?debug=1` | `window.__hp` cho test tự động: `hint/moves/cell/state/tileAt`, `arm/dig/buy` (booster), `swap/setMoves/setCollected` (ép thắng/thua) |

Save nằm trong `userData.hp` (schema giống mục 11 của GDD, thêm `boosters: {shovel: n}`); `userData.coins` là bản sao ví xu
cho header của lớp studio. Tutorial lưu `stepId`, thoát giữa chừng sẽ resume đúng bước.
