<template>
  <b-container fluid v-if='showMainWelcome'>
    <h1>Welcome</h1>
  </b-container>
</template>

<script>
import { eventBus, hideMainAll } from './events.js'



export default {
  name: 'MainWelcome',
  components: {
    // TableRow
  },
  props: {
    title: {
      default: "MainWelcome",
      type: String
    },
    id: {
      default: "MainWelcome",
      type: String
    }
  },
  data: ()=> { 
    return{
      showMainWelcome: true,
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
      // axios
      // .post(URL_SIOCLIENTS_READ,{})
      // .then(response => {
      //   console.log("SUCCES",response)
      //   this.receivedData = response.data
      // })
      // .catch(error => console.log("ERROR",error))      
      console.log("Event: showMainWelcome")      
    }
  },
  computed:{
    // getjson(){
    //   return{ prefix:this.prefix,region:this.region}
    // },
    // db(){
      
    //   if (this.receivedData.length) {
    //     return this.receivedData
    //   }
    //   else return [this.schema]
    // }
  },
  mounted: async function () {

    eventBus.$on('showMainWelcome', () => {
      hideMainAll()
      this.refresh();
      this.showMainWelcome = true;
      console.log("Event: showMainWelcome");
    })    
    eventBus.$on('hideMainClients', () => {
      this.showMainWelcome = false
      console.log("Event: hideMainWelcome")
    })       

  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
