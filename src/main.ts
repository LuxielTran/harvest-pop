import { registerFalconGame } from './falcon-game';
import { game } from './game';

// Hand the game to the studio layer. In development this boots the game as is;
// in a published build Falcon IDE's wiring takes over: header, coins, popups,
// shop, ads, lives, rating and analytics attach to the FalconGame contract the
// game implements in ./game.ts. Nothing else belongs in this file.
// The ads module is on for the farm's rewarded Farm Boost (numbers mirror .falcon/sdk-config.json).
registerFalconGame(game, { ads: { minLevel: 15, capSec: 120, chance: 0.5 } });
