const Hear = require("./Events.js");
const Chromath = require('chromath');

function CrController(Logic, Draw){
	
	Hear("switch_add", "click", Draw.switchElem("add", "invis"));

	Hear("Tiles", "mousedown", function(event){
		if(event.target.getAttribute("tile") !== null) Logic.setTile(event.target.getAttribute("tile"));
	});
	Hear("Tiles", "dragstart", function(event){
		event.dataTransfer.effectAllowed = 'move';
	});
	
	var switchTypeTile = Draw.switchElem(["type_svg", "type_color"], "invis");
	switchTypeTile("type_" + getNode("type").value);
	Hear("type", "change", function(e){
		switchTypeTile("type_" + e.target.value);
	});
	Hear("add", "submit", function(){
		var tile = {
			type: this.type.value
		};
		if(tile.type == "svg"){
			if(this.img.files[0]){
				var reader = new FileReader();
				reader.onload = function(e){
					var img = e.target.result;
					tile.img = img;
					Logic.add(tile);
				};
				
				reader.readAsDataURL(this.img.files[0]);
			}
		}
		if(tile.type == "color"){
			tile.color = new Chromath(this.color.value).toRGBAObject();
			Logic.add(tile);
		}
		
	});
	Hear("dell", "click", Logic.dell.bind(Logic));
	
	Hear("save", "click", Logic.save.bind(Logic));
	Hear("open", "change", Draw.openJSON(Logic.load.bind(Logic)));
	
	Hear("View", "dragstart", function(e){
		e.preventDefault();
		if(e.target.getAttribute("tile") !== null) Draw.View.current_tile = e.target;
	});
	Hear("View", "mouseup", function(e){
		Draw.View.norm();
		Draw.View.current_tile = null;
	});
	Hear("View", ["mouseover", "mouseout"], function(e){
		if(e.target !== e.currnetTarget) return;
		Draw.View.norm();
		Draw.View.current_tile = null;
	});
	Hear("View", "mousemove", function(e){
		if(Draw.View.current_tile) Draw.View.move(e.movementX, e.movementY);
	});
	Hear("View", "dragenter", function(e){
		e.preventDefault();
	});
	Hear("View", "dragover", function(e){
		e.preventDefault();
	});
	Hear("View", "drop", function(e){
		e.stopPropagation();
		var box = e.currentTarget.getBoundingClientRect();
		var x = e.clientX - box.left;
		var y = e.clientY - box.top;
		
		if(Logic.getTile()) Draw.View.add(Logic.getTile(), x, y);
	});
	
	Hear("Width", "change", function(e){
		Logic.resizeTile(parseInt(e.target.value));
	});
	Hear("Height", "change", function(e){
		Logic.resizeTile(null, parseInt(e.target.value));
	});
}

module.exports = CrController;

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}