var Types = require("./Types.js");
var T = Object.types;



function CrLogic(Draw){
	var tiles = [];
	var current_tile = null;
	var tiles_count = 0;
	
	var def_width = 1;
	var def_height = 1;
	
	this.setTile = function(val){
		var finded_tile = getTile(val);
		
		if(!finded_tile) throw new Error("Tile is not find!");
		
		Draw.Tiles.current_tile = finded_tile;
		current_tile = finded_tile;
	}
	
	this.add = Add;
	this.dell = function(){
		if(current_tile !== null){
			Draw.View.dell(current_tile.id);
			
			var index = tiles.indexOf(current_tile);
			tiles.splice(index, 1);
			Draw.Tiles.dell();
			
			if(tiles[0]){
				current_tile = tiles[0];
				Draw.Tiles.current_tile = tiles[0];
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
		data = {tiles: data, width: def_width, height: def_height}
		Draw.save("tileset.json", JSON.stringify(data, null, 1));
	}
	this.load = function(new_tiles, is_save=true){
		if(is_save) this.save();
		Clear();
		new_tiles.tiles.forEach(Add);
		this.setTile(0);
		
		def_width = new_tiles.width;
		def_height = new_tiles.height;
	}
	
	this.getTile = function(){
		var tile = Object.assign({}, current_tile);
		if(tile.width === undefined) tile.width = def_width;
		if(tile.height === undefined) tile.height = def_height;
		
		return tile;
	}
	
	this.resizeTile = function(w, h){
		if(current_tile){
			if(!current_tile.width) current_tile.width = def_width;
			if(!current_tile.height) current_tile.height = def_height;
			
			if(!T.pos.test(w)) current_tile.width = w;
			if(!T.pos.test(h)) current_tile.height = h;
			
			Draw.View.resize(current_tile);
			
			if(current_tile.width === def_width) current_tile.width = undefined;
			if(current_tile.height === def_height) current_tile.height = undefined;
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
	
	function Clear(){
		Draw.View.clear();
		Draw.Tiles.clear();
		tiles = [];
		current_tile = null;
		tiles_count = 0;
	}
}

module.exports = CrLogic;
