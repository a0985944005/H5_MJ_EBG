/** @file       tool.js
  * @brief      應用工具模組.
  * @author     OreoLi
  * @date       2019/02/24 20:02 */

  cc.Class({
    extends: cc.Component,

    ctor(){
        this.DebugMode              = false;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
        
        this.curDR;                             //螢幕原始分辨率
        this.Canvas;                            //目前的場景資訊
	},

    /** 
     * [產生min到max之間的亂數]
     * min >= number >= max
     * */
    getRandom: function(min,max){
        return Math.floor(Math.random()*(max-min+1))+min;
    },

    /** 
     * [取得小數點後第幾位] 
     * @param   {float}     num     傳入數值
     * @param   {int}       pos     需要進位的位數
     * 
     * @return  {float}     取得第幾位後的小數點數值
     */
    formatFloat: function (num, pos) {
        if(this.DebugMode) {console.log("%c [tools].js] formatFloat.",'color:'+this.DebugModeColor_FA);}

        var size = Math.pow(10, pos);
        return Math.round(parseFloat(num) * size) / size;
    },

    /** 
     * [取得小數點後第幾位] 
     * @param   {float}     num     傳入數值
     * @param   {int}       pos     需要進位的位數
     * 
     * @return  {string}    取得第幾位後的小數點數值，並且補零
    */
    formatFloatToFixed: function (num, pos) {
        if(this.DebugMode) {console.log("%c [tools].js] formatFloatToFixed.",'color:'+this.DebugModeColor_FA);}

        var size = Math.pow(10, pos);
        return (Math.round(parseFloat(num) * size) / size).toFixed(pos);
    },

    /** 
     * [取得小數點後第幾位] 
     * @param   {float}     num     傳入數值
     * @param   {int}       pos     需要進位的位數
     * 
     * @return  {string}    取得第幾位後的小數點數值，補零並且補上逗號
    */
    formatFloatToFixedToPoint: function(num, pos) {

        var size = Math.pow(10, pos);
        var str  = (Math.round(parseFloat(num) * size) / size).toFixed(pos) + "";

        // 決定三個位數的分隔符號
        var glue = ',';
        var digits = str.toString().split('.'); // 先分左邊跟小數點
        var integerDigits = digits[0].split(""); // 獎整數的部分切割成陣列
        var threeDigits = []; // 用來存放3個位數的陣列
        // 當數字足夠，從後面取出三個位數，轉成字串塞回 threeDigits
        while (integerDigits.length > 3) {
            threeDigits.unshift(integerDigits.splice(integerDigits.length - 3, 3).join(""));
        }
        threeDigits.unshift(integerDigits.join(""));
        digits[0] = threeDigits.join(glue);
        return digits.join(".");
    },

    /** 
     * [位置偏移轉換]
     * @param   {int} userJsonKey   目前使用者在jsonData中的key值
     * @param   {int} SitDownGap    計算出的主角偏移量，例如目前jsonKey 0 ~ 3為目前加入遊戲的4位玩家，主角坐的位置為第0個位置，其該主角jsonKey是 2，故偏移量為 -2，其他的玩家則需要針對主要位置做位移
     * @param   {int} playerSelf    主角目前所坐的位置
     * @param   {int} playUserCount 該遊戲的玩家總人數
     * 
     * @return  {int}    座位
     */
    moveSit: function (userJsonKey,SitDownGap,playerSelf,playUserCount){
        if(this.DebugMode) {console.log("%c [tools].js] moveSit.",'color:'+this.DebugModeColor_FA);}

        let _sitDown = parseFloat(userJsonKey) + SitDownGap;    
        _sitDown = _sitDown < playerSelf ? _sitDown + playUserCount : _sitDown;       //數值負數時修正
        return _sitDown;
    },

    /** 
     * [骰子7轉1]
     * @param   {int}   number  會是數字 "2" ~ "7" 的數字或字串
     * 
     * @return  {int}   回傳數字回去，會是 1~6的數字
     */
    changNumber7TO1: function(number){
        if(this.DebugMode) {console.log("%c [tools].js] changNumber7TO1.",'color:'+this.DebugModeColor_FA);}

        let _number = parseFloat(number);
        _number     = _number == 7 ? 1 : parseFloat(_number);
        return _number;
    },
    
    /** 
     * [骰子1轉7]
    *  @param   {int}   number  會是數字 "1" ~ "6" 的數字或字串
    * 
    *  @return  {int}   回傳數字回去，會是 2~7的數字
    */
    changNumber1TO7: function(number){
        if(this.DebugMode) {console.log("%c [tools].js] changNumber1TO7.",'color:'+this.DebugModeColor_FA);}
        let _number = parseFloat(number);
        _number     = _number == 1 ? 7 : parseFloat(_number);
        return _number;
    },
    
    /** 
     * [取得幾天以前的日期]
     *  @param  {int}       _DateAgo    幾天以前
     * 
     *  @return {string}    回傳時間格是"2019-01-01 00:00:00"
     */
    GetDayAgo: function(_DateAgo){
        if(this.DebugMode) {console.log("%c [tools].js] GetDayAgo.",'color:'+this.DebugModeColor_FA);}

        var _DateAgoObj = new Date();
        _DateAgoObj.setDate(_DateAgoObj.getDate() - parseFloat(_DateAgo));

        let _Year       = _DateAgoObj.getFullYear();
        let _Month      = (parseFloat(_DateAgoObj.getMonth())+1) < 10      ? "0"+(parseFloat(_DateAgoObj.getMonth())+1)   : (parseFloat(_DateAgoObj.getMonth())+1);
        let _Date       = _DateAgoObj.getDate() < 10                       ? "0"+_DateAgoObj.getDate()                    : _DateAgoObj.getDate();
        return _Year + "-" + _Month + "-" + _Date + " 00:00:00";
    },

    /** 
     * [取得本日DateTime]
     *
     * @return {string}    回傳時間格是"2019-01-01 00:00:00"*/
    GetNowDateTime: function(){
        if(this.DebugMode) {console.log("%c [tools].js] GetNowDateTime.",'color:'+this.DebugModeColor_FA);}

        let _nowTime    = new Date();
        let _Year       = _nowTime.getFullYear();
        let _Month      = (parseFloat(_nowTime.getMonth())+1) < 10      ? "0"+(parseFloat(_nowTime.getMonth())+1)   : (parseFloat(_nowTime.getMonth())+1);
        let _Date       = _nowTime.getDate() < 10                       ? "0"+_nowTime.getDate()                    : _nowTime.getDate();
        let _Hours      = _nowTime.getHours() < 10                      ? "0"+_nowTime.getHours()                   : _nowTime.getHours();
        let _Minutes    = _nowTime.getMinutes() < 10                    ? "0"+_nowTime.getMinutes()                 : _nowTime.getMinutes();
        let _Seconds    = _nowTime.getSeconds() < 10                    ? "0"+_nowTime.getSeconds()                 : _nowTime.getSeconds();
        let _DataTime   = _Year + "-" + _Month + "-" + _Date + " " + _Hours + ":" + _Minutes + ":" + _Seconds;

        return _DataTime;
    },

    /** 
     * [datetime转换成timestamp] 
     * @param   {string}    time    datetime格式 EX: "2015-08-09 08:01:36:789"
     * 
     * @return  {string}    timestamp格式 EX: "1439078496789"
    */
    Datetime2timeStamp: function(time){
        if(this.DebugMode) {console.log("%c [tools].js] Datetime2timeStamp.",'color:'+this.DebugModeColor_FA);}
        var newDate = time.replace(/-/g,'/'); // 變成"2012/01/01 12:30:10";
        var d = new Date(newDate);
        var timestamp=Math.round(d.getTime());
        return (timestamp+"").substr(0,10);
    },
    
    /** 
     * [timestamp转换成datetime] 
     * @param   {strubg}    time    timestamp格式 EX: "1439078496789"
     * 
     * @return  {string}    datetime格式 EX: "2015-08-09 08:01:36:789"
     * */
    timeStamp2Datetime: function (time){
        if(this.DebugMode) {console.log("%c [tools].js] timeStamp2Datetime.",'color:'+this.DebugModeColor_FA);}
        var datetime = new Date();
 
        datetime.setTime(time);
        var year        = datetime.getFullYear();
        var month       = this._patch0(datetime.getMonth() + 1);
        var date        = this._patch0(datetime.getDate());
        var hour        = this._patch0(datetime.getHours()); 
        var minute      = this._patch0(datetime.getMinutes());
        var second      = this._patch0(datetime.getSeconds());
        var mseconds    = datetime.getMilliseconds();
        return year + "-" + month + "-" + date+" "+hour+":"+minute+":"+second+"."+mseconds;
    },
    
    /**
     * [骰子牌型確認] 
     * @param {bool}    Is7Wild     1點是否還是任意數
     * @param {array}   _Hands      手牌陣列
     */
    checkDiceType(Is7Wild,_Hands){
        var minPoint = 10,minPointKey = 0,checkLeopard = true,checkStraight = true,StraightObj={"2":0,"3":0,"4":0,"5":0,"6":0,"7":0};
        var returnObj = {"checkLeopard":false,"checkStraight":false};
        //先取得最小值的點數 2 ~ 7
        for(var HCount = 0 ; HCount < _Hands.length ; HCount++){
            if(parseFloat(_Hands[HCount]) < minPoint) {
                minPoint    = parseFloat(_Hands[HCount]);
                minPointKey = HCount;
            }
            StraightObj[_Hands[HCount]] += 1;
        }

        //判斷豹子
        for(var HCount = 0 ; HCount < _Hands.length ; HCount++){
            if(HCount == minPointKey) continue;

            if(minPoint != parseFloat(_Hands[HCount])){
                if(!(parseFloat(_Hands[HCount]) == 7 && Is7Wild)){
                    checkLeopard = false;
                    break;
                }
            }
        }

        //判斷順子
        for(var Skey in StraightObj){
            if(StraightObj[Skey] > 1) {
            checkStraight = false;
            break;
            }
        }
        returnObj['checkLeopard']   = checkLeopard;
        returnObj['checkStraight']  = checkStraight;

        return returnObj;
    },

    /** 
     * [數值補0用]
     * @param {string}  val     傳進來的數值可能是string也可能是int     
    */
    _patch0 : function(val){
        return parseFloat(val) < 10 ? "0"+val : val;
    },

    /** 
     * [瀏覽器類型] 
     * */
    GetBrowserType : function(){ 
        if(this.DebugMode) {console.log("%c [tools].js] GetBrowserType.",'color:'+this.DebugModeColor_FA);}
        var ua = window.navigator.userAgent; 
        var isIE = window.ActiveXObject != undefined && ua.indexOf("MSIE") != -1 || ua.indexOf(".NET CLR") != -1 || ua.indexOf(".NET") != -1;
        var isFirefox = ua.indexOf("Firefox") != -1;
        var isOpera = window.opr != undefined;
        var isEdge = ua.indexOf("Edge") != -1;
        var isChrome = ua.indexOf("Chrome") && window.chrome;
        var isSafari = ua.indexOf("Safari") != -1 && ua.indexOf("Version") != -1;
        if (isIE) {
            return "IE";
        } else if (isFirefox) {
            return "Firefox";
        } else if (isOpera) {
            return "Opera";
        } else if (isEdge)  {
            return "Edge"; 
        } else if (isChrome) {
            return "Chrome";
        } else if (isSafari) {
            return "Safari";
        } else {
            return ua;
        }
        // this.SystemPanel_node.getChildByName("Android").getComponent(cc.Label).string = "Android: " + navigator.userAgent.match(/Android/i);
        // this.SystemPanel_node.getChildByName("BlackBerry").getComponent(cc.Label).string = "BlackBerry: " + navigator.userAgent.match(/BlackBerry/i);
        // this.SystemPanel_node.getChildByName("iPhone").getComponent(cc.Label).string = "iPhone: " + navigator.userAgent.match(/iPhone|iPad|iPod/i);

        // var os = function (){  
        //     var ua = navigator.userAgent,  
        //     isWindowsPhone = /(?:Windows Phone)/.test(ua),  
        //     isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone,  
        //     isAndroid = /(?:Android)/.test(ua),  
        //     isFireFox = /(?:Firefox)/.test(ua),  
        //     isChrome = /(?:Chrome|CriOS)/.test(navigator.userAgent),  
        //     isTablet = /(?:iPad|PlayBook)/.test(ua) || (isAndroid && !/(?:Mobile)/.test(ua)) || (isFireFox && /(?:Tablet)/.test(ua)),  
        //     isPhone = /(?:iPhone)/.test(ua) && !isTablet,  
        //     isPc = !isPhone && !isAndroid && !isSymbian;  
        //     return {  
        //         isTablet: isTablet,  
        //         isPhone: isPhone,   
        //         isAndroid: isAndroid,  
        //         isPc: isPc   
        //     };    
        // }();   

        // console.log(cc.module.tools.GetBrowserType());
        // console.log(navigator.userAgent);
        // console.log(os.isTablet);

        // sys.browserType = sys.BROWSER_TYPE_UNKNOWN;
        // /* Determine the browser type */
        // (function(){
        //     var typeReg1 = /mqqbrowser|micromessenger|qq|sogou|qzone|liebao|maxthon|ucbs|360 aphone|360browser|baiduboxapp|baidubrowser|maxthon|mxbrowser|miuibrowser/i;
        //     var typeReg2 = /qqbrowser|ucbrowser/i;
        //     var typeReg3 = /chrome|safari|firefox|trident|opera|opr\/|oupeng/i;
        //     var browserTypes = typeReg1.exec(ua);
        //     if(!browserTypes) browserTypes = typeReg2.exec(ua);
        //     if(!browserTypes) browserTypes = typeReg3.exec(ua);

        //     var browserType = browserTypes ? browserTypes[0].toLowerCase() : sys.BROWSER_TYPE_UNKNOWN;
        //     if (CC_WECHATGAME)
        //         browserType = sys.BROWSER_TYPE_WECHAT_GAME;
        //     else if (CC_QQPLAY)
        //         browserType = sys.BROWSER_TYPE_QQ_PLAY;
        //     else if (browserType === 'micromessenger')
        //         browserType = sys.BROWSER_TYPE_WECHAT;
        //     else if (browserType === "safari" && isAndroid)
        //         browserType = sys.BROWSER_TYPE_ANDROID;
        //     else if (browserType === "qq" && ua.match(/android.*applewebkit/i))
        //         browserType = sys.BROWSER_TYPE_ANDROID;
        //     else if (browserType === "trident")
        //         browserType = sys.BROWSER_TYPE_IE;
        //     else if (browserType === "360 aphone")
        //         browserType = sys.BROWSER_TYPE_360;
        //     else if (browserType === "mxbrowser")
        //         browserType = sys.BROWSER_TYPE_MAXTHON;
        //     else if (browserType === "opr/")
        //         browserType = sys.BROWSER_TYPE_OPERA;

        //     sys.browserType = browserType;
        // })();
    },

    /** 
     * [裝置類型] 
     * */
    GetDeviceType: function(){
        if(this.DebugMode) {console.log("%c [tools].js] GetDeviceType.",'color:'+this.DebugModeColor_FA);}
        if(cc.sys.isMobile) { //若為行動裝置，還需要再判斷是否為平板
            var os = function (){  
                var ua = navigator.userAgent,  
                isAndroid = /(?:Android)/.test(ua),  
                isFireFox = /(?:Firefox)/.test(ua),   
                isTablet = /(?:iPad|PlayBook)/.test(ua) || (isAndroid && !/(?:Mobile)/.test(ua)) || (isFireFox && /(?:Tablet)/.test(ua));  
                return { isTablet: isTablet };    
            }();   

            if(os.isTablet) {
                return "Tablet";    //平板
            } else {
                return "Phone";     //手機
            }
        } else {
            if(cc.sys.isBrowser) {
                return "PC";        //電腦瀏覽器
            } else {
                return "Unknow";    //未知
            }
        }
    },

    /** 
     * [取得可視範圍]
     * */
    GetWinVisible: function(){
        if(this.DebugMode) {console.log("%c [tools].js] GetWinVisible.",'color:'+this.DebugModeColor_FA);}
        // this.systemInfo.getChildByName("infoPanel").getChildByName("lblWinHeight").getComponent(cc.Label).string = "WinHeight: " + Math.round(cc.winSize.height * 100) / 100;
        // this.systemInfo.getChildByName("infoPanel").getChildByName("lblWinWidth").getComponent(cc.Label).string = "WinWidth: " + Math.round(cc.winSize.width * 100) / 100;
        // this.systemInfo.getChildByName("infoPanel").getChildByName("lblVisibleHeight").getComponent(cc.Label).string = "VisibleHeight: " + Math.round(cc.view.getFrameSize().height * 100) / 100;
        // this.systemInfo.getChildByName("infoPanel").getChildByName("lblVisibleWidth").getComponent(cc.Label).string = "VisibleWidth: " + Math.round(cc.view.getFrameSize().width * 100) / 100;
    },

    /**
     * [監聽畫面解析度更動]
     * @param {obj} cvs 場景canvas資訊
     */
    windowOnResize: function(cvs){
        this.Canvas = cvs;
        window.onresize = function () {
            this.resize(this.Canvas);
        }.bind(this);
        this.resize(this.Canvas);
    },

    /** 
     * [重新調適分辨率]
     * @param {obj} cvs 場景canvas資訊
     * */
    resize(cvs) {
        // console.log(cvs);
        // console.log(cvs.designResolution);
        //保存原始设计分辨率，供屏幕大小变化时使用
        if(!this.curDR){
            this.curDR = cvs.designResolution;
        }
        // console.log("-------");
        // console.log(this.curDR);
        var dr = this.curDR;
        var s = cc.view.getFrameSize();
        // console.log(s);
        // console.log("-------");
        var rw = s.width;
        var rh = s.height;
        var finalW = rw;
        var finalH = rh;

        if((rw/rh) > (dr.width / dr.height)){
            //!#zh: 是否优先将设计分辨率高度撑满视图高度。 */
            //cvs.fitHeight = true;
            
            //如果更长，则用定高
            finalH = dr.height;
            finalW = finalH * rw/rh;
        }
        else{
            /*!#zh: 是否优先将设计分辨率宽度撑满视图宽度。 */
            //cvs.fitWidth = true;
            //如果更短，则用定宽
            finalW = dr.width;
            finalH = rh/rw * finalW;
        }
        cvs.designResolution = cc.size(finalW, finalH);
        cvs.node.width = finalW;
        cvs.node.height = finalH;
        // cvs.node.emit('resize');
    },

    
    /**
     * [一鍵複製代碼]
     * @param {*} _Str 複製字串
     */
    WebCopyString: function(_Str){
        const el = document.createElement('textarea');
        el.value = _Str;
        el.setAttribute('readonly', '');
        el.style.contain = 'strict';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.fontSize = '12pt'; // Prevent zooming on iOS

        const selection = getSelection();
        var originalRange = false;
        if (selection.rangeCount > 0) {
            originalRange = selection.getRangeAt(0);
        }
        document.body.appendChild(el);
        el.select();
        el.selectionStart = 0;
        el.selectionEnd = _Str.length;

        var success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) {}

        document.body.removeChild(el);

        if (originalRange) {
            selection.removeAllRanges();
            selection.addRange(originalRange);
        }

        return success;
    },

    /**
     * [動態加載龍骨]
     * @param {bool}        _state              是否於載入後直接開啟動畫，若為false則會將傳入的_Node.active關閉
     * @param {obj}         _node               載入節點
     * @param {string}      _path               龍骨位址 e.g. "images/dragonbones/start_win_lose" ，該路徑為resources底下
     * @param {string}      _animactionName     動畫名稱
     * @param {int}         _playTimes          播放次數 -1是根據龍骨文件 0五險循環 >0是播放次數
     * @param {string}      _eventObject        事件類型 {目前基本上只會用到Start或Complete}
     * @param {function}    _cb                 當動畫完成時的回調方法，
     * 
     ** @param armatureName      Armature名稱
     ** @param animationDisplay  龍骨組件
     ** @param newAnimation      Animation名稱
     ** @param completeCallback  動畫播放完畢的回調
     */ 
    loadDragonBones(_state, _node,_path, _animactionName, _playTimes = -1,_eventObject ,_cb) { 
        if(this.DebugMode) {console.log("%c[tools.js] => [loadDragonBones] in action.",'color:'+this.DebugModeColor_FA);}

        let animationDisplay        = _node.getComponent(dragonBones.ArmatureDisplay);
        animationDisplay.enabled    = false;
        cc.loader.loadResDir(_path, function(err, assets){
            
            if(err || assets.length <= 0)  {
                console.log("Error:",err);
                console.log("assets.length:",assets.length);
                return;
            }
            assets.forEach(asset => {
                if(asset instanceof dragonBones.DragonBonesAsset){
                    animationDisplay.dragonAsset = asset;
                }
                if(asset instanceof dragonBones.DragonBonesAtlasAsset){
                    animationDisplay.dragonAtlasAsset  = asset;
                }
            });

            animationDisplay.armatureName = "Armature";
            if(_state)  animationDisplay.playAnimation(_animactionName, _playTimes);    //會加入_state判斷，是因為若單一節點需要預先異步加載不同資源，此時會報錯

            _node.active                = _state;
            animationDisplay.enabled    = _state;
            
            let _finelFunc = function(){
                if(typeof(_cb) == "function") {
                    _cb();
                }
            }

            // 動畫撥放事件
            // dragonBones.EventObject.START 动画开始播放。
            // dragonBones.EventObject.LOOP_COMPLETE 动画循环播放完成一次。
            // dragonBones.EventObject.COMPLETE 动画播放完成。
            // dragonBones.EventObject.FADE_IN 动画淡入开始。
            // dragonBones.EventObject.FADE_IN_COMPLETE 动画淡入完成。
            // dragonBones.EventObject.FADE_OUT 动画淡出开始。
            // dragonBones.EventObject.FADE_OUT_COMPLETE 动画淡出完成。
            // dragonBones.EventObject.FRAME_EVENT 动画帧事件。
            // dragonBones.EventObject.SOUND_EVENT 动画帧声音事件。
            switch (_eventObject.toLowerCase()){
                default:
                case "complete":    _eventObject = dragonBones.EventObject.COMPLETE;    break;
                case "start":       _eventObject = dragonBones.EventObject.START;       break;
            }
            animationDisplay.addEventListener(_eventObject, _finelFunc);
        })
    },

    /**
     * [預加載龍骨]
     * @param {string}      _path               龍骨位址 e.g. "images/dragonbones/start_win_lose" ，該路徑為resources底下
     */
    loadDragonBonesAsset: function(_path){
        if(this.DebugMode) {console.log("%c[tools.js] => [loadDragonBonesAsset] in action.",'color:'+this.DebugModeColor_FA);}
        cc.loader.loadResDir(_path, function(err, assets){
            if(err || assets.length <= 0)  {
                console.log("Error:",err);
                console.log("assets.length:",assets.length);
                return;
            }
        })
    },
});
