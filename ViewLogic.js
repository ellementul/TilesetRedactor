const Hear = require("./Events.js");
const CrSwitchElem = require("./Switch.js");

module.exports = function(Form, Tool){

	this.switchAddForm = CrSwitchElem("invis", "AddForm");

	Hear("add_switch", "click", this.switchAddForm);

	Hear("AddImageInput", "change", function(){
		if(this.files[0])
			Form.Images.add(this.files[0]);
	});

	Hear("Tiles", "click", function(e){
		if(e.target.tile){
			Tool.tile = e.target.tile;
			Press(e);
		}
	});

	Hear("Tools", "click", function(e){
		if(e.target.getAttribute("tool")){
			Tool.type = e.target.getAttribute("tool");
			Press(e);
		}
	});

	Hear("Map", "dragstart", function(e){
		e.preventDefault();
	});

	

};

function Press(e){
		e.target.classList.add("press");
		setTimeout(()=>e.target.classList.remove("press"), 300);
}