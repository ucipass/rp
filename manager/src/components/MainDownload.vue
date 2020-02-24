<template>

  <b-container fluid v-if='showMainDownload'>
    <h1>Download</h1>    
    <div class="text-center">
      <b-table
        hover
        striped
        :items="tableData"
        :fields="tableColumns"
      >
        <template v-slot:cell(title)="slot">
          <a :href= [slot.item.download]>{{slot.item.title}}</a>
        </template>
      </b-table>
    </div>
  </b-container>
</template>

<script>
import { eventBus, hideMainAll } from './events.js'
import { URL_DOWNLOAD } from './constants.js'

export default {
  name: "App",
  data: () => ({
    showMainDownload: false,
    tableData: [
      {
        title: "Win64 Binary",
        download: "https://github.com/ucipass/rp/raw/master/download/client_win.exe",
        desc: "Windows 64 Binary"
      },
      {
        title: "Win64 Base64",
        download: "https://github.com/ucipass/rp/raw/master/download/client_win.b64",
        desc: "Windows 64 Binary - Base64 encoded"
      },
      {
        title: "Linux Binary",
        download: "https://github.com/ucipass/rp/raw/master/download/client_lin",
        desc: "Linux 64 Binary"
      },
      {
        title: "Linux Base64",
        download: "https://github.com/ucipass/rp/raw/master/download/client_lin.b64",
        desc: "Linux 64 Binary - Base64 encoded"
      },
    ],
    tableColumns: [
      { key: "title", label: "Title", sortable: false },
      // { key: "download", label: "Download Link", sortable: false },
      { key: "desc", label: "Description", sortable: false }
    ]
  }),
  mounted: async function () {
    eventBus.$on('showMainDownload', () => {
      hideMainAll()
      this.refresh();
      this.showMainDownload = true;
      console.log("Event: showMainDownload");
    })    
    eventBus.$on('hideMainDownload', () => {
      this.showMainDownload = false
      console.log("Event: hideMainDownload")
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
