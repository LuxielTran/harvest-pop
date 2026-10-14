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
| `src/farm-data.ts` | **Nội dung nông trại 50 cấp** (theo sheet "Harvest Pop Unlock Levels"): 15 cây trồng, 9 cây ăn quả/mỏ, 17 chuồng + 17 vật nuôi, 23 máy + 96 công thức, mốc XP, thưởng lên cấp, đơn xe tải, khách, thành tựu. Bảng tổng hợp: `LEVELS-FARM.md` |
| `src/config.ts` | Re-export farm-data + **50 màn Match-3** (bản đồ ASCII + mục tiêu), xu thưởng / giá booster / giá hồi sinh, 3 booster |
| `src/state.ts` | Save data + services (wallet, kho, ruộng, chuồng/vật nuôi, máy, cây, đơn xe tải, khách, thành tựu, sao, nâng kho, booster, hồi sinh). Mọi thay đổi: validate → ghi → `save()` qua `FalconSDK.userData`. Save cũ (không có `v: 2`) bắt đầu lại từ đầu |
| `src/match3.ts` | Engine Match-3 thuần logic: bàn tới 9×9 mọi hình dạng, Bùn / Thùng gỗ / Đất, thú nuôi rơi xuống, 2 power-up, trọng lực thẳng + trượt chéo, combo, reshuffle, mục tiêu, gợi ý |
| `src/tutorial.ts` | TutorialDirector: các **bài học** theo từng thao tác (L1 cấp 1: kéo map → gieo → gặt → Match-3 → nâng silo (có bước bấm ✕) → chuồng gà → gà → cho ăn → nhặt trứng; L2 máy thức ăn + khách; L3 lò bánh; L4 xe tải; L6 thành tựu) |
| `src/ui/farm.ts` | Farm Home: scene 2.5D (nhà, kho, silo, ruộng, chuồng, máy, cây, khách), HUD (thanh XP có số), Shop 3 tab, Kho/nâng kho, Upgrade Shop, Đơn xe tải, Khách, Thành tựu (chạm vào nhà), Map 50 màn, Cài đặt |
| `src/ui/match.ts` | Màn Match-3 (canvas, khay gỗ 2.5D): HUD lượt / tối đa 3 mục tiêu / sao, hiệu ứng power-up, thanh 3 booster, popup kết quả |
| `src/art.ts` + `art-core.ts`, `art-items.ts`, `art-animals.ts`, `art-crops.ts`, `art-pens.ts` | Toàn bộ art SVG gốc: helper 2.5D dùng chung, icon 138 sản phẩm, 17 vật nuôi, 15 cây trồng (3 giai đoạn), cây ăn quả, chuồng/nhà/máy, khách; phần Match-3: 9 cropsy (táo hồng, dâu đỏ, cà tím, bắp cải băng…), Cropsy Máy Cày, Hạt Cầu Vồng, bùn, thùng (nguyên / nứt), đất, gà con, heo con, icon booster |
| `src/game.ts` | Hợp đồng `FalconGame`: `startLevel(i)` mở thẳng màn Match i, `levelStart` (kèm `difficulty`) / `win` / `lose`, pause/resume/revive, `boosters` |
| `LEVELS.md` / `LEVELS-FARM.md` | Bảng 50 màn Match-3 / bảng 50 cấp nông trại (sinh từ farm-data) |

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
Nhịp độ khó theo tài liệu: 1–10 làm quen (dễ thở để gom xu, màn 10 chặn cửa đầu tiên), 11–25 răng cưa, 26–50 vòng lặp
siêu dễ → thường → thường → khó, màn 50 là Trùm. Các màn khó có **chỗ kẹt** (ô bị cô lập, đất bị thùng vây,
bùn chặn nút thắt) chỉ với tới bằng power-up hoặc booster.

Số lượt 20–50 tùy độ phức tạp của màn. Mục tiêu thu cropsy không vượt **2,5 / lượt** (giỏ "cropsy bất kỳ": 6 / lượt),
nên không còn kiểu "200 cà rốt trong 20 lượt"; độ khó đến từ số loại cropsy (4 ở màn siêu dễ, 5 ở các màn còn lại),
vật cản, bố cục và số lượt.

Mỗi màn có `powerChance` (tỉ lệ một cropsy mới rơi xuống sẵn là Cropsy Máy Cày) và có thể có `hives` (cột có tổ ong
thả Ong Chăm Chỉ), cộng với power-up sinh ra khi người chơi ghép hoặc khi cascade tự ghép.

Số lượng mục tiêu và số lượt được chỉnh bằng bot **mô phỏng người chơi**: chỉ đánh giá kết quả nhìn thấy của nước đi
(không đoán cascade) và đôi khi chọn nước tốt thứ 2–3. Mỗi màn chạy không booster và với 1 booster mỗi loại (kết quả ở `LEVELS.md`).

## Tutorial lần đầu

