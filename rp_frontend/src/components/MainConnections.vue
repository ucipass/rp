<template>

  <b-container fluid v-if='showMainConnections'>
    <h1>Connections</h1>    
    <div class="text-center">
      <b-table
        id="myTabel"
        hover
        striped
        :items="tableData"
        :fields="tableColumns"
      >
        <template v-slot:cell(selected)="row">
          <b-button>123</b-button>
        </template>
      </b-table>
    </div>
  </b-container>
</template>

<script>
import { eventBus, hideMainAll } from './events.js'

export default {
  name: "App",
  data: () => ({
    showMainConnections: false,
    tableData: [
      {
        title: "title01",
        desc: "desc01"
      },
      {
        title: "title02",
        desc: "desc02"
      }
    ],
    tableColumns: [
      { key: "selected", label: "Select", sortable: false },
      { key: "title", label: "Title", sortable: false },
      { key: "desc", label: "Description", sortable: false }
    ]
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

    eventBus.$on('showMainConnections', () => {
      hideMainAll()
      this.refresh();
      this.showMainConnections = true;
      console.log("Event: showMainConnections");
    })    
    eventBus.$on('hideMainConnections', () => {
      this.showMainConnections = false
      console.log("Event: hideMainConnections")
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
