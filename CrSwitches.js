const Hear = require("./Events.js");

module.exports = function(Draw){

	Hear("switch_add", "click", Draw.switchElem("invis", "add"));

	var switchTypeTile = Draw.switchElem("invis", {
		svg: "type_svg", 
		color: "type_color", 
		phisic: "type_phisic"});
	switchTypeTile(getNode("type").value);

	Hear("type", "change", function(e){
		switchTypeTile(e.target.value);
	});

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
};

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}