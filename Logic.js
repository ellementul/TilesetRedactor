require("./mof.js");

var map_size = {width: 20, height: 20, layers: 2};

function CrTiles(){
	var tiles = Array.create();

	this.add = function(new_tile){
		new_tile.id = tiles.add(new_tile);
		return new_tile;
	}
}

var Tiles = new CrTiles();

function CrMap(sizes){
	var cr_line = Array.create.bind(null, null, sizes.width);
	var cr_pline = Array.create.bind(null, cr_line, sizes.width, true);
	var map = Array.create(cr_pline, sizes.layers);

	this.load = function(){
		return {
			action: "Create",
			type: "Map",
			sizes: sizes
		}
	}

	this.draw = function(id_tile, coords, tool){
		if(coords
		&& map[coords.z]
		&& map[coords.z][coords.y]
		&& !map[coords.z][coords.y][coords.x]){

			map[coords.z][coords.y][coords.x] = id_tile;
			return coords;
		}
	}
}

var TileMap = new CrMap(map_size);

module.exports = function CrLogic(Inter){
	var send = Inter.connect(receive);
	send(TileMap.load());

	function receive(mess){
		switch(mess.type){
			case "Tile": receiveTiles(mess); break;
			case "Map": receiveMap(mess); break;
		}
	}

	function receiveTiles(mess){
		switch(mess.action){
			case "Add":  {
				mess.tile = Tiles.add(mess.tile);
				send(mess);
				
			} break;
		}
	}

	function receiveMap(mess){
		switch(mess.action){
			 case "Draw":  {
			 	mess.coords = TileMap.draw(mess.id_tile, mess.coords, mess.tool);
			 	send(mess);
			 }
		}
	}
}
