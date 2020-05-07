/** @file       emojiAnim.js
  * @brief      表情包控制腳本.
  * @author     OreoLi
  * @date       2019/03/06 10:32 */

  cc.Class({
    extends: cc.Component,

    properties: {
        //預製體及緩存池
        Emoji_prefab:cc.Prefab,             //表情的預制體資源
        Emoji_pool:cc.NodePool,             //表情的預制體緩存池 (pool)
        Btn_emoji_node:cc.Node,             //按鈕 表情包選單節點
        Controller_node:cc.Node,            //控制項主節點
        Btn_emojiStringMenu_node:cc.Node,   //按鈕 文字選單節點
        Btn_emojiIconMenu_node:cc.Node,     //按鈕 符號選單節點
        Btn_close_node:cc.Node,             //按鈕 關閉表情包選單節點
        StringScrollView_node:cc.Node,      //選單 文字選單節點
        IconScrollView_node:cc.Node,        //選單 符號選單節點
        EmojiGroup_node:cc.Node,            //表情包產出預製體節點
        
        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用                         
        BtnClickOnAudio:        {  default: null,  type: cc.AudioClip  },       //按鈕點擊音效載入    
        
    },

    ctor(){
        this.DebugMode              = false;            //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
    },

    /**     
     * [初始化表情包資源] 
     * */ 
    Init (){
        this.Emoji_pool                         = new cc.NodePool();                //預製體的緩存池
        this.Btn_emoji_node.active              = false;                            //關閉 按鈕 表情包選單節點
        this.Controller_node.active             = false;                            //關閉 控制項主節點
        this.Btn_emojiIconMenu_node.active      = true;                             //開啟 按鈕 符號選單節點
        this.Btn_emojiIconMenu_node.getChildByName('click').active    = false;      //關閉 按鈕 符號選單節點 (可點擊)
        this.Btn_emojiStringMenu_node.active    = true;                             //開啟 按鈕 文字選單節點
        this.Btn_emojiStringMenu_node.getChildByName('click').active  = true;       //開啟 按鈕 文字選單節點 (可點擊)
        this.Btn_close_node.active              = true;                             //開啟 按鈕 關閉表情包選單節點
        this.StringScrollView_node.active       = false;                            //關閉 文字選單節點
        this.IconScrollView_node.active         = true;                             //開啟 符號選單節點
        this.EmojiGroup_node.active             = true;                             //開啟 表情包產出預製體節點
        this.node.active                        = true;                             //開啟 表情包整個主節點
    },

    /** 
     * [開啟表情按鈕] 
     * @param   {bool}      _State      開關狀態 {true:開,false:關}
     */
    SetBtnState: function(_State){
        if(this.DebugMode) {console.log("%c[emojiAnim] => [SetBtnState] in action.",'color:'+this.DebugModeColor_FA);}
        this.Btn_emoji_node.active = _State;
    },

    /** 
     * [播放表情包動畫] 
     * @param   {string}    _State              {"string","icon"}
     * @param   {int}       _Number             第幾款圖
     * @param   {node}      _MainNode           主要位置參考節點
     * @param   {obj}       _JsonFile           json相關參數資料
     * @param   {int}       _SitIndex           對應座位代碼
     */
    StartAnim: function(_State,_Number,_MainNode,_JsonFile,_SitIndex){
        if(this.DebugMode) {console.log("%c[emojiAnim] => [StartAnim] in action.",'color:'+this.DebugModeColor_FA);}

        //創建預製體
        var _Prefab;                                                                            //節點暫存
        if(this.Emoji_pool.size() > 0)  {   _Prefab = this.Emoji_pool.get();   }                //取得預制體
        else                            {   _Prefab = cc.instantiate(this.Emoji_prefab);   }    //若緩存池沒有預制體就生成新的預製體
        
        //取得對應參數丟入預製體
        let _GetNode            = _MainNode;                                                                    //[顯示位置]主節點
        let _GetWorldSpaceAR    = _GetNode.parent.convertToWorldSpaceAR(cc.v2(_GetNode.x,_GetNode.y))           //[顯示位置]的節點轉為世界座標
        let _GetNodeSpaceAR     = this.node.getChildByName("emojiGroup").convertToNodeSpaceAR(_GetWorldSpaceAR);//[顯示位置]的節點轉為[動畫執行]節點的區域座標
        var _obj = {"State":            _State,
                    "Number":           _Number,
                    "ThisPosi":         {"PosiX":_GetNodeSpaceAR.x,"PosiY":_GetNodeSpaceAR.y},
                    "AnimTotalTime":    _JsonFile.AnimTotalTime,
                    "ScheduleTime":     _JsonFile.ScheduleTime,
                    "MiniPicCount":     _JsonFile.MiniPicCount,
                    "MaxiPicCount":     _JsonFile.MaxiPicCount,
                    "StringPic":        _JsonFile[_SitIndex].StringPic,
                    "StringPosi":       _JsonFile[_SitIndex].StringPosi,
                    "IconPosi":         _JsonFile[_SitIndex].IconPosi};                       //初始化資料

                    console.log(_obj);
        _Prefab.getComponent("emoji").Init(_obj);                                               //初始化預製體
        this.node.getChildByName("emojiGroup").addChild(_Prefab);                               //加入至子節點 

        var _Func = function(){
            this.Emoji_pool.put(_Prefab);
        }.bind(this);
        _Prefab.getComponent("emoji").StartAnim(_Func);
    },

    /** 
     * [點擊設置表情包開關] 
     *  @param  {obj}       event           點擊事件
     *  @param  {string}    _State          開關狀態 {"on","off"}
     */
    BtnEmojiState: function(event,_State){
        if(this.DebugMode) {console.log("%c[emojiAnim] => [BtnEmojiState] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio); 
        if(_State == "on"){
            this.Controller_node.active = !this.Controller_node.active;     //開啟 控制項主節點
        } else {
            this.Controller_node.active = false;    //關閉 控制項主節點
        }
    },

    /** 
     * [點擊切換icon或string] 
     * @param {obj}         event       點擊事件
     * @param {string}      _State      開關狀態 {"icon","string "}
    */
    BtnChangeEmojiMenu: function(event,_State){
        if(this.DebugMode) {console.log("%c[emojiAnim] => [BtnChangeEmojiMenu] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio); 
        if(_State == "icon") {
            this.Btn_emojiStringMenu_node.getChildByName('click').active  = true;       //開啟 按鈕 文字選單節點 (可點擊)
            this.Btn_emojiIconMenu_node.getChildByName('click').active    = false;      //關閉 按鈕 符號選單節點 (可點擊)
            this.StringScrollView_node.active       = false;                            //關閉 文字選單節點
            this.IconScrollView_node.active         = true;                             //開啟 符號選單節點
        } else {
            this.Btn_emojiStringMenu_node.getChildByName('click').active  = false;      //關閉 按鈕 文字選單節點 (可點擊)
            this.Btn_emojiIconMenu_node.getChildByName('click').active    = true;       //開啟 按鈕 符號選單節點 (可點擊)
            this.StringScrollView_node.active       = true;                             //開啟 文字選單節點
            this.IconScrollView_node.active         = false;                            //關閉 符號選單節點
        }
    },

    /** 
     * [送出icon貼圖] 
     * @param {obj}     event            點擊事件
     * @param {int}     _State           第幾款 */
    BtnIconSend: function(event,_State){
        if(this.DebugMode) {console.log("%c[emojiAnim] => [BtnIconSend] in action.",'color:'+this.DebugModeColor_FA);}

        var _Func = function(_JsonData){
            var _Result = JSON.parse(_JsonData['Result']);
            switch(parseFloat(_Result['Code'])){
                case 1:     console.log("點擊[表情包按鈕]-請求成功");   
                            this.Controller_node.active = false;    //關閉 控制項主節點   
                            break;
                case -1:    console.log("點擊[表情包按鈕]-請求失敗");        break;
                case -2:    console.log("點擊[表情包按鈕]-參數錯誤");        break;
                default:    console.log("點擊[表情包按鈕]-進入例外狀況");    break;
            }
        }.bind(this);

        this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_Emoji",{"Type":"icon","Emoji":_State,"SeatIndex":cc.module.userParams.NowUserIndex+""},_Func);
    },

    /** 
     * [送出string貼圖] 
     * @param {obj}     event            點擊事件
     * @param {int}     _State           第幾款
     * */
    BtnStringSend: function(event,_State){
        if(this.DebugMode) {console.log("%c[emojiAnim] => [BtnStringSend] in action.",'color:'+this.DebugModeColor_FA);}
        
        var _Func = function(_JsonData){
            var _Result = JSON.parse(_JsonData['Result']);
            switch(parseFloat(_Result['Code'])){
                case 1:     console.log("點擊[表情包按鈕]-請求成功");   
                            this.Controller_node.active = false;    //關閉 控制項主節點 
                            break;
                case -1:    console.log("點擊[表情包按鈕]-請求失敗");        break;
                case -2:    console.log("點擊[表情包按鈕]-參數錯誤");        break;
                default:    console.log("點擊[表情包按鈕]-進入例外狀況");    break;
            }
        }.bind(this);

        this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_Emoji",{"Type":"string","Emoji":_State,"SeatIndex":cc.module.userParams.NowUserIndex+""},_Func)
    },

    /** 
     * [發送封包至遊戲伺服器]
     * @param {string}      topic       mqtt topic
     * @param {string}      data        mqtt payload 
     * @param {function}    _cb         只有當回傳的code = 1的時候才執行
     */
    SendMsg: function(topic, data, _cb){
        let self = this;
        cc.module.mqant.request(topic, data, function(destinationName, data) {
            if(self.DebugMode) {
                console.log(destinationName);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
            }
            var _JsonData   = JSON.parse(cc.module.mqant.parseUTF8(data));
            _cb(_JsonData);
        });
    },
});
