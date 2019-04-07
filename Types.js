require("typesjs");
require("typesjs/str_type");

var types_durability = require("./types_durability.json");

var T = Object.types;

var tile_id_type = T.pos(256);
var coords_type = {x: T.pos(20), y: T.pos(20), z: T.pos(2)};

var tile_type = T.obj({
		id: T.any(undefined, tile_id_type),
		images: T.arr(T.str(/^[\w\d\s+:;.,?=#\/<>"()-]*$/, 1024*1024)),
		type: T.any(Object.values(types_durability)),
		size: T.pos(20)
});

var new_tile_mess_type = T.obj({
	action: "Add",
	type: "Tile",
	tile: tile_type
});

var map_size_type = T.obj({
	width: 20, 
	height: 20, 
	layers: 2
});

var new_map_mess_type = T.obj({
	action: "Create",
	type: "Map",
	sizes: map_size_type
});

var draw_mess_type = {
	action: "Draw",
	type: "Map",
	tool: "Pen",
	coords: coords_type,
	tile_id: tile_id_type
};

var draw_mess_type_with_empty_coords = {
	action: "Draw",
	type: "Map",
	tool: "Pen",
	coords: T.any(undefined, coords_type),
	tile_id: tile_id_type
};

var mess_types_one = T.any(draw_mess_type, new_tile_mess_type);

var mess_types_two = T.any([
	draw_mess_type_with_empty_coords,
	new_tile_mess_type, 
	new_map_mess_type]);

module.exports = [
	function(val){
		if(mess_types_one.test(val))
			throw mess_types_one.test(val);
	}, 
	function(val){
		if(mess_types_two.test(val))
			throw mess_types_two.test(val);
	}];
