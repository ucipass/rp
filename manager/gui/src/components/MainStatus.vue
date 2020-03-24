<template>

  <b-container fluid v-if='showMainStatus'>
    <h1>MainStatus</h1>    
    <div class="text-center">
      {{statusjson}}
    </div>
  </b-container>
</template>

<script>
import axios from 'axios';
import { URL_STATUS } from './constants.js'
import {  eventBus, hideMainAll } from './events.js'

export default {
  name: "App",
  data: () => ({
    showMainStatus: false,
    statusjson: "Waiting for data from server..."
    // status: null
  }),
  mounted: async function () {
    eventBus.$on('showMainStatus', () => {
      hideMainAll()
      this.showMainStatus = true;
      this.status()
      console.log("Event: showMainStatus");
    })    
    eventBus.$on('hideMainStatus', () => {
      this.showMainStatus = false
      console.log("Event: hideMainStatus")
    })   
  },
  methods:{
    testfn: async function(){
      console.log("TEST")
    },
    status: async function(){
      axios.get(URL_STATUS)
      .then( response =>{
        this.statusjson = JSON.stringify(response.data, null, 2);
        console.log(this.statusjson)
      })
      .catch(error => console.log("Error reading status from server",error))      

    }
  }
};
</script>

<style></style>
