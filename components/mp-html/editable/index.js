"use strict";function t(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}function e(e){function r(i){e._edit?e._edit.insert(i):e.setData(t({},"nodes["+e.data.nodes.length+"]",i))}var a=this;this.vm=e,this.editHistory=[],this.editI=-1,e._mask=[];var s=function(i){var n=a.editHistory[a.editI+i];n&&(a.editI+=i,e.setData(t({},n.key,n.value)))};e.undo=function(){return s(-1)},e.redo=function(){return s(1)},e._editVal=function(i,n,r,s){for(;a.editI<a.editHistory.length-1;)a.editHistory.pop();for(;a.editHistory.length>30;)a.editHistory.pop(),a.editI--;var l=a.editHistory[a.editHistory.length-1];l&&l.key==i||(l&&(a.editHistory.pop(),a.editI--),a.editHistory.push({key:i,value:n}),a.editI++),a.editHistory.push({key:i,value:r}),a.editI++,s&&e.setData(t({},i,r))},e._getItem=function(t){var n;if("img"==t.name){if(n=i.img.slice(0),!e.getSrc){var r=n.indexOf("换图");-1!=r&&n.splice(r,1),r=n.indexOf("超链接"),-1!=r&&n.splice(r,1),r=n.indexOf("预览图"),-1!=r&&n.splice(r,1)}var a=n.indexOf("禁用预览");-1!=a&&t.attrs.ignore&&(n[a]="启用预览")}else if("a"==t.name)n=i.link.slice(0);else if("video"==t.name||"audio"==t.name){n=i.media.slice(0);var s=n.indexOf("封面");e.getSrc||-1==s||n.splice(s,1),s=n.indexOf("循环"),t.attrs.loop&&-1!=s&&(n[s]="不循环")}else n=i.node.slice(0);return n},e._tooltip=function(t){e.setData({tooltip:{top:t.top,items:t.items}}),e._tooltipcb=t.success},e._slider=function(t){e.setData({slider:{min:t.min,max:t.max,value:t.value,top:t.top}}),e._slideringcb=t.changing,e._slidercb=t.change},e._maskTap=function(){for(;this._mask.length;)this._mask.pop()();var t={};this.data.tooltip&&(t.tooltip=null),this.data.slider&&(t.slider=null),(this.data.tooltip||this.data.slider)&&this.setData(t)},e.insertHtml=function(t){for(var i=new n(e).parse(t),a=0;a<i.length;a++)r(i[a])},e.insertImg=function(){e.getSrc&&e.getSrc("img").then(function(t){r({name:"img",attrs:{src:t}})}).catch(function(){})},e.insertLink=function(){e.getSrc&&e.getSrc("link").then(function(t){r({name:"a",attrs:{href:t},children:[{type:"text",text:t}]})}).catch(function(){})},e.insertVideo=function(){e.getSrc&&e.getSrc("video").then(function(t){"string"==typeof t&&(t=[t]),r({name:"div",attrs:{style:"text-align:center"},children:[{name:"video",attrs:{},src:t}]})}).catch(function(){})},e.insertAudio=function(){e.getSrc&&e.getSrc("audio").then(function(t){"string"==typeof t&&(t=[t]),r({name:"div",attrs:{style:"text-align:center"},children:[{name:"audio",attrs:{},src:t}]})}).catch(function(){})},e.insertText=function(){r({name:"p",attrs:{},children:[{type:"text",text:""}]})},e.clear=function(){e._maskTap(),e._edit=void 0,e.setData({nodes:[{name:"p",attrs:{},children:[{type:"text",text:""}]}]})},e.getContent=function(){var t="";!function e(i,n){for(var r=0;r<i.length;r++){var a=i[r];if("text"==a.type)t+=a.text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>").replace(/\xa0/g,"&nbsp;");else{if("img"==a.name&&(a.attrs.src||"").includes("data:image/svg+xml;utf8,")){t+=a.attrs.src.substr(24).replace(/%23/g,"#").replace("<svg",'<svg style="'+(a.attrs.style||"")+'"');continue}if("video"==a.name||"audio"==a.name)if(a.src.length>1){a.children=[];for(var s=0;s<a.src.length;s++)a.children.push({name:"source",attrs:{src:a.src[s]}})}else a.attrs.src=a.src[0];else"div"==a.name&&(a.attrs.style||"").includes("overflow:auto")&&"table"==(a.children[0]||{}).name&&(a=a.children[0]);if("table"==a.name&&(n=a.attrs,(a.attrs.style||"").includes("display:grid"))){a.attrs.style=a.attrs.style.split("display:grid")[0];for(var l=[{name:"tr",attrs:{},children:[]}],c=0;c<a.children.length;c++)a.children[c].attrs.style=a.children[c].attrs.style.replace(/grid-[^;]+;*/g,""),a.children[c].r!=l.length?l.push({name:"tr",attrs:{},children:[a.children[c]]}):l[l.length-1].children.push(a.children[c]);a.children=l}t+="<"+a.name;for(var o in a.attrs){var d=a.attrs[o];d&&("T"!=d&&!0!==d?"t"==a.name[0]&&"style"==o&&n&&(d=d.replace(/;*display:table[^;]*/,""),n.border&&(d=d.replace(/border[^;]+;*/g,function(t){return t.includes("collapse")?t:""})),n.cellpadding&&(d=d.replace(/padding[^;]+;*/g,"")),!d)||(t+=" "+o+'="'+d.replace(/"/g,"&quot;")+'"'):t+=" "+o)}t+=">",a.children&&(e(a.children,n),t+="</"+a.name+">")}}}(e.data.nodes);for(var i=e.plugins.length;i--;)e.plugins[i].onGetContent&&(t=e.plugins[i].onGetContent(t)||t);return t}}var i=require("./config"),n=require("../parser");e.prototype.onUpdate=function(t,e){var i=this;this.vm.data.editable&&(this.vm._maskTap(),this.vm._edit=void 0,e.entities.amp="&",t||setTimeout(function(){i.vm.setData({nodes:[{name:"p",attrs:{},children:[{type:"text",text:""}]}]})},0))},module.exports=e;