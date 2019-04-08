require("./mof.js");

var map_size = {width: 20, height: 20, layers: 2};

function CrTiles(){
	var tiles = Array.create();

	this.add = function(new_tile){
		new_tile.id = tiles.add(new_tile);
		return new_tile;
	}

	this.getTile = function(id){
		return tiles[id];
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

	this.draw = function(mess){
		var new_mess = {
			action: "Draw",
			type: "Map",
			tool: mess.tool,
			coords: mess.coords
		};

		switch(mess.tool){
			case "Pen":  
				new_mess.coords = Pen(mess.tile_id, mess.coords);
				new_mess.tile_id = mess.tile_id;
				break;
			case "Clear": 
				new_mess.coords = Clear(mess.coords);
				break;
		}

		return new_mess;
	}

	function Pen(tile_id, coords){
		var tile = Tiles.getTile(tile_id);
		if(is_coords(coords, tile.size) && is_empty(coords, tile.size)){

			fillBox(tile, coords, tile.size);
			return [coords];
		}else return [];
	}

	function Clear(coords){
		if(is_coords(coords) && !is_empty(coords)){
			coords = clearBox(map[coords.z][coords.y][coords.x]);
			return [coords];
		}else return [];
	}

	function fillBox(tile, coords, size){
		var box = {coords: coords, size: tile.size, tile_id: tile.id};
		var size = tile.size;

		for(var i = size - 1; i >= 0; i--){
			for(var j = size - 1; j >= 0; j--){
				map[coords.z][coords.y + j][coords.x + i] = box;
			}
		}

		return coords;
	}

	function clearBox(box){
		var coords = box.coords;
		var size = box.size;

		for(var i = size - 1; i >= 0; i--){
			for(var j = size - 1; j >= 0; j--){
				map[coords.z][coords.y + j][coords.x + i] = null;
			}
		}
		return coords;
	}

	function is_coords(coords, size=1){
		return coords 
		&& map[coords.z] 
		&& map[coords.z][coords.y] 
		&& map[coords.z][coords.y + size - 1]
		&& map[coords.z][coords.y][coords.x] !== undefined
		&& map[coords.z][coords.y + size - 1][coords.x + size - 1] !== undefined;
	}

	function is_empty(coords, size=1){
		for(var i = size - 1; i >= 0; i--){
			for(var j = size - 1; j >= 0; j--){
				if(map[coords.z][coords.y + j][coords.x + i] !== null)
					return false;
			}
		}
		return true;
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
			case "Add":  
				mess.tile = Tiles.add(mess.tile);
				send(mess);
				break;
		}
	}

	function receiveMap(mess){
		switch(mess.action){
			 case "Draw":
			 	mess = TileMap.draw(mess);
			 	send(mess);
			 	break;
		}
	}
}
