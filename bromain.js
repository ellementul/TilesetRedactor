const Draw = require("./Draw.js");
const CrLogic = require("./Logic.js");
const CrController = require("./Control.js");

var Logic = new CrLogic(Draw);
CrController(Logic);




