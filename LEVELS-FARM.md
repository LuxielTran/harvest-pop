# Harvest Pop — farm levels 1–50

Generated from `src/farm-data.ts` (run the generator in the scratchpad after editing the data). Follows the "Harvest Pop Unlock Levels" sheet; rows marked PROPOSAL there are implemented as listed below.

**Reading of the sheet.** "Experience points to next level" is treated as the cumulative XP at which the level is reached (level 2 at 15 XP … level 50 at 54 800). "(xN)" after a crop = seed gift; "(xN in shop)" after an animal = pen capacity. Fields: 6 at start, +3 at every odd level from 3 (78 at level 49).

**Adaptations.** Products the sheet lists without a building get one: BBQ Grill (11), Sugar Mill (13), Popcorn Pot (16). Carrot is a level-9 crop (carrot pie / cake / juice need it). Pizza lives in the Pie Oven. Pets (dog, cat, horse, bunny, puppy, kitten, donkey) eat a treat for XP. The Mine (24) digs a random ore on a timer; the Fishing Lake (27) turns lures into fish fillets, the Lobster Pool (44) nets into lobster tails, the Beehive Tree (39) nectar into honeycomb. Not built (optional meta systems): Neighborhood/Social, Farm Pass, Helper, Production Mastery, Boat Orders, Derby, Vouchers, Land Expansion, Farm Edit (moving buildings already exists), Farm Helpers, Town, Alpaca.

