/** @file       gameControllerPanel.js
  * @brief      主角玩家控制區主腳本.
  * @author     OreoLi
  * @date       2019/03/20 10:32 */

cc.Class({
    extends: cc.Component,

    properties: {
        MainEBG_Atlas:cc.SpriteAtlas,           //二八槓主要圖片資源
        Main_en_Atlas: cc.SpriteAtlas,          //主要圖片資源 (英文)
        Main_tw_Atlas: cc.SpriteAtlas,          //主要圖片資源 (繁體)
        SystemMain_Atlas: cc.SpriteAtlas,       //系統圖片資源

        //UserMsg底下所有子節點
        UserMsg_node:cc.Node,                   //使用者視窗主節點
        UserMsgBG_node:cc.Node,                 //背景節點
        UserIcon_node:cc.Node,                  //使用者頭像節點
        UserTimers_progressBar:cc.ProgressBar,  //玩家倒數計時器節點
        MsgTableAuto_node: cc.Node,             //自動配桌節點
        TableAntes_node:cc.Node,                //牌桌底注節點
        WinCoin_node:cc.Node,                   //結算獲利動畫節點(無限期影藏，因為只是用來回傳位置用)
        Chips_label:cc.Label,                   //持有籌碼文字敘述
        Name_label:cc.Label,                    //名稱文字敘述
        banker_logo_node:cc.Node,               //莊家LOGO
        user_timer_node:cc.Node,                //莊家旁邊小鬧鐘
        user_label_node:cc.Node,                //莊家下面顯示文字
        dice_index_node:cc.Node,                //骰盅指標

        //againMsg 底下所有子節點
        AgainMsg_node: cc.Node,                 //再來一局訊息主節點
        BtnAgain_node: cc.Node,                 //再來一局按鈕節點
        MsgNoCoinMsg_node:cc.Node,              //籌碼不足文字節點

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:        { default: null,    type: cc.AudioClip  },          //按鈕點擊音效載入
        BtnClickOffAudio:       { default: null,    type: cc.AudioClip  },          //按鈕無法點點擊音效載入
        CountDownAudio:         { default: null,    type: cc.AudioClip  },          //倒數音效
        DiceCupAudio:           { default: null,    type: cc.AudioClip  },          //搖骰音效
        MJ_openAudio:           { default: null,    type: cc.AudioClip  },          //MJ開牌
        banker_logoAudio:       { default: null,    type: cc.AudioClip  },          //莊家LOGO音效
        dice_logoAudio:         { default: null,    type: cc.AudioClip  },          //骰盅LOGO音效
        MJ_moveAudio:           { default: null,    type: cc.AudioClip  },          //MJ移動
        bankerAudio:            { default: [],      type: cc.AudioClip  },          //搶莊音效
        nobankerAudio:          { default: [],      type: cc.AudioClip  },          //不搶莊音效
        oddAudio:               { default: [],      type: cc.AudioClip  },          //發牌音效
        MJ_open:                { default: null,    type: cc.AudioClip  },          //發牌移動
        


        //統計出牌紀錄節點
        btn_statistics_node: cc.Node,                  //選單按鈕節點
        statistics_group_node: cc.Node,                 //詳細內容
        
        //搶莊拉霸節點
        banker_chip_node:cc.Node,
        select_chip_node:cc.Node,
        slider_label_node:cc.Node,
        btn_nobanker_node:cc.Node,
        chip_label_node:cc.Node,
        chip_num:cc.Label,
        btn_banker_node:cc.Node,
        progress:cc.Sprite,
        _width:0,

        //骰盅
        DiceCupBG_node:cc.Node,    
        DiceGroup_node:cc.Node, 

        // 麻將預置體
        MJ_Set_node:cc.Node,        //麻將預置體父節點
        MJ_Group:cc.Prefab,         //麻將預置體節點

        //結算視窗
        settlement_window_node:cc.Node,

    },

    ctor(){
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
        
        this.HandDice               = [];               //目前玩家手牌
        
        this._GameAgain_Func;       //再來一局方法委派
        this._GameInit_Func;        //再來一局後的cb方法委派
        
        this._Main_Atlas;           //多國語系切換的主要圖集
  
    },

    //開始遊戲前的初始化
    Init: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
        
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


        this.MsgTableAuto_node.active               = true;                             //開啟 自動配桌節點
        cc.module.userParams.TableAuto              = this.MsgTableAuto_node.getChildByName('check').active;

        //UserMsg底下所有子節點
        this.UserMsg_node.active                    = false;                            //開啟 使用者視窗主節點
        this.UserMsgBG_node.active                  = true;                             //開啟 背景節點
        this.UserIcon_node.active                   = true;                             //開啟 使用者頭像節點
        this.UserIcon_node.getComponent(cc.Sprite).spriteFrame = this.SystemMain_Atlas.getSpriteFrame("userIcon_"+cc.module.userParams.HeadUrl);
        this.UserTimers_progressBar.node.active     = false;                            //關閉 玩家倒數計時器節點
        this.TableAntes_node.active                 = true;                             //開啟 牌桌金額節點
        this.TableAntes_node.getChildByName('label').getComponent(cc.Label).string = cc.module.userParams.NowGameAntes;
        this.WinCoin_node.active                    = false;                            //關閉 結算獲利動畫節點(無限期影藏，因為只是用來回傳位置用)
        this.SetChips(cc.module.userParams.Credit);
        this.Name_label.string                      = cc.module.userParams.Nickname;    //設置 名稱文字敘述
        this.banker_logo_node.active                = false;                            //關閉 莊家LOGO
        this.user_timer_node.active                 = false;                            //關閉 莊家旁邊小鬧鐘
        this.user_label_node.active                 = false;                            //關閉 莊加下方文字節點         
        this.dice_index_node.active                 = false;                            //關閉 骰盅指標

        //againMsg 底下所有子節點
        this.AgainMsg_node.active                   = false;                            //關閉 再來一局訊息主節點
        this.BtnAgain_node.active                   = false;                            //關閉 再來一局按鈕節點
        this.MsgNoCoinMsg_node.active               = false;                            //關閉 籌碼不足文字節點

        //開啟 主角玩家主腳本節點
        this.node.active                            = true;   
        
        //其他參數設置
        this.HandDice                               = [];                               //目前玩家手牌
        cc.module.userParams.NowUserIndex           = -2;                               //初始化使用者索引值

        //停止動畫及計時器
        this.UserIcon_node.getComponent(cc.Sprite).unscheduleAllCallbacks();   

        //牌桌出牌紀錄按鈕
        this.btn_statistics_node.active             = false;    
        this.statistics_group_node.active           = false;

        // //拉籌碼
        this.banker_chip_node.active                = false;
        this.select_chip_node.active                = false;
        this.slider_label_node.active               = false;
        this.btn_nobanker_node.active               = false;
        this.chip_label_node.active                 = false;
        this.btn_banker_node.active                 = false;

        // 目前Slider狀態為(搶莊/下注)
        this.slider_state                           = "";

        // 骰盅
        this.node.getChildByName("handCard").active = true;
        this.DiceCupBG_node.active                  = false;                            //開啟 骰盅節點
        this.DiceGroup_node.active                  = false;                            //關閉 骰子集合節點，包含五顆骰子的圖樣以及爆炸動畫

        // 順序宣告
        this.user_order                             = [];                               //玩家開牌順序(依莊家下家開始-順時針)     
        this.mj_moveorder                           = [];                               //發牌順序(骰盅結果決定-順時針)
        this.mj_order                               = [];                               //玩家座位開始的預置體名稱順序
        
        // 結算視窗
        this.settlement_window_node.active          = false;

        // 創建預置體至緩存池
        this.MJ_pool   = new cc.NodePool();              //敵人玩家預製體的緩存池
        var _MJ_ShareNum = cc.module.jsonFile["GameMain"]["MJset"]["MJ_ShareNum"];   //要分成幾份
        for (var MJCount = 0; MJCount < _MJ_ShareNum; MJCount++) {     
            let _mj = cc.instantiate(this.MJ_Group);
            this.MJ_pool.put(_mj);
        }

        this.PutPrefab();

        //載入龍骨動畫
        cc.module.tools.loadDragonBonesAsset("dragonBones/banker/")

    },

    /**
     * 回收節點至節點池
     * @param {obj} _State          //回收目標節點
     */
    PutPrefab: function (_State) {
        if (this.DebugMode) { console.log("%c[gameControllerPanel] => [PutPrefab] in action.", 'color:' + this.DebugModeColor_FA); }

        if (_State) {
            this.MJ_pool.put(_State);
        } else {
            var _SetCount = this.MJ_Set_node.children.length;
            for (var MJCount = 0; MJCount < _SetCount; MJCount++) {
                this.MJ_pool.put(this.MJ_Set_node.children[0]);
            }
        }
        this.user_order = [];
        
        // this.MJ_Set_node.removeAllChildren(false);

    },

    /** 設置再來一局委派方法 
     *  @param      _GameAgain      function        再來一局清除畫面
     *  @param      _GameInit       function        再來一局執行成功後的遊戲初始化
    */
    SetAgainDelegate: function(_GameAgain,_GameInit){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [SetAgainDelegate] in action.",'color:'+this.DebugModeColor);}

        this._GameAgain_Func    = _GameAgain;
        this._GameInit_Func     = _GameInit;
    },
    
    /** [斷線重連] 設置目前使用者所有基礎訊息 
     *  @param  _Period              int             遊玩狀態{-1: 遊戲準備階段,0: 搶莊階段,1: 下注階段,2: 回合結算階段,3: 結算階段}
     *  @param  _PlayerInfo          map             玩家資訊
     *  @param  _RecordCardHistory   map             已發過牌的紀錄
     *  @param  _Bidding             map             搶莊階段資訊
     *  @param  _Betting             map             出牌階段資訊
     *  @param  _RoundSettlement     map             結算階段資訊
     *  @param  _Round               int             目前回合
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
     *  DiceList            int array	    每顆骰子骰出的點數 陣列
     *  StartPlayerIdx      int             開始發牌的玩家SeatIndex                
     * 
     *  [RecordCardHistory] map
     *  0	                int	            白皮所出現次數
     *  1	                int         	一筒所出現次數
     *  2	                int	            二筒所出現次數
     *  3	                int         	三筒所出現次數
     *  4	                int         	四筒所出現次數
     *  5	                int         	五筒所出現次數
     *  6	                int	            六筒所出現次數
     *  7	                int         	七筒所出現次數
     *  8	                int	            八筒所出現次數
     *  9	                int	            九筒所出現次數
     * 
     * 
     */

    ReJoinSetPlayerInfo: function(_Period,_PlayerInfo,_RecordCardHistory,_Bidding,_Betting,_RoundSettlement,_Round,_AllPlayerInfo){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [ReJoinSetPlayerInfo] in action.",'color:'+this.DebugModeColor_FA);}
        
        //搶莊階段
        var _Period_0_Func = function(){
            console.log("搶莊階段");

            this.TableAntes_node.getChildByName('round').getComponent(cc.Label).string = _Round+"/5";//設定回合數
            this.RecordCard(true,_RecordCardHistory); //設定子選單紀錄

            let _UserData = {
                Credit:     _PlayerInfo['Credit'],
                SeatIndex:  _PlayerInfo['SeatIdx'],
            }
            this.SetUserData(_UserData);             //設置 玩家資訊
            
            //判斷是否為搶莊階段
            if(_Period == 0) {      
                //尚未搶莊，則開啟計時器
                if(_PlayerInfo['Magnification'] == -1){          
                    this.SetTimer(Math.floor(_Bidding['ThinkingTime']));
                    this.SetSlider(_Round,"Bidding",_PlayerInfo['MaxiMagnification'],_PlayerInfo['MiniMagnification']);
                } else {
                    this.ReSetTimer();
                    this.SetSlider(false);
                    this.show_bid("2",_PlayerInfo['Magnification'],_PlayerInfo['Gender']);
                }
            }
        }.bind(this);
 
        //下注階段
        var _Period_1_Func = function(){
            console.log("下注階段");

            let _UserData = {
                Credit:     _PlayerInfo['Credit'],
                SeatIndex:  _PlayerInfo['SeatIdx'],
            }
            this.SetUserData(_UserData);            //設置 玩家資訊

            //顯示莊家
            if(_Betting['DealerIdx'] != -1 && _Betting['DealerIdx'] == _PlayerInfo['SeatIdx']){
                this.bankerLogoAnim("BANKER-2");
            }

            //判斷是否為下注階段
            if(_Period == 1) {   
                //尚未下注，則開啟計時器                               
                if(_PlayerInfo['Odds'] == -1){          
                    this.SetTimer(Math.floor(_Betting['ThinkingTime']));
                    this.SetSlider(_Round,"Betting",_PlayerInfo['MaxiOdds'],_PlayerInfo['MiniOdds']);
                } else {
                    this.ReSetTimer();
                    this.SetSlider(false);
                    this.show_bid("4",_PlayerInfo['Odds'],_PlayerInfo['Gender'])
                }
            }
       
        }.bind(this);

        //比牌階段(掀牌等動畫)
        var _Period_2_Func = function(){

            // //顯示骰盅結果
            // this.DiceGroup_node.getChildByName("dice_1").getComponent(cc.Sprite).spriteFrame = this.MainEBG_Atlas.getSpriteFrame("dice_"+_RoundSettlement['DiceList'][0]);
            // this.DiceGroup_node.getChildByName("dice_2").getComponent(cc.Sprite).spriteFrame = this.MainEBG_Atlas.getSpriteFrame("dice_"+_RoundSettlement['DiceList'][1]);
            // this.DiceGroup_node.active          = true;
            // this.DiceCupBG_node.opacity         = 150;
            
            //顯示骰盅結果玩家
            if(_RoundSettlement['StartPlayerIdx'] != -1 && _RoundSettlement['StartPlayerIdx'] == _PlayerInfo['SeatIdx']){
                this.dice_index_node.active = true;
            }
            //建構麻將預置體
            this.CreateMJ()
            this.SendMJ(false,_RoundSettlement['StartPlayerIdx']); //false => 關閉移位動畫
            this.OpenMJ(false,_Betting['DealerIdx'],_AllPlayerInfo,_RecordCardHistory,_RoundSettlement['ThinkingTime']); //false => 關閉移位動畫

        }.bind(this);

        var _Period_3_Func = function(){
            console.log("結算階段");    
            this.Show_settlement_window(true,_PlayerInfo['TurnRecord']);           
            this.GameEnd();   
        }.bind(this);

        switch(parseFloat(_Period)) {
			case 0:         //搶莊階段
                _Period_0_Func();
                break;
            case 1:         //下注階段
                _Period_0_Func();
                _Period_1_Func();
                break;
            case 2:         //比牌階段
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
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [SetUserData] in action.",'color:'+this.DebugModeColor_FA);}
        this.SetChips(_UserData['Credit']); //設置 目前玩家初始金額
        cc.module.userParams.NowUserIndex   = _UserData['SeatIndex'];           //設置 使用者索引值
        this.UserMsg_node.active                = true; 
        this.btn_statistics_node.active         = true; 
        this.Chips_label.active                 = true;
    },

    /** 重設持有籌碼 
     *  @param _Chips  float   籌碼金額
    */
    SetChips: function(_Chips){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [SetChips] In action.",'color:'+this.DebugModeColor_FA);}
        cc.module.userParams.Credit      = cc.module.tools.formatFloatToFixed(_Chips,2);          
        this.Chips_label.string  = cc.module.userParams.Credit;
    },

    /** 取得玩家索引值，進行比對用  */
    GetUserIndex: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [GetUserIndex] In action.",'color:'+this.DebugModeColor_FA);}
        return cc.module.userParams.NowUserIndex; 
    },
    
    GetUserIconNode: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [GetUserIconNode] In action.",'color:'+this.DebugModeColor_FA);}
        return this.UserIcon_node;
    },
    
    /** 回傳跳錢節點，後續要轉為世界座標發送跳錢動畫用 */
    GetCoinNode: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [GetCoinNode] In action.",'color:'+this.DebugModeColor_FA);}
        return this.WinCoin_node;
    },

    /** 開啟自動配桌開關 */
    BtnTableAutoOX:function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [BtnTableAutoOX] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio); 
        
        this.MsgTableAuto_node.getChildByName('check').active = !this.MsgTableAuto_node.getChildByName('check').active;

        // if(this.MsgTableAuto_node.getChildByName('check').active) {
        //     cc.sys.localStorage.setItem("TableAuto",1);
        // } else {
        //     cc.sys.localStorage.setItem("TableAuto",0);
        // }
        cc.module.userParams.TableAuto = this.MsgTableAuto_node.getChildByName('check').active;
    },

    /** 設定倒數計時器 
     *  @param _Timer           int         接受到的倒數時間上限
     *  @param _HandsJsonData   obj         取得手牌資訊集合
    */
   SetTimer: function(_Timer){
    if(this.DebugMode) {console.log("%c[gameControllerPanel] => [SetTimer] In action.",'color:'+this.DebugModeColor_FA);}

    this.ReSetTimer();                                                                          //暫停所有計時器
    this.UserTimers_progressBar.progress    = 1;                                                    //先設定預設值
    this.UserTimers_progressBar.node.active = true;  
    this.user_timer_node.active = true;                                             //開啟倒數計時框
    this.user_timer_node.getChildByName("time_label").getComponent(cc.Label).string = _Timer;

    var tAnimCount =  parseFloat(_Timer) * parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleCount']);
    var totalCount =  parseFloat(_Timer) * parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleCount']);

    let _callback = function () {
        if(tAnimCount < 0){
            this.UserTimers_progressBar.progress = 0;   //設定倒數框為0
            
            this.ReSetTimer();                          //暫停所有計時器

        } else {
            this.UserTimers_progressBar.progress -= cc.module.tools.formatFloat(1/totalCount,3);
            tAnimCount--; 

            if(tAnimCount % parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleCount']) == 0) {
                this.user_timer_node.getChildByName("time_label").getComponent(cc.Label).string =  Math.round(tAnimCount / parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleCount']));
            }

            switch(tAnimCount){
                case 40:
                case 30:
                case 20:
                case 10:
                case 0:
                    cc.module.audio.playEffect(this.CountDownAudio); //倒數音效
                    break;
                default:
                    break;
            } 
        }
    }.bind(this); 
    this.UserIcon_node.getComponent(cc.Sprite).schedule(_callback, parseFloat(cc.module.jsonFile['GameMain']['UserBox']['ReciprocalScheduleTime']));
},
    /** 重新設定計時器 */
    ReSetTimer: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [ReSetTimer] In action.",'color:'+this.DebugModeColor_FA);}

        this.SetSlider(false);                 //關閉 搶莊選單
        this.UserTimers_progressBar.node.active     = false;
        this.user_timer_node.active = false;   
        this.UserTimers_progressBar.progress        = 1;
        this.UserIcon_node.getComponent(cc.Sprite).unscheduleAllCallbacks();      //關閉該節點所有計時器
    },

    /** 發送封包至遊戲伺服器
     *
     * @topic string mqtt topic
     * @data  string mqtt payload 
     * @param _cb       function        callbackfunction，只有當回傳的code = 1的時候才執行*/
    SendMsg: function(topic, data, _cb)
    {
        cc.module.mqant.request(topic, data, function(destinationName, data) {
            console.log(destinationName);
            console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));

            var _JsonData   = JSON.parse(cc.module.mqant.parseUTF8(data));
            _cb(_JsonData);
        });
    },
    
    /** 遊戲結束 */
    GameEnd: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [GameEnd] In action.",'color:'+this.DebugModeColor_FA);}
        this.ReSetTimer();                      //停止計時器
        this.SetSlider(false);                 //關閉 拉霸選單
        this.BtnSubMenu(false);                   //關閉 下注選單
        this.banker_logo_node.active=false;
        this.dice_index_node.actibe = false;
        this.user_label_node.active = false;
    },
    
    /** 顯示再來一局按鈕供玩家點擊 */
    ShowPlayAgain: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [ShowPlayAgain] In action.",'color:'+this.DebugModeColor_FA);}
        this.AgainMsg_node.active       = true;
        this.BtnAgain_node.getComponent(cc.Button).interactable   = true;
        this.BtnAgain_node.active       = true;
    },

    /** 顯示沒有錢繼續遊玩，並出現訊息倒數跳轉 */
    ShowNoCoinPlayAgaig: function(){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [ShowNoCoinPlayAgaig] In action.",'color:'+this.DebugModeColor_FA);}
        
        this.AgainMsg_node.active       = true;
        this.MsgNoCoinMsg_node.active   = true;

        let tAnimCount = cc.module.jsonFile['GameMain']['NoCoinBackHallTime'];
        let _NoCoinCallback = function () {
            if(tAnimCount == 0){
                // cc.module.network.DestroyBackHall();  //返回大廳
                
                //返回盤口
                let _BackHallSuccessCB = function(){
                    cc.module.joinroom.CloseJoinRoom();         //中斷配桌腳本
                    cc.director.loadScene("antesPlaceMain");    //轉跳場景
                }.bind(this);
                cc.module.network.BackAntesPlace(_BackHallSuccessCB,function(){});    //轉跳回盤口
            } else {
                this.MsgNoCoinMsg_node.getChildByName('label').getComponent(cc.Label).string = tAnimCount;
                tAnimCount--;
            }
        }.bind(this); 
        this.MsgNoCoinMsg_node.getChildByName('label').getComponent(cc.Label).schedule(_NoCoinCallback, 1);
    },

    /** 再來一局 */
    BtnGameAgain:function(_cb){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [GameAgain] In action.",'color:'+this.DebugModeColor_FA);}
        
        if(this.BtnAgain_node.getComponent(cc.Button).interactable) {
            this.BtnAgain_node.getComponent(cc.Button).interactable   = false;
            this._GameAgain_Func();
            cc.module.audio.playEffect(this.BtnClickOnAudio); 
            var _RaiseFunc = function(_JsonData){
                var _Result = JSON.parse(_JsonData['Result']);
                // console.log(_JsonData);
                console.log(_Result);
                switch(parseFloat(_Result['Code'])){
                    case 1:     console.log("點擊[再來一局]-請求成功");    
                                this.SetChips(_Result['Data']['Credit']);
                                this._GameInit_Func();       
                                break;
                    case -1:    console.log("點擊[再來一局]-請求失敗");        break;
                    case -2:    console.log("點擊[再來一局]-參數錯誤");        break;
                    default:    console.log("點擊[再來一局]-進入例外狀況");    break;
                }
            }.bind(this);
            this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_PlayAgain", {"BigRoomID":cc.module.userParams.RoomID},_RaiseFunc);
        }
        
    },

    // 搶莊或下注 拉霸
    SetSlider:function(_Round,_Event,_max,_min){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [SetSlider] in action.",'color:'+this.DebugModeColor_FA);}
        
        if(_Round!=false && _max != -1 && _min != -1){
            
            let slider = this.select_chip_node.getComponent(cc.Slider);
            let self = this;
            // console.log("回合:",_Round);
            // console.log("搶莊或下注:",_Event);
            // console.log("拉霸最大:",_max);
            // console.log("拉霸最小:",_min);
            switch(_Event){
                case "Bidding": 
                    if(this.DebugMode) {console.log("%c[gameControllerPanel] => [SetSlider-Bidding] in action.",'color:'+this.DebugModeColor_FA);}    
                    
                    this.slider_state = "Bidding";//目前狀態(搶莊/下注)
                    
                    //拉籌碼
                    this.select_chip_node.active                    = true;
                    this.slider_label_node.active                   = true;
                    this.slider_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("chip_label2");//拉霸上方文字搶莊
                    this.banker_chip_node.active                    = true;
                    this.btn_nobanker_node.active                   = true;
                    this.chip_label_node.active                     = true;
                    this.btn_banker_node.active                     = true;
                    this.TableAntes_node.getChildByName('round').getComponent(cc.Label).string = _Round+"/5";  //目前回合數
                    // 初始化拉條
                    this.progress.node.width                        = 0      ;
                    slider.progress                                 = 0      ;
                    this.chip_num.string                            = _min   ;
                    
                    if(slider == null || this.progress == null){
                        return;
                    }
                    this._width = 710; //拉霸框度
                    this.progress.node.width = this._width * slider.progress;
                    slider.node.on('slide', function(event){
                        let chip_number = Math.round(cc.module.tools.formatFloat(200*slider.progress,2));
                        this.chip_num.string = chip_number>_min?Math.round(cc.module.tools.formatFloat(_max*slider.progress,2)):_min;
                        self.progress.node.width = slider.progress * self._width;
                    }, this);
                    break;

                case "Betting": 
                    if(this.DebugMode) {console.log("%c[gameControllerPanel] => [SetSlider-Betting] in action.",'color:'+this.DebugModeColor_FA);}    
                    this.slider_state = "Betting";//目前狀態(搶莊/下注)
                    
                    //拉籌碼
                    this.banker_chip_node.active                    = true;
                    this.select_chip_node.active                    = true;
                    this.slider_label_node.active                   = true;
                    this.slider_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("chip_label1");;
                    this.btn_nobanker_node.active                   = false;
                    this.chip_label_node.active                     = true;
                    this.btn_banker_node.active                     = true;
                    // 初始化拉條
                    this.progress.node.width                        = 0      ;
                    slider.progress                                 = 0      ;
                    this.chip_num.string                            = _min   ;

                    if(slider == null || this.progress == null){
                        return;
                    }
                    this._width = 710; //拉霸框度
                    this.progress.node.width = this._width * slider.progress;
                    slider.node.on('slide', function(event){
                        let chip_number = Math.round(cc.module.tools.formatFloat(_max*slider.progress,2));
                        this.chip_num.string = chip_number;
                        self.progress.node.width = slider.progress * self._width;
                    }, this);
            
                    break;
                
                default:    
                    console.log("Slider-進入例外狀況"); 
                    console.log(_Event);
                    break;
            }     
            
        }
       else{
            this.banker_chip_node.active                    = false;
            this.select_chip_node.active                    = false;
            this.slider_label_node.active                   = false;
            this.btn_nobanker_node.active                   = false;
            this.chip_label_node.active                     = false;
            this.btn_banker_node.active                     = false;
       }
        
    },

    // 搶莊或下注的按鈕動作
    btn_banker :function(event, customEvent){

        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [btn_banker] In action.",'color:'+this.DebugModeColor_FA);}
        cc.module.audio.playEffect(this.BtnClickOnAudio); //點擊音效
        // 搶莊CB_
        var _BankerFunc = function(_JsonData){
            if(this.DebugMode) {console.log("%c[gameControllerPanel] => [btn_banker] 點擊[搶莊].",'color:'+this.DebugModeColor_GET);}
            var _Result = JSON.parse(_JsonData['Result']);
            switch(parseFloat(_Result['Code'])){
                case 1:     console.log("點擊[搶莊]-請求成功");                
                            this.SetSlider(false); break;
                case -4:    console.log("點擊[搶莊]-不允許的請求時間");                break;
                case -11:   console.log("點擊[搶莊]-選擇搶莊的倍率不再搶莊倍率中");     break;
                case -12:   console.log("點擊[搶莊]-已決定過搶莊倍數");                break;
                default:    console.log("點擊[搶莊]-進入例外狀況");                    break;
            }
        }.bind(this);
        // 下注CB_
        var _oddsFunc = function(_JsonData){
            if(this.DebugMode) {console.log("%c[gameControllerPanel] => [btn_banker] 點擊[搶莊].",'color:'+this.DebugModeColor_GET);}
            var _Result = JSON.parse(_JsonData['Result']);
            switch(parseFloat(_Result['Code'])){
                case 1:     console.log("點擊[下注]-請求成功");                
                            this.SetSlider(false); break;
                case -4:    console.log("點擊[下注]-不允許的請求時間");                         break;
                case -13:   console.log("點擊[下注]-選擇下注倍率不再下注倍率中");                break;
                case -14:   console.log("點擊[下注]-已決定過搶莊倍數");                         break;
                case -15:   console.log("點擊[下注]-莊家無法下注啦啦啦");                       break;
                case -16:   console.log("點擊[下注]-已決定過下注倍數");                         break;
                default:    console.log("點擊[下注]-下注倍率乘上底注，你賠不起請在試一次");       break;
            }
        }.bind(this);

        switch(this.slider_state){
            case "Bidding" :
                    if(customEvent=="1"){
                        let Magnification = this.chip_num.string;
                        this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_Bid", {"Magnification":cc.module.tools.formatFloat(Magnification,2)},_BankerFunc);
                    }else{
                        let Magnification = 0;
                        this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_Bid", {"Magnification":cc.module.tools.formatFloat(Magnification,2)},_BankerFunc);
                    }
                break;

            case "Betting" :
                    if(customEvent){
                        let Odds = this.chip_num.string;
                        this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_Bet", {"Odds":cc.module.tools.formatFloat(Odds,2)},_oddsFunc);
                    }
                break;
        }
        
        
    },

    
    /*
    搶莊或下注下方文字
    {1:不搶莊圖片,2:搶莊倍數圖片,3:思考中圖片,4:下注倍數圖片}
    */
    show_bid:function(_Event,_NUM,_Gender){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [show_bid] In action.",'color:'+this.DebugModeColor_FA);}
        switch(_Event){

                case "1":

                    if(_Gender){
                        cc.module.audio.playEffect(this.nobankerAudio[0]);  //播放音效(只有女生音效)
                    }else{
                        cc.module.audio.playEffect(this.nobankerAudio[0]);  //播放音效
                    }
                    this.ReSetTimer();
                    this.user_label_node.active     =   true;
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
                    this.user_label_node.active     =   true;
                    if(_NUM){
                        this.user_label_node.getChildByName("num_label").getComponent(cc.Label).string = _NUM;
                        this.user_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("user_label2"); //幾倍搶莊圖片
                    }
                    break;

                case "3":
                    
                    this.user_label_node.active     =   true;
                    this.user_label_node.getChildByName("num_label").getComponent(cc.Label).string ="";
                    this.user_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("user_label3");//思考中
                    break;

                case "4":    
                    
                    this.ReSetTimer();
                    if(_Gender){
                        cc.module.audio.playEffect(this.oddAudio[0]);  //播放音效
                    }else{
                        cc.module.audio.playEffect(this.oddAudio[1]);  //播放音效
                    }
                    this.user_label_node.active     =   true;
                    this.user_label_node.getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("user_label4");  //幾倍投注圖片
                    this.user_label_node.getChildByName("num_label").getComponent(cc.Label).string = _NUM;
                    break;

                default: 
                    // console.log("uesr_label closed!");
                    this.user_label_node.active     =   false;                   
                    break; 
        }
             
    },

    // 顯示莊家LOGO
    // show_banker:function(_State){
    //     if(this.DebugMode) {console.log("%c[gameControllerPanel] => [show_banker] In action.",'color:'+this.DebugModeColor_FA);}
        
    //     var finishedFunc = cc.callFunc(function() { 
    //         cc.module.audio.playEffect(this.banker_logoAudio); //莊家LOGO音效
    //     }.bind(this));

    //     if(_State){
    //         this.banker_logo_node.active = true;
    //         let banker_logo = cc.sequence(
    //             cc.delayTime(1),
    //             finishedFunc,
    //             cc.blink(2, 10),
    //             cc.delayTime(1),
    //             );
    //             this.banker_logo_node.runAction(banker_logo);
    //     }else{
    //         this.banker_logo_node.active = false;
    //     }
    // },

    //搖骰動畫
    DiceCupAnim :function(_JsonData,_cb){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [DiceCupAnim] in action.",'color:'+this.DebugModeColor_FA);}
        
        this.DiceCupBG_node.active          = true;     //開啟 骰盅節點
        this.DiceGroup_node.active          = false;    //關閉 骰子集合節點，包含五顆骰子的圖樣以及爆炸動畫
        this.DiceCupBG_node.opacity         = 255;      //設置 透明度
        cc.module.audio.playEffect(this.DiceCupAudio);  //播放音效
        
        this.DiceGroup_node.getChildByName("dice_1").getComponent(cc.Sprite).spriteFrame = this.MainEBG_Atlas.getSpriteFrame("dice_"+_JsonData['DiceList'][0]);
        this.DiceGroup_node.getChildByName("dice_2").getComponent(cc.Sprite).spriteFrame = this.MainEBG_Atlas.getSpriteFrame("dice_"+_JsonData['DiceList'][1]);
        
        //動畫結束後開啟骰子節點
        var finishedFunc = cc.callFunc(function() { 
            
            this.DiceGroup_node.active          = true;
            this.DiceCupBG_node.opacity         = 150;      //設置 透明度
            if(typeof(_cb) != "undefined"){
                _cb();
            }
        }.bind(this));

        this.DCAction = cc.sequence(    cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],                                               cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateLeft']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateRight']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateLeft']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateRight']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateLeft']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateRight']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateLeft']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateRight']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateLeft']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateRight']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateLeft']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateRight']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['Start']['RotateLeft']),
                                        cc.rotateTo(cc.module.jsonFile['GameMain']['DiceCupAnim']['End']['AnimTime'],cc.module.jsonFile['GameMain']['DiceCupAnim']['End']['Rotate']),
                                        finishedFunc);
        this.DCAction.easing(cc.easeSineOut(3.0)); //啟用緩速時間曲線，來模擬人手搖的手感
        this.DiceCupBG_node.runAction(this.DCAction);//跑動畫

    },

    //骰裝結果動畫
    ShowDiceIndex:function(_State,_cb){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [ShowDiceIndex] In action.",'color:'+this.DebugModeColor_FA);}
        
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
    
    /** 
     * [建構麻將預製體]
     *  @param {boolean} _AnimState    是否需要動畫
     *  @param {function} _cb           回調
     * */
    CreateMJ: function(_AnimState,_cb){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [CreateMJ] In action.",'color:'+this.DebugModeColor_FA);}
        
        this.DiceCupBG_node.active          = false;     //關閉 骰盅節點
        this.DiceGroup_node.active          = false;     //關閉 骰子集合節點，包含五顆骰子的圖樣以及爆炸動畫
        this.MJ_Set_node.active = true;
        this.MJ_Set_node.opacity            = 0;         //設置 透明度

        var _MJ_ShareNum = cc.module.jsonFile["GameMain"]["MJset"]["MJ_ShareNum"];   //要分成幾份

        for (var MJCount = 0 ; MJCount < _MJ_ShareNum; MJCount++) {
            //麻將預置體初始化
            if(this.MJ_pool.size() > 0) {
                var _MJ = this.MJ_pool.get();            //取得預制體
                _MJ.getComponent("MJ_Group").Init();
            }else{
                var _MJ = cc.instantiate(this.MJ_Group);
            }
            
            this.MJ_Set_node.addChild(_MJ);                          //加入至子節點
            _MJ.setPosition(cc.v2(cc.module.jsonFile["GameMain"]["MJset"]["MJ_table"][MJCount]['ThisPosi']['PosiX'],cc.module.jsonFile["GameMain"]["MJset"]["MJ_table"][MJCount]['ThisPosi']['PosiY']));
            _MJ.name = "MJ_Group"+MJCount;
            this.MJ_Set_node.children[MJCount].old_order = MJCount; //紀錄原始圖層
            this.user_order.push(this.MJ_Set_node.children[MJCount])
        }        

        if(_AnimState){
            let _EndMove = cc.callFunc(function() {
                if(typeof(_cb) != "undefined") _cb();    //執行callback
            }.bind(this));

            let mj_action = cc.sequence(
                cc.fadeIn(0.5),
                _EndMove,
                );

            this.MJ_Set_node.runAction(mj_action)
        }else{
            this.MJ_Set_node.opacity = 255;
        }
    },

    /**
     * [麻將發牌]以起始位置起逆時針發牌
     * @param {*} _AnimState    是否需要動畫
     * @param {*} _StartPlayer  起始發牌位置
     * @param {*} _cb           回調 
     */
    SendMJ:function(_AnimState, _StartPlayer, _cb){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [SendMJ] In action.",'color:'+this.DebugModeColor_FA);}

        var _MJ_ShareNum = cc.module.jsonFile["GameMain"]["MJset"]["MJ_ShareNum"];   //要分成幾份

        // mj_moveorder  發牌順序
        // mj_order      (玩家座位)開始的預置體名稱順序 MJ_Group+{{num}}
        switch(_StartPlayer){
            case 0:
                this.mj_moveorder = [0,1,2,3];
                break;
            case 1:
                this.mj_moveorder = [1,2,3,0];
                break;
            case 2:
                this.mj_moveorder = [2,3,0,1];
                break;
            case 3:
                this.mj_moveorder = [3,0,1,2];
                break;    
            default:
                console.log("_StartPlayer沒東西啦QQ")
                break;
        }

        // 判斷有沒有需要動畫(斷線重連)
        if(_AnimState){
            //user_order
            for (let MJCount = 0; MJCount < _MJ_ShareNum; MJCount++) {   

                let _MoveSound = cc.callFunc(function() {
                    cc.module.audio.playEffect(this.MJ_open);  //播放音效
                }.bind(this));
                
                let _EndMove = cc.callFunc(function() {
                    if(MJCount >= _MJ_ShareNum -1 && typeof(_cb) != "undefined") _cb();    //最後一個麻將執行callback
                }.bind(this));

                var mj_move = cc.sequence(
                    cc.delayTime(MJCount*0.5),
                    cc.moveTo(0.5,cc.v2(cc.module.jsonFile["GameMain"]["MJset"]["MJ_user"][this.mj_moveorder[MJCount]]['ThisPosi']['PosiX'],cc.module.jsonFile["GameMain"]["MJset"]["MJ_user"][this.mj_moveorder[MJCount]]['ThisPosi']['PosiY'])).easing(cc.easeQuadraticActionInOut(10.0)),
                    _MoveSound,
                    _EndMove,
                    );
                this.user_order[MJCount].runAction(mj_move);
            }
            
        }else{
            for (var MJCount = 0; MJCount < _MJ_ShareNum; MJCount++) {     
                this.user_order[MJCount].x = cc.module.jsonFile["GameMain"]["MJset"]["MJ_user"][this.mj_moveorder[MJCount]]['ThisPosi']['PosiX'];
                this.user_order[MJCount].y = cc.module.jsonFile["GameMain"]["MJset"]["MJ_user"][this.mj_moveorder[MJCount]]['ThisPosi']['PosiY'];    
            }
        }
    },



    OpenMJ:function(_AnimState,_BankerIdx,_PlayerList,_RecordCardHistory,ThinkingTime,_Playergender,_cb){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [OpenMj] in action."+_AnimState,'color:'+this.DebugModeColor_FA);}

        var _MJ_ShareNum = cc.module.jsonFile["GameMain"]["MJset"]["MJ_ShareNum"];   //玩家人數幾份麻將

        // 判斷要不要掀牌動畫(斷線重連)
        if(_AnimState){
                // 掀牌動畫
            for (let MJCount = 0; MJCount < _MJ_ShareNum; MJCount++) {
                //以初始發牌者開始開牌
                let _MJ_node = this.user_order[MJCount];

                let MJ1_open = cc.callFunc(function() {
                    cc.module.audio.playEffect(this.MJ_openAudio);  //播放音效
                    _MJ_node.getChildByName("MJ_1").getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("MJ"+_PlayerList[this.mj_moveorder[MJCount]]['Hands'][0]);
                }.bind(this));

                let MJ2_open = cc.callFunc(function() {
                    cc.module.audio.playEffect(this.MJ_openAudio);  //播放音效
                    _MJ_node.getChildByName("MJ_2").getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("MJ"+_PlayerList[this.mj_moveorder[MJCount]]['Hands'][1]);
                }.bind(this));


                let _FinishedFunc;
                if(MJCount >= _MJ_ShareNum -1) {
                    _FinishedFunc = function() {
                        this.RecordCard(true,_RecordCardHistory);
                        if(typeof(_cb) == "function") {
                            _cb();    //最後一個麻將執行callback
                        } 
                    }.bind(this);
                }

                let show_MJ_info = cc.callFunc(function() {
                    _MJ_node.getComponent("MJ_Group").show_MJ_info(_PlayerList[this.mj_moveorder[MJCount]]['Hands'][0],_PlayerList[this.mj_moveorder[MJCount]]['Hands'][1],_Playergender[this.mj_moveorder[MJCount]]['Gender'],_FinishedFunc);
                }.bind(this));

                

                let mj_big = cc.sequence(
                    cc.delayTime(MJCount*1.3),
                    MJ1_open,
                    cc.delayTime(0.3),
                    MJ2_open,
                    cc.delayTime(0.3),
                    show_MJ_info
                    );
                // console.log("執行動畫的預置體為:",_MJ_node);
                _MJ_node.runAction(mj_big);
            }
        }else{
            for (let MJCount = 0; MJCount < _MJ_ShareNum; MJCount++) {   
                let _MJ_node = this.user_order[MJCount];

                    _MJ_node.getChildByName("MJ_1").getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("MJ"+_PlayerList[this.mj_moveorder[MJCount]]['Hands'][0]);
                    _MJ_node.getChildByName("MJ_2").getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("MJ"+_PlayerList[this.mj_moveorder[MJCount]]['Hands'][1]);
                    _MJ_node.getComponent("MJ_Group").show_MJ_info(_PlayerList[this.mj_moveorder[MJCount]]['Hands'][0],_PlayerList[this.mj_moveorder[MJCount]]['Hands'][1]);
            }
            //更新子選單紀錄.刪除麻將
            this.scheduleOnce(function() {
            this.RecordCard(true,_RecordCardHistory);
            }, ThinkingTime);
        }
    },

    //更新子選單出牌紀錄 
    RecordCard: function(_State,_Data){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [RecordCard] in action.",'color:'+this.DebugModeColor_FA);}
        // _State 更新紀錄或歸零
            if(_State){
                for (let MJData in _Data) {
                    this.statistics_group_node.children[MJData].getComponent(cc.Label).string = _Data[MJData];
                }
            }else{
                for (var MJCount = 0; MJCount < 10; MJCount++) {     
                    this.statistics_group_node.children[MJCount].getComponent(cc.Label).string = 0;
                }
            }
    },

    /**
     * [出牌紀錄子選單按鈕點擊事件] 
     * @param {obj} event    點擊事件對象
     * @param {int} _State   {0:關閉,1:開啟}
     */  
    BtnSubMenu: function(event,_State){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [BtnSubMenu] in action.",'color:'+this.DebugModeColor_FA);}
        if(_State == 1){
            cc.module.audio.playEffect(this.BtnClickOnAudio); 
            this.statistics_group_node.active  = !this.statistics_group_node.active;             //開啟 子選單結構
        }
    },

    Show_settlement_window: function(_status,_TurnRecord,_cb){
        if(this.DebugMode) {console.log("%c[gameControllerPanel] => [Show_settlement_window] in action.",'color:'+this.DebugModeColor_FA);}
        if(_status && _TurnRecord!=-1){
            //將莊家圖示關掉
            let _bankerIcon = this.settlement_window_node.getChildByName("window_bnaker").children;
            for(var _round = 0; _round < _bankerIcon.length; _round++) {
                this.settlement_window_node.getChildByName("window_bnaker").getChildByName("banker"+(_round+1)).active=false;
            }
            //開啟結算視窗
            this.settlement_window_node.active  =  true;
            // return;
            let totalProfit = 0;
            for(var _round = 0; _round < _TurnRecord.length; _round++) {
                this.settlement_window_node.getChildByName('window_label').getChildByName('round'+(_round+1)).getChildByName('round').getComponent(cc.Label).string = _TurnRecord[_round]['Turn']
                //底分
                this.settlement_window_node.getChildByName('window_label').getChildByName('round'+(_round+1)).getChildByName('antes').getComponent(cc.Label).string = cc.module.userParams.NowGameAntes;
                // 莊家LOGO
                if(_TurnRecord[_round]['IsBanker']==true){
                    this.settlement_window_node.getChildByName("window_bnaker").getChildByName("banker"+(_round+1)).active=true;
                    this.settlement_window_node.getChildByName('window_label').getChildByName('round'+(_round+1)).getChildByName('bid').getComponent(cc.Label).string = Math.abs(_TurnRecord[_round]['TurnProfitLossOdds']);
                }else{
                    this.settlement_window_node.getChildByName("window_bnaker").getChildByName("banker"+(_round+1)).active=false;
                    this.settlement_window_node.getChildByName('window_label').getChildByName('round'+(_round+1)).getChildByName('bid').getComponent(cc.Label).string = _TurnRecord[_round]['Odds'];
                }

                //回合總獲利
                let _roundProfit = _TurnRecord[_round]['TurnProfit']+_TurnRecord[_round]['TurnLoss'];
                totalProfit +=  _roundProfit;

                if(_roundProfit>0){
                    // 獲利
                    this.settlement_window_node.getChildByName('window_label').getChildByName('round'+(_round+1)).getChildByName('payout').color = cc.color(0,153,68,255);
                    this.settlement_window_node.getChildByName('window_label').getChildByName('round'+(_round+1)).getChildByName('payout').getComponent(cc.Label).string = "+"+cc.module.tools.formatFloat(_roundProfit,2);
                }else{
                    //虧損
                    this.settlement_window_node.getChildByName('window_label').getChildByName('round'+(_round+1)).getChildByName('payout').color = cc.color(195,13,35,255);
                    this.settlement_window_node.getChildByName('window_label').getChildByName('round'+(_round+1)).getChildByName('payout').getComponent(cc.Label).string = cc.module.tools.formatFloat(_roundProfit,2);
                }
            } 

            //總獲利
            if(totalProfit>0){
                // 獲利
                this.settlement_window_node.getChildByName('window_label').getChildByName('total').color = cc.color(0,153,68,255);
                this.settlement_window_node.getChildByName('window_label').getChildByName('total').getComponent(cc.Label).string = "+"+cc.module.tools.formatFloat(totalProfit,2)
            }else{
                //虧損
                this.settlement_window_node.getChildByName('window_label').getChildByName('total').color = cc.color(195,13,35,255);
                this.settlement_window_node.getChildByName('window_label').getChildByName('total').getComponent(cc.Label).string = cc.module.tools.formatFloat(totalProfit,2);
            }

        }else{
            //關閉結算視窗
            this.settlement_window_node.active  =  false;
        }

        if(typeof(_cb) != "undefined") {
            _cb();
        }
        
        // this.settlement_window_node.getChildByName('')
    },

    /**
     * [播放 莊家 龍骨動畫]
     * @param {string}      _animName   龍骨動畫名稱 
     * @param {function}    _cb         回調
     * @param {node}        _PostNode   [發送目標]節點
     */
    bankerLogoAnim: function(_animName,_cb) {
        // if(this.DebugMode) {console.log("%c [gameControllerPanel] => [bankerLogoAnim] In action.",'color:'+this.DebugModeColor);}

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
    

    update (dt) {
        //因點數轉入故要做此動作
        if(cc.module.tools.formatFloatToFixed(cc.module.userParams.Credit) != cc.module.tools.formatFloatToFixed(this.Chips_label.string)) {
            this.SetChips(cc.module.userParams.Credit);
        }
    },


    
});