Lần đầu một power-up, vật cản, mục tiêu hay booster xuất hiện, màn đó mở một **thẻ hướng dẫn** (hình minh hoạ + lời giải
thích), rồi **dẫn tay** lần dùng đầu tiên. Mỗi tutorial chỉ hiện một lần (lưu trong `userData.hp.tips`).

| Màn | Dạy | Cách dẫn |
|---|---|---|
| 1 | Ghép 3, mục tiêu thu cropsy | tutorial nông trại (bong bóng) |
| 2 / 3 / 7 / 9 | Máy Cày / Bó Rơm / Ong + tổ ong / Hạt Cầu Vồng | bàn tay chỉ nước đổi tạo ra power-up (nếu bàn chưa có, game xếp sẵn một chỗ), rồi khoanh power-up vừa tạo: "giờ ghép nó" |
| 4 / 12 / 14 / 22 | Bùn / Thùng gỗ / Đất / Đất dưới thùng | khoanh các ô đó + bàn tay chỉ một nước tốt |
| 6 / 13 / 50 | Gà con / Heo con / mục tiêu "cropsy bất kỳ" | khoanh thú + nước gợi ý |
| 5 / 8 / 10 | Xẻng vàng / Móng ngựa / Quả Phù Thủy | **tặng 1 cái**, bàn tay chỉ nút booster, rồi chỉ ô dùng tốt nhất |

## Cropsy và màu sắc

9 loại cropsy, mỗi loại thuộc một **họ màu**: đỏ (dâu tây), cam (cà rốt), vàng (bắp, hướng dương, lúa mì), hồng (táo),
xanh ngọc (bắp cải băng — mới), xanh dương (việt quất), tím (cà tím — mới). Táo đổi sang **hồng sẫm có viền** (không lẫn với nền cỏ xanh) và dâu sang **đỏ thật**
để không còn lẫn hồng/đỏ. Một màn không bao giờ có hai loại cùng họ màu (vd. bắp cạnh lúa mì). Hai loại mới xuất hiện rải rác,
ngẫu nhiên theo seed của màn (khoảng 2/5 số màn), luôn thay một loại màu ấm không phải mục tiêu; số loại cropsy và mục tiêu
của mỗi màn giữ nguyên như đã chỉnh (`diversify` trong `src/config.ts`).

## Điểm và sao (thanh sao kiểu Candy Crush)

Điểm chạy ngầm, người chơi chỉ thấy **thanh sao** dưới các mục tiêu: thanh đầy dần theo điểm, qua mỗi mốc thì sao tương ứng
sáng lên. Thắng màn luôn được ít nhất 1★; 2★ và 3★ tùy điểm.

| Nguồn điểm (`SCORE` trong `src/config.ts`) | Điểm |
|---|---|
| Mỗi cropsy bị xoá | 20 × hệ số cascade (×1 nước đổi, ×2 cascade đầu… tối đa ×5) |
| Tạo power-up | Máy Cày 60, Ong 80, Bó Rơm 100, Hạt Cầu Vồng 200 |
| Power-up nổ / combo | 40 mỗi lần |
| Mỗi lớp vật cản bị phá | 40, thêm 60 khi vỡ hẳn |
| Cày một ô đất | 60 |
| Đưa thú xuống | 500 |
| **Thu hoạch thần tốc** (Harvest Rush): mỗi lượt còn dư khi thắng | 150 |

Vì vậy ghép 3 đơn thuần cho ít điểm (60 / nước) và khó đạt 3★; ghép tạo power-up, combo, cascade và thắng sớm cho điểm cao.
Mốc sao từng màn (`STAR_SCORES`) được chỉnh bằng bot mô phỏng người chơi: 1★ ở khoảng 60% điểm thắng thấp nhất (sao đầu
sáng giữa màn), 2★ ≈ phân vị 40, 3★ ≈ phân vị 75 của điểm khi thắng (màn 1–10: phân vị 25 / 55 cho dễ gom xu).
Khi thắng, lượt dư biến thành điểm có hiệu ứng lấp lánh, rồi mới tính sao.

## Power-up (cropsy đặc biệt)

Thứ tự ưu tiên khi một nước tạo nhiều hình (như Candy Crush): Hạt Cầu Vồng > Bó Rơm > Máy Cày > Ong.

| Tạo bằng | Tên | Tác dụng |
|---|---|---|
| Đúng 4 thành hàng | **Cropsy Máy Cày** (Tractor Cropsy) — dải vết bánh xe | Máy cày chạy hết một hàng (ghép dọc) hoặc một cột (ghép ngang) |
| 5 ô hình chữ T / L (hai đường cắt nhau) | **Cropsy Bó Rơm** (Hay Bale Cropsy) — vòng rơm buộc nơ đỏ | Nổ vùng 3×3, mỗi vật cản trong vùng mất **2 lớp** (thùng gỗ vỡ hẳn) |
| 5+ thành hàng | **Hạt Cầu Vồng** (Rainbow Seed) | Đổi với một cropsy: xoá mọi cropsy loại đó; đổi với Hạt Cầu Vồng khác: xoá cả bàn |
| Ô vuông 2×2 (hoặc rơi từ **tổ ong**) | **Ong Chăm Chỉ** (Busy Bee) — cropsy có chú ong | Bay tới 3 mục tiêu ưu tiên (đất → vật cản cần phá → cropsy cần thu), mỗi mục tiêu mất 1 lớp; chui **dưới vật cản** để cày đất |

