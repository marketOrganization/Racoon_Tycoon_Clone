<template>
    <div class="message-feed">
        <div v-if="game" class="message-container"> 
            <div v-if="game.messageFeed.length >= 4" class="message">
                {{game.messageFeed[game.messageFeed.length-4]}}
            </div>
            <div v-if="game.messageFeed.length  >= 3" class="message">
                {{game.messageFeed[game.messageFeed.length-3]}}
            </div>
            <div v-if="game.messageFeed.length >= 2" class="message">
                {{game.messageFeed[game.messageFeed.length-2]}}
            </div>
            <div v-if="game.messageFeed.length  >= 1" class="message-big">
                {{game.messageFeed[game.messageFeed.length-1]}}
            </div>
        </div>
    </div>
</template>

<script>
    import { mapState } from 'vuex';
    export default {
        name: "UserMessage",
        components:{
            
        },
        computed: {
            ...mapState(["message", "game"]),
        },
        methods:{

        }
    }
</script>

<style >
    .message-feed{
        position:absolute;
        top: 40px;
        right: 10px;
        align-self: end;
        display: flex;
        flex-flow: column nowrap;
        justify-content: right;
    }
    .message-container{
        display:flex;
        flex-flow:column nowrap;
        justify-content: center;
        align-items: end;
        padding:10px;
        margin: 10px;
    }
    .message{
        display:flex;
        flex-flow:row nowrap;
        justify-content: right;
        font-family: main;
        font-size: 1.3em;
        background: rgba(43, 17, 17, 0.787);
        border: 3px solid rgb(148, 98, 47);
        border-radius:10px;
        color:rgb(213, 201, 178);
        padding: 6px;
        margin: 5px;
    }
    .message-big{
        font-family: main;
        font-size: 1.9em;
        background: rgba(43, 17, 17, 0.913);
        border: 4px solid rgb(148, 98, 47);
        border-radius:10px;
        color:rgb(213, 201, 178);
        padding: 9px;
        margin: 10px
    }

</style>