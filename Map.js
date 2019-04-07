const Lib = require("./drawLib.js");

var map_size = 20;
var map_cont = Lib.getNode("Map");

module.exports = function CrMap(){

	this.load = function(mess){
		var Grid = CrLayer(mess.sizes, "grid-border");
		Grid.setAttribute("id", "Grid");

		while(mess.sizes.layers--)
			map_cont.appendChild(CrLayer(Object.assign({}, mess.sizes)));

		map_cont.appendChild(Grid);
	}
	
}

function CrLayer(sizes, border){
	var layer = document.createElement("div");
	layer.style.width = "100%";
	layer.style.height = "100%";
	drawGrid(layer, sizes, border);

	this.show = function(){
		layer.style.opacity = 0;
	}

	this.hide = function(){
		layer.style.opacity = 1;
	}

	return layer;
}


function drawGrid(container, grid_size, border){
	var w_size = 100 / grid_size.width;
	var h_size = 100 / grid_size.height;
	for(var i = grid_size.width - 1; i >= 0; i--){
		for(var j = grid_size.height - 1; j >= 0; j--){
			var box = darwBox(i, j, w_size, h_size, border);
			
			container.appendChild(box);
		}
	}
}

function darwBox(x, y, w_size, h_size, border){
	var box = document.createElement('div');
	box.classList.add("box");
	if(border) 
		box.classList.add(border);

	box.style.width = w_size + "%";
	box.style.height = h_size + "%";
	
	box.style.left = x*w_size + "%";
	box.style.top = y*h_size + "%";

	box.x = x;
	box.y = y;
	
	return box;
}