Combo khi đổi hai power-up: Máy Cày + Máy Cày = chữ thập; Bó Rơm + Máy Cày = 3 hàng + 3 cột; Bó Rơm + Bó Rơm = nổ 5×5;
Ong + bất kỳ = cả hai cùng kích hoạt. Power-up bị blast trúng sẽ tự kích hoạt (dây chuyền). Blast quét qua cả ô trống.
Game không có vật cản kiểu "kẹo cam thảo" nên Máy Cày không bị "hút"; ưu thế tương ứng của Bó Rơm là phá 2 lớp mỗi vật cản.

## Xu (Coin) có ba việc

Người chơi mới bắt đầu với **500 xu**.

| Việc | Số liệu (`src/config.ts`) | Ở đâu |
|---|---|---|
| Thưởng qua màn | Màn siêu dễ / dễ / thường: 1★ 20, 2★ 40, 3★ 80. Màn khó / siêu khó / trùm: 1★ 40, 2★ 80, 3★ 160 | popup "Qua màn!" |
| Mua booster | `BOOSTERS[].price = 300` / 1 đơn vị | thanh booster dưới bàn (bấm ô "+"), hoặc Shop ở nông trại |
| Hồi sinh khi thua | `REVIVE_PRICE = 900` → `+REVIVE_MOVES = 5` lượt | nút "Tiếp tục" trên popup "Hết lượt" |

Chơi lại màn đã qua: nếu được nhiều sao hơn kỷ lục thì nhận phần chênh lệch theo bảng (vd. 1★ → 3★ ở màn thường: +60),
còn lại nhận `REPLAY_COINS = 10`. Xu cũng vẫn dùng mua ruộng, chuồng, gà, máy như cũ.
Thiếu xu ở mọi đường (mua booster, hồi sinh) → `FalconSDK.shop.open(where)`; shop tắt (dev) thì toast "Không đủ xu".
`.falcon/sdk-config.json` giữ `revivePrice` cho lớp studio; `winCoins` ở đó không còn dùng vì thưởng giờ theo sao.

## Booster (300 xu mỗi cái, không tốn lượt)

| Booster | Mở từ màn (tặng 1 cái + tutorial) | Cách dùng |
|---|---|---|
| **Xẻng vàng** (Golden Shovel) | 5 | Trang bị → chạm một cropsy hoặc vật cản: xúc bỏ hẳn (thùng 2 lớp cũng vỡ ngay) |
| **Móng ngựa may mắn** (Lucky Horseshoe) | 8 | Chạm là dùng: +5 lượt |
| **Quả Phù Thủy** (Witch Fruit) | 10 | Trang bị → chạm bất kỳ đâu (kể cả ô trống): xoá vùng 3×3, vật cản mất 1 lớp |

- Thanh booster ẩn trên bàn tutorial. Hết hàng → popup mua rồi tự dùng / trang bị. Bấm lại plate đang sáng để huỷ.
- Khi dùng: `FalconSDK.analytics.turn.useBooster(key)` tại chỗ tiêu.
- Hợp đồng `game.boosters` (defs/activate/isArmed/cancel) cũng được cài: đơn vị do lớp studio cấp qua `activate`
  không trừ vào kho booster của game.

## Cờ QA (thêm vào URL)

| Cờ | Tác dụng |
|---|---|
| `?level=N` | Boot thẳng vào màn Match N |
| `?reset=1` | Xoá save, về T00 |
| `?skiptut=1` | Bỏ mọi bài học hướng dẫn (bắt đầu ở cấp 2) |
| `?lang=vi` | UI tiếng Việt (mặc định theo ngôn ngữ app/trình duyệt) |
| `?mock=1` | Giả lập bridge app của SDK |
| `?data={"hp":{"wallet":{"coin":2000}}}` | (SDK) ghi đè user data lúc boot — tiện cấp xu để test booster/hồi sinh |
| `?notips=1` | Tắt thẻ tutorial lần đầu trong màn Match (cho test tự động) |
| `?debug=1` | `window.__hp` cho test tự động: `state/board/hint/moves/cell/tileAt`, `play` (bot đi 1 nước), `swap`, `arm/use/buy` (booster), `setMoves/nearWin` |

Save nằm trong `userData.hp` (schema giống mục 11 của GDD, thêm `boosters: {shovel, moves, witch}` và `tips`: tutorial đã xem); `userData.coins` là bản sao ví xu
cho header của lớp studio. Tutorial lưu `stepId`, thoát giữa chừng sẽ resume đúng bước.
