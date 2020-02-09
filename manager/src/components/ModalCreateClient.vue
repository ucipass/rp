<template>
  <div>
    <b-modal :id="id" class="text-center" :title="title">
      <b-container >
          <b-row><b-col>Client Name</b-col><b-col><b-input v-model='client.name'></b-input></b-col></b-row>
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


export default {
  name: 'ModalCreateClient',
  props: {
    title: {
      default: "Create Client",
      type: String
    },
    id: {
      default: "ModalCreateClient",
      type: String
    }
  },
  data: function(){
    return{
      client:{
        client: "client1"
      },
      status: ""
    }
  },
  methods:{
    show: function(){
      console.log("SHOW")
      this.$bvModal.show(this.id)
    },
    hide: function(){
      console.log("HIDE")
      this.$bvModal.hide(this.id)
    },
    create: async function(){
      let response = await axios
      .post(URL_CREATE,this.room)
      .catch(error => { console.log("ERROR",error); return null })
      this.status = response.data
      if(this.status == 'success'){
        this.hide();
        this.$root.$emit('showMainRendezvousPoints')
      }
    }
  },
  mounted: function () {
    console.log("MOUNTED")
    this.$root.$on('showModalCreateRoom', () => {
        console.log("Event Received: showModalCreateRoom", event)
        this.show()
    })
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
