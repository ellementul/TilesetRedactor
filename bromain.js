

const CrInter = require("./inter.js");
var Types = require("./Types.js");

const Display = require("./Display.js");
const CrLogic = require("./Logic.js");

const DisplayInter = new CrInter();
DisplayInter.test(Types, console.log);

Display(DisplayInter);

CrLogic(DisplayInter);




