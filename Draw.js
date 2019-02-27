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
		function(new_tile){
			
			var tile = container.querySelector('[tile="' + new_tile.id + '"]');
			if(!tile) throw new Error("Tile is not find!");
			
			if(current_tile) current_tile.classList.remove("changed");
			tile.classList.add("changed");
			current_tile = tile;
			
			if(new_tile.width) getNode("Width").value = new_tile.width; 
			else getNode("Width").value = null;
			
			if(new_tile.height) getNode("Height").value = new_tile.height;
			else getNode("Height").value = null;
		}
	);
	
	this.add = function(new_tile){
		var Tile = drawTile(new_tile);
		
		if(current_tile) current_tile.insertAdjacentElement("beforeBegin", Tile);
		else container.appendChild(Tile);
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
	
	drawGrid(container, size);
	
	this.add = function(new_tile, x, y){
		var tile = drawTile(new_tile);
		tile.style.width = (new_tile.width * (100 / size)) + "%";
		tile.style.height = (new_tile.height * (100 / size)) + "%";
		
		tile.style.left = x  + "px";
		tile.style.top = y + "px";
		
		container.appendChild(tile);
		NormTile(tile);
	}
	
	this.dell = function(id_tile){
		var tiles = container.querySelectorAll('[tile="' + id_tile + '"]');
		tiles.forEach(tile => tile.remove());
	}
	this.clear = function(){
		var tiles = container.querySelectorAll('[tile]');
		tiles.forEach(tile => tile.remove());
	}
	
	this.resize = function(tile){
		var elems = container.querySelectorAll('[tile="' + tile.id + '"]');
		elems.forEach(function(elem){
			elem.style.width = (tile.width * (100 / size)) + "%";
			elem.style.height = (tile.height * (100 / size)) + "%";
		});
	}
	
	this.move = function(x, y){
		if(this.current_tile){
			var tile = getComputedStyle(this.current_tile);
			
			this.current_tile.style.left = (parseFloat(tile.left) + x) + "px";
			this.current_tile.style.top = (parseFloat(tile.top) + y) + "px";
		}
	}
	
	this.norm = function(){
		if(this.current_tile) NormTile(this.current_tile);
	}
	
	function NormTile(tile){
		var box = getComputedStyle(tile);
		tile.style.left = NormCoord(parseFloat(box.left), parseFloat(box.width)) + "%";
		tile.style.top = NormCoord(parseFloat(box.top), parseFloat(box.height)) + "%";
	}
	
	function NormCoord(coord, s){
		var con_size = parseFloat(getComputedStyle(container).width);
		
		if(coord + s > con_size) coord = con_size - s;
		if(coord < 0) coord = 0;
		
		return Math.round((coord / con_size) * size) * (100 / size);
	}
	
	function drawGrid(container, grid_size){
		var size = 100 / grid_size;
		for(var i = grid_size - 1; i >= 0; i--){
			for(var j = grid_size - 1; j >= 0; j--){
				container.appendChild(darwBox(i*size, j*size, size));
			}
		}
	}
	
	function darwBox(x, y, size){
		var box = document.createElement('div');
		box.classList.add("box");
		box.style.width = size + "%";
		box.style.height = size + "%";
		
		box.style.left = x + "%";
		box.style.top = y + "%";
		
		return box;
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
		if(this.files[0]){
			var reader = new FileReader();
			reader.onload = function(e){Open(JSON.parse(e.target.result))};
			reader.readAsText(this.files[0]);
		}
	}
}

function Save(name, text){
	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
	FileSaver.saveAs(blob, name);
}

function CrSwitch(id, name_class){
	if(Array.isArray(id)){
		var elems = id.map(getNode);
		elems = elems.map(elem => elem.classList);

		return function(id){
			var cur_elem = getNode(id).classList;
			console.log(id, cur_elem);
			elems.forEach(function(elem){
				elem.add(name_class);
			});
			cur_elem.remove(name_class);
		}
	}
	else{
		var elem = getNode(id).classList;
		return function(){
			elem.toggle(name_class);
		}
	}
	
}


function drawTile(new_tile){
	
	if(new_tile.type == "color"){
		var Tile = document.createElement('div');
		Tile.classList.add("tile");
		Tile.setAttribute("tile", new_tile.id);
		Tile.setAttribute("draggable", true);
		Tile.style.backgroundColor = new RGB(new_tile.color).toString();
		return Tile;
	}
	if(new_tile.type == "svg"){
		var img = document.createElement('img');
		img.classList.add("tile");
		img.setAttribute("tile", new_tile.id);
		img.setAttribute("draggable", true);
		img.src = new_tile.img;
		return img;
	}
}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}
