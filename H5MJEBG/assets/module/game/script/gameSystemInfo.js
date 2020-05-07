/** @file       gameSystemInfo.js
  * @brief      系統資訊區主腳本.
  * @author     OreoLi
  * @date       2019/03/06 10:32 */

cc.Class({
    extends: cc.Component,

    properties: { 

        chips_node: cc.Node,                       //tableChipsPool 
        MainEBG_Atlas:cc.SpriteAtlas,           //二八槓主要圖片資源
        Main_en_Atlas: cc.SpriteAtlas,          //主要圖片資源 (英文)
        Main_tw_Atlas: cc.SpriteAtlas,          //主要圖片資源 (繁體)
        StartAnim_Atlas: cc.SpriteAtlas,        //對局開始的動畫圖集資源
        StartAnim_en_Atlas: cc.SpriteAtlas,     //對局開始的動畫圖集資源 (英文)
        StartAnim_tw_Atlas: cc.SpriteAtlas,     //對局開始的動畫圖集資源 (繁體)
        WinLoss_Atlas: cc.SpriteAtlas,          //最終勝利的動畫圖集資源
        WinLoss_en_Atlas: cc.SpriteAtlas,       //最終勝利的動畫圖集資源 (英文)
        WinLoss_tw_Atlas: cc.SpriteAtlas,       //最終勝利的動畫圖集資源 (繁體)

        //預製體及緩存池
        Coin_prefab:cc.Prefab,                  //跳錢的預制體資源
        Coin_pool:cc.NodePool,                  //跳錢的預制體緩存池 (pool)

        //JoinRoom 底下所有子節點
        JoinRoomAlert_node: cc.Node,            //等待加入房間配桌集合節點
        Label_node: cc.Node,                    //文字圖片節點

        //StartGameAnim 底下所有子節點
        TableMsg_node:cc.Node,                  //牌桌資訊
        StartGameAnim_node: cc.Node,            //開場動畫節點
        CoinAnim_node :cc.Node,                 //跳錢動畫節點
        WinAnim_node: cc.Node,                  //獲勝動畫
        PlayAnim_node: cc.Node,                 //撥放龍骨動畫

        // 莊家通贏或通賠
        Banker_status_node:cc.Node,             //莊家通贏或通賠

        //籌碼預置體
        chipAnim_node:cc.Node,          //籌碼預置體父節點
        chip:cc.Prefab,                 //籌碼預置體節點
        

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用                                 
        StartGameAudio:         {  default: null,  type: cc.AudioClip  },       //開場音效
        WinAudio:               {  default: null,  type: cc.AudioClip  },       //勝利音效
        LoseAudio:              {  default: null,  type: cc.AudioClip  },       //失敗音效
        Banker_Loss:            {  default: null,  type: cc.AudioClip  },       //莊家通賠背景音
        Banker_Win:             {  default: null,  type: cc.AudioClip  },       //莊家通贏背景音
        All_winAudio:           {  default: null,  type: cc.AudioClip  },       //莊家通贏
        All_lossAudio:          {  default: null,  type: cc.AudioClip  },       //莊家通賠
    },

    ctor(){
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
        
        this._Main_Atlas;                               //多國語系切換的主要圖集
        this._StartAnim_Atlas;                          //多國語系切換的對局開始動畫圖集
        this._WinLoss_Atlas;                            //多國語系切換的最終勝利的動畫圖集資源
    },
    
    /** 開始遊戲前的初始化 */
    Init: function(){
        if(this.DebugMode) {console.log("%c[gameSystemInfo] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
        
        //預設語系設置，判斷內存是否已有儲存語系，若無則預設為cn
        let _Language = cc.sys.localStorage.getItem("Language");
        if(!_Language || _Language == "") {
            _Language = 'cn';
        } 

        switch(_Language){
            case 'cn':
                this._Main_Atlas        = this.MainEBG_Atlas;
                this._StartAnim_Atlas   = this.StartAnim_Atlas;
                this._WinLoss_Atlas     = this.WinLoss_Atlas;
                break;
            case 'tw':
                this._Main_Atlas        = this.Main_tw_Atlas;
                this._StartAnim_Atlas   = this.StartAnim_tw_Atlas;
                this._WinLoss_Atlas     = this.WinLoss_tw_Atlas;
                break;
            case 'en':
                this._Main_Atlas        = this.Main_en_Atlas;
                this._StartAnim_Atlas   = this.StartAnim_en_Atlas;
                this._WinLoss_Atlas     = this.WinLoss_en_Atlas;
                break;
            default:
                break;
        }

        this.JoinRoomAlert_node.active          = false;        //關閉 等待加入房間配桌集合節點
        this.Label_node.active                  = false;        //關閉 文字圖片節點

        this.TableMsg_node.active               = true;         //開啟 左上牌桌訊息節點
        this.StartGameAnim_node.active          = false;        //關閉 開場動畫節點
        this.CoinAnim_node.active               = true;         //開啟 跳錢動畫節點
       
        this.WinAnim_node.active                = false;        //關閉 獲勝動畫
        this.WinAnim_node.opacity               = 255;
        this.WinAnim_node.scale                 = 0.01;
        this.PlayAnim_node.active               = false;        //關閉龍骨動畫
        //開啟 系統訊息節點
        this.node.active                        = true;       
        
        this.Banker_status_node.active          = false;
        //停止動畫及計時器
        this.StartGameAnim_node.stopAllActions();
        this.WinAnim_node.stopAllActions();

        //載入龍骨圖
        cc.module.tools.loadDragonBonesAsset("dragonBones/allwin/")
        cc.module.tools.loadDragonBonesAsset("dragonBones/alllose/")
        cc.module.tools.loadDragonBonesAsset("dragonBones/victory/")

        //創建預製體至緩存池
        this.chip_pool   = new cc.NodePool();                   //籌碼預製體的緩存池
        for (var cCount = 0; cCount < 84; cCount++) {           //生成84個節點丟進緩存池   
            let _chip = cc.instantiate(this.chip);
            this.chip_pool.put(_chip);
        }
        this.Coin_pool      = new cc.NodePool();                //發送籌碼後跳錢的緩存池
        for (var cCount = 0; cCount < 4; cCount++) {            //建立發送籌碼後跳錢的緩存池的物件寫入對應節點
            let _coin = cc.instantiate(this.Coin_prefab);    
            this.Coin_pool.put(_coin);   
        }
        
        //回收節點至節點池
        this.PutPrefab();
        //初始化籌碼節點存放Obj
        this.chipNodeObj   = {0:[],1:[],2:[],3:[]};
        this.chipBankerObj = {0:[],1:[],2:[],3:[]};

        //初始化牌局資訊
        this.TableMsg_node.getChildByName("UserIP").getChildByName("label").getComponent(cc.Label).string = cc.module.userParams.UserIP; //設置 IP
        this.node.getChildByName("label_verson").getComponent(cc.Label).string = cc.module.jsonFile["Version"]; //設置 版本號
        this.TableMsg_node.getChildByName("tableNumber").getChildByName("label").getComponent(cc.Label).string = "------"; //設置 牌局編號文字        
    },

    /**
     * 回收節點至節點池
     * @param {obj} _State          //回收目標節點
     */
    PutPrefab: function (_State) {
        if (this.DebugMode) { console.log("%c[gameSystemInfo] => [PutPrefab] in action.", 'color:' + this.DebugModeColor_FA); }

        if (_State) {
            _State.stopAllActions();
            this.chip_pool.put(_State);
        } else {
            //回收籌碼
            var _SetCount = this.chipAnim_node.children.length;
            for (var MJCount = 0; MJCount < _SetCount; MJCount++) {
                this.chipAnim_node.children[0].stopAllActions();
                this.chip_pool.put(this.chipAnim_node.children[0]);
            }
            //回收跳錢
            let _CoinCount = this.CoinAnim_node.children.length;
            for(var cCount = 0 ; cCount < _CoinCount ; cCount++){
                this.Coin_pool.put(this.CoinAnim_node.children[0]);
            }
        }
        this.chipNodeObj   = {0:[],1:[],2:[],3:[]};
        this.chipBankerObj = {0:[],1:[],2:[],3:[]};

    },

    /** [斷線重連] 設置目前使用者所有基礎訊息 
     *  @param  _Period              int             遊玩狀態{0: 搶莊階段,1: 出牌階段,2:結算階段}
     *  @param  _OwnSeatIdx          int             主角玩家位置
     *  @param  _PlayerInfo          map             玩家資訊
     *  @param  _Playing             map             出牌階段資訊
     *  @param  _OnSettlement        map             結算階段資訊
     * 
     *  [PlayerInfo] map array
     *  Nickname	        string	        玩家暱稱
     *  SeatIdx	            float64	        玩家座位Index
     *  HeadUrl	            string	        玩家頭像 初始化為0
     *  Gender	            string	        玩家性別 (1: 男 0: 女)
     *  Credit	            float64	        玩家身上的籌碼金額
     *  PlayerState	        int	            玩家目前在牌局中的狀態 1: 遊戲中 0: 閒置中 -1: 觀戰中
     *  BeginCredit	        float64	        玩家起始身上的籌碼金額
     *  ActionPool	        string-bool map	玩家可操作的動作清單(只知道自己的)
     *  AfterAction	        string-int map	預期玩家進行對應動作後剩餘的骰子數量(只知道自己的)
     *  Hands	            string array	玩家手牌內容(只知道自己的)
     * 
     *  [Bidding]
     * 
     *  [Playing] map
     *  Round	            int             當前回合
     *  BidderIdx	        int	            叫牌玩家SeatIndex     
     *  LosersIdx	        int array	    輸家SeatIndex
     *  ThinkingTime	    float64	        剩餘幾秒
     * 
     *  [OnSettlement] map
     *  WinnerIdx	        int	            獲勝玩家座位編號
     */
    ReJoinSetInfo: function(_Period,_OwnSeatIdx,_PlayerInfo,_Bidding,_Betting,_RoundSettlement){
        if(this.DebugMode) {console.log("%c[gameSystemInfo] => [ReJoinSetInfo] in action.",'color:'+this.DebugModeColor_FA);}
		
        var _Period_0_Func = function(){
            console.log("搶莊階段");
        }.bind(this);

        var _Period_4_Func = function(){
            console.log("下注階段");
            for(var pCount = 0; pCount < _PlayerInfo.length ; pCount++){
                if(_PlayerInfo[pCount]['Odds'] >= 0 && !_PlayerInfo[pCount]['IsBanker']){  //玩家已下注
                    this.getChip(_PlayerInfo[pCount]['Odds'],_PlayerInfo[pCount]['SeatIdx'])
                    this.dropChipAnim(false,_PlayerInfo[pCount]['SeatIdx'],)
                }
            }
        }.bind(this);

        var _Period_1_Func = function(){
            console.log("出牌階段");
        }.bind(this);

        var _Period_2_Func = function(){
            console.log("結算階段");
        }.bind(this);

        // var _Period_3_Func = function(){
        //     console.log("結算階段");
        //     for(var pCount = 0; pCount < _PlayerInfo.length ; pCount++){
        //         if(_OwnSeatIdx == _PlayerInfo[pCount]['SeatIdx']){
        //             var _winCombo = (0 - Math.ceil(Math.abs(_PlayerInfo[pCount]['Loss']/cc.module.userParams.NowGameAntes))) + Math.ceil(_PlayerInfo[pCount]['Profit']/cc.module.userParams.NowGameAntes);  //該玩家獲利倍數
        //             this.WinAnim(_winCombo);
        //             break;
        //         } 
        //     }
        // }.bind(this);

        switch(parseFloat(_Period)) {
			case 0:         //搶莊階段
                _Period_0_Func();
                break;
            case 1:         //下注階段
                _Period_0_Func();
                _Period_1_Func();
                _Period_4_Func();
                break;
            case 2:         //結算階段
                _Period_0_Func();
                _Period_1_Func();
                _Period_2_Func();
                break;
            case 3:         //結算階段
                _Period_0_Func();
                _Period_1_Func();
                _Period_2_Func();
                // _Period_3_Func();
				break;
            default:        //斷線重連出現例外狀態
                console.log("斷線重連出現例外狀態");
                break;
        }
    },

    /** 設定牌桌編號 */
    SetRoomID: function(){
		if(this.DebugMode) {console.log("%c[gameSystemInfo] => [SetRoomID] in action.",'color:'+this.DebugModeColor_FA);}
        this.TableMsg_node.getChildByName("tableNumber").getChildByName("label").getComponent(cc.Label).string     = cc.module.userParams.RoomID; //設置 牌局編號文字
    },

	/** 目前系統訊息文字顯示... 
	 * 	@param _state 	bool	{true:開啟計時器,false:關閉計時器}
	 * 	@param _str		string	欲顯示的文字內容
	*/ 
	SystemLabelPoint(_state,_str){
		if(this.DebugMode) {console.log("%c[gameSystemInfo] => [SystemLabelPoint] in action.",'color:'+this.DebugModeColor_FA);}

        this.JoinRoomAlert_node.active = _state;        //開/關 配桌訊息視窗開啟
        this.Label_node.active         = _state;        //開/關 文字圖片節點
        this.Label_node.getComponent(cc.Sprite).unscheduleAllCallbacks();           //停止該組件所有計時器
        this.Label_node.getComponent(cc.Sprite).spriteFrame = this._Main_Atlas.getSpriteFrame("label_"+_str);
        
		if(_state) {    //若要顯示...動畫則為true
			let pointNumber = 0;
			var _callback = function () {
				if(pointNumber > 2) {
					pointNumber = 0;
                } else {
                    pointNumber++;
                }
                
                for(var pCount = 1 ; pCount <= 3 ; pCount++){
                    if(pCount > pointNumber) {
                        this.JoinRoomAlert_node.getChildByName("point"+pCount).active = false;
                    } else {
                        this.JoinRoomAlert_node.getChildByName("point"+pCount).active = true;
                    }
                }
			}.bind(this);
			this.Label_node.getComponent(cc.Sprite).schedule(_callback, 0.3);
        } 
    },

    /** 顯示開場動畫 
     * - 彈出動畫0.5's、回彈動畫0.1's
     * - 燈光閃碩 1.2's
     * - 淡出 1's 
     * 
     * ----以上動畫總時數: 2.8's----
     * @param   _cb             function    callBack
    */
    // StartGameAnim: function(_cb){
    //     if(this.DebugMode) {console.log("%c[gameSystemInfo] => [StartGameAnim] in action.",'color:'+this.DebugModeColor);}
        
    //     let self = this;
    //     this.StartGameAnim_node.scale           = cc.module.jsonFile['GameMain']['StartGameAnim']['OriginalScale'];         //設定 對局開始動畫縮放度，因為後續的開頭會是做談出
        
    //     this.StartGameAnim_node.getChildByName('fg').removeComponent(cc.Mask);
    //     if(this.StartGameAnim_node.getChildByName('fg').getComponent(cc.Mask) != null) {
    //         this.StartGameAnim_node.getChildByName('fg').getComponent(cc.Mask)._destroyImmediate();
    //     }
    //     this.StartGameAnim_node.getChildByName('fg').addComponent(cc.Mask);
    //     this.StartGameAnim_node.getChildByName('fg').getComponent(cc.Mask).spriteFrame = this._StartAnim_Atlas.getSpriteFrame("anim_startGame_fg");
    //     this.StartGameAnim_node.getChildByName('fg').getComponent(cc.Mask).type = cc.Mask.Type.IMAGE_STENCIL;  
    //     this.StartGameAnim_node.getChildByName('fg').height = this._StartAnim_Atlas.getSpriteFrame("anim_startGame_fg").getRect().height;
    //     this.StartGameAnim_node.getChildByName('fg').width  = this._StartAnim_Atlas.getSpriteFrame("anim_startGame_fg").getRect().width;
        
    //     this.StartGameAnim_node.active          = true;         //開啟 對局開始動畫節點

    //     //音效檔播放
    //     let PlayEffectFunc = cc.callFunc(function(){
    //         cc.module.audio.playEffect(self.StartGameAudio);        //撥放音效
    //     });

    //     //設置動畫
    //     let _LightAnimFunc = cc.callFunc(function() {
    //         let _Light = self.StartGameAnim_node.getChildByName("fg").getChildByName("light");

    //         let _ReSetPosition = cc.callFunc(function(){
    //             _Light.x = 0 - cc.module.jsonFile['GameMain']['StartGameAnim']['MoveToX'];
    //         });

    //         let _LightAction    = cc.sequence(  _ReSetPosition,
    //                                             cc.moveTo(cc.module.jsonFile['GameMain']['StartGameAnim']['MoveToTime'],cc.v2(cc.module.jsonFile['GameMain']['StartGameAnim']['MoveToX'],_Light.y)),
    //                                             _ReSetPosition,
    //                                             cc.moveTo(cc.module.jsonFile['GameMain']['StartGameAnim']['MoveToTime'],cc.v2(cc.module.jsonFile['GameMain']['StartGameAnim']['MoveToX'],_Light.y)));
    //         _Light.runAction(_LightAction);
    //     });
        
    //     //當動畫完畢後，需顯示重搖次數
    //     let FinalFunc = cc.callFunc(function(){
    //         if(typeof(_cb) != "undefined"){
    //             _cb();
    //         } 
    //     });

    //     //動畫執行 
    //     let action = cc.sequence(   cc.fadeIn(cc.module.jsonFile['GameMain']['StartGameAnim']['FadeIn']),
    //                                 cc.scaleTo(cc.module.jsonFile['GameMain']['StartGameAnim']['Scale01']['sAnimTime'], cc.module.jsonFile['GameMain']['StartGameAnim']['Scale01']['sTo']),
    //                                 cc.scaleTo(cc.module.jsonFile['GameMain']['StartGameAnim']['Scale02']['sAnimTime'], cc.module.jsonFile['GameMain']['StartGameAnim']['Scale02']['sTo']),
    //                                 _LightAnimFunc,
    //                                 cc.delayTime(cc.module.jsonFile['GameMain']['StartGameAnim']['DelayTime']),
    //                                 PlayEffectFunc,
    //                                 cc.fadeOut(cc.module.jsonFile['GameMain']['StartGameAnim']['FadeOut']),
    //                                 FinalFunc);
    //     this.StartGameAnim_node.runAction(action);
    // },

    /** 播放跳錢動畫
     *  @param      _DelayTime      float       延遲時間
     *  @param      _PostNode       Node        [發送目標]節點
     *  @param      _CoinCount      flot        獲利金額        
        */
    CoinAnim: function(_DelayTime,_PostNode,_CoinCount,_cb){
        if(this.DebugMode) {console.log("%c[SystemInfo] => [CoinAnim] in action.",'color:'+this.DebugModeColor_FA);}
        let _AnimNode           = this.CoinAnim_node;                                                           //[動畫執行]節點
        let _PostWorldSpaceAR   = _PostNode.parent.convertToWorldSpaceAR(cc.v2(_PostNode.x,_PostNode.y))        //[發送目標]的節點轉為世界座標
        let _PostNodeSpaceAR    = _AnimNode.convertToNodeSpaceAR(_PostWorldSpaceAR);                            //[發送目標]的節點轉為[動畫執行]節點的區域座標

        var _coin;
        if(this.Coin_pool.size() > 0) {
            _coin = this.Coin_pool.get();                               //取得預制體
        } else {
            _coin = cc.instantiate(this.Coin_prefab);                   //若緩存池沒有預制體就創建
        }
        _coin.stopAllActions();                                         //取出的預製體有可能還沒播完動畫
        _AnimNode.addChild(_coin);                                      //加入至[動畫執行]子節點 
        _coin.getComponent("coin").Init(_PostNodeSpaceAR,_CoinCount);   //初始化預製體節點位置

        //正確的寫法
        var finishedFunc = cc.callFunc(function() {                     //回調function
            if(typeof(_cb) != "undefined") {  
                _cb();
            }
        });


        var _Action = cc.sequence(
                        cc.hide(),
                        cc.delayTime(_DelayTime),
                        cc.show(),
                        cc.moveBy(cc.module.jsonFile['GameMain']["CoinAnim"]['AnimTime'], cc.v2(0,cc.module.jsonFile['GameMain']["CoinAnim"]['MoveByPosiY'])),
                        finishedFunc);
        _Action.easing(cc.easeSineOut(3.0)); //啟用緩速時間曲線
        _coin.runAction(_Action);  
    },

    /** 遊戲結束事件 */
    GameEnd: function(){
        if(this.DebugMode) {console.log("%c[gameSystemInfo] => [GameEnd] in action.",'color:'+this.DebugModeColor_FA);}
    },

    /** 玩家獲勝或失敗的顯示動畫 
     *  @param _WinCombo    int    獲勝倍率
     *  @param _cb       function callBack 
    */
    // WinAnim: function(_WinCombo,_cb){
    //     if(this.DebugMode) {console.log("%c [systemInfo.js] WinLoseAnim.",'color:'+this.DebugModeColor);}
    //     let self= this;
    //     let _BG     = this.WinAnim_node.getChildByName("bg").getChildByName("bgPic");
    //     let _Font   = this.WinAnim_node.getChildByName("font");
    //     this.WinAnim_node.scale           = cc.module.jsonFile['GameMain']['WinLoseAnim']['OriginalScale'];         //設定 對局開始動畫縮放度，因為後續的開頭會是做談出
    //     this.WinAnim_node.active          = true;         //開啟 對局開始動畫節點

    //     //設置獲勝或者失敗的背景及文字圖
    //     if(_WinCombo >= 0) {
    //         _BG.getComponent(cc.Sprite).spriteFrame     = this.WinLoss_Atlas.getSpriteFrame("anim_win_bg");
    //         _Font.getComponent(cc.Sprite).spriteFrame   = this._WinLoss_Atlas.getSpriteFrame("anim_win_font");
    //         cc.module.audio.playEffect(this.WinAudio); 
    //     } else {
    //         _BG.getComponent(cc.Sprite).spriteFrame     = this.WinLoss_Atlas.getSpriteFrame("anim_loss_bg");
    //         _Font.getComponent(cc.Sprite).spriteFrame   = this._WinLoss_Atlas.getSpriteFrame("anim_loss_font");
    //         cc.module.audio.playEffect(this.LoseAudio); 
    //     }
    //     this.WinAnim_node.active = true;

    //     //設置動畫
    //     let _LightAnimFunc = cc.callFunc(function() {
    //         let _Light = self.WinAnim_node.getChildByName("bg").getChildByName("light");

    //         let _ReSetPosition = cc.callFunc(function(){
    //             _Light.x = 0 - cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToX'];
    //         });

    //         let _LightAction    = cc.sequence(  _ReSetPosition,
    //                                             cc.moveTo(cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToTime'],cc.v2(cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToX'],_Light.y)),
    //                                             _ReSetPosition,
    //                                             cc.moveTo(cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToTime'],cc.v2(cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToX'],_Light.y)),
    //                                             _ReSetPosition,
    //                                             cc.moveTo(cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToTime'],cc.v2(cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToX'],_Light.y)),
    //                                             _ReSetPosition,
    //                                             cc.moveTo(cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToTime'],cc.v2(cc.module.jsonFile['GameMain']['WinLoseAnim']['MoveToX'],_Light.y)));
    //         _Light.runAction(_LightAction);
    //     });
        
    //     //當動畫完畢後，需顯示重搖次數
    //     let FinalFunc = cc.callFunc(function(){
    //         if(typeof(_cb) != "undefined"){
    //             _cb();
    //         } 
    //     });

    //     //動畫執行 
    //     let action = cc.sequence(   cc.fadeIn(cc.module.jsonFile['GameMain']['WinLoseAnim']['FadeIn']),
    //                                 cc.scaleTo(cc.module.jsonFile['GameMain']['WinLoseAnim']['Scale01']['sAnimTime'], cc.module.jsonFile['GameMain']['WinLoseAnim']['Scale01']['sTo']),
    //                                 cc.scaleTo(cc.module.jsonFile['GameMain']['WinLoseAnim']['Scale02']['sAnimTime'], cc.module.jsonFile['GameMain']['WinLoseAnim']['Scale02']['sTo']),
    //                                 _LightAnimFunc,
    //                                 cc.delayTime(cc.module.jsonFile['GameMain']['WinLoseAnim']['DelayTime']),
    //                                 cc.fadeOut(cc.module.jsonFile['GameMain']['WinLoseAnim']['FadeOut']),
    //                                 FinalFunc);
    //     this.WinAnim_node.runAction(action);
    // },

    /**
     * [莊家通賠或通贏動畫]
     * @param {bool}        status 
     * @param {string}      _Event  莊家事件 {alllose:通賠,allwin:通贏}
     * @param {function}    _cb     回調 
     */
    show_banker_status:function(status,_Event,_cb){
        if(this.DebugMode) {console.log("%c[gamesystemInfo] => [show_banker_status] In action.",'color:'+this.DebugModeColor_FA);}

        let _Path,_Node;
        if(status){
            switch(_Event){
                case "allwin": 
                    _Path   = "dragonBones/"+_Event+"/";                  
                    _Node   = this.Banker_status_node;
                    cc.module.tools.loadDragonBones(true,_Node,_Path,_Event,1,"complete",_cb);
                    cc.module.audio.playEffect(this.Banker_Win);
                    break;
                case "alllose":  
                    _Path   = "dragonBones/"+_Event+"/";                  
                    _Node   = this.Banker_status_node;
                    cc.module.tools.loadDragonBones(true,_Node,_Path,_Event,1,"complete",_cb);
                    cc.module.audio.playEffect(this.Banker_Loss);
                    break;
                default: 
                    console.log("意外狀況!")               
                    break; 
            }
        } 

        this.Banker_status_node.active = status;
    },

    /**
     * [生成籌碼存在對應Array]
     * @param {number}    _num          籌碼數量
     * @param {number}    _nodeIndex    玩家seatIndex
     * @param {function}  _cb           回調
     */
    getChip: function(_num,_nodeIndex,_cb){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [getChip] In action.",'color:'+this.DebugModeColor_FA);}
        this.chipAnim_node.active = true;
        let seatArr = [cc.v2(830,-20),cc.v2(-150,360),cc.v2(-830,-20),cc.v2(-150,-360)];
        _num = Math.abs(_num);
        let _ones = _num % 10;
        let _tens = (_num - _ones) / 10;
        _num = _tens + _ones;
        
        for (var MJCount = 0 ; MJCount < _ones; MJCount++) {  //生成個位數籌碼
            if(this.chip_pool.size() > 0) {
                var _chip = this.chip_pool.get();            //取得預制體
                this.chipAnim_node.addChild(_chip);
                _chip.getComponent("chip").Init(seatArr[_nodeIndex],1);
                _chip.name =  "chip_1";
            }else{
                var _chip = cc.instantiate(this.chip);
                this.chipAnim_node.addChild(_chip);
                _chip.getComponent("chip").Init(seatArr[_nodeIndex],1);
                _chip.name =  "chip_1";
            }
            this.chipNodeObj[_nodeIndex].push(_chip);
        }

        for (var MJCount = 0 ; MJCount < _tens; MJCount++) {  //生成十位數籌碼   
            if(this.chip_pool.size() > 0) {
                var _chip = this.chip_pool.get();            //取得預制體
                this.chipAnim_node.addChild(_chip); 
                _chip.getComponent("chip").Init(seatArr[_nodeIndex],10);
                _chip.name =  "chip_10";
            }else{
                var _chip = cc.instantiate(this.chip);
                this.chipAnim_node.addChild(_chip); 
                _chip.getComponent("chip").Init(seatArr[_nodeIndex],10);
                _chip.name =  "chip_10";
            }
            this.chipNodeObj[_nodeIndex].push(_chip);
        }
    },

    /**
     * [投注籌碼動畫]
     * @param {boolean}   _animState    是否播放動畫(斷線重連:false)
     * @param {number}    _nodeIndex    目標籌碼Array:閒家投注 / 莊家賠付對象
     * @param {function}  _cb           回調
     * @param {boolean}   banker        是否為莊家賠付階段
     */
    dropChipAnim: function(_animState,_nodeIndex,_cb,banker){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [dropChipAnim] In action.",'color:'+this.DebugModeColor_FA);}
        let _nodeArr;
        if(banker){
            _nodeArr = this.chipBankerObj[_nodeIndex];
        }else{
            _nodeArr = this.chipNodeObj[_nodeIndex];
        }
        // this.chipNodeObj   = {0:[],1:[],2:[],3:[]};
        // this.chipBankerObj = {0:[],1:[],2:[],3:[]};


        if(_animState){
            let FinalFunc = cc.callFunc(function(){});
            for (var dCount = 0 ; dCount < _nodeArr.length; dCount++) {
                if(dCount >= _nodeArr.length - 1){
                    FinalFunc = cc.callFunc(function(){
                        if(typeof(_cb) == "function") {
                            _cb();
                        }
                    });
                }

                let seq = cc.sequence(
                    cc.moveTo(1,this.randomSite()).easing(cc.easeQuadraticActionInOut(10.0)),
                    cc.delayTime(0.5),
                    FinalFunc
                )
                _nodeArr[dCount].runAction(seq);
            }
        }else{
            for (var dCount = 0 ; dCount < _nodeArr.length; dCount++) {
                _nodeArr[dCount].setPosition(this.randomSite());
            }
        }
    },

    /**
     * [取得隨機位置] 範圍 x+-350、y+-120
     * @param {number}  ranX  x為-350~350  
     * @param {number}  ranY  y為-120~+120 
     */
    randomSite: function(){
        let ranX = (Math.random() - 0.5) * 2 * 350;          //x範圍+-350
        let ranY = (Math.random() - 0.5) * 2 * 120;          //y範圍+-120
        return cc.v2(ranX,ranY)
    },

    /** 
     * [獲得籌碼動畫]
     *  @param {number}    _nodeIndex     目標籌碼
     *  @param {number}    _seatIndex     移動終點
     *  @param {function}  _cb            回調
     *  @param {number}    _delay         延遲時間
     * */
    getChipAnim: function(_nodeIndex,_seatIndex,_cb,_delay){

        this.chipAnim_node.active = true;
        let seatArr = [cc.v2(830,-20),cc.v2(-150,360),cc.v2(-830,-20),cc.v2(-150,-360)];
        let FinalFunc = cc.callFunc(function(){});

        for(let cKey = 0; cKey < this.chipNodeObj[_nodeIndex].length; cKey++) {
            if(cKey >= this.chipNodeObj[_nodeIndex].length - 1){
                FinalFunc = cc.callFunc(function(){
                    if(typeof(_cb) == "function"){
                      _cb();  
                    }
                });
            }

            let spn = cc.spawn(
                cc.moveTo(0.5,seatArr[_seatIndex]),
                cc.fadeOut(0.5).easing(cc.easeQuinticActionIn(3.0))
                )
            let seq = cc.sequence(
                cc.delayTime(_delay*cKey),
                spn,
                cc.delayTime(0.5),
                FinalFunc
            )
            this.chipNodeObj[_nodeIndex][cKey].opacity = 255;
            this.chipNodeObj[_nodeIndex][cKey].runAction(seq);
        }
    },

    /**
     * [莊家生成籌碼]複製閒家投注資料
     * @param {number} _nodeIndex        贏錢閒家位置
     * @param {number} _bankerIndex      莊家位置
     */
    copyChipNode: function(_nodeIndex,_bankerIndex){
        // this.chipNodeObj   = {0:[],1:[],2:[],3:[]};
        // this.chipBankerObj = {0:[],1:[],2:[],3:[]};
        let self = this;
        self.chipAnim_node.active = true;
        let seatArr = [cc.v2(830,-20),cc.v2(-150,360),cc.v2(-830,-20),cc.v2(-150,-360)];
        let _winArr = this.chipNodeObj[_nodeIndex];
        for(let cKey = 0; cKey < _winArr.length; cKey++) {
            let _num = _winArr[cKey].getChildByName("label").getComponent(cc.Label).string;
            if(this.chip_pool.size() > 0) {
                var _chip = this.chip_pool.get();            //取得預制體
            }else{
                var _chip = cc.instantiate(this.chip);
            }
            this.chipAnim_node.addChild(_chip);                        //加入至子節點  
            _chip.getComponent("chip").Init(seatArr[_bankerIndex],_num);
            _chip.name = "chip_" + _num;
            this.chipBankerObj[_nodeIndex].push(_chip);
        }
    },

    /**
     * [贏錢閒家獲得兩倍投注籌碼]合併莊家賠付與閒家投注nodeArr
     * @param {number} _winIndex        贏錢閒家位置
     */
    bankerConcat: function(_winIndex){
        this.chipBankerObj[_winIndex].forEach(element => {
            this.chipNodeObj[_winIndex].push(element)    
        });
    },

    /**
     * [播放 開始/勝利/失敗 龍骨動畫]
     * @param {string}      _animName   龍骨動畫名稱 
     * @param {function}    _cb         回調
     */
    playAnim: function(_animName,_cb) {
        if(this.DebugMode) {console.log("%c [systemInfo.js] => [playAnim] In action.",'color:'+this.DebugModeColor);}

        let _AnimNode = this.PlayAnim_node;
        _AnimNode.setPosition(cc.v2(0,0));      //預設位置為(0,0)
        _AnimNode.active = true;
        let _Path;

        switch (_animName) {
            case "opne":
                cc.module.audio.playEffect(this.StartGameAudio);        //撥放音效
                _AnimNode.setPosition(cc.v2(0,-49));
                _Path = "dragonBones/victory/";
                cc.module.tools.loadDragonBones(true,_AnimNode,_Path,_animName,1,"complete",_cb);
                break;
            case "win":
                cc.module.audio.playEffect(this.WinAudio);        //撥放音效
                _Path = "dragonBones/victory/";
                cc.module.tools.loadDragonBones(true,_AnimNode,_Path,_animName,1,"complete",_cb);
                break;
            case "lose":
                cc.module.audio.playEffect(this.LoseAudio);        //撥放音效
                _Path = "dragonBones/victory/";
                cc.module.tools.loadDragonBones(true,_AnimNode,_Path,_animName,1,"complete",_cb);
                break;
            default:
                if(this.DebugMode) {console.log("%c [systemInfo.js] => [loadDragonBones] default.",'color:'+this.DebugModeColor);}
                break;
        }

        // StartGameAnim WinAnim
    },
    

});