| Lv | XP to reach | Reward | Lesson | Unlocks |
|---|---|---|---|---|
| 1 | 0 |  |  | wheat (×6), coop, chicken, egg, feed #3 |
| 2 | 15 | 1 gem + 100 coins | L2 | **visitor**, corn (×4), feedmill, feed |
| 3 | 20 |  | L3 | +3 fields, bakery, bread |
| 4 | 30 | 1 gem + 100 coins | L4 | **truck** |
| 5 | 50 |  |  | +3 fields, soybean (×3) |
| 6 | 200 | 1 gem + 100 coins | L6 | **achievements**, cowpasture, cow, dairy, cowfeed #5, cream, milk |
| 7 | 370 |  |  | +3 fields |
| 8 | 500 | 1 gem + 100 coins |  | **truck_slot** |
| 9 | 790 |  |  | +3 fields, carrot (×3) |
| 10 | 1000 | 5 gem + 500 coins |  | pigpen, pig, pigfeed, cookie, bacon |
| 11 | 1240 |  |  | +3 fields, grill, baconeggs |
| 12 | 1480 | 2 gem + 1000 coins |  | **truck_slot**, coop #2, feedmill #2, cheese |
| 13 | 1720 |  |  | +3 fields, indigo (×3), sugarmill, whitesugar |
| 14 | 1960 | 2 gem + 1000 coins |  | pieoven, carrotpie |
| 15 | 2200 |  |  | +3 fields, pumpkin (×3), appletree, cowpasture #2, pumpkinpie |
| 16 | 2600 | 2 gem + 1000 coins |  | sheeppasture, sheep, popcornpot, sheepfeed, butteredpopcorn, wool |
| 17 | 3000 |  |  | **truck_slot**, +3 fields, loom, sweater |
| 18 | 3400 | 2 gem + 1000 coins |  | cotton (×3), pigpen #2, hamburger, syrup, baconpie, cottonfabric |
| 19 | 3800 |  |  | +3 fields, raspberrybush, sewing, raspberrymuffin, bluewoollyhat, cottonshirt |
| 20 | 4200 | 10 gem + 2000 coins |  | doghouse, dog, bluesweater |
| 21 | 4860 |  |  | +3 fields, cathouse, cat, cakeoven, woolychaps, carrotcake |
| 22 | 5520 | 3 gem + 2000 coins |  | **truck_slot**, cherrytree |
| 23 | 6180 |  |  | +3 fields, coop #3, creamcake, redberrycake |
| 24 | 6840 | 3 gem + 2000 coins |  | **mine**, mine, smelter, cheesecake, silverbar |
| 25 | 7500 |  |  | +3 fields, chili (×3), blackbean (×3), lambpasture, lamb, lambfeed, chilipopcorn, violetdress, goldbar, platinumbar, lambskewer |
| 26 | 8400 | 3 gem + 2000 coins |  | blackberrybush, sheeppasture #2, juicepress, blackberrymuffin, carrotjuice |
| 27 | 9300 |  |  | **fishing**, **truck_slot**, +3 fields, cowpasture #3, lake, horsestable, horse, lureworkbench, fishburger, fishinglure, fishfillet |
| 28 | 10200 | 3 gem + 2000 coins |  | doghouse #2, applepie, fishpie, applejuice |
| 29 | 11100 |  |  | +3 fields, cathouse #2, icecream, vanillaicecream |
| 30 | 12000 | 10 gem |  | tomato (×3), blueberrybush, lambpasture #2, netmaker, roastedtomatoes, cherryjuice, fishingnet |
| 31 | 13400 |  |  | +3 fields, bunnyhouse, bunny, blueberrycheesecake, tomatojuice, berryjuice |
| 32 | 14800 | 4 gem |  | **truck_slot**, pigpen #3, goatyard, goat, kebab, goatfeed, lambdonerwrap, goatmilk |
| 33 | 16200 |  |  | +3 fields, blueberrymuffin, goatcheese, pizza, refinedcoal, cherrypopsicle |
| 34 | 17600 | 4 gem |  | strawberry (×3), fetapie, ironbar, strawberryicecream |
| 35 | 19000 |  |  | +3 fields, potato (×3), puppyhouse, puppy, jammaker, bakedpotato, strawberrycake, applejam |
| 36 | 21000 | 4 gem |  | cacaotree, casserole, chocolatecake, raspberryjam |
| 37 | 23000 |  |  | +3 fields, horsestable #2, goatyard #2, spicypizza, blackberryjam |
| 38 | 25000 | 4 gem |  | jeweler, potatofetacake, cherryjam, bracelet |
| 39 | 27000 |  |  | **beekeeping**, +3 fields, nectarbush, beehive, bees, honeyextractor, potatobread, chocolateicecream, necklace, honey, honeycomb |
| 40 | 29000 | 10 gem |  | horsestable #3, honeypopcorn, diamondring |
| 41 | 31600 |  |  | +3 fields, bunnyhouse #2, fishchips, ironbracelet |
| 42 | 34200 |  |  | coffeebush, sheeppasture #3, coffeekiosk, honeyapplecake, espresso |
| 43 | 36800 |  |  | +3 fields, donkeystable, donkey, caffelatte |
| 44 | 39400 |  |  | lobsterpool, chocolatepopcorn, lobstertail |
| 45 | 42000 |  |  | +3 fields, chamomile (×3), fruttidimare, soothingpad, caffemocha |
| 46 | 45200 |  |  | soupkitchen, raspberrymocha, lobstersoup, lambsoup |
| 47 | 48400 |  |  | +3 fields, horsestable #4, hotchocolate, tomatosoup |
| 48 | 51600 |  |  | candlemaker, lobsterskewer, beeswax, strawberrycandle |
| 49 | 54800 |  |  | +3 fields, asparagus (×3), kittenhouse, kitten, flowershop, asparagusquiche, pumpkinsoup, rusticbouquet |
| 50 | 58000 |  |  | **ducks**, sesame (×3), goatyard #3, puppyhouse #2, ducksalon, duck, sesameicecream, strawberryjam, duckfeather |

## Crops

| Crop | Level | Grows | Yield | Value | Gift |
|---|---|---|---|---|---|
| wheat | 1 | 30s | 2 | 3 | 6 |
| corn | 2 | 1m | 2 | 5 | 4 |
| soybean | 5 | 5m | 2 | 9 | 3 |
| carrot | 9 | 3m | 2 | 7 | 3 |
| indigo | 13 | 20m | 2 | 20 | 3 |
| pumpkin | 15 | 30m | 2 | 27 | 3 |
| cotton | 18 | 25m | 2 | 24 | 3 |
| chili | 25 | 40m | 2 | 30 | 3 |
| blackbean | 25 | 35m | 2 | 28 | 3 |
| tomato | 30 | 50m | 2 | 36 | 3 |
| strawberry | 34 | 1h | 2 | 45 | 3 |
| potato | 35 | 1h 10m | 2 | 42 | 3 |
| chamomile | 45 | 1h 30m | 2 | 55 | 3 |
| asparagus | 49 | 1h 40m | 2 | 60 | 3 |
| sesame | 50 | 1h 50m | 2 | 65 | 3 |

