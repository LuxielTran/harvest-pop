# Harvest Pop — Farm × Match-3

Game web của Falcon, khung chuẩn: Vite + TypeScript + `@falcongames/game-client-sdk`.
Nông trại là hub (trồng lúa, nuôi gà, máy thức ăn, đơn hàng); Match-3 cho Sao → đổi vật liệu → nâng Kho/Silo.

```bash
npm install
npm run dev      # hoặc mở Preview trong Falcon IDE
npm run build    # dist/index.html — một tệp duy nhất
```

## Cấu trúc

| Tệp | Vai trò |
|---|---|
| `src/config.ts` | Số liệu MVP: crop, gà, recipe, máy, kho & nâng cấp, XP, đơn hàng, 30 màn Match-3 |
| `src/state.ts` | Save data + services (wallet, kho, farm state machine, đơn hàng, sao, nâng cấp). Mọi thay đổi: validate → ghi → `save()` qua `FalconSDK.userData` |
| `src/match3.ts` | Engine Match-3 8×8 (seed, swap-only-if-match, clear → gravity → spawn → cascade, legal move, reshuffle, hint) |
| `src/tutorial.ts` | TutorialDirector T00→T12 (bắt buộc, resume theo save, chặn thao tác ngoài bước) |
| `src/ui/farm.ts` | Farm Home: scene, HUD, Shop, Kho/nâng kho, Upgrade Shop, Đơn hàng, Map màn, Cài đặt |
| `src/ui/match.ts` | Màn Match-3 (canvas), HUD moves/goal/sao, popup kết quả |
| `src/art.ts` | Toàn bộ art SVG gốc (item, công trình, 5 tile "cropsie") |
| `src/game.ts` | Hợp đồng `FalconGame`: `startLevel(i)` mở thẳng màn Match i, `levelStart`/`win`/`lose`, pause/resume/revive |

## Luồng boot

`registerFalconGame` gọi `startLevel(saved)` khi boot. Lần gọi tự động này mở **nông trại** (tutorial bắt đầu ở đó);
mọi lần gọi khác (map màn, Next, Retry, IDE verify, `?level=N`) mở thẳng màn Match-3 và phát `levelStart`.
Rời màn Match bằng nút Home kết thúc turn với `Skip`.

## Cờ QA (thêm vào URL)

| Cờ | Tác dụng |
|---|---|
| `?level=N` | Boot thẳng vào màn Match N |
| `?reset=1` | Xoá save, về T00 |
| `?skiptut=1` | Bỏ tutorial (save mới) |
| `?lang=vi` | UI tiếng Việt (mặc định theo ngôn ngữ app/trình duyệt) |
| `?mock=1` | Giả lập bridge app của SDK |
| `?debug=1` | `window.__hp` (hint/moves/cell/state) cho test tự động |

Save nằm trong `userData.hp` (schema giống mục 11 của GDD); tutorial lưu `stepId`, thoát giữa chừng sẽ resume đúng bước.
