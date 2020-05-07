/** @file       gameMain.js
  * @brief      遊戲場景主腳本.
  * @author     OreoLi
  * @date       2019/04/01 10:32 */

cc.Class({
    extends: cc.Component,

    properties: {
        Enemies_node: cc.Node,              //敵人玩家集合節點
        ControllerPanel_node: cc.Node,      //主角玩家控制區主腳本
        SystemInfo_node:cc.Node,            //系統資訊區主腳本
        SystemPanel_node: cc.Node,          //系統視窗管理
        EmojiAnim_node:cc.Node,             //表情動畫腳本
        Start_biddingAudio:     { default: null,    type: cc.AudioClip  },          //開始搶莊
        Strat_bettingAudio:     { default: null,    type: cc.AudioClip  },          //開始下注
        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
    },

    
    ctor(){
        this.DebugMode      = true;             //是否開啟console.log
        this.DebugModeColor = "#00BB00";        //console.log 顏色
        this.QueueState     = true;             //監聽對列的開啟讀取狀態
        this.QueueNow;                          //目前狀態機狀態       
        this.OnQueueArr;                        //獲取監聽的對列[陣列]
        this.RealTimeState  = false;            //即時處理事件的監聽開啟讀取狀態
        this.RealTimeArr;                       //即時處理[陣列]
        this.StateMachineObj;                   //狀態機資料
        this.TableAutoState = false;            //牌桌自動配桌是否可以開始計數
        this.TurnInfoJsonData = {};             //TurnInfo的暫存資料，原因在於邏輯端目前會發生結算時tableInfo沒資料的問題，先拿來做防呆
        this.ReceiveHandsJsonData;              //取得手牌JsonData
        this.tableinfo_={};                     //儲存房間玩家資料
        this.bankerIdx;                         //目前莊家
        this.startIdx;                          //骰盅決定先發牌玩家
        this.game_round;                        //遊戲回合
    },

    onLoad () {
        this.SystemInfo_node.getComponent("gameSystemInfo").chipAnim_node = this.node.getChildByName("tableBG").getChildByName("chipsPool");
        cc.module.tools.windowOnResize(cc.find('Canvas').getComponent(cc.Canvas));  //初始化場景分辨率
        this.StateMachineObj = cc.module.jsonFile['StateMachine'];                  //獲取狀態機資料
        this.GameInit();
    },
 
    GameInit: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [GameInit] In action.",'color:'+this.DebugModeColor);}

        // var webrtc = require("WebRTC_Mic");
        // cc.module.webrtc = new webrtc();
        
        cc.module.userParams.GamePeriod     = -1;     //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中}
        this.UpdatePackageTimestamp(); //預先更新封包當前時間
        cc.module.userParams.GameEndCheck = true;

        this.QueueNow       = "Start";          //目前狀態機狀態    
        this.OnQueueArr     = [];               //獲取監聽的對列[陣列]
        this.RealTimeArr    = [];               //即時處理[陣列]
        this.TableAutoState = false;            //牌桌自動配桌是否可以開始計數

        this.TurnInfoJsonData = {};            //TurnInfo的暫存資料，原因在於邏輯端目前會發生結算時tableInfo沒資料的問題，先拿來做防呆
        this.ReceiveHandsJsonData   = {};       //取得手牌JsonData
        this.biddingArr = [];                   //儲存搶莊倍數

        //所有元件初始化
        this.Enemies_node.getComponent("gameEnemies").Init();                   //敵人玩家總初始化
        this.ControllerPanel_node.getComponent("gameControllerPanel").Init();   //主角玩家初始化
        this.SystemInfo_node.getComponent("gameSystemInfo").Init();             //系統資訊區初始化
        this.SystemPanel_node.getComponent("gameSystemPanel").Init();           //系統視窗區初始化
        this.EmojiAnim_node.getComponent("gameEmojiAnim").Init();               //表情動畫初始化

        if(Object.keys(cc.module.userParams.ReJoinData).length != 0 ) {     //若斷線重連
            cc.module.userParams.ReJoinData = cc.module.userParams.ReJoinData['GameDetail'];
            console.log(cc.module.userParams.ReJoinData)
            console.log(cc.module.userParams.ReJoinData['Period'])
            this.ReJoinFunc();
        } else {                                                        
            this.JoinRoomFunc();
        }
    },

    /**
     * 斷線重連封包定義
     * 
     *  Period	            int	            遊玩狀態{-1: 遊戲準備階段,0: 搶莊階段,1: 下注階段,2: 回合結算階段,3: 結算階段}
     *  PlayerInfo      	map array	    玩家資訊
     *  OwnSeatIdx	        int         	玩家座位編號
     *  Turn           	int         	目前回合
     *  RecordCardHistory	map	            已發過牌的紀錄
     *  Bidding	            map	            搶莊階段資訊
     *  Betting	            map	            出牌階段資訊
     *  TurnSettlement	    map         	結算階段資訊
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
     *  TurnProfit	        float64	        此回合獲利
     *  TurnLoss	        float64	        此回合虧損
     *  TurnRecord	        map array	    每回合資訊
     * 
     * [TurnRecord]
     *  Turn            	int         	回合
     *  IsBanker	        bool	        是否為莊家
     *  Odds	            float64	        玩家已下注倍率
     *  Magnification	    float64	        玩家已搶莊倍率
     *  TurnProfit      	float64	        此回合獲利金額
     *  TurnLoss        	float64	        此回合損失金額
     * 
     *  [Bidding]
     *  ThinkingTime	    float64	        剩餘幾秒
     * 
     *  [Betting]
     *  DealerIdx	        int	            莊家SeatIndex
     *  Magnification	    float64     	莊家倍率
     *  ThinkingTime       	float64	        剩餘幾秒
     * 
     *  [TurnSettlement]
     *  ThinkingTime	    float64	        剩餘幾秒
     *  DiceList	        int array	    每顆骰子骰出的點數 陣列
     *  StartPlayerIdx	    int	            開始發牌的玩家SeatIndex
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
    */
    ReJoinFunc: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [ReJoinFunc] In action.",'color:'+this.DebugModeColor);}

        //會進入ReJoin階段通常都是遊戲中或結算，若為結算，則再結算function會再轉換狀態
        cc.module.userParams.GamePeriod             = 2;     //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中}

        //針對斷線重連的目前牌局狀態做 [前處理]
        //Period:遊玩狀態 {-1: 遊戲準備階段,0: 搶莊階段,1: 下注階段,2: 回合結算階段,3: 結算階段}
        switch(cc.module.userParams.ReJoinData['Period']){
            case -1: //遊戲準備階段
                cc.module.userParams.GameEndCheck = false;
                cc.module.userParams.ReJoinData = {};   //清空斷線重連陣列
                if(self.DebugMode) {console.log("%c[gameMain] => [ReJoinFunc] QueueState = true.",'color:'+self.DebugModeColor);}
                this.QueueState     = true;             //開啟狀態機
                this.RealTimeState  = true;             //即時處理事件的監聽開啟讀取狀態
                return;
                break;
            case 3: //結算階段
                this.GameEndCheck();   //再來一局判斷
                break;
            default:
                cc.module.userParams.GameEndCheck = false;
                this.EmojiAnim_node.getComponent("gameEmojiAnim").SetBtnState(true);        //開啟 表情按鈕
                break;
        }

        this.SystemInfo_node.getComponent("gameSystemInfo").SystemLabelPoint(false);    //關閉配牌桌文字
        let _Data               = cc.module.userParams.ReJoinData;                      //取得回傳的陣列資料
        let _PlayerInfo         = _Data['PlayerInfo'];                                  //玩家資訊
        let _OwnSeatIdx         = _Data['OwnSeatIdx'];                                  //主角玩家座位索引值
        let _Turn               = _Data['Turn'];                                        //目前回合
        let _RecordCardHistory  = _Data['RecordCardHistory'];                           //已發過牌的紀錄
        let _Bidding            = _Data['Bidding'];                                     //搶莊階段資訊
        let _Betting            = _Data['Betting'];                                     //出牌階段資訊
        let _TurnSettlement     = _Data['TurnSettlement'];                              //結算階段資訊
        this.QueueNow           = "ReJoin";                                             //改變狀態機
        this.game_round         = _Turn;                                                //改變回合數
        // 下面三個變數為其他狀態需要資料
        this.tableinfo_         = _Data['PlayerInfo'];                                  //玩家資料存到變數中(因為API那邊在其他狀態機沒給先存起來)
        this.bankerIdx          = _Data['Betting']['DealerIdx'];                        //莊家SeatIndex
        this.startIdx           = _Data['TurnSettlement']['StartPlayerIdx'];            //開始發牌的玩家SeatIndex
        
        // console.log("斷線重連資料在這裡",_Data)

        //做輪轉換位的動作，將主角玩家移置正中心，並寫入其他玩家的個人資料，同時進行發牌動作
        for(var uCount = 0 ; uCount < _PlayerInfo.length ; uCount++){ 
            
            if(_PlayerInfo[uCount]['SeatIdx'] == _OwnSeatIdx){  //若Rid等於內存登入使用者的ID即為主角
                let _PlayerCount        = parseFloat(cc.module.jsonFile["GameMain"]["UserBox"]['PlayerTotalCount']);
                let _SelfSitDown        = parseFloat(cc.module.jsonFile["GameMain"]["UserBox"]['PlayerSelfSitDown']);
                let _SelfSitDownGap     =  _SelfSitDown - uCount;   //坐下位置

                //繪製出對應的使用者資料
                for(var subCount = 0 ; subCount <  _PlayerInfo.length ; subCount++) {       
                    let _newSitDown = cc.module.tools.moveSit(subCount,_SelfSitDownGap,_SelfSitDown,_PlayerCount)    //儲存位移值 
                    if(_PlayerInfo[subCount]['SeatIdx'] == _OwnSeatIdx) {
                        
                        this.ReceiveHandsJsonData  = {  Hands: _PlayerInfo[subCount]['Hands']}; 
                        
                        this.ControllerPanel_node.getComponent("gameControllerPanel").ReJoinSetPlayerInfo(_Data['Period'],_PlayerInfo[subCount],_RecordCardHistory,_Bidding,_Betting,_TurnSettlement,_Turn,_PlayerInfo); 
                    } else {
                        _PlayerInfo[subCount]['SitDown'] = _newSitDown; 
                        this.Enemies_node.children[_newSitDown].getComponent("userBox").ReJoinSetPlayerInfo(_Data['Period'],_PlayerInfo[subCount],_Bidding,_Betting,_TurnSettlement,_Turn);  
                    }
                }
                break;
            } 
        }
        
        this.SystemInfo_node.getComponent("gameSystemInfo").ReJoinSetInfo(_Data['Period'],_OwnSeatIdx,_PlayerInfo,_Bidding,_Betting,_TurnSettlement);    
        this.SystemInfo_node.getComponent("gameSystemInfo").SetRoomID();
        

        //針對斷線重連的目前牌局狀態做 [後處理]
        //Period:遊玩狀態 {-1: 遊戲準備階段,0: 搶莊階段,1: 下注階段,2: 回合結算階段,3: 結算階段}
        switch(cc.module.userParams.ReJoinData['Period']){
            case 2:
                //跳錢動畫
                let _UserCoinNode;
                let _FinelFunc = function() {
                    var _cb = function(_JsonData){
                        if(this.DebugMode) {console.log("%c[gameMain] => [CallTableInfo] SendMsg callback.",'color:'+this.DebugModeColor_GET);}
                        console.log(_JsonData)
                        var _Result = JSON.parse(_JsonData['Result']);
                        console.log(_Result)
                        console.log("戳交互完成")
                        console.log("戳交互完成")
                        console.log("戳交互完成")
                    }.bind(this);
                    this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_NextPeriod", {},_cb);
                    this.QueueState     = true;             //開啟 狀態機
                }.bind(this);
                let _winCoin;
                for(var pCount = 0; pCount < _PlayerInfo.length ; pCount++) {
                    
                    _winCoin  = cc.module.tools.formatFloat(_PlayerInfo[pCount]['Loss'] + _PlayerInfo[pCount]['Profit'],2);
                    if(_PlayerInfo[pCount]['SeatIdx'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()) {
                        _UserCoinNode = this.ControllerPanel_node.getComponent("gameControllerPanel").GetCoinNode();
                    } else { 
                        for(var subCount = 0 ; subCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; subCount++) { 
                            if(_PlayerInfo[pCount]['SeatIdx'] == this.Enemies_node.children[subCount].getComponent('userBox').GetUserIndex()) {
                                _UserCoinNode = this.Enemies_node.children[subCount].getComponent('userBox').GetCoinNode();
                                break;
                            }
                        }
                    }
                    this.SystemInfo_node.getComponent("gameSystemInfo").CoinAnim(_TurnSettlement['ThinkingTime'],_UserCoinNode,_winCoin);
                    // this.SystemInfo_node.getComponent("gameSystemInfo").WinAnim(_winCoin); //針對主角撥放勝利或失敗的動畫
                }
                let _animName = _winCoin > 0 ? "win" : "lose";
                this.SystemInfo_node.getComponent("gameSystemInfo").playAnim(_animName,_FinelFunc);  //開場動畫播放(龍骨)
                break; 
            case 3:
                this.QueueState     = false;            //關閉 狀態機
                break; 
            default:
                var _cb = function(_JsonData){
                    if(this.DebugMode) {console.log("%c[gameMain] => [CallTableInfo] SendMsg callback.",'color:'+this.DebugModeColor_GET);}
                    console.log(_JsonData)
                    var _Result = JSON.parse(_JsonData['Result']);
                    console.log(_Result)
                    console.log("戳交互完成")
                    console.log("戳交互完成")
                    console.log("戳交互完成")
                }.bind(this);
                this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_NextPeriod", {},_cb);
                if(self.DebugMode) {console.log("%c[gameMain] => [ReJoinFunc] QueueState = true.",'color:'+self.DebugModeColor);}
                this.QueueState     = true;             //開啟 狀態機
                break;
        }
        this.SetDelegate();                     //設置委派，會同時設置再斷線重連以及tabelInfo的原因是，部份委派會需要依照新的user預製體來施作，故統一都放這兩處
        cc.module.userParams.ReJoinData = {};   //清空斷線重連陣列
        this.RealTimeState  = true;             //即時處理事件的監聽開啟讀取狀態
    },

    /** 
     * [開始配桌] 
     * */
    JoinRoomFunc: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [JoinRoomFunc] In action.",'color:'+this.DebugModeColor);}

        cc.module.userParams.GamePeriod     = -1;     //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中}
        this.RealTimeState  = true;         //即時處理事件的監聽開啟讀取狀態

        //開始進入配桌階段
        let self = this;
        cc.module.joinroom.SetProp({
            joinRoom: function() { 
                self.SystemInfo_node.getComponent("gameSystemInfo").SystemLabelPoint(true,"joinRoom");
                cc.module.userParams.GamePeriod             = 1;     //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中}
            },
            getTable: function() {
                self.SystemInfo_node.getComponent("gameSystemInfo").SystemLabelPoint(true,"getTable");
            },
            sitDown: function() {
                cc.module.hookMQTT.DeleteQueueArrAll(); //清空目前已有的Queue，因Queue不能再坐下前收到任何有關上一局的封包
                self.SystemInfo_node.getComponent("gameSystemInfo").SystemLabelPoint(true,"sitDown");
            },
            sitDownSuccess: function() {
                cc.module.hookMQTT.Init();              //初始化QueueArr
                cc.module.userParams.GameEndCheck           = false;
                if(self.DebugMode) {console.log("%c[gameMain] => [JoinRoomFunc] QueueState = true.",'color:'+self.DebugModeColor);}
                self.QueueState                             = true;
                self.SystemInfo_node.getComponent("gameSystemInfo").SystemLabelPoint(true,"sitDownSuccess");
            }
        });
    },
    
    /** 
     * [再來一局方法]
     * */
    GameAgain: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [BtnGameAgain] In action.",'color:'+this.DebugModeColor);}

        this.QueueNow       = "Start";          //目前狀態機狀態       
        this.OnQueueArr     = [];               //獲取監聽的對列[陣列]
        this.TableAutoState = false;            //牌桌自動配桌是否可以開始計數
        this.unscheduleAllCallbacks();          //取消計時器

    },
    
    /**
     * [遊戲結束的再來一局判斷]
     */
    GameEndCheck: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [GameEndCheck] In action.",'color:'+this.DebugModeColor_FA);}

        cc.module.userParams.GamePeriod     = 0;     //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中}

        cc.module.userParams.GameEndCheck = true;
        this.EmojiAnim_node.getComponent("gameEmojiAnim").SetBtnState(false);       //關閉 表情按鈕

        //再來一局事件判斷
        if(cc.module.tools.formatFloat(cc.module.userParams.Credit,2) < cc.module.tools.formatFloat(cc.module.userParams.NowGameMinAntes,2)) {     //若沒錢再來一局則顯示該文字
            if(this.DebugMode) {console.log("%c[gameMain] => [GameEndCheck] 最低攜帶金額:"+cc.module.userParams.NowGameMinAntes+"，目前該玩家只有:"+cc.module.userParams.Credit+"不符合資格轉跳回大廳.",'color:'+this.DebugModeColor_FA);}
            this.ControllerPanel_node.getComponent("gameControllerPanel").ShowNoCoinPlayAgaig();
        } else {
            if(this.DebugMode) {console.log("%c[gameMain] => [GameEndCheck] 最低攜帶金額:"+cc.module.userParams.NowGameMinAntes+"，符合資格可繼續遊玩.",'color:'+this.DebugModeColor_FA);}
            this.ControllerPanel_node.getComponent("gameControllerPanel").ShowPlayAgain();
            this.TableAutoState = true;             //牌桌自動配桌是否可以開始計數
            this.TableAuto();                       //調用自動配桌判斷
        }
    },

    /** 自動配桌 
    */
    TableAuto: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [TableAuto] In action.",'color:'+this.DebugModeColor);}

        this.unschedule(this.TableAutoCallback);                            //取消計時器

        console.log("進入自動配桌事件，目前狀態為："+cc.module.userParams.TableAuto);
        //若有錢再來一局 && 開啟自動配桌 && 目前已進入結算期可以使用自動配桌時，才會進行倒數
        if(cc.module.tools.formatFloat(cc.module.userParams.Credit,2) >= cc.module.tools.formatFloat(cc.module.userParams.NowGameMinAntes,2) && cc.module.userParams.TableAuto == true && this.TableAutoState == true) { 
            
            let _TimesCount = cc.module.jsonFile['GameMain']['TableAutoTime'];  //總秒數
            this.TableAutoCallback = function () {
                if(_TimesCount == 0){
                    console.log("自動配桌倒數0");
                    this.unschedule(this.TableAutoCallback);                            //取消計時器
                    this.ControllerPanel_node.getComponent("gameControllerPanel").BtnGameAgain();
                } else {
                    console.log("自動配桌倒數"+_TimesCount);
                    _TimesCount--;
                }
            }.bind(this); 
            this.schedule(this.TableAutoCallback, 1);
        } else {
            console.log("尚未開啟自動配桌或者攜帶金額不足，因此無法開啟自動配桌");
        }
        
    },

    /** 設置全局委派 */
    SetDelegate: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [SetDelegate] In action.",'color:'+this.DebugModeColor);}

        //設置再來一局的委派方法
        let self = this;
        let _GameAgain = function(){
            self.GameAgain();
        }
        let _GameInit = function(){
            self.GameInit();
        }
        this.ControllerPanel_node.getComponent("gameControllerPanel").SetAgainDelegate(_GameAgain,_GameInit);

        //針對斷線處理的委派
        let _Disconnection  = function(){
            console.log("成功執行針對斷線處理的委派");
            self.SystemPanel_node.getComponent("gameSystemPanel").BtnOpenWindow({},"disconnection_tips");
        } 
        let _Connection     = function(){
            console.log("取消針對斷線處理的委派");
            self.SystemPanel_node.getComponent("gameSystemPanel").BtnOpenWindow({},"close");
        }
        cc.module.network.GameInit_CB       = _GameInit;
        cc.module.network.Disconnection_CB  = _Disconnection;
        cc.module.network.Connection_CB     = _Connection;
    },

    
    /** 
     * [GS通知玩家當前思考秒數]
     * [Subscriber] TT
     * 
     * Payload:
     *  string	  
     * */
    CallTT: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallTT] In action.",'color:'+this.DebugModeColor_FA);}
        let _Payload        = _JsonData[1];         //轉存Payload至jsonData變數中 
        console.log(_JsonData);
        this.QueueState     = true;
    },


    /** GS通知玩家取得牌桌資訊
     * [Subscriber] DiceJDCN/TableInfo
     * 
     * Payload:
     *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
     *  Data	            array	        回傳資料 Content-Type: application/json => map
     *  Time	            int	            回傳時間
     * 
     * Data:
     *  PlayerList	        map array	    玩家列表
     *  OwnSeatIdx	        int	            玩家座位編號
     *  BigRoomID	        string	        牌局編號
     * 
     * PlayerList:
     *  SeatIndex	        int	            玩家座位編號
     *  HeadUrl	            string	        玩家頭像 初始化為1
     *  Gender	            string	        玩家性別 1: 男 0: 女
     *  Nickname	        string	        玩家暱稱
     *  Credit	            float64	        玩家身上的籌碼金額
     *  PlayerState	        int	            玩家目前在牌局中的狀態  {1: 遊戲中,0: 閒置中,-1: 觀戰中}
     * 
     * 
     * */
    CallTableInfo: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallTableInfo] In action.",'color:'+this.DebugModeColor);}

        let _Payload        = _JsonData[1];         //轉存Payload至jsonData變數中 
        let _Data           = _Payload["Data"];     //取得回傳的陣列資料
        let _TableInfo      = _Data['PlayerList'];  //所有玩家資料
        this.tableinfo_     = _Data['PlayerList'];  //玩家資料存到變數中(因為API那邊在其他狀態機沒給先存起來)
        cc.module.userParams.RoomID  = _Data["BigRoomID"];

        this.SystemInfo_node.getComponent("gameSystemInfo").SystemLabelPoint(false);
        this.SystemInfo_node.getComponent("gameSystemInfo").SetRoomID();
        this.ControllerPanel_node.getComponent("gameControllerPanel").RecordCard(false);

        //計算目前玩家人數，需判斷PlayerState
        let nowUserCount = 0;
        for(var uCount = 0 ; uCount < _TableInfo.length ; uCount++){
            if(_TableInfo[uCount]['PlayerState'] == 1) nowUserCount++;
        }
        
        //做輪轉換位的動作，將主角玩家移置正中心，並寫入其他玩家的個人資料，同時進行發牌動作
        for(var uCount = 0 ; uCount < _TableInfo.length ; uCount++){
            if(_TableInfo[uCount]['SeatIndex'] == _Data['OwnSeatIdx']  && _TableInfo[uCount]['PlayerState'] == 1){  //若Rid等於內存登入使用者的ID即為主角
                let _PlayerCount        = parseFloat(cc.module.jsonFile["GameMain"]["UserBox"]['PlayerTotalCount']);
                let _SelfSitDown        = parseFloat(cc.module.jsonFile["GameMain"]["UserBox"]['PlayerSelfSitDown']);
                let _SelfSitDownGap     = _SelfSitDown - uCount;

                //繪製出對應的使用者資料
                for(var subCount = 0 ; subCount <  _TableInfo.length ; subCount++) {          
                    let _newSitDown = cc.module.tools.moveSit(subCount,_SelfSitDownGap,_SelfSitDown,_PlayerCount)    //儲存位移值
                    if(_TableInfo[subCount]['PlayerState'] == 1){//寫入玩家資訊後，同時進行發牌動作
                        if(_TableInfo[subCount]['SeatIndex'] == _Data['OwnSeatIdx']) {
                            this.ControllerPanel_node.getComponent("gameControllerPanel").SetUserData(_TableInfo[subCount]); 
                        } else {
                            _TableInfo[subCount]['SitDown'] = _newSitDown;
                            this.Enemies_node.children[_newSitDown].getComponent("userBox").SetUserData(_TableInfo[subCount]);  
                        }
                    }
                }
                break;
            }
        }

        //callback function
        let _FirstShakeFunc = function(){
            var _cb = function(_JsonData){
                if(this.DebugMode) {console.log("%c[gameMain] => [CallTableInfo] SendMsg callback.",'color:'+this.DebugModeColor_GET);}
                console.log(_JsonData)
                var _Result = JSON.parse(_JsonData['Result']);
                console.log(_Result)
                console.log("戳交互完成")
                console.log("戳交互完成")
                console.log("戳交互完成")
            }.bind(this);
            this.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_NextPeriod", {},_cb);

            if(self.DebugMode) {console.log("%c[gameMain] => [CallTableInfo] QueueState = true.",'color:'+self.DebugModeColor);}
            this.QueueState = true;
        }.bind(this);
        
        this.SetDelegate();    //設置委派，會同時設置再斷線重連以及tabelInfo的原因是，部份委派會需要依照新的user預製體來施作，故統一都放這兩處
        this.EmojiAnim_node.getComponent("gameEmojiAnim").SetBtnState(true);    //開啟表情按鈕
        // this.SystemInfo_node.getComponent("gameSystemInfo").StartGameAnim(_FirstShakeFunc);  //開場動畫播放
        this.SystemInfo_node.getComponent("gameSystemInfo").playAnim("opne",_FirstShakeFunc);  //開場動畫播放(龍骨)
        
    },

    /** 發送封包至遊戲伺服器
     *
     * @topic string mqtt topic
     * @data  string mqtt payload 
     * @param _cb       function        callbackfunction，只有當回傳的code = 1的時候才執行*/
    SendMsg: function(topic, data, _cb)
    {
        cc.module.mqant.request(topic, data, function(destinationName, data) {
            console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));

            var _JsonData   = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(typeof(_cb) == "function"){
                _cb(_JsonData);
            }
        });
    },

    /** GS通知玩家開始搶莊
     * [Subscriber] MJEBG/StartBidding
     * 
        * Payload:
        *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
        *  Data	            array	        封包資料 Content-Type: application/json => map
        *  Time	            int	            傳送時間
        * 
        * Data:
        *  Turn	            int	            當前回合
        *  BiddingTimer        float64         搶莊時間
        *  MaxiMagnification   float64         玩家所能搶莊最大倍率
        *  MiniMagnification   float64         玩家所能搶莊最小倍率列表
        * 
        * */
       CallStartBidding: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallStartBidding] In action.",'color:'+this.DebugModeColor);}

        //將麻將節點回收(RejoinRoom的下個封包)
        this.ControllerPanel_node.getComponent("gameControllerPanel").PutPrefab();
        this.SystemInfo_node.getComponent("gameSystemInfo").PutPrefab();

        let _Payload        = _JsonData[1];         //轉存Payload至jsonData變數中  
        let _Data           = _Payload["Data"];     //取得回傳的陣列資料
        if(self.DebugMode) {console.log("%c[gameMain] => [CallStartBidding] QueueState = true.",'color:'+self.DebugModeColor);}
        this.QueueState     = true;
        this.game_round     = _Data["Turn"];
        cc.module.audio.playEffect(this.Start_biddingAudio); //開始搶莊音效
            for(var jKey in this.tableinfo_) {    
                //各玩家初始化
                if(this.tableinfo_[jKey]['SeatIndex'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()) { 

                    this.ControllerPanel_node.getComponent("gameControllerPanel").show_bid("3","");//玩家下方資訊 - 思考中圖片
                    this.ControllerPanel_node.getComponent("gameControllerPanel").SetTimer(parseInt(_Data['BiddingTimer']));   //開啟 玩家倒數計時器
                    this.ControllerPanel_node.getComponent("gameControllerPanel").SetSlider(this.game_round,"Bidding",_Data["MaxiMagnification"],_Data["MiniMagnification"]);  //籌碼 拉霸開啟
                    this.ControllerPanel_node.getComponent("gameControllerPanel").bankerLogoAnim(false);
                    this.ControllerPanel_node.getComponent("gameControllerPanel").ShowDiceIndex(false);
                } else { 
                    for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                        if(this.tableinfo_[jKey]['SeatIndex'] == this.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {
                            this.Enemies_node.children[uCount].getComponent('userBox').SetTimer(parseInt(_Data['BiddingTimer']));
                            this.Enemies_node.children[uCount].getComponent('userBox').show_bid("3","");
                            this.Enemies_node.children[uCount].getComponent('userBox').bankerLogoAnim(false);
                            this.Enemies_node.children[uCount].getComponent("userBox").ShowDiceIndex(false);
                        }
                    }
                }
            }
    },

    /** GS通知有玩家發動搶莊動作
         * [Subscriber] MJEBG/SomeoneBidding
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  BidderIdx	        int	            搶莊者SeatIndex
         *  Magnification       float64         搶莊倍率
         * 
         * */
    CallSomeoneBidding: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallSomeoneBidding] In action.",'color:'+this.DebugModeColor);} 
        let _Payload            =  _JsonData[1];         //轉存Payload至jsonData變數中
        let _Data               = _Payload['Data']
        let _index              = _Data['BidderIdx']
        // switch (_index) {
        //     case 0:
        //         this.biddingArr[_index] = 200;
        //         break;
        //     case 1:
        //         this.biddingArr[_index] = 95;
        //         break;
        //     case 2:
        //         this.biddingArr[_index] = 200;
        //         break;
        //     case 3:
        //         this.biddingArr[_index] = 200;
        //         break;
        
        //     default:
        //         break;
        // }
        this.biddingArr[_index] = _Data['Magnification'];
        
        if(_Data['BidderIdx'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()){
            
            if(_Data['Magnification'] == 0){
                // 不搶莊
                this.ControllerPanel_node.getComponent("gameControllerPanel").show_bid("1",_Data['Magnification'],this.tableinfo_[_Data['BidderIdx']]['Gender']);
            }else{
                //幾倍搶莊
                this.ControllerPanel_node.getComponent("gameControllerPanel").show_bid("2",_Data['Magnification'],this.tableinfo_[_Data['BidderIdx']]['Gender']);
            } 
        } 
        else {
            for(var uCount = 0 ; uCount < parseFloat(cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount']) ; uCount++) { 
                if(_Data['BidderIdx'] == this.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {    
                    this.Enemies_node.children[uCount].getComponent('userBox').show_bid("2",_Data['Magnification'],this.tableinfo_[_Data['BidderIdx']]['Gender']);
                    break;
                }
            }
        }
        if(self.DebugMode) {console.log("%c[gameMain] => [CallSomeoneBidding] QueueState = true.",'color:'+self.DebugModeColor);}
        this.QueueState = true;
    },

    /** GS通知玩家搶莊結果
     * [Subscriber] MJEBG/BiddingResult
     * 
     * Payload:
     *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
     *  Data	            array	        封包資料 Content-Type: application/json => map
     *  Time	            int	            傳送時間
     * 
     * Data:
     *  DealerIdx	        int	            莊家SeatIndex
     *  Magnification       float64         莊家倍率
     * 
     * */
    CallBiddingResult: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallBiddingResult] In action.",'color:'+this.DebugModeColor);}
        
        let _Payload        = _JsonData[1];         //轉存Payload至jsonData變數中  
        let _Data           = _Payload["Data"];     //取得回傳的陣列資料
        this.bankerIdx      = _Data['DealerIdx'];
        let self = this;
        let _maxBiddingArr = [];
        
        for(var uCount = 0 ; uCount < this.biddingArr.length ; uCount++) {
            if(this.biddingArr[uCount] == _Data['Magnification']) {
                _maxBiddingArr.push(uCount);
            }
        }
        // _maxBiddingArr = [0,1,3];

        let _FinelFunc = function(){
            var _cb = function(_JsonData){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallBiddingResult] SendMsg callback.",'color:' + self.DebugModeColor_GET);}
                var _Result = JSON.parse(_JsonData['Result']);
                console.log(_Result)
                console.log("戳交互完成")
                console.log("戳交互完成")
                console.log("戳交互完成")
            }
            self.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_NextPeriod", {},_cb);

            if(self.DebugMode) {console.log("%c[gameMain] => [CallBiddingResult] QueueState = true.",'color:'+self.DebugModeColor);}
            self.unscheduleAllCallbacks();
            self.QueueState    = true;   //打開狀態機
        }

        //延遲1秒撥放搶莊動畫
        this.scheduleOnce(function() {
            if(_maxBiddingArr.length == 1) { //若只有一人叫最高分搶莊，則直接播放定莊動畫

                if(self.bankerIdx  == self.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()) {
                    self.ControllerPanel_node.getComponent("gameControllerPanel").bankerLogoAnim("BANKER",_FinelFunc);   
                } else { 
                    for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                        if(self.bankerIdx == self.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {
                            self.Enemies_node.children[uCount].getComponent("userBox").bankerLogoAnim("BANKER",_FinelFunc);
                            break;
                        }
                    }
                }

            } else {        //若有兩人以上搶最高分，則播放跑馬燈 => 定莊動畫
                            
                // 以靜態圖開關呈現閃爍
                self.count = 0;
                let _callback = function () {                        // 以靜態圖開關呈現閃爍
                    if (self.count === 20) {   //bankerIcon放大縮小動畫
                        self.unscheduleAllCallbacks();

                        if(self.bankerIdx  == self.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()) {
                            self.ControllerPanel_node.getComponent("gameControllerPanel").bankerLogoAnim("BANKER",_FinelFunc);  
                            for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                                self.Enemies_node.children[uCount].getComponent("userBox").bankerLogoAnim(false);
                            }   
                        } else {
                            self.ControllerPanel_node.getComponent("gameControllerPanel").bankerLogoAnim(false);
                            for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                                if(self.bankerIdx == self.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {
                                    self.Enemies_node.children[uCount].getComponent("userBox").bankerLogoAnim("BANKER",_FinelFunc);
                                } else {
                                    self.Enemies_node.children[uCount].getComponent("userBox").bankerLogoAnim(false);
                                }
                            }
                        }
                    } else {     //bankerIcon圖片連續開關
                        let _NowUserKey     = self.count % _maxBiddingArr.length;        //目前陣列索引
                        let _NowUserIdx     = _maxBiddingArr[_NowUserKey]                //目前輪到的莊家候選人idx

                        if(_NowUserIdx  == self.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()) {
                            self.ControllerPanel_node.getComponent("gameControllerPanel").bankerLogoAnim("BANKER-2");
                            for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                                self.Enemies_node.children[uCount].getComponent("userBox").bankerLogoAnim(false);
                            }
                        } else {
                            self.ControllerPanel_node.getComponent("gameControllerPanel").bankerLogoAnim(false); 
                            for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                                if(_NowUserIdx == self.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {
                                    self.Enemies_node.children[uCount].getComponent("userBox").bankerLogoAnim("BANKER-2");
                                } else {
                                    self.Enemies_node.children[uCount].getComponent("userBox").bankerLogoAnim(false);
                                }
                            }
                        }
                        self.count++;
                    }
                }
                self.schedule(_callback, 0.1);
            }
        }, 1);
    },


    /** GS通知玩家開始進行下注動作
     * [Subscriber] MJEBG/StartBetting
     * 
     * Payload:
     *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
     *  Data	            array	        封包資料 Content-Type: application/json => map
     *  Time	            int	            傳送時間
     * 
     * Data:
     *  BettingTimer	    int	            下注時間
     *  MaxiOdds            float64         最大下注倍率(如等於-1則為莊家,不須下注)
     *  MiniOdds            float64         最小下注倍率(如等於-1則為莊家,不須下注)
     * 
     * */
    CallStartBetting: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallStartBetting] In action.",'color:'+this.DebugModeColor);}
            
        let _Payload        = _JsonData[1];         //轉存Payload至jsonData變數中  
        let _Data           = _Payload["Data"];     //取得回傳的陣列資料
        if(self.DebugMode) {console.log("%c[gameMain] => [CallStartBetting] QueueState = true.",'color:'+self.DebugModeColor);}
        this.QueueState = true;
        cc.module.audio.playEffect(this.Strat_bettingAudio); //開始下注音效
        for(var jKey in this.tableinfo_) {    

                //各玩家初始化
                if(this.tableinfo_[jKey]['SeatIndex'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()&&this.bankerIdx!=this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()) {
                    this.ControllerPanel_node.getComponent("gameControllerPanel").show_bid("3","");//玩家下方資訊 - 思考中圖片
                    this.ControllerPanel_node.getComponent("gameControllerPanel").SetTimer(parseInt(_Data['BettingTimer']));   //開啟 玩家倒數計時器 
                    this.ControllerPanel_node.getComponent("gameControllerPanel").SetSlider(this.game_round,"Betting",_Data["MaxiOdds"],_Data["MiniOdds"]);  //籌碼 拉霸開啟
                } else { 
                    for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                        if(this.tableinfo_[jKey]['SeatIndex'] == this.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()&&this.bankerIdx!=this.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {
                            this.Enemies_node.children[uCount].getComponent('userBox').SetTimer(parseInt(_Data['BettingTimer']));
                            this.Enemies_node.children[uCount].getComponent('userBox').show_bid("3","");
                        }
                    }
                }
        }
    },

    /** GS通知玩家有玩家下注
     * [Subscriber] MJEBG/SomeoneBetting
     * 
     * Payload:
     *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
     *  Data	            array	        封包資料 Content-Type: application/json => map
     *  Time	            int	            傳送時間
     * 
     * Data:
     *  BettorIdx	        int	            下注者SeatIndex
     *  Odds	            float64	        下注倍率
     * 
     * */
    CallSomeoneBetting: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallSomeoneBidding] In action.",'color:'+this.DebugModeColor);} 
        let _Payload        = _JsonData[1];         //轉存Payload至jsonData變數中
        let _Data           =_Payload['Data'];
        let self = this;
        let _FinelFunc = function(){
            if(self.DebugMode) {console.log("%c[gameMain] => [CallSomeoneBidding] QueueState = true.",'color:'+self.DebugModeColor);}
            self.QueueState = true;    //回調成功訊息打開狀態機
        };
            
        if(_Data['BettorIdx'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()){
            this.ControllerPanel_node.getComponent("gameControllerPanel").show_bid("4",_Data['Odds'],this.tableinfo_[_Data['BettorIdx']]['Gender']);
            //生成籌碼
            this.SystemInfo_node.getComponent("gameSystemInfo").getChip(_Data['Odds'],_Data['BettorIdx']);
            //籌碼動畫
            this.SystemInfo_node.getComponent("gameSystemInfo").dropChipAnim(true,_Data['BettorIdx'],_FinelFunc);
        } 
        else {
            for(var uCount = 0 ; uCount < parseFloat(cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount']) ; uCount++) { 
                if(_Data['BettorIdx'] == this.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {   
                    this.Enemies_node.children[uCount].getComponent('userBox').show_bid("4",_Data['Odds'],this.tableinfo_[_Data['BettorIdx']]['Gender']);
                    //生成籌碼
                    this.SystemInfo_node.getComponent("gameSystemInfo").getChip(_Data['Odds'],_Data['BettorIdx']);
                    //籌碼動畫
                    this.SystemInfo_node.getComponent("gameSystemInfo").dropChipAnim(true,_Data['BettorIdx'],_FinelFunc);
                    break;
                }
            }
        }
        
    },

    /** GS通知玩家骰盅決定的結果
     * [Subscriber] MJEBG/RollingToDealResult
     * 
     * Payload:
     *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
     *  Data	            array	        封包資料 Content-Type: application/json => map
     *  Time	            int	            傳送時間
     * 
     * Data:
     *  DiceList	        int array	    每顆骰子骰出的點數 陣列
     *  StartPlayerIdx      int             開始發牌的玩家SeatIndex
     * 
     * */
    CallRollingToDealResult: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallRollingToDealResult] In action.",'color:'+this.DebugModeColor);}
                
        let _Payload        = _JsonData[1];         //轉存Payload至jsonData變數中 
        let _Data           = _Payload["Data"];     //取得回傳的陣列資料
        this.startIdx = _Data['StartPlayerIdx'];    //記錄先發牌玩家
        let self = this;
        //關閉計時器
        for(var jKey in this.tableinfo_) {    

            if(this.tableinfo_[jKey]['SeatIndex'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()) {
                this.ControllerPanel_node.getComponent("gameControllerPanel").ReSetTimer(); 
            } else { 
                for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                    if(this.tableinfo_[jKey]['SeatIndex'] == this.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {
                        this.Enemies_node.children[uCount].getComponent('userBox').ReSetTimer();
                    }
                }
            }
        }
        // console.log("目前莊家位置",this.bankerIdx)
        // console.log("擲骰結果:",_Data['DiceList']);
        // console.log("開始發牌玩家:",this.startIdx);

        //Promise寫法 [骰盅動畫]
        function Promise_DiceCupAnim(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallRollingToDealResult] [Promise_DiceCupAnim] In action.",'color:'+self.DebugModeColor);}

                //播完動畫的最後才調用所有結束方法
                let _FinelFunc = function(){
                    resolve("Promise_DiceCupAnim Success");   //回調成功訊息，進入下一個階段
                };

                self.ControllerPanel_node.getComponent("gameControllerPanel").DiceCupAnim(_Data,_FinelFunc);      //骰盅開始搖骰

            });
        }

        //Promise寫法 [骰盅結果]
        function Promise_ShowDiceIndex(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallRollingToDealResult] [Promise_ShowDiceIndex] In action.",'color:'+self.DebugModeColor);}
                
                //播完動畫的最後才調用所有結束方法
                let _FinelFunc = function(){
                    resolve("Promise_ShowDiceIndex Succes");   //回調成功訊息，進入下一個階段
                };

                if(_Data['StartPlayerIdx'] == self.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()){
                    // console.log("玩家為發牌家:"+_Data['StartPlayerIdx']+"="+self.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex());
                    self.ControllerPanel_node.getComponent("gameControllerPanel").ShowDiceIndex(true,_FinelFunc);
                } 
                else {
                    for(var uCount = 0 ; uCount <4 ; uCount++) { 
                        if(_Data['StartPlayerIdx'] == self.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {   
                            // console.log("AI"+uCount+":"+_Data['StartPlayerIdx']+"="+self.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex());
                            self.Enemies_node.children[uCount].getComponent('userBox').ShowDiceIndex(true,_FinelFunc);
                            break;
                        }
                    }
                }
            });
        }

        //Promise寫法 [開啟狀態機]
        function Promise_QueueState(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallRollingToDealResult] [Promise_QueueState] In action.",'color:'+self.DebugModeColor);}
                self.QueueState     = true; 
            });
        }

        Promise_DiceCupAnim().then(Promise_ShowDiceIndex).then(Promise_QueueState);
       
    },

        
    /** GS通知本回合動作結果
     * [Subscriber] MJEBG/TurnInfo
     * 
     * Payload:
     *  Code	            int	            1: 請求成功
     *  Data	            array	        封包資料 Content-Type: application/json
     *  time	            int	            傳送時間
     * 
     * Data:
     *  Turn	            int	            回合
     *  IsEnding	        int	            是否結束牌局 0:牌局尚未結束 1:回合上限已到結束牌局 2:有玩家因身上籌碼不足結束遊戲
     *  PlayerList      	map array   	玩家資料
     *  RecordCardHistory	map	            已發過牌的紀錄
     * 
     * PlayerList:
     *  Nickname	        string      	玩家暱稱
     *  SeatIndex       	int	            玩家座位編號
     *  Credit	            float	        玩家當前身上的籌碼金額
     *  Dealer	            int	            是否為莊家
     *  Hands	            string array	玩家手牌 0:白皮,1:一筒,2:二筒,3:三筒,4:四筒,5:五筒,6:六筒,7:七筒,8:八筒,9:九筒
     *  CardType	        int	            玩家牌型編號 0: 散牌 1: 二八 2: 豹子
     *  CardTypePoint   	float64	        玩家牌型點數
     *  TurnProfit       	float64	        此回合獲利
     *  TurnLoss	        float64	        此回合虧損
     * 
     * RecordCardHistory:
     *  0	                int	            白皮所出現次數
     *  1	                int         	一筒所出現次數
     *  2	                int         	二筒所出現次數
     *  3	                int         	三筒所出現次數
     *  4	                int         	四筒所出現次數
     *  5	                int         	五筒所出現次數
     *  6	                int         	六筒所出現次數
     *  7	                int         	七筒所出現次數
     *  8	                int         	八筒所出現次數
     *  9	                int         	九筒所出現次數
     * 
     * 
     * totalDelayTime = 0;
     * 爆炸動畫時間
     * - 起始就延遲 1.3's
     * - 每一顆delay 0.3's
     * - 單一一顆爆炸動畫時間 0.5's
     * - totalDelayTime += 1.3 + 0.3xN + 0.5 (多預留一顆delay時間)
     * 
     * 淘汰動畫時間
     * - 若同時有人淘汰則淘汰動畫時間 totalDelayTime += 0.3's 
     * 
     * 射籌碼及跳錢動畫時間
     * - 每一顆delay 0.3's
     * - 單一籌碼射錢動畫時間 0.5's
     * - 跳錢動畫時間 1's
     * - totalDelayTime += 0.3xN + 0.5 + 1 (多預留一顆delay時間)
     *  */
    CallTurnInfo: function(_JsonData){ 
        if(this.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] In action.",'color:'+this.DebugModeColor);}
                
            let _Payload            = _JsonData[1];         //轉存Payload至jsonData變數中  
            let _Data               = _Payload["Data"];     //取得回傳的陣列資料
            let _PlayerList         = _Data['PlayerList'];   //牌桌玩家資訊
            let _RecordCardHistory  = _Data['RecordCardHistory'];
            let self = this;

        //Promise寫法 [創建麻將]
        function Promise_CreateMJ(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_CreateMJ] In action.",'color:'+self.DebugModeColor);}

                let _FinelFunc = function() {
                    resolve("Promise_CreateMJ Success");     //回調成功訊息，進入下一個階段
                }

                self.ControllerPanel_node.getComponent("gameControllerPanel").CreateMJ(true,_FinelFunc);      //創建麻將
                
            });
        }

        //Promise寫法 [麻將發牌]
        function Promise_SendMJ(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_SendMJ] In action.",'color:'+self.DebugModeColor);}

                let _FinelFunc = function() {
                    resolve("Promise_SendMJ Success");     //回調成功訊息，進入下一個階段
                }

                self.ControllerPanel_node.getComponent("gameControllerPanel").SendMJ(true,self.startIdx,_FinelFunc);      //創建麻將
                
            });
        }

        //Promise寫法 [打開麻將]
        function Promise_OpenMJ(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_OpenMJ] In action.",'color:'+self.DebugModeColor);}

                let _FinelFunc = function() {
                    resolve("Promise_OpenMJ Success");     //回調成功訊息，進入下一個階段
                };                
                self.ControllerPanel_node.getComponent("gameControllerPanel").OpenMJ(true,self.bankerIdx,_PlayerList,_RecordCardHistory,"",self.tableinfo_,_FinelFunc); //掀牌

            });
        }

        //Promise寫法 [莊家通贏或通賠]
        function Promise_bankerStatus(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_bankerStatus] In action.",'color:'+self.DebugModeColor);}
                let bankerStatus = 0    // 莊家輸贏count

                // 判斷除了莊家以外的玩家輸贏狀態
                for(let jKey in _PlayerList) {   //遍歷所有使用者的objData   
                    let _Turn = _PlayerList[jKey]['TurnProfit']+_PlayerList[jKey]['TurnLoss'];                               
                    if(_PlayerList[jKey]['SeatIndex'] == self.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()&&_PlayerList[jKey]['Dealer']!=1){
                        (_Turn>0)?(bankerStatus-=1):(_Turn<0)?(bankerStatus+=1):(bankerStatus+=0);
                    } else {  
                        for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                            if(_PlayerList[jKey]['SeatIndex'] == self.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()&&_PlayerList[jKey]['Dealer']!=1) {       
                                (_Turn>0)?(bankerStatus-=1):(_Turn<0)?(bankerStatus+=1):(bankerStatus+=0);
                            }
                        }
                    }
                }

                let _FinelFunc = function() {
                    self.SystemInfo_node.getComponent("gameSystemInfo").show_banker_status(false);  //關閉節點
                    resolve("Promise_bankerStatus Success");                      //回調成功訊息，進入下一個階段
                };
                // bankerStatus 判斷莊家回合狀態(通贏.通輸.有輸有贏)
                switch(bankerStatus){
                    case 3:
                        // 莊家通贏
                        self.SystemInfo_node.getComponent("gameSystemInfo").show_banker_status(true,"allwin",_FinelFunc);
                        break;
                    case -3:
                        // 莊家通賠
                        self.SystemInfo_node.getComponent("gameSystemInfo").show_banker_status(true,"alllose",_FinelFunc);
                        break;
                    default:
                        // 有輸有贏
                        resolve("Promise_bankerStatus Success");
                        break;
                }
            });
        }

        //Promise寫法 [結算籌碼動畫]莊家動作
        function Promise_bankerChipAnim(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_bankerChipAnim] In action.",'color:'+self.DebugModeColor);}

                let _playerArr  = [];   //紀錄閒家index
                let _winArr     = [];   //紀錄贏錢的閒家index
                let _bankerIndex;       //紀錄莊家index
                let _bankerStatus;      //莊家狀態

                for(let bKey = 0 ; bKey < _PlayerList.length ; bKey++){
                    if(!_PlayerList[bKey]['Dealer']){
                        _playerArr.push(bKey);      //紀錄閒家index
                        if(_PlayerList[bKey]['TurnProfit'] > 0) {
                            _winArr.push(bKey);     //紀錄贏錢的閒家index
                        }
                    }else{
                        _bankerIndex = bKey;        //紀錄莊家index
                    }
                }

                if(_winArr.length == cc.module.jsonFile["GameMain"]["UserBox"]["PlayerOtherCount"]){             
                    _bankerStatus = "put";          //通賠 
                }else{
                    _bankerStatus = "get";          //有輸有贏/通殺
                }

                switch (_bankerStatus) {
                    case "put":
                        //通賠
                        for(let bKey = 0 ; bKey < _playerArr.length; bKey++){
                            //莊家複製所有閒家籌碼，對象:所有玩家
                            self.SystemInfo_node.getComponent("gameSystemInfo").copyChipNode(_playerArr[bKey],_bankerIndex);

                            let _FinelFunc;
                            if( bKey >= _playerArr.length - 1){
                                _FinelFunc = function() {
                                    resolve("Promise_bankerChipAnim Success");     //回調成功訊息，進入下一個階段
                                };
                            };
                            //莊家投出籌碼到池中，對象:所有玩家
                            self.SystemInfo_node.getComponent("gameSystemInfo").dropChipAnim(true,_playerArr[bKey],_FinelFunc,true);
                        }
                        break;

                    case "get":
                        //有輸有贏/通殺
                        for(let bKey = 0 ; bKey < _playerArr.length; bKey++){
                            //莊家複製所有閒家籌碼，對象:所有玩家
                            self.SystemInfo_node.getComponent("gameSystemInfo").copyChipNode(_playerArr[bKey],_bankerIndex);
                            
                            let _FinelFunc;
                            if( bKey >= _playerArr.length - 1){
                                _FinelFunc = function() {
                                    resolve("Promise_bankerChipAnim Success");     //回調成功訊息，進入下一個階段
                                };
                            };
                            //莊家回收籌碼，對象:所有玩家
                            self.SystemInfo_node.getComponent("gameSystemInfo").getChipAnim(_playerArr[bKey],_bankerIndex,_FinelFunc,0)
                        }
                        break;

                    default:
                        
                        break;
                }

            });
        }

        //Promise寫法 [結算籌碼動畫]玩家動作
        function Promise_playerChipAnim(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_playerChipAnim] In action.",'color:'+self.DebugModeColor);}
                
                let _playerArr  = [];   //紀錄閒家index
                let _winArr     = [];   //紀錄贏錢的閒家index
                let _bankerIndex;       //紀錄莊家index

                for(let bKey = 0 ; bKey < _PlayerList.length ; bKey++){
                    if(!_PlayerList[bKey]['Dealer']){
                        _playerArr.push(bKey);      //紀錄閒家index
                        if(_PlayerList[bKey]['TurnProfit'] > 0) {
                            let el = [bKey,_PlayerList[bKey]['TurnProfit']];
                            _winArr.push(el);     //紀錄贏錢的閒家index
                        }
                    }else{
                        _bankerIndex = bKey;        //紀錄莊家index
                    }
                }
                
                //變更贏錢閒家Array順序(讓籌碼最多的排在最後面，確保贏最多的籌碼發送完再呼叫resolve)
                _winArr.sort(function(a,b){
                    return a[1]-b[1];
                })

                if(_winArr.length == _playerArr.length){     
                    //通贏
                    for(let bKey = 0 ; bKey < _winArr.length; bKey++){
                        //合併莊家與閒家籌碼節點 => 閒家獲得兩倍籌碼
                        self.SystemInfo_node.getComponent("gameSystemInfo").bankerConcat(_winArr[bKey][0])

                        let _FinelFunc;
                        if( bKey >= _winArr.length - 1){
                            _FinelFunc = function() {
                                resolve("Promise_loseChipAnim Success");     //回調成功訊息，進入下一個階段
                            };
                        };
                        //玩家回收籌碼
                        self.SystemInfo_node.getComponent("gameSystemInfo").getChipAnim(_winArr[bKey][0],_winArr[bKey][0],_FinelFunc,0)
                    }
                }else if(_winArr.length > 0){               
                    //有輸有贏
                    for(let bKey = 0 ; bKey < _winArr.length; bKey++){
                        //合併莊家與閒家籌碼節點 => 閒家獲得兩倍籌碼
                        self.SystemInfo_node.getComponent("gameSystemInfo").bankerConcat(_winArr[bKey][0])

                        let _FinelFunc;
                        if( bKey >= _winArr.length - 1){
                            _FinelFunc = function() {
                                resolve("Promise_loseChipAnim Success");     //回調成功訊息，進入下一個階段
                            };
                        };
                        //玩家回收籌碼
                        self.SystemInfo_node.getComponent("gameSystemInfo").getChipAnim(_winArr[bKey][0],_winArr[bKey][0],_FinelFunc,0.1)
                    }
                }else{
                    //閒家無人勝利
                    resolve("Promise_loseChipAnim Success");     //回調成功訊息，進入下一個階段
                }

            });
        }  
  

        //Promise寫法 [跳錢]
        function Promise_CoinAnim(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_CoinAnim] In action.",'color:'+self.DebugModeColor);}
                
                var _GetWinCoinNode;       //各玩家跳錢節點
                var _GetWinCoin;           //各玩家獲利金額

                for(let jKey = 0 ; jKey < _PlayerList.length ; jKey++){
                                                                    
                    if(_PlayerList[jKey]['SeatIndex'] == self.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()){     //玩家資訊
                        _GetWinCoinNode     = self.ControllerPanel_node.getComponent("gameControllerPanel").GetCoinNode(); 
                        _GetWinCoin         = cc.module.tools.formatFloat(parseFloat(_PlayerList[jKey]['TurnProfit']) + parseFloat(_PlayerList[jKey]['TurnLoss']),2);            
                    } else {
                        //敵人資訊
                        for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                            if(_PlayerList[jKey]['SeatIndex'] == self.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {       
                                _GetWinCoinNode = self.Enemies_node.children[uCount].getComponent('userBox').GetCoinNode();     
                                _GetWinCoin     = cc.module.tools.formatFloat(parseFloat(_PlayerList[jKey]['TurnProfit']) + parseFloat(_PlayerList[jKey]['TurnLoss']),2);  
                            }
                        }
                    }

                    

                    self.SystemInfo_node.getComponent("gameSystemInfo").CoinAnim(0,_GetWinCoinNode,_GetWinCoin);
                    // self.SystemInfo_node.getComponent("gameSystemInfo").WinAnim(_GetWinCoin,_FinelFunc); //針對主角撥放勝利或失敗的動畫  
                }
                let _FinelFunc = function() {
                    resolve("Promise_OpenMJ Success");     //回調成功訊息，進入下一個階段
                };
                let _animName = _GetWinCoin > 0 ? "win" : "lose";
                self.SystemInfo_node.getComponent("gameSystemInfo").playAnim(_animName,_FinelFunc);  //開場動畫播放(龍骨)
            });
        }  


        // Promise寫法 [設定籌碼]
        function Promise_SetChips(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_SetChips] In action.",'color:'+self.DebugModeColor);}
                 //更新持有籌碼
                for(let jKey in _PlayerList) {  
                    if(_PlayerList[jKey]['SeatIndex'] == self.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()){
                        self.ControllerPanel_node.getComponent("gameControllerPanel").SetChips(_PlayerList[jKey]['Credit']);
                    } else {  
                        for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
                            if(_PlayerList[jKey]['SeatIndex'] == self.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {
                                self.Enemies_node.children[uCount].getComponent('userBox').SetChips(_PlayerList[jKey]['Credit']);
                                break;       
                            }
                        }
                    }
                }
                resolve("Promise_SetChips Success");     //回調成功訊息，進入下一個階段
            });
        }

        // Promise寫法 [打開狀態機]
        function Promise_QueueState(){
            return new Promise(function(resolve, reject){
                var _cb = function(_JsonData){
                    if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] SendMsg callback.",'color:'+self.DebugModeColor_GET);}
                    console.log(_JsonData)
                    var _Result = JSON.parse(_JsonData['Result']);
                    console.log(_Result)
                    console.log("戳交互完成")
                    console.log("戳交互完成")
                    console.log("戳交互完成")
                };
                self.SendMsg(cc.module.jsonFile['SERVER_GAME_NODEID']+"/HD_NextPeriod", {},_cb);
    
                if(self.DebugMode) {console.log("%c[gameMain] => [CallTurnInfo] [Promise_QueueState] In action.",'color:'+self.DebugModeColor);}
                self.QueueState     = true; 
                //將麻將節點回收(因為局中下個Queue是通知搶莊)
                self.ControllerPanel_node.getComponent("gameControllerPanel").PutPrefab();
                self.SystemInfo_node.getComponent("gameSystemInfo").PutPrefab();
            });
        }
        Promise_CreateMJ().then(Promise_SendMJ).then(Promise_OpenMJ).then(Promise_bankerStatus).then(Promise_bankerChipAnim).then(Promise_playerChipAnim).then(Promise_CoinAnim).then(Promise_SetChips).then(Promise_QueueState);
        
    },

    
    /** GS通知玩家牌桌結算結果
     * [Subscriber] MJEBG/OnSettlement
     * 
     * Payload:
     *  Code	            int	            1: 請求成功
     *  Data            	array	        封包資料 Content-Type: application/json
     *  time            	int	            傳送時間
     * 
     * Data:
     *  PlayerList	        map array	    玩家資料
     *  RecordCardHistory	map	            已發過牌的紀錄
     * 
     * PlayerList:
     *  Nickname	        string	        玩家暱稱
     *  Credit	            float	        玩家當前身上的籌碼金額
     *  SeatIndex	        int	            玩家座位編號
     *  Profit	            float64	        總獲利
     *  Loss	            float64	        總虧損
     *  TurnRecord	        map array	    每回合資訊
     * 
     * TurnRecord:
     *  Turn	            int	            回合
     *  IsBanker	        bool	        是否為莊家
     *  Odds	            float64	        玩家已下注倍率
     *  Magnification	    float64	        玩家已搶莊倍率
     *  TurnProfit	        float64	        此回合獲利金額
     *  TurnLoss        	float64	        此回合損失金額
     * 
     * RecordCardHistory:
     *  0	                int	            白皮所出現次數
     *  1	                int	            一筒所出現次數
     *  2	                int	            二筒所出現次數
     *  3	                int	            三筒所出現次數
     *  4	                int	            四筒所出現次數
     *  5	                int	            五筒所出現次數
    -*  6	                int	            六筒所出現次數
     *  7	                int	            七筒所出現次數
     *  8	                int	            八筒所出現次數
     *  9	                int	            九筒所出現次數
     *  
     *  */
    CallOnSettlement: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallOnSettlement] In action.",'color:'+this.DebugModeColor);}
                
            let _Payload        = _JsonData[1];                 //轉存Payload至jsonData變數中  
            let _Data           = _Payload["Data"];             //取得回傳的陣列資料
            let _PlayerList     = _Data["PlayerList"];          //所有玩家資料
            let _TurnRecord     = _PlayerList[3]["TurnRecord"]; //玩家每回合結算資訊
            cc.module.userParams.GamePeriod = 0;
            var _GetWinCoinNode;       //各玩家跳錢節點
            var _GetWinCoin;           //各玩家獲利金額
            

            // for(let jKey in _PlayerList) {     //遍歷所有使用者的objData
                                                    
            //     if(_PlayerList[jKey]['SeatIndex'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()){
            //         _GetWinCoinNode     = this.ControllerPanel_node.getComponent("gameControllerPanel").GetCoinNode(); 
            //         _GetWinCoin         = cc.module.tools.formatFloat(parseFloat(_PlayerList[jKey]['Profit']) + parseFloat(_PlayerList[jKey]['Loss']),2);            
            //     } else {  
            //         for(var uCount = 0 ; uCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; uCount++) { 
            //             if(_PlayerList[jKey]['SeatIndex'] == this.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {       
            //                 _GetWinCoinNode = this.Enemies_node.children[uCount].getComponent('userBox').GetCoinNode();     
            //                 _GetWinCoin         = cc.module.tools.formatFloat(parseFloat(_PlayerList[jKey]['Profit']) + parseFloat(_PlayerList[jKey]['Loss']),2);  
            //             }
            //         }
            //     }
            //     this.SystemInfo_node.getComponent("gameSystemInfo").CoinAnim(5,_GetWinCoinNode,_GetWinCoin); 
            // }  

            //播完勝利失敗動畫的最後才調用所有結束方法
            let _FinelFunc = function(){
                cc.module.userParams.GameEndCheck = true;
            
                //開始調用結束事件
                for(var tCount = 0 ; tCount < _PlayerList.length ; tCount++) {
                    var _winCombo = (0 - Math.ceil(Math.abs(_PlayerList[tCount]['Loss']/cc.module.userParams.NowGameAntes))) + Math.ceil(_PlayerList[tCount]['Profit']/cc.module.userParams.NowGameAntes);  //該玩家獲利
        
                    if(_PlayerList[tCount]['SeatIndex'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()) {
                        this.ControllerPanel_node.getComponent("gameControllerPanel").SetChips(_PlayerList[tCount]['Credit']);                   //重置持有籌碼
                        this.ControllerPanel_node.getComponent("gameControllerPanel").GameEnd();                                                //主角玩家結束事件
                    } else { 
                        for(var subCount = 0 ; subCount < cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount'] ; subCount++) { 
                            if(_PlayerList[tCount]['SeatIndex'] == this.Enemies_node.children[subCount].getComponent('userBox').GetUserIndex()) {
                                this.Enemies_node.children[subCount].getComponent('userBox').SetChips(_PlayerList[tCount]['Credit']);             //重置持有籌碼
                                this.Enemies_node.children[subCount].getComponent('userBox').GameEnd();   
                                break;
                            }
                        }
                    }
                }
                this.SystemInfo_node.getComponent("gameSystemInfo").GameEnd();  

                this.GameEndCheck();
            }.bind(this);

            

            this.ControllerPanel_node.getComponent("gameControllerPanel").Show_settlement_window(true,_TurnRecord,_FinelFunc);
    },
    
    
    /** 通知點數變更
     * [Subscriber] Gate/ChangeCredit
     * Payload:
     *  Code	            string	        1: 請求成功 -1: 請求失敗 -2: 餘額不足
     *  Data	            array	        回傳資料 Content-Type: application/json => map
     *  Time	            int	            回傳時間
     * 
     * Data:
     *  credit	            float	        金額
     */
    CallChangeCredit: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallChangeCredit] In action.",'color:'+this.DebugModeColor);}

        var _Payload    = _JsonData[1];             //轉存Payload至jsonData變數中
        var _Data       = _Payload["Data"];         //取得回傳的陣列資料
        
        cc.module.userParams.Credit = cc.module.tools.formatFloat(_Data["credit"],2); //取得點數轉入金額
        console.log("接收到點數轉入，目前持有金額為:"+cc.module.userParams.Credit);
    },

    
    /** 通知強制踢你下線哈哈
     * [Subscriber] Gate/PowerKick
     */
    CallPowerKick: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallPowerKick] In action.",'color:'+this.DebugModeColor);}

        cc.module.userParams.GamePeriod     = -1;     //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中}
        var _Payload    = _JsonData[1];             //轉存Payload至jsonData變數中
        switch(parseInt(_Payload["Code"])) {
            case -3:    //重新加入牌桌
                this.SystemPanel_node.getComponent("gameSystemPanel").BtnOpenWindow({},"waitingTimeout",function(){this.JoinRoomFunc();}.bind(this));
                break;
            case -2:    //帳號重複登入
                cc.module.hookMQTT.Destroy();
                cc.module.network.Destroy();
                this.Enemies_node.getComponent("gameEnemies").Init();                   //敵人玩家總初始化
                this.ControllerPanel_node.getComponent("gameControllerPanel").Init();   //主角玩家初始化
                this.SystemInfo_node.getComponent("gameSystemInfo").Init();             //系統資訊區初始化
                this.SystemPanel_node.getComponent("gameSystemPanel").Init();           //系統視窗區初始化
                this.EmojiAnim_node.getComponent("gameEmojiAnim").Init();               //表情動畫初始化
                this.SystemPanel_node.getComponent("gameSystemPanel").BtnOpenWindow({},"reload");
                break;
            case -1:    //直接導向404頁面
                cc.module.network.DestroyTo404Page();  //導向404頁面
                break;
            default:
                if(this.DebugMode) {console.log("%c[hallMain] => [CallPowerKick] 進入例外狀況:code="+_Payload["Code"]+".",'color:'+this.DebugModeColor_FA);}
                break;
        }
    },

    
    /** GS通知玩家有其他玩家發動表情符號
     * [Subscriber] PokerDDZ/Emoji
     * 
     * Payload:
     *  Code	            string	        1: 請求成功 -1: 請求失敗 -2: 餘額不足
     *  Data	            array	        回傳資料 Content-Type: application/json => map
     *  Time	            int	            回傳時間
     * 
     * Data:
     *  Type                string          {"string":文字對話,"icon":表情符號}
     *  Emoji	            string	        第幾款
     *  SeatIndex	        string	        玩家座位
     * */
    CallEmoji: function(_JsonData){
        if(this.DebugMode) {console.log("%c[gameMain] => [CallEmoji] In action.",'color:'+this.DebugModeColor);}

        var _Payload    = _JsonData[1];             //轉存Payload至jsonData變數中
        var _Data       = _Payload["Data"];         //取得回傳的陣列資料
        
        let _UserIconNode,_UserSitDown;
        if(_Data['SeatIndex'] == this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIndex()){
            _UserIconNode = this.ControllerPanel_node.getComponent("gameControllerPanel").GetUserIconNode();
            _UserSitDown  = -1;
        } else {
            for(var uCount = 0 ; uCount < parseFloat(cc.module.jsonFile["GameMain"]["UserBox"]['PlayerOtherCount']) ; uCount++) { 
                if(_Data['SeatIndex'] == this.Enemies_node.children[uCount].getComponent('userBox').GetUserIndex()) {    
                    _UserIconNode = this.Enemies_node.children[uCount].getComponent('userBox').GetUserIconNode();
                    _UserSitDown  = this.Enemies_node.children[uCount].getComponent('userBox').GetUserSitDown();
                    break;
                }
            }
        }
        this.EmojiAnim_node.getComponent("gameEmojiAnim").StartAnim(_Data['Type'],_Data['Emoji'],_UserIconNode,cc.module.jsonFile['EmojiAnim'],_UserSitDown);
    },


    /**
     * [更新收到封包的時間戳]
     */
    UpdatePackageTimestamp: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [UpdatePackageTimestamp] In action.",'color:'+this.DebugModeColor_FA);}

        let _Datetime       = cc.module.tools.GetNowDateTime();
        let _TimeStamp      = cc.module.tools.Datetime2timeStamp(_Datetime);
        cc.sys.localStorage.setItem("PackageTimestamp",_TimeStamp);
    },

    /**
     * [確認封包時間差是否在允與範圍內]
     */
    CheckPackageTimestamp: function(){
        // if(this.DebugMode) {console.log("%c[gameMain] => [CheckPackageTimestamp] In action.",'color:'+this.DebugModeColor_FA);}
        //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中})
        if(cc.module.userParams.GamePeriod == -1 || cc.module.userParams.GamePeriod == 0) return;
        
        let _Datetime               = cc.module.tools.GetNowDateTime();
        let _Current_Timestamp      = cc.module.tools.Datetime2timeStamp(_Datetime);    //當前時間
        let _Lest_Timestamp         = cc.sys.localStorage.getItem("PackageTimestamp");  //前一個封包的時間
        let _QueueTimer;
        switch(this.QueueNow) {
            case "RollingToDealResult":     _QueueTimer = 9;         break;
            case "TurnInfo":                _QueueTimer = 18;         break;
            default:                        _QueueTimer = 8;          break;
        }
        let _Threshold_Timestamp    = cc.module.userParams.GamePeriod == 1 ? 18 : _QueueTimer;    //若為坐下階段則判斷時間需長些，若為遊戲中則改為3秒
        
        if((parseInt(_Current_Timestamp) - parseInt(_Lest_Timestamp)) >= _Threshold_Timestamp){
            console.log("tableFlash")
            console.log("tableFlash")
            console.log("tableFlash")
            console.log("tableFlash")
            this.TableFlash();
        }
    },

    /**
     * [畫面重新繪製]
     */
    TableFlash: function(){
        if(this.DebugMode) {console.log("%c[gameMain] => [TableFlash] In action.",'color:'+this.DebugModeColor_FA);}
        this.UpdatePackageTimestamp();  //更新封包時間
        cc.module.network.Disconnection_CB();
        cc.module.network.DestroyToConnect();  
    },


    update (dt) {
        this.OnQueueArr     = cc.module.hookMQTT.ReturnQueueArr();
        this.RealTimeArr    = cc.module.hookMQTT.ReturnRealTimeArr();
        this.CheckPackageTimestamp();

        //狀態機
        // return;
        if(this.QueueState) {  

                                                          //若開啟狀態機處理程序
            for(var qCount = 0 ; qCount < this.OnQueueArr.length ; qCount++){   //跑所有待處理的監聽事件
                for(var SMkey in this.StateMachineObj) {                        //跑狀態機目前狀態
                    if(SMkey == this.QueueNow) {                            //若找到對應的目前狀態
                        for(var subSMkey in this.StateMachineObj[SMkey]) {      //尋找該狀態的下一個狀態機，並判斷是否符合目前的Queue
                            if(this.StateMachineObj[SMkey][subSMkey] == this.OnQueueArr[qCount][0]){    //下一個狀態機成立，則執行，並將Queue鎖死不執行其他動作

                                this.QueueNow   = this.OnQueueArr[qCount][0];   //目前狀態機的狀態轉換
                                this.QueueState = false;                        //將Queue鎖死，直到目前狀態機事件處理完成

                                console.log("---目前狀態---");
                                console.log(this.QueueNow);
                                console.log("---目前資料---");
                                let _show = this.OnQueueArr[qCount];
                                console.log(_show);

                                this.UpdatePackageTimestamp();
                                cc.module.userParams.GamePeriod = 2;    //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中})
                                switch(this.OnQueueArr[qCount][0]){             //call對應的動作function
                                    case "TT": 
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallTT(_intput);
                                        return;
                                        break;
                                    case "TableInfo":
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallTableInfo(_intput);
                                        return;
                                        break;
                                    case "StartBidding":
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallStartBidding(_intput);
                                        return;
                                        break; 
                                    case "SomeoneBidding":
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallSomeoneBidding(_intput);
                                        return;
                                        break;
                                    case "BiddingResult":
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallBiddingResult(_intput);
                                        return; 
                                        break;
                                    case "StartBetting":
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallStartBetting(_intput);
                                        return; 
                                        break;
                                    case "SomeoneBetting":
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallSomeoneBetting(_intput);
                                        return; 
                                        break;
                                    case "RollingToDealResult":
                                         var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallRollingToDealResult(_intput);
                                        return; 
                                        break;
                                    case "TurnInfo":
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallTurnInfo(_intput);
                                        return; 
                                        break;
                                    case "OnSettlement":
                                        var _intput = this.OnQueueArr[qCount];
                                        cc.module.hookMQTT.DeleteQueueArr(qCount);
                                        this.CallOnSettlement(_intput);
                                        return; 
                                        break;
                                    default:
                                        console.log("update Queue error");
                                        break;
                                }
                            }
                        }
                    }
                }
            }

        }
        
        //即時處理事件陣列
        if(this.RealTimeState) {
            for(var rCount = 0 ; rCount < this.RealTimeArr.length ; rCount++){      //跑所有待處理的即時處理事件
                switch(this.RealTimeArr[rCount][0]){                                //call對應的動作function
                    case "ChangeCredit":
                        var _intput = this.RealTimeArr[rCount];
                        cc.module.hookMQTT.DeleteRealTimeArr(rCount);
                        this.CallChangeCredit(_intput);
                        return;
                        break;
                    case "PowerKick":
                        var _intput = this.RealTimeArr[rCount];
                        cc.module.hookMQTT.DeleteRealTimeArr(rCount);
                        this.CallPowerKick(_intput);
                        return;
                        break;
                    case "Emoji":
                        var _intput = this.RealTimeArr[rCount];
                        cc.module.hookMQTT.DeleteRealTimeArr(rCount);
                        this.CallEmoji(_intput);
                        return;
                        break;
                    default:
                        console.log("update RealTimeArr error");
                        break;
                }
            }
        }
    },

});
