/** @file       languageWindow.js
  * @brief      設定視窗管理.
  * @author     OreoLi
  * @date       2019/03/04 11:53 */

  cc.Class({
    extends: cc.Component,

    properties: {
        Layout_node:cc.Node,                    //背景防點擊的layout節點
        Content_node:cc.Node,                   //背景節點
        BtnClose_node:cc.Node,                  //關閉視窗按鈕節點
        BtnEnter_node:cc.Node,                  //確認按鈕節點
        
        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    {default: null, type: cc.AudioClip},        //按鈕點擊音效載入
    },
      
    ctor: function() { 
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.MusicOX_checked    = false;        //預設 音樂是否核選
        this.EffectOX_checked   = false;        //預設 音效是否核選
    },

    /** 
     * [設定畫面初始化]
     * */
    Init: function(){
        if(this.DebugMode) {console.log("%c[languageWindow] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.node.active                = false;    //關閉 主節點，等動畫觸發才開啟
        this.Layout_node.active         = true;     //開啟 背景防點擊的layout節點
        this.BtnClose_node.active       = false;    //關閉 關閉按鈕節點
        this.Content_node.active        = false;    //關閉 主要內容節點
        
        //按鈕初始化
        for(var cCount = 0 ; cCount < this.Content_node.children.length ; cCount++){
            if(this.Content_node.children[cCount].name == 'title') continue;
            
            if(this.Content_node.children[cCount].name.match('off')!=null){
                this.Content_node.children[cCount].active   = false;
            }

            if(this.Content_node.children[cCount].name.match('on')!=null){
                this.Content_node.children[cCount].active   = true;
            }
        }

        //取得當前語系
        let _Language = cc.sys.localStorage.getItem("Language");
        if(!_Language || _Language == "") {
            _Language = 'cn';
        }
        this.Content_node.getChildByName("btn_"+_Language+"_off").active    = true;
        this.Content_node.getChildByName("btn_"+_Language+"_on").active     = false;
    },

    /** 
     * [開啟視窗動畫]
     * */
    OpenAnim: function(){
        if(this.DebugMode) {console.log("%c[languageWindow] => [OpenAnim] in action.",'color:'+this.DebugModeColor_FA);}
        
        let self = this;    
        this.Content_node.scale    = cc.module.jsonFile['SystemPanel']['WindowAnim']['OriginalScale'];
        this.Content_node.active   = true;
        this.node.active = true;
         
        var finishedFunc = cc.callFunc(function() {    
            self.BtnClose_node.active = true;
            if(typeof(_cb) == "function"){   //若cb是function才做
                _cb();
            }
        });

        let _Action = cc.sequence(
                        cc.scaleTo(cc.module.jsonFile['SystemPanel']['WindowAnim']['Scale01']['sAnimTime'],cc.module.jsonFile['SystemPanel']['WindowAnim']['Scale01']['sTo']),
                        cc.scaleTo(cc.module.jsonFile['SystemPanel']['WindowAnim']['Scale02']['sAnimTime'],cc.module.jsonFile['SystemPanel']['WindowAnim']['Scale02']['sTo']),
                        finishedFunc);//動畫動作
        _Action.easing(cc.easeSineOut(cc.module.jsonFile['SystemPanel']['WindowAnim']['EaseSineOut'])); //啟用 緩速時間曲線
        this.Content_node.runAction(_Action);                                                               //啟用 動畫
    },

    /** 
     * [關閉視窗]
     */
    BtnClose: function(){
        if(this.DebugMode) {console.log("%c[languageWindow] => [BtnClose] in action.",'color:'+this.DebugModeColor_FA);}
        cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效
        this.node.active = false;
    },

    /**
     * [點擊切換語言按鈕]
     * 尚未送出，僅切換按鈕而已
     * @param {obj}     event   點擊對象 
     * @param {string}  _State  要切換的語系 {'cn','en','tw'}
     */
    BtnChangeLanguage: function(event,_State){
        if(this.DebugMode) {console.log("%c[languageWindow] => [BtnChangeLanguage] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效

        //按鈕初始化
        for(var cCount = 0 ; cCount < this.Content_node.children.length ; cCount++){
            if(this.Content_node.children[cCount].name == 'title') continue;
            
            if(this.Content_node.children[cCount].name.match('off')!=null){
                this.Content_node.children[cCount].active   = false;
            }

            if(this.Content_node.children[cCount].name.match('on')!=null){
                this.Content_node.children[cCount].active   = true;
            }
        }

        this.Content_node.getChildByName("btn_"+_State+"_off").active    = true;
        this.Content_node.getChildByName("btn_"+_State+"_on").active     = false;
    },

    /**
     * [確認當前選擇語言]
     */
    BtnEnter: function(){
        if(this.DebugMode) {console.log("%c[languageWindow] => [BtnEnter] in action.",'color:'+this.DebugModeColor_FA);}

        //按鈕初始化
        for(var cCount = 0 ; cCount < this.Content_node.children.length ; cCount++){
            if(this.Content_node.children[cCount].name == 'title') continue;
            
            if( this.Content_node.children[cCount].name.match('off')!=null &&
                this.Content_node.children[cCount].active){

                let _NameArr    = this.Content_node.children[cCount].name.split("_");
                let _Language   = _NameArr[1];
                cc.sys.localStorage.setItem("Language",_Language); 
                cc.module.network.DestroyReConnect();
            }
        }
    },
});
