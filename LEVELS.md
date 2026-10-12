# Harvest Pop — 50 Match-3 levels

Built from "level harvest pop.md". Every level lives in `src/config.ts` as an ASCII map plus goals.

**How the numbers were set.** A greedy, goal-aware bot played each level 60 times. It ran once with no boosters and once with one Golden Shovel, one Lucky Horseshoe and one Witch Fruit. Goal counts and moves (always 22–35) were tuned until each difficulty landed in its band. The bot is a proxy for a decent player. Re-tune after real playtest data.

| Difficulty | Bot win rate, no boosters |
|---|---|
| Tutorial, Super easy, Easy | 95–100%, usually with moves to spare |
| Normal | 65–85% |
| Hard | 30–45%; about 70–85% with boosters |
| Super Hard | 10–20%; about 45–75% with boosters |
| Boss | about 20–30%; about 75% with boosters |

**Stuck cases.** Hard levels contain spots that matches alone cannot reach. Power-ups or boosters open them.

- Levels 10, 25 and 49 have mud sealed in the bottom corners.
- Level 20 has mud corners on 1-wide columns, plus a crate ring.
- Levels 15 and 41 have soil boxed in by crates.
- Level 29 has sealed soil corners under a crate wall.
- Level 33 has a crate floor under a crate floor.
- Level 37 has crate-sealed animal pens.
- Level 45 has mud on the single choke tile, which stops every refill below it.

**Collect counts look large.** Levels with 3 or 4 cropsy kinds cascade heavily, so their collect goals are in the hundreds. Farm Heroes Saga uses goal sizes like these. Levels with 5 kinds use smaller counts.

**Power-up column.** It shows the average number of power-ups created per game, from player matches and from cascades. Each level also has a small chance that a freshly dropped cropsy arrives as a Tractor Cropsy.

