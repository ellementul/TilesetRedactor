require("typesjs");
require("typesjs/str_type");

var types_durability = require("./types_durability.json");

var T = Object.types;

var type_tile = T.obj({
		type: "color",
		color: {r: T.pos(256), b: T.pos(256), g: T.pos(256), a: T.any(undefined, T.num)}
	});
var type_tile_svg = T.obj({
		type: "svg",
		img: T.str(/^[\w\d\s+:;.,?=#\/<>"()-]*$/, 1024*1024)
});
var type_tile_phisic = T.obj({
		type: "phisic",
		img: T.str(/^[\w\d\s+:;.,?=#\/<>"()-]*$/, 1024*1024),
		durability: T.any(Object.values(types_durability))
});
module.exports = {
	tile: T.any(type_tile_svg, type_tile, type_tile_phisic)
};
