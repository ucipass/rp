class JSONData{
    constructor(id,type,attributes){
	this.json = {};
	this.json.data = {};
	this.json.data.id = id;
	this.json.data.type = type;
	this.json.data.attributes = attributes;
	this.json.error = null;
	this.set = function(type,id,attributes){this.json.data = {type:type,id:id,attributes:attributes};};
	this.setjson = function(msg){this.json=msg;return this;};
	this.getjson = function(){return this.json;};
	this.setdata = function(msg){this.json.data=msg;};
	this.getdata = function(){return this.json.data;};
	this.err  = function(){return this.json.error;};
	this.attributes = function(){return this.json.data.attributes;};
	this.cmd = function(){return this.json.data.attributes.cmd;};
	this.isValid = function(){var x=this.json.data;return(Boolean(x) && Boolean(x.id) && Boolean(x.type) &&  Boolean(x.attributes));};
	this.isInvalid = function(){return (!this.isValid());};
	this.log = function(logmsg){
		if(this.json.error) {
			console.log(logmsg ? logmsg : "ERROR:", this.json.error) ;} 
		else {
			if(this.isValid()) {  console.log(logmsg ? logmsg : "",this.type(),this.id(),this.att())}
			else {console.log(logmsg ? logmsg : ""," JSON FORMAT IS INVALID",this.json);}  
			}
		}
	//this.log = function(logmsg){console.log(this.json)};  
    }
    toString(){
        try {
            return JSON.stringify(this.json)
        } catch (error) {
            console.log("ERROR JSONData",error)
        }
    }
    fromString(s){
        try {
            this.json = JSON.parse(s)
        } catch (error) {
            console.log("ERROR JSONData",error)
        }
        if (this.isInvalid()) console.log("INVALID JSON received")
	}
	get att(){
		return this.json.data.attributes
	}
	set att(newdata){
		this.json.data.attributes = newdata
	}
	get type(){
		return this.json.data.type
	}
	set type(newtype){
		this.json.data.type = newtype
	}
	get id(){
		return this.json.data.id
	}
	set id(newtype){
		this.json.data.id = newtype
	}
}
module.exports = JSONData ;