const Lib = require("./drawLib.js");
var durability_types_list = require("./types_durability.json");


var durability_types_cont = Lib.getNode("DurabilityTypes");
var images_cont = Lib.getNode("Images");
var tile_size_cont = Lib.getNode("TileSize");

module.exports = function CrAddForm(){
	return {
			Images: new CrImages(images_cont),
			Type: new CrList(durability_types_cont, durability_types_list),
			Size: tile_size_cont,
			clear: function(){
				this.Images.clear();
			},

			getTile: newTile
	};
}

require("./mof.js");

function CrImages(container){
	var images = [];

	this.add = function(file){
		var reader = new FileReader();
		
		reader.onload = function(e){
			Add(e.target.result);
		};
		reader.readAsText(file);
	};

	this.addGetSet("value",
		function(){
			if(images.length > 0) return images;
		}
	);

	this.clear = function(){
		Array.from(container.children).forEach(elem => elem.remove());
		images = [];
	}

	function Add(img){
		images.push(img);
		container.appendChild(Lib.drawTile(img));
	}
}

function CrList(container, list){

	for (var val in list){
		var opt = document.createElement("p");
		opt.value = list[val];
		opt.innerHTML = val;
		opt.onclick = onclick;
		container.appendChild(opt);
	}
	var defOpt = container.children[0];
	container.value = defOpt.value;
	defOpt.classList.add("option-change");

	return container;

	function onclick(){
		Array.from(this.parentElement.children).forEach(elem => elem.classList.remove("option-change"));
		this.parentElement.value = this.value;
		console.log(this.value);
		this.classList.add("option-change");
	}
}

function newTile(send){
	if(this.Images.value 
		&& this.Type.value
		&& this.Size.value){
		return {
			images: this.Images.value,
			type: this.Type.value,
			size: parseInt(this.Size.value)
		};
	}

}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}