(function(e){function t(t){for(var o,r,s=t[0],c=t[1],l=t[2],d=0,h=[];d<s.length;d++)r=s[d],Object.prototype.hasOwnProperty.call(a,r)&&a[r]&&h.push(a[r][0]),a[r]=0;for(o in c)Object.prototype.hasOwnProperty.call(c,o)&&(e[o]=c[o]);u&&u(t);while(h.length)h.shift()();return i.push.apply(i,l||[]),n()}function n(){for(var e,t=0;t<i.length;t++){for(var n=i[t],o=!0,s=1;s<n.length;s++){var c=n[s];0!==a[c]&&(o=!1)}o&&(i.splice(t--,1),e=r(r.s=n[0]))}return e}var o={},a={app:0},i=[];function r(t){if(o[t])return o[t].exports;var n=o[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,r),n.l=!0,n.exports}r.m=e,r.c=o,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="/rpp/";var s=window["webpackJsonp"]=window["webpackJsonp"]||[],c=s.push.bind(s);s.push=t,s=s.slice();for(var l=0;l<s.length;l++)t(s[l]);var u=c;i.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},"034f":function(e,t,n){"use strict";var o=n("85ec"),a=n.n(o);a.a},"56d7":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d"),n("0cdd");var o=n("2b0e"),a=n("5f5b");n("ab8b"),n("2dd8");o["default"].use(a["a"]);var i=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"app"}},[n("NavBarMain"),n("MainCreatePage"),n("MainReadPage"),n("MainUpdatePage"),n("MainDeletePage"),n("ModalCreateRoom")],1)},r=[],s=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("b-navbar",{attrs:{toggleable:"sm",type:"dark",variant:"dark"}},[e._e(),n("b-navbar-toggle",{attrs:{target:"nav-collapse"}}),n("b-collapse",{attrs:{size:"lg",id:"nav-collapse","is-nav":""}},[n("b-navbar-nav",[e.loggedIn?n("b-dropdown",{attrs:{left:"",variant:"outline-primary",text:"Menu"}},[n("b-dropdown-item",{on:{click:function(t){return e.showMainReadPage()}}},[e._v("Read")]),n("b-dropdown-item",{on:{click:function(t){return e.showMainCreatePage()}}},[e._v("Create")]),n("b-dropdown-item",{on:{click:function(t){return e.showMainUpdatePage()}}},[e._v("Update")]),n("b-dropdown-item",{on:{click:function(t){return e.showMainDeletePage()}}},[e._v("Delete")])],1):e._e()],1),n("b-navbar-nav",{staticClass:"ml-auto"},[e.loggedIn?e._e():n("b-button",{attrs:{variant:"outline-primary"},on:{click:function(t){return e.showLoginWindow()}}},[e._v("Login")]),e.loggedIn?n("b-button",{attrs:{variant:"outline-success"},on:{click:function(t){return e.logout()}}},[e._v("Logout")]):e._e()],1)],1)],1),n("ModalLogin",{attrs:{id:"loginModal"}})],1)},c=[],l=(n("d3b7"),n("96cf"),function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("b-modal",{staticClass:"text-center",attrs:{id:e.id,title:e.title}},[n("b-container",[n("b-row",{attrs:{"align-h":"center"}},[n("b-col",{staticClass:"col-4 text-right"},[n("label",{staticClass:"m-0",attrs:{for:"accessKeyId"}},[e._v("accessKeyId")])]),n("b-col",[n("b-input",{attrs:{id:"accessKeyId"},model:{value:e.accessKeyId,callback:function(t){e.accessKeyId=t},expression:"accessKeyId"}})],1)],1),n("b-row",{attrs:{"align-h":"center"}},[n("b-col",{staticClass:"col-4 text-right"},[n("label",{staticClass:"m-0",attrs:{for:"secretAccessKey"}},[e._v("secretAccessKey")])]),n("b-col",[n("b-input",{attrs:{type:"password",id:"secretAccessKey"},model:{value:e.secretAccessKey,callback:function(t){e.secretAccessKey=t},expression:"secretAccessKey"}})],1)],1)],1),n("div",{staticClass:"w-100",attrs:{slot:"modal-footer"},slot:"modal-footer"},[n("p",{staticClass:"float-left text-danger"},[e._v(e._s(e.loginError))]),n("p",{staticClass:"float-left"}),n("b-button",{staticClass:"float-right",attrs:{variant:"primary",size:"sm"},on:{click:e.login}},[e._v("Login")])],1)],1)],1)}),u=[];n("25f0"),n("c975"),n("1276");function d(e,t,n){var o="";if(n){var a=new Date;a.setTime(a.getTime()+24*n*60*60*1e3),o="; expires="+a.toUTCString()}document.cookie=e+"="+(t||"")+o+"; path=/"}function h(e){for(var t=e+"=",n=document.cookie.split(";"),o=0;o<n.length;o++){var a=n[o];while(" "==a.charAt(0))a=a.substring(1,a.length);if(0==a.indexOf(t))return a.substring(t.length,a.length)}return null}var g={name:"ModalLogin",props:{title:{default:"Login",type:String},id:{default:"ModalLoginId",type:String}},data:function(){return{accessKeyId:"",secretAccessKey:"",loggedIn:!1,loginError:""}},methods:{show:function(){this.accessKeyId=h("accessKeyId"),this.secretAccessKey=h("secretAccessKey"),this.loginError="",this.$bvModal.show(this.id)},hide:function(){this.$bvModal.hide(this.id)},login:function(){return regeneratorRuntime.async((function(e){while(1)switch(e.prev=e.next){case 0:this.loginError="";try{d("accessKeyId",this.accessKeyId,7),d("secretAccessKey",this.secretAccessKey,7),this.loggedIn=!0,this.$root.$emit("loginEvent"),this.hide()}catch(t){this.loginError=t.toString(),this.loggedIn=!1,this.$root.$emit("logoutEvent")}case 2:case"end":return e.stop()}}),null,this)}},mounted:function(){var e=this;this.$root.$on("showLoginWindow",(function(){e.show()})),this.$root.settings||(this.$root.settings={}),this.accessKeyId=h("accessKeyId"),this.secretAccessKey=h("secretAccessKey"),this.accessKeyId&&this.secretAccessKey&&this.login()}},f=g,p=n("2877"),m=Object(p["a"])(f,l,u,!1,null,"11852cb0",null),v=m.exports,b={name:"NavBarMain",components:{ModalLogin:v},props:{title:{default:"Login",type:String},id:{default:"NavBarMain",type:String}},data:function(){return{loggedIn:!1}},methods:{showMainReadPage:function(){this.$root.$emit("showMainReadPage"),this.hideMainCreatePage(),this.hideMainUpdatePage(),this.hideMainDeletePage(),console.log("Emit: showMainReadPage")},hideMainReadPage:function(){this.$root.$emit("hideMainReadPage"),console.log("Emit: hideMainReadPage")},showMainCreatePage:function(){this.$root.$emit("showMainCreatePage"),this.hideMainReadPage(),this.hideMainUpdatePage(),this.hideMainDeletePage(),console.log("Emit: showMainCreatePage")},hideMainCreatePage:function(){this.$root.$emit("hideMainCreatePage"),console.log("Emit: hideMainCreatePage")},showMainUpdatePage:function(){this.$root.$emit("showMainUpdatePage"),this.hideMainCreatePage(),this.hideMainReadPage(),this.hideMainDeletePage(),console.log("Emit: showMainUpdatePage")},hideMainUpdatePage:function(){this.$root.$emit("hideMainUpdatePage"),console.log("Emit: hideMainUpdatePage")},showMainDeletePage:function(){this.$root.$emit("showMainDeletePage"),this.hideMainCreatePage(),this.hideMainUpdatePage(),this.hideMainReadPage(),console.log("Emit: showMainDeletePage")},hideMainDeletePage:function(){this.$root.$emit("hideMainDeletePage"),console.log("Emit: hideMainDeletePage")},showLoginWindow:function(){this.$root.$emit("showLoginWindow"),console.log("Emit: showLoginWindow")},logout:function(){this.$root.$emit("logoutEvent"),console.log("Emit: Logout Event")}},computed:{getjson:function(){return{prefix:this.prefix,region:this.region}}},mounted:function(){var e=this;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:this.loggedIn=!0,this.$root.$on("loginEvent",(function(){console.log("loginEvent"),e.loggedIn=!0})),this.$root.$on("logoutEvent",(function(){console.log("logoutEvent"),e.loggedIn=!1}));case 3:case"end":return t.stop()}}),null,this)}},w=b,P=Object(p["a"])(w,s,c,!1,null,"285cf410",null),M=P.exports,R=function(){var e=this,t=e.$createElement,n=e._self._c||t;return e.MainCreatePage?n("b-container",{attrs:{fluid:""}},[n("h1",[e._v("Create")]),e._l(e.data?Object.keys(e.data):[],(function(t){return n("b-row",{key:t,staticClass:"justify-content-md-center"},[n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[e._v(" "+e._s(t)+" ")]),n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[n("b-input",{on:{change:function(t){return e.testfn()}},model:{value:e.data[t],callback:function(n){e.$set(e.data,t,n)},expression:"data[key]"}})],1)],1)})),n("b-row",{staticClass:"justify-content-md-center"},[n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[e._v(" Status:"+e._s(e.status)+" ")]),n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[n("b-button",{attrs:{variant:"outline-primary"},on:{click:function(t){return e.submit()}}},[e._v("submit")])],1)],1)],2):e._e()},y=[],x=n("bc3a"),_=n.n(x),$=n("df7c"),C=!0,k=Object({NODE_ENV:"production",VUE_APP_DEV_URL:"http://localhost:3010",VUE_APP_PREFIX:"/rpp",BASE_URL:"/rpp/"}).DEV_URL,E="/rpp";console.log(E,E,E);var S=$["join"]("/",E,"schema"),D=$["join"]("/",E,"create"),O=$["join"]("/",E,"read"),U=$["join"]("/",E,"update"),j=$["join"]("/",E,"delete"),N=C?S:k+S,K=C?D:k+D,I=C?O:k+O,A=C?U:k+U,L=C?j:k+j;console.log(K,N);var T={name:"MainCreatePage",components:{},props:{title:{default:"MainCreatePage",type:String},id:{default:"MainCreatePage",type:String}},data:function(){return{status:"",MainCreatePage:!1,field1:"field1",field2:"field2",data:{},schema:{}}},methods:{testfn:function(){return regeneratorRuntime.async((function(e){while(1)switch(e.prev=e.next){case 0:console.log("TEST");case 1:case"end":return e.stop()}}))},submit:function(){var e;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,regeneratorRuntime.awrap(_.a.post(K,this.data).catch((function(e){return console.log("ERROR",e),null})));case 2:e=t.sent,this.status=e.data,this.data=JSON.parse(JSON.stringify(this.schema));case 5:case"end":return t.stop()}}),null,this)}},computed:{getjson:function(){return{prefix:this.prefix,region:this.region}}},mounted:function(){var e,t=this;return regeneratorRuntime.async((function(n){while(1)switch(n.prev=n.next){case 0:return n.next=2,regeneratorRuntime.awrap(_.a.post(N,{}).catch((function(e){return console.log("Error reading schema from server",e)})));case 2:e=n.sent,this.schema=e.data,this.data=JSON.parse(JSON.stringify(this.schema)),this.$root.$on("showMainCreatePage",(function(){t.MainCreatePage=!0,console.log("Event: showMainCreatePage")})),this.$root.$on("hideMainCreatePage",(function(){t.MainCreatePage=!1,console.log("Event: hideMainCreatePage")}));case 7:case"end":return n.stop()}}),null,this)}},H=T,J=Object(p["a"])(H,R,y,!1,null,"793b5408",null),B=J.exports,W=function(){var e=this,t=e.$createElement,n=e._self._c||t;return e.showMainReadPage?n("b-container",{attrs:{fluid:""}},[n("h1",[e._v("Rendezvous Points")]),n("b-row",[n("b-col",{staticClass:"font-weight-bold"},[e._v("Room Name")]),n("b-col",{staticClass:"font-weight-bold"},[e._v("Receiver Name")]),n("b-col",{staticClass:"font-weight-bold"},[e._v("Receiver Port")]),n("b-col",{staticClass:"font-weight-bold"},[e._v("Forwarder Name")]),n("b-col",{staticClass:"font-weight-bold"},[e._v("Forwarder Host")]),n("b-col",{staticClass:"font-weight-bold"},[e._v("Forwarder Port")]),n("b-col",{staticStyle:{visibility:"hidden"},attrs:{md:"auto"}},[n("b-button",[e._v("Update")]),n("b-button",[e._v("Delete")])],1)],1),e._l(e.receivedData,(function(t){return n("b-row",{key:t.name,staticClass:"justify-content-md-center"},[n("b-col",[n("b-input",{model:{value:t.name,callback:function(n){e.$set(t,"name",n)},expression:"room.name"}})],1),n("b-col",[n("b-input",{model:{value:t.rcvName,callback:function(n){e.$set(t,"rcvName",n)},expression:"room.rcvName"}})],1),n("b-col",[n("b-input",{model:{value:t.rcvPort,callback:function(n){e.$set(t,"rcvPort",n)},expression:"room.rcvPort"}})],1),n("b-col",[n("b-input",{model:{value:t.fwdName,callback:function(n){e.$set(t,"fwdName",n)},expression:"room.fwdName"}})],1),n("b-col",[n("b-input",{model:{value:t.fwdHost,callback:function(n){e.$set(t,"fwdHost",n)},expression:"room.fwdHost"}})],1),n("b-col",[n("b-input",{model:{value:t.fwdPort,callback:function(n){e.$set(t,"fwdPort",n)},expression:"room.fwdPort"}})],1),n("b-col",{attrs:{md:"auto"}},[n("b-button",{on:{click:function(n){return e.updateRoom(t)}}},[e._v("Update")]),n("b-button",{on:{click:function(n){return e.deleteRoom(t)}}},[e._v("Delete")])],1)],1)})),n("b-row",[n("div",{staticClass:"p-3"},[n("b-button",{on:{click:function(t){return e.showModalCreateRoom()}}},[e._v("Create")])],1)])],2):e._e()},V=[];console.log(I);var z={name:"MainReadPage",components:{},props:{title:{default:"MainReadPage",type:String},id:{default:"MainReadPage",type:String}},data:function(){return{showMainReadPage:!0,field1:"field1",field2:"field2",test:[{f1:"A1",f2:"A2"},{f1:"B1",f2:"B2"}],receivedData:[],schema:{}}},methods:{testfn:function(){return regeneratorRuntime.async((function(e){while(1)switch(e.prev=e.next){case 0:console.log("TEST");case 1:case"end":return e.stop()}}))},showModalCreateRoom:function(){this.$root.$emit("showModalCreateRoom"),console.log("showModalCreateRoom")},refreshMainReadPage:function(){var e=this;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:_.a.post(I,{}).then((function(t){console.log("SUCCES",t),e.receivedData=t.data})).catch((function(e){return console.log("ERROR",e)})),console.log("Event: showMainReadPage");case 2:case"end":return t.stop()}}))},updateRoom:function(e){var t;return regeneratorRuntime.async((function(n){while(1)switch(n.prev=n.next){case 0:return console.log("Update",e),n.next=3,regeneratorRuntime.awrap(_.a.post(A,e).catch((function(e){return console.log("UPDATE ERROR",e)})));case 3:if(t=n.sent,this.status=t.data,"success"!=this.status){n.next=10;break}return n.next=8,regeneratorRuntime.awrap(this.refreshMainReadPage());case 8:this.status=n.sent,console.log(this.status);case 10:case"end":return n.stop()}}),null,this)},deleteRoom:function(e){var t;return regeneratorRuntime.async((function(n){while(1)switch(n.prev=n.next){case 0:return console.log("Delete",e),n.next=3,regeneratorRuntime.awrap(_.a.post(L,e).catch((function(e){return console.log("DELETE ERROR",e)})));case 3:return t=n.sent,this.status=t.data,n.next=7,regeneratorRuntime.awrap(this.refreshMainReadPage());case 7:case"end":return n.stop()}}),null,this)}},computed:{getjson:function(){return{prefix:this.prefix,region:this.region}},db:function(){return this.receivedData.length?this.receivedData:[this.schema]}},mounted:function(){var e,t=this;return regeneratorRuntime.async((function(n){while(1)switch(n.prev=n.next){case 0:return e=this,n.next=3,regeneratorRuntime.awrap(_.a.post(N,{}).then((function(t){console.log("SUCCES",t),e.schema=t.data})).catch((function(e){return console.log("Error reading schema from server",e)})));case 3:return n.next=5,regeneratorRuntime.awrap(this.refreshMainReadPage());case 5:this.$root.$on("showMainReadPage",(function(){t.showMainReadPage=!0,t.refreshMainReadPage(),console.log("Event: showMainReadPage")})),this.$root.$on("hideMainReadPage",(function(){t.showMainReadPage=!1,console.log("Event: hideMainReadPage")}));case 7:case"end":return n.stop()}}),null,this)}},F=z,X=Object(p["a"])(F,W,V,!1,null,"0a6d8440",null),q=X.exports,G=function(){var e=this,t=e.$createElement,n=e._self._c||t;return e.MainUpdatePage?n("b-container",{attrs:{fluid:""}},[n("h1",[e._v("Update")]),n("b-row",{staticClass:"justify-content-md-center"},[n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[e._v(" Select a record ")]),n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[n("b-form-select",{attrs:{options:e.options},model:{value:e.optionPicked,callback:function(t){e.optionPicked=t},expression:"optionPicked"}})],1)],1),e._l(e.data[e.optionPicked]?Object.keys(e.data[e.optionPicked]):[],(function(t){return n("b-row",{key:t,staticClass:"justify-content-md-center"},[n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[e._v(" "+e._s(t)+" ")]),n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[n("b-input",{on:{change:function(t){return e.testfn()}},model:{value:e.data[e.optionPicked][t],callback:function(n){e.$set(e.data[e.optionPicked],t,n)},expression:"data[optionPicked][key]"}})],1)],1)})),n("b-row",{staticClass:"justify-content-md-center"},[n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[e._v(" Status:"+e._s(e.status)+" ")]),n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[n("b-button",{attrs:{variant:"outline-primary"},on:{click:function(t){return e.submit()}}},[e._v("submit")])],1)],1)],2):e._e()},Q=[];n("d81d"),n("b0c0"),n("3ca3"),n("ddb0"),n("2b3d");console.log(A,N);var Y={name:"MainUpdatePage",components:{},props:{title:{default:"MainUpdatePage",type:String},id:{default:"MainUpdatePage",type:String}},data:function(){return{MainUpdatePage:!1,status:"",optionPicked:0,options:[{value:0,text:"No response from database"}],data:[{}]}},methods:{testfn:function(){return regeneratorRuntime.async((function(e){while(1)switch(e.prev=e.next){case 0:console.log("TEST");case 1:case"end":return e.stop()}}))},submit:function(){var e;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,regeneratorRuntime.awrap(_.a.post(URL,this.data[this.optionPicked]).catch((function(e){return console.log("ERROR",e)})));case 2:e=t.sent,this.$root.$emit("showMainUpdatePage"),this.status=e.data;case 5:case"end":return t.stop()}}),null,this)},refresh:function(){var e;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:return this.status="",t.next=3,regeneratorRuntime.awrap(_.a.post(I,{}).catch((function(e){return console.log("Error reading data from server",e)})));case 3:e=t.sent,this.schema=e.data,this.data=JSON.parse(JSON.stringify(this.schema)),this.data.length?this.options=this.data.map((function(e,t){return{value:t,text:e.name}})):this.options=[{value:0,text:"No data present"}];case 7:case"end":return t.stop()}}),null,this)}},computed:{record:function(){return{prefix:this.prefix,region:this.region}}},mounted:function(){var e=this;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:this.$root.$on("showMainUpdatePage",(function(){e.MainUpdatePage=!0,console.log("Event: showMainUpdatePage"),e.refresh()})),this.$root.$on("hideMainUpdatePage",(function(){e.MainUpdatePage=!1,console.log("Event: hideMainUpdatePage")}));case 2:case"end":return t.stop()}}),null,this)}},Z=Y,ee=Object(p["a"])(Z,G,Q,!1,null,"6834d122",null),te=ee.exports,ne=function(){var e=this,t=e.$createElement,n=e._self._c||t;return e.MainDeletePage?n("b-container",{attrs:{fluid:""}},[n("h1",[e._v("Delete")]),n("b-row",{staticClass:"justify-content-md-center"},[n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[e._v(" Select a record ")]),n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[n("b-form-select",{attrs:{options:e.options},model:{value:e.optionPicked,callback:function(t){e.optionPicked=t},expression:"optionPicked"}})],1)],1),e._l(e.data[e.optionPicked]?Object.keys(e.data[e.optionPicked]):[],(function(t){return n("b-row",{key:t,staticClass:"justify-content-md-center"},[n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[e._v(" "+e._s(t)+" ")]),n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[n("b-input",{on:{change:function(t){return e.testfn()}},model:{value:e.data[e.optionPicked][t],callback:function(n){e.$set(e.data[e.optionPicked],t,n)},expression:"data[optionPicked][key]"}})],1)],1)})),n("b-row",{staticClass:"justify-content-md-center"},[n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[e._v(" Status:"+e._s(e.status)+" ")]),n("b-col",{attrs:{xl:"3",lg:"3",md:"3"}},[n("b-button",{attrs:{variant:"outline-primary"},on:{click:function(t){return e.submit()}}},[e._v("submit")])],1)],1)],2):e._e()},oe=[];console.log(L,N);var ae={name:"MainDeletePage",components:{},props:{title:{default:"MainDeletePage",type:String},id:{default:"MainDeletePage",type:String}},data:function(){return{MainDeletePage:!1,status:"",optionPicked:0,options:[{value:0,text:"No response from database"}],data:[{}]}},methods:{testfn:function(){return regeneratorRuntime.async((function(e){while(1)switch(e.prev=e.next){case 0:console.log("TEST");case 1:case"end":return e.stop()}}))},submit:function(){var e;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,regeneratorRuntime.awrap(_.a.post(L,this.data[this.optionPicked]).catch((function(e){return console.log("ERROR",e)})));case 2:e=t.sent,this.$root.$emit("MainDeletePage"),this.status=e.data,this.refresh();case 6:case"end":return t.stop()}}),null,this)},refresh:function(){var e;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:return this.status="",t.next=3,regeneratorRuntime.awrap(_.a.post(I,{}).catch((function(e){return console.log("Error reading data from server",e)})));case 3:e=t.sent,this.optionPicked=0,this.schema=e.data,this.data=JSON.parse(JSON.stringify(this.schema)),this.data.length?this.options=this.data.map((function(e,t){return{value:t,text:e.name}})):this.options=[{value:0,text:"No data present"}];case 8:case"end":return t.stop()}}),null,this)}},computed:{getjson:function(){return{prefix:this.prefix,region:this.region}}},mounted:function(){var e=this;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:this.$root.$on("showMainDeletePage",(function(){e.MainDeletePage=!0,console.log("Event: showMainDeletePage"),e.refresh()})),this.$root.$on("hideMainDeletePage",(function(){e.MainDeletePage=!1,console.log("Event: hideMainDeletePage")}));case 2:case"end":return t.stop()}}),null,this)}},ie=ae,re=Object(p["a"])(ie,ne,oe,!1,null,"fbba4cac",null),se=re.exports,ce=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("b-modal",{staticClass:"text-center",attrs:{id:e.id,title:e.title}},[n("b-container",[n("b-row",[n("b-col",[e._v("Room Name")]),n("b-col",[n("b-input",{model:{value:e.room.name,callback:function(t){e.$set(e.room,"name",t)},expression:"room.name"}})],1)],1),n("b-row",[n("b-col",[e._v("Room rcvName")]),n("b-col",[n("b-input",{model:{value:e.room.rcvName,callback:function(t){e.$set(e.room,"rcvName",t)},expression:"room.rcvName"}})],1)],1),n("b-row",[n("b-col",[e._v("Room rcvPort")]),n("b-col",[n("b-input",{model:{value:e.room.rcvPort,callback:function(t){e.$set(e.room,"rcvPort",t)},expression:"room.rcvPort"}})],1)],1),n("b-row",[n("b-col",[e._v("Room fwdName")]),n("b-col",[n("b-input",{model:{value:e.room.fwdName,callback:function(t){e.$set(e.room,"fwdName",t)},expression:"room.fwdName"}})],1)],1),n("b-row",[n("b-col",[e._v("Room fwdHost")]),n("b-col",[n("b-input",{model:{value:e.room.fwdHost,callback:function(t){e.$set(e.room,"fwdHost",t)},expression:"room.fwdHost"}})],1)],1),n("b-row",[n("b-col",[e._v("Room fwdPort")]),n("b-col",[n("b-input",{model:{value:e.room.fwdPort,callback:function(t){e.$set(e.room,"fwdPort",t)},expression:"room.fwdPort"}})],1)],1)],1),n("div",{staticClass:"w-100",attrs:{slot:"modal-footer"},slot:"modal-footer"},[n("p",{staticClass:"float-left text-danger"},[e._v(e._s(e.status))]),n("p",{staticClass:"float-left"}),n("b-button",{staticClass:"float-right",attrs:{variant:"primary",size:"sm"},on:{click:e.create}},[e._v("Create")])],1)],1)],1)},le=[],ue={name:"ModalCreateRoom",props:{title:{default:"Create Room",type:String},id:{default:"ModalCreateRoom",type:String}},data:function(){return{room:{name:"room1",rcvName:"client1",rcvPort:"11111",fwdName:"client2",fwdHost:"localhost",fwdPort:"22"},status:""}},methods:{show:function(){console.log("SHOW"),this.$bvModal.show(this.id)},hide:function(){console.log("HIDE"),this.$bvModal.hide(this.id)},create:function(){var e;return regeneratorRuntime.async((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,regeneratorRuntime.awrap(_.a.post(K,this.room).catch((function(e){return console.log("ERROR",e),null})));case 2:e=t.sent,this.status=e.data,"success"==this.status&&(this.hide(),this.$root.$emit("showMainReadPage"));case 5:case"end":return t.stop()}}),null,this)}},mounted:function(){var e=this;console.log("MOUNTED"),this.$root.$on("showModalCreateRoom",(function(){console.log("Event Received: showModalCreateRoom",event),e.show()}))}},de=ue,he=Object(p["a"])(de,ce,le,!1,null,"6f49d0ca",null),ge=he.exports,fe={name:"app",components:{NavBarMain:M,MainCreatePage:B,MainReadPage:q,MainUpdatePage:te,MainDeletePage:se,ModalCreateRoom:ge},mounted:function(){}},pe=fe,me=(n("034f"),Object(p["a"])(pe,i,r,!1,null,null,null)),ve=me.exports;o["default"].config.productionTip=!1,new o["default"]({render:function(e){return e(ve)}}).$mount("#app")},"85ec":function(e,t,n){}});
//# sourceMappingURL=app.aca4d036.js.map