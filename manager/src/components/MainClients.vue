<template>
  <b-container fluid v-if='showMainClients'>
    <h1>Clients</h1>
  </b-container>
</template>

<script>
// import TableRow from './TableRow.vue'
import axios from 'axios';
import {URL_SIOCLIENTS_READ } from './constants.js';
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
      showMainClients: false,
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
    async refresh(){
      axios
      .post(URL_SIOCLIENTS_READ,{})
      .then(response => {
        console.log("SUCCES",response)
        this.receivedData = response.data
      })
      .catch(error => console.log("ERROR",error))      
      console.log("Event: showMainClients")      
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
