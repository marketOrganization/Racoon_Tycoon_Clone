<template>
    <div >
        <AuctionUI v-if="game.auction"/>
        <PlayerStats></PlayerStats>
        <PPCard/>
        <div  class="gameid">
            <div v-if="game.roomId" >Currenetly in Game:   {{game.roomId}}</div>
        </div>
        <div v-if="player.selling">
            <form class="selling-form" @submit="handleSell">
              <input class="input-form" ref="sellAmountInput"/>
              <button class="selling-button" type="submit">Sell</button>
              <button class="selling-button" @click="handleCancelSell">Cancel</button>
            </form>
        </div>
    </div>
</template>

<script>
    import PlayerStats from './PlayerStats.vue';
    import PPCard from './PPCard.vue';
    import AuctionUI from './AuctionUI.vue';
    import { mapState, mapGetters, mapMutations } from 'vuex'
    export default {
        name: "UI",
        data () {
            return {

            }
        },
        components:{
            PlayerStats,
            PPCard,
            AuctionUI
        },
        computed:{
            ...mapState(["player", "game", "FPS"]),
            ...mapGetters(["getPlayer", "getGame", "getSocket" ])
        },
        methods:{
            ...mapMutations(["updateMessage", "updatePlayer"]),
            handleSell(e){
                e.preventDefault()
                let player = this.getPlayer()
                let game = this.getGame()
                if(
                    game.players[game.turnIndex].name === player.name 
                    && !player.discarding 
                    && !player.isInAuction 
                    && !player.pickingProduceItems 
                    && player.selling
                    && !player.buyingTown
                    && !player.buyingBuilding
                ){
                    if(parseInt(this.$refs.sellAmountInput.value) <= player.commodies.filter((commodity)=>{return commodity.name === game.sellingCommodity}).length){
                        game.sellAmount = parseInt(this.$refs.sellAmountInput.value) 
                        game.action = "SELL"
                        this.getSocket().emit("ACTION", game)
                    }else{
                        this.updateMessage("You Dont Have That Much.")
                    }
                }else{
                this.updateMessage("Cannot Do That Now.")
                }
            },
            handleCancelSell(){
                let player = this.getPlayer()
                player.selling = false
                this.updatePlayer(player)
                this.$refs.sellAmountInput.value = ""
            }
        }
    }
</script>

<style >
    .messagefeed-container{
        display:flex;
        flex-flow:column nowrap; 
    }
    .message{
        margin:5px
    }
    .gameid{
        position: absolute;
        top: 10px;
        right: 10px;
        padding-left: 10px;
        padding-right: 10px;
        display: flex;
        flex-flow:row nowrap;
        justify-content: space-between;
        align-items: center;
        border-radius: 50px;
        background: rgba(43, 17, 17, 0.839);
        border:3px solid rgb(148, 98, 47);
        font-size: 1.75em;
        font-family:main;
        font-weight: bolder;
        text-decoration: none ;
        color:rgb(205, 183, 163);
        text-shadow: rgb(0, 0, 0) 2px 2px 2px;
    }
    .selling-form{
        position:absolute;
        bottom: 30vh;
        left: 35vw;
        width:30vw;
        padding-left: 10px;
        padding-right: 10px;
        display: flex;
        flex-flow:row nowrap;
        justify-content: space-between;
        align-items: center;
        border-radius: 50px;
        background: rgba(43, 17, 17, 0.839);
        border:3px solid rgb(148, 98, 47);
    }
    .selling-button{
        font-size: 2em;
        font-family:main;
        background: none;
        font-weight: bolder;
        text-decoration: none ;
        border:none;
        color:rgb(167, 142, 119);
        padding: 10px;
        padding-left:25px;
        padding-right:25px;
        margin: 10px;
        border-radius: 50px;
        align-self: center;
        text-shadow: 1px 2px 5px black;
    }
    .selling-button:hover{
        text-shadow: 4px 4px 5px black;
    }
</style>