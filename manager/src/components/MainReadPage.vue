<template>
     <b-container fluid v-if='showMainReadPage'>
        <h1>Rendezvous Points</h1>
        <!-- <b-table striped hover :items="db"></b-table> -->
        <b-row>
          <b-col class="font-weight-bold">Room Name</b-col>
          <b-col class="font-weight-bold">Receiver Name</b-col>
          <b-col class="font-weight-bold">Receiver Port</b-col>
          <b-col class="font-weight-bold">Forwarder Name</b-col>
          <b-col class="font-weight-bold">Forwarder Host</b-col>
          <b-col class="font-weight-bold">Forwarder Port</b-col>
          <b-col md="auto" style="visibility:hidden"><b-button >Update</b-button><b-button>Delete</b-button></b-col>
        </b-row>
        <b-row class="justify-content-md-center" v-for="room in receivedData" v-bind:key="room.name">
          <b-col><b-input v-model='room.name'></b-input></b-col>
          <b-col><b-input v-model='room.rcvName'></b-input></b-col>
          <b-col><b-input v-model='room.rcvPort'></b-input></b-col>
          <b-col><b-input v-model='room.fwdName'></b-input></b-col>
          <b-col><b-input v-model='room.fwdHost'></b-input></b-col>
          <b-col><b-input v-model='room.fwdPort'></b-input></b-col>
          <b-col md="auto"><b-button @click="updateRoom(room)">Update</b-button><b-button @click="deleteRoom(room)">Delete</b-button></b-col>
        </b-row>
        <b-row><div class="p-3"><b-button @click="showModalCreateRoom()">Create</b-button></div></b-row>
     </b-container>
</template>

<script>
// import TableRow from './TableRow.vue'
import axios from 'axios';
import {URL_UPDATE, URL_READ, URL_DELETE, URL_SCHEMA } from './constants.js';
console.log(URL_READ)


export default {
  name: 'MainReadPage',
  components: {
    // TableRow
  },
  props: {
    title: {
      default: "MainReadPage",
      type: String
    },
    id: {
      default: "MainReadPage",
      type: String
    }
  },
  data: ()=> { 
    return{
      showMainReadPage: true,
      field1: "field1",
      field2: "field2",
      test:[
        {f1:"A1",f2:"A2"},
        {f1:"B1",f2:"B2"}
      ],
      receivedData:[],
      schema: {}
    } 
  },
methods:{
    testfn: async function(){
      console.log("TEST")
    },
    showModalCreateRoom(){
      this.$root.$emit('showModalCreateRoom')
      console.log('showModalCreateRoom')
    },
    async refreshMainReadPage(){
      axios
      .post(URL_READ,{})
      .then(response => {
        console.log("SUCCES",response)
        this.receivedData = response.data
      })
      .catch(error => console.log("ERROR",error))      
      console.log("Event: showMainReadPage")      
    },
    async updateRoom(room){
      console.log("Update",room)
      let response = await axios
      .post(URL_UPDATE,room)
      .catch(error => console.log("UPDATE ERROR",error))
        
      this.status = response.data
      if(this.status == "success"){
        this.status = await this.refreshMainReadPage()
        console.log(this.status)
      }
    },
    async deleteRoom(room){
      console.log("Delete",room)
      let response = await axios
      .post(URL_DELETE,room)
      .catch(error => console.log("DELETE ERROR",error))
      this.status = response.data

      await this.refreshMainReadPage()

    }
  },
  computed:{
    getjson(){
      return{ prefix:this.prefix,region:this.region}
    },
    db(){
      
      if (this.receivedData.length) {
        return this.receivedData
      }
      else return [this.schema]
    }
  },
  mounted: async function () {
    // Download the schema from the server
    let _this = this
    await axios
    .post(URL_SCHEMA,{})
    .then(response => {
      console.log("SUCCES",response)
      _this.schema = response.data
    })
    .catch(error => console.log("Error reading schema from server",error))   

    await this.refreshMainReadPage()

    this.$root.$on('showMainReadPage', () => {
      this.showMainReadPage = true;
      this.refreshMainReadPage();
      console.log("Event: showMainReadPage");
    })    
    this.$root.$on('hideMainReadPage', () => {
        this.showMainReadPage = false
        console.log("Event: hideMainReadPage")
    })    

  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
