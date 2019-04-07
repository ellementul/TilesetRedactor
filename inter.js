module.exports = function CrInterfice(testes, log){
	var is_test = false;
	
	this.test = function(new_testes, new_log){
		if(new_testes){
			if(typeof(new_testes[0]) == "function" 
			&& typeof(new_testes[1]) == "function"){
				
				testes = new_testes;
				is_test = true;
				
			}else{
				console.error(new Error("Test is not function!"));
				is_test = false;
			}
		}
		if(new_log){
			if(typeof new_log == "function") log = new_log; else log = null;
		}
	}
	
	if(testes) this.test(testes, log);
	
	var InputOne = null;
	var OutputOne = null;
	
	this.connect = function(outputFunc){
		if(OutputOne){
			if(is_test){
				var begFunc = outputFunc;
				outputFunc = function(val){
					testes[0](val);
					if(log) log(" One: ", val);
					begFunc(val);
				}
			}
			return TwoConnect(outputFunc);
		}
		else{
			if(is_test){
				var begFunc = outputFunc;
				outputFunc = function(val){
					testes[1](val);
					if(log) log(" Two: ", val);
					begFunc(val);
				}
			}
			return OneConnect(outputFunc);
		}
	};
	
	function OneConnect(outputFunc){
		OutputOne = outputFunc;
		InputOne = CrHoarder();
		
		return function(val){
			InputOne(val);
		}
	}
	
	function TwoConnect(outputFunc){
		if(InputOne.take) InputOne.take(outputFunc);
		InputOne = outputFunc;
		
		return OutputOne;
	}
}

function CrHoarder(){
	var hoarder = [];
	
	var push = function(val){
		hoarder.push(val);
	};
	
	push.take = function(func){
		if(typeof func != "function") return hoarder;
		
		hoarder.forEach(function(val){
				func(val);
		});
	}
	
	return push;
}