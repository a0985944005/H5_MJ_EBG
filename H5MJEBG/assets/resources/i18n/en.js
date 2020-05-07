'use strict';

if (!window.i18n) {
    window.i18n = {};
}

if (!window.i18n.languages) {
    window.i18n.languages = {};
}

window.i18n.languages['en'] = {
    // write your key value pairs here
    login_systemLabelAD:{
        0:"Loading…Please wait.",
        1:"Our original dice games has just hit the market!",
        2:"Our brand new card and dice games won’t let you stop having fun!",
        3:"Don’t forget to check out our goofy emoji"
    },
    login_tipsWindow_RejoinToEnd: "has now entered settlement, do you want to exit?",
    login_tipsWindow_RejoinToPlay: "game has not yet ended, please confirm to exit?",
    login_tipsWindow_ManualReconnect: "Unable to connect Please click confirm to connect again.",
    tipsWindow_noCredit: "Insufficient amount to enter the game.",
    tipsWindow_reload: "Your current session has expired or you have logged in at another location, please login again.",
    tipsWindow_tips: {
        title:"Reminder",
        content:"Welcome! After reading the instructions, let’s start the battle of wits and courage!"
    },
    tipsWindow_backHall: "Returning to the lobby...",
    tipsWindow_cantBackHall: "Can't quit during a game",
    tipsWindow_waiting: "The current game room is crowded, please hold on.",
    list_gameType: {
        All:        "All",
        DiceDTCN:   "Liar's Dice Battle",
        DiceHHDS:   "Red Black & Odd Even ",
        DiceJDCN:   "Liar's Dice 067",
        DiceQZNN:   "Banker Dice Bull",
        DiceSH:     "Bloody Dice Battle",
        PokerDDZ:   "Landlord Fights",
        PokerDZPK:  "Texas Hold'em",
        PokerZJH:   "Golden Flower",
        DiceBRNN:   "",
        DiceDRHHDS: "",
        DiceFKDTCN: "",
        MJEBG:      ""
    },
    version:"version",
    year:".",
    month:"",
    date:{
        Sunday:     "Su",
        Monday:     "Mo",
        Tuesday:    "Tu",
        Wednesday:  "We",
        Thursday:   "Th",
        Friday:     "Fr",
        Saturday:   "Sa"
    }
};