require("typesjs");
require("typesjs/str_type");

var T = Object.types;

var type_tile = T.obj({
		type: "color",
		color: {r: T.pos(256), b: T.pos(256), g: T.pos(256)}
	});
var type_tile_svg = T.obj({
		type: "svg",
		img: T.str(/^[\w\d+:;,=/]*$/, 1024*1024)
});
module.exports = {
	tile: T.any(type_tile_svg, type_tile), 
	tiles: T.arr(type_tile, 15)
};