## Trees, bushes, mine

| Tree | Level | Cost | Gives | Every | Max |
|---|---|---|---|---|---|
| appletree | 15 | 300 | apple ×2 | 45m | 6 |
| raspberrybush | 19 | 400 | raspberry ×2 | 50m | 6 |
| cherrytree | 22 | 500 | cherry ×2 | 1h | 6 |
| mine | 24 | 1500 | silverore, goldore, platinumore, coal (lv 33), ironore (lv 34) ×2 | 30m | 2 |
| blackberrybush | 26 | 600 | blackberry ×2 | 55m | 6 |
| blueberrybush | 30 | 800 | blueberry ×2 | 1h 5m | 6 |
| cacaotree | 36 | 1100 | cacao ×2 | 1h 20m | 6 |
| nectarbush | 39 | 1200 | nectar ×2 | 1h 10m | 6 |
| coffeebush | 42 | 1500 | coffeebean ×2 | 1h 25m | 6 |

## Pens & animals

| Pen | Levels (1st, 2nd…) | Cost | Animal | Cap | Animal cost | Eats | Gives | Every | XP |
|---|---|---|---|---|---|---|---|---|---|
| coop | 1, 12, 23 | 25 | chicken | 6 | 10 | 1 feed | 2 egg | 1m 30s | 2 |
| cowpasture | 6, 15, 27 | 120 | cow | 5 | 50 | 1 cowfeed | 1 milk | 5m | 4 |
| pigpen | 10, 18, 32 | 250 | pig | 5 | 70 | 1 pigfeed | 1 bacon | 10m | 6 |
| sheeppasture | 16, 26, 42 | 500 | sheep | 5 | 100 | 1 sheepfeed | 1 wool | 12m | 6 |
| doghouse | 20, 28 | 600 | dog | 1 | 220 | 1 bacon | — | 15m | 20 |
| cathouse | 21, 29 | 600 | cat | 1 | 220 | 1 milk | — | 15m | 20 |
| lambpasture | 25, 30 | 900 | lamb | 4 | 160 | 1 lambfeed | 1 lambskewer | 20m | 10 |
| lake | 27 | 1200 | fish | 3 (auto) | 0 | 1 fishinglure | 1 fishfillet | 8m | 8 |
| horsestable | 27, 37, 40, 47 | 1400 | horse | 2 | 400 | 2 carrot | — | 20m | 30 |
| bunnyhouse | 31, 41 | 1000 | bunny | 2 | 200 | 1 carrot | — | 10m | 15 |
| goatyard | 32, 37, 50 | 1600 | goat | 4 | 200 | 1 goatfeed | 1 goatmilk | 15m | 9 |
| puppyhouse | 35, 50 | 1200 | puppy | 1 | 260 | 1 bacon | — | 15m | 25 |
| beehive | 39 | 2000 | bees | 3 | 250 | 1 nectar | 1 honeycomb | 25m | 10 |
| donkeystable | 43 | 2600 | donkey | 2 | 500 | 2 carrot | — | 20m | 35 |
| lobsterpool | 44 | 2800 | lobster | 3 (auto) | 0 | 1 fishingnet | 1 lobstertail | 30m | 14 |
| kittenhouse | 49 | 2000 | kitten | 1 | 260 | 1 milk | — | 15m | 25 |
| ducksalon | 50 | 3500 | duck | 4 | 150 | 2 feed | 1 duckfeather | 25m | 12 |

## Machines & recipes

