/** @file       userBox.js
  * @brief      敵人玩家腳本.
  * @author     OreoLi
  * @date       2019/03/20 16:32 */
 
cc.Class({
    extends: cc.Component,

    properties: {
        MainEBG_Atlas: cc.SpriteAtlas,          //主要圖片資源
        Main_en_Atlas: cc.SpriteAtlas,          //主要圖片資源 (英文)
        Main_tw_Atlas: cc.SpriteAtlas,          //主要圖片資源 (繁體)
        SystemMain_Atlas: cc.SpriteAtlas,       //系統圖片資源

        //userMsg底下所有子節點
        UserMsg_node:cc.Node,                   //使用者主節點
        UserMsgBG_node:cc.Node,                 //使用者視窗背景節點
        UserIcon_node:cc.Node,                  //使用者頭像
        UserTimers_progressBar:cc.ProgressBar,  //玩家倒數計時器節點
        UserTimers_node:cc.Node,                //玩家倒數計時器節點
        WinCoin_node: cc.Node,                  //定位用的跳錢位置
        Chips_label:cc.Label,                   //持有籌碼
        Name_label:cc.Label,                    //姓名
        banker_logo_node:cc.Node,               //莊家LOGO
        dice_index_node:cc.Node,                //骰盅指標
        user_label_node:cc.Node,                //莊家下面顯示文字
        //搶莊下注音效
        bankerAudio:            { default: [],      type: cc.AudioClip  },          //搶莊音效
        nobankerAudio:          { default: [],      type: cc.AudioClip  },          //不搶莊音效
        oddAudio:               { default: [],      type: cc.AudioClip  },          //發牌音效
        banker_logoAudio:       { default: null,    type: cc.AudioClip  },          //莊家LOGO音效
        dice_logoAudio:         { default: null,    type: cc.AudioClip  },          //骰盅LOGO音效

    },

    
    //一般參數於建構子時創建
    ctor(){
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.HeadUrl        = 0;            //使用者頭像ID => 初始化為0，僅替代本地頭像不串接，音效目前綁定頭像性別，取得頭像圖片名稱後userIcon_n，取得_n的數值，若為0則撥放女生音效，反之則男生
        this.AudioSex       = 0;            //音效性別 =>透過頭像判斷
        this.Sex            = 0;            //性別  {0:女生,1:男生}，但目前音效綁定是看頭像男女生
        this.UserSitDown    = 0;            //其他使用者坐下位置
        this.UserIndex      = -1;           //使用者索引值
        
        // this._Main_Atlas;                   //多國語系切換的主要圖集
    }, 

    /** 玩家userBox透過預制體創建後，先執行的畫面，後續當玩家離開座位，也可以call此func 
     *  @param      _JsonFile       map     {ThisPosi:{PosiX:X座標,PosiY:Y座標}}
    */
    Init: function(_JsonFile){
        if(this.DebugMode) {console.log("%c[userBox] => [Init] In action.",'color:'+this.DebugModeColor_FA);}

        //預設語系設置，判斷內存是否已有儲存語系，若無則預設為cn
        let _Language = cc.sys.localStorage.getItem("Language");
        if(!_Language || _Language == "") {
            _Language = 'cn';
        } 

        switch(_Language){
            case 'cn':
                this._Main_Atlas = this.MainEBG_Atlas;
                break;
            case 'tw':
                this._Main_Atlas = this.Main_tw_Atlas;
                break;
            case 'en':
                this._Main_Atlas = this.Main_en_Atlas;
                break;
            default:
                break;
        }


        //給予節點預設值
        this.node.active                        = false;                //關閉 此節點，因為玩家如果有坐下的話才會顯示頭框

        //userMsg底下所有子節點
        this.UserMsg_node.active                = false;                //關閉 使用者主節點
        this.UserMsgBG_node.active              = false;                //關閉 使用者視窗背景節點
        this.UserIcon_node.active               = false;                //關閉 使用者頭像
        this.UserTimers_progressBar.node.active = false;                //關閉 玩家倒數計時器節點
        this.UserTimers_node.active             = false;                //關閉 玩家倒數計時器節點
        this.WinCoin_node.active                = false;                //關閉 定位用的跳錢位置
        this.Chips_label.node.active            = false;                //關閉 持有籌碼
        this.Chips_label.string                 = 0;                    //設置 持有籌碼
        this.Name_label.node.active             = false;                //關閉 姓名
        this.Name_label.string                  = "";                   //設置 姓名
        this.banker_logo_node.active            = false;                //關閉 莊家LOGO
        this.dice_index_node.active             = false;                //關閉 骰盅指標
        this.user_label_node.active             = false;

        //參數設置
        this.HeadUrl        = 0;            //使用者頭像ID => 初始化為0，僅替代本地頭像不串接，音效目前綁定頭像性別，取得頭像圖片名稱後userIcon_n，取得_n的數值，若為0則撥放女生音效，反之則男生
        this.AudioSex       = 0;            //音效性別 =>透過頭像判斷
        this.Sex            = 0;            //性別  {0:女生,1:男生}，但目前音效綁定是看頭像男女生
        this.UserSitDown    = 0;            //其他使用者坐下位置
        this.UserIndex      = -1;           //使用者索引值

        //重新設置每位玩家位置對應的座標
        this.node.setPosition(cc.v2(_JsonFile['ThisPosi']['PosiX'],_JsonFile['ThisPosi']['PosiY']));
        this.UserIcon_node.getComponent(cc.Sprite).unscheduleAllCallbacks();   

    },

   /** [斷線重連] 設置目前使用者所有基礎訊息 
     *  @param  _Period              int             遊玩狀態{-1: 遊戲準備階段,0: 搶莊階段,1: 下注階段,2: 回合結算階段,3: 結算階段}
     *  @param  _PlayerInfo          map             玩家資訊
     *  @param  _Bidding              map            搶莊階段資訊
     *  @param  _Betting             map             出牌階段資訊
     *  @param  _RoundSettlement     map             結算階段資訊
     * 
     *  [PlayerInfo] map array
     *  Nickname	        string      	玩家暱稱
     *  SeatIdx	            float64	        玩家座位編號
     *  PlayerState 	    int	            玩家目前在牌局中的狀態{1: 遊戲中,0: 閒置中,-1: 觀戰中}
     *  HeadUrl	            string	        玩家頭像 初始化為0
     *  Gender	            string	        玩家性別{1: 男,0: 女}
     *  Credit          	float64	        玩家身上的籌碼金額
     *  Profit	            float64     	獲利
     *  Loss            	float64	        損失
     *  MaxiMagnification	float64	        玩家所能搶莊最大倍率
     *  MiniMagnification	float64	        玩家所能搶莊最小倍率列表
     *  MaxiOdds        	float64     	最大下注倍率(如等於-1則為莊家,不須下注)
     *  MiniOdds	        float64     	最小下注倍率(如等於-1則為莊家,不須下注)
     *  Magnification	    float64	        玩家已搶莊倍率(-1:代表尚未搶莊)
     *  Odds	            float64	        玩家已下注倍率(-1:代表未下注 or 莊家不須下注)
     *  IsWin	            int	            是否贏(有手牌此參數才有效){0:輸,1:贏,2:和局}
     *  Hands           	string array	玩家手牌(如為-1代表還沒拿到手牌){0:白皮,1:一筒,2:二筒,3:三筒,4:四筒,5:五筒,6:六筒,7:七筒,8:八筒,9:九筒}
     *  CardType	        int	            玩家牌型編號(如為-1代表還沒拿到手牌){0: 散牌,1: 二八,2: 豹子}
     *  CardTypePoint	    float64	        玩家牌型點數(如為-1代表還沒拿到手牌)
     *  RoundProfit	        float64	        此回合獲利
     *  RoundLoss	        float64	        此回合虧損
     * 
     *  [Bidding]
     *  ThinkingTime	    float64	        剩餘幾秒
     * 
     *  [Betting]
     *  DealerIdx	        int	            莊家SeatIndex
     *  Magnification	    float64     	莊家倍率
     *  ThinkingTime       	float64	        剩餘幾秒
     * 
     *  [RoundSettlement]
     *  ThinkingTime	    float64	        剩餘幾秒
     */
    ReJoinSetPlayerInfo: function(_Period,_PlayerInfo,_Bidding,_Betting,_RoundSettlement){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [ReJoinSetPlayerInfo] in action.",'color:'+this.DebugModeColor_FA);}
        
        
        //搶莊階段
        var _Period_0_Func = function(){
            console.log("搶莊階段");
            // let _UserData = {
            //     Credit:     _PlayerInfo['Credit'],
            //     SeatIndex:  _PlayerInfo['SeatIdx'],
            // }
            this.SetUserData(_PlayerInfo);             //設置 玩家資訊

            if(_Period == 0) {                                  //若為搶莊階段
                if(_PlayerInfo['Magnification'] == -1){          //尚未搶莊，則開啟計時器
                    this.SetTimer(_Bidding['ThinkingTime']);
                } else {
                    this.ReSetTimer();
                    this.show_bid("4",_PlayerInfo['Magnification'],_PlayerInfo['Gender'])
                }
            }
        }.bind(this);
 
        //下注階段
        var _Period_1_Func = function(){
            console.log("下注階段");

            // let _UserData = {
            //     Credit:     _PlayerInfo['Credit'],
            //     SeatIndex:  _PlayerInfo['SeatIdx'],
            // }
            this.SetUserData(_PlayerInfo);            //設置 玩家資訊

            //顯示莊家
            if(_Betting['DealerIdx'] != -1 && _Betting['DealerIdx'] == _PlayerInfo['SeatIdx']){
                this.bankerLogoAnim("BANKER-2");
            }

            if(_Period == 1) {                                  //若為下注階段
                if(_PlayerInfo['Odds'] == -1){          //尚未下注，則開啟計時器
                    this.SetTimer(_Bidding['ThinkingTime']);
                } else {
                    this.ReSetTimer();
                    this.show_bid("4",_PlayerInfo['Odds'],_PlayerInfo['Gender'])
                }
            }
        }.bind(this);
        //比牌階段(掀牌等動畫)
        var _Period_2_Func = function(){
            //顯示骰盅結果玩家
            if(_RoundSettlement['StartPlayerIdx'] != -1 && _RoundSettlement['StartPlayerIdx'] == _PlayerInfo['SeatIdx']){
                this.dice_index_node.active = true;
            }
           
        }.bind(this);

        var _Period_3_Func = function(){
            console.log("結算階段");               
            // var _winCombo = (0 - Math.ceil(Math.abs(_PlayerInfo['Loss']/cc.module.userParams.NowGameAntes))) + Math.ceil(_PlayerInfo['Profit']/cc.module.userParams.NowGameAntes);  //該玩家獲利倍數
            // this.WinAnim(false,_winCombo);
            this.GameEnd();   
            
            // if(_OnSettlement['WinnerIdx'] != _PlayerInfo['SeatIdx']){
            //     // this.MsgOut_node.active = true;
            // }
        }.bind(this);

        switch(parseFloat(_Period)) {
			case 0:         //搶莊階段
                _Period_0_Func();
                break;
            case 1:         //下注階段
                _Period_0_Func();
                _Period_1_Func();
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
                _Period_3_Func();
				break;
            default:        //斷線重連出現例外狀態
                console.log("斷線重連出現例外狀態");
                break;
        }
    },

    /** 
     * 繪製出對應的使用者資料
     *  @param _UserData    map             使用者資料
     * 
     *  HeadUrl	            string	        玩家頭像 初始化為1
     *  Gender	            string	        玩家性別 1: 男 0: 女
     *  Nickname	        string	        玩家暱稱
     *  Credit	            float64	        玩家身上的籌碼金額
     *  PlayerState	        int	            玩家目前在牌局中的狀態  {1: 遊戲中,0: 閒置中,-1: 觀戰中}
     *  Hands	            string array	玩家手牌內容
     */
    SetUserData: function(_UserData){
        if(this.DebugMode) {console.log("%c[userBox] => [UserSitData] In action.",'color:'+this.DebugModeColor_FA);}

        //參數設置
        this.HeadUrl                            = _UserData['HeadUrl'] != "" ? parseFloat(_UserData['HeadUrl']) : 0;       //使用者頭像ID => 初始化為0，僅替代本地頭像不串接，音效目前綁定頭像性別，取得頭像圖片名稱後userIcon_n，取得_n的數值，若為0則撥放女生音效，反之則男生
        this.AudioSex                           = parseFloat(this.HeadUrl) % 2;         //音效性別 =>透過頭像判斷
        this.Sex                                = _UserData['Gender'];                  //性別  {0:女生,1:男生}，但目前音效綁定是看頭像男女生
        this.UserSitDown                        = _UserData['SitDown'];                 //其他使用者坐下位置
        this.UserIndex                          = _UserData['SeatIndex'];
        


        //userMsg底下所有子節點
        this.UserMsg_node.active                = true;                 //開啟 使用者主節點
        this.UserMsgBG_node.active              = true;                 //開啟 使用者視窗背景節點
        this.UserIcon_node.active               = true;                 //開啟 使用者頭像
        this.UserIcon_node.getComponent(cc.Sprite).spriteFrame = this.SystemMain_Atlas.getSpriteFrame("userIcon_"+this.HeadUrl);
        this.Chips_label.node.active            = true;                 //開啟 持有籌碼
        this.SetChips(_UserData['Credit']);
        this.Name_label.node.active             = true;                 //開啟 姓名
        this.Name_label.string                  = _UserData['Nickname'];    //設置 姓名
       

        //開啟 此節點，因為玩家如果有坐下的話才會顯示頭框
        this.node.active                        = true;  
    },
 
    /** 重設持有籌碼 
     *  @param _Chips  float   籌碼金額
    */
    SetChips: function(_Chips){
        if(this.DebugMode) {console.log("%c[userBox] => [SetChips] In action.",'color:'+this.DebugModeColor_FA);}
        this.Chips_label.string         = cc.module.tools.formatFloatToFixed(_Chips,2);   
    },

    /** 取得玩家索引值，進行比對用  */
    GetUserIndex: function(){
        if(this.DebugMode) {console.log("%c[userBox] => [GetUserIndex] In action.",'color:'+this.DebugModeColor_FA);}
        return this.UserIndex; 
    },

    /** 取得使用者坐下位置 */
    GetUserSitDown: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [GetCardTypePosi] In action.",'color:'+this.DebugModeColor_FA);}
        return this.UserSitDown;
    },

    /** 設定倒數計時器 
     *  @param  _Timer      int     倒數時間
    */
    SetTimer: function(_Timer){
        if(this.DebugMode) {console.log("%c[userBox] => [SetTimer] In action.",'color:'+this.DebugModeColor_FA);}
        
        this.ReSetTimer();                                  //暫停所有計時器
        this.UserTimers_node.getChildByName("label").getComponent(cc.Label).string = _Timer;
        this.UserTimers_node.active = true;
        this.UserTimers_progressBar.progress = 1;           //先設定預設值
        this.UserTimers_progressBar.node.active = true;

        var tAnimCount =  parseFloat(_Timer) * parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleCount']);
        var totalCount =  parseFloat(_Timer) * parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleCount']);

        let _callback = function () {
            if(tAnimCount <= 0){
                this.ReSetTimer();
            } else {
                this.UserTimers_node.getChildByName("label").getComponent(cc.Label).string = Math.round(tAnimCount / parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleCount']));
                this.UserTimers_progressBar.progress -= cc.module.tools.formatFloat(1/totalCount,3);
                tAnimCount --;
            }
        }.bind(this);
        this.UserIcon_node.getComponent(cc.Sprite).schedule(_callback, parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleTime']));
    },

    /** 重新設定計時器 */
    ReSetTimer: function(){
        if(this.DebugMode) {console.log("%c[userBox] => [ReSetTimer] In action.",'color:'+this.DebugModeColor_FA);}
        this.UserTimers_node.active = false;
        this.UserTimers_progressBar.node.active     = false;
        this.UserTimers_progressBar.progress        = 1;
        this.UserIcon_node.getComponent(cc.Sprite).unscheduleAllCallbacks();      //關閉該節點所有計時器
    },

    /*
    // 搶莊或下注下方文字 //
    {1:不搶莊圖片,2:搶莊倍數圖片,3:思考中圖片,4:下注倍數圖片}
    */
   show_bid:function(_Event,_NUM,_Gender){
    if(this.DebugMode) {console.log("%c[userBox] => [show_bid] In action.",'color:'+this.DebugModeColor_FA);}
        switch(_Event){
            case "1":
                this.ReSetTimer();
                if(_Gender){
                    cc.module.audio.playEffect(this.nobankerAudio[0]);  //播放音效(只有女生音效)
                }else{
                    cc.module.audio.playEffect(this.nobankerAudio[0]);  //播放音效
                }
                this.user_label_node.active  =  true;
                this.user_label_node.getChildByName("num_label").getComponent(cc.Label).string ="";
                this.user_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("user_label1");//不搶莊圖片
                break;
            case "2":    
                if(_Gender){
                    cc.module.audio.playEffect(this.bankerAudio[0]);  //播放音效
                }else{
                    cc.module.audio.playEffect(this.bankerAudio[1]);  //播放音效
                }
                this.ReSetTimer();
                this.user_label_node.active  =  true;
                if(_NUM){
                    this.user_label_node.getChildByName("num_label").getComponent(cc.Label).string = _NUM;
                    this.user_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("user_label2"); //幾倍搶莊圖片
                }
                break;
            case "3":
                this.user_label_node.active  =  true;
                this.user_label_node.getChildByName("num_label").getComponent(cc.Label).string ="";
                this.user_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("user_label3");//思考中
                break;
            case "4":    
                if(_Gender){
                    cc.module.audio.playEffect(this.oddAudio[0]);  //播放音效
                }else{
                    cc.module.audio.playEffect(this.oddAudio[1]);  //播放音效
                }
                this.ReSetTimer();
                this.user_label_node.active  =  true;
                this.user_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("user_label4");  //幾倍投注圖片
                this.user_label_node.getChildByName("num_label").getComponent(cc.Label).string = _NUM;
                break;
            default: 
                this.user_label_node.active  =  false;                   
                break; 
        }      
    },

    // 開關 玩家下方提示
    State_info :function(_State){
        if(this.DebugMode) {console.log("%c[userBox] => [State_info] In action.",'color:'+this.DebugModeColor_FA);}
        if(_State){
            this.user_label_node.active = true;
        }else{
            this.user_label_node.active = false;
        }
    },

    // 顯示莊家LOGO
    // show_banker:function(_State,_CBFunc){
    //     if(this.DebugMode) {console.log("%c[userBox] => [show_banker] In action.",'color:'+this.DebugModeColor_FA);}
        
    //     var finishedFunc = cc.callFunc(function() { 
    //         cc.module.audio.playEffect(this.banker_logoAudio); //莊家LOGO音效
    //     }.bind(this));
    //     if(_State){
    //         this.banker_logo_node.active = true;
    //         let banker_logo = cc.sequence(
    //                             cc.delayTime(1),
    //                             finishedFunc,
    //                             cc.blink(2, 10),
    //                             cc.delayTime(1),
    //                           );
    //         this.banker_logo_node.runAction(banker_logo);
    //     }else{
    //         this.banker_logo_node.active = false;
    //     }
        
    // },

    //顯示骰盅結果LOGO
    ShowDiceIndex:function(_State,_cb){
        if(this.DebugMode) {console.log("%c[userBox] => [ShowDiceIndex] In action.",'color:'+this.DebugModeColor_FA);}
        
        //音效檔播放
        let PlayEffectFunc = cc.callFunc(function(){
            cc.module.audio.playEffect(self.dice_logoAudio); //莊家LOGO音效
        }.bind(this));

        var finishedFunc = cc.callFunc(function() { 
            if(typeof(_cb) != "undefined") {
                _cb();
            }
        }.bind(this));

        if(_State){
            this.dice_index_node.active = true;
            let dice_index = cc.sequence(
                                PlayEffectFunc,
                                cc.scaleTo(0.5,1.1,1.1),
                                cc.scaleTo(0.5,1.0,1.0),
                                finishedFunc,
                             );
            this.dice_index_node.runAction(dice_index);
        }else{
            this.dice_index_node.active = false;
        }
    },
   
    /** 回傳頭像節點，後續要轉為世界座標發送籌碼用 */
    GetUserIconNode: function(){
        if(this.DebugMode) {console.log("%c[userBox] => [GetUserIconNode] In action.",'color:'+this.DebugModeColor_FA);}
        return this.UserIcon_node;
    },

    /** 回傳跳錢節點，後續要轉為世界座標發送跳錢動畫用 */
    GetCoinNode: function(){
        if(this.DebugMode) {console.log("%c[userBox] => [GetCoinNode] In action.",'color:'+this.DebugModeColor_FA);}
        return this.WinCoin_node;
    },
    
    /** 遊戲結束事件 */
    GameEnd: function(){
        if(this.DebugMode) {console.log("%c[userBox] => [GameEnd] In action.",'color:'+this.DebugModeColor_FA);}
        this.ReSetTimer();
        this.banker_logo_node.active=false;
        this.dice_index_node.actibe = false;
        this.user_label_node.active = false;
    },

    /**
     * [播放 莊家 龍骨動畫]
     * @param {string}      _animName   龍骨動畫名稱 
     * @param {function}    _cb         回調
     * @param {node}        _PostNode   [發送目標]節點
     */
    bankerLogoAnim: function(_animName,_cb) {
        // if(this.DebugMode) {console.log("%c [userBox] => [bankerLogoAnim] In action.",'color:'+this.DebugModeColor);}

        let _AnimNode = this.banker_logo_node;
        _AnimNode.active = true;

        switch (_animName) {
            case "BANKER":
            case "BANKER-2":
                let _Path   = "dragonBones/banker/";
                cc.module.tools.loadDragonBones(true,_AnimNode,_Path,_animName,1,"complete",_cb);
                break;
            default:
                if(this.DebugMode) {console.log("%c [userBox] => [bankerLogoAnim] default.",'color:'+this.DebugModeColor);}
                _AnimNode.active = false;
                break;
        }
    },

}); 