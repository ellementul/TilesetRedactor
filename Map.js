const Lib = require("./drawLib.js");

var map_size = 20;
var map_cont = Lib.getNode("Map");
var Tiles = Lib.getNode("Tiles");

module.exports = function CrMap(){

	map_cont.load = function(sizes){
		var Grid = CrGrid(sizes, "grid-border");
		Grid.setAttribute("id", "Grid");

		while(sizes.layers--)
			map_cont.appendChild(CrLayer(sizes));

		map_cont.appendChild(Grid);
	}

	map_cont.draw = function(mess){
		var coords = mess.coords;
		if(coords.length == 0) return;

		if(mess.tool == "Pen"){
			var tile = Tiles.getTile(mess.tile_id);

			this.children[coords[0].z].pen(tile, coords);			
		}
		if(mess.tool == "Clear") this.children[coords[0].z].clear(mess.coords);
	}

	return map_cont;
	
}

function CrLayer(sizes){
	var layer = document.createElement("div");
	layer.classList.add("layer");
	layer.style.width = "100%";
	layer.style.height = "100%";

	var w_size = 100 / sizes.width;
	var h_size = 100 / sizes.height;

	layer.show = function(){
		layer.style.opacity = 0;
	}

	layer.hide = function(){
		layer.style.opacity = 1;
	}

	layer.clear = function(coords){
		coords = coords[0];

		if(!layer[coords.y] || !layer[coords.y][coords.x]) throw new Error();
		layer[coords.y][coords.x].remove();
	}

	layer.pen = function(tile, coords){
		coords = coords[0];

		var box = Lib.drawTile(tile.images[0]);
		box.tile = tile.id;
		box.classList.add("box");

		box.style.width = tile.size*w_size + "%";
		box.style.height = tile.size*h_size + "%";

		box.style.left = coords.x*w_size + "%";
		box.style.top = coords.y*h_size + "%";

		layer.appendChild(box);

		if(!layer[coords.y]) layer[coords.y] = [];
		layer[coords.y][coords.x] = box;
	}

	return layer;
}

function CrGrid(sizes, border){
	var layer = document.createElement("div");
	layer.classList.add("layer");
	layer.style.width = "100%";
	layer.style.height = "100%";
	drawGrid(layer, sizes, border);

	layer.show = function(){
		layer.style.opacity = 0;
	}

	layer.hide = function(){
		layer.style.opacity = 1;
	}

	return layer;
}


function drawGrid(container, grid_size, border){
	var w_size = 100 / grid_size.width;
	var h_size = 100 / grid_size.height;
	for(var i = grid_size.width - 1; i >= 0; i--){
		for(var j = grid_size.height - 1; j >= 0; j--){
			var box = darwBox(w_size, h_size, border);

			box.style.left = i*w_size + "%";
			box.style.top = j*h_size + "%";

			box.x = i;
			box.y = j;
			
			container.appendChild(box);
		}
	}
}

function darwBox(width, height, border){
	var box = document.createElement('div');
	box.classList.add("box");
	if(border) 
		box.classList.add(border);

	box.style.width = width + "%";
	box.style.height = height + "%";

	return box;
}