| Machine | Levels | Cost | Product | Level | Inputs | Out | Time | Value | XP |
|---|---|---|---|---|---|---|---|---|---|
| feedmill | 2, 12 | 20 | feed | 2 | 2 wheat + 1 corn | 3 | 45s | 7 | 1 |
| feedmill | 2, 12 | 20 | cowfeed | 6 | 2 corn + 1 soybean | 3 | 2m | 14 | 1 |
| feedmill | 2, 12 | 20 | pigfeed | 10 | 2 carrot + 1 soybean | 3 | 3m | 19 | 2 |
| feedmill | 2, 12 | 20 | sheepfeed | 16 | 3 wheat + 1 soybean | 3 | 4m | 20 | 2 |
| feedmill | 2, 12 | 20 | lambfeed | 25 | 2 wheat + 2 corn | 3 | 5m | 25 | 3 |
| feedmill | 2, 12 | 20 | goatfeed | 32 | 2 corn + 2 carrot | 3 | 5m | 34 | 3 |
| bakery | 3 | 50 | bread | 3 | 3 wheat | 1 | 2m | 20 | 2 |
| bakery | 3 | 50 | cookie | 10 | 2 wheat + 1 egg + 1 milk | 1 | 2m 35s | 85 | 9 |
| bakery | 3 | 50 | raspberrymuffin | 19 | 2 wheat + 1 egg + 2 raspberry | 1 | 7m 22s | 170 | 17 |
| bakery | 3 | 50 | blackberrymuffin | 26 | 2 wheat + 1 egg + 2 blackberry | 1 | 13m 9s | 196 | 20 |
| bakery | 3 | 50 | blueberrymuffin | 33 | 2 wheat + 1 egg + 2 blueberry | 1 | 20m 43s | 225 | 23 |
| bakery | 3 | 50 | potatobread | 39 | 2 wheat + 2 potato + 1 egg | 1 | 28m 38s | 228 | 23 |
| dairy | 6 | 85 | cream | 6 | 1 milk | 1 | 1m 30s | 53 | 5 |
| dairy | 6 | 85 | cheese | 12 | 3 milk | 1 | 3m 23s | 146 | 15 |
| dairy | 6 | 85 | goatcheese | 33 | 2 goatmilk | 1 | 20m 43s | 273 | 27 |
| grill | 11 | 238 | baconeggs | 11 | 2 bacon + 4 egg | 1 | 2m 58s | 217 | 22 |
| grill | 11 | 238 | hamburger | 18 | 1 bread + 2 bacon | 1 | 6m 41s | 201 | 20 |
| grill | 11 | 238 | fishburger | 27 | 1 bread + 1 fishfillet | 1 | 14m 7s | 159 | 16 |
| grill | 11 | 238 | roastedtomatoes | 30 | 3 tomato + 1 chili | 1 | 17m 15s | 267 | 27 |
| grill | 11 | 238 | fishchips | 41 | 2 fishfillet + 2 potato | 1 | 31m 34s | 358 | 36 |
| grill | 11 | 238 | lobsterskewer | 48 | 1 lobstertail + 1 chili | 1 | 42m 59s | 306 | 31 |
| sugarmill | 13 | 324 | whitesugar | 13 | 3 corn | 1 | 3m 51s | 49 | 5 |
| sugarmill | 13 | 324 | syrup | 18 | 2 whitesugar | 1 | 6m 41s | 183 | 18 |
| pieoven | 14 | 373 | carrotpie | 14 | 3 carrot + 2 wheat + 1 egg | 1 | 4m 21s | 84 | 8 |
| pieoven | 14 | 373 | pumpkinpie | 15 | 2 pumpkin + 2 wheat + 1 egg | 1 | 4m 53s | 135 | 14 |
| pieoven | 14 | 373 | baconpie | 18 | 2 bacon + 2 wheat + 1 egg | 1 | 6m 41s | 195 | 20 |
| pieoven | 14 | 373 | applepie | 28 | 3 apple + 2 wheat + 1 egg | 1 | 15m 7s | 229 | 23 |
| pieoven | 14 | 373 | fishpie | 28 | 2 fishfillet + 2 wheat + 1 egg | 1 | 15m 7s | 230 | 23 |
| pieoven | 14 | 373 | pizza | 33 | 2 wheat + 1 cheese + 1 tomato | 1 | 20m 43s | 348 | 35 |
| pieoven | 14 | 373 | fetapie | 34 | 1 goatcheese + 2 wheat + 1 egg | 1 | 21m 57s | 502 | 50 |
| pieoven | 14 | 373 | bakedpotato | 35 | 2 potato + 1 cream | 1 | 23m 13s | 276 | 28 |
| pieoven | 14 | 373 | casserole | 36 | 2 potato + 1 bacon + 1 cheese + 1 egg | 1 | 24m 31s | 500 | 50 |
| pieoven | 14 | 373 | spicypizza | 37 | 2 wheat + 1 cheese + 1 tomato + 1 chili | 1 | 25m 51s | 401 | 40 |
| pieoven | 14 | 373 | fruttidimare | 45 | 2 wheat + 1 cheese + 1 tomato + 1 fishfillet + 1 lobstertail | 1 | 37m 53s | 612 | 61 |
| pieoven | 14 | 373 | asparagusquiche | 49 | 2 asparagus + 2 egg + 1 cream + 1 wheat | 1 | 44m 46s | 392 | 39 |
| popcornpot | 16 | 481 | butteredpopcorn | 16 | 2 corn + 1 cream | 1 | 5m 27s | 127 | 13 |
| popcornpot | 16 | 481 | chilipopcorn | 25 | 2 corn + 1 chili + 1 cream | 1 | 12m 13s | 190 | 19 |
| popcornpot | 16 | 481 | honeypopcorn | 40 | 2 corn + 1 honey | 1 | 30m 5s | 95 | 10 |
| popcornpot | 16 | 481 | chocolatepopcorn | 44 | 2 corn + 1 cacao + 1 whitesugar | 1 | 36m 15s | 252 | 25 |
| loom | 17 | 540 | sweater | 17 | 2 wool | 1 | 6m 3s | 142 | 14 |
| loom | 17 | 540 | cottonfabric | 18 | 3 cotton | 1 | 6m 41s | 144 | 14 |
| loom | 17 | 540 | bluewoollyhat | 19 | 1 wool + 1 indigo | 1 | 7m 22s | 122 | 12 |
| loom | 17 | 540 | bluesweater | 20 | 2 wool + 1 indigo | 1 | 8m 5s | 178 | 18 |
| loom | 17 | 540 | woolychaps | 21 | 3 wool + 1 cottonfabric | 1 | 8m 50s | 420 | 42 |
| sewing | 19 | 670 | cottonshirt | 19 | 2 cottonfabric | 1 | 7m 22s | 470 | 47 |
| sewing | 19 | 670 | violetdress | 25 | 2 cottonfabric + 2 indigo | 1 | 12m 13s | 542 | 54 |
| sewing | 19 | 670 | soothingpad | 45 | 1 cottonfabric + 2 chamomile | 1 | 37m 53s | 471 | 47 |
| cakeoven | 21 | 814 | carrotcake | 21 | 2 carrot + 2 wheat + 1 egg + 1 whitesugar | 1 | 8m 50s | 161 | 16 |
| cakeoven | 21 | 814 | creamcake | 23 | 2 cream + 2 wheat + 1 egg + 1 whitesugar | 1 | 10m 27s | 303 | 30 |
| cakeoven | 21 | 814 | redberrycake | 23 | 2 raspberry + 1 cream + 2 wheat + 1 egg | 1 | 10m 27s | 258 | 26 |
| cakeoven | 21 | 814 | cheesecake | 24 | 2 cheese + 2 wheat + 1 egg | 1 | 11m 19s | 510 | 51 |
| cakeoven | 21 | 814 | blueberrycheesecake | 31 | 2 cheese + 2 blueberry + 2 wheat | 1 | 18m 22s | 644 | 64 |
| cakeoven | 21 | 814 | strawberrycake | 35 | 2 strawberry + 1 cream + 2 wheat + 1 egg | 1 | 23m 13s | 309 | 31 |
| cakeoven | 21 | 814 | chocolatecake | 36 | 2 cacao + 1 cream + 2 wheat + 1 egg | 1 | 24m 31s | 326 | 33 |
| cakeoven | 21 | 814 | potatofetacake | 38 | 2 potato + 1 goatcheese + 1 egg | 1 | 27m 13s | 627 | 63 |
| cakeoven | 21 | 814 | honeyapplecake | 42 | 1 honey + 2 apple + 2 wheat + 1 egg | 1 | 33m 5s | 207 | 21 |
| smelter | 24 | 1057 | silverbar | 24 | 2 silverore | 1 | 11m 19s | 168 | 17 |
| smelter | 24 | 1057 | goldbar | 25 | 2 goldore | 1 | 12m 13s | 230 | 23 |
| smelter | 24 | 1057 | platinumbar | 25 | 2 platinumore | 1 | 12m 13s | 320 | 32 |
| smelter | 24 | 1057 | refinedcoal | 33 | 3 coal | 1 | 20m 43s | 179 | 18 |
| smelter | 24 | 1057 | ironbar | 34 | 2 ironore | 1 | 21m 57s | 158 | 16 |
| juicepress | 26 | 1237 | carrotjuice | 26 | 3 carrot | 1 | 13m 9s | 84 | 8 |
| juicepress | 26 | 1237 | applejuice | 28 | 3 apple | 1 | 15m 7s | 205 | 21 |
| juicepress | 26 | 1237 | cherryjuice | 30 | 3 cherry | 1 | 17m 15s | 236 | 24 |
| juicepress | 26 | 1237 | tomatojuice | 31 | 3 tomato | 1 | 18m 22s | 224 | 22 |
| juicepress | 26 | 1237 | berryjuice | 31 | 1 raspberry + 1 blackberry + 1 blueberry | 1 | 18m 22s | 244 | 24 |
| lureworkbench | 27 | 1332 | fishinglure | 27 | 1 wool + 2 wheat | 1 | 5m | 117 | 12 |
| icecream | 29 | 1534 | vanillaicecream | 29 | 2 milk + 1 cream + 1 egg | 1 | 16m 10s | 234 | 23 |
| icecream | 29 | 1534 | cherrypopsicle | 33 | 2 cherry + 1 whitesugar | 1 | 20m 43s | 257 | 26 |
| icecream | 29 | 1534 | strawberryicecream | 34 | 2 milk + 1 cream + 2 strawberry | 1 | 21m 57s | 364 | 36 |
| icecream | 29 | 1534 | chocolateicecream | 39 | 2 milk + 1 cream + 1 cacao | 1 | 28m 38s | 314 | 31 |
| icecream | 29 | 1534 | sesameicecream | 50 | 2 milk + 1 cream + 2 sesame | 1 | 46m 35s | 456 | 46 |
| netmaker | 30 | 1640 | fishingnet | 30 | 2 wool + 1 cottonfabric | 1 | 10m | 384 | 38 |
| kebab | 32 | 1863 | lambdonerwrap | 32 | 1 lambskewer + 1 bread + 1 tomato | 1 | 19m 31s | 261 | 26 |
| jammaker | 35 | 2225 | applejam | 35 | 3 apple + 1 whitesugar | 1 | 23m 13s | 292 | 29 |
| jammaker | 35 | 2225 | raspberryjam | 36 | 3 raspberry + 1 whitesugar | 1 | 24m 31s | 308 | 31 |
| jammaker | 35 | 2225 | blackberryjam | 37 | 3 blackberry + 1 whitesugar | 1 | 25m 51s | 328 | 33 |
| jammaker | 35 | 2225 | cherryjam | 38 | 3 cherry + 1 whitesugar | 1 | 27m 13s | 325 | 33 |
| jammaker | 35 | 2225 | strawberryjam | 50 | 3 strawberry + 1 whitesugar | 1 | 46m 35s | 376 | 38 |
| jeweler | 38 | 2619 | bracelet | 38 | 1 silverbar + 1 goldbar | 1 | 27m 13s | 673 | 67 |
| jeweler | 38 | 2619 | necklace | 39 | 2 goldbar + 1 platinumbar | 1 | 28m 38s | 1248 | 125 |
| jeweler | 38 | 2619 | diamondring | 40 | 2 platinumbar + 1 goldbar | 1 | 30m 5s | 1385 | 139 |
| jeweler | 38 | 2619 | ironbracelet | 41 | 2 ironbar | 1 | 31m 34s | 556 | 56 |
| honeyextractor | 39 | 2758 | honey | 39 | 2 honeycomb | 1 | 28m 38s | 258 | 26 |
| honeyextractor | 39 | 2758 | beeswax | 48 | 2 honeycomb | 1 | 42m 59s | 276 | 28 |
| coffeekiosk | 42 | 3195 | espresso | 42 | 2 coffeebean | 1 | 33m 5s | 249 | 25 |
| coffeekiosk | 42 | 3195 | caffelatte | 43 | 2 coffeebean + 1 milk | 1 | 34m 39s | 292 | 29 |
| coffeekiosk | 42 | 3195 | caffemocha | 45 | 2 coffeebean + 1 milk + 1 cacao | 1 | 37m 53s | 371 | 37 |
| coffeekiosk | 42 | 3195 | raspberrymocha | 46 | 2 coffeebean + 1 milk + 1 cacao + 2 raspberry | 1 | 39m 33s | 481 | 48 |
| coffeekiosk | 42 | 3195 | hotchocolate | 47 | 2 cacao + 2 milk + 1 whitesugar | 1 | 41m 15s | 399 | 40 |
| soupkitchen | 46 | 3829 | lobstersoup | 46 | 1 lobstertail + 1 cream + 1 tomato | 1 | 39m 33s | 391 | 39 |
| soupkitchen | 46 | 3829 | lambsoup | 46 | 1 lambskewer + 2 carrot + 1 potato | 1 | 39m 33s | 289 | 29 |
| soupkitchen | 46 | 3829 | tomatosoup | 47 | 3 tomato + 1 cream | 1 | 41m 15s | 336 | 34 |
| soupkitchen | 46 | 3829 | pumpkinsoup | 49 | 2 pumpkin + 1 cream | 1 | 44m 46s | 259 | 26 |
| candlemaker | 48 | 4167 | strawberrycandle | 48 | 2 beeswax + 2 strawberry | 1 | 42m 59s | 1059 | 106 |
| flowershop | 49 | 4342 | rusticbouquet | 49 | 2 chamomile + 1 nectar | 1 | 44m 46s | 331 | 33 |

