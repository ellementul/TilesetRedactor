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

	Hear("clear", "click", Draw.View.clear);

};

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}