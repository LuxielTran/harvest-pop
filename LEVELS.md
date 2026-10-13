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

**Stars column.** It shows the average stars on a win. Stars set the coin reward: 20/40/80 on regular levels and 40/80/160 on hard, super hard and boss levels.

| # | Difficulty | Kinds | Grid | Moves | Goals | Win | Avg ★ | With boosters | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Tutorial | 3 | 6×6 | 20 | 35 apple | 100% | 3.0 | 100% |  |
| 2 | Tutorial | 4 | 7×7 | 20 | 35 carrot, 35 corn | 100% | 3.0 | 100% | teaches tractor |
| 3 | Easy | 5 | 8×8 | 22 | 35 strawberry | 98% | 2.8 | 100% | teaches haybale |
| 4 | Easy | 5 | 8×8 | 22 | 40 blueberry, 4 mud | 95% | 2.7 | 100% | teaches mud |
| 5 | Easy | 5 | 8×8 shaped | 24 | 8 mud, 35 corn | 100% | 2.7 | 100% | teaches shovel |
| 6 | Normal | 5 | 8×8 | 24 | 1 chick, 35 blueberry | 98% | 2.9 | 100% | teaches chick |
| 7 | Easy | 5 | 7×9 shaped | 25 | 30 apple, 30 corn | 93% | 2.6 | 100% | teaches bee; beehives |
| 8 | Normal | 5 | 9×9 shaped | 28 | 6 mud, 2 chicks, 45 carrot | 88% | 2.8 | 98% | teaches moves |
| 9 | Easy | 5 | 7×7 | 24 | 10 mud, 40 strawberry | 85% | 2.4 | 100% | teaches rainbow |
| 10 | **Hard** | 5 | 8×8 shaped | 23 | 12 mud, 50 sunflower | 73% | 2.2 | 95% | teaches witch |
| 11 | Super easy | 4 | 9×9 | 20 | 50 carrot | 100% | 3.0 | 100% |  |
| 12 | Normal | 5 | 8×8 | 20 | 4 crate, 50 apple | 78% | 1.9 | 100% | teaches crate |
| 13 | Normal | 5 | 8×9 shaped | 30 | 2 piglets, 40 corn | 88% | 2.7 | 100% | teaches piglet |
| 14 | Easy | 5 | 8×8 | 24 | 10 soil, 40 blueberry | 98% | 2.7 | 100% | teaches soil |
| 15 | **Hard** | 5 | 9×9 shaped | 27 | 20 soil, 65 strawberry | 38% | 2.0 | 95% |  |
| 16 | Super easy | 4 | 5×9 | 20 | 50 blueberry | 100% | 3.0 | 100% |  |
| 17 | Normal | 5 | 8×8 | 28 | 10 mud, 4 crate, 65 sunflower | 85% | 2.4 | 98% |  |
| 18 | Normal | 5 | 8×9 shaped | 44 | 3 chicks | 80% | 2.7 | 98% | beehives |
| 19 | Easy | 5 | 7×7 | 24 | 15 soil, 25 corn | 100% | 2.9 | 100% |  |
| 20 | **Super Hard** | 5 | 9×9 shaped | 20 | 20 crate, 50 blueberry | 18% | 1.1 | 73% |  |
| 21 | Super easy | 5 | 6×6 | 25 | 25 corn, 25 apple | 100% | 3.0 | 100% |  |
| 22 | Normal | 5 | 8×8 | 20 | 8 soil, 45 blueberry | 93% | 2.1 | 100% | teaches soilcrate; beehives |
| 23 | Normal | 5 | 9×9 shaped | 30 | 2 piglets, 60 wheat | 73% | 2.3 | 100% |  |
| 24 | Easy | 5 | 9×9 | 22 | 50 strawberry, 4 crate | 100% | 2.8 | 100% |  |
| 25 | **Hard** | 5 | 8×8 shaped | 22 | 16 mud, 55 carrot | 43% | 1.7 | 90% |  |
| 26 | Super easy | 4 | 8×8 | 20 | 50 apple | 100% | 3.0 | 100% |  |
| 27 | Normal | 5 | 8×8 | 26 | 8 crate, 60 strawberry | 78% | 2.4 | 98% |  |
| 28 | Normal | 5 | 8×9 | 24 | 18 soil, 50 corn | 95% | 2.2 | 100% | beehives |
| 29 | **Hard** | 5 | 8×8 shaped | 20 | 8 crate, 12 soil, 45 sunflower | 55% | 1.8 | 95% |  |
| 30 | Super easy | 4 | 8×8 | 20 | 16 mud, 50 carrot | 100% | 3.0 | 100% |  |
| 31 | Normal | 5 | 8×8 | 28 | 8 mud, 8 crate, 60 blueberry | 80% | 2.2 | 100% |  |
| 32 | Normal | 5 | 9×9 | 21 | 13 crate, 45 corn | 80% | 2.0 | 100% |  |
| 33 | **Super Hard** | 5 | 9×9 | 20 | 18 crate, 9 soil, 45 apple | 18% | 2.0 | 85% |  |
| 34 | Super easy | 4 | 8×9 shaped | 22 | 2 chicks, 25 apple | 95% | 2.9 | 98% |  |
| 35 | Normal | 5 | 8×9 shaped | 28 | 2 chicks, 4 mud, 30 strawberry | 83% | 2.7 | 93% | beehives |
| 36 | Normal | 5 | 8×9 shaped | 42 | 2 piglets, 35 carrot | 78% | 2.8 | 88% |  |
| 37 | **Hard** | 5 | 9×9 shaped | 26 | 3 piglets, 4 crate | 45% | 2.4 | 83% |  |
| 38 | Super easy | 4 | 8×8 | 20 | 16 soil, 50 apple | 100% | 3.0 | 100% |  |
| 39 | Normal | 5 | 8×8 | 26 | 8 soil, 60 carrot | 85% | 2.2 | 98% |  |
| 40 | Normal | 5 | 8×8 | 20 | 12 soil, 45 blueberry | 78% | 1.9 | 100% |  |
| 41 | **Hard** | 5 | 8×8 | 20 | 20 soil, 50 corn | 55% | 1.8 | 90% | beehives |
| 42 | Super easy | 4 | 9×9 shaped | 20 | 50 apple | 100% | 3.0 | 100% |  |
| 43 | Normal | 5 | 9×9 shaped | 26 | 18 soil, 45 strawberry | 75% | 2.3 | 100% |  |
| 44 | Normal | 5 | 9×9 shaped | 22 | 2 chicks, 6 mud | 78% | 2.6 | 100% |  |
| 45 | **Super Hard** | 5 | 9×9 shaped | 25 | 8 crate, 1 mud, 60 sunflower | 20% | 1.9 | 68% |  |
| 46 | Super easy | 4 | 9×9 | 20 | 20 soil, 50 apple | 100% | 3.0 | 100% |  |
| 47 | Normal | 5 | 9×9 | 20 | 25 soil, 18 mud, 50 blueberry | 85% | 2.2 | 100% | beehives |
| 48 | Normal | 5 | 9×9 | 23 | 2 chicks, 15 soil, 35 carrot | 78% | 2.0 | 95% |  |
| 49 | **Hard** | 5 | 9×9 shaped | 20 | 14 soil, 16 crate, 50 strawberry | 50% | 1.8 | 98% |  |
| 50 | **Boss** | 5 | 9×9 | 22 | 130 any cropsy, 40 soil, 4 piglets | 25% | 1.5 | 63% | teaches any; beehives |
