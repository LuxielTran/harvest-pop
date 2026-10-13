# Harvest Pop — 50 Match-3 levels

Built from "level harvest pop.md". Every level lives in `src/config.ts` as an ASCII map plus goals.

**How the numbers were set.** A bot that models a casual player played each level 40 times. It judges a swap only by what visibly happens on the first step, with no cascade prediction. It usually takes its best move, but sometimes its 2nd or 3rd. It ran once with no boosters and once with one Golden Shovel, one Lucky Horseshoe and one Witch Fruit. Re-tune these numbers once real playtest data exists.

**Rules the tuning kept.**

- **Moves** range from 20 to 50, by how complex the level is.
- **Collect goals** never ask more than 2.5 cropsies per move. The "any cropsy" basket allows 6 per move.
- **Cropsy kinds:** super easy levels use 4. Every other level uses 5, except the first two tutorials.
- **Levels 1–10** are comfortable, so players can earn coins, but they still take most of the moves.

| Difficulty | Win rate, no boosters | With boosters |
|---|---|---|
| Tutorial, Super easy, Easy | 85–100%, mostly 2–3 stars | 100% |
| Normal | 70–95% | 88–100% |
| Hard | 38–55% (level 10 is a gentler 73%) | 83–98% |
| Super Hard | 18–20% | 68–85% |
| Boss | 25% | 63% |

**Stuck cases.** Hard levels hold spots that matches alone barely reach. Power-ups or boosters open them.

- Level 20 has sealed corner crates.
- Levels 10, 25 and 49 have sealed corner mud.
- Levels 15 and 41 have soil boxed in by crates.
- Level 33 has a crate floor under a crate floor.
- Level 37 has crate-sealed pens.
- Level 45 has mud on the choke tile.

**Stars column.** Of the bot's wins, the share that earned 1★ / 2★ / 3★. Stars come from the background score (see the README), and set the coin reward: 20/40/80 on regular levels, 40/80/160 on hard, super hard and boss levels.

