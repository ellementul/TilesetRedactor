var Types = require("./Types.js");


function CrLogic(Draw){
	var tiles = [];
	var current_tile = null;
	var tiles_count = 0;
	
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
	this.save = function(){
		var data = tiles.map(function(tile, i){
			tile = Object.assign({}, tile);
			tile.id = i; 
			return tile; 
		});
		data = {tiles: data, width: 1, height: 1}
		Draw.save("tileset.json", JSON.stringify(data, null, 1));
	}
	
	this.load = function(new_tiles, is_save=true){
		if(is_save) this.save();
		Clear();
		new_tiles.tiles.forEach(Add);
		this.setTile(0);
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
	
	function Clear(){
		Draw.Tiles.clear();
		tiles = [];
		current_tile = null;
		tiles_count = 0;
	}
}

module.exports = CrLogic;
