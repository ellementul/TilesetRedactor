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

function CrView(id){
	var container = getNode(id);
	var size = 20;
	this.current_tile = null;
	
	this.move = function(x, y){
		if(this.current_tile){
			var tile = getComputedStyle(this.current_tile);
			
			this.current_tile.style.left = NormCoord(x, parseFloat(tile.width)) + "px";
			this.current_tile.style.top = NormCoord(y, parseFloat(tile.height)) + "px";
		}
	}
	
	function NormCoord(c, s){
		var con_size = parseFloat(getComputedStyle(container).width);
		
		if(c + s > con_size) c = con_size - s;
		if(c < 0) c = 0;
		
		return Math.floor((c / con_size) * size) * (con_size / size);
	}
	
}

module.exports = {
	Tiles: new CrTiles(id_tiles_list),
	View: new CrView(id_view),
	save: Save,
	openJSON: OpenFileJSON,
	switchElem: CrSwitch
}

function OpenFileJSON(Open){
	return function(){
		var reader = new FileReader();
		reader.onload = function(e){Open(JSON.parse(e.target.result))};
		reader.readAsText(this.files[0]);
	}
}

function Save(name, text){
	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
	FileSaver.saveAs(blob, name);
}

function CrSwitch(id, name_class){
	var elem = getNode(id).classList;
	return function(){
		elem.toggle(name_class);
	}
}


function drawTile(new_tile){
	var Tile = document.createElement('div');
	Tile.classList.add("tile");
	Tile.setAttribute("tile", new_tile.id);
	Tile.setAttribute("draggable", true);
	if(new_tile.type == "color") Tile.style.backgroundColor = new RGB(new_tile.color).toString();
	if(new_tile.type == "svg") Tile.style.backgroundImage = "url(" + new_tile.img + ")";
	
	return Tile;
}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}
