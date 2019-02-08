const Draw = require("./Draw.js");
const CrLogic = require("./Logic.js");
const CrEvents = require("./Events.js");
const CrController = require("./Control.js");

var Types = require("./Types.js");
var Tiles = require("./new_tileset.json");

function Init(){
	var Logic = new CrLogic(Draw);
	Logic.load(Tiles, false);
	CrEvents(CrController(Logic));
}

Init();




