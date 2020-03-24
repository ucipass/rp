<template>

  <b-container fluid v-if='showMainTemplate'>
    <h1>MainTemplate</h1>    
    <div class="text-center">
      MainTemplate
    </div>
  </b-container>
</template>

<script>
import { eventBus, hideMainAll } from './events.js'

export default {
  name: "App",
  data: () => ({
    showMainTemplate: false,
  }),
  mounted: async function () {
    // Download the schema from the server
    // let _this = this
    // await axios
    // .post(URL_SCHEMA,{})
    // .then(response => {
    //   console.log("SUCCES",response)
    //   _this.schema = response.data
    // })
    // .catch(error => console.log("Error reading schema from server",error))   

    // await this.refreshMainRendezvousPoints()

    eventBus.$on('showMainTemplate', () => {
      hideMainAll()
      this.refresh();
      this.showMainTemplate = true;
      console.log("Event: showMainTemplate");
    })    
    eventBus.$on('hideMainTemplate', () => {
      this.showMainTemplate = false
      console.log("Event: hideMainTemplate")
    })   
  },
  methods:{
    testfn: async function(){
      console.log("TEST")
    },
    async refresh(){
      // axios
      // .post(URL_SIOCLIENTS_READ,{})
      // .then(response => {
      //   console.log("SUCCES",response)
      //   this.receivedData = response.data
      // })
      // .catch(error => console.log("ERROR",error))      
      console.log("Event: showMainClients")      
    }
  }
};
</script>

<style></style>