| # | Difficulty | Kinds | Grid | Moves | Goals | Bot win | With boosters | Power-ups / game |
|---|---|---|---|---|---|---|---|---|
| 1 | Tutorial | 3 | 6×6 | 22 | 40 apple | 100% | 100% | 9 |
| 2 | Tutorial | 4 | 7×7 | 25 | 45 carrot, 45 corn | 100% | 100% | 9 |
| 3 | Easy | 4 | 8×8 | 25 | 150 strawberry | 97% | 100% | 25 |
| 4 | Easy | 4 | 8×8 | 25 | 150 blueberry, 4 mud | 98% | 100% | 26 |
| 5 | Easy | 4 | 8×8 shaped | 25 | 8 mud, 80 corn | 100% | 100% | 14 |
| 6 | Normal | 4 | 8×8 | 22 | 1 chick, 180 blueberry | 82% | 100% | 30 |
| 7 | Easy | 4 | 7×9 shaped | 28 | 55 apple, 55 corn | 100% | 100% | 9 |
| 8 | Normal | 4 | 9×9 shaped | 28 | 6 mud, 2 chicks, 240 carrot | 82% | 100% | 38 |
| 9 | Easy | 3 | 7×7 | 25 | 450 strawberry | 100% | 100% | 77 |
| 10 | **Hard** | 5 | 8×8 shaped | 22 | 12 mud, 60 sunflower | 33% | 67% | 11 |
| 11 | Super easy | 4 | 9×9 | 30 | 280 carrot | 100% | 100% | 37 |
| 12 | Normal | 5 | 8×8 | 25 | 4 crate, 70 apple | 70% | 93% | 13 |
| 13 | Normal | 5 | 8×9 shaped | 30 | 2 piglets, 45 corn | 85% | 100% | 7 |
| 14 | Easy | 4 | 8×8 | 25 | 10 soil, 140 blueberry | 100% | 100% | 24 |
| 15 | **Hard** | 5 | 9×9 shaped | 28 | 20 soil, 75 strawberry | 30% | 75% | 11 |
| 16 | Super easy | 4 | 5×9 | 30 | 80 blueberry | 100% | 100% | 12 |
| 17 | Normal | 5 | 8×8 | 28 | 10 mud, 4 crate, 75 sunflower | 78% | 98% | 13 |
| 18 | Normal | 5 | 8×9 shaped | 35 | 3 chicks | 65% | 93% | 9 |
| 19 | Easy | 4 | 7×7 | 25 | 15 soil, 100 corn | 97% | 100% | 17 |
| 20 | **Super Hard** | 5 | 9×9 shaped | 22 | 12 crate, 2 mud | 20% | 45% | 13 |
| 21 | Super easy | 5 | 6×6 | 30 | 30 corn, 30 apple | 100% | 100% | 4 |
| 22 | Normal | 5 | 8×8 | 28 | 8 soil, 85 blueberry | 67% | 93% | 14 |
| 23 | Normal | 5 | 9×9 shaped | 30 | 2 piglets, 70 wheat | 65% | 93% | 11 |
| 24 | Easy | 5 | 9×9 | 30 | 105 strawberry | 100% | 100% | 15 |
| 25 | **Hard** | 5 | 8×8 shaped | 25 | 16 mud, 60 carrot | 42% | 78% | 11 |
| 26 | Super easy | 4 | 8×8 | 28 | 140 apple | 100% | 100% | 24 |
| 27 | Normal | 4 | 8×8 | 26 | 8 crate, 215 strawberry | 72% | 100% | 35 |
| 28 | Normal | 4 | 8×9 | 30 | 18 soil, 280 corn | 72% | 93% | 45 |
| 29 | **Hard** | 5 | 8×8 shaped | 28 | 8 crate, 12 soil, 35 sunflower | 43% | 82% | 11 |
| 30 | Super easy | 4 | 8×8 | 30 | 16 mud, 135 carrot | 100% | 100% | 23 |
| 31 | Normal | 4 | 8×8 | 28 | 8 mud, 8 crate, 235 blueberry | 80% | 97% | 39 |
| 32 | Normal | 4 | 9×9 | 30 | 13 crate, 360 corn | 82% | 98% | 59 |
| 33 | **Super Hard** | 5 | 9×9 | 26 | 18 crate, 9 soil, 95 apple | 18% | 73% | 14 |
| 34 | Super easy | 4 | 8×9 shaped | 30 | 2 chicks | 95% | 95% | 13 |
| 35 | Normal | 4 | 8×9 shaped | 28 | 2 chicks, 4 mud, 170 strawberry | 78% | 95% | 28 |
| 36 | Normal | 4 | 8×9 shaped | 30 | 2 piglets, 175 carrot | 77% | 90% | 30 |
| 37 | **Hard** | 5 | 9×9 shaped | 35 | 3 piglets, 4 crate | 45% | 83% | 16 |
| 38 | Super easy | 4 | 8×8 | 28 | 16 soil, 150 apple | 100% | 100% | 25 |
| 39 | Normal | 4 | 8×8 | 28 | 8 soil, 220 carrot | 82% | 98% | 35 |
| 40 | Normal | 4 | 8×8 | 30 | 12 soil, 225 blueberry | 78% | 100% | 36 |
| 41 | **Hard** | 5 | 8×8 | 30 | 16 soil, 90 corn | 42% | 80% | 14 |
| 42 | Super easy | 4 | 9×9 shaped | 28 | 120 apple | 100% | 100% | 20 |
| 43 | Normal | 4 | 9×9 shaped | 30 | 18 soil, 30 strawberry | 73% | 73% | 17 |
| 44 | Normal | 4 | 9×9 shaped | 30 | 2 chicks, 6 mud | 73% | 83% | 20 |
| 45 | **Super Hard** | 5 | 9×9 shaped | 26 | 8 crate, 1 mud, 80 sunflower | 10% | 43% | 10 |
| 46 | Super easy | 4 | 9×9 | 30 | 20 soil, 230 apple | 100% | 100% | 39 |
| 47 | Normal | 4 | 9×9 | 32 | 25 soil, 10 mud, 430 blueberry | 78% | 98% | 68 |
| 48 | Normal | 4 | 9×9 | 30 | 2 chicks, 15 soil, 400 carrot | 70% | 98% | 62 |
| 49 | **Hard** | 5 | 9×9 shaped | 25 | 14 soil, 9 crate, 10 mud | 30% | 68% | 17 |
| 50 | **Boss** | 5 | 9×9 | 23 | 240 any cropsy, 40 soil, 4 piglets | 22% | 73% | 13 |
