<template>

  <b-container fluid v-if='showMainStatus'>
    <h3>Clients Authenticated: {{ statusdate ? statusdata.clients_authenticated : 0}} </h3>
    <div class="text-center">
      <!-- {{statusjson}} -->
      <b-card v-for="client in clients" :key="client.name" no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-button block href="#" v-b-toggle="client.name" variant="info">{{client.name}}</b-button>
        </b-card-header>
        <b-collapse v-bind:id="client.name" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <b-card-text v-for="prop in Object.keys(client)" :key=prop >
              <div class="row">
                <div class="col text-right">
                  {{ prop }}:
                </div>
                <div class="col text-left">
                  {{ client[prop] }}
                </div>
              </div>                
              <!-- {{ JSON.stringify(prop) }} {{ JSON.stringify(client[prop]) }} -->
            </b-card-text>
          </b-card-body>
        </b-collapse>
      </b-card>      
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
    test:1,
    showMainStatus: false,
    statusjson: "Waiting for data from server...",
    text: "Waiting for data from server...",
    clients: [ {name:"c1",token: 1},{name:"c2",token: 2}],
    statusdata: null
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
        this.statusdata = response.data
        this.clients = response.data.clients
        this.statusjson = JSON.stringify(response.data, null, 2);
        console.log(this.statusjson)
      })
      .catch(error => console.log("Error reading status from server",error))      

    }
  }
};
</script>

<style></style>
