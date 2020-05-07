/** Warning
 * Since 1.10, `cc.audioEngine` accept cc.AudioClip instance directly,  not a URL string. 
 * Please directly reference the AudioClip object in your script, or load cc.AudioClip by loader first. 
 * Don't use audio's URL anymore. 
 */

 /** 
  * @file       audio.js
  * @brief      音檔控制模組.
  * @author     OreoLi
  * @date       2019/02/24 20:02 */

  cc.Class({
    extends: cc.Component,

    properties: {
    },

    ctor(){
        this.DebugMode              = false;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
    

        this.bgmVolume      = 1.0;              //背景音樂聲音大小
        this.effectVolume   = 1.0;              //背景音量聲音大小
        this.bgAudioID      = -1;               //背景音樂索引
    },
    
    init: function(BGMOBJ) {

        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (t != null) {
            if(this.DebugMode == true){  console.log("%c[audio.js] init時所取得的bgnVol:" + t,'color:'+this.DebugModeColor_FA); }
            this.bgmVolume = parseFloat(t);
        } else {
            if(this.DebugMode == true){  console.log("%c[audio.js] init時，本地端上無儲存bgnVol，故將bgnVol設為預設值" + this.bgmVolume,'color:'+this.DebugModeColor_FA); }
            cc.sys.localStorage.setItem("bgmVolume",1.0);
        }

        var t = cc.sys.localStorage.getItem("effectVolume");
        if (t != null) {
            if(this.DebugMode == true){ console.log("%c[audio.js] init時所取得的efcVol:" + t,'color:'+this.DebugModeColor_FA); }
            this.effectVolume = parseFloat(t);
        } else {
            
            if(this.DebugMode == true){ console.log("%c[audio.js] init時，本地端上無儲存efcVol，故將efcVol設為預設值" + this.effectVolume,'color:'+this.DebugModeColor_FA); }
            cc.sys.localStorage.setItem("effectVolume",1.0);
        }

        /** app在背景執行時的音量管理 */ 
        cc.game.on(cc.game.EVENT_HIDE, function() {
            cc.audioEngine.pauseAll();
        });

        /** app在非背景執行時的音量管理 */
        cc.game.on(cc.game.EVENT_SHOW, function() {
            cc.audioEngine.resumeAll();
        });
        
        this.bgAudioID = cc.audioEngine.playMusic(BGMOBJ,true);                         //載入背景音檔
        this.moveBGMVolume(this.bgmVolume);                                             //啟用音樂的判斷
    },

    /** 
     * [關閉所有音效] 
     * */
    pauseAll: function() {
        cc.audioEngine.pauseAll();
    },

    /** 
     * [開啟所有音效]
     *  */
    resumeAll: function() {
        cc.audioEngine.resumeAll();
    },

    /** 
     * [取得當前音樂的音量大小]
     *  */
    getBGMVolume: function() {
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (t != null) {
            if(this.DebugMode == true){  console.log("%c[audio.js] 取得音量大小：" + parseFloat(t),'color:'+this.DebugModeColor_FA);  }
            return parseFloat(t);
        } else {
            if(this.DebugMode == true){  console.log("%c[audio.js] 取得音量大小：數值為空，尚未寫入本地儲存裝置",'color:'+this.DebugModeColor_FA);  }
            return this.bgmVolume;
        }
    },
    
    /** 
     * [取得當前音效的音量大小]
     *  */
    getSFXVolume:function() {
        var t = cc.sys.localStorage.getItem("effectVolume");
        if (t != null) {
            if(this.DebugMode == true){  console.log("%c[audio.js] 取得音效大小：" + parseFloat(t),'color:'+this.DebugModeColor_FA);  }
            return parseFloat(t);
        } else {
            if(this.DebugMode == true){  console.log("%c[audio.js] 取得音效大小：數值為空，尚未寫入本地儲存裝置",'color:'+this.DebugModeColor_FA);  }
            return this.effectVolume;
        }
    },

    /** 
     * [滑動音量slider時，設定背景音樂音量]
     * @param v 音量 */
    moveBGMVolume: function(v) {

        this.bgmVolume = v; //資料轉存

        //若背景音樂預設取得的數值大於0，表示從大廳轉過來時是開啟音樂的狀態，則將音樂開起
        if(this.bgmVolume > 0) {
            cc.audioEngine.setMusicVolume(this.bgmVolume);
            cc.audioEngine.resumeMusic();
            if(this.DebugMode == true){  console.log("%c[audio.js] resumeMusic狀態，bgmId：" + this.bgAudioID + " - bgmVolume：" + this.bgmVolume,'color:'+this.DebugModeColor_FA);  }
        } else {
            cc.audioEngine.pauseMusic();
            if(this.DebugMode == true){  console.log("%c[audio.js] pauseMusic狀態，bgmId：" + this.bgAudioID + " - bgmVolume：" + this.bgmVolume,'color:'+this.DebugModeColor_FA);  }
        }
    },

    /** 
     * [設定音量大小]
     * @param BGMv 音樂音量
     * @param SFXv 音效音量 */
    setVolume: function(BGMv,SFXv) {
        this.bgmVolume = BGMv;
        cc.sys.localStorage.setItem("bgmVolume",BGMv);
        
        this.effectVolume = SFXv;
        cc.sys.localStorage.setItem("effectVolume",SFXv);

        if(this.DebugMode == true){  console.log("%c[audio.js] 設定本地儲存bgmVolume：" + this.bgmVolume + " - effectVolume：" + this.effectVolume,'color:'+this.DebugModeColor_FA);  }
    },

 
    /** 
     * [遊戲開啟時的音效]
     * */
    playEffect: function(effectSound){
        if(this.getSFXVolume() > 0){
            if(this.DebugMode == true){  console.log("%c[audio.js] 音效狀態為開啟，播放音效：" + effectSound,'color:'+this.DebugModeColor_FA);  }
            // cc.audioEngine.play(this.getUrl(effectSound), false,1);
            cc.audioEngine.play(effectSound, false,this.getSFXVolume());
        } else {
            if(this.DebugMode == true){  console.log("%c[audio.js] 音效狀態為關閉，不播放音效",'color:'+this.DebugModeColor_FA);  }
        }
    },

})