## Truck, visitors, achievements

- Truck orders open at level 4 with 3 slots; +1 slot at 8, 12, 17, 22, 27, 32 (9 at 32). An order pays value × 1.3 and XP × 1.5. A deleted order refills after 5 min (10 from level 10, 20 from 20, 30 from 30).
- Visitors open at level 2: one item at a time, value × 1.5 coins, +10 XP (+ the item's XP); the next one comes 2m 30s after the last left.
- Achievements (farmhouse, level 6):

| Achievement | Stat | Tiers (need → gems + XP) |
|---|---|---|
| visitors | visitors | 10 → 5 gems + 30 XP / 50 → 10 gems + 100 XP / 500 → 35 gems + 1000 XP |
| orders | orders | 20 → 5 gems + 50 XP / 100 → 15 gems + 300 XP / 1000 → 50 gems + 2000 XP |
| harvests | harvests | 50 → 3 gems + 30 XP / 500 → 10 gems + 300 XP / 5000 → 40 gems + 3000 XP |
| animals | animals | 50 → 3 gems + 40 XP / 500 → 10 gems + 400 XP / 5000 → 40 gems + 4000 XP |
| crafted | crafted | 50 → 5 gems + 60 XP / 500 → 15 gems + 600 XP / 5000 → 50 gems + 6000 XP |
| trees | trees | 20 → 3 gems + 50 XP / 200 → 10 gems + 500 XP / 2000 → 40 gems + 5000 XP |
| matches | matches | 10 → 5 gems + 50 XP / 25 → 15 gems + 300 XP / 50 → 50 gems + 2000 XP |
| stars | stars | 30 → 5 gems + 50 XP / 90 → 15 gems + 300 XP / 150 → 50 gems + 2000 XP |

## Storage

Silo / Barn start at 10; 12 upgrades each: 25 (1 bolt + 1 tape), 40 (1 bolt + 1 tape), 60 (1 bolt + 1 tape), 80 (2 bolt + 2 tape), 100 (2 bolt + 2 tape), 125 (2 bolt + 2 tape), 150 (3 bolt + 3 tape), 180 (3 bolt + 3 tape), 210 (3 bolt + 3 tape), 250 (4 bolt + 4 tape), 300 (4 bolt + 4 tape), 350 (4 bolt + 4 tape).
