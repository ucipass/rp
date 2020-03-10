<template>
  <div>
    <b-modal :id="id" class="text-center" :title="title">
      <b-container >
          <b-row><b-col>Room Name</b-col><b-col><b-input v-model='room.name'></b-input></b-col></b-row>
          <b-row><b-col>Room rcvName</b-col><b-col><b-input v-model='room.rcvName'></b-input></b-col></b-row>
          <b-row><b-col>Room rcvPort</b-col><b-col><b-input v-model='room.rcvPort'></b-input></b-col></b-row>
          <b-row><b-col>Room fwdName</b-col><b-col><b-input v-model='room.fwdName'></b-input></b-col></b-row>
          <b-row><b-col>Room fwdHost</b-col><b-col><b-input v-model='room.fwdHost'></b-input></b-col></b-row>
          <b-row><b-col>Room fwdPort</b-col><b-col><b-input v-model='room.fwdPort'></b-input></b-col></b-row>
      </b-container>
      <div slot="modal-footer" class="w-100">
        <p class="float-left text-danger">{{status}}</p>
        <p class="float-left"></p>
        <b-button variant="primary" size="sm" class="float-right" @click="create">Create</b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios';
import {URL_CREATE } from './constants.js';
import { eventBus } from './events.js'


export default {
  name: 'ModalCreateRoom',
  props: {
    title: {
      default: "Create Room",
      type: String
    },
    id: {
      default: "ModalCreateRoom",
      type: String
    }
  },
  data: function(){
    return{
      room:{
        name: "room1",
        rcvName: "client1",
        rcvPort: "11111",
        fwdName: "client2",
        fwdHost: "localhost",
        fwdPort: "22"
      },
      status: ""
    }
  },
  methods:{
    show: function(){
      this.$bvModal.show(this.id)
    },
    hide: function(){
      this.$bvModal.hide(this.id)
    },
    create: async function(){
      let response = await axios
      .post(URL_CREATE,this.room)
      .catch(error => { console.log("ERROR",error); return null })
      this.status = response.data
      if(this.status == 'success'){
        this.hide();
        eventBus.$emit('showMainRendezvousPoints')
      }
    }
  },
  mounted: function () {
    console.log("ModalCreateRoom: Mounted")
    eventBus.$on('showModalCreateRoom', () => {
    this.show()
    })
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
