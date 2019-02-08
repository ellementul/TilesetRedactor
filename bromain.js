const Draw = require("./Draw.js");
const CrLogic = require("./Logic.js");
const CrEvents = require("./Events.js");
const CrController = require("./Control.js");

var Types = require("./Types.js");
var Tiles = Types.tiles.rand();

function Init(){
	var Logic = new CrLogic(Tiles, Draw);
	CrEvents(CrController(Logic));
}
Init();


