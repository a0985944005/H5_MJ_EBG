cc.Class({
    extends: cc.Component,

    properties: {

        MainEBG_Atlas: cc.SpriteAtlas,             //主要圖片資源
        MJ_info_node:cc.Node,                      //麻將龍骨


        //麻將男
        boy_28:                 { default: null,    type: cc.AudioClip  },
        //男寶牌
        boy_pair:               { default: [],      type: cc.AudioClip  },         
        //男點數
        boy_single:             { default: [],      type: cc.AudioClip  },  

        //麻將女
        girl_28:                 { default: null,    type: cc.AudioClip  },
        //女寶牌
        girl_pair:               { default: [],      type: cc.AudioClip  },         
        //女點數
        girl_single:             { default: [],      type: cc.AudioClip  },  
    },

    Init () {
        this.MJ_info_node.active = false;
        cc.module.tools.loadDragonBonesAsset("dragonBones/ebg_ske");
        this.node.getChildByName("MJ_1").getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("MJ_back")
        this.node.getChildByName("MJ_2").getComponent(cc.Sprite).spriteFrame  = this.MainEBG_Atlas.getSpriteFrame("MJ_back")
        this.node.getChildByName("MJ_info").active =  false;

    },       

    show_MJ_info :function(_MJ1,_MJ2,_Gender,_cb){
        console.log("[MJ_Group] => [show_MJ_info] In action.")
            if(_MJ1!=_MJ2){
                if((_MJ1=="2"&&_MJ2=="8")||(_MJ1=="8"&&_MJ2=="2")){
                    if(typeof(_Gender) != "undefined"){
                        if(_Gender){
                            cc.module.audio.playEffect(this.boy_28);  //播放音效
                        }else{
                            cc.module.audio.playEffect(this.girl_28);  //播放音效
                        }
                    }
                    //開牌型龍骨+++
                    // this.MJ_info_node.getComponent(dragonBones.ArmatureDisplay).playAnimation("cardType028",1);
                    cc.module.tools.loadDragonBones(true,this.MJ_info_node,"dragonBones/ebg_ske","cardType028",1,"complete",function(){
                        if(typeof(_cb) == "function"){
                            _cb()
                        }
                    });
                }else{
                    if(_MJ1=="0" || _MJ2=="0"){
                        var _CardTypePoint = parseInt(_MJ1)+parseInt(_MJ2)+0.5;
                    }else{
                        var _CardTypePoint = (parseInt(_MJ1)+parseInt(_MJ2))>=10?(parseInt(_MJ1)+parseInt(_MJ2))-10:(parseInt(_MJ1)+parseInt(_MJ2));
                    }
                    let MJ_order = [0,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5];
                    let MJ_AnimNum = _CardTypePoint != 0 ? (_CardTypePoint * 10).toString() : "00" ;
                    //MJ->該回合音樂跟牌型
                    let MJ = MJ_order.indexOf(_CardTypePoint);
                    if(typeof(_Gender) != "undefined"){
                        if(_Gender){
                            cc.module.audio.playEffect(this.boy_single[MJ]);  //播放音效
                        }else{
                            cc.module.audio.playEffect(this.girl_single[MJ]);  //播放音效
                        }
                    }
                    //開牌型龍骨+++
                    cc.module.tools.loadDragonBones(true,this.MJ_info_node,"dragonBones/ebg_ske","cardType0" + MJ_AnimNum,1,"complete",function(){
                        if(typeof(_cb) == "function"){
                            _cb()
                        }
                    });
                }    
            }else{
                //MJ->該回合音樂跟牌型
                var _CardTypePoint = parseInt(_MJ1);
                let MJ = _MJ1
                if(typeof(_Gender) != "undefined"){
                    if(_Gender){
                        cc.module.audio.playEffect(this.boy_pair[MJ]);  //播放音效
                    }else{
                        cc.module.audio.playEffect(this.girl_pair[MJ]);  //播放音效
                    }
                }
                let MJ_AnimNum = MJ.toString() + MJ.toString();
                //開牌型龍骨+++
                cc.module.tools.loadDragonBones(true,this.MJ_info_node,"dragonBones/ebg_ske","cardType1" + MJ_AnimNum,1,"complete",function(){
                    if(typeof(_cb) == "function"){
                        _cb()
                    }
                });
            }
        this.MJ_info_node.active = true;
    },
});
