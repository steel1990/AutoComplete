/**
* @author 廖斌斌
* @time 2012-03-13
* 接口为:autoComplete(option)
* 参数可以为json式
* 提示列表为ul -> li -> span(与输入相同的部分)
* 提示列表使用的class:more(有子条目), :hover, cur(当前选中条目)
* json 数据格式：
{
    status : 0,
    data : [{
            text : "中国",
            children : [{
                    text : "北京",
                    children : [{
                            text : "东城区"
                        }, {
                            text : "西城区"
                        }
                        ......
                    ]
                }
                ......
            ]
        }
        ......
    ]
}
*/
/*global window, console*/
(function(window){
    var document = window.document,
        toString = Object.prototype.toString,
        Type = {
            isStr : function(str){
                return typeof str === "string" ||
                    str instanceof String ||
                    toString.call(str) === "[object String]";
            },
            isArray : function(arr){
                return arr instanceof Array ||
                    toString.call(arr) === "[object Array]";
            },
            isFunction : function(fn){
                return typeof fn === "function" ||
                    fn instanceof Function ||
                    toString.call(fn) === "[object Function]";
            }
        },
        inArray = function(arr, item, compare){
            var i;
            if(!arr){
                return -1;
            }
            for(i = arr.length - 1; i >= 0; i -= 1){
                if(Type.isFunction(compare) ? compare(arr[i], item) : arr[i] === item){
                    return i;
               }
            }
            return -1;
        },
        removeFromArray = function(arr, item, compare){
            var i;
            if(Type.isArray(item)){
                for(i = item.length - 1; i >= 0; i -= 1){
                    removeFromArray(arr, item[i], compare);
                }
            }
            for(i = arr.length - 1; i >= 0; i -= 1){
                if(Type.isFunction(compare) ? compare(arr[i], item) : arr[i] === item){
                    arr.splice(i, 1);
               }
            }
            return arr;
        },
        loadScript = function(url){
            var head = document.getElementsByTagName("head")[0],
                script = document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", url);
            head.appendChild(script);
        },
        css = function(ele, name, value){
            var computedStyle, i;
            if(Type.isStr(name)){
                if(value){//set
                    if(name === "float"){
                        ele.style.cssFloat = value;
                        ele.style.styleFloat = value;
                    }else{
                        ele.style[name] = value;
                    }
                }else{//get
                    try{
                        computedStyle = document.defaultView.getComputedStyle(ele,null);
                    }catch(e){
                        computedStyle = ele.currentStyle;
                    }
                    if(name !== "float"){
                        return computedStyle[name];
                    }
                    else{
                        return computedStyle.cssFloat || computedStyle.styleFloat;
                    }
                }
            }else{//set map
                for(i in name){
                    if(name.hasOwnProperty(i)){
                        css(ele, i, name[i]);
                    }
                }
            }
        },
        Event = {
            add : function(ele, type, handler){
                var i;
                if(!ele){
                    console.log("Event.add argument ele error.");
                    return;
                }
                if(!Type.isStr(type)){
                    console.log("Event.add argument type error.");
                    return;
                }
                if(type.indexOf(" ") > -1){
                    type = type.split(" ");
                    for(i = type.length - 1; i >= 0; i -= 1){
                        Event.add(ele, type[i], handler);
                    }
                }
                if(ele.addEventListener){
                    ele.addEventListener(type, handler, false);
                }else if(ele.attachEvent){
                    ele.attachEvent("on" + type, handler);
                }else if(!ele["on" + type]){
                    ele["on" + type] = handler;
                }
            },
            remove : function(ele, type, handler){
                var i;
                if(!ele){
                    console.log("Event.remove argument ele error.");
                    return;
                }
                if(!Type.isStr(type)){
                    console.log("Event.remove argument type error.");
                    return;
                }
                if(type.indexOf(" ") > -1){
                    type = type.split(" ");
                    for(i = type.length - 1; i >= 0; i -= 1){
                        Event.remove(ele, type[i], handler);
                    }
                }
                if(ele.removeEventListener){
                    ele.removeEventListener(type, handler, false);
                }else if(ele.detachEvent){
                    ele.detachEvent("on" + type, handler);
                }else if(!ele["on" + type]){
                    delete ele["on" + type];
                }
            }
        },
        Ajax = (function(){
            var getXhr = function(){
                    if(window.XMLHttpRequest){
                        return new window.XMLHttpRequest();
                    }else{
                        try{
                            return new window.ActiveXObject( "Microsoft.XMLHTTP" );
                        }catch(e){}
                    }
                },
                getOrPost = function(name, url, data, handler){
                    var xhr = getXhr();
                    if(!xhr){
                        handler("error");
                        return;
                    }
                    xhr.open(name, url, false);
                    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
                    xhr.onreadystatechange = function(){
                        if(xhr.readyState === 4 && xhr.status === 200){
                            handler(xhr.responseText);
                        }else{
                            handler("error");
                        }
                    };
                    xhr.send(data);
                };
            return {
                get : function(url, handler){
                    getOrPost("GET", url, null, handler);
                },
                post : function(url, data, handler){
                    getOrPost("POST", url, data, handler);
                }
            };
        })(),
        Cache = (function(){
            var storage = window.localStorage,
                userData = false,
                name = window.location.hostname;
            if(!storage){
                try{
                    userData = document.createElement('input');
                    userData.type = "hidden";
                    //userData.style.behavior = "url('#default#userData')" ;
                    userData.addBehavior ("#default#userData");
                    window.setTimeout(function(){
                        if(document.body){
                            document.body.appendChild(userData);
                        }else{
                            window.setTimeout(arguments.callee, 13);
                        }
                    }, 0);
                }catch(e){
                    userData = false;
                }
            }
            return {
                get : function(key){
                    if(storage){
                        return storage.getItem(key);
                    }else if(userData){
                        userData.load(name);
                        return userData.getAttribute(key);
                    }
                },
                set : function(key, value, expires){
                    if(storage){
                        storage.setItem(key, value);
                    }else if(userData){
                        userData.load(name);
                        userData.setAttribute(key, value);
                        if(!expires){
                            expires = new Date();
                            expires.setDate(expires.getDate() + 365);
                        }
                        userData.expires = expires.toUTCString();
                        userData.save(name);
                    }
                }
            };
        })(),
        dataList = [],
        AutoComplete = function(option){
            var i, arr = ["target", "ajaxUrl", "paramName", "ulClass", "callBack", "staticData"];
            this.target = false;    //目标输入框
            this.ajaxUrl = false;    //ajax请求的地址
            this.paramName = false;    //ajax请求的url参数名
            this.ulClass = "autoComplete";    //显示提示信息ul的class
            this.callBack = false;    //用户选择的回调函数
            this.staticData = false;//静态数据，如果给了这个参数的话，将不是有ajax获取数据
            this.ul = false;        //用于显示提示的dom对象
            this.preValue = "";        //上一次输入框的内容
            this.preText = "";        //当前显示数据的前缀
            this.currentData = false;//当前显示的数据
            
            for(i = arr.length - 1; i >= 0; i -= 1){
                if(option.hasOwnProperty(arr[i])){
                    this[arr[i]] = option[arr[i]];
                }
            }
            
            if(Type.isStr(this.target)){
                this.target = document.getElementById(this.target);
            }
            if(!this.target || !this.target.nodeName || this.target.nodeName.toUpperCase() !== "INPUT"){
                throw("arguments error");
            }
            
            if(this.staticData && Type.isArray(this.staticData.data)){
                this.staticData = this.staticData.data;
            }
            
            this.target.setAttribute("autoCompleteId", dataList.length);
            dataList.push(this);
            Event.add(this.target, "change keyup paste", this.inputHandler);
        };
    /**
    * @description 比较两个提示信息是否相同
    * @paramName {objext} a,b
    */
    AutoComplete.dataCompare = function(a, b){
        return a.text === b.text;
    };
    /**
    * @description 获取历史选择，返回数组
    * @param {String} inputStr 当前内容
    */
    AutoComplete.getHistoryChoice = function(inputStr){
        var historyData = Cache.get("suggest"),
            ret = [],
            i, l;
        if(historyData){
            historyData = historyData ? JSON.parse(historyData) : [];
            for(i = 0, l = historyData.length; i < l; i += 1){
                if(historyData[i].text.indexOf(inputStr) > -1){
                    ret.push(historyData[i]);
                }
            }
        }
        return ret;
    };
    /**
    * @description将当前选择添加到历史记录中，value可以是字符串或者data对象
    * @param {Object, String} value 当前选择的记录
    */
    AutoComplete.addHistoryChoice = function(value){
        var historyData = Cache.get("suggest");
        historyData = historyData ? JSON.parse(historyData) : [];
        if(Type.isStr(value)){
            value = ({ "text" : value });
        }
        if(inArray(historyData, value, AutoComplete.dataCompare) > -1){
            return;
        }else{
            historyData.push(value);
            Cache.set("suggest", JSON.stringify(historyData));
        }
    };
    /**
    * @description对用户输入的处理函数
    * @param {Object} e 事件对象
    */
    AutoComplete.prototype.inputHandler = function(e){
        var target = e.target || e.srcElement,
            ac = dataList[target.getAttribute("autoCompleteId")],
            value = target.value,
            url;
        if(value && value !== ac.preValue){
            ac.preValue = value;
        }else if(!value && ac.ul){
            css(ac.ul, "display", "none");
            return;
        }else{
            return;
        }
        if(!ac.staticData){
            url = ac.ajaxUrl + (ac.ajaxUrl.indexOf("?") > -1 ? "&" : "?") + ac.paramName + "=" + encodeURIComponent(value);
            Ajax.get(url, function(data){
                if(!data || data === "error"){
                    data = [];
                }else{
                    data = window.JSON.parse(data);
                }
                ac.showSuggest(data.data || data);
            });
        }else{
            ac.showSuggest(ac.getDataFromStaticData());
        }
    };
    /**
    * @description 从静态数据中获取提示信息列表
    */
    AutoComplete.prototype.getDataFromStaticData = function(){
        var i, value = this.target.value,
            result = [];
        
        for(i = this.staticData.length - 1; i >= 0; i -= 1){
            if(this.staticData[i].text.indexOf(value) > -1){
                result.push(this.staticData[i]);
            }
        }
        return result;
    };
    /**
    * @description将推荐输入显示在输入框下
    * @param {Array} data 要显示的数据
    */
    AutoComplete.prototype.showSuggest = function(data){
        var ac = this,
            target = ac.target,
            parent = target.parentNode,
            inputStr = ac.target.value,
            top, left, i, len,
            result;
        if(!inputStr && ac.ul){
            css(ac.ul, "display", "none");
            return;
        }
        if(!ac.ul){
            ac.ul = document.createElement("ul");
            top = (target.offsetParent.offsetTop || 0) +
                (target.offsetTop || 0) +
                (parseInt(css(target, "marginTop"), 10) || 0) +
                (parseInt(css(target, "paddingTop"), 10) || 0) +
                (parseInt(css(target, "height"), 10) || 0) +
                (parseInt(css(target, "paddingBottom"), 10) || 0) +
                (parseInt(css(target, "borderTopWidth"), 10) || 0);
            left = (target.offsetParent.offsetLeft || 0) +
                (target.offsetLeft || 0) +
                (parseInt(css(target, "marginLeft"), 10) || 0);
            
            css(ac.ul, {
                position : "absolute",
                top : top + "px",
                left : left + "px",
                zIndex : "999"
            });
            ac.ul.className = ac.ulClass;
            parent.appendChild(ac.ul);
            
            Event.add(document, "click", function(e){
                var ele = e.target || e.srcElement;
                if(ele && (ele.parentNode === ac.ul || ele.parentNode.parentNode === ac.ul)){
                    if(ele.nodeName.toUpperCase() === "SPAN"){
                        ele = ele.parentNode;
                    }
                    ac.selectHandler(ele);
                }else if(ele !== ac.target){
                    css(ac.ul, "display", "none");
                }
            });
            Event.add(document, "keydown", function(e){//esc 按钮
                if(e.keyCode === 27 && css(ac.ul, "display") !== "none"){
                    css(ac.ul, "display", "none");
                    e.returnValue = false;
                    if(e.preventDefault){
                        e.preventDefault();
                    }
                }
            });
            Event.add(target, "keydown", function(e){
                var liList,
                    cssArray, i, l,
                    key = e.keyCode;
                if(key !== 40 && key !== 38 && key !== 13){
                    return;
                }
                liList = ac.ul.getElementsByTagName("li");
                l = liList.length;
                for(i = l - 1; i >= 0; i -= 1){
                    cssArray = liList[i].className.split(" ");
                    if(inArray(cssArray, "cur") > -1){
                        if(key === 13){
                            ac.selectHandler(liList[i]);
                            return;
                        }
                        liList[i].className = removeFromArray(cssArray, "cur").join(" ");
                        break;
                    }
                }
                if(key === 13){
                    return;
                }
                i = key === 40 ? (i + 1) % liList.length : (i - 1 >= 0 ? i - 1 : l - 1);
                liList[i].className = liList[i].className + " cur";
            });
        }
        css(ac.ul, "display", "block");
        result = AutoComplete.getHistoryChoice(inputStr);
        for(i = 0, len = data.length; i < len; i += 1){
            if(inArray(result, data[i], AutoComplete.dataCompare) === -1){
                result.push(data[i]);
            }
        }
        ac.preText = "";
        if(result.length > 0){
            ac.ul.innerHTML = ac.createHtml(result, inputStr);
        }else{
            ac.ul.innerHTML = "";
            css(ac.ul, "display", "none");
        }
    };
    /**
    * @decription 鼠标点击了下拉列表或者输入框中按回车即确认选择，此函数为选择处理
    * @param {dom} li 用户选择的li
    */
    AutoComplete.prototype.selectHandler = function(li){
        var i, value = li.getAttribute("value"),
            preText = this.preText,
            cData = this.currentData,
            inputEle = this.target,
            flag = false;
        if(inArray(li.className.split(" "), "more") > -1){
            for(i = cData.length - 1; i >= 0; i -= 1){
                if(cData[i].text === value){
                    break;
                }
            }
            if(i > -1){
                this.preText = preText + cData[i].text;
                this.ul.innerHTML = this.createHtml(cData[i].children, value);
            }
        }else{
            flag = true;
            css(this.ul, "display", "none");
        }
        inputEle.value = preText + value;
        i = inArray(cData, { "text" : value }, AutoComplete.dataCompare);
        if(i > -1){
            cData[i].text = preText + value;
            AutoComplete.addHistoryChoice(cData[i]);
        }else{
            AutoComplete.addHistoryChoice(inputEle.value);
        }
        this.preValue = inputEle.value;
        if(flag && this.callBack){
            this.callBack(this.preValue);
        }
    };
    /**
    * @decription 根据data创建li列表，不包含ul，并修改当前数据
    * @param {Array} data 数据
    * @param {String} haveInput 当前输入框内容
    */
    AutoComplete.prototype.createHtml = function(data, haveInput){
        var result = [],
            i, l, className = '';
        for(i = 0, l = data.length; i < l; i += 1){
            className = '';
            result.push("<li value=\"", data[i].text, "\" class=\"");
            if(data[i].children){
                className += " more";
                if(data !== this.currentData){
                    this.currentData = data;
                }
            }
            if(i === 0){
                className += " cur";
            }
            result.push(className, "\">");
            result.push(data[i].text.replace(haveInput, "<span>" + haveInput + "</span>"));
            result.push("</li>");
        }
        return result.join("");
    };
    
    //如果浏览器不支持JSON，就加载json2.js来处理json数据
    if(!window.JSON || !window.JSON.parse){
        loadScript("./js/json2.js");
    }
    //将自动完成接口提供给外部
    window.autoComplete = function(option){
        new AutoComplete(option);
    };
})(window);