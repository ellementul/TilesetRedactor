const Draw = require("./Draw.js");
const CrLogic = require("./Logic.js");
const CrController = require("./Control.js");
const CrSwitches = require("./CrSwitches.js");

var Types = require("./Types.js");
var Tiles = require("./new_tileset.json");


var Logic = new CrLogic(Draw);
Logic.load(Tiles, false);
CrController(Logic, Draw);
CrSwitches(Draw);




