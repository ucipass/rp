<template>
  <b-container fluid v-if='showMainClients'>
    <h1>Rendezvous Clients</h1>
    <b-row class="text-center">
      <!-- b-table uses "value" for actual cell value and "item" for row data and "slot" for the entire row -->
      <b-table hover striped :items="receivedData" :fields="tableColumns">
        <template v-slot:cell(name)="slot">
          <b-input v-model='receivedData[slot.index].name'></b-input>
        </template>    
        <template v-slot:cell(token)="slot">
          <b-input v-model='receivedData[slot.index].token'></b-input>
        </template>    
        <template v-slot:cell(ipaddr)="slot">
          <b-input v-model='receivedData[slot.index].ipaddr'></b-input>
        </template>    
        <template v-slot:cell(expiration)="slot">
          <b-input v-model='receivedData[slot.index].expiration'></b-input>
        </template>    
        <template v-slot:cell(actionColumn)="slot">
          <a :id="`Download${slot.index}`"></a>
          <b-button class="mr-1" @click='downloadToken(slot.index)'>Download</b-button>
          <b-button class="mr-1" @click='updateData(slot.index)'>Update</b-button>
          <b-button              @click='deleteData(slot.index)'>Delete</b-button>
        </template>    



      </b-table>
    </b-row>
    <b-row><div class="p-3"><b-button @click="showModalCreateClient()">Create</b-button></div></b-row>
  </b-container>
</template>

<script>
// import TableRow from './TableRow.vue'
import axios from 'axios';
import {URL_SIOCLIENTS_READ, URL_SIOCLIENTS_DELETE } from './constants.js';
import { eventBus, hideMainAll } from './events.js'

export default {
  name: 'MainClients',
  components: {
    // TableRow
  },
  props: {
    title: {
      default: "MainClients",
      type: String
    },
    id: {
      default: "MainClients",
      type: String
    }
  },
  data: ()=> { 
    return{
      slots: ["cell(client)","cell(token)","cell(ipaddr)","cell(expiration)"],
      showMainClients: false,
      receivedData:[],
      tableColumns: [],
    } 
  },
  methods:{
    testfn: async function(){
      console.log("TEST")
    },
    downloadToken: function (index){
      let token = {
        name: this.receivedData[index].name,
        token: this.receivedData[index].token,
        url: "https://aws.arato.biz/rp"
      }
      console.log("Download Token:",token)
      let filename, text
      text = JSON.stringify(token)
      filename = "token.json"
      var element = document.getElementById("Download"+index);
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
      element.click()
      // element.style.display = 'none';
      // document.body.appendChild(element);
      // document.body.removeChild(element);

    },
    updateData: function (index){
      console.log("UPDATE DATA:",this.receivedData[index])
    },
    deleteData: async function (index){
      console.log("DELETE DATA:",this.receivedData[index])
      console.log(URL_SIOCLIENTS_DELETE)
      let response = await axios
      .post(URL_SIOCLIENTS_DELETE,this.receivedData[index])
      .catch(error => { console.log("ERROR",error); return null })
      this.status = response.data
      if(this.status == 'success'){
        this.refresh()
      }      
    },
    async refresh(){
      axios
      .post(URL_SIOCLIENTS_READ,{})
      .then(response => {
        console.log("URL_SIOCLIENTS_READ:",response.data)
        let array = response.data ? response.data : []
        this.receivedData = array.map( e => {delete e._id; delete e.__v;return e})
        if(this.receivedData && this.receivedData.length){
          let record = this.receivedData[0]
          let newcolumns = []
          for (const key in record) {
            if (record.hasOwnProperty(key)) {
              const column = key;
              newcolumns.push( { key: column, label: column, sortable: false }  )
            }
          }
          newcolumns.push( { key: "actionColumn", label: "Action", sortable: false }   )
          this.tableColumns = newcolumns
        }else{
          this.tableColumns = []
          this.receivedData = []
        }
        console.log(this.receivedData)
      })
      .catch(error => {
        console.log("ERROR",error)
      })      
      console.log("Event: showMainClients")      
    },
    showModalCreateClient(){
      eventBus.$emit('showModalCreateClient')
      console.log('MainClient: showModalCreateClient')
    }
  },
  computed:{
    getjson(){
      return{ prefix:this.prefix,region:this.region}
    }
  },
  mounted: async function () {
    this.refresh();
    eventBus.$on('showMainClients', () => {
      hideMainAll()
      this.refresh();
      this.showMainClients = true;
      console.log("Event: showMainClients");
    })    
    eventBus.$on('hideMainClients', () => {
      this.showMainClients = false
      console.log("Event: hideMainClients")
    })       

  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