| # | Difficulty | Cropsies | Grid | Moves | Goals | Win | ★ split (1/2/3) | With boosters | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Tutorial | apple, carrot, sunflower | 6×6 | 20 | 35 apple | 100% | 33/20/48% | 100% |  |
| 2 | Tutorial | carrot, corn, apple, strawberry | 7×7 | 20 | 35 carrot, 35 corn | 100% | 33/35/33% | 100% | teaches tractor |
| 3 | Easy | strawberry, apple, carrot, frost cabbage, blueberry | 8×8 | 22 | 35 strawberry | 98% | 13/23/64% | 100% | teaches haybale |
| 4 | Easy | blueberry, apple, strawberry, carrot, sunflower | 8×8 | 22 | 40 blueberry, 4 mud | 95% | 24/34/42% | 100% | teaches mud |
| 5 | Easy | apple, carrot, corn, blueberry, strawberry | 8×8 shaped | 24 | 8 mud, 35 corn | 100% | 20/28/53% | 100% | teaches shovel |
| 6 | Normal | strawberry, blueberry, apple, wheat, frost cabbage | 8×8 | 24 | 1 chick, 35 blueberry | 98% | 28/36/36% | 100% | teaches chick |
| 7 | Easy | apple, corn, carrot, eggplant, blueberry | 7×9 shaped | 25 | 30 apple, 30 corn | 93% | 8/46/46% | 100% | teaches bee; beehives |
| 8 | Normal | strawberry, carrot, sunflower, blueberry, apple | 9×9 shaped | 28 | 6 mud, 2 chicks, 45 carrot | 88% | 14/29/57% | 98% | teaches moves |
| 9 | Easy | strawberry, apple, blueberry, carrot, sunflower | 7×7 | 24 | 10 mud, 40 strawberry | 85% | 15/24/62% | 100% | teaches rainbow |
| 10 | **Hard** | apple, frost cabbage, blueberry, strawberry, sunflower | 8×8 shaped | 23 | 12 mud, 50 sunflower | 73% | 48/21/31% | 95% | teaches witch |
| 11 | Super easy | carrot, apple, corn, blueberry | 9×9 | 20 | 50 carrot | 100% | 30/38/33% | 100% |  |
| 12 | Normal | frost cabbage, blueberry, apple, carrot, sunflower | 8×8 | 20 | 4 crate, 50 apple | 78% | 55/29/16% | 100% | teaches crate |
| 13 | Normal | eggplant, corn, apple, strawberry, blueberry | 8×9 shaped | 30 | 2 piglets, 40 corn | 88% | 49/29/23% | 100% | teaches piglet |
| 14 | Easy | blueberry, strawberry, apple, carrot, corn | 8×8 | 24 | 10 soil, 40 blueberry | 98% | 41/36/23% | 100% | teaches soil |
| 15 | **Hard** | apple, carrot, corn, strawberry, blueberry | 9×9 shaped | 27 | 20 soil, 65 strawberry | 38% | 27/33/40% | 95% |  |
| 16 | Super easy | blueberry, corn, apple, carrot | 5×9 | 20 | 50 blueberry | 100% | 48/25/28% | 100% |  |
| 17 | Normal | strawberry, sunflower, carrot, blueberry, apple | 8×8 | 28 | 10 mud, 4 crate, 65 sunflower | 85% | 38/29/32% | 98% |  |
| 18 | Normal | apple, blueberry, strawberry, wheat, carrot | 8×9 shaped | 44 | 3 chicks | 80% | 38/34/28% | 98% | beehives |
| 19 | Easy | corn, carrot, strawberry, blueberry, apple | 7×7 | 24 | 15 soil, 25 corn | 100% | 33/48/20% | 100% |  |
| 20 | **Super Hard** | apple, carrot, corn, strawberry, blueberry | 9×9 shaped | 20 | 20 crate, 50 blueberry | 18% | 43/29/29% | 73% |  |
| 21 | Super easy | corn, apple, carrot, eggplant, blueberry | 6×6 | 25 | 25 corn, 25 apple | 100% | 20/53/28% | 100% |  |
| 22 | Normal | blueberry, apple, strawberry, carrot, frost cabbage | 8×8 | 20 | 8 soil, 45 blueberry | 93% | 46/35/19% | 100% | teaches soilcrate; beehives |
| 23 | Normal | carrot, eggplant, apple, blueberry, wheat | 9×9 shaped | 30 | 2 piglets, 60 wheat | 73% | 28/52/21% | 100% |  |
| 24 | Easy | strawberry, apple, carrot, corn, blueberry | 9×9 | 22 | 50 strawberry, 4 crate | 100% | 18/40/43% | 100% |  |
| 25 | **Hard** | carrot, apple, blueberry, strawberry, sunflower | 8×8 shaped | 22 | 16 mud, 55 carrot | 43% | 35/35/29% | 90% |  |
| 26 | Super easy | apple, corn, carrot, blueberry | 8×8 | 20 | 50 apple | 100% | 30/38/33% | 100% |  |
| 27 | Normal | strawberry, apple, sunflower, carrot, blueberry | 8×8 | 26 | 8 crate, 60 strawberry | 78% | 42/39/19% | 98% |  |
| 28 | Normal | corn, blueberry, apple, strawberry, carrot | 8×9 | 24 | 18 soil, 50 corn | 95% | 39/34/26% | 100% | beehives |
| 29 | **Hard** | apple, carrot, blueberry, strawberry, sunflower | 8×8 shaped | 20 | 8 crate, 12 soil, 45 sunflower | 55% | 18/45/36% | 95% |  |
| 30 | Super easy | carrot, apple, corn, strawberry | 8×8 | 20 | 16 mud, 50 carrot | 100% | 40/28/33% | 100% |  |
| 31 | Normal | blueberry, eggplant, apple, carrot, corn | 8×8 | 28 | 8 mud, 8 crate, 60 blueberry | 80% | 28/41/31% | 100% |  |
| 32 | Normal | corn, frost cabbage, apple, carrot, blueberry | 9×9 | 21 | 13 crate, 45 corn | 80% | 38/34/28% | 100% |  |
| 33 | **Super Hard** | apple, carrot, corn, strawberry, blueberry | 9×9 | 20 | 18 crate, 9 soil, 45 apple | 18% | 14/43/43% | 85% |  |
| 34 | Super easy | apple, blueberry, frost cabbage, sunflower | 8×9 shaped | 22 | 2 chicks, 25 apple | 95% | 45/39/16% | 98% |  |
| 35 | Normal | strawberry, blueberry, apple, eggplant, wheat | 8×9 shaped | 28 | 2 chicks, 4 mud, 30 strawberry | 83% | 39/36/24% | 93% | beehives |
| 36 | Normal | carrot, apple, blueberry, wheat, frost cabbage | 8×9 shaped | 42 | 2 piglets, 35 carrot | 78% | 19/48/32% | 88% |  |
| 37 | **Hard** | apple, carrot, blueberry, strawberry, sunflower | 9×9 shaped | 26 | 3 piglets, 4 crate | 45% | 44/33/22% | 83% |  |
| 38 | Super easy | apple, corn, frost cabbage, blueberry | 8×8 | 20 | 16 soil, 50 apple | 100% | 57/40/3% | 100% |  |
| 39 | Normal | carrot, apple, strawberry, corn, blueberry | 8×8 | 26 | 8 soil, 60 carrot | 85% | 38/32/29% | 98% |  |
| 40 | Normal | strawberry, carrot, wheat, blueberry, apple | 8×8 | 20 | 12 soil, 45 blueberry | 78% | 42/26/32% | 100% |  |
| 41 | **Hard** | apple, frost cabbage, corn, strawberry, blueberry | 8×8 | 20 | 20 soil, 50 corn | 55% | 36/41/23% | 90% | beehives |
| 42 | Super easy | apple, strawberry, carrot, eggplant | 9×9 shaped | 20 | 50 apple | 100% | 55/33/13% | 100% |  |
| 43 | Normal | strawberry, blueberry, apple, carrot, eggplant | 9×9 shaped | 26 | 18 soil, 45 strawberry | 75% | 40/37/23% | 100% |  |
| 44 | Normal | carrot, strawberry, blueberry, sunflower, apple | 9×9 shaped | 22 | 2 chicks, 6 mud | 78% | 52/23/26% | 100% |  |
| 45 | **Super Hard** | apple, carrot, blueberry, eggplant, sunflower | 9×9 shaped | 25 | 8 crate, 1 mud, 60 sunflower | 20% | 38/50/13% | 68% |  |
| 46 | Super easy | apple, corn, strawberry, frost cabbage | 9×9 | 20 | 20 soil, 50 apple | 100% | 40/20/40% | 100% |  |
| 47 | Normal | blueberry, strawberry, corn, apple, carrot | 9×9 | 20 | 25 soil, 18 mud, 50 blueberry | 85% | 47/38/15% | 100% | beehives |
| 48 | Normal | carrot, strawberry, apple, corn, blueberry | 9×9 | 23 | 2 chicks, 15 soil, 35 carrot | 78% | 45/26/29% | 95% |  |
| 49 | **Hard** | apple, carrot, eggplant, strawberry, blueberry | 9×9 shaped | 20 | 14 soil, 16 crate, 50 strawberry | 50% | 40/35/25% | 98% |  |
| 50 | **Boss** | apple, carrot, blueberry, strawberry, sunflower | 9×9 | 22 | 130 any cropsy, 40 soil, 4 piglets | 25% | 50/20/30% | 63% | teaches any; beehives |
