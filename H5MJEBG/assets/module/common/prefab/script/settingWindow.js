/** @file       settingWindown.js
  * @brief      設定視窗管理.
  * @author     OreoLi
  * @date       2019/03/04 11:53 */

  cc.Class({
    extends: cc.Component,

    properties: {
        Layout_node:cc.Node,                    //背景防點擊的layout節點
        Content_node:cc.Node,                   //背景節點
        BtnClose_node:cc.Node,                  //關閉視窗按鈕節點
        
        MusicOX_node:cc.Node,                   //音樂開關節點
        EffectOX_node:cc.Node,                  //音效開關節點
        Music_slider:cc.Slider,                 //音量調節
        Music_progressBar:cc.ProgressBar,       //音量進度條控制
        Effect_slider:cc.Slider,                //音效調節
        Effect_progressBar:cc.ProgressBar,      //音效進度條控制

        Version:cc.Label,                       //版本號資訊顯示label
        
        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    {default: null, type: cc.AudioClip},        //按鈕點擊音效載入
    },
      
    ctor: function() { 
        this.DebugMode              = false;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.MusicOX_checked    = false;        //預設 音樂是否核選
        this.EffectOX_checked   = false;        //預設 音效是否核選
    },

    /** 
     * [設定畫面初始化]
     * @param {string} _Version 版本號
     * */
    Init: function(_Version){
        if(this.DebugMode) {console.log("%c[settingWindown] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.node.active                = false;    //關閉 主節點，等動畫觸發才開啟
        this.Layout_node.active         = true;     //開啟 背景防點擊的layout節點
        this.BtnClose_node.active       = false;    //關閉 關閉按鈕節點
        this.Content_node.active        = false;    //關閉 主要內容節點

        this.MovingSetMusicVol();                                           //叫用音量調節的function
        this.EffectSetMusicVol();                                           //叫用音效調節的function

        //獲取音量以及音效狀態x
        let BGMv = cc.module.audio.getBGMVolume();   //取得音樂大小
        let SFXv = cc.module.audio.getSFXVolume();   //取得音效大小 (0 or 100)

        this.Music_slider.progress          = BGMv;         //音樂拖曳bar
        this.Music_progressBar.progress     = BGMv;         //音樂進度條bar
        this.Effect_slider.progress         = SFXv;         //音效拖曳bar
        this.Effect_progressBar.progress    = SFXv;         //音效進度條bar
        
        if(BGMv != 0) { //音樂開啟
            this.MusicOX_checked            = true;
        } else {        //音樂關閉
            this.MusicOX_checked            = false;
        }
        this._BtnOnOff(this.MusicOX_node,this.MusicOX_checked);

        if(SFXv != 0) { //音效開啟
            this.EffectOX_checked           = true;
        } else {        //音效關閉
            this.EffectOX_checked           = false;
        }
        this._BtnOnOff(this.EffectOX_node,this.EffectOX_checked);
        
        this.Version.string = cc.module.i18n.t("version")+": v"+_Version; //取得版本號資訊並且顯示
    },

    /** 
     * [開啟視窗動畫]
     * */
    OpenAnim: function(){
        if(this.DebugMode) {console.log("%c[settingWindown] => [OpenAnim] in action.",'color:'+this.DebugModeColor_FA);}
        
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
        if(this.DebugMode) {console.log("%c[settingWindown] => [BtnClose] in action.",'color:'+this.DebugModeColor_FA);}
        cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效
        this.node.active = false;
    },

    /** 
     * [滑動音量的SliderBar，直接調節] 
     * */
    MovingSetMusicVol: function(){
        if(this.DebugMode) {console.log("%c[settingWindown] => [MovingSetMusicVol] in action.",'color:'+this.DebugModeColor_FA);}

        //即時調節音量
        this.Music_slider.node.on('slide', function (event) {
            //这里的 event 是一个 EventCustom 对象，你可以通过 event.detail 获取 Slider 组件
            let slider = event;

            this.Music_progressBar.progress = slider.progress; //音樂進度條bar
            cc.module.audio.moveBGMVolume(slider.progress) ;
            
            if(slider.progress == 0){
                this.MusicOX_checked = false;
            } else {
                this.MusicOX_checked = true;
            }
            this._BtnOnOff(this.MusicOX_node,this.MusicOX_checked);

            cc.module.audio.setVolume(slider.progress,this.Effect_slider.progress);
        },this);
    },

    /** 
     * [滑動音效的SliderBar，直接調節] 
     * 需要實現拖曳時，當遇到 %10 == 0 的刻度時，撥放一次音效，用來提示目前音效大小聲
     */
    EffectSetMusicVol: function(){
        if(this.DebugMode) {console.log("%c[settingWindown] => [EffectSetMusicVol] in action.",'color:'+this.DebugModeColor_FA);}

        //即時調節音量
        let _SaveScale = -1;    //判斷當前音量調節刻度，若尚未設定則為-1
        this.Effect_slider.node.on('slide', function (event) {
            //这里的 event 是一个 EventCustom 对象，你可以通过 event.detail 获取 Slider 组件
            let slider = event;

            this.Effect_progressBar.progress = slider.progress; //音效進度條bar
            
            if(slider.progress == 0){
                this.EffectOX_checked = false;
            } else {
                this.EffectOX_checked = true;
            }
            this._BtnOnOff(this.EffectOX_node,this.EffectOX_checked);

            let _CheckRemainder = cc.module.tools.formatFloat((cc.module.tools.formatFloat(slider.progress,2) * 100) % 10,0);   //取餘數，判斷是否為0
            let _NowScale       = cc.module.tools.formatFloat(slider.progress,2) * 100;                                         //當前刻度

            if(_CheckRemainder == 0 && _NowScale != _SaveScale) {
                _SaveScale = _NowScale;
                cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效
            }
            cc.module.audio.setVolume(this.Music_slider.progress,slider.progress);
        },this);
    },


    /**
     * [開啟音樂開關，並將音樂進度條調整為50%=0.5]
     *  */
    BtnMusicOX:function(){
        if(this.DebugMode) {console.log("%c[settingWindown] => [BtnMusicOX] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio); 
        this.MusicOX_checked = !this.MusicOX_checked;       //轉換核選狀態

        if(this.MusicOX_checked) {
            cc.module.audio.moveBGMVolume(0.5);
            this.Music_slider.progress = 0.5;
            this.Music_progressBar.progress = 0.5; //音樂進度條bar
        } else {
            cc.module.audio.moveBGMVolume(0);
            this.Music_slider.progress = 0;
            this.Music_progressBar.progress = 0; //音樂進度條bar
        }
        this._BtnOnOff(this.MusicOX_node,this.MusicOX_checked);
        
        cc.module.audio.setVolume(this.Music_slider.progress,this.Effect_slider.progress);
    },
    
    /**
     * [開啟音效開關，並將音樂進度條調整為50%=0.5]
     *  */
    BtnEffectOX:function(){
        if(this.DebugMode) {console.log("%c[settingWindown] => [BtnEffectOX] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio); 
        this.EffectOX_checked = !this.EffectOX_checked;     //轉換核選狀態
        
        if(this.EffectOX_checked) {
            this.Effect_slider.progress         = 0.5;
            this.Effect_progressBar.progress    = 0.5;  //音效進度條bar
        } else {
            this.Effect_slider.progress         = 0;
            this.Effect_progressBar.progress    = 0;    //音效進度條bar
        }
        this._BtnOnOff(this.EffectOX_node,this.EffectOX_checked);

        cc.module.audio.setVolume(this.Music_slider.progress,this.Effect_slider.progress);
    },

    /**
     * [按鈕開關狀態] 
     * @param {obj} _Node   開關節點
     * @param {bool} _State 開關狀態
     */
    _BtnOnOff: function(_Node,_State) {
        if(this.DebugMode) {console.log("%c[settingWindown] => [_BtnOnOff] in action.",'color:'+this.DebugModeColor_FA);}

        if(_State){
            _Node.getChildByName("label_on").active         = true;
            _Node.getChildByName("label_off").active        = false;
            _Node.getChildByName("btn_onoff_FG").active     = true;
            _Node.getChildByName("bar_btn").x               = 85;
        } else {
            _Node.getChildByName("label_on").active         = false;
            _Node.getChildByName("label_off").active        = true;
            _Node.getChildByName("btn_onoff_FG").active     = false;
            _Node.getChildByName("bar_btn").x               = -100;
        }
    },
});
