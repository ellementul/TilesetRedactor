var Types = require("./Types.js");

function CrLogic(Tiles, Draw){
	var tiles = [];
	var current_tile = null;
	var tiles_count = 0;
	
	Tiles.forEach(Add);
	current_tile = 0;
	
	this.setTile = function(val){
		var finded_tile = getTile(val);
		
		if(!finded_tile) throw new Error("Tile is not find!");
		
		Draw.Tiles.current_tile = val;
		current_tile = finded_tile;
	}
	
	this.add = Add;
	this.dell = function(){
		if(current_tile !== null){
			var index = tiles.indexOf(current_tile);
			tiles.splice(index, 1);
			Draw.Tiles.dell();
			
			if(tiles[0]){
				current_tile = tiles[0];
				Draw.Tiles.current_tile = tiles[0].id;
			}
			else{
				current_tile = null;
			}
		}
	}
	
	function getTile(id){
		return tiles.filter(tile => id == tile.id)[0];
	}
	
	function Add(tile){
		if(Types.tile.test(tile)) throw Types.tile.test(tile);
		tile.id = tiles_count++;
		
		if(current_tile === null)tiles.push(tile);
		else tiles.splice(getTile(current_tile), 0, tile);
		
		Draw.Tiles.add(tile);
	}
}

module.exports = CrLogic;
