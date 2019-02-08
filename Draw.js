require("typesjs");
const RGB = require('chromath').rgb;
var FileSaver = require('file-saver');

var id_tiles_list = "Tiles";
var id_view = "View";

function CrTiles(id){
	var container = getNode(id);
	var current_tile = null;
	
	this.addGetSet("current_tile", 
		function(){
			return current_tile.tile;
		}, 
		function(val){
			
			var tile = container.querySelector('[tile="' + val + '"]');
			if(!tile) throw new Error("Tile is not find!");
			
			if(current_tile) current_tile.classList.remove("changed");
			tile.classList.add("changed");
			current_tile = tile;
		}
	);
	
	this.add = function(new_tile){
		new_tile = drawTile(new_tile);
		
		if(current_tile) current_tile.insertAdjacentElement("beforeBegin", new_tile);
		else container.appendChild(new_tile);
	}
	this.dell = function(){
		current_tile.classList.remove("changed");
		current_tile.remove();
		current_tile = null;
	}

	this.clear = function(){
		container.innerHTML = "";
		current_tile = null;
	}
}

module.exports = {Tiles: new CrTiles(id_tiles_list), save: Save}

function Save(name, text){
	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
	FileSaver.saveAs(blob, name);
}

function drawTile(new_tile){
	var Tile = document.createElement('div');
	Tile.classList.add("tile");
	Tile.setAttribute("tile", new_tile.id);
	if(new_tile.type == "color") Tile.style.backgroundColor = new RGB(new_tile.color).toString();
	if(new_tile.type == "svg") Tile.style.backgroundImage = "url(" + new_tile.img + ")";
	
	return Tile;
}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}
