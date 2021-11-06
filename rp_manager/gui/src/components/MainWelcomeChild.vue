<template>
  <b-container fluid v-if='showMainWelcomeChild'>
    <h1>Welcome Child</h1>
      <p><slot name='step-1' :childvar="childvar"></slot></p>
      <p><slot name='step-2' :childvar="childvar"></slot></p>
      <p><slot name='link2'></slot></p>
      <p><slot></slot></p>
  </b-container>
</template>

<script>

export default {
  name: 'MainWelcomeChild',
  components: {

  },
  props: {
    title: {
      default: "MainWelcomeChild",
      type: String
    },
    id: {
      default: "MainWelcomeChild",
      type: String
    }
  },
  data: ()=> { 
    return{
      childvar: "child123",
      showMainWelcomeChild: false,
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
      console.log("Event: showMainWelcomeChild")      
    }
  },
  computed:{

  },
  mounted: async function () {    

  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
